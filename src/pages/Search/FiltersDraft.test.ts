import { describe, expect, it, vi } from "vitest";
import { FiltersDraft, type Filters } from "./FiltersDraft";

const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((r) => (resolve = r));
	return { promise, resolve };
};

const setup = (applied: Filters = { statusFilter: "registered", sectorFilter: "L" }) => {
	const apply = vi.fn();
	const count = vi.fn<(filters: Filters, signal: AbortSignal) => Promise<number> | null>(() => null);
	const draft = new FiltersDraft({ applied: () => applied, apply, count });
	return { draft, apply, count };
};

describe("FiltersDraft", () => {
	it("opens on the filters the search has applied", () => {
		const { draft } = setup();

		draft.open();

		expect(draft.isOpen).toBe(true);
		expect(draft.statusFilter).toBe("registered");
		expect(draft.sectorFilter).toBe("L");
	});

	it("keeps choices to itself until they are applied, then applies them and closes", () => {
		const { draft, apply } = setup();
		draft.open();

		draft.chooseStatus("dissolved");
		draft.chooseSector("F");
		expect(apply).not.toHaveBeenCalled();

		draft.apply();

		expect(apply).toHaveBeenCalledWith({ statusFilter: "dissolved", sectorFilter: "F" });
		expect(draft.isOpen).toBe(false);
	});

	it("drops its choices when closed without applying them", () => {
		const { draft, apply } = setup();
		draft.open();
		draft.chooseSector("F");

		draft.close();
		draft.open();

		expect(apply).not.toHaveBeenCalled();
		expect(draft.sectorFilter).toBe("L");
	});

	it("resets its choices, not the search's, to any status and any sector", () => {
		const { draft, apply } = setup();
		draft.open();

		draft.reset();

		expect([draft.statusFilter, draft.sectorFilter]).toEqual(["all", "all"]);
		expect(draft.isOpen).toBe(true);
		expect(apply).not.toHaveBeenCalled();
	});

	it("says how many companies its choices would show, once counted", async () => {
		const { draft, count } = setup();
		const counted = deferred<number>();
		count.mockReturnValue(counted.promise);

		draft.open();
		expect(count).toHaveBeenLastCalledWith({ statusFilter: "registered", sectorFilter: "L" }, expect.any(AbortSignal));
		expect(draft.showText).toBe("Show results");

		counted.resolve(4);
		await counted.promise;
		expect(draft.showText).toBe("Show 4 companies");
	});

	it("counts one company in the singular", async () => {
		const { draft, count } = setup();
		count.mockResolvedValue(1);

		draft.open();
		await vi.waitFor(() => expect(draft.showText).toBe("Show 1 company"));
	});

	it("says Show results when there is nothing to count", () => {
		const { draft } = setup();

		draft.open();

		expect(draft.showText).toBe("Show results");
	});

	it("counts each new choice, and an earlier count that comes late is not shown", async () => {
		const { draft, count } = setup();
		const first = deferred<number>();
		const second = deferred<number>();
		count.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

		draft.open();
		draft.chooseSector("F");
		const firstSignal = count.mock.calls[0][1];
		expect(count).toHaveBeenLastCalledWith({ statusFilter: "registered", sectorFilter: "F" }, expect.any(AbortSignal));
		expect(firstSignal.aborted).toBe(true);

		second.resolve(2);
		await second.promise;
		first.resolve(300);
		await first.promise;

		expect(draft.showText).toBe("Show 2 companies");
	});
});
