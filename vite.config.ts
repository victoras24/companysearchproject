import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	server: {
		proxy: {
			"/api": "http://localhost:5066",
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
});
