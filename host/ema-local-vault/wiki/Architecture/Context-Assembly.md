---
title: "Context Assembly"
space: wiki
tags: ["architecture", "context", "execution", "knowledge"]
source: manual
---

# Context Assembly

How EMA builds execution-ready context bundles. Context is assembled, not dumped — bounded by token budget, ordered by provenance, and drawn from all three truth domains.

## Three Context Modules

EMA has three complementary context assembly paths. They serve different consumers but follow the same principles.

### 1. ContextAssembler (Memory Tier)

**File:** `daemon/lib/ema/memory/context_assembler.ex`
**Consumer:** Pre-dispatch enrichment for agent runs

Uses a hot/warm/cold tiering strategy:

| Tier | Window | Always included? | Content |
|------|--------|-------------------|---------|
| **HOT** | Last 2 hours | Yes | Recent executions + active proposals + open intents |
| **WARM** | Last 48 hours | Only if token budget allows | Completed/failed execution outcomes + relevant vault notes |
| **COLD** | All time | Yes (as headers) | Project description + user facts (constraints/preferences) |

**Token budget:** Default 4000 tokens. Cold and hot tiers are always included. Warm tier is added only if remaining budget exceeds 500 tokens after cold + hot estimation.

**Intent fallback:** Tries the new `Ema.Intents` table first, falls back to legacy `IntentMap` during the transition period.

**Entry point:**
```elixir
ContextAssembler.context_for("ema", max_tokens: 4000, include: [:hot, :warm, :cold])
# => {:ok, %{cold: %{...}, hot: %{...}, warm: %{...}, token_estimate: 1847}}
```

### 2. ContextBuilder (File-Based)

**File:** `daemon/lib/ema/intelligence/context_builder.ex`
**Consumer:** Per-execution context injection (prepended to prompts)

Reads from local files only — degrades gracefully when files are missing:

| Source | What it fetches |
|--------|----------------|
| `~/.local/share/ema/outcome-tracker.json` | Recent execution outcomes matching the domain/mode |
| `vault/Trajan/Preferences.md` | User preferences (first 100 lines) |
| `vault/Daily Notes/YYYY-MM-DD.md` | Today's daily note (first 2000 chars) |
| Vault grep | Files matching the execution title (top 3 results, first 100 lines each) |

**Entry point:**
```elixir
ContextBuilder.build_context(execution)
# => %{recent_outcomes: "...", user_preferences: "...", daily_context: "...", relevant_vault: [...]}

ContextBuilder.inject_context(prompt, context)
# => "## Pre-Dispatch Context\n\n### Recent outcomes\n...\n\n---\n\n<original prompt>"
```

### 3. ContextInjector (Event-Driven)

**File:** `daemon/lib/ema/claude/context_injector.ex`
**Consumer:** Intelligence Router and Pipes claude_action

Fetches live data from domain modules per requested key:

| Key | Source Module | What it returns |
|-----|-------------|----------------|
| `:project` | `Ema.Projects` | Project id, name, slug, description, status |
| `:goals` | `Ema.Goals` | Active goal tree (top-level + children) |
| `:vault` | `Ema.VaultIndex` | Semantic search results (top 5) — currently a stub |
| `:tasks` | `Ema.Tasks` | Recent tasks (10) + blocked tasks (5) |
| `:energy` | `Ema.Journal` | 7-day energy/mood trend + average |
| `:proposals` | `Ema.Proposals` | Similar proposals (5) scoped by project |

**Graceful degradation:** Each key is fetched independently. Failed keys are logged and excluded, not hard errors. The result contains only keys that succeeded.

**Entry point:**
```elixir
ContextInjector.build_context(event, [:project, :goals, :tasks, :energy])
# => {:ok, %{project: %{...}, goals: [...], tasks: %{recent: [...], blocked: [...]}, energy: %{...}}}
```

## How Intents Feed Into Context Assembly

The Intent Engine extends context assembly (it does not replace it):

### Selection Layers (precedence order)

1. **Semantic selection** — the intent itself, parent chain, direct edge neighbors from `intent_links`
2. **Operational selection** — linked executions, proposals, sessions, tasks via `intent_links`. Most recent first. Include outcome data from prior runs.
3. **Project-scoped knowledge** — curated wiki pages matching `project_id`. Architecture docs, decision records, conventions.
4. **Host machine knowledge** — QMD semantic search against indexed vault, bounded to top-5 results above similarity threshold 0.5. Prefer curated over noisy.
5. **Agent VM scratch** — only if explicitly referenced or if the intent was harvested from an agent VM session. Not included by default.

### Precedence Rules

- Curated wiki > generated projections > imported mirrors > agent scratch
- Project-local docs > cross-project general knowledge
- Recent operational data > historical
- High-confidence sources > lower-confidence candidates
- Direct intent linkage > semantic similarity

### What to Always Include

- The intent itself (title, description, status, phase)
- Parent/child spine (for hierarchy context)
- Direct dependencies (from `intent_links`)
- Linked executions, proposals, tasks (from `intent_links`)
- High-confidence lineage entries (from `intent_events`)

### What to Prefer Next

- Curated EMA wiki pages (from `vault/wiki/`)
- Project-local specs and notes (from `vault/projects/<slug>/`)
- Repo docs (from `docs/`)
- Directly linked host-machine docs

### What to Include Conditionally

Only when linked, recent, or corroborating:

- Recent session captures
- Harvested notes
- Execution scratchpads
- Imported archives

### What to Avoid by Default

- Noisy archives
- Broad search dumps
- Stale projections
- Unconfirmed cluster output

## Implementation Status

| Module | Status | Notes |
|--------|--------|-------|
| `ContextAssembler` | Working | Hot/warm/cold tiers, token budgeting, intent fallback |
| `ContextBuilder` | Working | File-based, grep search, daily notes |
| `ContextInjector` | Working | 6 keys, graceful degradation. `:vault` key is a stub (VaultIndex.semantic_search not implemented) |
| Intent-aware context | Designed | Spec calls for extending ContextInjector with `:intents` key and `:host_knowledge` key |

The planned extension adds two new keys to ContextInjector:
- `:intents` — fetches intent parent chain + edge neighbors + linked operational history
- `:host_knowledge` — QMD semantic search with provenance tags

## Related Pages

- [[Knowledge-Topology]] — the three core truths that context assembly bridges
- [[Vault-Structure]] — where vault content lives on disk
- [[Cross-Pollination]] — what flows between host, EMA, and agent_vm
- [[Execution-System]] — the dispatch pipeline that consumes assembled context
