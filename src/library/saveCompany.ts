import { toast } from "sonner";
import { auth } from "@/auth";
import { library, toLibraryCompany, type SavableOrganisation } from "./index";

/** The bookmark button on search results and the details page: saves or unsaves, and says so. */
export async function toggleSaved(organisation: SavableOrganisation) {
	if (auth.state.status !== "signed-in") {
		toast.warning(
			"Please register or login if you already have an account, to save and organise companies"
		);
		return;
	}

	const result = await library.toggleFavourite(toLibraryCompany(organisation));
	if (!result.ok) {
		toast.error("Failed to update saved companies");
	} else if (result.saved) {
		toast.success(`Saved ${organisation.organisationName} to the favourites`);
	} else {
		toast.success(`Unsaved ${organisation.organisationName} from the favourites`);
	}
}
