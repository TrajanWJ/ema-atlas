// =============================================================================
// @ema/design-system / tokens / spacing
//
// Spacing scale + named layout constants. Tailwind's default 4px scale is in
// scope; this module declares the EMA-specific named offsets that recur in
// the shell — dock height, holodeck inset, traffic-light gutter — so they
// live in one place instead of each component.
//
// Skill: place-design-tokens (Spacing & radius)
// =============================================================================

/**
 * Base unit. Tailwind's default 4 — keep it explicit so multiplications read.
 */
export const SPACING_UNIT_PX = 4;

/**
 * 8-step scale. Components should compose from these instead of hand-picked
 * pixel values.
 */
export const SPACING = {
	xxs: 2,
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	huge: 48,
} as const;

/**
 * Holodeck content inset — the left margin reserved for the persistent
 * sidebar (dock + scope strip column). Pulled out of `apps/web/src/lib/
 * holodeck-layout.ts` so any vApp that hosts a Holodeck-style surface can
 * import the same constant.
 */
export const HOLODECK_CONTENT_INSET_PX = 88;

/**
 * Traffic-light gutter inside the Tauri-decorated topbar. Reserves room for
 * the close/min/max circles on the left. Lives in `tauri-frame.css` as
 * `padding-left: 84px`.
 */
export const TRAFFIC_LIGHT_GUTTER_PX = 84;

/**
 * Dock dimensions. The dock is `glass-elevated`, sits at the bottom of the
 * window canvas, and magnifies icons on hover.
 */
export const DOCK = {
	heightPx: 64,
	iconBasePx: 40,
	iconHoverScale: 1.15,
	iconNeighborScale: 1.05,
	gapPx: 6,
} as const;

/**
 * Window default minimum size. Below this, drag-resize stops; the user must
 * close instead.
 */
export const WINDOW_MIN = {
	widthPx: 280,
	heightPx: 180,
} as const;

/**
 * Helpers — return CSS-ready values from the holodeck inset for callers that
 * still want a `style={...}` object.
 */
export function holodeckInsetStyle(): { readonly marginLeft: number; readonly width: string } {
	return {
		marginLeft: HOLODECK_CONTENT_INSET_PX,
		width: `calc(100dvw - ${HOLODECK_CONTENT_INSET_PX}px)`,
	} as const;
}
