import { useSignOut } from "react-firebase-hooks/auth";
import { auth } from "../Firebase/firebase";
import { useAuth } from "../context/AuthStoreContext";
import { toast } from "sonner";

const useLogout = () => {
	const [signOut, loading, error] = useSignOut(auth);
	const { userLogout } = useAuth();

	const handleLogOut = async () => {
		try {
			await signOut();
			localStorage.removeItem("user-info");
			userLogout();
			toast.success(`User logged out successfully`);
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return { handleLogOut, loading, error };
};

export default useLogout;
