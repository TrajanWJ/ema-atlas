# Decision matrix — Q3 (Project ↔ Space cardinality)

Per-question decision matrix for resolving Q3 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> A matrix forces you to write the cost on each option **before** you
> pick. The point is that you should be able to read the matrix back
> later and see why the chosen option won — including in cases where
> the choice turns out wrong.

## Question

`Q3` — `Project ↔ Space cardinality`

(Restated verbatim from
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q3.)

The question's stated **blast radius** is "schema design, navigation
UI, permission model, personal-AI access resolution," surfacing in
`graph/edges/identity.md` and
[`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md)
(which "uses both terms"). The four named variants in `OPEN_QUESTIONS`
are: `N:M`, `Project-inside-Space`, `Space-inside-Project`,
`disjoint-with-shared-membership`.

The 05- doc framing matters: it is a raw user note that says (verbatim)
"Each instance of these apps / each EMA instance is **within a
project**", "Projects can belong to an organization or be personal
projects", "Projects/spaces can have different datasets", and "A
user's personal AI can access all projects/spaces they are part of".
The doc treats Project as the EMA-instance-binding unit and Space as
"collaboration scope inside an Org, orthogonal to Projects" (per
`GLOSSARY.md`). Q3 picks how that orthogonality is encoded.

## Options being weighed

The four variants named in `OPEN_QUESTIONS.md`:

| Option | Short name | One-line description |
|---|---|---|
| Option A | `N:M` | A Project can belong to many Spaces and a Space can contain many Projects. Encoded today in [`research/build-steps/02-identity-registry-skeleton.md`](../../research/build-steps/02-identity-registry-skeleton.md) as `Project.spaces: List(SpaceId)` + `Space.projects: List(ProjectId)` with a `project_spaces` join table. |
| Option B | `Project-inside-Space` | Every Project lives in exactly one Space; Spaces are the outer container. `Project.spaces` collapses to `Project.space: SpaceId` (one); `Space.projects: List(ProjectId)` (many). |
| Option C | `Space-inside-Project` | Every Space lives in exactly one Project; Projects are the outer container. `Space.projects` collapses to `Space.project: ProjectId` (one); `Project.spaces: List(SpaceId)` (many). |
| Option D | `disjoint-with-shared-membership` | Projects and Spaces are **independent** trees. Neither contains the other. They share only `Member` rows: a human can be a Member of Projects and of Spaces independently, and Collaboration objects can reference either scope by id. |

## Criteria

For each criterion, score each option `+ / 0 / – / blocker`. Add a
one-line "why" inline. Don't average — the criteria are not
interchangeable.

| Criterion | Why it matters | A `N:M` | B `Project-inside-Space` | C `Space-inside-Project` | D `disjoint-with-shared-membership` |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state; the registry is the authority. | + | + | + | + |
| Compatible with Q-deps if open | Q1 (agents-as-Members), Q4 (Personal AI placement), Q10 (perms mapping) are all open. | 0 (does not constrain Q1; complicates Q10 because two scopes inherit) | 0 (Spaces dominate; Q10 inherits from Space → Project) | 0 (Projects dominate; matches the 05- doc's "EMA instance is within a project" line) | + (least entangled — each tree resolves Q10 independently) |
| Smallest provable slice | Can we exercise it in a 2-week vertical? | – (join table + dual reads + cross-scope tests) | + (single SpaceId per Project; tests are unidirectional) | + (single ProjectId per Space; matches Step 2's Project record naturally) | 0 (two trees, no join — but two separate property-test surfaces) |
| Reversible | Can we migrate off it cleanly later? | + (most general → can collapse to B, C, or D) | – (Project → Space promotion needed if N:M is chosen later) | – (Space → Project promotion needed if N:M is chosen later) | 0 (D → A is easy via union; D → B/C is awkward) |
| Gleam-native | Can we express it in typed Gleam without FFI escapes? | + (`List(SpaceId)` + `List(ProjectId)` are vanilla types) | + (`SpaceId` field on Project — clean) | + (`ProjectId` field on Space — clean) | + (no cross-references at all in the type) |
| Auditability | Does it produce control-plane-visible records? | 0 (cross-scope writes need to record both Project and Space context) | + (writes are unambiguously scoped — Space is canonical) | + (writes are unambiguously scoped — Project is canonical) | + (each tree's `event_log` is independent; collab references are explicit) |
| Tests writable in v0.0.3 | gleam_qcheck properties + example tests | – (membership round-trip property doubles to "for any Project, all Spaces it's joined to ↔ for any Space, all Projects in it"; Step 2's `registry_property_test.gleam` becomes a 4-way invariant) | + (single direction; matches Step 2's existing property exactly) | + (single direction; matches Step 2's existing property exactly) | 0 (two property tests, but each is simple) |
| Identity-model-clean (Q1) | Doesn't constrain Q1 resolution. | + | + | + | + |
| P10 compliance (Org/Space first-class) | Multi-tenant scoping in v1, not v2. | + (both are first-class peers) | + (Space is canonical; Project lives "under" it) | 0 (Space becomes a sub-scope of Project — risk of being treated as v2 furniture) | + (both are first-class and independent) |
| Match to 05- doc framing | "EMA instance is within a project"; "Projects/spaces can have different datasets"; "personal AI can access all projects/spaces" — the 05- doc names both, treats Project as instance-binding, and gives Space its own datasets. | 0 (allows the 05- doc reading but does more than required) | – (collides with "EMA instance is within a project" — Spaces would be the larger thing) | + (matches "EMA instance is within a project" verbatim; Spaces are sub-scopes for collaboration) | 0 (matches "orthogonal to Projects" from `GLOSSARY.md` literally; doesn't directly match "EMA instance is within a project") |
| Personal AI scope resolution | Personal AI must "access all projects/spaces they are part of" (`05-fresh-context-project-app-model.md`); resolver per `personal_ai_resolver.gleam` (Step 2). | 0 (resolver must walk both directions; potential for accidental scope leak across Projects via shared Space) | + (resolver walks Space → Projects; one direction) | + (resolver walks Project → Spaces; one direction) | + (resolver does set-union over the member's Project memberships and Space memberships separately) |
| Collaboration object placement (P9) | Per `ARCHITECTURE.md`, the collab plane is adjacent to the control plane. Where does a Wiki/Canvas/Threads object live? | – (a Collaboration object in a Space spans multiple Projects' event_log shards — substrate must reconcile) | + (Collaboration objects clearly live in the Space; Projects under it inherit) | + (Collaboration objects clearly live in the Project; Spaces decompose it) | 0 (Collaboration objects key by Space; Project-side artifacts key by Project; clean) |
| `event_log` shard story | Per `ARCHITECTURE.md`, "every control-plane record carries `project_id` from day one"; `event_log` is sharded by `project_id`. | 0 (Spaces span shards — cross-Project Space write needs a fan-out) | – (Space-level writes have no canonical shard until they pick a Project; either invent a Space shard or pick one Project as canonical) | + (Spaces are inside one Project; Space-level writes go to that Project's shard naturally) | 0 (Spaces get their own shards — separate but symmetric) |
| Discord migration / Threads model | Per [`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md) §3, Threads/Server is "EMA-integrated, EMA-first mirror of what Discord does now" — Discord servers/channels map to Spaces. | 0 (multi-server-per-project and multi-project-per-server are both possible — flexible but ambiguous in UI) | + (one Discord server ↔ one Space, multiple Projects in it — matches Discord's "server contains many channels which serve many topics" intuition) | 0 (one Project owns its Discord server — works but limits cross-Project Threads) | 0 (Discord servers map to Spaces; Projects don't appear in Discord at all) |
| Build-step alignment | Step 2 currently codes the assumption (`Project.spaces` + `Space.projects` lists). | + (no change to Step 2) | – (collapse `Project.spaces` to `Option(SpaceId)` or `SpaceId`; rewrite Step 2's `RegistryMsg` for `PutSpace` to require an Org instead of a Project list) | – (collapse `Space.projects` to `Option(ProjectId)` or `ProjectId`; rewrite Step 2's `Space` record similarly) | – (Drop the cross-references entirely from both records; rewrite the `project_spaces` join table out of `schema.gleam`) |
| Navigation / UI cost | Launchpad / HQ / Virtual Desktop have to render the relationship. | – (UI must show "this Project is in N Spaces; this Space contains N Projects" — two browse axes) | + (browse Spaces, drill into Projects) | + (browse Projects, drill into Spaces — most aligned with "EMA instance is within a project") | 0 (two independent browse axes; UX must teach the user that they're separate) |

## Costs and bets

For each option, two bullets each.

### Option A — `N:M`
- **Bet:** Real product usage will demand cross-Project Spaces (a
  shared design system Space across three Projects) and cross-Space
  Projects (a Project that participates in both an "engineering"
  Space and a "client A" Space). Schema flexibility now is cheaper
  than a migration later.
- **Cost:** Every `event_log` write that is "in a Space" needs a
  rule for which Project's shard it lands in (or a separate Space
  shard, breaking the "everything keys by `project_id`"
  architecture). The `personal_ai_resolver` has to walk two
  relations and de-duplicate. Property tests double. Permission
  inheritance becomes lattice-shaped (a Member can reach an object
  via Project membership *or* Space membership; collisions and
  contradictions become possible). Q10 inherits this complexity.

### Option B — `Project-inside-Space`
- **Bet:** Spaces are the long-lived organizing unit (think:
  organizations, communities, tenants). Projects are work units
  inside them. The Discord-replacement framing supports this:
  Discord servers (Spaces) contain channels that are organized by
  topic (Projects). One Project lives in exactly one Space because
  changing tenant is a destructive operation anyway.
- **Cost:** Collides with the explicit 05- doc statement that "each
  EMA instance is within a project" — Spaces become the larger
  thing, which inverts the doc's framing. The `event_log` shard
  question becomes awkward: Space-level writes have no canonical
  shard. Personal AI scope resolution from a user who is a Space
  member but not a member of any of its Projects is undefined.

### Option C — `Space-inside-Project`
- **Bet:** Project is the canonical EMA-instance-binding unit, as
  the 05- doc states. Spaces are how a Project decomposes its
  collaboration surface — "the engineering Space inside Project
  Acme", "the design Space inside Project Acme". One Space lives in
  exactly one Project. This keeps `event_log` shard story trivial
  (Space writes go to the parent Project's shard) and keeps
  Personal AI scope resolution one-directional.
- **Cost:** Spaces lose their independent first-class character —
  they become "subdivisions of a Project". This collides with the
  `GLOSSARY.md` definition that calls Space "orthogonal to
  Projects". Cross-Project Spaces (a shared "ops" Space across all
  Projects in an Org) become impossible without a separate
  cross-Project mechanism. Threads/Server cross-Project visibility
  has to be invented (e.g. a special Org-level "Space" that doesn't
  fit the schema).

### Option D — `disjoint-with-shared-membership`
- **Bet:** Project and Space solve different problems. Project owns
  the EMA instance, the workspace root, the `event_log` shard, the
  default harness policy (per Step 2's `Project` record). Space owns
  collaboration scope, Threads, and Collaboration objects (per the
  05- doc and `GLOSSARY.md`). Forcing a containment relationship is
  modelling friction that doesn't reflect the actual semantics.
  Collaboration objects in a Space reference Project-shard rows by
  id; Project records reference Space ids only when an artifact
  explicitly bridges them.
- **Cost:** Two trees means two indexes, two browse axes in the UI,
  and two separate "where does this thing live?" answers for any
  artifact. The user has to understand the distinction.
  `personal_ai_resolver` must do explicit set-union over both
  membership types. Permission inheritance is two stories (Project
  perms, Space perms) that policy bundles must compose. Cross-tree
  references (a Wiki page in a Space that references an
  `event_log` row in a Project) become first-class — and need their
  own type and reversibility story.

## Open questions this decision creates

Resolving Q3 almost always opens new questions. Candidates the matrix
surfaces:

- **Q3.a — Cross-scope write authority.** If a Space spans Projects
  (A or D), which Project's `event_log` shard records a Space-scoped
  authority event? Possible answers: a "Space shard" alongside
  Project shards; replicate to every contained Project; designate
  one Project as canonical.
- **Q3.b — Permission composition.** If a Member can reach an object
  via Project membership *and* Space membership (A or D), which
  policy bundle wins on contradiction? Most-permissive? Most-
  restrictive? Explicit precedence? This is downstream of Q10 but
  the cardinality choice changes the surface.
- **Q3.c — Collaboration object scope key.** Does a Collaboration
  object key by `ProjectId`, `SpaceId`, both, or a sum
  `Scope = ProjectScope(ProjectId) | SpaceScope(SpaceId)`? Step 2
  already has `ScopeTarget = ProjectScope(ProjectId) |
  SpaceScope(SpaceId) | CrossProject(List(ProjectId))`; whether
  `SpaceScope` survives Q3 depends on the cardinality.
- **Q3.d — Default Space for a fresh Project (B).** If Spaces
  contain Projects, every new Project needs a Space. Is there an
  auto-created "default Space" per Org? Per User (for personal
  Projects)?
- **Q3.e — Discord server mapping.** Q6 ("Discord mirror direction")
  becomes Q3-dependent: which scope (Project or Space) maps to a
  Discord server depends on which one is the "container" the user
  thinks in.

## Reversibility plan

If we pick the chosen option and it turns out wrong, what's the
migration shape?

- **From `N:M` to `Project-inside-Space`.** For each Project,
  pick one canonical Space (or fail the migration if the Project is
  in zero or more than one). Drop the join table. Time: days, plus
  user-facing data review for ambiguous Projects.
- **From `N:M` to `Space-inside-Project`.** Symmetric: for each
  Space, pick one canonical Project. Drop the join table. Time:
  days, with the same ambiguity caveat.
- **From `N:M` to `disjoint-with-shared-membership`.** Drop both
  cross-references; keep the membership tables as the only link.
  Easy in schema terms; collab objects keyed by Space stay valid.
  Time: days.
- **From `Project-inside-Space` or `Space-inside-Project` to
  `N:M`.** Promote the single foreign key to a join table; backfill
  with one row per existing relationship. Trivial schema-wise; the
  cost is downstream (every read site that assumed singularity now
  has to handle a list). Time: 1-2 weeks of touch-up across
  consumers.
- **From any inside-the-other variant to
  `disjoint-with-shared-membership`.** Drop the foreign key; demand
  that any existing artifact that depended on the containment now
  carries an explicit cross-reference. Need a one-time backfill that
  walks every Collaboration object and writes its Project/Space
  binding explicitly. Time: 1-2 weeks; the audit story for "before
  this date, Project/Space relationship was implicit" needs a
  one-time event.
- **From `disjoint-with-shared-membership` to anything containment-
  shaped.** Hardest. There is no recorded relationship to migrate
  from; you have to *infer* one (e.g. "the Project the Member who
  created this Space first joined"). Likely needs human review per
  Space.
- **What records does the chosen option produce that would have to
  be rewritten on migration?** For A: the `project_spaces` join
  table and any `event_log` row with a Space scope. For B: every
  `Project` row's `space: SpaceId` foreign key. For C: every
  `Space` row's `project: ProjectId` foreign key, and Collaboration
  object scope keys that assumed Project-uniqueness. For D: nothing
  in the schema, but every artifact that *should* have been bridged
  but wasn't is invisible to migration.

## Provenance

Cite every external doc, vault note, or branch read while filling this
in. The matrix is only as good as its grounding.

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) — Q3 wording, blast
  radius, the four named variants.
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) — P1, P9
  (collaboration plane), P10 (Org/Space first-class).
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — identity model
  sketch ("Q1, Q3 still open"); `event_log` sharded by
  `project_id`; `Project.spaces: List(SpaceId)` placeholder.
- [`research/parts/identity-project-space.md`](../../research/parts/identity-project-space.md)
  — `Project.spaces: List(SpaceId)`; `Space.projects:
  List(ProjectId)`; `ScopeTarget = ProjectScope | SpaceScope |
  CrossProject`; the explicit Q3 note: "If Q3 picks
  `Project-inside-Space` or `Space-inside-Project`, one of these
  fields must collapse to `Option`, which forces a schema migration
  on every consumer."
- [`research/build-steps/02-identity-registry-skeleton.md`](../../research/build-steps/02-identity-registry-skeleton.md)
  — Coded assumption (N:M, encoded as the dual List fields); the
  `project_spaces` join table in `schema.gleam`; the `Q3` "open
  questions held open" gloss.
- [`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md)
  — "Each instance of these apps / each EMA instance is within a
  project"; "Projects can belong to an organization or be personal
  projects"; "Projects/spaces can have different datasets"; "A
  user's personal AI can access all projects/spaces they are part
  of"; §3 Threads/Server framing as Discord replacement.
- [`GLOSSARY.md`](../../GLOSSARY.md) — Project ("the unit each EMA
  instance binds to. Owns an event_log shard, a workspace root,
  sessions, harness policy, datasets"); Space ("Collaboration
  scope inside an Org, orthogonal to Projects. Owns
  membership-with-roles, channels/threads, collaboration objects");
  Member; Personal AI; vApp.
- [`research/COLLAB_PLANE_OPTIONS.md`](../../research/COLLAB_PLANE_OPTIONS.md)
  — "Permission gating implications" section: "Org/Space scoping
  intersects with substrate at the question of *document
  identity*" — choice of cardinality affects how Collaboration
  objects key.

## Decision

> **Resolution:** `<chosen option short name>`, decided `<YYYY-MM-DD>`.
> Recorded in: `<link to commit / decision doc / blockquote in node body>`.
> Affects: `<other Q-numbers whose blast radius shrinks>`.

When you fill the Decision section in, also:

1. Edit [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md): mark Q3 as
   `status: resolved YYYY-MM-DD → <link>`. **Do not delete the entry.**
2. Move any working assumptions in
   [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) that depended on
   Q3 to confidence-styled language, or move them into a hardened
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
- [`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md)
