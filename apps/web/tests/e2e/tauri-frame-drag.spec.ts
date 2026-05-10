import { expect, test } from "@playwright/test";

test("Tauri shell exposes draggable chrome and no-drag controls", async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem("place-welcome-dismissed", "true");
		(window as unknown as Record<string, unknown>).__TAURI__ = {};
	});
	await page.goto("/?vapp=launchpad&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForFunction(
		() => document.documentElement.dataset.runtime === "tauri",
		null,
		{ timeout: 10_000 },
	);

	const ambientBar = page.locator(".ambient-bar").first();
	await expect(ambientBar).toBeVisible();
	await expect(ambientBar).toHaveAttribute("data-tauri-drag-region", /^(|true)$/);

	const dragRegion = await ambientBar.evaluate((element) =>
		window.getComputedStyle(element).getPropertyValue("-webkit-app-region"),
	);
	expect(dragRegion).toBe("drag");
	await expect(ambientBar).toHaveCSS("user-select", "none");

	const trafficLights = page.locator(".ema-traffic-lights").first();
	await expect(trafficLights).toBeVisible();
	const controlsRegion = await trafficLights.evaluate((element) =>
		window.getComputedStyle(element).getPropertyValue("-webkit-app-region"),
	);
	expect(controlsRegion).toBe("no-drag");
});
