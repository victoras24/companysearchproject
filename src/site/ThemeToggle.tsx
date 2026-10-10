import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

/** Switches between light and dark. Until it is used the site follows the system. */
export function ThemeToggle({ className = "" }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const dark = resolvedTheme === "dark";

	return (
		<button
			type="button"
			aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
			onClick={() => setTheme(dark ? "light" : "dark")}
			className={`grid size-10 flex-none cursor-pointer place-items-center rounded-xl border border-border bg-transparent text-text2 transition-[background-color,color,transform] duration-200 hover:bg-hover active:scale-90 active:-rotate-[30deg] ${className}`}
		>
			{dark ? <Sun className="size-[17px]" /> : <Moon className="size-[17px]" />}
		</button>
	);
}
