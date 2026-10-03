import { ArrowLeft } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router";

/**
 * Goes back in history when the user came from inside the app, which restores their search
 * from its URL; from a fresh tab or a shared link it opens the search page.
 */
export function BackToSearchLink() {
	const location = useLocation();
	const navigate = useNavigate();
	const cameFromApp = location.key !== "default";

	return (
		<NavLink
			to="/cyprus-company-search"
			onClick={(e) => {
				if (!cameFromApp) return;
				e.preventDefault();
				navigate(-1);
			}}
			className="inline-flex mb-3 items-center gap-2 px-3 py-2 text-sm font-semibold text-green-700 bg-green-200 hover:bg-green-100 rounded-lg transition-colors duration-200 group border border-green-200 w-fit"
		>
			<ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
			<span>Back to search</span>
		</NavLink>
	);
}
