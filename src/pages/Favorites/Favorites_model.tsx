import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore";
import { action, makeObservable, observable } from "mobx";
import { firestore } from "../../Firebase/firebase";
import type { gEntities } from "@/gEntities";

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
	addCompanyInGroup = async (company: gEntities.ICompany, groupId: string) => {
		const userRef = doc(firestore, "users", this.user.uid);
		const querySnapshot = await getDoc(userRef);
		const data = querySnapshot.data();
		const groups = data?.groups || [];

		const updatedGroups = groups.map((group: gEntities.IGroup) => {
			if (group.id != groupId) return group;
			const companyExistsInGroup = group.companies.some(
				(c) => c.entryId === company.entryId
			);
			if (companyExistsInGroup) return group;

			return {
				...group,
				companies: [
					...group.companies,
					{ name: company.organisationName, id: company.entryId },
				],
			};
		});

		await updateDoc(userRef, { groups: updatedGroups });
	};

	@action
	setFavorite = (favorites: any) => {
		this.favorites = favorites;
	};

	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};
}
