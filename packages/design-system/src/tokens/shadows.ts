// =============================================================================
// @ema/design-system / tokens / shadows
//
// Glass surfaces have no shadow — the blur + saturate + border IS the depth
// cue. Box-shadow on a glass surface kills its lightness. Use these only on
// non-glass elements that still need separation (the outer Tauri hull, raised
// non-glass cards, focus glows).
//
// Skill: place-glass-system (rule 9)
// =============================================================================

/**
 * Outer Tauri-hull shadow. The NSWindow itself draws no shadow
 * (`shadow: false` in tauri.conf.json), so the rounded `.place-desktop`
 * container provides the lift via this box-shadow. Lives in
 * `apps/web/app/tauri-frame.css`.
 */
export const TAURI_HULL_SHADOW =
	"0 30px 90px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06) inset";

/**
 * Dock-icon hover glow — the blue bioluminescent ring that follows a
 * pointer-hovered dock icon. Uses secondary-glow + a subtle inner halo.
 */
export const DOCK_ICON_HOVER_GLOW =
	"0 0 12px 2px var(--place-secondary-glow), 0 0 4px 1px rgba(75, 123, 229, 0.10)";

/**
 * Primary-action glow — primary-glow ring around an active CTA.
 */
export const PRIMARY_ACTION_GLOW = "0 0 12px 2px var(--place-primary-glow)";

/**
 * Mic-pulse keyframes — error-tinted pulse used on the recording indicator.
 * Encoded as the box-shadow values; the CSS keyframe lives in globals.css.
 */
export const MIC_PULSE = {
	rest: "0 0 0 0 rgba(226, 75, 74, 0.4)",
	expanded: "0 0 0 6px rgba(226, 75, 74, 0)",
} as const;

/**
 * Resize-handle hover background — the green/teal flash on the bottom-right
 * grip when the user hovers it.
 */
export const RESIZE_HANDLE_HOVER_BG = "rgba(45, 212, 168, 0.15)";

/**
 * Don't-stack rule. Glass + box-shadow looks heavy. If a component lints
 * positive on both, drop the shadow and rely on the tier border. Use this
 * empty constant in place of an explicit `boxShadow: "none"` so the intent
 * is documented.
 */
export const NO_SHADOW = "none" as const;
