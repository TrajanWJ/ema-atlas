---
title: "Execution System"
space: wiki
tags: ["architecture", "executions", "verified-2026-04-06"]
source: manual
---

# Execution System

**Status:** Operational. Dispatcher, Router, IntentFolder, and full execution lifecycle all implemented and running on the host daemon.
**Last verified:** 2026-04-06

An Execution is the first-class runtime object linking brain dump items, intents, proposals, and agent sessions to concrete outcomes. Intents are semantic and durable; executions are runtime, fast-changing, and disposable.

## Components

Source: `daemon/lib/ema/executions/`

| Module | File | Purpose |
|--------|------|---------|
| `Ema.Executions` | `executions.ex` | Context module — CRUD, transitions, approval, completion |
| `Ema.Executions.Execution` | `execution.ex` | Ecto schema |
| `Ema.Executions.Dispatcher` | `dispatcher.ex` | GenServer subscribing to dispatch events, delegates to Claude |
| `Ema.Executions.Router` | `router.ex` | Pure classification — mode phases, outcome signals, role mapping |
| `Ema.Executions.IntentFolder` | `intent_folder.ex` | Manages `.superman/intents/<slug>/` filesystem lifecycle |
| `Ema.Executions.Event` | `event.ex` | Execution event schema |
| `Ema.Executions.AgentSession` | `agent_session.ex` | Per-execution agent session schema |

## Execution Schema

Source: `daemon/lib/ema/executions/execution.ex`

Table: `executions`. Primary key: random 8-byte URL-safe base64 string.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated |
| `title` | string | Required |
| `objective` | string | What to accomplish |
| `mode` | string | Required. One of: `research`, `outline`, `implement`, `review`, `harvest`, `refactor` |
| `status` | string | Required. One of: `created`, `proposed`, `awaiting_approval`, `approved`, `delegated`, `running`, `harvesting`, `completed`, `failed`, `cancelled` |
| `requires_approval` | boolean | Default true |
| `project_slug` | string | |
| `intent_slug` | string | Links to intent and `.superman/intents/` folder |
| `intent_path` | string | Filesystem path for intent folder |
| `result_path` | string | Path to result artifact |
| `brain_dump_item_id` | string | Origin brain dump item |
| `proposal_id` | string | FK to proposal |
| `task_id` | string | FK to task |
| `session_id` | string | FK to Claude session |
| `git_diff` | string | Captured git diff after completion |
| `space_id` | string | Multi-space support |
| `actor_id` | string | Actor tracking |
| `metadata` | map | Arbitrary metadata |
| `completed_at` | utc_datetime | |

## Execution Lifecycle

### Creation

`Ema.Executions.create/1`:

1. Generates a random ID
2. Resolves `project_slug` from `project_id` if needed
3. Generates `intent_slug` from objective/title if not provided
4. Sets `intent_path` to `.superman/intents/<slug>`
5. Creates the intent folder on disk via `IntentFolder.create/3` (if it doesn't exist)
6. Inserts the execution record
7. Records a `"created"` event
8. If `requires_approval` is false, auto-transitions to `"approved"` and dispatches

### Dispatch

When an execution reaches `"approved"` status with `requires_approval: false`, the context broadcasts on `"executions:dispatch"`:

```
Phoenix.PubSub.broadcast(Ema.PubSub, "executions:dispatch", {:dispatch, execution})
```

### Completion

Two completion paths:

- `on_session_completed/2` — Called when a linked Claude session finishes. Classifies outcome via Router, patches intent files, broadcasts completion.
- `on_execution_completed/2` — Called by Dispatcher after Claude run. Writes result artifact to `~/.local/share/ema/results/<execution_id>/result.md`, patches intent files, triggers `Ema.Intelligence.ReflectionLoop.reflect_async/2`.

Both paths broadcast on PubSub topics `"executions"` with event `"execution:completed"`.

## Dispatcher

Source: `daemon/lib/ema/executions/dispatcher.ex`

`Ema.Executions.Dispatcher` is an always-on GenServer started in the supervision tree. It subscribes to `"executions:dispatch"` PubSub topic.

### Dispatch Flow

1. **Receive** `{:dispatch, execution}` from PubSub
2. **Spawn** async task via `Ema.TaskSupervisor`
3. **Build packet** — structured delegation data (execution_id, project_slug, intent_slug, agent_role, objective, success_criteria, read_files, write_files, constraints, mode)
4. **Format prompt** — render packet as markdown instruction document
5. **Scope check** — `ScopeAdvisor.check/3` warns if recent outcomes show repeated failures
6. **Context injection** — `ContextBuilder.build_context/1` assembles local context (recent outcomes, vault preferences, daily note)
7. **Project context** — `ProjectWorker.get_context/1` injects project-specific tasks/proposals/history
8. **Reflexion injection** — `ReflexionInjector.build_prefix/3` prepends lessons from past executions
9. **Create agent session** record in DB
10. **Transition** execution to `"running"`
11. **Execute** — Attempts streaming via `Ema.Claude.Bridge` (preferred), falls back to `Ema.Claude.AI.run/2`
12. **On success** — Complete agent session, call `on_execution_completed/2`, record outcome, capture git diff, link intent
13. **On failure** — Record failure, transition to `"failed"`, record outcome

### Intent Auto-Linking

Source: `dispatcher.ex` (`maybe_link_intent_to_execution/1`)

After successful execution, the Dispatcher looks up the execution's `intent_slug` in the Intent Engine. If found, it creates an `IntentLink` with `role: "derived"` and `provenance: "execution"`. This happens automatically for every successful dispatch.

### Agent Role Mapping

The Router maps execution modes to agent roles:

| Mode | Role | Phase |
|------|------|-------|
| `research` | researcher | 1 (exploration) |
| `outline` | outliner | 2 (specification) |
| `implement` | implementer | 3 (execution) |
| `review` | reviewer | 4 (validation) |
| `refactor` | refactorer | 4 (maintenance) |
| `harvest` | harvester | 5 (maintenance) |

## Router

Source: `daemon/lib/ema/executions/router.ex`

Pure classification module — no side effects, no database, no PubSub.

**`classify/2`** — Takes mode and result_summary, returns mode_class, phase, outcome_signal, agent_role, eligible_next_modes.

**`classify_outcome/1`** — Heuristic classification:
- Starts with `"FAILED:"` or contains `"** (exit"` or `"^ERROR:"` → `:failed`
- < 100 bytes → `:partial`
- Has markdown headers and > 200 bytes → `:success`
- >= 300 bytes → `:success`
- Otherwise → `:partial`

**`infer_mode_from_text/1`** — Text-based mode inference from keywords.

**Mode success criteria and file mappings** — Each mode defines which files to read/write in the intent folder:

| Mode | Read Files | Write Files |
|------|-----------|-------------|
| research | intent.md, signals.md | research.md |
| outline | + research.md | outline.md, decisions.md |
| other modes | intent.md, signals.md | result.md |

## IntentFolder

Source: `daemon/lib/ema/executions/intent_folder.ex`

Manages `.superman/intents/<slug>/` directories on disk. These are the filesystem-level intent scratchpads.

**`create/3`** — Creates directory with `intent.md` and `status.json`
**`write_result/3`** — Writes `result.md` with timestamped header
**`append_log/5`** — Appends to `execution-log.md` with execution ID, mode, and result
**`read_status/2`** — Reads `status.json`
**`exists?/2`** — Checks if directory exists
**`slugify/1`** — Converts text to URL-safe slug (lowercase, max 60 chars)

## Intent Status Computation

Source: `daemon/lib/ema/executions/executions.ex` (`compute_intent_status/2`)

Aggregates execution history to compute intent progress:

- Cancelled executions never count
- Any active execution → `in_progress` (50%)
- `implement` completed → `completed` (100%)
- `outline` completed → `outlined` (75%)
- `research` completed → `researched` (40%)
- All failed, none active → `blocked` (0%)

## Event Schema

Source: `daemon/lib/ema/executions/event.ex`

Table: `execution_events`. Tracks lifecycle events.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `execution_id` | string | FK |
| `type` | string | Event type (e.g. `created`, `status_changed`, `dispatch_started`, `completed`, `failed`) |
| `actor_kind` | string | One of: `system`, `user`, `agent`, `harvester`, `pipe` |
| `payload` | map | Event-specific data |
| `at` | utc_datetime | |

## AgentSession Schema

Source: `daemon/lib/ema/executions/agent_session.ex`

Table: `agent_sessions`. One per dispatch attempt.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `execution_id` | string | FK |
| `agent_role` | string | One of: `implementer`, `researcher`, `reviewer`, `refactorer`, `harvester`, `outliner` |
| `status` | string | One of: `pending`, `running`, `completed`, `failed`, `cancelled` |
| `prompt_sent` | string | Full prompt text |
| `result_summary` | string | Result text |
| `started_at` / `ended_at` | utc_datetime | |
| `metadata` | map | Contains the dispatch packet |

## PubSub Events

| Topic | Event | Purpose |
|-------|-------|---------|
| `"executions"` | `"execution:created"` | New execution created |
| `"executions"` | `"execution:updated"` | Status transition |
| `"executions"` | `"execution:completed"` | Execution finished (includes signal) |
| `"executions:dispatch"` | `{:dispatch, execution}` | Triggers Dispatcher |
| `"executions:<id>:stream"` | `{:stream_chunk, data}` | Live streaming output from Bridge |

## Related

- [[Intent-System]]
- [[Proposal-Pipeline]]
- [[EMA-Overview]]
- [[MCP-Topology]]
