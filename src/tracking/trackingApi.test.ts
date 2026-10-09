import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setAccessTokenSource, userApi } from "@/api/userApi";
import { trackingApi } from "./trackingApi";

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

const blueworth = { organisationTypeCode: "C", registrationNo: "382116" };

describe("trackingApi", () => {
	const adapter = userApi.defaults.adapter;

	beforeEach(() => setAccessTokenSource(async () => "marias-token"));
	afterEach(() => {
		userApi.defaults.adapter = adapter;
	});

	it("loads the user's tracked organisations as the signed-in user", async () => {
		const contents = { slots: 1, slotsUsed: 0, organisations: [] };
		const requests = fakeNetwork(contents);

		expect(await trackingApi.load()).toEqual(contents);

		expect(requests[0].method).toBe("get");
		expect(requests[0].url).toBe("/tracking");
		expect(requests[0].headers.Authorization).toBe("Bearer marias-token");
	});

	it("tracks, untracks and reads an organisation on its own path", async () => {
		const requests = fakeNetwork({ filings: [] });

		await trackingApi.track(blueworth);
		await trackingApi.untrack(blueworth);
		const details = await trackingApi.details({ organisationTypeCode: "C", registrationNo: "12/3" });

		expect(requests.map((r) => `${r.method} ${r.url}`)).toEqual([
			"put /tracking/C/382116",
			"delete /tracking/C/382116",
			"get /tracking/C/12%2F3",
		]);
		expect(details).toEqual({ filings: [] });
	});

	it("says the slot is used when the backend refuses a track for that", async () => {
		failingNetwork(409);

		await expect(trackingApi.track(blueworth)).rejects.toThrow(
			"Your one free tracked organisation is already used."
		);
	});

	it("passes any other failure on", async () => {
		failingNetwork(500);

		await expect(trackingApi.track(blueworth)).rejects.toThrow("Request failed");
	});
});
