import { describe, expect, it } from "vitest";
import { Checkout, formatVatIncluded, type CheckoutItem, type CheckoutPort, type Price } from "./Checkout";

const flush = async () => {
	for (let i = 0; i < 10; i++) await Promise.resolve();
};

const adminico = {
	organisationTypeCode: "C",
	registrationNo: "60580",
	organisationName: "ADMINICO MANAGEMENT SERVICES LIMITED",
};
const sweets = { organisationTypeCode: "B", registrationNo: "60580", organisationName: "2 ALPHA SWEETS" };

const STRIPE_URL = "https://checkout.stripe.com/c/pay/cs_test_1";

/** The backend's checkout routes in memory, recording the calls. */
function fakeApi() {
	const api = {
		starts: [] as CheckoutItem[][],
		priceLoads: 0,
		failing: false,
		priceFailing: false,
	};
	const port: CheckoutPort = {
		price: async (): Promise<Price> => {
			api.priceLoads++;
			if (api.priceFailing) throw new Error("backend down");
			return { amount: 20, currency: "eur" };
		},
		start: async (items) => {
			api.starts.push(items);
			if (api.failing) throw new Error("backend down");
			return { url: STRIPE_URL };
		},
	};
	return { api, port };
}

function setup() {
	const { api, port } = fakeApi();
	const redirects: string[] = [];
	const checkout = new Checkout({ port, redirect: (url) => redirects.push(url) });
	return { checkout, api, redirects };
}

describe("Checkout", () => {
	describe("checking out a cart", () => {
		it("goes from idle to pending, then sends the browser to the URL the backend returns", async () => {
			const { checkout, redirects } = setup();
			expect(checkout.state).toEqual({ status: "idle" });

			const pending = checkout.checkOut([adminico, sweets]);
			expect(checkout.state).toEqual({ status: "pending" });
			expect(redirects).toEqual([]);
			await pending;

			expect(redirects).toEqual([STRIPE_URL]);
		});

		it("names each organisation by type code and registration number, and nothing else", async () => {
			const { checkout, api } = setup();

			await checkout.checkOut([adminico, sweets]);

			expect(api.starts).toEqual([
				[
					{ organisationTypeCode: "C", registrationNo: "60580" },
					{ organisationTypeCode: "B", registrationNo: "60580" },
				],
			]);
		});

		it("makes no second request while one is pending", async () => {
			const { checkout, api, redirects } = setup();

			const first = checkout.checkOut([adminico]);
			const second = checkout.checkOut([adminico]);
			await Promise.all([first, second]);

			expect(api.starts).toHaveLength(1);
			expect(redirects).toEqual([STRIPE_URL]);
		});

		it("stays pending after the redirect, while the browser is leaving", async () => {
			const { checkout, api } = setup();

			await checkout.checkOut([adminico]);
			expect(checkout.state).toEqual({ status: "pending" });

			await checkout.checkOut([adminico]);
			expect(api.starts).toHaveLength(1);
		});

		it("is idle again after a reset, for a buyer who comes back to a page the browser kept", async () => {
			const { checkout, api } = setup();
			await checkout.checkOut([adminico]);

			checkout.reset();
			expect(checkout.state).toEqual({ status: "idle" });

			await checkout.checkOut([adminico]);
			expect(api.starts).toHaveLength(2);
		});

		it("fails with a message when the request fails, and can be tried again", async () => {
			const { checkout, api, redirects } = setup();
			api.failing = true;

			await checkout.checkOut([adminico]);

			expect(checkout.state).toEqual({
				status: "failed",
				message: "We couldn't start checkout. Please try again.",
			});
			expect(redirects).toEqual([]);

			api.failing = false;
			const retry = checkout.checkOut([adminico]);
			expect(checkout.state).toEqual({ status: "pending" });
			await retry;

			expect(redirects).toEqual([STRIPE_URL]);
		});
	});

	describe("the price", () => {
		it("is not known before it is loaded, nor while it is loading", async () => {
			const { checkout, api } = setup();
			expect(checkout.price).toBeNull();
			expect(api.priceLoads).toBe(0);

			checkout.loadPrice();
			expect(checkout.price).toBeNull();
			await flush();

			expect(checkout.price).toEqual({ amount: 20, currency: "eur" });
		});

		it("loads once", async () => {
			const { checkout, api } = setup();

			checkout.loadPrice();
			checkout.loadPrice();
			await flush();
			checkout.loadPrice();
			await flush();

			expect(api.priceLoads).toBe(1);
		});

		it("stays unknown when the load fails", async () => {
			const { checkout, api } = setup();
			api.priceFailing = true;

			checkout.loadPrice();
			await flush();

			expect(checkout.price).toBeNull();
		});

		it("does not hold up checking out, loading or failed", async () => {
			const { checkout, api, redirects } = setup();
			api.priceFailing = true;

			checkout.loadPrice();
			await checkout.checkOut([adminico]);
			expect(redirects).toEqual([STRIPE_URL]);

			await flush();
			checkout.reset();
			await checkout.checkOut([adminico]);
			expect(redirects).toEqual([STRIPE_URL, STRIPE_URL]);
		});
	});
});

describe("formatVatIncluded", () => {
	it("is the 19% VAT inside a price that already includes it", () => {
		expect(formatVatIncluded({ amount: 39.99, currency: "eur" }, 1)).toBe("€6.38");
		expect(formatVatIncluded({ amount: 39.99, currency: "eur" }, 2)).toBe("€12.77");
	});
});
