import { action, makeObservable, observable } from "mobx";
import type { StatusGroup } from "@/organisation/organisation";

/** A saved organisation with the registry's current facts, as the backend returns it. */
export type LibraryCompany = {
	organisationTypeCode: string;
	registrationNo: string;
	organisationName: string | null;
	organisationType: string | null;
	statusGroup: StatusGroup;
	statusText: string | null;
	statusDate: string | null;
	/** False when the registry no longer has it; then the name is the one it was saved under. */
	inRegistry: boolean;
};

export type LibraryGroup = { id: string; name: string; companies: LibraryCompany[] };
export type LibraryContents = { favourites: LibraryCompany[]; groups: LibraryGroup[] };

/** What identifies an organisation: its type code together with its registration number. */
export type OrganisationKey = {
	organisationTypeCode?: string | null;
	registrationNo?: string | null;
};

type Key = { organisationTypeCode: string; registrationNo: string };

/** The backend's library routes, called as the signed-in user. They reject on failure. */
export interface LibraryPort {
	load(): Promise<LibraryContents>;
	addFavourite(key: Key): Promise<void>;
	removeFavourite(key: Key): Promise<void>;
	createGroup(name: string): Promise<LibraryGroup>;
	deleteGroup(groupId: string): Promise<void>;
	addToGroup(groupId: string, key: Key): Promise<void>;
	removeFromGroup(groupId: string, key: Key): Promise<void>;
}

export type LibraryStatus = "idle" | "loading" | "loaded" | "error";
export type Failure = { ok: false; message: string };
export type Done = { ok: true } | Failure;

const NOT_SIGNED_IN = "Please log in to save and organise companies.";

/**
 * The signed-in user's favourites and groups, held in memory and loaded from the backend. Groups
 * are independent of favourites. Every write goes to the backend first and changes the state
 * only when it succeeded, so pages never patch anything themselves.
 */
export class Library {
	@observable.ref accessor status: LibraryStatus = "idle";
	@observable.ref accessor favourites: LibraryCompany[] = [];
	@observable.ref accessor groups: LibraryGroup[] = [];
	@observable.ref private accessor busy: ReadonlySet<string> = new Set();

	private readonly port: LibraryPort;
	private userId: string | null = null;

	constructor(port: LibraryPort) {
		this.port = port;
		makeObservable(this);
	}

	get favouriteCount() {
		return this.favourites.length;
	}

	get groupCount() {
		return this.groups.length;
	}

	/** Loads the library of the user who signed in; clears it when nobody is signed in. */
	@action
	followUser = (userId: string | null) => {
		if (userId === this.userId) return;
		this.userId = userId;
		this.favourites = [];
		this.groups = [];
		this.busy = new Set();
		this.status = "idle";
		if (userId) this.reload();
	};

	@action
	reload = () => {
		const userId = this.userId;
		if (!userId) return;
		this.status = "loading";

		this.port.load().then(
			action((contents: LibraryContents) => {
				if (this.userId !== userId) return;
				this.favourites = contents.favourites;
				this.groups = contents.groups;
				this.status = "loaded";
			}),
			action(() => {
				if (this.userId !== userId) return;
				this.status = "error";
			})
		);
	};

	isSaved = (organisation: OrganisationKey): boolean => {
		const id = idOf(organisation);
		return id !== null && this.favourites.some((f) => idOf(f) === id);
	};

	/** True while a favourite write for this organisation is on its way. */
	isBusy = (organisation: OrganisationKey): boolean => {
		const id = idOf(organisation);
		return id !== null && this.busy.has(id);
	};

	toggleFavourite = async (
		company: LibraryCompany
	): Promise<{ ok: true; saved: boolean } | Failure> => {
		if (this.isSaved(company)) {
			const removed = await this.removeFavourite(company);
			return removed.ok ? { ok: true, saved: false } : removed;
		}

		const added = await this.write(company, (key) => this.port.addFavourite(key), () => {
			this.favourites = [company, ...this.favourites];
		});
		return added.ok ? { ok: true, saved: true } : added;
	};

	removeFavourite = (company: OrganisationKey): Promise<Done> =>
		this.write(company, (key) => this.port.removeFavourite(key), (id) => {
			this.favourites = this.favourites.filter((f) => idOf(f) !== id);
		});

	createGroup = async (name: string): Promise<Done> => {
		const trimmed = name.trim();
		if (!trimmed) return { ok: false, message: "The group needs a name." };

		return this.attempt(
			() => this.port.createGroup(trimmed),
			(group) => {
				this.groups = [group, ...this.groups];
			}
		);
	};

	deleteGroup = (groupId: string): Promise<Done> =>
		this.attempt(
			() => this.port.deleteGroup(groupId),
			() => {
				this.groups = this.groups.filter((g) => g.id !== groupId);
			}
		);

	/** `added` is false when the group already had the company. */
	addToGroup = async (
		groupId: string,
		company: LibraryCompany
	): Promise<{ ok: true; added: boolean } | Failure> => {
		const group = this.groups.find((g) => g.id === groupId);
		const key = keyOf(company);
		if (!group || !key) return { ok: false, message: "Group not found" };

		const id = idOf(key);
		if (group.companies.some((c) => idOf(c) === id)) return { ok: true, added: false };

		const result = await this.attempt(
			() => this.port.addToGroup(groupId, key),
			() => this.changeGroup(groupId, (companies) => [company, ...companies])
		);
		return result.ok ? { ok: true, added: true } : result;
	};

	removeFromGroup = async (groupId: string, company: OrganisationKey): Promise<Done> => {
		const key = keyOf(company);
		if (!key) return { ok: false, message: "This company cannot be removed." };

		const id = idOf(key);
		return this.attempt(
			() => this.port.removeFromGroup(groupId, key),
			() => this.changeGroup(groupId, (companies) => companies.filter((c) => idOf(c) !== id))
		);
	};

	private changeGroup(groupId: string, change: (companies: LibraryCompany[]) => LibraryCompany[]) {
		this.groups = this.groups.map((g) =>
			g.id === groupId ? { ...g, companies: change(g.companies) } : g
		);
	}

	/** A favourite write: marks the organisation busy for its duration. */
	private async write(
		organisation: OrganisationKey,
		send: (key: Key) => Promise<void>,
		apply: (id: string) => void
	): Promise<Done> {
		const key = keyOf(organisation);
		if (!key) return { ok: false, message: "This company cannot be saved." };

		const id = idOf(key)!;
		this.setBusy(id, true);
		try {
			return await this.attempt(() => send(key), () => apply(id));
		} finally {
			this.setBusy(id, false);
		}
	}

	/** Sends a write and applies its change only if it succeeded and the user is still the same. */
	private async attempt<T>(send: () => Promise<T>, apply: (result: T) => void): Promise<Done> {
		const userId = this.userId;
		if (!userId) return { ok: false, message: NOT_SIGNED_IN };

		try {
			const result = await send();
			if (this.userId === userId) action(() => apply(result))();
			return { ok: true };
		} catch (error) {
			return {
				ok: false,
				message: error instanceof Error && error.message ? error.message : "Something went wrong.",
			};
		}
	}

	@action
	private setBusy(id: string, busy: boolean) {
		const next = new Set(this.busy);
		if (busy) next.add(id);
		else next.delete(id);
		this.busy = next;
	}
}

/** One text for an organisation's key, e.g. for a list key or a drag id. */
export const companyId = (company: LibraryCompany) =>
	`${company.organisationTypeCode}/${company.registrationNo}`;

function keyOf(organisation: OrganisationKey): Key | null {
	const organisationTypeCode = organisation.organisationTypeCode?.trim().toUpperCase();
	const registrationNo = organisation.registrationNo?.trim();
	return organisationTypeCode && registrationNo ? { organisationTypeCode, registrationNo } : null;
}

function idOf(organisation: OrganisationKey): string | null {
	const key = keyOf(organisation);
	return key ? `${key.organisationTypeCode}/${key.registrationNo}` : null;
}
