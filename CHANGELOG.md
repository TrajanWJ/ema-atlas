# Changelog

## 2026-04-29

### Design system overhaul + URL nav contract + E2E test bench

**Foundation**
- `@ema/design-system` rewritten: canonical `--place-*` tokens, glass.css, themes.ts (10 presets via `buildTokens()`), helpers (`applyTheme`, `setContrast`, `setBaseTheme`, `setTitlebar`).
- Glass tier tints in `apps/web/src/app/styles.css` derive from theme via `color-mix()` so themes re-tint chrome automatically.
- Stale removed: `apps/web/src/app/settings-page 2.tsx`, `apps/web/out/`, `.next/types/{routes.d 2.ts,validator 2.ts}`.

**URL navigation contract** (`apps/web/src/lib/url-nav.ts`, `use-url-nav.ts`, `url-state-router.tsx`; spec at `docs/dev/url-test-api.md`)
- First-class API for users (deep links) and agents/E2E tests (deterministic state).
- Params: `vapp`, `vapps`, `theme`, `contrast`, `mode`, `titlebar`, `desktop`, `window(s)`, `panel`, `route`, `org`, `space`, `project`, `test`.
- `?test=1` sets `[data-test=1]`, suppresses ambient motion for stable screenshots.

**Shell chrome** (Wave 2A)
- New `BootSequence` (typewriter terminal, fast-forwards under `data-test`).
- Topbar collapses Org/Space/Project into one `glass-elevated` strip with chevron separators + env pill.
- Dock: ring-of-three magnification (hover 1.15x, neighbours 1.05x), running indicator dot, right-click menu, `glass-elevated`.
- Wallpaper: aurora/dots/grid modes, slow gradient-position breathing (60–120s), time-of-day overlay, SVG noise grain. Frozen under `prefers-reduced-motion` + `[data-test=1]`.
- Selectors restyled as one cohesive control.

**Window system** (Wave 2B)
- Windows: `.glass-elevated` chrome, `data-active` focus ring (`--place-primary-border`), `contain: layout paint style`.
- WindowTitleBar: macOS traffic-light buttons (close/min/max) with hover-revealed SVG glyphs.
- SnapZones: `.glass-ambient` overlay sized to snap target, motion fade-in/out.
- `[data-titlebar=compact|hidden]` URL params now respected.
- vApp body host adds `data-app=<id>` for E2E targeting; dock buttons use `data-dock-app=` to avoid collision.

**Blueprint vApp** (Wave 2C)
- Full rewrite as canonical "deep project-thinking" surface using `place-brand-voice` + `place-psychology-and-language` exemplars.
- Spine + body + footer rail; AnimatePresence fade between sections.
- Fallback content (Intent/Map/Attachments/Decisions/Canon) demonstrates the brand voice; live `useProjection("blueprint.sections")` still wins when daemon writer ships.

**Settings + Theme picker** (Wave 2D)
- New `<ThemePicker>`, `<PresetSwatch>`, `<SettingsPage>` (Appearance / Contrast / Mode / Window chrome / About).
- Persists to `localStorage["ema:appearance"]`; URL params override on every render.
- All 10 presets visibly retint the entire shell.

**HQ surface** — copy revoiced to brand voice ("Daemon-owned. Local-first. Yours.").

**E2E test bench** (`apps/web/tests/e2e/`)
- 29 tests, all passing: 10 themes (assert `--place-void` inline + screenshot), 9 vApps (assert `data-app=<id>` mounts), 6 URL nav contract assertions, 4 a11y scans (`@axe-core/playwright`).
- Reuses existing dev server via `EMA_E2E_NO_WEBSERVER=1`.
- Screenshots under `tests/screenshots/current/`.

**Skills**
- 10 shared skills installed via `Projects/EMA/atlas/shared/skills/install-shared-skills.sh`; auto-loaded into each vApp's `.claude/skills/`.

## 2026-04-24

- Initialized runtime provenance repairs after discovering generated dependency
  and build artifacts had entered the new repo history.
- Added ignore, attributes, branch/worktree policy, and snapshot tooling for
  concurrent EMA 0.0.5 worker sessions.
