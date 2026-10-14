import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check } from "lucide-react";
import { box, Spinner, Switch } from "@/app/ui";
import { confirmLabel, type LibraryGroup, type SectorProposal } from "@/library";
import type { Sector } from "@/organisation/sector";

/**
 * Reviews the sector groups proposed for the saved companies: every one starts ticked, and
 * sectors with one company are skipped unless the user says otherwise. `onApply` gets the ticked
 * ones; the dialog stays open, showing it is under way, until it finishes.
 */
export function SectorGroupsDialog({
	trigger,
	open,
	onOpenChange,
	proposals,
	unsectored,
	groups,
	onApply,
}: {
	trigger: ReactNode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	proposals: SectorProposal[];
	unsectored: number;
	groups: LibraryGroup[];
	onApply: (chosen: SectorProposal[]) => Promise<void>;
}) {
	const [unticked, setUnticked] = useState<ReadonlySet<Sector>>(new Set());
	const [skipSingles, setSkipSingles] = useState(true);
	const [running, setRunning] = useState(false);

	const changeOpen = (next: boolean) => {
		if (running) return;
		// Each time it opens, everything starts ticked again.
		if (next) {
			setUnticked(new Set());
			setSkipSingles(true);
		}
		onOpenChange(next);
	};

	const skipped = (p: SectorProposal) => skipSingles && p.companies.length === 1;
	const chosen = proposals.filter((p) => !skipped(p) && !unticked.has(p.letter));
	const creating = chosen.filter((p) => p.existingGroupId === null).length;
	const updating = chosen.length - creating;

	const toggle = (letter: Sector) =>
		setUnticked((before) => {
			const after = new Set(before);
			if (!after.delete(letter)) after.add(letter);
			return after;
		});

	const apply = async () => {
		if (chosen.length === 0 || running) return;
		setRunning(true);
		try {
			await onApply(chosen);
		} finally {
			setRunning(false);
		}
	};

	return (
		<DialogPrimitive.Root open={open} onOpenChange={changeOpen}>
			<DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="app-dialog-overlay fixed inset-0 z-50 bg-black/[0.28]" />
				<DialogPrimitive.Content className="app-dialog fixed top-1/2 left-1/2 z-50 w-[min(440px,calc(100%-40px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-alert text-left shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35)] backdrop-blur-[30px] outline-none">
					<div className="px-[18px] pt-[18px] pb-2.5">
						<DialogPrimitive.Title className="m-0 text-[16px] leading-tight font-semibold">
							Group saved companies by sector
						</DialogPrimitive.Title>
						<DialogPrimitive.Description className="mt-1.5 mb-0 text-[13px] leading-[1.45] text-text2">
							One group per sector, using the activity CYSTAT lists for each company. Untick any you don't want.
						</DialogPrimitive.Description>
					</div>

					<div className={`mx-2.5 ${box} app-rows max-h-[320px] overflow-y-auto py-1`}>
						{proposals.map((proposal) => {
							const disabled = skipped(proposal);
							const ticked = !disabled && !unticked.has(proposal.letter);
							const existing = groups.find((g) => g.id === proposal.existingGroupId);
							return (
								<button
									key={proposal.letter}
									type="button"
									role="checkbox"
									aria-checked={ticked}
									disabled={disabled || running}
									onClick={() => toggle(proposal.letter)}
									className={`app-row flex w-full cursor-pointer items-start gap-[11px] px-2.5 py-[9px] text-left text-foreground hover:bg-hover disabled:cursor-default ${
										disabled ? "opacity-45" : ""
									}`}
								>
									<span
										className={`mt-px grid size-[18px] flex-none place-items-center rounded-[5px] ${
											ticked ? "bg-primary text-white" : "bg-surface shadow-[inset_0_0_0_1.5px_var(--border-strong)]"
										}`}
									>
										{ticked && <Check className="size-3" strokeWidth={3} />}
									</span>
									<span className="min-w-0 flex-1">
										<span className="flex items-baseline gap-1.5">
											<span className="text-[14px] font-medium">{proposal.name}</span>
											<span className="app-mono text-[11.5px] text-faint">{proposal.letter}</span>
										</span>
										<span className="block truncate text-[12px] text-muted-foreground">
											{proposal.companies.map((c) => c.organisationName ?? c.registrationNo).join(", ")}
										</span>
										{proposal.existingGroupId !== null && (
											<span className="block text-[12px] text-primary-text">
												Adds {proposal.toAdd.length} to your existing "{existing?.name.trim() ?? proposal.name}" group
											</span>
										)}
									</span>
									<span className="text-[12.5px] text-muted-foreground tabular-nums">{proposal.companies.length}</span>
								</button>
							);
						})}
					</div>

					<div className="flex items-center justify-between px-[18px] pt-3 pb-1">
						<span className="text-[13.5px]">Skip sectors with one company</span>
						<Switch checked={skipSingles} onChange={setSkipSingles} disabled={running} label="Skip sectors with one company" />
					</div>

					<div className="px-[18px] pt-1 pb-3.5 text-[12px] text-muted-foreground">
						{unsectored > 0 &&
							(unsectored === 1
								? "1 company has no sector listed and stays ungrouped."
								: `${unsectored} companies have no sector listed and stay ungrouped.`)}
					</div>

					<div className="grid grid-cols-[1fr_1px_1fr] border-t border-divider">
						<DialogPrimitive.Close
							disabled={running}
							className="h-11 cursor-pointer text-[15px] text-primary-text hover:bg-hover disabled:cursor-default disabled:opacity-40"
						>
							Cancel
						</DialogPrimitive.Close>
						<span className="bg-divider" />
						<button
							type="button"
							onClick={apply}
							disabled={chosen.length === 0 || running}
							className={`flex h-11 cursor-pointer items-center justify-center gap-2 text-[15px] font-semibold text-primary-text hover:bg-hover disabled:cursor-default ${
								chosen.length === 0 ? "opacity-40" : ""
							}`}
						>
							{running ? (
								<>
									<Spinner /> Creating…
								</>
							) : (
								confirmLabel(creating, updating)
							)}
						</button>
					</div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
