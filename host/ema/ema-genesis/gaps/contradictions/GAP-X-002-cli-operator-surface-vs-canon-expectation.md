---
id: GAP-X-002
plane: gap
subtype: contradiction
status: open
severity: high
created: 2026-04-13
updated: 2026-04-13
summary: "Canon and planning imply a real operator control plane, but current CLI reality is still mostly canon-reader/query surface rather than a full meta-EMA operator surface"
resolution_target: planning
connections:
  - { target: "[[../../planning/schematic/PLAN-001-meta-ema-control-plane-reconciliation]]", relation: identifies_gap_in }
  - { target: "[[../../../docs/planning/FIRST-META-EMA-SPACE]]", relation: identifies_gap_in }
  - { target: "[[../../../docs/GROUND-TRUTH]]", relation: contradicted_by_reality }
  - { target: "[[../../../docs/agent-handoffs/META-EMA-OPERATOR]]", relation: references }
  - { target: "[[../../intents/INT-EXECUTION-DISPATCHER/README]]", relation: references }
tags: [gap, contradiction, high-priority, cli, operator-surface]
---

# GAP-X-002 — CLI Operator Surface vs Canon Expectation

## Gap statement

The intended `EMA Control Room` assumes agents can operate EMA itself through a trustworthy control-plane surface, but current repo reality says the CLI is still mostly a canon/query reader and not yet the full operator surface described by the broader vision.

## Why it matters

Without a clear operator path:
- agents have to improvise across docs, direct file reads, ad hoc scripts, and partial runtime endpoints
- the first meta-EMA space remains conceptual instead of operational
- planning and execution handoffs stay brittle

## Canon refs

- `ema-genesis/EMA-GENESIS-PROMPT.md`
- `ema-genesis/canon/specs/AGENT-RUNTIME.md`

## Planning refs

- `docs/planning/FIRST-META-EMA-SPACE.md`
- `docs/INTENTION-BUILDING-SYSTEM.md`
- `ema-genesis/planning/schematic/PLAN-001-meta-ema-control-plane-reconciliation.md`

## Reality refs

- `docs/GROUND-TRUTH.md`
- `docs/agent-handoffs/META-EMA-OPERATOR.md`

## Proposed resolution

Keep this in the planning plane first:
- define the minimum operator flow that must exist for `EMA Control Room`
- name which parts are CLI, which are docs, which are service endpoints, and which are renderer surfaces
- avoid pretending the full operator surface already exists

## Resolution path

1. create `PLAN-002 — Unified Control-Plane Operator Surface`
2. decompose missing CLI/service/renderer capabilities into candidate intents or proposals
3. promote only verified operator affordances into reality docs
