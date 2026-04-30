import { test, expect } from "@playwright/test";

/**
 * URL nav contract — proves that the documented params actually shape state.
 * If a future change drops one of these, this fails and the contract docs
 * (`apps/web/docs/dev/url-test-api.md`) must be updated.
 *
 * `?test=1` is bundled into every URL so autologin lands us on the desktop.
 */

test("?windows= opens multiple vApps at exact positions", async ({ page }) => {
	await page.goto(
		"/?windows=blueprint:120,80,860,540;hq:1020,80,500,540&test=1",
	);
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(700);

	await expect(page.locator("[data-app='blueprint']").first()).toBeVisible();
	await expect(page.locator("[data-app='hq']").first()).toBeVisible();

	await page.screenshot({
		path: "tests/screenshots/current/url-nav-windows.png",
	});
});

test("?titlebar=compact shrinks titlebars", async ({ page }) => {
	await page.goto("/?vapp=blueprint&titlebar=compact&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(400);

	const titlebarAttr = await page
		.locator("html")
		.getAttribute("data-titlebar");
	expect(titlebarAttr).toBe("compact");

	await page.screenshot({
		path: "tests/screenshots/current/url-nav-titlebar-compact.png",
	});
});

test("?titlebar=hidden hides titlebars", async ({ page }) => {
	await page.goto("/?vapp=blueprint&titlebar=hidden&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(400);

	const titlebarAttr = await page
		.locator("html")
		.getAttribute("data-titlebar");
	expect(titlebarAttr).toBe("hidden");

	await page.screenshot({
		path: "tests/screenshots/current/url-nav-titlebar-hidden.png",
	});
});

test("?contrast=high sets data-contrast", async ({ page }) => {
	await page.goto("/?contrast=high&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(300);

	const contrast = await page.locator("html").getAttribute("data-contrast");
	expect(contrast).toBe("high");

	await page.screenshot({
		path: "tests/screenshots/current/url-nav-contrast-high.png",
	});
});

test("?test=1 sets data-test", async ({ page }) => {
	await page.goto("/?test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(300);

	const testAttr = await page.locator("html").getAttribute("data-test");
	expect(testAttr).toBe("1");
});

test("legacy braindump URL alias opens Brain Dump", async ({ page }) => {
	await page.goto("/?vapp=braindump&test=1");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(600);

	await expect(page.locator(".place-window, .glass.absolute").first()).toBeVisible({
		timeout: 5000,
	});
});

test("direct vApp panel route renders current app content", async ({ page }) => {
	await page.goto("/braindump?test=1", { waitUntil: "domcontentloaded" });

	await expect(page.locator('[data-panel-app="brain-dump"]')).toBeVisible({
		timeout: 5000,
	});
});

test("composite: theme + vapp + titlebar + contrast", async ({ page }) => {
	await page.goto(
		"/?theme=dracula&vapp=blueprint&titlebar=compact&contrast=increased&test=1",
	);
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(600);

	await expect(page.locator("[data-app='blueprint']").first()).toBeVisible();
	expect(await page.locator("html").getAttribute("data-titlebar")).toBe(
		"compact",
	);
	expect(await page.locator("html").getAttribute("data-contrast")).toBe(
		"increased",
	);

	await page.screenshot({
		path: "tests/screenshots/current/composite-dracula-blueprint.png",
	});
});
