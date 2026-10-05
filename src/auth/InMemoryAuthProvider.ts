import type { AuthProviderPort, ProviderSession, SignUpDetails } from "./AuthSession";

type Account = { id: string; email: string; password: string };

/**
 * An identity provider held in memory, for tests. It behaves like the real one where the auth
 * module can tell: listeners hear the current session shortly after subscribing and on every
 * change, and a sign-up waits for a confirmation instead of opening a session.
 */
export class InMemoryAuthProvider implements AuthProviderPort {
	readonly pendingSignUps: Array<{ email: string; fullName: string }> = [];
	readonly resetEmails: string[] = [];

	private readonly accounts: Account[] = [];
	private readonly listeners = new Set<(session: ProviderSession | null) => void>();
	private session: { userId: string; token: string } | null = null;
	private tokens = 0;
	private nextFailure: string | null = null;

	// What a test arranges

	addAccount(account: Account) {
		this.accounts.push(account);
	}

	/** A session as the provider finds it on page load, or as another tab opens it. */
	restoreSession(userId: string) {
		this.open(userId);
	}

	/** The provider ends the session itself: it expired, or the user signed out elsewhere. */
	endSession() {
		this.session = null;
		this.notify();
	}

	refreshToken() {
		if (!this.session) return;
		this.session = { ...this.session, token: this.newToken() };
		this.notify();
	}

	failNext(message: string) {
		this.nextFailure = message;
	}

	currentUserId(): string | null {
		return this.session?.userId ?? null;
	}

	// The port

	onSessionChange(listener: (session: ProviderSession | null) => void) {
		this.listeners.add(listener);
		void Promise.resolve().then(() => {
			if (this.listeners.has(listener)) listener(this.current());
		});
		return () => {
			this.listeners.delete(listener);
		};
	}

	async getAccessToken() {
		return this.session?.token ?? null;
	}

	async signInWithPassword(email: string, password: string) {
		this.failIfAsked();
		const account = this.accounts.find((a) => a.email === email && a.password === password);
		if (!account) throw new Error("Invalid login credentials");
		this.open(account.id);
		return { userId: account.id };
	}

	async signInWithGoogle() {
		this.failIfAsked();
	}

	async signUp({ email, fullName }: SignUpDetails) {
		this.failIfAsked();
		this.pendingSignUps.push({ email, fullName });
		return { confirmationNeeded: true };
	}

	async signOut() {
		this.failIfAsked();
		this.endSession();
	}

	async sendPasswordReset(email: string) {
		this.failIfAsked();
		this.resetEmails.push(email);
	}

	async setPassword(password: string) {
		this.failIfAsked();
		const account = this.accounts.find((a) => a.id === this.session?.userId);
		if (!account) throw new Error("Auth session missing!");
		account.password = password;
	}

	private open(userId: string) {
		this.session = { userId, token: this.newToken() };
		this.notify();
	}

	private current(): ProviderSession | null {
		return this.session ? { userId: this.session.userId } : null;
	}

	private notify() {
		const session = this.current();
		for (const listener of this.listeners) {
			void Promise.resolve().then(() => {
				if (this.listeners.has(listener)) listener(session);
			});
		}
	}

	private newToken() {
		return `token-${++this.tokens}`;
	}

	private failIfAsked() {
		if (!this.nextFailure) return;
		const message = this.nextFailure;
		this.nextFailure = null;
		throw new Error(message);
	}
}
