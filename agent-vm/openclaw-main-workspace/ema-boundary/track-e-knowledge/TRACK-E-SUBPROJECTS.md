# Track E Subprojects

## Purpose
Break Track E into durable, parallelizable workstreams that still share one canon/graph substrate.

## Subprojects

### TE-A — Canon Governance
**Goal**: define admission, trust, freshness, contradiction, supersession, and projection rules.
**Outputs**:
- canon-model
- authority-scope rules
- promotion/retraction semantics
- contradiction resolution flow

### TE-B — Ontology and Typed Graph
**Goal**: establish the object/edge model and concept registry.
**Outputs**:
- object taxonomy
- edge taxonomy
- concept seed
- perspective registry

### TE-C — Storage and Query Backbone
**Goal**: implement DB/domain/event/version substrate.
**Outputs**:
- canonical object/edge tables
- projections
- versions
- event log
- contradiction tables

### TE-D — Blueprint and Intention-building
**Goal**: create editable formation layer for blueprints, candidate intents, assumptions, risks, and promotion.
**Outputs**:
- blueprint object/view model
- ephemeral canvas items
- promotion flow
- concept/evidence overlays

### TE-E — Projection Surfaces
**Goal**: turn graph/canon into usable surfaces.
**Outputs**:
- feeds
- wiki rendering
- graph perspectives
- freshness/contradiction views

### TE-F — Research Import and Cross-pollination
**Goal**: import outside knowledge and route it into action.
**Outputs**:
- import pipeline
- suggestion engine
- transfer engine
- evidence-aware research views

### TE-G — Meta-EMA Self-Model
**Goal**: represent EMA’s own architecture, plans, gaps, reality, and surfaces inside Track E.
**Outputs**:
- doc ingestion inventory
- meta-EMA seed graph
- plane mapping
- contradiction/gap mapping

### TE-H — Planning / Calendar Graph
**Goal**: represent phases, sprints, tasks, subprojects, milestones, and dependencies inside same graph.
**Outputs**:
- planning object schema
- virtual calendar
- dependency graph
- progress read-models

### TE-I — External Pattern Coverage
**Goal**: absorb useful patterns from GitNexus and graphify.
**Outputs**:
- adoption matrix
- parity/defer decisions
- imported concept/use-case map

### TE-J — Evaluation and Rollout
**Goal**: operationalize Track E and prove usefulness.
**Outputs**:
- metrics
- operator scenarios
- rollout checklist
- v1/v1.1+ scope line

## Dependency map
- TE-A -> TE-B -> TE-C is the spine
- TE-D and TE-H depend on TE-C
- TE-E depends on TE-C and partially on TE-D
- TE-F depends on TE-B and TE-C
- TE-G depends on TE-A/B/C and feeds TE-E/F
- TE-I informs TE-B/F/E
- TE-J depends on all others

## Suggested execution order
1. TE-A
2. TE-B
3. TE-C
4. TE-D + TE-H in parallel
5. TE-E
6. TE-F + TE-G + TE-I in parallel
7. TE-J
