import { action, makeObservable, observable } from "mobx";

export type Profile = {
	id: string;
	email: string;
	fullName: string;
	phoneNumber: string;
};

export type AuthState =
	| { status: "checking" }
	| { status: "signed-out" }
	| { status: "signed-in"; profile: Profile };

export type AuthResult = { ok: true } | { ok: false; message: string };
export type SignUpResult =
	| { ok: true; confirmationNeeded: boolean }
	| { ok: false; message: string };

export type ProviderSession = { userId: string };

/**
 * The identity provider, which owns the session: it stores it, refreshes its token and says
 * when it changes. Operations reject with an Error whose message can be shown to the user.
 */
export interface AuthProviderPort {
	/**
	 * Calls the listener with the current session, or null, soon after subscribing, and again on
	 * every change, a token refresh included. Returns the function that unsubscribes.
	 */
	onSessionChange(listener: (session: ProviderSession | null) => void): () => void;
	/** A token that is valid now, or null with no session. */
	getAccessToken(): Promise<string | null>;
	signInWithPassword(email: string, password: string): Promise<ProviderSession>;
	/** Leaves the page; the session arrives through onSessionChange after the redirect back. */
	signInWithGoogle(): Promise<void>;
	signUp(details: SignUpDetails): Promise<{ confirmationNeeded: boolean }>;
	signOut(): Promise<void>;
	sendPasswordReset(email: string): Promise<void>;
	/** For the user of the current session, which a reset link also opens. */
	setPassword(password: string): Promise<void>;
}

export type SignUpDetails = { email: string; password: string; fullName: string };
export type ProfileChanges = { fullName?: string; phoneNumber?: string };

/** The backend's profile routes, called as the user of the current session. */
export interface ProfilePort {
	load(): Promise<Profile>;
	update(changes: ProfileChanges): Promise<Profile>;
}

const PROFILE_FAILED = "We could not load your account. Please try again.";
const NOT_SIGNED_IN = "You are not signed in.";

/**
 * Who is using the app: checking, signed out, or signed in with their profile. It follows the
 * provider's session and keeps no copy of it; the profile lives exactly as long as the session.
 */
export class AuthSession {
	@observable.ref private accessor current: AuthState = { status: "checking" };

	private readonly ports: {
		provider: AuthProviderPort;
		profiles: ProfilePort;
		reportError: (message: string) => void;
	};
	private userId: string | null = null;
	private loading: Promise<boolean> | null = null;
	private awaitedByOperation = 0;
	private unsubscribe: (() => void) | null = null;

	constructor(ports: AuthSession["ports"]) {
		this.ports = ports;
		makeObservable(this);
	}

	get state(): AuthState {
		return this.current;
	}

	start = () => {
		this.unsubscribe ??= this.ports.provider.onSessionChange((session) => {
			void this.follow(session).then((loaded) => {
				// A sign-in in progress returns the failure itself.
				if (!loaded && this.awaitedByOperation === 0) this.ports.reportError(PROFILE_FAILED);
			});
		});
	};

	dispose = () => {
		this.unsubscribe?.();
		this.unsubscribe = null;
	};

	signInWithPassword = async (email: string, password: string): Promise<AuthResult> => {
		this.awaitedByOperation++;
		try {
			const session = await this.ports.provider.signInWithPassword(email, password);
			const loaded = await this.follow(session);
			return loaded ? { ok: true } : { ok: false, message: PROFILE_FAILED };
		} catch (error) {
			return failure(error);
		} finally {
			this.awaitedByOperation--;
		}
	};

	signInWithGoogle = (): Promise<AuthResult> =>
		this.attempt(() => this.ports.provider.signInWithGoogle());

	signUp = async (details: SignUpDetails): Promise<SignUpResult> => {
		try {
			const { confirmationNeeded } = await this.ports.provider.signUp(details);
			return { ok: true, confirmationNeeded };
		} catch (error) {
			return failure(error);
		}
	};

	signOut = async () => {
		try {
			await this.ports.provider.signOut();
		} finally {
			// Signed out here even if the provider could not be told.
			void this.follow(null);
		}
	};

	sendPasswordReset = (email: string): Promise<AuthResult> =>
		this.attempt(() => this.ports.provider.sendPasswordReset(email));

	setPassword = (password: string): Promise<AuthResult> =>
		this.attempt(() => this.ports.provider.setPassword(password));

	updateProfile = async (changes: ProfileChanges): Promise<AuthResult> => {
		const userId = this.userId;
		if (this.current.status !== "signed-in" || !userId) {
			return { ok: false, message: NOT_SIGNED_IN };
		}
		try {
			const profile = await this.ports.profiles.update(changes);
			if (this.userId === userId) this.set({ status: "signed-in", profile });
			return { ok: true };
		} catch (error) {
			return failure(error);
		}
	};

	/** For the backend client: a valid token, or null when nobody is signed in. */
	getAccessToken = async (): Promise<string | null> =>
		this.userId ? this.ports.provider.getAccessToken() : null;

	/**
	 * Brings the state in line with the provider's session. Resolves false when the profile of
	 * a new session could not be loaded, which leaves the state signed out.
	 */
	private follow(session: ProviderSession | null): Promise<boolean> {
		if (!session) {
			this.userId = null;
			this.loading = null;
			this.set({ status: "signed-out" });
			return Promise.resolve(true);
		}

		// The same user again: a token refresh, or the event that follows a sign-in.
		if (this.userId === session.userId) return this.loading ?? Promise.resolve(true);

		this.userId = session.userId;
		const loading: Promise<boolean> = this.ports.profiles.load().then(
			(profile) => {
				// Only the latest session's profile counts.
				if (this.loading !== loading) return true;
				this.loading = null;
				this.set({ status: "signed-in", profile });
				return true;
			},
			() => {
				if (this.loading !== loading) return true;
				this.loading = null;
				this.userId = null;
				this.set({ status: "signed-out" });
				return false;
			}
		);
		this.loading = loading;
		return loading;
	}

	private async attempt(operation: () => Promise<void>): Promise<AuthResult> {
		try {
			await operation();
			return { ok: true };
		} catch (error) {
			return failure(error);
		}
	}

	@action
	private set(state: AuthState) {
		this.current = state;
	}
}

function failure(error: unknown): { ok: false; message: string } {
	return {
		ok: false,
		message: error instanceof Error && error.message ? error.message : "Something went wrong.",
	};
}
