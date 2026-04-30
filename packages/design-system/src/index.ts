/**
 * @ema/design-system — canonical visual contract for EMA + every vApp.
 *
 * Imports:
 *   import "@ema/design-system/tokens.css";  // CSS custom properties
 *   import "@ema/design-system/glass.css";   // .glass-* tier classes
 *   import { THEME_PRESETS, getPresetById, applyTheme } from "@ema/design-system/themes";
 *
 * Skills that govern this package:
 *   - place-design-tokens
 *   - place-glass-system
 *   - place-theme-system
 *
 * The above skills are auto-loaded into every vApp via .claude/skills/.
 * Read SKILL.md before changing token names, scales, or tier semantics.
 */

export { THEME_PRESETS, getPresetById, type ThemePreset } from "./themes";

/**
 * Applies a theme preset by writing its tokens to <html> as inline style props.
 * Inline style wins over :root definitions without !important.
 */
export function applyTheme(preset: { tokens: Record<string, string> }): void {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	for (const [key, value] of Object.entries(preset.tokens)) {
		root.style.setProperty(key, value);
	}
}

/**
 * Reverts to the :root default by clearing every inline token property a
 * preset would have set. Safe to call when no preset is active.
 */
export function clearTheme(preset: { tokens: Record<string, string> }): void {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	for (const key of Object.keys(preset.tokens)) {
		root.style.removeProperty(key);
	}
}

/**
 * Sets the document contrast mode via [data-contrast].
 * Levels: "default" (clears the attribute), "increased", "high".
 */
export function setContrast(level: "default" | "increased" | "high"): void {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	if (level === "default") {
		root.removeAttribute("data-contrast");
	} else {
		root.setAttribute("data-contrast", level);
	}
}

/**
 * Sets the document titlebar variant via [data-titlebar].
 * Levels: "default" (clears the attribute), "compact", "hidden".
 */
export function setTitlebar(level: "default" | "compact" | "hidden"): void {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	if (level === "default") {
		root.removeAttribute("data-titlebar");
	} else {
		root.setAttribute("data-titlebar", level);
	}
}

/**
 * Sets light/dark theme via [data-theme]. "default" clears (system-preferred).
 */
export function setBaseTheme(mode: "default" | "light" | "dark"): void {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	if (mode === "default") {
		root.removeAttribute("data-theme");
	} else {
		root.setAttribute("data-theme", mode);
	}
}

export const EMA_DS_VERSION = "0.0.5-dev";
