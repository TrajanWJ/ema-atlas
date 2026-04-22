# Review / Promotion Decision Target Expansion

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

EMA's current Review/Promotion backend is already strong, but its target model is still too narrow for the broader planning/decision architecture.

Current review target kinds are:
- `intent`
- `goal`
- `calendar_entry`
- `execution`

That covers important runtime and operational targets, but it does not yet cover the new planning/decision layer we have now defined.

This document defines how Review/Promotion should expand to support decision-aware and planning-aware targets without breaking the current spine.

## Current reality

### Chronicle extraction kinds today
- `intent_candidate`
- `goal_candidate`
- `calendar_candidate`
- `execution_evidence_candidate`
- `follow_up_candidate`
- `project_link_candidate`

### Review target kinds today
- `intent`
- `goal`
- `calendar_entry`
- `execution`

### Problem

This model cannot yet directly promote reviewed material into:
- planning nodes
- candidate intents
- decision candidates
- decision records
- gap records
- canon decision candidates

So the system still has an awkward gap between:
- provenance-backed review
and
- the broader planning/decision architecture we now want

## Recommended target expansion

### New target kinds to add conceptually

#### planning layer
- `candidate_intent`
- `planning_node`
- `aspiration`
- `promotion_candidate`

#### decision layer
- `decision_candidate`
- `decision_record`

#### gap layer
- `gap_record`

#### canon staging
- `canon_decision_candidate`

Important note:
- `canon_decision_candidate` is intentionally not the same as `canon_decision`
- ratified canon writes should remain stricter than ordinary promotion

## Recommended extraction-kind expansion

Current extraction kinds are helpful but can be extended over time to better feed the new architecture.

Potential future kinds:
- `decision_candidate`
- `planning_candidate`
- `gap_candidate`
- `precedent_candidate`

This does not need to land all at once.

## Promotion policy by target kind

### Safe near-term targets
These fit naturally into the current architecture with lower semantic risk:
- `decision_candidate`
- `candidate_intent`
- `planning_node`
- `gap_record`

### Medium-risk targets
Need clearer downstream semantics:
- `decision_record`
- `promotion_candidate`
- `aspiration`

### High-scrutiny targets
Need stricter promotion/ratification semantics:
- `canon_decision_candidate`
- direct canon write targets (should probably remain outside ordinary review promotion)

## Recommended receipt semantics

Promotion receipts should continue to record:
- review item id
- extraction id
- chronicle source ids
- target kind
- target id
- promotion mode
- provenance summary

For new decision/planning targets, receipts should additionally capture:
- `target_plane`
- `promotion_scope` (`planning`, `operational`, `runtime`, `canon-staging`)

## Backwards-compatible path

### Phase 1
Keep current target kinds intact.
Add new target kinds in shared schemas and review service validation, but support them first as:
- `record` or `link` mode
- with minimal write-side behavior

### Phase 2
Add creation/link support for:
- `decision_candidate`
- `candidate_intent`
- `planning_node`
- `gap_record`

### Phase 3
Add more structured promotion support for:
- `decision_record`
- `promotion_candidate`
- `canon_decision_candidate`

## Strong recommendation

Expand Review/Promotion toward planning and decision targets, but do **not** make it responsible for casually writing ratified canon objects.

Review should remain the provenance decision boundary; canon should remain the strongest ratification boundary.
