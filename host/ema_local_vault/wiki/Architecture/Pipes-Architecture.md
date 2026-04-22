---
title: "Pipes Architecture"
space: wiki
tags: ["architecture", "pipes", "automation", "verified-2026-04-07"]
source: manual
---

# Pipes Architecture

**Status:** Operational. Registry, Loader, Executor, and EventBus all running on the host daemon.
**Last verified:** 2026-04-07

Pipes are EMA's event-driven automation system. A Pipe binds a trigger pattern (a domain event) to a chain of transforms and actions. When a domain module fires an event through the [[EventBus|EventBus]], the Executor matches it against active pipes, runs the transform pipeline, and executes the resulting actions.

## Supervision

`Pipes.Supervisor` uses `rest_for_one` strategy, so later children restart if an earlier one crashes:

```
Pipes.Supervisor (rest_for_one)
├─ Pipes.Registry      (GenServer — catalog of triggers/actions/transforms)
├─ Pipes.Loader        (GenServer — seeds stock pipes on first boot)
├─ Pipes.Executor      (GenServer — subscribes to PubSub, runs pipes)
└─ Pipes.TaskSupervisor (Task.Supervisor — isolates per-pipe execution)
```

## Schemas

| Schema | Table | Fields | Purpose |
|--------|-------|--------|---------|
| `Pipe` | `pipes` | id, name, system, active, trigger_pattern, description, metadata, project_id | Core pipe definition |
| `PipeAction` | `pipe_actions` | id, pipe_id, action_id, config, sort_order | Action bound to a pipe |
| `PipeTransform` | `pipe_transforms` | id, pipe_id, transform_type, config, sort_order | Transform step in the chain |
| `PipeRun` | `pipe_runs` | id, pipe_id, status, trigger_event, started_at, completed_at, error | Execution audit log |

`trigger_pattern` is validated as `context:event` format (regex: `^[a-z_]+:[a-z_]+$`).

`PipeRun.status` is one of: `success`, `failed`, `skipped`.

`PipeTransform.transform_type` is one of: `filter`, `map`, `delay`, `claude`, `conditional`.

## How Triggers Work

1. A domain module calls `Ema.Pipes.EventBus.broadcast_event("context:event", payload)`.
2. EventBus broadcasts `{:pipe_event, trigger_pattern, payload}` to PubSub topic `"pipe_trigger:#{trigger_pattern}"`.
3. Executor, which subscribes to all active trigger patterns, receives the message.
4. Executor filters for active pipes whose `trigger_pattern` matches, then spawns a supervised task per matching pipe.

Executor also subscribes to `"pipes:config"` so it reloads when pipes are created, updated, or toggled.

## How Actions Work

Each action maps an `action_id` string to a domain function. The Registry holds stock actions; plugins can register additional actions via `Ema.PluginRegistry`.

| action_id | Domain Function |
|-----------|----------------|
| `tasks:create` | `Ema.Tasks.create_task/1` |
| `tasks:transition` | `Ema.Tasks.transition_status/2` |
| `brain_dump:create_item` | `Ema.BrainDump.create_item/1` |
| `proposals:create_seed` | `Ema.Proposals.create_seed/1` |
| `proposals:approve` | `Ema.Proposals.approve_proposal/1` |
| `proposals:redirect` | `Ema.Proposals.redirect_proposal/2` |
| `proposals:kill` | `Ema.Proposals.kill_proposal/1` |
| `projects:create` | `Ema.Projects.create_project/1` |
| `projects:transition` | `Ema.Projects.transition_status/2` |
| `projects:rebuild_context` | Rebuilds project context + broadcasts |
| `responsibilities:generate_due_tasks` | `Ema.Responsibilities.generate_due_tasks/0` |
| `vault:create_project_space` | Bootstraps vault directory structure |
| `vault:create_note` | `Ema.SecondBrain.create_note/1` |
| `vault:search` | Full-text vault search via `VaultSearchAction` |
| `notify:desktop` | Linux `notify-send` with fallback to logger |
| `notify:log` | Logger with configurable level |
| `notify:send` | Multi-channel notification (discord, telegram, pubsub) |
| `claude:run` | Claude AI via Intelligence Router |
| `http:request` | Outbound HTTP request |
| `transform` | Payload field manipulation (set/copy/delete/template/rename) |
| `branch` | Conditional branching on payload field value |

Actions use `safe_apply/3` for dynamic dispatch, which handles missing modules gracefully (returns `{:error, {:not_implemented, ...}}`).

## Transform Pipeline

Events flow through transforms in `sort_order` sequence. Each transform returns `{:ok, payload}` to continue or `{:skip, reason}` to halt the pipe (recorded as "skipped" in PipeRun).

| Type | Behavior |
|------|----------|
| `filter` | Compare payload field against value with operator (eq, neq, gt, gte, lt, lte, in). Drop if no match. |
| `map` | Rename keys and/or merge additional fields into the payload. |
| `delay` | Debounce placeholder. Currently passes through (accumulation not yet implemented). |
| `conditional` | Branch logic: check `if_field` with operator, continue or skip based on result. |
| `claude` | Run Claude AI as a transform step via `ClaudeAction.execute/2`. |

Dotted field paths (e.g., `payload.priority`) are supported in filter/conditional lookups.

## EventBus

`Ema.Pipes.EventBus` is a thin module with one function:

```elixir
EventBus.broadcast_event("tasks:created", %{task_id: id, title: title})
```

Domain modules call this to fire triggers. The broadcast goes to `"pipe_trigger:#{trigger_pattern}"`, which Executor subscribes to.

## Stock Triggers

Registry defines 20 stock triggers across 6 contexts:

| Context | Triggers |
|---------|----------|
| `brain_dump` | `item_created`, `item_processed` |
| `tasks` | `created`, `status_changed`, `completed` |
| `proposals` | `seed_fired`, `generated`, `refined`, `debated`, `queued`, `approved`, `redirected`, `killed` |
| `projects` | `created`, `status_changed` |
| `habits` | `completed`, `streak_milestone` |
| `system` | `daemon_started`, `daily`, `weekly` |

## 7 Stock Pipes (Seeded by Loader)

Loader seeds these on first boot when the DB has zero pipes:

| Pipe Name | Trigger | Actions |
|-----------|---------|---------|
| Approved Proposal -> Task | `proposals:approved` | `tasks:create` + `vault:create_note` (spec) |
| Responsibility Task Generation | `system:daily` | `responsibilities:generate_due_tasks` |
| New Project -> Bootstrap Vault Space | `projects:created` | `vault:create_project_space` |
| Habit Streak Celebration | `habits:streak_milestone` | `notify:desktop` + `vault:create_note` (milestone) |
| Project Context Auto-Rebuild | `tasks:status_changed` | `projects:rebuild_context` (with delay transform) |
| Brain Dump -> Harvest Patterns | `brain_dump:item_created` | `proposals:create_seed` (with filter transform) |
| Daily Digest Generation | `system:daily` | `vault:create_note` (digest) |

## Monitoring

Every pipe execution records a `PipeRun` with status, timing, trigger event data, and error details. The Executor also broadcasts to two PubSub topics:

- `"pipes:monitor"` with `{:pipe_executed, run_summary}` -- for the monitor UI
- `"pipes:runs"` with `{:pipe_run, :completed, run_summary}` -- for run tracking

## CLI

```bash
ema pipe list          # list all pipes
ema pipe create        # create a new pipe
ema pipe execute       # manually execute a pipe
```

## API

REST endpoints under `/api/pipes` via `PipeController`.

## Source Files

| File | Purpose |
|------|---------|
| `daemon/lib/ema/pipes/pipe.ex` | Pipe schema |
| `daemon/lib/ema/pipes/pipe_action.ex` | PipeAction schema |
| `daemon/lib/ema/pipes/pipe_transform.ex` | PipeTransform schema |
| `daemon/lib/ema/pipes/pipe_run.ex` | PipeRun schema |
| `daemon/lib/ema/pipes/registry.ex` | Catalog GenServer (stock triggers, actions, transforms) |
| `daemon/lib/ema/pipes/loader.ex` | First-boot pipe seeder |
| `daemon/lib/ema/pipes/executor.ex` | PubSub subscriber + execution engine |
| `daemon/lib/ema/pipes/event_bus.ex` | Domain event broadcaster |
| `daemon/lib/ema/pipes/actions/` | Specialized action modules (ClaudeAction, VaultSearchAction, etc.) |

## Related

- [[Pipes & Routines]] -- app page for the frontend Pipes UI
- [[Proposal-Pipeline]] -- the proposal engine pipeline is a separate system from generic pipes, though proposals fire pipe triggers at each stage
- [[Execution-System]] -- approved proposals create executions, which is a different lifecycle

#architecture #pipes #automation
