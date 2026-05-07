// =============================================================================
// apps/web/src/lib/theme-presets.ts
//
// Source-of-truth for the 10 themable presets is now @ema/design-system.
// This file exists only as a backwards-compatible re-export so callers
// using the @/src/lib/theme-presets path keep working. New code should
// import from @ema/design-system directly.
//
// Lane: lane:01KR0RQFV003P5XC3P1TE2XKPR (L4 — Design system + UX manifesto)
// =============================================================================

export { THEME_PRESETS, getPresetById, type ThemePreset } from "@ema/design-system";
