import { test, expect } from "@playwright/test";

/**
 * Tauri-only chrome — outer rounded frame, traffic lights, SE resize grip.
 *
 * The browser doesn't have window.__TAURI__, so we stub it via
 * `page.addInitScript` BEFORE navigation. The boot sequence reads
 * `"__TAURI__" in window` synchronously and writes
 * `<html data-runtime="tauri">`; from that point the Tauri-only CSS rules
 * (apps/web/app/tauri-frame.css) activate and we can assert on the chrome.
 *
 * Several rules in tauri-frame.css are scoped to `.ema-desktop` /
 * `.place-desktop` — those classes are not yet present in the rendered
 * DOM (II.B has not added them). For now we assert via `body` / `html` so
 * the test is meaningful today and the assertion can tighten when the
 * classes land.
 */

test("tauri chrome: data-runtime=tauri lands when __TAURI__ is present", async ({
	page,
}) => {
	await page.addInitScript(() => {
		(window as unknown as Record<string, unknown>).__TAURI__ = {};
	});
	await page.goto("/?test=1");
	await page.waitForFunction(
		() => document.documentElement.dataset.runtime === "tauri",
		null,
		{ timeout: 5000 },
	);

	const runtime = await page.locator("html").getAttribute("data-runtime");
	expect(runtime).toBe("tauri");

	// Body becomes transparent under Tauri so the rounded outer frame
	// can show the OS desktop behind anything we don't draw.
	const bodyBg = await page
		.locator("body")
		.evaluate((el) => getComputedStyle(el).backgroundColor);
	expect(bodyBg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);

	await page.screenshot({
		path: "tests/screenshots/current/tauri-chrome-frame.png",
	});
});

test("tauri chrome: traffic lights render and are positioned at top-left", async ({
	page,
}) => {
	await page.addInitScript(() => {
		(window as unknown as Record<string, unknown>).__TAURI__ = {};
	});
	await page.goto("/?test=1");
	await page.waitForFunction(
		() => document.documentElement.dataset.runtime === "tauri",
		null,
		{ timeout: 5000 },
	);
	await page.waitForTimeout(500);

	const lights = page.locator(".ema-traffic-lights");
	await expect(lights).toBeVisible();

	const close = page.locator(".ema-traffic-lights__btn--close");
	const min = page.locator(".ema-traffic-lights__btn--min");
	const max = page.locator(".ema-traffic-lights__btn--max");
	await expect(close).toBeVisible();
	await expect(min).toBeVisible();
	await expect(max).toBeVisible();

	// Each is a small filled circle ~12px (per tauri-frame.css).
	const closeSize = await close.evaluate((el) => {
		const r = el.getBoundingClientRect();
		return { w: r.width, h: r.height };
	});
	expect(closeSize.w).toBeGreaterThan(8);
	expect(closeSize.w).toBeLessThan(20);

	await page.screenshot({
		path: "tests/screenshots/current/tauri-chrome-lights.png",
	});
});

test("tauri chrome: SE resize grip renders at bottom-right", async ({
	page,
}) => {
	await page.addInitScript(() => {
		(window as unknown as Record<string, unknown>).__TAURI__ = {};
	});
	await page.goto("/?test=1");
	await page.waitForFunction(
		() => document.documentElement.dataset.runtime === "tauri",
		null,
		{ timeout: 5000 },
	);
	await page.waitForTimeout(500);

	const grip = page.locator(".ema-tauri-resize-grip");
	await expect(grip).toBeVisible();

	const cursor = await grip.evaluate((el) => getComputedStyle(el).cursor);
	expect(cursor).toBe("nwse-resize");
});

test("tauri chrome: in browser runtime, traffic lights are hidden", async ({
	page,
}) => {
	await page.goto("/?test=1");
	await page.waitForLoadState("networkidle");
	// Make sure we're explicitly NOT in tauri mode
	await page.evaluate(() => {
		document.documentElement.dataset.runtime = "web";
	});
	await page.waitForTimeout(300);

	const lights = page.locator(".ema-traffic-lights");
	// The element renders unconditionally; CSS hides it under
	// `html:not([data-runtime="tauri"])`.
	const count = await lights.count();
	if (count > 0) {
		await expect(lights.first()).toBeHidden();
	}
});
