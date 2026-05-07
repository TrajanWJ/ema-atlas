// =============================================================================
// @ema/design-system / tokens / glass
//
// JS-side mirror of the four glass tiers defined in glass.css. The CSS
// classes (`.glass-ambient` / `.glass-surface` / `.glass-elevated` /
// `.glass-accent`) are still the way you apply glass at runtime; this
// module exists for code that needs the raw values (canvas overlays, custom
// drawn surfaces, programmatic chrome).
//
// Each tier layers: tinted background + blur + saturate + (optional) border.
// Higher tiers = more opaque + more blur = more readable over busy
// backgrounds. saturate(180%) makes colors behind the glass more vivid.
//
// Skill: place-glass-system
// =============================================================================

export type GlassTierId = "ambient" | "surface" | "elevated" | "accent";

export interface GlassTier {
	readonly id: GlassTierId;
	readonly background: string;
	readonly blurPx: number;
	readonly saturatePct: number;
	readonly border: string | null;
	readonly use: string;
}

export const GLASS_AMBIENT: GlassTier = {
	id: "ambient",
	background: "rgba(14,16,23, 0.40)",
	blurPx: 6,
	saturatePct: 120,
	border: null,
	use: "Subtle backdrops, hero overlays, snap-zone hints. Hints separation, doesn't enforce it.",
};

export const GLASS_SURFACE: GlassTier = {
	id: "surface",
	background: "rgba(14,16,23, 0.55)",
	blurPx: 20,
	saturatePct: 150,
	border: "rgba(255,255,255, 0.06)",
	use: "Cards, panels, side rails — surfaces inside a window.",
};

export const GLASS_ELEVATED: GlassTier = {
	id: "elevated",
	background: "rgba(14,16,23, 0.65)",
	blurPx: 28,
	saturatePct: 180,
	border: "rgba(255,255,255, 0.08)",
	use: "Windows, dock, top bar. The default — `.glass` aliases this.",
};

export const GLASS_ACCENT: GlassTier = {
	id: "accent",
	background: "rgba(10,30,25, 0.60)",
	blurPx: 32,
	saturatePct: 180,
	border: "var(--place-primary-border)",
	use: "Focus moments — focus-mode panel, active-call indicator, primary CTA in a low-density screen. Don't sprinkle.",
};

export const GLASS_TIERS: Record<GlassTierId, GlassTier> = {
	ambient: GLASS_AMBIENT,
	surface: GLASS_SURFACE,
	elevated: GLASS_ELEVATED,
	accent: GLASS_ACCENT,
} as const;

/**
 * The class name a tier produces in glass.css.
 */
export function glassClassName(tier: GlassTierId): string {
	return `glass-${tier}`;
}

/**
 * Build the inline backdrop-filter string for a tier — useful for code that
 * can't rely on the CSS class (e.g. canvas, transient overlays).
 */
export function glassBackdropFilter(tier: GlassTier): string {
	return `blur(${tier.blurPx}px) saturate(${tier.saturatePct}%)`;
}
