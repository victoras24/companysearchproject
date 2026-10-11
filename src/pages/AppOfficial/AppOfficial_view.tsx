import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { observer } from "mobx-react";
import { Bookmark, FileText, Search } from "lucide-react";
import { orderReport, toggleSave } from "@/app/actions";
import { BackLink, box, CompanyLink, Loading, Page, pill, useOrigin } from "@/app/ui";
import { reportPrice } from "@/checkout";
import { useCartStore } from "@/context/CartStore";
import type { IRelatedCompany } from "@/gEntities";
import { library } from "@/library";
import { positionLabel } from "@/organisation/position";
import { filterAppointments, roleStats } from "@/pages/PersonOrOrganisation/appointments";
import PersonOrOrganisationModel from "@/pages/PersonOrOrganisation/PersonOrOrganisation_model";

/** One company the name holds a position in, with what can be done with it there and then. */
const Appointment = observer(({ appointment, official }: { appointment: IRelatedCompany; official: string }) => {
	const cart = useCartStore();
	// Without its type the registry cannot say which organisation this number names.
	const known = Boolean(appointment.organisationTypeCode);
	const saved = library.isSaved(appointment);
	const inCart = known && cart.has({ organisationTypeCode: appointment.organisationTypeCode!, registrationNo: appointment.registrationNo });

	const label = "hidden min-[860px]:inline";

	return (
		<div className="app-row flex items-center gap-2 py-2.5 pr-2 pl-[11px] hover:bg-hover">
			<div className="min-w-0 flex-1">
				<CompanyLink company={appointment} from={official} linked={known} className="text-[14.5px] font-medium" />
				<div className="mt-[3px] flex items-center gap-2 text-[12.5px] text-muted-foreground">
					<span className="truncate">{positionLabel(appointment.officialPosition)}</span>
					<span className="app-mono text-[12px]">{appointment.registrationNo}</span>
				</div>
			</div>
			{known && (
				<>
					<button
						type="button"
						title={saved ? "Saved" : "Save"}
						aria-label={saved ? "Saved" : "Save"}
						aria-pressed={saved}
						disabled={library.isBusy(appointment)}
						onClick={() => toggleSave(appointment)}
						className={pill({ size: "row", tone: saved ? "on" : "grey" })}
					>
						<Bookmark className="size-[13px]" strokeWidth={2} fill={saved ? "currentColor" : "none"} />
						<span className={label}>{saved ? "Saved" : "Save"}</span>
					</button>
					<button
						type="button"
						title={`Full Company Report · ${reportPrice()}`}
						aria-label={inCart ? "Report in cart" : "Add report"}
						onClick={() =>
							orderReport(cart, {
								organisationTypeCode: appointment.organisationTypeCode!,
								registrationNo: appointment.registrationNo,
								organisationName: appointment.organisationName,
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

/** An official inside the app: the companies in which the name holds a position. */
const AppOfficial = observer(() => {
	const { name = "" } = useParams();
	const from = useOrigin();

	const [model, setModel] = useState<PersonOrOrganisationModel | null>(null);
	const [position, setPosition] = useState<string | null>(null);
	const [text, setText] = useState("");

	// A new official starts with every position and no filter.
	useEffect(() => {
		const next = new PersonOrOrganisationModel(name);
		setModel(next);
		setPosition(null);
		setText("");
		next.onMount();
	}, [name]);

	const loading = !model || model.isLoading;
	const appointments = !loading && Array.isArray(model.relatedCompanies) ? model.relatedCompanies : [];
	const stats = roleStats(appointments, Infinity);
	const rows = filterAppointments(appointments, position, text);

	return (
		<Page>
			<div>
				<BackLink from={from} />
			</div>

			<div>
				<div className="mt-[18px] text-[12.5px] text-muted-foreground">Official</div>
				<h1 className="mt-1 mb-0 text-[clamp(24px,3.4vw,30px)] leading-[1.12] font-bold tracking-[-0.025em] text-balance">{name}</h1>
				<div className="mt-1.5 text-[15px] text-muted-foreground">
					{loading
						? "Looking through the registry…"
						: `Appears in ${appointments.length} Cyprus ${appointments.length === 1 ? "company" : "companies"}`}
				</div>
			</div>

			{!loading && appointments.length > 0 && (
				<div className="mt-5 flex flex-wrap gap-1.5">
					{stats.map((stat) => {
						const on = stat.position === position;
						return (
							<button
								key={stat.position ?? "all"}
								type="button"
								aria-pressed={on}
								onClick={() => setPosition(stat.position)}
								className={`${pill({ tone: on ? "accent" : "grey" })} text-[13px]`}
							>
								<span>{stat.position === null ? "All" : positionLabel(stat.position)}</span>
								<span className="font-normal tabular-nums opacity-60">{stat.count}</span>
							</button>
						);
					})}
				</div>
			)}

			<div className="mt-3.5 rounded-xl bg-warn-bg px-4 py-[11px] text-[13px] leading-normal text-warn-fg">
				Companies are matched by name only. We can't confirm that people with the same or similar names are the same
				person.
			</div>

			<div className="mx-1 mt-6 mb-2 flex items-center justify-between gap-3">
				<span className="min-w-0 truncate text-[12.5px] text-muted-foreground">{position === null ? "Linked companies" : `As ${positionLabel(position)}`}</span>
				<label className="flex h-11 min-w-[150px] flex-[0_1_220px] items-center gap-1.5 rounded-lg bg-field px-2.5 text-muted-foreground min-[860px]:h-8">
					<Search className="size-[13px] flex-none" strokeWidth={2.2} />
					<input
						value={text}
						onChange={(event) => setText(event.target.value)}
						placeholder="Filter"
						aria-label="Filter companies"
						className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
					/>
				</label>
			</div>

			{loading ? (
				<Loading className="h-40" />
			) : rows.length > 0 ? (
				<div className={`${box} app-rows py-[5px]`}>
					{rows.map((appointment, index) => (
						<Appointment
							key={`${appointment.organisationTypeCode}/${appointment.registrationNo}/${appointment.officialPosition}/${index}`}
							appointment={appointment}
							official={name}
						/>
					))}
				</div>
			) : (
				<div className="px-1 py-7 text-[14px] text-muted-foreground">
					{appointments.length === 0
						? "The registry lists no companies under this name."
						: text.trim()
							? `No companies match "${text.trim()}".`
							: "No companies in this position."}
				</div>
			)}
		</Page>
	);
});

export default AppOfficial;
