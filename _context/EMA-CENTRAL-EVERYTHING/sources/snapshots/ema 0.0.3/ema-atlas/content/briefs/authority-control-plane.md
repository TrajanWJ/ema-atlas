# Authority / Control Plane

## The frame

Authority is the part of EMA that refuses to leak. It is the bookkeeping
layer that decides what counts as having happened, who is allowed to make
something happen next, and where the canonical record of both lives. The
canonical rule is short and load-bearing: **EMA owns truth, Hermes owns
execution, surfaces do not own state.** Every other part of the system
either feeds the control plane, reads from it, or is downstream of a
decision it made. When a surface forgets this and starts holding state of
its own, the system silently bifurcates and reconciliation becomes a
forensic exercise rather than a routine read.

What is already real is not a sketch. The Elixir daemon at
`codebase-ema/code/ema/daemon/lib/ema/control_plane/` already contains a
running command bus, an append-only event log, an execution supervisor, a
persistence layer, and an incidents module with its own authority,
executor, and policy split. There is a migration that creates the
control-plane tables and there are persisted JSON snapshots for state and
incidents. The shape exists. The open question is not whether EMA has a
control plane — it does — but how much of the rest of the product is
forced to pass through it before being considered real, and how loud the
plane is allowed to be when it intervenes.

## What's already true

- A command-bus and dispatch model exists in
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/command.ex` and
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/dispatch_reconciler.ex`.
- The append-only authority record runs through
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/event_log.ex` with
  replay support in
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/replay.ex`.
- Incident handling is already split into authority / executor / policy at
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/incidents/authority.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/incidents/executor.ex`,
  and `codebase-ema/code/ema/daemon/lib/ema/control_plane/incidents/policy.ex`.
- Persistence and tabling are real:
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/persistence.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/store.ex`, and the
  migration `codebase-ema/code/ema/daemon/priv/repo/migrations/20260406083405_create_control_plane_tables.exs`.
- A web channel and HTTP controller already expose the plane:
  `codebase-ema/code/ema/daemon/lib/ema_web/channels/control_plane_channel.ex`
  and `codebase-ema/code/ema/daemon/lib/ema_web/controllers/control_plane_controller.ex`,
  with tests in `codebase-ema/code/ema/daemon/test/ema_web/`.

## What's still open

- **Q1** — until agent identities are first-class members of Org/Space,
  every command on the bus has to encode "no scope" assumptions, and
  attribution on incidents stays approximate.
- **Q2** — whether collaboration state lives inside `event_log` or beside
  it determines whether the control plane is also the document substrate
  or just a sibling of it.
- **Q5** — the harness/driver contract surface decides what an "execution"
  event is allowed to look like as it lands in the plane, which in turn
  caps how strict authority can be.
- **Q9** — replication boundary is deliberately deferred, but every
  authority decision quietly assumes single-writer semantics that will
  have to be re-explained the moment a second machine joins.
- **Q10** — org/space permissions versus runtime/tool permissions: if these
  are not the same surface, the control plane has two notions of "allowed"
  and they will drift.

## The three futures, expanded

### Authority as Command Citadel (operator-cathedral)

Citadel-mode authority means every consequential move — start a run,
approve a plan, change scope, retire a workstream — emits a command,
travels the bus, lands as an immutable event, and is replayable. Surfaces
become read-projections of the plane, never originators. The product
feels like a Bloomberg terminal for project work: gated, traceable, and
honest about what is happening to whom.

**What this would force you to build first**
- A canonical command vocabulary covering at minimum runs, approvals,
  scope changes, and incidents — extending `command.ex` rather than
  surface-specific verbs.
- A surface-side projection layer with no local writes, so HQ and
  Launchpad can only render the plane.
- An audit explorer route built directly on `event_log.ex` and
  `replay.ex` so every consequential event is one click from its origin.

**What this would force you to give up**
- Cheap surface improvisation — sketches, drafts, and ad-hoc notes either
  pass through the plane or live outside the system entirely.
- The ability to ship a surface feature ahead of its authority semantics;
  the plane becomes a critical-path dependency for almost every change.

**Smallest provable slice (2 weeks):** wire one consequential action — a
"Promote Plan" approval — end-to-end through `command.ex`, into
`event_log.ex`, persisted via `persistence.ex`, projected into a single
HQ widget that can replay the decision and show its lineage. No surface
holds the promoted state.

### Authority as Embedded Truth (living-workspace)

Embedded-truth authority hides the citadel inside the workspace itself.
Threads, wiki nodes, plans, and workstreams *are* the authority surface,
and the control plane is a discipline they observe rather than a place
users visit. Approvals look like reactions on a thread, scope changes
look like edits on a plan, and the audit log is something you can scroll
into but rarely have to.

**What this would force you to build first**
- A binding between collab objects and `event_log.ex` so that authoring
  in a thread is also writing to the plane.
- A subtle but consistent visual grammar for "this action was load-
  bearing" so users can still tell when something crossed the authority
  line.
- A reconciler — extending `dispatch_reconciler.ex` — that detects when a
  surface edit *should* have produced a control-plane event but did not.

**What this would force you to give up**
- Strict separability between "workspace artifact" and "command" — the
  product loses some explanatory clarity in exchange for fluidity.
- The ability to say "no surface owns state" with a straight face; you
  are accepting that some state lives in collab objects with strong
  conventions instead of in a separate plane.

**Smallest provable slice (2 weeks):** make a wiki node *be* a workstream
record. Editing the node emits commands into `command.ex`; the rendered
view shows authority status (active, retired, gated) without ever leaving
the wiki. One node, one workstream, one full lifecycle.

### Authority as Lease-Based Negotiation (mesh-commonwealth)

Lease-based authority assumes more than one machine, daemon, or peer can
hold the pen — but never simultaneously, and never without a visible
handoff. The plane stops being a single writer and becomes a coordination
protocol over leases, with `host_transition_log.ex` already hinting at
this shape.

**What this would force you to build first**
- An explicit lease object on top of `event_log.ex` — who holds write
  authority for which scope, until when, with what fallback.
- A handoff protocol that extends `host_transition_log.ex` from machine
  transitions to peer transitions.
- A user-visible "who can decide right now" indicator on every gated
  surface, because invisible mesh authority is indistinguishable from a
  bug.

**What this would force you to give up**
- The simplicity of single-writer semantics; every command needs to know
  whether the local node is currently the holder.
- Fast iteration on the plane shape — once leases ship, they constrain
  every later authority decision because peers in the field will be
  running the old contract.

**Smallest provable slice (2 weeks):** two daemons, one workstream, one
lease. A user can hand authority for a single workstream from machine A
to machine B and back, with the transition recorded in
`host_transition_log.ex` and rendered in HQ. Everything else about the
mesh stays out of scope.

## Decision pressure

1. **Surfaces project vs surfaces author.** Project: HQ stays simple,
   plane stays canonical, but every surface feature waits on a command.
   Author: surfaces ship faster, but the "no surface owns state" rule
   becomes aspirational.
2. **Wide command vocabulary vs narrow command vocabulary.** Wide:
   richer audit, more semantic events, slower to extend. Narrow:
   easier to evolve, but most events end up as opaque blobs.
3. **Incidents as first-class vs incidents as a tag on events.** First-
   class (current `incidents/` split) keeps escalation legible but
   doubles the schema; tag-based collapses the model but loses the
   authority/executor/policy separation.
4. **Replay-driven UI vs snapshot-driven UI.** Replay: every view is
   correct by construction, but cold-load is expensive. Snapshot: fast
   reads from `store.ex`, but divergence between snapshot and log is its
   own bug class.
5. **Authority known at write time vs authority resolved at read time.**
   Write-time: simpler reads, harder schema migrations when permissions
   change. Read-time: more flexible, more compute on every projection.
6. **Plane addressable from outside the daemon vs daemon-internal only.**
   External (current `control_plane_channel.ex`, `control_plane_controller.ex`):
   surfaces and peers can integrate, but you ship a public contract.
   Internal: contract stays soft, but every surface needs an in-process
   adapter.

## Read next

- `graph/nodes/codebase-ema.qmd`
- `graph/nodes/lineage-original-elixir-ema.qmd`
- `graph/edges/authority.md`
- `graph/edges/identity.md`
- `graph/edges/recovery.md`
- `codebase-ema/code/ema/docs/EMA-MASTER-SPEC.md`
- `codebase-ema/code/ema/docs/AUTH_DESIGN.md`
- `codebase-ema/code/ema/docs/REVIEW-GOVERNANCE-QUEUE-SPEC.md`
- `codebase-ema/code/ema/docs/daemon-wiki/GOVERNANCE.md`
- `codebase-ema/code/ema/docs/daemon-wiki/DISPATCH.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/07-TRACKS/TRACK-B-CONTROL-PLANE-SEED.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/04-CANON/SOURCE-OF-TRUTH-HIERARCHY.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT.md`
