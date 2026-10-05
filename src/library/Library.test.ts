import { describe, expect, it } from "vitest";
import { Library, type LibraryCompany, type LibraryContents, type LibraryGroup, type LibraryPort } from "./Library";

const flush = async () => {
	for (let i = 0; i < 10; i++) await Promise.resolve();
};

const company = (typeCode: string, registrationNo: string, name: string): LibraryCompany => ({
	organisationTypeCode: typeCode,
	registrationNo,
	organisationName: name,
	organisationType: "Εταιρεία",
	statusGroup: "registered",
	statusText: "Registered",
	statusDate: null,
	inRegistry: true,
});

const adminico = company("C", "60580", "ADMINICO MANAGEMENT SERVICES LIMITED");
const sweets = company("B", "60580", "2 ALPHA SWEETS");
const beta = company("C", "11", "BETA HOLDINGS LTD");

/** The backend's library routes in memory, one library per user, recording the calls. */
function fakeBackend(initial: Record<string, LibraryContents> = {}) {
	const backend = {
		user: null as string | null,
		calls: [] as string[],
		failing: false,
		libraries: structuredClone(initial) as Record<string, LibraryContents>,
		groups: 0,
	};
	const mine = () => (backend.libraries[backend.user!] ??= { favourites: [], groups: [] });
	const call = (name: string) => {
		backend.calls.push(name);
		if (backend.failing) throw new Error("backend down");
	};
	const port: LibraryPort = {
		load: async () => {
			call("load");
			return structuredClone(mine());
		},
		addFavourite: async (key) => call(`addFavourite ${key.organisationTypeCode}/${key.registrationNo}`),
		removeFavourite: async (key) => call(`removeFavourite ${key.organisationTypeCode}/${key.registrationNo}`),
		createGroup: async (name): Promise<LibraryGroup> => {
			call(`createGroup ${name}`);
			return { id: `group-${++backend.groups}`, name: name.trim(), companies: [] };
		},
		deleteGroup: async (id) => call(`deleteGroup ${id}`),
		addToGroup: async (id, key) => call(`addToGroup ${id} ${key.organisationTypeCode}/${key.registrationNo}`),
		removeFromGroup: async (id, key) => call(`removeFromGroup ${id} ${key.organisationTypeCode}/${key.registrationNo}`),
	};
	return { backend, port };
}

async function setup(initial: LibraryContents = { favourites: [], groups: [] }) {
	const { backend, port } = fakeBackend({ maria: initial });
	const library = new Library(port);
	backend.user = "maria";
	library.followUser("maria");
	await flush();
	backend.calls.length = 0;
	return { library, backend };
}

const names = (companies: LibraryCompany[]) => companies.map((c) => c.organisationName);

describe("Library", () => {
	describe("following the user", () => {
		it("is empty and idle before anyone signs in", () => {
			const { port, backend } = fakeBackend();
			const library = new Library(port);

			expect(library.status).toBe("idle");
			expect(library.favourites).toEqual([]);
			expect(library.groups).toEqual([]);
			expect(backend.calls).toEqual([]);
		});

		it("loads when a user signs in", async () => {
			const { port, backend } = fakeBackend({
				maria: { favourites: [adminico], groups: [{ id: "g1", name: "Clients", companies: [beta] }] },
			});
			const library = new Library(port);
			backend.user = "maria";

			library.followUser("maria");
			expect(library.status).toBe("loading");
			await flush();

			expect(library.status).toBe("loaded");
			expect(library.favourites).toEqual([adminico]);
			expect(library.groups).toEqual([{ id: "g1", name: "Clients", companies: [beta] }]);
		});

		it("does not load again for the same user", async () => {
			const { library, backend } = await setup();

			library.followUser("maria");
			await flush();

			expect(backend.calls).toEqual([]);
		});

		it("clears when the user signs out", async () => {
			const { library } = await setup({ favourites: [adminico], groups: [] });

			library.followUser(null);

			expect(library.status).toBe("idle");
			expect(library.favourites).toEqual([]);
			expect(library.isSaved(adminico)).toBe(false);
		});

		it("drops a load that finishes after the user signed out", async () => {
			const { port, backend } = fakeBackend({ maria: { favourites: [adminico], groups: [] } });
			const library = new Library(port);
			backend.user = "maria";

			library.followUser("maria");
			library.followUser(null);
			await flush();

			expect(library.status).toBe("idle");
			expect(library.favourites).toEqual([]);
		});

		it("is in error when the load fails, and loads on retry", async () => {
			const { port, backend } = fakeBackend({ maria: { favourites: [adminico], groups: [] } });
			const library = new Library(port);
			backend.user = "maria";
			backend.failing = true;

			library.followUser("maria");
			await flush();
			expect(library.status).toBe("error");

			backend.failing = false;
			library.reload();
			await flush();

			expect(library.status).toBe("loaded");
			expect(library.favourites).toEqual([adminico]);
		});
	});

	describe("favourites", () => {
		it("matches a saved organisation on type code and registration number", async () => {
			const { library } = await setup({ favourites: [adminico], groups: [] });

			expect(library.isSaved({ organisationTypeCode: "C", registrationNo: "60580" })).toBe(true);
			expect(library.isSaved({ organisationTypeCode: "c", registrationNo: " 60580 " })).toBe(true);
			expect(library.isSaved({ organisationTypeCode: "B", registrationNo: "60580" })).toBe(false);
			expect(library.isSaved({ organisationTypeCode: "C", registrationNo: "11" })).toBe(false);
			expect(library.isSaved({ organisationTypeCode: null, registrationNo: "60580" })).toBe(false);
		});

		it("toggle saves, newest first, then removes", async () => {
			const { library, backend } = await setup({ favourites: [adminico], groups: [] });

			expect(await library.toggleFavourite(beta)).toEqual({ ok: true, saved: true });
			expect(names(library.favourites)).toEqual(["BETA HOLDINGS LTD", "ADMINICO MANAGEMENT SERVICES LIMITED"]);
			expect(library.isSaved(beta)).toBe(true);

			expect(await library.toggleFavourite(beta)).toEqual({ ok: true, saved: false });
			expect(names(library.favourites)).toEqual(["ADMINICO MANAGEMENT SERVICES LIMITED"]);

			expect(backend.calls).toEqual(["addFavourite C/11", "removeFavourite C/11"]);
		});

		it("removes a favourite", async () => {
			const { library, backend } = await setup({ favourites: [adminico, sweets], groups: [] });

			expect(await library.removeFavourite(adminico)).toEqual({ ok: true });

			expect(library.favourites).toEqual([sweets]);
			expect(backend.calls).toEqual(["removeFavourite C/60580"]);
		});

		it("leaves the state alone and returns the error when a write fails", async () => {
			const { library, backend } = await setup({ favourites: [adminico], groups: [] });
			backend.failing = true;

			const added = await library.toggleFavourite(beta);
			const removed = await library.toggleFavourite(adminico);

			expect(added).toEqual({ ok: false, message: "backend down" });
			expect(removed.ok).toBe(false);
			expect(library.favourites).toEqual([adminico]);
		});

		it("cannot save an organisation without a type code", async () => {
			const { library, backend } = await setup();

			const result = await library.toggleFavourite({ ...beta, organisationTypeCode: "" });

			expect(result.ok).toBe(false);
			expect(backend.calls).toEqual([]);
		});

		it("says which organisation is busy while its write is on the way", async () => {
			const { library } = await setup();

			const pending = library.toggleFavourite(beta);
			expect(library.isBusy(beta)).toBe(true);
			expect(library.isBusy(adminico)).toBe(false);
			await pending;

			expect(library.isBusy(beta)).toBe(false);
		});

		it("does nothing when signed out", async () => {
			const { port, backend } = fakeBackend();
			const library = new Library(port);

			expect((await library.toggleFavourite(beta)).ok).toBe(false);
			expect(backend.calls).toEqual([]);
		});
	});

	describe("groups", () => {
		it("creates a group at the top", async () => {
			const { library, backend } = await setup({ favourites: [], groups: [{ id: "g0", name: "Old", companies: [] }] });

			const result = await library.createGroup(" Clients ");

			expect(result).toEqual({ ok: true });
			expect(library.groups.map((g) => g.name)).toEqual(["Clients", "Old"]);
			expect(backend.calls).toEqual(["createGroup Clients"]);
		});

		it("does not create a group without a name", async () => {
			const { library, backend } = await setup();

			expect((await library.createGroup("   ")).ok).toBe(false);
			expect(backend.calls).toEqual([]);
		});

		it("deletes a group", async () => {
			const { library } = await setup({ favourites: [], groups: [{ id: "g0", name: "Old", companies: [beta] }] });

			expect(await library.deleteGroup("g0")).toEqual({ ok: true });

			expect(library.groups).toEqual([]);
		});

		it("adds a company to a group, newest first, whether or not it is a favourite", async () => {
			const { library, backend } = await setup({ favourites: [], groups: [{ id: "g0", name: "Clients", companies: [beta] }] });

			expect(await library.addToGroup("g0", adminico)).toEqual({ ok: true, added: true });

			expect(names(library.groups[0].companies)).toEqual(["ADMINICO MANAGEMENT SERVICES LIMITED", "BETA HOLDINGS LTD"]);
			expect(library.favourites).toEqual([]);
			expect(backend.calls).toEqual(["addToGroup g0 C/60580"]);
		});

		it("adding a company that is already in the group changes nothing", async () => {
			const { library, backend } = await setup({ favourites: [], groups: [{ id: "g0", name: "Clients", companies: [beta] }] });

			expect(await library.addToGroup("g0", beta)).toEqual({ ok: true, added: false });

			expect(library.groups[0].companies).toEqual([beta]);
			expect(backend.calls).toEqual([]);
		});

		it("removes a company from one group only", async () => {
			const { library } = await setup({
				favourites: [beta],
				groups: [
					{ id: "g0", name: "Clients", companies: [beta, adminico] },
					{ id: "g1", name: "Suppliers", companies: [beta] },
				],
			});

			expect(await library.removeFromGroup("g0", beta)).toEqual({ ok: true });

			expect(library.groups[0].companies).toEqual([adminico]);
			expect(library.groups[1].companies).toEqual([beta]);
			expect(library.favourites).toEqual([beta]);
		});

		it("removing a favourite leaves it in its groups", async () => {
			const { library } = await setup({ favourites: [beta], groups: [{ id: "g0", name: "Clients", companies: [beta] }] });

			await library.removeFavourite(beta);

			expect(library.groups[0].companies).toEqual([beta]);
		});

		it("leaves the groups alone when a write fails", async () => {
			const groups = [{ id: "g0", name: "Clients", companies: [beta] }];
			const { library, backend } = await setup({ favourites: [], groups });
			backend.failing = true;

			expect((await library.createGroup("New")).ok).toBe(false);
			expect((await library.deleteGroup("g0")).ok).toBe(false);
			expect((await library.addToGroup("g0", adminico)).ok).toBe(false);
			expect((await library.removeFromGroup("g0", beta)).ok).toBe(false);

			expect(library.groups).toEqual(groups);
		});

		it("an unknown group is an error", async () => {
			const { library, backend } = await setup();

			expect((await library.addToGroup("nope", beta)).ok).toBe(false);
			expect(backend.calls).toEqual([]);
		});
	});

	it("counts follow the state", async () => {
		const { library } = await setup({ favourites: [adminico], groups: [] });
		expect([library.favouriteCount, library.groupCount]).toEqual([1, 0]);

		await library.toggleFavourite(beta);
		await library.createGroup("Clients");

		expect([library.favouriteCount, library.groupCount]).toEqual([2, 1]);
	});

	it("a write that finishes after sign-out changes nothing", async () => {
		const { library } = await setup();

		const pending = library.toggleFavourite(beta);
		library.followUser(null);
		await pending;

		expect(library.favourites).toEqual([]);
	});
});
