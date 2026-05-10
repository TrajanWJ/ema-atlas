# Agent Workspace CLI Operating Contract

> **Vocabulary.** "Agent Workspace" here means the project-scoped operating
> surface for lanes, queue, handoffs, dispatches, executions, and evidence.
> "Cockpit" is the client/project workbench inside that workspace, not the
> workspace itself. "Duct Tape/Harness" is the AI dispatch seam and execution
> registry. For the full canonical glossary, see the `Vocabulary` section in
> the EMA-0.0.6 `AGENTS.md`.

Status: immediate agent-use contract. The daemon registry is the live
coordination source. Core workspace commands are live through daemon
writes/projections or explicit file-backed Harness Glue rails:
`vcalendar.*`, `checkup.*`, org/space/project creation, `campaign`, `mission`,
`lane`, `queue`, `handoff`, `problem`, `agent report`, and `agent prompt`.
`ema next`, `ema tl about`, `ema agent orient`, and `ema vcalendar tick` read
daemon lane/queue registry state first and only use file-shaped records as
fallback context when daemon state is unavailable.

CLI doctrine (`~/Desktop/AGENTS.md`, 2026-05-07, post-cwt-absorption): EMA's
CLI is `ema`. cwt is absorbed; `~/.local/bin/cwt` is now a thin alias for
`ema cockpit "$@"`. When asked "what projects/clients exist?" or "what's on
for client X?", route through `ema cockpit …` (the cockpit vApp's CLI
surface). See
`docs/decisions/2026-05-07-cwt-absorbed-by-ema.md` (supersedes the same-day
pre-absorption ADR). The earlier `ema cwt status` / `ema cwt ingest`
commands and split-CLI framing are deprecated.
Command-group `--help` output is the normalized source for current flags and
implementation status.

Current cockpit implementation status: `ema cockpit summary`, `projection`,
`builds`, `surfaces`, `lanes`, `queue`, and `open` are live CLI reads. They
combine the resolved workspace scope, daemon lane/queue projections,
active-build git facts, known project surfaces, and the cockpit URL. For
Proslync, this is the cold-start surface an agent should use before touching
app/backend/desktop/assets work.

This document defines how agents use EMA while working. The CLI is not just an
admin tool. It is the project-management, organization, executive-function, and
handoff grammar agents should use to frame work as it happens.

Current personal scope note: `locked-in-ios-app` is a project inside
`Personal Workspace`, not a space. Use:

```bash
ema agent orient --project locked-in-ios-app --json
```

That should resolve to:

- org: `Trajan's Organization` (`org:01J00000000000000000000012`)
- space: `Personal Workspace` (`space:01J00000000000000000000013`)
- project: `locked-in-ios-app` (`project:01KQD9RMA000Y2Z58RCSNCJNT0`)

For the current build order and gap map, see
`docs/cli/agent-workspace-cli-improvement-map.md`.

## Bootstrap Milestone

The bounded bootstrap milestone is daemon-owned Slice A: `lane` and `queue`
perform real writes and read projections through the daemon. Agents still use
the commands below as the required operating grammar; pending-writer responses
on other nouns are implementation status, not permission to skip the workflow.

Slice A is operational when:

- `ema lane open/list/show/claim/block/move/release/close` use daemon-backed
  lane events and projections.
- `ema queue add/list/show/ready/block/close` use daemon-backed queue-item
  events and projections.
- `ema lane list` and `ema queue list` honor project scope plus the advertised
  status, mission, and lane filters.
- The daemon owns canonical state; markdown is fallback context or a snapshot,
  not a durable writer.

## Authority Rule

For active coordination, agents must trust this order:

```text
daemon registry -> daemon command result -> CLI projection -> file snapshot -> docs/template
```

The coordination files under `Projects/EMA/atlas/workspace/` are templates or
emergency snapshots unless a command explicitly exports them from the daemon.
Do not treat an empty `CLAIMS.md`, `HANDOFFS_PENDING.md`, `LANES_CATALOG.md`,
`PROTECTED_ZONES.md`, or `BLOCKERS.md` as proof that nobody owns work. Use
`ema agent orient --project <project> --json`,
`ema lane list --project <project> --json`,
`ema queue list --project <project> --json`, and
`ema handoff list --project <project> --json` instead.

## Start Every Session

Run general EMA health and orientation before editing. Do not assume the daemon
current project is the task project; it is just the home/current selection.
When a task names a project, add `--project <name-or-id>` to the workspace
commands that follow.

```bash
ema help
ema ping --json
ema status --json
ema tl about --summary --json
ema vcalendar tick --json
ema doctor --json
```

Agents must run the health commands above plus task-layer commands at the start
of every session. Use unscoped task-layer commands only when the task does not
name a project and cwd inference is the intended scope. `next` gives the
smallest actionable command, compact `tl about` establishes the task-layer map,
and `vcalendar tick` establishes the current planning / execution / review
phase. Use full `ema tl about --json` only when the complete lane and queue
arrays are needed.

If the task names a project or the cwd is not inside the intended project,
scope the task-layer commands explicitly:

```bash
ema next --project <project-name-or-id> --json
ema agent orient --project <project-name-or-id> --json
ema agent meta-progress --project <project-name-or-id> --json
ema cockpit workpack --project <project-name-or-id> --json
```

Generated follow-up commands from `next`, `agent orient`, `agent
meta-progress`, and cockpit workpacks must preserve the resolved project scope
so they can be copied from Desktop, project records, or active builds without
depending on daemon `home_current`.

`ema /tl about --summary --json` is an alias for agents or humans with
slash-command muscle memory. It reports the current daemon registry projection
when available, the fallback project-record snapshot, orientation docs,
enforcement rules, and the current vCalendar phase.

If the daemon is unavailable, read the file-shaped workspace as stale fallback
context only:

```text
Projects/EMA/atlas/workspace/CLAIMS.md
Projects/EMA/atlas/workspace/HANDOFFS_PENDING.md
Projects/EMA/atlas/workspace/LANES_CATALOG.md
Projects/EMA/atlas/workspace/PROTECTED_ZONES.md
Projects/EMA/atlas/workspace/BLOCKERS.md
Projects/<project>/{lanes,queue,handoffs,responsibilities,weekly,checkups,executions}/
```

After daemon recovery, reconcile any useful fallback discovery into daemon
objects with `ema lane`, `ema queue`, `ema handoff`, `ema problem`, or
`ema agent report`; do not keep writing coordination truth into the templates.

## Core Hierarchy

Use these objects consistently:

```text
campaign -> mission -> lane -> queue_item -> execution -> result
                         |
                         +-> handoff
                         +-> checkup
                         +-> problem -> solution -> dependency
                         +-> calendar_block
```

- `campaign`: long-running initiative.
- `mission`: goal-oriented bundle under a campaign.
- `lane`: current ownership track; one owner and exact scope.
- `queue_item`: smallest schedulable follow-up, especially "do later" work.
- `problem`: a discovered obstacle or recurring failure pattern.
- `solution`: an attempted or proposed resolution linked to a problem.
- `calendar_block`: time-shaped commitment or agent virtual work block.
- `checkup`: scheduled review of health, blockage, drift, or readiness.

## Orientation Commands

```bash
ema ping --json
ema status --json
ema tl about --summary --json
ema vcalendar tick --json
ema doctor --json
ema next --project EMA --json
ema agent orient --project EMA --json
ema agent meta-progress --project EMA --json
ema cockpit summary --project EMA --json
ema cockpit projection --project EMA --json
ema intention projection --project EMA --json
ema cockpit intentions --project EMA --json
ema campaign list --project EMA
ema mission list --project EMA
ema lane list --project EMA --status active
ema queue list --project EMA --status ready
ema handoff list --project EMA
ema vcalendar week --project EMA
```

The commands above are the standard cold-start map for any agent. `cockpit`,
`tl`,
`agent orient`, `agent meta-progress`, `next`, and `vcalendar tick` return
daemon lane/queue registry state when the daemon is available and file-shaped
fallback context otherwise. `cockpit` is the project/client/build/surface map;
`next` is the compact "what should I do now?"
answer. `agent meta-progress` is the compact self-progress snapshot: it counts
lane and queue statuses, lists pressure signals, includes recent agent reports,
and names the next action to preserve momentum. Writers that are still pending
return command-shaped stubs rather than fake state. That is intentional: agents
should learn and obey the grammar without mistaking drafts for daemon truth.

For Proslync development, start with:

```bash
ema cockpit projection --project proslync-app-ios-final --json
ema cockpit builds --project proslync-app-ios-final
ema cockpit surfaces --project proslync-app-ios-final
ema cockpit lanes --project proslync-app-ios-final
ema cockpit queue --project proslync-app-ios-final
ema intention projection --project proslync-app-ios-final --json
ema cockpit intentions --project proslync-app-ios-final --json
```

This should show the Ms. Wilson client context, the app/backend/desktop/assets
active builds, and the AD cockpit / Brand HQ / NIL Deal Detail / Backend API
surface registry. Use that projection as the shared workspace map before
claiming lanes or splitting agent scopes.

## Claim Work

Before editing, claim a lane:

```bash
ema lane claim \
  --lane lane:<id-or-title> \
  --actor actor:codex \
  --scope "apps/cli/src/commands/** docs/cli/agent-workspace.md" \
  --goal "CLI exposes agent workspace project-management grammar" \
  --next "add command groups and docs" \
  --refresh-by "15m"
```

If no lane exists yet:

```bash
ema mission create \
  --campaign campaign:<id> \
  --title "Build agent workspace CLI parity" \
  --project EMA \
  --done-when "agents can orient, claim, queue follow-ups, and request handoffs"

ema lane open \
  --mission mission:<id> \
  --title "CLI operating contract" \
  --scope "apps/cli/src/commands/** docs/cli/** Desktop/AGENTS.md Desktop/CLAUDE.md" \
  --done-when "ema help shows workspace commands and docs explain usage"
```

## Log Do-Later Work

When an agent discovers something needed later, it must log a queue item before
moving on:

```bash
ema queue add \
  --title "Promote lane claim writes from stub to daemon writer" \
  --project EMA \
  --mission mission:<id> \
  --lane lane:<id> \
  --why "CLI grammar exists but canonical lane events do not yet write" \
  --depends-on "ema_swarm_coordination writer and shell-protocol command table" \
  --blocked-by "lane.* event family implementation pending" \
  --done-when "ema lane claim appends canonical event and updates workspace projection" \
  --source "docs/cli/agent-workspace.md"
```

Required queue fields:

- `title`
- `why`
- `depends-on` or `blocked-by` when it is not immediately runnable
- `done-when`
- `source` when discovered from a file, command, test, or conversation

## Graph Problems And Solutions

Problems and solutions are first-class because agents repeatedly rediscover the
same blockers. Log the problem, attach solution candidates, and link dependency
edges.

```bash
ema problem log \
  --title "Surface projection shape drift" \
  --project EMA \
  --lane lane:<id> \
  --cause "Two SeeAgentWorkProjection TypeScript shapes exist" \
  --depends-on "surface-core adapter reconciliation" \
  --solution "Pick one projection contract and map file-backed records into it" \
  --source "packages/surface-core/src/**"

ema problem solution \
  --problem problem:<id> \
  --title "Reconcile ProjectionMap before adding new GUI panels" \
  --verify "pnpm -r typecheck and docs contract review"

ema problem link \
  --from problem:<id> \
  --to queue_item:<id> \
  --relation "blocked_by"
```

Recommended relations:

- `depends_on`
- `blocked_by`
- `caused_by`
- `solved_by`
- `regressed_from`
- `recurs_as`
- `supersedes`
- `evidence_for`

## Calendar And Checkups

Use the calendar for both human time and agent virtual work:

```bash
ema vcalendar tick --json

ema vcalendar phase set \
  --actor actor:codex \
  --label "Agent workspace CLI parity"

ema vcalendar block add \
  --actor actor:codex \
  --kind focus \
  --label "Implement project-management CLI stubs" \
  --start "2026-04-29T03:00:00-04:00"

ema checkup schedule \
  --lane lane:<id> \
  --cadence daily
```

Calendar and checkup writes are already daemon-backed in the current EMA CLI.

The self-controlled vCalendar tick divides the day into operational phases:

- intake and orientation
- planning and lane claim
- execution block
- review and checkup
- handoff and next-day queue

Agents should run `ema vcalendar tick --json` at session start, before a major
scope change, before handoff, and whenever a scheduled phase boundary is
crossed.

## Handoffs

Use handoffs when blocked, changing owner, or leaving work in a partial state:

```bash
ema handoff request \
  --from lane:<id> \
  --to actor:runtime-owner \
  --needed "Implement daemon writer for lane.claim and queue.add" \
  --context "CLI stubs and docs are in place; writes still pending" \
  --verify "ema lane claim returns canonical event id" \
  --depends-on "shell-protocol command table"
```

`ema agent prompt` can generate the handoff/delegation packet before a human or
Harness Glue worker takes over:

```bash
ema agent prompt \
  --lane lane:<id> \
  --mode handoff \
  --provider simulated \
  --target actor:harness-glue \
  --objective "Continue the scoped lane and report verification" \
  --json
```

The JSON response includes:

- `prompt`: the copyable external-agent instructions.
- `commands.harness`: `ema harness dispatch` for `simulated`, or
  `ema harness start` for tmux-backed `codex` / `claude-code`.
- `commands.handoff`: a matching `ema handoff request` command.
- `commands.context` and `commands.report`: recovery and closeout commands.

## Report And Meta-Progress Shape

Use `agent meta-progress` when an agent or human asks whether EMA itself is
making progress:

```bash
ema agent meta-progress --actor actor:codex --json
```

The JSON response is under `meta_progress` and includes daemon/source metadata,
vCalendar phase, lane/queue/report totals, status counts, active lane, pressure
signals (`unowned_lanes`, `ready_lanes`, `ready_queue`, `blocked_queue`), the
latest agent reports, and one suggested next action.

Agents should close with:

```bash
ema agent report \
  --actor actor:codex \
  --lane lane:<id> \
  --changed "files touched" \
  --verified "commands run" \
  --risks "what remains unresolved" \
  --next "one concrete next lane or queue item"
```

Human-readable report format:

```text
Implemented:
Verified:
Files changed:
Important decisions:
Risks / next blockers:
Recommended next lane:
Queue items added:
Problem graph updates:
```

## Current Implementation Status

- Live: `ema help`, `ema status`, `ema events tail`, `ema vcalendar *`,
  `ema checkup *`, `ema org create`, `ema space create`, `ema project create`.
- Live daemon workspace writes/projections: `ema campaign *`, `ema mission *`,
  `ema lane *`, `ema queue *`, `ema handoff *`, `ema problem *`.
- Live daemon-plus-fallback orientation/progress: `ema tl about`,
  `ema /tl about`, `ema next`, `ema agent orient`,
  `ema agent meta-progress`, `ema vcalendar tick`.
- Live daemon workspace reports/prompts: `ema agent report`,
  `ema agent prompt`.
- Live diagnostics: `ema doctor` reports daemon/workspace cohesion and exits
  non-zero when missing or partial subsystems remain.
- Harness Glue execution rail: `ema harness providers/status/dispatch/start/
  list/assign/context/events/grep/log/stream/stop`; simulated dispatch is
  usable now, while tmux-backed Codex/Claude workers use file-backed registries
  until daemon projections land.
- CLI-visible projection seeds/stubs: `swarm` remains a See Agent Work grammar
  seed until promoted to a read-only swarm projection.
- File-shaped truth exists now under `Projects/EMA/atlas/workspace/` and
  `Projects/<project>/{lanes,queue,handoffs,responsibilities,weekly,checkups,executions}/`.
- Current daemon owner for lane/queue Slice A: `ema_swarm_coordination`.
