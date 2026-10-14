import { AuthClient } from "@supabase/auth-js";
import type { AuthProviderPort, ProviderSession, SignUpDetails } from "./AuthSession";

/** Where Supabase sends the browser back to; both are listed in the project's redirect URLs. */
const callbackUrl = () => `${window.location.origin}/auth/callback`;
const resetPasswordUrl = () => `${window.location.origin}/reset-password`;

/**
 * What supabase-js's createClient gave its auth client, which the app now uses on its own to
 * leave the database, storage and realtime clients out of the bundle. The other options are
 * auth-js's defaults, the same as supabase-js's.
 */
export function authClientOptions(url: string, anonKey: string) {
	const base = new URL(url.endsWith("/") ? url : `${url}/`);
	return {
		url: new URL("auth/v1", base).href,
		// Where supabase-js kept the session; another key would sign everyone out.
		storageKey: `sb-${base.hostname.split(".")[0]}-auth-token`,
		headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
	};
}

/**
 * Supabase Auth as the identity provider. This is the only file that imports the Supabase
 * client; the rest of the app reaches it through the auth module.
 */
export function createSupabaseAuthProvider(url: string, anonKey: string): AuthProviderPort {
	const client = new AuthClient(authClientOptions(url, anonKey));

	return {
		onSessionChange(listener) {
			const { data } = client.onAuthStateChange((_event, session) => {
				const current: ProviderSession | null = session ? { userId: session.user.id } : null;
				// Supabase holds a lock while it calls back, and the listener goes on to ask for
				// the token, so answer after the callback has returned.
				setTimeout(() => listener(current), 0);
			});
			return () => data.subscription.unsubscribe();
		},

		async getAccessToken() {
			const { data } = await client.getSession();
			return data.session?.access_token ?? null;
		},

		async signInWithPassword(email, password) {
			const { data, error } = await client.signInWithPassword({ email, password });
			if (error) throw error;
			return { userId: data.user.id };
		},

		async signInWithGoogle() {
			const { error } = await client.signInWithOAuth({
				provider: "google",
				options: { redirectTo: callbackUrl() },
			});
			if (error) throw error;
		},

		async signUp({ email, password, fullName }: SignUpDetails) {
			const { data, error } = await client.signUp({
				email,
				password,
				// The backend seeds the new profile's name from this.
				options: { data: { full_name: fullName }, emailRedirectTo: callbackUrl() },
			});
			if (error) throw error;
			return { confirmationNeeded: !data.session };
		},

		async signOut() {
			const { error } = await client.signOut();
			if (error) throw error;
		},

		async sendPasswordReset(email) {
			const { error } = await client.resetPasswordForEmail(email, {
				redirectTo: resetPasswordUrl(),
			});
			if (error) throw error;
		},

		async setPassword(password) {
			const { error } = await client.updateUser({ password });
			if (error) throw error;
		},
	};
}
