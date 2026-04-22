---
title: "Superman System"
space: wiki
tags: ["architecture", "superman", "semantic-memory", "intents"]
source: manual
---

# Superman System

**Status:** Operational. Three-layer `.superman/` hierarchy active, daemon modules supervising KnowledgeGraph, IntentFolder lifecycle management working.
**Last verified:** 2026-04-07

Superman is EMA's durable semantic memory layer. It stores project context, design artifacts, and execution recordings as plain markdown/JSON on the filesystem. This data survives DB resets and provides the canonical anchor for intent slugs.

## Three-Layer `.superman/` Hierarchy

| Layer | Path | Purpose | Content |
|-------|------|---------|---------|
| Global | `~/.superman/` | User-wide test/scratch | 1 intent (`test-execution`) |
| Project | `/Projects/ema/.superman/` | Project semantic memory | `context.md` (5KB), `project.md` (4KB), 1 deep intent |
| Daemon | `/Projects/ema/daemon/.superman/` | Runtime session recordings | 10+ lightweight intents |

The project layer is the primary knowledge store. `context.md` describes the core loop, what exists, what's in worktree branches, what's missing, and design invariants. `project.md` is the project overview: stack, architecture, supervised systems, AI backend, known gaps, and key docs.

## Intent Folder File Inventory

Each intent lives at `.superman/intents/<slug>/` and contains some or all of these files:

| File | Purpose | Always present |
|------|---------|----------------|
| `intent.md` | The intent statement — what this work is about | Yes |
| `status.json` | Machine-readable state: slug, status, phase, clarity, energy, completion_pct, open_questions | Yes |
| `signals.md` | External signals and triggers that activated this intent | No |
| `decisions.md` | Architectural decisions made during execution | No |
| `research.md` | Background research, alternatives explored | No |
| `outline.md` | Structural outline for the deliverable | No |
| `plan.md` | Step-by-step execution plan | No |
| `result.md` | Final result summary with timestamp | No |
| `execution-log.md` | Append-only log of all executions against this intent | No |

### Deep vs Light Format

**Deep format** (~80KB+): Full design artifact used for major project intents. Example: `execution-first-ema-os` at the project level contains all 9 files — intent statement, research, decisions, outline, plan, signals, result, execution log, and status. This is a complete design document that can bootstrap an agent's understanding of a feature.

**Light format** (~34B-500B): Session recording with just `intent.md` + `status.json`. The 10 intents under `daemon/.superman/intents/` are this format — quick snapshots created during execution dispatch to record what happened.

## Daemon Modules

Source: `daemon/lib/ema/superman/`

| Module | Type | Purpose |
|--------|------|---------|
| `Ema.Superman.Supervisor` | Supervisor (one_for_one) | Starts and supervises the Superman runtime — currently starts `KnowledgeGraph` |
| `Ema.Superman.Context` | Module | Assembles rich context bundles for projects — pulls tasks, proposals, vault notes, executions, brain dump clusters |
| `Ema.Superman.KnowledgeGraph` | GenServer | In-memory knowledge graph used by vault watcher integrations and execution-time prompt enrichment |

### Superman.Context

`Context.for_project/2` builds a full situational picture for a project, used by the HQ dashboard and any agent needing project awareness. It resolves by ID or slug and returns:

- Project metadata (slug, name, status, description, linked_path)
- Recent tasks (default 10)
- Active proposals (queued/reviewing/approved, default 10)
- Recent vault notes (default 10)
- Recent executions (default 5)
- Brain dump clusters ranked by readiness_score (default 10)

## IntentFolder Module

Source: `daemon/lib/ema/executions/intent_folder.ex`

Lives in the executions context (not superman) because it's the bridge between filesystem intents and runtime execution records.

| Function | Purpose |
|----------|---------|
| `create/3` | Creates a new intent folder with `intent.md` and `status.json` |
| `write_result/3` | Writes `result.md` with timestamp |
| `append_log/5` | Appends an execution entry to `execution-log.md` |
| `read_status/2` | Reads and parses `status.json` |
| `exists?/2` | Checks if an intent folder exists |
| `slugify/1` | Converts text to a URL-safe slug (lowercase, max 60 chars) |
| `default_status/1` | Returns default status map: idle, phase 1, clarity 0, energy 0 |

### Join Key

The intent slug is the join key across all layers:
- `.superman/intents/<slug>/` directory on filesystem
- `intents.slug` column in the DB
- `execution.intent_slug` on execution records

## CLI Commands

```
ema superman health    — check Superman runtime status
ema superman status    — show intent counts and layer summary
ema superman context   — display assembled project context
ema superman ask       — query the knowledge graph
ema superman gaps      — identify knowledge gaps
ema superman index     — rebuild the knowledge graph index
```

## Related

- [[Intent-System]] — DB-side intent tree with links, events, lineage
- [[Execution-System]] — Runtime execution lifecycle, dispatch, and IntentFolder integration
