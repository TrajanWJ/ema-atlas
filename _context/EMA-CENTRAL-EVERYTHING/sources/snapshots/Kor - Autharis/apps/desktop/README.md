# @autharis/desktop — Tauri admin shell (Lane G6)

Native desktop wrapper around the Autharis admin surface (review queue, roster,
disputes, reports). Built with **Tauri 2 + Vite 5 + React 19**.

## Prerequisites

1. **Rust toolchain** — install via <https://rustup.rs>. Tauri 2 requires
   `rustc` >= 1.77.
2. Platform deps per the Tauri prerequisites guide
   (<https://v2.tauri.app/start/prerequisites/>): Xcode Command Line Tools on
   macOS, WebView2 on Windows, `webkit2gtk` on Linux.
3. **Node / pnpm** — this is a workspace member of the Autharis monorepo; run
   `pnpm install` at the repo root.
4. **Fastify API** (lane F6) running at `http://localhost:4010`. The desktop
   shell calls it through `@autharis/sdk`.

## Dev loop

```bash
# from repo root
pnpm --filter @autharis/desktop dev          # Vite only, browser preview at 5174
pnpm --filter @autharis/desktop tauri:dev    # launches the native window
```

Vite runs on **port 5174** (distinct from every other Autharis surface).

## Production build

```bash
pnpm --filter @autharis/desktop tauri:build
```

Outputs per-platform installers into `src-tauri/target/release/bundle/`.
Signing, notarization, and the auto-updater are intentionally out of scope for
this lane (see dispatch `lane-G6-desktop.md`).

## Layout

```
apps/desktop/
  index.html              # Vite entry
  src/
    main.tsx              # React 19 bootstrap
    App.tsx               # Shell with nav between views
    sdk.ts                # AutharisClient -> http://localhost:4010
    useAsync.ts           # Tiny fetch state hook
    styles.css            # Uses @autharis/tokens CSS vars
    views/
      Queue.tsx           # /admin/queue
      Roster.tsx          # /talent
      Disputes.tsx        # /admin/queue?kind=dispute
      Reports.tsx         # /invoices + /timesheets roll-up
  src-tauri/
    Cargo.toml            # crate name: autharis_desktop
    build.rs
    tauri.conf.json       # window 1280x800, identifier com.autharis.desktop
    src/main.rs           # tauri::Builder::default().run(...)
    icons/icon.png        # PLACEHOLDER — replace with a real 512x512 PNG
```

## Icon placeholder

`src-tauri/icons/icon.png` is intentionally a zero-byte placeholder. Before
running `tauri:build` you must replace it with a real icon. The Tauri CLI can
generate the full icon set for you:

```bash
pnpm --filter @autharis/desktop tauri icon path/to/source.png
```

This writes all of the per-platform variants (`.ico`, `.icns`, resized PNGs)
into `src-tauri/icons/`.

## Notes

- No Tailwind. All visual styling uses `@autharis/tokens` CSS custom
  properties so brand changes propagate through the monorepo.
- This lane does not ship any Rust IPC handlers beyond the default Tauri
  scaffolding; admin logic lives in the React layer and talks directly to the
  Fastify API.
- Scope is deliberately narrow: signing, notarization, auto-updater, and
  installers are deferred to a future lane.
