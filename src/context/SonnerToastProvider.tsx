import { Toaster } from "sonner";

/** The site's toasts: a dark pill at the bottom centre, in both themes. */
export default function SonnerToastProvider() {
	return (
		<Toaster
			position="bottom-center"
			theme="dark"
			style={
				{
					"--normal-bg": "#0f1f19",
					"--normal-text": "#ffffff",
					"--normal-border": "transparent",
					"--border-radius": "22px",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "!font-sans !text-[14px] !shadow-[0_20px_40px_-16px_rgba(15,31,25,0.5)] !py-3 !pl-[18px]",
					description: "!text-on-primary-soft",
					actionButton:
						"!bg-white !text-[#0a3b2c] !rounded-full !font-semibold !text-[13.5px] !h-[34px] !px-3.5",
				},
			}}
		/>
	);
}
