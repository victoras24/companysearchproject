import { describe, expect, it } from "vitest";
import { MAX_RECENT_SEARCHES, RecentSearches } from "./RecentSearches";

/** The browser's storage in memory. */
function memoryStorage() {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => {
			data.set(key, value);
		},
		removeItem: (key: string) => {
			data.delete(key);
		},
	};
}

const signedIn = (storage = memoryStorage(), userId = "user-1") => {
	const recent = new RecentSearches({ storage });
	recent.followUser(userId);
	return recent;
};

describe("RecentSearches", () => {
	it("starts with none", () => {
		expect(signedIn().list).toEqual([]);
	});

	it("lists what was searched, newest first", () => {
		const recent = signedIn();
		recent.add("Aegean");
		recent.add("Shipping");

		expect(recent.list).toEqual(["Shipping", "Aegean"]);
	});

	it("moves a search made again to the top instead of listing it twice", () => {
		const recent = signedIn();
		recent.add("Aegean");
		recent.add("Shipping");
		recent.add("  aegean ");

		expect(recent.list).toEqual(["aegean", "Shipping"]);
	});

	it("leaves out a search too short to have run", () => {
		const recent = signedIn();
		recent.add("ae");
		recent.add("   ");

		expect(recent.list).toEqual([]);
	});

	it("keeps only the latest few", () => {
		const recent = signedIn();
		for (let i = 1; i <= MAX_RECENT_SEARCHES + 2; i++) recent.add(`company ${i}`);

		expect(recent.list).toHaveLength(MAX_RECENT_SEARCHES);
		expect(recent.list[0]).toBe(`company ${MAX_RECENT_SEARCHES + 2}`);
		expect(recent.list).not.toContain("company 1");
	});

	it("removes one search", () => {
		const recent = signedIn();
		recent.add("Aegean");
		recent.add("Shipping");
		recent.remove("Aegean");

		expect(recent.list).toEqual(["Shipping"]);
	});

	it("clears them all", () => {
		const storage = memoryStorage();
		const recent = signedIn(storage);
		recent.add("Aegean");
		recent.clear();

		expect(recent.list).toEqual([]);
		expect(signedIn(storage).list).toEqual([]);
	});

	it("still has them on the next visit", () => {
		const storage = memoryStorage();
		signedIn(storage).add("Aegean");

		expect(signedIn(storage).list).toEqual(["Aegean"]);
	});

	it("keeps each user's searches apart", () => {
		const storage = memoryStorage();
		const recent = signedIn(storage, "user-1");
		recent.add("Aegean");

		recent.followUser("user-2");
		expect(recent.list).toEqual([]);
		recent.add("Shipping");

		recent.followUser("user-1");
		expect(recent.list).toEqual(["Aegean"]);
	});

	it("keeps nothing with nobody signed in", () => {
		const storage = memoryStorage();
		const recent = new RecentSearches({ storage });
		recent.add("Aegean");

		expect(recent.list).toEqual([]);
		expect(storage.data.size).toBe(0);
	});

	it("shows none after sign-out", () => {
		const recent = signedIn();
		recent.add("Aegean");
		recent.followUser(null);

		expect(recent.list).toEqual([]);
	});

	it("starts with none when what is stored cannot be read", () => {
		const storage = memoryStorage();
		storage.setItem("recent_searches:user-1", "{not json");
		expect(signedIn(storage).list).toEqual([]);

		storage.setItem("recent_searches:user-1", JSON.stringify({ a: 1 }));
		expect(signedIn(storage).list).toEqual([]);

		storage.setItem("recent_searches:user-1", JSON.stringify(["Aegean", 7, null]));
		expect(signedIn(storage).list).toEqual(["Aegean"]);
	});

	it("holds for the visit when the storage refuses", () => {
		const recent = new RecentSearches({
			storage: {
				getItem: () => {
					throw new Error("blocked");
				},
				setItem: () => {
					throw new Error("blocked");
				},
				removeItem: () => {
					throw new Error("blocked");
				},
			},
		});
		recent.followUser("user-1");
		recent.add("Aegean");

		expect(recent.list).toEqual(["Aegean"]);
	});
});
