# Decision matrix — Q1 (agents as first-class members)

Per-question decision matrix for resolving Q1 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> A matrix forces you to write the cost on each option **before** you
> pick. The point is that you should be able to read the matrix back
> later and see why the chosen option won — including in cases where
> the choice turns out wrong.

## Question

`Q1` — `Are agent identities first-class members of Org/Space?`

(Restated verbatim from
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q1.)

The question's stated **blast radius** is "entire identity model,
attribution on collab objects, permission semantics, audit trail,
personal-AI scope resolution" — i.e. it touches identity, attribution
on every Collaboration object, security/permission gating, the audit
trail in `event_log`, Personal AI scope resolution, and (per
`OPEN_QUESTIONS.md`'s own gloss) "every later subsystem will hardcode
'no scope' assumptions" until it is decided. Tagged "the highest
blast-radius open question."

## Options being weighed

Three named options, plus one combined hybrid for symmetry with Q3 and
Q5 ("at least 3"):

| Option | Short name | One-line description |
|---|---|---|
| Option A | `agents-first-class` | `AgentMember` is a peer constructor of `Member` alongside `HumanMember`; an Agent has its own `MemberId`, its own `PolicyBundle`, and is attribution-eligible everywhere a `HumanMember` is. |
| Option B | `agents-as-proxies` | Only `HumanMember` exists; agents are runtime artifacts attached to a human principal. Every agent action is attributed to its principal with an `agent_label` field; Agents have no standalone identity in the registry. |
| Option C | `hybrid-where-agents-are-first-class-only-in-spaces` | Agents are first-class `Member`s **inside Spaces** (where Collaboration objects live and per-Space `clientID`s already need to be minted) but are proxies of the human principal at the **Org / Project** layer (where billing, policy bundles, and `event_log` shards live). |
| Option D | `agents-as-attached-principals` | A separate `AttachedAgent` table sits beside `Member`. Agents have a stable identity (their own `AgentId` opaque type and policy attachment) but are *not* `Member` constructors — every `Member` lookup that returns an `AttachedAgent` returns it via its principal `MemberId` plus an `attached: AgentId` field. |

(`agents-first-class` is the variant the Step 2 build step is
currently coded against per
[`research/build-steps/02-identity-registry-skeleton.md`](../../research/build-steps/02-identity-registry-skeleton.md).
`agents-as-attached-principals` is the explicit "Q1 = no" fallback
named in that step's "Open questions held open" section.)

## Criteria

For each criterion, score each option `+ / 0 / – / blocker`. Add a
one-line "why" inline. Don't average — the criteria are not
interchangeable.

| Criterion | Why it matters | A `agents-first-class` | B `agents-as-proxies` | C `hybrid-spaces-only` | D `agents-as-attached-principals` |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state; identity is owned by the control-plane registry. | + (registry is the authority for both kinds) | + (registry still owns truth, just narrower) | 0 (Space-vs-Org split forces two writers in the registry) | + (registry owns both rows, just typed separately) |
| Compatible with Q-deps if open | Q3 (Project↔Space cardinality), Q4 (Personal AI placement), Q10 (perms mapping) are all open. | 0 (clean for Q3/Q4; pre-empts Q10 by giving agents their own `PolicyBundle`) | + (least entangled with everything else) | – (forces a Q3 answer where Spaces are a real boundary) | 0 (similar to A but easier to retrofit if Q10 picks "explicit policy bundles") |
| Smallest provable slice | Can we exercise it in a 2-week vertical? | + (Step 2's `Member` sum already includes `AgentMember`) | + (collapses `Member` to `HumanMember(...)` only — minimal) | – (needs both representations + a translation layer) | 0 (one new opaque ID + one new table; no `Member` sum change) |
| Reversible | Can we migrate off it cleanly later? | – (every `event_log` row attributed to an `AgentMember` has to be re-attributed if we revert) | + (no agent identities recorded; promotion to A is "mint a Member per existing label") | – (Space-attributed agent rows must be promoted or demoted) | + (table is separate; promote by union into `Member` or drop the table) |
| Gleam-native | Can we express it in typed Gleam without FFI escapes? | + (clean sum constructor, see Step 2's `Member` type sketch) | + (single constructor, simplest sum) | 0 (forces an `Actor` enum that depends on context — `SpaceActor` vs `OrgActor`) | + (separate opaque type composes cleanly) |
| Auditability | Does it produce control-plane-visible records? | + (every agent action has its own `MemberId` in `event_log`) | – (agent actions appear under the human principal — `agent_label` is a tag, not an identity) | 0 (agent actions in Spaces are auditable by `MemberId`; Org-level actions are not) | + (agent actions carry `principal_id + attached_agent_id`) |
| Tests writable in v0.0.3 | gleam_qcheck properties + example tests | + (Step 2 already lists `policy_evaluator_test` and a `personal_ai_scope_test`) | + (fewer tests needed; agent attribution is a string field) | 0 (test matrix doubles — same property at two layers) | + (separate id-separation test is straightforward; gate #4) |
| Identity-model-clean (Q1) | Doesn't constrain Q1 resolution | (this *is* Q1) | (this *is* Q1) | (this *is* Q1) | (this *is* Q1) |
| P4 compliance (Identity-layer separation) | Execution / session / provider / collab / peer IDs must not collapse. | + (`AgentId` and `HumanMemberId` are distinct opaque types under a shared `MemberId`) | 0 (no `AgentId` exists; sessions and tool calls collapse into the human principal at the identity layer) | 0 (separation holds inside Spaces, blurs at Org layer) | + (explicit `AgentId` opaque type, distinct from `MemberId`) |
| P10 compliance (Org/Space first-class) | Multi-tenant scoping in v1, not v2. | + (Agent is scoped by `org: OrgId` per `AgentMember(...)` in Step 2) | 0 (agents inherit scope through the principal — works but is implicit) | 0 (forces a Project↔Space cardinality choice as a precondition) | + (Agent rows carry `org_id` directly) |
| Attribution on Collaboration objects | Per `COLLAB_PLANE_OPTIONS.md` "Identity / attribution implications": Yjs `clientID`, Automerge `ActorId`, ShareDB `src` all want a stable agent identity. | + (`clientID == agent_id` directly; Automerge `ActorId` maps 1:1) | – (every agent op must carry the human principal in `origin`; `clientID` becomes a session token, which is exactly the failure mode the research doc names) | + (works inside Spaces, where Collaboration objects live) | + (agent identity is stable; substrate sees it via the envelope) |
| Personal AI scope resolution | "Personal AI can access all projects/spaces they are part of" (`05-fresh-context-project-app-model.md`); resolver needs a typed identity. | + (Personal AI is an `AgentMember` whose `principal` is the user) | 0 (Personal AI is "the human's runtime"; cannot delegate to a sub-agent without inventing an identity) | – (Personal AI crosses Org/Space; the boundary is hostile to it) | + (Personal AI is a named `AttachedAgent`; resolver returns its scope set) |
| Distributed AI Delegation fit | Per `GLOSSARY.md`: "rate-limited EMA node routes Claude/inference calls through a peer node's credentials." Needs a stable agent identity that can carry credentials. | + (Agent identity is the natural carrier) | – (no agent identity to attach delegation tokens to) | 0 (works where Spaces span peers; not at Org layer) | + (Agent identity is the carrier; principal is the audit anchor) |
| Auto-Resolve Gate fit | Per `GLOSSARY.md`: "vault precedent + preferences + corrections + confidence ≥ 0.85" check before silent agent resolve. Wants a stable agent identity for "corrections" history. | + (corrections accrue against the agent's `MemberId`) | – (corrections accrue against the human, even when the agent acted) | 0 (works in Spaces; degrades at Org layer) | + (corrections accrue against `AgentId`; principal still visible) |
| Build-step alignment | Step 2 currently codes the assumption. | + (no change to Step 2) | – (Step 2's `AgentMember` constructor is removed; downstream loses a typed hook per `harness-execution.md` Q1 note: "DispatchEnvelope.by has to fall back to HumanActor") | – (Step 2's `Member` sum needs a context-aware split) | 0 (Step 2 deprecates `AgentMember` to a separate table — the explicit "Q1 = no" path) |

(Add criteria as needed. Don't remove ones that are awkward — they're
the most informative.)

## Costs and bets

For each option, two bullets each.

### Option A — `agents-first-class`
- **Bet:** Agents will, in practice, accrue durable identity that
  outlives any single human session — they will own corrections
  history, hold credentials for Distributed AI Delegation, be members
  of Spaces with role assignments, and attribute Collaboration object
  ops (Yjs `clientID`, Automerge `ActorId`). Treating them as
  first-class up front avoids a painful retrofit once that durability
  is real.
- **Cost:** Every `event_log` record, every Collaboration object op,
  every policy evaluation accrues against an `AgentMember.id` that
  cannot be cleanly demoted later. If we revert to B, we have a
  re-attribution migration across the entire control plane, the
  workspace, and any collab substrate that already keyed itself to
  `agent_id`. Also: the policy story (Q10) is forced earlier than it
  needs to be, because Agents now want their own `PolicyBundle`.

### Option B — `agents-as-proxies`
- **Bet:** Agents are ephemeral runtime artifacts. The durable thing
  is the human principal who launched them. We will never need to
  attach credentials, role memberships, or independent corrections
  history to an agent identity — anything that looks like that can be
  modelled as "human X's agent doing Y under human X's policy".
- **Cost:** Auditability degrades — every agent action shows up under
  the human, distinguished only by an `agent_label` tag. The Auto-
  Resolve Gate's "corrections" history conflates human and agent
  errors. Personal AI cannot easily delegate to sub-agents without
  inventing identities anyway. Distributed AI Delegation has nowhere
  to attach the routing identity. And per `harness-execution.md` Q1
  note, "delegation-tree rendering loses an attribution hook" because
  `DispatchEnvelope.by` is `HumanActor` even when an agent dispatched.

### Option C — `hybrid-where-agents-are-first-class-only-in-spaces`
- **Bet:** The places agents *need* a stable identity (Collaboration
  objects, Threads, Auto-Resolve Gate, multi-agent visible
  conversations per `05-fresh-context-project-app-model.md` §3) are
  all Space-scoped. The places where giving them identity is
  expensive (Org billing, Project event_log shards, peer-trust roots)
  are not Space-scoped. So the cost/benefit cuts cleanly along the
  Org/Project ↔ Space boundary.
- **Cost:** It depends on Q3 picking a cardinality where Spaces are a
  meaningful enforcement boundary. If Q3 picks
  `disjoint-with-shared-membership`, the boundary is sharp; if Q3
  picks N:M, the "Space agent" can act across Projects through Space
  membership, which leaks the first-class identity into the Org/Project
  layer through the back door. The doubled representation (`Member`
  for Org, separate constructor for Space) means every `Actor` value
  needs context to interpret, which fights P4.

### Option D — `agents-as-attached-principals`
- **Bet:** Agents need a *stable* identity but not a *peer* identity.
  Keeping them in a separate `AttachedAgent` table preserves
  attribution and auditability while leaving `Member` semantics
  untouched. If Q1 later resolves "yes", we promote rows; if it
  resolves "no", we drop the table.
- **Cost:** Every consumer that wants to render attribution has to
  join across two tables. The `Actor` sum either grows a new
  `AttachedAgentActor` constructor (which is then non-Member) or
  every read site has to remember to dereference `attached_agent_id`.
  Personal AI scope resolution has to look in two places. The
  `harness-execution.md` `DispatchEnvelope.by: Actor` field is fine
  but every downstream renderer has to know about the second table.

## Open questions this decision creates

Resolving Q1 almost always opens new questions. Candidates the matrix
surfaces:

- **Q1.a — Agent lifecycle.** How is an `AgentMember` (or
  `AttachedAgent`) created, retired, or rotated? Specifically: do
  Personal AI sub-agents get their own ids, or share the parent's?
- **Q1.b — Agent ↔ Provider/Harness binding.** Does an Agent identity
  bind to a `DriverKind` (e.g. "this agent runs under
  `claude-cli`"), or is the binding per-dispatch via
  `DispatchEnvelope.driver`? If per-Agent, this collides with
  capability locality (P8).
- **Q1.c — Cross-Org agents.** Can an Agent be a `Member` of two Orgs
  (via two different humans)? If yes, `AgentMember.org: OrgId` per
  Step 2 has to become `List(OrgId)` or split into one row per Org.
- **Q1.d — `clientID` minting policy.** Per
  `COLLAB_PLANE_OPTIONS.md`, Yjs `clientID` is a 32-bit integer.
  Stable mapping from `MemberId` (opaque string per Step 2) to a
  32-bit `clientID` needs a registry or a hash with collision
  handling.
- **Q1.e — Auto-Resolve Gate corrections key.** Whatever Q1 picks,
  what is the canonical key for "corrections history" used by the
  Gate? `principal_id`? `agent_id`? `(principal_id, agent_label)`?

If any of these deserves an entry in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md), file it with a Q-number
greater than the current max.

## Reversibility plan

If we pick the chosen option and it turns out wrong, what's the
migration shape?

- **From `agents-first-class` to anything else.** Hard. Every
  `event_log` row, every Collaboration object op (Yjs update,
  Automerge change, op-log entry), every policy decision recorded
  against an `AgentMember.id` has to be re-attributed. Build a
  migration that walks the event_log emitting `IdentityRebound(old:
  AgentMemberId, new: HumanMemberId, agent_label: String)` events,
  then runs a projection rebuild. Estimate: weeks of bespoke
  per-substrate work; collab substrate work depends on Q2/Q8.
- **From `agents-as-proxies` to anything else.** Easy. There is no
  agent identity in the data; promotion is "mint a `MemberId` per
  observed `agent_label`, backfill subsequent rows, leave history
  alone." Estimate: days, with a one-time "before this date,
  attribution is the principal" caveat in the audit story.
- **From `hybrid-spaces-only` to `agents-first-class`.** Promote
  every Space-scoped agent identity into an Org-scoped
  `AgentMember`. Mostly a `INSERT INTO members SELECT ... FROM
  space_agents` with `org` derived from the Space. Estimate: days,
  but you inherit the same `event_log` re-attribution surface for any
  Org-level rows that referred to the human principal "on behalf of"
  the agent.
- **From `hybrid-spaces-only` to `agents-as-proxies`.** Drop the
  Space-agent identities; rewrite Collaboration object attribution
  back to the principal. Same shape as the A→B migration but bounded
  to Spaces. Estimate: 1-2 weeks; the Yjs `clientID` re-attribution
  is the dominant cost.
- **From `agents-as-attached-principals` to `agents-first-class`.**
  Easy. Promote `AttachedAgent` rows into `AgentMember` rows; rewrite
  the foreign-key columns. The `event_log` already references the
  same `AgentId`. Estimate: days.
- **From `agents-as-attached-principals` to `agents-as-proxies`.**
  Drop the `AttachedAgent` table; flatten `principal_id +
  attached_agent_id` columns into `principal_id` plus a string
  `agent_label`. Estimate: days; some loss of agent-scoped
  corrections history.
- **What records does the chosen option produce that would have to
  be rewritten on migration?** For A: every row in `event_log`,
  every Collaboration object op-log, every policy bundle association,
  every Member-keyed cache. For B: very few (the agent_label tag).
  For C: every Space-scoped collab op and every Space membership
  row. For D: the `AttachedAgent` table and any `attached_agent_id`
  foreign keys.

## Provenance

Cite every external doc, vault note, or branch read while filling this
in. The matrix is only as good as its grounding.

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) — Q1 wording, blast
  radius, "highest-blast-radius open question" framing.
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) — P1, P4, P8,
  P10 (and the canonical rule); the three architecture mistakes.
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — identity model sketch
  (Q1, Q3 still open); the `Member` sum constructor variants;
  identity registry as its own OTP app per
  [`EMA_V0_0_3_PREP.md`](../../EMA_V0_0_3_PREP.md).
- [`research/parts/identity-project-space.md`](../../research/parts/identity-project-space.md)
  — the `Member` Gleam type; the `AgentMember` "Q1-dependent
  variant" comment; the policy bundle and `personal_ai_resolver`
  shape.
- [`research/build-steps/02-identity-registry-skeleton.md`](../../research/build-steps/02-identity-registry-skeleton.md)
  — the coded assumption ("ship the `AgentMember(...)` variant"), the
  explicit Q1=no fallback ("`AgentMember` is deprecated to a separate
  `AttachedAgent` table"), and gates #4 and #7.
- [`research/COLLAB_PLANE_OPTIONS.md`](../../research/COLLAB_PLANE_OPTIONS.md)
  — "Identity / attribution implications" section; Yjs `clientID`,
  Automerge `ActorId`, ShareDB `src`, Riak DT / DeltaCrdt envelope
  story; the warning that "if Q1 lands 'agents not first-class' after
  EMA has shipped Yjs with `clientID == agent_id`, every historical
  op needs re-attribution to a human principal."
- [`GLOSSARY.md`](../../GLOSSARY.md) — controlled vocabulary used
  here (Personal AI, Org, Space, Project, Member, Driver, Provider,
  Harness, Auto-Resolve Gate, Distributed AI Delegation, Collaboration
  object, vApp).
- [`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md)
  — "Personal AI can access all projects/spaces they are part of";
  Threads/Server "visible multi-agent conversations/DMs" framing.
- [`research/parts/harness-execution.md`](../../research/parts/harness-execution.md)
  — the Q1 note: "without first-class agent `MemberId`,
  `DispatchEnvelope.by` has to fall back to `HumanActor` for
  agent-initiated runs, which breaks delegation-tree rendering."

## Decision

> **Resolution:** `<chosen option short name>`, decided `<YYYY-MM-DD>`.
> Recorded in: `<link to commit / decision doc / blockquote in node body>`.
> Affects: `<other Q-numbers whose blast radius shrinks>`.

When you fill the Decision section in, also:

1. Edit [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md): mark Q1 as
   `status: resolved YYYY-MM-DD → <link>`. **Do not delete the entry.**
2. Move any working assumptions in
   [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) that depended on
   Q1 to confidence-styled language, or move them into a hardened
   `SECURITY.md` / `PRIVACY.md`.
3. Trim the affected `graph/edges/identity.md` "Open" section.
4. Update [`CHANGELOG.md`](../../CHANGELOG.md) under the current wave.

## Cross-references

- [`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md)
- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md)
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md)
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md)
- [`research/parts/identity-project-space.md`](../../research/parts/identity-project-space.md)
- [`research/build-steps/02-identity-registry-skeleton.md`](../../research/build-steps/02-identity-registry-skeleton.md)
- [`research/COLLAB_PLANE_OPTIONS.md`](../../research/COLLAB_PLANE_OPTIONS.md)
