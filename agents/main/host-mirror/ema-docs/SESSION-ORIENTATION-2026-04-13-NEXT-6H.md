# EMA Session Orientation — Next 6 Hours

Status: active session handoff
Date: 2026-04-13

## What changed

EMA work for the next session should assume a strict distinction between:
- canon
- planning / blueprint / intention-building
- implemented reality
- the gap between them

This is now a first-class operating rule.

## The orientation

### Canon
Use for semantic target, rulings, durable architectural intent.
Primary homes:
- `ema-genesis/canon/specs/*`
- `ema-genesis/canon/decisions/*`
- `ema-genesis/_meta/CANON-STATUS.md`

### Planning / blueprint / intention-building
Use for shaping project schematic, intent structure, blueprint queues, and what should come next.
Primary homes:
- `docs/BLUEPRINT.md`
- `docs/planning/*`
- blueprint/GAC-related docs and services
- temporary but durable project planning docs

### Reality
Use for what exists now and what agents can safely rely on.
Primary homes:
- `docs/OPERATING-REALITY.md`
- `docs/backend/*`
- `docs/GROUND-TRUTH.md`
- active code and runtime state

### Gap
Use for explicit delta tracking between canon, planning, and reality.
Primary homes:
- reconciliation docs
- implementation gap notes
- contradiction audits
- explicit gap analyses

## Mandatory agent behavior

- Do not write planning into canon.
- Do not treat canon as implementation status.
- Do not treat planning docs as current reality.
- When making proposals or plans, say which plane they belong to.
- When reconciling docs, preserve the distinction instead of flattening it.

## Practical focus for the next session

Primary objective:
- shape EMA's intent structure and overall project schematic without contaminating canon truth

Desired outcomes:
- clearer planning/intention-building structures
- clearer blueprint/GAC use for project-shaping
- clearer explicit gap ledger between Genesis canon and current TS/Electron implementation
- better agent orientation for future execution work

## Read-first for the next 6h session

1. `README.md`
2. `docs/OPERATING-REALITY.md`
3. `docs/CANON-PLANNING-BOUNDARY.md`
4. `docs/MEMORY-SYNC.md`
5. `docs/backend/README.md`
6. `docs/backend/SOURCE-OF-TRUTH.md`
7. `docs/GROUND-TRUTH.md`
8. `ema-genesis/EMA-GENESIS-PROMPT.md`
9. `ema-genesis/_meta/CANON-STATUS.md`
10. `docs/BLUEPRINT.md`

## Current strategic question

How should EMA represent and work with:
- project schematic
- intention-building
- blueprint planning
- aspirations
- canon targets
- implementation gaps

without collapsing them into one storage plane?

That is the main framing question for the next execution session.
