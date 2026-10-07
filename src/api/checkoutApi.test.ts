import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkoutApi } from "./checkoutApi";
import { setAccessTokenSource, userApi } from "./userApi";

/** Stands in for the network: records each request and answers with `reply`. */
function fakeNetwork(reply: unknown) {
	const requests: InternalAxiosRequestConfig[] = [];
	userApi.defaults.adapter = async (config) => {
		requests.push(config);
		return { data: reply, status: 200, statusText: "OK", headers: {}, config };
	};
	return requests;
}

/** Stands in for the network answering every request with this status code. */
function failingNetwork(status: number) {
	userApi.defaults.adapter = async (config) => {
		throw new AxiosError("Request failed", AxiosError.ERR_BAD_RESPONSE, config, null, {
			data: null,
			status,
			statusText: "",
			headers: {},
			config,
		});
	};
}

const items = [
	{ organisationTypeCode: "C", registrationNo: "60580" },
	{ organisationTypeCode: "B", registrationNo: "60580" },
];

describe("checkoutApi", () => {
	const adapter = userApi.defaults.adapter;

	beforeEach(() => setAccessTokenSource(async () => null));
	afterEach(() => {
		userApi.defaults.adapter = adapter;
	});

	it("starts a checkout with the items and returns the URL", async () => {
		const requests = fakeNetwork({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });

		const result = await checkoutApi.start(items);

		expect(result).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });
		expect(requests).toHaveLength(1);
		expect(requests[0].method).toBe("post");
		expect(requests[0].url).toBe("/checkout");
		expect(JSON.parse(requests[0].data)).toEqual({
			items: [
				{ organisationTypeCode: "C", registrationNo: "60580" },
				{ organisationTypeCode: "B", registrationNo: "60580" },
			],
		});
	});

	it("sends the bearer token when the buyer is signed in", async () => {
		const requests = fakeNetwork({ url: "https://checkout.stripe.com/x" });
		setAccessTokenSource(async () => "token-maria");

		await checkoutApi.start(items);

		expect(requests[0].headers.Authorization).toBe("Bearer token-maria");
	});

	it("sends no token for a guest", async () => {
		const requests = fakeNetwork({ url: "https://checkout.stripe.com/x" });

		await checkoutApi.start(items);

		expect(requests[0].headers.Authorization).toBeUndefined();
	});

	it("reads the price", async () => {
		const requests = fakeNetwork({ amount: 20.0, currency: "eur" });

		const price = await checkoutApi.price();

		expect(price).toEqual({ amount: 20, currency: "eur" });
		expect(requests[0].method).toBe("get");
		expect(requests[0].url).toBe("/checkout/price");
	});

	it("reads a session's status and items", async () => {
		const answer = {
			status: "paid",
			items: [{ organisationTypeCode: "C", registrationNo: "60580", organisationName: "ADMINICO MANAGEMENT SERVICES LIMITED" }],
		};
		const requests = fakeNetwork(answer);

		const session = await checkoutApi.session("cs_test_a1/b");

		expect(session).toEqual(answer);
		expect(requests[0].method).toBe("get");
		expect(requests[0].url).toBe("/checkout/sessions/cs_test_a1%2Fb");
	});

	it("gives null for a session the backend does not know", async () => {
		failingNetwork(404);

		expect(await checkoutApi.session("cs_test_nope")).toBeNull();
	});

	it("rejects when the session request fails otherwise", async () => {
		failingNetwork(500);

		await expect(checkoutApi.session("cs_test_1")).rejects.toThrow();
	});
});
