---
id: SPEC-SUBPROJECT-A-DAEMON-BACKBONE
type: spec-draft
layer: planning
title: "Sub-project A — Independent Daemon + t3code Backbone Extraction (spec draft)"
status: draft
created: 2026-04-13
decision_basis: "10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md"
related:
  - "[[10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE]]"
  - "[[08-IMPORTS/legacy-and-related-code/T3CODE-FORK-BORROW-ANALYSIS]]"
  - "[[11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13]]"
  - "[[13-CLI-GUI-PARITY/CLI-ROT-DIAGNOSTIC-2026-04-13]]"
  - "[[01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13]]"
tags: [spec, subproject-a, daemon, effect, backbone, v1.1]
---

# Sub-project A — Independent Daemon + t3code Backbone Extraction

> **Status:** DRAFT. This is the spec deliverable the meta-bootstrap decision
> (2026-04-13) said was blocking. It is not yet brainstorm-complete — the
> "Open questions" section at the bottom enumerates what must be resolved in
> a brainstorm pass with the user before this spec is considered frozen.
>
> **Relationship to decisions doc:** the decisions doc locked the *what*
> (event-sourced spine, Effect RPC, daemon out of Electron, loop reshape).
> This spec locks the *how*: phase boundaries, artifacts, migration paths,
> acceptance criteria, and file-level reshape pointers.

## 1. Purpose

Make `services/` an independent, Effect-native daemon built on t3code's
orchestration spine, with the existing `services/core/loop/` domain
reshaped onto the new architecture as the proving ground, and with
Electron + CLI + vApps all connecting as network clients over Effect RPC.

Success means:

1. `ema daemon start` launches a headless daemon with no Electron dependency.
2. The loop domain's 143 service tests still pass (adapted to the new API).
3. Electron host + TS CLI both connect as clients over `/ws` using the
   Effect RPC protocol, with non-optional bootstrap-token auth.
4. `services/http/server.ts` (Fastify) is retired in favor of t3code's
   Effect-layered RPC server.
5. `loop_*` tables are retired; intent/proposal/execution state lives in an
   event log with projection tables, following t3code's
   `orchestration_events` + `projection_*` pattern.

## 2. Non-goals (v1.1 scope fence)

These do NOT ship in A. Putting them here so the A spec stays finishable.

- Provider adapters (Codex/Claude CLI subprocess protocols) from t3code.
- `node-pty` terminal surface.
- Git workspace manipulation.
- vApp contract, manifest, loader, or BrowserWindow isolation — that is
  sub-project C, blocked on A.
- Other `services/core/*` domains (spaces, goals, calendar, chronicle,
  journal, review) — they stay on their current implementations during A
  and are migrated in follow-up passes after A ships. A must not break
  them.
- Multi-user auth, network daemon, remote client — local single-user only.
- OTLP export, metrics server.
- Auto-updater of the daemon binary.
- CLI command-surface expansion (separate track, post-A).
- Renderer vApp reconciliation (separate track, mostly pre-A hygiene).

## 3. Architecture target

### 3.1 Process topology (post-A)

```
   ┌─────────────────────┐        ┌──────────────────────┐
   │ Electron host (UI)  │        │ TS CLI (ema)         │
   │ apps/electron       │◀──────▶│ cli/                 │
   └─────────┬───────────┘  ws    └──────────┬───────────┘
             │                                │
             │            ┌──────────────────┐│
             └───────────▶│ EMA daemon        │◀─── other clients
                          │ services/         │     (vApps, agents)
                          │ Effect runtime    │
                          │ Effect RPC /ws    │
                          │ SQLite WAL        │
                          └─────────┬─────────┘
                                    │
                                    ▼
                          ~/.local/share/ema/ema.db
                          ~/.local/state/ema/daemon.json
                          ~/.local/state/ema/logs/
```

- Daemon is the primary long-running process.
- Electron + CLI are clients. Neither spawns the daemon as a subprocess.
- Electron may auto-spawn the daemon *if absent* via `ema daemon start`
  (same lifecycle mechanism the CLI uses), then connect. It does not
  subprocess it.
- All state writes go through the daemon.

### 3.2 Layer composition (port from t3code)

Mirror t3code's `makeServerLayer` pattern in `apps/server/src/server.ts:76-122`:

1. `PlatformServicesLive` — SQLite, filesystem, config, platform paths.
2. `HttpServerLive` — Effect HTTP host (wraps Node http), used only for
   WS upgrade and health.
3. `PersistenceLive` — event log, projection tables, migration runner.
4. `OrchestrationLive` — decider, projector, reactors.
5. `AuthLive` — bootstrap-token + session-credential service (port of
   t3code's `BootstrapCredentialService.ts`).
6. `RpcServerLive` — `makeWsRpcLayer` equivalent, method handlers mounted
   inline.
7. `ObservabilityLive` — structured logs, no OTLP in A.

Each layer is an Effect service with a typed interface. No layer reaches
into another layer's internals — all communication is through service
dependencies.

### 3.3 Persistence shape

New tables:

- `orchestration_events` — append-only, `(id, stream_id, seq, type, payload,
  occurred_at)`. Single source of truth.
- `projection_intents` — flat read model, rebuildable from events.
- `projection_proposals` — flat read model.
- `projection_executions` — flat read model.
- `projection_artifacts` — flat read model.
- `migrations` — schema version table (ported from t3code's migration runner).

Retired (after backfill):

- `loop_intents`, `loop_proposals`, `loop_executions`, `loop_artifacts`,
  `loop_events`.

The existing `services/core/loop/migrations.ts` stays as an archive until
A ships, then is deleted.

### 3.4 Contracts package

Create `shared/contracts/` (or promote a new workspace `@ema/contracts`
per t3code's package layout). Contains **only wire format**:

- `orchestration.ts` — event + command Effect Schemas.
- `rpc.ts` — RPC method signatures (`WsRpcGroup`-shaped).
- `auth.ts` — bootstrap-token + session-credential shapes.

Does NOT export server internals. Clean port boundary. The renderer and CLI
import `@ema/contracts` at build time; neither reaches into `services/`.

### 3.5 Transport

- Single WS endpoint `/ws`.
- Effect's unstable `RpcServer` + `WsRpcGroup`. Accept the
  unstable-API risk — it is the deliberate cost of "don't half-ass this."
- HTTP on `:4488` remains available for:
  - `/health` (liveness, no auth)
  - `/api/auth/bootstrap` (bootstrap token exchange, no auth)
  - everything else migrated to RPC methods or retired.
- The current Phoenix-wire ws reimplementation in
  `services/realtime/server.ts` is **deleted** at the end of A.
- The renderer's `phoenix` JS client dependency is **removed** at the end
  of A.

### 3.6 Daemon lifecycle

New CLI surface (part of A):

```
ema daemon start    # spawn daemon, write PID/socket, detach
ema daemon stop     # read PID, SIGTERM, clean up
ema daemon status   # read PID, report running/port/uptime
ema daemon logs     # tail ~/.local/state/ema/logs/
ema daemon restart  # stop + start
```

State files:

- `~/.local/state/ema/daemon.json` — `{ pid, port, token_path, started_at }`
- `~/.local/state/ema/daemon.pid` — unix PID file
- `~/.local/state/ema/logs/daemon.log` — rotating log (size-based, 5×10MB)
- `~/.local/state/ema/bootstrap.token` — short-lived bootstrap token the
  CLI/Electron uses once to obtain a session credential

OS service integration is **deferred to post-A**. A ships with user-level
`ema daemon start` only. A stretch goal is shipping a `systemd --user` unit
template in `tools/service-units/`, but it is not on the critical path.

### 3.7 Auth model

Port from t3code's `BootstrapCredentialService.ts`:

1. Daemon at boot writes a single-use bootstrap token to
   `~/.local/state/ema/bootstrap.token` (mode 0600).
2. First client (Electron or CLI) reads token, calls
   `POST /api/auth/bootstrap` to exchange for a session credential.
3. Session credential is stored by the client (Electron:
   `safeStorage`; CLI: keyring-backed or file at `~/.local/state/ema/
   session.token` mode 0600).
4. All subsequent WS connections upgrade with
   `Authorization: Bearer <session>`.
5. `/health` bypasses auth. Everything else requires a valid session.

The "optional `EMA_API_TOKEN`" model in
`services/http/middleware/auth.ts:3-38` is retired. Auth is non-optional
once A lands.

## 4. Phase plan

Each phase is one work unit with its own acceptance criteria. Phases are
ordered by dependency. Phase N does not start until phase N-1 is accepted.

### A1 — Effect runtime + contracts package

**Goal:** add Effect as a runtime dep; extract wire contracts into
`@ema/contracts`; no behavior change yet.

**Work:**
1. `pnpm add effect @effect/schema @effect/platform @effect/rpc` at root.
2. New package `shared/contracts/` (or `packages/contracts/`) wired into
   pnpm workspaces, referenced by `services/`, `apps/renderer/`, and `cli/`.
3. Port the intent, proposal, execution, and artifact schemas from
   `shared/schemas/*.ts` into Effect Schema shape under
   `contracts/src/orchestration.ts`.
4. Define `contracts/src/rpc.ts` with placeholder method signatures for:
   `intents.create`, `intents.list`, `proposals.*`, `executions.*`,
   `auth.bootstrap`, `auth.session`.
5. Export. Do NOT consume yet. Existing Fastify routes keep working.

**Acceptance:**
- Typecheck passes with new package.
- Existing 143 loop tests still pass.
- `@ema/contracts` is importable from renderer and CLI.

### A2 — Persistence foundation

**Goal:** event log + projections exist in SQLite; migration runner ported;
no domain uses them yet.

**Work:**
1. Port t3code's migration runner (`apps/server/src/persistence/
   Migrations/*`) into `services/persistence/migrations/` as a new runner.
2. Add migrations:
   - `0001_orchestration_events.sql` — the append-only log.
   - `0002_projection_intents.sql`
   - `0003_projection_proposals.sql`
   - `0004_projection_executions.sql`
   - `0005_projection_artifacts.sql`
3. Run alongside the existing loop migrations at startup; both sets coexist
   during A2–A3.
4. Smoke test: write/read events directly via a test harness; rebuild
   projections from events.

**Acceptance:**
- New tables exist in a fresh database.
- Loop tests still pass.
- Projection rebuild from events works in a test.

### A3 — Daemon lifecycle, CLI entry, auth

**Goal:** daemon can be started and stopped independently of Electron, with
real auth, but old Fastify routes still serve the renderer. Parallel
operation.

**Work:**
1. New entry `services/bin/daemon.ts` — parses args, loads config, boots
   layers, supervises the process, handles signals.
2. Port t3code's config resolution (`apps/server/src/config.ts:69-96`) for
   path derivation: `~/.local/share/ema/`, `~/.local/state/ema/`, etc.
3. Write `~/.local/state/ema/daemon.json` + pid file on start, clean up
   on stop.
4. Implement `AuthLive` layer per §3.7.
5. Add `ema daemon start|stop|status|logs|restart` commands to `cli/`.
6. Modify `apps/electron/runtime.ts`: instead of `spawn(node, services.js)`,
   check `daemon.json` → if running, connect; if not, shell out to
   `ema daemon start` and wait for health; do not own the process tree.
7. The Fastify routes in `services/http/server.ts` continue serving the
   renderer over the old Phoenix-wire ws for now. Coexistence.

**Acceptance:**
- `ema daemon start` brings up the daemon, `status` reports it running,
  `stop` shuts it down cleanly, `logs` tails the log file.
- Electron, started with no daemon running, starts the daemon and connects
  successfully.
- Electron, started with a daemon already running, connects to it without
  spawning a new one.
- Electron, closed, leaves the daemon running.
- CLI `ema health` hits `/health` successfully without starting Electron.
- Auth tokens work end-to-end for both Electron and CLI.

### A4 — Loop reshape onto decider/projector/reactor

**Goal:** loop domain runs on the new event-sourced spine. Old
`loop_*` tables still present but dual-written during transition;
projections become authoritative at end of phase.

**Work:**
1. Implement `services/orchestration/decider.ts` (pure, ported pattern from
   t3code's `decider.ts`).
2. Implement `services/orchestration/projector.ts` — subscribes to the
   event log, updates projection tables.
3. Port command invariants from `commandInvariants.ts`.
4. Rewrite loop service methods to dispatch commands instead of writing
   loop tables directly.
5. Dual-write during transition: a shim writes to both `loop_*` and the
   event log, so tests can compare.
6. Run the existing loop test suite against the new implementation (tests
   modified to assert against projection tables, not loop tables).
7. Cut over: projections become canonical. Loop tables become read-only
   backup, scheduled for deletion in A6.

**Acceptance:**
- 143 loop tests pass against the new implementation.
- A test that replays the event log into a fresh projection produces
  identical read-model state.
- Event log is append-only (tests verify no UPDATE/DELETE against
  `orchestration_events`).

### A5 — Client cutover to Effect RPC

**Goal:** renderer and CLI both use Effect RPC against `/ws`. Phoenix glue
removed.

**Work:**
1. Implement `makeWsRpcLayer` equivalent in
   `services/realtime/rpc-server.ts` — mounts handlers defined inline.
2. Wire handlers for the full loop RPC method set (intents, proposals,
   executions, auth).
3. Implement a renderer-side Effect RPC client in
   `apps/renderer/src/lib/rpc.ts`.
4. Migrate renderer stores from `api.ts` + `ws.ts` to `rpc.ts`
   method-by-method. Tasks, brain-dump, executions, intents first.
5. Implement a CLI-side RPC client. Migrate CLI commands.
6. Delete `apps/renderer/src/lib/ws.ts` and the `phoenix` dep.
7. Delete `services/realtime/server.ts` Phoenix-wire reimplementation.
8. Retire Fastify routes that have RPC equivalents; keep `/health` and
   `/api/auth/bootstrap` only.

**Acceptance:**
- Renderer connects over Effect RPC and all KEEP-AND-WIRE apps from the
  triage ledger function as before.
- CLI commands hit RPC methods, not Fastify HTTP.
- `phoenix` is no longer in `apps/renderer/package.json`.
- `ws.ts` and `services/realtime/server.ts` no longer exist.
- Loop tests still pass.

### A6 — Cleanup + migration backfill

**Goal:** old tables removed, old routes removed, documentation updated.

**Work:**
1. Write migration `0006_drop_loop_tables.sql` that first validates the
   event log is complete (checksum of event-derived state vs loop table
   state) and then drops the loop tables. Guarded behind a config flag
   for the first release.
2. Delete `services/core/loop/migrations.ts` contents (keep file as a
   breadcrumb pointing to the new migrations).
3. Retire `services/http/server.ts` Fastify host entirely — replace with
   the thin Effect HTTP layer.
4. Remove `EMA_API_TOKEN` optional path from
   `services/http/middleware/auth.ts`; middleware is replaced by
   AuthLive.
5. Update `docs/OPERATING-REALITY.md`, `docs/GROUND-TRUTH.md`,
   `docs/backend/README.md` to describe the daemon architecture.
6. Write a user-facing "EMA daemon" section for the main README.
7. Tag the release.

**Acceptance:**
- Fresh install produces no `loop_*` tables.
- Existing-user upgrade path: daemon starts, detects old tables, runs the
  event backfill automatically, validates, cuts over.
- `rg "loop_" services/` returns zero hits.
- `rg "phoenix" apps/` returns zero hits.
- `rg "EMA_API_TOKEN" services/` returns zero hits.
- Docs explain the new architecture without mentioning the old one.

## 5. Data migration

Existing users will have populated `loop_*` tables. A6 ships a one-shot
backfill:

1. On daemon start, detect presence of `loop_intents` and empty
   `orchestration_events`.
2. Replay the loop tables in time-order into the event log as commands
   → events. Order: intents → proposals → executions → artifacts.
3. After replay, rebuild projections from events.
4. Validate: for each loop table row, confirm matching projection row
   with equivalent fields.
5. Write a migration marker row in `migrations` table.
6. After a configurable grace period (one release), the next upgrade
   drops the loop tables.

The backfill is not reversible. Users get a dry-run mode
(`ema daemon migrate --dry-run`) that reports what would happen.

## 6. Acceptance criteria (whole sub-project)

A is complete when **all** of the following hold:

1. Every phase acceptance criterion passes.
2. `ema daemon start|stop|status|logs|restart` work end to end.
3. Electron host connects as a client over Effect RPC. Closing Electron
   does not stop the daemon. Starting Electron without a daemon auto-starts
   one. Starting Electron with a daemon connects to the existing one.
4. `apps/renderer` no longer depends on `phoenix`.
5. `services/http/server.ts` Fastify host is deleted or reduced to
   bootstrap + health only.
6. `services/realtime/server.ts` Phoenix-wire reimplementation is deleted.
7. Loop domain's 143 service tests pass (adapted as needed).
8. `loop_*` tables are removed on fresh installs. Existing installs have
   a validated backfill path.
9. Auth is non-optional. No requests hit non-health endpoints without a
   valid session token.
10. `docs/OPERATING-REALITY.md` and `docs/GROUND-TRUTH.md` describe the
    post-A architecture accurately.

## 7. Risks

### R1 — Effect RPC API churn

Effect's `@effect/rpc` is marked unstable. Upgrades mid-phase will hurt.

**Mitigation:** pin exact versions in A1; upgrade only between phase
boundaries with explicit testing; document the pinned versions in the
spec and in the release notes.

### R2 — Loop reshape breaks tests in subtle ways

143 tests is a lot of surface. Cutover will expose implicit coupling.

**Mitigation:** dual-write phase (A4 step 5) lets tests compare old vs
new state. Only cut over after dual-write has run clean.

### R3 — Daemon lifecycle weirdness on Linux

`systemd --user`, PID file races, stale sockets.

**Mitigation:** A ships with simple `ema daemon start` only. No OS
service integration until post-A. Use a PID file with `flock` to prevent
double-starts.

### R4 — Electron spawn flow regression

Today Electron owns the daemon subprocess. Users may not notice that
Electron is doing this. A3 flips the ownership; any bug in the auto-spawn
path produces "I opened the app and it shows a blank screen."

**Mitigation:** Electron's client bootstrap has explicit states — `connecting`,
`starting-daemon`, `waiting-for-health`, `ready`, `error`. The renderer shows
each state. Never go to a blank screen.

### R5 — Data loss during migration

Event-log backfill from `loop_*` must be faithful.

**Mitigation:** validation step in A6 compares row counts and key field
checksums. Dry-run mode. Keep loop tables for one release after cutover
(drop in the release after).

### R6 — Scope creep into sub-project C

Tempting to "just add the vApp loader while we're in here." Don't.

**Mitigation:** non-goals section §2 is the fence. Any temptation to
expand scope is logged as an issue, not implemented.

## 8. Open questions (must resolve in brainstorm before freeze)

1. **Contracts package location.** `shared/contracts/` (lightweight,
   keeps workspace count low) or new `packages/contracts/` (mirrors
   t3code layout, clean npm publish later)?
2. **Event log serialization.** JSON in SQLite column (simple, queryable
   by type), or binary MsgPack (smaller, faster)? t3code does JSON.
   Defaulting to JSON unless user prefers otherwise.
3. **Single daemon per user or per workspace?** Meta-bootstrap flagged
   this as open. Default proposal: single daemon per user, workspaces
   are first-class objects inside the daemon. Needs user confirmation.
4. **Electron fallback when daemon is missing.** Auto-start daemon, or
   error with instructions? Default: auto-start, but show a visible
   "starting daemon" state.
5. **Bootstrap token rotation.** Rotate on every daemon start, or
   persist across restarts? Default: rotate on every start; client
   re-bootstraps on connection failure.
6. **Does `cli/` absorb daemon lifecycle commands, or ship as a
   separate `ema-daemon` binary?** Default: absorb into `cli/` under
   `ema daemon <verb>`. Simpler install story.
7. **Keep `cli/` on commander, or port to Effect CLI?** Default: keep
   commander. Effect CLI is not on the critical path and would expand
   A's scope. Revisit post-A.
8. **Fate of workers/.** `apps/electron/runtime.ts` also spawns
   `workers/`. In the new model, do workers become a daemon-internal
   concern (Effect fibers inside the daemon process) or a separately-
   spawned sibling process? Default: daemon-internal. Workers become
   Effect services inside `OrchestrationLive`.
9. **Release cadence.** Is A a single release, or does each phase
   release independently? Default: phases A1–A5 are internal to a single
   release; A6 is a follow-up release after the backfill has baked for
   a week.
10. **Does `services/core/*` (non-loop) survive untouched through A?**
    Default: yes. Other domains keep their current Fastify-over-HTTP and
    Phoenix-over-ws surfaces until A ships, then get migrated one by one
    in post-A passes. A does not break them, but does not port them.

## 9. Implementation pointers

### t3code files to study before coding

- `apps/server/src/bin.ts`
- `apps/server/src/cli.ts`
- `apps/server/src/config.ts:69-96`
- `apps/server/src/server.ts:76-122` (makeServerLayer)
- `apps/server/src/orchestration/decider.ts`
- `apps/server/src/orchestration/projector.ts`
- `apps/server/src/orchestration/Layers/ProviderCommandReactor.ts` (pattern)
- `apps/server/src/orchestration/commandInvariants.ts`
- `apps/server/src/persistence/Migrations/*`
- `apps/server/src/ws.ts` (makeWsRpcLayer)
- `apps/server/src/auth/Layers/BootstrapCredentialService.ts`
- `packages/contracts/src/orchestration.ts`
- `packages/contracts/src/rpc.ts`

### EMA files to reshape or retire

- `services/startup.ts` — retire; replaced by `services/bin/daemon.ts` +
  layer composition.
- `services/http/server.ts` — reduce to bootstrap + health.
- `services/realtime/server.ts` — delete in A5.
- `services/core/loop/migrations.ts` — freeze in A2, delete in A6.
- `services/core/loop/*.ts` — reshape in A4.
- `services/persistence/db.ts` — add event log + projection tables.
- `services/http/middleware/auth.ts` — delete in A6.
- `apps/electron/runtime.ts` — flip from subprocess owner to client
  bootstrap in A3.
- `apps/electron/main.ts` — remove direct daemon-process ownership in A3.
- `apps/renderer/src/lib/api.ts` — hygiene fix lives here (session 1
  GUI cleanup), but the cutover to RPC happens in A5.
- `apps/renderer/src/lib/ws.ts` — delete in A5.
- `apps/renderer/package.json` — drop `phoenix` dep in A5.
- `cli/src/commands/backend/*` — refactor to use RPC client in A5;
  absorb daemon lifecycle commands in A3.
- `bin/ema` (Python) — delete (session 1 CLI hygiene, not A).

### New files

- `shared/contracts/` (or `packages/contracts/`) — new workspace.
- `services/bin/daemon.ts`
- `services/orchestration/{decider,projector,reactors,invariants}.ts`
- `services/persistence/migrations/00{01..06}_*.sql`
- `services/auth/layers/bootstrap-credential.ts`
- `services/realtime/rpc-server.ts` (replaces phoenix-wire reimpl)
- `apps/renderer/src/lib/rpc.ts`
- `cli/src/commands/daemon/{start,stop,status,logs,restart}.ts`
- `tools/service-units/systemd-user-ema.service` (optional stretch)

## 10. Next action

1. User reviews this draft spec and the three other new deliverables.
2. Brainstorm pass to resolve §8 open questions. That pass turns this
   draft into a frozen spec.
3. Writing-plans pass turns the frozen spec into a phase-by-phase
   implementation plan.
4. Implementation starts with A1 (contracts + Effect runtime addition).
   A1 does not touch user-visible behavior, so it can land on main
   immediately.
5. Subsequent phases land behind a feature flag where possible; A4 and
   A5 are the risky cutovers and should be landed as their own PRs.

## 11. Pointers out

- `10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md` —
  authoritative decisions this spec implements.
- `08-IMPORTS/legacy-and-related-code/T3CODE-FORK-BORROW-ANALYSIS.md` —
  borrow analysis for the port.
- `11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13.md` — the "session 1 hygiene"
  work that runs in parallel and does not depend on A.
- `13-CLI-GUI-PARITY/CLI-ROT-DIAGNOSTIC-2026-04-13.md` — same for CLI.
- `01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13.md` — where A sits in the
  overall build order.
