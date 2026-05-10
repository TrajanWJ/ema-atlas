# L-honest-mocks — Remove Self-Reported "Codex: active" Surface Claims

**Status:** closed 2026-04-24
**Owner:** coordinator (post-drift correction)
**Wave:** W1
**Retrospective only.** This lane is closed. The file exists to keep the lanes/ directory complete and to document what shipped so future sessions do not re-litigate the decision.

## Context

On 2026-04-24 `apps/web/src/app/mock-projections.ts` was exporting an `agentWork` array with entries that read `owner: "Codex", status: "active"` for the daemon and web lanes. These were rendered as user-facing UI. That is the exact anti-pattern the CLAUDE orchestrator non-negotiable forbids: a surface claiming authority for worker status. See `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md` for the full drift account.

## What shipped

- `apps/web/src/app/mock-projections.ts` `agentWork` export no longer carries self-reports. It carries one entry that points callers at `docs/orchestration/STATUS.md` as the canonical ledger, plus a `TODO(event-family: …)` comment.
- `MOCK_PROJECTION_LABEL` confirmed already rendered on every mock-backed surface: topbar, `hq-page.tsx`, `agent-work-page.tsx`, blueprint, git-ema connectors, git-ema attachment list, placeholder-page. No additional label wiring was needed.

## Why this lane existed

To make "worker status lives in the ledger, never in product UI" operationally true after the 2026-04-24 consolidation, not just a rule on paper.

## Why it stays closed

The rule is now enforced at review time (Rules of Engagement #6 in `STATUS.md`). Any re-introduction of self-reported agent status in `mock-projections.*` is a rejection at review, not a new lane.

If a future session needs to reopen this work (e.g. a different surface starts self-reporting), they should open a new lane ID rather than re-opening this one.

## Reporting

This lane is already reported in the 2026-04-24T14:48 coordinator session-close entry in `STATUS.md`. No further reporting is required.

## Ledger anchor

`runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md` is authoritative for closure state.
