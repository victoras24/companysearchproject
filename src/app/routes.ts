// Where the web app's screens live. Everything in the app links inside it.

export const APP = {
	home: "/app",
	search: "/app/search",
	saved: "/app/saved",
	groups: "/app/groups",
	tracking: "/app/tracking",
	plans: "/app/plans",
	account: "/app/account",
	cart: "/app/cart",
} as const;

type Key = { organisationTypeCode?: string | null; registrationNo?: string | null };

/** One text for an organisation's key, e.g. for a list key; null when it has no type or number. */
export function organisationId(o: Key): string | null {
	const typeCode = o.organisationTypeCode?.trim().toUpperCase();
	const registrationNo = o.registrationNo?.trim();
	return typeCode && registrationNo ? `${typeCode}/${registrationNo}` : null;
}

/** An organisation's page in the app; null when it has no type or number to find it by. */
export function companyPath(o: Key): string | null {
	const typeCode = o.organisationTypeCode?.trim().toUpperCase();
	const registrationNo = o.registrationNo?.trim();
	if (!typeCode || !registrationNo) return null;
	return `${APP.home}/company/${typeCode}/${encodeURIComponent(registrationNo)}`;
}

/** An official's page in the app: the companies in which the name holds a position. */
export function officialPath(name: string | null | undefined): string | null {
	const wanted = name?.trim();
	return wanted ? `${APP.home}/official/${encodeURIComponent(wanted)}` : null;
}

/** The Tracking page with this organisation's row open. */
export function trackedPath(o: Key): string {
	const id = organisationId(o);
	return id ? `${APP.tracking}?open=${encodeURIComponent(id)}` : APP.tracking;
}

/** The screen a page was opened from, for its way back; `state` is what that screen was opened with, so its own way back survives. */
export type Origin = { to: string; label: string; state?: unknown };
