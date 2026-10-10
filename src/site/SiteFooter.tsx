import { Link } from "react-router";
import { Reveal } from "./motion";

const year = new Date().getFullYear();

/** The line every website page ends with. */
export function SiteFooter() {
	return (
		<footer className="border-t border-border bg-surface">
			<div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-x-6 gap-y-3 px-[clamp(16px,4vw,28px)] py-7 text-[13.5px] text-muted-foreground">
				<span>© {year} Company Search Cyprus · Data sourced from the official Cyprus government registry</span>
				<div className="flex flex-wrap gap-5">
					<Link to="/blog" className="hover:text-ink">Blog</Link>
					<Link to="/legal-disclaimer" className="hover:text-ink">Disclaimer</Link>
					<Link to="/terms" className="hover:text-ink">Terms</Link>
				</div>
			</div>
		</footer>
	);
}

const column = "flex flex-col gap-2.5";
const heading = "text-[13px] font-semibold text-ink";
const link = "text-[14px] text-muted-foreground hover:text-ink";

/** The home page's footer, with every part of the site in it. */
export function HomeFooter() {
	return (
		<footer className="border-t border-border bg-surface">
			<Reveal className="mx-auto max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-14 pb-7">
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-9">
					<div className="flex min-w-0 flex-col gap-3 sm:col-span-2">
						<div className="flex items-center gap-2.5">
							<img src="/logo.png" alt="" className="block size-[26px]" />
							<span className="font-display text-[16px] font-semibold">Company Search Cyprus</span>
						</div>
						<p className="m-0 max-w-[300px] text-[14px] leading-[1.55] text-muted-foreground">
							Cyprus company intelligence and business research.
						</p>
						<a href="mailto:companysearchcy@gmail.com" className="text-[14px] text-primary-text hover:text-deep">
							companysearchcy@gmail.com
						</a>
					</div>
					<div className={column}>
						<div className={heading}>Website</div>
						<Link to="/#search" className={link}>Company search</Link>
						<Link to="/#reports" className={link}>Reports</Link>
						<Link to="/#plans" className={link}>Plans</Link>
						<Link to="/blog" className={link}>Blog</Link>
					</div>
					<div className={column}>
						<div className={heading}>Web app</div>
						<Link to="/login" className={link}>Log in</Link>
						<Link to="/favorites" className={link}>Favourites</Link>
						<Link to="/organiser" className={link}>Organiser</Link>
						<Link to="/tracking" className={link}>Tracking</Link>
					</div>
					<div className={column}>
						<div className={heading}>Legal</div>
						<Link to="/legal-disclaimer" className={link}>Disclaimer</Link>
						<Link to="/terms" className={link}>Terms</Link>
					</div>
				</div>
				<div className="mt-11 flex flex-wrap justify-between gap-3 border-t border-divider pt-5 text-[13px] text-muted-foreground">
					<span>© {year} Company Search Cyprus</span>
					<span>Data sourced from the official Cyprus government registry</span>
				</div>
			</Reveal>
		</footer>
	);
}
