import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { useReducedMotion } from "framer-motion";
import { Search as SearchIcon, X } from "lucide-react";
import type { ICompany, IOfficials } from "@/gEntities";
import { useCartStore } from "@/context/CartStore";
import { SearchPager } from "@/components/SearchPager";
import { SaveButton } from "@/library/SaveButton";
import { TrackButton } from "@/tracking/TrackButton";
import { detailsPath, statusLabel, statusLine } from "@/organisation/organisation";
import { STATUS_FILTERS, type SearchSession, type StatusFilter } from "@/pages/Search/SearchSession";
import { StatusBadge } from "@/site/StatusBadge";
import { useMediaQuery } from "@/site/useMediaQuery";
import { cartPill, statusDotClass } from "@/site/ui";
import { nextTypeStep, type TypeStep } from "./typewriter";

// Searches that find something: the registry is searched by name.
const EXAMPLES = ["Aegean Shipping", "Bank of Cyprus", "Troodos", "Limassol"] as const;
const CHIPS = ["Aegean Shipping", "Bank of Cyprus", "Limassol"] as const;

// When each part of the hero comes in on a first load: heading, line, search bar, chips, scroll cue.
const INTRO_AT_MS = [60, 200, 380, 560, 1000];
const SWEEP_MS = { from: 520, to: 2300 };
const TYPING_STARTS_MS = 1300;

const ENTER = "opacity .8s cubic-bezier(.2,.8,.2,1), transform 1s cubic-bezier(.2,.8,.2,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";

type Props = {
	session: SearchSession;
	/** Whether the page has been scrolled since it loaded; the scroll cue goes for good then. */
	scrolled: boolean;
	onCue: () => void;
};

/** The home page's first screen: the search bar, and the results under it while there is a query. */
export const HeroSearch = observer(({ session, scrolled, onCue }: Props) => {
	const still = useReducedMotion() ?? false;
	const mobile = useMediaQuery("(max-width: 767px)");
	const navigate = useNavigate();
	const cart = useCartStore();

	const [intro, setIntro] = useState(still ? INTRO_AT_MS.length : 0);
	const [sweep, setSweep] = useState(false);
	const [focused, setFocused] = useState(false);
	const [typed, setTyped] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	const draft = session.draft;
	const view = session.view;
	const hasText = draft.trim() !== "";
	const loading = view.status === "loading";
	const isOfficial = session.entityType === "official";

	// The staggered entrance and the one sweep of light round the search bar.
	useEffect(() => {
		if (still) return;
		const timers = INTRO_AT_MS.map((at, i) => setTimeout(() => setIntro(i + 1), at));
		timers.push(setTimeout(() => setSweep(true), SWEEP_MS.from));
		timers.push(setTimeout(() => setSweep(false), SWEEP_MS.to));
		return () => timers.forEach(clearTimeout);
	}, [still]);

	// The placeholder types examples until the user takes over.
	const paused = useRef(false);
	paused.current = focused || draft !== "";
	useEffect(() => {
		if (still) return;
		let step: TypeStep = { word: 0, shown: 0, deleting: false };
		let timer: ReturnType<typeof setTimeout>;
		const tick = () => {
			if (paused.current) {
				step = { word: step.word, shown: 0, deleting: false };
				setTyped("");
				timer = setTimeout(tick, 1200);
				return;
			}
			const next = nextTypeStep(step, EXAMPLES);
			step = next.step;
			setTyped(EXAMPLES[step.word].slice(0, step.shown));
			timer = setTimeout(tick, next.wait);
		};
		timer = setTimeout(tick, TYPING_STARTS_MS);
		return () => clearTimeout(timer);
	}, [still]);

	const shown = (stage: number) => intro >= stage;
	const enter = (stage: number, rise: number): React.CSSProperties => ({
		opacity: shown(stage) ? 1 : 0,
		transform: shown(stage) ? "none" : `translateY(${rise}px)`,
		transition: ENTER,
	});

	const placeholder =
		typed && !paused.current
			? `Try “${typed}”`
			: mobile
				? "Company or official"
				: "Company name or official";

	const cueOn = shown(5) && !scrolled && !hasText;

	const toggleReport = (company: ICompany) => {
		if (cart.has(company)) {
			cart.removeItem({ organisationTypeCode: company.organisationTypeCode!, registrationNo: company.registrationNo });
		} else {
			cart.addItem({
				organisationTypeCode: company.organisationTypeCode!,
				registrationNo: company.registrationNo,
				organisationName: company.organisationName,
				statusGroup: company.statusGroup,
				registrationDate: company.registrationDate,
			});
		}
	};

	const organisationRow = (company: ICompany) => {
		const path = detailsPath(company);
		const line = statusLine(company);
		const inCart = cart.has(company);
		return (
			<div
				key={company.id}
				onClick={() => path && navigate(path)}
				className={`flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[14px] px-3 py-3.5 hover:bg-hover ${path ? "cursor-pointer" : ""}`}
			>
				<div className="min-w-0 flex-[1_1_260px]">
					<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
						{path ? (
							<Link to={path} onClick={(e) => e.stopPropagation()} className="text-[15.5px] font-semibold text-ink">
								{company.organisationName}
							</Link>
						) : (
							<span className="text-[15.5px] font-semibold">{company.organisationName}</span>
						)}
						<StatusBadge organisation={company} />
					</div>
					<div className="mt-1 font-mono text-[12.5px] text-muted-foreground">Reg No {company.registrationNo}</div>
					{line && <div className="mt-0.5 text-[13px] text-muted-foreground">{line}</div>}
				</div>
				<div className="ml-auto flex items-center gap-1.5">
					<TrackButton organisation={company} compact />
					<SaveButton organisation={company} compact />
					{company.organisationTypeCode && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleReport(company);
							}}
							className={`${cartPill(inCart)} h-[38px] px-3.5 text-[13.5px]`}
						>
							{inCart ? "In cart ✓" : "Add report"}
						</button>
					)}
				</div>
			</div>
		);
	};

	const officialRow = (official: IOfficials, index: number) => (
		<Link
			key={index}
			to={`/official/${encodeURIComponent(official.personOrOrganisationName)}`}
			className="flex items-center gap-3.5 rounded-[14px] px-3 py-3.5 text-ink hover:bg-hover"
		>
			<div className="min-w-0 flex-1 text-[15.5px] font-semibold">{official.personOrOrganisationName}</div>
			<span className="text-[13.5px] font-semibold whitespace-nowrap text-primary-text">View companies →</span>
		</Link>
	);

	const note = (text: React.ReactNode) => (
		<div className="px-4 py-[22px] text-center text-[15px] text-muted-foreground">{text}</div>
	);

	const results = () => {
		switch (view.status) {
			case "idle":
				return null;
			case "too-short":
				return note("Enter at least 3 characters.");
			case "loading":
				return note("Searching…");
			case "empty":
				return note(`No results found for "${view.query}". Try a different search term or adjust your filters.`);
			case "error":
				return note(
					<>
						Something went wrong while searching.{" "}
						<button type="button" onClick={() => session.retry()} className="cursor-pointer font-semibold text-primary-text">
							Try again
						</button>
					</>
				);
			case "results":
				return (
					<>
						{view.entityType === "organisation" ? view.items.map(organisationRow) : view.items.map(officialRow)}
						{view.entityType === "official" && view.truncated && (
							<p className="px-4 py-3 text-center text-[13px] text-muted-foreground">
								Showing the first {view.items.length} matches; refine your search.
							</p>
						)}
						{view.pager && (
							<div className="py-3">
								<SearchPager pager={view.pager} onNavigate={() => panelRef.current?.scrollTo({ top: 0 })} />
							</div>
						)}
					</>
				);
		}
	};

	const tab = (on: boolean) =>
		`cursor-pointer rounded-full px-3.5 py-[7px] text-[13.5px] font-semibold ${
			on ? "bg-surface text-ink shadow-[0_1px_3px_rgba(15,31,25,0.12)]" : "bg-transparent text-muted-foreground"
		}`;

	const chip = (filter: StatusFilter) => {
		const on = session.statusFilter === filter;
		return (
			<button
				key={filter}
				type="button"
				tabIndex={isOfficial ? -1 : 0}
				onClick={() => session.selectStatusFilter(filter)}
				className={`flex flex-none cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] whitespace-nowrap ${
					on ? "border-primary-border bg-primary text-white" : "border-border bg-surface text-muted-foreground"
				}`}
			>
				{filter !== "all" && <span aria-hidden className={`size-[7px] rounded-full ${statusDotClass[filter]}`} />}
				{filter === "all" ? "All" : statusLabel({ statusGroup: filter })}
			</button>
		);
	};

	return (
		<section
			id="search"
			className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-[1200px] flex-col items-center justify-center px-[clamp(14px,4vw,28px)] pt-[clamp(48px,9vw,96px)] pb-[120px] text-center"
		>
			<h1
				className="m-0 max-w-[900px] font-display text-[clamp(36px,7vw,84px)] leading-[1.02] font-semibold tracking-[-0.035em]"
				style={enter(1, 28)}
			>
				Find any company
				<br />
				in Cyprus.
			</h1>
			<p
				className="mt-[22px] mb-0 max-w-[560px] text-[19px] leading-normal text-pretty text-muted-foreground"
				style={enter(2, 22)}
			>
				Search by company name or official. Buy the Full Company Report as a guest.
			</p>

			<div
				className="relative z-[6] mt-11 w-full max-w-[680px] text-left"
				style={{
					opacity: shown(3) ? 1 : 0,
					transform: shown(3) ? "none" : "translateY(24px) scale(.97)",
					transition: "opacity .8s cubic-bezier(.2,.8,.2,1), transform 1s cubic-bezier(.34,1.4,.64,1)",
				}}
			>
				<form
					role="search"
					onSubmit={(e) => {
						e.preventDefault();
						if (mobile) inputRef.current?.blur();
					}}
					data-lit={(focused || sweep) && !still}
					data-focused={focused}
					className="csc-search relative"
					style={{
						transform: focused && !mobile && !still ? "scale(1.015)" : "none",
						transition: `transform .5s ${SPRING}`,
					}}
				>
					<div aria-hidden className="csc-search-glow pointer-events-none absolute -inset-0.5 rounded-[24px]" />
					<div className="csc-search-ring relative rounded-[24px] p-0.5">
						<div className="flex items-center gap-3 rounded-[22px] bg-surface py-2.5 pr-2.5 pl-4 md:pl-[22px]">
							<span className="relative grid size-5 flex-none place-items-center">
								<SearchIcon
									strokeWidth={2.2}
									className={`absolute size-[19px] ${hasText && !loading ? "text-glow1" : "text-faint"}`}
									style={{
										opacity: loading ? 0 : 1,
										transform: loading ? "scale(.5) rotate(-40deg)" : "none",
										transition: `opacity .25s, transform .35s ${SPRING}, color .3s`,
									}}
								/>
								<span
									aria-hidden
									className="csc-spin absolute inset-px rounded-full border-[2.2px] border-input border-t-glow1 border-r-glow1"
									style={{
										opacity: loading ? 1 : 0,
										scale: loading ? "1" : ".5",
										transition: `opacity .25s, scale .35s ${SPRING}`,
									}}
								/>
							</span>
							<input
								ref={inputRef}
								value={draft}
								onChange={(e) => session.typeQuery(e.target.value)}
								onFocus={() => setFocused(true)}
								onBlur={() => setFocused(false)}
								enterKeyHint="search"
								aria-label="Search companies and officials"
								placeholder={placeholder}
								className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[16px] text-ink outline-none placeholder:text-faint md:text-[18px]"
							/>
							<button
								type="button"
								aria-label="Clear search"
								onClick={() => session.clearQuery()}
								className={`mr-1 size-8 flex-none cursor-pointer place-items-center rounded-full bg-field text-muted-foreground md:hidden ${draft ? "grid" : "hidden"}`}
							>
								<X className="size-3.5" strokeWidth={2.6} />
							</button>
							<button
								type="submit"
								className="hidden flex-none cursor-pointer rounded-[14px] px-[26px] py-3.5 text-[15.5px] font-semibold text-white md:block"
								style={{
									background: focused ? "#16946B" : "#0E6B4F",
									boxShadow: focused ? "0 10px 28px -8px var(--button-glow)" : "none",
									transition: "background .4s, box-shadow .4s",
								}}
							>
								Search
							</button>
						</div>
					</div>
				</form>

				{hasText && (
					<div className="absolute inset-x-0 top-[calc(100%+10px)] z-[5] overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_24px_60px_-20px_rgba(15,31,25,0.25)]">
						<div className="flex flex-wrap items-center gap-2.5 border-b border-divider p-3">
							<div className="flex flex-none gap-0.5 rounded-full bg-divider p-[3px]">
								<button type="button" onClick={() => session.selectEntityType("organisation")} className={tab(!isOfficial)}>
									Companies
								</button>
								<button type="button" onClick={() => session.selectEntityType("official")} className={tab(isOfficial)}>
									Officials
								</button>
							</div>
							{/* Officials have no status, so the chips slide away for them. */}
							<div
								aria-hidden={isOfficial}
								className={`csc-no-scrollbar flex min-w-0 flex-[1_1_100%] gap-1.5 overflow-x-auto max-md:pr-6 max-md:[mask-image:linear-gradient(90deg,#000_85%,transparent)] md:flex-[1_1_0%] ${
									isOfficial ? "pointer-events-none max-md:-mt-2.5 max-md:max-h-0" : "max-h-12"
								}`}
								style={{
									opacity: isOfficial ? 0 : 1,
									transform: isOfficial ? "translateX(-40px)" : "none",
									transition: `opacity .3s ease, transform .5s ${SPRING}, max-height .35s cubic-bezier(.2,.8,.2,1), margin-top .35s cubic-bezier(.2,.8,.2,1)`,
								}}
							>
								{chip("all")}
								{STATUS_FILTERS.map(chip)}
							</div>
						</div>
						<div ref={panelRef} className="max-h-[min(460px,60vh)] overflow-y-auto p-1.5">
							{results()}
						</div>
					</div>
				)}
			</div>

			<div
				className="mt-[22px] flex max-w-full flex-nowrap items-center justify-center gap-1.5 text-[13px] whitespace-nowrap text-muted-foreground"
				style={enter(4, 14)}
			>
				<span>Try</span>
				{CHIPS.map((example) => (
					<button
						key={example}
						type="button"
						onClick={() => session.typeQuery(example)}
						className="cursor-pointer rounded-full border border-border bg-surface px-[11px] py-[7px] text-[13px] whitespace-nowrap text-ink hover:border-border-strong"
					>
						{example}
					</button>
				))}
			</div>

			{!scrolled && (
				<button
					type="button"
					aria-label="Scroll down"
					onClick={onCue}
					className="absolute bottom-[clamp(20px,4vh,36px)] left-1/2 cursor-pointer"
					style={{
						transform: `translateX(-50%) translateY(${cueOn ? 0 : 12}px)`,
						opacity: cueOn ? 1 : 0,
						pointerEvents: cueOn ? "auto" : "none",
						transition: `opacity .5s ease, transform .6s ${SPRING}`,
					}}
				>
					<span className="relative block h-[42px] w-[26px] rounded-[14px] border-2 border-border-strong bg-surface">
						<span className="csc-wheel absolute top-2 left-1/2 -ml-0.5 h-2 w-1 rounded-sm bg-glow1" />
					</span>
				</button>
			)}
		</section>
	);
});
