import { doc, getDoc } from "firebase/firestore";
import { action, makeObservable, observable } from "mobx";
import { firestore } from "../../Firebase/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";

export class AccountaDetailsModel {
	@observable accessor groupCount: number;
	@observable accessor favoriteCount: number;
	@observable accessor isLoading: boolean;
	/**
	 *
	 */
	constructor() {
		makeObservable(this);
		this.isLoading = true;
		this.groupCount = 0;
		this.favoriteCount = 0;
	}

	@action
	calculateGroupCount = async (userId: string) => {
		try {
			const userRef = doc(firestore, "users", userId);
			const querySnapshot = await getDoc(userRef);
			const data = querySnapshot.data();
			const groups = data?.groups;
			this.setGroupCount(groups.length);
		} catch (error) {
			console.log(error);
		} finally {
			this.setIsLoading(false);
		}
	};

	@action
	calculateFavoritesCount = async (userId: string) => {
		try {
			const userRef = doc(firestore, "users", userId);
			const querySnapshot = await getDoc(userRef);
			const data = querySnapshot.data();
			const favorites = data?.savedCompanies;
			this.setFavoriteCount(favorites.length);
		} catch (error) {
			console.log(error);
		} finally {
			this.setIsLoading(false);
		}
	};

	@action
	sendResetPassEmail = async (auth: any, email: string) => {
		sendPasswordResetEmail(auth, email)
			.then(() => {
				toast.success("Reset password email is sent!");
			})
			.catch((error) => {
				toast.error(error.message);
			});
	};

	@action
	setGroupCount = (count: number) => {
		this.groupCount = count;
	};

	@action
	setFavoriteCount = (count: number) => {
		this.favoriteCount = count;
	};

	@action
	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};
}
