//// agent_workspace — minimal daemon-owned workspace writer.
////
//// Slice A bootstraps the two commands agents need first:
////   - `lane.open` -> `lane.opened`
////   - `queue.add` -> `queue_item.added`

import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/string

pub type WorkspaceError {
  EmptyOrg
  EmptyActor
  EmptyTitle
  EmptyWhy
  EmptyLaneId
  EmptyQueueItemId
  EmptyScope
  EmptyGoal
  EmptyNext
  EmptyReason
  EmptyStatus
  EmptyBlockedBy
  InvalidStatus(value: String)
  InvalidCadence(value: String)
  AppendFailed(reason: String)
}

pub type LaneOpened {
  LaneOpened(lane_id: String, event_id: String)
}

pub type QueueItemAdded {
  QueueItemAdded(queue_item_id: String, event_id: String)
}

pub type WorkspaceEvent {
  WorkspaceEvent(resource_id: String, event_id: String)
}

pub fn open_lane(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  title: String,
  project_id: Option(String),
  mission_id: Option(String),
  scope: Option(String),
  done_when: Option(String),
  depends_on: Option(String),
) -> Result(LaneOpened, WorkspaceError) {
  open_lane_linked(
    bus_subject,
    org_id,
    actor_id,
    title,
    project_id,
    mission_id,
    scope,
    done_when,
    depends_on,
    None,
    None,
    None,
    None,
  )
}

pub fn open_lane_linked(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  title: String,
  project_id: Option(String),
  mission_id: Option(String),
  scope: Option(String),
  done_when: Option(String),
  depends_on: Option(String),
  blueprint_section_id: Option(String),
  blueprint_gac_id: Option(String),
  blueprint_decision_id: Option(String),
  cadence: Option(String),
) -> Result(LaneOpened, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let lane_title = string.trim(title)

  case org, actor, lane_title {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyTitle)
    _, _, _ ->
      case validate_cadence(cadence) {
        Error(e) -> Error(e)
        Ok(_) -> {
          let now = iso_now()
          let lane_id = "lane:" <> ulid()
          let event_id = "event:" <> ulid()
          let payload =
            json.to_string(
              json.object([
                #("lane_id", json.string(lane_id)),
                #("title", json.string(lane_title)),
                #("name", json.string(lane_title)),
                #("project_id", optional_string(project_id)),
                #("mission_id", optional_string(mission_id)),
                #("scope", optional_string(scope)),
                #("done_when", optional_string(done_when)),
                #("depends_on", optional_string(depends_on)),
                #("opened_by", json.string(actor)),
                #("status", json.string("idea")),
                #(
                  "blueprint_section_id",
                  optional_string(blueprint_section_id),
                ),
                #("blueprint_gac_id", optional_string(blueprint_gac_id)),
                #(
                  "blueprint_decision_id",
                  optional_string(blueprint_decision_id),
                ),
                #("lane_cadence", optional_string(cadence)),
              ]),
            )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "lane.opened",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: option_to_envelope(project_id),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

          case bus.append(bus_subject, envelope) {
            Ok(_) -> Ok(LaneOpened(lane_id: lane_id, event_id: event_id))
            Error(e) -> Error(AppendFailed(describe_append_error(e)))
          }
        }
      }
  }
}

fn validate_cadence(cadence: Option(String)) -> Result(Nil, WorkspaceError) {
  case cadence {
    None -> Ok(Nil)
    Some(value) ->
      case string.trim(value) {
        "" -> Ok(Nil)
        "daily" | "weekly" | "per_handoff" -> Ok(Nil)
        other -> Error(InvalidCadence(other))
      }
  }
}

pub fn append_event(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  kind: String,
  resource_id: String,
  project_id: Option(String),
  fields: List(#(String, json.Json)),
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let resource = string.trim(resource_id)

  case org, actor, resource {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyTitle)
    _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let payload = json.to_string(json.object(fields))
      let envelope =
        Envelope(
          event_id: event_id,
          kind: kind,
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: option_to_envelope(project_id),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) -> Ok(WorkspaceEvent(resource_id: resource, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

pub fn new_id(prefix: String) -> String {
  prefix <> ":" <> ulid()
}

pub fn opt(value: Option(String)) -> json.Json {
  optional_string(value)
}

pub fn add_queue_item(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  title: String,
  why: String,
  project_id: Option(String),
  mission_id: Option(String),
  lane_id: Option(String),
  done_when: Option(String),
  depends_on: Option(String),
  blocked_by: Option(String),
  source: Option(String),
) -> Result(QueueItemAdded, WorkspaceError) {
  add_queue_item_linked(
    bus_subject,
    org_id,
    actor_id,
    title,
    why,
    project_id,
    mission_id,
    lane_id,
    done_when,
    depends_on,
    blocked_by,
    source,
    None,
    None,
    None,
  )
}

pub fn add_queue_item_linked(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  title: String,
  why: String,
  project_id: Option(String),
  mission_id: Option(String),
  lane_id: Option(String),
  done_when: Option(String),
  depends_on: Option(String),
  blocked_by: Option(String),
  source: Option(String),
  blueprint_section_id: Option(String),
  blueprint_gac_id: Option(String),
  blueprint_decision_id: Option(String),
) -> Result(QueueItemAdded, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let item_title = string.trim(title)
  let item_why = string.trim(why)

  case org, actor, item_title, item_why {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyTitle)
    _, _, _, "" -> Error(EmptyWhy)
    _, _, _, _ -> {
      let now = iso_now()
      let queue_item_id = "queue_item:" <> ulid()
      let event_id = "event:" <> ulid()
      let status = case blocked_by {
        Some(blocker) ->
          case string.trim(blocker) {
            "" -> "ready"
            _ -> "blocked"
          }
        None -> "ready"
      }
      let payload =
        json.to_string(
          json.object([
            #("queue_item_id", json.string(queue_item_id)),
            #("title", json.string(item_title)),
            #("why", json.string(item_why)),
            #("project_id", optional_string(project_id)),
            #("mission_id", optional_string(mission_id)),
            #("lane_id", optional_string(lane_id)),
            #("done_when", optional_string(done_when)),
            #("depends_on", optional_string(depends_on)),
            #("blocked_by", optional_string(blocked_by)),
            #("source", optional_string(source)),
            #("added_by", json.string(actor)),
            #("status", json.string(status)),
            #("blueprint_section_id", optional_string(blueprint_section_id)),
            #("blueprint_gac_id", optional_string(blueprint_gac_id)),
            #("blueprint_decision_id", optional_string(blueprint_decision_id)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "queue_item.added",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: option_to_envelope(project_id),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) ->
          Ok(QueueItemAdded(queue_item_id: queue_item_id, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Lane lifecycle: claim / release / block / move / close
// ---------------------------------------------------------------------------

pub fn claim_lane(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  lane_id: String,
  scope: String,
  goal: String,
  next: String,
  refresh_by: Option(String),
  blocker: Option(String),
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let lane = string.trim(lane_id)
  let claim_scope = string.trim(scope)
  let claim_goal = string.trim(goal)
  let claim_next = string.trim(next)

  case org, actor, lane, claim_scope, claim_goal, claim_next {
    "", _, _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _, _ -> Error(EmptyActor)
    _, _, "", _, _, _ -> Error(EmptyLaneId)
    _, _, _, "", _, _ -> Error(EmptyScope)
    _, _, _, _, "", _ -> Error(EmptyGoal)
    _, _, _, _, _, "" -> Error(EmptyNext)
    _, _, _, _, _, _ ->
      append_event(bus_subject, org, actor, "lane.claimed", lane, None, [
        #("lane_id", json.string(lane)),
        #("actor_id", json.string(actor)),
        #("scope", json.string(claim_scope)),
        #("goal", json.string(claim_goal)),
        #("next", json.string(claim_next)),
        #("refresh_by", optional_string(refresh_by)),
        #("blocker", optional_string(blocker)),
      ])
  }
}

pub fn release_lane(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  lane_id: String,
  handoff_id: Option(String),
  reason: Option(String),
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let lane = string.trim(lane_id)

  case org, actor, lane {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyLaneId)
    _, _, _ ->
      append_event(bus_subject, org, actor, "lane.released", lane, None, [
        #("lane_id", json.string(lane)),
        #("actor_id", json.string(actor)),
        #("handoff_id", optional_string(handoff_id)),
        #("reason", optional_string(reason)),
      ])
  }
}

pub fn block_lane(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  lane_id: String,
  reason: String,
  depends_on: Option(String),
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let lane = string.trim(lane_id)
  let block_reason = string.trim(reason)

  case org, actor, lane, block_reason {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyLaneId)
    _, _, _, "" -> Error(EmptyReason)
    _, _, _, _ ->
      append_event(bus_subject, org, actor, "lane.blocked", lane, None, [
        #("lane_id", json.string(lane)),
        #("reason", json.string(block_reason)),
        #("depends_on", optional_string(depends_on)),
        #("blocked_by", json.string(actor)),
      ])
  }
}

pub fn move_lane(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  lane_id: String,
  to_status: String,
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let lane = string.trim(lane_id)
  let status = string.trim(to_status)

  case org, actor, lane, status {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyLaneId)
    _, _, _, "" -> Error(EmptyStatus)
    _, _, _, _ ->
      case validate_lane_status(status) {
        Error(e) -> Error(e)
        Ok(_) ->
          append_event(bus_subject, org, actor, "lane.moved", lane, None, [
            #("lane_id", json.string(lane)),
            #("to_status", json.string(status)),
            #("moved_by", json.string(actor)),
          ])
      }
  }
}

pub fn close_lane(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  lane_id: String,
  reason: Option(String),
  verify: Option(String),
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let lane = string.trim(lane_id)

  case org, actor, lane {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyLaneId)
    _, _, _ ->
      append_event(bus_subject, org, actor, "lane.closed", lane, None, [
        #("lane_id", json.string(lane)),
        #("reason", optional_string(reason)),
        #("verify", optional_string(verify)),
        #("closed_by", json.string(actor)),
      ])
  }
}

// ---------------------------------------------------------------------------
// Queue item lifecycle: ready / blocked / closed
// ---------------------------------------------------------------------------

pub fn mark_queue_item_ready(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  queue_item_id: String,
  reason: Option(String),
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let item = string.trim(queue_item_id)

  case org, actor, item {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyQueueItemId)
    _, _, _ ->
      append_event(bus_subject, org, actor, "queue_item.ready", item, None, [
        #("queue_item_id", json.string(item)),
        #("reason", optional_string(reason)),
        #("marked_by", json.string(actor)),
      ])
  }
}

pub fn mark_queue_item_blocked(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  queue_item_id: String,
  blocked_by: String,
  reason: Option(String),
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let item = string.trim(queue_item_id)
  let blocker = string.trim(blocked_by)

  case org, actor, item, blocker {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyQueueItemId)
    _, _, _, "" -> Error(EmptyBlockedBy)
    _, _, _, _ ->
      append_event(bus_subject, org, actor, "queue_item.blocked", item, None, [
        #("queue_item_id", json.string(item)),
        #("blocked_by", json.string(blocker)),
        #("reason", optional_string(reason)),
        #("marked_by", json.string(actor)),
      ])
  }
}

pub fn close_queue_item(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  queue_item_id: String,
  result: Option(String),
  verify: Option(String),
) -> Result(WorkspaceEvent, WorkspaceError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let item = string.trim(queue_item_id)

  case org, actor, item {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyQueueItemId)
    _, _, _ ->
      append_event(bus_subject, org, actor, "queue_item.closed", item, None, [
        #("queue_item_id", json.string(item)),
        #("result", optional_string(result)),
        #("verify", optional_string(verify)),
        #("closed_by", json.string(actor)),
      ])
  }
}

fn validate_lane_status(status: String) -> Result(Nil, WorkspaceError) {
  case status {
    "idea" | "ready" | "active" | "review" | "blocked" | "done" -> Ok(Nil)
    _ -> Error(InvalidStatus(status))
  }
}

pub fn describe_error(e: WorkspaceError) -> String {
  case e {
    EmptyOrg -> "org_id is required"
    EmptyActor -> "actor_id is required"
    EmptyTitle -> "title is required"
    EmptyWhy -> "why is required"
    EmptyLaneId -> "lane_id is required"
    EmptyQueueItemId -> "queue_item_id is required"
    EmptyScope -> "scope is required"
    EmptyGoal -> "goal is required"
    EmptyNext -> "next is required"
    EmptyReason -> "reason is required"
    EmptyStatus -> "status is required"
    EmptyBlockedBy -> "blocked_by is required"
    InvalidStatus(s) -> "invalid lane status: " <> s
    InvalidCadence(s) -> "invalid lane cadence: " <> s
    AppendFailed(reason) -> "append failed: " <> reason
  }
}

fn optional_string(value: Option(String)) -> json.Json {
  case value {
    Some(s) -> json.string(string.trim(s))
    None -> json.null()
  }
}

fn option_to_envelope(value: Option(String)) -> event_envelope.Option(String) {
  case value {
    Some(s) -> event_envelope.some(string.trim(s))
    None -> event_envelope.none()
  }
}

fn describe_append_error(e: bus.AppendError) -> String {
  case e {
    bus.InvalidKind(kind) -> "invalid event kind: " <> kind
    bus.NotInCatalog(kind) -> "event kind not in catalog: " <> kind
    bus.PersistenceFailed(reason) -> "persistence failed: " <> reason
  }
}

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String

@external(erlang, "ema_time_ffi", "ulid")
fn ulid() -> String
