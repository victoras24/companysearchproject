import { describe, expect, it } from "vitest";
import type { LibraryCompany, LibraryGroup } from "./Library";
import { appliedMessage, confirmLabel, proposeSectorGroups, sectorOfGroup } from "./sectorGroups";

let next = 0;
const company = (name: string, sector: string | null): LibraryCompany => ({
	organisationTypeCode: "C",
	registrationNo: String(++next),
	organisationName: name,
	organisationType: "Εταιρεία",
	statusGroup: "registered",
	statusText: "Registered",
	statusDate: null,
	inRegistry: true,
	sector,
});

const names = (companies: LibraryCompany[]) => companies.map((c) => c.organisationName);

describe("proposeSectorGroups", () => {
	it("proposes one new group per sector, most companies first, then in sector order", () => {
		const builder = company("BUILDER", "F");
		const bank = company("BANK", "L");
		const shop = company("SHOP", "G");
		const insurer = company("INSURER", "L");
		const mason = company("MASON", "F");
		const farm = company("FARM", "A");

		const { proposals } = proposeSectorGroups([builder, bank, shop, insurer, mason, farm], []);

		expect(proposals.map((p) => [p.letter, p.name, names(p.companies)])).toEqual([
			["F", "Construction", ["BUILDER", "MASON"]],
			["L", "Finance and insurance", ["BANK", "INSURER"]],
			["A", "Agriculture, forestry and fishing", ["FARM"]],
			["G", "Wholesale and retail trade", ["SHOP"]],
		]);
		expect(proposals.every((p) => p.existingGroupId === null)).toBe(true);
		expect(proposals.map((p) => names(p.toAdd))).toEqual([["BUILDER", "MASON"], ["BANK", "INSURER"], ["FARM"], ["SHOP"]]);
	});

	it("adds to an existing group whose name is the sector's, in any case and spacing, only what it lacks", () => {
		const builder = company("BUILDER", "F");
		const mason = company("MASON", "F");
		const groups: LibraryGroup[] = [
			{ id: "clients", name: "Clients", companies: [] },
			{ id: "building", name: "  construction ", companies: [builder] },
		];

		const { proposals } = proposeSectorGroups([builder, mason], groups);

		const [construction] = proposals;
		expect(construction.existingGroupId).toBe("building");
		expect(names(construction.companies)).toEqual(["BUILDER", "MASON"]);
		expect(names(construction.toAdd)).toEqual(["MASON"]);
	});

	it("leaves out a sector whose group already has every company", () => {
		const builder = company("BUILDER", "F");
		const bank = company("BANK", "L");
		const groups: LibraryGroup[] = [{ id: "building", name: "Construction", companies: [builder] }];

		const { proposals } = proposeSectorGroups([builder, bank], groups);

		expect(proposals.map((p) => p.letter)).toEqual(["L"]);
	});

	it("counts the companies with no sector, or one the app does not name, apart", () => {
		const unknown = company("UNKNOWN", null);
		const household = company("HOUSEHOLD", "U");
		const missing = {
			...company("OLD", null),
			sector: undefined,
		} as unknown as LibraryCompany;
		const builder = company("BUILDER", "F");

		const { proposals, unsectored } = proposeSectorGroups([unknown, household, missing, builder], []);

		expect(proposals.map((p) => p.letter)).toEqual(["F"]);
		expect(names(unsectored)).toEqual(["UNKNOWN", "HOUSEHOLD", "OLD"]);
	});

	it("proposes nothing for no saved companies", () => {
		expect(proposeSectorGroups([], [])).toEqual({
			proposals: [],
			unsectored: [],
		});
	});
});

describe("confirmLabel", () => {
	it("says what confirming will do", () => {
		expect(confirmLabel(3, 0)).toBe("Create 3 groups");
		expect(confirmLabel(1, 0)).toBe("Create 1 group");
		expect(confirmLabel(0, 1)).toBe("Update 1");
		expect(confirmLabel(3, 1)).toBe("Create 3, update 1");
		expect(confirmLabel(0, 0)).toBe("Create groups");
	});
});

describe("appliedMessage", () => {
	const group = (name: string) => ({ id: name, name });

	it("names one updated group and counts more", () => {
		expect(
			appliedMessage({
				created: [group("A"), group("B"), group("C")],
				updated: [{ ...group("Construction"), added: [] }],
				failed: 0,
			})
		).toBe("Created 3 groups, updated Construction.");
		expect(appliedMessage({ created: [group("A")], updated: [], failed: 0 })).toBe("Created 1 group.");
		expect(
			appliedMessage({
				created: [],
				updated: [
					{ ...group("Construction"), added: [] },
					{ ...group("Real estate"), added: [] },
				],
				failed: 0,
			})
		).toBe("Updated 2 groups.");
		expect(appliedMessage({ created: [], updated: [], failed: 2 })).toBeNull();
	});
});

describe("sectorOfGroup", () => {
	it("is the sector a group is named after, in any case and spacing", () => {
		expect(sectorOfGroup(" construction ")).toBe("F");
		expect(sectorOfGroup("Clients")).toBeNull();
	});
});
