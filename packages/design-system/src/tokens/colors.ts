// =============================================================================
// @ema/design-system / tokens / colors
//
// JS-side mirror of the canonical place-* color tokens defined in tokens.css.
// Keep these values in lock-step with src/tokens.css. The CSS file is the
// runtime source of truth (`var(--place-*)`); this module exists for code that
// must read raw hex / rgba (e.g. wallpaper extraction, swatch previews,
// canvas/SVG fills, theme presets).
//
// Skill: place-design-tokens
// =============================================================================

/**
 * Layered surfaces (dark → light, ascend as you nest deeper).
 * `void` is the absolute floor (body), `surface-3` is the highest panel.
 */
export const SURFACES = {
	void: "#060610",
	base: "#08090E",
	surface1: "#0E1017",
	surface2: "#141620",
	surface3: "#1A1D2A",
} as const;

/**
 * Text — white at opacity, never gray hex.
 * The five steps map to the standard `--place-text-*` ladder.
 */
export const TEXT_OPACITIES = {
	primary: 0.87,
	secondary: 0.6,
	tertiary: 0.4,
	muted: 0.25,
	ghost: 0.12,
} as const;

export const TEXT = {
	primary: `rgba(255,255,255, ${TEXT_OPACITIES.primary})`,
	secondary: `rgba(255,255,255, ${TEXT_OPACITIES.secondary})`,
	tertiary: `rgba(255,255,255, ${TEXT_OPACITIES.tertiary})`,
	muted: `rgba(255,255,255, ${TEXT_OPACITIES.muted})`,
	ghost: `rgba(255,255,255, ${TEXT_OPACITIES.ghost})`,
} as const;

/**
 * Primary scale — teal. The brand action color.
 * `400` is the bright bioluminescent step; `500` is the deeper hover/CTA fill.
 */
export const PRIMARY = {
	"50": "#CCFBF1",
	"200": "#99F6E4",
	"300": "#5EEAD4",
	"400": "#2DD4A8",
	"500": "#0D9373",
	"700": "#0A7558",
	"900": "#064E3B",
	glow: "rgba(13,147,115, 0.25)",
	subtle: "rgba(13,147,115, 0.10)",
	border: "rgba(45,212,168, 0.20)",
} as const;

/**
 * Secondary scale — slate blue. Headings, links, secondary affordances.
 */
export const SECONDARY = {
	"50": "#E0ECFD",
	"200": "#BDD1FA",
	"300": "#93B4F6",
	"400": "#6B95F0",
	"500": "#4B7BE5",
	"700": "#2B5298",
	"900": "#1E3A6E",
	glow: "rgba(75,123,229, 0.25)",
	subtle: "rgba(75,123,229, 0.10)",
	border: "rgba(107,149,240, 0.20)",
} as const;

/**
 * Tertiary scale — amber. Warmth and highlight; never used for "danger".
 */
export const TERTIARY = {
	"50": "#FEF3C7",
	"200": "#FDE68A",
	"300": "#FBBF24",
	"400": "#F59E0B",
	"500": "#D97706",
	"700": "#92400E",
	"900": "#78350F",
	glow: "rgba(217,119,6, 0.25)",
	subtle: "rgba(217,119,6, 0.10)",
	border: "rgba(245,158,11, 0.20)",
} as const;

/**
 * Semantic — never themed. Same in every preset, every contrast level.
 */
export const SEMANTIC = {
	error: "#E24B4A",
	success: "#22C55E",
	warning: "#EAB308",
} as const;

/**
 * Borders — white at opacity. Same opacity ladder as text.
 */
export const BORDER_OPACITIES = {
	subtle: 0.04,
	default: 0.08,
	strong: 0.15,
} as const;

export const BORDERS = {
	subtle: `rgba(255,255,255, ${BORDER_OPACITIES.subtle})`,
	default: `rgba(255,255,255, ${BORDER_OPACITIES.default})`,
	strong: `rgba(255,255,255, ${BORDER_OPACITIES.strong})`,
} as const;

/**
 * Quick-pick color presets — primary/accent pairs surfaced in the colors
 * setting page. These are NOT full themes (use `THEME_PRESETS` in `themes.ts`
 * for that); they're 2-color shortcuts for users who only want to retint the
 * accents without changing surfaces.
 *
 * The `default` preset matches Midnight Teal's primary/secondary so a fresh
 * install reads as the canonical place look.
 */
export interface ColorPreset {
	readonly id: string;
	readonly name: string;
	readonly primary: string;
	readonly accent: string;
}

export const COLOR_PRESETS: readonly ColorPreset[] = [
	{ id: "default", name: "Default", primary: PRIMARY["400"], accent: SECONDARY["400"] },
	{ id: "ocean", name: "Ocean", primary: "#0EA5E9", accent: "#2DD4A8" },
	{ id: "sunset", name: "Sunset", primary: "#F97316", accent: "#EF4444" },
	{ id: "forest", name: "Forest", primary: "#22C55E", accent: "#16A34A" },
	{ id: "neon", name: "Neon", primary: "#A855F7", accent: "#EC4899" },
	{ id: "mono", name: "Monochrome", primary: "#94A3B8", accent: "#CBD5E1" },
	{ id: "ember", name: "Ember", primary: "#DC2626", accent: "#F59E0B" },
	{ id: "midnight", name: "Midnight", primary: "#6366F1", accent: "#8B5CF6" },
	{ id: "rose", name: "Rose", primary: "#F43F5E", accent: "#FB923C" },
] as const;

/**
 * Convenience aggregate for callers that want everything at once.
 */
export const COLORS = {
	surfaces: SURFACES,
	text: TEXT,
	textOpacities: TEXT_OPACITIES,
	primary: PRIMARY,
	secondary: SECONDARY,
	tertiary: TERTIARY,
	semantic: SEMANTIC,
	borders: BORDERS,
	borderOpacities: BORDER_OPACITIES,
} as const;
