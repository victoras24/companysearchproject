import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, CircleAlert, Mail } from "lucide-react";
import { auth } from "@/auth";
import {
	checkNewPassword,
	checkResetEmail,
	checkSignIn,
	checkSignUp,
	normaliseEmail,
} from "@/auth/credentials";
import { SessionLoader } from "@/auth/RequireUser";
import { Logo } from "@/site/Logo";
import { EASE } from "@/site/motion";
import { APP_HOME } from "@/site/SiteHeader";
import { ThemeToggle } from "@/site/ThemeToggle";
import { primaryPill } from "@/site/ui";

export type AuthForm = "login" | "signup" | "forgot" | "reset";

/** What the page shows: one of the forms, or what follows it. */
type View = AuthForm | "sent" | "done" | "expired";

const PERKS = [
	["Track your first company free", "Get an email when its officials, address, name or status change."],
	["Save and group companies", "Organise the companies you follow into your own groups."],
	["All your reports in one place", "Every Full Company Report you buy, kept in your account."],
] as const;

const LABELS: Record<AuthForm, [string, string]> = {
	login: ["Log in", "Logging in…"],
	signup: ["Create free account", "Creating account…"],
	forgot: ["Send reset link", "Sending…"],
	reset: ["Update password", "Updating…"],
};

const heading = "m-0 font-display text-[clamp(30px,4vw,40px)] leading-[1.05] font-semibold tracking-[-0.03em]";
const lede = "mt-2.5 mb-0 text-[15.5px] leading-normal text-muted-foreground";
const fieldLabel = "text-[13px] font-semibold text-text2";
const input =
	"h-[50px] w-full rounded-[14px] border border-input bg-surface px-4 text-[15.5px] text-ink outline-none placeholder:text-faint focus:border-primary-text focus:shadow-[0_0_0_3px_var(--tint)]";
const textLink = "cursor-pointer font-semibold text-primary-text hover:text-deep";
const outlinePill =
	"inline-flex h-12 cursor-pointer items-center rounded-full border border-input bg-surface px-[22px] text-[15px] font-semibold text-ink hover:border-border-strong";

/**
 * Logging in, making an account, and getting back into one: one page with a view for each.
 * `form` is the view the address asks for; what follows a form (the email that was sent, the
 * password that was changed) shows in its place.
 */
const AuthPage = observer(({ form }: { form: AuthForm }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const still = useReducedMotion();

	const [after, setAfter] = useState<"sent" | "done" | null>(null);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [repeated, setRepeated] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [resent, setResent] = useState(false);

	// A new address is a new form: nothing of the last one's outcome carries over.
	useEffect(() => {
		setAfter(null);
		setError("");
		setBusy(false);
		setShowPassword(false);
		setResent(false);
	}, [form]);

	const status = auth.state.status;
	const from = (location.state as { from?: string } | null)?.from;

	// Someone signed in has no use for the login and sign-up forms; this is also where a login lands.
	useEffect(() => {
		if (status === "signed-in" && (form === "login" || form === "signup")) {
			navigate(from ?? APP_HOME, { replace: true });
		}
	}, [status, form, from, navigate]);

	// The reset link signs the user in; without a session there is no one to set a password for.
	const view: View = after ?? (form === "reset" && status === "signed-out" ? "expired" : form);

	if (form === "reset" && status === "checking") return <SessionLoader />;

	const edit = (set: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
		set(event.target.value);
		setError("");
	};

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (busy) return;

		const problem =
			form === "login"
				? checkSignIn({ email, password })
				: form === "signup"
					? checkSignUp({ fullName, email, password })
					: form === "forgot"
						? checkResetEmail(email)
						: checkNewPassword(password, repeated);
		if (problem) return setError(problem);

		setBusy(true);
		setError("");
		const address = normaliseEmail(email);
		const result =
			form === "login"
				? await auth.signInWithPassword(address, password)
				: form === "signup"
					? await auth.signUp({ email: address, password, fullName: fullName.trim() })
					: form === "forgot"
						? await auth.sendPasswordReset(address)
						: await auth.setPassword(password);
		setBusy(false);

		if (!result.ok) return setError(result.message);
		if (form === "forgot") setAfter("sent");
		else if (form === "reset") setAfter("done");
		else if (form === "signup" && "confirmationNeeded" in result && result.confirmationNeeded) setAfter("sent");
	};

	// On success the browser leaves for Google and comes back to /auth/callback.
	const withGoogle = async () => {
		if (busy) return;
		setBusy(true);
		const result = await auth.signInWithGoogle();
		if (!result.ok) {
			setError(result.message);
			setBusy(false);
		}
	};

	const resend = async () => {
		const address = normaliseEmail(email);
		const result =
			form === "forgot"
				? await auth.sendPasswordReset(address)
				: await auth.signUp({ email: address, password, fullName: fullName.trim() });
		if (result.ok) setResent(true);
		else setError(result.message);
	};

	const isForm = view === "login" || view === "signup" || view === "forgot" || view === "reset";

	return (
		<div className="grid min-h-screen grid-cols-1 bg-background min-[960px]:grid-cols-2">
			<div className="flex min-w-0 flex-col px-[clamp(18px,5vw,56px)] py-[clamp(18px,3vw,28px)]">
				<div className="flex items-center gap-4">
					<Logo />
					<Link to="/" className="ml-auto text-[14.5px] whitespace-nowrap text-text2 hover:text-ink">
						Back to site
					</Link>
					<ThemeToggle />
				</div>

				<div className="flex flex-1 items-center justify-center py-[clamp(32px,6vw,56px)]">
					<motion.div
						key={view}
						className="w-full max-w-[400px]"
						initial={still ? false : { opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45, ease: EASE }}
					>
						{view === "login" && (
							<>
								<h1 className={heading}>Welcome back</h1>
								<p className={lede}>Log in to your saved companies, groups and alerts.</p>
							</>
						)}
						{view === "signup" && (
							<>
								<h1 className={heading}>Create your free account</h1>
								<p className={lede}>Save, group and track Cyprus companies. No card needed.</p>
							</>
						)}
						{view === "forgot" && (
							<>
								<Link to="/login" className="mb-[22px] inline-block text-[14.5px] text-muted-foreground hover:text-ink">
									← Back to log in
								</Link>
								<h1 className={heading}>Reset your password</h1>
								<p className={lede}>Enter your email and we'll send you a link to choose a new one.</p>
							</>
						)}
						{view === "reset" && (
							<>
								<h1 className={heading}>Choose a new password</h1>
								<p className={lede}>At least 6 characters.</p>
							</>
						)}

						{(view === "login" || view === "signup") && (
							<>
								<button
									type="button"
									onClick={withGoogle}
									className="mt-7 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border border-input bg-surface text-[15px] font-semibold text-ink transition-colors duration-200 hover:border-border-strong"
								>
									<GoogleMark />
									Continue with Google
								</button>
								<div className="mt-[22px] mb-1 flex items-center gap-3.5 text-[13px] text-faint">
									<span className="h-px flex-1 bg-border" />
									or with email
									<span className="h-px flex-1 bg-border" />
								</div>
							</>
						)}

						{isForm && (
							<form onSubmit={submit} noValidate className="mt-[18px] flex flex-col gap-3.5">
								{view === "signup" && (
									<label className="flex flex-col gap-1.5">
										<span className={fieldLabel}>Full name</span>
										<input
											value={fullName}
											onChange={edit(setFullName)}
											autoComplete="name"
											placeholder="Maria Georgiou"
											className={input}
										/>
									</label>
								)}
								{view !== "reset" && (
									<label className="flex flex-col gap-1.5">
										<span className={fieldLabel}>Email</span>
										<input
											type="email"
											value={email}
											onChange={edit(setEmail)}
											autoComplete="email"
											placeholder="you@company.com"
											className={input}
										/>
									</label>
								)}
								{view !== "forgot" && (
									<div className="flex flex-col gap-1.5">
										<span className="flex items-baseline justify-between gap-2.5">
											<label htmlFor="auth-password" className={fieldLabel}>
												{view === "reset" ? "New password" : "Password"}
											</label>
											{view === "login" && (
												<Link to="/forgot-password" className={`${textLink} text-[13px]`}>
													Forgot password?
												</Link>
											)}
										</span>
										<span className="relative block">
											<input
												id="auth-password"
												type={showPassword ? "text" : "password"}
												value={password}
												onChange={edit(setPassword)}
												autoComplete={view === "login" ? "current-password" : "new-password"}
												placeholder="••••••••"
												className={`${input} pr-16`}
											/>
											<button
												type="button"
												onClick={() => setShowPassword((shown) => !shown)}
												className="absolute top-2 right-2 h-[34px] cursor-pointer rounded-[10px] px-2.5 text-[13px] font-semibold text-muted-foreground hover:bg-field"
											>
												{showPassword ? "Hide" : "Show"}
											</button>
										</span>
									</div>
								)}
								{view === "reset" && (
									<label className="flex flex-col gap-1.5">
										<span className={fieldLabel}>Repeat new password</span>
										<input
											type={showPassword ? "text" : "password"}
											value={repeated}
											onChange={edit(setRepeated)}
											autoComplete="new-password"
											placeholder="••••••••"
											className={input}
										/>
									</label>
								)}
								{error && <ErrorBanner message={error} />}
								<button
									type="submit"
									className={`${primaryPill} mt-1.5 h-[52px] cursor-pointer text-[16px] transition-[background-color,opacity] duration-200`}
									style={{ opacity: busy ? 0.7 : 1 }}
								>
									{LABELS[view][busy ? 1 : 0]}
								</button>
								{view === "signup" && (
									<p className="mt-0.5 mb-0 text-center text-[13px] leading-normal text-muted-foreground">
										By creating an account you agree to our{" "}
										<Link to="/terms" className="text-primary-text hover:text-deep">
											Terms of Service
										</Link>
										.
									</p>
								)}
							</form>
						)}

						{view === "sent" && (
							<>
								<div className="grid size-16 place-items-center rounded-[20px] bg-tint text-primary-text">
									<Mail className="size-7" />
								</div>
								<h1 className={`${heading} mt-6`}>Check your inbox</h1>
								<p className="mt-3 mb-0 text-[15.5px] leading-[1.55] text-muted-foreground">
									{form === "signup"
										? "Confirm your email to finish creating your account. We sent a link to"
										: "We sent a password reset link to"}{" "}
									<span className="font-semibold break-all text-ink">{normaliseEmail(email)}</span>.
								</p>
								<div className="mt-6 flex flex-wrap gap-1.5 text-[14px] text-muted-foreground">
									Didn't get it? Check spam, or
									<button type="button" onClick={resend} disabled={resent} className={`${textLink} text-[14px]`}>
										{resent ? "Sent again ✓" : "resend the email"}
									</button>
								</div>
								{error && (
									<div className="mt-3.5">
										<ErrorBanner message={error} />
									</div>
								)}
								<Link to="/login" onClick={() => setAfter(null)} className={`${outlinePill} mt-7`}>
									Back to log in
								</Link>
							</>
						)}

						{view === "done" && (
							<>
								<div className="grid size-16 place-items-center rounded-full bg-primary text-white">
									<Check className="size-7" strokeWidth={2.6} />
								</div>
								<h1 className={`${heading} mt-6`}>Password updated</h1>
								<p className="mt-3 mb-0 text-[15.5px] leading-[1.55] text-muted-foreground">
									You're signed in with your new password.
								</p>
								<Link to={APP_HOME} className={`${primaryPill} mt-7 h-[50px] px-6 text-[15.5px]`}>
									Open web app
								</Link>
							</>
						)}

						{view === "expired" && (
							<>
								<h1 className={heading}>This link has expired</h1>
								<p className={lede}>This reset link is invalid or has expired. Ask for a new one.</p>
								<Link to="/forgot-password" className={`${primaryPill} mt-7 h-[50px] px-6 text-[15.5px]`}>
									Send a new link
								</Link>
							</>
						)}

						{view === "login" && (
							<p className="mt-7 mb-0 text-center text-[14.5px] text-muted-foreground">
								New here?{" "}
								<Link to="/signup" state={location.state} className={textLink}>
									Create a free account
								</Link>
							</p>
						)}
						{view === "signup" && (
							<p className="mt-7 mb-0 text-center text-[14.5px] text-muted-foreground">
								Already have an account?{" "}
								<Link to="/login" state={location.state} className={textLink}>
									Log in
								</Link>
							</p>
						)}
					</motion.div>
				</div>

				<div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-faint">
					<span>© {new Date().getFullYear()} Company Search Cyprus</span>
					<Link to="/terms" className="hover:text-ink">
						Terms
					</Link>
					<Link to="/legal-disclaimer" className="hover:text-ink">
						Disclaimer
					</Link>
				</div>
			</div>

			<aside className="hidden py-4 pr-4 min-[960px]:block">
				<div className="flex h-full min-h-[calc(100vh-32px)] flex-col justify-between gap-10 rounded-[32px] bg-primary p-[clamp(36px,4vw,56px)] text-white">
					<div className="text-[13px] font-semibold tracking-[0.06em] text-on-primary-muted uppercase">The web app · free</div>
					<div>
						<div className="max-w-[460px] font-display text-[clamp(34px,3.6vw,50px)] leading-[1.04] font-semibold tracking-[-0.035em] text-balance">
							Know the moment a company changes.
						</div>
						<div className="mt-9 flex max-w-[440px] flex-col gap-3">
							{PERKS.map(([title, text]) => (
								<div key={title} className="flex items-start gap-3.5 rounded-[18px] border border-white/[0.12] bg-white/[0.08] px-[18px] py-4">
									<span className="grid size-6 flex-none place-items-center rounded-full bg-white text-[12px] font-bold text-[#0E6B4F]">
										✓
									</span>
									<div>
										<div className="text-[15.5px] font-semibold">{title}</div>
										<div className="mt-0.5 text-[14px] leading-normal text-on-primary-soft">{text}</div>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="text-[14px] text-on-primary-muted">
						Data from the official Cyprus government registry, checked nightly.
					</div>
				</div>
			</aside>
		</div>
	);
});

function ErrorBanner({ message }: { message: string }) {
	return (
		<div role="alert" className="flex items-center gap-2.5 rounded-xl bg-danger-tint px-3.5 py-3 text-[14px] font-medium text-danger">
			<CircleAlert className="size-[15px] flex-none" strokeWidth={2.2} />
			{message}
		</div>
	);
}

function GoogleMark() {
	return (
		<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
			<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z" />
			<path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
			<path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z" />
			<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z" />
		</svg>
	);
}

export default AuthPage;
