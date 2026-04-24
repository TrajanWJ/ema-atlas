# EMA 0.0.5 Orchestration Status

Canonical live ledger for the 0.0.5 buildout. One coordinator, many workers.
Every session — Codex, Claude CLI, or human — reads this file on cold start.

Coordinator: Claude (replacement orchestrator, consolidated role).
Last coordinator sweep: 2026-04-24T15:20-04:00.

## Session close 2026-04-24T15:20 (Product Surface Donor worker, meta-drift recovery + Slice A)

A prior master-orchestrator session drifted hard: invented three rogue
orchestrator prompts (CLAUDE-V2, CODEX-V2, CODEX-CORRECTION-2026-04-24),
crossed three ownership lanes (Surface + Runtime Vertical Slice + Desktop
Launcher) in one pass, shipped a generic glass VirtualDesktopShell block
styled with legacy `--ema-*` hex colors before checking that the place.org
palette was already in place, and skipped the `docs/plans/SURFACE-SLICE-A.md`
plan that the approved Product Surface Donor lane had queued. User feedback:
"looks horrible. not the vision or similar to other codesbases."

This session diagnosed the meta-drift, reverted the lane violations, and
landed the canonical Slice A as the Product Surface Donor worker.

Reverts:
- `packages/surface-core/src/adapter/` deleted (Runtime Vertical Slice lane
  territory; was out of scope for any Surface work).
- `doctrine/planning/orchestrator-prompts/{CLAUDE,CODEX}-ORCHESTRATOR-PROMPT-V2`
  and `CODEX-CORRECTION-PROMPT-2026-04-24` moved to
  `orchestrator-prompts/archive/` with `HANDOFF-2026-04-24.md` preserved
  as the canonical dissolution memo.

Landed (commit `40ba1ea` on branch `lane/surface-slice-a-see-agent-work`):
- `apps/web/src/app/see-agent-work/` — 8 region components + barrel.
  Regions: TopSwarmPulse, MissionRail, LaneBoard (idea/ready/active/review/
  blocked/done columns), VcalendarStrip, AgentRoster, CommandPanel,
  AgentInstructionPanel, ChronicleStrip.
- `apps/web/src/app/agent-work-page.tsx` — composes the 8 regions.
- `apps/web/src/app/mock-projections.ts` — adds `recent_events[]`,
  exports `CHRONICLE_MAX = 200`, derives `agentWorkLaneSummary`.
- `apps/web/src/app/hq-page.tsx` — Lane status panel rewired to read
  `agentWorkLaneSummary` (not the one-line `agentWork` stub).
- `apps/web/src/app/styles.css` — adds `.ema-saw-*` classes with RIP
  provenance markers (place.org glass tiers, codebase-frontend-layer
  density, agent-os-bridge state vocabulary, lineage-original-elixir-ema
  bounded buffer, mission-control-claude role display).

Verifications:
- `pnpm --filter @ema/web build` (tsc + vite) green — 71 modules, 44.8 KB CSS,
  256 KB JS.
- `pnpm check:contracts` — OK — every referenced event kind and id prefix
  is registered.
- Reject ledger clean in `apps/web/src/`: localStorage confined to
  `layout-artifact.ts` (per `ema-virtual-desktop` skill); no Tailwind, no
  shadcn, no zustand, no framer-motion, no electron.
- 21+ `RIP:` provenance markers across `styles.css` + components +
  `mock-projections.ts`.

Language-lock check: every UI string uses `org / space / project / lane /
mission / campaign / handoff / actor / agent / canon / intent / vcalendar /
checkup / weekly phase / focus block`. No `task`-as-synonym-for-lane, no
`workflow`, no `pipeline`. Every mocked control carries one of
`mocked | draft | local only | pending daemon writer`.

Surface lane carry-over (still queued):
- **Slice B** — HQ lane-status deepening: sparkline per lane, hover CLI preview.
- **Slice C** — Global command palette (inspired by place.org, strictly
  IPC-dispatched; no UI-local canon).
- **Slice D** — Chronicle strip frame-type visual language + bounded-buffer
  instrumentation (already partially landed via Slice A's `data-frame`
  attribute; polish lane to come).
- **Slice E** — Vocabulary notes in `docs/cli/see-agent-work.md` (agent-os
  verbs, mission-control adapter-protocol note) and
  `docs/vapps/see-agent-work.md` (takeover state labels).

Adjacent lanes untouched (hand off, don't cross-edit):
- Runtime Vertical Slice Orchestrator: topbar daemon-projection actor
  (`L-projections-topbar` Slice B below); `apps/daemon/**` and
  `packages/surface-core/**` edits.
- Desktop Launcher Correction Orchestrator: Tauri tray / first-launch
  "Start EMA daemon?" affordance; Tauri CSP review.

Decisions logged this sweep:
- 2026-04-24: meta-drift discipline — any orchestrator prompt added beyond
  the canonical 8 listed in `ORCHESTRATOR-INDEX.md` requires a named
  superseding memo (like `HANDOFF-2026-04-24.md`) and a new entry in the
  index before workers treat it as authoritative.
- 2026-04-24: lane-branch policy enforced — Slice A landed on
  `lane/surface-slice-a-see-agent-work`, not on `main`. Next lane starts a
  new branch per `docs/operations/git-policy.md`.

## Session close 2026-04-24T14:48

Coordinator handoff landed. Specifically:
- Ledger file (this file) created.
- `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md` written — explains consolidation + why Codex was demoted.
- `doctrine/planning/orchestrator-prompts/CODEX-ORCHESTRATOR-PROMPT.md` reframed as a worker brief (header + read-first order changed; a parallel session had already added Stub Discipline + Vertical-Slice Rule, both kept). The "First Codex Lane" is now framed as "Recommended first slice (coordinator assigns the lane)."
- `apps/web/src/app/mock-projections.ts` `agentWork` export no longer carries "Codex: active" self-reports; it carries one entry that points callers at this ledger, plus a `TODO(event-family: …)` comment.
- MOCK badges confirmed already rendered on every mock-backed surface (topbar, hq-page, agent-work-page, blueprint, git-ema connectors + attachment list, placeholder-page) — no new wiring needed.
- `.ema-dev/pids/daemon.pid` and `.ema-dev/pids/web.pid` now reflect the live pids (47943 / 40269) instead of the dead 41762.

Outcome: daemon compiles green (fix landed via a parallel session while coordinator was planning); daemon alive; web alive; W1 M1 round-trip is the next exit gate.

## Session close 2026-04-24 — Workspace Hygiene Slice A

Slice: Workspace Hygiene A — Orchestrator Prompt Reconciliation.

Files changed in `doctrine/planning/orchestrator-prompts/`:
- Created `archive/2026-04-24/` and moved three superseded prompts into it: `CODEX-ORCHESTRATOR-PROMPT.md` (V1), `CLAUDE-ORCHESTRATOR-PROMPT.md` (V1), `CODEX-CORRECTION-PROMPT-2026-04-24.md` (one-shot recovery).
- Wrote one-line redirect stubs at the three original paths pointing at the canonical successor.
- Rewrote `ORCHESTRATOR-INDEX.md` with `## Ledger anchor`, `## Active Prompts` (9 rows), `## Archived Prompts` (3 rows), and expanded `## Collision Rules`.
- Added `## Ledger anchor` section to all 9 canonical prompts: Runtime Vertical Slice, Product Surface Donor, Canon Writers, Provenance & Version Control, Workspace Hygiene & Swarm Meta, Code Quality & Language Idiom, Codebase Architecture & Extensibility, Codex V2, Claude V2. No body edits on any of them.

Prompts reconciled (old → new):
- `CODEX-ORCHESTRATOR-PROMPT.md` → `archive/2026-04-24/CODEX-ORCHESTRATOR-PROMPT.md` (superseded by `CODEX-ORCHESTRATOR-PROMPT-V2.md`).
- `CLAUDE-ORCHESTRATOR-PROMPT.md` → `archive/2026-04-24/CLAUDE-ORCHESTRATOR-PROMPT.md` (superseded by `CLAUDE-ORCHESTRATOR-PROMPT-V2.md`).
- `CODEX-CORRECTION-PROMPT-2026-04-24.md` → `archive/2026-04-24/CODEX-CORRECTION-PROMPT-2026-04-24.md` (guardrails absorbed into V2 preamble).

Lane files written: 0 — Slice B.
Scripts added/upgraded: 0 — Slices C / D / F / G.
Sweeps enabled: no — Slice F.
Ledger gate enforced: no — Slice G (`scripts/ledger-check.sh` lands then).

Risks and notes:
- Two canonical prompts (`CODE-QUALITY-AND-LANGUAGE-IDIOM-ORCHESTRATOR-PROMPT.md`, `CODEBASE-ARCHITECTURE-AND-EXTENSIBILITY-ORCHESTRATOR-PROMPT.md`) were present in the folder but absent from the Workspace Hygiene prompt's original "Current state to reconcile" list. They were absorbed into Active Prompts during reconciliation. Coordinator should confirm long-term status.
- Codex V2, Claude V2, and Provenance still contain body references to `CODEX-CORRECTION-PROMPT-2026-04-24.md`. Those links now resolve to a redirect stub; the archived file at `archive/2026-04-24/` remains authoritative if correction-specific detail is needed. Out of scope for Slice A per the hygiene orchestrator's ownership boundary (no body edits on other orchestrators' prompts).

Next slice: B — populate `docs/orchestration/lanes/L-<id>.md` for every lane in this STATUS.md.

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

## Orchestration specializations

Under the single coordinator, two specialist orchestrator roles are now
defined. Each specialist scopes lanes inside its ownership boundary and
reports back to the coordinator.

- **Runtime Vertical Slice Orchestrator** — owns the daemon ↔ surface data
  path. Files: `packages/surface-core/`, `packages/contracts/ipc/`,
  `apps/web/src/lib/ipc/`, `apps/web/src/shell/`, daemon IPC/projection
  code under `apps/daemon/src/`. Prompt at
  `doctrine/planning/orchestrator-prompts/RUNTIME-VERTICAL-SLICE-ORCHESTRATOR-PROMPT.md`.
  Active slices: **Slice A (IPC Client Comes Alive)** and
  **Slice B (Real Topbar Projection)**.
- **Product Surface Donor Orchestrator** — not yet staffed; will own
  visual/UX expansion and donor-UI translation. Do not bleed those edits
  into the Runtime Slice lanes.

## Lanes

Lane scope is disjoint. One owner per lane. Lane prompts live under `docs/orchestration/lanes/` once scoped (none written yet — next coordinator move).

Reality check against what is actually on disk (not what old plan docs claimed):

- **M1 round-trip passes today.** `node tooling/m1-round-trip.mjs` against the live daemon on 49555 returns `m1-round-trip: OK`. The wire protocol (hello → hello_ack → subscribe → command → event stream) is working against `debug.ping` and synthetic `dispatch.started/ended` events.
- **IPC client exists** — `packages/surface-core/src/ipc-client/index.ts` is a real 217-line WS client with pending-request map and projection subscriptions, not the stub my earlier diagnosis claimed. React hooks in `apps/web/src/lib/ipc/` are thin wrappers that correctly read from an `IpcContext` provider.
- **What's missing for Slice B:** a daemon-side projection actor emitting `topbar.projection`, and swapping the topbar's `mockTopbar` import for `useProjection("topbar.projection")`.

| Lane | Status | Owner | Files | Exit criteria |
|---|---|---|---|---|
| [`L-ipc-client-finish`](lanes/L-ipc-client-finish.md) (Slice A) | in-progress (wire alive, hooks need audit) | Runtime Slice Orch | `packages/surface-core/src/ipc-client/`, `apps/web/src/lib/ipc/`, `tooling/m1-round-trip.mjs` | All 7 minimum-behaviors in Runtime-Slice-Orchestrator prompt met: reconnect w/ backoff, clear offline state to hooks, UI never writes raw frames. `m1-round-trip.mjs` still green. |
| [`L-projections-topbar`](lanes/L-projections-topbar.md) (Slice B) | queued | Runtime Slice Orch | daemon-side `apps/daemon/src/ema_projections/topbar.gleam` (new), `apps/web/src/shell/topbar.tsx`, `apps/web/src/shell/*-selector.tsx` | Topbar renders "Founding-Fathers-EMA / Founding-Fathers-EMA / EMA 0.0.5" from `useProjection("topbar.projection")`, not `mockTopbar`. Event trail contains seed or command events backing the projection. |
| [`L-writers-org-space`](lanes/L-writers-org-space.md) | queued | (none — specialist TBD; Codex worker brief lists this as recommended first slice) | `apps/daemon/src/ema_orgs/`, `ema_spaces/`, catalog entries in `packages/contracts/events/` | `org.created` + `space.created` (default-same-name) accepted as real commands, persisted, projected. |
| [`L-see-agent-work-docs`](lanes/L-see-agent-work-docs.md) | queued | unassigned | `docs/cli/see-agent-work.md`, `docs/agents/see-agent-work-agent-usage.md` | Operational runbook: every CLI command has a worked example; an external session can follow the runbook cold. |
| [`L-honest-mocks`](lanes/L-honest-mocks.md) | closed 2026-04-24 | coordinator | `apps/web/src/app/mock-projections.ts` | Self-reported "Codex: active" agentWork entries removed; `MOCK_PROJECTION_LABEL` confirmed rendered on topbar, hq-page, agent-work-page, blueprint, git-ema panels, placeholder-page. |

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

## Operational docs

- [`docs/operations/donor-translation.md`](../operations/donor-translation.md) — donor verdict rules (`copy` / `adapt` / `inspire` / `reject`), `SOURCE:` header format, forbidden `copy` targets, translator checklist. Required reading for any Canon Writers / Runtime Slice / Product Surface Donor lane that pulls from `sources/snapshots/` or `atlas/ema-atlas/`.

## Decisions logged

- 2026-04-24: consolidate orchestrator role to a single coordinator; Codex demoted to worker (still active). Claude CLI session replaces the co-orchestrator setup. See `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md`.
- 2026-04-24: the 3 in-flight Claude CLI sessions finish in place; new rules apply only to sessions started after the handoff.

## Next coordinator actions

1. Scope `L-m1-roundtrip` lane prompt under `docs/orchestration/lanes/L-m1-roundtrip.md` (when a worker is assigned).
2. Audit the other two web shells (topbar, agent-work-page) for any other UI-as-truth patterns.
3. Confirm `tooling/m1-round-trip.mjs` shape matches the current daemon WS protocol.
