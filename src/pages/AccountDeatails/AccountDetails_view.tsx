import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { flash } from "@/app/actions";
import { useAlertEmails } from "@/app/changes";
import { APP } from "@/app/routes";
import { box, Page, PageHeader, sectionLabel, Switch, textLink } from "@/app/ui";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { planLabel } from "@/plans";
import { tracking } from "@/tracking";

const row = "flex min-h-[46px] items-center justify-between gap-4 border-t border-divider text-[14px] first:border-t-0";
const field = "min-w-0 flex-1 border-0 bg-transparent text-right text-[14px] text-primary-text outline-none placeholder:text-faint";

/** A user's own details and settings, laid out as a phone's settings are. */
const AccountDetails = observer(() => {
	const navigate = useNavigate();
	const alertEmails = useAlertEmails();
	const [draft, setDraft] = useState<{ fullName: string; phoneNumber: string } | null>(null);
	const [saving, setSaving] = useState(false);
	const [resetSent, setResetSent] = useState(false);

	// The route only shows this page to a signed-in user.
	if (auth.state.status !== "signed-in") return null;
	const profile = auth.state.profile;

	const save = async () => {
		if (!draft || saving) return;
		setSaving(true);
		const result = await auth.updateProfile({ fullName: draft.fullName.trim(), phoneNumber: draft.phoneNumber.trim() });
		setSaving(false);

		if (!result.ok) return toast.error("Your details could not be updated. Please try again.");
		setDraft(null);
		flash("Your details are updated.");
	};

	const sendReset = async () => {
		if (resetSent) return;
		const result = await auth.sendPasswordReset(profile.email);
		if (!result.ok) return toast.error(result.message);
		setResetSent(true);
		flash(`Reset link sent to ${profile.email}.`);
	};

	const logOut = async () => {
		await auth.signOut();
		navigate("/login", { replace: true });
	};

	const used = Math.min(tracking.slotsUsed, tracking.slots);

	return (
		<Page>
			<PageHeader title="Account" />

			<div className="max-w-[640px]">
				<div className="mx-1 mt-[26px] mb-2 flex items-baseline justify-between">
					<span className="text-[12.5px] text-muted-foreground">Details</span>
					{draft ? (
						<span className="flex gap-3.5">
							<button type="button" disabled={saving} onClick={() => setDraft(null)} className={cn(textLink, "text-muted-foreground")}>
								Cancel
							</button>
							<button type="button" disabled={saving} onClick={save} className={`${textLink} font-semibold`}>
								{saving ? "Saving…" : "Save"}
							</button>
						</span>
					) : (
						<button
							type="button"
							onClick={() => setDraft({ fullName: profile.fullName, phoneNumber: profile.phoneNumber })}
							className={textLink}
						>
							Edit
						</button>
					)}
				</div>
				<div className={`${box} px-4`}>
					<label className={row}>
						<span className="flex-none">Name</span>
						{draft ? (
							<input
								value={draft.fullName}
								maxLength={200}
								autoFocus
								onChange={(event) => setDraft({ ...draft, fullName: event.target.value })}
								className={field}
							/>
						) : (
							<span className="text-right text-muted-foreground">{profile.fullName || "Not set"}</span>
						)}
					</label>
					<div className={row}>
						<span className="flex-none">Email</span>
						<span className="text-right [overflow-wrap:anywhere] text-muted-foreground">{profile.email}</span>
					</div>
					<label className={row}>
						<span className="flex-none">Phone</span>
						{draft ? (
							<input
								type="tel"
								value={draft.phoneNumber}
								maxLength={30}
								placeholder="Not set"
								onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })}
								onKeyDown={(event) => {
									if (event.key === "Enter") void save();
								}}
								className={field}
							/>
						) : (
							<span className="text-right text-muted-foreground">{profile.phoneNumber || "Not set"}</span>
						)}
					</label>
				</div>

				<div className={sectionLabel}>Notifications</div>
				<div className={`${box} flex items-center gap-3.5 px-4 py-2.5`}>
					<div className="min-w-0 flex-1">
						<div className="text-[14px]">Alert emails</div>
						<div className="mt-0.5 text-[12.5px] text-muted-foreground">One email on days your tracked companies change.</div>
					</div>
					<Switch label="Alert emails" checked={alertEmails.on} disabled={alertEmails.saving} onChange={alertEmails.set} />
				</div>

				<div className={sectionLabel}>Subscription &amp; security</div>
				<div className={`${box} px-4`}>
					<Link to={APP.plans} className={`${row} text-foreground`}>
						<span>Plan</span>
						<span className="flex items-center gap-1.5 text-muted-foreground">
							{tracking.status === "loaded" ? `${planLabel(tracking.plan)} · ${used} / ${tracking.slots}` : ""}
							<ChevronRight className="size-3 text-faint" strokeWidth={2.4} />
						</span>
					</Link>
					<button type="button" onClick={sendReset} className={`${row} w-full cursor-pointer text-left text-foreground`}>
						<span>Password</span>
						<span className="text-primary-text">{resetSent ? "Email sent ✓" : "Send reset link"}</span>
					</button>
				</div>

				<div className={`${box} mt-[26px]`}>
					<button type="button" onClick={logOut} className="flex min-h-[46px] w-full cursor-pointer items-center justify-center text-[14px] text-danger">
						Log out
					</button>
				</div>
			</div>
		</Page>
	);
});

export default AccountDetails;
