import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { Check, X } from "lucide-react";
import { toggleTrack } from "@/app/actions";
import { APP } from "@/app/routes";
import { box, CompanyLink, Page, PageHeader, pill, roundButton, Spinner, textLink } from "@/app/ui";
import { auth } from "@/auth";
import { checkout, formatPrice, formatVatIncluded, returningSession } from "@/checkout";
import { useCartStore } from "@/context/CartStore";
import { tracking } from "@/tracking";

const centred = "mx-auto mt-5 max-w-[520px] text-center";
const centredTitle = "mt-[18px] mb-0 text-[26px] font-bold tracking-[-0.025em]";
const centredBody = "mt-2 mb-0 text-[14px] leading-normal text-muted-foreground";

/** The reports chosen, and the way to pay for them. */
const Contents = observer(({ canceled }: { canceled: boolean }) => {
	const cart = useCartStore();
	const email = auth.state.status === "signed-in" ? auth.state.profile.email : "your email";

	const { price, state } = checkout;
	const items = cart.cartItems;
	const reports = items.length;
	const pending = state.status === "pending";
	const total = price ? formatPrice(price, reports) : "—";

	if (reports === 0) {
		return (
			<Page>
				<div className="px-5 py-[60px] text-center">
					<div className="text-[20px] font-semibold">Your cart is empty</div>
					<p className="mt-1.5 mb-0 text-[14px] text-muted-foreground">Add a Full Company Report from any search result.</p>
					<Link to={APP.search} className={`${pill({ tone: "accent" })} mt-4`}>
						Search companies
					</Link>
				</div>
			</Page>
		);
	}

	return (
		<Page>
			<PageHeader title="Cart" subtitle={`Reports are delivered to ${email} within one business day.`} />

			{canceled && (
				<div className="mt-[22px] rounded-xl bg-warn-bg px-4 py-3 text-[13.5px] leading-normal text-warn-fg">
					Your payment was cancelled and nothing was charged. Your reports are still here.
				</div>
			)}

			<div className="mt-6 grid grid-cols-1 items-start gap-5 min-[1120px]:grid-cols-[minmax(0,1fr)_320px]">
				<div className="min-w-0">
					<div className={`${box} px-4`}>
						{items.map((item) => (
							<div
								key={`${item.organisationTypeCode}/${item.registrationNo}`}
								className="flex items-center gap-3 border-t border-divider py-3 first:border-t-0"
							>
								<div className="min-w-0 flex-1">
									<CompanyLink company={item} from="Cart" className="text-[14.5px] font-medium whitespace-normal" />
									<div className="mt-0.5 text-[12.5px] text-muted-foreground">
										<span className="app-mono text-[12px]">{item.registrationNo}</span> · Full Company Report
									</div>
								</div>
								{price && <span className="text-[14px]">{formatPrice(price)}</span>}
								<button type="button" aria-label="Remove" onClick={() => cart.removeItem(item, { announce: false })} className={roundButton}>
									<X className="size-2.5" strokeWidth={3} />
								</button>
							</div>
						))}
					</div>
					<Link to={APP.search} className="mt-3 inline-block cursor-pointer px-1 py-2 text-[13.5px] text-primary-text hover:opacity-80">
						Add another company…
					</Link>
				</div>

				<aside className="min-w-0 min-[1120px]:sticky min-[1120px]:top-6">
					<div className="rounded-[14px] bg-surface px-5 py-[18px] shadow-[0_0_0_1px_var(--border)]">
						<div className="flex justify-between gap-3 text-[14px]">
							<span className="text-muted-foreground">{reports === 1 ? "1 report" : `${reports} reports`}</span>
							<span>{total}</span>
						</div>
						<div className="mt-2 flex justify-between gap-3 text-[14px]">
							<span className="text-muted-foreground">VAT 19% included</span>
							<span>{price ? formatVatIncluded(price, reports) : "—"}</span>
						</div>
						<div className="my-3.5 h-px bg-divider" />
						<div className="flex items-baseline justify-between gap-3">
							<span className="text-[15px] font-semibold">Total</span>
							<span className="text-[24px] font-semibold tracking-[-0.02em]">{total}</span>
						</div>
						<button
							type="button"
							disabled={pending}
							onClick={() => checkout.checkOut(items)}
							className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-[14px] font-medium text-primary-foreground disabled:cursor-default min-[860px]:h-[38px]"
						>
							{pending && <Spinner onAccent />}
							{pending ? "Opening Stripe…" : price ? `Pay ${total}` : "Pay"}
						</button>
						{state.status === "failed" && (
							<p role="alert" className="mt-2.5 mb-0 text-center text-[13px] text-danger">
								{state.message}
							</p>
						)}
						<div className="mt-2.5 text-center text-[12px] text-muted-foreground">Secure payment by Stripe</div>
					</div>
				</aside>
			</div>
		</Page>
	);
});

/** Back from the payment page: what came of it, as the backend says. */
const Returned = observer(({ search }: { search: string }) => {
	const cart = useCartStore();
	const [session] = useState(() => returningSession(cart.clearCart));

	useEffect(() => {
		session.resolve(search);
		return () => session.dispose();
	}, [session, search]);

	const state = session.state;

	if (state.status === "paid") {
		const count = state.items.length;
		const one = count === 1;
		const email = state.buyerEmail ?? (auth.state.status === "signed-in" ? auth.state.profile.email : null);

		return (
			<Page>
				<div className={centred}>
					<div className="app-pop mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
						<Check className="size-6" strokeWidth={2.6} />
					</div>
					<h1 className={centredTitle}>Order confirmed</h1>
					<p className={centredBody}>
						We're preparing {one ? "your report" : `${count} reports`}. {one ? "It" : "They"} will arrive{" "}
						{email ? `at ${email}` : "by email"} within one business day.
					</p>
					{count > 0 && (
						<div className={`${box} mt-[22px] px-4 text-left`}>
							{state.items.map((item) => {
								const canTrack = item.organisationTypeCode !== null && tracking.availability(item) !== "tracked";
								return (
									<div
										key={`${item.organisationTypeCode}/${item.registrationNo}`}
										className="flex items-center gap-3 border-t border-divider py-[11px] first:border-t-0"
									>
										<div className="min-w-0 flex-1 text-[14px]">{item.organisationName}</div>
										<span className="text-[12.5px] whitespace-nowrap text-muted-foreground">In preparation</span>
										{canTrack && (
											<button type="button" onClick={() => toggleTrack(item)} className={textLink}>
												Track
											</button>
										)}
									</div>
								);
							})}
						</div>
					)}
					<div className="app-mono mt-3 text-[12px] text-faint">Your invoice is on its way by email</div>
					<div className="mt-5 flex justify-center gap-2">
						<Link to={APP.search} className={pill()}>
							Keep searching
						</Link>
						<Link to={APP.home} className={pill({ tone: "accent" })}>
							Done
						</Link>
					</div>
				</div>
			</Page>
		);
	}

	if (state.status === "confirming") {
		return (
			<Page>
				<div className={centred}>
					{!state.takingLong && (
						<div className="flex justify-center pt-5">
							<Spinner />
						</div>
					)}
					<h1 className={centredTitle}>{state.takingLong ? "Still confirming your payment" : "Confirming your payment…"}</h1>
					{state.takingLong && (
						<>
							<p className={centredBody}>Your payment is still being confirmed. Your invoice will follow by email.</p>
							<Link to={APP.home} className={`${pill()} mt-5`}>
								Done
							</Link>
						</>
					)}
				</div>
			</Page>
		);
	}

	return (
		<Page>
			<div className={centred}>
				<h1 className={centredTitle}>Something went wrong</h1>
				<p className={centredBody}>
					We couldn't determine your payment status. Please contact{" "}
					<a href="mailto:support@companysearchcyprus.com" className="text-primary-text">
						support@companysearchcyprus.com
					</a>{" "}
					if you need assistance.
				</p>
				<Link to={APP.cart} className={`${pill()} mt-5`}>
					Back to cart
				</Link>
			</div>
		</Page>
	);
});

/** The cart inside the app, and where a signed-in buyer comes back to from the payment page. */
const AppCart = () => {
	const [search] = useSearchParams();

	if (search.has("session_id")) return <Returned search={`?${search.toString()}`} />;
	return <Contents canceled={search.get("canceled") === "true"} />;
};

export default AppCart;
