import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	server: {
		proxy: {
			"/api":
				"https://companysearchcyprus-cshzasdadrgdcjf4.westeurope-01.azurewebsites.net",
		},
	},
	plugins: [
		react({
			babel: {
				plugins: [
					["@babel/plugin-proposal-decorators", { version: "2023-11" }],
				],
			},
		}),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		minify: "esbuild",
		target: "esnext",
		sourcemap: false,
		cssCodeSplit: true,
		assetsInlineLimit: 4096,
		chunkSizeWarningLimit: 500,
		rollupOptions: {
			output: {
				// Libraries in files of their own, which change less often than the app and stay cached.
				manualChunks(id) {
					if (!id.includes("node_modules")) return;
					if (/node_modules\/(react|react-dom|scheduler|react-router)\//.test(id)) return "react";
					if (id.includes("node_modules/@supabase/")) return "supabase";
					if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return "motion";
				},
			},
		},
	},
	esbuild: {
		drop: ["console", "debugger"],
		minifyIdentifiers: true,
		minifySyntax: true,
		minifyWhitespace: true,
	},
});
