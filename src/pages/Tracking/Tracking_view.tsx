import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { observer } from "mobx-react";
import { Info, Loader2, Radar, RotateCw } from "lucide-react";
import { OptionalLink } from "@/components/OptionalLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { detailsPath } from "@/organisation/organisation";
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
					<Badge variant="outline" className="text-md whitespace-nowrap">
						{tracking.slotsText} used
					</Badge>
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

			{tracking.status === "loaded" &&
				(tracking.organisations.length > 0 ? (
					tracking.organisations.map((organisation) => (
						<TrackedCard
							key={`${organisation.organisationTypeCode}/${organisation.registrationNo}`}
							organisation={organisation}
						/>
					))
				) : (
					<Alert>
						<Info className="h-4 w-4" />
						<AlertDescription>
							{tracking.slotsUsed < tracking.slots ? (
								<>
									You are not tracking an organisation yet. <NavLink to="/cyprus-company-search" className="underline">Find one</NavLink> and press Track: one is free.
								</>
							) : (
								"You stopped tracking your one free tracked organisation, and it can't be changed."
							)}
						</AlertDescription>
					</Alert>
				))}
		</div>
	);
});

function TrackedCard({ organisation }: { organisation: TrackedOrganisation }) {
	const check = checkLine(organisation);
	const latest = organisation.latestChange;

	return (
		<Card>
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
					<TrackButton organisation={organisation} />
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				{check && (
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
