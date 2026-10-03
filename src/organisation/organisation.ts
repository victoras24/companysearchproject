import moment from "moment";

// Facts derived from an organisation's registry data. Every view that shows them uses these.
// The backend decides each organisation's status group; this module only names and shows it.

export const STATUS_GROUPS = [
	"registered",
	"at-risk",
	"in-liquidation",
	"dissolved",
	"unknown",
] as const;

export type StatusGroup = (typeof STATUS_GROUPS)[number];

export type OrganisationSummary = {
	id: number;
	organisationName: string | null;
	registrationNo: string;
	registrationDate: string | null;
	organisationStatus: string | null;
	addressSeqNo: number | null;
	organisationTypeCode: string | null;
	organisationType: string | null;
	statusGroup: StatusGroup;
	statusText: string | null;
	statusDate: string | null;
};

export type RegisteredAddress = {
	street: string | null;
	building: string | null;
	territory: string | null;
};

const STATUS_LABELS: Record<StatusGroup, string> = {
	registered: "Registered",
	"at-risk": "At risk",
	"in-liquidation": "In liquidation",
	dissolved: "Dissolved",
	unknown: "Unknown",
};

export function detailsPath(o: {
	organisationTypeCode?: string | null;
	registrationNo?: string | null;
}): string | null {
	const typeCode = o.organisationTypeCode?.trim().toUpperCase();
	const registrationNo = o.registrationNo?.trim();
	if (!typeCode || !registrationNo) return null;
	return `/cyprus-company-search/${typeCode}/${encodeURIComponent(registrationNo)}`;
}

// Anything else, such as a saved favourite from before status groups, is unknown.
export function statusGroupOf(o: { statusGroup?: string | null }): StatusGroup {
	return STATUS_GROUPS.find((group) => group === o.statusGroup) ?? "unknown";
}

export function statusLabel(o: { statusGroup?: string | null }): string {
	return STATUS_LABELS[statusGroupOf(o)];
}

// "Struck off · since March 12, 2019". A registered organisation's status date is its
// registration date again, so it is left out; a line that would only repeat the badge is none.
export function statusLine(o: {
	statusGroup?: string | null;
	statusText?: string | null;
	statusDate?: string | null;
}): string | null {
	if (!o.statusText) return null;
	const since = statusGroupOf(o) === "registered" ? null : dateText(o.statusDate);
	if (since) return `${o.statusText} · since ${since}`;
	return o.statusText === statusLabel(o) ? null : o.statusText;
}

export function registrationDateText(raw: string | null | undefined): string {
	return dateText(raw) ?? "Not available";
}

function dateText(raw: string | null | undefined): string | null {
	const date = raw ? moment(raw, "DD/MM/YYYY", true) : null;
	return date?.isValid() ? date.format("MMMM D, YYYY") : null;
}

export function registeredAddressText(
	a: RegisteredAddress | null | undefined
): string {
	const parts = [a?.street, a?.building, a?.territory].filter(Boolean);
	return parts.length > 0 ? parts.join(" ") : "Address not available";
}
