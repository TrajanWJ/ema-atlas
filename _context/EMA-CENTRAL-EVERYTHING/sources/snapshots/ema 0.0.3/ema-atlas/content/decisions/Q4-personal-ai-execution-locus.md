# Decision matrix — Q4 (Personal AI execution locus)

Per-question decision matrix for resolving Q4 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> A matrix forces you to write the cost on each option **before** you
> pick. The point is that you should be able to read the matrix back
> later and see why the chosen option won — including in cases where
> the choice turns out wrong.

## Question

`Q4` — `Where does the Personal AI execute?`

(Restated verbatim from
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q4.)

The question's stated **blast radius** is "P2P design, capability
locality, latency budget, secret handling." It surfaces in
[`graph/edges/transport.md`](../../graph/edges/transport.md) ("Add
`placement` to every dispatch *before* implementing peer-remote
drivers") and in `graph/edges/identity.md`, plus
`05-fresh-context-project-app-model.md` ("personal AI can access all
projects/spaces"). The four named variants are: `user's machine` ·
`daemon` · `Project-affine` · `per-call placement decision`.

The Personal AI is defined in `GLOSSARY.md` as "a user-level agent
identity with implicit access to all Projects/Spaces the user
belongs to, gated by per-Org policy" — i.e. it's a **scope-resolving
agent** whose execution surface intersects every Project the user
touches. Q4 picks where that execution lives.

Q4 is tightly coupled to Q1 (agent-as-Member). Per
[`research/parts/identity-project-space.md`](../../research/parts/identity-project-space.md)
and the Q1 matrix, the resolver `personal_ai_resolver.gleam` (Step
2) needs a typed identity for the Personal AI; under Q1=yes the
Personal AI is an `AgentMember` whose `principal` is the user, under
Q1=no it's an `AttachedAgent` against the human principal. Q4 is
*orthogonal* to Q1's identity question but *consumes* Q1's identity
type. The resolver shape stays; the placement of the actor that
owns it is Q4.

The four options below are the variants named in
`OPEN_QUESTIONS.md`. They map onto the `Placement` sum already coded
in `research/parts/mesh-replication.md`: `Local | Daemon | Peer(_)
| HostAffinity(_)`. Q4 is which of those (or which combination) the
Personal AI binds to.

## Options being weighed

| Option | Short name | One-line description |
|---|---|---|
| Option A | `user-machine` | Personal AI runs on the user's machine — `Placement.Local` (or `Placement.HostAffinity(<user_machine_id>)`). Each user's Personal AI is a process inside their local EMA shell; cross-Project access happens by the local agent talking *out* to the daemon over HTTP/WS. The user's machine owns the model credentials, the conversation state, and the resolver. |
| Option B | `daemon-central` | Personal AI runs in the daemon — `Placement.Daemon`. One Personal AI process per user, hosted under `ema_app/identity/` or a sibling supervisor, addressed by `MemberId`. The daemon owns credentials and conversation state; surfaces (web, native, Discord, CLI) talk to it over the existing surface contract. |
| Option C | `Project-affine` | Personal AI is *not* one process; it's one process *per Project the user is a Member of*. Each Project's daemon shard hosts the Personal AI subprocess for users in that Project. `Placement.Daemon` with affinity to the `event_log_shard: String` field on `Project` (per `ARCHITECTURE.md`'s identity sketch). Cross-Project access happens by Project-shard-to-Project-shard messaging. |
| Option D | `per-call-placement` | No fixed location. Each Personal AI dispatch carries a `Placement` decision computed per call by a `placement_advisor` actor that consults capability locality, latency budget, secret-handling policy, and current load. The Personal AI identity is stable; its execution location is a decision per turn. |

## Criteria

For each criterion, score each option `+ / 0 / – / blocker`. Add a
one-line "why" inline. Don't average — the criteria are not
interchangeable.

| Criterion | Why it matters | A `user-machine` | B `daemon-central` | C `Project-affine` | D `per-call-placement` |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state. The user's machine often *is* a surface. | – (the user's machine hosts both the surface AND the agent process; the boundary blurs unless the local EMA shell is itself a daemon, in which case A collapses into B-on-laptop) | + (daemon owns state; surface stays a projection subscriber) | + (daemon owns state; placement is a within-control-plane choice) | 0 (the placement advisor is itself control-plane authority; surfaces stay clean as long as the advisor lives in the daemon) |
| Compatible with Q-deps if open | Q1 (agent-as-Member), Q3 (Project↔Space), Q9 (replication boundary), Q10 (perms) all open. | – (forces P2P-style cross-machine messaging *now*; Q9 is "deliberately deferred" per `OPEN_QUESTIONS.md` and `graph/edges/transport.md`) | + (single-node; defers Q9 cleanly; Q3 doesn't constrain because the resolver walks the registry regardless of cardinality) | – (forces a Q3 answer — Project-affinity assumes Project is the canonical scope-binding unit; if Q3 lands `disjoint-with-shared-membership` or `Project-inside-Space`, Project-affinity loses its anchor) | 0 (advisor must consult Q9-resolved peer policy; v0.0.3 advisor degrades to "always Daemon" — but the protocol shape is forced into existence) |
| Smallest provable slice | Can we exercise it in a 2-week vertical? | – (requires the host-side EMA shell + secure secret store + cross-shell transport — none of which exist in v0.0.3) | + (one actor per `MemberId` under `identity/supervisor`; reuses Step 2's `personal_ai_resolver.gleam` directly) | 0 (per-Project actor is a small change; cross-Project resolution becomes a fan-out) | – (advisor + protocol + degradation rules + tests for each placement variant; the largest test surface) |
| Reversible | Can we migrate off it cleanly later? | – (once credentials and conversation state live on the user's machine, demoting to daemon means harvesting state from N machines) | + (daemon-hosted state is the easiest source for any of A/C/D; promote by routing the Personal AI's start config to a different supervisor) | 0 (per-Project state can be aggregated into a single daemon-wide actor; reverse is harder if cross-Project conversation history accumulated) | 0 (advisor becomes vestigial under any fixed-placement choice; protocol surface is sticky) |
| Gleam-native | Can we express it in typed Gleam without FFI escapes? | 0 (the local EMA shell is itself Gleam; cross-machine transport is BEAM distribution + `:rpc.call` per `research/parts/mesh-replication.md`, which is FFI) | + (single OTP actor; `Subject(PersonalAiMsg)` per `MemberId`) | + (similar to B; one Subject per `(MemberId, ProjectId)`) | 0 (advisor is pure Gleam; the cross-placement transport is FFI per Q9) |
| Auditability | Does it produce control-plane-visible records? | – (Personal AI runs on a user device; `event_log` writes require the device to be online and trusted as a peer) | + (every dispatch lands in `event_log` via the daemon's `command_bus`; perfect lineage) | + (every dispatch lands in the Project's `event_log` shard — per-Project audit by construction) | 0 (advisor decisions themselves need to be audit events; otherwise the placement is a hidden authority) |
| Tests writable in v0.0.3 | gleam_qcheck properties + example tests | – (no harness for cross-machine transport in v0.0.3; tests degrade to mocks of `:rpc.call`) | + (Step 2's `personal_ai_scope_test` extends naturally; one Subject, deterministic shape) | 0 (per-`(Member, Project)` actor lifecycle tests; Project shard mock; manageable) | – (need property tests for the advisor's decision function across the whole `Placement` sum) |
| Identity-model-clean (Q1) | Doesn't constrain Q1 resolution. | 0 (works under any Q1 outcome; under Q1=no the local agent attribution shifts to the human principal) | 0 (same; the daemon hosts whatever identity Q1 picks) | 0 (same) | 0 (same; advisor consumes whatever `Actor` shape Q1 picks) |
| **Q1 resolution dependency (load-bearing for Q4)** | Per the Q1 matrix and `research/parts/identity-project-space.md`: "Personal AI can access all projects/spaces they are part of"; resolver per `personal_ai_resolver.gleam` (Step 2). The resolver needs a typed identity to *be* before it can have a *location*. | 0 (resolver runs on the user's machine; under Q1=no, the human principal's machine is the natural anchor; under Q1=yes, the `AgentMember` identity travels with the machine binding) | + (resolver runs in the daemon next to the registry; identity is the registry's row regardless of Q1 outcome — minimal coupling to Q1 shape) | 0 (resolver runs per Project; Q1=yes gives `AgentMember` per-Project; Q1=no falls back to `AttachedAgent` per Project — both work) | 0 (resolver shape is fixed; advisor decision consumes the resolved `Actor`) |
| P4 compliance (identity layers stay separate) | Personal AI's `MemberId`/`AgentId` distinct from `SessionId`, distinct from peer `NodeId`. | 0 (the local machine is also a peer if A is taken seriously; `NodeId == user_machine_id` becomes the conflation risk) | + (Personal AI is a Subject keyed by `MemberId`; no peer identity involved) | + (per-Project actor; no peer identity in v0.0.3) | + (advisor enforces the separation by typing the `Placement` decision) |
| P6 compliance (local before distributed) | Per `DESIGN_PRINCIPLES.md` P6 and the third architecture mistake: "Building distributed sync/orchestration before local/shared-state semantics are crisp." | – (A *is* the distributed-first answer; user-machine + daemon = two nodes by construction) | + (single-node by construction; matches the v0.0.3 placement-guard discipline per `research/parts/mesh-replication.md`) | 0 (per-Project shards introduce a within-daemon distribution boundary; OK as long as shards live on the same machine in v0.0.3) | – (advisor's existence implies multi-placement world; v0.0.3 degenerates to "always Daemon" but the protocol shape is forced) |
| P8 compliance (capability locality is real) | Tools, auth, resources, devices differ across human shells, agent turns, daemons, surfaces, machines. | + (A *is* capability-local: the user's keychain, file system, and tools are reachable; the daemon isn't) | – (daemon-hosted Personal AI cannot reach user-local tools without a callback transport — exactly the failure mode P8 names) | 0 (Project-shard locality matches Project-bound tools and datasets; user-local tools still unreachable) | + (advisor *is* the capability-locality decision point; per-call placement is the principled answer to P8 if we can pay for it) |
| P10 compliance (Org/Space first-class) | Multi-tenant scoping in v1, not v2. | 0 (Personal AI on user machine is per-user; Org/Space scope is resolved at the daemon side regardless) | + (daemon hosts Org/Space registry; resolver next to it) | + (Project shards are the explicit per-tenant boundary; matches P10 directly) | 0 (advisor consults Org/Space policy on every call) |
| Latency budget | "Latency budget" called out in Q4's blast radius. | + (in-process, in-shell — fastest possible for user-local interactions) | 0 (daemon round-trip; same machine if local-mode, network round-trip if remote daemon) | 0 (Project-shard round-trip; usually one network hop) | – (advisor decision adds a hop; in v0.0.3 with "always Daemon" degradation, behaves like B) |
| Secret handling | "Secret handling" called out in Q4's blast radius. Provider API keys, vault encryption keys, peer credentials. | 0 (user's machine holds the keys *they* own; daemon keys remain on daemon side; clean per-trust-boundary split) | – (daemon holds all keys; one compromise blast-radius covers every user's Personal AI; needs hardened secret store before shipping) | 0 (per-Project key scoping is natural; Org-level keys remain central) | 0 (advisor decides per-call which key store to use; complexity proportional to the policy) |
| Distributed AI Delegation fit | Per `GLOSSARY.md`: "rate-limited EMA node routes Claude/inference calls through a peer node's credentials." | + (A naturally aligns: the user's machine is one node, the daemon is another; delegation is the cross-node call) | – (no peer to delegate to; delegation has to be invented separately) | 0 (per-Project shards can delegate to peer shards; assumes Q9 lands first) | + (advisor can choose "delegate to peer" as one valid placement) |
| Build-step alignment | Step 2 codes `personal_ai_resolver.gleam` and `policy_evaluator_test.gleam`; Step 5 codes `Replication.LocalOnly` as v0.0.3 default; `mesh-replication.md` codes `Placement` sum + `placement_guard` actor. | – (Step 2's resolver assumes daemon-side; A pushes it to the local shell, which doesn't exist in v0.0.3) | + (Step 2 and resolver compose directly; no new infrastructure) | 0 (per-Project actor is a Step 2-adjacent addition; Project shards exist in `ARCHITECTURE.md` already) | – (`placement_advisor` is a new actor not in any current step) |

## Costs and bets

For each option, two bullets each.

### Option A — `user-machine`
- **Bet:** Capability locality is the load-bearing constraint
  (P8). The Personal AI is most useful when it can read the
  user's local files, see their open editor, hold their personal
  credentials, and respond at IPC speed. None of that is reachable
  from a remote daemon without a callback transport that doesn't
  exist in v0.0.3. Putting the Personal AI on the user's machine
  is the only place it can actually *do its job*.
- **Cost:** Forces P2P / cross-machine messaging into v0.0.3,
  which is exactly what `graph/edges/transport.md` and
  `DESIGN_PRINCIPLES.md` P6 forbid until single-node clarity holds
  ("Distributed semantics must not precede single-node clarity").
  Per `research/parts/mesh-replication.md` gate #6 of
  `EMA_V0_0_3_PREP.md`: `Placement.Peer(_)` is rejected at the
  type level today. Picking A means promoting Q9 to the critical
  path. Auditability degrades because event_log writes require the
  device online + trusted; reversibility is hard because state
  spreads across N machines.

### Option B — `daemon-central`
- **Bet:** The Personal AI is fundamentally a scope-resolving
  agent — it walks the user's Project/Space memberships to answer
  questions about *organisational* state. That work belongs in the
  daemon, next to the identity registry. Local-machine
  capabilities (filesystem, editor) are addressed later via a
  capability-callback shape; for v0.0.3 the Personal AI is "the
  thing that knows what the user can see across Projects."
- **Cost:** Per P8: "Tools, auth, resources, and devices differ
  across human shells, agent turns, daemons, surfaces, and
  machines. Orchestration must respect this — it cannot assume
  every node has the same capabilities." Daemon-hosted Personal
  AI cannot reach user-local tools without inventing a transport
  later — which means picking B *now* is a bet that the user's
  v0.0.3 use cases are dominated by daemon-side state lookups,
  not local capability access. Single-point-of-compromise risk
  on credentials. Latency to the user's keychain is unbounded
  (it's not reachable at all).

### Option C — `Project-affine`
- **Bet:** Per `ARCHITECTURE.md`, the `Project` record carries
  `event_log_shard: String` and is the per-tenant boundary for
  control-plane state. The natural locus for an agent that walks
  Project membership is "one process per Project shard, joined by
  a thin cross-Project router." Cross-Project Personal AI
  questions become explicit fan-out events with audit trails.
- **Cost:** Forces a Q3 answer. If Q3 lands `disjoint-with-
  shared-membership` per the Q3 matrix, Project is no longer the
  canonical scope-binding unit and Project-affinity loses its
  anchor. If Q3 lands `Project-inside-Space`, the Personal AI
  belongs at the Space layer, not the Project layer. Cross-
  Project conversation continuity becomes a routing problem;
  every "remember what we discussed in Project X" question becomes
  a join across shards. Per-Project state grows N times for N
  Projects the user belongs to.

### Option D — `per-call-placement`
- **Bet:** P8 is sharp enough that no fixed placement will be
  right for every dispatch. A `placement_advisor` consults
  capability locality, latency budget, secret-handling policy,
  and current load on every call and returns a typed
  `Placement` value. In v0.0.3 the advisor degrades to "always
  Daemon" but the protocol surface is forced into existence so
  Q9 + Q10 + Distributed AI Delegation slot in cleanly later.
- **Cost:** Most expensive design surface for v0.0.3. The
  advisor is itself a new authority — its decisions need to be
  audit events or it becomes a hidden authority that violates
  P1. The protocol shape forces choices that current open
  questions don't yet provide answers for (where do per-call
  capability sets come from? per `research/parts/harness-
  execution.md` they're already on the `Dispatch` envelope —
  Q4=D doubles down on that envelope being canonical). Test
  surface multiplies across the `Placement` sum.

## Open questions this decision creates

Resolving Q4 almost always opens new questions. Candidates the matrix
surfaces:

- **Q4.a — Personal AI conversation state lifetime.** Where does
  the Personal AI's prior-turn context live? In `event_log` (per
  Project)? In a separate per-Member store? Across Projects via
  the resolver? The answer changes per Q4 option.
- **Q4.b — Capability callback transport.** If B or C is chosen,
  how does daemon-hosted Personal AI reach user-local tools (file
  read, editor inspection, credentials)? Reverse-WS? A new
  surface contract? This is downstream of Q5 (driver contract
  surface) but Q4 makes it concrete.
- **Q4.c — Placement advisor inputs.** If D is chosen, what
  precisely does the advisor consult? Capability set
  (per-`Dispatch`)? Latency SLO (per-`Member`)? Org policy bundle
  (per Q10)? The advisor's input set is itself a decision.
- **Q4.d — Personal AI in Ghost Spaces.** Per `GLOSSARY.md` vault-
  candidate "Ghost Space" ("ephemeral collaboration space with
  TTL"): does the Personal AI accompany the user into a Ghost
  Space? With what scope? The Personal AI's "all Projects/Spaces"
  scope rule needs a Ghost Space carve-out.
- **Q4.e — Honcho / Scope Advisor co-location.** Per
  `GLOSSARY.md`: Honcho is "external user-modeling/peer-
  representation service" called pre-dispatch. If Honcho lives
  outside the daemon, the Personal AI's pre-dispatch path
  crosses a process boundary regardless of Q4. Track this for
  the eventual integration story.
- **Q4.f — Agent-to-Personal-AI delegation.** Sub-agents that the
  Personal AI spawns: do they inherit its placement? Or run in a
  default location? This becomes Q5/Q9 pressure.

If any of these deserves an entry in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md), file it with a
Q-number greater than the current max.

## Reversibility plan

If we pick the chosen option and it turns out wrong, what's the
migration shape?

- **From `user-machine` to anything else.** Hard. State,
  credentials, and conversation history live on N user machines.
  Migration requires harvesting state from each device, gating on
  user consent, and republishing under a daemon-hosted Personal
  AI identity. Estimate: weeks per-deployment plus device-by-
  device user touch.
- **From `daemon-central` to `user-machine`.** Provision a local
  EMA shell on each user's device, replicate the Personal AI's
  state to the local store, switch placement, retire the daemon-
  side actor. Estimate: 2-4 weeks once the local shell exists;
  the local-shell bring-up is the dominant cost and is itself
  Q9-blocked.
- **From `daemon-central` to `Project-affine`.** Split the
  Personal AI actor by Project shard; cross-Project conversation
  history becomes a fan-out. Estimate: 1-2 weeks of refactoring;
  the conversation-history split is the cultural/UX cost.
- **From `daemon-central` to `per-call-placement`.** Add the
  `placement_advisor`; default it to "always Daemon" so the
  current behaviour is preserved; change call sites to consult
  the advisor. Estimate: 2-3 weeks; the test surface is the long
  tail.
- **From `Project-affine` to `daemon-central`.** Aggregate per-
  Project state into a single per-Member actor. Mechanically
  straightforward; cross-Project conversation history is
  preserved by union. Estimate: 1-2 weeks.
- **From `Project-affine` to `user-machine`.** Same shape as B→A
  per Project. Estimate: weeks per deployment.
- **From `per-call-placement` to anything fixed.** The advisor
  becomes vestigial; pin every call to the chosen placement. The
  protocol surface remains in source as dead code unless removed.
  Estimate: days to flip; weeks to clean up.
- **What records does the chosen option produce that would have
  to be rewritten on migration?** For A: device-local state,
  credentials, conversation history. For B: per-`MemberId`
  Personal AI conversation rows in the daemon's persistence
  layer. For C: per-`(MemberId, ProjectId)` rows scoped to the
  Project's `event_log` shard. For D: per-call advisor decisions
  (if recorded as audit events) plus whatever per-placement
  state the chosen placements produced.

## Provenance

Cite every external doc, vault note, or branch read while filling this
in. The matrix is only as good as its grounding.

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) — Q4 wording,
  blast radius (P2P design, capability locality, latency budget,
  secret handling), four named variants.
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) — P1
  (authority before surface), P4 (identity layers stay separate),
  P6 (local before distributed), P8 (capability locality is real),
  P10 (Org/Space first-class); the third architecture mistake
  ("Building distributed sync/orchestration before local/shared-
  state semantics are crisp").
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — `Project` record
  with `event_log_shard: String`; identity-model sketch with
  `AgentMember` Q1 dependency; `Dispatch` record carrying
  `placement: Placement` and `capability_set: Set(Capability)`.
- [`graph/edges/transport.md`](../../graph/edges/transport.md) —
  "Distributed semantics must not precede single-node clarity.
  Add `placement` to every dispatch *before* implementing peer-
  remote drivers"; capability-locality reference in
  `AGENT-CONTRACT.md`.
- [`research/parts/mesh-replication.md`](../../research/parts/mesh-replication.md)
  — `Placement` sum (`Local | Daemon | Peer(PeerId) |
  HostAffinity(String)`); `placement_guard` actor that rejects
  `Peer(_)` at runtime per `EMA_V0_0_3_PREP.md` gate #6;
  Distributed AI Delegation framing for cross-node credential
  routing.
- [`research/parts/identity-project-space.md`](../../research/parts/identity-project-space.md)
  — `personal_ai_resolver.gleam` shape; the explicit Q4-relevant
  note that resolver placement is downstream of Q1's identity
  shape.
- [`research/parts/semantic-layer.md`](../../research/parts/semantic-layer.md)
  — `context_for/2` retrieval contract that the Personal AI
  consumes regardless of placement; `Visibility` enum that
  scopes resolution.
- [`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md)
  — "Personal AI can access all projects/spaces they are part of";
  the "EMA instance is within a project" line that interacts
  with C.
- [`GLOSSARY.md`](../../GLOSSARY.md) — Personal AI ("a user-level
  agent identity with implicit access to all Projects/Spaces the
  user belongs to, gated by per-Org policy"); Capability
  locality; Placement; Distributed AI Delegation; Honcho; Scope
  Advisor; Ghost Space (vault candidates).
- Q1 decision matrix
  ([`Q1-agents-as-first-class-members.md`](Q1-agents-as-first-class-members.md))
  — Personal AI scope resolution row in the Q1 criteria table;
  the framing that Q4 consumes Q1's identity but does not
  constrain Q1's resolution.
- Q3 decision matrix
  ([`Q3-project-space-cardinality.md`](Q3-project-space-cardinality.md))
  — the cardinality question that C makes load-bearing.

## Decision

> **Resolution:** `<chosen option short name>`, decided `<YYYY-MM-DD>`.
> Recorded in: `<link to commit / decision doc / blockquote in node body>`.
> Affects: `<other Q-numbers whose blast radius shrinks>`.

When you fill the Decision section in, also:

1. Edit [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md): mark Q4 as
   `status: resolved YYYY-MM-DD → <link>`. **Do not delete the entry.**
2. Move any working assumptions in
   [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) that depended on
   Q4 to confidence-styled language, or move them into a hardened
   `SECURITY.md` / `PRIVACY.md`.
3. Trim the affected `graph/edges/transport.md` and
   `graph/edges/identity.md` "Open" sections.
4. Update [`CHANGELOG.md`](../../CHANGELOG.md) under the current wave.

## Cross-references

- [`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md)
- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md)
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md)
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md)
- [`graph/edges/transport.md`](../../graph/edges/transport.md)
- [`research/parts/mesh-replication.md`](../../research/parts/mesh-replication.md)
- [`research/parts/identity-project-space.md`](../../research/parts/identity-project-space.md)
- [`Q1-agents-as-first-class-members.md`](Q1-agents-as-first-class-members.md)
- [`Q3-project-space-cardinality.md`](Q3-project-space-cardinality.md)
