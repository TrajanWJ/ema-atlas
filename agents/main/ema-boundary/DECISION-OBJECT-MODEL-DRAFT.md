# Decision Object Model Draft

Status: draft architecture aid
Date: 2026-04-13

## Families

### decision_candidate
Under formation or review.

Fields:
- id
- plane
- scope (`canon|planning|operational|runtime`)
- summary
- rationale
- alternatives
- source_kind
- status
- connections

### decision_record
Durable record of a real operational or runtime decision.

Fields:
- id
- scope
- actor_id
- decided_at
- rationale
- target_kind
- target_id
- context_refs
- outcome_refs

### canon_decision
Ratified decision stored in canon.

Fields:
- canonical id
- status
- supersedes / superseded_by
- implementation_status
- rationale
- alternatives

### decision_outcome_link
Connects a decision to consequences.

Fields:
- id
- decision_ref
- outcome_kind
- outcome_ref
- confidence
- note

### decision_precedent_link
Connects a new candidate/record to similar historical decisions.

Fields:
- id
- source_decision_ref
- precedent_decision_ref
- similarity_score
- note
