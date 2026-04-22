# Step 5 — Collab substrate skeleton (per-object event log, adjacent to control plane)

> **Goal:** stand up a minimal collaboration plane that satisfies P9
> (`DESIGN_PRINCIPLES.md` — "collaboration plane is *adjacent* to the
> control plane, not the same subsystem") without resolving Q2 (where
> collaboration state lives) or Q8 (sync model). Code against the
> cheapest reversible option in `research/COLLAB_PLANE_OPTIONS.md`
> §"Operational transform alternatives → Custom append-only event log
> per object" — a per-object event log keyed by `CollabObjectId` with
> single-writer-per-object pessimistic sequencing, hosted under its
> own OTP supervisor with its own sqlight tables, and an explicit
> migration shape so the substrate can be swapped to `y_ex` (Yjs) or
> `riak_dt` later.
>
> **Depends on:** Step 1 (control-plane skeleton — collab writes
> *reference* `EventBody.ProposalProposed` for promotion handoff;
> permission gating eventually calls back into Step 1's `command_bus`)
> and Step 2 (identity registry — `Visibility` and `author: Actor`
> resolve through `ema_identity/registry`). It is deliberately **not**
> a child of `ema_control_plane/supervisor`: per
> `EMA_V0_0_3_PREP.md` "What changes" #4, "v0.0.3 wires collab as an
> adjacent OTP subtree."
>
> **Open questions held open:**
> - **Q2** (collab state in `event_log` or adjacent). Coded
>   assumption: adjacent. The collab plane has its **own** sqlight
>   tables (`collab_objects`, `collab_ops`) under
>   `ema_collab/persistence`, distinct from Step 1's
>   `ema_control_plane/persistence`. If Q2 resolves "inside
>   `event_log`," the migration is "drop `collab_ops`, write
>   `EventBody.CollabOp(_)` into the main log." This step does not
>   pre-judge.
> - **Q8** (sync model: Yjs / Automerge / pure-BEAM CRDT / event
>   log / hybrid). Coded assumption: per-object event log with
>   pessimistic single-writer per `CollabObjectId` and explicit rebase
>   on stale-base — the option named in
>   `COLLAB_PLANE_OPTIONS.md` §"Custom append-only event log per
>   object" and again in §"Append-only event log per object
>   (Gleam-native)" as "the smallest possible substrate, perfectly
>   aligned with `event_log.ex` already in the daemon." Loses
>   simultaneous co-cursor; gains perfect audit. The migration
>   contracts named in `COLLAB_PLANE_OPTIONS.md` §"Migration story →
>   Pure op-log → CRDT" ("Replay the op-log into the CRDT once;
>   thereafter the CRDT is canonical") are the explicit forward path.
> - **Q1** (agent-as-Member). Coded assumption: `CollabOp.by: Actor`
>   accepts `AgentActor(_)` from Step 2. If Q1 lands "no," the
>   `origin` envelope (per `COLLAB_PLANE_OPTIONS.md` §"Identity /
>   attribution implications" → "the agent op = proposal referencing
>   `object_id+range` shape from `graph/edges/collab.md` requires EMA
>   to wrap the substrate op in an envelope: substrate-op + agent_id
>   + principal + lineage_ref") falls back to `principal:
>   HumanActor(_)` only.
> - **Q9** (replication boundary). Coded assumption: collab objects
>   are local-only. `CollabObject.replication = LocalOnly` is the
>   single shipped variant; `Federated(_)` is typeable but rejected
>   at write time with `Error(Deferred("Q9-pending"))`.
> - **Q10** (permission gating). Coded assumption: `propose/2` checks
>   `Visibility` against the calling `Actor` via a stub
>   `gate.check/2`; if Step 2's `policy_evaluator` is registered, it
>   delegates, otherwise it allows. The seam is in one function so
>   wiring lands later.

## What this step produces

Concrete Gleam modules under `apps/ema/src/ema_collab/`:

- `ids.gleam` — opaque `CollabObjectId`, `CollabOpId`, `OriginId`.
- `object.gleam` — `CollabObject`, `ObjectKind`, `Replication`.
- `op.gleam` — `CollabOp`, `OpBody`, `Envelope`, `RebaseError`.
- `event_log.gleam` — *per-object* event-log actor; one `Subject` per
  open object, registered in `object_registry`.
- `object_registry.gleam` — `Dict(CollabObjectId, Subject(EventLogMsg))`
  actor; spawns per-object writers on demand.
- `persistence.gleam` — sqlight handle owner; tables `collab_objects`,
  `collab_ops`. Distinct from Step 1's persistence.
- `gate.gleam` — `check(actor, object) -> Allowance` stub seam for
  Q10.
- `migration.gleam` — `replay_into/2` skeleton: takes a target
  substrate tag (`YjsTarget | RiakDtTarget | HybridTarget`) and
  iterates the op log; the actual substrate calls are `todo` so the
  shape is forced into existence at compile time.
- `bridge_to_control_plane.gleam` — when an op carries
  `OpBody.Promote(_)`, writes `EventBody.ProposalProposed` into
  Step 1's `event_log` via `command_bus.route`.
- `supervisor.gleam` — `static_supervisor`, `RestForOne`.

Plus tests under `apps/ema/test/ema_collab/`:

- `single_writer_test.gleam`
- `rebase_on_stale_base_test.gleam`
- `replay_round_trip_test.gleam`
- `migration_shape_test.gleam`
- `bridge_to_control_plane_test.gleam`
- `federated_deferred_test.gleam`
- `op_property_test.gleam`

## Type sketches

```gleam
import gleam/option.{type Option}
import gleam/erlang/process.{type Subject}
import gleam/otp/actor
import ema_control_plane/ids.{type ProjectId, type MemberId}
import ema_control_plane/event.{type Actor}

pub opaque type CollabObjectId { CollabObjectId(String) }
pub opaque type CollabOpId { CollabOpId(String) }
pub opaque type OriginId { OriginId(String) }

pub type ObjectKind {
  WikiPage
  CanvasDoc
  Thread
  Blueprint
  InlinePrompt
}

pub type Replication {
  LocalOnly
  Federated(peers: List(String))
}

pub type Visibility {
  ProjectScoped(project: ProjectId)
  Personal(member: MemberId)
  Public
}

pub type CollabObject {
  CollabObject(
    id: CollabObjectId,
    kind: ObjectKind,
    project: ProjectId,
    visibility: Visibility,
    replication: Replication,
    head_seq: Int,
  )
}

pub type Range { Range(start: Int, end: Int) }

pub type OpBody {
  Insert(at: Int, text: String)
  Delete(range: Range)
  Replace(range: Range, text: String)
  Annotate(range: Range, key: String, value: String)
  Promote(target_kind: ObjectKind)
}

pub type Envelope {
  Envelope(
    by: Actor,
    principal: Option(MemberId),
    origin: OriginId,
    lineage_ref: Option(String),
  )
}

pub type CollabOp {
  CollabOp(
    id: CollabOpId,
    object: CollabObjectId,
    base_seq: Int,
    seq: Int,
    body: OpBody,
    envelope: Envelope,
    at_ms: Int,
  )
}

pub type RebaseError {
  StaleBase(have: Int, head: Int)
  GateDenied(reason: String)
  Deferred(reason: String)
}

pub type EventLogMsg {
  Propose(
    op: CollabOp,
    reply_to: Subject(Result(Int, RebaseError)),
  )
  RangeRead(
    from_seq: Int,
    reply_to: Subject(List(CollabOp)),
  )
  Snapshot(reply_to: Subject(CollabObject))
}

pub type RegistryMsg {
  OpenObject(
    id: CollabObjectId,
    reply_to: Subject(Subject(EventLogMsg)),
  )
  ListOpen(reply_to: Subject(List(CollabObjectId)))
}

pub type MigrationTarget { YjsTarget RiakDtTarget HybridTarget }

pub fn start_object_registry()
  -> Result(Subject(RegistryMsg), actor.StartError)
```

## Module layout

```
apps/ema/src/
└── ema_collab/
    ├── ids.gleam                     -- (no Elixir analog)
    ├── object.gleam                  -- (no Elixir analog)
    ├── op.gleam                      -- (no Elixir analog;
    │                                    envelope shape from
    │                                    research/COLLAB_PLANE_OPTIONS.md
    │                                    §"Identity / attribution implications")
    ├── event_log.gleam               -- shape mirrors
    │                                    lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/event_log.ex
    │                                    (single-writer discipline, append + range read)
    │                                    but keyed *per object*
    ├── object_registry.gleam         -- (no Elixir analog)
    ├── persistence.gleam             -- shape mirrors
    │                                    lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/persistence.ex
    │                                    distinct sqlight handle, distinct tables
    ├── gate.gleam                    -- (no Elixir analog; Q10 seam)
    ├── migration.gleam               -- (no Elixir analog)
    ├── bridge_to_control_plane.gleam -- (no Elixir analog)
    └── supervisor.gleam              -- shape mirrors
                                         lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/supervisor.ex
                                         (rest_for_one over persistence → registry)
```

There is no Elixir precedent for a collab-plane subsystem — the
Elixir tree's collab story today is filesystem markdown under
`workspace/shared/` plus Discord scrollback. Step 5 is the typed
adjacent-substrate analog declared by `EMA_V0_0_3_PREP.md`
"What changes in the rewrite" #4. The persistence + writer + registry
*shape* is borrowed from
`git show origin/lineage-original-elixir-ema:code/daemon/lib/ema/control_plane/{persistence,event_log,supervisor}.ex`,
which is verifiable but the contents are new.

## Supervision tree fragment

```text
root_supervisor (one_for_one)
├── ema_control_plane/supervisor (rest_for_one)   -- Step 1
├── ema_identity/supervisor (rest_for_one)        -- Step 2
├── ema_drivers/supervisor (one_for_one)          -- Step 3
├── ema_sessions/supervisor (rest_for_one)        -- Step 4
├── ema_execution/execution_supervisor            -- Step 4
├── ema_babysitter/supervisor (one_for_one)       -- Step 4
└── ema_collab/supervisor (rest_for_one)
    ├── persistence              -- own sqlight handle, own tables
    ├── object_registry          -- spawns per-object event_log children
    ├── (dynamic) event_log per CollabObjectId
    ├── gate                     -- stub Q10 seam
    └── bridge_to_control_plane  -- forwards OpBody.Promote → Step 1's command_bus
```

`rest_for_one` is deliberate: a crashed `persistence` restarts the
registry so no per-object writer holds a stale handle. Per-object
`event_log` children are dynamic (one per open object); the
`object_registry` is the parent that supervises them.

## Acceptance criteria (testable)

1. `object_registry.OpenObject(id)` returns a `Subject(EventLogMsg)`
   and a second `OpenObject(id)` for the same `id` returns the
   *same* Subject (single writer per object).
2. `Propose(op)` with `op.base_seq == head_seq` returns `Ok(seq)`
   with `seq == head_seq + 1`; `Propose(op)` with
   `op.base_seq < head_seq` returns `Error(StaleBase(have, head))`
   and does **not** append.
3. After N `Propose` calls on object `o`, `RangeRead(from_seq: 0)`
   returns the N ops in monotonically increasing `seq` order,
   byte-for-byte equal to what was written (round-trip through
   sqlight).
4. `Propose(op)` carrying `OpBody.Promote(_)` causes
   `bridge_to_control_plane` to call `command_bus.route` on Step 1's
   bus with a `StartExecution` (or equivalent) command; the call is
   verified with a fake bus.
5. `CollabObject.replication = Federated(_)` causes `Propose(op)` to
   return `Error(Deferred("Q9-pending"))` and does not write.
6. `migration.replay_into(YjsTarget, source: object_id)` compiles —
   the function exists with the right signature; the body is `todo`
   for now but the *shape* is forced into the supervision tree's
   public surface.
7. Killing the per-object `event_log` actor for `id` causes
   `object_registry` to spawn a fresh writer on the next
   `OpenObject(id)` call, and `RangeRead(from_seq: 0)` returns the
   full prior history (replay from sqlight).
8. The compile-fail fixture
   `test/typecheck/collab_id_swap.gleam` does not compile when
   `CollabObjectId` is passed where `ProjectId` is expected (extends
   Step 1's gate #4 fixture).
9. Permission stub: with `gate` registered as "deny all,"
   `Propose(_)` returns `Error(GateDenied(_))`; with `gate` as
   "allow all" (default), it returns `Ok(_)`.

## Property tests (gleam_qcheck)

1. **Single-writer linearizability.** For any interleaving of
   `Propose` calls against a single `CollabObjectId`, the resulting
   `seq` values are strictly increasing and contiguous, and every
   accepted op satisfies `op.base_seq + 1 == op.seq`. No two ops
   share a `seq`.
2. **Replay equals append.** For any list of `Propose` calls that
   return `Ok(_)`, `RangeRead(from_seq: 0)` reconstructed across a
   simulated process restart yields the same sequence of `CollabOp`
   records (per-object analog of Step 1's "Replay equals append").
3. **Rebase totality.** For every generated `CollabOp`, exactly one
   of `{Ok(seq), Error(StaleBase(_, _)), Error(GateDenied(_)),
   Error(Deferred(_))}` is returned by `Propose` — never a crash,
   never a silent drop. (Maps to the totality property pattern from
   Step 1's `command_bus`.)

## What gets stubbed (and why)

- **Yjs / Automerge / Riak DT migration body** — `migration.gleam`
  has the typed `replay_into(target, source)` signature but the
  per-target dispatch is `todo`. The point of Step 5 is to *force the
  shape into existence* so the substrate swap named in
  `COLLAB_PLANE_OPTIONS.md` §"Migration story → Pure op-log → CRDT"
  is one module deep, not a rewrite. Stub: function exists, three
  variants compile, no body.
- **CRDT-shaped concurrent edits** — explicit non-goal per
  `COLLAB_PLANE_OPTIONS.md` §"Append-only event log per object"
  ("kills simultaneous editing — explicitly named as a tradeoff in
  `semantic-layer.md` decision pressure §5"). Stub: clients see
  `StaleBase` and rebase manually.
- **`Federated(_)` replication** — Q9 deferred. Stub: typeable,
  rejected at runtime with `Deferred`.
- **Permission gating against Step 2** — Q10 deferred. Stub:
  `gate.check/2` allows by default; the seam exists for later
  delegation to `ema_identity/policy_evaluator`.
- **Promotion-to-Blueprint full pipeline** — Step 5 only forwards
  `OpBody.Promote(_)` to Step 1's `command_bus`; the semantic-layer
  `Promotion` actor (`research/parts/semantic-layer.md` §"Actor
  sketch") that turns Drafts into Canonical nodes is a separate
  later step.
- **Surface integration** — Step 5 ships **no** HTTP/WS endpoint;
  reads/writes happen via the typed `Subject(EventLogMsg)` only.
  Surface exposure is Step 6's job, per P1 (surfaces don't own
  state).
- **Discord/Threads bridge** — Q6 deferred. `ObjectKind.Thread` is
  typeable; no bridge ships.

## Cross-references

- Brief: `content/briefs/semantic-layer.md`,
  `content/briefs/shared-workspace.md`
- Part mapping: `research/parts/semantic-layer.md` §"Open questions
  specific to Gleam mapping" Q2/Q8
- Edge: `graph/edges/collab.md` ("Daemon is the auth/permission
  gateway")
- Glossary: "Wiki", "Blueprint", "Thread", "Inline prompt"
- Howto: `howto/extract-doctrine-from-a-legacy-branch.md` (when the
  Q8 pick lands and substrate swap begins).
- Prep doc: `EMA_V0_0_3_PREP.md` "What changes" #4
  ("Collaboration-state subsystem is adjacent to event_log, not
  inside it").
- Survey: `research/COLLAB_PLANE_OPTIONS.md` §"Custom append-only
  event log per object", §"Append-only event log per object
  (Gleam-native)", §"Migration story → Pure op-log → CRDT",
  §"Identity / attribution implications", §"Permission gating
  implications".
- Design principles: P9 (collab adjacent), P1 (authority before
  surface), P4 (identity layers stay separate — `CollabObjectId`
  distinct from `WorkspaceArtifactId`).
- Elixir originals (verified for *shape*, not contents):
  `git show origin/lineage-original-elixir-ema:code/daemon/lib/ema/control_plane/{persistence,event_log,supervisor}.ex`.
- `OPEN_QUESTIONS.md` Q1, Q2, Q8, Q9, Q10.
