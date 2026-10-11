import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { toast } from "sonner";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, ChevronRight } from "lucide-react";
import { flash, stopTracking } from "@/app/actions";
import { ask } from "@/app/dialog";
import { APP, organisationId } from "@/app/routes";
import { Bar, box, CompanyLink, Disclosure, EASE, EmptyCard, Failed, Loading, menu, menuItem, menuLabel, Page, PageHeader, pill, sectionLabel, Spinner, textLink } from "@/app/ui";
import { auth } from "@/auth";
import { planLabel } from "@/plans";
import { changeTitle, checkedText, dayText, seenChanges, shortDay, tracking, type TrackedOrganisation } from "@/tracking";

const idOf = (organisation: TrackedOrganisation) => organisationId(organisation)!;
const nameOf = (organisation: TrackedOrganisation) => organisation.organisationName ?? organisation.registrationNo;

/** The changes recorded for the tracked company whose row is open. */
const History = observer(({ organisation, fresh }: { organisation: TrackedOrganisation; fresh: boolean }) => {
	const view = tracking.details;

	if (view.status === "error") {
		return (
			<div className="flex items-center gap-3 py-2.5 text-[13.5px] text-muted-foreground">
				<span className="flex-1">Something went wrong while loading its changes.</span>
				<button type="button" onClick={() => tracking.open(organisation)} className={textLink}>
					Try again
				</button>
			</div>
		);
	}
	if (view.status !== "loaded") {
		return (
			<div className="flex items-center gap-2 py-2.5 text-[13.5px] text-muted-foreground">
				<Spinner />
				Loading its changes…
			</div>
		);
	}
	if (view.details.changes.length === 0) {
		return (
			<div className="py-2.5 text-[13.5px] text-muted-foreground">
				{view.details.firstCheckInProgress ? "Its first check is still running." : "No changes recorded yet."}
			</div>
		);
	}

	return (
		<>
			{view.details.changes.map((change, index) => (
				<div key={index} className="flex items-center gap-2.5 border-t border-divider py-[9px] first:border-t-0">
					{/* The latest change is the one the row's dot is about. */}
					<span className={`size-1.5 flex-none rounded-full ${fresh && index === 0 ? "bg-primary" : "bg-border-strong"}`} />
					<div className="min-w-0 flex-1">
						<div className="text-[13.5px]">{changeTitle(change.kind)}</div>
						<div className="mt-px text-[12.5px] text-muted-foreground">{change.detail}</div>
					</div>
					<span className="text-[12.5px] whitespace-nowrap text-muted-foreground">{shortDay(change.detectedAt)}</span>
				</div>
			))}
		</>
	);
});

type ActiveRowProps = { organisation: TrackedOrganisation; open: boolean; fresh: boolean; onToggle: () => void };

/** A tracked company that is being checked: a row that opens on its changes. */
const ActiveRow = observer(({ organisation, open, fresh, onToggle }: ActiveRowProps) => {
	const latest = organisation.latestChange;
	const running = organisation.firstCheckInProgress && !organisation.checksFailing;
	const refusal = tracking.untrackRefusal;

	return (
		<div className="app-row">
			<button
				type="button"
				aria-expanded={open}
				onClick={onToggle}
				className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-[11px] text-left text-foreground hover:bg-hover"
			>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="truncate text-[14.5px] font-medium">{nameOf(organisation)}</span>
						{fresh && <span className="size-[7px] flex-none rounded-full bg-primary" />}
					</div>
					<div className="mt-[3px] flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted-foreground">
						{running && <span className="size-[11px] flex-none animate-spin rounded-full border-[1.6px] border-field border-t-muted-foreground" />}
						<span className="truncate">{checkedText(organisation)}</span>
					</div>
				</div>
				{latest && !organisation.firstCheckInProgress && (
					<span className="text-[12.5px] whitespace-nowrap text-muted-foreground">{shortDay(latest.detectedAt)}</span>
				)}
				<ChevronDown className={`size-3 flex-none text-faint transition-transform duration-300 ${EASE} ${open ? "rotate-180" : ""}`} strokeWidth={2.6} />
			</button>

			<Disclosure open={open}>
				<div className="px-[11px] pt-0.5 pb-3.5">
					<div className="text-[12.5px] text-muted-foreground">
						<span className="app-mono text-[12px]">{organisation.registrationNo}</span>
						{organisation.organisationType && <> · {organisation.organisationType}</>} · tracked since {dayText(organisation.startedAt)}
					</div>
					<div className="mt-2.5 rounded-[10px] bg-fill2 px-3.5 py-0.5">{open && <History organisation={organisation} fresh={fresh} />}</div>
					<div className="mt-3 flex flex-wrap items-center gap-4 text-[13.5px]">
						<CompanyLink company={organisation} from="Tracking" className="text-primary-text">
							Open profile
						</CompanyLink>
						{refusal === null ? (
							<button type="button" onClick={() => stopTracking(organisation)} className="-mx-2 -my-3.5 cursor-pointer px-2 py-3.5 text-[13.5px] text-danger hover:opacity-80">
								Stop tracking
							</button>
						) : (
							<span className="text-muted-foreground">
								{tracking.plan === "free" ? "Permanent on Free." : `Stays tracked: ${planLabel(tracking.plan)} has no swaps.`}
							</span>
						)}
					</div>
				</div>
			</Disclosure>
		</div>
	);
});

/** A paused company, with whatever makes it active again as far as the plan allows. */
const PausedRow = observer(({ organisation }: { organisation: TrackedOrganisation }) => {
	const option = tracking.resumeOption(organisation);
	const busy = tracking.isBusy(organisation);
	const name = nameOf(organisation);

	const activate = async (inPlaceOf?: TrackedOrganisation) => {
		const result = await tracking.activate(organisation, inPlaceOf);
		if (result.ok) flash(`${name} is active again. Its next check is tonight's.`);
		else toast.error(result.message);
	};

	const keep = () =>
		ask(
			{ title: `Keep ${name}?`, body: "This becomes your one free tracked company and can't be changed.", confirm: "Keep it" },
			() => void activate()
		);

	const action = `${textLink} flex-none`;

	return (
		<div className="flex items-center gap-3 border-t border-divider py-[11px] first:border-t-0">
			<div className="min-w-0 flex-1 text-muted-foreground">
				<div className="truncate text-[14.5px]">{name}</div>
				<div className="app-mono mt-0.5 text-[12px]">{organisation.registrationNo}</div>
			</div>
			{option === "upgrade" && (
				<Link to={APP.plans} className={action}>
					Upgrade to resume
				</Link>
			)}
			{option === "keep-on-free" && (
				<button type="button" disabled={busy} onClick={keep} className={action}>
					Keep this one
				</button>
			)}
			{option === "room" && (
				<button type="button" disabled={busy} onClick={() => activate()} className={action}>
					Make active
				</button>
			)}
			{option === "in-place-of" && (
				<Menu.Root>
					<Menu.Trigger disabled={busy} className={action}>
						Make active…
					</Menu.Trigger>
					<Menu.Portal>
						<Menu.Content align="end" sideOffset={4} className={`${menu} w-[min(300px,calc(100vw-40px))]`}>
							{/* Not a swap: the plan is at its limit, so one active company is paused instead. */}
							<Menu.Label className={menuLabel}>Pause in its place</Menu.Label>
							{tracking.activeOrganisations.map((active) => (
								<Menu.Item key={idOf(active)} className={menuItem} onSelect={() => activate(active)}>
									<span className="min-w-0 flex-1 truncate">{nameOf(active)}</span>
								</Menu.Item>
							))}
						</Menu.Content>
					</Menu.Portal>
				</Menu.Root>
			)}
		</div>
	);
});

/** The companies a user tracks: what their plan allows, the ones being checked, and the paused. */
const Tracking = observer(() => {
	const [search] = useSearchParams();
	const [openId, setOpenId] = useState<string | null>(() => search.get("open"));
	// The companies with a change the user had not seen when they came: marked for this visit.
	const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
	const noted = useRef(false);

	const loaded = tracking.status === "loaded";
	const alertEmails = auth.state.status === "signed-in" && auth.state.profile.alertEmails;

	// Coming here is looking: from now on these changes are no longer new.
	useEffect(() => {
		if (!loaded || noted.current) return;
		noted.current = true;
		setFresh(new Set(tracking.organisations.filter((o) => seenChanges.isNew(o.latestChange)).map(idOf)));
		seenChanges.markSeen();
	}, [loaded]);

	// The open row's changes load when it opens.
	const opened = loaded ? (tracking.activeOrganisations.find((o) => idOf(o) === openId) ?? null) : null;
	const openedId = opened ? idOf(opened) : null;
	useEffect(() => {
		if (!opened) return;
		tracking.open(opened);
		return () => tracking.close();
		// The row is the same one for as long as its id is.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openedId]);

	const plan = planLabel(tracking.plan);
	const used = Math.min(tracking.slotsUsed, tracking.slots);
	const active = tracking.activeOrganisations;
	const paused = tracking.pausedOrganisations;

	return (
		<Page>
			<PageHeader
				title="Tracking"
				subtitle={`Checked against the registry every night. ${
					alertEmails ? "You get one email on days something changes." : "Alert emails are off."
				}`}
			/>

			{(tracking.status === "idle" || tracking.status === "loading") && <Loading className="mt-[22px] h-40" />}

			{tracking.status === "error" && (
				<Failed onRetry={tracking.reload} className="mt-[22px]">
					Something went wrong while loading your tracked companies.
				</Failed>
			)}

			{loaded && (
				<div className={`${box} mt-[22px] px-4`}>
					<div className="py-[13px]">
						<div className="flex justify-between gap-3 text-[14px]">
							<span>Slots</span>
							<span className="text-muted-foreground">
								{used} of {tracking.slots} slot{tracking.slots === 1 ? "" : "s"} used
							</span>
						</div>
						<Bar part={tracking.slots ? used / tracking.slots : 0} className="mt-[9px]" />
					</div>
					<div className="flex justify-between gap-3 border-t border-divider py-3 text-[14px]">
						<span>Swaps</span>
						<span className="text-right text-muted-foreground">{tracking.swapsText ?? `No swaps on ${plan}`}</span>
					</div>
					<Link to={APP.plans} className="flex items-center justify-between gap-3 border-t border-divider py-3 text-[14px] text-foreground">
						<span>Plan</span>
						<span className="flex items-center gap-1.5 text-muted-foreground">
							{plan}
							<ChevronRight className="size-3 text-faint" strokeWidth={2.4} />
						</span>
					</Link>
				</div>
			)}

			{loaded && paused.length > 0 && (
				<div className="mt-3 rounded-xl bg-warn-bg px-4 py-3 text-[13.5px] leading-normal text-warn-fg">
					{tracking.plan !== "free"
						? `You're over your plan's ${tracking.slots} slots. You can choose which companies stay active.`
						: tracking.freeChoiceOpen
							? "Free keeps one tracked company. Choose the one to keep: it can't be changed afterwards."
							: "Free keeps one tracked company. The others are paused."}{" "}
					Paused companies aren't checked and send no alerts.{" "}
					<Link to={APP.plans} className="-mx-2 -my-3.5 px-2 py-3.5 font-semibold text-inherit underline">
						Upgrade
					</Link>
				</div>
			)}

			{loaded && active.length > 0 && (
				<div>
					<div className={sectionLabel}>Active</div>
					<div className={`${box} app-rows py-[5px]`}>
						{active.map((organisation) => {
							const id = idOf(organisation);
							return (
								<ActiveRow
									key={id}
									organisation={organisation}
									open={openId === id}
									fresh={fresh.has(id)}
									onToggle={() => setOpenId(openId === id ? null : id)}
								/>
							);
						})}
					</div>
				</div>
			)}

			{loaded && paused.length > 0 && (
				<div>
					<div className={sectionLabel}>Paused</div>
					<div className={`${box} px-4`}>
						{paused.map((organisation) => (
							<PausedRow key={idOf(organisation)} organisation={organisation} />
						))}
					</div>
				</div>
			)}

			{loaded && tracking.organisations.length === 0 && (
				<EmptyCard title="Not tracking anything">
					<p className="mt-1.5 mb-0 text-[14px] text-muted-foreground">
						{tracking.refusal() ??
							(tracking.plan === "free"
								? "Find a company and press Track. Your first one is free."
								: "Find a company and press Track. We check it every night.")}
					</p>
					<Link to={APP.search} className={`${pill({ tone: "accent" })} mt-4`}>
						Find a company
					</Link>
				</EmptyCard>
			)}
		</Page>
	);
});

export default Tracking;
