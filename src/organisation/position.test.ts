import { describe, expect, it } from "vitest";
import { positionLabel } from "./position";

describe("positionLabel", () => {
	it("names every position the registry uses in English", () => {
		expect(
			[
				"Διευθυντής",
				"Γραμματέας",
				"Ιδιοκτήτης",
				"Ομόρρυθμος Συνέταιρος",
				"Αντικαταστάτης Διευθυντής",
				"Εξουσιοδοτημένο Πρόσωπο",
				"Βοηθός Γραμματέας",
				"Ετερόρρυθμος Συνέταιρος",
				"Αναπληρωτής Γραμματέας",
			].map(positionLabel)
		).toEqual([
			"Director",
			"Secretary",
			"Owner",
			"General Partner",
			"Alternate Director",
			"Authorised Person",
			"Assistant Secretary",
			"Limited Partner",
			"Deputy Secretary",
		]);
	});

	it("takes no notice of the spacing around a position", () => {
		expect(positionLabel(" Διευθυντής ")).toBe("Director");
	});

	it("keeps the registry's word for a position it does not know", () => {
		expect(positionLabel("Εκκαθαριστής")).toBe("Εκκαθαριστής");
	});

	it("is empty for a missing position", () => {
		expect(positionLabel(null)).toBe("");
		expect(positionLabel(undefined)).toBe("");
		expect(positionLabel("  ")).toBe("");
	});
});
