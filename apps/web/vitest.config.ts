import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		globals: true,
		passWithNoTests: true,
		exclude: [
			"node_modules",
			"dist",
			".claude/**",
			"tests/e2e/**",
			"tests/screenshots/**",
			"playwright-report/**",
			"test-results/**",
			"**/node_modules/**",
			"**/.claude/**",
		],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "."),
			"framer-motion": path.resolve(__dirname, "./__mocks__/framer-motion.tsx"),
		},
	},
});
