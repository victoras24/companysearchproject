import { describe, expect, it } from "vitest";
import { handlePreloadError } from "./staleBuild";

function setup(now = 1_000_000) {
	const stored = new Map<string, string>();
	const ports = {
		storage: {
			getItem: (key: string) => stored.get(key) ?? null,
			setItem: (key: string, value: string) => void stored.set(key, value),
		},
		reloads: 0,
		reload: () => void ports.reloads++,
		now: () => now,
	};
	const event = () => {
		const e = { prevented: false, preventDefault: () => void (e.prevented = true) };
		return e;
	};
	return { ports, event, at: (time: number) => (now = time) };
}

describe("a page file that is gone after a deploy", () => {
	it("reloads the page and keeps the error from being thrown", () => {
		const { ports, event } = setup();
		const e = event();

		handlePreloadError(e, ports);

		expect(ports.reloads).toBe(1);
		expect(e.prevented).toBe(true);
	});

	it("lets the error through when it is still missing right after the reload", () => {
		const { ports, event, at } = setup();
		handlePreloadError(event(), ports);

		at(1_000_000 + 5_000);
		const e = event();
		handlePreloadError(e, ports);

		expect(ports.reloads).toBe(1);
		expect(e.prevented).toBe(false);
	});

	it("reloads again for a later deploy in the same tab", () => {
		const { ports, event, at } = setup();
		handlePreloadError(event(), ports);

		at(1_000_000 + 60 * 60_000);
		handlePreloadError(event(), ports);

		expect(ports.reloads).toBe(2);
	});
});
