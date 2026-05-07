// =============================================================================
// apps/web/src/lib/holodeck-layout.ts
//
// Source-of-truth for the holodeck content inset is now
// @ema/design-system/tokens/spacing (HOLODECK_CONTENT_INSET_PX). This file
// exists only as a backwards-compatible re-export so the existing
// @/src/lib/holodeck-layout call sites keep working. New code should
// import from @ema/design-system directly.
//
// The constant name in the design-system module is
// HOLODECK_CONTENT_INSET_PX; the legacy name HOLODECK_CONTENT_INSET is
// preserved here as a number alias.
//
// Lane: lane:01KR0RQFV003P5XC3P1TE2XKPR (L4 — Design system + UX manifesto)
// =============================================================================

export {
	HOLODECK_CONTENT_INSET_PX as HOLODECK_CONTENT_INSET,
	holodeckInsetStyle,
} from "@ema/design-system/tokens/spacing";
