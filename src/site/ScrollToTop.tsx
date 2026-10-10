import { useEffect } from "react";
import { useLocation } from "react-router";

/** A new page starts at its top. A change of query or hash on the same page leaves the scroll alone. */
export function ScrollToTop() {
	const { pathname } = useLocation();
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);
	return null;
}
