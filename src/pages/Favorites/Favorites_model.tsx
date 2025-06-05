import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore";
import { action, makeObservable, observable } from "mobx";
import { firestore } from "../../Firebase/firebase";
import type { gEntities } from "@/gEntities";
import { toast } from "sonner";

export class FavoritesModel {
	@observable accessor isLoading: boolean;
	@observable accessor favorites: any[] = [];
	user: gEntities.IUser;

	/**
	 *
	 */
	constructor(user: gEntities.IUser) {
		makeObservable(this);
		this.isLoading = true;
		this.user = user;
	}

	@action
	onMount = async () => {
		this.setIsLoading(true);
		await this.getFavorites();
	};

	@action
	getFavorites = async () => {
		try {
			const docRef = doc(firestore, "users", this.user.uid);
			const groupSnapshot = await getDoc(docRef);
			const savedCompanies = groupSnapshot.data()?.savedCompanies;
			this.setFavorite(savedCompanies);
		} catch (error) {
			console.log(error);
		} finally {
			this.setIsLoading(false);
		}
	};

	@action
	deleteCompanyFromFavorites = async (company: gEntities.ICompany) => {
		const userRef = doc(firestore, "users", this.user.uid);

		await updateDoc(userRef, {
			savedCompanies: arrayRemove(company),
		});

		await this.getFavorites();
	};

	@action
	addCompanyInGroup = async (
		company: gEntities.ICompany,
		targetGroup: gEntities.IGroup
	) => {
		try {
			const userRef = doc(firestore, "users", this.user.uid);
			const querySnapshot = await getDoc(userRef);
			const data = querySnapshot.data();
			const groups = data?.groups || [];

			const groupIndex = groups.findIndex(
				(g: gEntities.IGroup) => g.id === targetGroup.id
			);

			if (groupIndex === -1) {
				toast.error("Group not found");
				return;
			}

			const group = groups[groupIndex];

			const companyExistsInGroup = group.companies.some(
				(c: gEntities.ICompanyInGroup) => c.id === company.entryId
			);

			if (companyExistsInGroup) {
				toast.error(
					`${company.organisationName} is already in group "${group.name}"`
				);
				return;
			}

			const updatedGroups = [...groups];
			updatedGroups[groupIndex] = {
				...group,
				companies: [
					...group.companies,
					{ name: company.organisationName, id: company.entryId },
				],
			};

			await updateDoc(userRef, { groups: updatedGroups });

			toast.success(
				`${company.organisationName} added to group "${group.name}"`
			);
		} catch (error) {
			console.error("Error adding company to group:", error);
			toast.error("Failed to add company to group");
		}
	};

	@action
	setFavorite = (favorites: any) => {
		this.favorites = favorites;
	};

	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};
}
