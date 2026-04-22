# EMA Knowledge And Orchestration Architecture

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

EMA should be understood as a **multi-plane local orchestration system** rather than a single database, a single wiki, or a single runtime.

The architecture now needs to explicitly cover:
- semantic canon truth
- intention-building and blueprint formation
- operational planning
- runtime/execution work
- implementation/host reality
- review/provenance
- gap/contradiction tracking
- surface/read-model projections

The system becomes coherent when each plane has:
- a clear truth role
- a clear storage role
- clear promotion/trace rules
- clear agent reading rules

## Why this broader model is needed

Earlier work established a necessary distinction between:
- canon
- planning
- reality
- gap

Broader host-context review shows EMA also already contains real active subsystems for:
- operational planning (`goals`, `calendar_entries`, buildouts)
- review/provenance (`chronicle`, `review`, `promotion_receipts`)
- runtime fabric (`runtime-fabric`, proposals, executions)
- app/surface honesty (`live-core`, `partial`, `draft-linked`, `shell-only`)
- manifest-backed machine-readable backend truth (`/api/backend/manifest`)

So the architecture has to expand accordingly.

## The eight planes

## 1. Canon plane

### Role
Authoritative semantic target.

### Questions it answers
- What is EMA supposed to be?
- Which architectural decisions are ratified?
- Which direction wins when docs disagree?

### Typical storage
- file-backed semantic graph nodes

### Primary homes
- `ema-genesis/canon/specs/*`
- `ema-genesis/canon/decisions/*`
- `ema-genesis/_meta/CANON-STATUS.md`
- canon governance/ruling docs

### Rules
- Canon is not scratch planning.
- Canon is not implementation status.
- Canon changes require explicit promotion/ruling.

## 2. Intention-building plane

### Role
Structured formation layer between canon and execution.

### Questions it answers
- What should be shaped next?
- Which aspirations, schematic branches, and candidate intents are emerging?
- What planning artifacts are maturing toward canon or execution?

### Typical storage
- file-backed semantic graph nodes
- planning docs and MOCs

### Primary homes
- `ema-genesis/planning/*`
- `docs/BLUEPRINT.md`
- planning docs under `docs/planning/*`
- Blueprint/GAC planning outputs

### Objects in this plane
- aspirations
- blueprint questions / GAC expansions
- candidate intents
- planning/schematic nodes
- promotion candidates

### Rules
- This plane is not canon.
- This plane is not runtime truth.
- Promotion must remain explicit.

## 3. Operational planning plane

### Role
Owned and scheduled work planning for humans and agents.

### Questions it answers
- What work is owned?
- What is scheduled?
- What buildout exists for a real work slice?
- What is the daily/weekly operational plan?

### Typical storage
- SQLite-backed operational entities

### Primary homes
- `services/core/goals/*`
- `services/core/calendar/*`
- `services/core/human-ops/*`
- `goals`
- `calendar_entries`
- human-ops day objects

### Objects in this plane
- goals
- calendar entries
- phased buildouts
- day objects
- user-state-linked operational plans

### Rules
- Operational planning is not canon.
- Operational planning is not intention-building, though it may be informed by it.
- These objects are runtime-operational truth, not semantic truth.

## 4. Runtime / execution plane

### Role
The active work and runtime-control layer.

### Questions it answers
- What is being proposed?
- What is approved?
- What is running?
- Which session/tool/runtime is doing the work?
- What result artifacts were produced?

### Typical storage
- SQLite operational rows
- runtime session state
- result artifacts on disk

### Primary homes
- `services/core/proposal/*`
- `services/core/executions/*`
- `services/core/runtime-fabric/*`
- `loop_proposals`
- `executions`
- result artifacts under local runtime storage

### Objects in this plane
- durable proposals
- executions
- runtime sessions
- runtime tools
- result artifacts

### Rules
- Runtime work does not automatically rewrite canon.
- Runtime work does not replace planning.
- Outputs should link back to planning and canon via provenance or writeback.

## 5. Reality / implementation plane

### Role
Current host truth and active backend/system contract.

### Questions it answers
- What actually exists and runs now?
- Which service/domain owns this behavior?
- What can agents safely depend on today?

### Typical storage
- reality docs
- active code
- machine-readable backend manifest
- SQLite runtime truth

### Primary homes
- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `docs/backend/*`
- `services/core/*`
- `/api/backend/manifest`

### Rules
- Reality may lag canon.
- Reality may contradict older docs.
- Agents should prefer current reality for execution safety.

## 6. Review / provenance plane

### Role
Durable curation, review, and downstream-link traceability.

### Questions it answers
- What raw material informed a decision?
- What was reviewed by a human?
- What got promoted into downstream objects?
- Can we prove provenance?

### Typical storage
- SQLite-backed review entities
- raw chronicle storage
- receipts

### Primary homes
- `services/core/chronicle/*`
- `services/core/review/*`
- chronicle raw storage
- review items
- promotion receipts

### Objects in this plane
- chronicle sessions
- chronicle entries/artifacts
- review items
- promotion receipts

### Rules
- Chronicle is raw landing zone, not canon.
- Review is decision boundary.
- Promotion receipts are durable bridge records, not optional notes.

## 7. Gap / contradiction plane

### Role
Explicit delta and drift management across the system.

### Questions it answers
- Where does canon diverge from reality?
- What planning has not been decomposed or implemented?
- What contradictions remain unresolved?
- What promotion is blocked or traceability missing?

### Typical storage
- file-backed gap nodes
- contradiction/reconciliation docs

### Primary homes
- `ema-genesis/gaps/*`
- contradiction audits
- reconciliation docs
- gap ledger docs

### Objects in this plane
- canon-reality gaps
- planning-reality gaps
- canon-planning gaps
- contradiction records
- promotion blockers
- trace gaps

### Rules
- Gaps are first-class knowledge.
- Resolved gaps should preserve lineage/history.
- Gaps should link outward rather than absorb the nodes they describe.

## 8. Surface / read-model plane

### Role
Human-facing and agent-facing interfaces/read models over the deeper planes.

### Questions it answers
- What does the user see?
- Which app/surface is honest today?
- Which view is live, draft-linked, partial, or shell-only?
- What read models should be exposed for specific workflows?

### Typical storage
- renderer apps
- CLI surfaces
- dashboards
- derived read models
- route inventories

### Primary homes
- renderer app set
- CLI command surfaces
- `docs/APP-READINESS-MATRIX.md`
- `docs/PRODUCT-SURFACES-MAP.md`

### Rules
- A surface is not automatically a domain.
- A route is not automatically trustworthy product truth.
- Surface honesty is architectural, not cosmetic.

## Plane interaction model

### Canon -> Intention-building
Canon provides target shape and constraints.
Intention-building explores, decomposes, and matures candidate structures.

### Intention-building -> Operational planning
Some planning artifacts become owned/scheduled work.
Not all intention-building should descend into operational planning.

### Operational planning -> Runtime / execution
Goals, buildouts, and day plans can emit proposals and executions.

### Runtime / execution -> Reality
Running work mutates operational reality and implementation state.

### Reality -> Gap
Reality can expose divergence from canon or planning.

### Chronicle / review -> Planning / canon / runtime
Imported material can influence any of those planes, but only through review/provenance boundaries.

### Surface / read-model -> all planes
Surfaces project subsets of the deeper planes. They should not silently redefine them.

## Storage model by plane

| Plane | Primary storage mode | Notes |
|---|---|---|
| Canon | file-backed semantic graph | Human-readable, ratified truth |
| Intention-building | file-backed semantic graph | Human-readable, graph-indexed formation layer |
| Operational planning | SQLite runtime ledger | Owned/scheduled work truth |
| Runtime / execution | SQLite + live sessions + artifacts | Active work and results |
| Reality / implementation | docs + code + manifest + DB | Current host truth |
| Review / provenance | Chronicle files + SQLite review tables | Raw -> reviewed -> receipts |
| Gap / contradiction | file-backed semantic graph | Explicit delta tracking |
| Surface / read-model | derived interfaces | Renderer, CLI, dashboards, read models |

## Agent trust / reading order

For substantial EMA work, agents should orient in roughly this order:

1. Reality / implementation plane
   - `docs/OPERATING-REALITY.md`
   - `docs/backend/*`
   - `docs/GROUND-TRUTH.md`
2. Boundary / topology docs
   - `docs/CANON-PLANNING-BOUNDARY.md`
   - `docs/INTENTION-BUILDING-SYSTEM.md`
   - `docs/GAP-LEDGER-SYSTEM.md`
   - `docs/INTENTION-AND-GAP-TOPOLOGY.md`
   - `docs/GRAPH-INTEGRATION-SPEC.md`
   - `docs/PROMOTION-FLOW-SPEC.md`
3. Canon plane
   - `ema-genesis/_meta/CANON-STATUS.md`
   - relevant canon specs/decisions
4. Surface honesty docs when working on UI/CLI
   - `docs/APP-READINESS-MATRIX.md`
   - `docs/PRODUCT-SURFACES-MAP.md`

## Current EMA architectural interpretation

EMA should now be interpreted as:

- a daemon-like local orchestration system structurally
- implemented currently through TypeScript `services + workers + Electron`
- using a multi-plane knowledge and work architecture
- with file-backed semantic truth where human legibility matters
- with SQLite-backed operational truth where runtime mutability matters
- with review/provenance boundaries preserving trust and traceability
- with surfaces treated as projections/read models, not automatic truths

## Anti-patterns to avoid

- treating all planning as intent
- treating runtime behavior as automatic canon change
- flattening Chronicle/review/provenance into ad-hoc notes
- making the graph the mandatory write path for all operational state
- presenting partial/shell-only apps as live domain truth
- introducing second primary semantic or runtime sources of truth

## Immediate next work implied by this architecture

1. Seed real example planning and gap nodes in `ema-genesis/planning/*` and `ema-genesis/gaps/*`.
2. Define graph/object-index ingestion for new planning and gap node classes.
3. Map Blueprint Planner explicitly onto the intention-building + gap + promotion surfaces.
4. Map Review explicitly onto promotion and provenance transitions across planes.
5. Continue renderer honesty pass using the surface/read-model plane as the guide.
6. Write a machine-readable plane registry later if useful, but do not invent a second semantic source in the process.
