---
title: "Stack Decisions"
space: wiki
tags: ["user","stack","decisions"]
source: migrated-from-obsidian
---

# Stack Decisions

Migrated from Obsidian `AI Knowledge/My Stack Decisions.md` on 2026-04-06.

## Current Stack (as of 2026-04-06)

### EMA (Primary)
- Daemon: Elixir/Phoenix 1.8, port 4488
- CLI: Elixir escript, v3.0.0 (20+ command groups, 50+ subcommands)
- Frontend: Tauri 2 + React 19 + Zustand (48 vApps, glass morphism)
- DB: SQLite via Ecto (114 migrations, local) + dispatch.db (bash-managed, agent-vm)
- Vault: FTS5 markdown indexer

### Claude Code
- Version: 2.1.92
- Plugins: Superpowers v5.0.7, Context7, rust-analyzer-lsp
- MCP: EMA, filesystem, CodeGraphContext
- Hooks: none (stripped 2026-04-05)

### Rejected/Removed
- **claude-mem** → replaced by vault-native memory (QMD + recall + session logs)
- **CloudCLI** → removed
- **Mission Control** → removed 2026-03-13, searching for better orchestration
- **OpenClaw** → archived, gateway still running (needs kill)
- **n8n, LibreChat, CopilotKit** → deferred

### Key Decisions
- **Memory:** Vault-native over external tools. "A simple CLAUDE.md followed 80% beats a comprehensive one followed 10%."
- **Knowledge graph:** libgraph (pure Elixir) + ETS persistence
- **WebSocket:** Phoenix npm + Zustand store (not React state)
- **Prompts:** EMA DB (versioned, hot-reload, A/B testable)
- **Store pattern:** `loadViaRest()` initial + `connect()` for Phoenix channel sync

## 2026-04-06: Intent Engine — Unified Schema

**Decision:** Replace fragmented IntentMap + IntentNode + HarvestedIntents surfaces with a single unified `intents` schema (+ `intent_links` + `intent_events`).

**Why:** The old approach had intent-like data scattered across 4+ tables with incompatible shapes. IntentMap/IntentNode lived in `intelligence/`, HarvestedIntents in `intention_farmer/`, execution scratchpads on disk in `.superman/intents/`. No single query could answer "what are all the intents for this project?"

**Shape:** `intents` holds semantic identity (title, slug, level 0-5, kind, parent_id). `intent_links` bridges to operational records (tasks, executions, proposals, brain_dumps) via polymorphic linkable_type/linkable_id. `intent_events` is append-only lineage.

**Source:** Brainstorm session 2026-04-06.

## 2026-04-06: Wiki as Primary Knowledge Surface

**Decision:** The EMA wiki at `~/.local/share/ema/vault/wiki/` is the authoritative knowledge reference, replacing dependency on Superman/CodeGraphContext for project understanding.

**Why:** CodeGraphContext requires a running FalkorDB instance and ast-grep indexing. The wiki is plain markdown, always available, version-controlled via vault, and editable by both humans and SystemBrain projections. For architecture understanding, curated wiki pages beat auto-indexed code graphs.

**Trade-off:** Loses automatic code-level relationship discovery. Acceptable because the intent engine + SystemBrain projections cover the gap for operational awareness, and manual curation produces higher-quality architectural documentation.

## 2026-04-06: Three Core Truths Model

**Decision:** The knowledge architecture recognizes three coequal truth domains rather than one unified store:

- **Semantic truth** — intents hierarchy (what and why)
- **Operational truth** — executions, tasks, proposals, sessions (how and when)
- **Knowledge truth** — curated wiki, vault, docs (the known)

**Why:** Flattening all three into one DB creates schema bloat and semantic confusion. Flattening into one filesystem creates stale generated files masquerading as curated knowledge. The bridge pattern (intent_links for semantic-to-operational, context assembly for semantic-to-knowledge, projections as downstream derivatives) keeps each domain clean.

**Source:** Brainstorm session 2026-04-06.

## Related
- [[Trajan Profile]]
- [[Claude Code Setup]]
- [[Intent System]]
- [[Intent Engine]]
