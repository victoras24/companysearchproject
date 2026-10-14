import { SECTORS, type Sector } from "@/organisation/sector";
import { companyId, type LibraryCompany, type LibraryGroup, type SectorGroupsResult } from "./Library";

/** A group the saved companies of one sector could go into: a new one, or the user's own of that name. */
export type SectorProposal = {
	letter: Sector;
	name: string;
	/** The saved companies in this sector. */
	companies: LibraryCompany[];
	/** The group whose name is the sector's, in any case and spacing; null when there is none. */
	existingGroupId: string | null;
	/** The companies that group does not have yet: all of them for a new group. */
	toAdd: LibraryCompany[];
};

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The sector a group is named after, in any case and spacing, or null. */
export const sectorOfGroup = (groupName: string): Sector | null => SECTORS.find((s) => sameName(s.name, groupName))?.letter ?? null;

const countGroups = (n: number) => (n === 1 ? "1 group" : `${n} groups`);

/** What the button that goes ahead says, for so many new groups and so many existing ones. */
export function confirmLabel(creating: number, updating: number): string {
	if (creating > 0 && updating > 0) return `Create ${creating}, update ${updating}`;
	if (updating > 0) return `Update ${updating}`;
	return creating > 0 ? `Create ${countGroups(creating)}` : "Create groups";
}

/** What the toast says once the groups are made, or null when nothing was. */
export function appliedMessage({ created, updated }: SectorGroupsResult): string | null {
	const updatedText = updated.length === 1 ? updated[0].name : countGroups(updated.length);
	if (created.length > 0 && updated.length > 0) return `Created ${countGroups(created.length)}, updated ${updatedText}.`;
	if (created.length > 0) return `Created ${countGroups(created.length)}.`;
	return updated.length > 0 ? `Updated ${updatedText}.` : null;
}

/**
 * One group per sector the saved companies are in, the sectors with most companies first and
 * then in sector order. A sector whose group already has every company is left out, as there is
 * nothing to do for it. Companies with no sector the app names come back apart.
 */
export function proposeSectorGroups(
	favourites: LibraryCompany[],
	groups: LibraryGroup[]
): { proposals: SectorProposal[]; unsectored: LibraryCompany[] } {
	const unsectored: LibraryCompany[] = [];
	const bySector = new Map<Sector, LibraryCompany[]>();

	for (const company of favourites) {
		const sector = SECTORS.find((s) => s.letter === company.sector);
		if (!sector) unsectored.push(company);
		else bySector.set(sector.letter, [...(bySector.get(sector.letter) ?? []), company]);
	}

	const proposals = SECTORS.flatMap(({ letter, name }): SectorProposal[] => {
		const companies = bySector.get(letter);
		if (!companies) return [];

		const existing = groups.find((g) => sameName(g.name, name));
		const inGroup = new Set(existing?.companies.map(companyId));
		const toAdd = companies.filter((c) => !inGroup.has(companyId(c)));
		if (existing && toAdd.length === 0) return [];

		return [{ letter, name, companies, existingGroupId: existing?.id ?? null, toAdd }];
	});

	// A stable sort keeps sector order between sectors with as many companies.
	proposals.sort((a, b) => b.companies.length - a.companies.length);
	return { proposals, unsectored };
}
