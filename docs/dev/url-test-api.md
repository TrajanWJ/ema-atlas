# URL Test / Navigation API

The URL is a first-class API into the EMA shell — for users (deep-links,
bookmarks, shared workspace state) and for agents / E2E tests (deterministic
state assembly without driving the UI).

Every param is read at boot and on every history change. Missing params do
nothing; defaults are preserved.

Implementation: `apps/web/src/lib/url-nav.ts` + `apps/web/src/lib/use-url-nav.ts`.

## Quick examples

```
/?vapp=blueprint                         # open Blueprint
/?vapp=cwt                               # open Current Work in the desktop shell
/?theme=dracula                          # apply Dracula theme
/?theme=tokyo-night&contrast=high        # tokyo-night + high contrast
/?windows=blueprint:120,80,860,540;hq:1020,80,500,540
/?vapps=hq,cwt,blueprint                 # open three vApps at default sizes
/?panel=blueprint                        # render Blueprint full-bleed
/?panel=cwt                              # render Current Work full-bleed
/?mode=panel&vapp=wiki                   # same panel mode alias used by popouts
/blueprint                               # direct panel route
/?theme=monochrome&titlebar=compact&test=1
```

## Parameters

| Param      | Values                                                                                  | Purpose                                                                 |
| ---------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `vapp`     | `blueprint`, `hq`, `cwt`, `brain-dump`, `git-ema`, `agent-work`, `wiki`, `threads`, `settings`, `launchpad` | Open this vApp (or focus it if already open). Legacy `braindump` maps to `brain-dump`. |
| `vapps`    | comma-separated vApp ids                                                                | Open multiple vApps in order at their default windows                   |
| `theme`    | `default`, `nord`, `catppuccin-mocha`, `dracula`, `tokyo-night`, `rose-pine`, `solarized-dark`, `gruvbox-dark`, `one-dark`, `monochrome` | Apply a theme preset by id |
| `contrast` | `increased`, `high`                                                                     | Increase text/border contrast (sets `[data-contrast]` on `<html>`)      |
| `mode`     | `light`, `dark`, `panel`                                                                | Force light/dark base theme, or pair `panel` with `vapp` for panel mode |
| `titlebar` | `compact`, `hidden`                                                                     | Window titlebar variant (sets `[data-titlebar]`)                        |
| `desktop`  | integer                                                                                 | Active virtual desktop index                                            |
| `window`   | `<vapp>:<x>,<y>[,<w>,<h>]`                                                              | Open a single vApp at coordinates                                       |
| `windows`  | `<vapp>:<x>,<y>[,<w>,<h>];<vapp>:<x>,<y>;...`                                           | Open multiple vApps at coordinates                                      |
| `panel`    | vApp id                                                                                 | Render the vApp full-bleed (panel mode), no shell chrome. Equivalent to `?mode=panel&vapp=<id>` |
| `route`    | path                                                                                    | Navigate to an immersive sub-route                                      |
| `test`     | `1` or `true`                                                                           | Test mode: deterministic, ambient motion suppressed                     |

## Test mode behavior

When `?test=1` is set:

- `<html data-test="1">` is set; CSS variable `--ema-test-reduced-motion: 1` is written.
- Components MAY check `document.documentElement.dataset.test === "1"` and
  disable ambient motion, time-of-day color shifts, idle screensavers, and any
  other non-deterministic effects.
- Functional transitions (window open/close, dock click, theme apply) remain on
  for visual fidelity.
- Recommended for every Playwright test: pass `?test=1` plus the explicit state.

## Encoding from code

```ts
import { encodeUrlState } from "@/src/lib/url-nav";

const qs = encodeUrlState({
  theme: "dracula",
  windows: [{ appId: "blueprint", x: 120, y: 80, width: 860, height: 540 }],
  test: true,
});
// → "theme=dracula&windows=blueprint%3A120%2C80%2C860%2C540&test=1"
```

## Validation rules

- Unknown vApp ids are dropped silently (the URL never crashes the shell).
- Direct panel routes exist for the EMA vApps, e.g. `/blueprint`, `/cwt`, `/agent-work`,
  `/git-ema`, and the legacy `/braindump` alias.
- Unknown theme ids are ignored; the previous theme remains active.
- Negative or non-finite coordinates are dropped per-window.
- `windows` overrides `window` if both are provided.
- Order matters: in `?vapps=a,b,c` the apps open left-to-right.

## What the URL does NOT control

- Org / Space / Project scope (lives in `useShellScope()`; persisted, not URL-driven).
- Per-app data (lives in stores / daemon; URLs do not seed app data).
- Authentication.

These are intentional: the URL is for *layout state and visual presentation*,
not for product data. If a future need arises (e.g. `?project=ema`), add it
explicitly to the contract above with a migration plan.

## For agents and E2E tests

The URL nav is the canonical way to drive EMA without UI interaction:

```ts
// Playwright
await page.goto("/?vapp=blueprint&theme=dracula&test=1");
await expect(page.locator("[data-app='blueprint']")).toBeVisible();
```

Combined with `data-test="1"` (which suppresses ambient motion), this makes
every test reproducible across runs.
