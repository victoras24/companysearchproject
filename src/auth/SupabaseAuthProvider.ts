import { createClient } from "@supabase/supabase-js";
import type { AuthProviderPort, ProviderSession, SignUpDetails } from "./AuthSession";

/** Where Supabase sends the browser back to; both are listed in the project's redirect URLs. */
const callbackUrl = () => `${window.location.origin}/auth/callback`;
const resetPasswordUrl = () => `${window.location.origin}/reset-password`;

/**
 * Supabase Auth as the identity provider. This is the only file that imports the Supabase
 * client; the rest of the app reaches it through the auth module.
 */
export function createSupabaseAuthProvider(url: string, anonKey: string): AuthProviderPort {
	const supabase = createClient(url, anonKey);

	return {
		onSessionChange(listener) {
			const { data } = supabase.auth.onAuthStateChange((_event, session) => {
				const current: ProviderSession | null = session ? { userId: session.user.id } : null;
				// Supabase holds a lock while it calls back, and the listener goes on to ask for
				// the token, so answer after the callback has returned.
				setTimeout(() => listener(current), 0);
			});
			return () => data.subscription.unsubscribe();
		},

		async getAccessToken() {
			const { data } = await supabase.auth.getSession();
			return data.session?.access_token ?? null;
		},

		async signInWithPassword(email, password) {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;
			return { userId: data.user.id };
		},

		async signInWithGoogle() {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: { redirectTo: callbackUrl() },
			});
			if (error) throw error;
		},

		async signUp({ email, password, fullName }: SignUpDetails) {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				// The backend seeds the new profile's name from this.
				options: { data: { full_name: fullName }, emailRedirectTo: callbackUrl() },
			});
			if (error) throw error;
			return { confirmationNeeded: !data.session };
		},

		async signOut() {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
		},

		async sendPasswordReset(email) {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: resetPasswordUrl(),
			});
			if (error) throw error;
		},

		async setPassword(password) {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) throw error;
		},
	};
}
