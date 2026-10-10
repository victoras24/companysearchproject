import { Link } from "react-router";
import { SitePage } from "./SitePage";
import { primaryPill } from "./ui";

/** What an address that is no page of the site shows. */
export function NotFound() {
	return (
		<SitePage>
			<div className="mx-auto mt-[clamp(40px,10vw,100px)] max-w-[520px] text-center">
				<h1 className="m-0 font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.03em]">Page not found</h1>
				<p className="mt-2.5 mb-0 text-[15.5px] leading-[1.55] text-muted-foreground">
					The page you're looking for doesn't exist.
				</p>
				<Link to="/" className={`${primaryPill} mt-6 px-[22px] py-[13px] text-[15px]`}>
					Search companies
				</Link>
			</div>
		</SitePage>
	);
}
