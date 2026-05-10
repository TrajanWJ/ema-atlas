# Desktop-Wide Recovery Ledger

<!-- doctrine-alignment -->
- target: EMA-0.0.6
- last_aligned: 2026-05-10
- canonical_stack_doc: docs/architecture/STACK.md
<!-- /doctrine-alignment -->

This ledger tracks donor material found outside the modern EMA implementation.
Donor projects are read-only. Recovery work ports or adapts ideas into
`/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6` only. [realigned 0.0.5 -> 0.0.6 in Sprint 1.5]

## Policy

- Do not edit donor projects.
- Do not move or clean donor project files.
- Do not import project-specific client/product work as EMA truth.
- Promote only reusable EMA patterns: agent work, worktrees, lane/queue state,
  handoffs, vCalendar cadence, desktop/native control-plane behavior, vApp
  structure, and tests.
- Every accepted recovery item needs a modern EMA owner path and verification.

## Current High-Value Donor Pools

| Donor | Classification | Modern EMA Target | Status |
| --- | --- | --- | --- |
| `Active builds/EMA-0.0.5-swarm-claude/docs/orchestration/swarm/` | historical swarm runbook donor | `docs/orchestration/swarm/` | accepted as historical evidence |
| `Active builds/EMA-0.0.5-swarm-codex/docs/orchestration/swarm/` | historical swarm operating model donor | `docs/orchestration/swarm/` | accepted as historical evidence |
| `Projects/EMA/atlas/content/swarm/object-model.md` | canonical object model | contracts + docs + Agent Work projection | accepted |
| `Projects/EMA/atlas/content/swarm/ema-swarm-workspace.md` | workspace doctrine | contracts + Agent Work/HQ behavior | accepted |
| `Projects/EMA/atlas/content/swarm/orchestration-kernel.md` | operating discipline | `docs/orchestration/swarm/` | accepted |
| `Active builds/duct-tape-onion-harness/` | harness/control-plane donor | CLI harness + worktree recovery scan | accepted |
| `Space shared files-uploads-vDesktop-vFilesystem-root/place-companion/` | native companion donor | `apps/desktop/src-tauri` + desktop presence | accepted |
| `Space shared files-uploads-vDesktop-vFilesystem-root/place.org/` | shell/vDesktop donor | web desktop + vApp window behavior | deferred |
| `_cleanup-archives/apps-web.pre-port-backup-20260429-060300/` | pre-port web backup | vApps + Playwright coverage | partially recovered |
| `Projects/locked-in-ios-app/{lanes,queue,handoffs}` | migrated EMA-global mirrors | stale lane/queue evidence only | accepted as evidence |

## First Execution Target

Executable Agent Workspace is the first recovery lane:

1. Complete daemon-backed lane lifecycle writers.
2. Complete daemon-backed queue lifecycle writers.
3. Add agent report ingestion.
4. Feed Agent Work from live `lane.registry`, `queue.registry`, reports,
   handoffs, problems, checkups, and chronicle events.
5. Keep donor project mirrors untouched.

## Scanner

Run:

```bash
node tooling/recovery/desktop-recovery-scan.mjs --json
ema recovery scan --json
ema recovery scan --kind stale-queue,stale-lane --confidence high --json
```

The scanner is read-only. It reports candidates; it does not mutate donors or
the EMA repo.

## Recovered In This Pass

- `docs/orchestration/swarm/README.md`
- `docs/orchestration/swarm/OPERATING-MODEL.md`
- `docs/orchestration/swarm/ROLE-TAXONOMY.md`
- `tooling/recovery/desktop-recovery-scan.mjs`
- `ema recovery scan`
