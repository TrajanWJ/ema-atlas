import { defineConfig, devices } from "@playwright/test";

/**
 * EMA web E2E + visual config.
 *
 * Defaults to testing against the **static export** (apps/web/out/) served
 * over a tiny local HTTP server (scripts/serve-static.mjs:4174). This is
 * what ships in the Tauri .app. Testing against `next dev` (port 5173)
 * lies — it executes server code that doesn't exist in the .app.
 *
 * Override with EMA_E2E_BASE_URL=http://localhost:5173 to test against dev.
 */
export default defineConfig({
	testDir: "./tests/e2e",
	outputDir: "./tests/screenshots/_runs",
	snapshotDir: "./tests/screenshots/baseline",
	snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
	use: {
		baseURL: process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:4174",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		viewport: { width: 1280, height: 800 },
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	// Auto-start the static server unless the user opts out (e.g. when
	// they've already run it externally) or sets a custom URL.
	webServer:
		process.env.EMA_E2E_NO_WEBSERVER || process.env.EMA_E2E_BASE_URL
			? undefined
			: {
					command: "node scripts/serve-static.mjs --port 4174",
					url: "http://127.0.0.1:4174",
					reuseExistingServer: true,
					timeout: 30_000,
				},
});
