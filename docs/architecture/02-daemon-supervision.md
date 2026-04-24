# 02 — Daemon supervision

The daemon is a Gleam/BEAM application. It owns all canonical truth and is
the only writer to the canonical SQLite database.

## Runtime + storage lock

- **Language:** Gleam on BEAM (Erlang target). No Elixir at the runtime level
  in wave 1 — we rely on Gleam → Erlang interop directly rather than a
  second BEAM language on the same node.
- **Concurrency primitives:** OTP supervision, Erlang processes, `gleam_otp`
  actors. All fan-out in the event bus is message-passing on the same node.
- **SQLite binding:** `esqlite` (Erlang NIF), consumed from Gleam via direct
  Erlang FFI. Chosen over pure-Gleam shells because the NIF is
  battle-tested, ships WAL-mode support, and integrates cleanly with BEAM
  scheduling. The FFI wrapper lives under
  `apps/daemon/src/ema_daemon/sqlite_ffi.gleam` and exposes a minimal
  `open/1`, `exec/2`, `prepare/2`, `step/1`, `finalize/1`, `close/1` surface;
  richer APIs are added on demand.
- **Canonical DB file:** one `canonical.db` per daemon instance, opened in
  WAL mode, single writer process. Projections live in a separate disposable
  `projections.db` (also SQLite, WAL, but re-buildable from the canonical
  log at any time).
- **Real-time collaboration (future wave):** Yjs is NOT the committed
  choice. Yjs is JS-runtime-coupled; we do not want to host a JS runtime
  inside the BEAM daemon. Wave-7 collaboration will pick either (a) a
  BEAM-native CRDT (e.g. `delta_crdt` or an Automerge-compatible library
  with an Erlang adapter) mediated by the daemon, or (b) a separate
  Hocuspocus sidecar if Yjs is the only credible option. The
  `06-blueprint-boundaries.md` doc describes the Blueprint structural vs
  prose split in general terms; the specific CRDT is deferred and NOT
  "Yjs" by default.

## Top-level tree

```
ema_daemon_sup (one_for_one)
├── bus              (singleton event-bus actor; append-then-fan-out)
├── registry         (Singularity-style named-actor registry)
├── shell_ipc_sup    (localhost WS acceptor + per-connection workers)
└── contexts_sup     (rest_for_one)
    ├── identity_sup
    ├── orgs_sup
    ├── spaces_sup
    ├── projects_sup
    ├── memberships_sup
    ├── invites_sup
    ├── blueprint_sup
    ├── attachments_sup   (git-ema backend — attachments + connectors)
    ├── coordination_sup  (ema_swarm_coordination — lanes/handoffs/missions/
    │                      campaigns/swarms/vcalendar/checkups — mock
    │                      writers in wave 1)
    └── replication_sup
```

### Strategy notes

- `ema_daemon_sup` is `one_for_one`: the bus, registry, and IPC server each
  crash independently.
- `contexts_sup` is `rest_for_one` so that if `identity_sup` dies, every
  downstream context is restarted with fresh state. Identity is upstream of
  everything.
- Each `<context>_sup` is `one_for_one` and owns:
  - a thin `<context>_writer` actor (handles command → event append)
  - zero-or-more per-entity actors started on demand (e.g., one per open
    project) and registered by `<kind>:<ulid>`.

## Registry

The registry maps stable names (`project:<ulid>`, `space:<ulid>`, etc.) to
current `Subject(Message)` values. Any actor restart must re-register under
the same name before accepting traffic. Cross-context code MUST go through
the registry; hardcoded Subjects across supervisor boundaries are banned.

See `packages/contracts/types/ids.md` for key format.

## Event bus

A singleton actor at the top. All writer actors append through the bus so
that:

1. append order is linear per daemon instance;
2. projections and the IPC fan-out subscribe in one place;
3. replication reads from the bus' tail.

See `03-event-catalog-v0.md`.

## IPC

`shell_ipc_sup` runs a localhost WebSocket server that surfaces (Tauri
desktop, browser tab) connect to. The wire protocol is defined in
`packages/contracts/ipc/shell-protocol.md`. Surfaces never write to SQLite
directly.

## Bounded-context folder layout

One folder per context under `apps/daemon/src/`:

```
ema_identity/      ema_orgs/         ema_spaces/
ema_projects/      ema_memberships/  ema_invites/
ema_blueprint/     ema_attachments/  ema_swarm_coordination/
ema_replication/   ema_shell_ipc/
```

The canonical name is `ema_swarm_coordination`. Earlier doctrine drafts used
`ema_swarm_coordination`; anywhere that name still appears should be corrected.

Each context's public API is exposed via one module that only the
corresponding supervisor and the IPC server are expected to call.
