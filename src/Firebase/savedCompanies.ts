import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "./firebase";
import type { ISavedCompany } from "@/gEntities";

/**
 * Removes a saved organisation by id. arrayRemove only removes an element equal to the one
 * given in every field, so an organisation saved in another shape would silently stay.
 */
export async function removeSavedCompany(uid: string, id: number) {
	const userRef = doc(firestore, "users", uid);
	const snapshot = await getDoc(userRef);
	const saved: ISavedCompany[] = snapshot.data()?.savedCompanies ?? [];
	await updateDoc(userRef, {
		savedCompanies: saved.filter((company) => company.id !== id),
	});
}
