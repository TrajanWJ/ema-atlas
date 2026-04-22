---
title: "Intent Engine"
space: wiki
tags: ["projects","ema","intents","intent-engine"]
source: brainstorm-session-2026-04-06
---

# Intent Engine

Project-level page for the Intent Engine subsystem within EMA. This is the semantic backbone that unifies fragmented intent surfaces (IntentMap, IntentNode, HarvestedIntents, .superman/intents/) into one canonical hierarchy.

## What Was Built

### Schemas (migration `20260412000012_create_intents_engine.exs`)

- **`intents`** — Unified semantic hierarchy. Fields: id, title, slug, description, level (0-5), kind, status, phase, priority, confidence, provenance_class, completion_pct, parent_id, project_id, metadata. Levels: vision(0), goal(1), project(2), feature(3), task(4), execution(5).
- **`intent_links`** — Bridges semantic truth to operational truth. Fields: intent_id, linkable_type (task, execution, proposal, brain_dump, session, vault_note, goal, harvest, doc), linkable_id, role (origin, evidence, derived, related, superseded, context, owner, assignee, operator, runtime), provenance.
- **`intent_events`** — Append-only lineage. Fields: intent_id, event_type, actor, payload (JSON). Tracks status changes, links created, confidence updates.

### Context Module (`daemon/lib/ema/intents/intents.ex`)

Full CRUD plus:
- `tree/1` — nested tree with recursive children
- `lineage/1` — intent_events for an intent
- `context/1` — intent + parent chain + linked records + recent events
- `status_summary/0` — counts by level/status for SystemBrain
- `export_markdown/0` — full tree as indented markdown
- `create_link/1`, `log_event/1` — operational bridges

### Populator (`daemon/lib/ema/intents/populator.ex`)

Seeds the intent graph from existing operational data:
- Projects become L2 (project) intents
- Tasks become L4 (task) intents linked to their project intent
- Proposals become L3 (feature) intents
- Brain dump items become L4 intents

### API (`daemon/lib/ema_web/controllers/intents_controller.ex`)

Routes at `/api/intents`:
- `GET /api/intents` — list with filters (level, status, kind, project_id, parent_id, limit)
- `GET /api/intents/:id` — show single
- `POST /api/intents` — create
- `PUT /api/intents/:id` — update
- `DELETE /api/intents/:id` — delete
- `GET /api/intents/tree` — full tree
- `GET /api/intents/:id/tree` — subtree
- `GET /api/intents/:id/lineage` — event history
- `POST /api/intents/:id/links` — create link
- `GET /api/intents/status` — summary counts

### MCP Tools (`daemon/lib/ema/mcp/tools.ex`)

Four tools exposed to Claude Code:
- `ema_get_intents` — list with filters
- `ema_create_intent` — create new intent
- `ema_get_intent_tree` — full hierarchy as nested tree
- `ema_get_intent_context` — intent + linked records + lineage + parent chain

### CLI (`daemon/lib/ema/cli/commands/intent.ex`)

Commands: `intent list`, `intent tree`, `intent show <id>`, `intent create`

### Channel (`daemon/lib/ema_web/channels/intents_channel.ex`)

Phoenix channel at `intents:lobby` for real-time sync.

### SystemBrain Projection

`Ema.SecondBrain.SystemBrain` subscribes to `"intents"` PubSub topic and writes `vault/system/state/intents.md` with status summary + full tree markdown.

## Migration Checklist (Go-Live)

1. Run `mix ecto.migrate` — creates intents, intent_links, intent_events tables
2. Run `mix ema.intents.bootstrap` or call `Ema.Intents.Populator.populate/0` — seeds from existing data
3. Verify with `ema intent tree --project=ema`
4. Confirm SystemBrain writes `intents.md` state file
5. Test MCP tools from Claude Code session

## What's Deferred

- **Vault projections** — full `vault/intents/` tree of per-intent markdown files
- **Wikipedia-style frontend** — intent browser vApp
- **TUI cockpit** — terminal intent dashboard
- **Structural analysis** — auto-intent generation from code structure
- **Workflow crystallization** — recognizing recurring patterns as intent templates
- **Broad MCP discovery** — probing external MCP servers for capability mapping

## File Paths

| What | Path |
|------|------|
| Schemas | `daemon/lib/ema/intents/intent.ex`, `intent_link.ex`, `intent_event.ex` |
| Context | `daemon/lib/ema/intents/intents.ex` |
| Populator | `daemon/lib/ema/intents/populator.ex` |
| Controller | `daemon/lib/ema_web/controllers/intents_controller.ex` |
| Channel | `daemon/lib/ema_web/channels/intents_channel.ex` |
| MCP tools | `daemon/lib/ema/mcp/tools.ex` (lines ~185-280) |
| CLI command | `daemon/lib/ema/cli/commands/intent.ex` |
| Mix task | `daemon/lib/mix/tasks/ema/intents/bootstrap.ex` |
| Migration | `daemon/priv/repo/migrations/20260412000012_create_intents_engine.exs` |
| SystemBrain | `daemon/lib/ema/second_brain/system_brain.ex` |
| Architecture spec | [[Intent System]] |

## Design Principles

### Three Core Truths

The Intent Engine sits across three coequal truth domains:

- **Semantic truth** — intents, intent_links, intent_events (the "what" and "why")
- **Operational truth** — executions, sessions, proposals, tasks, goals (the "how" and "when")
- **Knowledge truth** — curated wiki, vault, docs, indexed memory (the "known")

Bridge rules:
- `intent_links` bridges semantic to operational
- Context assembly bridges semantic to knowledge
- Projections (SystemBrain files) are downstream, not peers

### Provenance Discipline

- Generated notes land in generated spaces first
- Curated wiki pages are never overwritten by projections
- Imported material keeps provenance labels
- No blind merge of semantically conflicting sources

## Related

- [[Intent System]] — architecture design
- [[EMA]] — parent project
- [[Execution System]]
- [[Dispatch Engine]]
- [[MCP Topology]]
