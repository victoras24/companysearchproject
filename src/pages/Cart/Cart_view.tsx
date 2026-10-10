import { useEffect, useState } from "react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import { FileText, Lock, Plus, Trash2 } from "lucide-react";
import { search } from "@/api/searchApi";
import { checkout, formatPrice, formatVatIncluded, reportPrice } from "@/checkout";
import { useCartStore } from "@/context/CartStore";
import type { ICartItem, ICompany } from "@/gEntities";
import { detailsPath } from "@/organisation/organisation";
import { Reveal, Rise } from "@/site/motion";
import { SitePage } from "@/site/SitePage";
import { StatusBadge } from "@/site/StatusBadge";
import { eyebrow, primaryPill } from "@/site/ui";
import { ReportSuggestions } from "./ReportSuggestions";

const STEPS = [
	["Pay securely on Stripe", "Card, Apple Pay or Google Pay. Your receipt and VAT invoice arrive by email."],
	["Our team researches", "We pull the latest registry documents and write a short summary."],
	["Report in your inbox", "Delivered as a PDF within one business day."],
] as const;

// How long a removed item takes to slide away and its row to close.
const REMOVE_MS = 480;

const idOf = (item: ICartItem) => `${item.organisationTypeCode}/${item.registrationNo}`;

/** "Incorporated 2014", from the registry's DD/MM/YYYY. */
const incorporated = (registrationDate?: string | null) => {
	const year = registrationDate?.match(/(\d{4})$/)?.[1];
	return year ? `Incorporated ${year}` : null;
};

const Cart = observer(() => {
	const cartStore = useCartStore();
	const [removing, setRemoving] = useState<string | null>(null);
	const [suggestions] = useState(
		() =>
			new ReportSuggestions({
				suggest: async ({ query, signal }) => {
					const found = await search({
						entityType: "organisation",
						query,
						statusFilter: "all",
						page: 1,
						pageSize: 10,
						signal,
					});
					return found.items as ICompany[];
				},
				inCart: (company) => cartStore.has(company),
			})
	);

	useEffect(() => checkout.loadPrice(), []);
	useEffect(() => () => suggestions.dispose(), [suggestions]);

	const { price, state } = checkout;
	const items = cartStore.cartItems;
	const reports = items.length;
	const pending = state.status === "pending";

	const remove = (item: ICartItem) => {
		if (removing) return;
		setRemoving(idOf(item));
		setTimeout(() => {
			cartStore.removeItem(item);
			setRemoving(null);
		}, REMOVE_MS);
	};

	const add = (company: ICompany) => {
		cartStore.addItem({
			organisationTypeCode: company.organisationTypeCode!,
			registrationNo: company.registrationNo,
			organisationName: company.organisationName,
			statusGroup: company.statusGroup,
			registrationDate: company.registrationDate,
		});
		suggestions.clear();
	};

	const header = { only: { to: "/", label: "Continue searching" } };
	const main = "mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-[clamp(28px,5vw,52px)] pb-[88px]";

	if (reports === 0) {
		return (
			<SitePage header={header} className={main}>
				<Rise className="mx-auto mt-[clamp(40px,10vw,100px)] max-w-[520px] text-center">
					<div className="mx-auto grid size-16 place-items-center rounded-[20px] bg-tint text-primary-text">
						<FileText className="size-[26px]" />
					</div>
					<h1 className="mt-[22px] mb-0 font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.03em]">
						Your cart is empty
					</h1>
					<p className="mt-2.5 mb-0 text-[15.5px] leading-[1.55] text-muted-foreground">
						Find a company and add its Full Company Report for {reportPrice()}.
					</p>
					<Link to="/" className={`${primaryPill} mt-6 px-[22px] py-[13px] text-[15px]`}>
						Search companies
					</Link>
				</Rise>
			</SitePage>
		);
	}

	return (
		<SitePage header={header} className={main}>
			<Rise>
				<div className={eyebrow}>Full Company Reports</div>
				<h1 className="mt-2.5 mb-0 font-display text-[clamp(34px,5vw,56px)] leading-[1.02] font-semibold tracking-[-0.035em]">
					Your cart
					<span className="ml-2.5 inline-grid h-[34px] min-w-[34px] place-items-center rounded-full bg-tint px-2.5 align-super text-[17px] leading-none font-semibold tracking-normal text-primary-text">
						{reports}
					</span>
				</h1>
			</Rise>

			<div className="mt-9 grid grid-cols-1 items-start gap-7 min-[860px]:grid-cols-[minmax(0,1fr)_380px]">
				<div className="flex min-w-0 flex-col gap-3.5">
					{items.map((item, i) => {
						const leaving = removing === idOf(item);
						const path = detailsPath(item);
						const meta = incorporated(item.registrationDate);
						return (
							<div
								key={idOf(item)}
								className="grid"
								style={{
									gridTemplateRows: leaving ? "0fr" : "1fr",
									opacity: leaving ? 0 : 1,
									transform: leaving ? "translateX(-24px) scale(.97)" : "none",
									marginBottom: leaving ? -14 : 0,
									transition:
										"grid-template-rows .45s cubic-bezier(.2,.8,.2,1) .12s, opacity .3s ease, transform .45s cubic-bezier(.34,1.56,.64,1), margin-bottom .45s cubic-bezier(.2,.8,.2,1) .12s",
								}}
							>
								<div className="min-h-0 overflow-hidden">
									<Reveal delay={i * 90} className="rounded-[24px] border border-border bg-surface">
										<div className="flex items-start gap-[18px] p-[clamp(18px,3vw,26px)]">
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
													{item.statusGroup && <StatusBadge organisation={item} />}
													<span className="font-mono text-[12.5px] text-muted-foreground">Reg No {item.registrationNo}</span>
												</div>
												<Link
													to={path ?? "#"}
													className="mt-2 block font-display text-[clamp(19px,2.4vw,23px)] leading-[1.2] font-semibold tracking-[-0.02em] text-ink hover:text-primary-text"
												>
													{item.organisationName}
												</Link>
												{meta && <div className="mt-1 text-[14px] text-muted-foreground">{meta}</div>}
											</div>
											<div className="flex flex-none flex-col items-end gap-1.5">
												{price && (
													<span className="font-display text-[20px] font-semibold tracking-[-0.02em]">{formatPrice(price)}</span>
												)}
												<button
													type="button"
													onClick={() => remove(item)}
													className="flex cursor-pointer items-center gap-[5px] py-1 text-[13.5px] text-muted-foreground hover:text-danger"
												>
													<Trash2 className="size-[13px]" strokeWidth={2.2} />
													Remove
												</button>
											</div>
										</div>
									</Reveal>
								</div>
							</div>
						);
					})}

					<div className="relative rounded-[24px] border-[1.5px] border-dashed border-border-strong bg-surface p-[clamp(16px,3vw,22px)]">
						<label className="flex items-center gap-3">
							<span className="grid size-11 flex-none place-items-center rounded-[13px] bg-tint text-primary-text">
								<Plus className="size-5" />
							</span>
							<input
								value={suggestions.text}
								onChange={(e) => suggestions.type(e.target.value)}
								placeholder="Add another company by name"
								aria-label="Add another company by name"
								className="h-11 min-w-0 flex-1 border-0 bg-transparent text-[15.5px] text-ink outline-none placeholder:text-faint"
							/>
						</label>
						{suggestions.items.length > 0 && (
							<div className="mt-2.5 flex flex-col border-t border-divider pt-1.5">
								{suggestions.items.map((company) => (
									<button
										key={company.id}
										type="button"
										onClick={() => add(company)}
										className="-mx-2.5 flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-3 text-left hover:bg-hover"
									>
										<span className="min-w-0 flex-1">
											<span className="block text-[15px] font-semibold text-ink">{company.organisationName}</span>
											<span className="mt-0.5 block font-mono text-[12px] text-muted-foreground">
												Reg No {company.registrationNo}
											</span>
										</span>
										<span className="text-[13.5px] font-semibold whitespace-nowrap text-primary-text">
											Add · {reportPrice()}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				<aside className="flex min-w-0 flex-col gap-3.5 min-[860px]:sticky min-[860px]:top-24">
					<Rise delay={60} className="rounded-[26px] bg-primary p-[clamp(22px,4vw,30px)] text-white">
						<div className="text-[13px] font-semibold tracking-[0.06em] text-on-primary-muted uppercase">Order summary</div>
						<div className="mt-[18px] flex flex-col gap-2.5 text-[14.5px] text-on-primary-soft">
							<div className="flex justify-between gap-3">
								<span>
									{reports === 1 ? "1 report" : `${reports} reports`}
									{price && ` × ${formatPrice(price)}`}
								</span>
								<span className="text-white">{price ? formatPrice(price, reports) : "—"}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span>VAT 19% included</span>
								<span className="text-white">{price ? formatVatIncluded(price, reports) : "—"}</span>
							</div>
						</div>
						<div className="my-5 h-px bg-white/[0.18]" />
						<div className="flex items-baseline justify-between gap-3">
							<span className="text-[15px] text-on-primary-soft">Total</span>
							<span className="font-display text-[46px] leading-none font-semibold tracking-[-0.035em]">
								{price ? formatPrice(price, reports) : "—"}
							</span>
						</div>
						<button
							type="button"
							disabled={pending}
							onClick={() => checkout.checkOut(items)}
							className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] bg-white p-4 text-[16px] font-semibold text-[#0A3B2C] transition-[background-color,opacity] duration-200 hover:bg-[#E6F2EC] disabled:cursor-default disabled:opacity-70"
						>
							{pending ? "Redirecting to Stripe…" : "Continue to checkout"}
							<span>→</span>
						</button>
						{state.status === "failed" && (
							<p role="alert" className="mt-3 mb-0 rounded-xl bg-white/10 px-3.5 py-2.5 text-center text-[14px]">
								{state.message}
							</p>
						)}
						<div className="mt-3.5 flex items-center justify-center gap-2 text-[13px] text-on-primary-muted">
							<Lock className="size-[13px]" strokeWidth={2.2} />
							Secure payment by Stripe · no account needed
						</div>
					</Rise>

					<Rise delay={130} className="rounded-[24px] border border-border bg-surface p-[clamp(20px,3.5vw,26px)]">
						<div className="font-display text-[17px] font-semibold">What happens next</div>
						<div className="mt-3.5 flex flex-col">
							{STEPS.map(([title, body], i) => {
								const last = i === STEPS.length - 1;
								return (
									<div key={title} className="flex gap-3.5">
										<div className="flex flex-none flex-col items-center">
											<span className="grid size-7 flex-none place-items-center rounded-full bg-tint text-[13px] font-bold text-primary-text">
												{i + 1}
											</span>
											<span className={`relative my-1.5 w-0.5 flex-1 overflow-hidden rounded-sm ${last ? "" : "bg-border"}`}>
												{!last && (
													<span
														className="csc-flow absolute top-0 left-0 h-2/5 w-full rounded-sm bg-[linear-gradient(180deg,rgba(52,167,122,0),#34A77A_70%,#9BE3C3)]"
														style={{ animationDelay: `${i * 1.2}s` }}
													/>
												)}
											</span>
										</div>
										<div className="pt-[3px] pb-[18px]">
											<div className="text-[14.5px] font-semibold">{title}</div>
											<div className="mt-0.5 text-[13.5px] leading-normal text-muted-foreground">{body}</div>
										</div>
									</div>
								);
							})}
						</div>
					</Rise>
				</aside>
			</div>
		</SitePage>
	);
});

export default Cart;
