import { action, makeObservable, observable } from "mobx";
import {
	arrayRemove,
	arrayUnion,
	doc,
	getDoc,
	updateDoc,
} from "firebase/firestore";
import { firestore } from "../../Firebase/firebase";
import type { IUser, IGroup } from "@/gEntities";

export class OrganiserModel {
	@observable accessor groupName: string = "";
	@observable accessor groups: any[] = [];
	@observable accessor isLoading: boolean;
	@observable accessor expandedGroups: { [key: string]: boolean } = {};
	user: IUser;

	/**
	 *
	 */
	constructor(user: IUser) {
		makeObservable(this);
		this.isLoading = true;
		this.user = user;
	}

	@action
	onMount = async () => {
		this.setIsLoading(true);
		await this.getGroups();
	};

	@action
	getGroups = async () => {
		try {
			const userRef = doc(firestore, "users", this.user.uid);
			const groupSnapshot = await getDoc(userRef);
			const groups = groupSnapshot.data()?.groups;
			this.setGroups(groups);
		} catch (error) {
			console.log(error);
		} finally {
			this.setIsLoading(false);
		}
	};

	uniqueId = () => {
		const dateString = Date.now().toString(36);
		const randomness = Math.random().toString(36).substr(2);
		return dateString + randomness;
	};

	@action
	createGroup = async (ref: any) => {
		if (this.groupName == "") {
			return;
		}

		await updateDoc(ref, {
			groups: arrayUnion({
				id: this.uniqueId(),
				name: this.groupName,
				companies: [],
			}),
		});

		await this.getGroups();

		this.groupName = "";
	};

	@action
	handleInputChange = (e: any) => {
		this.groupName = e.target.value;
	};

	@action
	deleteGroup = async (ref: any, group: IGroup) => {
		await updateDoc(ref, {
			groups: arrayRemove(group),
		});

		await this.getGroups();
	};

	@action
	deleteCompanyAssignedInGroup = async (
		userId: string,
		company: any,
		groupId: string
	) => {
		const userRef = doc(firestore, "users", userId);
		const querySnapshot = await getDoc(userRef);
		const data = querySnapshot.data();
		const groups = data?.groups;

		const updatedGroup = groups.map((group: IGroup) => {
			if (group.id !== groupId) return group;

			return {
				...group,
				companies: group.companies.filter((c: any) => c.id !== company.id),
			};
		});
		await updateDoc(userRef, { groups: updatedGroup });

		await this.getGroups();
	};

	@action
	extendGroup = async (groupId: string) => {
		this.expandedGroups[groupId] = !this.expandedGroups[groupId];
	};

	@action
	setGroups = (groups: any) => {
		this.groups = groups;
	};

	@action
	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};
}
