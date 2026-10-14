import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { observer } from "mobx-react";
import { Bookmark, Radio } from "lucide-react";
import { lookup } from "@/api/organisationApi";
import { orderReport, toggleSave, toggleTrack } from "@/app/actions";
import { officialPath, type Origin } from "@/app/routes";
import { BackLink, box, CompanyLink, Failed, Loading, Page, pill, sectionLabel, Spinner, Status, textLink, useOrigin } from "@/app/ui";
import { reportPrice } from "@/checkout";
import { useCartStore } from "@/context/CartStore";
import { cn } from "@/lib/utils";
import { library } from "@/library";
import { activityText, registeredAddressText, registrationDateText, shortName, statusLine } from "@/organisation/organisation";
import { positionLabel } from "@/organisation/position";
import { OrganisationRecordLoader } from "@/pages/OrganisationDetails/OrganisationRecordLoader";
import { secretaryLast } from "@/pages/PersonOrOrganisation/appointments";
import PersonOrOrganisationModel from "@/pages/PersonOrOrganisation/PersonOrOrganisation_model";
import { changeTitle, checkLine, dayText, seenChanges, shortDay, tracking, type TrackedDetails } from "@/tracking";

const REPORT_HAS = ["Shareholders with addresses", "Documents and filings", "Historical changes and mortgages"];

const list = `${box} px-4`;
const fact = "flex justify-between gap-4 border-t border-divider py-3 text-[14px] first:border-t-0";
const line = "flex items-center gap-3 border-t border-divider py-[11px] first:border-t-0";
const note = "py-3.5 text-[14px] text-muted-foreground";

/** What the checker has recorded for a company the user tracks: its changes, then what is lodged and filed. */
function Tracked({ details }: { details: TrackedDetails }) {
	const check = checkLine(details);

	if (details.firstCheckInProgress) {
		return (
			<div className={list}>
				<div className={`${note} flex items-center gap-2`}>
					{!details.checksFailing && <Spinner />}
					{check}
				</div>
			</div>
		);
	}

	// The registry lists filings oldest first.
	const filings = [...details.filings].reverse();

	return (
		<>
			<div className={list}>
				{check && <div className={`${note} border-b border-divider`}>{check}. The registry could not be read since.</div>}
				{details.changes.length === 0 ? (
					<div className={note}>No changes recorded yet.</div>
				) : (
					details.changes.map((change, index) => (
						<div key={index} className={line}>
							<span className={`size-[7px] flex-none rounded-full ${seenChanges.isNew(change) ? "bg-primary" : "bg-border-strong"}`} />
							<div className="min-w-0 flex-1">
								<div className="text-[14px]">{changeTitle(change.kind)}</div>
								<div className="mt-0.5 text-[12.5px] text-muted-foreground">{change.detail}</div>
							</div>
							<span className="text-[12.5px] whitespace-nowrap text-muted-foreground">{shortDay(change.detectedAt)}</span>
						</div>
					))
				)}
			</div>

			<div className={`${sectionLabel} mt-6`}>Pending services</div>
			<div className={list}>
				{details.pendingServices.length === 0 ? (
					<div className={note}>None.</div>
				) : (
					details.pendingServices.map((service, index) => (
						<div key={index} className={line}>
							<div className="min-w-0 flex-1">
								<div className="text-[14px]">{service.service}</div>
								<div className="app-mono mt-0.5 text-[12px] text-muted-foreground">{service.applicationNumber}</div>
							</div>
							<span className="text-[12.5px] whitespace-nowrap text-muted-foreground">{shortDay(service.applicationDate)}</span>
						</div>
					))
				)}
			</div>

			<div className={`${sectionLabel} mt-6`}>Filings</div>
			<div className={list}>
				{filings.length === 0 ? (
					<div className={note}>None.</div>
				) : (
					filings.map((filing, index) => (
						<div key={index} className={line}>
							<div className="min-w-0 flex-1">
								<div className="text-[14px]">{filing.form}</div>
								<div className="mt-0.5 text-[12.5px] text-muted-foreground">
									{filing.service && `${filing.service} · `}
									<span className="app-mono text-[12px]">{filing.applicationNumber}</span>
								</div>
							</div>
							{filing.date && (
								<span className="text-[12.5px] whitespace-nowrap text-muted-foreground">Made up to {shortDay(filing.date)}</span>
							)}
						</div>
					))
				)}
			</div>
			{details.fileLastUpdated && (
				<div className="mx-1 mt-2 text-[12.5px] text-muted-foreground">
					Registry file last updated {dayText(details.fileLastUpdated)}.
				</div>
			)}
		</>
	);
}

/** A company's profile inside the app. */
const AppCompany = observer(() => {
	const { typeCode = "", registrationNo = "" } = useParams();
	const location = useLocation();
	const cart = useCartStore();
	const [loader] = useState(() => new OrganisationRecordLoader({ lookup }));

	useEffect(() => {
		loader.load(typeCode, registrationNo);
	}, [loader, typeCode, registrationNo]);

	useEffect(() => () => loader.dispose(), [loader]);

	// What the checker has for this company, for a user tracking it.
	useEffect(() => {
		tracking.open({ organisationTypeCode: typeCode, registrationNo });
		return () => tracking.close();
	}, [typeCode, registrationNo]);

	const view = loader.view;

	// The organisations in which this one holds a position, found by its name once that is known.
	const name = view.status === "loaded" ? view.record.organisation.organisationName : null;
	const [appointments, setAppointments] = useState<PersonOrOrganisationModel | null>(null);
	useEffect(() => {
		if (!name) return setAppointments(null);
		const next = new PersonOrOrganisationModel(name);
		setAppointments(next);
		next.onMount();
	}, [name]);

	const from = useOrigin();
	const back = <BackLink from={from} />;

	if (view.status === "loading") {
		return (
			<Page>
				<div>{back}</div>
				<Loading className="mt-4 h-[72px] max-w-[520px]" />
				<Loading className="mt-[26px] h-[220px]" />
			</Page>
		);
	}

	if (view.status === "not-found") {
		return (
			<Page>
				<div>{back}</div>
				<div className={`${box} mt-4 px-5 py-10 text-center`}>
					<div className="text-[17px] font-semibold">Company not found</div>
					<p className="mt-1.5 mb-0 text-[14px] text-muted-foreground">
						The registry has no company for {view.typeCode} {view.registrationNo}.
					</p>
				</div>
			</Page>
		);
	}

	if (view.status === "error") {
		return (
			<Page>
				<div>{back}</div>
				<Failed onRetry={loader.retry} className="mt-4">
					Something went wrong while loading this company.
				</Failed>
			</Page>
		);
	}

	const { organisation, address, officials } = view.record;
	const activity = activityText(view.record.activity);
	const saved = library.isSaved(organisation);
	const availability = tracking.availability(organisation);
	const tracked = availability === "tracked";
	const paused = tracking.pausedOrganisations.some(
		(o) => o.organisationTypeCode === organisation.organisationTypeCode?.trim().toUpperCase() && o.registrationNo === organisation.registrationNo
	);
	const status = statusLine(organisation);
	const details = tracking.details;

	const item = {
		organisationTypeCode: organisation.organisationTypeCode ?? typeCode,
		registrationNo: organisation.registrationNo,
		organisationName: organisation.organisationName ?? "",
		statusGroup: organisation.statusGroup,
		registrationDate: organisation.registrationDate,
	};
	const inCart = cart.has(item);
	const track = () => toggleTrack(organisation);

	const related =
		appointments && !appointments.isLoading && Array.isArray(appointments.relatedCompanies) ? appointments.relatedCompanies : null;
	// An official's page comes back here, to this company as it was opened.
	const here: Origin = {
		to: location.pathname,
		label: organisation.organisationName ?? organisation.registrationNo,
		state: location.state,
	};

	return (
		<Page>
			<div>{back}</div>

			<div className="mt-4 flex flex-wrap items-end justify-between gap-4">
				<div className="min-w-0 flex-[1_1_400px]">
					<h1 className="m-0 text-[clamp(24px,3.4vw,30px)] leading-[1.12] font-bold tracking-[-0.025em] text-balance">
						{organisation.organisationName}
					</h1>
					<div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13.5px] text-muted-foreground">
						<span className="text-foreground">
							<Status organisation={organisation} large />
						</span>
						<span className="app-mono text-[12.5px]">{organisation.registrationNo}</span>
						{address?.territory && <span>{address.territory}</span>}
					</div>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						aria-pressed={saved}
						disabled={library.isBusy(organisation)}
						onClick={() => toggleSave(organisation)}
						className={pill({ size: "page", tone: saved ? "on" : "grey" })}
					>
						<Bookmark className="size-[13px]" strokeWidth={2} fill={saved ? "currentColor" : "none"} />
						{saved ? "Saved" : "Save"}
					</button>
					<button
						type="button"
						aria-pressed={tracked}
						disabled={tracking.isBusy(organisation) || availability === "unknown"}
						onClick={track}
						className={pill({ size: "page", tone: tracked ? "on" : "grey" })}
					>
						<Radio className="size-[13px]" strokeWidth={2} />
						{tracked ? "Tracking" : "Track"}
					</button>
				</div>
			</div>

			<div className="mt-[26px] grid grid-cols-1 items-start gap-5 min-[1120px]:grid-cols-[minmax(0,1fr)_320px]">
				<div className="min-w-0">
					<div className={`${sectionLabel} mt-0`}>Information</div>
					<div className={list}>
						<div className={fact}>
							<span className="text-muted-foreground">Registration number</span>
							<span className="app-mono text-[13px]">{organisation.registrationNo}</span>
						</div>
						<div className={fact}>
							<span className="text-muted-foreground">Incorporated</span>
							<span>{registrationDateText(organisation.registrationDate)}</span>
						</div>
						{organisation.organisationType && (
							<div className={fact}>
								<span className="text-muted-foreground">Type</span>
								<span>{organisation.organisationType}</span>
							</div>
						)}
						{activity && (
							<div className={fact}>
								<span className="flex-none text-muted-foreground">Activity</span>
								<span className="text-right">{activity}</span>
							</div>
						)}
						{status && (
							<div className={fact}>
								<span className="flex-none text-muted-foreground">Registry status</span>
								<span className="text-right">{status}</span>
							</div>
						)}
						<div className={fact}>
							<span className="flex-none text-muted-foreground">Registered address</span>
							<span className="text-right">{registeredAddressText(address)}</span>
						</div>
					</div>

					<div className={`${sectionLabel} mt-6`}>Key people</div>
					<div className={list}>
						{officials.length === 0 ? (
							<div className={note}>The registry lists no officials.</div>
						) : (
							secretaryLast(officials).map((official, index) => {
								const path = officialPath(official.personOrOrganisationName);
								const person = (
									<>
										<span className="block text-[14px] text-foreground">{official.personOrOrganisationName}</span>
										<span className="mt-0.5 block text-[12.5px] text-muted-foreground">{positionLabel(official.officialPosition)}</span>
									</>
								);
								const row = "block min-h-11 border-t border-divider py-[11px] first:border-t-0 min-[860px]:min-h-0";
								return path ? (
									<Link key={index} to={path} state={{ from: here }} className={`${row} hover:opacity-80`}>
										{person}
									</Link>
								) : (
									<div key={index} className={row}>
										{person}
									</div>
								);
							})
						)}
					</div>

					<div className="mx-1 mt-6 mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
						<span className="text-[12.5px] text-muted-foreground">Potentially related entities</span>
						<span className="text-[12px] text-faint">Where {shortName(organisation.organisationName)} holds a position</span>
					</div>
					{related === null ? (
						<Loading className="h-16" />
					) : related.length === 0 ? (
						<div className={list}>
							<div className={note}>None found.</div>
						</div>
					) : (
						<div className={`${box} app-rows py-[5px]`}>
							{related.map((appointment, index) => (
								<div key={index} className="app-row px-[11px] py-2.5 hover:bg-hover">
									{/* Opens in place: the way back stays the screen this profile was opened from. */}
									<CompanyLink company={appointment} from={from.label} origin={from} className="text-[14.5px] font-medium" />
									<div className="mt-[3px] flex items-center gap-2 text-[12.5px] text-muted-foreground">
										<span>{positionLabel(appointment.officialPosition)}</span>
										<span className="app-mono text-[12px]">{appointment.registrationNo}</span>
									</div>
								</div>
							))}
						</div>
					)}

					<div className={`${sectionLabel} mt-6`}>Change history</div>
					{!tracked ? (
						<div className={list}>
							<div className="flex items-center gap-3 py-3.5">
								<span className="flex-1 text-[14px] text-muted-foreground">Track this company to record changes and get alerts.</span>
								<button type="button" disabled={availability === "unknown"} onClick={track} className={cn(textLink, "flex-none text-[14px]")}>
									Track
								</button>
							</div>
						</div>
					) : details.status === "loaded" ? (
						<>
							{paused && (
								<div className="mb-3 rounded-xl bg-warn-bg px-4 py-3 text-[13.5px] leading-normal text-warn-fg">
									Paused: this company is over your plan's limit, so it isn't checked and what is shown may be out of date.
								</div>
							)}
							<Tracked details={details.details} />
						</>
					) : details.status === "error" ? (
						<Failed onRetry={() => tracking.open(organisation)} className="">
							Something went wrong while loading what was tracked.
						</Failed>
					) : (
						<Loading className="h-24" />
					)}
				</div>

				<aside className="min-w-0 min-[1120px]:sticky min-[1120px]:top-6">
					{/* Beside the first section, the report starts level with its box, not with its label. */}
					<div aria-hidden className={`${sectionLabel} mt-0 hidden min-[1120px]:block`}>
						&nbsp;
					</div>
					<div className="rounded-[14px] bg-surface p-5 shadow-[0_0_0_1px_var(--border)]">
						<div className="text-[13px] text-muted-foreground">Full Company Report</div>
						<div className="mt-1 text-[28px] font-semibold tracking-[-0.02em]">{reportPrice()}</div>
						<div className="mt-3.5 flex flex-col gap-[7px] text-[13.5px] text-text2">
							{REPORT_HAS.map((text) => (
								<div key={text} className="flex gap-2">
									<span className="text-primary-text">✓</span>
									{text}
								</div>
							))}
						</div>
						<button
							type="button"
							onClick={() => orderReport(cart, item)}
							className={`mt-[18px] h-11 w-full cursor-pointer rounded-full text-[14px] font-medium min-[860px]:h-8 ${
								inCart ? "bg-tint text-primary-text" : "bg-primary text-primary-foreground"
							}`}
						>
							{inCart ? "In cart · Checkout" : "Order report"}
						</button>
						<div className="mt-2.5 text-center text-[12px] text-muted-foreground">Delivered within one business day</div>
					</div>
				</aside>
			</div>
		</Page>
	);
});

export default AppCompany;
