import type { ComponentProps, ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

type Props = {
	children: ReactNode;
	header?: ComponentProps<typeof SiteHeader>;
	/** Classes for the main column, in place of the usual width and padding. */
	className?: string;
};

/** A website page: the header, the page's own content, and the footer line. */
export function SitePage({
	children,
	header,
	className = "mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-[clamp(24px,5vw,44px)] pb-[88px]",
}: Props) {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<SiteHeader {...header} />
			<main className={`flex-1 ${className}`}>{children}</main>
			<SiteFooter />
		</div>
	);
}
