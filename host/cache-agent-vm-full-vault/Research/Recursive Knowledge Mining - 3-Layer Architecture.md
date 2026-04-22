---
tags: [knowledge-graph, knowledge-extraction, entity-resolution, structured-output, agents, NLP, ontology]
summary: "A structured approach to extracting knowledge from unstructured text into a hierarchical, graph-ready format. Discovered via [[AI Landscape 2026-03-16]]"
date: 2026-03-16
status: active
confidence: 0.80
confidence_updated: 2026-03-18
category: Knowledge Engineering
source: clawhub/recursive-knowledge-miner (askxiaozhang, MIT-0)
type: research
updated: 2026-03-16
created: 2026-03-16
title: "Recursive Knowledge Mining - 3-Layer Architecture"
---

# Recursive Knowledge Mining — 3-Layer Architecture

A structured approach to extracting knowledge from unstructured text into a hierarchical, graph-ready format. Discovered via [[AI Landscape 2026-03-16]] scan. Connects to [[Agent Memory Architectures]] (semantic memory layer) and the vault's existing [[Skills/knowledge-graph|Knowledge Graph]] skill.

---

## Core Idea

Every knowledge extraction pass produces a JSON graph with **entities** (nodes) and **relations** (edges), organized into three layers:

| Layer | Role | Cardinality |
|---|---|---|
| **Core** | Central theme / main subject | 1 per extraction |
| **Primary** | Key dimensions, frameworks, high-level facets | 3–5 per core |
| **Detail** | Specific parameters, sub-technologies, data points | Many per primary |

Relations flow downward: Core → Primary → Detail. Cross-links between Detail nodes are discouraged unless a critical logical dependency exists.

## Recursive Growth Protocol

The key differentiator is **recursive consistency** — each new extraction pass checks an `existing_terms` list before creating entities:

1. **Reference Check** — Before creating a node, scan existing entity IDs for semantic overlap
2. **ID Mapping** — Reuse exact IDs for matching concepts (no duplicate nodes)
3. **Attribute Inheritance** — New relations anchor onto existing nodes, extending the graph outward

This prevents the "entity explosion" problem common in naive extraction pipelines, where the same concept spawns dozens of near-duplicate nodes across sessions.

## Output Schema

```json
{
  "reply": "Natural language explanation",
  "entities": [
    { "id": "kebab-case-id", "label": "Display Name", "group": "core|primary|detail" }
  ],
  "relations": [
    { "from": "entity_id_A", "to": "entity_id_B", "label": "active verb description" }
  ]
}
```

## Relevance to Our Stack

**Current state:** We run `ontology-sync` (every 3h) for entity extraction and `qmd` for vault search/embedding. The [[knowledge-graph]] skill is installed but produces flat entity lists.

**What this adds:**
- **Hierarchical structure** — 3-layer architecture maps cleanly to Obsidian's note/heading/detail pattern
- **Entity deduplication** — Recursive lookup against existing terms solves a real pain point in our vault (duplicate concepts across notes)
- **Graph-ready output** — JSON schema could feed directly into a visualization layer or SurrealDB (see `surrealdb-knowledge-graph-memory` on ClawHub)

**Potential integration:**
- Run recursive extraction on new vault notes at write-time (post-hook in vault-keeper)
- Feed extracted entities into `qmd` as structured metadata
- Use the 3-layer hierarchy to auto-generate MOC (Map of Content) notes

## Related Skills on ClawHub

| Skill | Relevance |
|---|---|
| `knowledge-graph` | Installed — flat entity extraction, no hierarchy |
| `knowledge-graph-skill` | Similar but less structured |
| `surrealdb-knowledge-graph-memory` | Graph DB backend for persistent agent memory |
| `agent-knowledge` | Knowledge capture (lighter weight) |

## Assessment

Interesting pattern, not a must-install. The 3-layer architecture is the valuable concept — we could adopt it as a convention for our existing knowledge extraction without installing the skill itself. The recursive dedup protocol is worth stealing for `ontology-sync` improvements.

**Action items:** None immediate. Flag for next vault-keeper or ontology-sync evolution cycle.
