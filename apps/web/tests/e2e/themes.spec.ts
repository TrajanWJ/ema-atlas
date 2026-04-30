import { test, expect } from "@playwright/test";

/**
 * Theme cycle — opens the root with each of the 10 presets, screenshots
 * the surface, asserts the --place-void inline style is set on <html>.
 *
 * Driven entirely by URL nav (`?theme=<id>&test=1`); no UI interaction.
 * `?test=1` also triggers autologin so we land on the desktop instead of
 * the boot identity panel.
 */

const PRESETS = [
	{ id: "default", name: "Midnight Teal", void: "#060610" },
	{ id: "nord", name: "Nord", void: "#2E3440" },
	{ id: "catppuccin-mocha", name: "Catppuccin Mocha", void: "#1E1E2E" },
	{ id: "dracula", name: "Dracula", void: "#282A36" },
	{ id: "tokyo-night", name: "Tokyo Night", void: "#1A1B26" },
	{ id: "rose-pine", name: "Rose Pine", void: "#191724" },
	{ id: "solarized-dark", name: "Solarized Dark", void: "#002B36" },
	{ id: "gruvbox-dark", name: "Gruvbox Dark", void: "#282828" },
	{ id: "one-dark", name: "One Dark", void: "#282C34" },
	{ id: "monochrome", name: "Monochrome", void: "#0A0A0A" },
] as const;

for (const preset of PRESETS) {
	test(`theme: ${preset.id}`, async ({ page }) => {
		await page.goto(`/?theme=${preset.id}&test=1`);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(400);

		// Assert the inline style was written by useUrlNav → applyTheme.
		// "default" is the no-op preset; CSS tokens come from the stylesheet,
		// not the inline style — skip the assertion for it.
		if (preset.id !== "default") {
			const inlineVoid = await page
				.locator("html")
				.evaluate((el) => el.style.getPropertyValue("--place-void"));
			expect(inlineVoid.toLowerCase()).toBe(preset.void.toLowerCase());
		}

		await page.screenshot({
			path: `tests/screenshots/current/theme-${preset.id}.png`,
			fullPage: false,
		});
	});
}
