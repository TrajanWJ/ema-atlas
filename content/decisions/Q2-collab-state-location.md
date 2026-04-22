# Decision matrix — Q2 (collaboration state location / substrate)

Per-question decision matrix for resolving Q2 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> A matrix forces you to write the cost on each option **before** you
> pick. The point is that you should be able to read the matrix back
> later and see why the chosen option won — including in cases where
> the choice turns out wrong.

## Question

`Q2` — `Is collaboration state in event_log or adjacent?`

(Restated verbatim from
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q2.)

The question's stated **blast radius** is "entire docs/wiki/canvas
subsystem, sync model, CRDT-vs-event-log choice, agent-as-editor
semantics." It surfaces in
[`graph/edges/collab.md`](../../graph/edges/collab.md) ("Live
collaboration objects need their own sync substrate, separate from
`control_plane/event_log`. Daemon is the auth/permission gateway"),
in `02-project-transfer-brief.md` §6/§9/§12 q1-q2, in
`04-agent-orchestration-and-shared-workspace-briefing.md` §6, and in
the `ULTIMATE-WIKI-ARCHITECTURE.qmd` design notes.

The pressure that makes Q2 a Q-with-options rather than a Q-with-
direction is `EMA_V0_0_3_PREP.md` "What changes" #4: "v0.0.3 wires
collab as an adjacent OTP subtree." Step 5
([`research/build-steps/05-collab-substrate-skeleton.md`](../../research/build-steps/05-collab-substrate-skeleton.md))
already codes against the cheapest reversible option — a per-object
event log under `ema_collab/persistence` with its own sqlight tables
distinct from `ema_control_plane/persistence`. Q2 picks whether that
default is the long-term substrate or a placeholder for one of the
alternatives surveyed in
[`research/COLLAB_PLANE_OPTIONS.md`](../../research/COLLAB_PLANE_OPTIONS.md).

The four options below are the live shapes the survey enumerates as
plausible BEAM-side substrates. Q8 (sync model) is a closely related
sub-question; this matrix treats Q8 as downstream — Q2 is the
*location and shape* of collab state, Q8 is the *concurrency
discipline* on top of whatever Q2 picks.

## Options being weighed

| Option | Short name | One-line description |
|---|---|---|
| Option A | `per-object-event-log` | Per-object append-only event log keyed by `CollabObjectId`, single-writer pessimistic sequencing per object, hosted under its own `ema_collab/supervisor` adjacent to `ema_control_plane`, with its own sqlight tables (`collab_objects`, `collab_ops`). The default Step 5 codes against, named in `COLLAB_PLANE_OPTIONS.md` §"Custom append-only event log per object" and §"Append-only event log per object (Gleam-native)". |
| Option B | `y_ex-CRDT` | Yjs-via-Rustler-NIF (`y_ex` 0.10.5, MIT, satoren) hosted in an Elixir module callable from Gleam. `YText`/`YMap`/`YArray` for collab objects; daemon serialises updates and stores them in `event_log` for audit; rich editor-binding ecosystem (ProseMirror, TipTap, CodeMirror) on the surface side. |
| Option C | `riak-dt-BEAM-native` | `basho/riak_dt` via Erlang FFI from Gleam. Native-BEAM CRDT primitives (ORSWOT, Map, registers, counters) for the small structured pieces; rich text falls back to a separate substrate. Daemon hosts the CRDT in-process; per-op auth gating is a Gleam function call before the type. |
| Option D | `hybrid-per-object-policy` | Each `ObjectKind` declares its convergence policy in a registry; the daemon routes ops to the right substrate. Wiki prose → Yjs YText with a ProseMirror binding; Threads → append-only event log; small structured metadata → Riak DT or DeltaCrdt-style maps. The "slot-by-content-shape" + "per-object policy" variants from `COLLAB_PLANE_OPTIONS.md` §"Hybrid approaches", folded together. |

## Criteria

For each criterion, score each option `+ / 0 / – / blocker`. Add a
one-line "why" inline. Don't average — the criteria are not
interchangeable.

| Criterion | Why it matters | A `per-object-event-log` | B `y_ex-CRDT` | C `riak-dt-BEAM-native` | D `hybrid-per-object-policy` |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state; daemon is the auth/permission gateway per `graph/edges/collab.md`. | + (daemon owns the writer outright; gating is one function call before append) | 0 (Yjs ops are opaque binary updates; gating means "may this client sync?" not "what's in the op" unless daemon parses server-side) | + (in-process CRDT; gating is a Gleam call before the type) | 0 (gating story is per-substrate; the registry has to compose three answers) |
| Compatible with Q-deps if open | Q1 (agent-as-Member), Q3 (Project↔Space), Q8 (sync model), Q9 (replication), Q10 (perms) all open. | + (Step 5 already codes the seams: `Envelope.by: Actor`, `Visibility`, `Replication.LocalOnly` default, `gate.check/2` stub) | – (Yjs `clientID` is 32-bit; mapping from `MemberId` to `clientID` needs a registry; if Q1 lands "no first-class agents," every historical op needs re-attribution per `COLLAB_PLANE_OPTIONS.md` §"Identity / attribution implications") | 0 (no inherent author field; attribution layered in payload — survives any Q1 outcome but loses the substrate's native attribution story) | – (compounds: each substrate has its own Q1/Q9/Q10 dependency surface; resolving any open Q forces a per-substrate fix) |
| Smallest provable slice | Can we exercise it in a 2-week vertical? | + (Step 5 ships nine modules + seven tests; `single_writer_test`, `rebase_on_stale_base_test`, `replay_round_trip_test`, etc.) | – (Rustler NIF + Elixir interop layer + WebSocket bridge + editor binding before any feature) | 0 (Erlang FFI is cheap; but no rich-text type means a parallel substrate for prose anyway) | – (three substrates, three test harnesses, plus a registry actor — the most expensive path) |
| Reversible | Can we migrate off it cleanly later? | + (per `COLLAB_PLANE_OPTIONS.md` §"Migration story → Pure op-log → CRDT": "Replay the op-log into the CRDT once; thereafter the CRDT is canonical." Step 5 already exposes `migration.replay_into(YjsTarget \| RiakDtTarget \| HybridTarget, source)`) | – (CRDT-to-event-log migration loses simultaneous-edit history and per-character authorship; CRDT-to-CRDT is feasible but Yjs's flat update log doesn't map onto Automerge's named commits) | 0 (KV-shaped; iterate-and-reinsert into another KV CRDT is trivial; rich-text substrate beneath is its own migration) | – (whatever this turns into has three migration shapes per object kind; the registry itself is sticky) |
| Gleam-native | Can we express it in typed Gleam without FFI escapes? | + (Step 5 is pure Gleam; sqlight via `sqlight` Hex package; no FFI required) | – (Rustler NIF + Elixir wrapper module; Gleam calls into Elixir which calls into Rust) | 0 (Erlang FFI via `@external`; clean per `research/parts/mesh-replication.md` "FFI to Riak DT (`:riak_dt`)" framing, but the data model is Erlang-shaped) | – (combines the FFI burden of B + C with a registry actor on top) |
| Auditability | Does it produce control-plane-visible records? | + (every op is a row in `collab_ops`; `bridge_to_control_plane.gleam` forwards `OpBody.Promote(_)` into Step 1's `event_log` as `EventBody.ProposalProposed`) | 0 (Yjs updates are opaque; daemon must serialise + store separately; lineage refs sit in `origin` field) | + (in-process state plus EMA-supplied envelope; audit is a Gleam record) | 0 (audit story is the union of three substrates' stories; control-plane visibility requires a uniform projection) |
| Tests writable in v0.0.3 | gleam_qcheck properties + example tests | + (Step 5 lists three property tests: single-writer linearizability, replay-equals-append, rebase totality — all native gleam_qcheck) | 0 (Yjs has its own test discipline; EMA tests target the envelope; concurrency replay tests require a JS-side fixture or an `y_ex` harness) | 0 (Riak DT ships QuickCheck tests upstream; EMA tests target the envelope) | – (N substrates → N test harnesses + envelope tests for cross-substrate references — the largest test surface) |
| Identity-model-clean (Q1) | Doesn't constrain Q1 resolution. | + (`Envelope.by: Actor` accepts any Q1 resolution; principal fallback is one-line) | – (Yjs `clientID == agent_id` per `COLLAB_PLANE_OPTIONS.md` is the load-bearing assumption that breaks under Q1=no) | + (no native author field means no Q1 lock-in either way) | 0 (depends on which substrate handles which kind) |
| P9 compliance (collab adjacent) | Per `DESIGN_PRINCIPLES.md` P9 + `EMA_V0_0_3_PREP.md` #4: collab is adjacent to control plane, not the same subsystem. | + (Step 5 explicitly NOT a child of `ema_control_plane/supervisor`; own sqlight handle, own tables) | + (substrate is its own NIF + Elixir process; adjacency holds by construction) | + (in-process but in its own supervisor subtree) | + (registry is its own subtree; substrates beneath) |
| P4 compliance (identity layers stay separate) | `CollabObjectId` distinct from `WorkspaceArtifactId` distinct from `ExecutionId`. | + (Step 5 ships compile-fail fixture `collab_id_swap.gleam`) | 0 (Yjs `clientID` is a separate identity layer that EMA must map to/from `MemberId`; the mapping is the failure mode) | + (CRDT keys are EMA-supplied) | 0 (substrate-specific identity layers must each be insulated) |
| Permission gating (Q10 surface) | Per `graph/edges/collab.md`: "Daemon is the auth/permission gateway." | + (per `COLLAB_PLANE_OPTIONS.md` §"Permission gating implications": "gating is checked before append. Closest fit to the existing `event_log.ex` discipline") | 0 (per-field permissions require server-side parse of opaque updates, slower than blob relay) | + (function call before in-process op — cleanest per-op authorisation surface) | 0 (composition of three gating stories; per-substrate semantics) |
| Q9 readiness | `Replication.LocalOnly` is the v0.0.3 default; `Federated(_)` is typeable but rejected. | + (Step 5 ships `Replication.LocalOnly`/`Federated(_)`; `federated_deferred_test.gleam` asserts the rejection) | 0 (Yjs has natural offline-first / mesh story but introduces it before single-node clarity — collides with P6) | – (DeltaCrdt's anti-entropy gossip assumes peers know each other; "neighbour set is load-bearing" per `COLLAB_PLANE_OPTIONS.md` — Riak DT is state-based and similar pressure applies) | 0 (each substrate has its own replication story; D inherits all three) |
| Rich-text fidelity | Wiki "Claude.ai-style" UI inspiration in 05- doc; ProseMirror/TipTap/CodeMirror bindings expected. | – (per Step 5: "kills simultaneous editing — explicitly named as a tradeoff in `semantic-layer.md` decision pressure §5") | + (Yjs is the dominant rich-text CRDT with the largest binding ecosystem) | – (no sequence/text type; rich text "poor" per `COLLAB_PLANE_OPTIONS.md`) | + (covered by the Yjs slot for prose) |
| Build-step alignment | Step 5 currently codes the assumption (per-object event log). | + (no change to Step 5) | – (Step 5's `event_log.gleam` per-object actor is replaced by a NIF mediation layer; `single_writer_test` collapses into a Yjs convergence test; `migration.gleam` flips direction) | – (Step 5's prose path needs a parallel substrate; the per-object event log shrinks to "structured-only") | – (Step 5 grows a registry actor; `object_kind` becomes a routing key; tests fork three ways) |

## Costs and bets

For each option, two bullets each.

### Option A — `per-object-event-log`
- **Bet:** The wiki "feel" can be achieved with sub-second
  turn-taking instead of true co-cursor. The substrate that ships
  fastest, audits cleanest, and forces no Q-dep resolutions is the
  one whose op log can be replayed into a CRDT *later* if the
  product evidence demands it. Per `COLLAB_PLANE_OPTIONS.md`
  §"Migration story → Pure op-log → CRDT" the forward path is one
  module deep (`migration.replay_into/2`), not a rewrite.
- **Cost:** Loses simultaneous editing. Operators see `StaleBase`
  on rebase and must merge manually. The "Google Docs feel" line in
  the brief is downgraded to "the editor degrades to a single
  active writer at a time." If real product usage shows
  multi-cursor as a hard requirement, the migration to Yjs is
  cheap mechanically but expensive culturally — every operator who
  internalised "rebase on stale" has to re-learn live merging.

### Option B — `y_ex-CRDT`
- **Bet:** Collaborative rich text is the load-bearing collab
  feature, and the editor-binding ecosystem on the JS side
  (ProseMirror, TipTap, CodeMirror) is a moat that no BEAM-native
  solution will catch up to. Buying it via `y_ex` lets EMA inherit
  that ecosystem at the cost of a Rustler NIF and an Elixir mediation
  layer.
- **Cost:** Per `COLLAB_PLANE_OPTIONS.md` §"Each option's EMA-fit
  story → Yjs via `y_ex`": "introduces a Rustler NIF and a
  non-Gleam-native data model; daemon must serialize Yjs updates
  and store them in `event_log` for audit." The `clientID`
  re-attribution risk under Q1=no is concrete: "if Q1 lands 'agents
  not first-class' after EMA has shipped Yjs with `clientID ==
  agent_id`, every historical op needs re-attribution to a human
  principal." Field-level permissions require server-side Yjs
  parsing, which is slower than blob relay.

### Option C — `riak-dt-BEAM-native`
- **Bet:** The collaboration plane's *high-value* state is small
  and structured (presence sets, mention counters, capability
  flags, thread membership, agent attribution maps), not rich
  prose. Riak DT solves the high-value subset natively in BEAM with
  no FFI to Rust or JS. Prose is then either deferred ("the wiki
  is markdown turn-taking for v0.0.3") or handled by a separate,
  smaller substrate.
- **Cost:** Per `COLLAB_PLANE_OPTIONS.md` §"Each option's EMA-fit
  story → Riak DT": "stale Hex package, no sequence/text type, no
  native rich-text story. Picking it forces an explicit second
  substrate for prose and makes 'wiki page' a composite object."
  Hex package last updated Feb 2016 [UNVERIFIED — taken from search
  snippet, see survey provenance]. Picking C without a prose
  substrate is effectively a deferral of the wiki feature; picking
  C *with* a prose substrate collapses into D.

### Option D — `hybrid-per-object-policy`
- **Bet:** No single substrate fits all of wiki / canvas / threads
  / blueprint / inline-prompt. Per
  `research/parts/mesh-replication.md` §"Workspace as Replica-
  Friendly Substrate" (referenced in `COLLAB_PLANE_OPTIONS.md`):
  "free-form notes, drafts" CRDT; "handoffs, plans, status"
  arbitrated. Encode that policy explicitly in a per-`ObjectKind`
  registry and let the daemon route. Most faithful to the brief's
  actual demands.
- **Cost:** Most expensive design. Three substrates means three
  audit stories, three permission-gating stories, three
  identity-attribution stories, and a registry that is itself a
  new object type with its own migration story. Per
  `COLLAB_PLANE_OPTIONS.md` §"Slot for rich text vs structured docs
  separately": "three substrates to maintain, three audit stories
  to reconcile." Cross-substrate references (a wiki page YText
  referencing a thread event whose ID lives in a Riak DT set)
  become first-class and need their own envelope type. The
  registry itself becomes a new authority surface.

## Open questions this decision creates

Resolving Q2 almost always opens new questions. Candidates the matrix
surfaces:

- **Q2.a — Op-envelope canonical shape.** Whatever Q2 picks, the
  `Envelope` (substrate-op + agent_id + principal + lineage_ref) per
  `COLLAB_PLANE_OPTIONS.md` §"Identity / attribution implications" is
  the seam to Q1. What fields are mandatory? Where does
  `lineage_ref: Option(String)` resolve to (event_log row id?
  execution_id? both)?
- **Q2.b — Promotion-to-event-log shape.** Step 5's
  `bridge_to_control_plane.gleam` forwards `OpBody.Promote(_)` as
  `EventBody.ProposalProposed`. Is that the only collab → control
  bridge, or do other op kinds need to surface (e.g. `Annotate(_, _,
  _)` for canonical-block decisions)?
- **Q2.c — Q8 narrowing.** Q8 (sync model) is named in
  `OPEN_QUESTIONS.md` as "subset of Q2." Under A, Q8 collapses to
  "single-writer pessimistic per object." Under B, Q8 collapses to
  Yjs's CRDT semantics. Under C, Q8 is per-CRDT-type. Under D, Q8
  is per-object-kind. Q2's resolution narrows but does not fully
  close Q8.
- **Q2.d — Co-cursor product requirement.** If A is chosen, when
  does multi-cursor become a hard product blocker? Need a written
  threshold so the migration to a CRDT substrate has a trigger.
- **Q2.e — Surface contract for collab subscriptions.** Step 5
  ships no HTTP/WS endpoint. Surfaces consume collab state via the
  typed `Subject(EventLogMsg)` only. The HTTP/WS shape is a
  separate question downstream of Q2.
- **Q2.f — Wiki body storage under semantic layer.** Per
  `research/parts/semantic-layer.md` §"Open questions": "if collab
  state moves into `event_log`, then `Node.body` has to become a
  projection actor over events, not a stored string." Q2 changing
  forces a `graph_store.Upsert` rewrite. Tracking this as a
  follow-up regardless of Q2 outcome.

If any of these deserves an entry in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md), file it with a
Q-number greater than the current max.

## Reversibility plan

If we pick the chosen option and it turns out wrong, what's the
migration shape?

- **From `per-object-event-log` to `y_ex-CRDT`.** Per
  `COLLAB_PLANE_OPTIONS.md` §"Migration story → Pure op-log →
  CRDT": "Replay the op-log into the CRDT once; thereafter the CRDT
  is canonical and the old log is archive." Step 5 already exposes
  the typed entry point (`migration.replay_into(YjsTarget,
  source)`); the body is `todo` today but the shape is forced.
  Estimate: 2-4 weeks once the `y_ex` mediation layer is built; the
  hard part is the substrate bring-up, not the migration.
- **From `per-object-event-log` to `riak-dt-BEAM-native`.** Same
  shape: replay the op log into Riak DT records. KV-shaped target,
  trivial copy for structured kinds; prose stays in event-log form
  or moves to a parallel substrate. Estimate: 1-2 weeks for
  structured kinds.
- **From `per-object-event-log` to `hybrid-per-object-policy`.**
  Build the registry, then route per `ObjectKind`; for each kind,
  run the corresponding migration. Estimate: 4-8 weeks; the
  registry itself is a new authority.
- **From `y_ex-CRDT` to `per-object-event-log`.** Per
  `COLLAB_PLANE_OPTIONS.md`: "Snapshot to markdown/JSON, append a
  single 'imported' event. Loss: collaborative editing capability
  and per-edit history." Mechanically days; the loss is the
  product story.
- **From `y_ex-CRDT` to anything else.** CRDT-to-CRDT (Yjs →
  Automerge) loses per-character authorship history; Yjs's flat
  update log doesn't map onto Automerge's named commits.
- **From `riak-dt-BEAM-native` to anything else.** KV-to-KV is
  trivial; KV-to-event-log is "snapshot + import event"; KV-to-
  Yjs is "snapshot + hydrate."
- **From `hybrid-per-object-policy` to anything monolithic.**
  Hardest. The registry itself becomes legacy; each `ObjectKind`'s
  state has to be migrated separately into the new single
  substrate. Estimate: weeks per object kind plus a registry
  retirement.
- **What records does the chosen option produce that would have
  to be rewritten on migration?** For A: every row in `collab_ops`
  and `collab_objects`; the `bridge_to_control_plane` records in
  `event_log` are stable. For B: every Yjs update blob; the
  `clientID → MemberId` mapping if Q1 changes mid-flight. For C:
  every Riak DT in-process state snapshot (must be persisted for
  migration). For D: all of the above, plus the registry's
  `(ObjectKind, substrate)` mapping rows.

## Provenance

Cite every external doc, vault note, or branch read while filling this
in. The matrix is only as good as its grounding.

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) — Q2 wording,
  blast radius, Q8 framed as subset of Q2.
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) — P1
  (authority before surface), P4 (identity layers stay separate),
  P6 (local before distributed), P9 (collaboration plane
  adjacent), P10 (Org/Space first-class).
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — collab plane
  position in the layered view ("Substrate TBD — Q2/Q8");
  `collab/supervisor (NEW — substrate TBD)`; three state planes
  table including `Collab` row "y_ex / riak_dt / event-log-per-
  object."
- [`research/COLLAB_PLANE_OPTIONS.md`](../../research/COLLAB_PLANE_OPTIONS.md)
  — full survey of substrates: Yjs via `y_ex`, Automerge, Riak DT,
  DeltaCrdt, Lattice (Gleam), pure op-log, ShareDB, Phoenix.Sync
  hybrid, per-object policy, slot-by-content-shape; "Identity /
  attribution implications" section; "Permission gating
  implications" section; "Migration story" section.
- [`graph/edges/collab.md`](../../graph/edges/collab.md) — "Live
  collaboration objects need their own sync substrate, separate
  from `control_plane/event_log`. Daemon is the auth/permission
  gateway."
- [`research/parts/semantic-layer.md`](../../research/parts/semantic-layer.md)
  — `Node.body` projection-or-string question downstream of Q2;
  `Visibility` enum; `Promotion` actor; explicit Q2/Q8 notes under
  "Open questions specific to Gleam mapping."
- [`research/build-steps/05-collab-substrate-skeleton.md`](../../research/build-steps/05-collab-substrate-skeleton.md)
  — coded assumption (per-object event log); `Replication.LocalOnly`
  as the v0.0.3 default; `migration.replay_into(YjsTarget |
  RiakDtTarget | HybridTarget, source)` typed entry point; nine
  modules + seven tests; acceptance criteria #1-#9.
- [`GLOSSARY.md`](../../GLOSSARY.md) — Collaboration object;
  Personal AI; Distributed AI Delegation; Auto-Resolve Gate; Brain
  Dump; Honcho (vault candidates).
- `EMA_V0_0_3_PREP.md` — "What changes" #4: "Collaboration-state
  subsystem is adjacent to event_log, not inside it" (referenced
  via Step 5).

## Decision

> **Resolution:** `<chosen option short name>`, decided `<YYYY-MM-DD>`.
> Recorded in: `<link to commit / decision doc / blockquote in node body>`.
> Affects: `<other Q-numbers whose blast radius shrinks>`.

When you fill the Decision section in, also:

1. Edit [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md): mark Q2 as
   `status: resolved YYYY-MM-DD → <link>`. **Do not delete the entry.**
2. Move any working assumptions in
   [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) that depended on
   Q2 to confidence-styled language, or move them into a hardened
   `SECURITY.md` / `PRIVACY.md`.
3. Trim the affected `graph/edges/collab.md` "Open" section.
4. Update [`CHANGELOG.md`](../../CHANGELOG.md) under the current wave.

## Cross-references

- [`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md)
- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md)
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md)
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md)
- [`research/COLLAB_PLANE_OPTIONS.md`](../../research/COLLAB_PLANE_OPTIONS.md)
- [`research/build-steps/05-collab-substrate-skeleton.md`](../../research/build-steps/05-collab-substrate-skeleton.md)
- [`research/parts/semantic-layer.md`](../../research/parts/semantic-layer.md)
- [`graph/edges/collab.md`](../../graph/edges/collab.md)
