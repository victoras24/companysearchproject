import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ElementType, type ReactNode } from "react";
import { observer } from "mobx-react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Dialog, Popover, RadioGroup } from "radix-ui";
import { search } from "@/api/searchApi";
import { pill, textLink } from "@/app/ui";
import { statusLabel } from "@/organisation/organisation";
import { findSectors, sectorName } from "@/organisation/sector";
import { statusDotClass } from "@/site/ui";
import { FiltersDraft } from "./FiltersDraft";
import {
	MIN_QUERY_LENGTH,
	STATUS_FILTERS,
	type SearchSession,
	type SectorFilter,
	type StatusFilter,
} from "./SearchSession";

/*
 * Search's Filters button, the panel it opens and the filters applied, shared by the app's search
 * and the home page's.
 */

const tall = "h-10 min-[860px]:h-[30px]";

// The app's phone layout, below which the filters open as a sheet rather than a pop-up.
const narrowQuery = "(max-width: 859px)";
const subscribeNarrow = (onChange: () => void) => {
	const media = window.matchMedia(narrowQuery);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
};
const useNarrow = () => useSyncExternalStore(subscribeNarrow, () => window.matchMedia(narrowQuery).matches);

const statusText = (filter: StatusFilter) => (filter === "all" ? "Any" : statusLabel({ statusGroup: filter }));

/** The status groups to narrow companies to, one at a time. */
function StatusChips({ value, onChange }: { value: StatusFilter; onChange: (value: StatusFilter) => void }) {
	return (
		<div role="group" aria-label="Status" className="flex flex-wrap gap-1.5 px-4 pt-2 pb-1">
			{(["all", ...STATUS_FILTERS] as const).map((filter) => {
				const on = value === filter;
				return (
					<button
						key={filter}
						type="button"
						aria-pressed={on}
						onClick={() => onChange(filter)}
						className={`flex flex-none cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-[background-color,color] duration-[250ms] motion-reduce:transition-none ${tall} ${
							on ? "bg-primary text-surface" : "bg-field text-foreground"
						}`}
					>
						{filter !== "all" && (
							<span
								aria-hidden
								className={`size-[7px] rounded-full ${statusDotClass[filter]} ${on ? "shadow-[0_0_0_1.5px_var(--surface)]" : ""}`}
							/>
						)}
						{statusText(filter)}
					</button>
				);
			})}
		</div>
	);
}

/** Any sector, or one of them, found by name or letter. */
function SectorChoice({
	value,
	onChange,
	autoFocus,
	fill,
}: {
	value: SectorFilter;
	onChange: (value: SectorFilter) => void;
	autoFocus: boolean;
	/** In the sheet the list takes the height left over. */
	fill: boolean;
}) {
	const [text, setText] = useState("");
	const list = useRef<HTMLDivElement>(null);
	const found = findSectors(text);

	// The panel opens on the sector applied, scrolled to where it is in the list.
	useLayoutEffect(() => {
		const checked = list.current?.querySelector<HTMLElement>('[aria-checked="true"]');
		if (list.current && checked) list.current.scrollTop = checked.offsetTop - list.current.clientHeight / 2 + checked.offsetHeight / 2;
	}, []);
	const choices: Array<{ value: SectorFilter; name: string; letter?: string }> = [
		...(text.trim() === "" ? [{ value: "all" as const, name: "Any sector" }] : []),
		...found.map((sector) => ({ value: sector.letter, name: sector.name, letter: sector.letter })),
	];

	return (
		<>
			<div className="flex items-baseline justify-between gap-3 px-4 pt-2.5">
				<span id="filters-sector" className="text-[12px] font-semibold text-faint">
					Sector
				</span>
				<span className="text-[11.5px] text-faint">NACE sections · CYSTAT</span>
			</div>
			<label className="mx-4 mt-2 mb-1 flex h-8 flex-none items-center gap-2 rounded-lg bg-field px-2.5 text-muted-foreground">
				<Search className="size-[13px] flex-none" strokeWidth={2.2} />
				<input
					value={text}
					onChange={(event) => setText(event.target.value)}
					autoFocus={autoFocus}
					placeholder="Find a sector"
					aria-label="Find a sector"
					className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
				/>
			</label>
			{choices.length === 0 ? (
				<div className="px-4 py-3 text-[13px] text-muted-foreground">No sector matches.</div>
			) : (
				<RadioGroup.Root
					ref={list}
					value={value}
					onValueChange={(next) => onChange(next as SectorFilter)}
					aria-labelledby="filters-sector"
					loop
					className={`relative overflow-y-auto px-[11px] ${fill ? "min-h-0 flex-1" : "max-h-[232px]"}`}
				>
					{choices.map((choice) => {
						const on = value === choice.value;
						return (
							<RadioGroup.Item
								key={choice.value}
								value={choice.value}
								className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[7px] px-[9px] py-[7px] text-left text-[13.5px] text-foreground outline-none hover:bg-hover focus-visible:shadow-[0_0_0_2px_var(--tint)] min-[860px]:py-[7px] max-[859px]:min-h-11 ${
									on ? "bg-tint" : ""
								}`}
							>
								<span
									aria-hidden
									className={`grid size-4 flex-none place-items-center rounded-full ${
										on ? "bg-primary" : "bg-surface shadow-[inset_0_0_0_1.5px_var(--border-strong)]"
									}`}
								>
									{on && <span className="size-1.5 rounded-full bg-white" />}
								</span>
								<span className="min-w-0 flex-1 truncate">{choice.name}</span>
								{choice.letter && <span className="app-mono text-[11.5px] text-faint">{choice.letter}</span>}
							</RadioGroup.Item>
						);
					})}
				</RadioGroup.Root>
			)}
		</>
	);
}

/** What the panel holds, the same in the pop-up and the sheet. */
const FiltersPanel = observer(
	({ draft, Title, sheet }: { draft: FiltersDraft; Title: ElementType; sheet: boolean }) => (
		<>
			<div className="flex flex-none items-center justify-between px-4 pt-3.5 pb-1">
				<Title id="filters-title" className="m-0 text-[15px] font-semibold text-foreground">
					Filters
				</Title>
				<button
					type="button"
					aria-label="Close"
					onClick={draft.close}
					className="-m-2.5 grid size-11 flex-none cursor-pointer place-items-center min-[860px]:m-0 min-[860px]:size-6"
				>
					<span className="grid size-6 place-items-center rounded-full bg-field text-muted-foreground">
						<X className="size-[9px]" strokeWidth={3} />
					</span>
				</button>
			</div>

			<div className="flex-none px-4 pt-2.5 text-[12px] font-semibold text-faint">Status</div>
			<div className="flex-none">
				<StatusChips value={draft.statusFilter} onChange={draft.chooseStatus} />
			</div>

			<div className="mx-4 mt-3 h-px flex-none bg-divider" />

			<SectorChoice value={draft.sectorFilter} onChange={draft.chooseSector} autoFocus={!sheet} fill={sheet} />

			<div
				className={`mt-2 flex flex-none items-center justify-between gap-4 border-t border-divider px-4 py-3 ${
					sheet ? "pb-[max(12px,env(safe-area-inset-bottom))]" : ""
				}`}
			>
				<button type="button" onClick={draft.reset} className={textLink}>
					Reset
				</button>
				{/* On a phone the button takes the width the footer has left. */}
				<div className={sheet ? "flex min-w-0 flex-1" : "contents"}>
					<button
						type="button"
						onClick={draft.apply}
						className={`${pill({ tone: "accent", size: "standard" })} ${sheet ? "w-full" : ""}`}
					>
						{draft.showText}
					</button>
				</div>
			</div>
		</>
	)
);

/** The Filters button: how many filters are applied, and the panel it opens. */
export const Filters = observer(({ session }: { session: SearchSession }) => {
	const narrow = useNarrow();
	const [draft] = useState(
		() =>
			new FiltersDraft({
				applied: () => ({ statusFilter: session.statusFilter, sectorFilter: session.sectorFilter }),
				apply: ({ statusFilter, sectorFilter }) => session.selectFilters(statusFilter, sectorFilter),
				count: (filters, signal) => {
					const query = session.draft.trim();
					if (query.length < MIN_QUERY_LENGTH) return null;
					return search({ entityType: "organisation", query, ...filters, page: 1, pageSize: 1, signal }).then(
						(found) => found.total
					);
				},
			})
	);
	useEffect(() => draft.close, [draft]);

	const applied = (session.statusFilter !== "all" ? 1 : 0) + (session.sectorFilter !== "all" ? 1 : 0);
	const onOpenChange = (open: boolean) => (open ? draft.open() : draft.close());

	const button = (
		<button
			type="button"
			aria-label={applied ? `Filters, ${applied} applied` : "Filters"}
			className={`${pill({ size: "page" })} ${tall}`}
		>
			<SlidersHorizontal className="size-[13px]" strokeWidth={2.2} />
			Filters
			{applied > 0 && (
				<span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-[5px] text-[11.5px] font-semibold text-primary-foreground tabular-nums">
					{applied}
				</span>
			)}
		</button>
	);

	if (narrow) {
		return (
			<Dialog.Root open={draft.isOpen} onOpenChange={onOpenChange}>
				<Dialog.Trigger asChild>{button}</Dialog.Trigger>
				<Dialog.Portal>
					<Dialog.Overlay className="app-dialog-overlay fixed inset-0 z-50 bg-black/[0.28]" />
					<Dialog.Content
						aria-describedby={undefined}
						className="app-sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[16px] bg-alert shadow-[0_0_0_1px_var(--border),0_-12px_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-[20px] outline-none"
					>
						<FiltersPanel draft={draft} Title={Dialog.Title} sheet />
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		);
	}

	return (
		<Popover.Root open={draft.isOpen} onOpenChange={onOpenChange}>
			<Popover.Trigger asChild>{button}</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					align="start"
					sideOffset={8}
					collisionPadding={12}
					aria-labelledby="filters-title"
					className="app-popover z-50 flex w-[440px] max-w-[calc(100vw-24px)] flex-col rounded-[14px] bg-alert shadow-[0_0_0_1px_var(--border),0_18px_44px_-10px_rgba(0,0,0,0.3)] backdrop-blur-[20px] outline-none"
				>
					<FiltersPanel draft={draft} Title="h2" sheet={false} />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
});

/** The filters applied, each with a way to remove it. */
export const AppliedFilters = observer(({ session }: { session: SearchSession }) => {
	const status = session.statusFilter;
	const sector = session.sectorFilter === "all" ? null : sectorName(session.sectorFilter);
	if (status === "all" && !sector) return null;

	// Only the sector's name gives way when the row is short of room; a status is short enough to show whole.
	const token = (label: string, dot: ReactNode, remove: () => void) => (
		<span className={`inline-flex ${dot ? "flex-none" : "min-w-0"} items-center rounded-full bg-tint pl-3 text-[13px] font-medium text-primary-text ${tall}`}>
			{dot}
			<span className="min-w-0 truncate" title={label}>
				{label}
			</span>
			<button
				type="button"
				aria-label={`Remove ${label} filter`}
				onClick={remove}
				className="grid h-full w-7 flex-none cursor-pointer place-items-center rounded-r-full hover:opacity-70"
			>
				<X className="size-2.5" strokeWidth={2.6} />
			</button>
		</span>
	);

	return (
		<>
			{status !== "all" &&
				token(
					statusText(status),
					<span aria-hidden className={`mr-1.5 size-[7px] flex-none rounded-full ${statusDotClass[status]}`} />,
					() => session.selectStatusFilter("all")
				)}
			{sector && token(sector, null, () => session.selectSectorFilter("all"))}
			<button type="button" onClick={() => session.selectFilters("all", "all")} className={`${textLink} flex-none text-[13px]`}>
				Clear all
			</button>
		</>
	);
});
