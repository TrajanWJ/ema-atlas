# EMA 0.0.5 Orchestration Status

Canonical live ledger for the 0.0.5 buildout. One coordinator, many workers.
Every session — Codex, Claude CLI, or human — reads this file on cold start.

Coordinator: Claude (replacement orchestrator, consolidated role).
Last coordinator sweep: 2026-04-24T14:48-04:00.

## Session close 2026-04-24T14:48

Coordinator handoff landed. Specifically:
- Ledger file (this file) created.
- `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md` written — explains consolidation + why Codex was demoted.
- `doctrine/planning/orchestrator-prompts/CODEX-ORCHESTRATOR-PROMPT.md` reframed as a worker brief (header + read-first order changed; a parallel session had already added Stub Discipline + Vertical-Slice Rule, both kept). The "First Codex Lane" is now framed as "Recommended first slice (coordinator assigns the lane)."
- `apps/web/src/app/mock-projections.ts` `agentWork` export no longer carries "Codex: active" self-reports; it carries one entry that points callers at this ledger, plus a `TODO(event-family: …)` comment.
- MOCK badges confirmed already rendered on every mock-backed surface (topbar, hq-page, agent-work-page, blueprint, git-ema connectors + attachment list, placeholder-page) — no new wiring needed.
- `.ema-dev/pids/daemon.pid` and `.ema-dev/pids/web.pid` now reflect the live pids (47943 / 40269) instead of the dead 41762.

Outcome: daemon compiles green (fix landed via a parallel session while coordinator was planning); daemon alive; web alive; W1 M1 round-trip is the next exit gate.

## Read-first order for any new session

1. This file (`docs/orchestration/STATUS.md`)
2. `doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md`
3. `doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md`
4. `doctrine/planning/EMA-0.0.5-PASSOVER-AND-PREP.md` (topology rationale, older 0.0.3 trap-doors to avoid)
5. `runtime/EMA-0.0.5--4-24/docs/architecture/08-vanilla-workspace.md`
6. `runtime/EMA-0.0.5--4-24/docs/architecture/09-see-agent-work.md`
7. `runtime/EMA-0.0.5--4-24/docs/architecture/10-first-boot.md`
8. `runtime/EMA-0.0.5--4-24/docs/plans/IMPLEMENTATION-ROADMAP.md`
9. `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md` (why we consolidated)

Doctrine may update. Code that contradicts doctrine loses.

## Current wave

**W1 — Workspace skeleton, unblock phase.**
M1 milestone (daemon ↔ WS round-trip) is the exit gate for W1.

## Live processes (as of 2026-04-24T14:35)

| Service | Pid | Port | Source | Status |
|---|---|---|---|---|
| EMA daemon (Gleam/BEAM) | 47943 | `ws://127.0.0.1:49555` | `apps/daemon`, started via `gleam run` at 14:32 | **alive** |
| EMA web dev (Vite) | 40269 | `http://127.0.0.1:5173` | `apps/web`, `pnpm --filter @ema/web dev` | **alive** |
| `start-ema-dev.sh` wrapper | 41730 | — | idle; the wrapper's original daemon (pid 41762) died from earlier compile errors before the files were fixed | **idle** |

`.ema-dev/pids/daemon.pid` now reflects 47943 (live). `.ema-dev/pids/web.pid` now reflects 40269 (live).

The wrapper's idempotency check is port-based (`lsof -iTCP:49555 -sTCP:LISTEN`), so re-running `start-ema-dev.sh` will correctly skip a second daemon launch.

## Wave-by-wave reality

| Wave | Area | State | Notes |
|---|---|---|---|
| W0 | Doctrine + contracts | landed | Architecture docs (12), vApp specs (3), ID registry (44 prefixes), event catalog. |
| W1 | Daemon scaffold | **compiles green, M1 not proven** | `gleam build` clean. Bus/registry/supervisor/event_envelope present. WS listener on 49555. End-to-end append+subscribe round-trip not yet demonstrated. |
| W1 | Web shell | rendering, all mocked | Topbar, selectors, vApp layouts — reading `mock-projections.ts`. |
| W2 | Blueprint + git-ema writers | not started | Empty dirs at `apps/daemon/src/ema_blueprint/`, `ema_attachments/`. UI shows a mock Blueprint tree and git-ema attachment list. |
| W3 | See Agent Work | UI only, no writers | `agent-work-page.tsx` renders mock swarms/missions/lanes; no `swarm.start` or `lane.open` handler in the daemon. |
| W4–W7 | Actors/Soul/Proposals/Runtime/Collab | not started | Design only. |

## Lanes

Lane scope is disjoint. One owner per lane. Lane prompts live under `docs/orchestration/lanes/` once scoped (none yet — next coordinator move).

| Lane | Status | Owner | Files | Exit criteria |
|---|---|---|---|---|
| `L-m1-roundtrip` | **next** | unassigned | `apps/daemon/src/ema_daemon/*.gleam`, `apps/cli/src/commands/ping.ts`, `tooling/m1-round-trip.mjs` | `m1-round-trip.mjs` script calls daemon WS, appends one test event, subscribes, sees it streamed back. |
| `L-writers-org-space` | queued | unassigned | `apps/daemon/src/ema_orgs/`, `ema_spaces/`, plus catalog entries in `packages/contracts/events/` | `org.created` + `space.created` (default-same-name) accepted as commands, projected, visible in topbar projection. |
| `L-projections-topbar` | queued | unassigned | `apps/daemon/src/ema_projections/topbar.gleam`, `packages/surface-core/src/ipc-client/use-projection.ts` | Topbar reads live projection instead of `mockTopbar`. |
| `L-see-agent-work-docs` | queued | unassigned | `docs/cli/see-agent-work.md`, `docs/agents/see-agent-work-agent-usage.md` | Operational runbook: every CLI command has a worked example; an external session can follow the runbook cold. |
| `L-ipc-client` | queued | unassigned | `packages/surface-core/src/ipc-client/` | Real WS client replaces the stubbed hook. |
| `L-honest-mocks` | **closed this sweep** | coordinator | `apps/web/src/app/mock-projections.ts` | Self-reported "Codex: active" agentWork entries removed; source of truth for worker status is this ledger, not UI mocks. |

## Blockers

- None blocking W1 exit. M1 round-trip is a lane to pick up, not a blocker.
- Open watch: 3 other live `claude` CLI sessions (pids 23004, 26117, 45575) are finishing in place and were not part of this consolidation. Their future edits should start reading this file.

## Rules of engagement (anti-Codex-drift)

1. **No worker ships mock data as if it were real.** Any `mock-projections.*` entry must carry a `TODO(event-family: …)` comment.
2. **No worker edits another worker's lane files.** Lane scope is in the lane prompt and enforced at review.
3. **No refactor without green build at start and green build at end.** The Gleam import bugs that broke the daemon earlier today were a half-finished refactor.
4. **Writer actors only write via the daemon.** Surface code caught writing canon gets reverted.
5. **Every new event kind requires same-change updates to `packages/contracts/events/catalog.v0.md` and the family file.** Every new ID prefix requires updating `packages/contracts/types/ids.md`.
6. **Worker status lives here, not in product UI.** The See Agent Work panel reads projections; self-status never ships to surface.
7. **Coordinator diffs actual files vs claimed summary before a lane closes.**

## Decisions logged

- 2026-04-24: consolidate orchestrator role to a single coordinator; Codex demoted to worker (still active). Claude CLI session replaces the co-orchestrator setup. See `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md`.
- 2026-04-24: the 3 in-flight Claude CLI sessions finish in place; new rules apply only to sessions started after the handoff.

## Next coordinator actions

1. Scope `L-m1-roundtrip` lane prompt under `docs/orchestration/lanes/L-m1-roundtrip.md` (when a worker is assigned).
2. Audit the other two web shells (topbar, agent-work-page) for any other UI-as-truth patterns.
3. Confirm `tooling/m1-round-trip.mjs` shape matches the current daemon WS protocol.
