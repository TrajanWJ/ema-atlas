// ema/identity/registry.gleam — Org/Space/Project/Member registry actor
//
// Mirrors research/build-steps/02-identity-registry-skeleton.md
// §"Type sketches". MemberId/ProjectId are re-exported via control_plane
// in the real build; for the scaffold we redeclare opaque shells so the
// file compiles in isolation.

import gleam/erlang/process.{type Subject}
import gleam/option.{type Option}
import gleam/otp/actor
import gleam/otp/supervision

import ema/control_plane/event_log.{type Actor, type MemberId, type ProjectId}

// ---------------------------------------------------------------------
// Identity-only opaque IDs (extending the Step 1 set)
// ---------------------------------------------------------------------

pub opaque type OrgId {
  OrgId(String)
}

pub opaque type SpaceId {
  SpaceId(String)
}

pub opaque type PolicyBundleId {
  PolicyBundleId(String)
}

// ---------------------------------------------------------------------
// Domain records
// ---------------------------------------------------------------------

pub type Org {
  Org(id: OrgId, name: String)
}

pub type Project {
  Project(id: ProjectId, org: OrgId, name: String, spaces: List(SpaceId))
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

pub type ProjectContext {
  ProjectContext(
    project: Project,
    member: Option(Member),
    spaces: List(Space),
  )
}

// ---------------------------------------------------------------------
// Mailbox — Subject(RegistryMsg)
// ---------------------------------------------------------------------

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
  ListMembershipsFor(member: MemberId, reply_to: Subject(List(ProjectId)))
}

pub type State {
  State(
    orgs: List(Org),
    projects: List(Project),
    spaces: List(Space),
    members: List(Member),
  )
}

pub fn start() -> Result(actor.Started(Subject(RegistryMsg)), actor.StartError) {
  todo as "wired in step 02 — replays identity events from event_log on boot"
}

pub fn supervised() -> supervision.ChildSpecification(Subject(RegistryMsg)) {
  todo as "wired in step 02"
}
