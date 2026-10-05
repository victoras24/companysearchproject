import { Badge } from "@/components/ui/badge";
import type { LibraryCompany } from "./Library";

/** Marks a saved organisation the registry no longer has; it has no details page to link to. */
export function RegistryNote({ company }: { company: LibraryCompany }) {
	if (company.inRegistry) return null;
	return (
		<Badge variant="outline" className="ml-2 font-normal text-muted-foreground">
			No longer in registry
		</Badge>
	);
}
