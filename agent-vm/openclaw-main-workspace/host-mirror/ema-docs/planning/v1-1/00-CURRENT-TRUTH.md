# EMA v1.1 — Current Truth Reconciliation

Date: 2026-04-13
Plane: reality + gap
Scope: what is real vs migration-only vs missing vs contradictory on the TS/Electron stack

## Runtime shape (real)

- Monorepo: pnpm + Turbo + TypeScript strict + Biome
- Daemon: `services/` Fastify stack, `localhost:4488`, v0.1.0-electron
- Workers: `workers/src/startup.ts` — watchers + job runtime
- Shell: `apps/electron/` main + `apps/renderer/` React
- CLI: `cli/` Commander v4 (`@ema/cli` v0.2.0, 30+ commands, canon-first file writes) — shipped in EXE-004
- CLI shim (dead): `bin/ema` Python v2.0.0 — targets Elixir-era routes, must be deleted or redirected
- MCP: per-service under `services/core/{blueprint,intents,executions,spaces,pipes,ingestion,user-state}/mcp-tools.ts` — all tools hit HTTP
- DB: `~/.local/share/ema/ema.db` SQLite (better-sqlite3)
- Durable wiki: `~/.local/share/ema/vault/wiki/`

## Registered HTTP routes (verified in `services/core/backend/manifest.ts`)

`/api/backend` `/api/agents` `/api/blueprint` `/api/brain-dump` `/api/chronicle` `/api/dashboard` `/api/calendar` `/api/human-ops` `/api/feeds` `/api/executions` `/api/intents` `/api/ingestion` `/api/orgs` `/api/join` `/api/goals` `/api/memory` `/api/pipes` `/api/projects` `/api/proposals` `/api/review` `/api/runtime-fabric` `/api/settings` `/api/spaces` `/api/tasks` `/api/voice` `/phone/voice` `/api/user-state` `/api/visibility` `/api/workspace`

## Registered routes that canon/brief requires and are missing

- `/api/orchestrator/*` (sessions, context, spawn, resume, kill) — MCP session tools 404
- `/api/workstreams`
- `/api/traces` (distinct from chronicle entries)
- `/api/machines`
- `/api/peers`
- `/api/notifications`
- `/api/research`
- `/api/planning` (planning-node surface for PLAN-* docs)

## Renderer surface inventory (23 v1.1 surfaces)

Present and wired (11): `tasks`, `brain-dump`, `notes`, `hq` (862 LOC), `blueprint-planner` (462 LOC), `intents/IntentSchematicApp` (505 LOC), `feeds` (1327 LOC), `agents` (154 LOC), `terminal` (1301 LOC), `settings`, `mcp`.

Present but stubs (4): `wiki`, `journal`, `focus`, `responsibilities` — all 6-LOC `ConnectedDraftApp` wrappers.

Absent from renderer (15): **Launchpad**, **Agent Live View**, **Chronicle**, **Review**, **Search/Recall/Trace**, **Machine Manager**, **Notifications**, **Graph Visualizer**, **Research Viewer**, **Calendar/Schedule**, **Time Blocking**, **Analytics**, **Network/Peers**, **Permissions**, **Spaces**.

App catalog: `apps/renderer/src/config/app-catalog.ts` — 34 entries across 7 categories; broader than v1.1 target (30+ component dirs exist beyond catalog).

## Entity model — present (verified grep)

`intent` (dual: `intent.ts` + `intents.ts`), `proposal` (dual), `execution` (dual), `artifact`, `review`/`extraction`/`promotion-receipt`, `event`, `chronicle.{source,session,entry,artifact}`, `calendar-entry`, `goal`, `task`, `user-state`, `runtime-fabric.{tool,session,event}`.

## Entity model — missing (must create)

- `workstream` (durable thread identity across chat/web/CLI/terminal)
- `trace` (first-class; distinct from chronicle entry)
- `step` / `observation` (currently only kinds on chronicle entries)
- `approval` (currently only a proposal status)
- `machine` (chronicle source has `machine_id` but no entity)
- `peer` (P2P identity; GAC-008 noted future `identity_pubkey`)
- `notification`
- `service` (EMA service descriptor as operator-visible entity)
- `research-item`
- `planning-node` / `blueprint-item` (PLAN-*, aspirations, candidate intents)
- `memory` (service dir exists, no shared schema)

## Contradictions requiring resolution

1. **`intent.ts` vs `intents.ts`** and **`proposal.ts` vs `proposals.ts`** and **`execution.ts` vs `executions.ts`** — dual schemas coexist. Which is canonical? Decision: the **plural** files (`intents.ts`, `proposals.ts`, `executions.ts`) match the active services (`services/core/intents/`, `services/core/proposal/`, `services/core/executions/`). The singular `*.ts` files (`intent.ts` etc.) are `CoreIntent`/`CoreProposal`/`CoreExecution` read models. Both are load-bearing. Treat as: plural = I/O schema; singular = core domain model. Resolve by renaming singular to `*-core.ts` in a future hygiene pass (not this wave).
2. **`services/core/proposal/` (singular)** mounts `/api/proposals` — directory name contradicts mount path. Cosmetic; leave until the 5-stage pipeline port adds `services/core/proposals/pipeline/`.
3. **CLI write path vs daemon write path** — EXE-004 locked "CLI writes canon markdown directly, daemon writes DB." Earlier initiative brief proposed "MCP = shim over CLI"; that is inconsistent with shipped code. Canon direction wins: CLI + daemon each own their plane, locking happens inside `cli/src/lib/genesis-store.ts`.
4. **Three `EXE-003` directories** under `ema-genesis/executions/` — ID collision bug. Needs rename pass (canon hygiene).
5. **`wiki/User/Stack-Decisions.md`** still calls the daemon Elixir/Phoenix 1.8 and CLI an Elixir escript. Stale. Reality is TS/Electron.
6. **`bin/ema` Python shim** targets `/api/vault/search` which is not in `manifest.ts`. Route 404, command dies. Delete or redirect to `cli/dist/index.js`.
7. **`/api/orchestrator/*` 404** — `services/core/loop/orchestrator.ts` exists as a programmatic `LoopOrchestrator` class with no HTTP router. MCP `ema_list_sessions` and `ema_session_context` break against it.
8. **OpenClaw workspace** — brief references planning docs under `~/.openclaw/agents/main/workspace/` that do not exist on this host. Treated as aspirational; proceeding from repo canon + the brief's decisions.

## Migration-only surfaces (stop using as reference)

- `IGNORE_OLD_TAURI_BUILD/` — read-only mine, never a runtime target
- Python `bin/ema` — schedule for deletion
- Dual singular schema files — quarantined, rename later
- `wiki/User/Stack-Decisions.md` — rewrite in hygiene pass

## What's real enough to extend, not rebuild

- `services/core/intents/` and `services/core/proposal/` and `services/core/executions/` — the intent→proposal→execution spine exists in rudimentary form and EXE-004 landed the CLI layer over it
- `services/core/chronicle/` + `services/core/review/` — chronicle landing + promotion review is already a shipped backbone; Track B extends it, doesn't replace it
- `services/core/runtime-fabric/` — tmux control-plane already exists, Terminal vApp connects to it; Track D extends rather than bootstraps
- `apps/renderer/src/components/hq/HQApp.tsx` (862 LOC) — real wiring; Track A extends layout and persistence, doesn't replace
- `cli/` — 30+ commands, canon-aware — Track B/E extend verbs, don't rebuild

## Non-negotiable rules for all v1.1 work

1. No canon writes to `ema-genesis/canon/specs/` or `/decisions/` without a GAC card + proposal
2. Plane labels mandatory on planning docs: `Canon:` / `Plan:` / `Reality:` / `Gap:`
3. No touches to `IGNORE_OLD_TAURI_BUILD/` or `~/Projects/t3code-fork`
4. Every major surface must attach to shared entity truth — no decorative vApps
5. CLI and GUI must converge on the same entities and workstream identity
6. No commits without explicit human request
