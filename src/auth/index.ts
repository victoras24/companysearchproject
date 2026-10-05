import { toast } from "sonner";
import { setAccessTokenSource } from "@/api/userApi";
import { AuthSession } from "./AuthSession";
import { profileApi } from "./profileApi";
import { createSupabaseAuthProvider } from "./SupabaseAuthProvider";

export type { AuthResult, AuthState, Profile, ProfileChanges, SignUpResult } from "./AuthSession";

/** The app's one auth session. Components read `auth.state` inside an observer. */
export const auth = new AuthSession({
	provider: createSupabaseAuthProvider(
		import.meta.env.VITE_SUPABASE_URL,
		import.meta.env.VITE_SUPABASE_ANON_KEY
	),
	profiles: profileApi,
	reportError: (message) => toast.error(message),
});

setAccessTokenSource(auth.getAccessToken);

// The cached user of the Firebase version; nothing reads it any more.
localStorage.removeItem("user-info");

auth.start();
