import { describe, expect, it } from "vitest";
import { checkNewPassword, checkSignIn, checkSignUp, normaliseEmail, routeFor } from "./credentials";

describe("sign-in and sign-up rules", () => {
	const valid = { fullName: "Maria Georgiou", email: "maria@example.com", password: "secret1" };

	it("accepts complete details", () => {
		expect(checkSignIn(valid)).toBeNull();
		expect(checkSignUp(valid)).toBeNull();
	});

	it("needs every field", () => {
		expect(checkSignIn({ email: "", password: "secret1" })).toBe("Please fill all the fields");
		expect(checkSignIn({ email: "maria@example.com", password: "" })).toBe("Please fill all the fields");
		expect(checkSignUp({ ...valid, fullName: "   " })).toBe("Please fill all the fields");
	});

	it.each(["maria", "maria@", "@example.com", "maria example@x.com"])(
		"rejects %s as an email",
		(email) => {
			expect(checkSignIn({ email, password: "secret1" })).toBe("Please enter a valid email address");
			expect(checkSignUp({ ...valid, email })).toBe("Please enter a valid email address");
		}
	);

	it("needs six characters in the password, for both forms alike", () => {
		expect(checkSignIn({ email: valid.email, password: "12345" })).toBe("Password must be at least 6 characters");
		expect(checkSignUp({ ...valid, password: "12345" })).toBe("Password must be at least 6 characters");
	});

	it("checks a new password and its repeat", () => {
		expect(checkNewPassword("secret1", "secret1")).toBeNull();
		expect(checkNewPassword("12345", "12345")).toBe("Password must be at least 6 characters");
		expect(checkNewPassword("secret1", "secret2")).toBe("The passwords do not match");
	});

	it("trims and lower-cases an email", () => {
		expect(normaliseEmail("  Maria@Example.COM ")).toBe("maria@example.com");
	});
});

describe("a page that needs a user", () => {
	const profile = { id: "u", email: "m@example.com", fullName: "M", phoneNumber: "" };

	it("waits while the session is being checked", () => {
		expect(routeFor({ status: "checking" })).toBe("loading");
	});

	it("shows the sign-in page to a signed-out visitor", () => {
		expect(routeFor({ status: "signed-out" })).toBe("sign-in");
	});

	it("shows the page to a signed-in user", () => {
		expect(routeFor({ status: "signed-in", profile })).toBe("page");
	});
});
