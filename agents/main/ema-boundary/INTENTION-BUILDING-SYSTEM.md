# EMA Intention-Building System

Status: active planning architecture
Date: 2026-04-13

## Executive summary

EMA needs a named subsystem between canon and execution that handles:
- project schematic shaping
- blueprint planning
- aspiration capture
- intent formation
- decomposition
- promotion candidates
- gap-aware planning

This subsystem is called **Intention-Building**.

It is not canon.
It is not implemented runtime truth.
It is the planning-and-formation layer that turns emerging direction into structured candidate work without contaminating canonical truth.

## Why this subsystem exists

Without an intention-building layer, systems collapse several distinct things into one storage plane:
- canonical truth
- brainstorming and aspiration
- planning and blueprint work
- implementation truth
- unresolved contradiction/gap material

EMA should not do that.

The intention-building layer exists to keep those distinct while still making them traversable and useful to agents.

## The four planes

### 1. Canon plane
Purpose:
- semantic authority
- rulings
- durable target architecture
- ratified decisions

Primary homes:
- `ema-genesis/canon/specs/*`
- `ema-genesis/canon/decisions/*`
- `ema-genesis/_meta/CANON-STATUS.md`

### 2. Intention-building plane
Purpose:
- shape what should exist next
- structure blueprint/planning work
- capture aspirations and convert them into candidate intent structures
- decompose architecture and project schematic changes before canon promotion or execution

Primary homes:
- `docs/BLUEPRINT.md`
- `docs/planning/*`
- blueprint/GAC materials
- intention-building docs
- future structured planning graph entities

### 3. Operational reality plane
Purpose:
- represent what actually exists now
- describe current runtime/storage/services/contracts

Primary homes:
- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `docs/backend/*`
- active runtime code and persistence

### 4. Gap plane
Purpose:
- explicitly track the delta between canon, intention-building, and reality

Primary homes:
- contradiction audits
- reconciliation docs
- explicit gap-ledger artifacts
- future gap domain surfaces

## What intention-building owns

Intention-building should own the structured shaping of:
- project schematic evolution
- blueprint/GAC queue interpretation
- aspiration capture and conversion
- candidate intent hierarchies
- decomposition of large themes into actionable semantic work units
- promotion candidates for canon
- planning candidates for proposals/executions

It should not own:
- final canon rulings
- implementation status truth
- raw runtime/session evidence
- execution results as such

## Core object types

These should exist conceptually even if some are initially file-backed docs rather than DB-native entities.

### Aspiration
A forward-looking desire, preference, or directional statement.

Questions it answers:
- what does the human want eventually?
- what promising direction keeps recurring?

Properties:
- source text
- confidence / capture mode
- timeframe
- thematic tags
- linked candidate intents

### Blueprint Question / GAC
A structured unresolved planning question.

Questions it answers:
- what remains ambiguous?
- what decision is blocking clean design?

Properties:
- category (`gap`, `assumption`, `clarification`)
- options
- implications
- links to canon/plans/reality
- promotion result

### Candidate Intent
A structured work-intent under formation that has not yet become canon or execution truth.

Questions it answers:
- what work structure should exist?
- how should a theme become durable work?

Properties:
- parent/child relationships
- intended outcome
- source aspirations / GAC / plans / research
- related canon nodes
- related implementation gaps

### Planning Node
A broader planning structure such as roadmap chunk, schematic branch, implementation theme, or architecture slice.

Questions it answers:
- what shape should the system take?
- what group of intents belongs together?

Properties:
- status (`draft`, `active`, `paused`, `superseded`)
- scope
- related candidate intents
- related canon targets
- related implementation surfaces

### Promotion Candidate
A record that some planning material may be ready to promote into canon or into operational execution.

Questions it answers:
- what is mature enough to ratify?
- what is mature enough to operationalize?

Properties:
- promotion target (`canon`, `proposal`, `goal`, `execution`, `review`)
- rationale
- evidence links
- unresolved objections

## Graph-efficient model

EMA should keep this layer compatible with a wiki + graph approach.

### Principles

1. **Files remain human-readable.**
   - planning artifacts should remain inspectable and editable as markdown where possible

2. **Graph edges are first-class.**
   - the value is in traversing relationships across planes, not just storing documents

3. **Indexes mirror; they do not replace the semantic source.**
   - where planning artifacts are file-authored, the graph/DB index should mirror them

4. **Do not duplicate the same semantic object across planes.**
   - instead use edge types and promotion receipts

### Recommended graph relations

- `aspiration_of`
- `raises_question_for`
- `shapes`
- `decomposes_into`
- `targets_canon`
- `targets_runtime_surface`
- `blocked_by_gap`
- `contradicted_by_reality`
- `promotion_candidate_for`
- `realized_by`
- `informs`
- `derived_from`
- `supersedes_plan`

### Suggested node/plane convention

Each intention-building node should be legible both as markdown and as graph data.

Suggested frontmatter fields:

```yaml
id: PLAN-EXAMPLE
plane: planning
subtype: aspiration|gac|candidate_intent|planning_node|promotion_candidate
status: draft|active|paused|superseded|promoted
created: 2026-04-13
updated: 2026-04-13
links:
  - target: CANON-...
    relation: targets_canon
  - target: INT-...
    relation: shapes
  - target: GAP-...
    relation: blocked_by_gap
```

## How this fits the wiki

The wiki/graph side should be interpreted as a multi-plane knowledge environment, not one flat note pile.

### Recommended wiki role by plane

- Canon:
  - stable, ratified, high-trust semantic pages
- Intention-building:
  - planning and schematic pages, GAC queue, aspirations, candidate structures
- Reality:
  - operational docs, backend manifests, implementation truth ledgers
- Gap:
  - contradiction pages, reconciliation notes, drift ledgers, promotion blockers

This keeps the wiki useful while preventing epistemic pollution.

## How this fits EMA backend/runtime

Intention-building is upstream of proposals and executions, but downstream of aspirations, GACs, and planning synthesis.

Recommended progression:

`aspiration -> GAC / planning question -> candidate intent / planning node -> promotion candidate -> proposal -> execution -> result -> review / canon update`

Not every path must go all the way through. Some planning artifacts remain planning forever. Some become canon. Some become runtime work. Some die.

## Relationship to existing EMA subsystems

### Blueprint Planner
Blueprint Planner is the primary operator surface for intention-building.
It should be understood as the vApp/UI for this subsystem, not as the subsystem's entire storage model.

### Intents service
The existing `intents` runtime service should not be overloaded with every pre-canonical planning artifact.
Candidate intentions may eventually promote into durable runtime intents, but the layers should remain distinct.

### Review
Review should be the human decision boundary when intention-building outputs are ready for promotion or operationalization.

### Runtime fabric / executions
These operate downstream. They should consume promoted/planned work, not become the place where planning semantics are improvised.

## Inspirations and pattern donors

This subsystem is directionally informed by:
- EMA's own Genesis + Blueprint Planner canon
- memory-layered systems like MemPalace
- code/context graph systems like GitNexus and CodeGraphContext
- agent runtime systems that distinguish planning/context assembly from execution state

The main lesson is not copying any one repo wholesale. It is preserving separation between:
- memory
- planning
- truth
- runtime
- trace

while allowing graph traversal across all of them.

## Immediate implementation guidance

1. Keep planning artifacts file-friendly and graph-indexable.
2. Add explicit `plane` discipline to new planning docs.
3. Do not promote planning nodes into canon without an explicit review/promotion step.
4. Do not collapse candidate intent nodes into runtime intent rows until the distinction is deliberate.
5. Prefer links and promotion receipts over duplication.

## Current recommendation

For the next EMA work phase, use intention-building to shape:
- the project schematic
- the planning graph
- the relationship between blueprint/GAC and candidate intents
- the path from aspiration to executable work

without contaminating canon truth or runtime reality.
