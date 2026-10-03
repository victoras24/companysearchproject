import type { ReactNode } from "react";
import { NavLink } from "react-router";

/** A router link, or just its content when there is nowhere to go (e.g. no details path). */
export function OptionalLink({
	to,
	className,
	children,
}: {
	to: string | null;
	className?: string;
	children: ReactNode;
}) {
	if (to === null) return <div className={className}>{children}</div>;
	return (
		<NavLink to={to} className={className}>
			{children}
		</NavLink>
	);
}
