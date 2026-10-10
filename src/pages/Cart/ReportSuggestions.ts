import { action, makeObservable, observable } from "mobx";
import type { ICompany } from "@/gEntities";

export const SUGGESTION_DEBOUNCE_MS = 233;
const MIN_QUERY_LENGTH = 3;
const MOST = 3;

/** Finds organisations by name or registration number. It rejects on failure. */
export type SuggestFn = (request: { query: string; signal: AbortSignal }) => Promise<ICompany[]>;

/**
 * The organisations the cart offers to add while a buyer types a name or registration number:
 * the first few matches that are not in the cart already. Only the latest search can answer.
 */
export class ReportSuggestions {
	@observable accessor text = "";
	@observable.ref accessor items: ICompany[] = [];
	@observable accessor searching = false;

	private readonly ports: { suggest: SuggestFn; inCart: (company: ICompany) => boolean };
	private timer: ReturnType<typeof setTimeout> | undefined;
	private controller: AbortController | null = null;

	constructor(ports: { suggest: SuggestFn; inCart: (company: ICompany) => boolean }) {
		this.ports = ports;
		makeObservable(this);
	}

	@action
	type = (text: string) => {
		this.stop();
		this.text = text;

		const query = text.trim();
		if (query.length < MIN_QUERY_LENGTH) {
			this.items = [];
			this.searching = false;
			return;
		}
		this.searching = true;
		this.timer = setTimeout(() => this.search(query), SUGGESTION_DEBOUNCE_MS);
	};

	@action
	clear = () => {
		this.stop();
		this.text = "";
		this.items = [];
		this.searching = false;
	};

	dispose = () => this.stop();

	private search(query: string) {
		const controller = new AbortController();
		this.controller = controller;

		this.ports.suggest({ query, signal: controller.signal }).then(
			action((found: ICompany[]) => {
				if (this.controller !== controller) return;
				this.controller = null;
				this.items = found
					.filter((company) => company.organisationTypeCode && !this.ports.inCart(company))
					.slice(0, MOST);
				this.searching = false;
			}),
			action(() => {
				if (this.controller !== controller) return;
				this.controller = null;
				this.items = [];
				this.searching = false;
			})
		);
	}

	private stop() {
		clearTimeout(this.timer);
		this.controller?.abort();
		this.controller = null;
	}
}
