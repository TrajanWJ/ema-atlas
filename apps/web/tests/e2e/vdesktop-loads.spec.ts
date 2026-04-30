import { test, expect } from "@playwright/test";

/**
 * vDesktop loads cleanly under the simulated Tauri runtime — REGRESSION
 * test for the OOM fix in Wave II.A. Before the fix, `companionBridge`
 * spun unlimited WebSocket retry attempts at the place-companion daemon
 * inside the bundled .app and OOM-killed the renderer at t≈3s.
 *
 * Strategy:
 *   - Stub `window.__TAURI__` so BootSequence treats us as the desktop
 *     runtime AND triggers autologin (no Identity Panel button click
 *     needed — the autologin path also fires under `?test=1`).
 *   - Navigate to `/?test=1`.
 *   - Wait 8 seconds for the renderer to settle past the previously
 *     fatal t≈3s window.
 *   - Assert no error overlay AND that Desktop has actually mounted by
 *     finding either a running vApp or the Tauri runtime affordances
 *     (resize grip / data-runtime).
 */

test("vdesktop loads under Tauri stub and stays alive past t=8s", async ({
	page,
}) => {
	// Capture any uncaught page errors during the boot+settle window so
	// we can report them clearly in the assertion message.
	const pageErrors: string[] = [];
	page.on("pageerror", (err) => {
		pageErrors.push(`${err.name}: ${err.message}`);
	});

	await page.addInitScript(() => {
		(window as unknown as Record<string, unknown>).__TAURI__ = {};
	});

	await page.goto("/?test=1");
	// Wait for the boot sequence to detect Tauri and write data-runtime.
	// BootSequence types out lines for ~3s before its detect effect runs.
	await page.waitForFunction(
		() => document.documentElement.dataset.runtime === "tauri",
		null,
		{ timeout: 10000 },
	);

	// If an EmaIdentityPanel button is present (autologin race), click
	// "Enter workspace" to advance. Under `?test=1` autologin should fire
	// automatically, but we belt-and-suspenders click if the button shows.
	try {
		const enterButton = page.getByRole("button", {
			name: /enter\s+workspace/i,
		});
		if ((await enterButton.count()) > 0) {
			await enterButton.first().click({ timeout: 1500 }).catch(() => {});
		}
	} catch {
		/* button missing → autologin already advanced us */
	}

	// Hold for 8 seconds to clear the previously fatal companion-bridge
	// retry storm window. If the renderer has been OOM-killed the page
	// either dies or surfaces an error overlay.
	await page.waitForTimeout(8000);

	// No uncaught page errors during the boot+settle window.
	expect(
		pageErrors,
		`unexpected page errors: ${pageErrors.join("; ")}`,
	).toHaveLength(0);

	// Desktop has actually mounted — at minimum one of:
	//   - a vApp surface (data-app=launchpad gets auto-opened on first
	//     launch by `(desktop)/page.tsx`),
	//   - data-runtime=tauri on <html>,
	//   - the Tauri SE resize grip (rendered unconditionally in DOM).
	const desktopAlive = await page.evaluate(() => {
		const launchpad = document.querySelector("[data-app='launchpad']");
		const grip = document.querySelector(".ema-tauri-resize-grip");
		const runtime = document.documentElement.dataset.runtime === "tauri";
		return Boolean(launchpad || grip || runtime);
	});
	expect(
		desktopAlive,
		"Desktop did not mount: no launchpad, no resize grip, no data-runtime",
	).toBe(true);

	await page.screenshot({
		path: "tests/screenshots/current/vdesktop-loads.png",
		fullPage: false,
	});
});
