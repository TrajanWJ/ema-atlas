# Identity / Org / Project / Space

## The frame

This part is the tenancy and identity model: how a human, an agent, a
Personal AI, an Organization, a Project, and a Space actually compose
into a system that can answer "who is allowed to do what, where, on
behalf of whom?" Under the canonical rule —
*EMA owns truth. Hermes owns execution. Surfaces do not own state.* —
identity is the part of *truth* that everything else reads from.
Authority decisions, execution lineage, collaboration attribution,
Personal AI scope resolution: all of them dereference the identity
model.

The frame question is brutal because today there is no schema. As
`graph/edges/identity.md` puts it: *"No schema exists yet anywhere in
the lineage. This is the highest-blast-radius missing piece — every
later subsystem hardcodes 'no scope' until this lands in
`control_plane/schema.ex`."* Every vision in this brief is a stance on
how rich that schema must be, and how *visible* its richness must be in
the product.

## What's already true

- The canonical statement exists at
  `design-review-fresh-context/05-fresh-context-project-app-model.md`,
  which names Org, Project, Space, Personal AI, and the
  "Personal AI sees the union of memberships, gated by per-Org policy"
  rule (`graph/edges/identity.md` Primary).
- Required identity separations are listed in
  `02-project-transfer-brief.md` §11 (cited in
  `graph/edges/identity.md`): execution_id, local session_id, provider
  session_id, workspace artifact_id, peer_id, and org/space/member/agent
  identity must not be conflated.
- Each EMA instance binds to a Project (`GLOSSARY.md` Project row;
  `codebase-ema/code/ema/daemon/lib/ema/application.ex` is the boot
  point that will need this binding).
- A donor design exists in
  `graph/nodes/codebase-mission-control-claude.qmd` for per-user
  control surfaces.
- Vault-candidate **Space (typed taxonomy)** in `GLOSSARY.md` proposes
  Personal / Organization / Shared / Ghost / Public as the fundamental
  isolation unit, sourced from
  `docs-host-obsidian-vault/.../EMA Mesh Architecture.md`. This is a
  richer Space model than the bare "Space inside an Org" current entry.

## What's still open

- Q1: are agent identities first-class members of Org/Space? Highest
  blast radius open question.
- Q3: Project ↔ Space cardinality (N:M, project-inside-space,
  space-inside-project, disjoint-with-shared-membership).
- Q4: where does the Personal AI execute (user's machine, daemon,
  Project-affine, per-call)?
- Q10: how Org/Space permissions map onto runtime/tool permissions
  (simple inheritance vs explicit policy bundles).
- Whether **Ghost Space** (vault-candidate, ephemeral with TTL) is part
  of v1 or deferred — it changes the lifecycle model for Spaces.

## The three futures, expanded

### Strict Boundaries (identity-operator-cathedral)

Projects are hard boundaries. Personal AI is membership-scoped and
*deliberately* constrained: it only sees what is in scope for the
current surface context. Cross-Project visibility requires explicit
elevation. Agents are not first-class members; they act under a human
principal with named delegation.

- **What this would force you to build first:** a schema in
  `control_plane/schema.ex` with Org / Project / Space / Member rows
  and an explicit policy_bundle ref per Member; a Personal AI scope
  resolver that evaluates per-request against current surface context;
  per-Org policy bundles that gate cross-Project reach.
- **What this would force you to give up:** the magical "the AI just
  knows everything I work on" expectation; some of the fluidity that
  makes Personal AI feel native.
- **Smallest provable slice:** two weeks to ship one Org with two
  Projects, a Personal AI that refuses cross-Project queries unless
  explicitly elevated, and a visible "scope" pill on every agent
  response naming the exact Project it answered from.

### Fluid Use, Hard Bones (identity-living-workspace)

Identity *feels* fluid: the user moves between Projects without
ceremony, the Personal AI follows seamlessly, and scope is
communicated through graceful targeting flows rather than dialogs. But
underneath, the boundaries are still strict — the magic is in the
presentation. This is closest to the **Cognitive Cockpit** UX stance.

- **What this would force you to build first:** a Personal AI that
  pre-resolves its current scope ambiently and surfaces it as a
  background pill or breadcrumb; a unified "places I belong" view
  combining Projects and Spaces; a soft-targeting UI that converts
  natural-language scope hints ("in the marketing project") into
  explicit `project_id` filters.
- **What this would give up:** crisp legibility of every scope change;
  some auditability — soft transitions are harder to replay than dialog
  confirmations.
- **Smallest provable slice:** two weeks for a unified Personal HQ
  showing all of a user's Projects and Spaces, an "ask my AI"
  affordance whose context dynamically narrows as the user navigates,
  and a replayable trail of which scope each utterance was answered
  in.

### Network-Native Identity (identity-mesh-commonwealth)

Identity is negotiated across peers. Orgs trust other Orgs through
explicit roots; Spaces span peer organizations under capability lease;
agents act under negotiated capability tokens that can be revoked.
This is the identity layer required for **Distributed AI Delegation**
(vault-candidate term): a peer routing inference through another peer's
credentials presupposes a trust model.

- **What this would force you to build first:** peer-trust roots at
  the Org level (`graph/edges/transport.md` placement work has to grow
  here); capability tokens with explicit scope, expiry, and revocation
  surfaces; a **Ghost Space** lifecycle for ephemeral cross-Org
  collaboration with TTL and self-destruct semantics.
- **What this would give up:** the simplicity of "an Org owns its
  members"; any single source of truth about who a user "is" — they
  become a federated identity with multiple trust roots.
- **Smallest provable slice:** two weeks to ship two daemons (Org A,
  Org B), a Ghost Space spanning both with a 7-day TTL, capability
  tokens that let a member of Org A read one Wiki node in Org B's
  Space, and a visible revocation flow.

## Decision pressure

1. **Agents as first-class members vs principal-delegated (Q1)** —
   First-class enables clean attribution; delegated keeps the
   permission surface small.
2. **N:M Project↔Space vs Space-inside-Project (Q3)** — N:M enables
   real cross-project collaboration; nested keeps the mental model
   simple.
3. **Personal AI on user's machine vs in daemon (Q4)** — On-device
   wins privacy; in-daemon wins capability and continuity.
4. **Inherited permissions vs policy bundles (Q10)** — Inheritance is
   teachable; bundles are auditable and composable.
5. **Ghost Spaces in v1 vs deferred** — In v1 unlocks ephemeral
   collaboration patterns; deferred keeps the Space lifecycle simple.
6. **Single-Org users vs federated identity** — Single-Org is shippable
   now; federated is required for any mesh future.

## Read next

- `lib/ema-atlas.ts` — part `slug: "identity-project-space"`, visions
  `identity-operator-cathedral`, `identity-living-workspace`,
  `identity-mesh-commonwealth`.
- `graph/edges/identity.md`
- `design-review-fresh-context/05-fresh-context-project-app-model.md`
- `02-project-transfer-brief.md` §11 (required identity separations)
- `MACBOOK_AGENT_HANDOFF_MASTER.md` §12 (org/space/permission model)
- `docs-host-obsidian-vault/.../EMA Mesh Architecture.md` (Space typed
  taxonomy + Ghost Space)
- `OPEN_QUESTIONS.md` Q1, Q3, Q4, Q10
- `codebase-ema/code/ema/daemon/lib/ema/` (target home for
  `control_plane/schema.ex`)
