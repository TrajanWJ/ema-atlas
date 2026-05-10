> **Status: historical (0.0.5 lineage).** This handoff was written for the EMA-0.0.5 active build and references EMA-0.0.5 paths as live. 0.0.6 has superseded that lineage; current runtime ownership is recorded under `Active builds/EMA-0.0.6/` and the controlling implementation plan in [`../superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md`](../superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md). Preserved here for provenance; do not start new work from this document.

# Runtime Recovery Handoff

Date: 2026-04-24

## Historical Facts

- Active code root: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.5`.
- Canon topology: `Organization -> Space -> Project`.
- Canon rule: daemon owns truth; surfaces dispatch commands and render projections.
- The real desktop app is the Tauri bundle from `apps/desktop`.
- `~/Desktop/EMA 0.0.5.app` should be the installed Tauri app.
- `~/Desktop/EMA 0.0.5 Web Dev Launcher.app` is an AppleScript web/dev helper.
- `@ema/surface-core` now opens the daemon WebSocket, sends `hello`, can dispatch commands, normalizes daemon `events` into `event_ids`, and accepts future `projection` frames.
- The daemon shell IPC currently supports `hello`, `ping`/`pong`, `subscribe`, `unsubscribe`, streamed `event`, and `debug.ping`.
- Real topbar/org/space/project projections are still pending daemon projection actors.

## Runtime Recovery Prompt

```text
You are recovering the current EMA 0.0.5 runtime state.

Workspace:
- Desktop root: /Users/trajanm4air/Desktop
- Active code root: /Users/trajanm4air/Desktop/Active builds/EMA-0.0.5
- Project record root: /Users/trajanm4air/Desktop/Projects/EMA
- Atlas root: /Users/trajanm4air/Desktop/Projects/EMA/atlas
- Do not build inside archive, atlas, packed folders, or donor/reference folders.

Goal:
Produce a precise runtime recovery report and the next executable lane.

Read first:
1. README.md
2. Projects/EMA/project.md
3. Projects/EMA/PROJECT-MAP.md
4. Active builds/EMA-0.0.5/README.md
5. Active builds/EMA-0.0.5/docs/WORKSPACE-ENTRYPOINT.md
6. Active builds/EMA-0.0.5/docs/architecture/05-writer-topology.md
7. Active builds/EMA-0.0.5/docs/plans/IMPLEMENTATION-ROADMAP.md
8. Active builds/EMA-0.0.5/docs/plans/RUNTIME-RECOVERY-HANDOFF.md

Rules:
- EMA means Executive Management Assistant.
- Locked topology is Organization -> Space -> Project.
- Daemon owns canonical truth; surfaces dispatch commands and render projections.
- Hermes/runtime owns execution; do not blur execution state into canon.
- The first milestone is a vanilla workspace, not full autonomous workflow.
- `EMA 0.0.5.app` is the real Tauri desktop app.
- `EMA 0.0.5 Web Dev Launcher.app` is only a dev helper for daemon + Next.js web.
- Verify reality from files and commands before claiming behavior works.

Deliver:
- Current runtime status: daemon, web, desktop, CLI, contracts, launcher.
- What is real vs stubbed.
- Exact commands to boot/check the current runtime.
- The next smallest implementation lane, with files in scope and acceptance checks.
```

## Donor Mining Prompt

```text
You are mining donor material for EMA 0.0.5 without contaminating the active build.

Workspace:
- Active EMA code: /Users/trajanm4air/Desktop/Active builds/EMA-0.0.5
- Canon/project record: /Users/trajanm4air/Desktop/Projects/EMA
- Atlas and donor/reference material: /Users/trajanm4air/Desktop/Projects/EMA/atlas
- Preserved history: /Users/trajanm4air/Desktop/Projects/EMA/atlas/archive

Goal:
Find reusable patterns, contracts, interface ideas, lane discipline, launcher concepts, and source/workspace models. Do not copy donor code blindly.

Canonical filters:
- EMA = Executive Management Assistant.
- Current topology: Organization -> Space -> Project.
- Current implementation root: Active builds/EMA-0.0.5.
- Daemon-first, native-first, Gleam/BEAM daemon, Tauri desktop, web shell parity.
- Blueprint is the first deep project-thinking vApp.
- git-ema is the source/attachment vApp, not the whole shared workspace.
- See Agent Work is the first swarm/vCalendar control-room app.
- Imported docs and donor material are evidence until promoted or linked.

Mining method:
1. Identify donor file/path and original context.
2. Classify the extract as doctrine, object model, UI surface, launcher pattern, swarm/lane process, data/source model, or runtime/execution pattern.
3. Translate old terms into 0.0.5 language.
4. Reject anything that violates daemon-owned canon, Organization -> Space -> Project, or surface-as-projection.
5. Return action-ready recommendations tied to runtime files or docs.

Deliver:
- Donor finds ranked by usefulness.
- Adopt / adapt / reject decision for each.
- Exact EMA 0.0.5 translation.
- Next lane that can implement or document the best find.
```

## Next Lane

Implement M2 topbar projection from daemon-owned events:

- Daemon: add first real `topbar` projection actor and seed snapshot.
- IPC: emit `projection` frames with `name: "topbar"`.
- Web: keep existing `useProjection("topbar")` path; remove local fallback only after daemon projection is reliable.
- Acceptance: fresh boot's topbar shows `Trajan's Organization -> Personal Workspace -> (no project)` as the default current scope from the daemon projection (not mock data); switching to the `Founding-Fathers-EMA` org via the org selector reveals its same-name default space and the `EMA 0.0.5` project.
