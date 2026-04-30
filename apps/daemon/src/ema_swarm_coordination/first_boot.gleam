//// First-boot workspace seed for EMA 0.0.5.
////
//// This is daemon-side data. Surfaces may mirror it through mocked
//// projections while IPC is stubbed, but this module is the canonical
//// backend shape for the initial workspace.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope}
import gleam/erlang/process.{type Subject}
import gleam/list

pub const boot_ts: String = "2026-04-24T00:00:00-04:00"

pub const genesis_user_id: String = "user:01J00000000000000000000001"

pub const genesis_device_id: String = "device:01J00000000000000000000000"

pub const trajan_actor_id: String = "actor:01J00000000000000000000002"

pub const codex_actor_id: String = "actor:01J00000000000000000000003"

pub const claude_actor_id: String = "actor:01J00000000000000000000004"

pub const personal_org_id: String = "org:01J00000000000000000000012"

pub const personal_default_space_id: String = "space:01J00000000000000000000013"

pub const org_id: String = "org:01J00000000000000000000001"

pub const default_space_id: String = "space:01J00000000000000000000005"

pub const project_id: String = "project:01J00000000000000000000006"

pub const blueprint_doc_id: String = "blueprint_doc:01J00000000000000000000007"

pub const blueprint_root_section_id: String = "blueprint_sec:01J00000000000000000000008"

pub const blueprint_source_section_id: String = "blueprint_sec:01J00000000000000000000009"

pub const runtime_attachment_id: String = "attachment:01J00000000000000000000010"

pub const runtime_codebase_id: String = "codebase:01J00000000000000000000011"

pub const runtime_local_path: String = "/Users/trajanm4air/Desktop/Active builds/EMA-0.0.5"

pub type ActorKind {
  Human
  Agent
}

pub type Actor {
  Actor(id: String, display_name: String, kind: ActorKind, role: String)
}

pub type Organization {
  Organization(id: String, name: String, personal: Bool)
}

pub type Space {
  Space(id: String, org_id: String, name: String, is_default: Bool)
}

pub type Project {
  Project(id: String, space_id: String, name: String)
}

pub type BlueprintDocument {
  BlueprintDocument(id: String, project_id: String, title: String)
}

pub type BlueprintSection {
  BlueprintSection(
    id: String,
    document_id: String,
    title: String,
    parent_id: event_envelope.Option(String),
  )
}

pub type CodebaseRecord {
  CodebaseRecord(
    id: String,
    project_id: String,
    display_name: String,
    local_path: String,
    attachment_id: String,
  )
}

pub type FirstBootWorkspace {
  FirstBootWorkspace(
    personal_org: Organization,
    personal_default_space: Space,
    org: Organization,
    default_space: Space,
    project: Project,
    actors: List(Actor),
    blueprint_document: BlueprintDocument,
    blueprint_sections: List(BlueprintSection),
    codebase: CodebaseRecord,
  )
}

pub type TopbarProjection {
  TopbarProjection(
    user_id: String,
    user_label: String,
    org_id: String,
    org_name: String,
    space_id: String,
    space_name: String,
    project_id: String,
    project_name: String,
    node_state: String,
  )
}

pub type SeeAgentWorkSeed {
  SeeAgentWorkSeed(
    swarm_name: String,
    weekly_phase: String,
    active_missions: List(String),
    lanes: List(String),
    blocked_work: List(String),
    agent_roles: List(String),
    mocked_controls: List(String),
  )
}

pub type SeedError {
  AppendFailed(String)
}

pub fn seed_if_needed(
  bus_subject: Subject(bus.Msg),
) -> Result(List(String), SeedError) {
  let team_seeded = bus.event_exists(bus_subject, "org.created", org_id)
  let personal_seeded =
    bus.event_exists(bus_subject, "org.created", personal_org_id)

  case team_seeded, personal_seeded {
    True, True -> Ok([])
    True, False -> append_all(bus_subject, personal_bootstrap_events(), [])
    _, _ -> append_all(bus_subject, first_boot_events(), [])
  }
}

pub fn workspace() -> FirstBootWorkspace {
  FirstBootWorkspace(
    personal_org: Organization(
      id: personal_org_id,
      name: "Trajan's Organization",
      personal: True,
    ),
    personal_default_space: Space(
      id: personal_default_space_id,
      org_id: personal_org_id,
      name: "Personal Workspace",
      is_default: True,
    ),
    org: Organization(id: org_id, name: "Founding-Fathers-EMA", personal: False),
    default_space: Space(
      id: default_space_id,
      org_id: org_id,
      name: "Founding-Fathers-EMA",
      is_default: True,
    ),
    project: Project(
      id: project_id,
      space_id: default_space_id,
      name: "EMA 0.0.5",
    ),
    actors: [
      Actor(
        id: trajan_actor_id,
        display_name: "Trajan",
        kind: Human,
        role: "founder-developer",
      ),
      Actor(
        id: codex_actor_id,
        display_name: "Codex",
        kind: Agent,
        role: "implementation-orchestrator",
      ),
      Actor(
        id: claude_actor_id,
        display_name: "Claude",
        kind: Agent,
        role: "concept-and-docs-orchestrator",
      ),
    ],
    blueprint_document: BlueprintDocument(
      id: blueprint_doc_id,
      project_id: project_id,
      title: "EMA 0.0.5 Blueprint",
    ),
    blueprint_sections: [
      BlueprintSection(
        id: blueprint_root_section_id,
        document_id: blueprint_doc_id,
        title: "Executive Management Assistant",
        parent_id: event_envelope.none(),
      ),
      BlueprintSection(
        id: blueprint_source_section_id,
        document_id: blueprint_doc_id,
        title: "Runtime source and git-ema evidence",
        parent_id: event_envelope.some(blueprint_root_section_id),
      ),
    ],
    codebase: CodebaseRecord(
      id: runtime_codebase_id,
      project_id: project_id,
      display_name: "EMA 0.0.5 runtime",
      local_path: runtime_local_path,
      attachment_id: runtime_attachment_id,
    ),
  )
}

pub fn topbar_projection() -> TopbarProjection {
  TopbarProjection(
    user_id: genesis_user_id,
    user_label: "Trajan",
    org_id: org_id,
    org_name: "Founding-Fathers-EMA",
    space_id: default_space_id,
    space_name: "Founding-Fathers-EMA",
    project_id: project_id,
    project_name: "EMA 0.0.5",
    node_state: "home_current",
  )
}

pub fn see_agent_work_seed() -> SeeAgentWorkSeed {
  SeeAgentWorkSeed(
    swarm_name: "EMA 0.0.5 buildout swarm",
    weekly_phase: "Vanilla workspace ignition",
    active_missions: [
      "Build daemon-owned org/space/project seed",
      "Make Blueprint, git-ema, and See Agent Work visible",
      "Prepare localhost web shell for multi-surface work",
    ],
    lanes: [
      "Contracts and event validation",
      "Topbar projection",
      "Blueprint default document",
      "git-ema source attachment",
      "See Agent Work mocked control room",
    ],
    blocked_work: [
      "Real WebSocket IPC waits for daemon actor wiring",
      "Real autonomous execution waits for Hermes seam",
    ],
    agent_roles: [
      "Codex: implementation lanes and verification",
      "Claude: doctrine, synthesis, and review",
      "Human founder: approvals and canon promotion",
    ],
    mocked_controls: [
      "Start Swarm",
      "Pause Swarm",
      "Stop Swarm",
      "Open Mission",
      "Request Handoff",
      "Schedule Checkup",
    ],
  )
}

pub fn first_boot_events() -> List(Envelope) {
  [
    envelope_with_actor(
      event_id: "event:01J00000000000000000000100",
      kind: "device.registered",
      actor: "system:ema_identity",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"device_id\":\"device:01J00000000000000000000000\",\"user_id\":\"user:01J00000000000000000000001\",\"name\":\"trajan\",\"pubkey\":\"dev-genesis-pubkey\",\"bootstrap\":\"genesis\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000101",
      kind: "actor.created",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"actor_id\":\"actor:01J00000000000000000000002\",\"kind\":\"human\",\"display_name\":\"Trajan\",\"role\":\"founder-developer\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000102",
      kind: "actor.created",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"actor_id\":\"actor:01J00000000000000000000003\",\"kind\":\"agent\",\"display_name\":\"Codex\",\"role\":\"implementation-orchestrator\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000103",
      kind: "actor.created",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"actor_id\":\"actor:01J00000000000000000000004\",\"kind\":\"agent\",\"display_name\":\"Claude\",\"role\":\"concept-and-docs-orchestrator\"}",
    ),
    envelope_for_org(
      event_id: "event:01J00000000000000000000104",
      kind: "org.created",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"org_id\":\"org:01J00000000000000000000012\",\"name\":\"Trajan's Organization\",\"personal\":true,\"owner_user_id\":\"user:01J00000000000000000000001\"}",
      org_id: personal_org_id,
    ),
    envelope_for_org(
      event_id: "event:01J00000000000000000000105",
      kind: "membership.role_granted",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"membership_id\":\"mem:01J00000000000000000000020\",\"scope\":{\"org_id\":\"org:01J00000000000000000000012\"},\"actor_id\":\"actor:01J00000000000000000000002\",\"user_id\":\"user:01J00000000000000000000001\",\"role\":\"owner\",\"granted_by\":\"system:ema_memberships\"}",
      org_id: personal_org_id,
    ),
    envelope_for_org(
      event_id: "event:01J00000000000000000000106",
      kind: "space.created",
      space_id: event_envelope.some(personal_default_space_id),
      project_id: event_envelope.none(),
      payload_json: "{\"space_id\":\"space:01J00000000000000000000013\",\"org_id\":\"org:01J00000000000000000000012\",\"name\":\"Personal Workspace\",\"created_by\":\"user:01J00000000000000000000001\",\"default\":true}",
      org_id: personal_org_id,
    ),
    envelope(
      event_id: "event:01J00000000000000000000107",
      kind: "org.created",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"org_id\":\"org:01J00000000000000000000001\",\"name\":\"Founding-Fathers-EMA\",\"personal\":false,\"owner_user_id\":\"user:01J00000000000000000000001\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000108",
      kind: "membership.role_granted",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"membership_id\":\"mem:01J00000000000000000000021\",\"scope\":{\"org_id\":\"org:01J00000000000000000000001\"},\"actor_id\":\"actor:01J00000000000000000000002\",\"user_id\":\"user:01J00000000000000000000001\",\"role\":\"owner\",\"granted_by\":\"system:ema_memberships\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000109",
      kind: "space.created",
      space_id: event_envelope.some(default_space_id),
      project_id: event_envelope.none(),
      payload_json: "{\"space_id\":\"space:01J00000000000000000000005\",\"org_id\":\"org:01J00000000000000000000001\",\"name\":\"Founding-Fathers-EMA\",\"created_by\":\"user:01J00000000000000000000001\",\"default\":true}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000110",
      kind: "project.created",
      space_id: event_envelope.some(default_space_id),
      project_id: event_envelope.some(project_id),
      payload_json: "{\"project_id\":\"project:01J00000000000000000000006\",\"space_id\":\"space:01J00000000000000000000005\",\"name\":\"EMA 0.0.5\",\"created_by\":\"user:01J00000000000000000000001\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000111",
      kind: "blueprint.document.created",
      space_id: event_envelope.some(default_space_id),
      project_id: event_envelope.some(project_id),
      payload_json: "{\"document_id\":\"blueprint_doc:01J00000000000000000000007\",\"project_id\":\"project:01J00000000000000000000006\",\"title\":\"EMA 0.0.5 Blueprint\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000112",
      kind: "blueprint.section.added",
      space_id: event_envelope.some(default_space_id),
      project_id: event_envelope.some(project_id),
      payload_json: "{\"section_id\":\"blueprint_sec:01J00000000000000000000008\",\"document_id\":\"blueprint_doc:01J00000000000000000000007\",\"title\":\"Executive Management Assistant\",\"parent_id\":null}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000113",
      kind: "blueprint.section.added",
      space_id: event_envelope.some(default_space_id),
      project_id: event_envelope.some(project_id),
      payload_json: "{\"section_id\":\"blueprint_sec:01J00000000000000000000009\",\"document_id\":\"blueprint_doc:01J00000000000000000000007\",\"title\":\"Runtime source and git-ema evidence\",\"parent_id\":\"blueprint_sec:01J00000000000000000000008\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000114",
      kind: "attachment.created",
      space_id: event_envelope.some(default_space_id),
      project_id: event_envelope.some(project_id),
      payload_json: "{\"attachment_id\":\"attachment:01J00000000000000000000010\",\"kind\":\"git_repo\",\"source\":\"local\",\"display_name\":\"EMA 0.0.5 runtime\",\"source_ref\":{\"kind\":\"local_path\",\"path\":\"/Users/trajanm4air/Desktop/Active builds/EMA-0.0.5\"},\"codebase_id\":\"codebase:01J00000000000000000000011\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000115",
      kind: "attachment.linked",
      space_id: event_envelope.some(default_space_id),
      project_id: event_envelope.some(project_id),
      payload_json: "{\"attachment_id\":\"attachment:01J00000000000000000000010\",\"object_kind\":\"blueprint_section\",\"object_id\":\"blueprint_sec:01J00000000000000000000009\"}",
    ),
    envelope(
      event_id: "event:01J00000000000000000000116",
      kind: "blueprint.attachment.linked",
      space_id: event_envelope.some(default_space_id),
      project_id: event_envelope.some(project_id),
      payload_json: "{\"attachment_id\":\"attachment:01J00000000000000000000010\",\"section_id\":\"blueprint_sec:01J00000000000000000000009\"}",
    ),
  ]
}

fn personal_bootstrap_events() -> List(Envelope) {
  [
    envelope_for_org(
      event_id: "event:01J00000000000000000000104",
      kind: "org.created",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"org_id\":\"org:01J00000000000000000000012\",\"name\":\"Trajan's Organization\",\"personal\":true,\"owner_user_id\":\"user:01J00000000000000000000001\"}",
      org_id: personal_org_id,
    ),
    envelope_for_org(
      event_id: "event:01J00000000000000000000105",
      kind: "membership.role_granted",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      payload_json: "{\"membership_id\":\"mem:01J00000000000000000000020\",\"scope\":{\"org_id\":\"org:01J00000000000000000000012\"},\"actor_id\":\"actor:01J00000000000000000000002\",\"user_id\":\"user:01J00000000000000000000001\",\"role\":\"owner\",\"granted_by\":\"system:ema_memberships\"}",
      org_id: personal_org_id,
    ),
    envelope_for_org(
      event_id: "event:01J00000000000000000000106",
      kind: "space.created",
      space_id: event_envelope.some(personal_default_space_id),
      project_id: event_envelope.none(),
      payload_json: "{\"space_id\":\"space:01J00000000000000000000013\",\"org_id\":\"org:01J00000000000000000000012\",\"name\":\"Personal Workspace\",\"created_by\":\"user:01J00000000000000000000001\",\"default\":true}",
      org_id: personal_org_id,
    ),
  ]
}

fn append_all(
  bus_subject: Subject(bus.Msg),
  events: List(Envelope),
  appended: List(String),
) -> Result(List(String), SeedError) {
  case events {
    [] -> Ok(list.reverse(appended))
    [event, ..rest] ->
      case bus.append(bus_subject, event) {
        Ok(_) -> append_all(bus_subject, rest, [event.event_id, ..appended])
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
  }
}

fn envelope(
  event_id event_id: String,
  kind kind: String,
  space_id space_id: event_envelope.Option(String),
  project_id project_id: event_envelope.Option(String),
  payload_json payload_json: String,
) -> Envelope {
  envelope_with_actor(
    event_id: event_id,
    kind: kind,
    actor: trajan_actor_id,
    space_id: space_id,
    project_id: project_id,
    payload_json: payload_json,
  )
}

fn envelope_for_org(
  event_id event_id: String,
  kind kind: String,
  space_id space_id: event_envelope.Option(String),
  project_id project_id: event_envelope.Option(String),
  payload_json payload_json: String,
  org_id org_id: String,
) -> Envelope {
  let env =
    envelope(
      event_id: event_id,
      kind: kind,
      space_id: space_id,
      project_id: project_id,
      payload_json: payload_json,
    )

  event_envelope.Envelope(
    event_id: env.event_id,
    kind: env.kind,
    ts: env.ts,
    actor: env.actor,
    org_id: org_id,
    space_id: env.space_id,
    project_id: env.project_id,
    dispatch_id: env.dispatch_id,
    execution_id: env.execution_id,
    payload_json: env.payload_json,
  )
}

fn envelope_with_actor(
  event_id event_id: String,
  kind kind: String,
  actor actor: String,
  space_id space_id: event_envelope.Option(String),
  project_id project_id: event_envelope.Option(String),
  payload_json payload_json: String,
) -> Envelope {
  event_envelope.Envelope(
    event_id: event_id,
    kind: kind,
    ts: boot_ts,
    actor: actor,
    org_id: org_id,
    space_id: space_id,
    project_id: project_id,
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: payload_json,
  )
}

fn describe_append_error(e: bus.AppendError) -> String {
  case e {
    bus.InvalidKind(kind) -> "invalid event kind: " <> kind
    bus.NotInCatalog(kind) -> "event kind not in catalog: " <> kind
    bus.PersistenceFailed(reason) -> "persistence failed: " <> reason
  }
}
