import { expect, test } from "@playwright/test";

test("companion popout shell has draggable titlebar and desktop return control", async ({ page }) => {
	await page.addInitScript(() => {
		(window as unknown as Record<string, unknown>).__TAURI__ = {};
	});
	await page.goto("/popout/cockpit?windowId=test-popout&companion=true");
	await page.waitForLoadState("networkidle");

	const titlebar = page.locator("[data-tauri-drag-region]").first();
	await expect(titlebar).toBeVisible();
	const dragRegion = await titlebar.evaluate((element) =>
		window.getComputedStyle(element).getPropertyValue("-webkit-app-region"),
	);
	expect(dragRegion).toBe("drag");

	const desktopButton = page.getByRole("button", { name: "Return to desktop" });
	await expect(desktopButton).toBeVisible();
	const buttonRegion = await desktopButton.evaluate((element) =>
		window.getComputedStyle(element).getPropertyValue("-webkit-app-region"),
	);
	expect(buttonRegion).toBe("no-drag");
});
