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

| Option | Short name | One-line description |
|---|---|---|
| Option A | `agents-first-class` | `AgentMember` is a peer constructor of `Member` alongside `HumanMember`; Agent has its own `MemberId`, own `PolicyBundle`, attribution-eligible everywhere a `HumanMember` is. |
| Option B | `agents-as-proxies` | Only `HumanMember` exists; agents are runtime artifacts attached to a human principal. Every agent action is attributed to its principal with an `agent_label` tag. |
| Option C | `hybrid-where-agents-are-first-class-only-in-spaces` | Agents are first-class `Member`s **inside Spaces** (where Collaboration objects live) but proxies of the human principal at the **Org / Project** layer (billing, policy bundles, `event_log` shards). |
| Option D | `agents-as-attached-principals` | Separate `AttachedAgent` table beside `Member`; Agents have stable `AgentId` and policy attachment but are *not* `Member` constructors. |

A is the variant Step 2 currently codes against; D is the explicit
"Q1 = no" fallback named there.

## Criteria

For each criterion, score each option `+ / 0 / – / blocker`. Add a
one-line "why" inline. Don't average — the criteria are not
interchangeable.

| Criterion | Why it matters | A `agents-first-class` | B `agents-as-proxies` | C `hybrid-spaces-only` | D `agents-as-attached-principals` |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1) | Registry is the authority. | + | + | 0 (Space/Org split = two writers) | + |
| Compatible with Q-deps if open | Q3, Q4, Q10 open. | 0 (pre-empts Q10) | + (least entangled) | – (forces Q3) | 0 |
| Smallest provable slice | 2-week vertical. | + (Step 2 already codes it) | + (collapses to `HumanMember`) | – (two representations + translation) | 0 (one new ID + table) |
| Reversible | Migrate off cleanly. | – (re-attribute every `event_log` row) | + (no agent identities recorded) | – (Space rows promote/demote) | + (drop table or promote rows) |
| Gleam-native | Typed without FFI escapes. | + (clean sum constructor) | + (simplest sum) | 0 (`Actor` becomes context-dependent) | + (separate opaque type) |
| Auditability | Control-plane-visible records. | + (agent has own `MemberId` in `event_log`) | – (agent_label is a tag, not identity) | 0 (Space-scoped only) | + (`principal + attached_agent`) |
| Tests writable in v0.0.3 | gleam_qcheck. | + (Step 2 lists tests) | + (fewer tests) | 0 (test matrix doubles) | + (gate #4 straightforward) |
| Identity-model-clean (Q1) | Doesn't constrain Q1. | (this *is* Q1) | (this *is* Q1) | (this *is* Q1) | (this *is* Q1) |
| P4 (identity layer separation) | IDs don't collapse. | + (`AgentId` distinct under `MemberId`) | 0 (collapses into principal) | 0 (Space-only) | + (explicit `AgentId` opaque) |
| P10 (Org/Space first-class) | Multi-tenant in v1. | + (`AgentMember.org: OrgId`) | 0 (implicit through principal) | 0 (forces Q3) | + (Agent rows carry `org_id`) |
| Attribution on Collaboration objects | Yjs `clientID`, Automerge `ActorId`, ShareDB `src` want stable agent identity (per `COLLAB_PLANE_OPTIONS.md`). | + (`clientID == agent_id`) | – (`clientID` becomes session token — research-named failure mode) | + (works inside Spaces) | + (substrate sees identity via envelope) |
| Personal AI scope resolution | Resolver needs typed identity (`05-...-model.md`). | + (`AgentMember` with `principal`) | 0 (cannot delegate to sub-agents typedly) | – (Personal AI crosses Org/Space — hostile boundary) | + (resolver returns scope set) |
| Distributed AI Delegation fit | Needs stable agent identity for credentials (`GLOSSARY.md`). | + | – (nowhere to attach token) | 0 (Space layer only) | + (Agent carrier; principal anchors audit) |
| Auto-Resolve Gate fit | Corrections-history key (`GLOSSARY.md`). | + (against agent `MemberId`) | – (conflates with human) | 0 (Space-only) | + (against `AgentId`) |
| Build-step alignment | Step 2 currently codes the assumption. | + (no change) | – (`AgentMember` removed; `DispatchEnvelope.by` falls back to `HumanActor` per `harness-execution.md`) | – (`Member` sum needs context-split) | 0 (explicit "Q1=no" path) |

(Add criteria as needed. Don't remove ones that are awkward — they're
the most informative.)

## Costs and bets

For each option, two bullets each.

### Option A — `agents-first-class`
- **Bet:** Agents will accrue durable identity outliving any single
  human session — corrections history, credentials for Distributed AI
  Delegation, Space role assignments, Collaboration object op
  attribution. First-class up front avoids a painful retrofit.
- **Cost:** Every `event_log` row, every Collaboration object op,
  every policy evaluation keyed against `AgentMember.id` cannot be
  cleanly demoted later. Reverting to B means a re-attribution
  migration across the control plane, workspace, and collab
  substrate. Q10 (policy) is forced earlier because Agents need their
  own `PolicyBundle`.

### Option B — `agents-as-proxies`
- **Bet:** Agents are ephemeral runtime artifacts; the durable thing
  is the human principal. Credentials, roles, and corrections history
  can all be modelled as "human X's agent doing Y under human X's
  policy."
- **Cost:** Auditability degrades — every agent action shows up under
  the human, distinguished only by `agent_label`. Auto-Resolve Gate
  conflates human/agent corrections. Personal AI cannot delegate to
  sub-agents without inventing identities anyway. Distributed AI
  Delegation has nowhere to attach the routing identity. Per
  `harness-execution.md`: "delegation-tree rendering loses an
  attribution hook."

### Option C — `hybrid-where-agents-are-first-class-only-in-spaces`
- **Bet:** Where agents *need* stable identity (Collaboration
  objects, Threads, Auto-Resolve Gate, multi-agent conversations per
  `05-fresh-context-project-app-model.md` §3) is Space-scoped. Where
  identity is expensive (Org billing, Project event_log shards,
  peer-trust roots) is not. The cut aligns with the Org/Project ↔
  Space boundary.
- **Cost:** Depends on Q3. With `disjoint-with-shared-membership`
  the boundary is sharp; with N:M, a "Space agent" leaks into the
  Org/Project layer through Space-Project membership. Doubled
  representation means every `Actor` value needs context to
  interpret, fighting P4.

### Option D — `agents-as-attached-principals`
- **Bet:** Agents need *stable* identity but not *peer* identity. A
  separate `AttachedAgent` table preserves attribution while leaving
  `Member` semantics untouched. Q1=yes later: promote rows; Q1=no:
  drop the table.
- **Cost:** Every attribution renderer joins across two tables.
  `Actor` either grows an `AttachedAgentActor` constructor (then
  non-Member) or every read site dereferences `attached_agent_id`.
  Personal AI scope resolution looks in two places.

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

- **From A to anything else.** Hard. `event_log`, Collaboration object
  ops (Yjs / Automerge / op-log), policy decisions all keyed against
  `AgentMember.id` need re-attribution. Walk event_log emitting
  `IdentityRebound(old: AgentMemberId, new: HumanMemberId,
  agent_label: String)`, rebuild projections. Estimate: weeks;
  collab-substrate piece depends on Q2/Q8.
- **From B to anything else.** Easy. No agent identity in the data;
  promotion is "mint a `MemberId` per observed `agent_label`, backfill
  forward." Days, with an audit caveat for pre-cutoff history.
- **From C to A.** Promote Space-scoped agent identities into
  Org-scoped `AgentMember` rows; `org` derived from the Space. Days,
  plus the A-shaped `event_log` rewrite for any Org-level rows
  that referenced the principal "on behalf of" the agent.
- **From C to B.** Drop Space-agent identities; rewrite Collaboration
  object attribution back to the principal. A→B shape bounded to
  Spaces. 1-2 weeks; Yjs `clientID` re-attribution dominates.
- **From D to A.** Promote `AttachedAgent` rows into `AgentMember`;
  rewrite foreign-key columns. `event_log` already keys by `AgentId`.
  Days.
- **From D to B.** Drop `AttachedAgent`; flatten `principal_id +
  attached_agent_id` to `principal_id + agent_label: String`. Days;
  loss of agent-scoped corrections history.
- **What records does the chosen option produce that would have to
  be rewritten on migration?** A: every `event_log` row, every
  Collaboration object op, every policy bundle association, every
  Member-keyed cache. B: only the `agent_label` tag. C: every
  Space-scoped collab op and every Space membership row. D: the
  `AttachedAgent` table and `attached_agent_id` foreign keys.

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
