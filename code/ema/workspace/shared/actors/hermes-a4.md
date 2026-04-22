# hermes-a4 — daemon/CLI-facing agent workspace UX

- actor: hermes-a4
- created_at: 2026-04-21T04:56Z
- status: draft
- scope: agent discovery and operating experience across shared workspace + canon + daemon/runtime

## Goal

Define the minimum EMA experience that lets an agent answer, from one CLI/daemon-facing flow:

1. what work exists for me
2. what is scheduled now/next
3. what handoffs need my attention
4. what my current agenda is
5. what sessions are active or resumable
6. what is canonical vs local vs live

This should feel like **one workspace**, while preserving EMA’s authority boundaries.

## Design stance

The UX should be built around a single rule:

> **Agents consume a computed workspace packet, not a pile of unrelated stores.**

That packet is assembled from three layers:

### 1. Canonical layer
Durable meaning and approved work lineage.

Use for:
- intents
- proposals
- decisions
- executions
- durable cadence definitions
- stable project/agent identities

### 2. Runtime/control-plane layer
Live operational truth.

Use for:
- what is running now
- active execution state
- active session bindings
- daemon health
- current ownership/dispatch state
- operator/project context packages

### 3. Shared workspace layer
Operational collaboration overlay.

Use for:
- handoffs
- actor-local notes
- near-term schedules/blocks
- session breadcrumbs
- swarm coordination docs
- temporary task/schedule exports or computed views

## Core UX principle

The agent should not have to manually inspect:

- `workspace/shared/handoffs/`
- `workspace/shared/schedules/`
- `workspace/shared/sessions/`
- canon markdown
- control-plane APIs
- current execution/session state

as separate universes.

Instead, EMA should provide an **actor-scoped synthesized view** that says:

- here is your current assignment
- here is your time context
- here are your unread handoffs
- here are the tasks nearest to your scope
- here is the active/resumable session state
- here is the next recommended action

## Recommended v1 user experience

## Primary command

```bash
ema workspace open --actor <actor-id> [--project <id|slug>]
```

This should become the agent-facing landing command.

Purpose:
- resolve actor identity
- discover relevant workspace artifacts
- pull operator/project context
- compute agenda
- show handoffs and sessions
- produce one packet suitable for session bootstrapping

If EMA wants to reduce new surface area, this can also be exposed as:

```bash
ema work packet --actor <actor-id> [--project <id|slug>]
```

but conceptually it is a **workspace-opening** action, not only a task action.

## Secondary commands

These should be thin views over the same synthesized packet/index.

```bash
ema agenda --actor <actor-id> [--now|--today|--next 5]
ema handoff inbox --actor <actor-id>
ema session list --actor <actor-id>
ema schedule show --actor <actor-id> [--day <date>]
ema workspace inspect --actor <actor-id> --json
```

## Agent start-of-work loop

Recommended loop:

1. `ema workspace open --actor <id> --project <project>`
2. review agenda + handoff inbox + active sessions
3. if work is already bound, resume it
4. if no work is bound, choose from recommended tasks
5. `ema work start ...`
6. during execution: `ema work sync ...`
7. on completion/blocking: leave handoff and/or update workspace state

This extends the current CLI coordination plan instead of replacing it.

## What the agent should see

## 1. Current focus section

The first block should answer:

- what project am I in
- what task/execution is mine right now
- is there already an active session
- what should I do next

Example shape:

```text
Actor: hermes-a4
Project: ema
Current task: task_123 | Define daemon/CLI-facing agent workspace UX
Execution: exe_456 (running)
Session: ema-hermes-a4 (active)
Next action: continue current draft and sync completion into shared actor file
```

## 2. Agenda section

This is the actor’s computed temporal view.

Inputs:
- workspace schedule blocks
- canonical schedule/cadence metadata
- runtime active execution state
- blocking references
- current time

Ordering:
1. active execution-backed work
2. blocks whose `scheduled_window` contains now
3. near-upcoming queued/ready items
4. unscheduled ready items
5. missed items if requested

This should reuse the temporal model proposed by `claude-a2`:
- `scheduled_window`
- `phase`
- `cadence_ref`

## 3. Handoff inbox section

An actor should immediately see:
- handoffs addressed to them
- stale handoffs they authored but have not closed
- blocking handoffs related to their current task/execution

This should read from:
- `workspace/shared/handoffs/*.md`

Minimal v1 behavior:
- directed by frontmatter/body fields like `to: <actor-id>`
- sorted newest first
- show unread/open status heuristically if no explicit state exists yet

## 4. Task neighborhood section

The actor should see not the entire universe, but the relevant work neighborhood:

- bound task/execution
- nearby pending tasks in same project
- tasks already owned by other active agents
- blocked tasks linked to current context
- optional proposal lineage if this task came from a proposal

This should mainly come from runtime/canonical APIs, not workspace files.

Important rule:
- `workspace/shared/tasks/` may contain exported or computed views
- it should **not** become a second task database

## 5. Session section

The actor should see:

- active session bound to this actor
- resumable host sessions in relevant project/cwd
- execution ↔ session linkage
- workspace session breadcrumb files if present

This is where shared workspace and runtime meet:
- runtime says what is alive now
- host session import says what is resumable
- workspace breadcrumbs say what another agent/operator wanted others to notice

## Source-of-truth matrix

| Concern | Primary source | Secondary overlay | CLI view |
|---|---|---|---|
| current task ownership | runtime/control-plane | actor file reflection | `ema workspace open`, `ema work packet` |
| approved work lineage | canon + control-plane | none | packet lineage block |
| agenda timing | workspace schedules + canon cadence | runtime active state | `ema agenda`, workspace open |
| handoffs | shared workspace | none | `ema handoff inbox` |
| active sessions | runtime sessions | workspace breadcrumbs | `ema session list`, workspace open |
| resumable sessions | host session import/runtime cache | workspace breadcrumbs | `ema session list --resumable` |
| swarm assignment memo | swarm dispatch + actor file | handoffs | workspace open |
| recommended next action | daemon-computed synthesis | none | workspace open headline |

## Proposed daemon model

## Workspace synthesis service

EMA should add a daemon-side service that produces an **actor workspace packet**.

Suggested module role:

```text
Ema.Workspace.Synthesizer
```

Responsibilities:
- read workspace index/cache
- query control-plane/runtime state
- query operator/project context packages
- merge results into actor-scoped packet
- compute recommended next action
- expose stable API to CLI/TUI/GUI

This is not a new source of truth.
It is a **read model**.

## Required daemon inputs

### From workspace index
- actor file
- handoff files addressed to actor
- schedule files for actor/project
- session breadcrumb files referencing actor/project
- swarm dispatch/assignment docs

### From runtime/control-plane
- operator status/context
- project context
- tasks and executions
- active session registry
- live execution/session facts

### From canon
- approved proposal/execution lineage
- stable actor/project refs
- durable cadence definitions when present

## Proposed packet shape

```yaml
actor:
  id: hermes-a4
  harness: Hermes
  role: daemon/CLI-facing agent workspace UX

subject:
  project_id: pro_ema0001
  project_name: EMA
  task_id: task_123
  task_title: Define daemon/CLI-facing agent workspace UX
  execution_id: exe_456
  agent_id: hermes-a4

status:
  actor_status: active
  execution_status: running
  session_status: active

operator_context:
  summary: ...

project_context:
  summary: ...

agenda:
  now: [...]
  next: [...]
  blocked: [...]
  missed: [...]

handoffs:
  inbox: [...]
  authored_open: [...]

sessions:
  active: [...]
  resumable: [...]
  breadcrumbs: [...]

task_neighborhood:
  bound: ...
  nearby_pending: [...]
  occupied_by_others: [...]

workspace_refs:
  actor_file: workspace/shared/actors/hermes-a4.md
  handoff_files: [...]
  schedule_files: [...]
  session_files: [...]

recommended_next_action:
  kind: resume_bound_execution
  summary: Continue exe_456 in session ema-hermes-a4 and sync completion when done

notes:
  - workspace overlay contains 1 open handoff
  - active session exists and should be resumed before spawning a new one
```

## Proposed API surface

## Read endpoints

```text
GET /api/workspace/actors/:actor_id/packet
GET /api/workspace/actors/:actor_id/agenda
GET /api/workspace/actors/:actor_id/handoffs
GET /api/workspace/actors/:actor_id/sessions
GET /api/workspace/actors/:actor_id/assignments
```

## Optional mutation endpoints later

Not required for first slice, but eventually useful:

```text
POST /api/workspace/actors/:actor_id/handoffs/:handoff_id/ack
POST /api/workspace/actors/:actor_id/session/attach
POST /api/workspace/actors/:actor_id/workspace-sync
```

Important:
- these mutations should update runtime/workspace overlays only where appropriate
- they should not silently rewrite canon

## CLI surface recommendation

## 1. `ema workspace open`

Best default entrypoint for agents.

Example:

```bash
ema workspace open --actor hermes-a4 --project ema
```

Output sections:
- actor + project header
- current focus
- agenda now/next
- handoff inbox
- active/resumable sessions
- nearby tasks
- recommended next action

JSON mode should return the full packet.

## 2. `ema agenda`

Already proposed elsewhere and should remain the temporal-focused view.

Example:

```bash
ema agenda --actor hermes-a4 --today
```

This is narrower than `workspace open`.
It answers “what should happen when.”

## 3. `ema handoff inbox`

Example:

```bash
ema handoff inbox --actor hermes-a4
```

Shows:
- unread/open handoffs to actor
- subject
- from
- age
- linked task/execution refs
- one-line requested next action

## 4. `ema session list`

Example:

```bash
ema session list --actor hermes-a4
```

Shows:
- active runtime session
- resumable imported host sessions
- task/execution linkage
- attach/resume hint

## 5. `ema work start` and `ema work sync`

These remain the action verbs.

The workspace UX should feed them, not replace them.

Relationship:

- `ema workspace open` = orient
- `ema agenda` = prioritize
- `ema work start` = claim/begin
- `ema work sync` = keep ledger current
- `ema handoff ...` = transfer context
- `ema session ...` = attach/resume live substrate

## Recommended file/index conventions for discoverability

To make the daemon synthesis reliable, workspace files should include minimal machine-readable headers.

## Actor file
Should include:
- actor_id
- harness
- role
- status
- assignment
- updated_at

## Handoff file
Should include:
- from
- to
- subject
- created_at
- task_ref or execution_ref when applicable
- status: open|acknowledged|closed (recommended)

## Schedule/block file
Should include:
- actor
- project_ref
- scheduled_window
- phase
- cadence_ref
- task_ref or intent/proposal/execution ref when relevant

## Session breadcrumb file
Should include:
- actor
- provider
- session_id
- cwd/project_ref
- execution_ref or task_ref
- status
- updated_at

Without these fields, synthesis becomes brittle.

## Recommended agenda computation rules

The agent agenda should be computed from all relevant layers, but with clear precedence.

### Precedence

1. runtime-active execution/session truth
2. explicit workspace schedule blocks
3. canon-backed schedule/cadence definitions
4. unscheduled ready tasks from runtime/canonical task sources
5. handoff urgency as an interrupt signal

### Interrupt rules

A handoff should rise into the agenda when:
- it is addressed to the actor
- it references the actor’s current task/execution
- it is marked blocking/urgent
- it is newer than the actor’s last update on that work

### Session-aware rule

If an active or resumable session exists for the bound execution, the recommended next action should prefer:
- resume/attach
over
- create a new session

This preserves continuity.

## Anti-duplication rules

This UX only works if EMA does not let every layer become its own task app.

### Rule 1
`workspace/shared/tasks/` is for computed or exported views, not canonical task storage.

### Rule 2
Agenda is always computed from source fields; do not persist a second “agenda database.”

### Rule 3
Workspace actor files may reflect assignment, but runtime/control-plane owns active execution truth.

### Rule 4
Session breadcrumb files are orientation artifacts, not the authority on whether a session is alive.

### Rule 5
If a workspace artifact becomes durable truth, promote it into canon/docs/control-plane explicitly.

## Minimal v1 implementation slice

If scope must stay tight, land exactly this:

### Daemon
- workspace index over `actors/`, `handoffs/`, `schedules/`, `sessions/`, `swarm/`
- actor packet synthesis service
- `GET /api/workspace/actors/:actor_id/packet`

### CLI
- `ema workspace open --actor <id> [--project <id>]`
- `ema handoff inbox --actor <id>`
- reuse existing:
  - `ema work start`
  - `ema work sync`
  - `ema agenda` once implemented
  - `ema agent ps` / session list equivalents

### Packet contents
- current focus
- agenda now/next
- handoff inbox
- active/resumable sessions
- nearby pending tasks
- recommended next action

That is enough to create a coherent agent workspace experience without overbuilding.

## Bottom line

The daemon/CLI-facing EMA workspace should be:

- **actor-scoped**
- **computed**
- **session-aware**
- **agenda-aware**
- **handoff-aware**
- **strict about authority boundaries**

The right v1 experience is not “go inspect five folders and three APIs.”
It is:

1. `ema workspace open --actor <id>`
2. get one synthesized packet
3. act through `ema work start/sync`
4. rely on agenda, handoff, and session views as focused projections of the same merged model

That gives EMA a real agent workspace surface while keeping canon durable, runtime live, and shared workspace collaborative.
