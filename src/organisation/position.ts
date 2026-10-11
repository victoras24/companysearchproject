// The registry writes every position in Greek. Views show it through this module; the registry's own
// word stays the value that is counted, filtered and keyed on.

const POSITION_LABELS: Record<string, string> = {
	Διευθυντής: "Director",
	"Αντικαταστάτης Διευθυντής": "Alternate Director",
	Γραμματέας: "Secretary",
	"Βοηθός Γραμματέας": "Assistant Secretary",
	"Αναπληρωτής Γραμματέας": "Deputy Secretary",
	Ιδιοκτήτης: "Owner",
	"Ομόρρυθμος Συνέταιρος": "General Partner",
	"Ετερόρρυθμος Συνέταιρος": "Limited Partner",
	"Εξουσιοδοτημένο Πρόσωπο": "Authorised Person",
};

/** A position in English; the registry's own word when it is one this module does not know. */
export function positionLabel(position: string | null | undefined): string {
	const word = position?.trim() ?? "";
	return POSITION_LABELS[word] ?? word;
}
