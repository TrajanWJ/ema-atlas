---
title: "Reflexion System"
space: wiki
tags: ["architecture", "reflexion", "intelligence", "learning"]
source: manual
---

# Reflexion System

**Status:** Operational. ReflexionEntry schema, ReflexionStore persistence, ReflexionInjector prompt building, and ReflectionLoop post-execution capture all implemented.
**Last verified:** 2026-04-07

Reflexion is EMA's execution learning loop. After every execution completes, the system records a lesson. Before future executions, past lessons are injected into the agent's prompt so mistakes are not repeated and successful patterns are reinforced.

## Modules

Source: `daemon/lib/ema/intelligence/`

| Module | Type | Purpose |
|--------|------|---------|
| `ReflexionEntry` | Ecto Schema | Persisted lesson record in `reflexion_entries` table |
| `ReflexionStore` | Module | CRUD + querying for reflexion entries |
| `ReflexionInjector` | Module | Builds prompt prefix from past lessons |
| `ReflectionLoop` | Module | Post-execution reflection — classifies outcomes, records lessons, feeds fitness |

### ReflexionEntry Schema

Table: `reflexion_entries`

| Field | Type | Purpose |
|-------|------|---------|
| `id` | binary_id (auto) | Primary key |
| `agent` | string (1-100) | Which agent produced this lesson |
| `domain` | string (1-100) | Execution domain (e.g. "code", "analysis") |
| `project_slug` | string (1-200) | Project this lesson applies to |
| `lesson` | string (3-2000) | The lesson text |
| `outcome_status` | string (1-50) | "success", "partial", or "failure" |
| `inserted_at` | utc_datetime | When recorded (no updated_at — append-only) |

### ReflexionStore

Persistence layer for reflexion entries. Key functions:

- `record/5` — Creates a new entry with agent, domain, project_slug, lesson, and status. Normalizes lesson text (trims, caps at 2000 chars), rejects empty lessons.
- `last_entries/4` — Retrieves the N most recent entries for a specific agent + domain + project_slug combination. Default limit: 3.
- `list_recent/1` — Lists entries with optional filters for agent, domain, project_slug.

### ReflexionInjector

Formats the last 3 lessons into a prompt prefix:

```
Past lessons:
- [success] code: executed, refactored, implemented
- [failure] code: timeout, missing, incomplete
- [success] analysis: structured, documented, verified

Apply these lessons where relevant before taking new action.
```

Returns empty string when no prior lessons exist for the agent/domain/project combination.

### ReflectionLoop

Post-execution reflection triggered after each execution completes. Always runs async via `Task.Supervisor` — never blocks the completion path.

1. Loads the execution record
2. Classifies outcome quality from result text:
   - `:success` — has markdown headers and >300 bytes, or >200 bytes
   - `:partial` — falls between
   - `:failure` — starts with "FAILED:" or <100 bytes
3. Records agent fitness via `AgentFitnessStore.record_outcome/4`
4. For success/partial outcomes: extracts top 10 keyword frequencies from result text
5. Records lesson to `ReflexionStore` as `"<mode>: <top_keywords>"`
6. Records an `execution_event` with outcome, agent, duration, and lesson keywords
7. Feeds `SignalProcessor` with normalized outcome for UCB routing

## Reflexion Flow

```
Execution completes
  -> ReflectionLoop.reflect_async/3 (fire-and-forget)
     -> classify_outcome (success/partial/failure)
     -> AgentFitnessStore.record_outcome
     -> extract_lesson_keywords
     -> ReflexionStore.record (persists to DB)
     -> Executions.record_event (execution_events table)
     -> SignalProcessor.record (feeds UCB routing)

Future execution dispatched
  -> Dispatcher calls ReflexionInjector.build_prefix/3
     -> ReflexionStore.last_entries/4 (last 3 lessons)
     -> Formatted as prompt prefix
     -> Prepended to agent prompt
```

## Integration with Dispatcher

The Dispatcher calls `ReflexionInjector.build_prefix/3` before every execution, passing the agent name, execution mode (domain), and project slug. The returned prefix (if non-empty) is prepended to the agent's prompt, giving it awareness of recent outcomes in the same context.

This creates a closed loop: execution outcomes feed back into future executions without any human intervention.

## Related

- [[Execution-System]] — Where executions are dispatched and completed
- [[Intelligence-Layer]] — Parent system containing reflexion and other intelligence modules
