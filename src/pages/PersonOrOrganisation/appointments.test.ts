import { describe, expect, it } from "vitest";
import type { IRelatedCompany } from "@/gEntities";
import { filterAppointments, roleStats } from "./appointments";

const appointment = (organisationName: string, registrationNo: string, officialPosition: string): IRelatedCompany => ({
	organisationName,
	relatedCompany: "",
	officialPosition,
	registrationNo,
	organisationTypeCode: "C",
});

const all = [
	appointment("AEGEAN SHIPPING HOLDINGS LTD", "412873", "Διευθυντής"),
	appointment("AEGEAN BULK CARRIERS LTD", "356210", "Διευθυντής"),
	appointment("CHARALAMBOUS FAMILY INVESTMENTS LTD", "287431", "Μέτοχος"),
	appointment("KYRENIA MARINE SHIPPING LTD", "298114", "Διευθυντής"),
	appointment("LIMASSOL HARBOUR SERVICES LTD", "341908", "Γραμματέας"),
	appointment("AEGEAN SHIP MANAGEMENT LTD", "381977", "Μέτοχος"),
];

describe("roleStats", () => {
	it("counts every appointment first, then each position, the most held first", () => {
		expect(roleStats(all)).toEqual([
			{ position: null, count: 6 },
			{ position: "Διευθυντής", count: 3 },
			{ position: "Μέτοχος", count: 2 },
			{ position: "Γραμματέας", count: 1 },
		]);
	});

	it("shows only the most held positions when there are many", () => {
		const many = [...all, appointment("X LTD", "1", "Ιδιοκτήτης"), appointment("Y LTD", "2", "Εκκαθαριστής")];

		expect(roleStats(many).map((stat) => stat.position)).toEqual([null, "Διευθυντής", "Μέτοχος", "Γραμματέας"]);
	});

	it("takes positions that differ only in spacing as one, and leaves out a missing one", () => {
		const stats = roleStats([
			appointment("A LTD", "1", "Διευθυντής"),
			appointment("B LTD", "2", " Διευθυντής "),
			appointment("C LTD", "3", ""),
		]);

		expect(stats).toEqual([
			{ position: null, count: 3 },
			{ position: "Διευθυντής", count: 2 },
		]);
	});

	it("has only the total for a name with no appointments", () => {
		expect(roleStats([])).toEqual([{ position: null, count: 0 }]);
	});
});

describe("filterAppointments", () => {
	const names = (list: IRelatedCompany[]) => list.map((a) => a.organisationName);

	it("keeps everything with no position and no text", () => {
		expect(filterAppointments(all, null, "  ")).toEqual(all);
	});

	it("keeps the appointments in one position", () => {
		expect(names(filterAppointments(all, "Μέτοχος", ""))).toEqual([
			"CHARALAMBOUS FAMILY INVESTMENTS LTD",
			"AEGEAN SHIP MANAGEMENT LTD",
		]);
	});

	it("matches the text against the name, whatever its case, and the registration number", () => {
		expect(names(filterAppointments(all, null, "aegean ship"))).toEqual([
			"AEGEAN SHIPPING HOLDINGS LTD",
			"AEGEAN SHIP MANAGEMENT LTD",
		]);
		expect(names(filterAppointments(all, null, "2981"))).toEqual(["KYRENIA MARINE SHIPPING LTD"]);
	});

	it("applies the position and the text together", () => {
		expect(names(filterAppointments(all, "Διευθυντής", "bulk"))).toEqual(["AEGEAN BULK CARRIERS LTD"]);
	});
});
