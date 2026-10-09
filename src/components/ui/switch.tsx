import * as React from "react";

import { cn } from "@/lib/utils";

type SwitchProps = Omit<React.ComponentProps<"button">, "onChange" | "role" | "type"> & {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
};

/** An on/off switch. Give it an aria-label or aria-labelledby. */
function Switch({ className, checked, onCheckedChange, ...props }: SwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			data-slot="switch"
			data-state={checked ? "checked" : "unchecked"}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				"peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
				className
			)}
			{...props}
		>
			<span
				data-slot="switch-thumb"
				className={cn(
					"bg-background pointer-events-none block size-5 rounded-full transition-transform",
					checked ? "translate-x-[calc(100%+1px)]" : "translate-x-px"
				)}
			/>
		</button>
	);
}

export { Switch };
