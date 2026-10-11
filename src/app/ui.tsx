// The pieces the web app's screens share.

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusGroupOf, statusLabel } from "@/organisation/organisation";
import { statusDotClass } from "@/site/ui";
import { APP, companyPath, type Origin } from "./routes";

/** The app's easing: an iOS sheet's, with no bounce. */
export const EASE = "ease-[cubic-bezier(.32,.72,0,1)]";

/** A list or card container: white, rounded, outlined by a hairline. */
export const box = "rounded-xl bg-surface shadow-[0_0_0_1px_var(--border)]";

/** The label above a grouped list. */
export const sectionLabel = "mx-1 mt-[26px] mb-2 text-[12.5px] text-muted-foreground";

/** A text link or button, with room around it for a finger. */
export const textLink =
	"-mx-2 -my-3.5 cursor-pointer px-2 py-3.5 text-[13.5px] text-primary-text hover:opacity-80 disabled:cursor-default disabled:opacity-40";

/** A company's name in a row, with room above and below it for a finger. */
export const nameLink = "relative -my-3 block truncate py-3 text-foreground hover:opacity-80";

/** A row of a grouped list that can be pressed. */
export const pressRow = "app-row flex items-center gap-3 p-[11px] text-left text-foreground hover:bg-hover";

type PillOptions = {
	/** Grey for a secondary action, accent for the primary one, on for Saved, Tracking and In cart. */
	tone?: "grey" | "accent" | "on";
	/** Row actions are the smallest, a page's own actions a little larger. */
	size?: "row" | "page" | "standard";
};

/** A pill button. Each is taller on a phone, for a finger. */
export const pill = ({ tone = "grey", size = "standard" }: PillOptions = {}) =>
	[
		"inline-flex flex-none cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors duration-200 disabled:cursor-default disabled:opacity-40",
		size === "row"
			? "h-10 min-w-10 px-2 text-[13px] min-[860px]:h-7 min-[860px]:min-w-0 min-[860px]:px-[11px]"
			: size === "page"
				? "h-10 px-[13px] text-[13.5px] min-[860px]:h-[30px]"
				: "h-11 px-3.5 text-[13.5px] min-[860px]:h-8",
		tone === "accent"
			? "bg-primary text-primary-foreground"
			: tone === "on"
				? "bg-tint text-primary-text"
				: "bg-field text-foreground",
	].join(" ");

/** A small round button in a row: remove from a group, remove from the cart. */
export const roundButton =
	"grid size-9 flex-none cursor-pointer place-items-center rounded-full bg-field text-muted-foreground min-[860px]:size-6";

/** A popover menu and its items. */
export const menu =
	"z-50 max-h-[min(320px,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto rounded-[10px] bg-alert p-[5px] shadow-[0_0_0_1px_var(--border),0_12px_32px_-8px_rgba(0,0,0,0.25)] backdrop-blur-[20px]";
export const menuLabel = "px-[9px] pt-[5px] pb-[3px] text-[11.5px] font-semibold text-faint";
export const menuItem =
	"flex cursor-pointer items-center gap-2 rounded-md px-[9px] py-1.5 text-[13.5px] text-foreground outline-none select-none data-[highlighted]:bg-primary data-[highlighted]:text-white";
export const menuDangerItem =
	"flex cursor-pointer items-center gap-2 rounded-md px-[9px] py-1.5 text-[13.5px] text-danger outline-none select-none data-[highlighted]:bg-danger-tint";

/** A screen: its blocks fade and rise in, one after the other. */
export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <div className={`app-page ${className}`}>{children}</div>;
}

/** A screen's large title, the line under it, and what sits to its right. */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-3.5">
			<div className="min-w-0">
				<h1 className="m-0 text-[30px] leading-[1.1] font-bold tracking-[-0.025em]">{title}</h1>
				{subtitle && <p className="mt-1.5 mb-0 max-w-[660px] text-[15px] text-muted-foreground">{subtitle}</p>}
			</div>
			{children}
		</div>
	);
}

/** A status group as a coloured dot and its name: never a filled badge. */
export function Status({ organisation, large = false }: { organisation: { statusGroup?: string | null }; large?: boolean }) {
	return (
		<span className="inline-flex items-center gap-[5px] whitespace-nowrap">
			<span className={`flex-none rounded-full ${large ? "size-[7px]" : "size-1.5"} ${statusDotClass[statusGroupOf(organisation)]}`} />
			{statusLabel(organisation)}
		</span>
	);
}

/** How much of something is used. */
export function Bar({ part, className = "" }: { part: number; className?: string }) {
	return (
		<div className={`h-1 overflow-hidden rounded-sm bg-field ${className}`}>
			<div
				className={`h-full rounded-sm bg-primary transition-[width] duration-[900ms] ${EASE}`}
				style={{ width: `${Math.max(0, Math.min(1, part)) * 100}%` }}
			/>
		</div>
	);
}

/** An on-off switch. */
export function Switch({
	checked,
	onChange,
	disabled = false,
	label,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	label: string;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className="-my-[9px] flex-none cursor-pointer py-[9px] disabled:cursor-default"
		>
			<span className={`block h-[26px] w-11 rounded-[13px] p-0.5 transition-colors duration-[250ms] ${checked ? "bg-primary" : "bg-field"}`}>
				<span
					className={`block size-[22px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-[350ms] ${EASE}`}
					style={{ transform: checked ? "translateX(18px)" : "none" }}
				/>
			</span>
		</button>
	);
}

/** What opens and closes under a row: a group's companies, a tracked company's changes. */
export function Disclosure({ open, children, overflow = false }: { open: boolean; children: ReactNode; overflow?: boolean }) {
	return (
		<div
			className={`grid transition-[grid-template-rows] duration-[350ms] ${EASE}`}
			style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
		>
			<div className={`min-h-0 ${open && overflow ? "overflow-visible" : "overflow-hidden"}`} inert={!open}>
				<div className="transition-opacity duration-[250ms]" style={{ opacity: open ? 1 : 0 }}>
					{children}
				</div>
			</div>
		</div>
	);
}

/** A small turning circle beside something under way. */
export function Spinner({ onAccent = false }: { onAccent?: boolean }) {
	return (
		<span
			className={`size-[13px] flex-none animate-spin rounded-full border-[1.6px] ${
				onAccent ? "border-white/40 border-t-white" : "border-field border-t-muted-foreground"
			}`}
		/>
	);
}

/** A grey block where something is loading. */
export function Loading({ className = "h-32" }: { className?: string }) {
	return <div className={`animate-pulse rounded-xl bg-field ${className}`} />;
}

/** A centred card for a screen with nothing on it yet. */
export function EmptyCard({ title, children, className = "mt-5" }: { title: string; children?: ReactNode; className?: string }) {
	return (
		<div className={`${box} px-5 py-10 text-center ${className}`}>
			<div className="text-[17px] font-semibold">{title}</div>
			{children}
		</div>
	);
}

/** What went wrong, with a way to try again. */
export function Failed({ children, onRetry, className = "mt-5" }: { children: ReactNode; onRetry: () => void; className?: string }) {
	return (
		<div role="alert" className={`${box} px-5 py-10 text-center ${className}`}>
			<p className="m-0 text-[14px] text-muted-foreground">{children}</p>
			<button type="button" onClick={onRetry} className={`${pill()} mt-4`}>
				Try again
			</button>
		</div>
	);
}

/** The screen this one was opened from: the Overview, for one opened by its address. */
export function useOrigin(): Origin {
	const location = useLocation();
	return (location.state as { from?: Origin } | null)?.from ?? { to: APP.home, label: "Overview" };
}

/** The way back to the screen this one was opened from, named after it. */
export function BackLink({ from }: { from: Origin }) {
	return (
		<Link to={from.to} state={from.state} className={cn(textLink, "inline-flex max-w-full items-center gap-0.5 text-[14px]")}>
			<ChevronLeft className="size-[15px] flex-none" strokeWidth={2.2} />
			<span className="truncate">{from.label}</span>
		</Link>
	);
}

type Named = { organisationTypeCode?: string | null; registrationNo?: string | null; organisationName?: string | null };

/**
 * A company's name, opening its page in the app and telling that page where it came from. Just
 * the name where the registry has no page for it.
 */
export function CompanyLink({
	company,
	from,
	className = "",
	linked = true,
	origin,
	children,
}: {
	company: Named;
	/** The name of the screen this link is on, for the page's way back. */
	from: string;
	className?: string;
	linked?: boolean;
	/** The way back to give the page, where it is not this screen. */
	origin?: Origin;
	/** In place of the company's name. */
	children?: ReactNode;
}) {
	const location = useLocation();
	const path = linked ? companyPath(company) : null;
	const name = children ?? company.organisationName ?? company.registrationNo;

	if (!path) return <div className={cn("truncate", className)}>{name}</div>;

	// This screen's own state goes along, so coming back to it keeps its way back.
	const here: Origin = { to: location.pathname + location.search, label: from, state: location.state };
	return (
		<Link to={path} state={{ from: origin ?? here }} className={cn(nameLink, className)}>
			{name}
		</Link>
	);
}
