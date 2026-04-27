# Step 2 — Identity registry skeleton

> **Goal:** land Org/Space/Project/Member/Agent as a first-class
> control-plane schema with a typed registry actor and a
> `context_for(project, actor)` resolution path. After this step,
> every later subsystem can dereference `ProjectId` / `MemberId` before
> admitting a write — no more "no scope" defaults.
>
> **Depends on:** Step 1 (control plane skeleton). Identity persists in
> the same sqlight handle owned by `ema_control_plane/persistence`, and
> registry mutations write `IdentityChanged` events into `event_log`.
>
> **Open questions held open:**
> - **Q1** (agent-as-Member). Coded assumption: ship the
>   `AgentMember(...)` variant on the `Member` sum so downstream code
>   has a typed identity hook. If Q1 resolves "no", `AgentMember` is
>   deprecated to a separate `AttachedAgent` table; if "yes", it stays.
>   Either way, Step 2 does not collapse to `HumanMember`-only.
> - **Q3** (Project ↔ Space cardinality). Coded assumption: N:M, encoded
>   as `Project.spaces: List(SpaceId)` + `Space.projects: List(ProjectId)`.
>   If Q3 resolves to `Project-inside-Space` or `Space-inside-Project`,
>   one field collapses to `Option`. The schema migration is owned by
>   the Q3 resolution doc, not by this step.
> - **Q4** (Personal AI placement default). Coded assumption: registry
>   returns `Placement.Local` as the default for Personal AI dispatches
>   until Q4 picks otherwise. The default is one constant in
>   `personal_ai_resolver.gleam` so the change is one line.
> - **Q10** (org/space → runtime perms). Coded assumption: simple
>   inheritance for v0.0.3 — a `PolicyBundle` is a flat list of `Rule`
>   values and `policy.Evaluate` is a linear scan. If Q10 picks
>   "explicit policy bundles," `Rule` grows a richer sum without
>   touching the actor surface.
> - **GhostSpace lifecycle.** Not yet a numbered Q. Coded assumption:
>   the `GhostSpace(ttl_ms)` variant compiles and a TTL sweeper retires
>   expired spaces; key rotation / self-destruct attestation are out of
>   scope for v0.0.3.

## What this step produces

Concrete Gleam modules under `apps/ema/src/ema_identity/`:

- `ids.gleam` — opaque `OrgId`, `SpaceId`, `PolicyBundleId` (extending
  the id set introduced in Step 1's `ema_control_plane/ids.gleam`).
  `MemberId` and `ProjectId` are re-exported from Step 1.
- `org.gleam`, `project.gleam`, `space.gleam`, `member.gleam` — the
  domain records.
- `policy.gleam` — `PolicyBundle`, `Rule`, `Allowance`, `ScopeQuery`.
- `registry.gleam` — actor; owns `Subject(RegistryMsg)`.
- `policy_evaluator.gleam` — actor; owns `Subject(PolicyMsg)`.
- `personal_ai_resolver.gleam` — pure functions over a registry snapshot.
- `schema.gleam` — sqlight `EXEC` strings for table creation
  (`orgs`, `projects`, `spaces`, `members`, `project_spaces`,
  `policy_bundles`).
- `ttl_sweeper.gleam` — periodic actor for `GhostSpace` expiry.
- `supervisor.gleam` — `static_supervisor` builder, `RestForOne`.

Plus tests under `apps/ema/test/ema_identity/`:

- `id_separation_test.gleam` (extends Step 1's compile-fail fixture
  to cover `OrgId` ↔ `SpaceId` ↔ `MemberId` ↔ `PolicyBundleId`).
- `context_for_test.gleam`
- `policy_evaluator_test.gleam`
- `ghost_space_ttl_test.gleam`
- `personal_ai_scope_test.gleam`
- `registry_property_test.gleam`

## Type sketches

```gleam
import gleam/option.{type Option}
import gleam/erlang/process.{type Subject}
import ema_control_plane/ids.{type MemberId, type ProjectId}
import ema_control_plane/event.{type Actor}

pub opaque type OrgId { OrgId(String) }
pub opaque type SpaceId { SpaceId(String) }
pub opaque type PolicyBundleId { PolicyBundleId(String) }

pub type Org { Org(id: OrgId, name: String) }

pub type Project {
  Project(
    id: ProjectId,
    org: OrgId,
    name: String,
    spaces: List(SpaceId),
  )
}

pub type SpaceKind {
  PersonalSpace
  OrganizationSpace
  SharedSpace
  GhostSpace(ttl_ms: Int)
  PublicSpace
}

pub type Space {
  Space(
    id: SpaceId,
    kind: SpaceKind,
    org: Option(OrgId),
    projects: List(ProjectId),
  )
}

pub type Member {
  HumanMember(
    id: MemberId,
    org: OrgId,
    display: String,
    policy: PolicyBundleId,
  )
  AgentMember(
    id: MemberId,
    org: OrgId,
    principal: MemberId,
    policy: PolicyBundleId,
  )
}

pub type Rule {
  AllowProjectRead(ProjectId)
  AllowProjectWrite(ProjectId)
  AllowCrossProject
  DenyCrossProject
}

pub type PolicyBundle {
  PolicyBundle(id: PolicyBundleId, rules: List(Rule))
}

pub type ScopeTarget {
  ProjectScope(ProjectId)
  SpaceScope(SpaceId)
  CrossProject(List(ProjectId))
}

pub type ScopeQuery {
  ScopeQuery(actor: Actor, target: ScopeTarget)
}

pub type Allowance {
  Allowed
  Denied(reason: String)
  Elevated(by: Actor)
}

pub type ProjectContext {
  ProjectContext(
    project: Project,
    member: Option(Member),
    spaces: List(Space),
  )
}

pub type RegistryMsg {
  PutOrg(org: Org)
  PutProject(project: Project)
  PutSpace(space: Space)
  PutMember(member: Member)
  ResolveProject(id: ProjectId, reply_to: Subject(Option(Project)))
  ContextFor(
    project: ProjectId,
    actor: Actor,
    reply_to: Subject(ProjectContext),
  )
  ListMembershipsFor(
    member: MemberId,
    reply_to: Subject(List(ProjectId)),
  )
}

pub type PolicyMsg {
  Evaluate(query: ScopeQuery, reply_to: Subject(Allowance))
  PutBundle(id: PolicyBundleId, rules: List(Rule))
}
```

## Module layout

```
apps/ema/src/
└── ema_identity/
    ├── ids.gleam                     -- (no Elixir analog — new in v0.0.3)
    ├── org.gleam                     -- (no Elixir analog)
    ├── project.gleam                 -- (no Elixir analog)
    ├── space.gleam                   -- (no Elixir analog)
    ├── member.gleam                  -- (no Elixir analog)
    ├── policy.gleam                  -- (no Elixir analog)
    ├── registry.gleam                -- (no Elixir analog)
    ├── policy_evaluator.gleam        -- (no Elixir analog)
    ├── personal_ai_resolver.gleam    -- (no Elixir analog)
    ├── schema.gleam                  -- ports the schema-split idea from
    │                                    lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/schema.ex
    ├── ttl_sweeper.gleam             -- (no Elixir analog)
    └── supervisor.gleam              -- shape mirrors
                                          lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/supervisor.ex
```

There is no Elixir precedent for any of this code — `graph/edges/identity.md`
explicitly says "No schema exists yet anywhere in the lineage." The
`schema.gleam` *shape* (table-creation EXECs, kept in one module)
mirrors the discipline of the Elixir `control_plane/schema.ex` even
though the table contents are new.

## Supervision tree fragment

```text
root_supervisor (one_for_one)
├── ema_control_plane/supervisor (rest_for_one)   -- from Step 1
└── ema_identity/supervisor (rest_for_one)
    ├── registry              -- subscribes to event_log for replay-on-boot
    ├── policy_evaluator      -- depends on registry for Member lookups
    └── ttl_sweeper           -- ticks every 1s; watches GhostSpace expiry
```

`ema_identity/supervisor` boots **after** `ema_control_plane/supervisor`
(per `research/parts/identity-project-space.md` "boots after
config/supervisor and persistence/repo but before workspace,
control_plane, coordination, semantic, surfaces" — Step 1 is the
persistence anchor; identity registers next).

## Acceptance criteria (testable)

1. `registry.start/0` returns a `Subject(RegistryMsg)` and
   `PutOrg`/`PutProject`/`PutSpace`/`PutMember` round-trip through
   `ResolveProject` and `ListMembershipsFor`.
2. `ContextFor(project, HumanActor(member))` returns a `ProjectContext`
   with `member: Some(_)` iff the actor is a registered member of the
   project; otherwise `member: None`.
3. The compile-fail fixture in `test/typecheck/identity_id_swap.gleam`
   does not compile when `OrgId` is passed where `SpaceId` is expected
   (gate #4 of `EMA_V0_0_3_PREP.md`).
4. `policy_evaluator.Evaluate(ScopeQuery(AgentActor(m), CrossProject([_])))`
   returns `Denied(_)` when `m`'s `PolicyBundle` contains `DenyCrossProject`.
5. A `GhostSpace(ttl_ms: 100)` is reported as `Retired` by the registry
   within 1s of expiry (`ttl_sweeper` writes a `RetireSpace` command
   into the Step 1 `command_bus`).
6. `personal_ai_resolver.scope_for(member, current=ProjectScope(a))`
   returns hits scoped to project `a` only when the member belongs to
   projects `[a, b]` and no explicit elevation was passed.
7. `registry` survives a `process.kill` and rebuilds its in-memory
   state by replaying identity events from sqlight on restart.
8. The schema-creation `EXEC`s in `schema.gleam` are idempotent —
   running them twice in a fresh sqlight database does not error.
9. Killing `registry` restarts `policy_evaluator` (rest_for_one
   semantics verified via `process.monitor`).

## Property tests (gleam_qcheck)

1. **Membership round-trip.** For any sequence of
   `PutMember`/`PutProject` calls, `ListMembershipsFor(m)` returns
   exactly the projects whose `Member` rows reference `m`. (Matches
   the property in `research/parts/identity-project-space.md`.)
2. **Context bounded.** For any registry state,
   `ContextFor(project, actor)` returns at most `K` items per nested
   list (configurable bound), so a `context_for` call cannot return
   an unbounded snapshot — matches `AGENT-CONTRACT.md` "Preferred read
   path" #2 doctrine.
3. **Allowance total.** For every generated `ScopeQuery`,
   `policy_evaluator.Evaluate` returns exactly one of
   `{Allowed, Denied(_), Elevated(_)}` — never crashes, never returns
   `Nil`.

## What gets stubbed (and why)

- **Permission gating on `command_bus.route`** — `policy_evaluator`
  exists, but Step 1's `command_bus` does not yet call it. Wiring lands
  in a later step that depends on Q10 settling. Stub: every command is
  still allowed at the bus.
- **Cross-peer Personal AI resolution** — `personal_ai_resolver` only
  handles single-node scope. The Q4-dependent multi-peer case is
  deferred to Step 4+ once `placement` is wired through dispatch.
- **GhostSpace key rotation / self-destruct attestation** — TTL
  expiry works; cryptographic destruction is out of scope. Stub: a
  retired `GhostSpace` is removed from the registry but its `event_log`
  history is retained.
- **Org-cert verification (X.509 / Ed25519 via `:public_key`)** — the
  `Org` record has no trust-root field yet; deferred until peer-remote
  driver work begins (Q9). Stub: `Org` is name-only.
- **Migration runner** — Gleam has no migration DSL (per
  `research/GLEAM_BEAM_FIT.md` "Persistence" §). `schema.gleam` runs
  raw `EXEC`s on boot guarded by `IF NOT EXISTS`. A real migration
  table is deferred.

## Cross-references

- Brief: `content/briefs/identity-project-space.md`
- Part mapping: `research/parts/identity-project-space.md`
- Edge: `graph/edges/identity.md`
- Glossary: "Project", "Space", "Member", "Org", "Personal AI",
  "Ghost Space"
- Howto: `howto/gleam-fit-review.md` (run when Q1, Q3, or Q10 forces
  a Member/Project/Rule shape change).
- Prep doc: `EMA_V0_0_3_PREP.md` "Required pre-build decisions →
  Identity (Q1, Q3, Q4)", gates #4 and #7.
- `sqlight` docs: https://hexdocs.pm/sqlight/
- `OPEN_QUESTIONS.md` Q1, Q3, Q4, Q10.
