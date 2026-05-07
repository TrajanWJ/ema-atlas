// =============================================================================
// @ema/design-system / tokens / radii
//
// Border-radius scale. The donor doesn't currently codify these as CSS vars
// — components reach for hand-picked values (3px, 5px, 8px, 12px, 9999px).
// This module pins the canonical scale so future code references the named
// step instead of inventing a new radius.
//
// When promoting these to CSS, add to tokens.css:
//   --place-radius-sm:   4px;
//   --place-radius:      8px;
//   --place-radius-lg:  12px;
//   --place-radius-pill: 9999px;
//
// Skill: place-design-tokens (Spacing & radius)
// =============================================================================

export const RADII_PX = {
	none: 0,
	xs: 2,
	sm: 4,
	md: 8,
	lg: 12,
	xl: 16,
	pill: 9999,
} as const;

export const RADII = {
	none: "0",
	xs: "2px",
	sm: "4px",
	md: "8px",
	lg: "12px",
	xl: "16px",
	pill: "9999px",
} as const;

/**
 * Outer Tauri-window hull radius. The transparent NSWindow draws nothing;
 * `.place-desktop` / `.ema-desktop` round their corners to this value.
 */
export const WINDOW_HULL_RADIUS_PX = 12;

/**
 * Inner-window radius — slightly smaller so the inner content doesn't kiss
 * the hull. Pairs with `WINDOW_HULL_RADIUS_PX`.
 */
export const WINDOW_INNER_RADIUS_PX = 8;
