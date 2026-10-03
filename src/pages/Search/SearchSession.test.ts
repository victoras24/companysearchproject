import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ICompany, IOfficials } from "@/gEntities";
import {
	DEBOUNCE_MS,
	OFFICIAL_RESULT_CAP,
	PAGE_SIZE,
	SearchSession,
	type SearchFn,
} from "./SearchSession";

type SearchRequest = Parameters<SearchFn>[0];
type SearchResult = Awaited<ReturnType<SearchFn>>;

const company = (n: number): ICompany => ({
	id: n,
	organisationName: `Company ${n}`,
	organisationStatus: "Εγγεγραμμένη",
	addressSeqNo: n,
	registrationDate: "2020-01-01",
	registrationNo: `HE${n}`,
});

const official = (n: number): IOfficials => ({
	organisationName: `Company ${n}`,
	registrationNo: `HE${n}`,
	organisationTypeCode: "C",
	organisationType: "Company",
	personOrOrganisationName: `Person ${n}`,
	officialPosition: "Director",
});

const companies = (count: number) =>
	Array.from({ length: count }, (_, i) => company(i + 1));

const flush = async () => {
	for (let i = 0; i < 5; i++) await Promise.resolve();
};

/**
 * In-memory adapter for the session's two ports. Requests stay pending until
 * the test answers them; navigations are recorded and, like the router,
 * fed back to the session as a URL change.
 */
function setup(options: { router?: boolean } = {}) {
	const router = options.router ?? true;
	const requests: Array<{
		request: SearchRequest;
		resolve: (result: SearchResult) => void;
		reject: (error: unknown) => void;
	}> = [];
	const navigations: Array<{ search: string; replace: boolean }> = [];

	const session: SearchSession = new SearchSession({
		search: (request) =>
			new Promise((resolve, reject) => {
				requests.push({ request, resolve, reject });
			}),
		navigate: (search, { replace }) => {
			navigations.push({ search, replace });
			if (router) session.urlChanged(search);
		},
	});

	const respond = async (index: number, result: SearchResult) => {
		requests[index].resolve(result);
		await flush();
	};
	const fail = async (index: number, error: unknown = new Error("boom")) => {
		requests[index].reject(error);
		await flush();
	};
	const type = (text: string) => {
		session.typeQuery(text);
		vi.advanceTimersByTime(DEBOUNCE_MS);
	};

	return { session, requests, navigations, respond, fail, type };
}

const pagerOf = (session: SearchSession) => {
	const view = session.view;
	if (view.status !== "results" || view.entityType !== "organisation") {
		throw new Error(`expected organisation results, got ${view.status}`);
	}
	return view.pager;
};

const numbersOf = (session: SearchSession) =>
	pagerOf(session)?.pages.map((page) =>
		page === "gap" ? "gap" : page.number
	);

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("URL to state", () => {
	it("starts idle with defaults", () => {
		const { session, requests } = setup();
		session.urlChanged("");

		expect(session.draft).toBe("");
		expect(session.entityType).toBe("organisation");
		expect(session.statusFilter).toBe("all");
		expect(session.view).toEqual({ status: "idle" });
		expect(requests).toHaveLength(0);
	});

	it("reads every parameter and searches at once", () => {
		const { session, requests } = setup();
		session.urlChanged("?q=alpha&status=dissolved&page=3");

		expect(session.draft).toBe("alpha");
		expect(session.statusFilter).toBe("dissolved");
		expect(session.view).toEqual({ status: "loading" });
		expect(requests).toHaveLength(1);
		expect(requests[0].request).toMatchObject({
			entityType: "organisation",
			query: "alpha",
			statusFilter: "dissolved",
			page: 3,
			pageSize: PAGE_SIZE,
		});
	});

	it.each([
		["?q=alpha&page=abc", 1],
		["?q=alpha&page=0", 1],
		["?q=alpha&page=-2", 1],
		["?q=alpha&page=2.5", 1],
	])("falls back to page 1 for %s", (search, page) => {
		const { session, requests, navigations } = setup();
		session.urlChanged(search);

		expect(requests[0].request.page).toBe(page);
		expect(navigations).toHaveLength(0);
	});

	it("falls back to defaults for an unknown status or type", () => {
		const { session, requests, navigations } = setup();
		session.urlChanged("?q=alpha&status=foo&type=foo");

		expect(session.statusFilter).toBe("all");
		expect(session.entityType).toBe("organisation");
		expect(requests[0].request).toMatchObject({
			entityType: "organisation",
			statusFilter: "all",
		});
		expect(navigations).toHaveLength(0);
	});

	it.each(["registered", "at-risk", "in-liquidation", "dissolved"] as const)(
		"reads and writes the %s status group",
		(group) => {
			const { session, requests, navigations } = setup();
			session.urlChanged(`?q=alpha&status=${group}`);

			expect(session.statusFilter).toBe(group);
			expect(requests[0].request).toMatchObject({ statusFilter: group });

			session.selectStatusFilter("all");
			session.selectStatusFilter(group);
			expect(navigations.at(-1)).toEqual({
				search: `?q=alpha&status=${group}`,
				replace: false,
			});
		}
	);

	it("opens an old active link as registered", () => {
		const { session, requests } = setup();
		session.urlChanged("?q=alpha&status=active");

		expect(session.statusFilter).toBe("registered");
		expect(requests[0].request).toMatchObject({ statusFilter: "registered" });
	});

	it.each(["inactive", "unknown"])(
		"opens an old or unfilterable %s link as all",
		(status) => {
			const { session, requests } = setup();
			session.urlChanged(`?q=alpha&status=${status}`);

			expect(session.statusFilter).toBe("all");
			expect(requests[0].request).toMatchObject({ statusFilter: "all" });
		}
	);

	it("does not read the old filter parameter", () => {
		const { session } = setup();
		session.urlChanged("?q=alpha&filter=Official");

		expect(session.entityType).toBe("organisation");
	});

	it("ignores status filter and page for officials", () => {
		const { session, requests } = setup();
		session.urlChanged("?q=alpha&type=official&status=registered&page=4");

		expect(session.entityType).toBe("official");
		expect(session.statusFilter).toBe("all");
		expect(requests[0].request).toMatchObject({
			entityType: "official",
			statusFilter: "all",
			page: 1,
		});
	});

	it("trims the query and treats a short one as too short", () => {
		const { session, requests } = setup();
		session.urlChanged("?q=%20ab%20");

		expect(session.view).toEqual({ status: "too-short" });
		expect(requests).toHaveLength(0);
	});

	it("does not search again when the same URL arrives twice", () => {
		const { session, requests } = setup();
		session.urlChanged("?q=alpha");
		session.urlChanged("?q=alpha");

		expect(requests).toHaveLength(1);
	});
});

describe("status", () => {
	it("shows results", async () => {
		const { session, respond } = setup();
		session.urlChanged("?q=alpha");
		await respond(0, { items: companies(3), total: 3 });

		expect(session.view).toEqual({
			status: "results",
			entityType: "organisation",
			items: companies(3),
			pager: null,
		});
	});

	it("shows empty with the query", async () => {
		const { session, respond } = setup();
		session.urlChanged("?q=alpha");
		await respond(0, { items: [], total: 0 });

		expect(session.view).toEqual({ status: "empty", query: "alpha" });
	});

	it("shows an error and clears the previous results", async () => {
		const { session, respond, fail } = setup();
		session.urlChanged("?q=alpha");
		await respond(0, { items: companies(3), total: 3 });
		session.urlChanged("?q=alpha&status=registered");
		await fail(1);

		expect(session.view).toEqual({ status: "error" });
	});

	it("retries the same request after an error", async () => {
		const { session, requests, respond, fail } = setup();
		session.urlChanged("?q=alpha&status=registered&page=2");
		await fail(0);
		session.retry();

		expect(session.view).toEqual({ status: "loading" });
		expect(requests).toHaveLength(2);
		expect(requests[1].request).toMatchObject({
			query: "alpha",
			statusFilter: "registered",
			page: 2,
		});

		await respond(1, { items: companies(2), total: 12 });
		expect(session.view.status).toBe("results");
	});

	it("replaces the list with loading while another page loads", async () => {
		const { session, respond } = setup();
		session.urlChanged("?q=alpha");
		await respond(0, { items: companies(10), total: 30 });
		session.urlChanged("?q=alpha&page=2");

		expect(session.view).toEqual({ status: "loading" });
	});

	it("reacts to the draft before the debounce settles", () => {
		const { session, requests } = setup();
		session.urlChanged("");

		session.typeQuery("a");
		expect(session.view).toEqual({ status: "too-short" });
		session.typeQuery("ab ");
		expect(session.view).toEqual({ status: "too-short" });
		session.typeQuery("abc");
		expect(session.view).toEqual({ status: "loading" });
		session.typeQuery("   ");
		expect(session.view).toEqual({ status: "idle" });
		expect(requests).toHaveLength(0);
	});
});

describe("typing and debounce", () => {
	it("fires one request for a burst of typing", () => {
		const { session, requests, navigations } = setup();
		session.urlChanged("");

		session.typeQuery("alp");
		vi.advanceTimersByTime(DEBOUNCE_MS - 1);
		session.typeQuery("alph");
		vi.advanceTimersByTime(DEBOUNCE_MS - 1);
		session.typeQuery("alpha");
		expect(requests).toHaveLength(0);
		vi.advanceTimersByTime(DEBOUNCE_MS);

		expect(navigations).toEqual([{ search: "?q=alpha", replace: true }]);
		expect(requests).toHaveLength(1);
		expect(requests[0].request.query).toBe("alpha");
	});

	it("writes a too-short draft to the URL without searching", () => {
		const { session, requests, navigations } = setup();
		session.urlChanged("");

		session.typeQuery("abc");
		session.typeQuery("ab");
		vi.advanceTimersByTime(DEBOUNCE_MS);

		expect(navigations).toEqual([{ search: "?q=ab", replace: true }]);
		expect(session.view).toEqual({ status: "too-short" });
		expect(requests).toHaveLength(0);
	});

	it("keeps the typed text, including a trailing space", () => {
		const { session, type } = setup();
		session.urlChanged("");
		type("alpha ");

		expect(session.draft).toBe("alpha ");
	});

	it("does not navigate when the trimmed draft is unchanged", () => {
		const { session, navigations, type } = setup();
		session.urlChanged("?q=alpha&page=2");
		type("alpha ");

		expect(navigations).toHaveLength(0);
	});

	it("keeps a keystroke typed before its own navigation comes back", () => {
		const { session, navigations } = setup({ router: false });
		session.urlChanged("");

		session.typeQuery("alpha");
		vi.advanceTimersByTime(DEBOUNCE_MS);
		session.typeQuery("alphab");
		session.urlChanged(navigations[0].search);

		expect(session.draft).toBe("alphab");
	});

	it("takes the query from the URL on Back and drops the pending draft", () => {
		const { session, navigations, requests } = setup();
		session.urlChanged("?q=alpha");

		session.typeQuery("alphabet");
		session.urlChanged("?q=beta");
		vi.advanceTimersByTime(DEBOUNCE_MS);

		expect(session.draft).toBe("beta");
		expect(navigations).toHaveLength(0);
		expect(requests.at(-1)?.request.query).toBe("beta");
	});

	it("clears the query at once", async () => {
		const { session, navigations, requests, respond } = setup();
		session.urlChanged("?q=alpha&status=registered&page=2");
		await respond(0, { items: companies(2), total: 12 });

		session.clearQuery();

		expect(session.draft).toBe("");
		expect(session.view).toEqual({ status: "idle" });
		expect(navigations).toEqual([
			{ search: "?status=registered", replace: true },
		]);
		expect(requests).toHaveLength(1);
	});
});

describe("latest request wins", () => {
	it("aborts the request in flight when a new one starts", () => {
		const { session, requests } = setup();
		session.urlChanged("?q=alpha");
		session.urlChanged("?q=alphabet");

		expect(requests[0].request.signal.aborted).toBe(true);
		expect(requests[1].request.signal.aborted).toBe(false);
	});

	it("ignores an older response that resolves last", async () => {
		const { session, respond } = setup();
		session.urlChanged("?q=alpha");
		session.urlChanged("?q=alphabet");

		await respond(1, { items: [company(2)], total: 1 });
		await respond(0, { items: [company(1)], total: 1 });

		expect(session.view).toMatchObject({
			status: "results",
			items: [company(2)],
		});
	});

	it("keeps loading when an older response resolves first", async () => {
		const { session, respond } = setup();
		session.urlChanged("?q=alpha");
		session.urlChanged("?q=alphabet");

		await respond(0, { items: [company(1)], total: 1 });

		expect(session.view).toEqual({ status: "loading" });
	});

	it("does not treat an aborted request as an error", async () => {
		const { session, fail } = setup();
		session.urlChanged("?q=alpha");
		session.urlChanged("?q=alphabet");

		await fail(0, new DOMException("Aborted", "AbortError"));

		expect(session.view).toEqual({ status: "loading" });
	});

	it("aborts the request when the query becomes too short", () => {
		const { session, requests } = setup();
		session.urlChanged("?q=alpha");
		session.urlChanged("?q=al");

		expect(requests[0].request.signal.aborted).toBe(true);
	});
});

describe("reset rules", () => {
	it("resets the page for a new query and keeps the rest", () => {
		const { session, navigations, type } = setup();
		session.urlChanged("?q=alpha&status=registered&page=3");
		type("beta");

		expect(navigations).toEqual([
			{ search: "?q=beta&status=registered", replace: true },
		]);
	});

	it("resets the page when the status filter changes", () => {
		const { session, navigations } = setup();
		session.urlChanged("?q=alpha&page=3");
		session.selectStatusFilter("dissolved");

		expect(navigations).toEqual([
			{ search: "?q=alpha&status=dissolved", replace: false },
		]);
		expect(session.statusFilter).toBe("dissolved");
	});

	it("omits the status filter when it returns to all", () => {
		const { session, navigations } = setup();
		session.urlChanged("?q=alpha&status=dissolved&page=2");
		session.selectStatusFilter("all");

		expect(navigations).toEqual([{ search: "?q=alpha", replace: false }]);
	});

	it("resets page and status filter when the entity type changes", () => {
		const { session, navigations } = setup();
		session.urlChanged("?q=alpha&status=registered&page=3");
		session.selectEntityType("official");

		expect(navigations).toEqual([
			{ search: "?q=alpha&type=official", replace: false },
		]);
		expect(session.entityType).toBe("official");
		expect(session.statusFilter).toBe("all");
	});

	it("uses the pending draft as the query when a tab is chosen", () => {
		const { session, navigations, requests } = setup();
		session.urlChanged("?q=alpha");

		session.typeQuery("beta");
		session.selectStatusFilter("registered");
		vi.advanceTimersByTime(DEBOUNCE_MS);

		expect(navigations).toEqual([
			{ search: "?q=beta&status=registered", replace: false },
		]);
		expect(requests.at(-1)?.request).toMatchObject({
			query: "beta",
			statusFilter: "registered",
		});
	});

	it("navigates once when a tab is chosen twice before the URL changes", () => {
		const { session, navigations } = setup({ router: false });
		session.urlChanged("?q=alpha&page=3");

		session.selectStatusFilter("dissolved");
		session.selectStatusFilter("dissolved");

		expect(navigations).toHaveLength(1);
	});

	it("does nothing when the current tab is chosen again", () => {
		const { session, navigations } = setup();
		session.urlChanged("?q=alpha&status=registered");
		session.selectStatusFilter("registered");
		session.selectEntityType("organisation");

		expect(navigations).toHaveLength(0);
	});
});

describe("pager", () => {
	const load = async (search: string, total: number, onPage = PAGE_SIZE) => {
		const harness = setup();
		harness.session.urlChanged(search);
		await harness.respond(0, { items: companies(onPage), total });
		return harness;
	};

	it.each([
		[10, null],
		[11, [1, 2]],
		[20, [1, 2]],
		[21, [1, 2, 3]],
	])("has the right pages for a total of %i", async (total, pages) => {
		const { session } = await load("?q=alpha", total);

		expect(numbersOf(session) ?? null).toEqual(pages);
	});

	it("has no previous on the first page", async () => {
		const { session } = await load("?q=alpha", 200);
		const pager = pagerOf(session);

		expect(pager?.previous).toBeNull();
		expect(pager?.next).toBe("?q=alpha&page=2");
		expect(numbersOf(session)).toEqual([1, 2, "gap", 20]);
	});

	it("shows the current page with a neighbour each side", async () => {
		const { session } = await load("?q=alpha&page=5", 200);
		const pager = pagerOf(session);

		expect(numbersOf(session)).toEqual([1, "gap", 4, 5, 6, "gap", 20]);
		expect(pager?.previous).toBe("?q=alpha&page=4");
		expect(pager?.next).toBe("?q=alpha&page=6");
		expect(
			pager?.pages.filter((page) => page !== "gap" && page.current)
		).toEqual([{ number: 5, href: "?q=alpha&page=5", current: true }]);
	});

	it("has no next on the last page", async () => {
		const { session } = await load("?q=alpha&page=20", 200);
		const pager = pagerOf(session);

		expect(pager?.next).toBeNull();
		expect(pager?.previous).toBe("?q=alpha&page=19");
		expect(numbersOf(session)).toEqual([1, "gap", 19, 20]);
	});

	it("shows a page instead of a gap that would hide only one", async () => {
		const { session } = await load("?q=alpha&page=3", 50);

		expect(numbersOf(session)).toEqual([1, 2, 3, 4, 5]);
	});

	it("omits the page parameter in the link to page 1", async () => {
		const { session } = await load("?q=alpha&page=2", 30);

		expect(pagerOf(session)?.previous).toBe("?q=alpha");
	});

	it("keeps and encodes every parameter in its links", async () => {
		const query = "A&B #1 Λτδ";
		const search = `?${new URLSearchParams({ q: query, status: "dissolved" })}`;
		const first = await load(search, 30);
		const next = pagerOf(first.session)?.next ?? "";

		expect(new URLSearchParams(next).get("q")).toBe(query);
		expect(new URLSearchParams(next).get("status")).toBe("dissolved");
		expect(new URLSearchParams(next).get("page")).toBe("2");

		const second = setup();
		second.session.urlChanged(next);
		expect(second.requests[0].request).toMatchObject({
			query,
			statusFilter: "dissolved",
			page: 2,
		});
	});
});

describe("page past the end", () => {
	it("redirects to the last page", async () => {
		const { session, navigations, requests, respond } = setup();
		session.urlChanged("?q=alpha&status=registered&page=99");
		await respond(0, { items: [], total: 25 });

		expect(navigations).toEqual([
			{ search: "?q=alpha&status=registered&page=3", replace: true },
		]);
		expect(session.view).toEqual({ status: "loading" });
		expect(requests[1].request.page).toBe(3);
	});

	it("shows empty when there are no results at all", async () => {
		const { session, navigations, respond } = setup();
		session.urlChanged("?q=alpha&page=99");
		await respond(0, { items: [], total: 0 });

		expect(navigations).toHaveLength(0);
		expect(session.view).toEqual({ status: "empty", query: "alpha" });
	});
});

describe("officials", () => {
	const officials = (count: number) =>
		Array.from({ length: count }, (_, i) => official(i + 1));

	it("shows official results without a pager", async () => {
		const { session, respond } = setup();
		session.urlChanged("?q=alpha&type=official");
		await respond(0, { items: officials(2), total: 2 });

		expect(session.view).toEqual({
			status: "results",
			entityType: "official",
			items: officials(2),
			truncated: false,
			pager: null,
		});
	});

	it("marks results at the cap as possibly truncated", async () => {
		const { session, respond } = setup();
		session.urlChanged("?q=alpha&type=official");
		await respond(0, {
			items: officials(OFFICIAL_RESULT_CAP),
			total: OFFICIAL_RESULT_CAP,
		});

		expect(session.view).toMatchObject({
			status: "results",
			entityType: "official",
			truncated: true,
		});
	});
});

describe("dispose", () => {
	it("cancels the pending debounce and aborts the request in flight", () => {
		const { session, requests, navigations } = setup();
		session.urlChanged("?q=alpha");
		session.typeQuery("alphabet");

		session.dispose();
		vi.advanceTimersByTime(DEBOUNCE_MS);

		expect(requests[0].request.signal.aborted).toBe(true);
		expect(navigations).toHaveLength(0);
	});

	it("searches again when the same URL arrives after a dispose", async () => {
		const { session, requests, respond } = setup();
		session.urlChanged("?q=alpha");
		session.dispose();
		session.urlChanged("?q=alpha");
		await respond(1, { items: companies(1), total: 1 });

		expect(requests).toHaveLength(2);
		expect(session.view.status).toBe("results");
	});
});
