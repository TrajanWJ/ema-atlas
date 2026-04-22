# EMA Intention + Gap Topology

Status: active planning architecture
Date: 2026-04-13

## Executive summary

This document defines the concrete filesystem + graph topology for:
- intention-building artifacts
- gap artifacts
- promotion/trace links between planes

The goal is to fit EMA's existing wiki/graph structure without:
- contaminating canon
- overloading runtime intents
- flattening planning, reality, and contradiction into one store

## Design goals

1. Preserve `ema-genesis/` as the semantic/graph home.
2. Keep files human-readable and diff-friendly.
3. Keep graph edges explicit and indexable.
4. Avoid creating duplicate semantic objects across planes.
5. Make promotion from planning -> canon or planning -> execution explicit.

## Recommended top-level topology

Inside `ema-genesis/`, keep the existing structure and add two new top-level directories:

```text
ema-genesis/
  canon/
  intents/
  executions/
  proposals/
  research/
  vapps/
  _meta/
  planning/
  gaps/
```

## Why these two new roots exist

### `planning/`
Holds intention-building artifacts that are not yet canon and not yet operational runtime truth.

This prevents `intents/` from becoming a junk drawer for every schematic idea, aspiration, and decomposition note.

### `gaps/`
Holds first-class gap records.

This prevents contradictions, drift, and promotion blockers from being hidden inside arbitrary docs or mixed into `_meta/` and planning notes.

## `planning/` structure

Recommended internal layout:

```text
ema-genesis/planning/
  aspirations/
  gac-extensions/
  candidate-intents/
  schematic/
  promotion-candidates/
  _moc/
```

### `planning/aspirations/`
For aspirations that should remain visible and queryable without prematurely becoming intents.

ID pattern:
- `ASP-001-...md`

Use for:
- long-horizon desires
- repeated future-facing themes
- manually curated aspiration records

### `planning/gac-extensions/`
For planning artifacts derived from GAC work but not themselves canonical GAC queue items.

ID pattern:
- `PGQ-001-...md`

Use for:
- expanded design responses
- follow-up branches from GAC answers
- question clusters / synthesized planning trees

### `planning/candidate-intents/`
For work-intents under formation that are not yet runtime `intents/` nodes.

ID pattern:
- `CINT-001-...md`

Use for:
- potential new work streams
- decomposed intent hierarchies under construction
- thematic intent clusters before ratification or operationalization

### `planning/schematic/`
For higher-order planning/schematic nodes.

ID pattern:
- `PLAN-001-...md`
- `SCHEM-001-...md`

Use for:
- project schematic branches
- system-shape planning
- architecture slices
- planning structures that organize multiple candidate intents

### `planning/promotion-candidates/`
For artifacts that may be ready for promotion into canon or executional work.

ID pattern:
- `PROMO-001-...md`

Use for:
- plan -> canon promotion candidates
- plan -> proposal candidates
- reality -> canon promotion candidates

### `planning/_moc/`
Maps of content and index pages.

Use for:
- planning MOCs
- schematic registries
- aspiration indexes
- candidate-intent indexes

## `gaps/` structure

Recommended internal layout:

```text
ema-genesis/gaps/
  canon-reality/
  planning-reality/
  canon-planning/
  contradictions/
  promotions/
  trace/
  _moc/
```

### `gaps/canon-reality/`
ID pattern:
- `GAP-CR-001-...md`

Use for:
- canonical targets not implemented
- reality diverging from canon

### `gaps/planning-reality/`
ID pattern:
- `GAP-PR-001-...md`

Use for:
- planning intentions not implemented
- planning drift from actual system behavior

### `gaps/canon-planning/`
ID pattern:
- `GAP-CP-001-...md`

Use for:
- canon commitments not yet decomposed into planning/intention-building artifacts

### `gaps/contradictions/`
ID pattern:
- `GAP-X-001-...md`

Use for:
- direct contradictions between docs, specs, reality, or planning claims

### `gaps/promotions/`
ID pattern:
- `GAP-PM-001-...md`

Use for:
- mature artifacts awaiting promotion
- blocked promotion cases

### `gaps/trace/`
ID pattern:
- `GAP-TR-001-...md`

Use for:
- runtime behavior that cannot be traced back to canon/planning intent
- planning/canon items with no implementation trace path

### `gaps/_moc/`
Maps of content and ledger indexes.

## Plane-specific storage rule

### Canon stays where it is
- `ema-genesis/canon/*`

### Runtime intents stay where they are
- `ema-genesis/intents/*`

### Executions stay where they are
- `ema-genesis/executions/*`

### Planning under formation moves to / or starts in
- `ema-genesis/planning/*`

### Gap records live in
- `ema-genesis/gaps/*`

This means `intents/` should be interpreted as closer to:
- durable semantic work commitments

rather than:
- every fleeting or pre-committed planning artifact

## Node schema conventions

## Common frontmatter for planning nodes

```yaml
id: CINT-001
plane: planning
subtype: candidate_intent
status: draft
created: 2026-04-13
updated: 2026-04-13
author: human|agent
summary: "One-line summary"
connections:
  - { target: "[[canon/specs/BLUEPRINT-PLANNER]]", relation: references }
  - { target: "[[gaps/GAP-PR-001-example]]", relation: blocked_by_gap }
  - { target: "[[planning/aspirations/ASP-001-example]]", relation: derived_from }
tags: [planning, candidate-intent]
```

## Common frontmatter for gap nodes

```yaml
id: GAP-PR-001
plane: gap
subtype: planning_reality
status: open
severity: high
created: 2026-04-13
updated: 2026-04-13
summary: "Short statement of the gap"
connections:
  - { target: "[[planning/schematic/PLAN-001-example]]", relation: identifies_gap_in }
  - { target: "[[docs/GROUND-TRUTH]]", relation: contradicted_by_reality }
resolution_target: planning|canon|reality|proposal|review
tags: [gap, planning-reality, high-priority]
```

## Status conventions

### Planning statuses
- `draft`
- `active`
- `paused`
- `superseded`
- `promoted`
- `archived`

### Gap statuses
- `open`
- `accepted`
- `deferred`
- `resolved`
- `superseded`

## Promotion rules

### Aspiration -> Candidate Intent
Allowed when the aspiration is repeatedly reinforced or deemed structurally useful.
Do not skip straight to canon.

### Candidate Intent -> Intent
Allowed when the work becomes a durable semantic commitment rather than exploratory planning.

### Planning Node -> Canon
Allowed only through explicit review/ruling/promotion.

### Gap -> Resolution
A gap should resolve into one or more of:
- canon update
- planning update
- reality doc update
- proposal
- execution
- superseding gap

## Promotion receipts

Eventually EMA should represent promotion receipts as first-class links or records.
Until then, use explicit connection edges such as:
- `promoted_to`
- `resolved_by`
- `operationalized_as`
- `ratified_as`

## Why not put all of this under `intents/`

Because `intents/` already carries too much semantic weight.
If every planning artifact becomes an intent, EMA loses the distinction between:
- possibility
- planning
- commitment
- execution-targeted work

That would collapse the exact boundary this work is trying to preserve.

## Why not put all of this under `_meta/`

Because these are not merely meta-governance notes.
They are part of the active knowledge/work graph.
`_meta/` should stay for governance, trust, indexing policy, and system-level rulings.

## Efficient graph/index strategy

1. file-backed nodes remain primary for planning/gap artifacts
2. graph index mirrors frontmatter + connections
3. MOCs provide human navigation
4. DB/query layer should index:
   - id
   - plane
   - subtype
   - status
   - severity (for gaps)
   - relation edges
   - timestamps

That yields efficient traversal without sacrificing human-readable source artifacts.

## Immediate recommendation

Next implementation pass should:
1. create `ema-genesis/planning/` with seed MOCs and templates
2. create `ema-genesis/gaps/` with seed MOCs and templates
3. migrate future pre-intent planning artifacts there instead of stuffing them into `intents/`
4. leave existing `intents/` nodes in place unless deliberate reclassification is worth the churn
EOF
## Seeded host structure

The host repo now contains seeded directories for:
- `ema-genesis/planning/`
- `ema-genesis/gaps/`

with starter MOCs and README markers so the topology already exists as part of the wiki tree.

