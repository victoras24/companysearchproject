import { useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { action, observable } from "mobx";
import { observer } from "mobx-react";

export type Question = {
	title: string;
	body: string;
	/** What the button that goes ahead says. */
	confirm: string;
	/** Going ahead removes or ends something. */
	danger?: boolean;
};

type Asked = Question & { onConfirm: () => void };

const asked = observable.box<Asked | null>(null, { deep: false });

/** Asks the user before something that is final or costs them: the app's one alert. */
export const ask = action((question: Question, onConfirm: () => void) => {
	asked.set({ ...question, onConfirm });
});

const close = action(() => asked.set(null));

/** Shows what was asked. The app's shell holds the one there is. */
export const DialogHost = observer(() => {
	const current = asked.get();
	// What it said stays while it closes.
	const shown = useRef<Asked | null>(null);
	if (current) shown.current = current;
	const question = shown.current;

	const confirm = () => {
		close();
		current?.onConfirm();
	};

	return (
		<DialogPrimitive.Root open={current !== null} onOpenChange={(open) => !open && close()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="app-dialog-overlay fixed inset-0 z-50 bg-black/[0.28]" />
				<DialogPrimitive.Content
					role="alertdialog"
					className="app-dialog fixed top-1/2 left-1/2 z-50 w-[min(300px,calc(100%-40px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-alert text-center shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35)] backdrop-blur-[30px] outline-none"
				>
					<div className="px-[18px] pt-5 pb-[18px]">
						<DialogPrimitive.Title className="m-0 text-[16px] leading-tight font-semibold text-balance">
							{question?.title}
						</DialogPrimitive.Title>
						<DialogPrimitive.Description className="mt-1.5 mb-0 text-[13px] leading-[1.45] text-text2">
							{question?.body}
						</DialogPrimitive.Description>
					</div>
					<div className="grid grid-cols-[1fr_1px_1fr] border-t border-divider">
						<button type="button" onClick={close} className="h-11 cursor-pointer text-[15px] text-primary-text hover:bg-hover">
							Cancel
						</button>
						<span className="bg-divider" />
						<button
							type="button"
							onClick={confirm}
							className={`h-11 cursor-pointer text-[15px] font-semibold hover:bg-hover ${question?.danger ? "text-danger" : "text-primary-text"}`}
						>
							{question?.confirm}
						</button>
					</div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
});
