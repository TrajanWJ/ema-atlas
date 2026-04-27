# Identity / Org / Project / Space — Gleam mapping

## Part summary

Identity is the tenancy model: how human, agent, Personal AI, Org,
Project, and Space compose so the system can answer "who is allowed
to do what, where, on whose behalf?" Today there is no schema in
the lineage — `graph/edges/identity.md` calls it the
highest-blast-radius missing piece, and EMA_V0_0_3_PREP.md gate #7
makes Org/Space/Project/Member a v0.0.3 prerequisite. The Gleam
port lands these as opaque ID types with a registry actor and a
`context_for(project)` resolution path.

## Type sketch

```gleam
import gleam/option.{type Option}
import gleam/list

pub opaque type OrgId { OrgId(String) }
pub opaque type ProjectId { ProjectId(String) }
pub opaque type SpaceId { SpaceId(String) }
pub opaque type MemberId { MemberId(String) }
pub opaque type PolicyBundleId { PolicyBundleId(String) }

pub type Org { Org(id: OrgId, name: String) }

pub type Project {
  Project(id: ProjectId, org: OrgId, name: String,
          spaces: List(SpaceId))
}

pub type SpaceKind {
  PersonalSpace
  OrganizationSpace
  SharedSpace
  GhostSpace(ttl_ms: Int)        // vault-candidate
  PublicSpace
}

pub type Space {
  Space(id: SpaceId, kind: SpaceKind,
        org: Option(OrgId), projects: List(ProjectId))
}

pub type Member {
  HumanMember(id: MemberId, org: OrgId, display: String,
              policy: PolicyBundleId)
  AgentMember(id: MemberId, org: OrgId, principal: MemberId,
              policy: PolicyBundleId)        // Q1-dependent variant
}

pub type ScopeQuery {
  ScopeQuery(actor: Actor, target: ScopeTarget)
}

pub type ScopeTarget {
  ProjectScope(ProjectId)
  SpaceScope(SpaceId)
  CrossProject(List(ProjectId))
}

pub type Allowance { Allowed Denied(reason: String) Elevated(by: Actor) }
```

## Actor sketch

```gleam
pub type RegistryMsg {
  PutOrg(org: Org)
  PutProject(project: Project)
  PutSpace(space: Space)
  PutMember(member: Member)
  ResolveProject(id: ProjectId, reply_to: Subject(Option(Project)))
  ContextFor(project: ProjectId, actor: Actor,
             reply_to: Subject(ProjectContext))
  ListMembershipsFor(member: MemberId,
                     reply_to: Subject(List(ProjectId)))
}

pub type PolicyMsg {
  Evaluate(query: ScopeQuery, reply_to: Subject(Allowance))
  PutBundle(id: PolicyBundleId, rules: List(Rule))
}

pub type ProjectContext {
  ProjectContext(
    project: Project,
    member: Option(Member),
    spaces: List(Space),
    open_handoffs: List(HandoffId),
    recent_events: List(EventRef),
  )
}
```

- `ema/identity/registry` — `Subject(RegistryMsg)`. New for v0.0.3;
  no Elixir analog. Persists via SQLite under `control_plane/schema.ex`.
- `ema/identity/policy` — `Subject(PolicyMsg)`. New; evaluates
  `PolicyBundle` rules. Today there is no policy code anywhere.
- `ema/identity/personal_ai_resolver` — pure functions over a
  `RegistryMsg` snapshot; resolves "what scope does this member's
  Personal AI see right now?" given current surface context.

## Supervision tree fragment

```text
root_supervisor
└── identity/supervisor (rest_for_one, BOOTS EARLY)
    ├── identity/registry
    └── identity/policy
```

`identity/supervisor` boots after `config/supervisor` and
`persistence/repo` but *before* `workspace/supervisor`,
`control_plane/supervisor`, `coordination/supervisor`,
`semantic/supervisor`, and `surfaces/supervisor` — every later subtree
needs to dereference `ProjectId`/`MemberId` to admit any write.

## Where it leans on Erlang/Elixir interop

- SQLite via `sqlight` for the persistent Org/Project/Space/Member
  tables. Column types and constraints expressed via raw SQL strings;
  Gleam has no migration DSL, so this is `:esqlite3` raw `EXEC`s.
- `:crypto.strong_rand_bytes/1` for opaque ID generation.
- `:erlang.system_time(:millisecond)` for `GhostSpace(ttl_ms)`
  expiry checks.
- For peer trust roots (mesh-commonwealth vision): FFI to `:public_key`
  for X.509 / Ed25519 verification of peer Org certificates. Gleam has
  no native crypto wrapper for this.
- A periodic `ttl_sweeper` actor uses `:timer.send_interval/2` to
  scan `GhostSpace` entries and emit a `RetireSpace` command into
  `command_bus` when expired.
- For Personal AI scope resolution that crosses peers (Q4 dependent),
  `:rpc.call/4` would be the BEAM-native way — Gleam wraps via FFI.

## Tests this part needs at v0.0.3

- Identity-separation test (per gate #4 of EMA_V0_0_3_PREP.md):
  `OrgId`, `ProjectId`, `SpaceId`, `MemberId` — plus the IDs from
  other parts (`ExecutionId`, `SessionId`, `ProviderSessionId`,
  `WorkspaceArtifactId`, `PeerId`) — are pairwise non-coercible.
  Compile-fail fixture covers all 9 × 8 / 2 pairs.
- Property test (`gleam_qcheck`): for any sequence of `PutMember`
  / `PutProject` calls, `ListMembershipsFor` returns exactly the
  projects whose Member rows reference the queried `MemberId`.
- `context_for` round-trip test: a `ContextFor(project, actor)` call
  returns a `ProjectContext` whose `recent_events` is bounded and
  whose `member` is populated iff the actor is a member of the
  project (per `AGENT-CONTRACT.md` "Preferred read path" #2).
- Policy-bundle test: an `AgentMember` with a `PolicyBundle` that
  denies cross-project reads gets `Denied(_)` for `CrossProject(...)`
  scope queries; an elevated bundle returns `Elevated(by: ...)`.
- Ghost-space TTL test: a `GhostSpace(ttl_ms: 100)` is reported as
  `Retired` by the registry within 1s of expiry, and the retire is
  recorded in `event_log`.
- Personal AI scope test: a Personal AI request from a member of two
  projects, while their current surface context is project A, returns
  hits from project A only unless explicit elevation is provided.

## Open questions specific to Gleam mapping

- **Q1** — the `Member` sum currently includes `AgentMember`, but
  whether that variant ships at all is the v0.0.3 question. If Q1
  resolves "no", `Member` collapses to `HumanMember(...)` only and
  every agent-attributed action in workspace, semantic, coordination,
  and execution loses a typed identity hook.
- **Q3** — `Project.spaces: List(SpaceId)` and `Space.projects:
  List(ProjectId)` together encode N:M. If Q3 picks
  `Project-inside-Space` or `Space-inside-Project`, one of these
  fields must collapse to `Option`, which forces a schema migration
  on every consumer (workspace, semantic, coordination).
- **Q4** — Personal AI placement default is unknown; today the
  resolver returns `Placement.Local` by default which is a guess. A
  typed default needs a `Placement` constructor in `RegistryMsg`.
- **Q10** — `PolicyBundle.rules` is currently `List(Rule)` with no
  defined `Rule` shape. If Q10 picks "simple inheritance," `Rule`
  collapses to a parent-bundle reference. If it picks "explicit
  policy bundles," `Rule` needs a richer sum.
- **Ghost Space in v1?** — The `GhostSpace(ttl_ms)` variant compiles
  today but the lifecycle (key rotation, self-destruct attestation)
  is undefined; this is a Gleam-side pressure not yet captured as a
  numbered open question.

## Read next

- `graph/edges/identity.md`
- `content/briefs/identity-project-space.md`
- `design-review-fresh-context/05-fresh-context-project-app-model.md`
- `02-project-transfer-brief.md` §11 (required identity separations)
- `docs-host-obsidian-vault/.../EMA Mesh Architecture.md` (Space
  typed taxonomy, Ghost Space)
- `EMA_V0_0_3_PREP.md` gate #4, gate #7
- `OPEN_QUESTIONS.md` Q1, Q3, Q4, Q10
- `sqlight`: https://hexdocs.pm/sqlight/
