import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { Loader2, Radar } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
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
import { tracking } from "./index";
import { SLOT_USED, type TrackableOrganisation } from "./Tracking";

type Props = {
	organisation: TrackableOrganisation;
	/** An icon alone, for a search result. */
	compact?: boolean;
};

/**
 * Tracks an organisation, or stops tracking it. Where the plan makes either one final, it asks
 * first. A signed-out user is sent to sign in.
 */
export const TrackButton = observer(({ organisation, compact = false }: Props) => {
	const navigate = useNavigate();
	const [asking, setAsking] = useState<"track" | "untrack" | null>(null);

	const signedOut = auth.state.status === "signed-out";
	const availability = tracking.availability(organisation);
	const tracked = availability === "tracked";
	const busy = tracking.isBusy(organisation);
	const name = organisation.organisationName ?? "this organisation";

	const track = async () => {
		const result = await tracking.track(organisation);
		if (result.ok) toast.success(`Tracking ${name}. Its first check takes about a minute.`);
		else toast.error(result.message);
	};

	const untrack = async () => {
		const result = await tracking.untrack(organisation);
		if (result.ok) toast.success(`Stopped tracking ${name}`);
		else toast.error("Failed to stop tracking");
	};

	const press = (event: React.MouseEvent) => {
		// In a search result the button sits inside the link to the organisation.
		event.preventDefault();
		event.stopPropagation();

		if (signedOut) {
			toast.info("Log in or register to track an organisation");
			navigate("/account");
		} else if (tracked) {
			if (tracking.untrackWarning) setAsking("untrack");
			else untrack();
		} else if (tracking.trackWarning) {
			setAsking("track");
		} else {
			track();
		}
	};

	const label = tracked ? "Tracking" : "Track";
	const title = signedOut
		? "Log in to track this organisation"
		: tracked
			? "Stop tracking"
			: availability === "no-slot"
				? SLOT_USED
				: "Be told when this organisation changes";
	const disabled = busy || (!signedOut && (availability === "no-slot" || availability === "unknown"));
	const icon = busy ? (
		<Loader2 className="h-4 w-4 animate-spin" />
	) : (
		<Radar className={tracked ? "h-4 w-4 text-primary" : "h-4 w-4"} />
	);

	return (
		<>
			{/* The span carries the title: a disabled button shows none. */}
			<span title={title}>
				{compact ? (
					<Button variant="ghost" size="icon" className="h-8 w-8" aria-label={title} disabled={disabled} onClick={press}>
						{icon}
					</Button>
				) : (
					<Button variant={tracked ? "secondary" : "outline"} disabled={disabled} onClick={press}>
						{icon}
						{label}
					</Button>
				)}
			</span>

			<AlertDialog open={asking !== null} onOpenChange={(open) => !open && setAsking(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{asking === "untrack" ? `Stop tracking ${name}?` : `Track ${name}?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{asking === "untrack" ? tracking.untrackWarning : tracking.trackWarning}
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
