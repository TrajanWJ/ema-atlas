---
title: "MCP Tools Reference"
space: wiki
tags: ["tools","mcp","reference","api"]
source: manual
---

# MCP Tools Reference

Comprehensive reference for all tools exposed by the EMA MCP server. Source: `daemon/lib/ema/mcp/tools.ex`.

The MCP server runs as a native Elixir stdio process (`mix ema.mcp.stdio` or the `ema` escript) and communicates with the EMA daemon at `http://localhost:4488`. All tool calls have a 30s timeout and include `x-mcp-internal` and `x-mcp-depth` headers for recursion guarding.

---

## create_proposal

Trigger the EMA Proposal Pipeline. Runs Generator, Refiner, Debater, and Tagger stages automatically via PubSub.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | yes | Proposal title |
| `description` | string | yes | Detailed description of what to propose |
| `project_id` | string | yes | EMA project ID |
| `context_keys` | array[string] | no | MCP resource URIs to inject as context (e.g. `["ema://goals/active"]`) |

**Returns:** `proposal_id`, `title`, `status`, `streaming_topic` (PubSub topic for real-time progress), `initial_output`.

**API call:** `POST /api/proposals`

---

## create_task

Create a new task in EMA under a specific project and goal.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | yes | Task title |
| `description` | string | yes | Task description |
| `project_id` | string | yes | EMA project ID |
| `goal_id` | string | no | Goal this task contributes to |
| `priority` | string | no | `low`, `medium`, `high`, `critical` |
| `estimated_time` | string | no | Human-readable time estimate (e.g. "2h", "30min") |

**Returns:** `task_id`, `title`, `status`, `priority`, `project_id`, `goal_id`, `assigned_to`.

**API call:** `POST /api/tasks`

---

## update_task

Update a task's status and add notes. Also fetches updated goal progress if the task has a linked goal.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `task_id` | string | yes | EMA task ID |
| `status` | string | yes | `pending`, `active`, `done`, `blocked` |
| `notes` | string | no | Notes or context for this update |

**Returns:** `task_id`, `title`, `status`, `notes`, `updated_goal_progress`.

**API call:** `POST /api/tasks/:id/transition`

---

## query_vault

Semantic search over the EMA knowledge vault. Falls back gracefully if the vault service is unavailable (returns empty results with `degraded: true` instead of failing).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | yes | Natural language search query |
| `limit` | integer | no | Maximum results (default 5, max 20) |

**Returns:** `query`, `limit`, `results` (array of `{id, title, snippet, path, score, backlinks}`), `total`.

**API call:** `GET /api/vectors/query?q=...&k=...`

---

## log_outcome

Record the outcome of a task to the EMA outcome tracker. EMA auto-detects patterns from logged outcomes.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `task_id` | string | yes | EMA task ID |
| `outcome` | string | yes | `success`, `failure`, `warning` |
| `feedback` | string | yes | What happened -- blockers, learnings, context |
| `duration_seconds` | integer | no | How long the task took |

**Returns:** `task_id`, `outcome`, `logged_at`, `insights`, `patterns_detected`.

**API call:** `POST /api/intelligence/outcomes`

---

## context_operator

Fetch the canonical operator context package from host EMA. Contains user profile, active projects summary, system state.

**Parameters:** None.

**Returns:** Full operator context JSON package.

**API call:** `GET /api/context/operator/package`

---

## context_project

Fetch a project context package by project ID, slug, or name. Resolves the project reference by listing all projects and matching.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project` | string | yes | Project ID, slug, or name |

**Returns:** Full project context JSON package (tasks, proposals, executions, vault notes, etc.).

**API call:** `GET /api/context/project/:id/package` (after resolving ID via `GET /api/projects`)

---

## bootstrap_status

Fetch EMA's onboarding/readiness status, including provider health and detected CLI tools.

**Parameters:** None.

**Returns:** Bootstrap status JSON (providers, tools, readiness state).

**API call:** `GET /api/onboarding/status`

---

## run_bootstrap

Run EMA's onboarding/bootstrap sweep to detect tools, catalog imports, and refresh construction context.

**Parameters:** None.

**Returns:** Bootstrap sweep results.

**API call:** `POST /api/onboarding/run`

---

## ema_get_intents

List intents from the Intent Engine with optional filters. Intents form the semantic hierarchy from vision (L0) down to execution (L5).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | no | Filter by project |
| `level` | integer | no | Filter by level (0=vision, 1=goal, 2=project, 3=feature, 4=task, 5=execution) |
| `status` | string | no | Filter by status (planned, active, researched, outlined, implementing, complete, blocked, archived) |
| `kind` | string | no | Filter by kind (goal, question, task, exploration, fix, audit, system) |
| `limit` | integer | no | Max results (default 20) |

**Returns:** `intents` array, `count`, `filters`.

**API call:** `GET /api/intents?...`

---

## ema_create_intent

Create a new intent at any level of the hierarchy.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | yes | Intent title |
| `description` | string | no | Detailed description |
| `level` | integer | no | 0-5 (default 4 = task) |
| `kind` | string | no | One of: goal, question, task, exploration, fix, audit, system (default "task") |
| `project_id` | string | no | Associate with project |
| `parent_id` | string | no | Parent intent for nesting |

**Returns:** Created intent with ID and serialized fields.

**API call:** `POST /api/intents`

---

## ema_get_intent_tree

Get the full intent hierarchy as a nested tree. Each node contains its children recursively.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | no | Filter to a specific project (omit for all) |

**Returns:** Nested `tree` structure.

**API call:** `GET /api/intents/tree?project_id=...`

---

## ema_get_intent_context

Get an intent with full operational context: linked records, recent lineage events, and parent chain.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `intent_id` | string | yes | Intent ID to fetch context for |

**Returns:** `intent` (with links), `lineage` events.

**API calls:** `GET /api/intents/:id` + `GET /api/intents/:id/lineage`

---

---

# Workspace Tools

Agent workspace tools for orientation, phase cadence, workspace state, intelligence, and codebase queries. Source: `daemon/lib/ema/mcp/workspace_tools.ex`. These use direct Elixir calls (no HTTP round-trip) when running in-process.

## ema_orient

Get current EMA state and orientation. Call first in every agent conversation.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `mode` | string | yes | `operator` (helping user) or `workspace` (autonomous agent) |
| `actor_slug` | string | no | Actor identity (default: trajan for operator) |

**Operator mode returns:** live state (inbox, tasks, executions), attention items, top active intents, focus session.
**Workspace mode returns:** actor phase, sprint state, assigned intents, last transition.

## ema_phase_transition

Advance an actor's phase in the executive cadence.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `actor_slug` | string | yes | Actor slug |
| `to_phase` | string | yes | idle, plan, execute, review, retro |
| `reason` | string | no | Why |
| `summary` | string | no | What was accomplished |
| `project_id` | string | no | Project context |
| `week_number` | number | no | Sprint week |

## ema_phase_status

Get actor's current phase + last 10 transitions.

| Param | Type | Required |
|-------|------|----------|
| `actor_slug` | string | yes |

## ema_sprint_cycle

Accelerated planning cycles — compress week/month/quarter into single conversations.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `actor_slug` | string | yes | Actor |
| `cycle_type` | string | yes | week, month, quarter |
| `action` | string | yes | start (get planning brief + transition to plan), review (check metrics), complete (record + idle) |
| `metrics` | object | no | For complete: backlog_count, completed_count, carried_count, velocity |

## ema_workspace

Unified workspace state — replaces separate data/tags/config tools.

| Param | Type | Description |
|-------|------|-------------|
| `op` | string | data_get, data_set, data_list, tag, untag, tags, config_get, config_set, config_list |
| `actor_slug` | string | For data/tag ops |
| `entity_type` | string | Entity type |
| `entity_id` | string | Entity ID |
| `key` / `value` | string | For data and config ops |
| `tag` / `namespace` | string | For tag ops |
| `container_type` / `container_id` | string | For config ops (space, project, actor) |

## ema_search

Unified search across all EMA entities.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | yes | Search text |
| `scope` | string | no | all, tasks, intents, vault, proposals, brain_dumps (default: all) |
| `project_id` | string | no | Filter by project |
| `limit` | number | no | Max results per scope (default 10) |

## ema_decide

Record a decision with rationale — persisted as vault wiki page, optionally linked to intent.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Decision title |
| `rationale` | string | yes | Why this decision |
| `alternatives` | string | no | What else was considered |
| `project_slug` | string | no | Project context |
| `intent_id` | string | no | Link to intent |

Writes to `wiki/Decisions/YYYY-MM-DD-slug.md`.

## ema_dispatch

Create an execution for agent work, optionally auto-approve.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Execution title |
| `objective` | string | yes | What needs to be done |
| `mode` | string | yes | research, outline, implement, review, harvest, refactor |
| `project_slug` | string | no | Project |
| `intent_id` | string | no | Link to intent |
| `auto_approve` | boolean | no | Skip approval gate (default false) |

## ema_intelligence_gaps

Surface operational gaps — stale tasks, orphan notes, incomplete goals.

| Param | Type | Description |
|-------|------|-------------|
| `project_id` | string | Filter by project |
| `limit` | number | Max results |

## ema_intelligence_reflexion

Query lessons learned from past executions.

| Param | Type | Description |
|-------|------|-------------|
| `agent` | string | Filter by agent slug |
| `project_slug` | string | Filter by project |
| `limit` | number | Max results (default 10) |

## ema_intelligence_memory

Session memory fragments — decisions, blockers, insights from past work.

| Param | Type | Description |
|-------|------|-------------|
| `project_path` | string | Project path |
| `query` | string | Search text |
| `limit` | number | Max results |

## ema_codebase_ask

Query codebase via local knowledge graph + vault search. Replaces CodeGraphContext and Superman.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | yes | Question about the code |
| `project_slug` | string | no | Project (default: ema) |

## ema_codebase_index

Rebuild knowledge graph for a project's codebase.

| Param | Type | Description |
|-------|------|-------------|
| `project_slug` | string | Project slug |
| `repo_path` | string | Direct repo path (alternative) |

---

## Observability

All tool calls are logged asynchronously to `POST /api/intelligence/mcp-calls` with:
- Tool name and request ID
- Result (success/error) and duration in ms
- Recursion depth (from `x-mcp-depth` header)
- Timestamp

## Related

- [[MCP-Resources-Reference]]
- [[Claude Code Setup]]
- [[CLI Reference]]
