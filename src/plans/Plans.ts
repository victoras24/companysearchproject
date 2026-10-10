import { action, makeObservable, observable } from "mobx";
import type { PlanName } from "@/tracking/Tracking";

export type { PlanName };

/** A plan as the backend lists it. The price is a month's, in the currency's main unit; Free has none. */
export type PlanOffer = {
	plan: PlanName;
	slots: number;
	swapsAMonth: number;
	price: { amount: number; currency: string } | null;
};

/** The backend's plan routes. They reject on failure, with what the backend said when it said something. */
export interface PlansPort {
	list(): Promise<PlanOffer[]>;
	/** The payment page for starting a paid plan, for the signed-in user. */
	start(plan: PlanName): Promise<{ url: string }>;
	/**
	 * The payment provider's page where the signed-in user changes or cancels their plan. With a
	 * plan to go to it opens on that one step and sends the user back when it is done: Free is
	 * cancelling.
	 */
	portal(to?: PlanName): Promise<{ url: string }>;
}

export type PlansStatus = "idle" | "loading" | "loaded" | "error";

export type Done = { ok: true } | { ok: false; message: string };

/** What the browser is being sent to the payment provider for. */
export type Pending = PlanName | "portal" | "cancel";

/** What the user has just done at the payment provider, as the address they came back to says. */
export type Arrival = { kind: "started" } | { kind: "changed"; to: PlanName } | { kind: "cancelled" };

const PAID_PLANS: readonly string[] = ["basic", "starter", "pro"];

const FAILED = "Something went wrong. Please try again.";

/**
 * The plans on offer, and the way to the payment provider's pages: its payment page to start a
 * plan, its portal to change or cancel one. The plan a user is on is part of their tracking, and
 * changes when the provider tells the backend, not here.
 */
export class Plans {
	@observable.ref accessor status: PlansStatus = "idle";
	@observable.ref accessor offers: PlanOffer[] = [];
	/** What the browser is being sent away for. It stays set after the redirect: the page is being left. */
	@observable.ref accessor pending: Pending | null = null;

	private readonly port: PlansPort;
	private readonly redirect: (url: string) => void;

	constructor(ports: { port: PlansPort; redirect: (url: string) => void }) {
		this.port = ports.port;
		this.redirect = ports.redirect;
		makeObservable(this);
	}

	/** Asks the backend for the plans, unless it has them or is asking. */
	@action
	load = () => {
		if (this.status === "loading" || this.status === "loaded") return;
		this.status = "loading";

		this.port.list().then(
			action((offers: PlanOffer[]) => {
				this.offers = offers;
				this.status = "loaded";
			}),
			action(() => {
				this.status = "error";
			})
		);
	};

	start = (plan: PlanName): Promise<Done> => this.leaveFor(plan, () => this.port.start(plan));

	/** The whole portal: the card, the invoices and the plan. */
	manage = (): Promise<Done> => this.leaveFor("portal", () => this.port.portal());

	/** The portal on confirming the switch to another paid plan; the user comes back when it is done. */
	switchTo = (plan: PlanName): Promise<Done> => this.leaveFor(plan, () => this.port.portal(plan));

	/** The portal on confirming the cancellation; the user comes back when it is done. */
	cancel = (): Promise<Done> => this.leaveFor("cancel", () => this.port.portal("free"));

	/** For a user who comes back from the provider to a page the browser kept as it was. */
	@action
	reset = () => {
		this.pending = null;
	};

	private async leaveFor(what: Pending, open: () => Promise<{ url: string }>): Promise<Done> {
		if (this.pending !== null) return { ok: false, message: FAILED };
		this.setPending(what);

		try {
			const { url } = await open();
			this.redirect(url);
			return { ok: true };
		} catch (error) {
			this.setPending(null);
			return { ok: false, message: error instanceof Error && error.message ? error.message : FAILED };
		}
	}

	@action
	private setPending(pending: Pending | null) {
		this.pending = pending;
	}
}

export const planLabel = (plan: PlanName): string =>
	({ free: "Free", basic: "Basic", starter: "Starter", pro: "Pro" })[plan];

/** Null for a user who did not just come back from the payment provider. */
export function arrivalOf(search: URLSearchParams): Arrival | null {
	const changed = search.get("changed");
	if (search.get("started") === "1") return { kind: "started" };
	if (changed && PAID_PLANS.includes(changed)) return { kind: "changed", to: changed as PlanName };
	if (search.get("cancelled") === "1") return { kind: "cancelled" };
	return null;
}

/**
 * What to tell a user who has just come back, given the plan they are on (null while it is not
 * known). The provider tells the backend a little after it sends the user back: waiting says the
 * plan they are on is not yet the one to expect. A cancelled plan stays until its period ends, so
 * there is nothing to wait for.
 */
export function arrivalNote(arrival: Arrival | null, current: PlanName | null): { text: string; waiting: boolean } | null {
	if (arrival === null) return null;

	if (arrival.kind === "started")
		return current === null || current === "free"
			? { text: "Thank you. Your plan is being set up, which takes a moment.", waiting: true }
			: { text: `Thank you. You are on ${planLabel(current)}.`, waiting: false };

	if (arrival.kind === "changed")
		return current === arrival.to
			? { text: `You are now on ${planLabel(current)}.`, waiting: false }
			: { text: `Your plan is changing to ${planLabel(arrival.to)}, which takes a moment.`, waiting: true };

	if (current === null) return { text: "Your plan is cancelled.", waiting: false };
	return current === "free"
		? { text: "Your plan is cancelled. You are on Free.", waiting: false }
		: {
				text: `Your plan is cancelled. You keep ${planLabel(current)} until the end of the period you have paid for.`,
				waiting: false,
			};
}

/** "Free", or the month's price: "€9 a month". */
export function priceText(offer: PlanOffer): string {
	if (!offer.price) return "Free";

	const amount = new Intl.NumberFormat("en-IE", {
		style: "currency",
		currency: offer.price.currency.toUpperCase(),
		minimumFractionDigits: Number.isInteger(offer.price.amount) ? 0 : 2,
	}).format(offer.price.amount);
	return `${amount} a month`;
}
