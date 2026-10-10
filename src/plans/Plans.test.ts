import { describe, expect, it } from "vitest";
import { arrivalNote, arrivalOf, planLabel, Plans, priceText, type PlanOffer, type PlansPort } from "./Plans";

const flush = async () => {
	for (let i = 0; i < 20; i++) await Promise.resolve();
};

const OFFERS: PlanOffer[] = [
	{ plan: "free", slots: 1, swapsAMonth: 0, price: null },
	{ plan: "basic", slots: 5, swapsAMonth: 0, price: { amount: 3.99, currency: "eur" } },
	{ plan: "starter", slots: 25, swapsAMonth: 5, price: { amount: 9, currency: "eur" } },
	{ plan: "pro", slots: 150, swapsAMonth: 20, price: { amount: 29, currency: "eur" } },
];

/** The backend's plan routes in memory, recording the calls and where the browser was sent. */
function setup() {
	const backend = { calls: [] as string[], failing: null as Error | null, redirects: [] as string[] };
	const call = (name: string) => {
		backend.calls.push(name);
		if (backend.failing) throw backend.failing;
	};
	const port: PlansPort = {
		list: async () => {
			call("list");
			return structuredClone(OFFERS);
		},
		start: async (plan) => {
			call(`start ${plan}`);
			return { url: `https://pay.test/plan/${plan}` };
		},
		portal: async (to) => {
			call(to ? `portal ${to}` : "portal");
			return { url: `https://pay.test/portal${to ? `/${to}` : ""}` };
		},
	};
	const plans = new Plans({ port, redirect: (url) => backend.redirects.push(url) });
	return { plans, backend };
}

describe("Plans", () => {
	describe("the offers", () => {
		it("has none before they are asked for", () => {
			const { plans, backend } = setup();

			expect(plans.status).toBe("idle");
			expect(plans.offers).toEqual([]);
			expect(backend.calls).toEqual([]);
		});

		it("loads the four plans once", async () => {
			const { plans, backend } = setup();

			plans.load();
			expect(plans.status).toBe("loading");
			plans.load();
			await flush();
			plans.load();

			expect(plans.status).toBe("loaded");
			expect(plans.offers.map((o) => o.plan)).toEqual(["free", "basic", "starter", "pro"]);
			expect(backend.calls).toEqual(["list"]);
		});

		it("says so when they could not load, and loads when asked again", async () => {
			const { plans, backend } = setup();
			backend.failing = new Error("backend down");

			plans.load();
			await flush();
			expect(plans.status).toBe("error");

			backend.failing = null;
			plans.load();
			await flush();

			expect(plans.status).toBe("loaded");
			expect(plans.offers).toHaveLength(4);
		});
	});

	describe("starting a plan", () => {
		it("sends the browser to the payment page for that plan", async () => {
			const { plans, backend } = setup();

			const result = await plans.start("starter");

			expect(result).toEqual({ ok: true });
			expect(backend.calls).toEqual(["start starter"]);
			expect(backend.redirects).toEqual(["https://pay.test/plan/starter"]);
		});

		it("is pending for that plan from the press on, also after the redirect", async () => {
			const { plans } = setup();

			const started = plans.start("pro");
			expect(plans.pending).toBe("pro");

			await started;
			// The browser is leaving the page.
			expect(plans.pending).toBe("pro");
		});

		it("does nothing while something is already pending", async () => {
			const { plans, backend } = setup();

			const first = plans.start("pro");
			await plans.start("starter");
			await plans.manage();
			await first;

			expect(backend.calls).toEqual(["start pro"]);
		});

		it("says why when the backend refuses, and can be tried again", async () => {
			const { plans, backend } = setup();
			backend.failing = new Error("You already have a plan. Change or cancel it from the plans page.");

			const result = await plans.start("starter");

			expect(result).toEqual({
				ok: false,
				message: "You already have a plan. Change or cancel it from the plans page.",
			});
			expect(plans.pending).toBeNull();
			expect(backend.redirects).toEqual([]);
		});
	});

	describe("changing or cancelling a plan", () => {
		it("sends the browser to the payment provider's portal", async () => {
			const { plans, backend } = setup();

			const result = await plans.manage();

			expect(result).toEqual({ ok: true });
			expect(backend.calls).toEqual(["portal"]);
			expect(backend.redirects).toEqual(["https://pay.test/portal"]);
			expect(plans.pending).toBe("portal");
		});

		it("opens the portal on switching to another plan", async () => {
			const { plans, backend } = setup();

			const result = await plans.switchTo("pro");

			expect(result).toEqual({ ok: true });
			expect(backend.calls).toEqual(["portal pro"]);
			expect(backend.redirects).toEqual(["https://pay.test/portal/pro"]);
			expect(plans.pending).toBe("pro");
		});

		it("opens the portal on cancelling, which is going to Free", async () => {
			const { plans, backend } = setup();

			const result = await plans.cancel();

			expect(result).toEqual({ ok: true });
			expect(backend.calls).toEqual(["portal free"]);
			expect(backend.redirects).toEqual(["https://pay.test/portal/free"]);
			expect(plans.pending).toBe("cancel");
		});

		it("says so when the portal could not be opened", async () => {
			const { plans, backend } = setup();
			backend.failing = new Error("");

			const result = await plans.manage();

			expect(result).toEqual({ ok: false, message: "Something went wrong. Please try again." });
			expect(plans.pending).toBeNull();
		});
	});

	describe("coming back to a page the browser kept", () => {
		it("is no longer pending", async () => {
			const { plans } = setup();
			await plans.start("pro");

			plans.reset();

			expect(plans.pending).toBeNull();
		});
	});

	describe("coming back from the payment provider", () => {
		const arriving = (search: string) => arrivalOf(new URLSearchParams(search));

		it("reads from the address what the user has just done", () => {
			expect(arriving("")).toBeNull();
			expect(arriving("started=1")).toEqual({ kind: "started" });
			expect(arriving("changed=pro")).toEqual({ kind: "changed", to: "pro" });
			expect(arriving("cancelled=1")).toEqual({ kind: "cancelled" });
			expect(arriving("changed=gold")).toBeNull();
			expect(arriving("changed=free")).toBeNull();
		});

		it("says nothing to a user who has just done nothing", () => {
			expect(arrivalNote(null, "starter")).toBeNull();
		});

		it("waits for a plan just started until the backend has heard of it", () => {
			const waiting = { text: "Thank you. Your plan is being set up, which takes a moment.", waiting: true };

			expect(arrivalNote({ kind: "started" }, null)).toEqual(waiting);
			expect(arrivalNote({ kind: "started" }, "free")).toEqual(waiting);
			expect(arrivalNote({ kind: "started" }, "starter")).toEqual({
				text: "Thank you. You are on Starter.",
				waiting: false,
			});
		});

		it("waits for a switch until the user is on the plan switched to", () => {
			const waiting = { text: "Your plan is changing to Pro, which takes a moment.", waiting: true };

			expect(arrivalNote({ kind: "changed", to: "pro" }, null)).toEqual(waiting);
			expect(arrivalNote({ kind: "changed", to: "pro" }, "starter")).toEqual(waiting);
			expect(arrivalNote({ kind: "changed", to: "pro" }, "pro")).toEqual({
				text: "You are now on Pro.",
				waiting: false,
			});
		});

		it("says a cancelled plan stays until the end of the period paid for, and never waits", () => {
			expect(arrivalNote({ kind: "cancelled" }, "starter")).toEqual({
				text: "Your plan is cancelled. You keep Starter until the end of the period you have paid for.",
				waiting: false,
			});
			expect(arrivalNote({ kind: "cancelled" }, "free")).toEqual({
				text: "Your plan is cancelled. You are on Free.",
				waiting: false,
			});
			expect(arrivalNote({ kind: "cancelled" }, null)).toEqual({
				text: "Your plan is cancelled.",
				waiting: false,
			});
		});
	});

	describe("what a plan is called and costs", () => {
		it("names the plans", () => {
			expect((["free", "basic", "starter", "pro"] as const).map(planLabel)).toEqual([
				"Free",
				"Basic",
				"Starter",
				"Pro",
			]);
		});

		it("says Free for no price and the amount a month for one", () => {
			expect(priceText(OFFERS[0])).toBe("Free");
			expect(priceText(OFFERS[1])).toBe("€3.99 a month");
			expect(priceText(OFFERS[2])).toBe("€9 a month");
			expect(priceText({ ...OFFERS[3], price: { amount: 29.5, currency: "eur" } })).toBe("€29.50 a month");
		});
	});
});
