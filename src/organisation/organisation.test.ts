import { describe, expect, it } from "vitest";
import {
	detailsPath,
	registeredAddressText,
	registrationDateText,
	statusGroupOf,
	statusLabel,
	statusLine,
} from "./organisation";

describe("detailsPath", () => {
	it("builds the path from the type code and registration number", () => {
		expect(
			detailsPath({ organisationTypeCode: "C", registrationNo: "60580" })
		).toBe("/cyprus-company-search/C/60580");
	});

	it("upper-cases the type code", () => {
		expect(
			detailsPath({ organisationTypeCode: "c", registrationNo: "60580" })
		).toBe("/cyprus-company-search/C/60580");
	});

	it("encodes the registration number", () => {
		expect(
			detailsPath({ organisationTypeCode: "B", registrationNo: "12/3 #4" })
		).toBe("/cyprus-company-search/B/12%2F3%20%234");
	});

	it.each([
		[{ organisationTypeCode: null, registrationNo: "60580" }],
		[{ organisationTypeCode: "", registrationNo: "60580" }],
		[{ organisationTypeCode: "  ", registrationNo: "60580" }],
		[{ registrationNo: "60580" }],
		[{ organisationTypeCode: "C", registrationNo: null }],
		[{ organisationTypeCode: "C", registrationNo: "" }],
		[{ organisationTypeCode: "C" }],
	])("gives no path without both parts: %o", (o) => {
		expect(detailsPath(o)).toBeNull();
	});
});

describe("statusGroupOf and statusLabel", () => {
	it.each([
		["registered", "Registered"],
		["at-risk", "At risk"],
		["in-liquidation", "In liquidation"],
		["dissolved", "Dissolved"],
		["unknown", "Unknown"],
	] as const)("labels %s as %s", (group, label) => {
		const o = { statusGroup: group };
		expect(statusGroupOf(o)).toBe(group);
		expect(statusLabel(o)).toBe(label);
	});

	// Saved favourites written before status groups have none.
	it.each([null, undefined, "", "active", "Registered"])(
		"treats %o as unknown",
		(group) => {
			const o = { statusGroup: group };
			expect(statusGroupOf(o)).toBe("unknown");
			expect(statusLabel(o)).toBe("Unknown");
		}
	);
});

describe("statusLine", () => {
	it("gives the status text and since when", () => {
		expect(
			statusLine({
				statusGroup: "dissolved",
				statusText: "Struck off",
				statusDate: "12/03/2019",
			})
		).toBe("Struck off · since March 12, 2019");
	});

	it("leaves the date out for a registered organisation", () => {
		expect(
			statusLine({
				statusGroup: "registered",
				statusText: "European company (SE)",
				statusDate: "01/02/1994",
			})
		).toBe("European company (SE)");
	});

	it("gives no line when the text only repeats the badge", () => {
		expect(
			statusLine({
				statusGroup: "registered",
				statusText: "Registered",
				statusDate: "01/02/1994",
			})
		).toBeNull();
	});

	it.each([null, undefined, "", "not a date"])(
		"gives the text alone with the date %o",
		(statusDate) => {
			expect(
				statusLine({
					statusGroup: "in-liquidation",
					statusText: "Members' voluntary liquidation",
					statusDate,
				})
			).toBe("Members' voluntary liquidation");
		}
	);

	it.each([null, undefined, ""])("gives no line with the text %o", (statusText) => {
		expect(
			statusLine({ statusGroup: "unknown", statusText, statusDate: "12/03/2019" })
		).toBeNull();
	});
});

describe("registrationDateText", () => {
	it("formats the registry's DD/MM/YYYY", () => {
		expect(registrationDateText("04/03/2019")).toBe("March 4, 2019");
	});

	it.each([null, undefined, "", "not a date", "31/02/2019"])(
		"gives Not available for %o",
		(raw) => {
			expect(registrationDateText(raw)).toBe("Not available");
		}
	);
});

describe("registeredAddressText", () => {
	it("joins street, building and territory", () => {
		expect(
			registeredAddressText({
				street: "Arch. Makariou III 1",
				building: "Tower A",
				territory: "Nicosia",
			})
		).toBe("Arch. Makariou III 1 Tower A Nicosia");
	});

	it("skips empty and missing parts", () => {
		expect(
			registeredAddressText({ street: "", building: null, territory: "Limassol" })
		).toBe("Limassol");
	});

	it.each([
		[{ street: null, building: "", territory: null }],
		[null],
		[undefined],
	])("gives Address not available for %o", (a) => {
		expect(registeredAddressText(a)).toBe("Address not available");
	});
});
