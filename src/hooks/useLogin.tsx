import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { firestore, auth } from "../Firebase/firebase";
import { getDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthStoreContext";
import { toast } from "sonner";

const useLogin = () => {
	const [signInWithEmailAndPassword, loading, error] =
		useSignInWithEmailAndPassword(auth);
	const { userLogin } = useAuth();

	const login = async (inputs: { email: string; password: string }) => {
		if (!inputs.email || !inputs.password) {
			return toast.error("Please fill all the fields");
		}

		if (!inputs.email.includes("@")) {
			return toast.error("Please enter a valid email address");
		}

		if (inputs.password.length < 6) {
			return toast.error("Password must be at least 6 characters");
		}

		try {
			const userCred = await signInWithEmailAndPassword(
				inputs.email.trim().toLowerCase(),
				inputs.password
			);

			if (!userCred) {
				toast.error("Login failed. Please try again.");
				return;
			}

			if (!userCred.user) {
				toast.error("Authentication failed. Please try again.");
				return;
			}

			const docRef = doc(firestore, "users", userCred.user.uid);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				toast.error("User profile not found. Please contact support.");
				return;
			}

			const userData = docSnap.data();

			if (!userData) {
				toast.error("Unable to load user profile. Please try again.");
				return;
			}

			localStorage.setItem("user-info", JSON.stringify(userData));
			userLogin(userData);

			toast.success(`Welcome back ${userData.username || userData.email}!`);
		} catch (error: any) {
			console.error("Login error:", error);

			let errorMessage = "An error occurred during login";

			switch (error.code) {
				case "auth/user-not-found":
					errorMessage = "No account found with this email address";
					break;
				case "auth/wrong-password":
					errorMessage = "Incorrect password. Please try again";
					break;
				case "auth/user-disabled":
					errorMessage = "This account has been disabled";
					break;
				case "auth/invalid-email":
					errorMessage = "Invalid email address";
					break;
				case "auth/too-many-requests":
					errorMessage = "Too many failed attempts. Please try again later";
					break;
				case "auth/network-request-failed":
					errorMessage = "Network error. Please check your connection";
					break;
				case "auth/invalid-credential":
					errorMessage = "Invalid email or password";
					break;
				default:
					errorMessage = error.message || "Login failed. Please try again";
			}
			console.log("error is coming");
			toast.error(errorMessage);
		}
	};

	return { loading, error, login };
};

export default useLogin;
