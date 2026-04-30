import { test, expect } from "@playwright/test";

/**
 * Place Tools folder — clicking the folder icon in the dock should open
 * a window with `[data-app="place-tools"]` rendering a 32-tile grid of
 * the place.org carry-over apps.
 *
 * Status (Wave II.G authoring): the `place-tools` vApp does not yet
 * exist (`apps/web/src/components/apps/place-tools/index.tsx` is on the
 * II.B work list). The dock also does not yet render a Place Tools
 * folder icon. The strict assertions stay skipped with TODO so this
 * file is the breadcrumb the orchestrator follows when II.B lands.
 *
 * What we DO verify today:
 *   - The dock toolbar mounts.
 *   - Once the `place-tools` vApp exists, `?vapp=place-tools&test=1`
 *     would reveal `[data-app="place-tools"]`. The skipped test below
 *     captures that contract.
 */

test("dock mounts (place-tools folder will be added in II.B)", async ({
	page,
}) => {
	await page.goto("/?test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1500);

	const dock = page.locator("[role='toolbar'][aria-label='Dock']");
	await expect(dock).toBeVisible();
});

test.skip("clicking Place Tools folder opens the place-tools vApp window", async ({
	page,
}) => {
	// TODO(II.B): when the dock renders a folder icon for Place Tools,
	// locate it (e.g. via aria-label="Place Tools" or
	// data-dock-app="place-tools") and click it. Then assert the
	// `[data-app="place-tools"]` surface is visible.
	await page.goto("/?test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1500);

	const folder = page.getByRole("button", { name: /place tools/i });
	await folder.click();

	const surface = page.locator("[data-app='place-tools']");
	await expect(surface).toBeVisible({ timeout: 5000 });
});

test.skip("Place Tools window renders a 32-tile grid", async ({ page }) => {
	// TODO(II.B): once `apps/web/src/components/apps/place-tools/index.tsx`
	// renders `getAppsByGroup("place-tools").map(...)` as 32 tiles with a
	// stable selector (e.g. `[data-place-tool-tile]`), enable this spec.
	await page.goto("/?vapp=place-tools&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1500);

	const tiles = page.locator(
		"[data-app='place-tools'] [data-place-tool-tile]",
	);
	expect(await tiles.count()).toBe(32);

	await page.screenshot({
		path: "tests/screenshots/current/place-tools-grid.png",
	});
});

test.skip("Place Tools window can be opened via ?vapp=place-tools", async ({
	page,
}) => {
	// TODO(II.B): once the place-tools app id is registered and routable.
	await page.goto("/?vapp=place-tools&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1500);

	await expect(page.locator("[data-app='place-tools']").first()).toBeVisible();
});
