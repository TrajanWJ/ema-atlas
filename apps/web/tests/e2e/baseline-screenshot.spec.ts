import { test, expect } from "@playwright/test";

/**
 * Baseline screenshot — captures the current state of the EMA shell at "/".
 * Used to compare before/after design revamps and for visual regression.
 *
 * Run: pnpm exec playwright test baseline-screenshot --update-snapshots
 * View: open playwright-report/index.html
 */
test("EMA shell — root", async ({ page }) => {
	await page.goto("/?test=1");
	await page.waitForLoadState("networkidle");
	// Give ambient motion + boot a moment to settle.
	await page.waitForTimeout(1200);
	await page.screenshot({
		path: "tests/screenshots/current/root.png",
		fullPage: false,
	});
	// Sanity assertion: SOMETHING in the boot/desktop tree mounted. The
	// outer wrapper from `(desktop)/page.tsx` always renders the
	// `relative h-dvh w-dvw` div even before boot completes.
	await expect(page.locator(".relative.h-dvh.w-dvw").first()).toBeVisible();
});
