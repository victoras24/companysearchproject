import {
	useAuthState,
	useCreateUserWithEmailAndPassword,
} from "react-firebase-hooks/auth";
import { auth, firestore } from "../Firebase/firebase";
import {
	setDoc,
	doc,
	where,
	query,
	getDocs,
	collection,
} from "firebase/firestore";
import { useAuth } from "../context/AuthStoreContext";
import { toast } from "sonner";

export default function useSignUpWithEmailAndPassword() {
	const [createUserWithEmailAndPassword, user, loading, error] =
		useCreateUserWithEmailAndPassword(auth);
	const [currentUser] = useAuthState(auth);
	const { userLogin } = useAuth();

	const usersRef = collection(firestore, "users");

	const signup = async (inputs: any) => {
		if (
			!inputs.email ||
			!inputs.password ||
			!inputs.username ||
			!inputs.fullName
		) {
			toast.error("Please fill all the fields");
			return;
		}

		try {
			const newUser = await createUserWithEmailAndPassword(
				inputs.email,
				inputs.password
			);

			if (!newUser) {
				toast.error("Failed to create user");
				return;
			}

			const q = query(usersRef, where("username", "==", inputs.username));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				await newUser.user.delete();
				toast.info("Username already exists");
				return;
			}

			const userDoc = {
				uid: newUser.user.uid,
				email: inputs.email,
				username: inputs.username,
				fullName: inputs.fullName,
				savedCompanies: [],
				groups: [],
				phoneNumber: "",
			};

			await setDoc(doc(firestore, "users", newUser.user.uid), userDoc);
			localStorage.setItem("user-info", JSON.stringify(userDoc));
			userLogin(userDoc);
			toast.success(`User ${userDoc.username} is created!`);
		} catch (error: any) {
			toast.error(`Signup failed: ${error.message}`);
		}
	};

	return { loading, error, signup, user, currentUser };
}
