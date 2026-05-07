# @ema/design-system — changelog

## 0.0.5-dev.1 — 2026-05-07 (lane:01KR0RQFV003P5XC3P1TE2XKPR)

### Token surface promoted from `apps/web/src/lib/`

The design tokens that were duplicated inside `apps/web/src/lib/` now live
in `packages/design-system/src/tokens/` so every surface (web, desktop,
future Tauri vApps) can import from one place.

**New typed token modules** (under `src/tokens/`):

- `colors.ts` — `SURFACES`, `TEXT`, `PRIMARY`, `SECONDARY`, `TERTIARY`,
  `SEMANTIC`, `BORDERS`, `COLOR_PRESETS` (the 9 primary/accent quick-pick
  pairs, including a `default` matching Midnight Teal). Mirror of the CSS
  custom properties in `tokens.css`.
- `glass.ts` — `GLASS_TIERS` (`ambient` / `surface` / `elevated` / `accent`)
  with raw background, blur, saturate, border, and `glassClassName()` /
  `glassBackdropFilter()` helpers.
- `motion.ts` — `EASE_SMOOTH` / `EASE_SMOOTH_CSS` (the canonical
  `cubic-bezier(0.65, 0.05, 0, 1)`), `DURATIONS_MS` / `DURATIONS_S`
  (micro / transition / page / boot), `SPRINGS` (default / snappy /
  gentle / bouncy), `getTransition()`, `AMBIENT_CYCLES_S` (wallpaper
  breathe, idle screensaver minimum 5min).
- `spacing.ts` — `SPACING` 8-step scale, `HOLODECK_CONTENT_INSET_PX`
  (replacing the local copy in `holodeck-layout.ts`), `DOCK` dimensions,
  `WINDOW_MIN`, plus `holodeckInsetStyle()` helper.
- `radii.ts` — `RADII` named scale, `WINDOW_HULL_RADIUS_PX` (Tauri outer
  hull), `WINDOW_INNER_RADIUS_PX`.
- `shadows.ts` — `TAURI_HULL_SHADOW`, `DOCK_ICON_HOVER_GLOW`,
  `PRIMARY_ACTION_GLOW`, `MIC_PULSE`, `RESIZE_HANDLE_HOVER_BG`. Glass
  surfaces stay shadow-less; these are for non-glass affordances only.
- `typography.ts` — `FONT_STACK_SANS`, `FONT_STACK_MONO`, `FONT_VARS`
  (cinzel / instrument-serif / jetbrains-mono next/font handles),
  `FONT_WEIGHTS`, `LINE_HEIGHT`, `FONT_SIZES_PX` / `_REM` (micro through
  display).

### `package.json` exports

Added subpath exports for each token module so callers can do:

```ts
import { PRIMARY } from "@ema/design-system/tokens/colors";
import { SPRINGS, EASE_SMOOTH } from "@ema/design-system/tokens/motion";
import { holodeckInsetStyle } from "@ema/design-system/tokens/spacing";
```

The barrel `@ema/design-system/tokens` re-exports everything, and
`@ema/design-system` itself now re-exports from the barrel.

### Consumers refactored in `apps/web/`

The three duplicated source-of-truth files in `apps/web/src/lib/` are now
thin re-exports of the design-system canon:

- `apps/web/src/lib/color-presets.ts` → re-exports `COLOR_PRESETS` /
  `ColorPreset` from `@ema/design-system/tokens/colors`.
- `apps/web/src/lib/theme-presets.ts` → re-exports `THEME_PRESETS` /
  `getPresetById` / `ThemePreset` from `@ema/design-system`.
- `apps/web/src/lib/holodeck-layout.ts` → re-exports
  `HOLODECK_CONTENT_INSET` / `holodeckInsetStyle` from
  `@ema/design-system/tokens/spacing`.

All existing call sites continue to work without modification (the `@/`
import path still resolves), but new code should import directly from
`@ema/design-system`.

### `apps/web/app/globals.css`

`globals.css` now `@import`s `@ema/design-system/src/tokens.css` and
`@ema/design-system/src/glass.css` instead of duplicating the
`:root { --place-* }` block. The 90+ lines of token definitions are now
single-sourced; what remains in `globals.css` is web-app-specific
(scrollbars, markdown, range slider, ambient-bar WCO, view transitions,
mic pulse keyframe, dock-icon glow consumer, resize-handle hover).

The legacy aliases (`--bg-deep`, `--accent-blue`, `--glass-blur`, etc.)
remain in `globals.css` as a compatibility shim until every consumer is
migrated.

### Doctrine

The visual contract is now also documented in
`Projects/EMA/atlas/doctrine/design/place-org-ux-manifesto.md` —
the calm-tech, bioluminescent-glow (NOT neon), spring-easing,
5-min-idle-screensaver, anti-slop UX manifesto for EMA and every vApp.

## 0.0.5-dev — 2026-04-29

Initial design-system package. Token CSS, glass CSS, theme presets, and
applyTheme/setContrast/setTitlebar/setBaseTheme helpers extracted from
the place.org donor.
