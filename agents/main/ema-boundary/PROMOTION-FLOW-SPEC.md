# EMA Promotion Flow Spec

Status: active planning architecture
Date: 2026-04-13

## Purpose

Define how artifacts move between planes without semantic confusion.

## Promotion pathways

### Planning -> Canon
Use when a planning artifact is mature enough to become authoritative semantic truth.

Required:
- explicit review/ruling/approval
- clear target canon node or canon diff
- gap review if contradictions remain

Output:
- canon node update or new canon node
- promotion edge / receipt

### Planning -> Proposal
Use when a planning artifact is mature enough for bounded execution work but not necessarily canon ratification.

Required:
- operational scope
- executionable unit
- clear target surface

Output:
- proposal or equivalent review object

### Planning -> Goal
Use when a planning artifact becomes an owned operational objective.

### Reality -> Canon Candidate
Use when implementation reveals a stable pattern worth ratifying, but do not auto-promote.

Output:
- promotion candidate, not direct canon rewrite

### Gap -> Resolution
Use when a gap is closed by:
- canon update
- planning update
- reality doc update
- proposal/execution result
- superseding gap

## Promotion receipt fields

Suggested shape:

```yaml
id: RECEIPT-001
source_plane: planning
target_plane: canon
source_id: PLAN-001
result_id: DEC-009
status: completed
created: 2026-04-13
notes: "Why this promotion happened"
```

## Key rule

A link is not a promotion.
A promotion requires an explicit transition artifact or explicit promoted state.
