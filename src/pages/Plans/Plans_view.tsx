import React, { useEffect } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { Check, Info, Layers, Loader2, RotateCw } from "lucide-react";
import { auth } from "@/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { arrivalNote, arrivalOf, planLabel, plans, priceText, type PlanOffer } from "@/plans";
import { tracking } from "@/tracking";

/**
 * The four plans. A plan is started on the payment provider's page and changed or cancelled on
 * its portal; the user comes back here from both, and is told what came of it.
 */
const Plans: React.FC = observer(() => {
	const navigate = useNavigate();
	const [search] = useSearchParams();

	const signedIn = auth.state.status === "signed-in";
	// The plan the user is on comes with their tracking.
	const current = signedIn && tracking.status === "loaded" ? tracking.plan : null;

	useEffect(() => plans.load(), []);

	const arrival = arrivalNote(arrivalOf(search), current);
	const waiting = arrival?.waiting === true && current !== null;

	// The provider tells the backend a little after it sends the user back.
	useEffect(() => {
		if (waiting) void tracking.expectPlanChange();
	}, [waiting]);

	const say = (result: { ok: true } | { ok: false; message: string }) => {
		if (!result.ok) toast.error(result.message);
	};

	const choose = async (offer: PlanOffer) => {
		if (!signedIn) {
			toast.info("Log in or register to choose a plan");
			navigate("/login", { state: { from: "/plans" } });
			return;
		}
		say(await plans.start(offer.plan));
	};

	const manage = async () => say(await plans.manage());
	const switchTo = async (offer: PlanOffer) => say(await plans.switchTo(offer.plan));
	const cancel = async () => say(await plans.cancel());

	return (
		<div className="container mx-auto max-w-5xl p-6 space-y-6">
			<div className="space-y-1">
				<h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
					<Layers className="h-7 w-7" /> Plans
				</h1>
				<p className="text-muted-foreground">
					A plan sets how many organisations you can track. Every tracked organisation is checked against the
					registry every night, on every plan, and you are emailed what changed.
				</p>
			</div>

			{arrival && (
				<Alert>
					{arrival.waiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
					<AlertDescription>{arrival.text}</AlertDescription>
				</Alert>
			)}

			{(plans.status === "loading" || plans.status === "idle") && <Skeleton className="h-64 w-full rounded-lg" />}

			{plans.status === "error" && (
				<div className="space-y-4">
					<Alert variant="destructive">
						<Info className="h-4 w-4" />
						<AlertDescription>Something went wrong while loading the plans.</AlertDescription>
					</Alert>
					<Button variant="outline" onClick={plans.load}>
						<RotateCw className="mr-2 h-4 w-4" />
						Retry
					</Button>
				</div>
			)}

			{plans.status === "loaded" && (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{plans.offers.map((offer) => {
						const isCurrent = current === offer.plan;
						const onPaidPlan = current !== null && current !== "free";

						return (
							<Card key={offer.plan} className={isCurrent ? "border-primary" : undefined}>
								<CardHeader>
									<CardTitle className="flex items-center justify-between gap-2">
										{planLabel(offer.plan)}
										{isCurrent && <Badge>Your plan</Badge>}
									</CardTitle>
									<CardDescription className="text-lg text-foreground">{priceText(offer)}</CardDescription>
								</CardHeader>
								<CardContent>
									<ul className="space-y-2 text-sm">
										<li>
											{offer.slots} tracked organisation{offer.slots === 1 ? "" : "s"}
										</li>
										<li>
											{offer.swapsAMonth > 0
												? `${offer.swapsAMonth} swaps a month`
												: offer.slots === 1
													? "No swaps: your one organisation is permanent"
													: "No swaps: each slot is used for good"}
										</li>
										<li>Nightly checks and email alerts</li>
										{offer.plan === "free" && <li>No card needed</li>}
									</ul>
								</CardContent>
								<CardFooter>
									{offer.plan === "free" ? (
										!onPaidPlan && (
											<p className="text-sm text-muted-foreground">
												{signedIn ? "Yours with your account." : "Yours with an account."}
											</p>
										)
									) : isCurrent ? (
										<div className="flex flex-wrap gap-2">
											<Button variant="outline" disabled={plans.pending !== null} onClick={manage}>
												{plans.pending === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
												Manage billing
											</Button>
											<Button variant="ghost" disabled={plans.pending !== null} onClick={cancel}>
												{plans.pending === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />}
												Cancel plan
											</Button>
										</div>
									) : onPaidPlan ? (
										<Button disabled={plans.pending !== null} onClick={() => switchTo(offer)}>
											{plans.pending === offer.plan && <Loader2 className="h-4 w-4 animate-spin" />}
											Switch to {planLabel(offer.plan)}
										</Button>
									) : (
										<Button disabled={plans.pending !== null} onClick={() => choose(offer)}>
											{plans.pending === offer.plan && <Loader2 className="h-4 w-4 animate-spin" />}
											Choose {planLabel(offer.plan)}
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})}
				</div>
			)}

			<div className="space-y-2 text-sm text-muted-foreground">
				<p>
					A slot is used once an organisation is tracked in it, and stays used when you stop tracking that
					organisation. Tracking into a used slot is a swap; swaps are counted by calendar month and do not carry
					over. Free and Basic have no swaps, so on them a tracked organisation can't be changed.
				</p>
				<p>
					When a plan ends or gets smaller, the organisations over the new limit are paused, never removed: they
					are not checked and send no alerts until you have room for them again. See yours on the{" "}
					<NavLink to="/tracking" className="underline">
						Tracking page
					</NavLink>
					.
				</p>
				<p>Plans are billed monthly and do not include reports.</p>
			</div>
		</div>
	);
});

export default Plans;
