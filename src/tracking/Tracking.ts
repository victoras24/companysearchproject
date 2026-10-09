import { action, makeObservable, observable } from "mobx";
import moment from "moment";

export type ChangeKind = "filing" | "pending_service" | "status" | "official" | "address" | "name";

/** One detected difference in an organisation, in words. */
export type Change = { kind: ChangeKind; detail: string; detectedAt: string };

/** What the checker has made of an organisation so far. */
type CheckState = {
	/** True until the first check has succeeded; there is nothing to show before it. */
	firstCheckInProgress: boolean;
	lastCheckedAt: string | null;
	/** True once several checks in a row have failed. */
	checksFailing: boolean;
};

/** A tracked organisation as the backend lists it. */
export type TrackedOrganisation = CheckState & {
	organisationTypeCode: string;
	registrationNo: string;
	organisationName: string | null;
	organisationType: string | null;
	startedAt: string;
	latestChange: Change | null;
};

export type TrackingContents = { slots: number; slotsUsed: number; organisations: TrackedOrganisation[] };

export type PendingService = { service: string; applicationDate: string | null; applicationNumber: string };

/** A filing's date is the date the form is made up to, not the day it was submitted. */
export type Filing = { service: string; applicationNumber: string; form: string; date: string | null };

/** Everything the checker has for a tracked organisation. Changes come newest first. */
export type TrackedDetails = CheckState & {
	organisationTypeCode: string;
	registrationNo: string;
	startedAt: string;
	fileLastUpdated: string | null;
	pendingServices: PendingService[];
	filings: Filing[];
	changes: Change[];
};

/** What identifies an organisation: its type code together with its registration number. */
export type OrganisationKey = {
	organisationTypeCode?: string | null;
	registrationNo?: string | null;
};

export type TrackableOrganisation = OrganisationKey & {
	organisationName?: string | null;
	organisationType?: string | null;
};

type Key = { organisationTypeCode: string; registrationNo: string };

/** The backend's tracking routes, called as the signed-in user. They reject on failure. */
export interface TrackingPort {
	load(): Promise<TrackingContents>;
	track(key: Key): Promise<void>;
	untrack(key: Key): Promise<void>;
	/** Rejects for an organisation the user does not track. */
	details(key: Key): Promise<TrackedDetails>;
}

export type TrackingStatus = "idle" | "loading" | "loaded" | "error";

/** Whether an organisation is tracked, can be, or cannot because the plan has no slot left. */
export type Availability = "tracked" | "available" | "no-slot" | "unknown";

export type DetailsView =
	| { status: "not-tracked" }
	| { status: "loading" }
	| { status: "loaded"; details: TrackedDetails }
	| { status: "error" };

export type Failure = { ok: false; message: string };
export type Done = { ok: true } | Failure;

export const SLOT_USED = "Your one free tracked organisation is already used.";
const NOT_SIGNED_IN = "Please log in to track an organisation.";
const NOT_TRACKED: DetailsView = { status: "not-tracked" };

type Options = {
	/** Resolves when it is time to look again for a first check. */
	wait?: (milliseconds: number) => Promise<void>;
	pollMilliseconds?: number;
	maximumPolls?: number;
};

/**
 * The signed-in user's tracked organisations, held in memory and loaded from the backend. A plan
 * sets how many slots there are; Free has one, used for good by the first organisation tracked.
 * Every write goes to the backend first and changes the state only when it succeeded.
 *
 * A first check takes about a minute, so while a page is watching and an organisation is waiting
 * for its first check the tracking looks again every few seconds.
 */
export class Tracking {
	@observable.ref accessor status: TrackingStatus = "idle";
	@observable.ref accessor slots = 0;
	@observable.ref accessor slotsUsed = 0;
	@observable.ref accessor organisations: TrackedOrganisation[] = [];
	/** What the checker has for the organisation a page has opened. */
	@observable.ref accessor details: DetailsView = NOT_TRACKED;
	@observable.ref private accessor busy: ReadonlySet<string> = new Set();

	private readonly port: TrackingPort;
	private readonly wait: (milliseconds: number) => Promise<void>;
	private readonly pollMilliseconds: number;
	private readonly maximumPolls: number;
	private userId: string | null = null;
	private opened: Key | null = null;
	private watchers = 0;
	private polling = false;

	constructor(port: TrackingPort, options: Options = {}) {
		this.port = port;
		this.wait = options.wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
		this.pollMilliseconds = options.pollMilliseconds ?? 5000;
		this.maximumPolls = options.maximumPolls ?? 60;
		makeObservable(this);
	}

	/** "1 of 1": the slots used, of those the plan has. */
	get slotsText() {
		return `${this.slotsUsed} of ${this.slots}`;
	}

	/** What the user has to agree to before tracking, or null when there is nothing to warn about. */
	get trackWarning(): string | null {
		return this.slots === 1 ? "This is your one free tracked organisation and can't be changed." : null;
	}

	/** What the user has to agree to before untracking, or null. */
	get untrackWarning(): string | null {
		return this.slots === 1
			? "Your one free tracked organisation stays used: you won't be able to track it again or track another."
			: null;
	}

	/** Loads the tracked organisations of the user who signed in; clears them when nobody is. */
	@action
	followUser = (userId: string | null) => {
		if (userId === this.userId) return;
		this.userId = userId;
		this.slots = 0;
		this.slotsUsed = 0;
		this.organisations = [];
		this.details = NOT_TRACKED;
		this.busy = new Set();
		this.status = "idle";
		if (userId) this.reload();
	};

	@action
	reload = () => {
		const userId = this.userId;
		if (!userId) return;
		this.status = "loading";

		this.port.load().then(
			action((contents: TrackingContents) => {
				if (this.userId !== userId) return;
				this.apply(contents);
				this.status = "loaded";
				this.showOpened();
				this.poll();
			}),
			action(() => {
				if (this.userId !== userId) return;
				this.status = "error";
			})
		);
	};

	availability = (organisation: OrganisationKey): Availability => {
		const id = idOf(organisation);
		if (this.status !== "loaded" || id === null) return "unknown";
		if (this.organisations.some((o) => idOf(o) === id)) return "tracked";
		return this.slotsUsed < this.slots ? "available" : "no-slot";
	};

	isTracked = (organisation: OrganisationKey): boolean => this.availability(organisation) === "tracked";

	/** True while a write for this organisation is on its way. */
	isBusy = (organisation: OrganisationKey): boolean => {
		const id = idOf(organisation);
		return id !== null && this.busy.has(id);
	};

	track = async (organisation: TrackableOrganisation): Promise<Done> => {
		const key = keyOf(organisation);
		if (!this.userId) return { ok: false, message: NOT_SIGNED_IN };
		if (!key) return { ok: false, message: "This organisation cannot be tracked." };

		const availability = this.availability(key);
		if (availability === "tracked") return { ok: true };
		if (availability === "no-slot") return { ok: false, message: SLOT_USED };

		return this.write(key, () => this.port.track(key), () => {
			this.organisations = [
				...this.organisations,
				{
					...key,
					organisationName: organisation.organisationName ?? null,
					organisationType: organisation.organisationType ?? null,
					startedAt: new Date().toISOString(),
					// The backend starts the first check; until it is seen done there is nothing to show.
					firstCheckInProgress: true,
					lastCheckedAt: null,
					checksFailing: false,
					latestChange: null,
				},
			];
			this.slotsUsed += 1;
			this.showOpened();
			this.poll();
		});
	};

	/** The slot stays used. */
	untrack = async (organisation: OrganisationKey): Promise<Done> => {
		const key = keyOf(organisation);
		if (!this.userId) return { ok: false, message: NOT_SIGNED_IN };
		if (!key) return { ok: false, message: "This organisation is not tracked." };

		const id = idOf(key);
		return this.write(key, () => this.port.untrack(key), () => {
			this.organisations = this.organisations.filter((o) => idOf(o) !== id);
			this.showOpened();
		});
	};

	/** A page is showing this organisation: its details load, if the user tracks it. */
	@action
	open = (organisation: OrganisationKey) => {
		this.opened = keyOf(organisation);
		this.details = NOT_TRACKED;
		this.showOpened();
	};

	@action
	close = () => {
		this.opened = null;
		this.details = NOT_TRACKED;
	};

	/** A page is showing first checks as they finish. Call what it returns when the page is left. */
	watch = (): (() => void) => {
		this.watchers += 1;
		this.poll();

		let stopped = false;
		return () => {
			if (stopped) return;
			stopped = true;
			this.watchers -= 1;
		};
	};

	@action
	private apply(contents: TrackingContents) {
		this.slots = contents.slots;
		this.slotsUsed = contents.slotsUsed;
		this.organisations = contents.organisations;
	}

	/** Brings the opened organisation's details in line with whether it is tracked. */
	@action
	private showOpened() {
		const opened = this.opened;
		if (!opened || !this.isTracked(opened)) {
			this.details = NOT_TRACKED;
			return;
		}
		if (this.details.status === "loaded" || this.details.status === "loading") return;

		this.details = { status: "loading" };
		this.loadDetails(opened, true);
	}

	private async loadDetails(key: Key, sayWhenFailed: boolean) {
		const userId = this.userId;
		const current = () => this.userId === userId && this.opened !== null && idOf(this.opened) === idOf(key);

		try {
			const details = await this.port.details(key);
			if (current() && this.isTracked(key)) action(() => (this.details = { status: "loaded", details }))();
		} catch {
			if (current() && sayWhenFailed) action(() => (this.details = { status: "error" }))();
		}
	}

	private async poll() {
		if (this.polling) return;
		this.polling = true;

		try {
			let polls = 0;
			const waiting = () => this.watchers > 0 && this.organisations.some((o) => o.firstCheckInProgress);

			while (waiting() && polls++ < this.maximumPolls) {
				await this.wait(this.pollMilliseconds);
				if (!waiting()) break;
				await this.lookAgain();
			}
		} finally {
			this.polling = false;
		}
	}

	/** Reloads without showing it: a failure leaves what there is. */
	private async lookAgain() {
		const userId = this.userId;
		if (!userId) return;

		try {
			const contents = await this.port.load();
			if (this.userId !== userId) return;
			this.apply(contents);
		} catch {
			return;
		}

		if (this.opened && this.isTracked(this.opened)) await this.loadDetails(this.opened, false);
	}

	/** Sends a write, marks the organisation busy meanwhile, and applies its change only if it succeeded. */
	private async write(key: Key, send: () => Promise<void>, apply: () => void): Promise<Done> {
		const userId = this.userId;
		const id = idOf(key)!;

		this.setBusy(id, true);
		try {
			await send();
			if (this.userId === userId) action(apply)();
			return { ok: true };
		} catch (error) {
			return {
				ok: false,
				message: error instanceof Error && error.message ? error.message : "Something went wrong.",
			};
		} finally {
			this.setBusy(id, false);
		}
	}

	@action
	private setBusy(id: string, busy: boolean) {
		const next = new Set(this.busy);
		if (busy) next.add(id);
		else next.delete(id);
		this.busy = next;
	}
}

/** What to say about an organisation's checks, or null while they are going well. */
export function checkLine(check: CheckState): string | null {
	if (check.checksFailing) {
		const last = dayText(check.lastCheckedAt);
		return last ? `Last checked on ${last}` : "Not checked yet: the registry could not be read";
	}
	return check.firstCheckInProgress ? "First check in progress" : null;
}

/** "December 16, 2023", for one of the registry's dates or a moment in time; null for neither. */
export function dayText(raw: string | null | undefined): string | null {
	const date = raw ? moment(raw, moment.ISO_8601, true) : null;
	return date?.isValid() ? date.format("MMMM D, YYYY") : null;
}

function keyOf(organisation: OrganisationKey): Key | null {
	const organisationTypeCode = organisation.organisationTypeCode?.trim().toUpperCase();
	const registrationNo = organisation.registrationNo?.trim();
	return organisationTypeCode && registrationNo ? { organisationTypeCode, registrationNo } : null;
}

function idOf(organisation: OrganisationKey): string | null {
	const key = keyOf(organisation);
	return key ? `${key.organisationTypeCode}/${key.registrationNo}` : null;
}
