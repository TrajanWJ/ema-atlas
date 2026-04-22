# EMA Review / Governance Queue Spec

Status: active governance spec for the current control-plane implementation.

## Why this exists

The current EMA control plane had a vague boundary between:
- proposal creation
- human approval
- execution start

That made the queue hard to read and made `approved_by` semantically misleading, because a proposal could move straight from creation into execution.

## Canonical proposal states

For the current control-plane path, proposal state should mean:

- `pending_review` — proposal exists and is waiting for an explicit reviewer decision
- `approved` — proposal is approved and ready to execute, but has not started yet
- `running` — an execution exists and is active or dispatching
- `completed` — execution finished successfully
- `failed` — execution failed, timed out, or became orphaned
- `cancelled` — execution was intentionally cancelled

## Approval semantics

### Rules

1. `propose` must create proposals in `pending_review`.
2. `approve` is the only transition that may set `approved`.
3. `run` must reject proposals that are not already `approved`.
4. `approved_by` must only mean the actor who approved the proposal, not the actor who happened to execute it.
5. Approval should emit a distinct `proposal_approved` event.

### Rationale

This creates a visible, operable handoff point between planning and execution.
That handoff is the minimum viable governance surface for both humans and agents.

## Queue surfaces

Every operator-facing status surface should expose the review queue as three buckets:

- `pending_review` — needs decision
- `approved_ready` — can be run now
- `in_flight` — already executing

This is intentionally small. The first governance win is clarity, not a giant policy engine.

## Human vs agent governance

For now, EMA should treat both humans and agents as actors, but not as equivalent authorities.

### Human authority
- may approve proposals
- may run approved proposals
- may cancel or override

### Agent authority
- may draft proposals
- may recommend approval
- may execute only after approval is explicit in control-plane state

## Next extensions

After this spec is in place, the next useful additions are:

1. rejection / request-changes transitions
2. reviewer notes and decision rationale fields
3. policy tags for destructive or external actions
4. separate approval policy for human-only vs agent-delegable execution lanes
5. dedicated review-board UI/API instead of relying on generic status payloads
