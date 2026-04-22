---
id: PLAN-001
plane: planning
subtype: planning_node
status: active
created: 2026-04-13
updated: 2026-04-13
author: agent
summary: "First actionable planning node for the meta-ema control-plane-reconciliation workline"
connections:
  - { target: "[[../../planning/PLANNING-MOC]]", relation: indexed_by }
  - { target: "[[../../gaps/GAPS-MOC]]", relation: references }
  - { target: "[[../../gaps/contradictions/GAP-X-001-active-runtime-vs-archived-stack-confusion]]", relation: blocked_by_gap }
  - { target: "[[../../gaps/contradictions/GAP-X-002-cli-operator-surface-vs-canon-expectation]]", relation: blocked_by_gap }
  - { target: "[[../../gaps/contradictions/GAP-X-003-dual-loop-lineage-and-split-authority]]", relation: blocked_by_gap }
  - { target: "[[../../gaps/contradictions/GAP-X-004-renderer-surface-vs-product-authority]]", relation: blocked_by_gap }
  - { target: "[[../../canon/specs/EMA-V1-SPEC]]", relation: targets_canon }
  - { target: "[[../../canon/specs/EXECUTION-SYSTEM]]", relation: targets_canon }
  - { target: "[[../../../docs/planning/FIRST-META-EMA-SPACE]]", relation: derived_from }
  - { target: "[[../../../docs/CANON-PLANNING-BOUNDARY]]", relation: references }
  - { target: "[[../../../docs/INTENTION-BUILDING-SYSTEM]]", relation: references }
  - { target: "[[../../../docs/GAP-LEDGER-SYSTEM]]", relation: references }
  - { target: "[[../../../docs/OPERATING-REALITY]]", relation: references }
  - { target: "[[../../../docs/GROUND-TRUTH]]", relation: references }
tags: [planning, schematic, meta-ema, control-plane-reconciliation]
---

# PLAN-001 — Meta-EMA / Control-Plane Reconciliation

## Scope

Create the first durable planning node for the `meta-ema` project's primary workline: `control-plane-reconciliation`.

This node exists to turn the planning definition in `docs/planning/FIRST-META-EMA-SPACE.md` into an actual queue that both humans and agents can work from.

The workline owns the loop:

1. separate canon / planning / reality / gap
2. identify contradictions that block trustworthy operation
3. convert contradictions into bounded planning or implementation work
4. promote resolved knowledge into the correct plane
5. repeat without collapsing the planes into one blurred story

## Desired shape

The first workable version of `EMA Control Room` should be able to answer four operator questions with linked durable artifacts:

- **Canon:** what should EMA be?
- **Plan:** what shaped work is next?
- **Reality:** what is actually implemented and verified now?
- **Gap:** what contradictions or missing links prevent clean alignment?

This planning node is the queue root for that workline.

## Current queue

### Queue A — establish source-of-truth discipline

Goal:
- make it obvious which files are authoritative for canon, planning, runtime reality, and gap

Immediate artifacts already in play:
- `docs/CANON-PLANNING-BOUNDARY.md`
- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `ema-genesis/planning/*`
- `ema-genesis/gaps/*`

Next move candidates:
- add a compact control-plane index page for operators
- define promotion receipts for when contradictions are resolved
- add explicit plane labels to high-risk drift docs

### Queue B — reconcile the highest-value contradictions

Open contradiction gaps linked to this node:
- `GAP-X-001` — active runtime vs archived stack confusion
- `GAP-X-002` — CLI/operator surface vs canon expectation
- `GAP-X-003` — dual loop lineage and split authority
- `GAP-X-004` — renderer surface vs product authority

Execution rule:
- do not try to solve all contradictions at once
- each contradiction should resolve into either a doc correction, a planning decomposition, a proposal, or an implementation change

### Queue C — turn contradictions into candidate work

Candidate work packets that should exist next:
- a proposal for one authoritative control-plane operator surface
- a planning node for proposal/execution lineage convergence
- a planning node for renderer product-map convergence
- a promotion candidate for source-of-truth hierarchy once stable enough

## Related canon targets

Primary canon targets implicated by this queue:
- `EMA-V1-SPEC`
- `EXECUTION-SYSTEM`
- `AGENT-RUNTIME`
- `BLUEPRINT-PLANNER`

## Related runtime surfaces

Primary runtime surfaces implicated now:
- `cli/`
- `services/core/intents/*`
- `services/core/proposal/*`
- `services/core/executions/*`
- `services/core/loop/*`
- `apps/electron/*`
- `apps/renderer/*`
- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`

## Blocking gaps

### Critical blockers for trustworthy operation

1. agents can still be pointed at archived or stale architectural descriptions
2. CLI reality is narrower than the control-plane semantics implied by canon/planning
3. the repo contains overlapping intent/proposal/execution lineages without one operator-facing authority
4. the renderer route/tile inventory is broader than the actual coherent product map

## Done condition for this planning node

This node is doing its job when:
- the highest-value contradictions are tracked as first-class gaps
- each open contradiction has a clear resolution target
- new operator/agent work can link here instead of re-deriving the same ambiguity from scratch
- promotion into canon, planning, or reality can happen with receipts instead of vibes

## Next best move

Create the next planning artifact:
- **PLAN-002 — Unified Control-Plane Operator Surface**

Purpose:
- define the minimal end-to-end operator path across CLI, docs, services, and renderer so `EMA Control Room` becomes a navigable control plane rather than just a concept.
