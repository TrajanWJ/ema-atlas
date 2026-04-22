---
title: "Intent System"
space: wiki
tags: ["architecture", "intents", "verified-2026-04-06"]
source: manual
---

# Intent System

**Status:** Operational. Schema, context module, populator GenServer, MCP tools, and CLI commands all implemented and running.
**Last verified:** 2026-04-06

The Intent Engine is the semantic truth layer of EMA. Intents form a 6-level hierarchy from vision down to execution steps, bridging the gap between abstract goals and concrete work.

## Architecture

### Two Layers, One Intent

Every intent has **two representations** that serve different purposes:

| Layer | Location | Purpose | Durability |
|-------|----------|---------|------------|
| **Filesystem (anchor)** | `.superman/intents/<slug>/` | Durable semantic memory. Human-readable. Survives DB resets. Agent read/write target. | Persistent — committed to git |
| **Database (runtime)** | `intents` + `intent_links` + `intent_events` tables | Queryable graph. Tree ops. Status propagation. API/MCP surface. | Disposable — can be rebuilt from filesystem |

**The filesystem is the anchor. The database is the runtime view.**

This is not a contradiction — it's the same pattern as git (`.git/` is canonical, GitHub is the queryable view). If the DB is wiped, `.superman/intents/` still has the intent text, decisions, research, and execution logs. The DB can be repopulated from those files. The reverse is not true.

### How They Stay In Sync

```
Creation flow:
  brain dump → Populator creates DB intent (level-4, source: brain_dump)
             → IntentFolder creates .superman/intents/<slug>/ (intent.md + status.json)

Execution flow:
  Dispatcher reads .superman/intents/<slug>/intent.md + signals.md → builds agent packet
  Agent runs → writes result.md, appends execution-log.md
  Dispatcher links execution → DB intent via intent_links
  Populator advances DB intent phase/status on execution completion

Import flow (catchup):
  import_intents.exs reads .superman/intents/<slug>/ → creates/updates DB intents
  source_fingerprint: "superman:<slug>" prevents duplicates
```

**Key invariant:** The DB intent's `slug` field matches the `.superman/intents/<slug>/` directory name. This is the join key between the two layers.

### Three Core Truths

The Intent Engine sits across three coequal truth domains:

- **Semantic truth** — `intents`, `intent_links`, `intent_events` (DB) + `.superman/intents/` (filesystem)
- **Operational truth** — executions, sessions, proposals, tasks, goals (their home domains)
- **Knowledge truth** — curated wiki/vault/docs and indexed memory

Bridge rules:
- `intent_links` bridges semantic truth to operational truth (polymorphic join)
- Context assembly bridges semantic truth to knowledge truth (ContextInjector)
- `.superman/intents/` is the durable anchor; DB intents are the queryable runtime view
- `vault/system/state/intents.md` is a downstream projection (SystemBrain writes it)

## .superman Intent Folders (Filesystem Layer)

Source: `daemon/lib/ema/executions/intent_folder.ex`

Each intent gets a folder at `.superman/intents/<slug>/` containing:

| File | Purpose | Written by | Mutable? |
|------|---------|------------|----------|
| `intent.md` | What + why — the raw intent statement | IntentFolder on creation, human on refinement | Yes |
| `status.json` | Machine-readable state (status, phase, clarity, energy, completion_pct) | IntentFolder, Dispatcher | Yes |
| `signals.md` | Architecture signals from design sessions | Human | Yes |
| `decisions.md` | Numbered design decisions (D1, D2, ...) | Human or agent | Append-only |
| `research.md` | Research phase output | Agent (mode: research) | Yes |
| `outline.md` | Detailed outline with schemas | Agent (mode: outline) | Yes |
| `plan.md` | Implementation plan with sprints | Agent (mode: outline) | Yes |
| `result.md` | Most recent execution result | Dispatcher on completion | Overwritten |
| `execution-log.md` | Append-only log of all executions | Dispatcher on completion | Append-only |

**`status.json` schema:**
```json
{
  "slug": "execution-first-ema-os",
  "status": "in_progress",
  "phase": 2,
  "clarity": 9,
  "energy": 9,
  "latest_execution_id": "sprint1",
  "sprint_completed": ["research", "sprint1-backend"],
  "open_questions": [],
  "completion_pct": 50,
  "last_updated": "2026-04-03T11:18:38Z"
}
```

**Lifecycle:**
1. Brain dump or manual creation → IntentFolder creates `intent.md` + `status.json`
2. Research execution → agent writes `research.md`, updates `status.json`
3. Outline execution → agent writes `outline.md`, `plan.md`
4. Implement execution → agent executes plan, writes `result.md`
5. Each execution → Dispatcher appends to `execution-log.md`, updates `status.json`

**Design decision (D8):** Brain dump items auto-create intent folders so every execution has a patchback path. Without a folder, `intent_path` is nil and results are lost.

**Design decision (from signals.md):** ".superman is durable project semantic memory. DB is runtime state — it can be reset, migrated, wiped. Intent files should read like project documentation, not schema dumps."

## DB Schema (Runtime Layer)

Source: `daemon/lib/ema/intents/intent.ex`

### Intent

Table: `intents`. Primary key: string ID with format `int_<timestamp>_<random>`.

**Durable identity fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated `int_<ms>_<hex>` |
| `title` | string | Required |
| `slug` | string | Auto-generated from title, unique, max 60 chars |
| `description` | string | |
| `level` | integer | 0-5, required |
| `kind` | string | Required. One of: `goal`, `question`, `task`, `exploration`, `fix`, `audit`, `system` |
| `parent_id` | string | FK to parent intent |
| `project_id` | string | FK to project |
| `source_fingerprint` | string | Unique. Deduplication key (e.g. `brain_dump:<item_id>`) |
| `source_type` | string | One of: `brain_dump`, `proposal`, `execution`, `harvest`, `goal`, `structural`, `crystallized`, `manual`, `mcp` |

**Mutable state fields:**

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `status` | string | `"planned"` | One of: `planned`, `active`, `researched`, `outlined`, `implementing`, `complete`, `blocked`, `archived` |
| `phase` | integer | 1 | 1-5 |
| `completion_pct` | integer | 0 | 0-100 |
| `clarity` | float | 0.0 | |
| `energy` | float | 0.0 | |
| `priority` | integer | 3 | 0-4 |
| `confidence` | float | 1.0 | |
| `provenance_class` | string | `"high"` | One of: `high`, `medium`, `low` |
| `confirmed_at` | utc_datetime | nil | |
| `tags` | string (JSON) | nil | JSON-encoded array |
| `metadata` | string (JSON) | nil | JSON-encoded map |

**Level hierarchy:**

| Level | Name | Description |
|-------|------|-------------|
| 0 | vision | Long-term vision |
| 1 | goal | Strategic goal |
| 2 | project | Project-level intent |
| 3 | feature | Feature or initiative |
| 4 | task | Concrete task (default) |
| 5 | execution | Execution step |

### IntentLink

Source: `daemon/lib/ema/intents/intent_link.ex`

Table: `intent_links`. Bridges intents to operational records. Has a unique constraint on `(intent_id, linkable_type, linkable_id)`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated `il_<ms>_<hex>` |
| `intent_id` | string | FK to intent |
| `linkable_type` | string | One of: `execution`, `proposal`, `task`, `goal`, `brain_dump`, `session`, `harvest`, `vault_note`, `doc` |
| `linkable_id` | string | ID of the linked record |
| `role` | string | One of: `origin`, `evidence`, `derived`, `related`, `superseded`, `context`, `owner`, `assignee`, `operator`, `runtime`. Default: `"related"` |
| `provenance` | string | One of: `manual`, `approved`, `execution`, `session`, `harvest`, `cluster`, `import`, `inferred`, `system`. Default: `"manual"` |

### IntentEvent

Source: `daemon/lib/ema/intents/intent_event.ex`

Table: `intent_events`. Append-only lineage log for provenance tracking.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated `ie_<ms>_<hex>` |
| `intent_id` | string | FK to intent |
| `event_type` | string | One of: `created`, `status_changed`, `phase_advanced`, `linked`, `unlinked`, `reparented`, `merged`, `split`, `archived`, `execution_started`, `execution_completed`, `confirmed`, `promoted`, `demoted`, `crystallized`, `outcome_recorded`, `imported` |
| `payload` | string (JSON) | Event-specific data |
| `actor` | string | Default: `"system"` |
| `inserted_at` | utc_datetime | Auto-set |

## Context Module

Source: `daemon/lib/ema/intents/intents.ex`

`Ema.Intents` provides:

**CRUD:** `list_intents/1`, `get_intent/1`, `get_intent!/1`, `get_intent_by_slug/1`, `get_intent_by_fingerprint/1`, `create_intent/1`, `update_intent/2`, `delete_intent/1`

**Tree operations:** `tree/1` (builds full nested tree from roots), `parent_chain/1` (returns ancestor chain), `get_intent_detail/1` (intent + links + lineage)

**Status:** `status_summary/1` (counts by status), `propagate_status/1` (recomputes parent completion_pct from children)

**Links:** `link_intent/4`, `unlink_intent/3`, `get_links/2`

**Lineage:** `emit_event/4`, `get_lineage/2`

**Serialization:** `serialize/1`, `serialize_tree/1`, `serialize_link/1`, `serialize_event/1`, `export_markdown/1`

All mutations broadcast on PubSub topic `"intents"` with events like `"intents:created"`, `"intents:status_changed"`.

## Populator GenServer

Source: `daemon/lib/ema/intents/populator.ex`

`Ema.Intents.Populator` is an always-on GenServer that subscribes to PubSub and auto-creates/updates intents from domain events:

**Subscriptions:**
- `"brain_dump"` — `{:brain_dump, :item_created, item}` creates a level-4 task intent with `source_type: "brain_dump"`, `provenance_class: "medium"`, and an `origin` link back to the brain dump item. Uses `source_fingerprint: "brain_dump:<item_id>"` for deduplication.
- `"executions"` — `"execution:completed"` finds or attaches the linked intent (via execution link or brain_dump anchor or intent_slug), then advances phase and updates status.

**Intent attachment logic for executions:**
1. Check if execution already has an intent link
2. If not, check if execution has a `brain_dump_item_id` — find the intent linked to that brain dump item
3. If not, check if execution has an `intent_slug` — find intent by slug
4. If found, create a `derived` link with `execution` provenance

## MCP Tools

Source: `daemon/lib/ema/mcp/tools.ex`

Four intent tools registered in the MCP server:

| Tool | Description |
|------|-------------|
| `ema_get_intents` | List intents with optional filters (project_id, level, status, kind, limit) |
| `ema_create_intent` | Create a new intent (title required; level, kind, project_id, parent_id optional) |
| `ema_get_intent_tree` | Get full nested intent hierarchy, optionally filtered by project_id |
| `ema_get_intent_context` | Get intent with links and lineage events |

## MCP Resources

Two intent resources:

| URI | Description |
|-----|-------------|
| `ema://intents/active` | Active intents (status=active, limit 20) |
| `ema://intents/tree` | Full intent tree (supports `?project_id=X` filter) |

## CLI Commands

The CLI registers `intent` as a root command (source: `daemon/lib/ema/cli/cli.ex`). Intent commands dispatch to the REST API via the CLI transport layer.

## Integration Points

### Execution ↔ Intent (the core loop)

An execution advances an intent. The `Execution` schema carries `intent_slug` and `intent_path` fields that connect it to both layers:

```
Execution.intent_slug  → matches .superman/intents/<slug>/ directory
                       → matches intents.slug DB column
Execution.intent_path  → ".superman/intents/<slug>" (relative to project root)
```

**On dispatch** (Dispatcher `build_packet/1`):
- Reads `.superman/intents/<slug>/intent.md` and `signals.md` as agent context
- Sets `read_files` and `write_files` based on intent_path
- Sets `requires_patchback: true` when intent_path is present

**On completion** (Dispatcher `on_execution_completed/1`):
- Writes `result.md` to `.superman/intents/<slug>/`
- Appends to `execution-log.md`
- Updates `status.json` with new execution_id and completion state
- Creates `derived` link from DB intent to execution via `maybe_link_intent_to_execution/1`

**On Populator event** (Populator `handle_info {:execution_completed}`):
- Finds DB intent by execution link → brain_dump anchor → intent_slug fallback
- Advances intent phase and status in DB
- Triggers `propagate_status/1` which may auto-complete parent intents

### Status Propagation

When an intent's status changes, `propagate_status/1` walks up to the parent and recomputes `completion_pct` based on what fraction of children are `"complete"`. If all children complete, the parent auto-completes.

### Actor ↔ Intent

Intents can be linked to actors via `intent_links` with roles `owner`, `assignee`, or `operator`:
- `attach_actor(intent_id, actor_id, role)` creates the link
- `GET /api/intents/:id/runtime` returns linked actors, executions, sessions
- When an execution is dispatched to an agent, the agent's actor can be attached as `operator`

### Workspace Visibility

Both human and agent actors see the same intent tree. Actor-stamped executions show *who* is advancing *which* intent. Entity data on intents (via `Ema.Actors.set_data/5`) lets agents annotate intents with sprint_week, estimated_tokens, etc.

## IntentProjector GenServer

Source: `daemon/lib/ema/intents/intent_projector.ex`

`Ema.Intents.IntentProjector` is an always-on GenServer that provides reverse sync from DB to wiki:

- Subscribes to `"intents"` PubSub topic
- On `"intents:created"`: if intent source_type is NOT "wiki", writes a new wiki page to `vault/wiki/Intents/<Level>/<Slug>.md`
- On `"intents:status_changed"`: updates the `intent_status` frontmatter field in the wiki page
- Skips wiki-sourced intents to prevent sync loops (Populator handles wiki → DB direction)

This closes the bidirectional sync loop:
```
Wiki page created/edited → VaultWatcher → Populator → DB intent
DB intent created (API/MCP/brain dump) → IntentProjector → wiki page
```

## Phase Transitions ↔ Intents

`phase_transitions` table has `intent_id` FK to `intents`. When an actor advances phase on a specific intent:

```elixir
Ema.Actors.transition_phase(actor, "execute",
  intent_id: intent.id,
  reason: "research complete, starting implementation"
)
```

This records *which intent* the phase transition is for, enabling queries like:
- "What phase is agent:coder on for Actor-Workspace?"
- "Show phase history for Execution-First-EMA-OS"

## File Paths

| File | Purpose |
|------|---------|
| `daemon/lib/ema/intents/intent.ex` | Schema with validation |
| `daemon/lib/ema/intents/intent_link.ex` | Link schema |
| `daemon/lib/ema/intents/intent_event.ex` | Event schema |
| `daemon/lib/ema/intents/intents.ex` | Context module (CRUD, tree, links, lineage) |
| `daemon/lib/ema/intents/populator.ex` | Wiki → DB sync + brain dump/execution handlers |
| `daemon/lib/ema/intents/intent_projector.ex` | DB → wiki reverse sync |
| `vault/wiki/Intents/` | Canonical intent schematic (wiki pages) |

## Related

- [[EMA-Overview]]
- [[Execution-System]]
- [[Proposal-Pipeline]]
- [[MCP-Topology]]
