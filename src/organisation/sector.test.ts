import { describe, expect, it } from "vitest";
import { sectorName } from "./sector";

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
