---
title: Vault Cognitive Layer
created: '2026-03-20'
updated: '2026-03-20'
type: knowledge
status: active
confidence: 0.85
confidence_updated: 2026-03-20T00:00:00.000Z
source: implementation
tags:
  - vault
  - cognitive
  - graph
  - metabolism
  - activation
  - architecture
edges:
  - type: implements
    target: '[[Aspirational Vault Architecture]]'
  - type: depends_on
    target: '[[Agent Architecture Overview]]'
summary: >-
  Three subsystems making the vault an active participant: metabolism
  (activation decay), graph (typed edges + enriched search), and cognition
  (context injection, contradiction detection, gap analysis).
wiki_id: system/architecture/Vault-Cognitive-Layer
imported_from: vault/Architecture/Vault-Cognitive-Layer.md
imported_at: '2026-04-04T00:23:56.775Z'
---
# Vault Cognitive Layer

> **Status:** 🔨 ACTIVE  
> **Built:** 2026-03-20  

## Architecture

Three subsystems that transform the vault from passive storage into an active knowledge participant:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  METABOLISM   │    │    GRAPH     │    │  COGNITION   │
│  (decay/rank) │    │ (typed edges)│    │ (inject/detect)│
│  cron: 4am   │    │ ontology-sync│    │  cron: 5am   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    ┌──────┴───────┐
                    │   VAULT      │
                    │ 716 notes    │
                    │ Neo4j graph  │
                    │ QMD index    │
                    └──────────────┘
```

## 1. Metabolism Subsystem

ACT-R-inspired activation tracking with differential decay by vault zone.

| Zone | Decay Rate | Rationale |
|---|---|---|
| Architecture/ | 0.3 | Core decisions age slowly |
| System/ | 0.4 | Config changes infrequently |
| Reference/ | 0.4 | Stable knowledge |
| Research/ | 0.5 | External intel ages faster |
| Daily Notes/ | 0.8 | Ephemeral by nature |

**Scripts:**
- `qmd-search-instrumented.sh` / `qmd-context-instrumented.sh` — log retrievals to `.activations.jsonl`
- `vault-activation-scores.sh` — compute base-level activation per note
- `qmd-activated-search.sh` — re-rank semantic results by activation × score
- `vault-auto-promote.sh` — Daily Notes with 3+ retrievals → permanent vault
- `vault-auto-demote.sh` — stale Research notes → `_deprecated/` (dry-run default)
- `vault-metabolism-cron.sh` — daily cycle (cron: `0 4 * * *`)

## 2. Graph Subsystem

Typed edges in Neo4j, extracted from vault link context.

**Edge types created (3484 total):**
- LINKS_TO: 1916 (original wikilinks)
- INFORMS: 1356 (Research/Reference → other notes)
- ASPIRES_TO: 77 (aspirational doc links)
- INSTANCE_OF: 55
- DEFINED_IN: 48
- DEPENDS_ON: 3
- IMPLEMENTS: 2

**Scripts:**
- `vault-graph-edges.sh` — classify LINKS_TO → typed edges via context heuristics
- `vault-graph-query.sh` — Neo4j query helper (stats, neighbors, paths)
- `qmd-graph-search.sh` — semantic search + 1-hop graph neighbors

**Key fix:** QMD returns lowercase paths (`research/foo.md`), Neo4j stores original case (`Research/Foo.md`). All queries use `toLower()` for matching.

## 3. Cognition Subsystem

Proactive knowledge management — context injection, contradiction detection, gap analysis.

**Scripts:**
- `dispatch-context-inject.sh` — takes task description → outputs CONTEXT_REFS block (QMD semantic + Neo4j graph)
- `vault-contradiction-detect.sh` — flags notes with divergent confidence scores for same entities
- `vault-knowledge-gaps.sh` — scans aspirational docs, classifies goals as COVERED/THIN/MISSING
- `vault-belief-extract.sh` — surfaces implicit beliefs from frontmatter/takeaways
- `vault-causal-trace.sh` — post-task knowledge quality scoring
- `vault-cognitive-cron.sh` — daily cycle (cron: `0 5 * * *`)

**Current findings (2026-03-20):**
- 120 contradiction candidates (mostly confidence divergence)
- 44 aspirational goals: 20 COVERED, 9 THIN, 15 MISSING
- 797 belief candidates identified

## Data Files

| File | Purpose |
|---|---|
| `.activations.jsonl` | Raw retrieval log |
| `System/contradictions.jsonl` | Detected contradictions |
| `System/knowledge-gaps.json` | Goal coverage analysis |
| `System/belief-candidates.jsonl` | Extracted beliefs |
| `dispatch/causal-traces.jsonl` | Post-task knowledge quality |

## Integration Points

- **Agent dispatch:** `dispatch-context-inject.sh` can be called before any agent spawn to auto-populate CONTEXT_REFS
- **Search:** `qmd-activated-search.sh` and `qmd-graph-search.sh` replace raw `qmd search` for context-aware results
- **Heartbeat:** Cognitive cron results feed into daily status checks
- **Auto-knowledge:** Gap analysis identifies MISSING goals → can auto-generate research dispatch tasks

## Related

- [[Aspirational Vault Architecture]]
- [[Aspirational Knowledge Loop]]
- [[Agent Architecture Overview]]
- [[Queue Architecture v2]]
