import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth, firestore } from "../../Firebase/firebase";
import { useAuth } from "../../context/AuthStoreContext";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { toast } from "sonner";

const GoogleAuth = ({ prefix }: { prefix: any }) => {
	const [signInWithGoogle, loading, isLoading] = useSignInWithGoogle(auth);
	const { userLogin } = useAuth();
	const navigate = useNavigate();

	const handleGoogleAuth = async () => {
		try {
			const newUser = await signInWithGoogle();
			if (!newUser) {
				toast.error("Google sign-in failed");
				return;
			}

			const userRef = doc(firestore, "users", newUser.user.uid);
			const userSnap = await getDoc(userRef);

			if (userSnap.exists()) {
				const userDoc = userSnap.data();
				localStorage.setItem("user-info", JSON.stringify(userDoc));
				userLogin(userDoc);
				navigate("/");
				toast.success(`Welcome ${userDoc.username}!`);
			} else {
				const userDoc = {
					uid: newUser.user.uid,
					email: newUser.user.email,
					username: newUser.user.email?.split("@")[0] || "unknown",
					fullName: newUser.user.displayName || "",
					savedCompanies: [],
					groups: [],
				};
				await setDoc(doc(firestore, "users", newUser.user.uid), userDoc);
				localStorage.setItem("user-info", JSON.stringify(userDoc));
				userLogin(userDoc);
				toast.success(`User ${userDoc.username} is created`);
				navigate("/");
			}
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return (
		<Button
			variant="outline"
			className="w-full flex items-center justify-center gap-2 py-5 border border-gray-300 hover:bg-gray-50 transition-colors"
			onClick={handleGoogleAuth}
			disabled={isLoading}
		>
			{isLoading ? (
				<span className="animate-spin mr-2">⏳</span>
			) : (
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
			)}
			<span className="font-medium">{prefix} with Google</span>
		</Button>
	);
};

export default GoogleAuth;
