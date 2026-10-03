import { describe, expect, it } from "vitest";
import {
	OrganisationRecordLoader,
	type LookupFn,
	type OrganisationRecord,
} from "./OrganisationRecordLoader";

type LookupRequest = Parameters<LookupFn>[0];

const record = (typeCode: string, registrationNo: string): OrganisationRecord => ({
	organisation: {
		id: 1,
		organisationName: `Organisation ${typeCode}${registrationNo}`,
		registrationNo,
		registrationDate: "04/03/2019",
		organisationStatus: "Εγγεγραμμένη",
		addressSeqNo: 7,
		organisationTypeCode: typeCode,
		organisationType: "Εταιρεία",
	},
	address: { street: "Main 1", building: null, territory: "Nicosia" },
	officials: [],
});

const flush = async () => {
	for (let i = 0; i < 5; i++) await Promise.resolve();
};

/** In-memory lookup: requests stay pending until the test answers them. */
function setup() {
	const requests: Array<{
		request: LookupRequest;
		resolve: (result: OrganisationRecord | null) => void;
		reject: (error: unknown) => void;
	}> = [];

	const loader = new OrganisationRecordLoader({
		lookup: (request) =>
			new Promise((resolve, reject) => {
				requests.push({ request, resolve, reject });
			}),
	});

	const respond = async (index: number, result: OrganisationRecord | null) => {
		requests[index].resolve(result);
		await flush();
	};
	const fail = async (index: number, error: unknown = new Error("boom")) => {
		requests[index].reject(error);
		await flush();
	};

	return { loader, requests, respond, fail };
}

describe("OrganisationRecordLoader", () => {
	it("is loading, then loaded with the record", async () => {
		const { loader, requests, respond } = setup();

		loader.load("C", "60580");
		expect(loader.view).toEqual({ status: "loading" });
		expect(requests).toHaveLength(1);
		expect(requests[0].request).toMatchObject({ typeCode: "C", registrationNo: "60580" });

		await respond(0, record("C", "60580"));
		expect(loader.view).toEqual({ status: "loaded", record: record("C", "60580") });
	});

	it("is not found when the lookup finds nothing", async () => {
		const { loader, respond } = setup();

		loader.load("C", "99999999");
		await respond(0, null);

		expect(loader.view).toEqual({
			status: "not-found",
			typeCode: "C",
			registrationNo: "99999999",
		});
	});

	it("is an error when the lookup fails, and retry repeats the request", async () => {
		const { loader, requests, fail, respond } = setup();

		loader.load("B", "60580");
		await fail(0);
		expect(loader.view).toEqual({ status: "error" });

		loader.retry();
		expect(loader.view).toEqual({ status: "loading" });
		expect(requests).toHaveLength(2);
		expect(requests[1].request).toMatchObject({ typeCode: "B", registrationNo: "60580" });

		await respond(1, record("B", "60580"));
		expect(loader.view.status).toBe("loaded");
	});

	it.each([
		["CC", "1"],
		["", "1"],
		["1", "1"],
		["C", ""],
		["C", "  "],
	])("is not found without a request for %o / %o", (typeCode, registrationNo) => {
		const { loader, requests } = setup();

		loader.load(typeCode, registrationNo);

		expect(requests).toHaveLength(0);
		expect(loader.view).toEqual({ status: "not-found", typeCode, registrationNo });
	});

	it("upper-cases the type code", () => {
		const { loader, requests } = setup();

		loader.load("c", "60580");

		expect(requests[0].request).toMatchObject({ typeCode: "C", registrationNo: "60580" });
	});

	it("aborts the previous request and ignores its late response", async () => {
		const { loader, requests, respond } = setup();

		loader.load("C", "1");
		loader.load("C", "2");
		expect(requests[0].request.signal.aborted).toBe(true);
		expect(requests[1].request.signal.aborted).toBe(false);

		await respond(0, record("C", "1"));
		expect(loader.view).toEqual({ status: "loading" });

		await respond(1, record("C", "2"));
		expect(loader.view).toEqual({ status: "loaded", record: record("C", "2") });
	});

	it("does not treat an aborted request's rejection as an error", async () => {
		const { loader, fail } = setup();

		loader.load("C", "1");
		loader.load("C", "2");
		await fail(0, new DOMException("aborted", "AbortError"));

		expect(loader.view).toEqual({ status: "loading" });
	});

	it("aborts the request in flight on dispose", async () => {
		const { loader, requests, respond } = setup();

		loader.load("C", "1");
		loader.dispose();
		expect(requests[0].request.signal.aborted).toBe(true);

		await respond(0, record("C", "1"));
		expect(loader.view.status).not.toBe("loaded");
	});
});
