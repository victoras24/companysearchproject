import { Badge } from "@/components/ui/badge";
import { statusGroupOf, statusLabel } from "@/organisation/organisation";

/** An organisation's status group, in the colours every page uses for it. */
export function StatusBadge({
	organisation,
	large = false,
}: {
	organisation: { statusGroup?: string | null };
	large?: boolean;
}) {
	return (
		<Badge
			variant={statusGroupOf(organisation)}
			className={
				large
					? "rounded-[7px] border-0 px-2.5 py-1 text-[12.5px] font-semibold"
					: "rounded-[6px] border-0 px-2 py-[3px] text-[11.5px] font-semibold"
			}
		>
			{statusLabel(organisation)}
		</Badge>
	);
}
