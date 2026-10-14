import { action, makeObservable, observable } from "mobx";
import type { SectorFilter, StatusFilter } from "@/pages/Search/SearchSession";

export type Filters = { statusFilter: StatusFilter; sectorFilter: SectorFilter };

type Ports = {
	/** The filters the search has applied now. */
	applied: () => Filters;
	apply: (filters: Filters) => void;
	/** How many companies the search finds under these filters, or null when there is nothing to count. */
	count: (filters: Filters, signal: AbortSignal) => Promise<number> | null;
};

/**
 * The Filters panel's choices: a copy of the search's filters, taken on opening, that only reaches
 * the search when applied. Closing any other way drops it.
 */
export class FiltersDraft {
	@observable accessor isOpen = false;
	@observable accessor statusFilter: StatusFilter = "all";
	@observable accessor sectorFilter: SectorFilter = "all";
	/** How many companies the choices would show, or null while unknown. */
	@observable accessor total: number | null = null;

	private readonly ports: Ports;
	private controller: AbortController | null = null;

	constructor(ports: Ports) {
		this.ports = ports;
		makeObservable(this);
	}

	@action
	open = () => {
		const applied = this.ports.applied();
		this.statusFilter = applied.statusFilter;
		this.sectorFilter = applied.sectorFilter;
		this.isOpen = true;
		this.recount();
	};

	@action
	chooseStatus = (statusFilter: StatusFilter) => {
		if (statusFilter === this.statusFilter) return;
		this.statusFilter = statusFilter;
		this.recount();
	};

	@action
	chooseSector = (sectorFilter: SectorFilter) => {
		if (sectorFilter === this.sectorFilter) return;
		this.sectorFilter = sectorFilter;
		this.recount();
	};

	@action
	close = () => {
		this.abort();
		this.isOpen = false;
	};

	@action
	reset = () => {
		this.statusFilter = "all";
		this.sectorFilter = "all";
		this.recount();
	};

	@action
	apply = () => {
		this.ports.apply({ statusFilter: this.statusFilter, sectorFilter: this.sectorFilter });
		this.close();
	};

	get showText(): string {
		const total = this.total;
		if (total === null) return "Show results";
		return `Show ${total} ${total === 1 ? "company" : "companies"}`;
	}

	private recount() {
		this.abort();
		this.total = null;

		const controller = new AbortController();
		const counting = this.ports.count({ statusFilter: this.statusFilter, sectorFilter: this.sectorFilter }, controller.signal);
		if (counting === null) return;

		this.controller = controller;
		counting.then(
			action((total: number) => {
				if (this.controller === controller) this.total = total;
			}),
			// Without a count the button still applies the choices; it just cannot say how many.
			() => {}
		);
	}

	private abort() {
		this.controller?.abort();
		this.controller = null;
	}
}
