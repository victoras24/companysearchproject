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

const tracked = (
	organisation: typeof blueworth,
	different: Partial<TrackedOrganisation> = {}
): TrackedOrganisation => ({
	organisationTypeCode: organisation.organisationTypeCode,
	registrationNo: organisation.registrationNo,
	organisationName: organisation.organisationName,
	organisationType: "Εταιρεία",
	startedAt: "2026-10-09T12:00:00+00:00",
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

const NOTHING: TrackingContents = { slots: 1, slotsUsed: 0, organisations: [] };

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
			const { tracking } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });

			expect(tracking.status).toBe("loaded");
			expect(tracking.organisations.map((o) => o.organisationName)).toEqual(["BLUEWORTH LTD"]);
			expect(tracking.slotsText).toBe("1 of 1");
		});

		it("clears when the user signs out, and loads the next user's own", async () => {
			const { tracking, backend } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });

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
			const { tracking } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });

			expect(tracking.availability({ organisationTypeCode: "c", registrationNo: " 382116 " })).toBe("tracked");
			expect(tracking.isTracked(blueworth)).toBe(true);
		});

		it("cannot be tracked once the slot is used, by another organisation or by one untracked since", async () => {
			const other = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });
			const untracked = await setup({ slots: 1, slotsUsed: 1, organisations: [] });

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

			expect(tracking.trackWarning).toBe("This is your one free tracked organisation and can't be changed.");
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
			const { tracking, backend } = await setup({ slots: 1, slotsUsed: 1, organisations: [] });

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
			const { tracking, backend } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });

			const result = await tracking.untrack(blueworth);

			expect(result).toEqual({ ok: true });
			expect(backend.calls).toEqual(["untrack C/382116"]);
			expect(tracking.organisations).toEqual([]);
			expect(tracking.slotsText).toBe("1 of 1");
			expect(tracking.availability(blueworth)).toBe("no-slot");
		});

		it("warns on Free that the slot stays used", async () => {
			const { tracking } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });

			expect(tracking.untrackWarning).toBe(
				"Your one free tracked organisation stays used: you won't be able to track it again or track another."
			);
		});

		it("keeps the organisation when the backend fails", async () => {
			const { tracking, backend } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });
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
			const { tracking, backend } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });
			backend.details["C/382116"] = detailsOf(blueworth);

			tracking.open(blueworth);
			expect(tracking.details).toEqual({ status: "loading" });
			await flush();

			expect(tracking.details).toEqual({ status: "loaded", details: detailsOf(blueworth) });
		});

		it("loads them once the user's tracked organisations have loaded", async () => {
			const { port, backend } = fakeBackend({
				maria: { slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] },
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
			const { tracking } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });

			tracking.open(blueworth);
			await flush();

			expect(tracking.details).toEqual({ status: "error" });
		});

		it("shows them as soon as the organisation is tracked, and drops them when it is untracked", async () => {
			const { tracking, backend } = await setup();
			backend.details["C/382116"] = detailsOf(blueworth, { firstCheckInProgress: true, lastCheckedAt: null });
			tracking.open(blueworth);

			await tracking.track(blueworth);
			await flush();
			expect(tracking.details).toMatchObject({ status: "loaded", details: { firstCheckInProgress: true } });

			await tracking.untrack(blueworth);
			expect(tracking.details).toEqual({ status: "not-tracked" });
		});

		it("drops them when the page is left", async () => {
			const { tracking, backend } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });
			backend.details["C/382116"] = detailsOf(blueworth);
			tracking.open(blueworth);
			await flush();

			tracking.close();

			expect(tracking.details).toEqual({ status: "not-tracked" });
		});
	});

	describe("waiting for the first check", () => {
		const waiting = { slots: 1, slotsUsed: 1, organisations: [tracked(blueworth, { firstCheckInProgress: true, lastCheckedAt: null })] };

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

			backend.contents.maria = { slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] };
			backend.details["C/382116"] = detailsOf(blueworth);
			await tick();

			expect(tracking.organisations[0].firstCheckInProgress).toBe(false);
			expect(tracking.details).toEqual({ status: "loaded", details: detailsOf(blueworth) });
			expect(backend.waits).toEqual([]);
			stop();
		});

		it("does not look again when nothing is waiting for its first check", async () => {
			const { tracking, backend } = await setup({ slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] });

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
			backend.contents.maria = { slots: 1, slotsUsed: 1, organisations: [tracked(blueworth)] };
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
