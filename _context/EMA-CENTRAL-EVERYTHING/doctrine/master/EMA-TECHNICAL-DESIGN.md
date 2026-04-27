# EMA 0.0.5 — Technical Design

**Document kind:** technical design / implementation doctrine
**Version:** 0.0.5
**Status:** canonical doctrine, inherits from `doctrine/master/EMA-DESIGN-DOC.md`
**Date:** 2026-04-24
**Implementation root:** `runtime/EMA-0.0.5--4-24/`

---

## 0. Document scope

This document is the engineering-side companion to the Master Design Doc and the Project Overview. Where the Master Doc establishes *why*, and the Overview establishes *what ships*, this doc establishes *how*:

- Runtime substrate and language choices.
- Process supervision tree — the daemon's complete shape.
- Event catalog — families, kinds, invariants.
- Writer topology — one writer per bounded context, one rule.
- IPC contract — the daemon ↔ surface wire protocol.
- Projections — every subscribable view, its owner, its channel.
- First-boot sequence — exact events, exact order.
- Lease / replication / multi-device — the design, deferred to W7.
- Hermes harness boundary — where EMA ends and runtime begins.
- Collab authority — BEAM-native rooms, not Node.
- Companion bridge — Tauri transparency + origin-allowlisted WebSocket.
- Web vDesktop stack — Next.js + React + Motion + Zustand (locked 2026-04-24).
- Donor translation map — what we copy, adapt, inspire from, or reject.

**Authority order:** Master Design Doc > Project Overview > **this doc** > `runtime/EMA-0.0.5--4-24/docs/architecture/*.md` > `packages/contracts/**` > `apps/daemon/src/**` and `apps/web/**`. If runtime code contradicts this doc, the code is wrong and must change, not this doc.

**Canonical runtime references:** every normative statement below also exists as an architecture doc under `runtime/EMA-0.0.5--4-24/docs/architecture/` or a contract under `runtime/EMA-0.0.5--4-24/packages/contracts/`. This document is the doctrinal integration; those are the living technical specs.

---

## 1. Runtime substrate and language choices

### 1.1 The daemon: Gleam on BEAM

- **Language:** Gleam. Targets Erlang, runs on BEAM. Type-safe, small, interop-friendly.
- **Why not Elixir:** Elixir was the original EMA substrate (`lineage-original-elixir-ema`). The 0.0.5 rewrite chose Gleam for compile-time types and the smaller surface area. The OTP doctrine carries forward verbatim — supervisors, actors, message passing, let-it-crash fault tolerance, bounded PubSub.
- **Why not Node, Rust, Go:** Node has no first-class supervision. Rust has no first-class actor model (and a much heavier dev cost for a daemon of this shape). Go's goroutines are not supervised processes. BEAM is the closest-fit substrate to what EMA needs: many independent actors, all failing independently, all observable, all recoverable.
- **Erlang interop:** direct Gleam → Erlang FFI, no second BEAM language on the same node in wave 1. `ema_sqlite_helpers.erl` is an `.erl` module called from Gleam modules when the required shape is simpler in native Erlang.

### 1.2 Canonical storage: SQLite via `esqlite`

- **Binding:** `esqlite` (Erlang NIF). Battle-tested, WAL-mode support, integrates cleanly with BEAM scheduling.
- **FFI wrapper:** `apps/daemon/src/ema_daemon/sqlite_ffi.gleam` exposes `open/1`, `exec/2`, `prepare/2`, `step/1`, `finalize/1`, `close/1`. Richer APIs added on demand.
- **Canonical DB:** one `canonical.db` per daemon instance. Opened in WAL mode. Single writer process (enforced by the `bus` actor singleton, §3).
- **Projection DB:** separate disposable `projections.db`. Also SQLite, also WAL. Rebuildable from the canonical log at any time.
- **Blob store:** `blobs/` directory for `attachment.source = "local"`. Not populated in 0.0.5; see §11.

### 1.3 Surfaces: Tauri v2 desktop + Next.js web

- **Web vDesktop stack:** Next.js 16 (App Router) + React + Motion v12 + Zustand 5. Locked 2026-04-24 per STATUS.md §"Canon update — Web vDesktop stack locked". The prior Vite+React-Router SPA is deprecated.
- **Desktop shell:** Tauri v2 native bundle. Mach-O arm64 on macOS. Embeds the Next.js web surface via a local web server or a packaged static export.
- **Why Next.js over raw Vite:** the place.org donor (`apps/web/app/page.tsx` layout) depends on App Router patterns; copying forward without reshaping is cheaper than re-creating as Vite lookalikes. Route groups, Server Components, and the Next image pipeline are all used.
- **Why Motion over Framer Motion:** 32KB, hardware-accelerated, best React DX for the springy window / dock / transition vocabulary.
- **Why Zustand over Redux / Jotai:** the donor uses Zustand for window state; the donor pattern is the product (§17 of the donor spec).
- **Reject list:** no Tailwind in surface code (tokens are the source of truth; utility classes must consume tokens per `doctrine/design/place-org-ux-manifesto.md` §4); no shadcn/ui; no framer-motion; no electron; no direct SQLite import from `apps/web/**`.

### 1.4 Workspace layout

Pnpm monorepo at `runtime/EMA-0.0.5--4-24/`:

```
apps/
├── daemon/         (Gleam/BEAM)
├── desktop/        (Tauri v2 + Rust)
├── web/            (Next.js + React + Motion + Zustand)
└── cli/            (Node + TS; speaks the same IPC protocol)
packages/
├── contracts/      (events, IPC, ID types — doctrine as code)
└── surface-core/   (IPC client, projection types, adapter protocol)
scripts/            (start/stop-ema-dev, contract-check, ledger-check, swarm-sweep)
tooling/            (m1-round-trip, fixtures)
docs/
├── architecture/   (01–17, living specs)
├── orchestration/  (STATUS.md, lanes/)
├── plans/          (IMPLEMENTATION-ROADMAP, SURFACE-SLICE-*)
├── decisions/      (dated ADRs)
├── vapps/          (Blueprint, git-ema, See Agent Work specs)
├── cli/            (CLI command reference)
└── agents/         (agent-facing usage guides)
```

Every doctrine edit in this workspace happens *first* in the root `doctrine/` tree (outside git), then *if needed* in `runtime/EMA-0.0.5--4-24/docs/`. STATUS.md logs the doctrine pull.

### 1.5 Identifiers: ULID + typed prefix

All entities: `<prefix>:<ulid-26chars>`, lowercase prefix, ASCII colon. Example: `project:01JFYV6W2H7K9Z8XR3BDQG4T5P`.

Full registered list lives in `packages/contracts/types/ids.md`. Canonical prefixes (~32 as of 2026-04-24): `user`, `actor`, `agent`, `personal_ai`, `device`, `org`, `space`, `project`, `invite`, `event`, `dispatch`, `execution`, `lease`, `lane`, `handoff`, `proposal`, `incident`, `attachment`, `artifact`, `source_ref`, `codebase`, `connector`, `blueprint_doc`, `blueprint_sec`, `blueprint_cmt`, `collab_frame`, `swarm`, `mission`, `campaign`, `vcalendar`, `calendar_block`, `checkup`, `queue_item`.

Adding a new prefix requires an entry in `ids.md` and a contract-review commit.

**Why ULID:** time-ordered (critical for event log indexes), lexicographically sortable, URL-safe, 128-bit, collision-free in practice.

---

## 2. Top-level supervision tree

Per `runtime/EMA-0.0.5--4-24/docs/architecture/02-daemon-supervision.md`.

```
ema_daemon_sup  (one_for_one)
├── bus                 (singleton event-bus actor; append-then-fan-out)
├── registry            (Singularity-style named-actor registry)
├── shell_ipc_sup       (localhost WS acceptor + per-connection workers)
└── contexts_sup        (rest_for_one)
    ├── identity_sup
    ├── orgs_sup
    ├── spaces_sup
    ├── projects_sup
    ├── memberships_sup
    ├── invites_sup
    ├── access_sessions_sup
    ├── blueprint_sup
    ├── collab_sup              (BEAM-native live document rooms)
    ├── attachments_sup         (git-ema backend — attachments + connectors)
    ├── coordination_sup        (ema_swarm_coordination — lanes/handoffs/missions/
    │                            campaigns/swarms/vcalendar/checkups)
    └── replication_sup
```

**Strategy notes:**
- `ema_daemon_sup` is `one_for_one`: bus, registry, IPC server each crash independently.
- `contexts_sup` is `rest_for_one`: if `identity_sup` dies, all downstream contexts restart with fresh state (identity is upstream of everything).
- Each `<context>_sup` is `one_for_one` and owns:
  - one `<context>_writer` actor (command → validation → event append),
  - zero-or-more per-entity actors started on demand (e.g., one per open project), registered under `<kind>:<ulid>`.

**Registry:** maps stable names to current `Subject(Message)` values. Any actor restart must re-register under the same name before accepting traffic. Cross-context code goes through the registry; hardcoded Subjects across supervisor boundaries are banned.

**Crash / restart semantics:**
- Actor crash → supervisor restarts (one_for_one).
- Identity context crash → all dependent contexts restart (rest_for_one).
- `bus` crash → a catastrophic event; full daemon restart is preferable to a split-brain write log. In wave-1 the bus is not expected to crash outside bug-class conditions.
- Full daemon crash → next launchd / systemd-user restart; SQLite WAL mode preserves write durability.

---

## 3. Event bus

Singleton actor at the top of the tree. Every writer actor appends through the bus. This gives:

1. **Linear append order per daemon instance.** Global event ordering is guaranteed within one daemon; cross-daemon ordering is a replication concern (W7).
2. **One fan-out point.** Projections and IPC fan-out subscribe to the bus, not to per-context actors. Replication reads from the bus tail.
3. **Single throttle point.** Backpressure, batching, and checkpointing all happen at the bus.

### 3.1 Event envelope

Every event appended to the bus conforms to the envelope defined in `apps/daemon/src/ema_daemon/event_envelope.gleam`:

```text
Envelope {
  txid:         int64    // monotonic per daemon, SQLite ROWID of the events table
  seq:          int      // 0 for atomically-appended events; non-zero for sub-events in a batch
  kind:         string   // e.g. "org.created" — matches catalog.v0.md
  id:           "event:<ulid>"
  actor_id:     "actor:<ulid>" | "system:<context-name>"
  org_id?:      "org:<ulid>"
  space_id?:    "space:<ulid>"
  project_id?:  "project:<ulid>"
  target_id?:   "<prefix>:<ulid>"   // the subject of the event
  at:           ISO-8601 UTC
  payload:      { ... }             // kind-specific body
}
```

**Addressing:** events are addressed by `(txid, seq)`, never by `id`. The `event:<ulid>` is a convenience surface (it appears in `command_result.events[]`), but the log's canonical identity is `(txid, seq)`.

**Invariants (enforced at append):**
- `kind` must appear in `packages/contracts/events/catalog.v0.md`.
- Every `<prefix>:<ulid>` ID must use a registered prefix (`ids.md`).
- `target_id` presence is kind-specific; the catalog documents expected IDs per kind.
- No two events in the same txid have the same seq.

### 3.2 Append → fan-out

```text
writer_actor.handle_command(cmd)
  ↓ (validate)
writer_actor.produce_events(cmd) -> [envelope…]
  ↓
bus.append(envelopes)       // single-writer; linear order; SQLite INSERT
  ↓
bus.fanout(envelopes)       // to projection actors + IPC subscribers + replication tail
  ↓
writer_actor returns event_ids[] to caller via command_result
```

**Visibility rule:** `command_result` does not return until the bus append has committed. Projections may fan out after the result is returned; the caller's visibility of the new event is guaranteed when the result arrives (read-your-writes via projection subscribe is a separate concern — see §4.3).

---

## 4. Event catalog

Full authoritative list: `packages/contracts/events/catalog.v0.md`. Summary by family:

### 4.1 Identity & membership (org, actor, identity, space, project, membership, invite, access_session, device, peer)

The foundation layer: who exists, what they own, which device they use, how access sessions resolve. **Wave-1 writers live for:** `org.created`, `space.created`, `project.created`, `identity.user_upserted`. Most other kinds are catalog-defined but not yet end-to-end.

### 4.2 Replication & lease (lease, replication)

Multi-device coordination primitives. Events defined; no writer ships in 0.0.5. Design in `runtime/EMA-0.0.5--4-24/docs/architecture/04-lease-authority.md`; implementation in W7.

### 4.3 Coordination (lane, handoff, proposal, incident)

The swarm coordination layer. **Wave-1 writers:** none yet (mocked in See Agent Work). W2–W3 target: `lane.opened`, `lane.closed`, `lane.item_added`, `handoff.requested`, `handoff.accepted`.

### 4.4 Execution (dispatch, execution, tool)

The Hermes harness seam. Defined; not wired in 0.0.5. Hermes integration is W5. See `runtime/EMA-0.0.5--4-24/docs/architecture/12-hermes-integration.md`.

### 4.5 Blueprint (blueprint.document.*, blueprint.section.*, blueprint.comment.*, blueprint.attachment.*)

The project-thinking surface writer. **Wave-1 writers:** none; W2 target: `blueprint.document.created`, `blueprint.section.added`, `blueprint.section.renamed`. See `runtime/EMA-0.0.5--4-24/docs/architecture/06-blueprint-boundaries.md`.

### 4.6 Collab (collab.document.checkpointed)

BEAM-native live document authority. `collab.document.open` and `collab.document.replace` are *commands* (see §5); only `collab.document.checkpointed` lands in the canonical log when the durable checkpoint advances. Per-keystroke state is BEAM-room-local, not canonical. See `runtime/EMA-0.0.5--4-24/docs/architecture/17-live-collab-first.md`.

### 4.7 Attachment & connector (attachment, connector)

The git-ema backend. Wave-1 writers: none; W2 target: `connector.connected`, `connector.linked_resource_imported`, `attachment.created`, `attachment.linked`. See `runtime/EMA-0.0.5--4-24/docs/architecture/07-git-ema.md`.

### 4.8 Intent — Brain Dump capture surface

Brain Dump is the first intent-capture vApp in 0.0.5. Per Master Doc §6.1, every entry is `intent` preserved before it becomes canon. Wave-1 state: entries are `local only` (persisted to `localStorage` under `ema:braindump:<project_id>`); processing tags (Task / Journal / Archive) are `pending daemon writer`.

Target writer family (post-W1, provisional): `intent.captured`, `intent.tagged`, `intent.promoted_to_proposal`. Until the writer lands, Brain Dump is a visually labeled local-only store. When the writer ships, entries promote via the canonical intent → proposal pipeline; existing local-only entries can be batch-flushed through a one-shot `intent.capture_batch` command.

Surface: `apps/web/src/vapps/braindump/index.tsx`. Donor: place.org GTD inbox pattern, ripped from atlas `origin/docs-place-org-era-research`.

### 4.8 Family-to-writer ownership

| Family | Writer module | Supervisor |
|---|---|---|
| org | `ema_orgs` | `orgs_sup` |
| actor | `ema_identity` | `identity_sup` |
| identity | `ema_identity` | `identity_sup` |
| space | `ema_spaces` | `spaces_sup` |
| project | `ema_projects` | `projects_sup` |
| membership | `ema_memberships` | `memberships_sup` |
| invite | `ema_invites` | `invites_sup` |
| access_session | `ema_access_sessions` | `access_sessions_sup` |
| device | `ema_identity` | `identity_sup` |
| peer | `ema_replication` | `replication_sup` |
| lease | `ema_replication` | `replication_sup` |
| replication | `ema_replication` | `replication_sup` |
| lane | `ema_swarm_coordination` | `coordination_sup` |
| handoff | `ema_swarm_coordination` | `coordination_sup` |
| proposal | `ema_swarm_coordination` | `coordination_sup` |
| incident | `ema_swarm_coordination` | `coordination_sup` |
| dispatch | `ema_swarm_coordination` | `coordination_sup` (W5: hermes bridge) |
| execution | `ema_swarm_coordination` | `coordination_sup` (W5) |
| tool | `ema_swarm_coordination` | `coordination_sup` (W5) |
| blueprint | `ema_blueprint` | `blueprint_sup` |
| collab | `ema_collab` | `collab_sup` |
| attachment | `ema_attachments` | `attachments_sup` |
| connector | `ema_attachments` | `attachments_sup` |

**Rule:** one family → one writer module. No cross-module writes. If `ema_orgs.bootstrap_team/2` needs to emit a `space.created`, it publishes a cross-context request on the bus; `ema_spaces` subscribes and emits the space event from *its* writer. This keeps the "one writer per family" rule clean and makes the event log replay deterministically.

---

## 5. IPC protocol

Full authoritative spec: `packages/contracts/ipc/shell-protocol.md`. Summary here.

### 5.1 Transport

- WebSocket on `ws://127.0.0.1:<ema-port>`. Default port 49555.
- One JSON object per WS text message.
- Every message has `v`, `id`, `type`. `v` is `0` until a breaking change bumps to `v1`.

### 5.2 Message types

| Type | Direction | Purpose |
|---|---|---|
| `hello` | client → server | handshake open |
| `hello` | server → client | handshake ack (same type name, different payload) |
| `subscribe` | client → server | open a projection + event channel |
| `unsubscribe` | client → server | close a channel |
| `command` | client → server | request a write (or a query) |
| `command_result` | server → client | reply to a command |
| `projection` | server → client | full snapshot of a projection |
| `event` | server → client | streamed event envelope on a subscribed channel |
| `subscription_dropped` | server → client | backpressure or server-side close |
| `ping` / `pong` | both | 10s keepalive |
| `bye` | either | voluntary close |

### 5.3 Hello ceremony

Client:
```
{ v:0, id:"msg-…", type:"hello", surface:"web"|"desktop", device_id: "device:<ulid>"|null }
```

Server:
```
{ v:0, id:"msg-…", type:"hello",
  daemon_version:"0.0.5-dev",
  accepted_device_id:"device:<ulid>"|null,
  note:string|null }
```

Wave-1: `device_id` is null, daemon accepts any hello and assigns a dev id. Wave-3 introduces device key ceremony (`bootstrap: "genesis" | "paired"`); see §8.

### 5.4 Commands

Shape:
```
{ v:0, id:"msg-…", type:"command", op:"<op>", args:{ … } }
```

Response (success, mutation):
```
{ v:0, type:"command_result", in_reply_to:"msg-…", ok:true, events:["event:<ulid>", …] }
```

Response (success, query):
```
{ v:0, type:"command_result", in_reply_to:"msg-…", ok:true, projection:{ name, data } }
```

Response (error):
```
{ v:0, type:"command_result", in_reply_to:"msg-…", ok:false,
  error:{ class:"<enum>", message:"…" } }
```

**Error classes (enum, exhaustive):** `unknown_op`, `invalid_args`, `not_found`, `forbidden`, `conflict`, `auth`, `validation`, `unavailable`, `internal`. Adding a class is a protocol change that updates the spec table first.

**Field order:** `v, type, in_reply_to, ok, <data|error>`. Clients may rely on field order to short-circuit parse.

**Wave-1 commands** (see shell-protocol.md for full list): `org.create`, `space.create`, `project.create`, `identity.google_upsert`, `identity.authenticator_enable`, `device.register`, `membership.role_grant`, `invite.{create,accept,revoke,expire}`, `access_session.{challenge,approve,revoke,expire}`, `connector.{connect,disconnect,import_resource,list_picker_items}`, `attachment.{rename,delete,link,unlink}`, `collab.document.{open,replace}`, plus two debug: `debug.ping`, `topbar` (projection fetch).

### 5.5 Events and subscriptions

Channel per scope:

| Channel | Streams |
|---|---|
| `user.<user_id>.orgs` | org + membership events visible to this user |
| `org.<org_id>.spaces` | space events within this org |
| `space.<space_id>.projects` | project events within this space |
| `project.<project_id>.all` | every event scoped to this project |
| `project.<project_id>.attachments` | attachment + link events for this project |
| `user.<user_id>.connectors` | connector events for this user |
| `collab.document` | BEAM collab projection replacements after document open |

Subscribers receive:
1. One `projection` message with the current state (snapshot).
2. Zero or more `event` messages for newly appended events, in order.

No txid-resume semantic in v0. Surfaces are projection consumers, not log followers. If a subscription is dropped, the client re-subscribes; the resulting fresh snapshot is equivalent to having received every delta in between.

### 5.6 Projections

Wire shape:
```
{ v:0, type:"projection", name:"<name>", data:{ … } }
```

Wave-1 projections:

| Name | Owner module | Read channel |
|---|---|---|
| `topbar` | `ema_identity` + `ema_orgs` + `ema_spaces` + `ema_projects` (composed by `ema_projections/topbar.gleam`) | subscribe implicit on hello |
| `access_session.current` | `ema_access_sessions` | `user.<user_id>.orgs` |
| `device.registry` | `ema_identity` | `user.<user_id>.orgs` |
| `git_ema.user_connectors` | `ema_attachments` | `user.<user_id>.connectors` |
| `git_ema.user_attachments` | `ema_attachments` | `user.<user_id>.connectors` |
| `git_ema.project_attachments` | `ema_attachments` | `project.<project_id>.attachments` |
| `blueprint.sections` | `ema_blueprint` | `project.<project_id>.all` |
| `collab.document` | `ema_collab` | `collab.document` |
| `see_agent_work.project_pulse` | `ema_swarm_coordination` (composed) | `project.<project_id>.all` |

Each projection name maps 1:1 to a TypeScript interface in `packages/surface-core/src/projections/`. If the two drift, the contract file is canonical.

### 5.7 Backpressure

Per-subscription send buffer cap: **N = 500**. On overflow, the daemon drops the subscription with `subscription_dropped { reason: "backpressure" }`. Client re-subscribes; fresh snapshot resumes.

`N` is not tunable in v0. A future wave may expose it per-surface.

### 5.8 Keepalive and reconnect

- 10s heartbeat (ping/pong). 15s without pong → connection dead, close.
- Reconnect: exponential backoff 1s → 2s → 4s → 8s, cap 15s.
- On reconnect: fresh hello; re-subscribe every channel the client was on; discard any in-flight unacknowledged command (caller retries explicitly).

---

## 6. Write-path discipline

The one rule:

> **The BEAM daemon owns every write to canonical SQLite. No surface, no sidecar, no helper ever opens the canonical database for writing.**

Corollaries:
- Surface code (`apps/web/**`, `apps/desktop/**`, `apps/cli/**`) that imports SQLite fails review. The only approved data seam is `packages/surface-core/`.
- Non-daemon processes may read `canonical.db` only for debugging purposes and only as read-only (`mode=ro`).
- `projections.db` is rebuild-from-log and is not authoritative for anything. A surface reading `projections.db` directly is also a violation in wave-1; projections travel over IPC.

### 6.1 Command flow

```
Surface component
  ↓ useCommand("project.create", args)   (React hook over IPC client)
IPC client (surface-core)
  ↓ JSON {type:"command", op:…, args:…}
WebSocket
  ↓
shell_ipc_worker (per-connection Gleam actor)
  ↓ route by op
writer actor (e.g. ema_projects)
  ↓ validate (authz, invariants, schema)
writer actor
  ↓ produce_events -> [envelope]
bus.append -> [event ids]
  ↓
writer actor returns command_result {ok, events:[…]}
```

### 6.2 Query flow (collab.open, connector.list_picker_items)

Queries bypass the bus and return data inline:

```
Surface
  ↓ command { op:"connector.list_picker_items", args:{ connector_id } }
shell_ipc_worker
  ↓
writer actor (or query actor) resolves data synchronously
  ↓
command_result { ok:true, picker_items:[…] }
```

Query commands MUST NOT appear in the event log.

### 6.3 Subscribe flow

```
Surface
  ↓ command { type:"subscribe", channel:"project.<id>.all" }
shell_ipc_worker
  ↓ request current projection from owning projection actor
projection actor returns snapshot
  ↓
daemon → surface: { type:"projection", name, data }
  ↓
(time passes; events append on the bus for this channel)
daemon → surface: { type:"event", channel, event: envelope }
```

---

## 7. First-boot sequence

Per `runtime/EMA-0.0.5--4-24/docs/architecture/10-first-boot.md`. The first time an EMA daemon runs on a device, it must land the primary user into a usable workspace *without user action beyond launching the app*.

### 7.1 Preconditions

- Daemon started (launchd / systemd-user / dev script).
- `canonical.db` does not exist, or exists with zero events.
- No `device:<ulid>` registered.
- No `org:<ulid>` exists.

### 7.2 Sequence

The founding user is **Trajan**. On first-boot, the daemon seeds **two** organizations: a personal org for Trajan and the project-building org `Founding-Fathers-EMA`.

| # | Event | Actor | Notes |
|---|---|---|---|
| 1 | `device.registered` | `system:ema_identity` | `bootstrap: "genesis"`; device pubkey generated locally |
| 2 | `org.created` | `system:ema_orgs` | `kind: "personal"`; name = `"Trajan's Organization"` |
| 3 | `membership.role_granted` | `system:ema_memberships` | role `"owner"` on the personal org |
| 4 | `space.created` | `system:ema_spaces` | default space of the personal org |
| 5 | `org.created` | `system:ema_orgs` | `kind: "team"`; name = `"Founding-Fathers-EMA"` |
| 6 | `membership.role_granted` | `system:ema_memberships` | role `"owner"` on Founding-Fathers-EMA |
| 7 | `space.created` | `system:ema_spaces` | name = `"Founding-Fathers-EMA"`; default space |
| 8 | `project.created` | `system:ema_projects` | name = `"EMA 0.0.5"` under Founding-Fathers-EMA default space |
| 9 | `blueprint.document.created` | `system:ema_blueprint` | title `"EMA 0.0.5 — Master Blueprint"` (wave-2; deferred in wave-1) |

The shell boots with the current selection pointed at events 5 / 7 / 8 (Founding-Fathers-EMA → Founding-Fathers-EMA → EMA 0.0.5). The personal org exists from day one but is not the default; Trajan switches into it via the topbar org selector.

### 7.3 Idempotency

- Replayable: starting a fresh daemon on an empty `canonical.db` and re-running the sequence yields identical projections.
- Guard: `bus.event_exists(bus_subject, "org.created", first_boot.trajan_personal_org_id)` — if the founding event for either org exists, skip.
- Current code: `apps/daemon/src/ema_swarm_coordination/first_boot.gleam` → `seed_if_needed/1` constructs the 13 envelopes (current wave-1 total including actors + identity seeding) and calls `bus.append` once, atomically. Re-run is a no-op.

### 7.4 Personal-org invariants

- `kind: "personal"` enforced; cannot be renamed to a brand-impersonating label (`ema_orgs` writer rejects `org.renamed` with `conflict` if the new name doesn't contain the owning user's label).
- Exactly one `membership.role_granted` of role `owner` on the personal org, targeting the sole user.
- Additional members allowed only as `guest`.

Founding-Fathers-EMA is `kind: "team"` — no personal-org invariants apply. Owner can invite `admin`/`member`.

### 7.5 Replication note

Device 1 runs the full sequence. Device 2 (post-pairing) does not — it replays the existing log. Pairing appends only `device.registered { bootstrap: "paired" }`; the existing org/space/project events are replicated, not re-seeded.

---

## 8. Lease, replication, and multi-device (deferred to W7)

Design is in `runtime/EMA-0.0.5--4-24/docs/architecture/04-lease-authority.md`. Summary:

- **Home node** holds the canonical log. Other devices hold replicas.
- **Lease model:** one device holds the *write lease* at a time. A lease is issued on pairing, renewed on heartbeat, and released / superseded on role transfer.
- **Replica states:** `replica_current`, `replica_provisional`, `replica_stale`. The topbar projection surfaces `node_state` (one of `home_current | replica_current | replica_provisional | replica_stale`) so the operator is never surprised about who owns writes.
- **Split-brain resolution:** a `lease.superseded` event records the resolution. Events from the non-winning branch remain in each device's local log but are not canonical; conflict-resolution surfaces are out of scope until W7.
- **Replication batch shape:** ordered tail of envelopes, Ed25519-signed by the sending device, hash-chained. Applied atomically.
- **Auth ceremony:** device pairing uses Ed25519 pubkey exchange + a short human-confirmable code (6-digit). Details in `runtime/EMA-0.0.5--4-24/docs/architecture/11-transport-and-auth-survey.md` and `16-google-identity-and-browser-access.md`.

None of the above is implemented in 0.0.5. Events are defined in the catalog; writers are stubs; the lease field on the topbar projection is always `home_current` in wave-1.

---

## 9. Hermes harness boundary (W5)

Per `runtime/EMA-0.0.5--4-24/docs/architecture/12-hermes-integration.md` and doctrine in `doctrine/research/ema-003-lineage-architecture-synthesis.md §5`.

### 9.1 The rule

EMA owns *the existence of the run.* Hermes owns *the execution of the run.* The run is created in EMA first, dispatched to Hermes, and the ledger is persisted in EMA. Hermes is never the only place where a run exists.

### 9.2 Flow

```
EMA daemon
  ↓ dispatch.started  (bus append; execution_id minted here)
EMA daemon → Hermes
  ↓ EngineRunRequest { execution_id, spec_id, driver, provider, scope_grants }
Hermes
  ↓ resolves driver + provider
  ↓ runs the work, streaming:
EMA daemon ← Hermes
  ↓ tool.invoked events (per tool call)
  ↓ tool.returned / tool.errored events
  ↓ execution.ended (or execution.failed)
EMA daemon
  ↓ outcome event (proposal promotion, canon write, or incident)
```

### 9.3 Boundary invariants

- **Execution IDs are EMA-minted.** Hermes receives them; it does not generate them. This keeps the event log authoritative.
- **Scope grants travel with the dispatch.** `scope_grants: [cap:<ulid>]` is part of the EngineRunRequest payload; Hermes refuses to invoke a tool not in the grant set.
- **Events normalize at the bridge.** Hermes emits its native event stream; the EMA bridge (`ema_swarm_coordination/hermes_bridge.gleam`, W5) maps to canonical envelopes before bus append.
- **No Hermes-only state reads.** Surfaces subscribe to EMA projections, never to Hermes directly.

### 9.4 Wave status

0.0.5: catalog entries exist (`dispatch.*`, `execution.*`, `tool.*`). Bridge module does not ship. No real dispatch leaves EMA.

---

## 10. Blueprint boundaries

Per `runtime/EMA-0.0.5--4-24/docs/architecture/06-blueprint-boundaries.md`.

- Blueprint is a *structural surface* over daemon truth + collab text. It is not a document CMS.
- `blueprint_doc` is a thin container (id + title + created_by + project scope).
- `blueprint_sec` is a tree node with `parent_id`, `title`, `order`, `children[]`, `attachments[]`.
- Section *body text* is a collab document (`collab.document.open` against a target of `{ kind: "blueprint_section", id: blueprint_sec:<ulid> }`), not a canonical event payload. Section creation / renaming / move / removal are canonical; section body is live-edited via the BEAM collab room and checkpointed durably.
- Promotion to proposal: a Blueprint section can be marked as a proposal-candidate (`blueprint.section.promoted_to_proposal`); this creates a `prop:<ulid>` with a link back to the section of origin.
- Comments are first-class (`blueprint_cmt`); resolve state is tracked.
- Attachments (git-ema) link to sections (`blueprint.attachment.linked`).

**Wave-1 status:** Blueprint vApp UI is a stubbed view using `mock-projections.ts`. W2 target: `ema_blueprint` writer emits `blueprint.document.created` + `blueprint.section.added` end-to-end; `blueprint.sections` projection replaces the mock.

---

## 11. Collab authority: BEAM-native rooms

Per `runtime/EMA-0.0.5--4-24/docs/architecture/17-live-collab-first.md`.

- **Live prose authority belongs to supervised BEAM document rooms** under `ema_collab`.
- No Node, Yjs, or Hocuspocus process is ever the document authority.
- `collab.document.open` → attaches the client to a BEAM room; the daemon immediately pushes the current `collab.document` projection.
- `collab.document.replace` → writes a whole-body replacement frame to the BEAM collab store.
- `collab.document.checkpointed` is the only canonical event in the collab family; emitted when a replace advances the durable checkpoint.
- No per-keystroke events land in canon. The operational log captures checkpoints; the fine-grained collab state is BEAM-room-local.
- `collab_frame` prefix addresses durable frames (update + checkpoint).

**Why BEAM-native and not CRDTs:** a single BEAM room is a single process; last-write-wins at the `replace` granularity is operationally simpler than a document CRDT, and EMA's collab scope (Blueprint section bodies, initially) does not require concurrent character-level merges. A CRDT layer can be added later as a replacement frame format; the room + checkpoint contract stays the same.

---

## 12. Git-ema / attachments / connectors

Per `runtime/EMA-0.0.5--4-24/docs/architecture/07-git-ema.md`.

- **git-ema** is the attachment + connector backend. It owns attachments, linked resources, and connector state.
- **Wave-1:** catalog entries live; no writers.
- **W2 target:** connector picker (Google Drive, GitHub) → attachment create + link to Blueprint section / project. `connector.connect` opens an OAuth/PAT flow; `connector.list_picker_items` is a query command returning inline picker items; `connector.import_resource` creates the attachment.
- **Blob handling:** 0.0.5 attachments are references (`source_ref`) to the external provider, not local blobs. `attachment.source = "local"` requires the blob store and is deferred.
- **ProjectAttachmentsProjection** surfaces `source_unreachable: bool` per attachment so surfaces can show broken-link state honestly (another honest-mocks corollary).

---

## 13. Companion bridge (Tauri transparency)

Per `runtime/EMA-0.0.5--4-24/docs/architecture/14-companion-bridge.md` (new in 2026-04-24 correction).

Donor: `atlas/ema-atlas` repo, branch `origin/codebase-place-companion`, path `code/place-companion/src-tauri/`. Production-ready Rust + Tauri v2 + objc2 build. Ported wholesale per donor-translation.md `copy` verdict.

### 13.1 What it provides

- **Transparent window:** `.transparent(true)` in `tauri.conf.json` + macOS `NSWindow.setOpaque:false` via `objc2` unsafe (Tauri issue #13415 workaround). Linux: `xprop _NET_WM_CM_S0` compositor probe with graceful degradation.
- **Localhost WebSocket:** companion-side WS on ports 27182–27189 (primes in sequence) with origin allowlist.
- **Tray daemon:** `ActivationPolicy::Accessory` — no dock icon for the companion process.
- **`macos-private-api` feature flag** gated; compiles cleanly on Linux/Windows without the macOS-private paths.

### 13.2 Integration contract (EMA-specific)

- The companion is a **sibling** of the primary Tauri window, not a replacement. Primary window embeds the Next.js web surface. Companion opens on `cmd+shift+space` (default) as a popout launcher, glass-morphism overlay.
- Origin allowlist rewritten for EMA: allow `tauri://localhost`, `http://localhost:5173` (dev), and the packaged app origin.
- Communication: the companion speaks to EMA daemon via the same `ws://127.0.0.1:49555` IPC as any other surface. It is a client, not a sidecar.
- Status probe: `companion.check_status { daemon_port }` — a ping-style query returning daemon reachability + lease state.

### 13.3 Wave status

The port landed as a distinct `lane/desktop-launcher-companion-port` branch (2026-04-24). Files ported: `Cargo.toml`, `origin_check.rs` (allowlist rewritten for EMA), `protocol.rs`, `commands.rs`, `window_mgr.rs`, `ws_server.rs`, `lib.rs`, `main.rs`, `tauri.conf.json` (CSP + macOSPrivateApi). See STATUS.md `## Session close … Desktop Launcher Companion Port`.

---

## 14. Web vDesktop stack

Locked 2026-04-24. Per STATUS.md `## Canon update — Web vDesktop stack locked`.

### 14.1 Stack

| Layer | Choice | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR boot frame + route groups (desktop vs. immersive) |
| UI | React 18+ | Component model |
| Animation | Motion v12 | Springs, hover magnification, window open/close |
| State | Zustand 5 | Window state, Z-index counter, dock focus |
| Styling | CSS custom properties + scoped CSS | Tokens from `doctrine/design/place-org-ux-manifesto.md` |
| Window mgr | `react-rnd` or equivalent | Drag + resize primitive |
| DB client | *none in web* | All data flows via IPC |

### 14.2 Canonical files

- `apps/web/app/page.tsx` — the vDesktop root. Place.org-style shell; Launchpad opens as first window.
- `apps/web/app/globals.css` — the desktop visual system.
- `apps/web/src/place-donor/place-org/` — copied donor payload from atlas `codebase-place-org`. Excluded from Next build until adapted.
- `apps/web/src/place-reflection/` — EMA-adapted shim layer that consumes donor code and adjusts vocabulary.
- `apps/web/src/shell/` — the EMA shell components (topbar, dock, wallpaper, window-frame, presence-layer).
- `apps/web/src/vapps/` — per-vApp components (HQ, See Agent Work, Launchpad, Blueprint, git-ema).

### 14.3 Reject list (on the web surface)

- Tailwind.
- shadcn/ui.
- framer-motion (use Motion v12 instead).
- Electron (the desktop shell is Tauri).
- Direct SQLite imports.
- Any CSS rule without a matching token from the manifesto or a `/* RIP: <donor> */` marker if donor-sourced.

### 14.4 Commands

- `pnpm --filter @ema/web dev` — Next on `http://localhost:5173`.
- `pnpm --filter @ema/web build` — `next build`.
- `pnpm --filter @ema/web typecheck` — `tsc --noEmit`.

---

## 15. Desktop Launcher (Tauri)

Owner: Desktop Launcher Correction Orchestrator.

- **Bundle:** Mach-O arm64 on macOS. `CFBundleExecutable=ema-desktop`, `CFBundleIdentifier=org.ema.desktop`, package type `APPL`, version `0.0.5`.
- **Installed path:** `/Users/tawj/Desktop/EMA 0.0.5.app` (wave-1 install target; will move to `~/Applications/` once the launchd install script lands).
- **Embeds:** the Next.js web surface. `devUrl` is `http://localhost:5173` in dev; in prod, the packaged bundle serves the exported site locally.
- **CSP:** narrow — `default-src 'self'; connect-src 'self' ws://127.0.0.1:49555; style-src 'self' 'unsafe-inline'`.
- **Daemon relationship:** the Tauri bundle does **not** embed or spawn the daemon. The daemon runs as a user-level system service (`launchd` user agent on macOS, `systemd --user` unit on Linux, Service or Scheduled Task on Windows). First-launch affordance prompts to install the service if not present.
- **Companion window (post-correction):** `cmd+shift+space` popout launcher glass-morphism overlay, separate window, transparent via objc2.

---

## 16. Build, dev, install

### 16.1 Dev scripts

| Script | Purpose |
|---|---|
| `scripts/start-ema-dev.sh` | Starts daemon (if not already listening on 49555) + web on 5173. Port-idempotent (`lsof -iTCP:49555 -sTCP:LISTEN`). |
| `scripts/stop-ema-dev.sh` | Clean shutdown. Reads pid files, SIGTERM → grace → SIGKILL. `--force-port-kill` off by default. |
| `scripts/dev-daemon.sh` | Just the daemon. |
| `scripts/dev-web.sh` | Just the web surface. |
| `scripts/contract-check.sh` | Three error classes: `missing-from-catalog`, `misspelled-kind` (Levenshtein ≤ 2), `unknown-id-prefix`. `--json`, `--test-fixture`. |
| `scripts/ledger-check.sh` | Asserts every canonical orchestrator prompt cites STATUS.md. |
| `scripts/swarm-sweep.sh` | Six-check read-only sweep: pids, ports, git branches, placeholder writer modules, INDEX references, ledger-check. |
| `tooling/m1-round-trip.mjs` | End-to-end IPC smoke test. Exit 0 on hello→subscribe→command→event round trip. |

### 16.2 Install (W3 target)

- `scripts/install-daemon-launchd.sh` — macOS: writes `~/Library/LaunchAgents/ema.daemon.plist`, loads it, verifies the port.
- `scripts/install-daemon-systemd.sh` — Linux: writes `~/.config/systemd/user/ema-daemon.service`, enables + starts.
- Windows TBD: likely Service or Scheduled Task at logon.

### 16.3 Release

- Tauri bundle build: `pnpm --filter @ema/desktop tauri build`. Produces Mach-O arm64 `.app` bundle.
- Web export: `pnpm --filter @ema/web build` + `next export` (or equivalent) for packaged static.
- Version bumps: single source of truth is `runtime/EMA-0.0.5--4-24/package.json` + `tauri.conf.json`. Mismatches fail `scripts/contract-check.sh`.

---

## 17. Testing architecture

### 17.1 Layers

- **Unit (Gleam):** `apps/daemon/test/*_test.gleam`. Each writer module has event-production tests.
- **Integration (Gleam + SQLite):** `apps/daemon/test/ema_daemon_test.gleam`. Real SQLite, full bus, assert ordered events land correctly. Includes `first_boot_appends_ordered_seed_events_to_sqlite_test`.
- **Contract (Node):** `tooling/m1-round-trip.mjs`. Round-trip over real WS against live daemon. Green on every lane close.
- **Fixture (Gleam):** `test/fixtures/bad-kinds/bad_source.gleam` with deliberately wrong kinds; `contract-check.sh --test-fixture` asserts rc=1 with expected error classes.
- **Web (Vitest / RTL):** not yet committed. Target: component-level tests for shell + See Agent Work regions. Per-vApp tests as vApps mature.

### 17.2 CI gates

- `pnpm check:contracts` — green on every PR.
- `cd apps/daemon && gleam build && gleam test` — green on every PR.
- `pnpm -r typecheck` — green on every PR.
- `pnpm --filter @ema/web build` — green on every PR.
- `node tooling/m1-round-trip.mjs` — green on merges to main when a daemon is reachable.

### 17.3 Test helpers

- `ema_test_helpers:event_kind_org_rows/1` — test-only SQLite reader for ordered event assertions.
- Fixtures under `test/fixtures/`.
- No mocking of SQLite. Integration tests use real DB in a temp dir.

---

## 18. Donor translation map

Per `runtime/EMA-0.0.5--4-24/docs/operations/donor-translation.md`: every donor pull is one of `copy`, `adapt`, `inspire`, or `reject`. Every `copy` / `adapt` targets a lane ticket. Every CSS donor rule carries `/* RIP: <donor> */`. Forbidden `copy` targets: topology, event shape, daemon authority, contracts, IPC plumbing, routing shell.

### 18.1 Donor sources

| Donor | Type | Primary use | Verdict |
|---|---|---|---|
| `atlas/ema-atlas origin/codebase-ema` | Elixir daemon | Control plane doctrine source | **adapt** (Gleam rewrite preserves shape) |
| `atlas/ema-atlas origin/codebase-place-companion` | Tauri transparent companion | `apps/desktop/src-tauri/src/` port | **copy** (wholesale) |
| `atlas/ema-atlas origin/codebase-place-org` | place.org Next.js desktop | Web vDesktop shell, tokens, motion | **adapt** (web surface); **copy** (CSS tokens with RIP markers) |
| `atlas/ema-atlas origin/codebase-place-org-openclaw` | Companion integration spec, popout patterns | `docs/architecture/14-companion-bridge.md` | **copy** (spec) + **inspire** (UI patterns) |
| `atlas/ema-atlas origin/docs-place-org-era-research` | Aesthetic manifesto source | `doctrine/design/place-org-ux-manifesto.md` | **copy** (distilled into manifesto) |
| `atlas/ema-atlas origin/codebase-frontend-layer` | Read-only observer posture | See Agent Work region design | **adapt** (posture language) |
| `atlas/ema-atlas origin/codebase-agent-os-bridge` | Mission/handoff/proposal state transitions | See Agent Work LaneBoard columns | **adapt** (vocabulary) |
| `atlas/ema-atlas origin/lineage-original-elixir-ema` | Supervision tree shape + Intent→Canon pipeline | Master Doc §4, §6; Daemon §2 | **adapt** (Gleam rewrite of Elixir shape) |
| `atlas/ema-atlas origin/codebase-execudeck` | Trust zones Zone 0/1/2, schema-driven UI | Master Doc §16 | **inspire** |
| `atlas/ema-atlas origin/docs-host-vault-agent-modules-routing` | 35-vApp catalog | `docs/vapps/catalog-reconciliation.md` (W2) | **inspire** |
| `atlas/ema-atlas origin/mission-control-claude` | Role display pattern | Agent roster chip styling | **adapt** |
| `atlas/ema-atlas origin/agent-os-demo` | Design-psychology donor | Ambient motion patterns | **inspire** |
| `TrajanWJ/ema` (GitHub) | Prior Electron build | Reference, not source | **reject** (superseded by Tauri) |

Full donor inventory: `doctrine/research/EMA-0.0.5-FULL-DONOR-INVENTORY.md` (new, ~500 lines, 2026-04-24).

### 18.2 Forbidden copy targets

- **Topology.** `Organization -> Space -> Project` is EMA-native; no donor shape overwrites it.
- **Event shape.** Envelopes are defined by `event_envelope.gleam` + `catalog.v0.md`. Donor event ideas may suggest new kinds; they cannot impose a different envelope shape.
- **Daemon authority.** No donor code runs as a canonical writer. Even `codebase-ema` (the original Elixir EMA) is adapted, not copied.
- **Contracts.** `packages/contracts/` is EMA-authored. Donor contracts are reference, not replacement.
- **IPC plumbing.** The wire shape defined in `shell-protocol.md` is canonical. Donor transport patterns (e.g., place-companion's port-allowlist) inform but do not replace.
- **Routing shell.** The Next.js App Router structure is EMA-shaped; donor file organization informs but does not constrain.

### 18.3 Copy-allowed targets

- CSS tokens + motion values (with `/* RIP: */` markers).
- Wallpaper mesh animation technique.
- Tauri companion `src-tauri/src/*.rs` files (with EMA-specific rewrites of `origin_check.rs`).
- Popout-launcher + companion-bridge TS patterns (from `codebase-place-org-openclaw`).
- Dock magnification spring values.
- Cursor-light radial gradient technique.

---

## 19. Contracts canonicality

`packages/contracts/` is the source of truth. The TypeScript in `packages/surface-core/` and the Gleam in `apps/daemon/src/` consume contracts; they do not define them.

### 19.1 Contract files

- `events/catalog.v0.md` — every event kind, by family.
- `events/<family>.md` — per-family detail: kind, payload shape, invariants, linked projections.
- `ipc/shell-protocol.md` — the wire protocol.
- `types/ids.md` — registered ID prefixes.
- `types/<type>.md` — per-type detail: attachment, connector, collab targets, etc.

### 19.2 Drift detection

- `scripts/contract-check.sh` walks daemon + surface code, extracts every referenced event kind and ID prefix, and asserts presence in `catalog.v0.md` / `ids.md`. Exit 1 on drift.
- TypeScript interfaces in `packages/surface-core/src/projections/index.ts` must match the projection shapes in `shell-protocol.md`. Drift between them is a review-blocking defect.
- `ORCHESTRATOR-INDEX.md` in doctrine is asserted by `scripts/ledger-check.sh` to cite STATUS.md; every canonical prompt must also reference the contract it depends on.

### 19.3 Contract evolution

- Additive change under `v: 0`: new command, new channel, new projection, new event kind, new error class. Update the contract file *first*; implementations catch up.
- Breaking change: bump to `v: 1`. The contract file is re-published as `shell-protocol.v1.md`; the `v0` version is archived. Wave-1 has no plan to bump.

---

## 20. Decisions logged

Cross-reference of canonical decisions from STATUS.md (excerpts):

- **2026-04-24** — consolidated orchestrator role to single-Claude coordinator + 9 specialist prompts. Codex demoted to worker. See `doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md`.
- **2026-04-24** — drift correction: AppleScript stub replaced by real Tauri bundle; VirtualDesktopShell landed; four `correction:` commits.
- **2026-04-24** — Web vDesktop stack locked to Next.js + React + Motion + Zustand. See STATUS.md §"Canon update — Web vDesktop stack locked".
- **2026-04-24** — meta-drift discipline: orchestrator prompts beyond the canonical 8 require a named superseding memo (like `HANDOFF-2026-04-24.md`) and an index entry.
- **2026-04-24** — lane-branch policy: Slice A landed on `lane/surface-slice-a-see-agent-work`, not on main. Next lane starts a new branch per `docs/operations/git-policy.md`.

Ongoing decisions flow through STATUS.md under `## Decisions logged`; technical decisions that require doctrine-level lock land here.

---

## 21. Open technical questions

1. **Daemon service install UX.** Launchd on macOS is mostly solved; systemd-user on Linux and Windows Service/Task for Windows need implementation + a pre-install verification path that doesn't require admin on macOS. W3 decision.
2. **Projection snapshot compaction.** Append-only event log grows without bound. When does a `projection.snapshot` event class land in the catalog + compaction run at the bus tail? Target: W6, gated by measured projection recompute cost on a multi-thousand-event log.
3. **BEAM collab frame format.** Wave-1 uses whole-body replacement. When does a delta-frame or CRDT-frame format land? W6+. Contract-level impact: `collab.document.replace` args add an optional `patch` field.
4. **Multi-tab web behavior.** OPFS has exclusive locking; place.org donor uses a SharedWorker as single DB connection point. EMA web runs inside Tauri (single tab per window) in 0.0.5, so this is deferred. Browser-first sync wave (post-W7) needs the SharedWorker pattern.
5. **Hermes driver abstraction.** How many drivers? One per provider (Anthropic, OpenAI, local) or one per driver-family (chat-completion-style, computer-use-style, code-execution-style)? W5 decision, informed by `ema-003-lineage-architecture-synthesis.md §5`.
6. **Backpressure tuning.** `N = 500` per-subscription buffer. Real operator load will probably push this either way. Measure after W3 and revise in the v0 spec.
7. **Replication conflict surface.** W7 needs at least a read-only "branches have diverged" panel; what authoring surface ever resolves a divergence? Likely never — the lease model is the primary divergence prevention.
8. **Auth ceremony + Google Identity.** `16-google-identity-and-browser-access.md` outlines the shape; when does identity.google_link become canonical, and does the browser-surface auth cookie coexist with device-key pairing, or replace it?

---

## 22. Closing

0.0.5 is the **environment skeleton**. This technical design is the shape of that skeleton when it stands up. Every part of it exists, either as code, as a contract, as an architecture doc, or as an open decision. Nothing in it is aspirational beyond the wave boundaries named.

If an engineer can read this doc plus `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md` plus the relevant architecture doc for their lane, they have enough to commit to a change without surprising another lane.

The product succeeds when the technical design is invisible — when an operator inside EMA feels the calm cockpit, not the supervision tree. But the cockpit only stays calm because the tree underneath is this clean.
