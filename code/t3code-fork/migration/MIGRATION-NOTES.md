# EMA → t3code migration notes

Branch: `trajan/ema-tokens`. Nothing is wired into the fork's build yet.
Everything here is staged in `migration/` so it can't accidentally affect
the upstream diff during rebases.

## Source

All assets mined from:

- `~/Projects/ema/IGNORE_OLD_TAURI_BUILD/app/src/styles/globals.css`
- `~/Projects/ema/IGNORE_OLD_TAURI_BUILD/app/src/components/shared/glass.css`
- `~/Projects/ema/IGNORE_OLD_TAURI_BUILD/app/src/types/workspace.ts` (per-app accents)

See the old build's README — it was archived as "reference-ready, not broken."
The pivot off Tauri was architectural (3-language tax, Linux pain, Elixir
blocking modern AI tooling), not a visual rejection.

## What's here

- `tokens/ema-tokens.css` — full design token system (`@theme` block + `:root`
  CSS vars). Teal primary (`#2DD4A8`), blue secondary (`#6B95F0`), amber
  tertiary, void (`#060610`) ground, 3 surface layers, opacity scales,
  custom `--ease-smooth` curve.

- `tokens/ema-glass.css` — three glass tiers (`.glass-ambient` /
  `.glass-surface` / `.glass-elevated`), the root ambient radial-gradient
  wash, and the glass button/input/card primitives.

## Environment context — KDE Plasma 6 Wayland

Detected: `XDG_SESSION_TYPE=wayland`, `XDG_CURRENT_DESKTOP=KDE`, running
`kwin_wayland`.

**In-document `backdrop-filter` blur:** works. Every `.glass-*` class
here will render correctly because Chromium blurs same-document content.

**Window-level blur (see desktop through the window):** does NOT work on
KDE Wayland + Electron. KDE exposes blur via the `org_kde_kwin_blur`
Wayland protocol, and Chromium/Electron don't implement it. Setting
`BrowserWindow({ transparent: true, ... })` gives you a transparent
window over a dark-but-not-blurred desktop region. The effect on macOS
(`vibrancy: 'under-window'`) and Windows 11 (`backgroundMaterial: 'acrylic'`)
works via their dedicated Electron APIs — no equivalent on Linux.

**Implication:** the old Tauri build's outermost `#root` backdrop-filter
aspired to "blur the desktop behind the app" — that is effectively dead
on KDE Wayland. Mitigation: layer a heavy gradient + subtle noise on
`.ema-root-ambient` so the visual weight comes from in-app ambient
lighting, not from seeing the desktop. All the *interior* glass layers
(modals, panels, inputs, dropdowns) work as intended.

## Validation status

- [ ] Real blur test: run t3code desktop in dev mode with `transparent: true`
      added to BrowserWindow, render `.glass-surface` over `.ema-root-ambient`,
      confirm visual. (Blocked on `bun install` completing.)
- [ ] Per-app accent palette extracted from `workspace.ts` — not done yet;
      do this if/when the dock is ported.

## Not migrated (deliberately)

- **Zustand stores + Phoenix Channels sync pattern.** The whole point of
  EMA's pivot was to kill the REST+Channels+Zustand triple-sync. Don't
  port this.
- **Rust / Tauri window configuration.** Replaced by Electron's
  `BrowserWindow` options.
- **Proposal pipeline logic** (Generator → Refiner → Debater → Tagger).
  This is EMA daemon-side work, not a desktop shell concern. The sibling
  EMA session owns it.

## Upstream hygiene

The `migration/` folder is self-contained. To keep rebasing onto
`upstream/main` painless:

- Do not edit files outside `migration/` on this branch until tokens
  are ready to wire in.
- When wiring, do it on a separate branch cut from `upstream/main +
  trajan/ema-tokens`, so the raw extraction stays reviewable.
