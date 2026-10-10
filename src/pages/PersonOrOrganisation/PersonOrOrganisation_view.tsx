import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { observer } from "mobx-react";
import { Info, Search } from "lucide-react";
import { auth } from "@/auth";
import { checkout, reportPrice } from "@/checkout";
import { BackToSearchLink } from "@/components/BackToSearchLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/context/CartStore";
import type { IRelatedCompany } from "@/gEntities";
import { detailsPath } from "@/organisation/organisation";
import { Rise } from "@/site/motion";
import { SitePage } from "@/site/SitePage";
import { cartPill, eyebrow, primaryPill } from "@/site/ui";
import { filterAppointments, roleStats } from "./appointments";
import PersonOrOrganisationModel from "./PersonOrOrganisation_model";

/** An official: the organisations in which the name holds a position. */
const PersonOrOrganisation: React.FC = observer(() => {
	const { personOrOrganisationName = "" } = useParams();
	const cart = useCartStore();

	const [model, setModel] = useState<PersonOrOrganisationModel | null>(null);
	const [position, setPosition] = useState<string | null>(null);
	const [text, setText] = useState("");

	useEffect(() => {
		const next = new PersonOrOrganisationModel(personOrOrganisationName);
		setModel(next);
		setPosition(null);
		setText("");
		next.onMount();
	}, [personOrOrganisationName]);

	useEffect(() => checkout.loadPrice(), []);

	const loading = !model || model.isLoading;
	const appointments = !loading && Array.isArray(model.relatedCompanies) ? model.relatedCompanies : [];
	const stats = roleStats(appointments);
	const rows = filterAppointments(appointments, position, text);
	const signedIn = auth.state.status === "signed-in";

	const toggleReport = (appointment: IRelatedCompany) => {
		const key = { organisationTypeCode: appointment.organisationTypeCode!, registrationNo: appointment.registrationNo };
		if (cart.has(key)) cart.removeItem(key);
		else cart.addItem({ ...key, organisationName: appointment.organisationName });
	};

	return (
		<SitePage header={{ current: "search" }}>
			<Rise>
				<BackToSearchLink />
			</Rise>

			<Rise delay={60} className="mt-[22px]">
				<div className={eyebrow}>Official</div>
				<h1 className="mt-2 mb-0 font-display text-[clamp(28px,4.4vw,48px)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance">
					{personOrOrganisationName}
				</h1>
				<div className="mt-2.5 text-[15px] text-muted-foreground">
					{loading ? (
						<Skeleton className="h-5 w-56" />
					) : (
						`Appears in ${appointments.length} Cyprus ${appointments.length === 1 ? "company" : "companies"}`
					)}
				</div>
			</Rise>

			{!loading && (
				<div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
					{stats.map((stat, i) => {
						const on = stat.position === position;
						return (
							<Rise key={stat.position ?? "all"} delay={120 + i * 70}>
								<button
									type="button"
									aria-pressed={on}
									onClick={() => setPosition(stat.position)}
									className={`w-full cursor-pointer rounded-[20px] border px-5 py-[18px] text-left transition-colors duration-200 hover:border-primary-text ${
										on ? "border-primary-border bg-primary" : "border-border bg-surface"
									}`}
								>
									<div
										className={`font-display text-[32px] leading-none font-semibold tracking-[-0.03em] ${on ? "text-white" : "text-ink"}`}
									>
										{stat.count}
									</div>
									<div className={`mt-2 text-[14px] ${on ? "text-on-primary-soft" : "text-muted-foreground"}`}>
										{stat.position ?? "All companies"}
									</div>
								</button>
							</Rise>
						);
					})}
				</div>
			)}

			<Rise
				delay={180}
				className="mt-4 flex items-start gap-3 rounded-2xl border border-warn-border bg-warn-bg px-[18px] py-3.5 text-[14px] leading-normal text-warn-fg"
			>
				<Info className="mt-0.5 size-4 flex-none" strokeWidth={2.2} />
				<span>
					Companies are matched by name only. We can't confirm that people with the same or similar names are the
					same person.
				</span>
			</Rise>

			<Rise delay={240} className="mt-6 overflow-hidden rounded-[26px] border border-border bg-surface">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-[clamp(18px,3vw,28px)] py-[clamp(18px,3vw,24px)]">
					<div className="font-display text-[20px] font-semibold">
						{position === null ? "Linked companies" : `As ${position}`}
					</div>
					<label className="flex h-[42px] min-w-0 flex-[0_1_280px] items-center gap-2.5 rounded-xl bg-field px-3.5">
						<Search className="size-[15px] flex-none text-muted-foreground" strokeWidth={2.2} />
						<input
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Filter companies"
							aria-label="Filter companies"
							className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
						/>
					</label>
				</div>
				<div className="px-[clamp(18px,3vw,28px)]">
					{loading ? (
						<div className="space-y-4 py-6">
							<Skeleton className="h-12 w-full rounded-[14px]" />
							<Skeleton className="h-12 w-full rounded-[14px]" />
							<Skeleton className="h-12 w-2/3 rounded-[14px]" />
						</div>
					) : rows.length > 0 ? (
						rows.map((appointment, i) => {
							const path = detailsPath(appointment);
							const inCart = cart.has(appointment);
							const company = (
								<>
									<div className="text-[16px] leading-[1.3] font-semibold">{appointment.organisationName}</div>
									<div className="mt-[5px] font-mono text-[12.5px] text-muted-foreground">
										Reg No {appointment.registrationNo}
									</div>
								</>
							);
							return (
								<div
									key={`${appointment.organisationTypeCode}/${appointment.registrationNo}/${appointment.officialPosition}/${i}`}
									className={`flex flex-wrap items-center gap-x-[18px] gap-y-3.5 py-[18px] ${i ? "border-t border-divider" : ""}`}
								>
									{path ? (
										<Link to={path} className="min-w-0 flex-[1_1_300px] text-ink hover:text-primary-text">
											{company}
										</Link>
									) : (
										<div className="min-w-0 flex-[1_1_300px]">{company}</div>
									)}
									<span className="rounded-full bg-field px-3 py-1.5 text-[13.5px] font-semibold whitespace-nowrap text-text2">
										{appointment.officialPosition}
									</span>
									{appointment.organisationTypeCode && (
										<button
											type="button"
											onClick={() => toggleReport(appointment)}
											className={`${cartPill(inCart)} h-10 px-4 text-[14px]`}
										>
											{inCart ? "In cart ✓" : `Add report · ${reportPrice()}`}
										</button>
									)}
								</div>
							);
						})
					) : (
						<div className="py-12 text-center text-[15px] text-muted-foreground">
							{appointments.length === 0 ? "No related data available" : `No companies match “${text.trim()}”.`}
						</div>
					)}
				</div>
			</Rise>

			<Rise delay={300} className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-[26px] bg-tint p-[clamp(22px,4vw,32px)]">
				<div className="max-w-[520px]">
					<div className="font-display text-[22px] font-semibold tracking-[-0.02em]">Know when their companies change</div>
					<div className="mt-1.5 text-[15px] leading-normal text-text2">
						Track any of these companies in the free web app and get an email for every change.
					</div>
				</div>
				<Link to={signedIn ? "/tracking" : "/signup"} className={`${primaryPill} px-[22px] py-[13px] text-[15px] whitespace-nowrap`}>
					{signedIn ? "Open tracking" : "Create free account"}
				</Link>
			</Rise>
		</SitePage>
	);
});

export default PersonOrOrganisation;
