---
id: GAP-X-003
plane: gap
subtype: contradiction
status: open
severity: high
created: 2026-04-13
updated: 2026-04-13
summary: "EMA currently contains overlapping plural runtime ledgers and newer singular bootstrap loop surfaces for intent/proposal/execution, leaving authority and operator lineage split"
resolution_target: planning
connections:
  - { target: "[[../../planning/schematic/PLAN-001-meta-ema-control-plane-reconciliation]]", relation: identifies_gap_in }
  - { target: "[[../../../docs/GROUND-TRUTH]]", relation: contradicted_by_reality }
  - { target: "[[../../../docs/OPERATING-REALITY]]", relation: references }
  - { target: "[[../../../docs/CANON-PLANNING-BOUNDARY]]", relation: references }
  - { target: "[[../../canon/decisions/DEC-007-unified-intents-schema]]", relation: references }
tags: [gap, contradiction, high-priority, lineage, loop-convergence]
---

# GAP-X-003 — Dual Loop Lineage and Split Authority

## Gap statement

Current reality explicitly says EMA has two overlapping work lineages:
- the established plural runtime domains for intents/executions/proposals
- the newer singular bootstrap loop services and tables

That may be a valid transitional strategy, but it is still a contradiction at the operator-control-plane level because there is not yet one clearly named authority for work lineage.

## Why it matters

If lineage authority is unclear:
- operators cannot easily tell which proposal/execution path is the real one
- renderer work risks binding to the wrong layer
- CLI and doc work will keep describing different systems
- future promotion into canon or stable reality will stay blocked

## Canon refs

- `ema-genesis/canon/specs/EXECUTION-SYSTEM.md`
- `ema-genesis/canon/decisions/DEC-007-unified-intents-schema.md`

## Planning refs

- `docs/planning/FIRST-META-EMA-SPACE.md`
- `docs/INTENTION-BUILDING-SYSTEM.md`
- `ema-genesis/planning/schematic/PLAN-001-meta-ema-control-plane-reconciliation.md`

## Reality refs

- `docs/GROUND-TRUTH.md`
- `docs/OPERATING-REALITY.md`

## Proposed resolution

Treat this as an explicit convergence queue, not a hidden implementation detail.

Needed output:
- one planning artifact that names the transitional authority model
- one proposal or decision path for convergence or durable coexistence
- one operator-facing explanation of which lineage to trust for which job today

## Resolution path

1. create a lineage convergence planning node
2. decide whether the bootstrap loop supersedes, wraps, or coexists with plural runtime ledgers
3. update reality docs with a sharper operator rule once verified
