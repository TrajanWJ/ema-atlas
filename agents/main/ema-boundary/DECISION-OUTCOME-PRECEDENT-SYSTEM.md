# Decision Outcome + Precedent System

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

EMA should treat decision outcomes and precedents as a first-class derived intelligence layer.

This system should connect:
- decision candidates
- decision records
- canon decisions
- downstream outcomes
- similar historical precedents

## Why this matters

Without outcome and precedent linking, EMA remembers that a decision happened but not whether it was wise, effective, or repeated.

That loses one of the main benefits of decision memory.

## Outcome links

A decision should be linkable to outcomes such as:
- proposal created
- execution launched
- goal changed
- calendar shifted
- implementation landed
- contradiction discovered
- gap resolved
- regret / reversal / supersession

### Suggested outcome link fields
- `decision_ref`
- `outcome_kind`
- `outcome_ref`
- `confidence`
- `note`
- `observed_at`

## Precedent links

A new decision candidate should be able to link to similar older decisions.

### Suggested precedent link fields
- `source_decision_ref`
- `precedent_decision_ref`
- `similarity_score`
- `note`
- `precedent_type` (`similar`, `warning`, `success_pattern`, `reversal_pattern`)

## Where precedent should surface

### In Blueprint
- when answering a GAC card
- when shaping a decision candidate
- when sending to promotion queue

### In Review
- when a provenance-derived decision candidate is approved
- when similar imported decisions already exist

### In Decision Log
- as a dedicated Precedents view
- alongside outcomes and rationale

### In proposals / planning handoff
- inject relevant precedent into downstream context when useful

## Strong recommendation

Do not wait for perfect embeddings or mining before designing the precedent layer.
Start with explicit linked decisions and human-curated outcome notes, then add automated similarity later.
