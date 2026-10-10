import { describe, expect, it } from "vitest";
import {
	checkLine,
	dayText,
	Tracking,
	type TrackedDetails,
	type TrackedOrganisation,
	type TrackingContents,
	type TrackingPort,
} from "./Tracking";

const flush = async () => {
	for (let i = 0; i < 20; i++) await Promise.resolve();
};

const blueworth = { organisationTypeCode: "C", registrationNo: "382116", organisationName: "BLUEWORTH LTD" };
const sweets = { organisationTypeCode: "B", registrationNo: "60580", organisationName: "2 ALPHA SWEETS" };
const adminico = { organisationTypeCode: "C", registrationNo: "60580", organisationName: "ADMINICO LTD" };

const tracked = (
	organisation: typeof blueworth,
	different: Partial<TrackedOrganisation> = {}
): TrackedOrganisation => ({
	organisationTypeCode: organisation.organisationTypeCode,
	registrationNo: organisation.registrationNo,
	organisationName: organisation.organisationName,
	organisationType: "Εταιρεία",
	startedAt: "2026-10-09T12:00:00+00:00",
	paused: false,
	firstCheckInProgress: false,
	lastCheckedAt: "2026-10-09T01:30:00+00:00",
	checksFailing: false,
	latestChange: null,
	...different,
});

const detailsOf = (organisation: typeof blueworth, different: Partial<TrackedDetails> = {}): TrackedDetails => ({
	organisationTypeCode: organisation.organisationTypeCode,
	registrationNo: organisation.registrationNo,
	startedAt: "2026-10-09T12:00:00+00:00",
	firstCheckInProgress: false,
	lastCheckedAt: "2026-10-09T01:30:00+00:00",
	checksFailing: false,
	fileLastUpdated: "2023-12-16",
	pendingServices: [],
	filings: [{ service: "ΗΕ32", applicationNumber: "3984792", form: "XACC", date: "2023-12-31" }],
	changes: [],
	...different,
});

/** A user's tracking on Free, as the backend sends it. */
function free(different: Partial<TrackingContents> = {}): TrackingContents {
	return {
		plan: "free",
		slots: 1,
		slotsUsed: 0,
		swapsAMonth: 0,
		swapsLeft: 0,
		freeChoiceOpen: false,
		organisations: [],
		untracked: [],
		...different,
	};
}

/** The same on Basic: five slots and, as on Free, no swaps. */
const basic = (different: Partial<TrackingContents> = {}): TrackingContents =>
	free({ plan: "basic", slots: 5, ...different });

/** The same on Starter. */
const starter = (different: Partial<TrackingContents> = {}): TrackingContents =>
	free({ plan: "starter", slots: 25, swapsAMonth: 5, swapsLeft: 5, ...different });

const keyOf = (organisation: typeof blueworth) => ({
	organisationTypeCode: organisation.organisationTypeCode,
	registrationNo: organisation.registrationNo,
});

const NOTHING: TrackingContents = free();

/** The backend's tracking routes in memory, one user at a time, recording the calls. */
function fakeBackend(initial: Record<string, TrackingContents> = {}) {
	const backend = {
		user: null as string | null,
		calls: [] as string[],
		failing: false,
		contents: structuredClone(initial) as Record<string, TrackingContents>,
		details: {} as Record<string, TrackedDetails>,
		/** The waits the tracking asked for and has not been given yet. */
		waits: [] as (() => void)[],
	};
	const id = (key: { organisationTypeCode: string; registrationNo: string }) =>
		`${key.organisationTypeCode}/${key.registrationNo}`;
	const call = (name: string) => {
		backend.calls.push(name);
		if (backend.failing) throw new Error("backend down");
	};
	const port: TrackingPort = {
		load: async () => {
			call("load");
			return structuredClone((backend.contents[backend.user!] ??= structuredClone(NOTHING)));
		},
		track: async (key) => call(`track ${id(key)}`),
		untrack: async (key) => call(`untrack ${id(key)}`),
		activate: async (key, inPlaceOf) =>
			call(`activate ${id(key)}${inPlaceOf ? ` in place of ${id(inPlaceOf)}` : ""}`),
		details: async (key) => {
			call(`details ${id(key)}`);
			const found = backend.details[id(key)];
			if (!found) throw new Error("not tracked");
			return structuredClone(found);
		},
	};
	const wait = () => new Promise<void>((resolve) => backend.waits.push(resolve));
	/** Lets the time the tracking is waiting for pass. */
	const tick = async () => {
		backend.waits.shift()?.();
		await flush();
	};
	return { backend, port, wait, tick };
}

async function setup(initial: TrackingContents = NOTHING) {
	const { backend, port, wait, tick } = fakeBackend({ maria: initial });
	const tracking = new Tracking(port, { wait, maximumPolls: 3 });
	backend.user = "maria";
	tracking.followUser("maria");
	await flush();
	backend.calls.length = 0;
	return { tracking, backend, tick };
}

describe("Tracking", () => {
	describe("following the user", () => {
		it("is empty and idle before anyone signs in", () => {
			const { port, backend } = fakeBackend();
			const tracking = new Tracking(port);

			expect(tracking.status).toBe("idle");
			expect(tracking.organisations).toEqual([]);
			expect(tracking.availability(blueworth)).toBe("unknown");
			expect(backend.calls).toEqual([]);
		});

		it("loads when a user signs in", async () => {
			const { tracking } = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			expect(tracking.status).toBe("loaded");
			expect(tracking.organisations.map((o) => o.organisationName)).toEqual(["BLUEWORTH LTD"]);
			expect(tracking.slotsText).toBe("1 of 1");
		});

		it("clears when the user signs out, and loads the next user's own", async () => {
			const { tracking, backend } = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			tracking.followUser(null);
			expect(tracking.organisations).toEqual([]);
			expect(tracking.status).toBe("idle");

			backend.user = "nikos";
			tracking.followUser("nikos");
			await flush();
			expect(tracking.organisations).toEqual([]);
			expect(tracking.slotsText).toBe("0 of 1");
		});

		it("says so when it could not load", async () => {
			const { port, backend } = fakeBackend();
			backend.failing = true;
			const tracking = new Tracking(port);

			tracking.followUser("maria");
			await flush();

			expect(tracking.status).toBe("error");
			expect(tracking.availability(blueworth)).toBe("unknown");
		});
	});

	describe("what can be done with an organisation", () => {
		it("can be tracked while the slot is unused", async () => {
			const { tracking } = await setup();

			expect(tracking.availability(blueworth)).toBe("available");
			expect(tracking.isTracked(blueworth)).toBe(false);
		});

		it("is tracked when it is the user's, whatever the case of its type code", async () => {
			const { tracking } = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			expect(tracking.availability({ organisationTypeCode: "c", registrationNo: " 382116 " })).toBe("tracked");
			expect(tracking.isTracked(blueworth)).toBe(true);
		});

		it("cannot be tracked once the slot is used, by another organisation or by one untracked since", async () => {
			const other = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));
			const untracked = await setup(free({ slotsUsed: 1, organisations: [] }));

			expect(other.tracking.availability(sweets)).toBe("no-slot");
			expect(untracked.tracking.availability(blueworth)).toBe("no-slot");
		});

		it("is unknown without a type code or a number", async () => {
			const { tracking } = await setup();

			expect(tracking.availability({ organisationTypeCode: null, registrationNo: "382116" })).toBe("unknown");
		});
	});

	describe("track", () => {
		it("warns on Free that the one organisation cannot be changed", async () => {
			const { tracking } = await setup();

			expect(tracking.trackWarning(blueworth)).toBe(
				"This is your one free tracked organisation and can't be changed."
			);
		});

		it("tracks through the backend and shows the organisation with its first check in progress", async () => {
			const { tracking, backend } = await setup();

			const result = await tracking.track(blueworth);

			expect(result).toEqual({ ok: true });
			expect(backend.calls[0]).toBe("track C/382116");
			expect(tracking.isTracked(blueworth)).toBe(true);
			expect(tracking.slotsText).toBe("1 of 1");
			expect(tracking.organisations[0]).toMatchObject({
				organisationName: "BLUEWORTH LTD",
				firstCheckInProgress: true,
				lastCheckedAt: null,
			});
		});

		it("is busy while the request is on its way", async () => {
			const { tracking } = await setup();

			const pending = tracking.track(blueworth);
			expect(tracking.isBusy(blueworth)).toBe(true);
			expect(tracking.isBusy(sweets)).toBe(false);

			await pending;
			expect(tracking.isBusy(blueworth)).toBe(false);
		});

		it("changes nothing when the backend refuses, and says why", async () => {
			const { tracking, backend } = await setup();
			backend.failing = true;

			const result = await tracking.track(blueworth);

			expect(result).toEqual({ ok: false, message: "backend down" });
			expect(tracking.isTracked(blueworth)).toBe(false);
			expect(tracking.slotsText).toBe("0 of 1");
		});

		it("does not ask the backend when the slot is used", async () => {
			const { tracking, backend } = await setup(free({ slotsUsed: 1, organisations: [] }));

			const result = await tracking.track(blueworth);

			expect(result.ok).toBe(false);
			expect(backend.calls).toEqual([]);
		});

		it("refuses when nobody is signed in", async () => {
			const { port, backend } = fakeBackend();
			const tracking = new Tracking(port);

			const result = await tracking.track(blueworth);

			expect(result.ok).toBe(false);
			expect(backend.calls).toEqual([]);
		});
	});

	describe("untrack", () => {
		it("stops tracking through the backend and the slot stays used", async () => {
			const { tracking, backend } = await setup(starter({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			const result = await tracking.untrack(blueworth);

			expect(result).toEqual({ ok: true });
			expect(backend.calls).toEqual(["untrack C/382116"]);
			expect(tracking.organisations).toEqual([]);
			expect(tracking.slotsText).toBe("1 of 25");
			expect(tracking.availability(blueworth)).toBe("swap");
		});

		it("cannot untrack on Free, whose one organisation is permanent", async () => {
			const { tracking, backend } = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			const result = await tracking.untrack(blueworth);

			expect(tracking.untrackRefusal).toBe("Your one free tracked organisation can't be changed. Upgrade to swap.");
			expect(result).toEqual({ ok: false, message: tracking.untrackRefusal });
			expect(backend.calls).toEqual([]);
			expect(tracking.isTracked(blueworth)).toBe(true);
		});

		it("keeps the organisation when the backend fails", async () => {
			const { tracking, backend } = await setup(starter({ slotsUsed: 1, organisations: [tracked(blueworth)] }));
			backend.failing = true;

			const result = await tracking.untrack(blueworth);

			expect(result.ok).toBe(false);
			expect(tracking.isTracked(blueworth)).toBe(true);
		});
	});

	describe("an organisation's details", () => {
		it("has none for an organisation the user does not track, and does not ask", async () => {
			const { tracking, backend } = await setup();

			tracking.open(blueworth);
			await flush();

			expect(tracking.details).toEqual({ status: "not-tracked" });
			expect(backend.calls).toEqual([]);
		});

		it("loads them for a tracked organisation", async () => {
			const { tracking, backend } = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));
			backend.details["C/382116"] = detailsOf(blueworth);

			tracking.open(blueworth);
			expect(tracking.details).toEqual({ status: "loading" });
			await flush();

			expect(tracking.details).toEqual({ status: "loaded", details: detailsOf(blueworth) });
		});

		it("loads them once the user's tracked organisations have loaded", async () => {
			const { port, backend } = fakeBackend({
				maria: free({ slotsUsed: 1, organisations: [tracked(blueworth)] }),
			});
			backend.user = "maria";
			backend.details["C/382116"] = detailsOf(blueworth);
			const tracking = new Tracking(port);

			tracking.open(blueworth);
			tracking.followUser("maria");
			await flush();

			expect(tracking.details.status).toBe("loaded");
		});

		it("says so when they could not load", async () => {
			const { tracking } = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			tracking.open(blueworth);
			await flush();

			expect(tracking.details).toEqual({ status: "error" });
		});

		it("shows them as soon as the organisation is tracked, and drops them when it is untracked", async () => {
			const { tracking, backend } = await setup(starter());
			backend.details["C/382116"] = detailsOf(blueworth, { firstCheckInProgress: true, lastCheckedAt: null });
			tracking.open(blueworth);

			await tracking.track(blueworth);
			await flush();
			expect(tracking.details).toMatchObject({ status: "loaded", details: { firstCheckInProgress: true } });

			await tracking.untrack(blueworth);
			expect(tracking.details).toEqual({ status: "not-tracked" });
		});

		it("drops them when the page is left", async () => {
			const { tracking, backend } = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));
			backend.details["C/382116"] = detailsOf(blueworth);
			tracking.open(blueworth);
			await flush();

			tracking.close();

			expect(tracking.details).toEqual({ status: "not-tracked" });
		});
	});

	describe("waiting for the first check", () => {
		const waiting = free({ slotsUsed: 1, organisations: [tracked(blueworth, { firstCheckInProgress: true, lastCheckedAt: null })] });

		it("looks again until the first check is done, then stops", async () => {
			const { tracking, backend, tick } = await setup(waiting);
			backend.details["C/382116"] = detailsOf(blueworth, { firstCheckInProgress: true, lastCheckedAt: null });
			tracking.open(blueworth);
			const stop = tracking.watch();
			await flush();
			backend.calls.length = 0;

			await tick();
			expect(backend.calls).toEqual(["load", "details C/382116"]);
			expect(tracking.organisations[0].firstCheckInProgress).toBe(true);

			backend.contents.maria = free({ slotsUsed: 1, organisations: [tracked(blueworth)] });
			backend.details["C/382116"] = detailsOf(blueworth);
			await tick();

			expect(tracking.organisations[0].firstCheckInProgress).toBe(false);
			expect(tracking.details).toEqual({ status: "loaded", details: detailsOf(blueworth) });
			expect(backend.waits).toEqual([]);
			stop();
		});

		it("does not look again when nothing is waiting for its first check", async () => {
			const { tracking, backend } = await setup(free({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			tracking.watch();
			await flush();

			expect(backend.waits).toEqual([]);
			expect(backend.calls).toEqual([]);
		});

		it("does not look again when no page is showing it", async () => {
			const { backend } = await setup(waiting);

			expect(backend.waits).toEqual([]);
		});

		it("stops looking when the page is left", async () => {
			const { tracking, backend, tick } = await setup(waiting);
			const stop = tracking.watch();
			await flush();

			stop();
			await tick();

			expect(backend.calls).toEqual([]);
			expect(backend.waits).toEqual([]);
		});

		it("gives up after a while", async () => {
			const { tracking, backend, tick } = await setup(waiting);
			tracking.watch();
			await flush();

			for (let i = 0; i < 5; i++) await tick();

			expect(backend.calls).toEqual(["load", "load", "load"]);
			expect(backend.waits).toEqual([]);
		});

		it("starts looking when an organisation is tracked on a page that is showing it", async () => {
			const { tracking, backend, tick } = await setup();
			tracking.watch();

			await tracking.track(blueworth);
			await flush();
			backend.contents.maria = free({ slotsUsed: 1, organisations: [tracked(blueworth)] });
			backend.calls.length = 0;
			await tick();

			expect(backend.calls).toEqual(["load"]);
			expect(tracking.organisations[0].firstCheckInProgress).toBe(false);
		});

		it("keeps what it has when looking again fails", async () => {
			const { tracking, backend, tick } = await setup(waiting);
			tracking.watch();
			await flush();
			backend.failing = true;

			await tick();

			expect(tracking.status).toBe("loaded");
			expect(tracking.organisations).toHaveLength(1);
		});
	});

	describe("on a paid plan", () => {
		it("shows the plan, its slots and the swaps left this month", async () => {
			const { tracking } = await setup(starter({ slotsUsed: 3, swapsLeft: 4, organisations: [tracked(blueworth)] }));

			expect(tracking.plan).toBe("starter");
			expect(tracking.slotsText).toBe("3 of 25");
			expect(tracking.swapsText).toBe("4 of 5 swaps left this month");
		});

		it("has no swaps to show on Free", async () => {
			const { tracking } = await setup();

			expect(tracking.plan).toBe("free");
			expect(tracking.swapsText).toBeNull();
		});

		it("tracks into a slot never used without a warning, and it is not a swap", async () => {
			const { tracking } = await setup(starter({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			expect(tracking.availability(sweets)).toBe("available");
			expect(tracking.trackWarning(sweets)).toBeNull();

			await tracking.track(sweets);

			expect(tracking.slotsText).toBe("2 of 25");
			expect(tracking.swapsText).toBe("5 of 5 swaps left this month");
		});

		it("warns that tracking again an organisation the user untracked is a swap, and counts it", async () => {
			const { tracking } = await setup(
				starter({ slotsUsed: 2, swapsLeft: 2, organisations: [tracked(blueworth)], untracked: [keyOf(sweets)] })
			);

			expect(tracking.availability(sweets)).toBe("swap");
			expect(tracking.trackWarning(sweets)).toBe("This uses 1 of your 2 swaps left this month.");

			await tracking.track(sweets);

			expect(tracking.isTracked(sweets)).toBe(true);
			expect(tracking.slotsText).toBe("2 of 25");
			expect(tracking.swapsText).toBe("1 of 5 swaps left this month");
			// Its slot is no longer one to swap into.
			expect(tracking.availability(adminico)).toBe("available");
		});

		it("warns when it is the last swap of the month", async () => {
			const { tracking } = await setup(starter({ slotsUsed: 1, swapsLeft: 1, untracked: [keyOf(sweets)] }));

			expect(tracking.trackWarning(sweets)).toBe("This uses your last swap this month.");
		});

		it("swaps another organisation into an untracked slot once every slot is used", async () => {
			const { tracking } = await setup(starter({ slotsUsed: 25, swapsLeft: 3, untracked: [keyOf(sweets)] }));

			expect(tracking.availability(adminico)).toBe("swap");

			await tracking.track(adminico);

			expect(tracking.swapsText).toBe("2 of 5 swaps left this month");
			// The one untracked slot now holds it: there is none left to swap into.
			expect(tracking.availability(blueworth)).toBe("no-slot");
			expect(tracking.refusal(blueworth)).toBe("All 25 slots of your plan are in use.");
		});

		it("refuses a swap when the month's swaps are spent, without asking the backend", async () => {
			const { tracking, backend } = await setup(starter({ slotsUsed: 25, swapsLeft: 0, untracked: [keyOf(sweets)] }));

			const result = await tracking.track(sweets);

			expect(tracking.availability(sweets)).toBe("no-swap");
			expect(result).toEqual({ ok: false, message: "You have no swaps left this month." });
			expect(backend.calls).toEqual([]);
		});

		it("warns that an untracked organisation's slot stays used, and remembers it as untracked", async () => {
			const { tracking } = await setup(starter({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			expect(tracking.untrackRefusal).toBeNull();
			expect(tracking.untrackWarning).toBe(
				"Its slot stays used: tracking this organisation again, or another in its slot, uses a swap."
			);

			await tracking.untrack(blueworth);

			expect(tracking.availability(blueworth)).toBe("swap");
		});
	});

	describe("on a paid plan with no swaps", () => {
		it("warns that tracking uses a slot for good", async () => {
			const { tracking } = await setup(basic({ slotsUsed: 3, organisations: [tracked(blueworth)] }));

			expect(tracking.availability(sweets)).toBe("available");
			expect(tracking.trackWarning(sweets)).toBe(
				"This uses 1 of your 2 unused slots for good: your plan has no swaps."
			);
			expect(tracking.swapsText).toBeNull();
		});

		it("warns that it is the last unused slot", async () => {
			const { tracking } = await setup(basic({ slotsUsed: 4 }));

			expect(tracking.trackWarning(sweets)).toBe("This uses your last unused slot for good: your plan has no swaps.");
		});

		it("cannot track again an organisation the user untracked, nor another once every slot is used", async () => {
			const { tracking, backend } = await setup(
				basic({ slotsUsed: 5, organisations: [tracked(blueworth)], untracked: [keyOf(sweets)] })
			);

			expect(tracking.availability(sweets)).toBe("no-slot");
			expect(tracking.availability(adminico)).toBe("no-slot");
			expect(tracking.refusal(adminico)).toBe(
				"All 5 slots of your plan are used, and it has no swaps. Upgrade to track more."
			);
			expect((await tracking.track(adminico)).ok).toBe(false);
			expect(backend.calls).toEqual([]);
		});

		it("cannot track again an organisation the user untracked even with slots never used", async () => {
			const { tracking } = await setup(basic({ slotsUsed: 2, untracked: [keyOf(sweets)] }));

			expect(tracking.availability(sweets)).toBe("no-slot");
			expect(tracking.refusal(sweets)).toBe(
				"Your plan has no swaps, so an organisation you stopped tracking can't be tracked again. Upgrade to swap."
			);
			expect(tracking.availability(adminico)).toBe("available");
		});

		it("cannot untrack: a tracked organisation is permanent", async () => {
			const { tracking, backend } = await setup(basic({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			const result = await tracking.untrack(blueworth);

			expect(tracking.untrackRefusal).toBe(
				"Your plan has no swaps, so a tracked organisation can't be changed. Upgrade to swap."
			);
			expect(result).toEqual({ ok: false, message: tracking.untrackRefusal });
			expect(backend.calls).toEqual([]);
			expect(tracking.isTracked(blueworth)).toBe(true);
		});

		it("says only to upgrade while organisations are paused, as none can be untracked", async () => {
			const { tracking } = await setup(
				basic({
					slotsUsed: 6,
					organisations: [tracked(blueworth), tracked(sweets, { paused: true, startedAt: "2026-10-10T12:00:00+00:00" })],
				})
			);

			expect(tracking.refusal(adminico)).toBe("You are over your plan's 5 slots. Upgrade to track more.");
		});
	});

	describe("paused organisations", () => {
		const paused = (organisation: typeof blueworth, startedAt: string) =>
			tracked(organisation, { paused: true, startedAt });

		it("lists active and paused organisations apart", async () => {
			const { tracking } = await setup(
				free({ slotsUsed: 2, organisations: [tracked(blueworth), paused(sweets, "2026-10-10T12:00:00+00:00")] })
			);

			expect(tracking.activeOrganisations.map((o) => o.organisationName)).toEqual(["BLUEWORTH LTD"]);
			expect(tracking.pausedOrganisations.map((o) => o.organisationName)).toEqual(["2 ALPHA SWEETS"]);
			// Paused is still tracked.
			expect(tracking.isTracked(sweets)).toBe(true);
		});

		it("cannot track another while organisations are paused, and says to upgrade", async () => {
			const onFree = await setup(
				free({ slotsUsed: 2, organisations: [tracked(blueworth), paused(sweets, "2026-10-10T12:00:00+00:00")] })
			);
			const onStarter = await setup(
				starter({ slotsUsed: 27, organisations: [tracked(blueworth), paused(sweets, "2026-10-10T12:00:00+00:00")] })
			);

			expect(onFree.tracking.availability(adminico)).toBe("no-slot");
			expect(onFree.tracking.refusal(adminico)).toBe("Free keeps one tracked organisation. Upgrade to track more.");
			expect(onStarter.tracking.availability(adminico)).toBe("no-slot");
			expect(onStarter.tracking.refusal(adminico)).toBe(
				"You are over your plan's 25 slots. Upgrade, or stop tracking an organisation, to make room."
			);
		});

		it("says a used free slot is used when nothing is paused", async () => {
			const { tracking } = await setup(free({ slotsUsed: 1 }));

			expect(tracking.refusal(blueworth)).toBe("Your one free tracked organisation is already used.");
			expect(tracking.refusal(null)).toBe("Your one free tracked organisation is already used.");
		});

		it("lets a user who came down to Free keep one paused organisation, once", async () => {
			const { tracking, backend } = await setup(
				free({
					slotsUsed: 2,
					freeChoiceOpen: true,
					organisations: [paused(blueworth, "2026-10-09T12:00:00+00:00"), paused(sweets, "2026-10-10T12:00:00+00:00")],
				})
			);

			expect(tracking.resumeOption(sweets)).toBe("keep-on-free");

			const result = await tracking.activate(sweets);

			expect(result).toEqual({ ok: true });
			expect(backend.calls).toEqual(["activate B/60580"]);
			expect(tracking.pausedOrganisations.map((o) => o.organisationName)).toEqual(["BLUEWORTH LTD"]);
			expect(tracking.resumeOption(blueworth)).toBe("upgrade");
		});

		it("lets a user who came down to Free tracking nothing track one organisation, with the warning", async () => {
			const { tracking } = await setup(free({ slotsUsed: 3, freeChoiceOpen: true }));

			expect(tracking.availability(blueworth)).toBe("available");
			expect(tracking.trackWarning(blueworth)).toBe("This is your one free tracked organisation and can't be changed.");

			await tracking.track(blueworth);

			expect(tracking.availability(sweets)).toBe("no-slot");
			expect(tracking.slotsText).toBe("3 of 1");
		});

		it("offers only an upgrade for a paused organisation on Free once one is kept", async () => {
			const { tracking, backend } = await setup(
				free({ slotsUsed: 2, organisations: [tracked(blueworth), paused(sweets, "2026-10-10T12:00:00+00:00")] })
			);

			const result = await tracking.activate(sweets);

			expect(tracking.resumeOption(sweets)).toBe("upgrade");
			expect(result.ok).toBe(false);
			expect(backend.calls).toEqual([]);
		});

		it("on a paid plan at its limit makes a paused organisation active in place of an active one", async () => {
			const { tracking, backend } = await setup(
				starter({
					slots: 1,
					slotsUsed: 2,
					organisations: [tracked(blueworth), paused(sweets, "2026-10-10T12:00:00+00:00")],
				})
			);

			expect(tracking.resumeOption(sweets)).toBe("in-place-of");
			expect((await tracking.activate(sweets)).ok).toBe(false);

			const result = await tracking.activate(sweets, blueworth);

			expect(result).toEqual({ ok: true });
			expect(backend.calls).toEqual(["activate B/60580 in place of C/382116"]);
			expect(tracking.activeOrganisations.map((o) => o.organisationName)).toEqual(["2 ALPHA SWEETS"]);
			expect(tracking.pausedOrganisations.map((o) => o.organisationName)).toEqual(["BLUEWORTH LTD"]);
		});

		it("has nothing to resume for an organisation that is not paused", async () => {
			const { tracking } = await setup(starter({ slotsUsed: 1, organisations: [tracked(blueworth)] }));

			expect(tracking.resumeOption(blueworth)).toBeNull();
		});

		it("keeps an organisation paused when the backend refuses", async () => {
			const { tracking, backend } = await setup(
				free({ slotsUsed: 1, freeChoiceOpen: true, organisations: [paused(sweets, "2026-10-10T12:00:00+00:00")] })
			);
			backend.failing = true;

			const result = await tracking.activate(sweets);

			expect(result).toEqual({ ok: false, message: "backend down" });
			expect(tracking.pausedOrganisations).toHaveLength(1);
			expect(tracking.resumeOption(sweets)).toBe("keep-on-free");
		});

		it("resumes the oldest paused organisation when an active one is untracked on a paid plan", async () => {
			const { tracking } = await setup(
				starter({
					slots: 1,
					slotsUsed: 3,
					organisations: [
						tracked(blueworth),
						paused(sweets, "2026-10-11T12:00:00+00:00"),
						paused(adminico, "2026-10-10T12:00:00+00:00"),
					],
				})
			);

			await tracking.untrack(blueworth);

			expect(tracking.activeOrganisations.map((o) => o.organisationName)).toEqual(["ADMINICO LTD"]);
			expect(tracking.pausedOrganisations.map((o) => o.organisationName)).toEqual(["2 ALPHA SWEETS"]);
		});
	});

	describe("waiting for a plan to start", () => {
		it("looks again until the plan has changed, then stops", async () => {
			const { tracking, backend, tick } = await setup();

			tracking.expectPlanChange();
			await tick();
			expect(tracking.plan).toBe("free");

			backend.contents.maria = starter();
			await tick();
			expect(tracking.plan).toBe("starter");
			expect(tracking.slotsText).toBe("0 of 25");

			const calls = backend.calls.length;
			await tick();
			expect(backend.calls.length).toBe(calls);
		});

		it("gives up after a while", async () => {
			const { tracking, backend, tick } = await setup();

			tracking.expectPlanChange();
			for (let i = 0; i < 10; i++) await tick();

			expect(backend.calls).toEqual(["load", "load", "load"]);
			expect(tracking.plan).toBe("free");
		});
	});

	describe("what a check says", () => {
		it("is in progress until the first check is done", () => {
			expect(checkLine({ firstCheckInProgress: true, checksFailing: false, lastCheckedAt: null })).toBe(
				"First check in progress"
			);
		});

		it("says when it was last checked once checks are failing", () => {
			expect(
				checkLine({ firstCheckInProgress: false, checksFailing: true, lastCheckedAt: "2026-10-06T01:30:00+00:00" })
			).toBe("Last checked on October 6, 2026");
		});

		it("says the registry could not be read when it never has been", () => {
			expect(checkLine({ firstCheckInProgress: true, checksFailing: true, lastCheckedAt: null })).toBe(
				"Not checked yet: the registry could not be read"
			);
		});

		it("says nothing while checks are going well", () => {
			expect(
				checkLine({ firstCheckInProgress: false, checksFailing: false, lastCheckedAt: "2026-10-09T01:30:00+00:00" })
			).toBeNull();
		});
	});

	describe("dates", () => {
		it("shows a registry date and a moment in time the same way", () => {
			expect(dayText("2023-12-16")).toBe("December 16, 2023");
			expect(dayText("2026-10-09T12:00:00+00:00")).toBe("October 9, 2026");
		});

		it("shows nothing for no date", () => {
			expect(dayText(null)).toBeNull();
			expect(dayText("not a date")).toBeNull();
		});
	});
});
