import { expect, test } from "@playwright/test";

test("Settings exposes EMA runtime tracks", async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem("place-welcome-dismissed", "true");
	});
	await page.goto("/settings?test=1");
	await page.waitForLoadState("networkidle");
	await expect(page.locator('[data-app="settings"]').first()).toBeVisible();
	await page.getByRole("button", { name: /Daemon/i }).click();
	await expect(page.getByText("S1 · Runtime Control Plane")).toBeVisible();
	await expect(page.getByText("S2 · Static/Tauri Parity")).toBeVisible();
	await expect(page.getByText("S3 · Settings System Center")).toBeVisible();
	await expect(page.getByText("S4 · Projection/API Health")).toBeVisible();
	await expect(page.getByText("S5 · Artifact Hygiene")).toBeVisible();
});
