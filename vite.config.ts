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
	},
});
