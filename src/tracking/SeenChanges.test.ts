import { describe, expect, it } from "vitest";
import { SeenChanges } from "./SeenChanges";

/** The browser's storage in memory. */
function memoryStorage() {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => {
			data.set(key, value);
		},
	};
}

/** A clock the test moves by hand. */
function clockAt(start: string) {
	let now = new Date(start);
	return {
		now: () => now,
		moveTo: (time: string) => {
			now = new Date(time);
		},
	};
}

const change = (detectedAt: string) => ({ detectedAt });

describe("SeenChanges", () => {
	it("finds nothing new with nobody signed in", () => {
		const seen = new SeenChanges({ storage: memoryStorage(), now: clockAt("2026-10-11T09:00:00Z").now });

		expect(seen.isNew(change("2026-10-11T08:00:00Z"))).toBe(false);
	});

	it("takes what was there on a user's first visit as seen, and what comes later as new", () => {
		const seen = new SeenChanges({ storage: memoryStorage(), now: clockAt("2026-10-11T09:00:00Z").now });

		seen.followUser("maria");

		expect(seen.isNew(change("2026-10-10T01:30:00Z"))).toBe(false);
		expect(seen.isNew(change("2026-10-12T01:30:00Z"))).toBe(true);
	});

	it("finds no change new where there is none", () => {
		const seen = new SeenChanges({ storage: memoryStorage(), now: clockAt("2026-10-11T09:00:00Z").now });
		seen.followUser("maria");

		expect(seen.isNew(null)).toBe(false);
		expect(seen.isNew(change("not a date"))).toBe(false);
	});

	it("takes everything up to now as seen once the user has looked", () => {
		const clock = clockAt("2026-10-11T09:00:00Z");
		const seen = new SeenChanges({ storage: memoryStorage(), now: clock.now });
		seen.followUser("maria");
		clock.moveTo("2026-10-13T09:00:00Z");
		expect(seen.isNew(change("2026-10-12T01:30:00Z"))).toBe(true);

		seen.markSeen();

		expect(seen.isNew(change("2026-10-12T01:30:00Z"))).toBe(false);
		expect(seen.isNew(change("2026-10-14T01:30:00Z"))).toBe(true);
	});

	it("remembers what was seen for the next visit", () => {
		const storage = memoryStorage();
		const clock = clockAt("2026-10-11T09:00:00Z");
		new SeenChanges({ storage, now: clock.now }).followUser("maria");
		clock.moveTo("2026-10-20T09:00:00Z");

		const nextVisit = new SeenChanges({ storage, now: clock.now });
		nextVisit.followUser("maria");

		expect(nextVisit.isNew(change("2026-10-12T01:30:00Z"))).toBe(true);
		expect(nextVisit.isNew(change("2026-10-10T01:30:00Z"))).toBe(false);
	});

	it("keeps each user's own", () => {
		const storage = memoryStorage();
		const clock = clockAt("2026-10-11T09:00:00Z");
		const seen = new SeenChanges({ storage, now: clock.now });
		seen.followUser("maria");
		clock.moveTo("2026-10-20T09:00:00Z");

		seen.followUser("nikos");
		expect(seen.isNew(change("2026-10-12T01:30:00Z"))).toBe(false);

		seen.followUser("maria");
		expect(seen.isNew(change("2026-10-12T01:30:00Z"))).toBe(true);
	});

	it("forgets on sign-out", () => {
		const clock = clockAt("2026-10-11T09:00:00Z");
		const seen = new SeenChanges({ storage: memoryStorage(), now: clock.now });
		seen.followUser("maria");

		seen.followUser(null);

		expect(seen.isNew(change("2026-10-12T01:30:00Z"))).toBe(false);
	});

	it("works for the visit when the browser's storage cannot be used", () => {
		const broken = {
			getItem: (): string | null => {
				throw new Error("denied");
			},
			setItem: () => {
				throw new Error("denied");
			},
		};
		const clock = clockAt("2026-10-11T09:00:00Z");
		const seen = new SeenChanges({ storage: broken, now: clock.now });

		seen.followUser("maria");
		expect(seen.isNew(change("2026-10-12T01:30:00Z"))).toBe(true);

		clock.moveTo("2026-10-13T09:00:00Z");
		seen.markSeen();
		expect(seen.isNew(change("2026-10-12T01:30:00Z"))).toBe(false);
	});
});
