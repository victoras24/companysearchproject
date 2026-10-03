import { action, makeObservable, observable } from "mobx";
import type { IOfficials } from "@/gEntities";
import type { OrganisationSummary, RegisteredAddress } from "@/organisation/organisation";

export type OrganisationRecord = {
	organisation: OrganisationSummary;
	address: RegisteredAddress | null;
	officials: IOfficials[];
};

/** Resolves null when no organisation has that type and number; rejects on any other failure. */
export type LookupFn = (request: {
	typeCode: string;
	registrationNo: string;
	signal: AbortSignal;
}) => Promise<OrganisationRecord | null>;

export type RecordView =
	| { status: "loading" }
	| { status: "not-found"; typeCode: string; registrationNo: string }
	| { status: "error" }
	| { status: "loaded"; record: OrganisationRecord };

const TYPE_CODE = /^[A-Za-z]$/;

/**
 * Loads the organisation record the details page shows, from the type code and registration
 * number in its URL. Only the latest load can change the view.
 */
export class OrganisationRecordLoader {
	@observable.ref private accessor current: RecordView = { status: "loading" };

	private readonly ports: { lookup: LookupFn };
	private target: { typeCode: string; registrationNo: string } | null = null;
	private controller: AbortController | null = null;

	constructor(ports: { lookup: LookupFn }) {
		this.ports = ports;
		makeObservable(this);
	}

	get view(): RecordView {
		return this.current;
	}

	@action
	load = (typeCode: string, registrationNo: string) => {
		this.abort();
		const code = typeCode.trim();
		const number = registrationNo.trim();
		if (!TYPE_CODE.test(code) || !number) {
			this.target = null;
			this.current = { status: "not-found", typeCode, registrationNo };
			return;
		}
		this.target = { typeCode: code.toUpperCase(), registrationNo: number };
		this.run();
	};

	@action
	retry = () => {
		if (this.target) this.run();
	};

	@action
	dispose = () => {
		this.abort();
	};

	private run() {
		this.abort();
		const target = this.target!;
		const controller = new AbortController();
		this.controller = controller;
		this.current = { status: "loading" };

		this.ports.lookup({ ...target, signal: controller.signal }).then(
			action((record: OrganisationRecord | null) => {
				if (this.controller !== controller) return;
				this.controller = null;
				this.current = record
					? { status: "loaded", record }
					: { status: "not-found", ...target };
			}),
			action(() => {
				// A superseded or aborted request is never an error.
				if (this.controller !== controller) return;
				this.controller = null;
				this.current = { status: "error" };
			})
		);
	}

	private abort() {
		this.controller?.abort();
		this.controller = null;
	}
}
