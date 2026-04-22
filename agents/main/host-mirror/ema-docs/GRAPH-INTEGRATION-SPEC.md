# EMA Graph Integration Spec for Canon / Planning / Reality / Gap

Status: active planning architecture
Date: 2026-04-13

## Executive summary

This spec defines how the four EMA knowledge planes should integrate into one traversable graph without becoming one undifferentiated store.

Planes:
- canon
- planning
- reality
- gap

The graph should unify traversal, not flatten semantics.

## Core rule

The graph is a **cross-plane relationship system**, not a semantic excuse to erase plane boundaries.

Graph unification must preserve:
- source plane
- source-of-truth role
- promotion history
- contradiction/gap visibility

## Node classes

### Canon nodes
Examples:
- canon specs
- canon decisions
- canon rulings

### Planning nodes
Examples:
- aspirations
- candidate intents
- planning/schematic nodes
- promotion candidates
- planning-side GAC expansions

### Reality nodes
Examples:
- runtime docs
- backend entity contracts
- operating-reality ledgers
- backend manifest-derived records

### Gap nodes
Examples:
- canon/reality drift
- planning/reality drift
- contradiction records
- promotion blockers
- trace gaps

## Required node metadata

All graph-indexed nodes should expose at minimum:

```yaml
id: STRING
plane: canon|planning|reality|gap
subtype: STRING
status: STRING
created: ISO8601
updated: ISO8601
connections: []
```

Optional but strongly recommended:
- `source_of_truth_role`
- `promotion_state`
- `severity` (for gap nodes)
- `author`
- `summary`
- `recovered_from`
- `recovered_at`

## Cross-plane edge grammar

Recommended first-class relation families:

### Planning -> Canon
- `targets_canon`
- `proposes_update_to`
- `asks_for_ruling_on`
- `derived_from`

### Planning -> Reality
- `targets_runtime_surface`
- `intends_to_shape`
- `blocked_by_reality`
- `validated_by_reality`

### Gap -> Canon/Planning/Reality
- `identifies_gap_in`
- `contradicted_by_reality`
- `underdecomposed_from_canon`
- `blocks_promotion_of`
- `resolved_by`

### Reality -> Canon/Planning
- `implements`
- `partially_realizes`
- `diverges_from`
- `operationalizes`

### Promotion / lineage edges
- `promoted_to`
- `ratified_as`
- `operationalized_as`
- `supersedes`
- `superseded_by`

## Query model

The graph/index layer should support queries like:

- show all planning nodes targeting a canon spec
- show all open gaps against a canon decision
- show all reality docs that implement or diverge from a planning node
- show planning nodes blocked by unresolved contradiction gaps
- show promotion candidates linked to Blueprint Planner and not yet ratified
- show execution lineage back to planning and canon origins

## Read model recommendation

Over time, EMA should support derived read models such as:
- `Canon Trace View`
- `Planning Graph View`
- `Gap Ledger View`
- `Reality Alignment View`
- `Promotion Queue View`

These are graph projections, not new sources of truth.

## Indexing strategy

1. file-backed semantic nodes remain authoritative for canon/planning/gap wiki artifacts
2. operational docs remain authoritative for reality docs
3. graph index extracts frontmatter, links, and typed relations
4. runtime DB can cache/query these nodes, but should not silently mutate semantic artifacts

## Anti-patterns

Do not:
- infer canon changes from reality alone
- treat links as proof of promotion
- collapse planning and runtime intents into one node type too early
- delete resolved gaps without preserving their lineage

## Practical implication

EMA's graph becomes stronger by making cross-plane traversal explicit, not by pretending all nodes are the same kind of truth.
