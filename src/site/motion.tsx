import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** The site's entrance easing. */
export const EASE = [0.2, 0.8, 0.2, 1] as const;

type Props = {
	children: ReactNode;
	className?: string;
	/** Milliseconds to wait before it moves. */
	delay?: number;
	id?: string;
};

/** Fades and rises in, once, when it scrolls into view. */
export function Reveal({ children, className, delay = 0, id }: Props) {
	const still = useReducedMotion();
	if (still) return <div id={id} className={className}>{children}</div>;

	return (
		<motion.div
			id={id}
			className={className}
			initial={{ opacity: 0, y: 36, scale: 0.985 }}
			whileInView={{ opacity: 1, y: 0, scale: 1 }}
			viewport={{ once: true, amount: 0.12, margin: "0px 0px -8% 0px" }}
			transition={{
				opacity: { duration: 0.9, ease: EASE, delay: delay / 1000 },
				default: { duration: 1.1, ease: EASE, delay: delay / 1000 },
			}}
		>
			{children}
		</motion.div>
	);
}

/** Fades and rises in when it mounts: a page's blocks on load, and a panel when its tab is chosen. */
export function Rise({ children, className, delay = 0, distance = 22 }: Props & { distance?: number }) {
	const still = useReducedMotion();
	if (still) return <div className={className}>{children}</div>;

	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, y: distance, scale: 0.99 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				opacity: { duration: 0.8, ease: EASE, delay: delay / 1000 },
				default: { duration: 1, ease: EASE, delay: delay / 1000 },
			}}
		>
			{children}
		</motion.div>
	);
}
