import { Toaster } from "sonner";

export default function SonnerToastProvider() {
	return (
		<Toaster
			position="top-right"
			toastOptions={{
				style: {
					background: "hsl(var(--background))",
					color: "hsl(var(--foreground))",
					border: "1px solid hsl(var(--border))",
				},
				className: "shadow-md",
			}}
			closeButton
			richColors
		/>
	);
}
