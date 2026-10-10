import { useEffect, useState } from "react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import { auth } from "@/auth";
import { checkout, reportPrice } from "@/checkout";
import { planLabel, plans, priceText, type PlanOffer } from "@/plans";
import { Reveal } from "@/site/motion";
import { eyebrow, primaryPill } from "@/site/ui";
import type { NavId } from "@/site/SiteHeader";

const sectionHeading =
	"m-0 font-display font-semibold tracking-[-0.03em] text-balance text-[clamp(34px,4.4vw,54px)] leading-[1.04]";

const REPORT_CONTENTS = [
	"Current officials and shareholders",
	"Registered address and its history",
	"Previous names and change history",
	"Company documents and filings",
	"Mortgage records, where applicable",
];

/** What the Full Company Report holds and costs. */
export const ReportsSection = observer(({ onNavigate }: { onNavigate: (id: NavId) => void }) => {
	useEffect(() => checkout.loadPrice(), []);

	return (
		<section id="reports" className="mx-auto max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-[140px] pb-10">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-12">
				<Reveal>
					<div className={`${eyebrow} text-[13.5px]`}>On the website · no account</div>
					<h2 className={`${sectionHeading} mt-3.5`}>One report. Everything on record.</h2>
					<p className="mt-5 mb-0 max-w-[440px] text-[17px] leading-[1.6] text-muted-foreground">
						Add reports for as many companies as you need to your cart and check out as a guest. Reports are
						emailed to you, typically within one business day.
					</p>
				</Reveal>
				<Reveal
					delay={150}
					className="min-w-0 rounded-[28px] border border-border bg-surface p-[clamp(22px,5vw,36px)] shadow-[0_30px_80px_-40px_rgba(15,31,25,0.25)]"
				>
					<div className="flex flex-col gap-2.5">
						<div className="text-[19px] font-semibold">Full Company Report</div>
						<div className="flex flex-wrap items-baseline gap-1.5">
							<span className="font-display text-[clamp(36px,9vw,46px)] leading-none font-semibold tracking-[-0.03em]">
								{reportPrice()}
							</span>
							<span className="text-[14px] text-muted-foreground">per company</span>
						</div>
					</div>
					<div className="mt-6 flex flex-col gap-3">
						{REPORT_CONTENTS.map((line) => (
							<div key={line} className="flex items-center gap-3 text-[15.5px]">
								<span className="size-2 flex-none rounded-full bg-primary" />
								{line}
							</div>
						))}
					</div>
					<button
						type="button"
						onClick={() => onNavigate("search")}
						className="mt-[30px] block w-full cursor-pointer rounded-[14px] bg-primary p-[15px] text-center text-[15.5px] font-semibold text-white transition-colors hover:bg-primary-hover"
					>
						Search to order a report
					</button>
					<div className="mt-3.5 text-center text-[13.5px] text-muted-foreground">
						Have an account? Your reports stay with your orders.
					</div>
				</Reveal>
			</div>
		</section>
	);
});

// What the plans are when the backend has not listed them yet.
const USUAL_PLANS: PlanOffer[] = [
	{ plan: "free", slots: 1, swapsAMonth: 0, price: null },
	{ plan: "basic", slots: 5, swapsAMonth: 0, price: { amount: 3.99, currency: "eur" } },
	{ plan: "starter", slots: 25, swapsAMonth: 5, price: { amount: 9, currency: "eur" } },
	{ plan: "pro", slots: 150, swapsAMonth: 20, price: { amount: 29, currency: "eur" } },
];

const POPULAR = "starter";

const swapsLine = (offer: PlanOffer) =>
	offer.plan === "free"
		? "Your one company is permanent. No card needed."
		: offer.swapsAMonth === 0
			? "No swaps: each slot is used for good."
			: `${offer.swapsAMonth} swaps a month to rotate companies in and out.`;

/** The tracking plans side by side; on a phone they stack as the page scrolls. */
export const PlansSection = observer(() => {
	useEffect(() => plans.load(), []);

	const offers = plans.status === "loaded" && plans.offers.length > 0 ? plans.offers : USUAL_PLANS;
	const signedIn = auth.state.status === "signed-in";

	return (
		<section id="plans" className="mx-auto max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-[120px]">
			<Reveal className="flex flex-wrap items-end justify-between gap-6">
				<div>
					<div className={`${eyebrow} text-[13.5px]`}>Plans · tracking</div>
					<h2 className={`${sectionHeading} mt-3.5 max-w-[560px]`}>
						Watch one company free.
						<br />
						<span className="text-primary-text">Scale when you need to.</span>
					</h2>
				</div>
				<p className="m-0 max-w-[400px] text-[17px] leading-normal text-muted-foreground">
					Every plan includes nightly checks and email alerts. Start free, no card needed.
				</p>
			</Reveal>
			<div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-7 pb-6 md:gap-4 md:pb-0">
				{offers.map((offer, i) => {
					const popular = offer.plan === POPULAR;
					const price = offer.price ? priceText(offer).replace(" a month", "") : "€0";
					return (
						<div
							key={offer.plan}
							className="max-md:sticky max-md:shadow-[0_-12px_36px_-18px_rgba(15,31,25,0.28)]"
							style={{ top: 84 + i * 16 }}
						>
							<Reveal
								delay={i * 110}
								className={`flex h-full flex-col rounded-[24px] border p-7 ${
									popular ? "border-[#3A8A6E] bg-primary text-white" : "border-border bg-surface text-ink"
								}`}
							>
								<div className="flex min-h-[26px] items-center justify-between">
									<span
										className={`rounded-full px-3 py-1.5 font-display text-[13px] font-semibold tracking-[0.08em] uppercase ${
											popular ? "bg-white/[0.14] text-white" : "bg-tint text-primary-text"
										}`}
									>
										{planLabel(offer.plan)}
									</span>
									{popular && (
										<span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#0E6B4F]">
											Most popular
										</span>
									)}
								</div>
								<div className="mt-4 flex items-baseline gap-1.5">
									<span className="font-display text-[42px] font-semibold tracking-[-0.03em]">{price}</span>
									<span className="text-[14px] opacity-75">{offer.price ? "/ month" : "forever"}</span>
								</div>
								<div className="mt-[22px] flex items-baseline gap-1.5 whitespace-nowrap">
									<span className="font-display text-[20px] font-semibold">{offer.slots}</span>
									<span className="text-[14.5px] opacity-75">
										{offer.slots === 1 ? "tracked company" : "tracked companies"}
									</span>
								</div>
								<div className={`my-5 h-px ${popular ? "bg-[#3A8A6E]" : "bg-border"}`} />
								<div className="flex-1 text-[14.5px] leading-normal">{swapsLine(offer)}</div>
								<Link
									to={signedIn ? "/plans" : "/signup"}
									className={`mt-6 rounded-[14px] border p-[13px] text-center text-[15px] font-semibold ${
										popular ? "border-white bg-white text-[#0A3B2C]" : "border-[#CFE0D7] bg-white text-[#0E6B4F]"
									}`}
								>
									{offer.plan === "free" ? "Create free account" : `Choose ${planLabel(offer.plan)}`}
								</Link>
							</Reveal>
						</div>
					);
				})}
			</div>
		</section>
	);
});

const FAQS = [
	[
		"How current is the company information?",
		"Our database is synchronised weekly with the official Cyprus government registry, so you get the most up-to-date information available.",
	],
	[
		"What is included in the Full Company Report?",
		"Current shareholders and addresses, all company documents, historical changes, previous names, registered address history, and mortgage records where applicable.",
	],
	[
		"How quickly are reports delivered?",
		"Reports are typically delivered within one business day of your order, with a summary prepared by our research team.",
	],
	[
		"Do I need an account to buy a report?",
		"No. Check out as a guest. A free account lets you save companies, organise them into groups, and track changes with email alerts.",
	],
	[
		"Can I integrate this data into my systems?",
		"Yes, API access is available. Contact us for technical documentation and implementation guidance.",
	],
] as const;

export function FaqSection() {
	const [open, setOpen] = useState<number | null>(null);

	return (
		<section id="faq" className="mx-auto max-w-[860px] px-[clamp(16px,4vw,28px)] pt-[120px]">
			<Reveal>
				<h2 className="m-0 text-center font-display text-[clamp(30px,3.8vw,46px)] leading-[1.06] font-semibold tracking-[-0.03em]">
					Questions, answered.
				</h2>
			</Reveal>
			<div className="mt-10 flex flex-col border-t border-border">
				{FAQS.map(([question, answer], i) => (
					<Reveal key={question} delay={80 + i * 70} className="border-b border-border">
						<button
							type="button"
							aria-expanded={open === i}
							onClick={() => setOpen(open === i ? null : i)}
							className="flex w-full cursor-pointer items-center justify-between gap-5 bg-transparent px-1 py-[22px] text-left font-display text-[19px] font-medium text-ink"
						>
							{question}
							<span
								aria-hidden
								className="grid size-[30px] flex-none place-items-center rounded-full bg-divider font-sans text-[18px] text-primary-text transition-transform duration-300"
								style={{ transform: open === i ? "rotate(45deg)" : "none" }}
							>
								+
							</span>
						</button>
						<div
							className="grid transition-[grid-template-rows] duration-[350ms] ease-[cubic-bezier(.2,.8,.2,1)]"
							style={{ gridTemplateRows: open === i ? "1fr" : "0fr" }}
						>
							<div className="min-h-0 overflow-hidden" inert={open !== i}>
								<p className="m-0 max-w-[700px] px-1 pb-6 text-[16.5px] leading-[1.65] text-muted-foreground">{answer}</p>
							</div>
						</div>
					</Reveal>
				))}
			</div>
		</section>
	);
}

/** The closing band: where monitoring lives. */
export const AppBand = observer(() => {
	const signedIn = auth.state.status === "signed-in";

	return (
		<section className="mx-auto max-w-[1200px] px-[clamp(16px,4vw,28px)] py-[100px]">
			<Reveal className="flex flex-col items-center rounded-[32px] bg-tint px-[clamp(20px,5vw,40px)] py-[72px] text-center">
				<h2 className="m-0 max-w-[640px] font-display text-[clamp(30px,3.8vw,46px)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance">
					Monitoring lives in the web app.
				</h2>
				<p className="mt-4 mb-0 max-w-[640px] text-[17px] leading-normal text-balance text-text2">
					Save, group and track companies, with email alerts. Free to start.
				</p>
				<div className="mt-8 flex flex-wrap justify-center gap-2.5">
					{signedIn ? (
						<Link to="/tracking" className={`${primaryPill} px-[26px] py-3.5 text-[15.5px]`}>
							Open web app
						</Link>
					) : (
						<>
							<Link to="/signup" className={`${primaryPill} px-[26px] py-3.5 text-[15.5px]`}>
								Create free account
							</Link>
							<Link to="/login" className="rounded-full bg-surface px-[26px] py-3.5 text-[15.5px] font-semibold text-deep">
								Log in
							</Link>
						</>
					)}
				</div>
			</Reveal>
		</section>
	);
});
