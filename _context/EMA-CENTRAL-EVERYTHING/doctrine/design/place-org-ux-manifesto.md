# place.org UX Manifesto — the aesthetic fence for EMA 0.0.5

> Deep space cockpit that breathes. Calm, operator-grade, bioluminescent — never neon, never marketing-SaaS glass, never cinematic-agency dark.
>
> This document is the fence. When a design decision cannot be resolved from product context alone, it is resolved here.

---

## 1. Purpose

This manifesto codifies the aesthetic and interaction posture that EMA 0.0.5 inherits from the place.org donor. It exists because the donor's tokens live in EMA's `styles.css` but the *posture* — what the surface should feel like, what it must never drift into — has not been written down. Without this doc, every future Surface lane reinvents the aesthetic and drifts.

This is not a UI spec. It does not enumerate components, pixels, or layouts. It names the feeling, the tokens, the motion grammar, and the anti-patterns. Component- and surface-level specifics live in the forthcoming `doctrine/master/EMA-STYLING-UX-MENTALITY.md` (Canon Writers Slice C).

**Hierarchy of authority:** this manifesto > a surface-level style guide > a lane-local CSS decision > an ad-hoc visual choice. A decision that conflicts with this doc needs a doctrine revision, not a one-off CSS push.

## 2. Provenance

Donor source: `atlas/ema-atlas` repository, branch `origin/docs-place-org-era-research`, file `host/place.org-openclaw/docs/superpowers/specs/2026-03-20-place-org-design.md` (537 lines, authored 2026-03-20).

Directly ripped sections (with donor attribution preserved):
- Color system tokens — `§3` of the donor spec
- Time-of-day breathing — `§3 Time-of-Day Color Breathing`
- Typography roles — `§3 Typography`
- Surface treatment — `§3 Surface Treatment`
- Motion grammar — `§3 Motion`

Adapted for EMA (not verbatim):
- Product context — place.org is a personal OS / portfolio site; EMA is a shared human-agent executive workspace
- Application map — §12 is EMA-specific; the donor's apps (Brain Dump, Journal, Focus Timer) are out of scope
- Sound posture — §10 deferred for EMA; place.org had ambient sound, EMA does not commit to it in 0.0.5
- Governance — §14 is new

Every token, rule, or pattern sourced from place.org carries the convention `/* RIP: place.org */` in the implementing CSS, per the donor-direct-rip feedback memory.

## 3. North-star feeling

**A calm, living space floating in deep blue-black, inhabited by an operator who sees the whole system at once without the system demanding attention.**

Sensory anchors:
- **Deep space cockpit.** The surface is a quiet, dark field — not black, blue-black. Instruments light up where the operator looks. Nothing pulses for attention; the operator chooses where to focus.
- **Bioluminescence, not neon.** Lit elements glow as if they are alive, from within. Not a sharp colored ring, not a neon outline. A soft, saturated-but-low-intensity emission.
- **Living background.** The wallpaper is never static. It drifts on minute-scale cycles. It shifts with time of day. The operator feels the hour of the day without looking at a clock.
- **Clean cockpit, not cluttered.** Dense is allowed. Cluttered is not. Density comes from well-packed information; clutter comes from decorative chrome.
- **Unhurried.** Transitions complete. Micro-interactions never rush. Reduced motion is always honored. A first-time visitor cannot make the surface feel frantic.

One-sentence lock: *The surface is a calm living cockpit the operator inhabits; it is not a dashboard that performs at them.*

## 4. The fence — explicit anti-patterns

Anything on this list is a drift signal. If a pull request or lane produces any of these, revert before merging.

1. **Neon.** No sharp colored rings, no saturated outlines, no pulsing glows. Bioluminescence, not Times Square.
2. **Marketing-SaaS glass.** No Stripe-style product page hero, no Linear-style icon grids with 8 filler feature cards, no "made with ♥" footers. EMA is not a landing page.
3. **Cinematic-agency dark.** No LetMeScale, no dark-red-and-gold, no Bloomberg terminal references, no "enterprise serious" gradients. Dark, yes — theatrical, no.
4. **Bootstrappy Tailwind defaults.** No `shadow-md rounded-lg bg-white` card look. No `bg-gradient-to-r from-blue-500 to-purple-600`. Tokens are the source of truth; utility classes must consume tokens.
5. **Generic glass block.** A backdrop-filter blur on a white-ish rectangle is not the aesthetic. Frosted glass here is tinted by the blue-black space behind it and must have a visible but subtle border that appears on hover.
6. **Decoration-as-content.** No icons without function. No divider ornaments. No empty states with hand-drawn illustrations. Empty states are a single labeled line of CLI or a `pending daemon writer` tag.
7. **Emoji in product chrome.** Emojis appear only in user-authored content (their brain dump, their journal). Never in headers, labels, or system status.
8. **Abrupt state changes.** A panel should never appear without a transition. Snap-in is a drift signal.
9. **Attention-demand UI.** No red notification dots unless the event is genuinely urgent (an incident-level event). No count badges on non-actionable surfaces.
10. **Motion for decoration.** If a motion can be removed without information loss, it is decoration. Motion is for continuity (where did this come from, where did it go) and affordance (this is draggable, this is hovered), not garnish.
11. **Skeuomorphic chrome.** No faux-macOS traffic-light buttons, no fake leather textures, no wood-grain docks. The donor's windowing is minimal-frame, not Aqua.
12. **Light mode.** EMA 0.0.5 is dark-only. A light mode is not a feature of this doctrine; if added later, it requires its own manifesto pass.

## 5. Color system

The tokens below are authoritative. Every color used on an EMA surface resolves to one of these (or a computed variant with a documented transform — e.g., a `color-mix()` with a named mix partner).

| Token | Value | Role |
|---|---|---|
| `--bg-deep` | `#060610` | Base background (deep blue-black) |
| `--bg-surface` | `#0a0e1a` | Window / card / panel backgrounds |
| `--bg-glass` | `rgba(80, 130, 220, 0.06)` | Frosted glass overlay on top of `--bg-surface` |
| `--text-primary` | `#e8eaf0` | Primary text (soft white, not pure white) |
| `--text-secondary` | `#8088a0` | Secondary / muted / metadata text |
| `--accent-blue` | `#5b9cf5` | Primary accent — the living one, shifts with time of day |
| `--accent-success` | `#38c97a` | Success, growth, streak |
| `--accent-warm` | `#e8a84c` | Warning, warmth, focus mode, `draft` tag |
| `--accent-urgent` | `#ef6b6b` | Genuine urgency only — incident, broken canon, unresolved handoff |
| `--border` | `rgba(100, 160, 255, 0.08)` | Default border (almost invisible) |
| `--border-hover` | `rgba(100, 160, 255, 0.18)` | Hover-state border |
| `--glow` | `rgba(91, 156, 245, 0.15)` | Focus / hover bioluminescence |

Rules of use:
- Never use pure `#000` for backgrounds or pure `#fff` for text. The deep and soft values are the posture.
- `--accent-urgent` is rationed. If every panel on a surface has it, none of them are urgent. Reserve for incident-level events — see §11.
- Gradients are allowed only as wallpaper mesh layers (§6) and as `--accent-blue` → `transparent` glow falloffs. A two-color product gradient on a button is a drift signal.
- A color not in this table requires a manifesto amendment. Adding a one-off color to a single surface is the path to drift.

### Mock / draft / local-only / pending-daemon-writer tags

Per the honest-mocks discipline, every control or panel that doesn't flow through a daemon writer carries one of four tags, each with a consistent token mapping:

| Tag | Token | Meaning |
|---|---|---|
| `mocked` | `--accent-warm` pill, tinted background | Data is fabricated by surface code |
| `draft` | `--accent-warm` pill, un-tinted | User-in-progress, not yet committed |
| `local only` | `--text-secondary` pill | Persisted but not daemon-known |
| `pending daemon writer` | `--accent-warm` pill with outline | Control is visible but has no effect yet |

These tags are part of the color language — they are not decoration; they are canon about what the surface is claiming.

## 6. Time-of-day breathing

The wallpaper is alive. It is the single most important anti-drift signal: if the wallpaper does not breathe, the surface has drifted into a static dashboard.

Schedule (all shifts are slow — minutes, not seconds; the operator should not notice a shift in progress, only a shift already happened):

| Window | Visual |
|---|---|
| Night (00:00–05:00) | Deepest blue-purple, `--bg-deep` slightly shifted toward violet |
| Dawn (05:00–07:00) | Warm rose hint in the gradient, `--accent-warm` bleed |
| Morning (07:00–12:00) | Clean, cool blue |
| Midday (12:00–14:00) | Clearest, most neutral — the "calibration" hour |
| Afternoon (14:00–17:00) | Slightly warmer blue |
| Sunset (17:00–19:00) | Purple-violet hint |
| Evening (19:00–00:00) | Deepening blue-black back toward night |

Implementation notes (not normative — implementation lives in `apps/web/app/globals.css` and `apps/web/src/shell/wallpaper.tsx`):
- CSS `@property` animation keyed to a JS-provided time-of-day scalar is the preferred technique.
- 3–4 gradient blobs, each on its own 60–120 second slow-drift cycle.
- A very subtle SVG film-grain overlay sits above the mesh.
- Optional cursor radial light at very low opacity (`rgba(91,156,245,0.03)`) follows the pointer.

Reduced-motion behavior: the mesh freezes but the time-of-day color still applies as a static backdrop. The operator still feels the hour; they just don't see drift.

## 7. Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display | Satoshi (preferred), General Sans (fallback option) | 300–500 | Light for large headings. Weightless feeling. Tight tracking (`-0.02em`) on headlines. Fluid scale via `clamp()` across 320px → 1920px+. |
| Body | `Inter, system-ui, sans-serif` | 400–500 | Crisp at small sizes. Inter as the primary, system-ui as the graceful degrade. |
| Mono | `'JetBrains Mono', 'Geist Mono', monospace` | 400 | Terminal, data, CLI strings, code, IDs, event kinds. |

Rules:
- No hand-cranked `font-size: 14px`. Every size flows through a typographic scale defined in CSS custom properties.
- No font library shipped dynamically per-surface. Fonts are loaded once at the shell root.
- Mono is always used for CLI strings, event kinds (e.g., `org.created`), ID-prefixed identifiers (`org:…`, `lane:…`, `dispatch:…`), and any user-visible value that round-trips to the daemon protocol. Never for prose.
- No all-caps except kickers (`ema-kicker` class). Kickers are the one place where small, spaced uppercase is sanctioned.

## 8. Surface treatment

"Surface" here means any window, panel, card, or grouped region of content.

- **Windows** (floating, movable): `backdrop-filter: blur(16px)` over `--bg-surface`, 1px `--border` at rest, 1px `--border-hover` on focus/hover. Minimal chrome — a title strip, a drag handle, no Aqua traffic lights.
- **Panels** (in-flow, in a layout): `--bg-surface` fill, 1px `--border` at rest. Hover is a property of interactive panels only — read-only panels do not change on hover.
- **Cards** (list items, lane cards, mission cards): nearly invisible at rest. The border materializes on hover. Body typography is fully rendered; chrome appears on interaction.
- **Active elements** (focused input, selected nav item, hovered button): soft `--glow` behind or around them. Never a full-saturation ring. A bioluminescent lift, not a highlight.
- **Background grain:** subtle SVG film-grain filter, opacity ≤ 0.03, applied above the wallpaper mesh and below all surfaces.
- **Cursor light:** optional radial gradient follows pointer at very low opacity (`≤ 0.03`). Disabled under reduced motion.
- **Corner radii:** 8px for cards and panels, 12px for floating windows, 4px for pills and tags, `9999px` for true pills (kicker, status).

A panel that renders without a border and without hover-reveal is drift (it will look like a `shadow-md` card). A panel that renders with a saturated ring is drift (it will look like neon).

## 9. Motion

Motion is a grammar, not decoration. It describes *continuity* (where this came from) and *affordance* (what this can do). If motion can be removed without information loss, it is decoration and must be removed.

- **Easing (default):** `cubic-bezier(0.65, 0.05, 0, 1)` — fast start, smooth land. This is the EMA easing signature.
- **Duration scale:** 150ms for micro-interactions (hover, focus, small state), 300ms for in-surface transitions (panel reveal, toast, dock magnify), 600ms for surface-level changes (window open/close, view transition into a vApp or out of it). Numbers are targets, not pixel-perfect — prefer spring physics where natural.
- **Spring physics:** via the chosen animation library (`Motion`). Used for dock hover magnification, window open/close, and any element where physicality makes the affordance legible. Stiffness and damping values live in a single shared `motion-tokens` module; no per-component hand-tuning.
- **Ambient motion:** wallpaper mesh + optional cursor light are always present (the surface is alive). These stop under reduced motion.
- **Idle screensaver (optional 0.0.5 behavior):** after 5 minutes idle, a subtle particle drift or aurora effect overlays the wallpaper. Any input dismisses it instantly. Under reduced motion, no screensaver.
- **Reduced motion contract:** `@media (prefers-reduced-motion: reduce)` disables all ambient and decorative motion; functional transitions simplify to instant opacity changes. No exceptions.
- **No bounce-in on load.** First paint is calm. A panel appearing from nothing fades in; it does not scale-bounce.
- **No parallax on in-flow content.** Parallax is reserved for genuine spatial relationships (an opening window flying from the dock, a vApp returning to its dock slot).

## 10. Sound posture (deferred)

The donor (place.org) included an ambient sound engine. EMA 0.0.5 does not commit to ambient sound in the first-shipped surface. Discrete sound (notification chime, focus-mode soundscape) is out of scope for 0.0.5 and requires a future manifesto amendment to land.

If a future lane introduces sound, it inherits this contract from the donor:
- Ambient pad fades in only after a user gesture (autoplay policy).
- All sound is fully muteable, with per-category toggles.
- Under reduced motion, sound is also disabled by default (many operators treat these as linked).
- No notification chime is louder than the surrounding ambient floor.

For 0.0.5, the visual language alone carries the full aesthetic.

## 11. Interaction feel

- **Keyboard first.** Every primary action has a keyboard path. The command palette (`Cmd+K` / `Ctrl+K`) is the operator's default navigation. Mouse is an alternate, not the canonical, input.
- **Dense but calm.** Information density is high (operator-grade), but the surface never feels frantic. Density comes from typography scale + tight line-height + negative-space discipline, not from cramming.
- **No modal dialogs for routine actions.** Routine actions resolve in-place. Modals are reserved for destructive confirmation and for operator-out-of-band input (a handoff acceptance, a canon-correction acknowledgement).
- **Honest affordances.** A button that does nothing today has `pending daemon writer` visible on it. A control that writes local-only state has `local only`. The operator is never surprised.
- **Tooltips are load-bearing, not decorative.** Every control whose label is not complete on its own has a tooltip; every tooltip explains the effect, not the label.
- **Urgency is rationed.** `--accent-urgent` is for genuine incident-level events: a broken canon, an unaccepted handoff past its freshness window, a daemon-writer failure. Never for routine overdue or soft warning.
- **Empty states are a CLI line.** An empty panel shows the CLI command that would populate it (in mono, with copy affordance) and nothing else. No illustration, no prose.

## 12. Application to EMA surfaces

This section maps the posture to the concrete surfaces that exist in `runtime/EMA-0.0.5--4-24/apps/web/`. It is intentionally brief — the forthcoming `EMA-STYLING-UX-MENTALITY.md` will expand each.

- **Wallpaper (`apps/web/src/shell/wallpaper.tsx`):** the time-of-day breathing surface. The single place where §6 is enacted. No product content lives here.
- **Topbar (`apps/web/src/shell/topbar.tsx`):** thin, calm, dense. Reads `useProjection("topbar")` with honest `MOCK_PROJECTION_LABEL` fallback. No animations on value change beyond a 150ms cross-fade. No decorative icons.
- **Dock (`apps/web/src/shell/dock.tsx`):** magnification via spring physics. Lit dot under open vApps. Badge counts only on truly actionable surfaces. No bounce.
- **Window frame (`apps/web/src/shell/window-frame.tsx`):** minimal chrome. No traffic lights. Drag handle is the title strip. Corners 12px. Border hover-reveals.
- **HQ, See Agent Work, Launchpad, Blueprint, git-ema vApps:** every panel obeys §8. Every control obeys §11. Mock / draft / local-only / pending-daemon-writer tags per §5 are visible where applicable.
- **Command palette (future):** `Cmd+K` opens a modal surface that sits above the wallpaper. Uses `--bg-surface` with `blur(16px)`. Keyboard-only navigation. Fuzzy search across event kinds, vApps, org/space/project, CLI strings.
- **Focus / selection / hover states:** governed by §8 and §9. The operator's eye follows the `--glow`, not a saturated ring.

Surfaces that violate any of the above require a lane-scoped correction, not a doctrine revision.

## 13. Accessibility contract

- **WCAG AA minimum** on all text. `--accent-blue` `#5b9cf5` on `--bg-surface` `#0a0e1a` verifies at ≈5.2:1. `--text-secondary` `#8088a0` verifies at the AA threshold — anything dimmer than `--text-secondary` for textual content is a drift signal.
- **Reduced motion:** per §9, ambient disabled, functional transitions simplified.
- **High contrast (`prefers-contrast: more`):** borders become more visible; glass effects replaced with solid `--bg-surface`. Time-of-day shifts continue but with greater token contrast.
- **Keyboard:** every focusable element has a visible focus state using `--glow`. `Tab` order is document order. Focus is never trapped except in modal handoffs.
- **Screen reader:** surface-level state changes (window opened, projection refreshed, handoff accepted) announce via `aria-live="polite"`. Mock / draft / pending-daemon-writer tags are read aloud as part of the affordance — the screen reader user, like the sighted operator, is never surprised.

## 14. Governance

- This manifesto lives at `doctrine/design/place-org-ux-manifesto.md`. It is part of the doctrine tree, not the runtime repo. Runtime code that contradicts doctrine loses.
- A change to a token value, a new color, a new motion duration, a new anti-pattern, or a new interaction rule requires editing *this document first*, then the runtime. The inverse order produces drift that is then retroactively legitimized.
- A change that affects a donor-sourced section (§5, §6, §7 surface-treatment paragraphs, §9 motion grammar) must preserve the `/* RIP: place.org */` provenance marker in the corresponding runtime CSS.
- Amendments that expand scope (new tokens, new surfaces, new surface types) are welcome. Amendments that dilute the fence (broader permission for neon, permission to use marketing-SaaS glass, permission to add emoji to chrome) are rejected by default and require a named decision log entry under the Canon Writers lane.
- The forthcoming `doctrine/master/EMA-STYLING-UX-MENTALITY.md` (Canon Writers Slice C, doc 3) *inherits* this manifesto. If that doc contradicts this one, this one wins until an explicit amendment here resolves the difference.

## 15. Verification checklist

Before closing any Surface lane, the owner runs this checklist against the landed change:

1. **Token discipline** — every color resolves to a §5 token, or to a documented `color-mix()` of §5 tokens. No raw hex outside the token table.
2. **Anti-pattern scan** — no neon, no marketing-SaaS glass, no cinematic-agency red/gold, no skeuomorphic chrome, no emoji in chrome, no `shadow-md rounded-lg bg-white` Tailwind defaults.
3. **Wallpaper breathing intact** — `apps/web/src/shell/wallpaper.tsx` still drives a time-of-day gradient; it did not get replaced with a static image.
4. **Honest mocks** — every mock / draft / local-only / pending-daemon-writer surface carries its tag in the correct §5 color.
5. **Motion grammar** — every new animation has a reason (continuity or affordance); every new duration/ease value lives in the motion-tokens module.
6. **Reduced motion** — new ambient effects are gated by `prefers-reduced-motion`.
7. **Accessibility** — new text passes AA; new focus states use `--glow`; new interactive controls have keyboard paths.
8. **Density, not clutter** — information density increased where it should; decorative chrome did not.
9. **Empty states** — every new empty state is a CLI line with copy, not an illustration or prose.
10. **Provenance** — donor-sourced CSS carries `/* RIP: place.org */`.

A lane that fails any item is reverted or patched before landing. Partial compliance is not compliance.

---

## Appendix — quick token reference (copy into CSS custom properties)

```css
:root {
  --bg-deep:        #060610;
  --bg-surface:     #0a0e1a;
  --bg-glass:       rgba(80, 130, 220, 0.06);

  --text-primary:   #e8eaf0;
  --text-secondary: #8088a0;

  --accent-blue:    #5b9cf5;
  --accent-success: #38c97a;
  --accent-warm:    #e8a84c;
  --accent-urgent:  #ef6b6b;

  --border:         rgba(100, 160, 255, 0.08);
  --border-hover:   rgba(100, 160, 255, 0.18);
  --glow:           rgba(91, 156, 245, 0.15);

  --radius-card:    8px;
  --radius-window:  12px;
  --radius-pill:    9999px;

  --ease-signature: cubic-bezier(0.65, 0.05, 0, 1);
  --dur-micro:      150ms;
  --dur-surface:    300ms;
  --dur-canvas:     600ms;
}
```

## Appendix — donor vocabulary map

| place.org term | EMA term | Notes |
|---|---|---|
| Desktop | vDesktop / shell | EMA's shell embeds place.org-style window manager |
| App | vApp | EMA's Launchpad, HQ, See Agent Work, Blueprint, git-ema |
| Brain Dump | Brain Dump vApp | First intent-capture surface in EMA 0.0.5; entries are `intent` per Master Doc §6.1. Local-only persistence until the intent writer lands. |
| Journal | — | Out of scope for EMA 0.0.5 |
| Focus Timer | — | Out of scope for EMA 0.0.5; EMA has `focus block` and vCalendar instead |
| Terminal | EMA CLI vApp | Runs EMA CLI commands against the daemon |
| Ambient bar | topbar | EMA topbar shows org / space / project / connectors / presence |
| Dock | dock | Unchanged role |
| Command palette | command palette | Unchanged role; EMA dispatches daemon commands |
| Wallpaper mesh | wallpaper | Same technique; same breathing contract |

The manifesto inherits the place.org *posture* and *tokens*, not its *product surface*. EMA is a shared human-agent executive workspace, not a personal OS.
