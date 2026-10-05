import type { AuthState } from "./AuthSession";

// One set of rules for the sign-in and sign-up forms. Each check returns the message to show,
// or null when the details are fine.

const MINIMUM_PASSWORD_LENGTH = 6;
const EMAIL = /^[^\s@]+@[^\s@]+$/;

const FILL_ALL = "Please fill all the fields";

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

export function checkSignIn(details: { email: string; password: string }): string | null {
	if (!details.email.trim() || !details.password) return FILL_ALL;
	return checkEmail(details.email) ?? checkPassword(details.password);
}

export function checkSignUp(details: {
	fullName: string;
	email: string;
	password: string;
}): string | null {
	if (!details.fullName.trim()) return FILL_ALL;
	return checkSignIn(details);
}

export function checkNewPassword(password: string, repeated: string): string | null {
	return checkPassword(password) ?? (password === repeated ? null : "The passwords do not match");
}

function checkEmail(email: string): string | null {
	return EMAIL.test(email.trim()) ? null : "Please enter a valid email address";
}

function checkPassword(password: string): string | null {
	return password.length >= MINIMUM_PASSWORD_LENGTH
		? null
		: `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters`;
}

/** What a page that needs a user shows for each auth state. */
export function routeFor(state: AuthState): "loading" | "sign-in" | "page" {
	if (state.status === "checking") return "loading";
	return state.status === "signed-in" ? "page" : "sign-in";
}
