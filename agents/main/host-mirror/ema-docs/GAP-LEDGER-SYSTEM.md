# EMA Gap Ledger System

Status: active planning architecture
Date: 2026-04-13

## Executive summary

EMA should treat the **gap** as a first-class system layer.

The gap is the explicit delta between:
- canon target
- intention-building / planning state
- implemented operational reality

The gap ledger exists so agents can track drift, contradiction, missing implementation, promotion blockers, and unresolved design seams without flattening them into canon or runtime truth.

## Why a gap ledger is needed

Without a formal gap layer, systems tend to:
- hide contradictions inside prose
- confuse aspiration with implementation
- silently rot planning docs
- lose track of what is missing versus what is merely deferred

EMA's architecture is ambitious enough that the gap itself is valuable system knowledge.

## Gap classes

### Canon -> Reality gap
A canon target that is not yet implemented, partially implemented, or contradicted by current reality.

### Planning -> Reality gap
A planning/blueprint intention that has not yet been implemented or has drifted from actual system behavior.

### Canon -> Planning gap
A canon commitment that has not yet been adequately decomposed into planning structures or blueprint work.

### Contradiction gap
Two sources disagree in a way that affects implementation or operator understanding.

### Promotion gap
A planning artifact or reality pattern appears mature enough for promotion, but the promotion step has not happened.

### Trace gap
The system cannot cleanly trace a runtime behavior back to canon or planning intent.

## Gap record shape

Suggested durable record:

```yaml
id: GAP-EXAMPLE
plane: gap
subtype: canon_reality|planning_reality|canon_planning|contradiction|promotion|trace
status: open|accepted|deferred|resolved|superseded
severity: critical|high|medium|low
created: 2026-04-13
updated: 2026-04-13
summary: "Short statement of the gap"
canon_refs: []
planning_refs: []
reality_refs: []
evidence_refs: []
proposed_resolution: ""
resolution_target: canon|planning|reality|review|proposal
```

## Graph-efficient rules

- Gap nodes should link outward; they should not absorb the content of the nodes they reference.
- Gap nodes should be queryable by plane pair and severity.
- Gap closure should preserve history rather than deleting the record.
- Resolved gaps should produce either:
  - a promotion receipt
  - a doc update
  - a proposal/execution reference
  - a superseding gap record

## Main uses

- contradiction audits
- blueprint planning backlogs
- canon/reality reconciliation
- operator briefings
- agent context assembly
- readiness checks before execution

## Relationship to existing EMA surfaces

- Blueprint Planner should surface important open gaps.
- Review should be able to accept/reject/defer gap resolutions.
- Runtime/context assembly should expose the most relevant gaps for active work.
- Canon updates and implementation docs should cite resolved gaps when appropriate.

## Recommended near-term approach

Start as markdown-backed ledger entries plus doc references.
Later, add a first-class backend gap domain if the workflow proves valuable.
