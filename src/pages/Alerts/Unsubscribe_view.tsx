import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { BellOff, Info, Loader2, RotateCw } from "lucide-react";
import { auth } from "@/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { turnAlertEmailsOff } from "@/tracking/alertsApi";

type Outcome = "working" | "off" | "invalid" | "error";

/** Where an alert's unsubscribe link lands: it turns the alert emails off and says so. */
const Unsubscribe: React.FC = () => {
	const token = useSearchParams()[0].get("token");
	const [outcome, setOutcome] = useState<Outcome>("working");

	const unsubscribe = useCallback(async () => {
		setOutcome("working");
		try {
			const result = await turnAlertEmailsOff(token);
			setOutcome(result);
			// The switch in the account settings of whoever is signed in here follows.
			if (result === "off") void auth.reloadProfile();
		} catch {
			setOutcome("error");
		}
	}, [token]);

	useEffect(() => {
		void unsubscribe();
	}, [unsubscribe]);

	return (
		<div className="container mx-auto max-w-2xl p-6 space-y-6">
			<h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
				<BellOff className="h-7 w-7" /> Alert emails
			</h1>

			{outcome === "working" && (
				<p className="text-muted-foreground flex items-center gap-2">
					<Loader2 className="h-4 w-4 animate-spin" /> Turning your alert emails off...
				</p>
			)}

			{outcome === "off" && (
				<div className="space-y-2">
					<p className="text-lg">Your alert emails are now off.</p>
					<p className="text-muted-foreground">
						We will not email you about changes in your tracked organisations any more. The
						changes still show on your <NavLink to="/tracking" className="underline">Tracking</NavLink> page,
						and you can turn the emails back on in your{" "}
						<NavLink to="/account" className="underline">account settings</NavLink>.
					</p>
				</div>
			)}

			{outcome === "invalid" && (
				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>
						<span>
							This unsubscribe link is not valid, so nothing was changed. You can turn alert
							emails off in your <NavLink to="/account" className="underline">account settings</NavLink>.
						</span>
					</AlertDescription>
				</Alert>
			)}

			{outcome === "error" && (
				<div className="space-y-4">
					<Alert variant="destructive">
						<Info className="h-4 w-4" />
						<AlertDescription>
							Something went wrong and your alert emails are still on.
						</AlertDescription>
					</Alert>
					<Button variant="outline" onClick={unsubscribe}>
						<RotateCw className="mr-2 h-4 w-4" />
						Try again
					</Button>
				</div>
			)}
		</div>
	);
};

export default Unsubscribe;
