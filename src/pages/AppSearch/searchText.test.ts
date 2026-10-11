import { describe, expect, it } from "vitest";
import type { IOfficials } from "@/gEntities";
import { countLine, noResultsText, officialsFound } from "./searchText";

const appointment = (name: string, company: string, position = "Director"): IOfficials => ({
	organisationName: company,
	registrationNo: "1",
	organisationTypeCode: "C",
	organisationType: "Company",
	personOrOrganisationName: name,
	officialPosition: position,
});

describe("countLine", () => {
	it("counts the companies found", () => {
		expect(countLine({ total: 18, statusFilter: "all", page: 1, pageSize: 10, paged: false })).toBe("18 companies");
	});

	it("says company for one", () => {
		expect(countLine({ total: 1, statusFilter: "all", page: 1, pageSize: 10, paged: false })).toBe("1 company");
	});

	it("names the status when filtered", () => {
		expect(countLine({ total: 4, statusFilter: "registered", page: 1, pageSize: 10, paged: false })).toBe(
			"4 registered companies"
		);
		expect(countLine({ total: 1, statusFilter: "in-liquidation", page: 1, pageSize: 10, paged: false })).toBe(
			"1 in liquidation company"
		);
	});

	it("says which page of how many when there is more than one", () => {
		expect(countLine({ total: 23, statusFilter: "all", page: 2, pageSize: 10, paged: true })).toBe(
			"23 companies · page 2 of 3"
		);
		expect(countLine({ total: 20, statusFilter: "at-risk", page: 1, pageSize: 10, paged: true })).toBe(
			"20 at risk companies · page 1 of 2"
		);
	});
});

describe("noResultsText", () => {
	it("suggests another spelling when no company matches", () => {
		expect(noResultsText({ entityType: "organisation", statusFilter: "all", query: "zzz" })).toBe(
			'No results for "zzz". Check the spelling or try fewer words.'
		);
	});

	it("names the status when the filter leaves none", () => {
		expect(noResultsText({ entityType: "organisation", statusFilter: "dissolved", query: "aegean" })).toBe(
			'No dissolved companies match "aegean".'
		);
	});

	it("suggests the surname when no official matches", () => {
		expect(noResultsText({ entityType: "official", statusFilter: "all", query: "zzz" })).toBe(
			'No officials match "zzz". Try the surname on its own.'
		);
	});
});

describe("officialsFound", () => {
	it("lists each name once, in the order found", () => {
		const found = officialsFound([
			appointment("Maria Georgiou", "Aegean Ltd"),
			appointment("Andreas Georgiou", "Blue Ltd"),
			appointment("Maria Georgiou", "Cedar Ltd"),
		]);
		expect(found.map((official) => official.name)).toEqual(["Maria Georgiou", "Andreas Georgiou"]);
	});

	it("keeps the position and company each name was first found with", () => {
		const [official] = officialsFound([
			appointment("Maria Georgiou", "Aegean Ltd", "Secretary"),
			appointment("Maria Georgiou", "Cedar Ltd"),
		]);
		expect(official).toEqual({ name: "Maria Georgiou", position: "Secretary", company: "Aegean Ltd" });
	});

	it("leaves out rows without a name", () => {
		expect(officialsFound([appointment("  ", "Aegean Ltd")])).toEqual([]);
	});
});
