import { useEffect } from "react";
import { useNavigate } from "react-router";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { auth } from "@/auth";
import { SessionLoader } from "@/auth/RequireUser";
import { APP_HOME } from "@/site/SiteHeader";

/**
 * Where Supabase sends the browser back after a Google sign-in or an email confirmation. The
 * auth module picks the session up from the URL; this page only waits for the outcome.
 */
const AuthCallback = observer(() => {
	const navigate = useNavigate();
	const state = auth.state;

	useEffect(() => {
		if (state.status === "signed-in") {
			toast.success(`Welcome ${state.profile.fullName || state.profile.email}!`);
			navigate(APP_HOME, { replace: true });
		} else if (state.status === "signed-out") {
			toast.error("Sign-in failed. Please try again.");
			navigate("/login", { replace: true });
		}
	}, [state, navigate]);

	return <SessionLoader />;
});

export default AuthCallback;
