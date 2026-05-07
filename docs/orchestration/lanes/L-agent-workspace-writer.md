# L-agent-workspace-writer — Wire agent/lane/queue grammar to a real daemon writer

**Status:** closed for Slice A; retained as historical lane brief
**Owner:** daemon (Slice A); coordinator may assign a Runtime Vertical Slice or Canon Writers worker
**Wave:** W1
**Opened:** 2026-04-29

## Bootstrap milestone

This lane was the bounded documentation/agent-instruction bootstrap target for
the agent workspace. Slice A is now daemon-owned and implemented for `lane` +
`queue` real writes plus read projections. It is not a general
project-management rewrite and it does not authorize UI, campaign, mission,
problem, handoff, or agent-report surface parity.

Agents must continue to use the documented commands while this lane is open:

```bash
ema tl about --json
ema vcalendar tick --json
ema lane --help
ema queue --help
```

`tl about` and `vcalendar tick` are mandatory session-start context. `lane` and
`queue` are the Slice A write/read surface that is daemon-backed.

## Why this lane exists

`ema lane`, `queue`, `mission`, `campaign`, `agent`, `vcalendar`, `checkup`,
`handoff`, `problem`, `solution` all advertise a real grammar (see
`ema lane --help`). At the time this lane opened, every subcommand returned
`{"status":"pending_daemon_writer"}`. That is no longer true for the lane and
queue lifecycle: commands write daemon events and read `lane.registry` /
`queue.registry`.

Active coordination state no longer lives in markdown for Slice A. Markdown
lane briefs and status files are historical/project-record context; the daemon
registry is the live source for current lane and queue ownership. Remaining
gaps live in the broader graph and surfaces, especially problem/solution,
handoff depth, campaign/mission depth, agent-report projection, and exported
markdown snapshots generated from daemon state.

## Read first

1. `docs/orchestration/STATUS.md`
2. `docs/cli/agent-workspace.md`
3. `apps/cli/src/commands/lane.ts`, `queue.ts`, `agent.ts`, `mission.ts`, `campaign.ts`, `handoff.ts` (whichever exist on disk; some are untracked in the dirty worktree as of 2026-04-29)
4. `packages/contracts/ipc/shell-protocol.md` (command envelope shape)
5. `packages/contracts/events/catalog.v0.md` (existing event kinds; new kinds get added here in the same change)
6. `apps/daemon/src/ema_swarm_coordination/first_boot.gleam` (reference writer pattern; emits 13 ordered seed events)
7. `apps/daemon/src/ema_orgs/` (reference writer; closest existing writer pattern after first-boot)

## Scope (minimum useful slice — Slice A)

Implemented write/read surface:

- `apps/daemon/src/ema_swarm_coordination/agent_workspace.gleam` handles
  `lane.open`, `lane.claim`, `lane.move`, `lane.release`, `lane.close`,
  `lane.block`, `queue.add`, `queue.ready`, `queue.block`, and `queue.close`.
- `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam` routes the commands and
  emits registry projection updates.
- `apps/cli/src/commands/lane.ts` and `apps/cli/src/commands/queue.ts` use
  real IPC command paths and daemon registry projections.
- `lane.registry` and `queue.registry` are the live read models agents should
  consult before markdown.

Explicitly **out of scope** for Slice A:

- `mission`, `campaign`, `vcalendar`, `checkup`, `problem`, `solution`, `agent` writers — Slice B.
- Any read-side projection wired into a UI surface (See Agent Work already renders mocks; that wiring is `L-see-agent-work-8-region` carry-over). This lane stops at "events land in SQLite and round-trip back through `lane list` / `queue list`."
- Web shell consumption.

## Dependencies

- Depends on: `L-ipc-client-finish` providing a trustworthy command envelope path. Currently in-progress; the wire is alive, hooks need audit. **Lane can start scoping work in parallel; cannot close before `L-ipc-client-finish` closes.**
- Blocks: any future "log to queue not chat" workflow; `L-projections-topbar` is independent (different writer family); `mission`/`campaign`/`vcalendar` writers (Slice B of this lane) inherit the writer pattern.

## Exit criteria (Slice A)

1. `ema lane open --title "..." --json` returns `{"ok":true,"lane":{"id":"lane:...","status":"idea",...}}` — not `pending_daemon_writer`.
2. `ema lane claim --lane lane:... --actor ... --scope ... --goal ... --next ... --json` writes a `lane.claimed` event.
3. `ema lane list --json` returns the open lanes from a real projection over `lane.*` events.
4. `ema queue add --title "..." --why "..." --json` writes `queue_item.added`.
5. `ema queue list --json` returns a real projection.
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
ema lane open --title "smoke" --json
ema lane list --json
ema queue add --title "smoke" --why "smoke" --json
ema queue list --json
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
