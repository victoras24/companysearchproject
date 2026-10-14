import axios from "axios";
import type { OrganisationActivity, OrganisationSummary } from "@/organisation/organisation";
import type { LookupFn, OrganisationRecord } from "@/pages/OrganisationDetails/OrganisationRecordLoader";

const controller = `${import.meta.env.VITE_API_URL}/api/company`;

export const lookup: LookupFn = async ({ typeCode, registrationNo, signal }) => {
	try {
		const req = await axios.get<OrganisationRecord>(
			`${controller}/${encodeURIComponent(typeCode)}/${encodeURIComponent(registrationNo)}`,
			{ signal }
		);
		return req.data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 404) return null;
		throw error;
	}
};

// CYSTAT's Certificate of Economic Activity, through the backend, which sends the PDF to open in
// a new tab. Only companies (HE numbers) have one, and only those CYSTAT lists an activity for.
export function activityCertificateUrl(
	organisation: Pick<OrganisationSummary, "organisationTypeCode" | "registrationNo">,
	activity: OrganisationActivity | null
): string | null {
	if (organisation.organisationTypeCode !== "C" || !activity) return null;
	return `${controller}/C/${encodeURIComponent(organisation.registrationNo)}/activity-certificate`;
}
