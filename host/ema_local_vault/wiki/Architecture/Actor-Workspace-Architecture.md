---
title: "Actor & Workspace Architecture"
space: wiki
tags: ["architecture", "actors", "workspace", "agents", "verified-2026-04-07"]
source: manual
---

# Actor & Workspace Architecture

**Status:** Operational, bootstrapped on startup.
**Last verified:** 2026-04-07

Actors are first-class participants in EMA -- human or agent -- with their own executive management state, phase cadence, capabilities, and workspace tools. The Actor system provides the identity and collaboration layer; the [[Agent-Network|Agent system]] provides the operational worker runtime.

## Current Actors

4 actors bootstrapped on startup: 1 human + 3 agents.

| Slug | Type | Source |
|------|------|--------|
| `trajan` | human | Hardcoded in Bootstrap |
| `strategist` | agent | Synced from `Agents.list_active_agents()` |
| `coach` | agent | Synced from `Agents.list_active_agents()` |
| `archivist` | agent | Synced from `Agents.list_active_agents()` |

## Actor Schema

Table: `actors`

| Field | Type | Notes |
|-------|------|-------|
| id | string (PK) | Random 8-byte URL-safe base64 |
| slug | string | Unique per space, format `^[a-z0-9][a-z0-9-]*$` |
| name | string | Display name (1-100 chars) |
| actor_type | string | `human` or `agent` |
| phase | string | `idle`, `plan`, `execute`, `review`, `retro` (default: idle) |
| phase_started_at | utc_datetime | When current phase began |
| status | string | `active`, `paused`, `archived` |
| capabilities | string | JSON-encoded list (default: "[]") |
| config | map | Arbitrary config (model, role, tools for agents) |
| space_id | string (FK) | Belongs to `Ema.Spaces.Space` |

## Bootstrap

`Ema.Actors.Bootstrap.ensure_defaults/0` runs on application startup. Idempotent.

1. **Human actor:** Creates `trajan` (human, active, idle) if not present.
2. **Agent actors:** Calls `Ema.Agents.list_active_agents()`, creates an actor record for each agent that lacks one. Copies `model`, `role`, and `tools` into the actor's `config` map.
3. **FK backfill:** If an agent exists but has no `actor_id`, updates the agent record with the actor's ID.

Default space: `sp_default`.

## Phase Cadence

Actors cycle through phases: `idle` -> `plan` -> `execute` -> `review` -> `retro`.

Phase transitions are recorded in the `phase_transitions` table as an append-only log.

### PhaseTransition Schema

| Field | Type | Notes |
|-------|------|-------|
| id | string (PK) | Random ID |
| actor_id | string (FK) | Required |
| space_id | string | Optional scope |
| project_id | string | Optional scope |
| intent_id | string | Links transition to an [[Intent-System|intent]] |
| from_phase | string | Previous phase |
| to_phase | string | Required |
| week_number | integer | For sprint cycle tracking |
| reason | string | Why the transition happened |
| summary | string | Outcome summary |
| metadata | map | Arbitrary data |
| transitioned_at | utc_datetime | When |

Phase transitions use `Ecto.Multi` to atomically update the actor's phase and insert the transition record.

## EntityData

Table: `entity_data`. Composite PK: `(actor_id, entity_type, entity_id, key)`.

Per-actor, per-entity arbitrary key-value metadata. Any actor can annotate any entity with string values.

| Field | Type |
|-------|------|
| actor_id | string |
| entity_type | string |
| entity_id | string |
| key | string |
| value | string |

Use cases: priority annotations, sprint_week assignments, estimated_tokens, cycle metrics (status, velocity, backlog_count, completed_count, carried_count).

Uses upsert on conflict (`on_conflict: {:replace, [:value, :updated_at]}`).

## Tag

Table: `tags`. Universal tagging scoped to actors.

| Field | Type | Notes |
|-------|------|-------|
| id | string (PK) | Random ID |
| entity_type | string | One of: `space`, `project`, `task`, `execution`, `proposal`, `goal`, `brain_dump` |
| entity_id | string | Target entity |
| tag | string | The tag value |
| actor_id | string (FK) | Who applied the tag |
| namespace | string | One of: `default`, `priority`, `domain`, `phase`, `status`, `custom` |

Any actor can tag any entity. Unique constraint on `(entity_type, entity_id, tag, actor_id)` prevents duplicates.

## ActorCommand

Table: `actor_commands`. Agent-registered CLI extensions.

| Field | Type | Notes |
|-------|------|-------|
| id | string (PK) | Random ID |
| actor_id | string (FK) | Owning actor |
| command_name | string | CLI command name (unique per actor) |
| description | string | Help text |
| handler | string | Handler module/function reference |
| args_spec | map | JSON schema for arguments |

Enables agents to register custom commands accessible via `ema <actor-slug> <command>`.

## ContainerConfig

Table: `container_config`. Composite PK: `(container_type, container_id, key)`.

Per-container settings where container is a space, project, or actor.

| Field | Type |
|-------|------|
| container_type | string (`space`, `project`, `actor`) |
| container_id | string |
| key | string |
| value | string |

## Agent <-> Actor Bridge

The `Ema.Agents.Agent` schema has an `actor_id` FK to `Ema.Actors.Actor`. Slug convention serves as fallback when the FK is not set.

| Function | Module | Purpose |
|----------|--------|---------|
| `actor_for_agent/1` | `Ema.Actors` | Get Actor for an Agent (FK primary, slug fallback) |
| `actor_id_for_agent/1` | `Ema.Actors` | Get actor_id or nil |
| `agent_for_actor/1` | `Ema.Agents` | Reverse lookup |
| `default_human_actor_id/0` | `Ema.Actors` | Cached lookup of trajan's actor ID |

## Actor-Stamped Work

Tasks and executions get `actor_id` on creation (defaults to the human actor). The REST API supports `?actor_id=` filtering on `/api/tasks` and `/api/executions`, enabling per-actor work views.

## Sprint Cycle Metrics

Built on EntityData with `entity_type: "cycle"` and cycle IDs like `week_2026-W15`, `month_2026-04`, `quarter_2026-Q2`.

Tracked metrics per cycle: `status`, `started_at`, `completed_at`, `backlog_count`, `completed_count`, `carried_count`, `velocity`.

Cycle actions (start/review/complete) are handled by the `ema_sprint_cycle` MCP tool and integrate with phase transitions.

## Workspace MCP Tools

Defined in `Ema.MCP.WorkspaceTools`:

| Tool | Purpose |
|------|---------|
| `ema_orient` | Workspace briefing (operator or workspace mode) |
| `ema_phase_transition` | Advance actor phase (idle -> plan -> execute -> review -> retro) |
| `ema_phase_status` | Current phase + recent transition history |
| `ema_sprint_cycle` | Start/review/complete accelerated planning cycles (week/month/quarter) |
| `ema_workspace` | Unified workspace state: data_get/set/list, tag/untag/tags, config_get/set/list |
| `ema_search` | Unified search across all EMA entities |
| `ema_decide` | Record a decision with rationale to vault |
| `ema_dispatch` | Create and optionally auto-approve an execution |
| `ema_intelligence_gaps` | Stale tasks, orphan notes, incomplete goals |
| `ema_intelligence_reflexion` | Lessons from past executions |
| `ema_intelligence_memory` | Session memory fragments |
| `ema_codebase_ask` | Query codebase via knowledge graph |
| `ema_codebase_index` | Rebuild knowledge graph for a project |

## CLI

```bash
ema actor list                # list all actors
ema actor show <slug>         # show actor details
ema actor create              # create a new actor
ema actor transition          # advance phase
ema actor data                # manage entity data
ema actor commands            # list registered commands
ema actor phases              # show phase history
ema actor register            # register a CLI command
```

## Source Files

| File | Purpose |
|------|---------|
| `daemon/lib/ema/actors/actors.ex` | Context module: CRUD, phases, tags, data, config, commands, cycles |
| `daemon/lib/ema/actors/actor.ex` | Actor schema |
| `daemon/lib/ema/actors/bootstrap.ex` | Startup actor creation |
| `daemon/lib/ema/actors/phase_transition.ex` | PhaseTransition schema |
| `daemon/lib/ema/actors/entity_data.ex` | EntityData schema |
| `daemon/lib/ema/actors/tag.ex` | Tag schema |
| `daemon/lib/ema/actors/actor_command.ex` | ActorCommand schema |
| `daemon/lib/ema/actors/container_config.ex` | ContainerConfig schema |
| `daemon/lib/ema/mcp/workspace_tools.ex` | MCP tool definitions and dispatch |

## Related

- [[Agent-Network]] -- agent runtime system (workers, memory, channels)
- [[Intent-System]] -- phase transitions linked to intents via `intent_id` FK
- [[Execution-System]] -- executions stamped with `actor_id`, actor-filtered views

#architecture #actors #workspace #agents
