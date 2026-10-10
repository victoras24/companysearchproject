import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { Info, Loader2, Pause, Radar, RotateCw } from "lucide-react";
import { OptionalLink } from "@/components/OptionalLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { detailsPath } from "@/organisation/organisation";
import { planLabel } from "@/plans";
import { checkLine, dayText, tracking, type TrackedOrganisation } from "@/tracking";
import { TrackButton } from "@/tracking/TrackButton";

const Tracking: React.FC = observer(() => {
	// First checks show as they finish while the page is open.
	useEffect(() => tracking.watch(), []);

	return (
		<div className="container mx-auto max-w-4xl p-6 space-y-6">
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
						<Radar className="h-7 w-7" /> Tracking
					</h1>
					<p className="text-muted-foreground">
						Tracked organisations are checked against the registry every night.
					</p>
				</div>
				{tracking.status === "loaded" && (
					<div className="flex flex-col items-end gap-2">
						<Badge variant="outline" className="text-md whitespace-nowrap">
							{tracking.slotsText} slots used
						</Badge>
						{tracking.swapsText && (
							<Badge variant="outline" className="whitespace-nowrap">
								{tracking.swapsText}
							</Badge>
						)}
						<NavLink to="/plans" className="text-sm underline whitespace-nowrap">
							{planLabel(tracking.plan)} plan
						</NavLink>
					</div>
				)}
			</div>

			{(tracking.status === "loading" || tracking.status === "idle") && (
				<Skeleton className="h-32 w-full rounded-lg" />
			)}

			{tracking.status === "error" && (
				<div className="space-y-4">
					<Alert variant="destructive">
						<Info className="h-4 w-4" />
						<AlertDescription>Something went wrong while loading your tracked organisations.</AlertDescription>
					</Alert>
					<Button variant="outline" onClick={tracking.reload}>
						<RotateCw className="mr-2 h-4 w-4" />
						Retry
					</Button>
				</div>
			)}

			{tracking.status === "loaded" && tracking.pausedOrganisations.length > 0 && (
				<Alert>
					<Pause className="h-4 w-4" />
					<AlertDescription>
						{/* One element: the description lays its children out as rows, which would split a link from its sentence. */}
						<span>
							{tracking.plan === "free" ? (
								tracking.freeChoiceOpen ? (
									<>
										Free keeps one tracked organisation. Choose the one to keep: it can't be changed afterwards.
										The others stay paused until you <NavLink to="/plans" className="underline">upgrade</NavLink>.
									</>
								) : (
									<>
										Free keeps one tracked organisation. The others are paused until you{" "}
										<NavLink to="/plans" className="underline">upgrade</NavLink>.
									</>
								)
							) : (
								<>
									You track more organisations than your plan's {tracking.slots} slots. Those over the limit are
									paused until you <NavLink to="/plans" className="underline">upgrade</NavLink>. You can choose
									which ones stay active.
								</>
							)}{" "}
							A paused organisation is not checked and sends no alerts.
						</span>
					</AlertDescription>
				</Alert>
			)}

			{tracking.status === "loaded" &&
				(tracking.organisations.length > 0 ? (
					<>
						{tracking.activeOrganisations.map((organisation) => (
							<TrackedCard
								key={`${organisation.organisationTypeCode}/${organisation.registrationNo}`}
								organisation={organisation}
							/>
						))}
						{tracking.pausedOrganisations.length > 0 && (
							<h2 className="text-xl font-semibold tracking-tight pt-2">Paused</h2>
						)}
						{tracking.pausedOrganisations.map((organisation) => (
							<TrackedCard
								key={`${organisation.organisationTypeCode}/${organisation.registrationNo}`}
								organisation={organisation}
							/>
						))}
					</>
				) : (
					<Alert>
						<Info className="h-4 w-4" />
						<AlertDescription>
							{tracking.refusal() ?? (
								<span>
									You are not tracking an organisation yet.{" "}
									<NavLink to="/cyprus-company-search" className="underline">
										Find one
									</NavLink>{" "}
									and press Track{tracking.plan === "free" ? ": one is free." : "."}
								</span>
							)}
						</AlertDescription>
					</Alert>
				))}
		</div>
	);
});

/** What makes a paused organisation active again, as far as the plan allows it. */
const ResumeButton = observer(({ organisation }: { organisation: TrackedOrganisation }) => {
	const [asking, setAsking] = useState(false);
	const [inPlaceOf, setInPlaceOf] = useState<string>("");

	const option = tracking.resumeOption(organisation);
	const busy = tracking.isBusy(organisation);
	const name = organisation.organisationName ?? "this organisation";
	const idOf = (o: TrackedOrganisation) => `${o.organisationTypeCode}/${o.registrationNo}`;

	const activate = async () => {
		const other = tracking.activeOrganisations.find((o) => idOf(o) === inPlaceOf);
		const result = await tracking.activate(organisation, option === "in-place-of" ? other : undefined);
		if (result.ok) toast.success(`${name} is active again. Its next check is tonight's.`);
		else toast.error(result.message);
	};

	if (option === null) return null;
	if (option === "upgrade")
		return (
			<Button variant="outline" asChild>
				<NavLink to="/plans">Upgrade to resume</NavLink>
			</Button>
		);

	return (
		<>
			<Button variant="outline" disabled={busy} onClick={() => (option === "room" ? activate() : setAsking(true))}>
				{busy && <Loader2 className="h-4 w-4 animate-spin" />}
				{option === "keep-on-free" ? "Keep this one" : "Make active"}
			</Button>

			<AlertDialog open={asking} onOpenChange={setAsking}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{option === "keep-on-free" ? `Keep ${name}?` : `Make ${name} active?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{option === "keep-on-free"
								? "This becomes your one free tracked organisation and can't be changed."
								: "Your plan is at its limit. Choose an active organisation to pause in its place. This is not a swap."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{option === "in-place-of" && (
						<Select value={inPlaceOf} onValueChange={setInPlaceOf}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Organisation to pause" />
							</SelectTrigger>
							<SelectContent>
								{tracking.activeOrganisations.map((active) => (
									<SelectItem key={idOf(active)} value={idOf(active)}>
										{active.organisationName ?? active.registrationNo}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={option === "in-place-of" && !inPlaceOf} onClick={activate}>
							{option === "keep-on-free" ? "Keep it" : "Make active"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
});

function TrackedCard({ organisation }: { organisation: TrackedOrganisation }) {
	const check = checkLine(organisation);
	const latest = organisation.latestChange;

	return (
		<Card className={organisation.paused ? "opacity-60" : undefined}>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<CardTitle className="text-xl">
							<OptionalLink to={detailsPath(organisation)}>{organisation.organisationName}</OptionalLink>
						</CardTitle>
						<CardDescription>
							{organisation.organisationType} · Reg No: {organisation.registrationNo} · tracked since{" "}
							{dayText(organisation.startedAt)}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<ResumeButton organisation={organisation} />
						<TrackButton organisation={organisation} />
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				{organisation.paused && (
					<p className="text-muted-foreground flex items-center gap-2">
						<Pause className="h-4 w-4" /> Paused: not checked, and no alerts.
					</p>
				)}
				{check && !organisation.paused && (
					<p className="text-muted-foreground flex items-center gap-2">
						{organisation.firstCheckInProgress && !organisation.checksFailing && (
							<Loader2 className="h-4 w-4 animate-spin" />
						)}
						{check}
					</p>
				)}
				{!organisation.firstCheckInProgress &&
					(latest ? (
						<p>
							<span className="text-muted-foreground">Latest change, {dayText(latest.detectedAt)}: </span>
							{latest.detail}
						</p>
					) : (
						<p className="text-muted-foreground">No changes recorded yet.</p>
					))}
			</CardContent>
		</Card>
	);
}

export default Tracking;
