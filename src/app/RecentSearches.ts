import { action, makeObservable, observable } from "mobx";
import { MIN_QUERY_LENGTH } from "@/pages/Search/SearchSession";

type RecentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const MAX_RECENT_SEARCHES = 5;

const keyFor = (userId: string) => `recent_searches:${userId}`;

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * What a user last searched for, newest first. It is kept in the browser, one list per user, so
 * it is this browser's own.
 */
export class RecentSearches {
	@observable.ref private accessor queries: string[] = [];

	private readonly storage: RecentStorage;
	private userId: string | null = null;

	constructor(ports: { storage: RecentStorage }) {
		this.storage = ports.storage;
		makeObservable(this);
	}

	get list(): string[] {
		return this.queries;
	}

	/** Takes up the searches of the user who signed in; shows none when nobody is signed in. */
	@action
	followUser = (userId: string | null) => {
		if (userId === this.userId) return;
		this.userId = userId;
		this.queries = userId ? this.read(userId) : [];
	};

	/** The user searched for this: it goes to the top. */
	@action
	add = (query: string) => {
		const text = query.trim();
		if (!this.userId || text.length < MIN_QUERY_LENGTH) return;

		this.queries = [text, ...this.queries.filter((other) => !same(other, text))].slice(0, MAX_RECENT_SEARCHES);
		this.write();
	};

	@action
	remove = (query: string) => {
		this.queries = this.queries.filter((other) => !same(other, query));
		this.write();
	};

	@action
	clear = () => {
		this.queries = [];
		this.write();
	};

	private read(userId: string): string[] {
		try {
			const stored: unknown = JSON.parse(this.storage.getItem(keyFor(userId)) ?? "[]");
			if (!Array.isArray(stored)) return [];
			return stored.filter((query): query is string => typeof query === "string").slice(0, MAX_RECENT_SEARCHES);
		} catch {
			return [];
		}
	}

	private write() {
		if (!this.userId) return;
		try {
			if (this.queries.length === 0) this.storage.removeItem(keyFor(this.userId));
			else this.storage.setItem(keyFor(this.userId), JSON.stringify(this.queries));
		} catch {
			// Without storage they hold for this visit.
		}
	}
}
