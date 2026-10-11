import { action, makeObservable, observable } from "mobx";

type SeenStorage = Pick<Storage, "getItem" | "setItem">;

const keyFor = (userId: string) => `tracking_seen_until:${userId}`;

/**
 * Which changes a user has not looked at yet: those detected since they last opened their
 * Tracking page. It is kept in the browser, one moment per user, so it is this browser's own. On
 * a user's first visit everything already there counts as seen.
 */
export class SeenChanges {
	/** The moment up to which the user has seen their changes; null with nobody signed in. */
	@observable.ref private accessor seenUntil: number | null = null;

	private readonly storage: SeenStorage;
	private readonly now: () => Date;
	private userId: string | null = null;

	constructor(ports: { storage: SeenStorage; now?: () => Date }) {
		this.storage = ports.storage;
		this.now = ports.now ?? (() => new Date());
		makeObservable(this);
	}

	/** Takes up what the user who signed in has seen; forgets it when nobody is signed in. */
	@action
	followUser = (userId: string | null) => {
		if (userId === this.userId) return;
		this.userId = userId;
		if (!userId) {
			this.seenUntil = null;
			return;
		}

		const stored = this.read(userId);
		if (stored !== null) this.seenUntil = stored;
		else this.markSeen();
	};

	isNew = (change: { detectedAt: string } | null | undefined): boolean => {
		if (!change || this.seenUntil === null) return false;
		const detected = Date.parse(change.detectedAt);
		return Number.isFinite(detected) && detected > this.seenUntil;
	};

	/** The user has looked: everything up to now is seen. */
	@action
	markSeen = () => {
		if (!this.userId) return;
		const now = this.now();
		this.seenUntil = now.getTime();
		try {
			this.storage.setItem(keyFor(this.userId), now.toISOString());
		} catch {
			// Without storage it holds for this visit.
		}
	};

	private read(userId: string): number | null {
		try {
			const stored = Date.parse(this.storage.getItem(keyFor(userId)) ?? "");
			return Number.isFinite(stored) ? stored : null;
		} catch {
			return null;
		}
	}
}
