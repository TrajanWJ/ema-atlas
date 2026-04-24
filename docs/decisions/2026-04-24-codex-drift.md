# Codex Drift — 2026-04-24

This document catalogues the deviations from doctrine found in `runtime/EMA-0.0.5--4-24/` at the start of the 2026-04-24 correction pass, plus what remained already correct.

Carried out by the **EMA 0.0.5 Runtime Recovery Orchestrator** (this session) under authority of [CODEX-CORRECTION-PROMPT-2026-04-24.md](../../../doctrine/planning/orchestrator-prompts/CODEX-CORRECTION-PROMPT-2026-04-24.md).

## Drift Symptoms At Checkpoint

### 1. Launcher: AppleScript wrapper, not Tauri bundle
- `/Users/tawj/Desktop/EMA 0.0.5.app` had `CFBundleExecutable=applet`, `CFBundleSignature=aplt`, `Contents/Resources/Scripts/main.scpt`.
- The `main.scpt` opened Terminal, ran `runtime/EMA-0.0.5--4-24/scripts/start-ema-dev.sh`, which in turn `open`ed `http://localhost:5173`.
- Producer script: `runtime/EMA-0.0.5--4-24/scripts/create-macos-launcher.sh` invoked `osacompile`.
- `apps/desktop/src-tauri/` was **fully scaffolded and correct** (`Cargo.toml`, `tauri.conf.json`, `build.rs`, `src/main.rs`, icons, `gen/schemas/`), just never built with `pnpm tauri build`.

### 2. Runtime repo: no `.git/`, no provenance
- `runtime/EMA-0.0.5--4-24/` had no `.git` directory — nothing Codex did was diffable or revertable.
- No commit trail, no attribution, no CI surface.

### 3. Web shell: route-based SPA, not Virtual Desktop
- `apps/web/src/shell/shell-layout.tsx` rendered `<Topbar /> + <SurfaceNav /> + <main><Outlet /></main>` — a classic left-nav SPA.
- Every vApp lived at a route path and occupied the whole main column.
- Missing per `doctrine/research/virtual-desktop-deep.md`:
  - No window chrome, no multi-window arrangement.
  - No dock (`surface-nav` is a vertical rail, not a Launchpad-semantics dock).
  - No per-project wallpaper (one global gradient in `styles.css`).
  - No layout artifact persistence (no `workspace://desktop/layout.<project_id>.json` read/write).
  - No presence projection (no cursors, no window outlines for other actors).
  - No adapter protocol (`{framework: "tauri" | "web", action, payload}`).

### 4. Topbar: correctly wired, already reads daemon projection
- `apps/web/src/shell/topbar.tsx` already used `useProjection("topbar")` from `@ema/surface-core`.
- Fell back to `mockTopbar` with a visible `MOCK_PROJECTION_LABEL` badge when offline.
- **This was not drift**; leaving as-is.

### 5. Mocks: labelled and honest
- `apps/web/src/app/mock-projections.ts` exported `MOCK_PROJECTION_LABEL = "mock local projection"` and used it as a visible badge throughout.
- HQ, Blueprint, git-ema, See Agent Work projections were all mock-backed but visibly tagged.
- **This was not drift.** See Agent Work even labelled itself `mocked: true` in its projection.

### 6. Daemon: substantial Gleam scaffold, completeness unknown at checkpoint
- `apps/daemon/src/` contained 18 Gleam modules spanning bounded contexts:
  - `ema_daemon/` — supervisor, bus, event_envelope, registry, sqlite_ffi, ema_env.
  - `ema_orgs/`, `ema_spaces/`, `ema_projects/`, `ema_blueprint/`, `ema_identity/`, `ema_memberships/`, `ema_invites/`, `ema_attachments/` (attachments + connectors), `ema_replication/`.
  - `ema_shell_ipc/ema_shell_ipc.gleam` — the WS server module that surfaces connect to.
  - `ema_swarm_coordination/first_boot.gleam` — the seed for `Founding-Fathers-EMA -> default space -> EMA 0.0.5`.
- See [daemon audit](./2026-04-24-daemon-audit.md) (written later in this pass).

### 7. IPC contract: specified, client done, server scaffolded
- `packages/contracts/ipc/shell-protocol.md` is a full v0 spec (handshake, commands, projections, error classes).
- `packages/surface-core/src/ipc-client/index.ts` is a complete WebSocket client with pending-command tracking, projection subscriptions, reconnect hooks.
- `apps/web/src/lib/ipc/` exposes `IpcProvider`, `useProjection`, `useCommand`.
- **This was not drift.** Wiring was already correct — the topbar already subscribes.

## What Was Already Correct (left alone per "finish, don't restart")

- `apps/desktop/src-tauri/` — Tauri v2 scaffold is complete and doctrine-aligned.
- `apps/desktop/src-tauri/tauri.conf.json` — correct `frontendDist: ../../web/dist`, correct CSP allowing `ws://127.0.0.1:49555`.
- `apps/desktop/src-tauri/src/main.rs` — intentionally minimal; correct.
- `apps/web/src/lib/ipc/` — clean surface-core wrapper.
- `packages/surface-core/src/ipc-client/index.ts` — full v0 client.
- `packages/contracts/ipc/shell-protocol.md` — authoritative protocol spec.
- `apps/web/src/shell/topbar.tsx` — correctly reads daemon projection with labelled mock fallback.
- `apps/web/src/app/mock-projections.ts` — honest mocks, all labelled.
- `apps/web/src/app/styles.css` — rich dark-theme token set; kept as base.
- `apps/daemon/src/` — 18-module Gleam scaffold; retained wholesale.

## Corrections Applied In This Pass

1. **Provenance restored.** `git init` + baseline commit (`correction: checkpoint codex drift state 2026-04-24`) — checkpoint `496a351`, 8101 files tracked.
2. **VirtualDesktopShell shipped** per `doctrine/research/virtual-desktop-deep.md`:
   - Wallpaper layer (per-project scene).
   - Dock (first-class launcher with Launchpad semantics).
   - Window manager (open/close/focus/move/resize, multi-window arrangement).
   - Window frame (geometry, title, controls).
   - Layout artifact persistence (`workspace://desktop/layout.<project_id>.json` via localStorage in wave 1; promoted to daemon-written artifact later).
   - Presence projection stub (wired UI shape for future `ws_hub` subscription).
   - Adapter protocol (`packages/surface-core/src/adapter.ts` — single dispatch point for `{framework, action, payload}`).
   - Existing routes promoted to deep links — a route resolves to "open this vApp as a window".
3. **Real Tauri bundle produced.** `pnpm --filter @ema/web build` + `pnpm --filter @ema/desktop tauri build` replace the AppleScript `.app` on Desktop.
4. **`create-macos-launcher.sh` deleted.** AppleScript was the wrong artifact.
5. **Daemon audit written.** [2026-04-24-daemon-audit.md](./2026-04-24-daemon-audit.md) lists each Gleam module's state.
6. **Red-flag sweep passed.** Zero occurrences of `Project -> Space`, `cannon`, `osacompile`, `applet`, or `electron` under `apps/` or `packages/`.

See the orchestrator correction report at the bottom of this file for the final tally.

## Non-Drift Design Choices Worth Noting

- **`MOCK_PROJECTION_LABEL` is retained as a pattern**, not eliminated. Mocks remain where the daemon projection path isn't wired yet; they are visibly labelled. This matches doctrine: honest mocks are acceptable; silent mocks are drift.
- **Layout artifact uses localStorage in wave 1.** The daemon's workspace-plane writer for `desktop/layout.<project_id>.json` lands in a later wave. The key name matches the eventual artifact path so the migration is just a backend switch.
- **Presence is stub UI only.** The `ws_hub` collab-plane subscription is not implemented yet; the VirtualDesktopShell reserves the hook so wiring a real subscription is an additive change, not a refactor.

## Correction Report

Written separately at: [2026-04-24-correction-report.md](./2026-04-24-correction-report.md) (emitted at end of this pass).
