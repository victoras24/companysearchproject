import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import { auth } from "@/auth";
import { useCartStore } from "@/context/CartStore";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export type NavId = "search" | "app" | "reports" | "plans";

const NAV: Array<{ id: NavId; label: string }> = [
	{ id: "search", label: "Search" },
	{ id: "app", label: "Web app" },
	{ id: "reports", label: "Reports" },
	{ id: "plans", label: "Plans" },
];

/** Where the web app starts for a signed-in user. */
export const APP_HOME = "/favorites";

type Props = {
	/** The section of the home page this page belongs to, or the one in view on the home page. */
	current?: NavId | null;
	/** On the home page: scrolls to the section instead of following the link. */
	onNavigate?: (id: NavId) => void;
	/** In place of the navigation and account links, one way back: the cart, legal pages. */
	only?: { to: string; label: string };
};

const SPRING = "cubic-bezier(.34,1.56,.64,1)";

/** The website's sticky header. */
export const SiteHeader = observer(({ current = null, onNavigate, only }: Props) => {
	const cart = useCartStore();
	const [menuOpen, setMenuOpen] = useState(false);
	const [hovered, setHovered] = useState<NavId | null>(null);
	const [pressed, setPressed] = useState<NavId | null>(null);
	const [spots, setSpots] = useState<Partial<Record<NavId, { left: number; width: number }>>>({});
	const navRef = useRef<HTMLElement>(null);

	const signedIn = auth.state.status === "signed-in";
	const signedOut = auth.state.status === "signed-out";

	// Where each link sits, for the pill that slides behind them.
	useLayoutEffect(() => {
		const measure = () => {
			const next: typeof spots = {};
			navRef.current?.querySelectorAll<HTMLElement>("[data-nav]").forEach((link) => {
				next[link.dataset.nav as NavId] = { left: link.offsetLeft, width: link.offsetWidth };
			});
			setSpots(next);
		};
		measure();
		document.fonts?.ready.then(measure);
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, []);

	// The pill jumps to a clicked link at once, and lets go when the scroll has taken over.
	useEffect(() => {
		if (pressed === null) return;
		const timer = setTimeout(() => setPressed(null), 1400);
		return () => clearTimeout(timer);
	}, [pressed]);

	const active = pressed ?? current;
	const spot = spots[hovered ?? active ?? ("" as NavId)];

	const follow = (id: NavId) => (event: React.MouseEvent) => {
		setMenuOpen(false);
		if (!onNavigate) return;
		event.preventDefault();
		setPressed(id);
		onNavigate(id);
	};

	const cartPill = (shape: string) =>
		cart.itemCount > 0 && (
			<Link
				to="/cart"
				className={`inline-flex items-center gap-2 bg-tint font-semibold leading-none text-primary-text ${shape}`}
			>
				Cart
				<span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[12px] text-white">
					{cart.itemCount}
				</span>
			</Link>
		);

	return (
		<header className="sticky top-0 z-20 border-b border-border bg-[var(--header)] backdrop-blur-[14px]">
			<div className="mx-auto flex max-w-[1200px] items-center gap-2 px-[clamp(16px,4vw,28px)] py-3.5 md:gap-4">
				<Logo />

				{only ? (
					<Link to={only.to} className="ml-auto text-[14.5px] whitespace-nowrap text-text2 hover:text-ink">
						{only.label}
					</Link>
				) : (
					<>
						<nav
							ref={navRef}
							onMouseLeave={() => setHovered(null)}
							className="relative ml-1.5 hidden flex-1 gap-1 text-[14.5px] md:flex"
						>
							<span
								aria-hidden
								className="pointer-events-none absolute top-1/2 -mt-[17px] h-[34px] rounded-full bg-tint"
								style={{
									left: spot?.left ?? 0,
									width: spot?.width ?? 0,
									opacity: spot ? 1 : 0,
									transition: `left .5s ${SPRING}, width .5s ${SPRING}, opacity .3s ease`,
								}}
							/>
							{NAV.map(({ id, label }) => (
								<Link
									key={id}
									to={`/#${id}`}
									data-nav={id}
									onClick={follow(id)}
									onMouseEnter={() => setHovered(id)}
									className={`relative rounded-full px-3 py-2 transition-colors duration-200 ${
										active === id ? "font-semibold text-ink" : "text-text2"
									}`}
								>
									{label}
								</Link>
							))}
						</nav>

						<div className="ml-auto hidden items-center gap-2.5 md:flex">
							{cartPill("rounded-full px-3.5 py-2.5 text-[14.5px]")}
							{signedOut && (
								<>
									<Link to="/login" className="inline-flex items-center px-3.5 py-2.5 text-[14.5px] leading-none text-ink">
										Log in
									</Link>
									<Link
										to="/signup"
										className="inline-flex items-center rounded-full bg-primary px-[18px] py-2.5 text-[14.5px] leading-none font-semibold whitespace-nowrap text-white transition-colors hover:bg-primary-hover"
									>
										Create free account
									</Link>
								</>
							)}
							{signedIn && (
								<Link
									to={APP_HOME}
									className="inline-flex items-center rounded-full bg-primary px-[18px] py-2.5 text-[14.5px] leading-none font-semibold whitespace-nowrap text-white transition-colors hover:bg-primary-hover"
								>
									Open web app
								</Link>
							)}
						</div>

						<div className="ml-auto flex items-center md:hidden">
							{cartPill("h-11 rounded-xl px-3 text-[14px]")}
						</div>
					</>
				)}

				{/* A phone's header has no room for it beside the cart and the menu button: it is in the menu there. */}
				<ThemeToggle className={only ? "" : "max-md:hidden"} />

				{!only && (
					<button
						type="button"
						aria-label="Menu"
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
						className="flex size-11 flex-none cursor-pointer flex-col items-center justify-center gap-[5px] rounded-xl border border-border bg-transparent md:hidden"
					>
						<span
							className="h-[1.5px] w-4 bg-ink transition-transform duration-300"
							style={{ transform: menuOpen ? "translateY(3.25px) rotate(45deg)" : "none" }}
						/>
						<span
							className="h-[1.5px] w-4 bg-ink transition-transform duration-300"
							style={{ transform: menuOpen ? "translateY(-3.25px) rotate(-45deg)" : "none" }}
						/>
					</button>
				)}
			</div>

			{!only && (
				<div
					className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)] md:hidden"
					style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr" }}
				>
					<div className="min-h-0 overflow-hidden" inert={!menuOpen}>
						<div
							className="flex flex-col px-5 pt-1 pb-5 font-display text-[18px] font-medium transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
							style={{ opacity: menuOpen ? 1 : 0, transform: menuOpen ? "none" : "translateY(-8px)" }}
						>
							{NAV.map(({ id, label }) => (
								<Link key={id} to={`/#${id}`} onClick={follow(id)} className="border-b border-border py-3.5 text-ink">
									{label}
								</Link>
							))}
							<div className="flex items-center justify-between border-b border-border py-2.5 text-ink">
								Appearance
								<ThemeToggle />
							</div>
							<div className="mt-4 flex gap-2 font-sans text-[14px] font-semibold">
								{signedOut && (
									<>
										<Link
											to="/login"
											className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-border px-3.5 py-[11px] text-center leading-[1.2] text-ink"
										>
											Log in
										</Link>
										<Link
											to="/signup"
											className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-3.5 py-[11px] text-center leading-[1.2] text-white"
										>
											Create free account
										</Link>
									</>
								)}
								{signedIn && (
									<Link
										to={APP_HOME}
										className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-3.5 py-[11px] text-center leading-[1.2] text-white"
									>
										Open web app
									</Link>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</header>
	);
});
