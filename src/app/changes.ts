import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/auth";
import { seenChanges, tracking, type TrackedOrganisation } from "@/tracking";
import { flash } from "./actions";

/**
 * The latest change of each tracked company that is being checked, newest first. Read it inside
 * an observer.
 */
export function recentChanges(): Array<TrackedOrganisation & { latestChange: NonNullable<TrackedOrganisation["latestChange"]> }> {
	return tracking.activeOrganisations
		.filter((o): o is TrackedOrganisation & { latestChange: NonNullable<TrackedOrganisation["latestChange"]> } => o.latestChange !== null)
		.sort((a, b) => b.latestChange.detectedAt.localeCompare(a.latestChange.detectedAt));
}

/** How many of them the user has not looked at yet. Read it inside an observer. */
export const newChangeCount = () => recentChanges().filter((o) => seenChanges.isNew(o.latestChange)).length;

/** The alert-emails switch, for the screens that show it. Use it inside an observer. */
export function useAlertEmails() {
	const [saving, setSaving] = useState(false);
	const on = auth.state.status === "signed-in" && auth.state.profile.alertEmails;

	const set = async (alertEmails: boolean) => {
		setSaving(true);
		const result = await auth.updateProfile({ alertEmails });
		setSaving(false);

		if (!result.ok) toast.error("Your alert emails could not be changed. Please try again.");
		else flash(alertEmails ? "Alert emails are on." : "Alert emails are off. Changes still show on Tracking.");
	};

	return { on, saving, set };
}
