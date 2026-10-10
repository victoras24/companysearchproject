import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { observer } from "mobx-react";
import { Lock } from "lucide-react";
import { auth } from "@/auth";
import { lookup } from "@/api/organisationApi";
import { checkout, reportPrice } from "@/checkout";
import { BackToSearchLink } from "@/components/BackToSearchLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/context/CartStore";
import { SaveButton } from "@/library/SaveButton";
import {
	detailsPath,
	registeredAddressText,
	registrationDateText,
	statusGroupOf,
	statusLabel,
	statusLine,
} from "@/organisation/organisation";
import { Rise } from "@/site/motion";
import { SitePage } from "@/site/SitePage";
import { StatusBadge } from "@/site/StatusBadge";
import { primaryPill, statusDotClass } from "@/site/ui";
import { tracking } from "@/tracking";
import { TrackButton } from "@/tracking/TrackButton";
import { TrackedPanel } from "@/tracking/TrackedPanel";
import PersonOrOrganisationModel from "../PersonOrOrganisation/PersonOrOrganisation_model";
import { OrganisationRecordLoader } from "./OrganisationRecordLoader";

type Tab = "overview" | "people" | "related" | "tracking";

const TABS: Array<[Tab, string]> = [
	["overview", "Overview"],
	["people", "Key people"],
	["related", "Related"],
	["tracking", "Tracking"],
];

// What the registry holds about an official that only the report shows.
const LOCKED_FIELDS = ["Address", "Country", "Appointed", "Previous address"];

const card = "mt-4 rounded-[24px] border border-border bg-surface p-[clamp(20px,4vw,32px)]";
const cardTitle = "font-display text-[20px] font-semibold";
const fieldLabel = "text-[13px] font-medium text-muted-foreground";

const OrganisationDetails: React.FC = observer(() => {
	const { typeCode = "", registrationNo = "" } = useParams();
	const navigate = useNavigate();
	const [loader] = useState(() => new OrganisationRecordLoader({ lookup }));
	const [activeTab, setActiveTab] = useState<Tab>("overview");

	const cartStore = useCartStore();

	useEffect(() => {
		loader.load(typeCode, registrationNo);
		setActiveTab("overview");
	}, [loader, typeCode, registrationNo]);

	useEffect(() => () => loader.dispose(), [loader]);

	useEffect(() => checkout.loadPrice(), []);

	// What the checker has for this organisation, for a user tracking it; a first check shows as it finishes.
	useEffect(() => {
		tracking.open({ organisationTypeCode: typeCode, registrationNo });
		const stopWatching = tracking.watch();
		return () => {
			stopWatching();
			tracking.close();
		};
	}, [typeCode, registrationNo]);

	const view = loader.view;
	const organisationName =
		view.status === "loaded" ? view.record.organisation.organisationName : null;

	// Appointments are found by name, so they load once the record has given the name.
	const [appointments, setAppointments] = useState<PersonOrOrganisationModel | null>(null);
	useEffect(() => {
		if (!organisationName) {
			setAppointments(null);
			return;
		}
		const model = new PersonOrOrganisationModel(organisationName);
		setAppointments(model);
		model.onMount();
	}, [organisationName]);

	if (view.status === "loading") {
		return (
			<SitePage header={{ current: "search" }}>
				<div className="space-y-6">
					<div className="space-y-3">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-12 w-3/4" />
						<Skeleton className="h-5 w-1/2" />
					</div>
					<Skeleton className="h-[260px] w-full rounded-[24px]" />
				</div>
			</SitePage>
		);
	}

	if (view.status === "not-found") {
		return (
			<SitePage header={{ current: "search" }}>
				<BackToSearchLink />
				<div className={card}>
					<div className={cardTitle}>Company not found</div>
					<p className="mt-1 mb-0 text-[14.5px] text-muted-foreground">
						No company found for {view.typeCode} {view.registrationNo}.
					</p>
				</div>
			</SitePage>
		);
	}

	if (view.status === "error") {
		return (
			<SitePage header={{ current: "search" }}>
				<BackToSearchLink />
				<div role="alert" className={card}>
					<div className={cardTitle}>Something went wrong while loading this company.</div>
					<button type="button" onClick={loader.retry} className={`${primaryPill} mt-4 cursor-pointer px-5 py-3 text-[15px]`}>
						Try again
					</button>
				</div>
			</SitePage>
		);
	}

	const { organisation, address, officials } = view.record;

	const registrationDate = registrationDateText(organisation.registrationDate);
	const status = statusLine(organisation);
	const inCart = cartStore.has({ organisationTypeCode: organisation.organisationTypeCode ?? typeCode, registrationNo: organisation.registrationNo });
	const signedOut = auth.state.status === "signed-out";
	const related = appointments && !appointments.isLoading ? appointments.relatedCompanies : null;

	const orderReport = () => {
		if (inCart) {
			navigate("/cart");
			return;
		}
		cartStore.addItem({
			organisationTypeCode: organisation.organisationTypeCode ?? typeCode,
			registrationNo: organisation.registrationNo,
			organisationName: organisation.organisationName ?? "",
			statusGroup: organisation.statusGroup,
			registrationDate: organisation.registrationDate,
		});
	};

	const quickLink = (count: number | null, label: string, tab: Tab) => (
		<button
			type="button"
			onClick={() => setActiveTab(tab)}
			className="flex cursor-pointer items-center justify-between gap-3 rounded-[20px] border border-border bg-surface px-[22px] py-5 text-left transition-colors hover:border-tint-border"
		>
			<div>
				<div className="font-display text-[26px] font-semibold text-ink">{count ?? "…"}</div>
				<div className="mt-0.5 text-[14px] text-muted-foreground">{label}</div>
			</div>
			<span className="text-[18px] text-primary-text">→</span>
		</button>
	);

	return (
		<SitePage
			header={{ current: "search" }}
			className="mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-[clamp(24px,5vw,44px)] pb-[164px] min-[860px]:pb-20"
		>
			<Rise>
				<BackToSearchLink />
			</Rise>

			<Rise delay={60} className="mt-[22px] flex flex-wrap items-end justify-between gap-6">
				<div className="min-w-0 flex-[1_1_520px]">
					<div className="flex flex-wrap items-center gap-2.5">
						<StatusBadge organisation={organisation} large />
						<span className="font-mono text-[13px] text-muted-foreground">Reg No {organisation.registrationNo}</span>
					</div>
					<h1 className="mt-3 mb-0 font-display text-[clamp(28px,4.4vw,48px)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance">
						{organisation.organisationName}
					</h1>
					<div className="mt-3 flex flex-wrap gap-x-[18px] gap-y-1.5 text-[15px] text-muted-foreground">
						<span>Incorporated on {registrationDate}</span>
						{address?.territory && <span>{address.territory}</span>}
						{organisation.organisationType && <span>{organisation.organisationType}</span>}
					</div>
					{status && <div className="mt-1.5 text-[15px] text-muted-foreground">{status}</div>}
				</div>
				<div className="flex flex-wrap gap-2">
					<TrackButton organisation={organisation} />
					<SaveButton organisation={organisation} />
				</div>
			</Rise>

			<div className="mt-9 grid grid-cols-1 items-start gap-7 min-[860px]:grid-cols-[minmax(0,1fr)_360px]">
				<Rise delay={120} className="min-w-0">
					<div role="tablist" className="csc-no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-divider p-1">
						{TABS.map(([id, label]) => (
							<button
								key={id}
								type="button"
								role="tab"
								aria-selected={activeTab === id}
								onClick={() => setActiveTab(id)}
								className={`flex-[1_0_auto] cursor-pointer rounded-full px-4 py-2.5 text-[14.5px] font-semibold whitespace-nowrap transition-colors duration-200 ${
									activeTab === id
										? "bg-surface text-ink shadow-[0_1px_3px_rgba(15,31,25,0.12)]"
										: "bg-transparent text-muted-foreground"
								}`}
							>
								{label}
							</button>
						))}
					</div>

					{activeTab === "overview" && (
						<Rise key="overview" distance={16}>
							<div className={card}>
								<div className={cardTitle}>Company information</div>
								<div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-x-7 gap-y-[22px]">
									<div>
										<div className={fieldLabel}>Registration number</div>
										<div className="mt-1.5 font-mono text-[15.5px]">{organisation.registrationNo || "Not available"}</div>
									</div>
									<div>
										<div className={fieldLabel}>Registration date</div>
										<div className="mt-1.5 text-[15.5px]">{registrationDate}</div>
									</div>
									{organisation.organisationType && (
										<div>
											<div className={fieldLabel}>Type</div>
											<div className="mt-1.5 text-[15.5px]">{organisation.organisationType}</div>
										</div>
									)}
									<div>
										<div className={fieldLabel}>Status</div>
										<div className="mt-1.5 flex items-center gap-2 text-[15.5px]">
											<span className={`size-2 rounded-full ${statusDotClass[statusGroupOf(organisation)]}`} />
											{statusLabel(organisation)}
										</div>
									</div>
								</div>
								<div className="my-[26px] h-px bg-divider" />
								<div className={fieldLabel}>Registered address</div>
								<div className="mt-1.5 text-[15.5px] leading-normal">{registeredAddressText(address)}</div>
							</div>
							<div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
								{quickLink(officials.length, officials.length === 1 ? "Official" : "Officials", "people")}
								{quickLink(related ? related.length : null, "Potentially related entities", "related")}
							</div>
						</Rise>
					)}

					{activeTab === "people" && (
						<Rise key="people" distance={16} className={card}>
							<div className={cardTitle}>Key people</div>
							<div className="mt-1 text-[14.5px] text-muted-foreground">
								Officials and key individuals involved with the company.
							</div>
							{officials.length > 0 ? (
								<div className="mt-3.5 flex flex-col">
									{officials.map((person, index) => (
										<div key={index} className="flex flex-wrap gap-x-[18px] gap-y-3.5 border-t border-divider py-[18px]">
											<div className="min-w-0 flex-[1_1_240px]">
												<Link
													to={`/official/${encodeURIComponent(person.personOrOrganisationName)}`}
													className="block text-[15.5px] font-semibold text-ink hover:text-primary-text"
												>
													{person.personOrOrganisationName}
												</Link>
												<div className="mt-[3px] text-[13.5px] text-muted-foreground">{person.officialPosition}</div>
											</div>
											<div className="flex flex-wrap items-center gap-1.5">
												{LOCKED_FIELDS.map((field) => (
													<span
														key={field}
														className="inline-flex items-center gap-1.5 rounded-lg bg-field px-2.5 py-1.5 text-[12.5px] text-muted-foreground"
													>
														<Lock className="size-[11px]" strokeWidth={2.4} />
														{field}
													</span>
												))}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="py-12 text-center text-[15px] text-muted-foreground">No officials data available</div>
							)}
							<div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-tint2 px-[18px] py-4">
								<span className="text-[14.5px] text-body2">
									Addresses, countries and appointment dates are included in the Full Company Report.
								</span>
								<button type="button" onClick={orderReport} className={`${primaryPill} cursor-pointer px-4 py-2.5 text-[14px] whitespace-nowrap`}>
									{inCart ? "In cart ✓" : "Order report"}
								</button>
							</div>
						</Rise>
					)}

					{activeTab === "related" && (
						<Rise key="related" distance={16} className={card}>
							<div className={cardTitle}>Potentially related entities</div>
							<div className="mt-1 text-[14.5px] text-muted-foreground">
								Companies where {organisation.organisationName} holds an official position.
							</div>
							{related === null ? (
								<div className="mt-5 space-y-3">
									<Skeleton className="h-12 w-full rounded-[14px]" />
									<Skeleton className="h-12 w-full rounded-[14px]" />
									<Skeleton className="h-12 w-3/4 rounded-[14px]" />
								</div>
							) : related.length > 0 ? (
								<div className="mt-3.5 flex flex-col">
									{related.map((appointment, index) => {
										const path = detailsPath(appointment);
										const content = (
											<>
												<div className="min-w-0 flex-1">
													<div className="text-[15.5px] font-semibold">{appointment.organisationName}</div>
													<div className="mt-[3px] text-[13.5px] text-muted-foreground">
														Official position: {appointment.officialPosition}
													</div>
												</div>
												{path && <span className="text-[18px] text-faint">→</span>}
											</>
										);
										const row = "-mx-2.5 flex items-center gap-3.5 rounded-[14px] px-2.5 py-4 text-ink";
										return path ? (
											<Link key={index} to={path} className={`${row} hover:bg-hover`}>
												{content}
											</Link>
										) : (
											<div key={index} className={row}>
												{content}
											</div>
										);
									})}
								</div>
							) : (
								<div className="py-12 text-center text-[15px] text-muted-foreground">No related data available</div>
							)}
						</Rise>
					)}

					{activeTab === "tracking" && (
						<Rise key="tracking" distance={16} className="mt-4">
							{signedOut ? <TrackingTeaser /> : <TrackedPanel organisation={organisation} />}
						</Rise>
					)}
				</Rise>

				<Rise delay={200} className="min-w-0 min-[860px]:sticky min-[860px]:top-24">
					<aside className="rounded-[26px] bg-primary p-[clamp(22px,4vw,30px)] text-white">
						<div className="text-[13px] font-semibold tracking-[0.06em] text-on-primary-muted uppercase">Full Company Report</div>
						<div className="mt-3 flex flex-wrap items-baseline gap-1.5">
							<span className="font-display text-[42px] leading-none font-semibold tracking-[-0.03em]">{reportPrice()}</span>
							<span className="text-[14px] text-on-primary-soft">per company</span>
						</div>
						<div className="mt-2.5 text-[14.5px] text-on-primary-soft">
							Delivered within one business day, with a summary from our research team.
						</div>
						<div className="mt-5 flex flex-col gap-2.5 text-[14.5px] leading-[1.4]">
							{[
								"Current and historical shareholders with addresses",
								"Complete company documents and filings",
								"Historical changes, previous names and mortgages",
							].map((line) => (
								<div key={line} className="flex gap-2.5">
									<span className="text-[#9FE3C1]">✓</span>
									{line}
								</div>
							))}
						</div>
						<button
							type="button"
							onClick={orderReport}
							className={`mt-6 w-full cursor-pointer rounded-[14px] p-[15px] text-[15.5px] font-semibold text-[#0A3B2C] transition-colors duration-200 ${
								inCart ? "bg-[#9FE3C1]" : "bg-white hover:bg-[#E6F2EC]"
							}`}
						>
							{inCart ? "In cart ✓ · Go to checkout" : "Order Full Company Report"}
						</button>
						<div className="mt-3 text-center text-[13px] text-on-primary-muted">Guest checkout · no account needed</div>
					</aside>
				</Rise>
			</div>

			{/* On a phone the report card is far down the page, so its price and button stay in reach. */}
			<div className="fixed inset-x-0 bottom-0 z-[25] flex items-center gap-3 border-t border-border bg-[var(--header)] px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-[14px] min-[860px]:hidden">
				<div className="min-w-0 flex-1">
					<div className="text-[12.5px] text-muted-foreground">Full Company Report</div>
					<div className="font-display text-[20px] font-semibold">{reportPrice()}</div>
				</div>
				<button type="button" onClick={orderReport} className={`${primaryPill} cursor-pointer px-5 py-[13px] text-[14.5px] whitespace-nowrap`}>
					{inCart ? "In cart ✓" : "Order report"}
				</button>
			</div>
		</SitePage>
	);
});

// A picture of what tracking shows, behind the invitation. Its changes are made up.
const SAMPLE_CHANGES = [
	["Director appointed", "Elena Charalambous", "12 Oct"],
	["Registered office changed", "Nicosia → Limassol", "28 Sep"],
	["Secretary resigned", "Pafos Secretarial Ltd", "03 Sep"],
	["Name changed", "from Aegean Maritime Ltd", "14 Jul"],
];

/** What a signed-out visitor sees in place of an organisation's tracked changes. */
function TrackingTeaser() {
	return (
		<div className="relative overflow-hidden rounded-[24px] border border-border bg-surface p-[clamp(20px,4vw,32px)]">
			<div className={cardTitle}>Change history</div>
			<div aria-hidden className="pointer-events-none mt-4 flex flex-col gap-0.5 opacity-60 blur-[3px] select-none">
				{SAMPLE_CHANGES.map(([title, detail, day], i) => (
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
			<div className="absolute inset-x-4 top-[70px] bottom-4 grid place-items-center">
				<div className="max-w-[380px] rounded-[22px] border border-border bg-surface p-[26px] text-center shadow-[0_30px_60px_-24px_rgba(15,31,25,0.3)]">
					<div className="font-display text-[21px] leading-[1.2] font-semibold text-balance">
						Be told when this company changes.
					</div>
					<p className="mt-2.5 mb-0 text-[14.5px] leading-[1.55] text-muted-foreground">
						Track officials, addresses, names and status, with an email for every change. Your first tracked
						company is free.
					</p>
					<div className="mt-[18px] flex flex-col gap-2">
						<Link to="/signup" className={`${primaryPill} p-[13px] text-[15px]`}>
							Create free account
						</Link>
						<Link to="/login" className="p-1.5 text-[14px] text-text2 hover:text-ink">
							I already have an account
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default OrganisationDetails;
