---
type: plan-index
project: EMA
build: 0.0.6
updated: 2026-05-10
---

# EMA 0.0.6 Plan Index

Plans live in two trees:

- `docs/plans/` — narrative orchestration plans, lane plans, audits, and
  recovery handoffs. Some are controlling, some are historical.
- `docs/superpowers/plans/` — superpower-style structured implementation
  plans (sprints + checkbox steps). The current controlling head-orchestrator
  master plan lives here. See
  [`docs/superpowers/plans/README.md`](../superpowers/plans/README.md) for
  that tree's index.

Use this file to know which plan is currently authoritative, what supersedes
what, and where each plan fits.

## Currently controlling

- **Head-orchestrator master plan (current, 2026-05-10):**
  [`../superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md`](../superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md)
  — 10 sprints from Sprint 0 (freeze + classify) through Sprint 10 (runtime
  + Tauri parity). Gates Proslync swarm launch. Supersedes everything below
  marked "superseded."

## Companion superpower plans (active)

These run alongside the master plan or feed into specific sprints. None of
them claim to override the master plan.

- [`../superpowers/plans/2026-05-10-ema-functional-0.0.6-head-orchestrator.md`](../superpowers/plans/2026-05-10-ema-functional-0.0.6-head-orchestrator.md)
  — earlier 2026-05-10 functional-rails head-orchestrator pass; partly folded
  into the master plan.
- [`../superpowers/plans/2026-05-10-ema-workspace-prep-and-wiring.md`](../superpowers/plans/2026-05-10-ema-workspace-prep-and-wiring.md)
  — workspace prep + wiring details that the master plan references.
- [`../superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md`](../superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md)
  — cockpit CLI feed for the master plan's Sprint 2/3 work.
- [`../superpowers/plans/2026-05-10-ema-system-environment-and-stub-buildout-head-orchestrator.md`](../superpowers/plans/2026-05-10-ema-system-environment-and-stub-buildout-head-orchestrator.md)
  — system environment + stub buildout, feeds Sprint 4/6.
- [`../superpowers/plans/2026-05-10-proslync-ema-intention-backfeeder.md`](../superpowers/plans/2026-05-10-proslync-ema-intention-backfeeder.md)
  — intention backfeeder, feeds Sprint 5.

## Historical / superseded

These remain on disk for provenance. Do not treat them as current
instructions; check the `> SUPERSEDED BY:` banner at the top of each.

- [`MASTER-ORCHESTRATION-2026-05-07.md`](MASTER-ORCHESTRATION-2026-05-07.md)
  — 14-lane wave plan from the 2026-05-07 frontend-daemon disconnect session.
  **Superseded** by the 2026-05-10 master plan (which folds in or
  reclassifies most of this plan's lanes; see
  [`0.0.6-LANE-PLAN-2026-05-07.md`](0.0.6-LANE-PLAN-2026-05-07.md)
  §"Reconciliation map").
- [`../superpowers/plans/2026-05-10-ema-proslync-first-active-development-sprints.md`](../superpowers/plans/2026-05-10-ema-proslync-first-active-development-sprints.md)
  — narrower active-development plan from earlier on 2026-05-10. **Superseded**
  by the head-orchestrator master plan; useful work was reclassified into
  the master plan's tracks.
- [`RUNTIME-RECOVERY-HANDOFF.md`](RUNTIME-RECOVERY-HANDOFF.md) — 0.0.5-era
  recovery handoff. **Historical**: references EMA-0.0.5 paths as active;
  preserved for lineage, not for current routing.

## Architecture audit + lane plans (still useful)

These survive because the head-orchestrator master plan references their
findings; treat them as audit evidence, not as competing plans.

- [`0.0.6-ARCHITECTURE-AUDIT-2026-05-07.md`](0.0.6-ARCHITECTURE-AUDIT-2026-05-07.md)
  — 0.0.6 architecture audit (packages-not-load-bearing finding).
- [`0.0.6-LANE-PLAN-2026-05-07.md`](0.0.6-LANE-PLAN-2026-05-07.md) — lane
  plan derived from the audit; reconciles with the 2026-05-07 wave plan.
- [`IMPLEMENTATION-ROADMAP.md`](IMPLEMENTATION-ROADMAP.md) — broader
  implementation roadmap. Verify against the master plan before treating any
  step as current.

## Other plans by category

- `PLACE-DONOR-RECOVERY.md`, `SURFACE-SLICE-A.md`,
  `ORCHESTRATION-MAP-2026-04-29.md` — earlier slice/recovery plans;
  archived copies in `_archive/`. Treat the originals as historical.

## Live ledger

[`../orchestration/STATUS.md`](../orchestration/STATUS.md) is the live
ledger. Plan documents propose and structure work; STATUS records what
actually landed. When in doubt, trust STATUS over plan claims.
