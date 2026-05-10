import { expect, test } from "@playwright/test";

const PRIORITY_POPOUTS = [
	"cockpit",
	"agent-work",
	"settings",
	"terminal",
	"finder",
] as const;

test.describe("static install parity", () => {
	for (const appId of PRIORITY_POPOUTS) {
		test(`static popout route resolves for ${appId}`, async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.setItem("place-welcome-dismissed", "true");
			});
			const response = await page.goto(`/popout/${appId}?windowId=static-${appId}&companion=true&test=1`);
			expect(response?.status()).toBeLessThan(400);
			await page.waitForLoadState("domcontentloaded");
			await expect(page.locator("[data-tauri-drag-region]").first()).toBeVisible();
			await expect(page.getByRole("button", { name: "Return to desktop" })).toBeVisible();
		});
	}

	test("static cockpit renders honest fallback when API routes are unavailable", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("place-welcome-dismissed", "true");
		});
		await page.goto("/cockpit?test=1#/clients/client:ms-wilson/proslync-app-ios-final");
		await page.waitForLoadState("domcontentloaded");
		await expect(page.locator('[data-app="cockpit"]').first()).toBeVisible();
		await expect(page.getByText(/Ms\. Wilson|Proslync|Cockpit/i).first()).toBeVisible();
		await expect(page.getByText(/fake queue|would publish/i)).toHaveCount(0);
	});
});
