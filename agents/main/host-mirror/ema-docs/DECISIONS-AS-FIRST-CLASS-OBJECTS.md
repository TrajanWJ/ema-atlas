# Decisions As First-Class Objects In EMA

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

EMA should treat **decisions** as first-class objects, not just as:
- canon prose
- Discord messages
- review notes
- renderer-only drafts

A decision is one of EMA's highest-value knowledge artifacts because it captures:
- why a path was chosen
- what alternatives were rejected or deferred
- what downstream work was authorized, blocked, or redirected
- what precedent should be surfaced later

Decisions should therefore exist across multiple planes with a clear distinction between:
- draft decision candidates
- reviewed decision candidates
- canonical decisions
- operational/runtime decisions
- decision outcomes and precedents

## Why this matters

Without a first-class decision architecture, EMA risks:
- re-litigating the same design questions repeatedly
- losing rationale between Blueprint, Review, and runtime work
- treating canon decisions and day-to-day operational decisions as the same thing
- failing to surface precedent when similar situations arise later

## Decision layers

### 1. Decision candidate
A not-yet-ratified candidate that emerges from:
- Blueprint/GAC work
- Chronicle review
- planning synthesis
- explicit operator logging

Plane placement:
- planning or provenance

### 2. Canon decision
A ratified architectural or policy decision.

Plane placement:
- canon

Primary home:
- `ema-genesis/canon/decisions/*`

### 3. Operational decision
A decision about active work allocation, sequencing, ownership, timing, scope, or handoff.

Plane placement:
- operational planning or runtime

Examples:
- choose this goal for the week
- allocate this calendar block
- route this work to proposal vs direct execution prep
- hand off to agent runtime now

### 4. Runtime decision
A bounded runtime/harness decision made inside execution control.

Plane placement:
- runtime / provenance

Examples:
- redirect execution
- stop session
- attach to existing runtime
- escalate from planning to execution

### 5. Outcome-linked decision
A decision that is later connected to observed downstream consequences.

Plane placement:
- provenance / gap / precedent memory

## Core distinction

Not every decision belongs in canon.

EMA should explicitly distinguish:
- **canon decisions** — durable architectural rulings
- **planning decisions** — choices made while shaping intent/schematic structures
- **operational decisions** — choices about owned/scheduled work
- **runtime decisions** — choices inside the harness/execution layer

## Blueprint's role with decisions

Blueprint should be a major decision-shaping surface.

It should handle:
- unresolved design questions (GAC)
- planning decisions
- blockers / deferred decisions
- candidate canon decisions
- decision promotion candidates

Blueprint should not directly ratify canon decisions as an implicit side effect.

## Review's role with decisions

Review should be able to:
- approve or reject decision candidates derived from Chronicle/imported material
- preserve provenance for why a decision candidate exists
- issue promotion receipts into decision records or downstream targets

This means review should eventually support `decision_candidate` as an extraction/promotable target concept.

## Canon's role with decisions

Canon should own the narrowest and strongest decision set:
- architectural rulings
- policy rulings
- stable durable choices that define EMA's direction

Canon should not become a dumping ground for every local work choice.

## Operational planning's role with decisions

Operational planning should own decisions such as:
- what goal is active now
- what buildout is accepted
- what is scheduled today/this week
- what deserves a review block

These decisions are real and important, but should not be forced into canon.

## Runtime/harness role with decisions

The harness/runtime layer should treat decisions as explicit control artifacts where possible.

Examples:
- execution dispatch decision
- redirect decision
- stop/kill decision
- attach/reuse-session decision
- approval-required decision
- escalation decision from planning to execution

These should be observable and linkable, not just hidden in logs.

## Suggested decision object families

### `decision_candidate`
Pre-ratified decision object.

Potential homes:
- `ema-genesis/planning/promotion-candidates/*`
- provenance/review-promoted planning artifacts

### `decision_record`
Operational or runtime decision record with explicit context.

Potential homes:
- SQLite operational store
- review/promotion linkage
- later graph projection

### `canon_decision`
The existing strongest form.

Primary home:
- `ema-genesis/canon/decisions/*`

### `decision_outcome_link`
Connects a decision to:
- resulting proposal
- execution
- goal
- calendar block
- implementation change
- contradiction or regret

### `decision_precedent`
Derived relation that says:
- this new candidate is similar to one or more older decisions
- these older decisions should be surfaced as context

## Proposed storage model

### File-backed semantic truth
Use for:
- canon decisions
- some planning decision candidates
- precedent-worthy decision summaries

### SQLite/runtime ledger
Use for:
- operational decisions
- runtime control decisions
- review-linked decision transitions
- outcome links

### Derived graph/read-model layer
Use for:
- precedent surfacing
- decision-to-outcome graph traversal
- decision clusters by subsystem/project/theme

## Decision-specific promotion model

Suggested pathways:

- `Chronicle extraction -> Review -> decision_candidate`
- `Blueprint/GAC answer -> decision_candidate`
- `decision_candidate -> canon_decision`
- `decision_candidate -> operational decision`
- `decision_candidate -> proposal generation`
- `decision_candidate -> gap record` when unresolved or contradicted

## Decision frontmatter / metadata suggestion

```yaml
id: DECISION-CAND-001
plane: planning
subtype: decision_candidate
status: draft|reviewed|promoted|rejected|superseded
scope: canon|planning|operational|runtime
summary: "Short decision statement"
rationale: "Why this path is preferred"
alternatives:
  - "Alternative A"
  - "Alternative B"
connections:
  - { target: "[[canon/specs/...]]", relation: targets_canon }
  - { target: "[[gaps/GAP-...]]", relation: resolves_gap }
  - { target: "[[executions/EXE-...]]", relation: influenced_execution }
```

## Strong recommendation

EMA should explicitly make decisions a bridge object across:
- Blueprint
- Review
- canon
- operational planning
- runtime fabric

That is how it preserves the "why" of the system rather than just the "what".
