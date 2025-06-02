import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { firestore, auth } from "../Firebase/firebase";
import { getDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthStoreContext";
import { toast } from "sonner";

const useLogin = () => {
	const [signInWithEmailAndPassword, loading, error] =
		useSignInWithEmailAndPassword(auth);
	const { userLogin } = useAuth();

	const login = async (inputs: any) => {
		if (!inputs.email || !inputs.password) {
			return toast.error("Please fill all the fields");
		}
		try {
			const userCred = await signInWithEmailAndPassword(
				inputs.email,
				inputs.password
			);
			if (userCred) {
				const docRef = doc(firestore, "users", userCred.user.uid);
				const docSnap = await getDoc(docRef);

				localStorage.setItem("user-info", JSON.stringify(docSnap.data()));
				userLogin(docSnap.data());

				toast.success(`Welcome back ${docSnap.data()?.username}!`);
			}
		} catch (error: any) {
			toast.error(error.message);
		}
	};
	return { loading, error, login };
};

export default useLogin;
