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
	/** Paused while the user is over their plan's limit: not checked, and no alerts. */
	paused: boolean;
	latestChange: Change | null;
};

export type PlanName = "free" | "basic" | "starter" | "pro";

/** A user's tracking as the backend sends it: what their plan allows, how much is used, and their organisations. */
export type TrackingContents = {
	plan: PlanName;
	slots: number;
	slotsUsed: number;
	swapsAMonth: number;
	swapsLeft: number;
	/** The user came down to Free and keeps no organisation yet. */
	freeChoiceOpen: boolean;
	organisations: TrackedOrganisation[];
	/** Organisations the user untracked whose slots are still theirs, the next to be swapped first. */
	untracked: Key[];
};

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

export type Key = { organisationTypeCode: string; registrationNo: string };

/** The backend's tracking routes, called as the signed-in user. They reject on failure. */
export interface TrackingPort {
	load(): Promise<TrackingContents>;
	track(key: Key): Promise<void>;
	untrack(key: Key): Promise<void>;
	/** Makes a paused organisation active; at a paid plan's limit, in place of an active one. */
	activate(key: Key, inPlaceOf?: Key): Promise<void>;
	/** Rejects for an organisation the user does not track. */
	details(key: Key): Promise<TrackedDetails>;
}

export type TrackingStatus = "idle" | "loading" | "loaded" | "error";

/**
 * Whether an organisation is tracked, can be tracked in a slot never used, can be as a swap, or
 * cannot: because the month's swaps are spent, or the plan has no slot for it.
 */
export type Availability = "tracked" | "available" | "swap" | "no-swap" | "no-slot" | "unknown";

/**
 * How a paused organisation can become active again: as the one kept on Free, straight away where
 * the plan has room, in place of an active one, or only by upgrading.
 */
export type ResumeOption = "keep-on-free" | "room" | "in-place-of" | "upgrade";

export type DetailsView =
	| { status: "not-tracked" }
	| { status: "loading" }
	| { status: "loaded"; details: TrackedDetails }
	| { status: "error" };

export type Failure = { ok: false; message: string };
export type Done = { ok: true } | Failure;

export const SLOT_USED = "Your one free tracked organisation is already used.";
const FREE_WARNING = "This is your one free tracked organisation and can't be changed.";
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
 * sets how many slots there are and how many swaps a month; Free has one slot, used for good by
 * the first organisation tracked, and no swaps. Basic has no swaps either, so each of its slots is
 * used for good too. With no swaps a tracked organisation cannot be untracked. Organisations over
 * a plan's limit are paused.
 * Every write goes to the backend first and changes the state only when it succeeded.
 *
 * A first check takes about a minute, so while a page is watching and an organisation is waiting
 * for its first check the tracking looks again every few seconds.
 */
export class Tracking {
	@observable.ref accessor status: TrackingStatus = "idle";
	@observable.ref accessor slots = 0;
	@observable.ref accessor slotsUsed = 0;
	@observable.ref accessor plan: PlanName = "free";
	@observable.ref accessor swapsAMonth = 0;
	@observable.ref accessor swapsLeft = 0;
	@observable.ref accessor freeChoiceOpen = false;
	@observable.ref accessor organisations: TrackedOrganisation[] = [];
	@observable.ref private accessor untracked: Key[] = [];
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

	/** "4 of 5 swaps left this month", or null on a plan with no swaps. */
	get swapsText(): string | null {
		return this.swapsAMonth > 0 ? `${this.swapsLeft} of ${this.swapsAMonth} swaps left this month` : null;
	}

	get activeOrganisations() {
		return this.organisations.filter((o) => !o.paused);
	}

	get pausedOrganisations() {
		return this.organisations.filter((o) => o.paused);
	}

	/** What the user has to agree to before tracking this organisation, or null when there is nothing to warn about. */
	trackWarning = (organisation: OrganisationKey): string | null => {
		const availability = this.availability(organisation);
		if (availability === "swap")
			return this.swapsLeft === 1
				? "This uses your last swap this month."
				: `This uses 1 of your ${this.swapsLeft} swaps left this month.`;
		if (availability !== "available") return null;
		if (this.plan === "free") return FREE_WARNING;
		if (this.swapsAMonth > 0) return null;

		const unused = this.slots - this.slotsUsed;
		return unused === 1
			? "This uses your last unused slot for good: your plan has no swaps."
			: `This uses 1 of your ${unused} unused slots for good: your plan has no swaps.`;
	};

	/** Why a tracked organisation cannot be untracked; null when it can. With no swaps it is permanent. */
	get untrackRefusal(): string | null {
		if (this.swapsAMonth > 0) return null;
		return this.plan === "free"
			? "Your one free tracked organisation can't be changed. Upgrade to swap."
			: "Your plan has no swaps, so a tracked organisation can't be changed. Upgrade to swap.";
	}

	/** What the user has to agree to before untracking. */
	get untrackWarning(): string {
		return "Its slot stays used: tracking this organisation again, or another in its slot, uses a swap.";
	}

	/** Why this organisation, or with none any other, cannot be tracked now; null when it can. */
	refusal = (organisation?: OrganisationKey | null): string | null => {
		const availability = organisation ? this.availability(organisation) : this.availabilityOf(null);
		if (availability === "no-swap") return "You have no swaps left this month.";
		if (availability !== "no-slot") return null;

		if (this.plan === "free")
			return this.organisations.length > 0 ? "Free keeps one tracked organisation. Upgrade to track more." : SLOT_USED;
		if (this.pausedOrganisations.length > 0)
			return this.swapsAMonth > 0
				? `You are over your plan's ${this.slots} slots. Upgrade, or stop tracking an organisation, to make room.`
				: `You are over your plan's ${this.slots} slots. Upgrade to track more.`;
		if (this.swapsAMonth > 0) return `All ${this.slots} slots of your plan are in use.`;
		// With no swaps a slot never used is the only way in, and an untracked organisation has none.
		return this.slotsUsed < this.slots
			? "Your plan has no swaps, so an organisation you stopped tracking can't be tracked again. Upgrade to swap."
			: `All ${this.slots} slots of your plan are used, and it has no swaps. Upgrade to track more.`;
	};

	/** Loads the tracked organisations of the user who signed in; clears them when nobody is. */
	@action
	followUser = (userId: string | null) => {
		if (userId === this.userId) return;
		this.userId = userId;
		this.slots = 0;
		this.slotsUsed = 0;
		this.plan = "free";
		this.swapsAMonth = 0;
		this.swapsLeft = 0;
		this.freeChoiceOpen = false;
		this.organisations = [];
		this.untracked = [];
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
		return this.availabilityOf(id);
	};

	/** For an organisation not tracked now; null stands for any the user never tracked. */
	private availabilityOf(id: string | null): Availability {
		if (this.plan === "free") {
			// Free's one organisation is permanent: a used slot is only tracked into by a user who
			// came down to Free tracking nothing, once.
			const canChoose = this.freeChoiceOpen && this.organisations.length === 0;
			return this.slotsUsed < this.slots || canChoose ? "available" : "no-slot";
		}

		// Over the plan's limit nothing more is tracked.
		if (this.pausedOrganisations.length > 0) return "no-slot";

		const untrackedBefore = id !== null && this.untracked.some((key) => idOf(key) === id);
		if (!untrackedBefore && this.slotsUsed < this.slots) return "available";
		if (this.untracked.length === 0 || this.swapsAMonth === 0) return "no-slot";
		return this.swapsLeft > 0 ? "swap" : "no-swap";
	}

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
		const refusal = this.refusal(key);
		if (refusal) return { ok: false, message: refusal };

		const id = idOf(key);
		return this.write(key, () => this.port.track(key), () => {
			this.organisations = [
				...this.organisations,
				{
					...key,
					organisationName: organisation.organisationName ?? null,
					organisationType: organisation.organisationType ?? null,
					startedAt: new Date().toISOString(),
					paused: false,
					// The backend starts the first check; until it is seen done there is nothing to show.
					firstCheckInProgress: true,
					lastCheckedAt: null,
					checksFailing: false,
					latestChange: null,
				},
			];
			if (availability === "swap") {
				// Its own slot when it was untracked before; otherwise the next to be swapped.
				const own = this.untracked.findIndex((untracked) => idOf(untracked) === id);
				this.untracked = this.untracked.filter((_, index) => index !== Math.max(own, 0));
				this.swapsLeft -= 1;
			} else if (this.slotsUsed < this.slots) {
				this.slotsUsed += 1;
			} else {
				// On Free, in a used slot: the one organisation to keep is now chosen.
				this.untracked = this.untracked.slice(1);
			}
			if (this.plan === "free") this.freeChoiceOpen = false;
			this.showOpened();
			this.poll();
		});
	};

	/** The slot stays used. Refused on a plan with no swaps. */
	untrack = async (organisation: OrganisationKey): Promise<Done> => {
		const key = keyOf(organisation);
		if (!this.userId) return { ok: false, message: NOT_SIGNED_IN };
		if (!key) return { ok: false, message: "This organisation is not tracked." };
		if (this.untrackRefusal) return { ok: false, message: this.untrackRefusal };

		const id = idOf(key);
		return this.write(key, () => this.port.untrack(key), () => {
			this.organisations = this.organisations.filter((o) => idOf(o) !== id);
			this.untracked = [...this.untracked, key];
			this.resumeIntoRoom();
			this.showOpened();
		});
	};

	/** How this organisation can be made active again; null when it is not paused. */
	resumeOption = (organisation: OrganisationKey): ResumeOption | null => {
		const id = idOf(organisation);
		if (id === null || !this.pausedOrganisations.some((o) => idOf(o) === id)) return null;

		if (this.plan === "free") return this.freeChoiceOpen ? "keep-on-free" : "upgrade";
		return this.activeOrganisations.length < this.slots ? "room" : "in-place-of";
	};

	/**
	 * Makes a paused organisation active: on Free the one to keep, chosen once; on a paid plan at
	 * its limit, in place of the active one given, which is paused instead.
	 */
	activate = async (organisation: OrganisationKey, inPlaceOf?: OrganisationKey): Promise<Done> => {
		const key = keyOf(organisation);
		const other = inPlaceOf ? keyOf(inPlaceOf) : null;
		if (!this.userId) return { ok: false, message: NOT_SIGNED_IN };

		const option = key ? this.resumeOption(key) : null;
		if (!key || option === null) return { ok: false, message: "This organisation is not paused." };
		if (option === "upgrade") return { ok: false, message: "Upgrade your plan to resume this organisation." };

		const swapped = option === "in-place-of" ? other : null;
		if (option === "in-place-of" && !this.activeOrganisations.some((o) => idOf(o) === idOf(swapped ?? {})))
			return { ok: false, message: "Choose an active organisation to pause in its place." };

		return this.write(key, () => this.port.activate(key, swapped ?? undefined), () => {
			const paused = new Map([[idOf(key), false]]);
			if (swapped) paused.set(idOf(swapped), true);
			this.organisations = this.organisations.map((o) =>
				paused.has(idOf(o)) ? { ...o, paused: paused.get(idOf(o))! } : o
			);
			if (this.plan === "free") this.freeChoiceOpen = false;
		});
	};

	/**
	 * A plan is on its way: the payment provider tells the backend a little after the user is back.
	 * Looks again until the plan is no longer the one it is now.
	 */
	expectPlanChange = async () => {
		const userId = this.userId;
		const before = this.plan;

		for (let looks = 0; looks < this.maximumPolls; looks++) {
			await this.wait(this.pollMilliseconds);
			if (this.userId !== userId || this.plan !== before) return;
			await this.lookAgain();
			if (this.plan !== before) return;
		}
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
		this.plan = contents.plan;
		this.swapsAMonth = contents.swapsAMonth;
		this.swapsLeft = contents.swapsLeft;
		this.freeChoiceOpen = contents.freeChoiceOpen;
		this.organisations = contents.organisations;
		this.untracked = contents.untracked;
	}

	/** As the backend does on a paid plan: room left by an untracked organisation goes to the oldest paused. */
	@action
	private resumeIntoRoom() {
		if (this.plan === "free" || this.activeOrganisations.length >= this.slots) return;

		const oldest = [...this.pausedOrganisations].sort((a, b) => a.startedAt.localeCompare(b.startedAt))[0];
		if (!oldest) return;
		this.organisations = this.organisations.map((o) => (o === oldest ? { ...o, paused: false } : o));
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
