# codex-a7 — tasks/computed views design

- owner: codex-a7
- created_at: 2026-04-21T04:56:00Z
- status: proposed
- scope: define how tasks, todos, boards, and agendas remain computed views over canonical entities and runtime/workspace overlays instead of becoming a second task database

## Thesis

EMA should not store “tasks”, “todos”, “boards”, and “agendas” as independent durable truth objects by default.

Instead:

- **canonical graph** stores durable work meaning and lineage
- **runtime/control plane** stores live claims, activity, heartbeats, and session state
- **shared workspace** stores collaboration overlays, local scheduling notes, handoffs, and view definitions
- **task/todo/board/agenda surfaces** are **computed joins** over those sources

If EMA gets this wrong, it will create the most common failure mode of project systems: a second stale task list that drifts from the actual intents/proposals/executions.

## Core rule

A “task” in EMA v1 is usually not its own canonical entity type.

A task-like item shown in CLI/UI is normally a **projection** of one or more of:

- an `intent`
- a `proposal`
- an `execution`
- a `decision`
- a `relation` such as `blocks`
- a schedule block / temporal record
- a handoff with an explicit ask
- runtime claim/execution state
- workspace-local coordination overlays

That means the system should answer:

- “what is the underlying entity?”
- “why is this actionable now?”
- “where should updates be written back?”

before it ever renders a checkbox or board card.

## Anti-duplication principle

Every actionable row/card must have a stable provenance tuple:

```yaml
source_kind: canonical | runtime | workspace_overlay | computed
source_ref: int_* | prp_* | exe_* | dec_* | handoff:* | block:* | relation:*
view_reason: next_action | assigned | scheduled_now | blocked | handoff_ask | followup
writeback_target: canon_entity | runtime_claim | workspace_handoff | workspace_schedule
```

If EMA cannot populate those fields, it should not present the item as a normal task.

This prevents “orphan tasks” with no authoritative home.

## What lives where

## 1. Canonical graph: durable work meaning

Canon should hold the semantics of work:

- `intent` = durable desired outcome / goal
- `proposal` = candidate plan/change against an intent or project
- `decision` = approval/rejection/supersession
- `execution` = actual performed work
- `relation` = typed dependency such as `blocks`
- future optional `cadence` or temporal records

Canon may include fields like:

- `status`
- `priority`
- `owner_ref` / `actor_refs`
- `next_action`
- `blocked_by`
- `scheduled_window`
- `phase`

But canon should not store redundant board columns, duplicated todos, or multiple alternate task copies.

## 2. Runtime/control plane: live operational truth

Runtime should hold:

- claims/reservations
- currently active execution
- session bindings
- heartbeats
- pause/resume state
- stale/running/crashed state
- dispatch assignments
- “someone is already working on this”

This is how EMA knows whether a computed task is actually actionable now.

## 3. Shared workspace: overlays, definitions, exports

`workspace/shared/` should hold:

- handoffs
- local schedule blocks
- swarm assignment overlays
- actor notes
- task view definitions
- generated task/agenda exports

`workspace/shared/tasks/` should contain only:
1. **view definitions**
2. **generated read-only exports**

It should not become a freeform permanent store of independent task facts.

## Hard rule for `workspace/shared/tasks/`

Allowed:
- `views/*.md` or similar: declarative definitions of computed task lists/boards
- `exports/*.md|json`: generated snapshots of those views
- small README/templates describing how views work

Not allowed as durable truth:
- standalone markdown todos with no canonical ref
- long-lived board cards that do not point to canon/runtime records
- “done” tracking that is not mirrored back to canon/runtime
- duplicated assignment state separate from runtime claims

## The canonical unit of actionability

EMA should compute actionability from a normalized internal shape.

Example internal record:

```yaml
task_key: task:int_intent123:next_action
title: Establish computed-view discipline for tasks
source_kind: canonical
source_ref: int_intent123
derived_from:
  - int_intent123
  - rel_blocks_77
  - handoff:hermes-a4--review
project_ref: pro_ema0001
actor_refs:
  - agt_codex_a7
status: ready
phase: queued
priority: 2
scheduled_window:
  start: 2026-04-21T09:00:00Z
  end: 2026-04-21T10:00:00Z
blocked_by:
  - int_other456
claim:
  actor_ref:
  status: unclaimed
view_reason:
  - assigned
  - scheduled_now
writeback_target:
  kind: canon_entity
  ref: int_intent123
```

Important:
- `task_key` is a projection id, not a new durable entity id
- `source_ref` points back to the real record
- `derived_from` explains why the row exists
- `writeback_target` tells CLI where mutations belong

## What creates a task projection

The daemon/indexer should derive task-like rows from explicit rules.

### From canonical intents
Render an intent as a task when all are true:
- `status` is active/open
- there is unfinished work implied by `next_action`, open executions, or missing approved proposal/execution
- it is not superseded or completed
- it is not blocked beyond all possible action

### From proposals
Render a proposal as a task when:
- proposal status is `proposed` and needs review
- proposal status is approved and needs execution planning
- proposal has requested changes
- proposal is assigned to an actor for refinement

### From executions
Render an execution as a task when:
- it is `planned`, `active`, `paused`, or `failed`
- it needs resume, closeout, or follow-up
- artifacts or outcome are incomplete

### From handoffs
Render a handoff as a task when:
- it contains an explicit `ask`
- status is open/unacked
- it is addressed to the actor or actor role

### From schedule blocks
Render a schedule block as a task amplifier, not as the root semantic item, when possible.

### From relations
Render dependency/bottleneck tasks from relations such as:
- `blocks`
- `depends_on`
- `supersedes`

## Writeback discipline

A computed row may be edited by the user, but the mutation must go to the right authority.

### Allowed writebacks

Checkbox “done”:
- intent-derived task → update intent status or clear `next_action`; maybe create/close execution
- execution-derived task → mark execution `completed`
- handoff-derived task → mark handoff `resolved`
- schedule-only local block → mark block `done`
- proposal-review task → create decision or update proposal review state

Claim / unclaim:
- write to runtime claim store, not to task export markdown

Move on board:
- map board column to source mutation
- never write “column: In Progress” only to a board file

Reprioritize:
- write to canonical entity or runtime queue metadata, depending on source

## View types

EMA should support four view types in v1.

### 1. Task list view
A filtered table of actionable projections.

### 2. Todo view
A narrower task list intended for immediate action.
Rule: “todo” is just a presentation mode over the task list, not a separate persistence model.

### 3. Board view
A board is a grouping/projection of task rows into columns.
Board columns should be functions of normalized state, not independent card stores.

### 4. Agenda view
An agenda is a time-aware computed view over the same projections plus temporal overlays.

## Recommended board/agenda computation pipeline

1. index canonical entities
2. index workspace overlays
3. load runtime claims/session/execution state
4. derive normalized actionable projections
5. attach temporal information
6. classify projection state
7. render requested view shape: task list, todo list, board, agenda

Compute once into a normalized projection model, then render many views.
Do not implement separate derivation logic for tasks, todos, boards, and agendas independently.

## Normalized projection states

Use a shared state vocabulary:
- `inbox`
- `ready`
- `active`
- `paused`
- `blocked`
- `waiting`
- `done`
- `canceled`
- `stale`

All views should derive from these states.

## Distinguish source class from presentation class

Every rendered item should expose both:

```yaml
source_class: intent | proposal | execution | handoff | block | relation
presentation_class: task | todo | board_card | agenda_item
```

Same source, many presentations.

## File design for `workspace/shared/tasks/`

Recommended shape:

```text
workspace/shared/tasks/
├── README.md
├── views/
│   ├── actor--codex-a7.md
│   ├── swarm--meta-build.md
│   └── project--ema.md
├── exports/
│   ├── actor--codex-a7--latest.md
│   ├── actor--codex-a7--latest.json
│   ├── swarm--meta-build--latest.md
│   └── agenda--today--latest.md
└── templates/
    ├── task-view.md
    └── board-view.md
```

Generated exports should be clearly marked:

```yaml
generated: true
generated_at: 2026-04-21T05:00:00Z
view_ref: view-actor-codex-a7
authoritative: false
```

## CLI behavior that preserves authority

- `ema task list` → returns normalized projections with source metadata
- `ema task show <task-key>` → shows source entity, derived reasons, runtime state, writeback target
- `ema task claim <task-key>` → writes a runtime claim
- `ema task done <task-key>` → performs source-specific mutation
- `ema board show <view-id>` → computes columns from normalized states
- `ema agenda` → builds a time-sorted projection list using the same normalized model

## How to handle true ad hoc todos

Some ad hoc items will exist before they are canonicalized. EMA should allow them, but constrain them.

Allowed temporary local items:
- actor-local reminder
- handoff ask
- short schedule block
- swarm coordination follow-up

They must live as one of:
- handoff
- schedule block
- actor note
- inbox/intake item

They should not silently masquerade as first-class canonical tasks.

## Orphan prevention rules

Mark an item as `orphan_overlay` if it appears actionable but has no clear source or writeback target.

Default behavior:
- show warning
- exclude from normal authoritative views unless `--include-orphans`
- suggest promotion or rewrite into handoff/schedule/canon

## Minimal validation rules

Reject or warn when:
1. a generated export is edited manually
2. a task-view file includes task completion state
3. a board definition stores independent card ids not mapped to source refs
4. two exports disagree on state for the same source ref
5. a task row has no `source_ref`
6. a mutation target is ambiguous
7. workspace-local item is older than threshold and still unpromoted

## Concrete v1 recommendations

1. Do **not** add a canonical `task` entity yet.
2. Add a normalized internal projection model in daemon/CLI.
3. Treat `workspace/shared/tasks/` as `view definitions + generated exports` only.
4. Require every rendered task/card/item to expose `source_ref` and `writeback_target`.
5. Use one shared state vocabulary across list/board/agenda rendering.
6. Route all mutations back to canon/runtime/workspace-overlay sources.
7. Warn aggressively on orphan task artifacts.
8. Prefer promoting durable ad hoc work into canon rather than letting task markdown accumulate forever.

## Short version

Boards, todos, and agendas should be to EMA what SQL views are to tables:

- useful
- queryable
- renderable in many shapes
- sometimes materialized for speed or readability
- never mistaken for the underlying source of truth
