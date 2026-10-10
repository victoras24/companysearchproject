import { useState } from "react";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { Loader2, Radio } from "lucide-react";
import { auth } from "@/auth";
import { promptSignUp } from "@/auth/promptSignUp";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { actionPill } from "@/site/ui";
import { tracking } from "./index";
import type { TrackableOrganisation } from "./Tracking";

type Props = {
	organisation: TrackableOrganisation;
	/** For a search result: smaller, and an icon alone on a phone. */
	compact?: boolean;
};

/**
 * Tracks an organisation, or stops tracking it. Where tracking is final, or either uses a swap, it
 * asks first. On a plan with no swaps a tracked organisation cannot be untracked. A signed-out
 * user is told what a free account would give them.
 */
export const TrackButton = observer(({ organisation, compact = false }: Props) => {
	const [asking, setAsking] = useState<"track" | "untrack" | null>(null);

	const signedOut = auth.state.status === "signed-out";
	const availability = tracking.availability(organisation);
	const tracked = availability === "tracked";
	const busy = tracking.isBusy(organisation);
	const refusal = tracking.refusal(organisation);
	const trackWarning = tracking.trackWarning(organisation);
	const untrackRefusal = tracked ? tracking.untrackRefusal : null;
	const name = organisation.organisationName ?? "this organisation";

	const track = async () => {
		const result = await tracking.track(organisation);
		if (result.ok) toast.success(`Tracking ${name}. Its first check takes about a minute.`);
		else toast.error(result.message);
	};

	const untrack = async () => {
		const result = await tracking.untrack(organisation);
		if (result.ok) toast.success(`Stopped tracking ${name}`);
		else toast.error(result.message);
	};

	const press = (event: React.MouseEvent) => {
		// In a search result the button sits inside the row that opens the organisation.
		event.preventDefault();
		event.stopPropagation();

		if (signedOut) {
			promptSignUp("Create a free account to track companies and get email alerts.");
		} else if (tracked) {
			setAsking("untrack");
		} else if (trackWarning) {
			setAsking("track");
		} else {
			track();
		}
	};

	const title = signedOut
		? "Be told when this organisation changes"
		: tracked
			? (untrackRefusal ?? "Stop tracking")
			: (refusal ?? "Be told when this organisation changes");
	const disabled =
		busy || (!signedOut && (refusal !== null || untrackRefusal !== null || availability === "unknown"));

	return (
		<>
			{/* The span carries the title: a disabled button shows none. */}
			<span title={title} className="inline-flex">
				<button
					type="button"
					aria-label={compact ? title : undefined}
					disabled={disabled}
					onClick={press}
					className={actionPill({ compact, on: tracked })}
				>
					{busy ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}
					<span className={compact ? "hidden md:inline" : undefined}>{tracked ? "Tracking" : "Track"}</span>
				</button>
			</span>

			<AlertDialog open={asking !== null} onOpenChange={(open) => !open && setAsking(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{asking === "untrack" ? `Stop tracking ${name}?` : `Track ${name}?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{asking === "untrack" ? tracking.untrackWarning : trackWarning}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={asking === "untrack" ? untrack : track}>
							{asking === "untrack" ? "Stop tracking" : "Track"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
});
