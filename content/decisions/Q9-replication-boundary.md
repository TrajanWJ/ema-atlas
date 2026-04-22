# Decision matrix — Q9 (replication boundary)

Per-question decision matrix for resolving Q9 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> A matrix forces you to write the cost on each option **before** you
> pick. The point is that you should be able to read the matrix back
> later and see why the chosen option won — including in cases where
> the choice turns out wrong.

## Question

`Q9` — `Replication boundary (which records replicate P2P vs stay central)`

(Restated verbatim from
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q9.)

The question's stated **status** is "open, deliberately deferred"
and the **note** is the crucial constraint: "must NOT be answered
before Q1, Q2, Q3 settle." It surfaces in
`02-project-transfer-brief.md` §12 q5 and in
`MACBOOK_AGENT_HANDOFF_MASTER.md` §10. The principle behind the
deferral is `DESIGN_PRINCIPLES.md` P6: "Local semantics before
distributed semantics. Do not spread ambiguity across peers. Pin
the single-node semantics first, then add P2P." Plus the third
architecture mistake: "Building distributed sync/orchestration
before local/shared-state semantics are crisp."

The pressure to *prepare* for Q9 without resolving it is concrete:
[`research/parts/mesh-replication.md`](../../research/parts/mesh-replication.md)
codes `Placement.Peer(PeerId)` as a typed value with no legal
runtime path; the `placement_guard` actor rejects it at runtime
with `Error(PlacementError(Deferred))` per
`EMA_V0_0_3_PREP.md` gate #6. `SignedEnvelope`,
`DelegationToken`, `LeaseTarget`, `ReplicableKind`
(`WorkspaceArtifactRepl | WikiNodeRepl | EventLogTail`) all
compile today but no actor consumes them in a non-deferred way.
Q9's resolution is what flips `placement_guard` from "always
reject" to "consult policy" and what lets `replication.Publish`
for `Peer(_)` placement do something other than return
`Deferred`.

The three options below differ in *how aggressively* Q9 is
answered when it is finally answered. The "deferred" option is
the most fully specified because the question's own note
demands it: a defensible deferral has to enumerate the prior
clarity it depends on.

## Options being weighed

| Option | Short name | One-line description |
|---|---|---|
| Option A | `deferred` | Single-node only for v0.0.3. Q9 stays open. `Placement.Peer(_)` rejected at runtime by `placement_guard`. `Replication.LocalOnly` is the only shipped variant for collab objects (`Federated(_)` typeable, rejected at write time per Step 5). `replication.Publish` for any `Peer(_)` returns `Error(Deferred)`. The single-node clarity that must hold *first* is enumerated below — Q9 can only be lifted once those preconditions are met. |
| Option B | `narrow-append-only-logs` | Replicate only append-only logs, only for explicitly opted-in `ReplicableKind`s, and only between explicitly trusted peers in the same Org. Concretely: `EventLogTail` for cross-machine continuity of a single user's own daemons; `WorkspaceArtifactRepl` for explicitly marked artifacts. Mutable state (collab CRDTs, runtime sessions, leases) stays central. Tight blast radius, narrow surface, append-only safety. |
| Option C | `full-mesh-control-plane` | Q9 is answered by standing up a full mesh-aware control plane. `Placement.Peer(_)` runtime path lands; lease arbitration via `lease_manager` for cross-peer authority; `SignedEnvelope` round-trip + signature verification on every replicated record; `DelegationToken` consumed for capability routing per Distributed AI Delegation; `MCP Gateway` exposes outbound tools to peers. Every `ReplicableKind` (and likely additions) replicates under explicit policy. |

## Criteria

For each criterion, score each option `+ / 0 / – / blocker`. Add a
one-line "why" inline. Don't average — the criteria are not
interchangeable.

| Criterion | Why it matters | A `deferred` | B `narrow-append-only-logs` | C `full-mesh-control-plane` |
|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state; the control plane is the authority. | + (single-node = single source of truth; trivial) | 0 (replicated logs need a "which peer is canonical for this record" rule; the rule itself is new authority) | – (cross-peer authority is the new substrate; the canonical-rule story has to be re-derived in a distributed setting before any UX rests on it) |
| Compatible with Q-deps if open | Q1, Q2, Q3 must settle first per `OPEN_QUESTIONS.md` Q9 note. | + (the deferral *is* the compatibility) | – (B needs Q1 settled to know whose ops to attribute on replication; needs Q2 settled to know which collab artefacts are even replicable; needs Q3 settled to know if Project shards are co-replicated or independent) | – blocker (C cannot proceed without Q1, Q2, Q3, and Q10 — `OPEN_QUESTIONS.md` is explicit) |
| Smallest provable slice | Can we exercise it in a 2-week vertical? | + (`mesh-replication.md` already ships the gate test: every `Permit(Peer(_))` returns `Error(Deferred)`; signed-envelope round-trip; lease acquire/expiry — all single-node tests against typed values) | 0 (per-`ReplicableKind` replication harness + signed envelope verification + peer trust list — manageable but not 2 weeks if Q1/Q2/Q3 still open) | – (full mesh is months of work; lease arbitration alone is its own subsystem) |
| Reversible | Can we migrate off it cleanly later? | + (deferral retains every option; the ground truth is single-node so any later replication policy is additive, not corrective) | 0 (once tail-replicated, retiring the replication path means deciding whether to re-canonicalise logs; per-peer history fragments) | – (mesh-aware control plane is sticky — it shapes operator expectations, schemas, recovery paths, and audit assumptions; reverting is a redesign) |
| Gleam-native | Can we express it in typed Gleam without FFI escapes? | + (the deferral path is pure Gleam; FFI to BEAM distribution is gated behind `placement_guard` rejection) | 0 (cross-node BEAM distribution needs `:erlang.set_cookie/2`, `:net_kernel.start/1`, `:rpc.call/4` — all FFI per `mesh-replication.md`; signature via `:public_key`/`:crypto`) | 0 (same FFI surface as B but at full scale; `:gen_tcp`/`:ssl`/`:gun`/`:disk_log`/`:pg` all in play) |
| Auditability | Does it produce control-plane-visible records? | + (single `event_log`; perfect lineage by construction) | + (append-only logs replicate exactly the audit story; signed envelopes carry origin) | 0 (audit story has to span peers; "which peer's `event_log` is canonical for this dispatch" becomes a real question) |
| Tests writable in v0.0.3 | gleam_qcheck properties + example tests | + (per `mesh-replication.md`: placement-guard test, lease-acquire/expiry test, signed-envelope round-trip test, MCP gateway exposure test, presence property test — all ship at v0.0.3) | – (replication tests need multi-node fixtures; CI cost is real) | – blocker (mesh tests need network-partition simulation, peer-departure simulation, cross-peer lease arbitration tests — not v0.0.3 scope) |
| Identity-model-clean (Q1) | Doesn't constrain Q1 resolution. | + (the deferral *protects* Q1's degrees of freedom) | – (B requires Q1 — `SignedEnvelope.origin_peer` cannot be checked against any membership model until Q1/Q3 settle, so `replication.IncomingFromPeer` would accept any signed payload from any peer per `mesh-replication.md`) | – (C requires Q1 + Q3) |
| P6 compliance (local before distributed) | Per `DESIGN_PRINCIPLES.md` P6: "Pin the single-node semantics first, then add P2P. The strategic mesh future is **deferred** until local clarity holds." | + (P6 is the explicit basis for A) | 0 (B is the smallest violation of P6 — narrow, append-only, opt-in — but still a violation if single-node clarity hasn't held) | – (C is the architecture mistake P6 was written to prevent) |
| P8 compliance (capability locality is real) | Tools, auth, resources differ across machines. | 0 (deferral means the capability-locality story stays unresolved at the cross-peer layer; OK for v0.0.3, becomes pressure later) | + (B's narrow scope is itself a capability-locality discipline: only logs and explicitly marked artefacts cross peers) | + (C addresses P8 fully via `DelegationToken` and Distributed AI Delegation; cost is the substrate) |
| P10 compliance (Org/Space first-class) | Multi-tenant scoping in v1. | + (Org/Space scoping holds within a single node; trivial) | 0 (cross-Org replication requires Org-trust roots; `OrgId` is on `DelegationToken.granted_by` per `mesh-replication.md`, so the type exists, but the trust model isn't built) | – (C must answer cross-Org peer trust before shipping; blocked on Q10) |
| Build-step alignment | `mesh-replication.md` codes `Placement` sum + `placement_guard` rejecting `Peer(_)`; Step 5 codes `Replication.LocalOnly` default. | + (no change; the codebase ships the deferred shape today) | – (every typeable-but-deferred message in `mesh-replication.md` becomes real; `replication.Publish` for `Peer(_)` flips from `Error(Deferred)` to `Ok(_)`; tests rewritten) | – (full implementation of every actor in `mesh-replication.md` plus extensions — not a step, an arc) |
| Q-dep readiness | Does the chosen option *consume* unresolved Qs that haven't settled? | + (A consumes none) | – (consumes Q1, Q2, Q3 — and per `OPEN_QUESTIONS.md` Q9 note, all three "must settle" before Q9 is answered) | – (consumes Q1, Q2, Q3, Q10) |

## Costs and bets

For each option, two bullets each.

### Option A — `deferred`
- **Bet:** Single-node clarity is *not yet* crisp. Q1, Q2, Q3
  are open; Q5 and Q10 are open. Per `OPEN_QUESTIONS.md` Q9
  note: "must NOT be answered before Q1, Q2, Q3 settle." Per
  `DESIGN_PRINCIPLES.md` P6: "Local semantics before distributed
  semantics." Per the third architecture mistake: "Building
  distributed sync/orchestration before local/shared-state
  semantics are crisp." Picking A is choosing to honour those
  three commitments simultaneously. The shipped artefacts —
  `placement_guard` rejecting `Peer(_)`, `Replication.LocalOnly`
  as the only collab variant, every `ReplicableKind` typeable
  but inert — are evidence that the deferral is *active*, not
  passive.
- **Cost:** Distributed AI Delegation, mesh-aware Threads, and
  any peer-remote driver are all gated behind A. The strategic
  P2P future named in `MACBOOK_AGENT_HANDOFF_MASTER.md` §10 and
  `02-project-transfer-brief.md` §8 cannot ship in v0.0.3. The
  vault-candidate term "Distributed AI Delegation" stays
  decorative. `DelegationToken` compiles but no actor consumes
  it. Operators who expected mesh in v0.0.3 will be told "later."

#### What single-node clarity must hold first

Per `OPEN_QUESTIONS.md` Q9's "must NOT be answered before Q1,
Q2, Q3 settle" and per `DESIGN_PRINCIPLES.md` P6, A is only
defensible if the following preconditions are tracked and
gated:

1. **Q1 (agent-as-Member) resolved.** Without a typed identity
   for agents, `SignedEnvelope.origin_peer` cannot be checked
   against any membership model. Per
   `research/parts/mesh-replication.md` §"Open questions
   specific to Gleam mapping": "`SignedEnvelope.origin_peer`
   cannot be checked against any membership model until Q1/Q3
   settle, so `replication.IncomingFromPeer` would accept any
   signed payload from any peer."
2. **Q2 (collab state location) resolved.** Without knowing
   whether collab state lives in `event_log` or adjacent,
   `ReplicableKind.WikiNodeRepl` has no defined payload shape.
   Per `mesh-replication.md` Q8/Q2 note: "with no Gleam-native
   CRDT lib, we pick between FFI to Riak DT, FFI to a
   Yjs/Automerge sidecar, or a minimal append-only log under
   `sqlight`. Each choice changes the shape of `Publish`
   payloads."
3. **Q3 (Project↔Space cardinality) resolved.** Without
   knowing the cardinality, "which scope replicates as a unit"
   is undefined. A Space spanning Projects (Q3=`N:M` or
   `disjoint-with-shared-membership`) replicates differently
   than a Space contained in a Project (Q3=`Space-inside-
   Project`).
4. **Step 1 (control-plane skeleton) shipped.** The `event_log`
   single-node semantics — append-only ordering, replay
   determinism, `project_id` shard discipline per
   `ARCHITECTURE.md` — must be crisp before they can be
   mirrored across peers.
5. **Step 4 (sessions + babysitter) shipped.** Per
   `mesh-replication.md`, lease arbitration depends on session
   identity; the takeover_manager's local handoff semantics
   must hold before cross-peer takeover can.
6. **Step 5 (collab substrate) shipped.** Per Step 5,
   `Replication.LocalOnly` is the only shipped variant; the
   migration to `Federated(_)` is "Q9-pending." Q9 cannot
   answer for collab until the local collab substrate runs.
7. **Q5 (driver contract surface) resolved.** Per the Q5 matrix:
   "If B (`streaming-events-Subject`) is chosen, what is the
   cross-node serialization story for `Subject(DriverEvent)`
   when Q9 lands?" The cross-peer driver story shape depends
   on Q5.
8. **Q10 (perms mapping) resolved.** Per `DelegationToken` in
   `mesh-replication.md`, cross-peer capability is an Org-
   level grant; Q10 has to give us the policy bundle vocabulary
   first.
9. **Single-machine production deployment proven.** Per
   `02-project-transfer-brief.md` §13 risk #6 (referenced via
   `DESIGN_PRINCIPLES.md` P6), distributed semantics shouldn't
   precede local clarity *in production*, not just in code. A
   shipped, run-in-anger single-node EMA is a precondition.
10. **Audit story for cross-peer events drafted.** The
    `event_log` audit discipline is single-node today. Before
    Q9 lands, a written-down "how cross-peer records appear in
    audit" needs to exist (likely a separate
    `OPEN_QUESTIONS.md` entry created at the moment Q9 is
    promoted from deferred to active).
11. **Backpressure story for replication outbox drafted.**
    Per `mesh-replication.md`: "`:disk_log` is an option for
    the durable replication outbox if `sqlight` proves too
    slow." The decision needs to exist before Q9 ships.
12. **Trust-root story for Org-level peer signing.** Per
    `mesh-replication.md`'s `DelegationToken.granted_by:
    OrgId` field — there is no shipped Org-trust-root
    mechanism today. Q9 needs one.

A defensible move from A → B or A → C requires checking off
each of these. Until then, `placement_guard` keeps rejecting
`Peer(_)` and the deferral is the answer.

### Option B — `narrow-append-only-logs`
- **Bet:** The cheapest defensible Q9 answer is *only*
  replicating the records whose semantics are simplest under
  replication: append-only logs with single-writer-per-record
  invariants. `EventLogTail` (a user's own daemons replicating
  their own event_log shards across the user's own machines for
  continuity) and `WorkspaceArtifactRepl` (explicitly marked
  static artefacts) both fit this shape. Mutable state — collab
  CRDTs, leases, runtime sessions — stays central. Append-only
  shape gives convergence-by-construction; opt-in keeps blast
  radius narrow.
- **Cost:** Per `OPEN_QUESTIONS.md` Q9 note, B requires Q1, Q2,
  Q3 settled first — same as C, just at smaller scale. Without
  Q1, `SignedEnvelope.origin_peer` is unverifiable. Without Q3,
  Project-shard-tail replication has no canonical owner.
  Picking B before those Qs settle violates P6 at lower
  amplitude than C, but still violates it. Per-peer history
  fragments mean retiring the replication path later requires
  re-canonicalisation. Operators learn a partial mesh model
  whose limits are subtle ("only these kinds replicate, only to
  these peers") — easy to misread.

### Option C — `full-mesh-control-plane`
- **Bet:** Mesh is the *strategic* future per
  `MACBOOK_AGENT_HANDOFF_MASTER.md` §10 and the Distributed AI
  Delegation framing in `GLOSSARY.md` (vault candidate). Doing
  it half-way (B) is its own kind of debt. Picking C now,
  *if* the prerequisites have settled, lets every typeable-but-
  inert actor in `mesh-replication.md` (`lease_manager`,
  `replication`, `presence`, `mcp_gateway`,
  `placement_guard`-as-policy) become real together.
- **Cost:** Per `OPEN_QUESTIONS.md` Q9 note, blocker — Q1,
  Q2, Q3 must settle first. Per `DESIGN_PRINCIPLES.md` P6 and
  the third architecture mistake: this is the canonical
  forbidden move while local semantics aren't crisp. The cost
  inventory is also enormous: `lease_manager` arbitration
  semantics, `SignedEnvelope` signature verification with
  rotation, `DelegationToken` lifecycle, MCP gateway wire-
  protocol selection, partition tolerance, peer departure,
  cross-peer audit, cross-Org trust roots, and the Q10 perm-
  mapping all become hard requirements simultaneously. Per
  `mesh-replication.md`: "Distributed AI Delegation (vault
  candidate) — `DelegationToken` compiles today but no actor
  consumes it." Picking C means building every consumer.

## Open questions this decision creates

Resolving Q9 almost always opens new questions. Candidates the matrix
surfaces:

- **Q9.a — Trust-root mechanism.** How does Org-level peer signing
  bootstrap? Per-Org public keys distributed by which channel?
  `DelegationToken.granted_by: OrgId` is typed; the issuance
  mechanism is undefined.
- **Q9.b — Cross-peer audit canonicalisation.** When two peers
  both record an event referring to the same `ExecutionId`, which
  one is canonical? Vector-clock merge in `event_log`?
  Lease-holder wins?
- **Q9.c — Partition recovery.** When a peer rejoins after a
  partition, how are diverged `WikiNodeRepl` payloads merged? Q2
  picks the substrate; Q9 picks the recovery story.
- **Q9.d — `placement_guard` policy shape.** When Q9 lifts, the
  guard flips from "reject all `Peer(_)`" to "consult policy."
  What does the policy look like? Per `mesh-replication.md`: "the
  day Q9 lands, `placement_guard` flips from 'always reject' to
  'consult policy,' which changes its message protocol."
- **Q9.e — Replication-outbox durability.** Per
  `mesh-replication.md`: "`:disk_log` is an option for the
  durable replication outbox if `sqlight` proves too slow." The
  pick.
- **Q9.f — Distributed AI Delegation enablement gate.** Per
  `GLOSSARY.md` vault candidate: when does delegation actually
  ship? Q9 + Q10 + a credential-routing actor.
- **Q9.g — MCP Gateway exposure on peer requests.** Per
  `mesh-replication.md`: `IncomingCall(from_peer, "vault.search",
  ...)` is rejected today with `Deferred`. When Q9 lifts, what
  scope of tools is exposed by default? (Almost certainly none.)

If any of these deserves an entry in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md), file it with a
Q-number greater than the current max.

## Reversibility plan

If we pick the chosen option and it turns out wrong, what's the
migration shape?

- **From `deferred` to `narrow-append-only-logs`.** Lift
  `placement_guard` from "reject all `Peer(_)`" to "consult
  policy"; implement the policy as a single-rule allowlist
  (`{kind: EventLogTail, peers: <user's own machines>}`); turn
  on `replication.Publish` for matching kinds. Existing
  single-node state remains canonical; replication is additive.
  Estimate: weeks if all preconditions hold; longer if
  preconditions slip.
- **From `deferred` to `full-mesh-control-plane`.** Build out
  every typeable-but-inert actor in `mesh-replication.md`:
  `lease_manager` arbitration, `replication.IncomingFromPeer`
  signature verification, `presence` cross-peer fan-out,
  `mcp_gateway` outbound exposure, `placement_guard` as
  policy. Per the principle, this should not happen until
  every prerequisite has settled. Estimate: months.
- **From `narrow-append-only-logs` to `deferred`.** Stop
  publishing; gate `placement_guard` back to "always reject."
  Existing replicated tails on remote peers become orphan
  history — either retained as audit-only or scrubbed by
  policy. Estimate: days mechanically; weeks of UX/policy
  cleanup.
- **From `narrow-append-only-logs` to `full-mesh-control-
  plane`.** Add the missing replicable kinds and the full
  authority-arbitration story. Estimate: months. The narrow
  story doesn't preclude the full story but doesn't accelerate
  it either.
- **From `full-mesh-control-plane` to anything narrower.**
  Hardest. Operators have built habits around mesh; revoking
  capabilities means operator education + scope-narrowing
  plus retiring lease-arbitration code paths. Estimate: months
  to retire each subsystem cleanly.
- **What records does the chosen option produce that would
  have to be rewritten on migration?** For A: none — the
  deferred state produces only `Error(Deferred)` outcomes.
  For B: per-peer replicated tail rows; trust-root entries
  for opted-in peers; outbox state. For C: every actor's
  cross-peer state including lease tables, presence pings,
  MCP-exposure registrations, signed-envelope verification
  caches, delegation tokens — the full mesh-aware control-
  plane state.

## Provenance

Cite every external doc, vault note, or branch read while filling this
in. The matrix is only as good as its grounding.

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) — Q9 wording,
  the explicit "deliberately deferred" status, the explicit
  "must NOT be answered before Q1, Q2, Q3 settle" note, plus
  Q1/Q2/Q3 wording that defines the preconditions.
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) — P1
  (authority before surface), P6 (local before distributed —
  the load-bearing principle for A), P8 (capability locality
  is real), P10 (Org/Space first-class); the third architecture
  mistake ("Building distributed sync/orchestration before
  local/shared-state semantics are crisp").
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — "Distributed
  orchestration before local clarity" called out as a refused
  goal; `Placement` sum (`Local | Daemon | Peer(NodeId) |
  HostAffinity(_)`) on every `Dispatch`; "Mesh transport
  (deferred — Q9)" in the layered view.
- [`research/parts/mesh-replication.md`](../../research/parts/mesh-replication.md)
  — full type sketch (`PeerId`, `LeaseId`, `Placement`, `Lease`,
  `LeaseTarget`, `ReplicableKind`, `SignedEnvelope`,
  `PresencePing`, `DelegationToken`); actor sketch
  (`LeaseManagerMsg`, `ReplicationMsg`, `PresenceMsg`,
  `McpGatewayMsg`, `PlacementGuardMsg`); supervision tree
  fragment with `placement_guard` as REAL and the rest as
  stubs; the explicit Q9 note that "the day Q9 lands,
  `placement_guard` flips from 'always reject' to 'consult
  policy,' which changes its message protocol"; Q1/Q3
  preconditions for `SignedEnvelope.origin_peer` checking;
  `:rpc.call`, `:public_key`, `:crypto`, `:gen_tcp`, `:ssl`,
  `:gun`, `:disk_log`, `:pg` interop list; gate #6 of
  `EMA_V0_0_3_PREP.md`.
- [`research/build-steps/05-collab-substrate-skeleton.md`](../../research/build-steps/05-collab-substrate-skeleton.md)
  — `Replication.LocalOnly` as the only shipped variant;
  `Federated(_)` typeable but rejected with
  `Error(Deferred("Q9-pending"))` per acceptance criterion #5;
  `federated_deferred_test.gleam`.
- [`graph/edges/transport.md`](../../graph/edges/transport.md) —
  "Distributed semantics must not precede single-node clarity.
  Add `placement` to every dispatch *before* implementing peer-
  remote drivers"; "No code yet. Strategic future."
- [`GLOSSARY.md`](../../GLOSSARY.md) — Mesh / P2P ("Strategic
  future direction… Deferred until local semantics pin down");
  Placement; Capability locality; Personal AI; vault candidates
  including Distributed AI Delegation, MCP Gateway, Honcho.
- Q1 decision matrix
  ([`Q1-agents-as-first-class-members.md`](Q1-agents-as-first-class-members.md))
  — the identity model that Q9 consumes for
  `SignedEnvelope.origin_peer` and `DelegationToken` semantics.
- Q2 decision matrix
  ([`Q2-collab-state-location.md`](Q2-collab-state-location.md))
  — the substrate that defines what `WikiNodeRepl` payload
  looks like.
- Q3 decision matrix
  ([`Q3-project-space-cardinality.md`](Q3-project-space-cardinality.md))
  — the cardinality that defines what scope replicates as a
  unit.
- Q5 decision matrix
  ([`Q5-driver-contract-surface.md`](Q5-driver-contract-surface.md))
  — `peer-remote` driver readiness; the cross-node story for
  `Subject(DriverEvent)` if Q5=B.
- `02-project-transfer-brief.md` §8, §11, §12 q5, §13 risk #6;
  `MACBOOK_AGENT_HANDOFF_MASTER.md` §10, §14 (referenced via
  `mesh-replication.md`'s "Read next" list).

## Decision

> **Resolution:** `<chosen option short name>`, decided `<YYYY-MM-DD>`.
> Recorded in: `<link to commit / decision doc / blockquote in node body>`.
> Affects: `<other Q-numbers whose blast radius shrinks>`.

When you fill the Decision section in, also:

1. Edit [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md): mark Q9 as
   `status: resolved YYYY-MM-DD → <link>`. **Do not delete the entry.**
2. Move any working assumptions in
   [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) that depended on
   Q9 to confidence-styled language, or move them into a hardened
   `SECURITY.md` / `PRIVACY.md`.
3. Trim the affected `graph/edges/transport.md` "Open" section (or
   in the case of A, leave it intact and add a pointer to this
   matrix as the active deferral record).
4. Update [`CHANGELOG.md`](../../CHANGELOG.md) under the current wave.

## Cross-references

- [`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md)
- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md)
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md)
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md)
- [`graph/edges/transport.md`](../../graph/edges/transport.md)
- [`research/parts/mesh-replication.md`](../../research/parts/mesh-replication.md)
- [`research/build-steps/05-collab-substrate-skeleton.md`](../../research/build-steps/05-collab-substrate-skeleton.md)
- [`Q1-agents-as-first-class-members.md`](Q1-agents-as-first-class-members.md)
- [`Q2-collab-state-location.md`](Q2-collab-state-location.md)
- [`Q3-project-space-cardinality.md`](Q3-project-space-cardinality.md)
- [`Q5-driver-contract-surface.md`](Q5-driver-contract-surface.md)
