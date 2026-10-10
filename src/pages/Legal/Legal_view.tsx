import type { ReactNode } from "react";
import { Link } from "react-router";
import { Reveal, Rise } from "@/site/motion";
import { SitePage } from "@/site/SitePage";
import { eyebrow, primaryPill } from "@/site/ui";

export type LegalDoc = "disclaimer" | "terms";

const DOCS: Record<LegalDoc, { title: string; lede: string; toc: Array<[string, string]> }> = {
	disclaimer: {
		title: "Disclaimer",
		lede: "Where our data comes from, how current it is, and what to do if something looks wrong.",
		toc: [
			["d1", "Removal requests"],
			["d2", "How current the data is"],
			["d3", "Checking accuracy"],
		],
	},
	terms: {
		title: "Terms of Service",
		lede: "The terms that apply when you use Company Search Cyprus and its services.",
		toc: [
			["t0", "Key terms"],
			["t1", "Overview"],
			["t2", "Using the service"],
			["t3", "Accuracy and reports"],
			["t4", "Pricing and changes"],
			["t5", "Prohibited use and liability"],
			["t6", "Governing law"],
		],
	},
};

const LAST_UPDATED = "1 October 2026";

const h2 = "m-0 font-display text-[24px] font-semibold tracking-[-0.02em]";
const first = "mt-3.5 mb-0 text-[16px] leading-[1.65] text-text2";
const next = "mt-3 mb-0 text-[16px] leading-[1.65] text-text2";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
	return (
		<Reveal>
			<section id={id} className="scroll-mt-24">
				<h2 className={h2}>{title}</h2>
				{children}
			</section>
		</Reveal>
	);
}

const Divider = () => <div className="my-9 h-px bg-divider" />;

function Disclaimer() {
	return (
		<>
			<Section id="d1" title="Requests to remove company information">
				<p className={first}>
					The information on Company Search Cyprus comes only from public records kept by official government
					registries and published government data sources.
				</p>
				<p className={next}>
					We keep an accurate copy of these public records and do not remove company information that is part of
					the public domain. Publishing company data serves important purposes:
				</p>
				<ul className="mt-3.5 mb-0 flex list-disc flex-col gap-2 pl-5 text-[16px] leading-[1.55] text-text2">
					<li>Promoting transparency and fairness in business</li>
					<li>Letting consumers check a company's legitimacy and standing</li>
					<li>Providing information needed for legal proceedings</li>
					<li>Supporting informed decisions in business relationships</li>
				</ul>
			</Section>
			<Divider />
			<Section id="d2" title="How current the data is">
				<p className={first}>
					We add new company registrations continuously and refresh existing records directly from the official
					government registry on a regular schedule.
				</p>
				<p className={next}>Business registrations change often, so some data may be briefly out of date.</p>
				<div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
					<div className="rounded-2xl bg-tint2 p-[18px]">
						<div className="text-[15px] font-semibold">Standard updates</div>
						<div className="mt-1 text-[14px] leading-normal text-muted-foreground">
							Every record is refreshed at least quarterly.
						</div>
					</div>
					<div className="rounded-2xl bg-tint2 p-[18px]">
						<div className="text-[15px] font-semibold">Priority updates</div>
						<div className="mt-1 text-[14px] leading-normal text-muted-foreground">
							Ask us to refresh a specific record sooner.
						</div>
					</div>
				</div>
				<p className="mt-4 mb-0 text-[16px] leading-[1.65] text-text2">
					If you see outdated information, contact us to request a priority update.
				</p>
			</Section>
			<Divider />
			<Section id="d3" title="Checking data accuracy">
				<p className={first}>If something on our platform looks wrong, we recommend these steps:</p>
				<ol className="mt-3.5 mb-0 flex list-decimal flex-col gap-2.5 pl-[22px] text-[16px] leading-[1.55] text-text2">
					<li>
						<strong className="text-ink">Check the primary source.</strong> Use the link to the official registry
						on each company profile.
					</li>
					<li>
						<strong className="text-ink">Allow for processing time.</strong> Government registries can take time to
						process new filings.
					</li>
					<li>
						<strong className="text-ink">Report the difference.</strong> If the official registry shows something
						different, let us know.
					</li>
				</ol>
				<div className="mt-5 rounded-[18px] bg-primary px-[22px] py-5 text-[15.5px] leading-[1.55] text-white">
					When we're told about a verified difference from official sources, we aim to correct it within 72
					business hours.
				</div>
			</Section>
		</>
	);
}

const keyTerm = "flex gap-3 rounded-2xl p-4 text-[14.5px] leading-normal text-body2";
const listCard = "rounded-2xl border border-border p-[18px]";
const list = "mt-2.5 mb-0 flex list-disc flex-col gap-1.5 pl-[18px] text-[14.5px] leading-[1.45] text-text2";

function Terms() {
	return (
		<>
			<Section id="t0" title="Key terms at a glance">
				<div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-2.5">
					<div className={`${keyTerm} bg-tint2`}>
						<span className="font-bold text-primary-text">✓</span>
						You appoint us as your agent to gather company information from official sources.
					</div>
					<div className={`${keyTerm} bg-tint2`}>
						<span className="font-bold text-primary-text">✓</span>
						We may change or stop the service at any time without notice.
					</div>
					<div className={`${keyTerm} bg-danger-tint`}>
						<span className="font-bold text-danger">✕</span>
						Don't use the service for illegal activity or to break the law.
					</div>
					<div className={`${keyTerm} bg-danger-tint`}>
						<span className="font-bold text-danger">✕</span>
						Don't reproduce, copy or resell any part of the service.
					</div>
				</div>
			</Section>
			<Divider />
			<Section id="t1" title="Overview">
				<p className={first}>
					In these Terms, "Service" means Company Search Cyprus, including all information, tools and services on
					this site.
				</p>
				<p className={next}>
					By accessing or using any part of Company Search Cyprus, you agree to these Terms. If you don't agree to
					all of them, you may not use the website or its services.
				</p>
			</Section>
			<Divider />
			<Section id="t2" title="Using the service">
				<p className={first}>
					By using the Service, you confirm you are at least the age of majority where you live. You may not use
					our products for any illegal or unauthorised purpose.
				</p>
				<p className={next}>
					We may refuse service to anyone, for any reason, at any time. You agree not to reproduce, duplicate,
					copy, sell or resell any part of the Service.
				</p>
				<p className={next}>
					By using Company Search Cyprus, you appoint us as your agent to gather information from the official
					Cyprus registry and other sources, in exchange for a fee.
				</p>
			</Section>
			<Divider />
			<Section id="t3" title="Accuracy and reports">
				<p className={first}>
					We are not responsible if information on this site is inaccurate, incomplete or out of date. Free
					information is for general guidance only and shouldn't be your only basis for decisions.
				</p>
				<p className={next}>
					A purchased report is accurate only on the day of purchase. Historical information is provided for
					reference and is not current.
				</p>
				<p className={next}>
					We don't guarantee that any product, service or information will meet your expectations, or that errors
					will be corrected.
				</p>
			</Section>
			<Divider />
			<Section id="t4" title="Pricing and changes">
				<p className={first}>
					Prices may change without notice. We may change or discontinue the Service, or any part of it, at any
					time.
				</p>
				<div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
					<div className={listCard}>
						<div className="text-[15px] font-semibold">Our rights</div>
						<ul className={list}>
							<li>Change prices without notice</li>
							<li>Change or discontinue services</li>
							<li>Limit sales to any person or region</li>
							<li>Discontinue any product</li>
						</ul>
					</div>
					<div className={listCard}>
						<div className="text-[15px] font-semibold">Your responsibilities</div>
						<ul className={list}>
							<li>Give accurate account information</li>
							<li>Keep your details up to date</li>
							<li>Check this site for changes</li>
							<li>Review billing information carefully</li>
						</ul>
					</div>
				</div>
			</Section>
			<Divider />
			<Section id="t5" title="Prohibited use and liability">
				<p className={first}>
					You may not use the site for any unlawful purpose, to break laws, infringe intellectual property, harass
					others, submit false information or transmit malicious code.
				</p>
				<p className={next}>
					We don't guarantee the service will be uninterrupted, timely, secure or error-free. You use it at your
					own risk.
				</p>
				<div className="mt-[18px] rounded-2xl bg-field px-5 py-[18px] text-[15px] leading-[1.55] text-body2">
					In no case shall Company Search Cyprus be liable for any direct, indirect, incidental, punitive, special
					or consequential damages arising from your use of the service.
				</div>
			</Section>
			<Divider />
			<Section id="t6" title="Governing law and updates">
				<p className={first}>
					These Terms are governed by the laws of the Republic of Cyprus. We may update or replace any part of
					them by posting changes here.
				</p>
				<p className={next}>
					Continuing to use the service after changes means you accept them, so please check this page from time
					to time. By using Company Search Cyprus, you confirm you have read, understood and agree to these Terms.
				</p>
			</Section>
		</>
	);
}

const switchLink = (on: boolean) =>
	`rounded-full px-5 py-2.5 text-[14.5px] font-semibold transition-colors duration-[250ms] ${
		on ? "bg-primary text-white" : "bg-transparent text-text2"
	}`;

/** The disclaimer and the terms of service: one layout, each at its own address. */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
	const { title, lede, toc } = DOCS[doc];

	const goTo = (id: string) => {
		const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		document.getElementById(id)?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
	};

	return (
		<SitePage
			header={{ only: { to: "/", label: "Search companies" } }}
			className="mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-[clamp(32px,6vw,64px)] pb-[88px]"
		>
			<Rise className="flex flex-col items-center text-center">
				<div className={eyebrow}>Legal</div>
				<h1 className="mt-2.5 mb-0 font-display text-[clamp(34px,5vw,56px)] leading-[1.04] font-semibold tracking-[-0.035em]">
					{title}
				</h1>
				<p className="mt-3 mb-0 max-w-[480px] text-[16px] leading-[1.55] text-muted-foreground">{lede}</p>
				<div className="mt-7 flex gap-1 rounded-full border border-border bg-surface p-1">
					<Link to="/legal-disclaimer" className={switchLink(doc === "disclaimer")}>
						Disclaimer
					</Link>
					<Link to="/terms" className={switchLink(doc === "terms")}>
						Terms of Service
					</Link>
				</div>
				<div className="mt-4 font-mono text-[12.5px] text-faint">Last updated {LAST_UPDATED}</div>
			</Rise>

			<div className="mx-auto mt-12 grid max-w-[1000px] grid-cols-1 items-start gap-10 min-[900px]:grid-cols-[220px_minmax(0,1fr)]">
				<nav aria-label="On this page" className="sticky top-24 hidden flex-col gap-0.5 min-[900px]:flex">
					<div className="px-3 pb-2.5 text-[12px] font-semibold tracking-[0.06em] text-faint uppercase">On this page</div>
					{toc.map(([id, label]) => (
						<button
							key={id}
							type="button"
							onClick={() => goTo(id)}
							className="cursor-pointer rounded-[10px] px-3 py-2 text-left text-[14px] leading-[1.35] text-text2 hover:bg-hover2 hover:text-ink"
						>
							{label}
						</button>
					))}
				</nav>

				<Rise key={doc} distance={16} className="min-w-0">
					<article className="rounded-[28px] border border-border bg-surface p-[clamp(24px,5vw,48px)]">
						{doc === "disclaimer" ? <Disclaimer /> : <Terms />}
						<div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-divider pt-7">
							<div>
								<div className="text-[16px] font-semibold">Questions?</div>
								<div className="mt-0.5 text-[14.5px] text-muted-foreground">We usually reply within one business day.</div>
							</div>
							<a href="mailto:companysearchcy@gmail.com" className={`${primaryPill} px-5 py-3 text-[15px]`}>
								companysearchcy@gmail.com
							</a>
						</div>
					</article>
				</Rise>
			</div>
		</SitePage>
	);
}
