import { useSignInWithMicrosoft } from "react-firebase-hooks/auth";
import { auth, firestore } from "../../Firebase/firebase";
import { useAuth } from "../../context/AuthStoreContext";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { toast } from "sonner";

const MicrosoftAuth = ({ prefix }: { prefix: any }) => {
	const [signInWithMicrosoft, , loading, error] = useSignInWithMicrosoft(auth);
	const { userLogin } = useAuth();
	const navigate = useNavigate();

	const handleMicrosoftAuth = async () => {
		try {
			const newUser = await signInWithMicrosoft();
			if (!newUser) {
				toast.error("Microsoft sign-in failed");
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
		} catch (err: any) {
			console.error("Microsoft auth error:", err);
			toast.error(err.message || "Microsoft authentication failed");
		}
	};

	// Show error toast if there was an error from the hook
	if (error) {
		toast.error(error.message);
	}

	return (
		<Button
			variant="outline"
			className="w-full flex items-center justify-center gap-2 py-5 border border-gray-300 hover:bg-gray-50 transition-colors"
			onClick={handleMicrosoftAuth}
			disabled={loading}
		>
			{loading ? (
				<span className="animate-spin mr-2">⏳</span>
			) : (
				<svg
					width="20"
					height="20"
					viewBox="0 0 23 23"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path fill="#f1511b" d="M11 11H0V0h11v11z" />
					<path fill="#80cc28" d="M23 11H12V0h11v11z" />
					<path fill="#00adef" d="M11 23H0V12h11v11z" />
					<path fill="#fbbc09" d="M23 23H12V12h11v11z" />
				</svg>
			)}
			<span className="font-medium">{prefix} with Microsoft</span>
		</Button>
	);
};

export default MicrosoftAuth;
