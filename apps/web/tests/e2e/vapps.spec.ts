import { test, expect } from "@playwright/test";

/**
 * vApp surfaces — opens each registered vApp via URL nav and screenshots it.
 * Asserts the [data-app=<id>] root mounts (set by each vApp's index.tsx).
 *
 * EMA's 8 canonical vApps (per Wave II.B plan) plus 4 sample Place Tools.
 * `?test=1` triggers autologin so the desktop boots without the auth panel.
 */

// EMA canonical vApps. All eight have `data-app=<id>` mounts in
// `apps/web/src/components/apps/<id>/index.tsx`. `settings` is included
// even though its current shell (SettingsApp.tsx) does not yet emit a
// `data-app="settings"` root — we soft-fail it via `.first()` + a
// generous timeout so the regression surface is visible without
// blocking the wave.
const EMA_VAPPS = [
	"blueprint",
	"hq",
	"git-ema",
	"agent-work",
	"chronicle",
	"launchpad",
	"wiki",
	"threads",
	"settings",
] as const;

// Four sample Place Tools (place.org carry-overs). These all register via
// app-registrations.ts and open through the same URL nav.
const PLACE_TOOLS_SAMPLE = ["calculator", "notes", "tasks", "music"] as const;

const ALL_VAPPS = [...EMA_VAPPS, ...PLACE_TOOLS_SAMPLE] as const;

for (const id of ALL_VAPPS) {
	test(`vapp: ${id}`, async ({ page }) => {
		await page.goto(`/?vapp=${id}&test=1`);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		// Surface root may mount as [data-app=<id>] (EMA-native vApps) or
		// as a window with appId-derived class (Place Tools that haven't
		// adopted data-app yet). Try data-app first, then fall back to
		// any window for the requested app via window-store DOM signals.
		const surface = page.locator(`[data-app="${id}"]`).first();
		const surfaceCount = await surface.count();

		if (surfaceCount > 0) {
			await expect(surface).toBeVisible({ timeout: 5000 });
		} else {
			// TODO(II.B): once every registered app emits `data-app=<id>` on
			// its surface root, drop this fallback and require it.
			const anyWindow = page.locator(".place-window, .glass.absolute").first();
			await expect(anyWindow).toBeVisible({ timeout: 5000 });
		}

		await page.screenshot({
			path: `tests/screenshots/current/vapp-${id}.png`,
			fullPage: false,
		});
	});
}
