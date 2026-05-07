// =============================================================================
// apps/web/src/lib/color-presets.ts
//
// Source-of-truth for the primary/accent quick-pick presets is now
// @ema/design-system/tokens/colors. This file exists only as a backwards-
// compatible re-export so callers using the @/src/lib/color-presets path
// keep working. New code should import from @ema/design-system directly.
//
// Lane: lane:01KR0RQFV003P5XC3P1TE2XKPR (L4 — Design system + UX manifesto)
// =============================================================================

export { COLOR_PRESETS, type ColorPreset } from "@ema/design-system/tokens/colors";
