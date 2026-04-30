# L-agent-workspace-writer — Wire agent/lane/queue grammar to a real daemon writer

**Status:** queued
**Owner:** daemon (Slice A); coordinator may assign a Runtime Vertical Slice or Canon Writers worker
**Wave:** W1
**Opened:** 2026-04-29

## Bootstrap milestone

This lane is the bounded documentation/agent-instruction bootstrap target for
the agent workspace. Slice A is daemon-owned and limited to `lane` + `queue`
real writes plus read projections. It is not a general project-management
rewrite and it does not authorize UI, campaign, mission, problem, handoff, or
agent-report writers.

Agents must continue to use the documented commands while this lane is open:

```bash
pnpm cli tl about --json
pnpm cli vcalendar tick --json
pnpm cli lane --help
pnpm cli queue --help
```

`tl about` and `vcalendar tick` are mandatory session-start context. `lane` and
`queue` are the Slice A write/read surface that must become daemon-backed.

## Why this lane exists

`pnpm cli lane`, `queue`, `mission`, `campaign`, `agent`, `vcalendar`, `checkup`, `handoff`, `problem`, `solution` all advertise a real grammar (see `pnpm cli lane --help`) but every subcommand currently returns `{"status":"pending_daemon_writer"}`. The CLI grammar is registered; no daemon writer accepts the commands; no events land in SQLite; no projections feed a coordination view.

This means coordination state still lives in markdown (`docs/orchestration/STATUS.md`, `lanes/*.md`). The `CLAUDE.md` desktop policy is explicit: *"Log later work to the queue with dependencies instead of burying it in chat. Log recurring blockers as problem/solution graph nodes."* That policy cannot be honored in code today — only in prose. This lane closes the gap for at least the minimum useful subset.

## Read first

1. `docs/orchestration/STATUS.md`
2. `docs/cli/agent-workspace.md`
3. `apps/cli/src/commands/lane.ts`, `queue.ts`, `agent.ts`, `mission.ts`, `campaign.ts`, `handoff.ts` (whichever exist on disk; some are untracked in the dirty worktree as of 2026-04-29)
4. `packages/contracts/ipc/shell-protocol.md` (command envelope shape)
5. `packages/contracts/events/catalog.v0.md` (existing event kinds; new kinds get added here in the same change)
6. `apps/daemon/src/ema_swarm_coordination/first_boot.gleam` (reference writer pattern; emits 13 ordered seed events)
7. `apps/daemon/src/ema_orgs/` (reference writer; closest existing writer pattern after first-boot)

## Scope (minimum useful slice — Slice A)

Writable paths:

- `apps/daemon/src/ema_lanes/` (new) — writer for `lane.open`, `lane.claim`, `lane.move`, `lane.release`, `lane.close`, `lane.block`.
- `apps/daemon/src/ema_queue/` (new) — writer for `queue.add`, `queue.ready`, `queue.block`, `queue.close`.
- `packages/contracts/events/lane.md` (new) and `queue.md` (new) — event family files with the new kinds.
- `packages/contracts/events/catalog.v0.md` — register every new kind in the same change.
- `packages/contracts/types/ids.md` — add `lane:` and `queue_item:` id prefixes.
- `apps/cli/src/commands/lane.ts`, `queue.ts` — flip from `pending_daemon_writer` to a real IPC command path.
- `tooling/m1-round-trip.mjs` or a new `tooling/agent-workspace-round-trip.mjs` — round-trip test for `lane open` and `queue add`.

Explicitly **out of scope** for Slice A:

- `mission`, `campaign`, `vcalendar`, `checkup`, `problem`, `solution`, `agent` writers — Slice B.
- Any read-side projection wired into a UI surface (See Agent Work already renders mocks; that wiring is `L-see-agent-work-8-region` carry-over). This lane stops at "events land in SQLite and round-trip back through `lane list` / `queue list`."
- Web shell consumption.

## Dependencies

- Depends on: `L-ipc-client-finish` providing a trustworthy command envelope path. Currently in-progress; the wire is alive, hooks need audit. **Lane can start scoping work in parallel; cannot close before `L-ipc-client-finish` closes.**
- Blocks: any future "log to queue not chat" workflow; `L-projections-topbar` is independent (different writer family); `mission`/`campaign`/`vcalendar` writers (Slice B of this lane) inherit the writer pattern.

## Exit criteria (Slice A)

1. `pnpm cli lane open --title "..." --json` returns `{"ok":true,"lane":{"id":"lane:...","status":"idea",...}}` — not `pending_daemon_writer`.
2. `pnpm cli lane claim --lane lane:... --actor ... --scope ... --goal ... --next ... --json` writes a `lane.claimed` event.
3. `pnpm cli lane list --json` returns the open lanes from a real projection over `lane.*` events.
4. `pnpm cli queue add --title "..." --why "..." --json` writes `queue_item.added`.
5. `pnpm cli queue list --json` returns a real projection.
6. New event kinds appear in `packages/contracts/events/catalog.v0.md` and pass `bash scripts/contract-check.sh`.
7. New id prefixes (`lane:`, `queue_item:`) appear in `packages/contracts/types/ids.md` and pass contract-check.
8. Round-trip script (`node tooling/agent-workspace-round-trip.mjs` or equivalent) is green.
9. Replay test: kill daemon, restart, `lane list` returns the same lanes.
10. Existing `m1-round-trip.mjs` still green; `gleam test` green; `pnpm check:contracts` green.

## Verification commands

```bash
cd "Active builds/EMA-0.0.5"
bash scripts/contract-check.sh
cd apps/daemon && gleam build && gleam test && cd ../..
node tooling/m1-round-trip.mjs
node tooling/agent-workspace-round-trip.mjs   # new
pnpm cli lane open --title "smoke" --json
pnpm cli lane list --json
pnpm cli queue add --title "smoke" --why "smoke" --json
pnpm cli queue list --json
```

## Reporting template

```text
Lane: L-agent-workspace-writer
Slice: A — lane + queue writers + projections
Status: closed <YYYY-MM-DD>
Files changed:
  - apps/daemon/src/ema_lanes/* (new)
  - apps/daemon/src/ema_queue/* (new)
  - packages/contracts/events/lane.md (new)
  - packages/contracts/events/queue.md (new)
  - packages/contracts/events/catalog.v0.md
  - packages/contracts/types/ids.md
  - apps/cli/src/commands/lane.ts
  - apps/cli/src/commands/queue.ts
  - tooling/agent-workspace-round-trip.mjs (new)
Event kinds added: lane.opened, lane.claimed, lane.moved, lane.released, lane.closed, lane.blocked, queue_item.added, queue_item.ready, queue_item.blocked, queue_item.closed
Id prefixes added: lane:, queue_item:
Round-trip evidence: <paste output>
Risks: <list>
Slice B carry-over: mission/campaign/vcalendar/checkup/agent/handoff/problem/solution writers
```

## Ledger anchor

Report lane open and lane closure to `docs/orchestration/STATUS.md`.
