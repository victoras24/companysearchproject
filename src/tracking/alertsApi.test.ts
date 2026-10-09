import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { userApi } from "@/api/userApi";
import { turnAlertEmailsOff } from "./alertsApi";

/** Stands in for the network: records each request and answers 204. */
function fakeNetwork() {
	const requests: InternalAxiosRequestConfig[] = [];
	userApi.defaults.adapter = async (config) => {
		requests.push(config);
		return { data: null, status: 204, statusText: "No Content", headers: {}, config };
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

describe("turnAlertEmailsOff", () => {
	const adapter = userApi.defaults.adapter;

	afterEach(() => {
		userApi.defaults.adapter = adapter;
	});

	it("gives the backend the token of the unsubscribe link", async () => {
		const requests = fakeNetwork();

		expect(await turnAlertEmailsOff("7b0c7a0e-64a7-4d39-9a51-0f8a8f1f2f10")).toBe("off");

		expect(requests.map((r) => `${r.method} ${r.url}`)).toEqual(["post /alerts/unsubscribe"]);
		expect(JSON.parse(requests[0].data)).toEqual({ token: "7b0c7a0e-64a7-4d39-9a51-0f8a8f1f2f10" });
	});

	it("says the link is not valid when the backend does not know the token", async () => {
		failingNetwork(404);

		expect(await turnAlertEmailsOff("7b0c7a0e-64a7-4d39-9a51-0f8a8f1f2f10")).toBe("invalid");
	});

	it("says the link is not valid without asking when it carries no token", async () => {
		const requests = fakeNetwork();

		expect(await turnAlertEmailsOff(null)).toBe("invalid");
		expect(await turnAlertEmailsOff("  ")).toBe("invalid");

		expect(requests).toEqual([]);
	});

	it("passes any other failure on, so the page can offer to try again", async () => {
		failingNetwork(500);

		await expect(turnAlertEmailsOff("7b0c7a0e-64a7-4d39-9a51-0f8a8f1f2f10")).rejects.toThrow("Request failed");
	});
});
