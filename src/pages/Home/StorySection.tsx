import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/site/motion";
import { useMediaQuery } from "@/site/useMediaQuery";
import { eyebrow } from "@/site/ui";

const STEPS = [
	["Search the full registry", "By company name or official."],
	["Save what matters", "One click keeps a company, and its full profile, in your account."],
	["Group into portfolios", "Organise by client, deal or watchlist. A company can sit in any number of groups."],
	["Track every change", "Filings, officials, status, registered address and name, checked every night."],
	["Hear about it first", "An email when something changes. Never about what was already there."],
] as const;

// The picture of the web app beside the steps. Its companies are made up.
const ROWS = [
	["Aegean Shipping Holdings Ltd", "HE 412873", "Limassol"],
	["Kyrenia Marine Shipping Ltd", "HE 287455", "Larnaca"],
	["Paphos Bay Logistics Ltd", "HE 356920", "Paphos"],
	["Mesogeios Shipping & Trading Ltd", "HE 301447", "Limassol"],
] as const;

const GROUP_NAME = "Shipping watchlist";
// Each company and the moment of the group scene at which it joins the new group.
const GROUPED = [
	["Aegean Shipping Holdings Ltd", "HE 412873", "#15803D", 3],
	["Kyrenia Marine Shipping Ltd", "HE 287455", "#F59E0B", 4],
] as const;

const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const scene = "absolute inset-x-0 top-[50px] bottom-0 p-[22px] transition-[opacity,transform] duration-[600ms]";

/**
 * What the web app does, told in five steps as the page scrolls: the section is five screens
 * tall and its content stays pinned while the step and the picture beside it change.
 */
export function StorySection() {
	const ref = useRef<HTMLElement>(null);
	const mobile = useMediaQuery("(max-width: 767px)");
	const [step, setStep] = useState(0);
	// The group scene plays through seven moments, typing the new group's name on the way.
	const [moment, setMoment] = useState(0);
	const [typed, setTyped] = useState(0);

	useEffect(() => {
		const follow = () => {
			const el = ref.current;
			if (!el) return;
			const box = el.getBoundingClientRect();
			const travel = box.height - window.innerHeight;
			const progress = Math.min(0.999, Math.max(0, -box.top / travel));
			setStep(Math.floor(progress * STEPS.length));
		};
		follow();
		window.addEventListener("scroll", follow, { passive: true });
		window.addEventListener("resize", follow);
		return () => {
			window.removeEventListener("scroll", follow);
			window.removeEventListener("resize", follow);
		};
	}, []);

	const inGroups = step === 2;
	useEffect(() => {
		if (!inGroups) return;
		setMoment(0);
		setTyped(0);
		const timers: ReturnType<typeof setTimeout>[] = [];
		const at = (ms: number, run: () => void) => timers.push(setTimeout(run, ms));
		at(250, () => setMoment(1));
		at(550, () => setMoment(2));
		for (let i = 1; i <= GROUP_NAME.length; i++) at(700 + i * 45, () => setTyped(i));
		at(1700, () => setMoment(3));
		at(2400, () => setMoment(4));
		at(3000, () => setMoment(5));
		at(3700, () => setMoment(6));
		return () => timers.forEach(clearTimeout);
	}, [inGroups]);

	const goTo = (index: number) => {
		const el = ref.current;
		if (!el) return;
		const box = el.getBoundingClientRect();
		const travel = box.height - window.innerHeight;
		window.scrollTo({ top: window.scrollY + box.top + (travel * (index + 0.5)) / STEPS.length, behavior: "smooth" });
	};

	const away = (on: boolean, off: string) => (on ? "none" : off);
	const settled = moment >= 6;
	const joined = GROUPED.filter((company) => moment >= company[3]).length;

	return (
		<section id="app" ref={ref} className="relative h-[520vh]">
			<div className="sticky top-0 flex h-screen items-center">
				<div className="mx-auto grid w-full max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-center gap-6 px-[clamp(16px,4vw,28px)] pt-[60px] md:gap-16">
					<Reveal>
						<div className={`${eyebrow} text-[13.5px]`}>The web app · free account</div>
						<h2 className="mt-3.5 mb-10 font-display text-[clamp(34px,4.4vw,54px)] leading-[1.04] font-semibold tracking-[-0.03em] text-balance">
							From search to signal.
						</h2>
						<div className="flex flex-col gap-[22px]">
							{STEPS.map(([title, body], i) => (
								<button
									key={title}
									type="button"
									onClick={() => goTo(i)}
									className={`cursor-pointer gap-[18px] text-left transition-opacity duration-500 ${i === step ? "flex" : "hidden md:flex"}`}
									style={{ opacity: i === step ? 1 : 0.3 }}
								>
									<span className="pt-[5px] font-mono text-[13px] text-primary-text">0{i + 1}</span>
									<span>
										<span className="block font-display text-[22px] font-semibold">{title}</span>
										<span className="mt-1 block max-w-[400px] text-[16px] leading-normal text-muted-foreground">{body}</span>
									</span>
								</button>
							))}
						</div>
						<div className="mt-9 h-[3px] max-w-[420px] overflow-hidden rounded-[3px] bg-border">
							<div
								className="h-full bg-primary transition-[width] duration-500"
								style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
							/>
						</div>
					</Reveal>

					<Reveal
						delay={150}
						className="relative h-[400px] overflow-hidden rounded-[26px] border border-border bg-surface shadow-[0_30px_80px_-30px_rgba(15,31,25,0.25)] md:h-[500px]"
					>
						<div aria-hidden className="h-full select-none">
							<div className="flex items-center gap-2 border-b border-divider px-[18px] py-3.5">
								<span className="size-2.5 rounded-full bg-border" />
								<span className="size-2.5 rounded-full bg-border" />
								<span className="size-2.5 rounded-full bg-border" />
								<span className="ml-3.5 font-mono text-[12px] text-faint">companysearchcyprus.com</span>
							</div>

							{/* Search, then save */}
							<div className={scene} style={{ opacity: step <= 1 ? 1 : 0, transform: away(step <= 1, "translateY(-20px) scale(.97)") }}>
								<div className="flex items-center gap-2.5 rounded-xl bg-field px-4 py-3">
									<span className="size-3 rounded-full border-2 border-[#8A9A93]" />
									<span className="text-[15px]">shipping</span>
									<span className="h-[18px] w-[1.5px] bg-primary" />
									<span className="ml-auto text-[12.5px] text-faint">4 results</span>
								</div>
								<div className="mt-2.5 flex flex-col">
									{ROWS.map(([name, reg, city], i) => {
										const saved = step >= 1 && i < 2;
										return (
											<div key={reg} className="flex items-center gap-3.5 border-b border-divider px-1.5 py-3.5">
												<div className="min-w-0 flex-1">
													<div className="text-[14.5px] font-semibold">{name}</div>
													<div className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
														{reg} · {city}
													</div>
												</div>
												<div className="grid">
													<span
														className="col-start-1 row-start-1 rounded-full border border-input px-3 py-1.5 text-center text-[12.5px] font-semibold text-text2 transition-opacity duration-[400ms]"
														style={{ opacity: saved ? 0 : 1 }}
													>
														Save
													</span>
													<span
														className="col-start-1 row-start-1 rounded-full bg-primary px-3 py-[7px] text-center text-[12.5px] font-semibold text-white transition-opacity duration-[400ms]"
														style={{ opacity: saved ? 1 : 0 }}
													>
														Saved
													</span>
												</div>
											</div>
										);
									})}
								</div>
								<div
									className="absolute bottom-6 left-1/2 rounded-full bg-[#0F1F19] px-[18px] py-[11px] text-[13.5px] whitespace-nowrap text-white transition-[opacity,transform] duration-500"
									style={{ opacity: step === 1 ? 1 : 0, transform: step === 1 ? "translate(-50%,0)" : "translate(-50%,16px)" }}
								>
									2 companies saved
								</div>
							</div>

							{/* Group */}
							<div
								className={scene}
								style={{
									opacity: step === 2 ? 1 : 0,
									transform: away(step === 2, step < 2 ? "translateY(24px)" : "translateY(-20px) scale(.97)"),
								}}
							>
								<div className="flex items-center justify-between gap-3">
									<div className="font-display text-[20px] font-semibold">Groups</div>
									<span
										className="rounded-full px-3.5 py-2 text-[13px] font-semibold"
										style={{
											background: moment === 1 ? "#0E6B4F" : "var(--tint)",
											color: moment === 1 ? "#FFFFFF" : "var(--primary-text)",
											transform: moment === 1 ? "scale(.95)" : "none",
											transition: "background .25s, color .25s, transform .2s",
										}}
									>
										+ New group
									</span>
								</div>
								<div
									className="grid"
									style={{
										gridTemplateRows: !mobile || settled ? "1fr" : "0fr",
										opacity: !mobile || settled ? 1 : 0,
										transition: moment === 0 ? "none" : `grid-template-rows .55s ${SPRING}, opacity .4s`,
									}}
								>
									<div className="min-h-0 overflow-hidden">
										<div className="mt-3.5 grid grid-cols-2 gap-2.5">
											{[
												["Q4 due diligence", "6 companies"],
												["Client onboarding", "14 companies"],
											].map(([name, count]) => (
												<div key={name} className="rounded-2xl border border-border px-4 py-3.5">
													<div className="text-[15px] font-semibold">{name}</div>
													<div className="mt-1 text-[13px] text-muted-foreground">{count}</div>
												</div>
											))}
										</div>
									</div>
								</div>
								<div
									className="mt-2.5 rounded-2xl"
									style={{
										padding: settled ? "14px 16px" : "16px",
										width: settled ? "calc(50% - 5px)" : "100%",
										border: settled ? "1.5px solid var(--border)" : "1.5px solid #0E6B4F",
										background: settled ? "var(--surface)" : "var(--tint2)",
										opacity: moment >= 2 ? 1 : 0,
										transform: moment >= 2 ? "none" : "translateY(18px) scale(.9)",
										transition: `opacity .45s, transform .6s ${SPRING}, width .7s ${SPRING}, padding .5s ease, background .5s, border-color .5s`,
									}}
								>
									<div className="flex items-center justify-between gap-2.5">
										<span className="min-h-5 min-w-0 truncate text-[15px] font-semibold">
											{GROUP_NAME.slice(0, typed)}
											{moment === 2 && (
												<span className="csc-caret ml-0.5 inline-block h-4 w-[1.5px] bg-primary align-[-2px]" />
											)}
										</span>
										{!settled && (
											<span
												className="rounded-full bg-primary px-[9px] py-[3px] text-[12px] font-semibold text-white"
												style={{
													transform: moment === 3 || moment === 4 ? "scale(1.18)" : "none",
													transition: `transform .35s ${SPRING}`,
												}}
											>
												{joined}
											</span>
										)}
									</div>
									<div
										className="grid transition-[grid-template-rows] duration-500"
										style={{ gridTemplateRows: settled ? "1fr" : "0fr", transitionTimingFunction: SPRING }}
									>
										<div className="min-h-0 overflow-hidden">
											<div className="mt-1 text-[13px] text-muted-foreground">2 companies</div>
										</div>
									</div>
									<div
										className="grid transition-[grid-template-rows] duration-[550ms] ease-[cubic-bezier(.2,.8,.2,1)]"
										style={{ gridTemplateRows: settled ? "0fr" : "1fr" }}
									>
										<div className="min-h-0 overflow-hidden">
											<div
												className="mt-2 flex flex-col gap-1.5 transition-opacity duration-300 md:mt-3"
												style={{ opacity: settled ? 0 : 1 }}
											>
												{GROUPED.map(([name, reg, dot, joins]) => (
													<div
														key={reg}
														className="flex items-center gap-2.5 rounded-[10px] border border-tint-border bg-surface px-2.5 py-[7px] text-[13.5px] font-semibold md:px-3 md:py-[9px]"
														style={{
															opacity: moment >= joins ? 1 : 0,
															transform: moment >= joins ? "none" : "translateY(46px)",
															transition: `opacity .35s, transform .6s ${SPRING}`,
														}}
													>
														<span className="size-[7px] flex-none rounded-full" style={{ background: dot }} />
														<span className="min-w-0 truncate">{name}</span>
														<span className="ml-auto hidden font-mono text-[11px] font-normal whitespace-nowrap text-muted-foreground md:inline">
															{reg}
														</span>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
								<div
									style={{
										opacity: settled ? 0 : 1,
										transform: settled ? "translateY(10px)" : "none",
										transition: `opacity .4s, transform .5s ${SPRING}`,
									}}
								>
									<div className="mt-2.5 text-[12px] font-semibold tracking-[0.06em] text-faint uppercase md:mt-4">Saved</div>
									<div className="mt-2 grid grid-cols-2 gap-1.5 md:grid-cols-1">
										{GROUPED.map(([name, reg, dot, joins]) => {
											const added = moment >= joins;
											return (
												<div
													key={reg}
													className="flex min-w-0 items-center gap-2.5 rounded-[10px] border border-dashed border-input px-2.5 py-[7px] text-[13.5px] font-semibold md:px-3 md:py-[9px]"
													style={{
														opacity: added ? 0.35 : 1,
														transform: added ? "translateY(-6px)" : "none",
														transition: `opacity .4s, transform .5s ${SPRING}`,
													}}
												>
													<span className="size-[7px] flex-none rounded-full" style={{ background: dot }} />
													<span className="min-w-0 truncate">{name}</span>
													<span className="ml-auto text-[12px] font-semibold whitespace-nowrap text-primary-text">
														{added ? (
															<>
																<span className="hidden md:inline">Added </span>✓
															</>
														) : (
															<span className="hidden md:inline">Add to group</span>
														)}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							</div>

							{/* Track */}
							<div className={scene} style={{ opacity: step >= 3 ? 1 : 0, transform: away(step >= 3, "translateY(24px)") }}>
								<div className="flex items-center gap-3.5">
									<div className="flex-1">
										<div className="text-[16.5px] font-semibold">Aegean Shipping Holdings Ltd</div>
										<div className="mt-0.5 font-mono text-[12px] text-muted-foreground">HE 412873 · Limassol</div>
									</div>
									<div className="flex items-center gap-2 text-[13px] font-semibold text-primary-text">
										Tracking
										<span className="relative h-5 w-[34px] rounded-full bg-primary">
											<span className="absolute top-[3px] right-[3px] size-3.5 rounded-full bg-surface" />
										</span>
									</div>
								</div>
								<div className="mt-7 text-[12.5px] font-semibold tracking-[0.06em] text-faint uppercase">Change history</div>
								<div className="mt-2.5 flex flex-col gap-0.5">
									{[
										["Director appointed", "Elena Charalambous", "12 Oct"],
										["Registered address changed", "Limassol → Nicosia", "28 Sep"],
										["New filing: HE32 annual return", "Made up to 31 Dec 2025", "03 Sep"],
									].map(([title, detail, day], i) => (
										<div key={title} className={`flex gap-3.5 rounded-[14px] p-3.5 ${i === 0 ? "bg-tint2" : ""}`}>
											<span className={`mt-1.5 size-2 flex-none rounded-full ${i === 0 ? "bg-primary" : "bg-border-strong"}`} />
											<div className="flex-1">
												<div className="text-[14.5px] font-semibold">{title}</div>
												<div className="mt-0.5 text-[13.5px] text-muted-foreground">{detail}</div>
											</div>
											<span className={`font-mono text-[12px] ${i === 0 ? "text-primary-text" : "text-faint"}`}>{day}</span>
										</div>
									))}
								</div>
							</div>

							{/* The email */}
							<div
								className="absolute inset-x-7 bottom-7 rounded-[20px] border border-border bg-surface p-5 shadow-[0_30px_60px_-20px_rgba(15,31,25,0.35)] transition-[opacity,transform] duration-[600ms]"
								style={{ opacity: step === 4 ? 1 : 0, transform: away(step === 4, "translateY(40px)") }}
							>
								<div className="flex items-center gap-2.5 text-[12.5px] text-faint">
									<img src="/logo.png" alt="" className="block size-[22px]" />
									alerts@companysearchcyprus.com
									<span className="ml-auto">now</span>
								</div>
								<div className="mt-3 text-[16px] font-semibold">Change detected: Aegean Shipping Holdings Ltd</div>
								<div className="mt-1 text-[14px] leading-normal text-muted-foreground">
									A new director, Elena Charalambous, was appointed on 12 Oct 2026.
								</div>
								<div className="mt-3.5 inline-flex rounded-full bg-primary px-4 py-[9px] text-[13.5px] font-semibold text-white">
									View change
								</div>
							</div>
						</div>
					</Reveal>
				</div>
			</div>
		</section>
	);
}
