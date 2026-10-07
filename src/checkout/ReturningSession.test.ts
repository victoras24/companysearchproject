import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReturningSession, type SessionAnswer, type SessionPort } from "./ReturningSession";

const items = [
	{ organisationTypeCode: "C", registrationNo: "60580", organisationName: "ADMINICO MANAGEMENT SERVICES LIMITED" },
	{ organisationTypeCode: "B", registrationNo: "60580", organisationName: "2 ALPHA SWEETS" },
];

const answer = (status: SessionAnswer["status"]): SessionAnswer => ({ status, items });

/** The backend's session route in memory: it gives the queued answers in turn, then repeats the last. */
function fakeApi(...answers: (SessionAnswer | null | Error)[]) {
	const api = { requests: [] as string[], answers };
	const port: SessionPort = {
		session: async (sessionId) => {
			api.requests.push(sessionId);
			const next = api.answers.length > 1 ? api.answers.shift()! : api.answers[0];
			if (next instanceof Error) throw next;
			return next;
		},
	};
	return { api, port };
}

function setup(...answers: (SessionAnswer | null | Error)[]) {
	const { api, port } = fakeApi(...answers);
	const cart = { emptied: 0 };
	const session = new ReturningSession({ port, emptyCart: () => cart.emptied++ });
	return { session, api, cart };
}

const seconds = (n: number) => vi.advanceTimersByTimeAsync(n * 1000);
const settle = () => vi.advanceTimersByTimeAsync(0);

describe("ReturningSession", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	describe("a paid order", () => {
		it("is paid with the organisations ordered, and the cart is emptied once", async () => {
			const { session, api, cart } = setup(answer("paid"));

			session.resolve("?session_id=cs_test_1");
			await settle();

			expect(session.state).toEqual({ status: "paid", items });
			expect(api.requests).toEqual(["cs_test_1"]);
			expect(cart.emptied).toBe(1);

			await seconds(30);
			expect(api.requests).toHaveLength(1);
			expect(cart.emptied).toBe(1);
		});

		it("is paid when the order is already fulfilled", async () => {
			const { session, cart } = setup(answer("fulfilled"));

			session.resolve("?session_id=cs_test_1");
			await settle();

			expect(session.state).toEqual({ status: "paid", items });
			expect(cart.emptied).toBe(1);
		});
	});

	describe("an order still pending", () => {
		it("is confirming before the first answer and while the order is pending", async () => {
			const { session, cart } = setup(answer("pending"));

			session.resolve("?session_id=cs_test_1");
			expect(session.state).toEqual({ status: "confirming", takingLong: false });
			await settle();

			expect(session.state).toEqual({ status: "confirming", takingLong: false });
			expect(cart.emptied).toBe(0);
		});

		it("asks again every 2 seconds", async () => {
			const { session, api } = setup(answer("pending"));

			session.resolve("?session_id=cs_test_1");
			await settle();
			expect(api.requests).toHaveLength(1);

			await seconds(1.9);
			expect(api.requests).toHaveLength(1);
			await seconds(0.1);
			expect(api.requests).toHaveLength(2);
			await seconds(2);
			expect(api.requests).toHaveLength(3);
		});

		it("becomes paid and empties the cart when a later answer says so", async () => {
			const { session, api, cart } = setup(answer("pending"), answer("pending"), answer("paid"));

			session.resolve("?session_id=cs_test_1");
			await seconds(2);
			expect(session.state).toEqual({ status: "confirming", takingLong: false });
			expect(cart.emptied).toBe(0);

			await seconds(2);
			expect(session.state).toEqual({ status: "paid", items });
			expect(cart.emptied).toBe(1);

			await seconds(30);
			expect(api.requests).toHaveLength(3);
			expect(cart.emptied).toBe(1);
		});

		it("says it is taking long after 20 seconds, and stops asking", async () => {
			const { session, api, cart } = setup(answer("pending"));

			session.resolve("?session_id=cs_test_1");
			await seconds(19.9);
			expect(session.state).toEqual({ status: "confirming", takingLong: false });

			await seconds(0.1);
			expect(session.state).toEqual({ status: "confirming", takingLong: true });
			const asked = api.requests.length;
			expect(asked).toBe(11);

			await seconds(60);
			expect(api.requests).toHaveLength(asked);
			expect(cart.emptied).toBe(0);
		});

		it("is unknown when a later answer says the order expired", async () => {
			const { session, cart } = setup(answer("pending"), answer("expired"));

			session.resolve("?session_id=cs_test_1");
			await seconds(2);

			expect(session.state).toEqual({ status: "unknown" });
			expect(cart.emptied).toBe(0);
		});
	});

	describe("a canceled payment", () => {
		it("is canceled, makes no request and leaves the cart alone", async () => {
			const { session, api, cart } = setup(answer("paid"));

			session.resolve("?canceled=true");
			await seconds(30);

			expect(session.state).toEqual({ status: "canceled" });
			expect(api.requests).toEqual([]);
			expect(cart.emptied).toBe(0);
		});
	});

	describe("unknown", () => {
		it("when the URL has no session id", async () => {
			const { session, api, cart } = setup(answer("paid"));

			session.resolve("");
			await settle();

			expect(session.state).toEqual({ status: "unknown" });
			expect(api.requests).toEqual([]);
			expect(cart.emptied).toBe(0);
		});

		it("when the backend does not know the session", async () => {
			const { session, cart } = setup(null);

			session.resolve("?session_id=cs_test_nope");
			await settle();

			expect(session.state).toEqual({ status: "unknown" });
			expect(cart.emptied).toBe(0);
		});

		it("when the order expired", async () => {
			const { session, cart } = setup(answer("expired"));

			session.resolve("?session_id=cs_test_1");
			await settle();

			expect(session.state).toEqual({ status: "unknown" });
			expect(cart.emptied).toBe(0);
		});

		it("when the request fails, and it does not ask again", async () => {
			const { session, api, cart } = setup(new Error("backend down"));

			session.resolve("?session_id=cs_test_1");
			await seconds(30);

			expect(session.state).toEqual({ status: "unknown" });
			expect(api.requests).toHaveLength(1);
			expect(cart.emptied).toBe(0);
		});
	});

	describe("success=true in the URL", () => {
		it("does not make a return without a session paid", async () => {
			const { session, api, cart } = setup(answer("paid"));

			session.resolve("?success=true");
			await settle();

			expect(session.state).toEqual({ status: "unknown" });
			expect(api.requests).toEqual([]);
			expect(cart.emptied).toBe(0);
		});

		it("does not make a pending order paid", async () => {
			const { session, cart } = setup(answer("pending"));

			session.resolve("?success=true&session_id=cs_test_1");
			await settle();

			expect(session.state).toEqual({ status: "confirming", takingLong: false });
			expect(cart.emptied).toBe(0);
		});

		it("does not make an unknown session paid", async () => {
			const { session, cart } = setup(null);

			session.resolve("?success=true&session_id=cs_test_nope");
			await settle();

			expect(session.state).toEqual({ status: "unknown" });
			expect(cart.emptied).toBe(0);
		});
	});

	describe("leaving the page", () => {
		it("stops asking once disposed", async () => {
			const { session, api } = setup(answer("pending"));

			session.resolve("?session_id=cs_test_1");
			await seconds(2);
			session.dispose();
			await seconds(30);

			expect(api.requests).toHaveLength(2);
		});

		it("ignores an answer that arrives after it was disposed", async () => {
			const { session, cart } = setup(answer("paid"));

			session.resolve("?session_id=cs_test_1");
			session.dispose();
			await settle();

			expect(session.state).toEqual({ status: "confirming", takingLong: false });
			expect(cart.emptied).toBe(0);
		});

		it("empties the cart once when it is resolved, disposed and resolved again", async () => {
			const { session, cart } = setup(answer("paid"));

			session.resolve("?session_id=cs_test_1");
			session.dispose();
			session.resolve("?session_id=cs_test_1");
			await settle();

			expect(session.state).toEqual({ status: "paid", items });
			expect(cart.emptied).toBe(1);
		});
	});
});
