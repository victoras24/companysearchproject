import { observer } from "mobx-react";
import { Bookmark } from "lucide-react";
import { actionPill } from "@/site/ui";
import { library, type SavableOrganisation } from "./index";
import { toggleSaved } from "./saveCompany";

type Props = {
	organisation: SavableOrganisation;
	/** For a search result: smaller, and an icon alone on a phone. */
	compact?: boolean;
};

/** Saves an organisation to the favourites, or takes it out. */
export const SaveButton = observer(({ organisation, compact = false }: Props) => {
	const saved = library.isSaved(organisation);

	return (
		<button
			type="button"
			title={saved ? "Remove from saved" : "Save company"}
			aria-label={compact ? (saved ? "Remove from saved" : "Save company") : undefined}
			disabled={library.isBusy(organisation)}
			onClick={(event) => {
				// In a search result the button sits inside the row that opens the organisation.
				event.preventDefault();
				event.stopPropagation();
				toggleSaved(organisation);
			}}
			className={actionPill({ compact, on: saved })}
		>
			<Bookmark className="size-4" fill={saved ? "currentColor" : "none"} />
			<span className={compact ? "hidden md:inline" : undefined}>{saved ? "Saved" : "Save"}</span>
		</button>
	);
});
