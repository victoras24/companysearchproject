import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ICompany } from "@/gEntities";
import { ReportSuggestions, SUGGESTION_DEBOUNCE_MS, type SuggestFn } from "./ReportSuggestions";

const company = (n: number, organisationTypeCode = "C"): ICompany => ({
	id: n,
	organisationName: `Company ${n}`,
	organisationStatus: "Εγγεγραμμένη",
	addressSeqNo: n,
	registrationDate: "01/01/2020",
	registrationNo: `${n}`,
	organisationTypeCode,
});

const flush = async () => {
	for (let i = 0; i < 5; i++) await Promise.resolve();
};

/** The search in memory: requests stay pending until the test answers them. */
function setup(inCart: (company: ICompany) => boolean = () => false) {
	const requests: Array<{
		query: string;
		signal: AbortSignal;
		resolve: (items: ICompany[]) => void;
		reject: (error: unknown) => void;
	}> = [];
	const suggest: SuggestFn = ({ query, signal }) =>
		new Promise((resolve, reject) => requests.push({ query, signal, resolve, reject }));
	const suggestions = new ReportSuggestions({ suggest, inCart });
	const typed = async (text: string) => {
		suggestions.type(text);
		await vi.advanceTimersByTimeAsync(SUGGESTION_DEBOUNCE_MS);
	};
	return { suggestions, requests, typed };
}

const names = (s: ReportSuggestions) => s.items.map((item) => item.organisationName);

describe("ReportSuggestions", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("searches once the typing pauses, and suggests the first three matches", async () => {
		const { suggestions, requests, typed } = setup();

		suggestions.type("aeg");
		expect(requests).toHaveLength(0);
		await typed("aege");
		expect(requests.map((r) => r.query)).toEqual(["aege"]);
		expect(suggestions.searching).toBe(true);

		requests[0].resolve([company(1), company(2), company(3), company(4)]);
		await flush();

		expect(names(suggestions)).toEqual(["Company 1", "Company 2", "Company 3"]);
		expect(suggestions.searching).toBe(false);
	});

	it("does not search for fewer than three characters, and suggests nothing", async () => {
		const { suggestions, requests, typed } = setup();
		await typed("aege");
		requests[0].resolve([company(1)]);
		await flush();

		await typed(" ae ");

		expect(requests).toHaveLength(1);
		expect(suggestions.items).toEqual([]);
		expect(suggestions.text).toBe(" ae ");
	});

	it("leaves out organisations already in the cart, and ones that cannot be ordered", async () => {
		const { suggestions, requests, typed } = setup((c) => c.registrationNo === "2");
		await typed("comp");

		requests[0].resolve([company(1), company(2), { ...company(3), organisationTypeCode: null }, company(4), company(5)]);
		await flush();

		expect(names(suggestions)).toEqual(["Company 1", "Company 4", "Company 5"]);
	});

	it("lets only the latest search answer", async () => {
		const { suggestions, requests, typed } = setup();
		await typed("aege");
		await typed("aegean");

		expect(requests[0].signal.aborted).toBe(true);
		requests[1].resolve([company(2)]);
		requests[0].resolve([company(1)]);
		await flush();

		expect(names(suggestions)).toEqual(["Company 2"]);
	});

	it("suggests nothing when the search fails", async () => {
		const { suggestions, requests, typed } = setup();
		await typed("aege");

		requests[0].reject(new Error("backend down"));
		await flush();

		expect(suggestions.items).toEqual([]);
		expect(suggestions.searching).toBe(false);
	});

	it("empties itself when cleared, dropping a search on its way", async () => {
		const { suggestions, requests, typed } = setup();
		await typed("aege");

		suggestions.clear();
		requests[0].resolve([company(1)]);
		await flush();

		expect(suggestions.text).toBe("");
		expect(suggestions.items).toEqual([]);
		expect(suggestions.searching).toBe(false);
	});
});
