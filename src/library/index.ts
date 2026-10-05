import { reaction } from "mobx";
import { auth } from "@/auth";
import { statusGroupOf } from "@/organisation/organisation";
import { Library, type LibraryCompany } from "./Library";
import { libraryApi } from "./libraryApi";

export { companyId } from "./Library";
export type { LibraryCompany, LibraryGroup } from "./Library";

/** The app's one library. Components read it inside an observer. */
export const library = new Library(libraryApi);

// The library lives as long as the session: it loads on sign-in and clears on sign-out.
reaction(
	() => (auth.state.status === "signed-in" ? auth.state.profile.id : null),
	(userId) => library.followUser(userId),
	{ fireImmediately: true }
);

/** An organisation from a search result or a record: enough to save it and show it. */
export type SavableOrganisation = {
	organisationName: string | null;
	registrationNo: string;
	organisationTypeCode?: string | null;
	organisationType?: string | null;
	statusGroup?: string | null;
	statusText?: string | null;
	statusDate?: string | null;
};

/** The organisation as the library holds a saved one. */
export function toLibraryCompany(organisation: SavableOrganisation): LibraryCompany {
	return {
		organisationTypeCode: organisation.organisationTypeCode ?? "",
		registrationNo: organisation.registrationNo,
		organisationName: organisation.organisationName,
		organisationType: organisation.organisationType ?? null,
		statusGroup: statusGroupOf(organisation),
		statusText: organisation.statusText ?? null,
		statusDate: organisation.statusDate ?? null,
		inRegistry: true,
	};
}
