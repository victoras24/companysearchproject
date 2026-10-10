import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	/** What is showing: the chosen theme, or the system's when the choice is "system". */
	resolvedTheme: "dark" | "light";
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: "system",
	resolvedTheme: "light",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const SYSTEM_DARK = "(prefers-color-scheme: dark)";

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "vite-ui-theme",
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(
		() => (localStorage.getItem(storageKey) as Theme) || defaultTheme
	);
	const [systemDark, setSystemDark] = useState(() => window.matchMedia(SYSTEM_DARK).matches);

	useEffect(() => {
		const query = window.matchMedia(SYSTEM_DARK);
		const follow = () => setSystemDark(query.matches);
		query.addEventListener("change", follow);
		return () => query.removeEventListener("change", follow);
	}, []);

	const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
		root.style.colorScheme = resolvedTheme;
	}, [resolvedTheme]);

	const value = {
		theme,
		resolvedTheme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey, theme);
			setTheme(theme);
		},
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
