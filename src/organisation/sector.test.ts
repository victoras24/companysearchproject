import { describe, expect, it } from "vitest";
import { findSectors, SECTORS, sectorName } from "./sector";

describe("sectorName", () => {
	it("names the sector of a section letter", () => {
		expect(sectorName("L")).toBe("Finance and insurance");
		expect(sectorName("K")).toBe("IT and telecoms");
	});

	it("is null when CYSTAT lists the company in no sector", () => {
		expect(sectorName(null)).toBeNull();
		expect(sectorName(undefined)).toBeNull();
	});

	it("is null for a section the app does not name", () => {
		expect(sectorName("U")).toBeNull();
		expect(sectorName("Z")).toBeNull();
	});
});

describe("findSectors", () => {
	const letters = (text: string) => findSectors(text).map((s) => s.letter);

	it("finds sectors by any part of their name, in any case", () => {
		expect(letters("  FINANCE ")).toEqual(["L"]);
		expect(letters("tele")).toEqual(["K"]);
	});

	it("finds a sector by its exact letter, as well as by name", () => {
		// Q is Education's letter; "quarrying" is in Mining's name.
		expect(letters("q")).toEqual(["B", "Q"]);
	});

	it("finds every sector for no text and none for text nothing has", () => {
		expect(findSectors("")).toEqual(SECTORS);
		expect(findSectors("xyz")).toEqual([]);
	});
});
