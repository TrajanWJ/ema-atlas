# Folder Audit — 2026-04-24

Status: Slice A audit + one safe move executed
Owner: Codebase Architecture & Extensibility Orchestrator

## Method

Read-first anchors: live `STATUS.md`, master plan, language lock, every current
architecture doc, implementation roadmap, workspace inventory, and both root
READMEs. Walked `runtime/EMA-0.0.5--4-24/` and `doctrine/`, excluding generated
dependency/build trees (`node_modules/`, Gleam `build/`, Tauri `target/`, web
`dist/`) when assessing source layout.

## Proposed-Move Table

| Current path | Proposed path | Reason | Blast radius | Action |
| --- | --- | --- | ---: | --- |
| `docs/architecture/13-peer-computer-access.md` | `docs/operations/peer-computer-access.md` | The file defines an SSH/admin trusted-dev operator rail. It is operational guidance, not an architecture invariant. | 2 importers | Executed. Updated `docs/WORKSPACE-ENTRYPOINT.md` and `docs/architecture/11-transport-and-auth-survey.md`. |
| `apps/web/src/app/see-agent-work/` | `apps/web/src/vapps/see-agent-work/` with `agent-work-page.tsx` as wrapper | vApps are the product-surface seam. A future surface worker should discover See Agent Work under `vapps/`, not hidden under route/app components. | 10+ files/imports/docs | Escalated as `docs/orchestration/lanes/L-vapp-path-reconciliation.md`. |
| `apps/web/src/**/*.js` tracked twins | Remove from source tracking, or regenerate under build output only | 38 JavaScript files sit beside matching TypeScript/TSX sources. Cold readers see duplicate implementations. | 38 files, 0 direct importers found | Escalated as `docs/orchestration/lanes/L-web-generated-source-twins.md`. |
| `packages/surface-core/src/adapter/` missing from disk | Restore adapter or update doctrine to defer it | The architecture anchor names this as part of the virtual desktop shipping shape, but the current tree lacks it after a later revert. Doctrine and disk disagree. | cross-package contract | Escalated as `docs/orchestration/lanes/L-surface-core-adapter-reconciliation.md`. |
| `docs/plans/SURFACE-SLICE-A.md` | `docs/orchestration/archive/2026-04-24/SURFACE-SLICE-A.md` or redirect to lane record | The work is landed and now has `L-see-agent-work-8-region.md`; keeping it as an active plan is misleading. | 5+ code/doc refs | Escalated as `docs/orchestration/lanes/L-surface-slice-plan-archive.md`. |
| `docs/plans/RUNTIME-RECOVERY-HANDOFF.md` | `docs/orchestration/handoffs/runtime-recovery-2026-04-24.md` | It is a recovery handoff prompt and next-lane note, not an implementation roadmap. | 1 self-ref found | Candidate only. Deferred to Context Quality/Workspace Hygiene so a handoffs README/index can land with it. |
| `.ema-dev/` and `.ema-dev-updates/` | keep ignored local state | These are local dev/runtime artifacts already covered by `.gitignore`; current tracked source audit treats them as non-source. | 0 | No move. |

## Actions Taken

- Moved `docs/architecture/13-peer-computer-access.md` to
  `docs/operations/peer-computer-access.md`.
- Updated both stale references found by grep.
- Opened four coordinator-review lane files for moves above the direct threshold
  or crossing lane ownership.

## Stale-Reference Check

After the safe move, `rg '13-peer-computer-access|architecture/13-peer'` should
only find historical mentions in this audit or no live references.

## Verification

- `bash scripts/lint.sh` could not run because `scripts/lint.sh` does not exist
  yet.
- `bash scripts/contract-check.sh` passed.
- `cd apps/daemon && gleam build && gleam test` passed.
- `pnpm -r typecheck` passed.
- `pnpm --filter @ema/web build` passed.
- `node tooling/m1-round-trip.mjs` passed against the live daemon.

## Notes For Next Slice

Slice E should add READMEs for non-trivial doc folders before more document
moves. In particular, `docs/orchestration/`, `docs/operations/`, and
`docs/plans/` need short orientation files so the handoff/archive distinction is
obvious.
