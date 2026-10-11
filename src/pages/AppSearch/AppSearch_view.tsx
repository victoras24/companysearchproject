import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { Bookmark, ChevronLeft, ChevronRight, Clock, FileText, Radio, Search, X } from "lucide-react";
import { search } from "@/api/searchApi";
import { orderReport, toggleSave, toggleTrack } from "@/app/actions";
import { recentSearches } from "@/app/recent";
import { officialPath, type Origin } from "@/app/routes";
import { box, CompanyLink, EASE, Failed, Loading, Page, PageHeader, pill, Status, textLink } from "@/app/ui";
import { reportPrice } from "@/checkout";
import { useCartStore } from "@/context/CartStore";
import type { ICompany } from "@/gEntities";
import { library } from "@/library";
import { statusLabel } from "@/organisation/organisation";
import { positionLabel } from "@/organisation/position";
import {
	MIN_QUERY_LENGTH,
	OFFICIAL_RESULT_CAP,
	PAGE_SIZE,
	SearchSession,
	STATUS_FILTERS,
	type EntityType,
	type Pager,
	type StatusFilter,
} from "@/pages/Search/SearchSession";
import { statusDotClass } from "@/site/ui";
import { tracking } from "@/tracking";
import { countLine, noResultsText, officialsFound } from "./searchText";

const currentPage = (pager: Pager) => {
	for (const page of pager.pages) if (page !== "gap" && page.current) return page.number;
	return null;
};

/** One organisation found, with what can be done with it there and then. */
const Result = observer(({ company }: { company: ICompany }) => {
	const cart = useCartStore();
	// Without its type the registry cannot say which organisation this number names.
	const known = Boolean(company.organisationTypeCode);
	const saved = library.isSaved(company);
	const tracked = tracking.isTracked(company);
	const inCart = cart.has(company);

	const label = "hidden min-[860px]:inline";

	return (
		<div className="app-row flex items-center gap-2 py-2.5 pr-2 pl-[11px] hover:bg-hover">
			<div className="min-w-0 flex-1">
				<CompanyLink company={company} from="Search" linked={known} className="text-[14.5px] font-medium" />
				<div className="mt-[3px] flex items-center gap-2 text-[12.5px] text-muted-foreground">
					<span className="app-mono text-[12px]">{company.registrationNo}</span>
					<Status organisation={company} />
				</div>
			</div>
			{known && (
				<>
					<button
						type="button"
						title={saved ? "Saved" : "Save"}
						aria-label={saved ? "Saved" : "Save"}
						aria-pressed={saved}
						disabled={library.isBusy(company)}
						onClick={() => toggleSave(company)}
						className={pill({ size: "row", tone: saved ? "on" : "grey" })}
					>
						<Bookmark className="size-[13px]" strokeWidth={2} fill={saved ? "currentColor" : "none"} />
						<span className={label}>{saved ? "Saved" : "Save"}</span>
					</button>
					<button
						type="button"
						title={tracked ? "Tracking" : "Track"}
						aria-label={tracked ? "Tracking" : "Track"}
						aria-pressed={tracked}
						disabled={tracking.isBusy(company) || tracking.status !== "loaded"}
						onClick={() => toggleTrack(company)}
						className={pill({ size: "row", tone: tracked ? "on" : "grey" })}
					>
						<Radio className="size-[13px]" strokeWidth={2} />
						<span className={label}>{tracked ? "Tracking" : "Track"}</span>
					</button>
					<button
						type="button"
						title={`Full Company Report · ${reportPrice()}`}
						aria-label={inCart ? "Report in cart" : "Add report"}
						onClick={() =>
							orderReport(cart, {
								organisationTypeCode: company.organisationTypeCode!,
								registrationNo: company.registrationNo,
								organisationName: company.organisationName,
								statusGroup: company.statusGroup,
								registrationDate: company.registrationDate,
							})
						}
						className={pill({ size: "row", tone: inCart ? "on" : "grey" })}
					>
						<FileText className="size-[13px]" strokeWidth={2} />
						<span className={label}>{inCart ? "In cart" : `Report · ${reportPrice()}`}</span>
					</button>
				</>
			)}
		</div>
	);
});

const tall = "h-10 min-[860px]:h-[30px]";

/** Companies or officials: two halves, with a thumb that slides under the chosen one. */
function EntitySwitch({ value, onChange }: { value: EntityType; onChange: (value: EntityType) => void }) {
	const tab = (entityType: EntityType, text: string) => (
		<button
			type="button"
			role="tab"
			aria-selected={value === entityType}
			onClick={() => onChange(entityType)}
			className={`relative ${tall} cursor-pointer px-4 text-[13px] font-medium transition-colors duration-[250ms] motion-reduce:transition-none ${
				value === entityType ? "text-foreground" : "text-muted-foreground"
			}`}
		>
			{text}
		</button>
	);

	return (
		<div role="tablist" aria-label="Search for" className="relative grid flex-none grid-cols-2 rounded-[9px] bg-field p-0.5">
			<span
				aria-hidden
				className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-[7px] bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.05)] transition-transform duration-[400ms] motion-reduce:transition-none ${EASE}`}
				style={{ transform: value === "official" ? "translateX(100%)" : "none" }}
			/>
			{tab("organisation", "Companies")}
			{tab("official", "Officials")}
		</div>
	);
}

/** The status groups to narrow companies to. They slide away while officials are searched, who have no status. */
function StatusChips({
	value,
	onChange,
	hidden,
	counts,
}: {
	value: StatusFilter;
	onChange: (value: StatusFilter) => void;
	hidden: boolean;
	/** How many companies match the query under each status, where that is known. */
	counts?: Partial<Record<StatusFilter, number>> | null;
}) {
	return (
		<div
			aria-hidden={hidden}
			inert={hidden}
			className={`app-search-chips flex min-w-0 flex-[1_1_100%] gap-1.5 overflow-x-auto overflow-y-hidden min-[860px]:flex-[1_1_0] ${
				hidden ? "pointer-events-none -mt-2.5 max-h-0 opacity-0 min-[860px]:mt-0 min-[860px]:max-h-12" : "max-h-12"
			}`}
			style={{ transform: hidden ? "translateX(-40px)" : "none" }}
		>
			{(["all", ...STATUS_FILTERS] as const).map((filter) => {
				const on = value === filter;
				const count = counts?.[filter];
				return (
					<button
						key={filter}
						type="button"
						aria-pressed={on}
						onClick={() => onChange(filter)}
						className={`flex flex-none cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-[background-color,color,opacity] duration-[250ms] motion-reduce:transition-none ${tall} ${
							on ? "bg-primary text-surface" : "bg-field text-foreground"
						} ${count === 0 ? "opacity-45" : ""}`}
					>
						{filter !== "all" && (
							<span
								aria-hidden
								className={`size-[7px] rounded-full ${statusDotClass[filter]} ${on ? "shadow-[0_0_0_1.5px_var(--surface)]" : ""}`}
							/>
						)}
						{filter === "all" ? "All" : statusLabel({ statusGroup: filter })}
						{count !== undefined && <span className={`tabular-nums ${on ? "text-surface" : "text-faint"}`}>{count}</span>}
					</button>
				);
			})}
		</div>
	);
}

/** The pages of the results: back, each page's number, forward. */
function Pages({ pager }: { pager: Pager }) {
	const toTop = () =>
		window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

	const round = "grid size-11 flex-none place-items-center rounded-full text-foreground min-[860px]:size-8";
	const arrow = (search: string | null, label: string, icon: ReactNode) =>
		search !== null ? (
			<Link to={{ search }} onClick={toTop} aria-label={label} className={`${round} hover:bg-hover`}>
				{icon}
			</Link>
		) : (
			<span aria-hidden className={`${round} opacity-30`}>
				{icon}
			</span>
		);

	return (
		<nav aria-label="Pages" className="mt-3.5 flex items-center justify-center gap-1">
			{arrow(pager.previous, "Previous page", <ChevronLeft className="size-3" strokeWidth={2.4} />)}
			{pager.pages.map((page, index) =>
				page === "gap" ? (
					<span key={`gap-${index}`} aria-hidden className="px-1 text-[13.5px] text-faint">
						…
					</span>
				) : (
					<Link
						key={page.number}
						to={{ search: page.href }}
						onClick={toTop}
						aria-current={page.current ? "page" : undefined}
						aria-label={`Page ${page.number}`}
						className={`grid h-11 min-w-11 flex-none place-items-center rounded-full px-1.5 text-[13.5px] font-medium tabular-nums transition-colors duration-[250ms] min-[860px]:h-8 min-[860px]:min-w-8 ${
							page.current ? "bg-foreground text-surface" : "text-foreground hover:bg-hover"
						}`}
					>
						{page.number}
					</Link>
				)
			)}
			{arrow(pager.next, "Next page", <ChevronRight className="size-3" strokeWidth={2.4} />)}
		</nav>
	);
}

const countLabel = "mx-1 mt-[22px] mb-2 text-[12.5px] text-muted-foreground";
const note = "px-1 text-[14px] text-muted-foreground";

/** The registry search, inside the app. What is searched for lives in the address (`?q=&type=&status=&page=`). */
const AppSearch = observer(() => {
	const location = useLocation();
	const navigate = useNavigate();
	const navigateRef = useRef(navigate);
	const input = useRef<HTMLInputElement>(null);

	const [session] = useState(
		() =>
			new SearchSession({
				search,
				navigate: (search, { replace }) => navigateRef.current({ search }, { replace }),
			})
	);

	useLayoutEffect(() => {
		navigateRef.current = navigate;
	}, [navigate]);

	useLayoutEffect(() => {
		session.urlChanged(location.search);
	}, [session, location.search]);

	useEffect(() => () => session.dispose(), [session]);

	// On opening, and again each time the shortcut or the search button asks for it.
	const focusAsked = (location.state as { focus?: number } | null)?.focus;
	useEffect(() => {
		input.current?.focus();
	}, [focusAsked]);

	const view = session.view;
	const typed = session.draft.trim();
	const officials = session.entityType === "official";

	const searchAgain = (text: string) => {
		session.typeQuery(text);
		input.current?.focus();
	};

	// Results come as the user types, so a search counts once they do something with it.
	const remember = () => recentSearches.add(session.draft);

	// An official's page comes back here, to this search as it stands.
	const here: Origin = { to: location.pathname + location.search, label: "Search", state: location.state };

	const found = view.status === "results" && view.entityType === "official" ? officialsFound(view.items) : [];

	return (
		<Page>
			<PageHeader title="Search" />

			<label className="mt-[18px] flex h-10 items-center gap-2 rounded-[10px] bg-field pr-1.5 pl-3 text-muted-foreground transition-shadow duration-300 focus-within:shadow-[0_0_0_3px_var(--tint)]">
				<Search className="size-4 flex-none" strokeWidth={2.2} />
				<input
					ref={input}
					value={session.draft}
					onChange={(event) => session.typeQuery(event.target.value)}
					onKeyDown={(event) => {
						if (event.key !== "Enter") return;
						remember();
						// On a phone this puts the keyboard away, to show what was found.
						if (window.matchMedia("(max-width: 859px)").matches) event.currentTarget.blur();
					}}
					enterKeyHint="search"
					placeholder={officials ? "Official name" : "Company name"}
					aria-label={officials ? "Official name" : "Company name"}
					className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
				/>
				{typed !== "" && (
					<button
						type="button"
						aria-label="Clear"
						onClick={() => {
							session.clearQuery();
							input.current?.focus();
						}}
						className="grid size-7 flex-none cursor-pointer place-items-center text-faint"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
							<circle cx="12" cy="12" r="10" />
							<path d="M9 9l6 6M15 9l-6 6" stroke="var(--surface)" strokeWidth="2" strokeLinecap="round" />
						</svg>
					</button>
				)}
			</label>

			<div className="mt-3 flex flex-wrap items-center gap-2.5">
				<EntitySwitch value={session.entityType} onChange={session.selectEntityType} />
				<StatusChips value={session.statusFilter} onChange={session.selectStatusFilter} hidden={officials} />
			</div>

			{view.status === "idle" && recentSearches.list.length > 0 && (
				<div>
					<div className={`${countLabel} flex items-center justify-between gap-3`}>
						<span>Recent</span>
						<button type="button" onClick={recentSearches.clear} className={`${textLink} text-[12.5px]`}>
							Clear
						</button>
					</div>
					<div className={`${box} app-rows py-[5px]`}>
						{recentSearches.list.map((text) => (
							<div key={text} className="app-row flex items-center hover:bg-hover">
								<button
									type="button"
									onClick={() => searchAgain(text)}
									className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2.5 p-[11px] text-left text-[14px] text-foreground min-[860px]:min-h-0"
								>
									<Clock className="size-3.5 flex-none text-faint" strokeWidth={2.2} />
									<span className="truncate">{text}</span>
								</button>
								<button
									type="button"
									aria-label={`Remove ${text} from recent`}
									title="Remove"
									onClick={() => recentSearches.remove(text)}
									className="mr-1 grid size-10 flex-none cursor-pointer place-items-center text-faint hover:text-foreground min-[860px]:size-7"
								>
									<X className="size-3" strokeWidth={2.4} />
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{view.status === "too-short" && <div className={`${note} py-[22px]`}>Enter at least {MIN_QUERY_LENGTH} characters.</div>}

			{view.status === "loading" && (
				<div>
					<div className={countLabel}>Searching…</div>
					<Loading className="h-40" />
				</div>
			)}

			{view.status === "error" && <Failed onRetry={session.retry}>Something went wrong while searching.</Failed>}

			{view.status === "empty" && (
				<div>
					<div className={`${note} py-7`}>
						{noResultsText({ entityType: session.entityType, statusFilter: session.statusFilter, query: view.query })}
					</div>
					{!officials && session.statusFilter !== "all" && (
						<button
							type="button"
							onClick={() => session.selectStatusFilter("all")}
							className={`mx-1 -mt-3.5 block cursor-pointer rounded-full bg-field px-3.5 text-[13px] font-medium text-primary-text ${tall}`}
						>
							Show all statuses
						</button>
					)}
				</div>
			)}

			{view.status === "results" && view.entityType === "organisation" && (
				<div onClickCapture={remember}>
					<div className={countLabel}>
						{countLine({
							total: view.total,
							statusFilter: session.statusFilter,
							page: view.pager ? (currentPage(view.pager) ?? 1) : 1,
							pageSize: PAGE_SIZE,
							paged: view.pager !== null,
						})}
					</div>
					<div className={`${box} app-rows py-[5px]`}>
						{view.items.map((company) => (
							<Result key={company.id} company={company} />
						))}
					</div>
					{view.pager && <Pages pager={view.pager} />}
				</div>
			)}

			{view.status === "results" && view.entityType === "official" && (
				<div onClickCapture={remember}>
					<div className={countLabel}>
						{found.length} {found.length === 1 ? "official" : "officials"}
					</div>
					<div className={`${box} app-rows py-[5px]`}>
						{found.map((official) => (
							<Link
								key={official.name}
								to={officialPath(official.name)!}
								state={{ from: here }}
								className="app-row flex min-h-11 items-center gap-3 px-[11px] py-2.5 text-foreground hover:bg-hover min-[860px]:min-h-8"
							>
								<div className="min-w-0 flex-1">
									<div className="truncate text-[14.5px] font-medium">{official.name}</div>
									<div className="mt-[3px] truncate text-[12.5px] text-muted-foreground">
										{[positionLabel(official.position), official.company].filter(Boolean).join(" · ")}
									</div>
								</div>
								<ChevronRight className="size-3 flex-none text-faint" strokeWidth={2.4} />
							</Link>
						))}
					</div>
					{view.truncated && (
						<p className="mx-1 mt-2.5 mb-0 text-[12.5px] text-muted-foreground">
							Showing the first {OFFICIAL_RESULT_CAP} matches. Add more of the name to narrow it down.
						</p>
					)}
				</div>
			)}
		</Page>
	);
});

export default AppSearch;
