# Lane L-surface-core-adapter-reconciliation — Reconcile Virtual Desktop Adapter Anchor

Status: candidate, coordinator review required
Opened: 2026-04-24
Owning orchestrator: Runtime Vertical Slice, with Codebase Architecture review
Ledger entry: `docs/orchestration/STATUS.md`

## Problem

The current architecture anchor names
`packages/surface-core/src/adapter/` as part of the virtual desktop shell
shipping shape from commit `20a1820`. The current tree no longer has that
folder; the latest ledger says a surface worker deleted it as out of scope for
surface work.

This is a doctrine/code disagreement, not a place for a silent file move.

## Required Decision

Coordinator must choose one of:

- restore the adapter package under Runtime Vertical Slice ownership, or
- update the doctrine anchor and runtime README to say the adapter is deferred.

Doctrine should be updated before code if the adapter is no longer part of the
shipping shape.

## Scope

- `packages/surface-core/src/adapter/**`
- `packages/surface-core/src/index.ts`
- `packages/surface-core/README.md`
- architecture docs that name the virtual desktop shell adapter shape
- `docs/orchestration/STATUS.md`

## Blast Radius

Coordinator review required because this crosses runtime-package contracts and
the virtual desktop shell doctrine anchor.

## Exit Criteria

- Doctrine and disk agree on whether the adapter exists in 0.0.5 wave 1.
- If restored, it is exported by `@ema/surface-core` and typechecked.
- If deferred, docs explicitly name the owning future lane.
- `pnpm -r typecheck` passes.
