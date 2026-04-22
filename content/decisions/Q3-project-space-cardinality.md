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
| Aligns with canonical rule (P1) | Registry is authority. | + | + | + | + |
| Compatible with Q-deps if open | Q1, Q4, Q10. | 0 (Q10 inherits from two scopes) | 0 (Q10 inherits Space→Project) | 0 (Q10 inherits Project→Space) | + (each tree resolves Q10 independently) |
| Smallest provable slice | 2-week vertical. | – (join table + dual reads + cross-scope tests) | + (single `SpaceId` per Project) | + (single `ProjectId` per Space) | 0 (two trees, no join) |
| Reversible | Migrate off cleanly. | + (most general → collapse to B/C/D) | – (Project→Space promotion needed for N:M) | – (Space→Project promotion needed for N:M) | 0 (D→A easy; D→B/C awkward) |
| Gleam-native | Typed without FFI. | + (`List` types) | + (`SpaceId` field) | + (`ProjectId` field) | + (no cross-references) |
| Auditability | Control-plane-visible. | 0 (cross-scope writes record both contexts) | + (Space canonical) | + (Project canonical) | + (each `event_log` independent) |
| Tests writable in v0.0.3 | gleam_qcheck. | – (membership property becomes 4-way) | + (single direction) | + (single direction) | 0 (two simple property tests) |
| Identity-model-clean (Q1) | Doesn't constrain Q1. | + | + | + | + |
| P10 (Org/Space first-class) | v1, not v2. | + (both peers) | + (Space canonical) | 0 (Space risks v2 furniture) | + (both independent) |
| Match to 05- doc framing | "EMA instance is within a project" + "Projects/spaces can have different datasets" + "personal AI can access all projects/spaces". | 0 (allows but exceeds) | – (Spaces become larger — collides with "EMA instance is within a project") | + (matches verbatim) | 0 (matches "orthogonal to Projects" from `GLOSSARY.md`) |
| Personal AI scope resolution | Resolver per `personal_ai_resolver.gleam`. | 0 (walks both directions; potential cross-Project scope leak via shared Space) | + (Space→Projects, one direction) | + (Project→Spaces, one direction) | + (set-union over both memberships) |
| Collaboration object placement (P9) | Where do Wiki/Canvas/Threads live? | – (Collab object in a Space spans multiple Project shards) | + (lives in Space; Projects inherit) | + (lives in Project; Spaces decompose) | 0 (collab keyed by Space; Project artifacts by Project) |
| `event_log` shard story | Per `ARCHITECTURE.md`, every record carries `project_id`; sharded by `project_id`. | 0 (Spaces span shards — fan-out needed) | – (Space writes have no canonical shard) | + (Space inside one Project — uses parent shard) | 0 (Spaces get own shards) |
| Discord migration / Threads model | Per `05-...-model.md` §3, Discord servers/channels map to Spaces. | 0 (multi-server / multi-project both possible — ambiguous UI) | + (server↔Space; matches Discord intuition) | 0 (one Project owns its server — limits cross-Project Threads) | 0 (servers map to Spaces; Projects absent) |
| Build-step alignment | Step 2 codes N:M with `Project.spaces` + `Space.projects` lists. | + (no change) | – (collapse `Project.spaces`, rewrite `RegistryMsg`) | – (collapse `Space.projects`, rewrite `Space` record) | – (drop cross-references; remove `project_spaces` from schema) |
| Navigation / UI cost | Launchpad/HQ/Virtual Desktop. | – (two browse axes; "in N Spaces / contains N Projects") | + (browse Spaces, drill in) | + (browse Projects, drill in) | 0 (two independent axes; UX must teach the split) |

## Costs and bets

For each option, two bullets each.

### Option A — `N:M`
- **Bet:** Product usage will demand cross-Project Spaces (shared
  design system across three Projects) and cross-Space Projects
  (one Project in both "engineering" and "client A" Spaces).
  Schema flexibility now is cheaper than a migration.
- **Cost:** Every Space-scoped `event_log` write needs a rule for
  which Project shard receives it (or a separate Space shard,
  breaking the `project_id`-key architecture).
  `personal_ai_resolver` walks two relations and de-duplicates.
  Permission inheritance becomes lattice-shaped — a Member can
  reach an object via Project *or* Space membership, with
  collision potential. Q10 inherits this complexity.

### Option B — `Project-inside-Space`
- **Bet:** Spaces are long-lived organizing units (organizations,
  communities, tenants); Projects are work units inside them.
  Discord-replacement framing supports this: server (Space) →
  channels by topic (Projects). Changing tenant is destructive
  anyway.
- **Cost:** Collides with the 05- doc's "EMA instance is within a
  project" — Spaces become the larger thing, inverting the
  framing. Space-level writes have no canonical `event_log` shard.
  Personal AI scope from a user who is a Space member but not a
  member of any contained Project is undefined.

### Option C — `Space-inside-Project`
- **Bet:** Project is the canonical EMA-instance-binding unit per
  the 05- doc. Spaces decompose a Project's collaboration surface
  ("engineering Space inside Project Acme"). Space writes go to
  the parent Project's shard naturally; Personal AI scope
  resolution is one-directional.
- **Cost:** Spaces lose first-class character — "subdivisions of a
  Project" collides with `GLOSSARY.md`'s "orthogonal to Projects."
  Cross-Project Spaces (a shared "ops" Space across an Org) need
  a separate mechanism. Threads/Server cross-Project visibility
  has to be invented.

### Option D — `disjoint-with-shared-membership`
- **Bet:** Project and Space solve different problems. Project
  owns the EMA instance, workspace root, `event_log` shard,
  default harness policy. Space owns collaboration scope, Threads,
  Collaboration objects. Forcing containment is friction that
  doesn't reflect the semantics. Cross-tree references are
  explicit ids when needed.
- **Cost:** Two trees = two indexes, two browse axes, two "where
  does this live?" stories. `personal_ai_resolver` does explicit
  set-union. Permission inheritance is two stories that policy
  bundles must compose. Cross-tree references become first-class
  and need their own typed shape.

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

- **A → B / A → C.** For each Project (or Space), pick a canonical
  Space (or Project), or fail the migration on ambiguity. Drop the
  join table. Days, plus data review for ambiguous rows.
- **A → D.** Drop both cross-references; membership tables stay.
  Days; collab objects keyed by Space remain valid.
- **B / C → A.** Promote the single foreign key to a join table.
  Trivial schema-side; the cost is downstream — every read site
  that assumed singularity now handles a list. 1-2 weeks of
  touch-up.
- **B / C → D.** Drop the foreign key; backfill any artifact that
  depended on containment with an explicit cross-reference; emit
  a one-time "implicit relationship cutoff" audit event. 1-2 weeks.
- **D → containment-shaped.** Hardest — no recorded relationship to
  migrate from. Infer (e.g. "Project the Space's creator first
  joined") and human-review per Space.
- **What records does the chosen option produce that would have to
  be rewritten on migration?** A: `project_spaces` join + every
  Space-scoped `event_log` row. B: every `Project.space` foreign
  key. C: every `Space.project` foreign key, plus collab object
  scope keys assuming Project-uniqueness. D: nothing in the schema,
  but un-bridged artifacts are invisible to migration.

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
