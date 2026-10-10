import type { IRelatedCompany } from "@/gEntities";

/** How many appointments a name holds in one position; a null position is all of them. */
export type RoleStat = { position: string | null; count: number };

const MOST_HELD = 3;

/** The total first, then the positions held most. The registry's own word names each position. */
export function roleStats(appointments: IRelatedCompany[]): RoleStat[] {
	const counts = new Map<string, number>();
	for (const appointment of appointments) {
		const position = appointment.officialPosition?.trim();
		if (position) counts.set(position, (counts.get(position) ?? 0) + 1);
	}

	const positions = [...counts]
		.map(([position, count]) => ({ position, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, MOST_HELD);
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
