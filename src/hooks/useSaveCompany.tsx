import { useState } from "react";
import { useAuth } from "../context/AuthStoreContext";
import { firestore } from "@/Firebase/firebase";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";
import type { gEntities } from "@/gEntities";

const useSaveCompany = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { user, updateUser } = useAuth();

	const handleSaveCompany = async (company: gEntities.ISavedCompany) => {
		if (!user) {
			toast.warning(
				"Please register or login if you already have an account, to save and organise companies"
			);
			return;
		}

		try {
			setIsLoading(true);

			const isAlreadySaved = user.savedCompanies.some(
				(savedCompany: gEntities.ISavedCompany) =>
					savedCompany.entryId === company.entryId
			);

			const currentUserRef = doc(firestore, "users", user.uid);

			await updateDoc(currentUserRef, {
				savedCompanies: isAlreadySaved
					? arrayRemove(company)
					: arrayUnion(company),
			});

			if (isAlreadySaved) {
				const updatedSavedCompanies = user.savedCompanies.filter(
					(savedCompany: gEntities.ISavedCompany) =>
						savedCompany.entryId !== company.entryId
				);

				updateUser({
					...user,
					savedCompanies: updatedSavedCompanies,
				});

				localStorage.setItem(
					"user-info",
					JSON.stringify({
						...user,
						savedCompanies: updatedSavedCompanies,
					})
				);

				toast.success(
					`Unsaved ${company.organisationName} from the favourites`
				);
			} else {
				const updatedSavedCompanies = [...user.savedCompanies, company];

				updateUser({
					...user,
					savedCompanies: updatedSavedCompanies,
				});

				localStorage.setItem(
					"user-info",
					JSON.stringify({
						...user,
						savedCompanies: updatedSavedCompanies,
					})
				);

				toast.success(`Saved ${company.organisationName} to the favourites`);
			}
		} catch (error: any) {
			console.error("Error saving/unsaving company:", error);
			toast.error("Failed to update saved companies");
		} finally {
			setIsLoading(false);
		}
	};

	return { isLoading, handleSaveCompany };
};

export default useSaveCompany;
