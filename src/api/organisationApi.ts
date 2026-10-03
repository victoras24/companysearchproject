import axios from "axios";
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
