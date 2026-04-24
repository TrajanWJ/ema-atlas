# L-projections-topbar — Real Topbar Projection

**Status:** queued
**Owner:** Runtime Vertical Slice Orchestrator
**Wave:** W1
**Corresponds to:** Target Slice B in `doctrine/planning/orchestrator-prompts/RUNTIME-VERTICAL-SLICE-ORCHESTRATOR-PROMPT.md`.

## Read first

1. `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`
2. `doctrine/planning/orchestrator-prompts/RUNTIME-VERTICAL-SLICE-ORCHESTRATOR-PROMPT.md` (Target Slice B)
3. `runtime/EMA-0.0.5--4-24/docs/architecture/08-vanilla-workspace.md` (topbar data shape for vanilla workspace)
4. `runtime/EMA-0.0.5--4-24/packages/contracts/ipc/shell-protocol.md`
5. `runtime/EMA-0.0.5--4-24/apps/web/src/shell/topbar.tsx` (current mock consumer).
6. `runtime/EMA-0.0.5--4-24/apps/web/src/app/mock-projections.ts` (what you are replacing).

## Scope

Writable paths:

- `apps/daemon/src/ema_projections/topbar.gleam` (new — daemon-side projection actor).
- `apps/web/src/shell/topbar.tsx`.
- `apps/web/src/shell/*-selector.tsx` (org, space, project selectors).
- Event/projection contract files under `packages/contracts/events/` and `packages/contracts/projections/` as needed for the `topbar.projection` channel.

Out of scope for this lane:

- The IPC client itself (owned by `L-ipc-client-finish`).
- Writing real org/space/project canon (`L-writers-org-space`). This lane uses seed events only — it does not need the writers to ship first.
- Visual redesign of the topbar.

## Dependencies

- Depends on: `L-ipc-client-finish` closed (so `useProjection` is trustworthy).
- Soft dependency: seed events in the daemon's `events` table, or a replay fixture. If `L-writers-org-space` is not yet landed, the topbar can render from a seeded projection in a startup actor — document the seeding path explicitly.
- Blocks: full first-boot flow (`10-first-boot.md`).

## Exit criteria

1. Daemon emits or serves a `topbar.projection` channel.
2. `apps/web/src/shell/topbar.tsx` consumes `useProjection("topbar.projection")` — `mockTopbar` import is removed from the happy path.
3. Org/space/project selectors read the same projection.
4. Selector interactions dispatch command-shaped IPC requests (even if the wave only has one choice, the shape must be real command envelopes, not local state writes).
5. Topbar renders `Founding-Fathers-EMA / Founding-Fathers-EMA / EMA 0.0.5` from the projection.
6. Event trail shows the seed or command events that justify the projection.
7. Same behavior works in web build and Tauri build (no surface forks).
8. Mock fallback remains allowed only for offline/dev failure and is labeled with `MOCK_PROJECTION_LABEL`.

## Reporting template

```text
Lane: L-projections-topbar
Status: closed <YYYY-MM-DD>
Files changed:
  - apps/daemon/src/ema_projections/topbar.gleam (new)
  - apps/web/src/shell/topbar.tsx
  - apps/web/src/shell/org-selector.tsx
  - apps/web/src/shell/space-selector.tsx
  - apps/web/src/shell/project-selector.tsx
Topbar now reads from: <projection channel name>
mock-projections.ts usage in topbar: <removed | fallback only, labeled>
Event trail backing projection: <seed events | command events | mixed>
Tauri build verified: <yes | no — why>
Risks: <list>
```

## Ledger anchor

Report lane closure to `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`.
