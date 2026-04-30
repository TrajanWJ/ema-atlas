import { defineConfig } from "tsup";

export default defineConfig({
	entry: { main: "src/main.ts" },
	format: ["esm"],
	target: "node20",
	platform: "node",
	clean: true,
	shims: true,
	sourcemap: false,
	dts: false,
	splitting: false,
});
