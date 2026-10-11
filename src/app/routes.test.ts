import { describe, expect, it } from "vitest";
import { officialPath } from "./routes";

describe("officialPath", () => {
	it("builds the official's page in the app from the name", () => {
		expect(officialPath("ELENA CHARALAMBOUS")).toBe("/app/official/ELENA%20CHARALAMBOUS");
	});

	it("keeps a name with a slash or a question mark in one piece", () => {
		expect(officialPath("A/B & C? LTD")).toBe("/app/official/A%2FB%20%26%20C%3F%20LTD");
	});

	it("trims the name", () => {
		expect(officialPath("  ANDREAS GEORGIOU ")).toBe("/app/official/ANDREAS%20GEORGIOU");
	});

	it.each([[""], ["   "], [null], [undefined]])("gives null for %o", (name) => {
		expect(officialPath(name)).toBeNull();
	});
});
