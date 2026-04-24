# Lane L-surface-slice-plan-archive — Archive Landed Surface Slice Plan

Status: candidate, coordinator review required
Opened: 2026-04-24
Owning orchestrator: Workspace Hygiene, with Product Surface Donor review
Ledger entry: `docs/orchestration/STATUS.md`

## Problem

`docs/plans/SURFACE-SLICE-A.md` is a lane plan marked "draft, awaiting operator
approval", but the same work has landed and now has a lane ledger file at
`docs/orchestration/lanes/L-see-agent-work-8-region.md`.

Keeping the landed slice in `docs/plans/` makes the live plan folder look like
it still contains active product work.

## Proposed Move

Move or merge the landed slice plan into orchestration history, then leave a
small redirect if existing comments still need a stable target.

Candidate destination:

```text
docs/orchestration/archive/2026-04-24/SURFACE-SLICE-A.md
```

## Blast Radius

Coordinator review required because code comments and docs reference
`SURFACE-SLICE-A.md` in more than five places.

## Exit Criteria

- `docs/plans/` contains active roadmap/planning docs only.
- Every `SURFACE-SLICE-A.md` reference points to the archived/redirected path.
- `docs/orchestration/lanes/L-see-agent-work-8-region.md` remains the live lane
  record.
- `pnpm --filter @ema/web build` passes.
