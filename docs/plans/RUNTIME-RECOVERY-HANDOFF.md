# Runtime Recovery Handoff

Date: 2026-04-24

## Current Facts

- Active code root: `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24`.
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
- Central root: /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING
- Active code root: /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24
- Doctrine root: /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine
- Do not build inside sources/snapshots, archive, atlas, or donors.

Goal:
Produce a precise runtime recovery report and the next executable lane.

Read first:
1. README.md
2. doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md
3. doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md
4. runtime/EMA-0.0.5--4-24/README.md
5. runtime/EMA-0.0.5--4-24/docs/WORKSPACE-ENTRYPOINT.md
6. runtime/EMA-0.0.5--4-24/docs/architecture/05-writer-topology.md
7. runtime/EMA-0.0.5--4-24/docs/plans/IMPLEMENTATION-ROADMAP.md
8. runtime/EMA-0.0.5--4-24/docs/plans/RUNTIME-RECOVERY-HANDOFF.md

Rules:
- EMA means Executive Management Assistant.
- Locked topology is Organization -> Space -> Project.
- Daemon owns canonical truth; surfaces dispatch commands and render projections.
- Hermes/runtime owns execution; do not blur execution state into canon.
- The first milestone is a vanilla workspace, not full autonomous workflow.
- `EMA 0.0.5.app` is the real Tauri desktop app.
- `EMA 0.0.5 Web Dev Launcher.app` is only a dev helper for daemon + Vite web.
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
- Active EMA code: /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24
- Canon doctrine: /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine
- Curated donors: /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/donors
- Preserved history: /Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/sources/snapshots

Goal:
Find reusable patterns, contracts, interface ideas, lane discipline, launcher concepts, and source/workspace models. Do not copy donor code blindly.

Canonical filters:
- EMA = Executive Management Assistant.
- Current topology: Organization -> Space -> Project.
- Current implementation root: runtime/EMA-0.0.5--4-24.
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
- Acceptance: fresh boot shows `Founding-Fathers-EMA -> Founding-Fathers-EMA -> EMA 0.0.5` from daemon projection, not mock data.
