// The sectors a search can filter on: the NACE Rev. 2.1 sections CYSTAT lists companies in, by
// letter, with a short name. The database groups each company's activity into its section
// (backend tools/registry-import/migrations/008); this module only names them. U (households as
// employers) and V (extraterritorial organisations) list no companies, so they are left out.
export const SECTORS = [
	{ letter: "A", name: "Agriculture, forestry and fishing" },
	{ letter: "B", name: "Mining and quarrying" },
	{ letter: "C", name: "Manufacturing" },
	{ letter: "D", name: "Energy supply" },
	{ letter: "E", name: "Water and waste" },
	{ letter: "F", name: "Construction" },
	{ letter: "G", name: "Wholesale and retail trade" },
	{ letter: "H", name: "Transport and storage" },
	{ letter: "I", name: "Hotels and food" },
	{ letter: "J", name: "Publishing and media" },
	{ letter: "K", name: "IT and telecoms" },
	{ letter: "L", name: "Finance and insurance" },
	{ letter: "M", name: "Real estate" },
	{ letter: "N", name: "Professional and technical services" },
	{ letter: "O", name: "Administrative and support services" },
	{ letter: "P", name: "Public administration" },
	{ letter: "Q", name: "Education" },
	{ letter: "R", name: "Health and social work" },
	{ letter: "S", name: "Arts, sports and recreation" },
	{ letter: "T", name: "Other services" },
] as const;

export type Sector = (typeof SECTORS)[number]["letter"];

/** The short name of the sector a company is in, or null when it has none the app names. */
export const sectorName = (letter: string | null | undefined): string | null =>
	SECTORS.find((s) => s.letter === letter)?.name ?? null;

/** The sectors whose name contains the text, in any case, or whose letter is exactly it; every sector for no text. */
export const findSectors = (text: string): ReadonlyArray<(typeof SECTORS)[number]> => {
	const wanted = text.trim().toLowerCase();
	if (wanted === "") return SECTORS;
	return SECTORS.filter((s) => s.letter.toLowerCase() === wanted || s.name.toLowerCase().includes(wanted));
};
