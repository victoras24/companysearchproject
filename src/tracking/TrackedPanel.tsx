import { NavLink } from "react-router-dom";
import { observer } from "mobx-react";
import { Info, Loader2, Radar, RotateCw } from "lucide-react";
import { auth } from "@/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { checkLine, dayText, tracking } from "./index";
import { SLOT_USED, type ChangeKind, type TrackableOrganisation, type TrackedDetails } from "./Tracking";
import { TrackButton } from "./TrackButton";

const KIND_LABELS: Record<ChangeKind, string> = {
	filing: "Filing",
	pending_service: "Pending service",
	status: "Status",
	official: "Official",
	address: "Address",
	name: "Name",
};

/**
 * The tracking part of an organisation's page: for a user tracking it, its changes, pending
 * services and filings; for anyone else, what tracking it would give them.
 */
export const TrackedPanel = observer(({ organisation }: { organisation: TrackableOrganisation }) => {
	const signedOut = auth.state.status === "signed-out";
	const availability = tracking.availability(organisation);
	const view = tracking.details;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Radar className="h-5 w-5" /> Tracking
				</CardTitle>
				<CardDescription>
					Filings, pending services and every change the registry records, checked every night.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{availability === "tracked" ? (
					<>
						{view.status === "loading" && <Skeleton className="h-32 w-full rounded-lg" />}
						{view.status === "error" && (
							<div className="space-y-4">
								<Alert variant="destructive">
									<Info className="h-4 w-4" />
									<AlertDescription>Something went wrong while loading what was tracked.</AlertDescription>
								</Alert>
								<Button variant="outline" onClick={() => tracking.open(organisation)}>
									<RotateCw className="mr-2 h-4 w-4" />
									Retry
								</Button>
							</div>
						)}
						{view.status === "loaded" && <Details details={view.details} />}
					</>
				) : (
					<div className="space-y-4">
						<p className="text-muted-foreground">
							{availability === "no-slot" ? (
								<>
									{SLOT_USED} See it on your <NavLink to="/tracking" className="underline">Tracking page</NavLink>.
								</>
							) : signedOut ? (
								"Log in and track this organisation to see its filings and pending services, and every change from then on. One organisation is free."
							) : (
								"Track this organisation to see its filings and pending services, and every change from now on."
							)}
						</p>
						{availability !== "no-slot" && <TrackButton organisation={organisation} />}
					</div>
				)}
			</CardContent>
		</Card>
	);
});

function Details({ details }: { details: TrackedDetails }) {
	const check = checkLine(details);

	if (details.firstCheckInProgress) {
		return (
			<p className="text-muted-foreground flex items-center gap-2">
				{!details.checksFailing && <Loader2 className="h-4 w-4 animate-spin" />}
				{check}
			</p>
		);
	}

	// The registry lists filings oldest first.
	const filings = [...details.filings].reverse();

	return (
		<>
			{check && (
				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>{check}. The registry could not be read since.</AlertDescription>
				</Alert>
			)}

			<div className="space-y-2">
				<h3 className="text-sm font-medium text-muted-foreground">Registry file last updated</h3>
				<p>{dayText(details.fileLastUpdated) ?? "Not shown by the registry"}</p>
			</div>

			<Separator />

			<div className="space-y-2">
				<h3 className="text-sm font-medium text-muted-foreground">Changes</h3>
				{details.changes.length === 0 ? (
					<p className="text-muted-foreground">No changes recorded yet.</p>
				) : (
					<ul className="space-y-3">
						{details.changes.map((change, index) => (
							<li key={index} className="flex items-start justify-between gap-4">
								<div className="space-y-1">
									<Badge variant="outline">{KIND_LABELS[change.kind] ?? change.kind}</Badge>
									<p>{change.detail}</p>
								</div>
								<span className="text-sm text-muted-foreground whitespace-nowrap">
									{dayText(change.detectedAt)}
								</span>
							</li>
						))}
					</ul>
				)}
			</div>

			<Separator />

			<div className="space-y-2">
				<h3 className="text-sm font-medium text-muted-foreground">Pending services</h3>
				{details.pendingServices.length === 0 ? (
					<p className="text-muted-foreground">None.</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Service</TableHead>
								<TableHead>Lodged</TableHead>
								<TableHead>Application</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{details.pendingServices.map((service, index) => (
								<TableRow key={index}>
									<TableCell className="whitespace-normal">{service.service}</TableCell>
									<TableCell>{dayText(service.applicationDate) ?? ""}</TableCell>
									<TableCell>{service.applicationNumber}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<Separator />

			<div className="space-y-2">
				<h3 className="text-sm font-medium text-muted-foreground">Filings</h3>
				{filings.length === 0 ? (
					<p className="text-muted-foreground">None.</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Form</TableHead>
								<TableHead>Made up to</TableHead>
								<TableHead>Service</TableHead>
								<TableHead>Application</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filings.map((filing, index) => (
								<TableRow key={index}>
									<TableCell>{filing.form}</TableCell>
									<TableCell>{dayText(filing.date) ?? ""}</TableCell>
									<TableCell className="whitespace-normal">{filing.service}</TableCell>
									<TableCell>{filing.applicationNumber}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</>
	);
}
