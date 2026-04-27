# Codex Correction Prompt - EMA 0.0.5 - 2026-04-24

You are the **EMA 0.0.5 Runtime Recovery Orchestrator**.

Goal: restore the active runtime to the locked 0.0.5 plan — Gleam/BEAM daemon,
Tauri v2 desktop shell, shared web UI, daemon-owned truth.

Most of this is already here and correct. Your job is to **finish it**:

- ship the full virtual desktop,
- ship the real Tauri bundle,
- wire `surface-core` to `shell_ipc v0`,
- init git in the runtime repo,
- surface everything that is mocked vs. real.

No restarts. No from-scratch rewrites. Keep going, fix it all.

## Read First

- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/WORKSPACE-ENTRYPOINT.md`
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md`
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/architecture/05-writer-topology.md`
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/plans/IMPLEMENTATION-ROADMAP.md`
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md`
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/planning/EMA-0.0.5-PASSOVER-AND-PREP.md` (lines 397–407 cover the place.org design cues)
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/research/virtual-desktop-deep.md`
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/research/ema-003-lineage-architecture-synthesis.md` (see line 32 for the place.org lineage note)
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/architecture/08-vanilla-workspace.md`
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/architecture/02-daemon-supervision.md`
- `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/packages/contracts/ipc/shell-protocol.md`

## Drift Symptoms To Correct

1. **`/Users/tawj/Desktop/EMA 0.0.5.app` is an AppleScript wrapper, not a Tauri bundle.** `CFBundleExecutable=applet`, `CFBundleSignature=aplt`, `Contents/Resources/Scripts/main.scpt` opens Terminal and runs `scripts/start-ema-dev.sh`, which `open`s `http://localhost:5173`. Tauri v2 is scaffolded at `runtime/EMA-0.0.5--4-24/apps/desktop/src-tauri/` but `pnpm tauri build` has never been executed.
2. **`runtime/EMA-0.0.5--4-24/` has no `.git/`.** There is no provenance trail for anything that has been built.
3. **The web surface is route-based React Router, not the Virtual Desktop per `virtual-desktop-deep.md`.** Missing: window chrome, dock, wallpaper, layout artifact persistence, presence projection, adapter protocol.
4. **Topbar reads from `mock-projections.ts`, not from the daemon.** `packages/surface-core/src/ipc-client/` exists; `ema_shell_ipc` is scaffolded in the daemon; they are not connected to the topbar.
5. **Unknown daemon completeness.** `apps/daemon/src/ema_swarm_coordination/first_boot.gleam` needs an honest audit — what runs end-to-end, what is stub only.

## Non-Negotiables

- Topology is `Organization -> Space -> Project`.
- Daemon owns canonical SQLite writes.
- Surfaces send commands and read projections.
- Tauri desktop is the real `apps/desktop`, not the AppleScript website launcher.
- Do not resurrect Electron, old Elixir runtime, or surface-owned state.
- No `osacompile`, no `open https://...`, no Tauri-embedded daemon.
- No `Project -> Space` (old topology). No `cannon` (wrong spelling).
- No silent mocks — every mock is labelled via the existing `MOCK_PROJECTION_LABEL` pattern.
- Do not rewrite what is already correct. Finish, don't restart.

## Donor Checkouts

Pull these before touching code. They inform the right shape and save reinvention.

```bash
gh repo clone TrajanWJ/place.org /tmp/donor-place-org
gh repo clone TrajanWJ/place-companion /tmp/donor-place-companion
git -C /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/atlas/ema-atlas fetch origin codebase-ema:codebase-ema
git -C /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/atlas/ema-atlas fetch origin lineage-original-elixir-ema:lineage-original-elixir-ema
```

Reference points:

- `/tmp/donor-place-org/app/(desktop)/layout.tsx` + `page.tsx` — window chrome, dock, wallpaper, presence patterns.
- `/tmp/donor-place-companion/src-tauri/src/ws_server.rs` — native↔web WebSocket bridge and window setup.
- `codebase-ema` branch — unified TS contracts reference.
- `lineage-original-elixir-ema` branch — OTP/Phoenix supervisor patterns (read, don't port verbatim; target is Gleam/BEAM).

## Tasks

Strict order. Each task is a discrete git commit whose message starts with `correction:`.

### 1. Provenance

```bash
cd /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24
git init
git add .
git commit -m "correction: checkpoint codex drift state 2026-04-24"
```

No edits before this commit. Everything else must be diffable against it.

### 2. Drift Catalog

Write `runtime/EMA-0.0.5--4-24/docs/decisions/2026-04-24-codex-drift.md`.
Enumerate every deviation from doctrine with file paths and line numbers.
This is the historical record for future orchestrators.

### 3. Ship The Real Tauri Bundle (seed task 1)

- Confirm `apps/desktop/src-tauri/Cargo.toml`, `apps/desktop/src-tauri/src/main.rs`, and `apps/desktop/src-tauri/tauri.conf.json` are present and aligned.
- If `main.rs` is stub-only, port the WebSocket bridge and window setup from `/tmp/donor-place-companion/src-tauri/`.
- Build:
  ```bash
  pnpm --filter @ema/web build
  pnpm --filter @ema/desktop tauri build
  ```
- Output lives under `apps/desktop/src-tauri/target/release/bundle/macos/`.
- **Ask the user before** replacing `/Users/tawj/Desktop/EMA 0.0.5.app` with the Tauri output. Blast-radius warning.
- After user confirmation: replace the AppleScript app and delete `runtime/EMA-0.0.5--4-24/scripts/create-macos-launcher.sh`.
- **Verify:**
  - `file "/Users/tawj/Desktop/EMA 0.0.5.app/Contents/MacOS/"*` returns a Mach-O binary named for the Cargo package, not `applet`.
  - `plutil -p "/Users/tawj/Desktop/EMA 0.0.5.app/Contents/Info.plist" | grep CFBundleSignature` does NOT return `aplt`.

### 4. Finish The Virtual Desktop

Work from what's already in `apps/web/`. Existing React Router routes become
windows, not replacements. Deliver the full spec in `virtual-desktop-deep.md`:

- `VirtualDesktopShell` component wrapping `main.tsx` — wallpaper layer, dock, title bar, focus/blur, multi-window arrangement.
- Windows host existing vApps (Blueprint, git-ema, See Agent Work, HQ, Settings, Wiki, Threads). Each window has geometry (x/y/w/h/z), title, close/minimize/resize.
- Layout persists to `workspace://desktop/layout.<project_id>.json` — read on mount, write on window change. Refresh blows the view away and rehydrates from the artifact. Layout is a workspace artifact, not a control-plane event.
- Dock as first-class launcher — Launchpad tile semantics scoped to the Desktop frame.
- Per-project wallpaper — scene-per-project, not a global asset.
- Presence projection — cursors and window outlines via the collab plane (`ws_hub` subscription). Stub the subscription if backend isn't ready; wire the UI now so the shape is right.
- Adapter protocol — one endpoint dispatching `{framework: "tauri" | "web", action, payload}` so a native window and a web window go through the same path. Port from `/tmp/donor-place-companion/src-tauri/src/ws_server.rs`.
- Retain existing route paths as deep links — a route resolves to "open this vApp as a window at this position". Routes are promoted, not replaced.

### 5. Wire Surface-Core IPC To `shell_ipc v0` (seed task 2)

- `packages/surface-core/src/ipc-client/` is the canonical client.
- `ema_shell_ipc` in `apps/daemon/src/` is the Gleam server module.
- Confirm the wire format matches `packages/contracts/ipc/shell-protocol.md`.
- Replace any surface-local in-memory state that was acting as truth with a projection read through this client.

### 6. Replace Topbar Mock Projection With Daemon Projection Path (seed task 3)

- The topbar currently reads from `apps/web/src/app/mock-projections.ts`.
- Rewire it to subscribe to the daemon's projection for `Organization -> Space -> Project` selection through `surface-core`.
- Keep the mock as an explicit dev fallback labelled via `MOCK_PROJECTION_LABEL = "mock local projection"`, not as the default.

### 7. Surface Everything

Walk `apps/web/src/app/`. Every mock projection is visibly labelled. No silent
fakes. Every panel tells the user which plane it's reading from (control,
collab, runtime, projection, knowledge, secrets per
`data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md`).

### 8. Daemon Audit

- List every Gleam module under `apps/daemon/src/` with a state — implemented, stubbed, or partial.
- Confirm the `Founding-Fathers-EMA` → default same-name space → `EMA 0.0.5` project seed in `ema_swarm_coordination/first_boot.gleam` runs end-to-end when the daemon starts, or document exactly what's missing.
- Do not pretend this is done if it isn't.

### 9. Web And Tauri Parity Verification (seed task 4)

Run and record:

```bash
pnpm --filter @ema/web build
pnpm --filter @ema/web typecheck
pnpm --filter @ema/desktop tauri build
pnpm check:contracts
# from apps/daemon/ if a test target exists:
gleam test
```

Manual verification:

- Double-click `/Users/tawj/Desktop/EMA 0.0.5.app` → native window (not Terminal).
- Window connects to `ws://127.0.0.1:49555` via `surface-core` / `shell_ipc v0`.
- Topbar renders live `Organization -> Space -> Project` from a daemon projection.
- Virtual desktop shell with dock and wallpaper is visible.
- The same build served to a browser at `http://localhost:5173` shows an identical shell.

### 10. Red-Flag Sweep

All of these must return nothing:

```bash
grep -rn "Project -> Space" runtime/EMA-0.0.5--4-24/
grep -rni "cannon" runtime/EMA-0.0.5--4-24/
grep -rn "osacompile\|applet" runtime/EMA-0.0.5--4-24/
grep -rn "electron" runtime/EMA-0.0.5--4-24/apps runtime/EMA-0.0.5--4-24/packages
```

Also confirm the daemon is NOT embedded in the Tauri process — Tauri connects
as a client to the independently running daemon.

### 11. Report

Use the existing Codex output format:

```text
Implemented:
Verified:
Files changed:
Important decisions:
Risks / next blockers:
Recommended next lane:
```

Final "Recommended next lane" hands back to the orchestrator pair
(`CLAUDE-ORCHESTRATOR-PROMPT-V2.md` + `CODEX-ORCHESTRATOR-PROMPT-V2.md`).

## When Something Is Already Correct

Leave it. Commit nothing. Note it in the drift catalog as "already correct at
checkpoint" with the file path. The point is not to churn the repo; the point
is to close the open loops.
