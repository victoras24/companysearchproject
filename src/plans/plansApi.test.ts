import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setAccessTokenSource, userApi } from "@/api/userApi";
import { plansApi } from "./plansApi";

/** Stands in for the network: records each request and answers with `reply`. */
function fakeNetwork(reply: unknown) {
	const requests: InternalAxiosRequestConfig[] = [];
	userApi.defaults.adapter = async (config) => {
		requests.push(config);
		return { data: reply, status: 200, statusText: "OK", headers: {}, config };
	};
	return requests;
}

/** Stands in for the network answering every request with this status code and body. */
function failingNetwork(status: number, data: unknown) {
	userApi.defaults.adapter = async (config) => {
		throw new AxiosError("Request failed", AxiosError.ERR_BAD_RESPONSE, config, null, {
			data,
			status,
			statusText: "",
			headers: {},
			config,
		});
	};
}

describe("plansApi", () => {
	const adapter = userApi.defaults.adapter;

	beforeEach(() => setAccessTokenSource(async () => "marias-token"));
	afterEach(() => {
		userApi.defaults.adapter = adapter;
	});

	it("lists the plans", async () => {
		const offers = [{ plan: "free", slots: 1, swapsAMonth: 0, price: null }];
		const requests = fakeNetwork(offers);

		expect(await plansApi.list()).toEqual(offers);

		expect(`${requests[0].method} ${requests[0].url}`).toBe("get /plans");
	});

	it("starts a plan and opens the portal as the signed-in user", async () => {
		const requests = fakeNetwork({ url: "https://pay.test/somewhere" });

		const started = await plansApi.start("starter");
		const portal = await plansApi.portal();

		expect(requests.map((r) => `${r.method} ${r.url}`)).toEqual(["post /plans/checkout", "post /plans/portal"]);
		expect(JSON.parse(requests[0].data)).toEqual({ plan: "starter" });
		expect(requests[0].headers.Authorization).toBe("Bearer marias-token");
		expect(started).toEqual({ url: "https://pay.test/somewhere" });
		expect(portal).toEqual({ url: "https://pay.test/somewhere" });
	});

	it("opens the portal on going to a plan when one is given", async () => {
		const requests = fakeNetwork({ url: "https://pay.test/somewhere" });

		await plansApi.portal("free");

		expect(`${requests[0].method} ${requests[0].url}`).toBe("post /plans/portal");
		expect(JSON.parse(requests[0].data)).toEqual({ plan: "free" });
	});

	it("says what the backend said when it refuses", async () => {
		failingNetwork(409, "You already have a plan. Change or cancel it from the plans page.");

		await expect(plansApi.start("pro")).rejects.toThrow(
			"You already have a plan. Change or cancel it from the plans page."
		);
		await expect(plansApi.portal()).rejects.toThrow(
			"You already have a plan. Change or cancel it from the plans page."
		);
	});

	it("passes a failure with nothing said on", async () => {
		failingNetwork(500, null);

		await expect(plansApi.start("pro")).rejects.toThrow("Request failed");
	});
});
