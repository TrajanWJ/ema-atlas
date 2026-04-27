# Edge: identity (org / space / project / member / agent / personal AI)

**Rule:** Each EMA instance lives within a Project. Projects belong to an Org
or to a User (personal). Personal AI sees the union of the user's memberships,
gated by per-Org policy.

## Primary
- `design-review-fresh-context` — `05-fresh-context-project-app-model.md`
  (the canonical statement)
- `docs-ema-next-steps` — implied by `CURRENT-PRIORITIES.md` step 4
  (workstream/session identity and mirroring)

## Status
**No schema exists yet anywhere in the lineage.** This is the highest-blast-
radius missing piece — every later subsystem hardcodes "no scope" until this
lands in `control_plane/schema.ex`.

## Required separations (from `02-project-transfer-brief.md` §11)
execution_id · local session_id · provider session_id · workspace artifact_id
· peer_id · org/space/member/agent identity
