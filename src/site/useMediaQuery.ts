import { useEffect, useState } from "react";

/** Whether a media query matches, kept up to date. */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

	useEffect(() => {
		const list = window.matchMedia(query);
		const follow = () => setMatches(list.matches);
		follow();
		list.addEventListener("change", follow);
		return () => list.removeEventListener("change", follow);
	}, [query]);

	return matches;
}
