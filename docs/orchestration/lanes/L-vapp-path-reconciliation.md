# Lane L-vapp-path-reconciliation — See Agent Work vApp Path Reconciliation

Status: candidate, coordinator review required
Opened: 2026-04-24
Owning orchestrator: Product Surface Donor, with Codebase Architecture review
Ledger entry: `docs/orchestration/STATUS.md`

## Problem

The architecture anchor says new product surfaces live as vApps under
`apps/web/src/vapps/<name>/` with a single mount entrypoint. The landed See
Agent Work regions currently live under `apps/web/src/app/see-agent-work/`.

That app-folder location made sense for a narrow first-screen slice, but it
hides the long-term vApp extension seam from cold readers and future surface
workers.

## Proposed Move

Move the landed See Agent Work package into:

```text
apps/web/src/vapps/see-agent-work/
```

Keep `apps/web/src/app/agent-work-page.tsx` as the route/window mount wrapper,
importing the vApp entrypoint from `src/vapps/see-agent-work`.

## Scope

- `apps/web/src/app/see-agent-work/**`
- `apps/web/src/vapps/see-agent-work/**`
- `apps/web/src/app/agent-work-page.tsx`
- code comments that reference `SURFACE-SLICE-A.md`
- `docs/orchestration/lanes/L-see-agent-work-8-region.md`
- `docs/vapps/see-agent-work.md`

## Blast Radius

Coordinator review required because the current package has 9 region files plus
multiple imports, comments, and docs references. The move is simple, but it
touches more than the architecture orchestrator's direct-move threshold.

## Exit Criteria

- `apps/web/src/vapps/see-agent-work/index.tsx` is the vApp mount entrypoint.
- `apps/web/src/app/agent-work-page.tsx` is only a shell/window route wrapper.
- No imports reference `apps/web/src/app/see-agent-work`.
- `pnpm --filter @ema/web build` passes.
- `pnpm -r typecheck` passes.
