import type { IRelatedCompany } from "@/gEntities";

/** How many appointments a name holds in one position; a null position is all of them. */
export type RoleStat = { position: string | null; count: number };

const MOST_HELD = 3;

/** The total first, then the positions held most, up to a limit. The registry's own word names each position. */
export function roleStats(appointments: IRelatedCompany[], limit: number = MOST_HELD): RoleStat[] {
	const counts = new Map<string, number>();
	for (const appointment of appointments) {
		const position = appointment.officialPosition?.trim();
		if (position) counts.set(position, (counts.get(position) ?? 0) + 1);
	}

	const positions = [...counts]
		.map(([position, count]) => ({ position, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
	return [{ position: null, count: appointments.length }, ...positions];
}

/** The appointments in one position (null for any) whose name or registration number has the text. */
export function filterAppointments(
	appointments: IRelatedCompany[],
	position: string | null,
	text: string
): IRelatedCompany[] {
	const wanted = text.trim().toLowerCase();
	return appointments.filter(
		(appointment) =>
			(position === null || appointment.officialPosition?.trim() === position) &&
			(!wanted ||
				appointment.organisationName?.toLowerCase().includes(wanted) ||
				appointment.registrationNo?.toLowerCase().includes(wanted))
	);
}

// The registry's word for a secretary, and the English one.
const SECRETARY = /γραμματ|secretar/i;

/** A company's officials with its secretaries after everyone else, otherwise in the registry's order. */
export function secretaryLast<T extends { officialPosition?: string | null }>(officials: T[]): T[] {
	const isSecretary = (official: T) => SECRETARY.test(official.officialPosition ?? "");
	return [...officials.filter((official) => !isSecretary(official)), ...officials.filter(isSecretary)];
}
