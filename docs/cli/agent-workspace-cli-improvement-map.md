# Agent Workspace CLI Improvement Map

Status: 2026-04-29 coordination map for making the CLI the agent-native
project-management layer of EMA.

## Current Reality

The CLI is no longer only a grammar sketch. The first daemon-backed workspace
slice exists:

- `ema agent orient --json` reads daemon `lane.registry` and `queue.registry`.
- `ema tl about --json` reports daemon lane/queue state when available and
  fallback file-shaped workspace context otherwise.
- `ema lane open` appends canonical daemon events.
- `ema lane list` reads the daemon lane registry projection.
- `ema queue add` appends canonical daemon events.
- `ema queue list` reads the daemon queue registry projection.
- `ema vcalendar *` and `ema checkup *` are already daemon-backed.
- `pnpm cli` now serializes its build step so parallel agents do not race
  `apps/cli/dist/bin.js`.

This is enough for agents to orient, open a lane, log follow-up work, inspect
the queue, and pace work against the vCalendar.

Scope correction for active iOS app work:

- There is one current personal space: `Personal Workspace`
  (`space:01J00000000000000000000013`) under `Trajan's Organization`
  (`org:01J00000000000000000000012`).
- `locked-in-ios-app` is a project inside that space:
  `project:01KQD9RMA000Y2Z58RCSNCJNT0`.
- Do not create or target a separate `lockedinIOSapp` space. The accidental
  `lockedinIOSapp` space/project is non-canonical cleanup work.

## What Is Still Fake Or Partial

These commands are CLI-visible but not yet real daemon lifecycle writers:

- `lane claim`
- `lane block`
- `lane move`
- `lane release`
- `lane close`
- `lane show`
- `queue show`
- `queue ready`
- `queue block`
- `queue close`
- `problem log`
- `problem solution`
- `problem link`
- `handoff request`
- `handoff list`
- `campaign create/list/show`
- `mission create/list/show`
- `agent report`

The important distinction: the object language is right, but the state machine
is incomplete.

## Immediate Build Order

### 1. Lane Lifecycle Writers

Make lane ownership real before adding more project-management breadth.

Required daemon commands:

- `lane.claimed`
- `lane.blocked`
- `lane.moved`
- `lane.released`
- `lane.closed`

Required CLI:

- `ema lane claim --lane --actor --scope --goal --next --refresh-by`
- `ema lane block --lane --reason --depends-on --escalate-to`
- `ema lane move --lane --status`
- `ema lane release --lane --actor --handoff --reason`
- `ema lane close --lane --reason --verify`
- `ema lane show --lane`

Done when:

- `ema lane list --json` shows owner, claim scope, goal, next, blocker, status,
  and timestamps.
- `ema agent orient --json` points to exactly one recommended active lane when
  the actor has one.
- Stale claims are visible to the vApp and CLI.

### 2. Queue Lifecycle Writers

Queue needs movement, not just intake.

Required daemon commands:

- `queue_item.ready`
- `queue_item.blocked`
- `queue_item.closed`
- `queue_item.updated`

Required CLI:

- `ema queue show --queue-item`
- `ema queue ready --queue-item --reason`
- `ema queue block --queue-item --blocked-by --reason`
- `ema queue close --queue-item --result --verify`

Done when:

- Agents can mark discovered work ready, blocked, or closed without editing
  files or leaving it as unstructured report text.
- Queue items can be filtered by `project`, `mission`, `lane`, and `status`.

### 3. Problem / Solution Graph

This is the recursive blocker memory. Build it immediately after queue
lifecycle because queue items already reference blockers.

Required daemon commands:

- `problem.logged`
- `solution.proposed`
- `problem.linked`

Required CLI:

- `ema problem log --title --project --lane --cause --source`
- `ema problem solution --problem --title --verify`
- `ema problem link --from --to --relation`

Done when:

- Recurring problems can be found by relation instead of rediscovered through
  chat memory.
- Agent orientation includes active blockers and known solutions for the
  current lane.

### 4. Handoff Contracts

Handoffs are the reliability edge between agents.

Required daemon commands:

- `handoff.requested`
- `handoff.accepted`
- `handoff.completed`

Required CLI:

- `ema handoff request --from --to --needed --context --verify --depends-on`
- `ema handoff list --project --actor --status`
- `ema handoff complete --handoff --result --verify`

Done when:

- Leaving partial work without a handoff becomes visible drift.
- Agent Workspace vApp can render pending handoffs as first-class cards.

### 5. Campaign / Mission Containers

Do this after lane/queue/problem/handoff are useful. Containers are less urgent
than lifecycle.

Required daemon commands:

- `campaign.created`
- `mission.created`
- `mission.moved`

Done when:

- Agent orientation can show `campaign -> mission -> lane -> queue_item`.
- Business workflows like lead generation or marketing can be modeled without
  only free-text project names.

### 6. Agent Report

Make the final response shape machine-readable.

Required CLI:

- `ema agent report --actor --lane --changed --verified --risks --next`

Done when:

- Agent final reports append a durable workspace event.
- The vApp can render reports alongside execution lineage.

## Product Improvements

### Make Orientation Actionable

`ema agent orient --json` should eventually include:

- recommended lane to claim
- stale lanes
- blocked queue items
- active problem nodes
- pending handoffs
- current phase from vCalendar
- "next command to run"

### Add `ema next`

Agents need one command that answers: what should I do now?

Potential output:

```json
{
  "ok": true,
  "phase": "planning and lane claim",
  "recommended_command": "ema lane claim --lane lane:... --actor actor:codex ...",
  "reason": "lane is ready, unclaimed, and blocks the highest-priority queue item"
}
```

### Add `ema workspace doctor`

This should find drift:

- open lanes with no owner
- claimed lanes past refresh window
- queue items with missing done-when
- blockers without problem nodes
- handoffs without verification
- commands marked live in docs but missing daemon handlers

### Make `--json` A Stable Contract

Agents need stable JSON shapes. For every command:

- include `ok`
- include `command`
- include `source`
- include `daemon_authority`
- include `events` on writes
- include `resource` on creates
- include `blocked_by` when a command is not yet real
- avoid prose-only success paths

## Conceptual Rule

The CLI should become the agent's executive function.

Every time an agent thinks "I need to remember this", "someone should do this
later", "I am blocked", "this depends on that", "I am done", or "another agent
needs this", there should be an EMA CLI command for it.

That is how the design doc becomes real.
