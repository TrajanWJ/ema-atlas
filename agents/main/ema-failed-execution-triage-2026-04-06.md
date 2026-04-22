# EMA Failed Execution Triage — 2026-04-06 UTC

## Scope
Live host EMA reported 10 failed executions. Event inspection shows these are not one homogeneous class.

## Classification

### A. Historic timeout failures (4)
These are older Sprint 3 research/smoke-test executions that failed because Claude CLI timed out after 120000ms.

IDs:
- `ScGJVSz9rmY`
- `sAlTzmzLXQE`
- `LPQ-WuTMMf0`
- `m4gHaYniAEI`

Evidence:
- event payload reason: `%{code: :timeout, message: "Claude CLI timed out after 120000ms"}`

Interpretation:
- these are legacy smoke-test artifacts, not current active regressions
- they should be marked/handled as historical timeout debris unless explicitly worth replaying

### B. Historic orphaned execution (1)
One older implement-mode E2E test failed because the BEAM exited before Claude completed.

ID:
- `G0QNEdtvGcM`

Evidence:
- event payload reason: `orphaned — BEAM exited before Claude completed`

Interpretation:
- this is infrastructure instability evidence from earlier runtime bring-up
- no sign this is still the dominant current failure mode after service alignment

### C. Provider quota/rate-limit failure (1)
One test failed because Claude hit a usage limit.

ID:
- `u7MQ5z9epG0`

Evidence:
- event payload contains result text: `You've hit your limit · resets 9pm (America/New_York)`

Interpretation:
- this is not an EMA routing bug by itself
- should be classified distinctly from internal execution failures

### D. Ambiguous/partially recorded failed intent executions (3)
Three intent-based research failures show duplicate dispatch_started/running transitions but no explicit terminal failure reason in the event stream.

IDs:
- `PsOQP664oPw`
- `C3JRWRbSwsA`
- `VS9aIh-RD7A`

Evidence:
- duplicate `dispatch_started`
- duplicate transition patterns into `running`
- no explicit `failed` event reason preserved through current events endpoint, despite top-level status now `failed`

Interpretation:
- strongest signal of an execution-state integrity problem
- likely older dispatch/race/pathology around auto-dispatch or event persistence
- these are the most interesting failures from an EMA correctness perspective

### E. Missing terminal-failure event record (1)
One execution is marked failed in the index but exposes no terminal failure reason in events.

ID:
- `whs00dGNCq0`

Evidence:
- only created/approved/dispatch_started/running events visible
- top-level status is `failed`

Interpretation:
- another execution-state/event-integrity issue
- likely same family as class D

## Net assessment

The current `failed executions: 10` count is inflated by historical bring-up debris.

Approximate breakdown:
- 4 timeout debris
- 1 orphaned old runtime failure
- 1 provider quota failure
- 4 event-integrity / state-integrity anomalies

## Priority order

1. **Fix state/event integrity visibility**
   - because 4 failures do not expose clean terminal reason paths
   - this harms operator trust and autonomous recovery

2. **Separate historical debris from active health**
   - old timeout/orphan/quota failures should not dominate current host-truth forever

3. **Add failure taxonomy into operator surfaces**
   - timeout
   - provider quota
   - orphaned runtime
   - state-integrity anomaly
   - unknown

## Recommended immediate actions

### Short term
- add a triage/classification view for failed executions
- distinguish `historic_failed` from `active_failed` in host truth
- expose top failure classes in operator package

### Medium term
- add durable terminal failure reason storage on execution rows
- ensure every failed execution has:
  - failure class
  - failure message
  - terminal event timestamp
  - retryability flag

### Cleanup candidates
These likely can be treated as historical debris / archived failures unless user wants replay:
- `ScGJVSz9rmY`
- `sAlTzmzLXQE`
- `LPQ-WuTMMf0`
- `m4gHaYniAEI`
- `G0QNEdtvGcM`
- `u7MQ5z9epG0`

These deserve deeper EMA correctness investigation first:
- `PsOQP664oPw`
- `C3JRWRbSwsA`
- `VS9aIh-RD7A`
- `whs00dGNCq0`

## Why this matters for “EMA everywhere”

Before context/loop surfaces can be trusted everywhere, host EMA must distinguish:
- active operational breakage
- historic failed artifacts
- provider quota events
- event/state corruption

Otherwise every operator surface will keep reporting degraded status without saying what kind of degraded it is.
