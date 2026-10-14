import { describe, expect, it } from "vitest";
import { authClientOptions } from "./SupabaseAuthProvider";

describe("the Supabase auth client's options", () => {
	const options = authClientOptions("https://abcdefgh.supabase.co", "anon-key");

	it("keeps the session under the key supabase-js used, so signed-in users stay signed in", () => {
		expect(options.storageKey).toBe("sb-abcdefgh-auth-token");
	});

	it("talks to the project's auth endpoint", () => {
		expect(options.url).toBe("https://abcdefgh.supabase.co/auth/v1");
	});

	it("finds the same endpoint when the project URL ends in a slash", () => {
		expect(authClientOptions("https://abcdefgh.supabase.co/", "anon-key").url).toBe(
			"https://abcdefgh.supabase.co/auth/v1"
		);
	});

	it("sends the anon key as supabase-js did", () => {
		expect(options.headers).toMatchObject({ apikey: "anon-key", Authorization: "Bearer anon-key" });
	});
});
