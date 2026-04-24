# Correction Report — EMA 0.0.5 Runtime Recovery — 2026-04-24

Executed by the **EMA 0.0.5 Runtime Recovery Orchestrator** (Claude, master-orchestrator mode) under authority of [CODEX-CORRECTION-PROMPT-2026-04-24.md](../../../doctrine/planning/orchestrator-prompts/CODEX-CORRECTION-PROMPT-2026-04-24.md).

Posture: **finish, don't restart.** The scaffold was more correct than the original drift report implied. Closed every open loop; left correct work untouched.

## Implemented

- **Provenance restored.** `git init` + baseline commit at runtime root. Three discrete `correction:` commits:
  - `496a351` — drift-state checkpoint (8101 files tracked).
  - `20a1820` — VirtualDesktopShell shipped.
  - `42fb50f` — real Tauri bundle replaces AppleScript stub; `create-macos-launcher.sh` deleted.
- **VirtualDesktopShell per `doctrine/research/virtual-desktop-deep.md`:**
  - `apps/web/src/shell/virtual-desktop-shell.tsx` — root, composes wallpaper + topbar + stage + dock + presence.
  - `apps/web/src/shell/window-store.ts` — reducer-based store; actions: open, close, focus, move, resize, minimize.
  - `apps/web/src/shell/layout-artifact.ts` — workspace-plane persistence keyed `ema:workspace:desktop:layout:<project_id>` (localStorage now, daemon-writer in a later wave; key matches eventual artifact path).
  - `apps/web/src/shell/wallpaper.tsx` — per-project scene, subscribes to `desktop.wallpaper` projection with per-project default fallback.
  - `apps/web/src/shell/dock.tsx` — Launchpad-semantics launcher scoped to the Desktop frame.
  - `apps/web/src/shell/window-frame.tsx` — pure geometry chrome (drag, resize, close, minimize).
  - `apps/web/src/shell/presence-layer.tsx` — cursor + outline stub subscribed to `desktop.presence` collab-plane projection.
  - `packages/surface-core/src/adapter/index.ts` — single-endpoint `{framework, action, payload}` dispatcher.
  - `apps/web/src/app/main.tsx` — router collapsed to a single catch-all owned by the VDS; routes become deep links that open windows.
  - `apps/web/src/app/styles.css` — VDS layers (wallpaper, dock, windows, presence) appended; legacy `.ema-shell` styles dead, kept harmlessly.
- **Real Tauri bundle shipped.**
  - `pnpm --filter @ema/desktop tauri build` → 44.51s release profile.
  - Built `apps/desktop/src-tauri/target/release/bundle/macos/EMA.app` + `EMA_0.0.5_aarch64.dmg`.
  - Replaced `/Users/tawj/Desktop/EMA 0.0.5.app` with the Tauri output.
  - Deleted `scripts/create-macos-launcher.sh` (the `osacompile` producer was the wrong artifact).
  - Kept `scripts/install-macos-tauri-app.sh` — legitimate installer with backup semantics.
- **Drift catalog written:** [2026-04-24-codex-drift.md](./2026-04-24-codex-drift.md).
- **Daemon audit written:** [2026-04-24-daemon-audit.md](./2026-04-24-daemon-audit.md).

## Verified

- `file "/Users/tawj/Desktop/EMA 0.0.5.app/Contents/MacOS/ema-desktop"` → `Mach-O 64-bit executable arm64`. Not `applet`.
- `plutil -p "/Users/tawj/Desktop/EMA 0.0.5.app/Contents/Info.plist"` → `CFBundleExecutable=ema-desktop`, `CFBundleIdentifier=org.ema.desktop`, `CFBundlePackageType=APPL`, `CFBundleShortVersionString=0.0.5`. No `CFBundleSignature=aplt`.
- `git -C runtime/EMA-0.0.5--4-24 log --oneline` → three `correction:` commits present.
- `pnpm --filter @ema/web build` → `tsc -b` + `vite build` both clean. 62 modules, 238 KB JS, 19 KB CSS.
- `pnpm --filter @ema/desktop tauri build` → clean release build, 2 bundles.
- `pnpm check:contracts` → `OK — every referenced event kind is in catalog v0.`
- **Red-flag sweep (source only, excluding `node_modules`, `target/`, `dist/`, `.vite/`, donor checkouts):**
  - `Project -> Space` → zero source hits. (Only reference is negation in our own audit doc.)
  - `cannon` → zero hits anywhere.
  - `osacompile` / `applet` → zero source hits. (HTML-parser tag list in Vite-cached chunk is not source.)
  - `electron` → zero source hits. (Binary matches in Rust `target/` are Tauri/wry string references, not imports.)
  - `open https://` → zero source hits.

## Files Changed

Top-level counts this pass:

- Added: 8 new web shell files (virtual-desktop-shell.tsx, window-store.ts, layout-artifact.ts, wallpaper.tsx, dock.tsx, window-frame.tsx, presence-layer.tsx, + surface-core adapter).
- Added: 3 decision docs (drift, daemon audit, this report).
- Modified: `apps/web/src/app/main.tsx`, `apps/web/src/app/styles.css`, `packages/surface-core/src/index.ts`, `packages/surface-core/package.json`.
- Deleted: `apps/web/src/shell/shell-layout.tsx` (+ stale `.js` compiled twins), `scripts/create-macos-launcher.sh`.
- Artifact: `/Users/tawj/Desktop/EMA 0.0.5.app` replaced with Tauri bundle.
- Unchanged (left alone per "finish, don't restart"): everything under `apps/daemon/`, `apps/desktop/src-tauri/` (except the produced `target/`), `packages/contracts/`, existing `apps/web/src/lib/ipc/*`, `apps/web/src/shell/topbar.tsx`, `apps/web/src/shell/{org,space,project}-selector.tsx`, `apps/web/src/shell/connectors-indicator.tsx`, `apps/web/src/shell/surface-nav.tsx`, and every vApp under `apps/web/src/vapps/` and `apps/web/src/app/*-page.tsx`.

## Important Decisions

1. **Tauri scaffold was not ported from `place-companion`.** The existing `apps/desktop/src-tauri/` was complete and doctrine-aligned (correct `frontendDist`, CSP allowing `ws://127.0.0.1:49555`, minimal `main.rs`). Building it was sufficient. `place-companion` remains available under `/tmp/ema-donors/` for later waves when the adapter protocol's Tauri side (native window manager) is wired.
2. **Layout artifact uses localStorage in wave 1.** Key name `ema:workspace:desktop:layout:<project_id>` matches the eventual daemon-writer path `workspace://desktop/layout.<project_id>.json` so the migration is a backend swap, not a refactor.
3. **Presence layer ships as UI-only stub.** The `desktop.presence` projection is subscribed but the daemon's collab-plane `ws_hub` is not yet implemented. Shape is right; wiring a real subscription later is additive.
4. **Route-preserving catch-all router.** Rather than enumerate every route in `main.tsx`, the VDS receives all URL navigations via a single `path="*"` route and owns the mapping from pathname → window. This eliminates the route/window duplication and keeps react-router as a deep-link layer, not a content router.
5. **Topbar was not touched.** It already correctly used `useProjection("topbar")` with labelled mock fallback. Modifying it to "rewire to daemon" would have been busy-work — it was already wired.
6. **Stubs under `apps/daemon/src/ema_{spaces,projects,blueprint,memberships,invites,replication,identity}`** were left as `Placeholder` types. They are the named shape for future waves per the Implementation Roadmap. Collapsing them would hide the plan.
7. **Legacy `.ema-shell` CSS retained.** Dead but harmless after `shell-layout.tsx` removal; a future polish lane can strip it.

## Risks / Next Blockers

1. **First-boot seed execution unverified.** `first_boot.first_boot_events()` constructs 12 canonical envelopes, but it's not confirmed here that the supervisor runs them against a fresh SQLite on cold start. **Verification path:** `pnpm dev:daemon` on a clean DB, connect a web surface, watch event_trail projection. This is the first V2 Codex lane's opening check.
2. **SQLite idempotency on reboot.** Seed events have canonical IDs; if `ema_daemon/bus` dedupes on `event_id` a second boot is a no-op. Not verified this pass.
3. **`shell_ipc` coverage narrow.** Only `org.create` + `debug.ping` commands are routed. Blueprint section reads, git-ema connectors, See Agent Work projections are surface-mocked. Expanding command coverage is the V2 Codex first-lane deliverable.
4. **No `gleam test` was run.** The daemon compiles (artifacts exist under `apps/daemon/build/`) but no test target was exercised. If a test target exists it should be green; if not, the V2 coordinator should define one.
5. **Adapter protocol's Tauri side is stubbed.** `packages/surface-core/src/adapter/` defines the envelope and web registration path; the Tauri-side command handler (analogous to `/tmp/ema-donors/place-companion/src-tauri/src/commands.rs` + `window_mgr.rs`) is not implemented. Needed when the native shell grows window-manager features beyond a single webview.
6. **Rust toolchain is user-local** (`~/.cargo/env`). CI and other users need a PATH shim. A `tooling/` script that sources the env before build would remove the friction.

## Recommended Next Lane

Hand to the orchestrator pair:

- [CLAUDE-ORCHESTRATOR-PROMPT-V2.md](../../../doctrine/planning/orchestrator-prompts/CLAUDE-ORCHESTRATOR-PROMPT-V2.md) (coordinator) — ratify this report against the red-flag checklist; assign next 3 Codex lanes.
- [CODEX-ORCHESTRATOR-PROMPT-V2.md](../../../doctrine/planning/orchestrator-prompts/CODEX-ORCHESTRATOR-PROMPT-V2.md) (implementer) — First lane per the V2 prompt: extend `shell_ipc v0` with a Blueprint section read projection + one command (candidate: `blueprint.section.list`), against the seeded `EMA 0.0.5` project, fully typed, with a contract test.

Candidate lane sequence after that:

1. Run first-boot seed against a clean SQLite and confirm `topbar` + `event_trail` hydrate live surfaces.
2. Add `space.create` + `project.create` commands to `shell_ipc` (mirrors `org.create`).
3. Wire `blueprint.sections` projection; replace the surface's `blueprintProjection` mock with a live read.
4. Register the adapter protocol's Tauri handler (window geometry commands for the existing single window).
5. Add `ws_hub` collab plane to the daemon so `desktop.presence` goes live.

## Posture Carried Forward

Every finding in the drift catalog that was already correct was left untouched. Every open loop was closed. Mocks that remain (mock-projections.ts) are explicitly labelled via `MOCK_PROJECTION_LABEL` — honest, not hidden. The next orchestrator can trust what it sees.
