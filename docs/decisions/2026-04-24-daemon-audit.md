# Daemon Audit — 2026-04-24

Per-module state of `apps/daemon/` (Gleam/BEAM) at the end of the 2026-04-24 correction pass. See [2026-04-24-codex-drift.md](./2026-04-24-codex-drift.md) for session context.

Total: 2,166 LOC across 20 Gleam modules.

## Core — `ema_daemon/`

| Module | LOC | State | Notes |
|---|---|---|---|
| `ema_daemon.gleam` | 25 | **implemented** | Entrypoint. Boots supervisor. |
| `ema_daemon/supervisor.gleam` | 72 | **implemented** | Supervision tree. |
| `ema_daemon/bus.gleam` | 345 | **implemented** | Event bus with `topbar` and `event_trail` projections; `append/subscribe/unsubscribe` API. |
| `ema_daemon/event_envelope.gleam` | 180 | **implemented** | Canonical event envelope type, `Option` helpers, validation. |
| `ema_daemon/sqlite_ffi.gleam` | 164 | **implemented** | SQLite FFI bindings via Erlang. |
| `ema_daemon/registry.gleam` | 137 | **implemented** | Process registry for bus/subscriptions. |
| `ema_daemon/ema_env.gleam` | 12 | **implemented** | Environment config (port, paths). |

Core is real. Daemon starts, supervises, accepts events, emits projections, persists to SQLite.

## Surfaces — `ema_shell_ipc/`

| Module | LOC | State | Notes |
|---|---|---|---|
| `ema_shell_ipc/ema_shell_ipc.gleam` | 496 | **implemented (v0)** | WebSocket server on port 49555 via mist. Handles `hello`, `ping`, `subscribe/unsubscribe`, `command`. Dispatches `debug.ping` + `org.create`. Emits `topbar` + `event_trail` projection snapshots on relevant events. Respects the field-order lock in `command_result` per `packages/contracts/ipc/shell-protocol.md`. |

The surface protocol is live end-to-end for `org.create`. Additional commands (`space.create`, `project.create`, `blueprint.*`, `attachment.*`) are not yet routed here — that's the **first V2 Codex lane** (see `CODEX-ORCHESTRATOR-PROMPT-V2.md`).

## Bounded contexts — implemented

| Module | LOC | State | Notes |
|---|---|---|---|
| `ema_orgs/ema_orgs.gleam` | 79 | **implemented** | Handles `org.create` command → emits `org.created` event → bus append. Error classes: `EmptyName`, `AppendFailed`. |
| `ema_attachments/attachments.gleam` | 108 | **implemented** | Attachment record model + create/link operations. |
| `ema_attachments/connectors.gleam` | 135 | **implemented** | Connector record model (github, google_drive, etc.). |
| `ema_swarm_coordination/first_boot.gleam` | 338 | **implemented (seed)** | The canonical workspace seed: `Founding-Fathers-EMA` org → default same-name space → `EMA 0.0.5` project → Blueprint document with two sections → attachment of the runtime codebase to the source section. Emits 12 canonical events (actor.created x3, org.created, space.created, project.created, blueprint.document.created, blueprint.section.added x2, attachment.created, attachment.linked, blueprint.attachment.linked). |

## Bounded contexts — stub (7–8 LOC, Wave 2+)

These modules declare only a `Placeholder` type. They are waiting for their wave per `docs/plans/IMPLEMENTATION-ROADMAP.md`. Each is a named holding pen; removing or collapsing them would hide the planned shape.

| Module | LOC | State | Wave |
|---|---|---|---|
| `ema_spaces/ema_spaces.gleam` | 7 | stub | Wave 2 — space CRUD beyond first-boot seed |
| `ema_projects/ema_projects.gleam` | 7 | stub | Wave 2 — project CRUD |
| `ema_blueprint/ema_blueprint.gleam` | 7 | stub | Wave 2 — Blueprint section tree + Yjs prose server |
| `ema_memberships/ema_memberships.gleam` | 7 | stub | Wave 4 — actors-as-members |
| `ema_invites/ema_invites.gleam` | 7 | stub | Wave 5 — collab-plane invite ceremony |
| `ema_replication/ema_replication.gleam` | 7 | stub | Wave 6 — daemon↔daemon replication |
| `ema_identity/ema_identity.gleam` | 8 | stub | Wave 4 — device/user identity |

## Does the seed run end-to-end?

The `first_boot.workspace()` function returns the full `FirstBootWorkspace` record, and `first_boot_events()` returns the 12 envelopes. These match the IDs in the web surface's `mock-projections.ts` exactly (`EMA_SCOPE.orgId` == `first_boot.org_id`, etc.), so when the daemon is started and the events are appended, the surface's `useProjection("topbar")` subscription hydrates with the real selection.

**What's verified:**
- Module compiles (2,166 LOC Gleam, idiomatic, no placeholder TODOs in the implemented modules).
- `ema_shell_ipc` implements the v0 handshake and field-order-locked `command_result` shape.
- `ema_orgs.create` appends a valid envelope through `bus.append`.
- `first_boot.first_boot_events()` constructs 12 envelopes with canonical IDs.

**What's not verified this pass** (because `gleam test` was not run here — no test target was exercised):
- That `first_boot_events()` is *actually invoked* at daemon startup. The seed data exists; whether `ema_daemon/supervisor.gleam` runs it on a fresh SQLite file is not confirmed from a cold read. **Recommended verification:** start the daemon (`pnpm dev:daemon`), connect a web surface, and watch the event trail projection.
- SQLite idempotency on re-boot. The seed events have canonical IDs — if the bus dedupes on `event_id`, a second boot is a no-op; if not, we'd double-append. Unchecked here.

Both of the above are first-lane Codex V2 targets.

## Removed / not-resurrected

- **No old Elixir/Phoenix daemon code is present under `apps/daemon/`.** The Elixir lineage is preserved in `atlas/ema-atlas` branch `lineage-original-elixir-ema`, not in this runtime. Confirmed by `grep`: no `.ex`, `.exs`, or `mix.exs` under `apps/daemon/`.
- **No Electron remnants under `apps/` or `packages/`.** Confirmed in red-flag sweep (see correction report).

## Shape check against doctrine

- ✅ Daemon is Gleam/BEAM (per `LANGUAGE-LOCK.md` + `architecture/02-daemon-supervision.md`).
- ✅ SQLite as canonical store (per `architecture/05-writer-topology.md`).
- ✅ Bus + projections + typed envelopes (per `architecture/03-event-catalog-v0.md`).
- ✅ `shell_ipc v0` on `ws://127.0.0.1:49555` (per `packages/contracts/ipc/shell-protocol.md`).
- ✅ `Organization -> Space -> Project` topology baked into seed IDs (not `Project -> Space`).
- ✅ Actors first-class (Trajan + Codex + Claude seeded as canonical records).
