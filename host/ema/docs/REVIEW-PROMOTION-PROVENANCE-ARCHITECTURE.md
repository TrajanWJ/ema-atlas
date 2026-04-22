# EMA Review / Promotion / Provenance Architecture

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

EMA already has a real provenance spine:
- Chronicle as raw landing zone
- Chronicle-derived extractions as candidate records
- Review as the durable human decision layer
- Promotion Receipts as durable bridges into downstream targets

This architecture should now be treated as a first-class cross-plane transition system.

It answers the critical question:
**how do raw materials, planning artifacts, and reviewed candidates become canon changes, operational planning objects, or runtime work without collapsing trust boundaries?**

## Why this matters

Without a formal review/promotion/provenance architecture, systems tend to:
- jump from raw material straight into action
- confuse extraction with approval
- lose lineage between source material and downstream objects
- silently rewrite canon/planning/reality without decision boundaries

EMA already has the right ingredients to avoid this.

## Current real backend contract

From active EMA backend schemas and docs:

### Chronicle
Chronicle is the raw import and provenance layer.

Current role:
- import raw session/history material
- store artifacts and normalized session bundles
- index session/entry/artifact metadata in SQLite

### Chronicle Extraction
Chronicle extraction is the candidate-derivation layer.

Current extraction kinds:
- `intent_candidate`
- `goal_candidate`
- `calendar_candidate`
- `execution_evidence_candidate`
- `follow_up_candidate`
- `project_link_candidate`

Important meaning:
- an extraction is not yet approved work
- an extraction is a durable candidate object with provenance and confidence

### Review Item
Review is the durable human decision boundary over one Chronicle extraction.

Current statuses:
- `pending`
- `approved`
- `rejected`
- `deferred`
- `promoted`
- `superseded`

Important meaning:
- Review is where explicit human judgment is recorded
- Review should never be skipped when Chronicle-derived content influences durable state

### Promotion Receipt
Promotion receipts are the durable bridge from approved review items to downstream targets.

Current target kinds:
- `intent`
- `goal`
- `calendar_entry`
- `execution`

Current promotion modes:
- `create`
- `link`
- `attach`
- `record`

Important meaning:
- a receipt is the proof that reviewed material informed or became a real downstream object
- links alone are not enough

## Plane placement

## Chronicle belongs to the provenance plane
It is raw evidence and source capture.
It is not canon, not planning, not runtime work.

## Review belongs to the provenance plane
It is the decision boundary above Chronicle.
It is not the downstream target itself.

## Promotion Receipts are cross-plane bridge artifacts
They connect provenance to:
- planning
- operational planning
- runtime/execution
- eventually canon when supported more fully

## Extractions are liminal candidate objects
They are provenance-derived candidates that may inform multiple planes, but they do not themselves become authoritative truth.

## The promotion pipeline

### Flow 1: Raw import
`raw material -> Chronicle session / entry / artifact`

Examples:
- imported chat history
- imported session bundles
- logs
- generated artifacts
- external captured material

### Flow 2: Candidate derivation
`Chronicle -> Chronicle extraction`

Extraction creates durable candidate rows with:
- source provenance
- candidate kind
- confidence
- payload
- suggested target kind

### Flow 3: Human decision boundary
`Chronicle extraction -> Review item`

Review creates the explicit decision object with:
- actor id
- rationale
- timestamp
- target selection
- decision status

### Flow 4: Promotion / linkage
`Review item -> Promotion receipt -> downstream target`

The receipt records:
- source review item
- Chronicle ids
- target kind
- target id
- promotion mode
- provenance summary

### Flow 5: Downstream integration
A promotion receipt can point into one of several planes.

#### To planning/intention-building
Future path for:
- aspirations
- candidate intents
- planning nodes
- promotion candidates

#### To operational planning
Current active path for:
- goals
- calendar entries

#### To runtime/execution
Current active path for:
- execution evidence
- execution-linked outputs
- intent and execution objects

#### To canon
Currently more constrained and should remain explicit/human-ratified.
A receipt may record canon influence, but canon promotion should preserve a stronger ratification path.

## Important distinction: extraction vs review vs promotion

### Extraction
Means:
- "the system derived a candidate from provenance"

It does **not** mean:
- approved
- true
- promoted
- operationalized

### Review
Means:
- "a human or explicit review authority made a decision about the candidate"

It does **not** by itself mean:
- downstream object exists

### Promotion receipt
Means:
- "the reviewed candidate has been explicitly linked or promoted into a real downstream target"

This three-step distinction should remain rigid.

## Expansion needed for the new planning architecture

The current backend contract is already strong, but the broader EMA architecture now wants review/provenance to connect not just to runtime targets, but also to the new planning/gap layers.

### Recommended future receipt target expansion
In addition to current targets, EMA should eventually support receipt targets such as:
- `planning_node`
- `candidate_intent`
- `aspiration`
- `promotion_candidate`
- `gap_record`
- `canon` (with stricter ratification semantics)

This would allow Chronicle/Review to influence the new semantic planning layers cleanly without bypassing provenance.

## Relationship to Blueprint Planner

Blueprint Planner should not bypass Review when operating on provenance-derived material.

Instead:
- Blueprint may surface Chronicle-derived candidates as reviewable planning inputs
- answered GACs and planning decisions may create promotion candidates
- Review remains the durable human decision boundary when provenance-derived content is entering structured work

Blueprint is the shaping surface.
Review is the durable decision surface.
They should cooperate, not collapse into each other.

## Relationship to Human Ops and operational planning

Human Ops and operational planning should be able to consume reviewed Chronicle outputs safely.

Examples:
- Chronicle-derived `goal_candidate` -> Review approval -> Promotion receipt -> `goal`
- Chronicle-derived `calendar_candidate` -> Review approval -> Promotion receipt -> `calendar_entry`
- Chronicle-derived follow-up candidate -> review -> planning or operational planning artifact

This lets EMA learn from imported history without silently mutating a user's active work ledgers.

## Relationship to canon

Canon requires the strictest promotion rules.

Recommended rule:
- Chronicle/Review may identify canon-relevant findings
- promotion receipts may record that a review item informed a canon node
- but canon changes should still require explicit ratification/ruling semantics beyond casual promotion

In other words:
- Review can feed canon
- Review should not casually rewrite canon

## Provenance invariants

These should remain mandatory.

### Chronicle invariants
Keep raw source provenance:
- chronicle session id
- chronicle entry id when applicable
- chronicle artifact id when applicable
- raw storage path where applicable

### Review invariants
Keep human decision provenance:
- review item id
- decision actor id
- decided at timestamp
- rationale / decision note

### Promotion invariants
Keep downstream traceability:
- review item id
- extraction id
- chronicle ids
- target kind
- target id
- promotion mode
- provenance summary

## Anti-patterns

Do not:
- create runtime work directly from Chronicle without review
- treat extraction confidence as human approval
- use plain links as replacement for receipts
- flatten review/provenance into generic notes or comments
- allow canon-changing behavior without stronger ratification than routine review

## Recommended system interpretation

Chronicle / Review / Promotion is the **cross-plane trust spine** of EMA.

It provides the controlled bridge from:
- raw imported material
- to candidate structures
- to human decision
- to durable downstream consequences

That makes it one of the key systems that keeps EMA from turning into an untraceable self-rewriting mess.

## Immediate next work implied

1. Add planning/gap-aware receipt target support over time.
2. Integrate Blueprint Planner with reviewed provenance inputs instead of ad-hoc imports.
3. Surface promotion receipts in graph/read-model views so cross-plane lineage becomes navigable.
4. Keep canon promotion stricter than ordinary runtime/operational promotion.
