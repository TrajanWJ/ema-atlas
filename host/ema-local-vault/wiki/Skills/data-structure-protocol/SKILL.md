---
name: data-structure-protocol
description: Graph-based long-term memory protocol — entities, edges, and the discipline that keeps the graph queryable years later.
triggers:
  - knowledge graph
  - entity extraction
  - relationships
  - graph memory
  - structured data
---

# Goal

Capture facts as entities and edges so future agents can traverse the knowledge instead of re-reading every note.

## Inputs

- An unstructured input (note, message, brain dump, doc)
- The current entity types in the graph
- The current edge types in the graph

## Workflow

1. **Extract entities first.** People, projects, decisions, tools, places. Each entity has: stable ID, type, canonical name, aliases, source.
2. **Resolve before creating.** Always check for an existing entity by canonical name and aliases before adding a new one. Duplicates are the death of a graph.
3. **Extract edges with types.** "Trajan uses Cursor" → `(actor:trajan) -[uses]-> (tool:cursor)`. The edge type comes from a fixed vocabulary; do not invent edge types per fact.
4. **Stamp every edge with provenance.** Source (which note/message), confidence, observed-at. Without provenance you cannot retract a wrong edge later.
5. **Resolve contradictions explicitly.** If a new fact contradicts an old one, do not overwrite — create a new edge with a later timestamp and a `supersedes` link to the old one.
6. **Keep the schema small.** ≤20 entity types and ≤30 edge types. Beyond that, queries become guessing games.
7. **Project queryable views.** The raw graph is for storage. Build named views (`active_projects`, `current_blockers`) for the agent to consume.

## Output Contract

A graph extraction pass is acceptable when:
- Every entity has type, canonical name, source
- Every edge has typed verb, both endpoints, source, observed-at
- No duplicates against existing entities (verified)
- No new edge types invented (or new types added to the schema doc with rationale)
- The pass is reversible — given the source, you can identify and remove every entity and edge it produced

## Common Failure Modes

- **Free-form entity types.** "Person", "person", "individual", "human" — pick one.
- **Edge types as sentences.** `is_friend_of_and_collaborates_with` is two edges.
- **No deduplication.** The graph fills with `Trajan W.`, `Trajan Wiley`, `trajan` as separate nodes.
- **No provenance.** When the user says "that's wrong," you cannot find which edge to remove.
- **Overwriting on contradiction.** History is lost; the agent cannot explain its current belief.
- **Querying raw nodes.** Without projected views, every read is a custom traversal.

## See Also

- `daemon/lib/ema/second_brain/graph_builder.ex`
- `daemon/lib/ema/memory.ex`
- Skill: `memory-systems`
