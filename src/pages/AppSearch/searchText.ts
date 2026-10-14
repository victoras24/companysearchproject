// What the Search screen says about what it found.

import type { IOfficials } from "@/gEntities";
import { statusLabel } from "@/organisation/organisation";
import { sectorName } from "@/organisation/sector";
import type { EntityType, SectorFilter, StatusFilter } from "@/pages/Search/SearchSession";

const statusWords = (statusFilter: Exclude<StatusFilter, "all">) => statusLabel({ statusGroup: statusFilter }).toLowerCase();

/** "4 registered companies · page 1 of 2": how many match, under which status, and where in them. */
export function countLine({
	total,
	statusFilter,
	page,
	pageSize,
	paged,
}: {
	total: number;
	statusFilter: StatusFilter;
	page: number;
	pageSize: number;
	paged: boolean;
}): string {
	const status = statusFilter === "all" ? "" : `${statusWords(statusFilter)} `;
	const found = `${total} ${status}${total === 1 ? "company" : "companies"}`;
	return paged ? `${found} · page ${page} of ${Math.ceil(total / pageSize)}` : found;
}

/** What follows the count line when a sector is applied: whose list the companies come from. */
export function sectorNote(sectorFilter: SectorFilter): string | null {
	const name = sectorFilter === "all" ? null : sectorName(sectorFilter);
	return name ? `· CYSTAT lists them as active in ${name}` : null;
}

export function noResultsText({
	entityType,
	statusFilter,
	query,
}: {
	entityType: EntityType;
	statusFilter: StatusFilter;
	query: string;
}): string {
	if (entityType === "official") return `No officials match "${query}". Try the surname on its own.`;
	if (statusFilter !== "all") return `No ${statusWords(statusFilter)} companies match "${query}".`;
	return `No results for "${query}". Check the spelling or try fewer words.`;
}

export type OfficialFound = { name: string; position: string; company: string };

/** The names among the appointments found, each once, with the appointment it was first found by. */
export function officialsFound(appointments: IOfficials[]): OfficialFound[] {
	const found = new Map<string, OfficialFound>();
	for (const appointment of appointments) {
		const name = appointment.personOrOrganisationName?.trim();
		if (!name || found.has(name)) continue;
		found.set(name, { name, position: appointment.officialPosition, company: appointment.organisationName });
	}
	return [...found.values()];
}
