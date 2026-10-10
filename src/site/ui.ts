// Class names the website's pages share.

import type { StatusGroup } from "@/organisation/organisation";

/** The Track and Save buttons: an outlined pill, filled when it is on. */
export const actionPill = ({ compact = false, on = false }: { compact?: boolean; on?: boolean }) =>
	[
		"flex cursor-pointer items-center justify-center rounded-full border font-semibold transition-colors disabled:cursor-default disabled:opacity-50",
		compact ? "h-[38px] min-w-[38px] gap-1.5 px-3 text-[13.5px]" : "h-11 gap-2 px-[18px] text-[14.5px]",
		on
			? "border-primary-border bg-tint text-primary-text"
			: compact
				? "border-input bg-surface text-text2 hover:border-border-strong"
				: "border-input bg-surface text-ink hover:border-border-strong",
	].join(" ");

/** The "Add report" button on a row: tinted, filled once the report is in the cart. */
export const cartPill = (inCart: boolean) =>
	[
		"flex cursor-pointer items-center rounded-full border font-semibold whitespace-nowrap transition-colors",
		inCart
			? "border-primary-border bg-primary text-white"
			: "border-tint bg-tint text-primary-text hover:border-primary-border",
	].join(" ");

export const eyebrow = "text-[13px] font-semibold tracking-[0.06em] text-primary-text uppercase";

export const primaryPill =
	"inline-flex items-center justify-center rounded-full bg-primary font-semibold text-white transition-colors hover:bg-primary-hover";

/** A dot in each status group's colour: the same colours as the badges in components/ui/badge.tsx. */
export const statusDotClass: Record<StatusGroup, string> = {
	registered: "bg-green-700",
	"at-risk": "bg-amber-400",
	"in-liquidation": "bg-orange-600",
	dissolved: "bg-red-500",
	unknown: "bg-gray-500",
};
