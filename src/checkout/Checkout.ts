import { action, makeObservable, observable } from "mobx";

/** What names an organisation in an order: its type code together with its registration number. */
export type CheckoutItem = { organisationTypeCode: string; registrationNo: string };

/** What one report costs, as the backend returns it: the amount in euros, not cents. */
export type Price = { amount: number; currency: string };

/** The backend's checkout routes. They reject on failure. */
export interface CheckoutPort {
	price(): Promise<Price>;
	start(items: CheckoutItem[]): Promise<{ url: string }>;
}

export type CheckoutState =
	| { status: "idle" }
	| { status: "pending" }
	| { status: "failed"; message: string };

const COULD_NOT_START = "We couldn't start checkout. Please try again.";

/**
 * Checking out a cart, and the price of a report. Checking out makes an order on the backend and
 * sends the browser to the payment provider's page; views render `state` and decide nothing.
 */
export class Checkout {
	@observable.ref accessor state: CheckoutState = { status: "idle" };
	/** Null until it has loaded, and for good if the load failed. */
	@observable.ref accessor price: Price | null = null;

	private readonly port: CheckoutPort;
	private readonly redirect: (url: string) => void;
	private priceRequested = false;

	constructor(ports: { port: CheckoutPort; redirect: (url: string) => void }) {
		this.port = ports.port;
		this.redirect = ports.redirect;
		makeObservable(this);
	}

	/** Asks the backend for the price, the first time it is called. */
	loadPrice = () => {
		if (this.priceRequested) return;
		this.priceRequested = true;

		this.port.price().then(
			action((price: Price) => {
				this.price = price;
			}),
			() => {}
		);
	};

	/**
	 * Starts a checkout for these organisations. It does nothing while one is pending, and it
	 * stays pending after the redirect, because the browser is leaving the page.
	 */
	checkOut = async (items: CheckoutItem[]): Promise<void> => {
		if (this.state.status === "pending") return;
		this.setState({ status: "pending" });

		try {
			const { url } = await this.port.start(
				items.map(({ organisationTypeCode, registrationNo }) => ({ organisationTypeCode, registrationNo }))
			);
			this.redirect(url);
		} catch {
			this.setState({ status: "failed", message: COULD_NOT_START });
		}
	};

	/** For a buyer who comes back from the payment page to a page the browser kept as it was. */
	reset = () => this.setState({ status: "idle" });

	@action
	private setState(state: CheckoutState) {
		this.state = state;
	}
}

/** A price times a number of reports as text, e.g. "€40.00". */
export const formatPrice = (price: Price, reports = 1) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency: price.currency.toUpperCase() }).format(
		price.amount * reports
	);

const VAT_RATE = 0.19;

/** The VAT inside a price that already includes it, for a number of reports, e.g. "€6.38". */
export const formatVatIncluded = (price: Price, reports = 1) => {
	const total = price.amount * reports;
	return new Intl.NumberFormat("en-IE", { style: "currency", currency: price.currency.toUpperCase() }).format(
		total - total / (1 + VAT_RATE)
	);
};
