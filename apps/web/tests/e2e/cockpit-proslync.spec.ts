import { expect, test } from "@playwright/test";

test("Proslync cockpit shows workspace, builds, surfaces, and intentions", async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem("place-welcome-dismissed", "true");
	});
	await page.goto(
		"/?vapp=cockpit&test=1#/clients/client:ms-wilson/proslync-app-ios-final",
	);
	await page.waitForLoadState("networkidle");
	await expect(page.locator('[data-app="cockpit"]').first()).toBeVisible();
	await expect(page.getByText("proslync-app-ios-final").first()).toBeVisible();
	await expect(page.getByText("Proslync ready").first()).toBeVisible();
	await expect(page.getByRole("button", { name: /Intentions/i })).toBeVisible();

	await page.getByRole("button", { name: /Intentions/i }).click();
	await expect(page.getByText(/lost follow-ups/i).first()).toBeVisible();
	await expect(page.getByText(/ema intention backfeed/).first()).toBeVisible();
	await expect(page.getByRole("button", { name: "Accept" }).first()).toBeVisible();

	await page.getByRole("button", { name: /Builds/i }).click();
	await expect(page.getByText("Proslync iOS app").first()).toBeVisible();
	await expect(page.getByText("Proslync backend").first()).toBeVisible();

	await page.getByRole("button", { name: /Surfaces/i }).click();
	await expect(page.getByText("AD cockpit").first()).toBeVisible();
	await expect(page.getByText("Brand HQ").first()).toBeVisible();
});
