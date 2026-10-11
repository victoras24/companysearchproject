import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { ask } from "@/app/dialog";
import { box, Failed, Loading, Page, PageHeader, Spinner } from "@/app/ui";
import { amountText, arrivalNote, arrivalOf, planLabel, plans, planStep, type PlanOffer } from "@/plans";
import { tracking } from "@/tracking";

const swapsLine = (offer: PlanOffer) =>
	offer.plan === "free"
		? "Your one company is permanent. No card needed."
		: offer.swapsAMonth > 0
			? `${offer.swapsAMonth} swaps a month to rotate companies in and out.`
			: "No swaps: each slot is used for good.";

/**
 * The four plans. A plan is started on the payment provider's page and changed or cancelled on
 * its portal; the user comes back here from both, and is told what came of it.
 */
const Plans = observer(() => {
	const [search] = useSearchParams();
	// The plan the user is on comes with their tracking.
	const current = tracking.status === "loaded" ? tracking.plan : null;

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

	const askToCancel = () =>
		ask(
			{
				title: `Cancel ${current ? planLabel(current) : "your plan"}?`,
				body: "Your plan runs until the end of this billing month. Then companies over the Free limit are paused, never removed.",
				confirm: "Cancel plan",
				danger: true,
			},
			async () => say(await plans.cancel())
		);

	const busy = current === null || plans.pending !== null;

	return (
		<Page>
			<PageHeader
				title="Plans"
				subtitle="A plan sets how many companies you can track. Every plan includes nightly checks and email alerts."
			/>

			{arrival && (
				<div className={`${box} mt-[22px] flex items-center gap-2.5 px-4 py-3 text-[14px]`}>
					{arrival.waiting ? <Spinner /> : <Check className="size-4 flex-none text-primary-text" strokeWidth={2.4} />}
					{arrival.text}
				</div>
			)}

			{(plans.status === "idle" || plans.status === "loading") && <Loading className="mt-6 h-[230px]" />}

			{plans.status === "error" && (
				<Failed onRetry={plans.load} className="mt-6">
					Something went wrong while loading the plans.
				</Failed>
			)}

			{plans.status === "loaded" && (
				<div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
					{plans.offers.map((offer) => {
						const name = planLabel(offer.plan);
						const step = planStep(current, offer.plan);
						const isCurrent = current === offer.plan;
						const primary = step === "start" || step === "upgrade";

						const press = async () => {
							if (step === "manage") say(await plans.manage());
							else if (step === "start") say(await plans.start(offer.plan));
							else if (step === "upgrade" || step === "downgrade") say(await plans.switchTo(offer.plan));
							else if (step === "cancel") askToCancel();
						};
						const leaving = plans.pending === (step === "manage" ? "portal" : step === "cancel" ? "cancel" : offer.plan);

						return (
							<div
								key={offer.plan}
								className={`flex flex-col rounded-[14px] bg-surface p-5 ${
									isCurrent ? "shadow-[0_0_0_2px_var(--primary)]" : "shadow-[0_0_0_1px_var(--border)]"
								}`}
							>
								<div className="flex items-center justify-between gap-2">
									<span className="text-[16px] font-semibold">{name}</span>
									{isCurrent && <span className="text-[12px] font-medium text-primary-text">Current</span>}
								</div>
								<div className="mt-3 flex items-baseline gap-1">
									<span className="text-[28px] font-semibold tracking-[-0.02em]">{amountText(offer)}</span>
									<span className="text-[13px] text-muted-foreground">{offer.price ? "/ month" : "forever"}</span>
								</div>
								<div className="mt-3 text-[14px]">
									{offer.slots} tracked {offer.slots === 1 ? "company" : "companies"}
								</div>
								<div className="mt-1 flex-1 text-[13px] leading-[1.45] text-muted-foreground">{swapsLine(offer)}</div>
								<button
									type="button"
									disabled={busy || step === "current"}
									onClick={press}
									className={`mt-[18px] flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full text-[13.5px] font-medium disabled:cursor-default min-[860px]:h-8 ${
										primary ? "bg-primary text-primary-foreground" : "bg-field text-foreground"
									} ${plans.pending !== null && !leaving ? "opacity-40" : ""}`}
								>
									{leaving && <Spinner onAccent={primary} />}
									{step === "current"
										? "Current plan"
										: step === "manage"
											? "Manage billing"
											: primary
												? `Upgrade to ${name}`
												: `Switch to ${name}`}
								</button>
								{step === "manage" && (
									<button
										type="button"
										disabled={busy}
										onClick={askToCancel}
										className="mt-1.5 cursor-pointer p-1 text-[13px] text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-40"
									>
										Cancel plan
									</button>
								)}
							</div>
						);
					})}
				</div>
			)}

			<div className="mx-1 mt-5 max-w-[660px] text-[13px] leading-[1.55] text-muted-foreground">
				A slot stays used after you stop tracking a company; tracking a new one into it is a swap. Swaps reset each
				month. If a plan ends or shrinks, companies over the limit are paused, never removed. Plans don't include
				reports.
			</div>
		</Page>
	);
});

export default Plans;
