import { useEffect, useState } from "react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import { Check, Mail, RefreshCw, X } from "lucide-react";
import { auth } from "@/auth";
import { returningSession } from "@/checkout";
import { useCartStore } from "@/context/CartStore";
import { Rise } from "@/site/motion";
import { SitePage } from "@/site/SitePage";
import { primaryPill } from "@/site/ui";

const title = "mt-6 mb-0 font-display text-[clamp(28px,4.4vw,42px)] leading-[1.08] font-semibold tracking-[-0.03em]";
const body = "mt-3 mb-0 text-[15.5px] leading-[1.55] text-pretty text-muted-foreground";
const outlinePill =
	"rounded-full border border-input bg-surface px-5 py-3 text-[15px] font-semibold text-ink hover:border-border-strong";

const ReturnForm = observer(() => {
	const cartStore = useCartStore();
	const [session] = useState(() => returningSession(cartStore.clearCart));

	useEffect(() => {
		session.resolve(window.location.search);
		return () => session.dispose();
	}, [session]);

	const state = session.state;
	const signedIn = auth.state.status === "signed-in";

	const page = (content: React.ReactNode) => (
		<SitePage
			header={{ only: { to: "/", label: "Continue searching" } }}
			className="mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-[clamp(28px,5vw,52px)] pb-[88px]"
		>
			<Rise className="mx-auto mt-[clamp(32px,8vw,80px)] max-w-[560px] text-center">{content}</Rise>
		</SitePage>
	);

	if (state.status === "confirming") {
		return page(
			state.takingLong ? (
				<>
					<div className="mx-auto grid size-[72px] place-items-center rounded-full bg-tint text-primary-text">
						<Mail className="size-[30px]" />
					</div>
					<h1 className={title}>Still confirming your payment</h1>
					<p className={body}>Your payment is still being confirmed. Your invoice will follow by email.</p>
					<div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
						<Link to="/" className={outlinePill}>
							Back to search
						</Link>
					</div>
				</>
			) : (
				<>
					<div className="mx-auto grid size-[72px] place-items-center rounded-full bg-tint text-primary-text">
						<RefreshCw className="size-[30px] animate-spin" />
					</div>
					<h1 className={title}>Confirming your payment…</h1>
				</>
			)
		);
	}

	if (state.status === "paid") {
		const one = state.items.length === 1;
		return page(
			<>
				<div className="csc-pop mx-auto grid size-[72px] place-items-center rounded-full bg-primary text-white">
					<Check className="size-[30px]" strokeWidth={2.6} />
				</div>
				<h1 className={title}>Order confirmed</h1>
				<p className={body}>
					We're preparing {one ? "your report" : `your ${state.items.length} reports`}. You'll receive{" "}
					{one ? "it" : "them"}{" "}
					{state.buyerEmail ? (
						<>
							at <span className="font-semibold break-all text-ink">{state.buyerEmail}</span>
						</>
					) : (
						"by email"
					)}{" "}
					within one business day.
				</p>
				{state.items.length > 0 && (
					<div className="mt-7 rounded-[22px] border border-border bg-surface px-[22px] py-1.5 text-left">
						{state.items.map((item, i) => (
							<div
								key={`${item.organisationTypeCode}/${item.registrationNo}`}
								className={`flex items-center gap-3.5 py-3.5 ${i ? "border-t border-divider" : ""}`}
							>
								<div className="min-w-0 flex-1 text-[15px] font-semibold">{item.organisationName}</div>
								<span className="rounded-full bg-tint px-2.5 py-[5px] text-[12.5px] font-semibold whitespace-nowrap text-primary-text">
									In preparation
								</span>
							</div>
						))}
					</div>
				)}
				<div className="mt-3.5 font-mono text-[13px] text-faint">Your invoice is on its way by email</div>
				<div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
					<Link to="/" className={outlinePill}>
						Back to search
					</Link>
					<Link to={signedIn ? "/tracking" : "/signup"} className={`${primaryPill} px-5 py-3 text-[15px]`}>
						{signedIn ? "Track these companies" : "Track these companies free"}
					</Link>
				</div>
			</>
		);
	}

	if (state.status === "canceled") {
		return page(
			<>
				<div className="mx-auto grid size-[72px] place-items-center rounded-full bg-danger-tint text-danger">
					<X className="size-[30px]" strokeWidth={2.6} />
				</div>
				<h1 className={title}>Payment canceled</h1>
				<p className={body}>
					Your payment was canceled and nothing was charged. Your reports are still in your cart, ready whenever
					you are.
				</p>
				<div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
					<Link to="/" className={outlinePill}>
						Back to search
					</Link>
					<Link to="/cart" className={`${primaryPill} px-5 py-3 text-[15px]`}>
						Back to cart
					</Link>
				</div>
			</>
		);
	}

	return page(
		<>
			<div className="mx-auto grid size-[72px] place-items-center rounded-full bg-tint text-primary-text">
				<RefreshCw className="size-[30px]" />
			</div>
			<h1 className={title}>Something went wrong</h1>
			<p className={body}>
				We couldn't determine your payment status. Please contact{" "}
				<a href="mailto:companysearchcy@gmail.com" className="font-semibold text-primary-text">
					companysearchcy@gmail.com
				</a>{" "}
				if you need assistance.
			</p>
			<div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
				<Link to="/" className={outlinePill}>
					Back to search
				</Link>
			</div>
		</>
	);
});

export default ReturnForm;
