# META-BOOTSTRAP — t3code as EMA's backbone, daemon independent, Effect-native

**Status:** Decision locked. Spec pending.
**Date:** 2026-04-13
**Scope:** Architectural direction for the next EMA buildout pass. This is the meta-bootstrap that reframes EMA as a t3code-descended system with an independent daemon.
**Downstream:** Blocks all other v1.1 workstream decisions that touch runtime, persistence, orchestration, or vApp contracts.

## TL;DR

1. **t3code's orchestration spine becomes EMA's backbone.** Contracts + decider + projector + reactor + event-sourced persistence + Effect layer discipline get lifted into `services/` as the new foundation. Not a copy-paste — a merge. "Do not half-ass this." t3code is the better codebase; extract it aggressively.
2. **EMA's daemon runs independently of Electron.** Today `services/` is spawned *by* `apps/electron/runtime.ts` as a child process. Flip it: daemon is the primary long-running process (systemd/launchd/Windows service or `ema daemon start` CLI), Electron + vApps + CLI all connect as network clients, auth is non-optional, PID/socket discovery replaces subprocess handoff.
3. **`services/core/loop/` gets merged onto the new spine.** Existing intent→proposal→execution semantics (5 tables, 143 passing tests) are re-expressed as commands + events on t3code's decider/reactor pattern. The loop's tests become the regression suite for the merge. Other EMA domains (spaces, goals, calendar, journal, chronicle) follow in later passes with no hard deadline.
4. **Transport: adopt Effect.** EMA takes on Effect as a core runtime dependency and keeps t3code's unstable RPC over WebSocket verbatim. No Fastify rewrite. Rationale: the Effect layer/service/error discipline is *why* t3code's codebase is the better one; porting the architecture off Effect would amount to half-assing it.
5. **vApp contract is still aspirational.** `ema-genesis/vapps/CATALOG.md` promises framework-agnostic web components as isolated BrowserWindows with full API access, but no manifest format, lifecycle, loader, or registry exists. Repackaging t3code's chat UI as the reference vApp is part of sub-project C, not a shortcut we can skip.

## Ground truth at time of decision

### EMA (`~/Projects/ema`)
- **Monorepo shape:** pnpm workspace. `apps/` (Electron host + React renderer), `services/` (Fastify+ws on `127.0.0.1:4488`, 7-phase boot), `workers/` (vault/session/intent observers), `cli/` (Oclif), `shared/` (contracts, schemas, tokens), `platform/`, `tools/`, `ema-genesis/` (canon), `IGNORE_OLD_TAURI_BUILD/` (archived Elixir/Phoenix/Tauri).
- **Daemon status:** already exists as `services/`, replaces the old Elixir daemon. `services/startup.ts:20-55` boots in 7 phases; `services/http/server.ts:10` hardcodes `:4488`. Spawned today as an Electron subprocess via `apps/electron/runtime.ts:73-80`.
- **Existing orchestration:** `services/core/loop/` — recent (post-April-2026) bootstrap loop doing `intent.create → proposal.generate/approve/reject/revise → execution.start/recordArtifact/complete/fail`. SQLite tables: `loop_intents`, `loop_proposals`, `loop_executions`, `loop_artifacts`, `loop_events`. Migrations in `services/core/loop/migrations.ts:10-150`. 143 passing service tests.
- **Persistence:** SQLite WAL at `~/.local/share/ema/ema.db`. Domain-owned DDL across intents/executions/blueprint/spaces/user-state/pipes/calendar/loop. Startup repair logic in place.
- **Auth:** `services/http/middleware/auth.ts:3-38` — optional bearer token via `EMA_API_TOKEN`; open on localhost when unset. Health and WS upgrades bypass auth.
- **IPC:** minimal Electron preload (`apps/electron/preload.ts:3-31`) — `ema:open-app`, `ema:close-app`, `ema:minimize/maximize/close/navigate`. Most state flows over HTTP/ws, not typed IPC.
- **vApp reality vs canon:** 35 canonical vApps in `ema-genesis/vapps/CATALOG.md`. Renderer has 28 hardcoded routes in `apps/renderer/src/App.tsx:50-123` that don't align with canon. Open intent `INT-FRONTEND-VAPP-RECONCILIATION`. Only `apps/renderer/src/vapps/spaces/` exists as a stub. No vApp contract, no manifest, no loader, no isolated BrowserWindow loading yet.

### t3code (`~/Projects/t3code-fork`)
- **Spine:** `apps/server/src/orchestration/` — `decider.ts` (pure command validator), `projector.ts` (event-to-read-model), reactors in `Layers/` (e.g. `ProviderCommandReactor.ts`). Fully event-sourced: commands are validated by the decider, emit events, events are persisted to `orchestration_events`, projected to `projection_*` tables, and reactors observe events to drive side effects.
- **Entry:** `apps/server/src/bin.ts` → `cli.ts` → `config.ts` → `server.ts` (`makeServerLayer`). Layer composition: `PlatformServicesLive` → `PtyAdapterLive` → `HttpServerLive` → `RuntimeDependenciesLive` → `RuntimeServicesLive` → `makeRoutesLayer` → `ObservabilityLive`.
- **Persistence:** SQLite at `~/.t3/userdata/state.sqlite` (or `~/.t3/dev/state.sqlite` when `devUrl` is set). 23 migrations. Paths derived in `apps/server/src/config.ts:69-96`.
- **Contracts:** `packages/contracts/src` — wire format only, Effect Schema-based. `orchestration.ts` (events/commands), `rpc.ts` (WsRpcGroup method signatures), `providerRuntime.ts`, `auth.ts`, `terminal.ts`, `git.ts`. Does NOT export server-internal types — clean port boundary.
- **Transport:** Effect's unstable `RpcServer` + `WsRpcGroup` over `/ws`. Handler implementations defined inline in `makeWsRpcLayer()` (`apps/server/src/ws.ts:128-542`). Auth via session token in WS upgrade headers.
- **Desktop shell:** `apps/desktop/src/main.ts` owns window management, auto-updater, deep links (`t3://`), safeStorage secrets, theme sync, and spawns the server subprocess with a one-time bootstrap token written over FD 3. Most of this is genuine desktop chrome, not server-adjacent.
- **Extraction hazards:** `node-pty` native module (terminal), `git` CLI subprocess (workspace), Bun-vs-Node runtime split in `server.ts:76-122`, provider adapters tied to Codex/Claude CLI subprocess protocols (stdio NDJSON).

## Decision record

### D1 — t3code's spine is the backbone
- **Chosen:** merge `services/core/loop/` semantics onto t3code's decider/projector/reactor architecture. Don't preserve the current `loop_*` tables; re-express the domain as commands + events on the new event log. Keep the loop's test suite as regression cover.
- **Rejected:** (a) wholesale replacement that throws away `loop/`'s momentum, (b) two-domain coexistence (t3code spine next to untouched `loop/`). Coexistence was tempting for speed but contradicts "do not half-ass it."
- **Implication:** every existing `services/core/*` domain (intents, proposals, executions, spaces, goals, calendar, chronicle) will eventually need to migrate to the event-sourced spine. Loop is the first; others follow as independent passes with no hard deadline.

### D2 — daemon runs independently of Electron
- **Chosen:** daemon is the primary long-running process. Independent lifecycle: systemd unit / launchd plist / Windows service, plus a user-level `ema daemon start|stop|status|logs` CLI. Electron host auto-starts-if-missing or errors-if-missing. vApps + CLI + external tools all connect as network clients.
- **Rejected:** keeping the current model where Electron owns the daemon subprocess. That model breaks "daemon survives UI closure," "multiple simultaneous clients," and "updates without restarting the UI."
- **Implications to work through in spec:**
  - **Auth is no longer optional.** Today `EMA_API_TOKEN` is optional because everything is local to one parent process. With independent daemon, auth becomes the boundary between the daemon and every client; adopt t3code's bootstrap-token + session-credential pattern.
  - **Discovery.** PID file + socket file + published port in `~/.local/state/ema/daemon.json` (or similar). Clients probe + spawn if missing.
  - **Data ownership.** Daemon owns `~/.local/share/ema/ema.db`. Clients never touch it directly. Database path may move.
  - **Logs.** Rotate to `~/.local/state/ema/logs/` independent of Electron stdout.
  - **Update lifecycle.** Daemon can be restarted without closing vApps; vApps must handle WS reconnect (t3code already has resilient WS + connection indicator per recent commits).
  - **Multi-user / multi-instance.** Decide: one daemon per machine, per user, per project workspace? Out of scope for the decision record; must be answered in the spec.

### D3 — transport adopts Effect
- **Chosen:** bring Effect in as EMA's core runtime dependency. Port t3code's RPC layer verbatim; keep decider/projector/reactor on Effect layers; keep Effect's RPC codec for the wire format.
- **Rejected:** (a) reimplementing t3code's contracts on EMA's existing Fastify+`ws`, (b) hybrid (Effect core, Fastify edge). Both half-ass the architecture.
- **Implication:** `services/` gains a heavy dependency. `services/http/server.ts` is retired in favor of t3code's `ws.ts`-style RPC server. Existing Fastify routes are reimplemented as Effect HTTP routes or re-expressed as RPC methods. Migration of the existing route surface is part of the sub-project A spec.

### D4 — vApp contract is a spec deliverable, not an inherited artifact
- **Chosen:** define the vApp contract (manifest, lifecycle, capability/permission declarations, daemon API shape, design token injection) as part of sub-project C. The chat UI ports as the reference implementation of the contract.
- **Rejected:** treating `ema-genesis/vapps/CATALOG.md` as a contract. It's a catalog of 35 aspirational apps, not a technical interface.
- **Out of scope for this decision:** the other 34 vApps in the catalog. C delivers the contract + one reference implementation. The rest migrate in follow-up passes.

## Sub-project decomposition

### Sub-project A — Backbone extraction + independent daemon
**Goal:** `services/` becomes an independent, Effect-native daemon built on t3code's orchestration spine, with `loop/` reshaped onto the new architecture.

**Ships when:**
- `ema daemon start` launches a headless daemon process with no Electron dependency.
- `loop_*` tables are retired; intent/proposal/execution semantics run on event-sourced commands + events.
- Loop's 143 existing service tests still pass (adapted to the new API where necessary).
- Electron host + CLI connect as clients over Effect RPC/ws. Auth is non-optional.
- Existing EMA HTTP endpoints (health, intents, executions, proposals, loop) either have RPC equivalents or are explicitly retired.

**Likely internal phases (to be formalized in the spec):**
- A1 — Effect runtime + contracts package (port `@t3tools/contracts`-shaped contracts as `@ema/contracts`; lift shared schemas for intent/proposal/execution into the new contracts).
- A2 — Persistence foundation (event log + projections, migration framework, data backfill from `loop_*` and any other tables that need to survive).
- A3 — Daemon lifecycle, CLI entry, auth, PID/socket discovery, log paths, systemd/launchd unit files.
- A4 — Loop reshape onto decider/projector/reactor. Retire Fastify routes for loop.
- A5 — Client cutover: Electron renderer + CLI reconnect over Effect RPC.

**Out of scope:** provider adapters from t3code (those are tied to Codex/Claude CLI subprocess behavior and are chat-specific, not backbone); terminal/pty; git workspace; checkpointing. Those belong to sub-project C or later passes.

### Sub-project B — Loop reshape validation (embedded in A, NOT a separate project)
*Previously scoped as independent; subsumed into A because the loop reshape IS the backbone merge. Keeping this entry as a breadcrumb in case a future pass wants to split them.*

### Sub-project C — vApp contract + t3code-chat as reference vApp
**Goal:** define the vApp contract and ship t3code's chat UI as the first real vApp running against the new daemon.

**Ships when:**
- A vApp manifest format exists (JSON/TS schema), validated, with a loader in `apps/electron/main.ts` that opens a vApp as an isolated BrowserWindow.
- A vApp lifecycle is defined (load → ready → suspend → close) with IPC events and reconnect semantics.
- Permission/capability declarations gate access to daemon APIs.
- t3code's chat renderer is repackaged as an EMA vApp bundle, talks to the daemon over Effect RPC, consumes EMA design tokens, registers with the launchpad.
- `apps/desktop/` (t3code's Electron host) is retired or reduced to a reference showing how to bring a desktop app into the vApp model.

**Depends on:** A (daemon with stable API surface). Can be brainstormed in parallel with A's implementation once A's spec is committed.

### Sub-project D+ — Follow-up migrations
Reshape each remaining `services/core/*` domain (spaces, goals, calendar, journal, chronicle, etc.) onto the event-sourced spine. Port the other 34 canonical vApps to the vApp contract. These are NOT part of the current meta-bootstrap; they become independent planning passes after A and C ship.

## Sequencing

1. **Brainstorm and spec sub-project A first.** Every decision in A locks constraints for C (and for D+). Don't start implementation until A is speced and committed.
2. **Sub-project A goes through writing-plans** after the spec lands.
3. **Sub-project C brainstorm** can start as soon as A's spec is committed, even before A is implemented — the vApp contract is tractable once the daemon API surface is frozen.
4. **Implementation of A and C can overlap** once both specs are live. Different brains, minimal conflict.

## Q&A resolved in this bootstrap session

1. **"Bringing daemon back" = run daemon as an independent process outside Electron.** Locked as D2.
2. **Spine coexistence with `loop/` = merge, don't half-ass it, t3code is the better codebase.** Locked as D1.
3. **First sub-project = A (backbone + daemon), then follow-up specs for C and beyond.** Locked.
4. **Transport = bring Effect in, keep t3code's RPC verbatim.** Locked as D3.

## Open questions deferred to the A spec

- Single daemon per machine, per user, or per workspace?
- Exact migration path for existing user data in `~/.local/share/ema/ema.db` — in-place event replay, fresh DB with import, or cutover with optional legacy snapshot?
- Do we adopt t3code's bootstrap-token pattern wholesale for auth, or extend it (e.g., for multi-user network scenarios)?
- Does the daemon ship as part of the EMA Electron app installer, as a separate package, or both?
- Which t3code observability surfaces (metrics, traces, OTLP export) come along, and which defer?
- Process supervision: does `ema daemon start` self-supervise (detach + auto-restart on crash) or rely on the OS service manager?
- CLI shape: does `cli/` (Oclif) stay, or does it get reshaped to talk to the daemon over RPC?

## Pointers for the next agent

### Read-first (canonical)
- This decision: `~/Desktop/EMA-v1.1-Next-Steps/10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md`
- Existing borrow analysis: `~/Desktop/EMA-v1.1-Next-Steps/08-IMPORTS/legacy-and-related-code/T3CODE-FORK-BORROW-ANALYSIS.md`
- T3code attachment + terminal steal plan: `~/Desktop/EMA-v1.1-Next-Steps/08-IMPORTS/legacy-and-related-code/T3CODE-ATTACHMENT-AND-TERMINAL-STEAL-PLAN.md`
- EMA read-firsts (per root README): `~/Projects/ema/README.md`, `~/Projects/ema/docs/OPERATING-REALITY.md`, `~/Projects/ema/docs/MEMORY-SYNC.md`, `~/Projects/ema/docs/GROUND-TRUTH.md`, `~/Projects/ema/docs/backend/README.md`, `~/Projects/ema/ema-genesis/vapps/CATALOG.md`, `~/Projects/ema/ema-genesis/_meta/VAPP-RECONCILIATION-TABLE.md`

### Key source files in t3code to study before speccing A
- `apps/server/src/bin.ts`, `cli.ts`, `config.ts`, `server.ts` — bootstrap + layer wiring
- `apps/server/src/orchestration/decider.ts` — command → event
- `apps/server/src/orchestration/projector.ts` — event → read model
- `apps/server/src/orchestration/Layers/ProviderCommandReactor.ts` — reactor pattern
- `apps/server/src/orchestration/commandInvariants.ts` — decider invariant helpers
- `apps/server/src/persistence/Migrations/*` — 23 migrations, the schema history
- `apps/server/src/ws.ts` — RPC handlers, `makeWsRpcLayer()`
- `apps/server/src/auth/Layers/BootstrapCredentialService.ts` — bootstrap token + session flow
- `packages/contracts/src/orchestration.ts` — event/command wire schemas (Effect Schema)
- `packages/contracts/src/rpc.ts` — RPC method definitions

### Key source files in EMA to reshape or retire
- `services/startup.ts` — 7-phase boot, retire or reshape for Effect runtime
- `services/http/server.ts` — Fastify server, retires in favor of Effect RPC
- `services/core/loop/` — the whole directory; reshape onto decider/projector/reactor
- `services/persistence/db.ts` — SQLite base, reshape for event log + projections
- `apps/electron/runtime.ts` — child spawn of `services/`; flip to client connection
- `apps/electron/main.ts` — add vApp loader (future), retire direct daemon ownership

## Next action

Brainstorm sub-project A with user → write spec to `docs/superpowers/specs/2026-04-13-ema-daemon-backbone-design.md` (or EMA's preferred spec location inside `ema-genesis/` / `01-PLANS/`) → invoke writing-plans to break A into phased implementation.
