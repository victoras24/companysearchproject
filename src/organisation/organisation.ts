import moment from "moment";

// Facts derived from an organisation's registry data. Every view that shows them uses these,
// so a rule such as "active" changes here only.

export type OrganisationSummary = {
	id: number;
	organisationName: string | null;
	registrationNo: string;
	registrationDate: string | null;
	organisationStatus: string | null;
	addressSeqNo: number | null;
	organisationTypeCode: string | null;
	organisationType: string | null;
};

export type RegisteredAddress = {
	street: string | null;
	building: string | null;
	territory: string | null;
};

const REGISTERED = "Εγγεγραμμένη";

export function detailsPath(o: {
	organisationTypeCode?: string | null;
	registrationNo?: string | null;
}): string | null {
	const typeCode = o.organisationTypeCode?.trim().toUpperCase();
	const registrationNo = o.registrationNo?.trim();
	if (!typeCode || !registrationNo) return null;
	return `/cyprus-company-search/${typeCode}/${encodeURIComponent(registrationNo)}`;
}

// Candidate 6b replaces this binary rule with finer status groups.
export function isActive(o: { organisationStatus?: string | null }): boolean {
	return o.organisationStatus === REGISTERED;
}

export function statusLabel(o: {
	organisationStatus?: string | null;
}): "Active" | "Inactive" {
	return isActive(o) ? "Active" : "Inactive";
}

export function registrationDateText(raw: string | null | undefined): string {
	const date = raw ? moment(raw, "DD/MM/YYYY", true) : null;
	return date?.isValid() ? date.format("MMMM D, YYYY") : "Not available";
}

export function registeredAddressText(
	a: RegisteredAddress | null | undefined
): string {
	const parts = [a?.street, a?.building, a?.territory].filter(Boolean);
	return parts.length > 0 ? parts.join(" ") : "Address not available";
}
