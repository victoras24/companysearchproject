import { describe, expect, it } from "vitest";
import { activityCertificateUrl } from "./organisationApi";

const activity = { code: "64.19", description: "Other monetary intermediation" };

describe("activityCertificateUrl", () => {
	it("is the backend's CYSTAT certificate for a company CYSTAT lists", () => {
		expect(activityCertificateUrl({ organisationTypeCode: "C", registrationNo: "382116" }, activity)).toBe(
			`${import.meta.env.VITE_API_URL}/api/company/C/382116/activity-certificate`
		);
	});

	it("is null when CYSTAT lists no activity, as it then has no certificate", () => {
		expect(activityCertificateUrl({ organisationTypeCode: "C", registrationNo: "382116" }, null)).toBeNull();
	});

	it("is null for anything but a company, as CYSTAT issues certificates for HE numbers only", () => {
		expect(activityCertificateUrl({ organisationTypeCode: "B", registrationNo: "60580" }, activity)).toBeNull();
	});
});
