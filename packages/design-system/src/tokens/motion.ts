// =============================================================================
// @ema/design-system / tokens / motion
//
// The motion contract — easing curves, durations, and spring presets for
// motion/react. Calm-tech: fast start, smooth land, never bouncy by default.
//
// CSS:    var(--place-ease-smooth)            cubic-bezier(0.65, 0.05, 0, 1)
// motion: { ease: EASE_SMOOTH, duration: 0.3 }  for transitions
// motion: SPRINGS.default                       for layout / drag / morph
//
// Always honour `prefers-reduced-motion: reduce`: ambient effects off,
// functional transitions preserved.
//
// Skill: place-frontend-conventions (Motion conventions section)
// =============================================================================

/**
 * Canonical easing — fast start, smooth land. Used everywhere a duration-based
 * transition is shorter than a spring response.
 *
 * CSS form: `cubic-bezier(0.65, 0.05, 0, 1)`
 * motion/react form: `[0.65, 0.05, 0, 1]`
 */
export const EASE_SMOOTH = [0.65, 0.05, 0, 1] as const;
export const EASE_SMOOTH_CSS = "cubic-bezier(0.65, 0.05, 0, 1)";

/**
 * Standard durations in milliseconds. Use these instead of hand-picked values.
 *
 * - micro: 150ms — small UI affordances (hover, focus ring, mic pulse)
 * - transition: 300ms — modal open, virtual-desktop slide, panel reveal
 * - page: 600ms — route changes, big surface swaps
 * - boot: 1200ms — boot sequence stages, screensaver wake
 */
export const DURATIONS_MS = {
	micro: 150,
	transition: 300,
	page: 600,
	boot: 1200,
} as const;

/**
 * Same durations in seconds — handy for motion/react which uses seconds.
 */
export const DURATIONS_S = {
	micro: 0.15,
	transition: 0.3,
	page: 0.6,
	boot: 1.2,
} as const;

/**
 * Spring presets for motion/react. `default` is the everyday spring; reach
 * for the others only when motion intent calls for it.
 *
 * - default — most layout / morph / open transitions (calm but responsive)
 * - snappy  — tight feedback (drag release, tap response)
 * - gentle  — long settle (large surface entrances, breathing animations)
 * - bouncy  — celebratory (sparingly: confetti, success bursts only)
 */
export const SPRINGS = {
	default: { type: "spring" as const, stiffness: 300, damping: 25 },
	snappy: { type: "spring" as const, stiffness: 500, damping: 30 },
	gentle: { type: "spring" as const, stiffness: 200, damping: 20 },
	bouncy: { type: "spring" as const, stiffness: 400, damping: 15 },
} as const;

export type SpringConfig = (typeof SPRINGS)[keyof typeof SPRINGS];

/**
 * Wrap a spring so reduced-motion users get an instant transition.
 */
export function getTransition(
	spring: SpringConfig,
	reducedMotion: boolean,
): SpringConfig | { duration: number } {
	return reducedMotion ? { duration: 0 } : spring;
}

/**
 * Time-of-day breathing. The wallpaper gradient drifts on this cycle so you
 * *feel* time passing, not see it move. Keep these long.
 */
export const AMBIENT_CYCLES_S = {
	wallpaperBreathe: 90,
	cursorLight: 0,
	bootStageHold: 0.4,
	idleScreensaverMin: 5 * 60,
} as const;
