import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { toast } from "sonner";
import * as Menu from "@radix-ui/react-dropdown-menu";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Folder, MoreHorizontal, Radio, Search } from "lucide-react";
import { flash, removeSaved, toggleTrack } from "@/app/actions";
import { APP } from "@/app/routes";
import { box, CompanyLink, EmptyCard, Failed, Loading, menu, menuDangerItem, menuItem, menuLabel, Page, PageHeader, pill, Status } from "@/app/ui";
import { companyId, library, type LibraryCompany, type LibraryGroup } from "@/library";
import { useLocalOrder } from "@/library/useLocalOrder";
import { tracking } from "@/tracking";

const inGroup = (group: LibraryGroup, company: LibraryCompany) =>
	group.companies.some((c) => companyId(c) === companyId(company));

/** Puts a company in a group, or takes it out when it is there. */
async function toggleInGroup(group: LibraryGroup, company: LibraryCompany) {
	const has = inGroup(group, company);
	const result = has ? await library.removeFromGroup(group.id, company) : await library.addToGroup(group.id, company);

	if (!result.ok) toast.error(`"${group.name}" could not be changed. Please try again.`);
	else flash(has ? `Removed from ${group.name}.` : `Added to ${group.name}.`);
}

type RowProps = {
	company: LibraryCompany;
	menuOpen: boolean;
	onMenuOpenChange: (open: boolean) => void;
};

/** A saved company: a row that can be dragged by its handle. */
const SavedRow = observer(({ company, menuOpen, onMenuOpenChange }: RowProps) => {
	const navigate = useNavigate();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: companyId(company) });

	const tracked = tracking.isTracked(company);
	const groups = library.groups.filter((group) => inGroup(group, company));

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			className={`app-row flex items-center gap-2 py-[9px] pr-2 pl-1 transition-[background-color,box-shadow] duration-200 ${
				isDragging ? "z-10 bg-surface shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]" : "hover:bg-hover"
			}`}
		>
			<button
				type="button"
				aria-label={`Move ${company.organisationName ?? "company"}`}
				{...attributes}
				{...listeners}
				className="grid w-[22px] flex-none cursor-grab touch-none place-items-center self-stretch text-faint"
			>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
					<rect x="4" y="6" width="16" height="2" rx="1" />
					<rect x="4" y="11" width="16" height="2" rx="1" />
					<rect x="4" y="16" width="16" height="2" rx="1" />
				</svg>
			</button>
			<div className="min-w-0 flex-1">
				<CompanyLink company={company} from="Saved" linked={company.inRegistry} className="text-[14.5px] font-medium" />
				<div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted-foreground">
					<span className="app-mono text-[12px]">{company.registrationNo}</span>
					{company.inRegistry ? <Status organisation={company} /> : <span>No longer in registry</span>}
					{/* A chip, with the Groups icon, so a group is not read as part of the status. It opens the group. */}
					{groups.map((group) => (
						<Link
							key={group.id}
							to={APP.groups}
							state={{ openGroup: group.id }}
							title={`Open ${group.name}`}
							className="inline-flex max-w-[160px] items-center gap-1 rounded-md bg-field px-1.5 py-px text-[11.5px] text-text2 transition-colors hover:bg-hover hover:text-foreground"
						>
							<Folder className="size-[11px] flex-none" strokeWidth={2} aria-hidden />
							<span className="truncate">{group.name}</span>
						</Link>
					))}
				</div>
			</div>
			{company.inRegistry && (
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
					<span className="hidden min-[860px]:inline">{tracked ? "Tracking" : "Track"}</span>
				</button>
			)}
			<Menu.Root open={menuOpen} onOpenChange={onMenuOpenChange}>
				<Menu.Trigger
					aria-label="Add to group"
					title="Add to group"
					className="grid size-10 flex-none cursor-pointer place-items-center rounded-full bg-field text-foreground min-[860px]:size-7"
				>
					<MoreHorizontal className="size-3.5" strokeWidth={2.6} />
				</Menu.Trigger>
				<Menu.Portal>
					<Menu.Content align="end" sideOffset={4} className={`${menu} w-[230px]`}>
						<Menu.Label className={menuLabel}>Add to group</Menu.Label>
						{library.groups.map((group) => (
							<Menu.Item key={group.id} className={menuItem} onSelect={() => toggleInGroup(group, company)}>
								<span className="w-3 font-semibold">{inGroup(group, company) ? "✓" : ""}</span>
								<span className="min-w-0 flex-1 truncate">{group.name}</span>
							</Menu.Item>
						))}
						{library.groups.length > 0 && <Menu.Separator className="mx-[9px] my-1 h-px bg-divider" />}
						<Menu.Item className={menuItem} onSelect={() => navigate(APP.groups, { state: { newGroup: true } })}>
							<span className="w-3" />
							New group…
						</Menu.Item>
						<Menu.Item className={menuDangerItem} onSelect={() => removeSaved(company)}>
							<span className="w-3" />
							Remove from saved
						</Menu.Item>
					</Menu.Content>
				</Menu.Portal>
			</Menu.Root>
		</div>
	);
});

/** The companies a user has saved, in the order they drag them into. */
const Favorites = observer(() => {
	const [search, setSearch] = useSearchParams();
	const [filter, setFilter] = useState("");
	// The row whose menu is open: the one a "Saved" toast asked for, to begin with.
	const [menuFor, setMenuFor] = useState<string | null>(() => search.get("group"));
	// Dragging reorders the list for this visit only.
	const [ordered, move] = useLocalOrder(library.favourites, companyId);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		if (over) move(String(active.id), String(over.id));
	};

	const openMenu = (id: string, open: boolean) => {
		setMenuFor(open ? id : null);
		if (!open && search.has("group")) setSearch({}, { replace: true });
	};

	const count = library.favouriteCount;
	const text = filter.trim().toLowerCase();
	const rows = text ? ordered.filter((company) => (company.organisationName ?? "").toLowerCase().includes(text)) : ordered;

	return (
		<Page>
			<PageHeader
				title="Saved"
				subtitle={library.status === "loaded" ? `${count} ${count === 1 ? "company" : "companies"} · drag to reorder` : undefined}
			>
				{count > 0 && (
					<label className="flex h-11 min-w-[180px] flex-[0_1_240px] items-center gap-[7px] rounded-lg bg-field px-2.5 text-muted-foreground min-[860px]:h-8">
						<Search className="size-[13px] flex-none" strokeWidth={2.2} />
						<input
							value={filter}
							onChange={(event) => setFilter(event.target.value)}
							placeholder="Filter"
							aria-label="Filter saved companies"
							className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
						/>
					</label>
				)}
			</PageHeader>

			{(library.status === "idle" || library.status === "loading") && <Loading className="mt-[22px] h-48" />}

			{library.status === "error" && (
				<Failed onRetry={library.reload} className="mt-[22px]">
					Something went wrong while loading your saved companies.
				</Failed>
			)}

			{library.status === "loaded" && count > 0 && (
				<div className={`${box} app-rows mt-[22px] py-[5px] [--row-line-left:32px]`}>
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
						<SortableContext items={rows.map(companyId)} strategy={verticalListSortingStrategy}>
							{rows.map((company) => (
								<SavedRow
									key={companyId(company)}
									company={company}
									menuOpen={menuFor === companyId(company)}
									onMenuOpenChange={(open) => openMenu(companyId(company), open)}
								/>
							))}
						</SortableContext>
					</DndContext>
					{rows.length === 0 && (
						<div className="px-4 py-5 text-[14px] text-muted-foreground">No saved company matches "{filter.trim()}".</div>
					)}
				</div>
			)}

			{library.status === "loaded" && count === 0 && (
				<EmptyCard title="No saved companies" className="mt-[22px]">
					<p className="mt-1.5 mb-0 text-[14px] text-muted-foreground">Press Save on any search result to keep it here.</p>
					<Link to={APP.search} className={`${pill({ tone: "accent" })} mt-4`}>
						Search companies
					</Link>
				</EmptyCard>
			)}
		</Page>
	);
});

export default Favorites;
