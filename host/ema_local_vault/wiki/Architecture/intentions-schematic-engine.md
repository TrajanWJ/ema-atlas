---
title: "Intentions Schematic Engine"
space: wiki
tags: ["architecture", "intents", "schematic", "verified-2026-04-07"]
source: manual
---

# Intentions Schematic Engine

**Status:** Operational. Wave 1, 2, and 3 modules implemented; migration applied; smoke tests pass.
**Last verified:** 2026-04-07

The Intentions Schematic Engine is the natural-language editing surface over the EMA intent tree. It takes a freeform update like *"we should add optimistic locking to executions"* against a dotted scope path like `personal.ema.ema-execution-engine`, parses it into a structured plan via Claude, and applies it as mutations to the [[Intent-System]] — while surfacing contradictions, clarifications, and aspirations as side outputs.

It is the "schematic editor" sibling of the [[Intent-System]]: where the Intent System owns the tree itself, the Schematic Engine owns the human-driven mutation flow over it.

## Motivation

Editing an intent tree by CRUD is brutal. Trajan thinks in narrative ("I want EMA to handle X, but not at the cost of Y"), not in `parent_id` and `slug` fields. The Schematic Engine collapses that gap: write what you mean against a scope, let Claude translate, get a plan back, and have it applied transactionally with full audit.

Beyond mutation, it captures the *byproducts of thinking*:

- **Contradictions** — when the new update clashes with existing intents, log it for later resolution rather than silently overwriting.
- **Clarifications** — when the model needs a binary/multi-choice decision from the human, queue it as a feed item.
- **Hard answers** — when the model needs a freetext answer to an open question, queue it as a hard-answer feed item.
- **Aspirations** — idealistic goals that don't yet have a home in the tree, stacked for later promotion.

## Core concepts

### Scope paths

A dotted path that resolves to a target in the intent tree. Examples:

- `personal` — entire personal space
- `personal.ema` — the EMA project under personal
- `personal.ema.ema-execution-engine` — a sub-project
- `personal.ema.ema-execution-engine.<intent-slug>` — drill into a specific intent

Resolved by `Ema.Intents.Schematic.Target.parse/1` + `Target.resolve/1`. `Target.list_paths/0` enumerates every valid path.

### Modification toggle

Per-scope kill switch. When disabled, all `Engine.update/3` calls against that scope (or any descendant) short-circuit with `{:error, {:disabled, reason}}` and write a log row recording the attempt. Used to freeze a scope during retros, audits, or while a contradictory cluster is being worked through.

State stored in `schematic_modification_state`. Managed via `ModificationToggle.{enable/2,disable/2,allowed?/1,list_states/0}`.

### Contradictions

Detected conflicts between intents in a scope, raised by the parser when it sees the new update conflict with an existing intent. Queue lives in `schematic_contradictions` with status `open | resolved | dismissed` and severity `low | medium | high | critical`.

### Aspirations

Idealistic goals stacked outside the intent tree until promoted. Live in `schematic_aspirations` with horizon `short | medium | long | lifetime` and status `stacked | promoted | retired`. Promotion creates a corresponding intent and links via `promoted_intent_id`.

### Clarifications and hard answers

Both stored as rows in `schematic_feed_items` differentiated by `feed_type`:

- `clarification` — multiple-choice question, Claude proposes options A/B/C/D each with variants 1/2/3
- `hard_answer` — freetext-required question for which the model has no good guess

Status flow: `open → answered → resolved`. Both feed types support a chat-driven resolution flow via `chat_session_id`.

## DB tables

The Wave 3 migration `priv/repo/migrations/20260408000003_create_schematic_engine.exs` creates 5 tables:

| Table | Purpose |
|-------|---------|
| `schematic_feed_items` | Clarifications and hard answers (discriminated by `feed_type`) |
| `schematic_contradictions` | Detected intent conflicts queue |
| `schematic_aspirations` | Idealistic goals stack |
| `schematic_modification_state` | Per-scope NL-edit toggle |
| `schematic_update_log` | Append-only NL update history (input, parsed plan, applied flag, errors) |

All five primary keys are string IDs; foreign keys to `intents` use `on_delete: :nilify_all` (or `:delete_all` for `intent_a_id` on contradictions).

## Engine.update flow

```
scope_path + freetext
       │
       ▼
┌──────────────────────────┐
│ Target.parse + resolve   │  → {:ok, target} | {:error, :invalid_target}
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ ModificationToggle.allowed? │ → :ok | {:error, :disabled, reason}
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ gather_context            │  existing intents in scope
│                           │  open contradictions
│                           │  last 5 update log rows
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ UpdateParser.parse        │  → Claude (Runner.run)
│  (try/rescue around CLI)  │  → strip fences, Jason.decode, normalize keys
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Repo.transaction          │
│   apply_mutations         │  create | update | reparent | delete
│   apply_contradictions    │  insert into schematic_contradictions
│   apply_clarifications    │  insert into schematic_feed_items
│   apply_aspirations       │  insert into schematic_aspirations
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ insert UpdateLog row     │  applied: true, affected_intent_ids, …
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ broadcast :schematic_event │  → Ema.PubSub topic "schematic:state"
└──────────────────────────┘
```

Failure at any step writes an `UpdateLog` row with `applied: false` and an `error` string before returning `{:error, …}`. The parser is wrapped in `try/rescue` so any runtime exception (e.g. `CostGovernor` ETS unavailable) becomes `{:error, {:runner_exception, msg}}` rather than crashing.

## CLI surface

All Schematic CLI subcommands live under `ema intent`. They are defined in `lib/ema/cli/cli.ex` (specs) and dispatched in `lib/ema/cli/commands/intent.ex` (handlers).

### Target (sticky scope)

```
ema intent target               # show current sticky scope
ema intent target list          # list all valid scope paths
ema intent target <scope-path>  # set sticky scope
```

### Update (NL freetext)

```
ema intent apply <scope-path> "freetext update"
ema intent apply --target-current "freetext update"
```

### Modification toggle

```
ema intent modification status [<scope>]
ema intent modification disable <scope> --reason "why" [--until 2026-04-15T00:00:00Z]
ema intent modification enable <scope>
```

### Contradictions

```
ema intent contradictions list [--scope ...] [--severity ...]
ema intent contradictions show <id>
ema intent contradictions resolve <id> [--note "..."]
ema intent contradictions dismiss <id>
```

### Aspirations

```
ema intent aspirations list [--scope ...]
ema intent aspirations push <title> [--scope ...] [--horizon short|medium|long|lifetime]
ema intent aspirations promote <id>
ema intent aspirations retire <id>
```

### Clarifications

```
ema intent clarifications list [--scope ...] [--status ...]
ema intent clarifications show <id>
ema intent clarifications request   # request a new clarification (manual)
ema intent clarifications answer <id> [--select A,B] [--text "..."]
ema intent clarifications chat <id>
ema intent clarifications delete <id>
```

### Hard answers

```
ema intent hard-answers list [--scope ...] [--status ...]
ema intent hard-answers show <id>
ema intent hard-answers request
ema intent hard-answers answer <id> [--text "..."]
ema intent hard-answers chat <id>
ema intent hard-answers delete <id>
```

## Wiki projection

`Ema.Intents.Schematic.Projector` is a GenServer subscribed to PubSub topic `"schematic:state"`. On each `{:schematic_event, kind}` message it debounces 5 seconds, then writes a markdown projection of the entire schematic state under:

```
<vault_root>/wiki/Schematic/
├── index.md
├── modification-state.md
├── contradictions/
├── aspirations/
├── clarifications/
└── hard-answers/
```

Files are marked `<!-- AUTO-GENERATED by Ema.Intents.Schematic.Projector — do not edit -->` and rewritten on every state change. They are read-only artifacts; the database is the source of truth.

## Key file paths

All under `daemon/lib/ema/intents/schematic/`:

| File | Purpose |
|------|---------|
| `engine.ex` | `Engine.update/3` orchestrator (target → toggle → context → parse → apply → log) |
| `target.ex` | Scope path parser/resolver, `list_paths/0`, `intents_in_scope/1` |
| `update_parser.ex` | Claude prompt builder + JSON plan decoder, defensive try/rescue |
| `modification_toggle.ex` | Per-scope enable/disable kill switch |
| `contradictions.ex` | Context module for `schematic_contradictions` |
| `contradiction.ex` | Ecto schema |
| `aspirations.ex` | Context module for `schematic_aspirations` |
| `aspiration.ex` | Ecto schema |
| `clarifications.ex` | Context module for clarification feed items |
| `hard_answers.ex` | Context module for hard-answer feed items |
| `feed_items.ex` | Shared feed-item helpers |
| `feed_item.ex` | Ecto schema for `schematic_feed_items` |
| `update_log.ex` | Ecto schema for `schematic_update_log` |
| `modification_state.ex` | Ecto schema for `schematic_modification_state` |
| `audit_server.ex` | GenServer that tracks contradictions over time |
| `projector.ex` | PubSub subscriber that writes the wiki/Schematic/ projection |

Migration: `daemon/priv/repo/migrations/20260408000003_create_schematic_engine.exs`.
CLI handlers: `daemon/lib/ema/cli/commands/intent.ex` (lines 532-1050ish).
CLI specs: `daemon/lib/ema/cli/cli.ex` (around lines 2696-2790).

## Related

- [[Intent-System]] — the underlying tree the schematic edits
- [[Context-Assembly]] — how schematic state flows into agent context
- [[PubSub-Topology]] — `"schematic:state"` topic
