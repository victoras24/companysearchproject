import { action, makeObservable, observable } from "mobx";

/** One report in an order, with the organisation's name as the registry has it. */
export type SessionItem = {
	/** Null for orders placed before the cart knew organisation types. */
	organisationTypeCode: string | null;
	registrationNo: string;
	organisationName: string;
};

/** What the backend says about the order made in a payment session. */
export type SessionAnswer = {
	status: "pending" | "paid" | "expired" | "fulfilled";
	items: SessionItem[];
	/** The email the buyer paid with. Null until the order is paid, and for orders from before it was kept. */
	buyerEmail: string | null;
};

/** The backend's session route. It resolves null for a session the backend does not know. */
export interface SessionPort {
	session(sessionId: string): Promise<SessionAnswer | null>;
}

export type ReturnState =
	/** The order is not paid yet as far as the backend knows; `takingLong` once it stopped asking. */
	| { status: "confirming"; takingLong: boolean }
	/** `buyerEmail` is where the reports will be sent, when the order has it. */
	| { status: "paid"; items: SessionItem[]; buyerEmail: string | null }
	| { status: "canceled" }
	| { status: "unknown" };

const RECHECK_EVERY_MS = 2000;
const RECHECKS = 10;

/**
 * A buyer coming back from the payment page. What happened is decided by the backend's answer
 * about the session in the URL, never by the URL's own claims. The cart is emptied when the
 * order turns out paid, and only then.
 */
export class ReturningSession {
	@observable.ref accessor state: ReturnState = { status: "confirming", takingLong: false };

	private readonly port: SessionPort;
	private readonly emptyCart: () => void;
	// Each resolve and dispose starts a new run; answers and timers of an earlier one are dropped.
	private run = 0;
	private timer: ReturnType<typeof setTimeout> | undefined;
	private cartEmptied = false;

	constructor(ports: { port: SessionPort; emptyCart: () => void }) {
		this.port = ports.port;
		this.emptyCart = ports.emptyCart;
		makeObservable(this);
	}

	/** Takes the return URL's query string, e.g. "?session_id=cs_live_...". */
	resolve = (search: string) => {
		this.dispose();
		const params = new URLSearchParams(search);
		const sessionId = params.get("session_id");

		if (params.get("canceled") === "true") return this.setState({ status: "canceled" });
		if (!sessionId) return this.setState({ status: "unknown" });

		this.setState({ status: "confirming", takingLong: false });
		this.ask(sessionId, this.run, RECHECKS);
	};

	/** Stops asking. */
	dispose = () => {
		this.run++;
		clearTimeout(this.timer);
	};

	private async ask(sessionId: string, run: number, rechecksLeft: number) {
		let answer: SessionAnswer | null;
		try {
			answer = await this.port.session(sessionId);
		} catch {
			answer = null;
		}
		if (run !== this.run) return;

		if (answer?.status === "paid" || answer?.status === "fulfilled") {
			if (!this.cartEmptied) {
				this.cartEmptied = true;
				this.emptyCart();
			}
			this.setState({ status: "paid", items: answer.items, buyerEmail: answer.buyerEmail ?? null });
		} else if (answer?.status !== "pending") {
			this.setState({ status: "unknown" });
		} else if (rechecksLeft === 0) {
			this.setState({ status: "confirming", takingLong: true });
		} else {
			this.timer = setTimeout(() => this.ask(sessionId, run, rechecksLeft - 1), RECHECK_EVERY_MS);
		}
	}

	@action
	private setState(state: ReturnState) {
		this.state = state;
	}
}
