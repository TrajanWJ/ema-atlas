---
title: "Knowledge Topology"
space: wiki
tags: ["architecture", "knowledge", "intents", "topology"]
source: manual
---

# Knowledge Topology

How EMA organizes truth. Three coequal domains, two bridges, and strict rules about what is canonical vs derived.

Source: `docs/INTENT-ENGINE-SPEC.md`, `docs/superpowers/specs/2026-04-06-intent-engine-design.md`

## Three Core Truths

The Intent Engine sits at the intersection of three truth domains. None absorbs the others. Getting this wrong — treating intents as the only truth — produces a brittle system that fights the rest of EMA.

### 1. Semantic Truth

**What you are trying to do and how it relates.**

Two layers, one truth:

| Layer | Location | Role |
|-------|----------|------|
| **Filesystem (anchor)** | `.superman/intents/<slug>/` | Durable memory. Human-readable. Survives DB resets. Agent read/write target. |
| **Database (runtime)** | `intents` + `intent_links` + `intent_events` | Queryable graph. Tree ops. Status propagation. API/MCP surface. |

The filesystem is canonical — the DB is rebuilt from it. Join key: `slug` matches directory name and DB column.

| Table | Purpose |
|-------|---------|
| `intents` | Runtime identity + mutable state (queryable view of filesystem intents) |
| `intent_links` | Bridges intents to operational records (polymorphic: intent_id, linkable_type, linkable_id, role, provenance) |
| `intent_events` | Append-only lineage spine (audit trail, not event sourcing) |

All DB writes go through `Ema.Intents` context module. Filesystem writes go through `Ema.Executions.IntentFolder`.

### 2. Operational Truth

**What actually happened.**

Stored in home domain tables — unchanged by the Intent Engine:

- **Executions** — dispatch records, outcomes, completion status
- **Sessions** — Claude Code session history (imported from `.jsonl`)
- **Proposals** — AI-generated ideas through the 7-stage pipeline
- **Tasks** — actionable work items with status transitions
- **Goals** — goal hierarchy with key results
- **Brain Dumps** — inbox capture items

These tables are not absorbed into the intent graph. They remain in their home domains.

### 3. Knowledge Truth

**What is worth remembering.**

Stored across multiple filesystem locations with different trust levels:

| Location | Content |
|----------|---------|
| `~/.local/share/ema/vault/wiki/` | Curated EMA wiki (operator-authored, highest trust) |
| `~/.local/share/ema/vault/projects/ema/` | Project-local specs, plans, notes |
| `~/Projects/ema/docs/` | Repo docs (architecture truth, implementation truth) |
| `~/.local/share/ema/vault/imports/host/` | Selective extracts from host machine |
| `~/vault/` | QMD-indexed host knowledge base (168 docs) |
| `~/Documents/obsidian_first_stuff/twj1/` | Legacy Obsidian vault (read-only) |

Indexed by `Ema.SecondBrain` (vault watcher + graph builder) and `Ema.SecondBrain.Indexer`.

## Two Bridges

### intent_links: Semantic <-> Operational

The `intent_links` polymorphic join table connects intents to operational records:

```
intent_id       FK -> intents
linkable_type   "execution" | "proposal" | "task" | "goal" | "brain_dump" | "session" | "harvest" | "vault_note" | "doc"
linkable_id     the foreign ID
role            "origin" | "evidence" | "derived" | "related" | "superseded" | "context"
provenance      "manual" | "approved" | "execution" | "harvest" | "cluster" | "import"
```

An intent accumulates many operational attachments over time. The intent graph remains semantically stable even as operational history churns beneath it.

### Context Assembly: Semantic <-> Knowledge

When an intent needs context for execution, `Ema.Memory.ContextAssembler` and `Ema.Claude.ContextInjector` assemble a bounded, provenance-aware bundle. See [[Context-Assembly]] for full details.

Selection precedence:
1. Curated wiki > generated projections > imported mirrors > agent scratch
2. Project-local docs > cross-project general knowledge
3. Recent operational data > historical
4. High-confidence sources > lower-confidence candidates

## Canonical vs Derived

### Canonical Stores (loss = data loss)

| Store | Why canonical |
|-------|--------------|
| `.superman/intents/<slug>/` | **Durable semantic anchor.** Human-readable intent text, decisions, research, execution logs. Survives DB resets. Committed to git. The DB can be rebuilt from these folders; the reverse is not true. |
| `wiki/` vault directory | Curated operator knowledge |
| `archive/` vault directory | Immutable historical records |

### Runtime Stores (loss = rebuild from canonical)

| Store | Rebuilt from |
|-------|-------------|
| `intents` table | `.superman/intents/` via import script (source_fingerprint: "superman:<slug>") |
| `intent_links` table | Re-derived from execution/proposal/task associations |
| `intent_events` table | Lineage spine — partially rebuildable from execution history |

### Derived Stores (loss = regenerate freely)

| Store | Regenerated from |
|-------|-----------------|
| `vault/intents/` notes | intents table (SystemBrain projection) |
| `vault/system/state/intents.md` | intents table (SystemBrain snapshot) |
| `ema intent tree` CLI output | intents table (rendered view) |
| `vault/imports/` | Source systems (re-importable) |

**Key principle:** The filesystem (`.superman/`) is the durable anchor. The DB (`intents` + links + events) is the queryable runtime view. This follows the same pattern as git: `.git/` is canonical, the working tree is derived.

## Projection Rules

Projections are downstream of truth stores, not peers to them.

| Output | Source | Trigger | Overwrite policy |
|--------|--------|---------|-----------------|
| `vault/intents/` notes | intents DB | SystemBrain debounce (5s) | Regenerated freely |
| `vault/system/state/intents.md` | intents DB | SystemBrain debounce (5s) | Regenerated freely |
| `.superman/intents/<slug>/` | intents + executions | On brain dump / execution complete | `intent.md` regenerated; `execution-log.md` append-only |
| `vault/imports/host/` | Host machine vault | Manual or scheduled ingest | Source-labeled, never overwrites curated wiki |
| `vault/imports/agent-vm/` | Agent VM workspace | Manual or scheduled ingest | Source-labeled, provisional until promoted |

Key rule: **projections should never silently overwrite curated sources.** Staleness must be inspectable.

## Provenance and Confidence

Not all sources are equally trustworthy:

| Confidence | Sources | Behavior |
|------------|---------|----------|
| **High** | Manual creation, approved proposals, execution-backed signals, goal creation | Creates intent directly at stated level |
| **Medium** | Brain dumps, harvested session intents | Creates leaf intents (level 4-5). Promoted only via operator or clustering confirmation |
| **Lower** | Cluster inference, structural auto-analysis, crystallization | Creates candidates with `status: planned`, `tags: ["candidate"]`. Requires confirmation threshold |

**Guardrail:** The graph may speculate. Curated knowledge should not speculate without evidence.

## Related Pages

- [[Vault-Structure]] — directory layout, folder discipline, agent-writability
- [[Context-Assembly]] — how context is assembled for execution
- [[Cross-Pollination]] — host <-> EMA <-> agent_vm flows and guardrails
- [[Intent-System]] — the Intent Engine bootstrap plan
