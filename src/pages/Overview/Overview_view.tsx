import { Link } from "react-router";
import { observer } from "mobx-react";
import { ChevronRight } from "lucide-react";
import { newChangeCount, recentChanges, useAlertEmails } from "@/app/changes";
import { APP, organisationId, trackedPath } from "@/app/routes";
import { Bar, box, Failed, Loading, Page, PageHeader, pill, pressRow, Switch, textLink } from "@/app/ui";
import { library } from "@/library";
import { changeTitle, seenChanges, shortDay, tracking } from "@/tracking";

// As many of the latest changes as the screen shows; the Tracking page has them all.
const MOST = 6;

const tile = `${box} block px-[18px] py-4 text-foreground`;
const tileLabel = "text-[12.5px] text-muted-foreground";
const tileNumber = "text-[28px] font-semibold tracking-[-0.02em]";
const heading = "text-[17px] font-semibold";

/** Where the app opens: what changed in the tracked companies, and how much of everything there is. */
const Overview = observer(() => {
	const alertEmails = useAlertEmails();

	const newCount = newChangeCount();
	const changes = recentChanges().slice(0, MOST);
	const used = Math.min(tracking.slotsUsed, tracking.slots);
	const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

	return (
		<Page>
			<PageHeader
				title="Overview"
				subtitle={`${today} · ${
					newCount > 0
						? `${newCount} new change${newCount === 1 ? "" : "s"} across your tracked companies since your last visit.`
						: "No new changes since your last visit."
				}`}
			>
				<Link to={APP.search} className={pill({ tone: "accent" })}>
					Find a company
				</Link>
			</PageHeader>

			<div className="mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
				<Link to={APP.tracking} className={tile}>
					<div className={tileLabel}>Tracking</div>
					<div className="mt-1.5 flex items-baseline gap-1.5">
						<span className={tileNumber}>{tracking.activeOrganisations.length}</span>
						<span className="text-[13px] text-muted-foreground">of {tracking.slots} slots used</span>
					</div>
					<Bar part={tracking.slots ? used / tracking.slots : 0} className="mt-2.5" />
				</Link>
				<Link to={APP.saved} className={tile}>
					<div className={tileLabel}>Saved</div>
					<div className={`${tileNumber} mt-1.5`}>{library.favouriteCount}</div>
				</Link>
				<Link to={APP.groups} className={tile}>
					<div className={tileLabel}>Groups</div>
					<div className={`${tileNumber} mt-1.5`}>{library.groupCount}</div>
				</Link>
			</div>

			<div>
				<div className="mx-1 mt-8 mb-2 flex items-baseline justify-between gap-3">
					<div className={heading}>Recent changes</div>
					<Link to={APP.tracking} className={textLink}>
						Show all
					</Link>
				</div>
				{tracking.status === "error" ? (
					<Failed onRetry={tracking.reload} className="">
						Something went wrong while loading your tracked companies.
					</Failed>
				) : tracking.status !== "loaded" ? (
					<Loading />
				) : changes.length > 0 ? (
					<div className={`${box} app-rows py-[5px]`}>
						{changes.map((organisation) => {
							const change = organisation.latestChange;
							const isNew = seenChanges.isNew(change);
							return (
								<Link key={organisationId(organisation)} to={trackedPath(organisation)} className={pressRow}>
									<span className={`size-[7px] flex-none rounded-full ${isNew ? "bg-primary" : "bg-border-strong"}`} />
									<div className="min-w-0 flex-1">
										<div className="text-[14px] font-medium">{changeTitle(change.kind)}</div>
										<div className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
											{organisation.organisationName} — {change.detail}
										</div>
									</div>
									<span className={`text-[12.5px] whitespace-nowrap ${isNew ? "text-primary-text" : "text-faint"}`}>
										{shortDay(change.detectedAt)}
									</span>
									<ChevronRight className="size-3 flex-none text-faint" strokeWidth={2.4} />
								</Link>
							);
						})}
					</div>
				) : (
					<div className={`${box} px-5 py-7 text-center text-[14px] text-muted-foreground`}>
						No changes yet. Tracked companies are checked every night.
					</div>
				)}
			</div>

			<div>
				<div className={`${heading} mx-1 mt-8 mb-2`}>Notifications</div>
				<div className={`${box} flex items-center gap-3.5 px-4 py-3`}>
					<div className="min-w-0 flex-1">
						<div className="text-[14px]">Alert emails</div>
						<div className="mt-0.5 text-[12.5px] text-muted-foreground">
							One email on days something changes. Tracked companies are checked every night.
						</div>
					</div>
					<Switch label="Alert emails" checked={alertEmails.on} disabled={alertEmails.saving} onChange={alertEmails.set} />
				</div>
			</div>
		</Page>
	);
});

export default Overview;
