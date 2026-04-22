# Track E Work Breakdown

## Phase 0 — Canon and ontology foundation

### TE-001
Define final day-one object taxonomy.
- Output: object registry
- Depends on: none

### TE-002
Define final day-one edge taxonomy.
- Output: edge registry
- Depends on: TE-001

### TE-003
Finalize canon-model.
- Output: canon-model.md
- Depends on: TE-001, TE-002

### TE-004
Finalize concept seed including planning/calendar objects.
- Output: concept-seed.json
- Depends on: TE-003

### TE-005
Create perspective registry.
- Output: perspectives.ts + docs
- Depends on: TE-004

## Phase 1 — Typed graph and planning graph substrate

### TE-101
Create Postgres schema.
- Output: db init SQL
- Depends on: Phase 0

### TE-102
Create TS/Zod domain schema.
- Output: schema.ts
- Depends on: TE-101

### TE-103
Add version/event lineage model.
- Output: version + event support
- Depends on: TE-101

### TE-104
Add planning/meta-program object support.
- Output: phase/task/subproject/calendar fixtures
- Depends on: TE-102

## Phase 2 — Blueprint and projections

### TE-201
Implement blueprint object/view model.
### TE-202
Implement ephemeral canvas items.
### TE-203
Implement promotion flow.
### TE-204
Implement concept/evidence/freshness overlays.

## Phase 3 — Feeds / wiki / contradiction surfaces

### TE-301
Implement feed item contract and ranking.
### TE-302
Implement why-surfaced generation.
### TE-303
Implement canon-backed wiki rendering.
### TE-304
Implement contradiction/freshness badges and read-models.

## Phase 4 — Research import and cross-pollination

### TE-401
Implement source/artifact/claim import chain.
### TE-402
Implement suggestion engine.
### TE-403
Implement cross-pollination transfer scoring.
### TE-404
Implement external-pattern fixture imports.

## Phase 5 — Meta-EMA self-modeling

### TE-501
Inventory EMA source docs by plane.
### TE-502
Import core EMA docs as source/artifact/claim/concept objects.
### TE-503
Represent EMA tracks/phases/tasks as graph objects.
### TE-504
Represent gaps/contradictions/promotions explicitly.

## Phase 6 — Hardening and rollout

### TE-601
Add evaluation metrics.
### TE-602
Run operator question-answering scenarios.
### TE-603
Mark v1/v1.1+ scope boundary.
### TE-604
Publish rollout/demo checklist.

## Parallelization notes
- TE-101 and TE-102 are sequential
- TE-201/202 can run in parallel after schema is stable
- TE-301 and TE-303 can run in parallel after read-model basics exist
- TE-401 and TE-501 can run in parallel
- TE-602 should use realistic imported EMA docs, not toy fixtures only
