import { defineConfig } from "tsup";

export default defineConfig({
  entry: { bin: "src/bin.ts" },
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  shims: true,
  sourcemap: false,
  dts: false,
  splitting: false,
  banner: { js: "#!/usr/bin/env node" }
});
