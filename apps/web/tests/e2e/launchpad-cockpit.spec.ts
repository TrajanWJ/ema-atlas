import { expect, test } from "@playwright/test";
import { waitForCockpitReady, waitForVappReady } from "../lib/vapp-readiness";

test("Launchpad exposes the Proslync client cockpit", async ({ page }) => {
	test.setTimeout(90_000);
	await page.addInitScript(() => {
		localStorage.setItem("place-welcome-dismissed", "true");
	});
	await page.goto("/?vapp=launchpad&test=1");

	await waitForVappReady(page, { appId: "launchpad" });
	await expect(page.locator('[data-app="launchpad"]').first()).toBeVisible();

	const cockpitTile = page
		.getByRole("button", { name: /Client Cockpit/i })
		.filter({ hasText: "Proslync builds" })
		.first();
	await expect(cockpitTile).toBeVisible();
	await expect(
		page.getByText("Proslync builds, lanes, queue, intentions, and surfaces."),
	).toBeVisible();

	await cockpitTile.click();
	await waitForCockpitReady(page);
	await expect(page.locator('[data-app="cockpit"]').first()).toBeVisible();
	await expect(page.getByText("proslync-app-ios-final").first()).toBeVisible({
		timeout: 45_000,
	});
});
