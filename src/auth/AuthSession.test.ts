import { describe, expect, it } from "vitest";
import { AuthSession, type Profile, type ProfilePort } from "./AuthSession";
import { InMemoryAuthProvider } from "./InMemoryAuthProvider";

const flush = async () => {
	for (let i = 0; i < 10; i++) await Promise.resolve();
};

const maria: Profile = {
	id: "user-maria",
	email: "maria@example.com",
	fullName: "Maria Georgiou",
	phoneNumber: "",
};

/** The backend's profile routes as a map, counting the loads. */
function fakeProfiles(profiles: Profile[] = [maria]) {
	const stored = new Map(profiles.map((p) => [p.id, p]));
	const port = {
		loads: 0,
		failing: false,
		provider: null as InMemoryAuthProvider | null,
		load: async () => {
			port.loads++;
			if (port.failing) throw new Error("backend down");
			const id = port.provider!.currentUserId()!;
			return stored.get(id)!;
		},
		update: async (changes: { fullName?: string; phoneNumber?: string }) => {
			if (port.failing) throw new Error("backend down");
			const id = port.provider!.currentUserId()!;
			const updated = { ...stored.get(id)!, ...changes };
			stored.set(id, updated);
			return updated;
		},
	};
	return port satisfies ProfilePort & Record<string, unknown>;
}

function setup(options: { signedInAs?: string } = {}) {
	const provider = new InMemoryAuthProvider();
	provider.addAccount({ id: "user-maria", email: "maria@example.com", password: "secret1" });
	provider.addAccount({ id: "user-nikos", email: "nikos@example.com", password: "secret2" });
	if (options.signedInAs) provider.restoreSession(options.signedInAs);

	const profiles = fakeProfiles([
		maria,
		{ id: "user-nikos", email: "nikos@example.com", fullName: "Nikos", phoneNumber: "" },
	]);
	profiles.provider = provider;

	const errors: string[] = [];
	const auth = new AuthSession({
		provider,
		profiles,
		reportError: (message) => errors.push(message),
	});

	return { auth, provider, profiles, errors };
}

describe("AuthSession", () => {
	describe("starting", () => {
		it("is checking until the provider has answered", () => {
			const { auth } = setup();

			expect(auth.state).toEqual({ status: "checking" });
			auth.start();
			expect(auth.state).toEqual({ status: "checking" });
		});

		it("is signed out when there is no session", async () => {
			const { auth, profiles } = setup();

			auth.start();
			await flush();

			expect(auth.state).toEqual({ status: "signed-out" });
			expect(profiles.loads).toBe(0);
		});

		it("is signed in with the profile when a session exists", async () => {
			const { auth, profiles } = setup({ signedInAs: "user-maria" });

			auth.start();
			expect(auth.state).toEqual({ status: "checking" });
			await flush();

			expect(auth.state).toEqual({ status: "signed-in", profile: maria });
			expect(profiles.loads).toBe(1);
		});
	});

	describe("signing in with a password", () => {
		it("becomes signed in and loads the profile once", async () => {
			const { auth, profiles } = setup();
			auth.start();
			await flush();

			const result = await auth.signInWithPassword("maria@example.com", "secret1");

			expect(result).toEqual({ ok: true });
			expect(auth.state).toEqual({ status: "signed-in", profile: maria });
			expect(profiles.loads).toBe(1);
		});

		it("stays signed out and returns the error on wrong credentials", async () => {
			const { auth, profiles } = setup();
			auth.start();
			await flush();

			const result = await auth.signInWithPassword("maria@example.com", "wrong");

			expect(result).toEqual({ ok: false, message: "Invalid login credentials" });
			expect(auth.state).toEqual({ status: "signed-out" });
			expect(profiles.loads).toBe(0);
		});
	});

	describe("signing up", () => {
		it("needs a confirmation and stays signed out", async () => {
			const { auth, provider } = setup();
			auth.start();
			await flush();

			const result = await auth.signUp({
				email: "eleni@example.com",
				password: "secret3",
				fullName: "Eleni",
			});

			expect(result).toEqual({ ok: true, confirmationNeeded: true });
			expect(auth.state).toEqual({ status: "signed-out" });
			expect(provider.pendingSignUps).toEqual([{ email: "eleni@example.com", fullName: "Eleni" }]);
		});

		it("returns the provider's error", async () => {
			const { auth, provider } = setup();
			auth.start();
			await flush();
			provider.failNext("Password should be at least 6 characters");

			const result = await auth.signUp({ email: "eleni@example.com", password: "1", fullName: "Eleni" });

			expect(result).toEqual({ ok: false, message: "Password should be at least 6 characters" });
		});
	});

	describe("signing out", () => {
		it("becomes signed out", async () => {
			const { auth } = setup({ signedInAs: "user-maria" });
			auth.start();
			await flush();

			await auth.signOut();

			expect(auth.state).toEqual({ status: "signed-out" });
			expect(await auth.getAccessToken()).toBeNull();
		});

		it("follows a sign-out the provider raises itself", async () => {
			const { auth, provider } = setup({ signedInAs: "user-maria" });
			auth.start();
			await flush();

			provider.endSession();
			await flush();

			expect(auth.state).toEqual({ status: "signed-out" });
		});
	});

	describe("a session that changes under it", () => {
		it("keeps the same state when only the token is refreshed", async () => {
			const { auth, provider, profiles } = setup({ signedInAs: "user-maria" });
			auth.start();
			await flush();
			const before = auth.state;
			const tokenBefore = await auth.getAccessToken();

			provider.refreshToken();
			await flush();

			expect(auth.state).toBe(before);
			expect(profiles.loads).toBe(1);
			expect(await auth.getAccessToken()).not.toBe(tokenBefore);
		});

		it("loads the other profile when another user signs in", async () => {
			const { auth, provider, profiles } = setup({ signedInAs: "user-maria" });
			auth.start();
			await flush();

			provider.restoreSession("user-nikos");
			await flush();

			expect(auth.state).toMatchObject({ status: "signed-in", profile: { id: "user-nikos" } });
			expect(profiles.loads).toBe(2);
		});

		it("ignores a profile that arrives after the session ended", async () => {
			const { auth, provider } = setup({ signedInAs: "user-maria" });
			auth.start();

			provider.endSession();
			await flush();

			expect(auth.state).toEqual({ status: "signed-out" });
		});
	});

	describe("when the profile cannot be loaded", () => {
		it("is signed out and reports the error", async () => {
			const { auth, profiles, errors } = setup({ signedInAs: "user-maria" });
			profiles.failing = true;

			auth.start();
			await flush();

			expect(auth.state).toEqual({ status: "signed-out" });
			expect(errors).toHaveLength(1);
		});

		it("returns the failure from a sign-in", async () => {
			const { auth, profiles } = setup();
			auth.start();
			await flush();
			profiles.failing = true;

			const result = await auth.signInWithPassword("maria@example.com", "secret1");

			expect(result.ok).toBe(false);
			expect(auth.state).toEqual({ status: "signed-out" });
		});
	});

	describe("the profile", () => {
		it("changes in the state when it is updated", async () => {
			const { auth } = setup({ signedInAs: "user-maria" });
			auth.start();
			await flush();

			const result = await auth.updateProfile({ fullName: "Maria G.", phoneNumber: "99123456" });

			expect(result).toEqual({ ok: true });
			expect(auth.state).toEqual({
				status: "signed-in",
				profile: { ...maria, fullName: "Maria G.", phoneNumber: "99123456" },
			});
		});

		it("is left alone when the update fails", async () => {
			const { auth, profiles } = setup({ signedInAs: "user-maria" });
			auth.start();
			await flush();
			profiles.failing = true;

			const result = await auth.updateProfile({ fullName: "Maria G." });

			expect(result.ok).toBe(false);
			expect(auth.state).toEqual({ status: "signed-in", profile: maria });
		});

		it("cannot be updated when signed out", async () => {
			const { auth } = setup();
			auth.start();
			await flush();

			expect((await auth.updateProfile({ fullName: "X" })).ok).toBe(false);
		});
	});

	describe("the access token", () => {
		it("is the session's token when signed in and null when signed out", async () => {
			const { auth, provider } = setup();
			auth.start();
			await flush();
			expect(await auth.getAccessToken()).toBeNull();

			await auth.signInWithPassword("maria@example.com", "secret1");

			expect(await auth.getAccessToken()).toBe(await provider.getAccessToken());
			expect(await auth.getAccessToken()).toEqual(expect.any(String));
		});
	});

	describe("passwords", () => {
		it("sends a reset email", async () => {
			const { auth, provider } = setup();
			auth.start();
			await flush();

			const result = await auth.sendPasswordReset("maria@example.com");

			expect(result).toEqual({ ok: true });
			expect(provider.resetEmails).toEqual(["maria@example.com"]);
		});

		it("sets a new password for the signed-in user", async () => {
			const { auth, provider } = setup({ signedInAs: "user-maria" });
			auth.start();
			await flush();

			expect(await auth.setPassword("brand-new")).toEqual({ ok: true });
			await auth.signOut();

			expect((await auth.signInWithPassword("maria@example.com", "secret1")).ok).toBe(false);
			expect((await auth.signInWithPassword("maria@example.com", "brand-new")).ok).toBe(true);
			expect(provider.currentUserId()).toBe("user-maria");
		});
	});

	it("stops following the provider once disposed", async () => {
		const { auth, provider } = setup({ signedInAs: "user-maria" });
		auth.start();
		await flush();

		auth.dispose();
		provider.endSession();
		await flush();

		expect(auth.state).toMatchObject({ status: "signed-in" });
	});
});
