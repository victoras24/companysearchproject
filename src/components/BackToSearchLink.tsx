import { Link, useLocation, useNavigate } from "react-router";

/**
 * Goes back in history when the user came from inside the app, which restores their search
 * from its URL; from a fresh tab or a shared link it opens the search page.
 */
export function BackToSearchLink() {
	const location = useLocation();
	const navigate = useNavigate();
	const cameFromApp = location.key !== "default";

	return (
		<Link
			to="/cyprus-company-search"
			onClick={(e) => {
				if (!cameFromApp) return;
				e.preventDefault();
				navigate(-1);
			}}
			className="inline-flex items-center gap-1.5 text-[14.5px] text-muted-foreground hover:text-ink"
		>
			← Back to search
		</Link>
	);
}
