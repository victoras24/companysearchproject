import { Link } from "react-router";

/** The mark and wordmark, linking home. */
export function Logo() {
	return (
		<Link to="/" className="flex min-w-0 items-center gap-2.5 text-ink">
			<img src="/logo.png" alt="" className="block size-[30px] flex-none" />
			<span className="truncate font-display text-[17px] font-semibold tracking-[-0.01em] max-[420px]:text-[15px]">
				Company Search Cyprus
			</span>
		</Link>
	);
}
