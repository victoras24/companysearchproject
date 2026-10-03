import { describe, expect, it } from "vitest";
import {
	detailsPath,
	isActive,
	registeredAddressText,
	registrationDateText,
	statusLabel,
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

describe("isActive and statusLabel", () => {
	it("treats Εγγεγραμμένη as active", () => {
		const o = { organisationStatus: "Εγγεγραμμένη" };
		expect(isActive(o)).toBe(true);
		expect(statusLabel(o)).toBe("Active");
	});

	it.each(["Διαγραμμένη", "Στάληκε επιστολή Υπενθύμισης", "", null, undefined])(
		"treats %o as inactive",
		(status) => {
			const o = { organisationStatus: status };
			expect(isActive(o)).toBe(false);
			expect(statusLabel(o)).toBe("Inactive");
		}
	);
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
