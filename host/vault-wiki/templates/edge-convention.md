---
type: knowledge
created: '2026-03-20'
tags:
  - meta
  - convention
  - graph
wiki_id: templates/edge-convention
imported_from: vault/Templates/edge-convention.md
imported_at: '2026-04-04T00:23:57.280Z'
summary: ''
---

# Edge Convention — Typed Frontmatter Relationships

## Overview

Vault notes can declare explicit typed relationships to other notes using the `edges:` frontmatter field. These edges are parsed by ontology-sync and stored as typed relationships in the Neo4j knowledge graph.

## Syntax

```yaml
---
edges:
  - type: informs
    target: "[[Target Note]]"
  - type: supersedes
    target: "[[Old Note]]"
  - type: depends_on
    target: "[[Dependency Note]]"
---
```

## Edge Types

| Type | Meaning | Example |
|---|---|---|
| `implements` | This note describes building/realizing the target | Architecture note → Project spec |
| `supersedes` | This note replaces/updates the target | New design → Old design |
| `contradicts` | Conflicting claims (flag for review) | Research finding → Prior assumption |
| `informs` | This note provides context/research for the target | Research → Architecture decision |
| `depends_on` | This note depends on the target | Feature → Prerequisite |
| `aspires_to` | Current state → aspirational doc | Current system → Future vision |
| `authored_by` | Attribution to agent or human | Note → Agent/Person |
| `instance_of` | Specific → category | "Memoria" → "Tool" |
| `related` | Generic relationship (default) | Any → Any |

## Heuristic Classification

When `edges:` frontmatter is not present, the system uses heuristics:

- **Research/ → Architecture/Decisions/Projects** → `INFORMS`
- **Trajan/Aspirational\*** → `ASPIRES_TO`
- **Context mentions "replaces", "supersedes"** → `SUPERSEDES`
- **Context mentions "depends on", "requires"** → `DEPENDS_ON`
- **Context mentions "implements", "built from"** → `IMPLEMENTS`
- **Context mentions "contradicts", "conflicts"** → `CONTRADICTS`
- **All other links** → `RELATED` (kept as existing `LINKS_TO`)

## Querying

Use `vault-graph-query.sh` to explore the graph:

```bash
# See all INFORMS edges
vault-graph-query.sh typed INFORMS

# See neighbors of a note
vault-graph-query.sh neighbors "Memoria"

# Find path between notes
vault-graph-query.sh path "SOUL" "Agent Roster"

# Graph stats
vault-graph-query.sh stats
```

## Graph-Enriched Search

Use `qmd-graph-search.sh` for semantic search with graph context:

```bash
qmd-graph-search.sh "agent memory architecture"
```

This runs QMD semantic search and enriches results with 1-hop graph neighbors — "spreading activation lite."
