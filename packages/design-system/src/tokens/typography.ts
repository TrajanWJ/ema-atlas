// =============================================================================
// @ema/design-system / tokens / typography
//
// Font stacks, weights, sizes. The system stack is intentional — no web font
// loading on first paint. Display fonts (Cinzel, Instrument Serif, JetBrains
// Mono) are loaded by Next's `next/font` at the app root and exposed as
// `--font-cinzel`, `--font-instrument-serif`, `--font-jetbrains-mono` —
// reach for those for branded chrome only.
//
// Skill: place-design-tokens (Typography)
// =============================================================================

/**
 * Default sans stack — Apple system on macOS, Segoe UI on Windows, the
 * platform-default on Linux. No font download.
 */
export const FONT_STACK_SANS =
	'-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

/**
 * Default monospace stack — covers macOS (SF Mono), Windows (Cascadia),
 * Linux (Fira Code), and modern bundled UI mono fallback.
 */
export const FONT_STACK_MONO = '"SF Mono", "Cascadia Code", "Fira Code", ui-monospace, monospace';

/**
 * CSS variables for app-loaded display fonts (set by `next/font` in
 * `apps/web/app/layout.tsx`). Use these only for landmark chrome — the body
 * text always falls back to the system stack.
 */
export const FONT_VARS = {
	cinzel: "var(--font-cinzel)",
	instrumentSerif: "var(--font-instrument-serif)",
	jetbrainsMono: "var(--font-jetbrains-mono)",
} as const;

/**
 * Weights — only two. Don't introduce 300 / 700 etc. without a doctrine
 * update; the system stack rendering varies enough that 400/600 is the only
 * reliable contrast pair.
 */
export const FONT_WEIGHTS = {
	base: 400,
	heading: 600,
} as const;

/**
 * Default line-height. Tight enough to read dense panels, loose enough that
 * stacked text doesn't crowd.
 */
export const LINE_HEIGHT = 1.5;

/**
 * Type scale — small to large. EMA UI is mostly small text; reach for the
 * larger steps only for surface titles, hero text, or display moments.
 */
export const FONT_SIZES_PX = {
	micro: 10,
	tiny: 11,
	xs: 12,
	sm: 13,
	base: 14,
	md: 15,
	lg: 16,
	xl: 18,
	"2xl": 20,
	"3xl": 24,
	display: 32,
} as const;

export const FONT_SIZES_REM = {
	micro: "0.625rem",
	tiny: "0.6875rem",
	xs: "0.75rem",
	sm: "0.8125rem",
	base: "0.875rem",
	md: "0.9375rem",
	lg: "1rem",
	xl: "1.125rem",
	"2xl": "1.25rem",
	"3xl": "1.5rem",
	display: "2rem",
} as const;
