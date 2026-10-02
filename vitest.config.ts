import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	esbuild: {
		// Lowers the 2023-11 decorators (`@observable accessor`) used by the models.
		target: "es2022",
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
