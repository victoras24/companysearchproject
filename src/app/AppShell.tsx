import { Suspense, useEffect, type ComponentType, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { Bookmark, CircleUserRound, Folder, Layers, LayoutGrid, Radio, Search, ShoppingBag } from "lucide-react";
import { auth } from "@/auth";
import { checkout } from "@/checkout";
import { useCartStore } from "@/context/CartStore";
import { library } from "@/library";
import { planLabel } from "@/plans";
import { ThemeToggle } from "@/site/ThemeToggle";
import { tracking } from "@/tracking";
import { newChangeCount } from "./changes";
import { DialogHost } from "./dialog";
import { APP } from "./routes";
import { Bar, Loading } from "./ui";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

const countPill =
	"grid h-[18px] min-w-[18px] place-items-center rounded-[9px] bg-primary px-[5px] text-[11px] font-semibold text-primary-foreground";

/** A screen in the sidebar. */
function SideItem({ to, end, icon: Icon, label, children }: { to: string; end?: boolean; icon: Icon; label: string; children?: ReactNode }) {
	return (
		<NavLink
			to={to}
			end={end}
			className={({ isActive }) =>
				`flex h-[30px] items-center gap-[9px] rounded-[7px] px-2.5 text-[13.5px] text-foreground ${isActive ? "bg-sel" : "hover:bg-hover"}`
			}
		>
			{({ isActive }) => (
				<>
					<Icon className={`size-4 flex-none ${isActive ? "text-primary-text" : "text-muted-foreground"}`} strokeWidth={1.8} />
					<span className="flex-1">{label}</span>
					{children}
				</>
			)}
		</NavLink>
	);
}

/** A screen in the phone's tab bar. */
function Tab({ to, active, icon: Icon, label, children }: { to: string; active: boolean; icon: Icon; label: string; children?: ReactNode }) {
	return (
		<Link
			to={to}
			aria-current={active ? "page" : undefined}
			className={`relative flex h-[50px] flex-col items-center justify-center gap-[3px] text-[10.5px] font-medium ${
				active ? "text-primary-text" : "text-faint"
			}`}
		>
			<Icon className="size-[22px]" strokeWidth={1.8} />
			{label}
			{children}
		</Link>
	);
}

const sideLabel = "flex-none px-2.5 pb-[5px] text-[11px] font-semibold text-faint";

/**
 * The web app around its screens: a sidebar on a wide screen, a top bar and a tab bar on a phone.
 * Nothing here leads back to the website. Only a signed-in user gets this far.
 */
const AppShell = observer(() => {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const cart = useCartStore();

	// The app's colours take the place of the website's while it is open, for everything on the
	// page: the dialogs, menus and toasts drawn outside the shell included.
	useEffect(() => {
		const root = document.documentElement;
		root.classList.add("app-theme");
		return () => root.classList.remove("app-theme");
	}, []);

	// First checks show as they finish, on every screen.
	useEffect(() => tracking.watch(), []);
	useEffect(() => checkout.loadPrice(), []);

	// "/" and ⌘K open the search, ready to type in.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const tag = (event.target as HTMLElement | null)?.tagName;
			const typing = tag === "INPUT" || tag === "TEXTAREA";
			const shortcut = (event.key === "/" && !typing) || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey));
			if (!shortcut) return;
			event.preventDefault();
			navigate(APP.search, { state: { focus: Date.now() } });
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [navigate]);

	if (auth.state.status !== "signed-in") return null;
	const profile = auth.state.profile;

	const newCount = newChangeCount();
	const used = Math.min(tracking.slotsUsed, tracking.slots);
	const on = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

	return (
		<div className="grid min-h-screen grid-cols-1 bg-background text-foreground min-[860px]:grid-cols-[260px_minmax(0,1fr)]">
			<aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-divider bg-side px-2.5 pt-4 pb-3.5 backdrop-blur-[20px] min-[860px]:flex">
				<Link to={APP.home} className="flex flex-none items-center gap-[9px] px-2 pt-0.5 pb-4 text-foreground">
					<img src="/logo.png" alt="" className="block size-[22px]" />
					<span className="text-[13.5px] font-semibold tracking-[-0.01em]">Company Search Cyprus</span>
				</Link>
				<Link
					to={APP.search}
					state={{ focus: 0 }}
					className="mx-0.5 mb-3.5 flex h-[30px] flex-none items-center gap-[7px] rounded-lg bg-field px-2 text-[13px] text-muted-foreground"
				>
					<Search className="size-[13px]" strokeWidth={2.2} />
					<span className="flex-1">Search</span>
					<span className="text-[11.5px] text-faint">⌘K</span>
				</Link>

				<div className={sideLabel}>Library</div>
				<nav className="flex flex-none flex-col gap-px">
					<SideItem to={APP.home} end icon={LayoutGrid} label="Overview" />
					<SideItem to={APP.saved} icon={Bookmark} label="Saved">
						<span className="text-[12.5px] text-muted-foreground">{library.favouriteCount}</span>
					</SideItem>
					<SideItem to={APP.groups} icon={Folder} label="Groups">
						<span className="text-[12.5px] text-muted-foreground">{library.groupCount}</span>
					</SideItem>
					<SideItem to={APP.tracking} icon={Radio} label="Tracking">
						{newCount > 0 && <span className={countPill}>{newCount}</span>}
					</SideItem>
				</nav>

				<div className={`${sideLabel} pt-[18px]`}>Account</div>
				<nav className="flex flex-none flex-col gap-px">
					<SideItem to={APP.plans} icon={Layers} label="Plans" />
					<SideItem to={APP.account} icon={CircleUserRound} label="Account" />
					{cart.itemCount > 0 && (
						<SideItem to={APP.cart} icon={ShoppingBag} label="Cart">
							<span className={countPill}>{cart.itemCount}</span>
						</SideItem>
					)}
				</nav>

				<div className="mt-auto flex flex-none flex-col gap-3.5 px-1.5 pt-[18px]">
					{tracking.status === "loaded" && (
						<Link to={APP.tracking} className="block px-1 text-foreground">
							<div className="flex justify-between gap-2 text-[12px]">
								<span className="font-semibold">{planLabel(tracking.plan)}</span>
								<span className="text-muted-foreground">
									{used} / {tracking.slots} tracked
								</span>
							</div>
							<Bar part={tracking.slots ? used / tracking.slots : 0} className="mt-[7px]" />
						</Link>
					)}
					<div className="flex items-center gap-2 border-t border-divider px-1 pt-2.5">
						<div className="min-w-0 flex-1">
							<div className="truncate text-[13px] font-medium">{profile.fullName || profile.email}</div>
							<div className="truncate text-[11.5px] text-muted-foreground">{profile.email}</div>
						</div>
						<ThemeToggle />
					</div>
				</div>
			</aside>

			<div className="flex min-w-0 flex-col">
				<header className="sticky top-0 z-20 flex items-center gap-2 border-b border-divider bg-bar px-3.5 py-2 backdrop-blur-[20px] backdrop-saturate-[180%] min-[860px]:hidden">
					<Link to={APP.home} className="-my-2.5 flex min-w-0 flex-1 items-center gap-2 py-2.5 text-foreground">
						<img src="/logo.png" alt="" className="block size-6" />
						<span className="truncate text-[15px] font-semibold">Company Search Cyprus</span>
					</Link>
					{cart.itemCount > 0 && (
						<Link to={APP.cart} className="inline-flex h-8 items-center rounded-full bg-tint px-2.5 text-[13px] font-semibold whitespace-nowrap text-primary-text">
							Cart · {cart.itemCount}
						</Link>
					)}
					<Link to={APP.search} state={{ focus: 0 }} aria-label="Search" className="grid size-10 flex-none place-items-center rounded-[10px] text-primary-text">
						<Search className="size-[19px]" strokeWidth={2} />
					</Link>
					<ThemeToggle />
				</header>

				<main className="mx-auto w-full max-w-[980px] px-[clamp(16px,4vw,40px)] pt-[clamp(22px,4vw,44px)] pb-[110px] min-[860px]:pb-[72px]">
					{/* The shell stays while a screen opened for the first time is loaded. */}
					<Suspense fallback={<Loading />}>
						<Outlet />
					</Suspense>
				</main>
			</div>

			<nav className="fixed inset-x-0 bottom-0 z-[25] grid grid-cols-5 border-t border-divider bg-bar px-1 pt-1 pb-[calc(4px+env(safe-area-inset-bottom))] backdrop-blur-[20px] backdrop-saturate-[180%] min-[860px]:hidden">
				<Tab to={APP.home} active={pathname === APP.home} icon={LayoutGrid} label="Overview" />
				<Tab to={APP.saved} active={on(APP.saved)} icon={Bookmark} label="Saved" />
				<Tab to={APP.groups} active={on(APP.groups)} icon={Folder} label="Groups" />
				<Tab to={APP.tracking} active={on(APP.tracking)} icon={Radio} label="Tracking">
					{newCount > 0 && (
						<span className="absolute top-[5px] left-[calc(50%+7px)] grid h-4 min-w-4 place-items-center rounded-lg bg-[#FF3B30] px-1 text-[10px] font-semibold text-white">
							{newCount}
						</span>
					)}
				</Tab>
				{/* The plans are reached from the account on a phone. */}
				<Tab to={APP.account} active={on(APP.account) || on(APP.plans)} icon={CircleUserRound} label="Account" />
			</nav>

			<DialogHost />
		</div>
	);
});

export default AppShell;
