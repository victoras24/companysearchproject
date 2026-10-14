import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { observer } from "mobx-react";
import { toast } from "sonner";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, ListTree, Minus, Trash2 } from "lucide-react";
import { flash } from "@/app/actions";
import { ask } from "@/app/dialog";
import { box, CompanyLink, Disclosure, EASE, EmptyCard, Failed, Loading, menu, menuItem, Page, PageHeader, pill, roundButton, Status } from "@/app/ui";
import {
	appliedMessage,
	companyId,
	library,
	proposeSectorGroups,
	sectorOfGroup,
	type LibraryCompany,
	type LibraryGroup,
	type SectorGroupsResult,
	type SectorProposal,
} from "@/library";
import { SectorGroupsDialog } from "./SectorGroupsDialog";

/** How a group was just changed by sorting into sectors: made new, or given so many companies. For this visit only. */
type Mark = "New" | `+${number}`;

/** A group: its name and count, and under them its companies. */
const GroupCard = observer(
	({ group, open, onToggle, mark }: { group: LibraryGroup; open: boolean; onToggle: () => void; mark?: Mark }) => {
	const count = group.companies.length;
	const sector = sectorOfGroup(group.name);
	const inGroup = new Set(group.companies.map(companyId));
	const addable = library.favourites.filter((company) => !inGroup.has(companyId(company)));

	const remove = async (company: LibraryCompany) => {
		const result = await library.removeFromGroup(group.id, company);
		if (!result.ok) toast.error("That company could not be removed from the group. Please try again.");
	};

	const add = async (company: LibraryCompany) => {
		const result = await library.addToGroup(group.id, company);
		if (!result.ok) toast.error("That company could not be added to the group. Please try again.");
	};

	const askToDelete = () =>
		ask(
			{
				title: `Delete "${group.name}"?`,
				body: "The companies stay in your saved list. Only the group is removed.",
				confirm: "Delete group",
				danger: true,
			},
			async () => {
				const result = await library.deleteGroup(group.id);
				if (result.ok) flash(`Deleted "${group.name}".`);
				else toast.error("The group could not be deleted. Please try again.");
			}
		);

	return (
		<div
			id={`group-${group.id}`}
			className={`${box} scroll-mt-24 ${mark ? "shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_35%,transparent)]" : ""}`}
		>
			<div className="flex items-center gap-1 py-1 pr-1.5">
				<button
					type="button"
					aria-expanded={open}
					onClick={onToggle}
					className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-[9px] pr-2 pl-3.5 text-left text-foreground"
				>
					<ChevronDown
						className={`size-3 flex-none text-faint transition-transform duration-300 ${EASE} ${open ? "rotate-180" : ""}`}
						strokeWidth={2.6}
					/>
					<span className="flex min-w-0 flex-1 items-center gap-2">
						<span className="min-w-0 truncate text-[15px] font-semibold">{group.name}</span>
						{sector && (
							<span className="flex-none rounded-md bg-field px-1.5 text-[11.5px] text-text2">
								Sector <span className="app-mono">{sector}</span>
							</span>
						)}
						{mark && <span className="flex-none rounded-full bg-tint px-[7px] text-[11.5px] font-semibold text-primary-text">{mark}</span>}
					</span>
					<span className="text-[13px] whitespace-nowrap text-muted-foreground">
						{count === 1 ? "1 company" : `${count} companies`}
					</span>
				</button>
				<button
					type="button"
					aria-label="Delete group"
					title="Delete group"
					onClick={askToDelete}
					className="grid size-10 flex-none cursor-pointer place-items-center rounded-full text-faint hover:bg-danger-tint hover:text-danger min-[860px]:size-7"
				>
					<Trash2 className="size-3.5" strokeWidth={1.9} />
				</button>
			</div>

			<Disclosure open={open}>
				<div className="app-rows pb-2 [--row-line-left:34px]">
					{/* The first company has a line above it too, under the group's name. */}
					<span className="app-row block" />
					{group.companies.map((company) => (
						<div key={companyId(company)} className="app-row flex items-center gap-2.5 py-[9px] pr-2 pl-[34px] hover:bg-hover">
							<div className="min-w-0 flex-1">
								<CompanyLink company={company} from="Groups" linked={company.inRegistry} className="text-[14px]" />
								<div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted-foreground">
									<span className="app-mono text-[12px]">{company.registrationNo}</span>
									{company.inRegistry ? <Status organisation={company} /> : <span>No longer in registry</span>}
								</div>
							</div>
							<button type="button" aria-label="Remove from group" onClick={() => remove(company)} className={roundButton}>
								<Minus className="size-2.5" strokeWidth={3} />
							</button>
						</div>
					))}
					{count === 0 && (
						<div className="mr-[11px] border-t border-divider pt-2.5 pr-3.5 pb-1 pl-[39px] text-[13.5px] text-muted-foreground">
							No companies yet.
						</div>
					)}
					<div className="pt-1.5 pl-[34px]">
						<Menu.Root>
							<Menu.Trigger className="-my-2 cursor-pointer px-[5px] py-3 text-[13.5px] text-primary-text hover:opacity-80">Add from saved…</Menu.Trigger>
							<Menu.Portal>
								<Menu.Content align="start" sideOffset={4} className={`${menu} w-[min(300px,calc(100vw-80px))]`}>
									{addable.map((company) => (
										<Menu.Item key={companyId(company)} className={menuItem} onSelect={() => add(company)}>
											<span className="min-w-0 flex-1 truncate">{company.organisationName ?? company.registrationNo}</span>
										</Menu.Item>
									))}
									{addable.length === 0 && (
										<div className="px-[9px] py-2 text-[13px] text-muted-foreground">
											{library.favouriteCount === 0 ? "You have no saved companies yet." : "Every saved company is already here."}
										</div>
									)}
								</Menu.Content>
							</Menu.Portal>
						</Menu.Root>
					</div>
				</div>
			</Disclosure>
		</div>
	);
	}
);

/** The groups a user sorts companies into. */
const Organiser = observer(() => {
	const location = useLocation();
	const input = useRef<HTMLInputElement>(null);
	const [name, setName] = useState("");
	const [creating, setCreating] = useState(false);
	const asked = location.state as { newGroup?: boolean; openGroup?: string } | null;
	// A group's chip on a saved company lands here with that group open.
	const openAsked = asked?.openGroup;
	const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(openAsked ? [openAsked] : []));

	// "New group…" on a saved company's menu lands here, ready to type the name.
	const newGroupAsked = asked?.newGroup === true;
	useEffect(() => {
		if (newGroupAsked) input.current?.focus();
	}, [newGroupAsked]);

	const loaded = library.status === "loaded";
	useEffect(() => {
		if (openAsked && loaded) document.getElementById(`group-${openAsked}`)?.scrollIntoView({ block: "start" });
	}, [openAsked, loaded]);

	const [sorting, setSorting] = useState(false);
	const [marks, setMarks] = useState<ReadonlyMap<string, Mark>>(new Map());
	const { proposals, unsectored } = proposeSectorGroups(library.favourites, library.groups);
	// A backend that does not send sectors yet leaves the field out altogether.
	const sectorsListed = library.favourites.some((company) => "sector" in company);
	const sortTitle = !sectorsListed
		? "Sectors aren't available yet"
		: unsectored.length === library.favouriteCount
			? "None of your saved companies has a sector listed"
			: proposals.length === 0
				? "Every saved company is already in its sector's group"
				: undefined;

	const undo = async (result: SectorGroupsResult) => {
		const { failed } = await library.undoSectorGroups(result);
		setMarks(new Map());
		if (failed > 0) toast.error(`${failed} changes couldn't be undone. Please try again.`);
	};

	const sortBySector = async (chosen: SectorProposal[]) => {
		const result = await library.applySectorGroups(chosen);
		setSorting(false);

		// The groups it made or filled open, marked for this visit, and the first one scrolls into view.
		const changed = [
			...result.created.map((g) => [g.id, "New"] as const),
			...result.updated.map((g) => [g.id, `+${g.added.length}`] as const),
		];
		setMarks(new Map(changed));
		setOpen((before) => new Set([...before, ...changed.map(([id]) => id)]));
		const first = changed[0]?.[0];
		if (first) requestAnimationFrame(() => document.getElementById(`group-${first}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));

		const message = appliedMessage(result);
		if (message) flash(message, { label: "Undo", onClick: () => void undo(result) });
		if (result.failed > 0) toast.error(`${result.failed} changes couldn't be saved. Please try again.`);
	};

	const toggle = (id: string) =>
		setOpen((before) => {
			const after = new Set(before);
			if (!after.delete(id)) after.add(id);
			return after;
		});

	const create = async () => {
		const trimmed = name.trim();
		if (!trimmed || creating) return;

		setCreating(true);
		const result = await library.createGroup(trimmed);
		setCreating(false);

		if (!result.ok) return toast.error("The group could not be created. Please try again.");
		setName("");
		// A new group comes first, and opens ready to be filled.
		const created = library.groups[0];
		if (created) setOpen((before) => new Set(before).add(created.id));
		flash(`Group "${trimmed}" created.`);
	};

	return (
		<Page>
			<PageHeader title="Groups" subtitle="Organise saved companies by client, deal or sector." />

			<div className="mt-[22px] flex items-center gap-2">
				<input
					ref={input}
					value={name}
					maxLength={100}
					onChange={(event) => setName(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") void create();
					}}
					placeholder="New group name"
					aria-label="New group name"
					className="h-11 min-w-0 flex-1 rounded-lg border-0 bg-field px-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground min-[860px]:h-8"
				/>
				<button type="button" disabled={!name.trim() || creating} onClick={create} className={pill({ tone: "accent" })}>
					Create
				</button>
				{loaded && library.favouriteCount > 0 && (
					<>
						<span className="h-5 w-px flex-none bg-divider" />
						<SectorGroupsDialog
							open={sorting}
							onOpenChange={setSorting}
							proposals={proposals}
							unsectored={unsectored.length}
							groups={library.groups}
							onApply={sortBySector}
							trigger={
								<button type="button" disabled={sortTitle !== undefined} title={sortTitle} aria-label="Group by sector" className={pill()}>
									<ListTree size={13} strokeWidth={2} />
									<span className="hidden min-[860px]:inline">Group by sector</span>
								</button>
							}
						/>
					</>
				)}
			</div>

			{(library.status === "idle" || library.status === "loading") && <Loading className="mt-5 h-40" />}

			{library.status === "error" && <Failed onRetry={library.reload}>Something went wrong while loading your groups.</Failed>}

			{library.status === "loaded" && library.groups.length > 0 && (
				<div className="mt-5 flex flex-col gap-3">
					{library.groups.map((group) => (
						<GroupCard key={group.id} group={group} open={open.has(group.id)} onToggle={() => toggle(group.id)} mark={marks.get(group.id)} />
					))}
				</div>
			)}

			{library.status === "loaded" && library.groups.length === 0 && (
				<EmptyCard title="No groups">
					<p className="mt-1.5 mb-0 text-[14px] text-muted-foreground">Name your first group above.</p>
				</EmptyCard>
			)}
		</Page>
	);
});

export default Organiser;
