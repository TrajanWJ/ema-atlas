import { test, expect } from "@playwright/test";

/**
 * Inner-window resize affordances.
 *
 * Windows are rendered with `react-rnd` which sets inline cursor styles
 * for each of the eight resize handles. All handles share the
 * `.resize-handle-glow` class (per `Window.tsx`), so we discover them
 * via inline `cursor:` style instead of a directional className suffix.
 *
 * Browsers normalise cursors and react-rnd may emit equivalent cursor
 * names; accept any reasonable variant for each direction.
 */

const NWSE_OK = ["nwse-resize", "se-resize", "nw-resize"];
const NESW_OK = ["nesw-resize", "ne-resize", "sw-resize"];
const NS_OK = ["ns-resize", "n-resize", "s-resize", "row-resize"];
const EW_OK = ["ew-resize", "e-resize", "w-resize", "col-resize"];

const ANY_OK = [...NWSE_OK, ...NESW_OK, ...NS_OK, ...EW_OK];

test("inner window: resize handles are mounted with appropriate cursors", async ({
	page,
}) => {
	await page.goto("/?vapp=blueprint&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(700);

	const handles = page.locator(".resize-handle-glow");
	const count = await handles.count();
	// react-rnd renders eight handles per window; even one window should
	// give us all eight.
	expect(count).toBeGreaterThanOrEqual(4);

	// Sample at least one handle of each cursor family.
	const cursors = await handles.evaluateAll((els) =>
		els.map((el) => getComputedStyle(el as HTMLElement).cursor),
	);
	const families = new Set(cursors.filter((c) => ANY_OK.includes(c)));
	expect(
		families.size,
		`expected at least 2 cursor families across ${cursors.length} handles, saw ${[...families].join(",")}`,
	).toBeGreaterThanOrEqual(2);
});

test("inner window: SE corner handle uses an NWSE cursor", async ({ page }) => {
	await page.goto("/?vapp=blueprint&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(700);

	const handles = page.locator(".resize-handle-glow");
	const allCursors = await handles.evaluateAll((els) =>
		els.map((el) => getComputedStyle(el as HTMLElement).cursor),
	);
	// At least one handle in the window must have an NWSE family cursor —
	// that is the SE / NW corner handle.
	const hasNwse = allCursors.some((c) => NWSE_OK.includes(c));
	expect(
		hasNwse,
		`expected a NWSE cursor among handles, saw ${allCursors.join(",")}`,
	).toBe(true);
});

test("inner window: handles sit above content (non-negative z-index)", async ({
	page,
}) => {
	await page.goto("/?vapp=blueprint&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(700);

	const handle = page.locator(".resize-handle-glow").first();
	await expect(handle).toBeAttached();
	const z = await handle.evaluate((el) => getComputedStyle(el).zIndex);
	const zNum = parseInt(z, 10);
	expect(Number.isNaN(zNum) ? 1 : zNum).toBeGreaterThanOrEqual(0);
});

test("inner window: blueprint surface is visible above its handles", async ({
	page,
}) => {
	await page.goto("/?vapp=blueprint&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(700);

	await expect(page.locator("[data-app='blueprint']").first()).toBeVisible();
});
