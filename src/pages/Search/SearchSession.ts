import { action, computed, makeObservable, observable } from "mobx";
import type { ICompany, IOfficials } from "@/gEntities";
import { STATUS_GROUPS, type StatusGroup } from "@/organisation/organisation";

export type EntityType = "organisation" | "official";
// Every status group but unknown, whose organisations appear only under "all".
export const STATUS_FILTERS = STATUS_GROUPS.filter(
	(group): group is Exclude<StatusGroup, "unknown"> => group !== "unknown"
);
export type StatusFilter = "all" | (typeof STATUS_FILTERS)[number];

export const PAGE_SIZE = 10;
export const DEBOUNCE_MS = 233;
export const MIN_QUERY_LENGTH = 3;
// The officials endpoint returns at most this many rows and no total.
export const OFFICIAL_RESULT_CAP = 5;

export type SearchFn = (request: {
	entityType: EntityType;
	query: string;
	statusFilter: StatusFilter;
	page: number;
	pageSize: number;
	signal: AbortSignal;
}) => Promise<{ items: ICompany[] | IOfficials[]; total: number }>;

export type NavigateFn = (search: string, opts: { replace: boolean }) => void;

export type Pager = {
	previous: string | null;
	next: string | null;
	pages: Array<{ number: number; href: string; current: boolean } | "gap">;
};

export type SearchView =
	| { status: "idle" }
	| { status: "too-short" }
	| { status: "loading" }
	| { status: "empty"; query: string }
	| { status: "error" }
	| {
			status: "results";
			entityType: "organisation";
			items: ICompany[];
			pager: Pager | null;
	  }
	| {
			status: "results";
			entityType: "official";
			items: IOfficials[];
			truncated: boolean;
			pager: null;
	  };

// The part of a search session that the URL holds.
type Criteria = {
	query: string;
	entityType: EntityType;
	statusFilter: StatusFilter;
	page: number;
};

type Outcome =
	| { kind: "none" }
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "loaded"; items: ICompany[] | IOfficials[]; total: number };

const DEFAULTS: Criteria = {
	query: "",
	entityType: "organisation",
	statusFilter: "all",
	page: 1,
};

const parse = (search: string): Criteria => {
	const params = new URLSearchParams(search);
	const entityType: EntityType =
		params.get("type") === "official" ? "official" : "organisation";
	if (entityType === "official") {
		// Officials have no status and their results are not paged.
		return { ...DEFAULTS, query: (params.get("q") ?? "").trim(), entityType };
	}

	const status = params.get("status");
	const page = Number(params.get("page"));
	return {
		query: (params.get("q") ?? "").trim(),
		entityType,
		statusFilter: statusFilterOf(status),
		page: Number.isInteger(page) && page >= 1 ? page : 1,
	};
};

const statusFilterOf = (status: string | null): StatusFilter => {
	// Links from before status groups: "active" meant registered; "inactive" has no one group.
	if (status === "active") return "registered";
	return STATUS_FILTERS.find((filter) => filter === status) ?? "all";
};

const serialize = (criteria: Criteria): string => {
	const params = new URLSearchParams();
	if (criteria.query) params.set("q", criteria.query);
	if (criteria.entityType !== DEFAULTS.entityType)
		params.set("type", criteria.entityType);
	if (criteria.statusFilter !== DEFAULTS.statusFilter)
		params.set("status", criteria.statusFilter);
	if (criteria.page !== DEFAULTS.page)
		params.set("page", String(criteria.page));

	const search = params.toString();
	return search ? `?${search}` : "";
};

const isSearchable = (query: string) => query.length >= MIN_QUERY_LENGTH;

export class SearchSession {
	@observable private accessor draftText: string = "";
	@observable.ref private accessor criteria: Criteria = DEFAULTS;
	@observable.ref private accessor outcome: Outcome = { kind: "none" };

	private readonly ports: { search: SearchFn; navigate: NavigateFn };
	private debounce: ReturnType<typeof setTimeout> | null = null;
	private controller: AbortController | null = null;
	// The URL this session last navigated to and has not yet seen come back.
	private ownNavigation: string | null = null;

	constructor(ports: { search: SearchFn; navigate: NavigateFn }) {
		this.ports = ports;
		makeObservable(this);
	}

	get draft(): string {
		return this.draftText;
	}

	get entityType(): EntityType {
		return this.criteria.entityType;
	}

	get statusFilter(): StatusFilter {
		return this.criteria.statusFilter;
	}

	@computed
	get view(): SearchView {
		const query = this.draftText.trim();
		if (query === "") return { status: "idle" };
		if (!isSearchable(query)) return { status: "too-short" };
		// The draft is ahead of the URL until the debounce settles.
		if (query !== this.criteria.query) return { status: "loading" };

		const outcome = this.outcome;
		if (outcome.kind === "error") return { status: "error" };
		if (outcome.kind !== "loaded") return { status: "loading" };
		if (outcome.items.length === 0) return { status: "empty", query };

		if (this.criteria.entityType === "official") {
			return {
				status: "results",
				entityType: "official",
				items: outcome.items as IOfficials[],
				truncated: outcome.items.length >= OFFICIAL_RESULT_CAP,
				pager: null,
			};
		}

		return {
			status: "results",
			entityType: "organisation",
			items: outcome.items as ICompany[],
			pager: this.pagerFor(outcome.total),
		};
	}

	@action
	urlChanged = (search: string) => {
		const next = parse(search);
		const isOwn = this.ownNavigation === serialize(next);
		this.ownNavigation = null;

		if (!isOwn) {
			// Back, Forward, a link or a reload: the URL wins over the draft.
			this.cancelDebounce();
			if (this.draftText.trim() !== next.query) this.draftText = next.query;
		}

		const unchanged = serialize(this.criteria) === serialize(next);
		this.criteria = next;
		if (unchanged && this.outcome.kind !== "none") return;

		this.run();
	};

	@action
	typeQuery = (text: string) => {
		this.draftText = text;
		this.cancelDebounce();
		if (text.trim() === this.criteria.query) return;

		this.debounce = setTimeout(() => {
			this.debounce = null;
			this.go({ ...this.criteria, query: this.draftText.trim(), page: 1 }, true);
		}, DEBOUNCE_MS);
	};

	@action
	clearQuery = () => {
		this.draftText = "";
		this.cancelDebounce();
		this.go({ ...this.criteria, query: "", page: 1 }, true);
	};

	@action
	selectEntityType = (entityType: EntityType) => {
		if (entityType === this.criteria.entityType) return;
		this.cancelDebounce();
		this.go(
			{ ...DEFAULTS, query: this.draftText.trim(), entityType },
			false
		);
	};

	@action
	selectStatusFilter = (statusFilter: StatusFilter) => {
		this.cancelDebounce();
		this.go(
			{ ...this.criteria, query: this.draftText.trim(), statusFilter, page: 1 },
			false
		);
	};

	@action
	retry = () => {
		this.run();
	};

	@action
	dispose = () => {
		this.cancelDebounce();
		this.abort();
		this.ownNavigation = null;
		// Lets the same URL search again if the session is used after this.
		this.outcome = { kind: "none" };
	};

	private go(criteria: Criteria, replace: boolean) {
		const search = serialize(criteria);
		// Compare with where the session is already heading, if anywhere.
		if (search === (this.ownNavigation ?? serialize(this.criteria))) return;

		this.ownNavigation = search;
		this.ports.navigate(search, { replace });
	}

	private run() {
		this.abort();
		const criteria = this.criteria;
		if (!isSearchable(criteria.query)) {
			this.outcome = { kind: "none" };
			return;
		}

		const controller = new AbortController();
		this.controller = controller;
		this.outcome = { kind: "loading" };

		this.ports
			.search({
				entityType: criteria.entityType,
				query: criteria.query,
				statusFilter: criteria.statusFilter,
				page: criteria.page,
				pageSize: PAGE_SIZE,
				signal: controller.signal,
			})
			.then(
				action((result) => {
					if (this.controller !== controller) return;
					this.controller = null;

					const lastPage = Math.ceil(result.total / PAGE_SIZE);
					if (result.items.length === 0 && lastPage >= 1 && criteria.page > lastPage) {
						this.go({ ...criteria, page: lastPage }, true);
						return;
					}
					this.outcome = { kind: "loaded", ...result };
				}),
				action(() => {
					// A superseded or aborted request is never an error.
					if (this.controller !== controller) return;
					this.controller = null;
					this.outcome = { kind: "error" };
				})
			);
	}

	private pagerFor(total: number): Pager | null {
		const lastPage = Math.ceil(total / PAGE_SIZE);
		if (lastPage <= 1) return null;

		const current = this.criteria.page;
		const hrefFor = (page: number) => serialize({ ...this.criteria, page });
		const shown = [1, current - 1, current, current + 1, lastPage]
			.filter((page) => page >= 1 && page <= lastPage)
			.filter((page, index, all) => all.indexOf(page) === index)
			.sort((a, b) => a - b);

		const pages: Pager["pages"] = [];
		const add = (number: number) =>
			pages.push({ number, href: hrefFor(number), current: number === current });
		shown.forEach((page, index) => {
			const skipped = index === 0 ? 0 : page - shown[index - 1] - 1;
			// A gap that would hide a single page shows that page instead.
			if (skipped === 1) add(page - 1);
			else if (skipped > 1) pages.push("gap");
			add(page);
		});

		return {
			previous: current > 1 ? hrefFor(current - 1) : null,
			next: current < lastPage ? hrefFor(current + 1) : null,
			pages,
		};
	}

	private cancelDebounce() {
		if (this.debounce === null) return;
		clearTimeout(this.debounce);
		this.debounce = null;
	}

	private abort() {
		this.controller?.abort();
		this.controller = null;
	}
}
