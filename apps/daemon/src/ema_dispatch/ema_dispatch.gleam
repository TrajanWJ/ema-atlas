//// ema_dispatch — canonical writer for `dispatch.*` events.
////
//// A dispatch is a named run that ties events together inside a bounded
//// execution. Every dispatch envelope carries `dispatch_id` so audit and
//// replay can reconstruct the full chain.
////
//// Public functions are pure-stateless: they validate inputs, build an
//// `Envelope` matching `packages/contracts/events/dispatch.md`, and call
//// `bus.append/2`. No GenServer, no supervisor child.
////
//// Pattern reference: `apps/daemon/src/ema_orgs/ema_orgs.gleam`.

import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string

pub type DispatchError {
  EmptyOrg
  EmptyActor
  EmptyIntent
  EmptyDispatchId
  EmptyOutcome
  EmptyScope
  InvalidOutcome(value: String)
  AppendFailed(reason: String)
}

pub type StartedDispatch {
  StartedDispatch(dispatch_id: String, event_id: String)
}

pub type WorkspaceRef {
  WorkspaceRef(
    org_id: String,
    space_id: Option(String),
    project_id: Option(String),
  )
}

pub type ScopeGrant {
  ScopeGrant(
    read: List(String),
    write: List(String),
    call: List(String),
    secrets: List(String),
  )
}

pub fn empty_scope_grant() -> ScopeGrant {
  ScopeGrant(read: [], write: [], call: [], secrets: [])
}

/// Append a `dispatch.started` envelope. Mints a fresh `dispatch:<ulid>` and
/// returns it alongside the canonical event_id.
pub fn start_dispatch(
  bus_subject: Subject(bus.Msg),
  actor: String,
  initiator: String,
  intent: String,
  workspace: WorkspaceRef,
  provider: Option(String),
  lane_id: Option(String),
) -> Result(StartedDispatch, DispatchError) {
  let clean_org = string.trim(workspace.org_id)
  let clean_actor = string.trim(actor)
  let clean_initiator = string.trim(initiator)
  let clean_intent = string.trim(intent)

  case clean_org, clean_actor, clean_intent {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyIntent)
    _, _, _ -> {
      let initiator_value = case clean_initiator {
        "" -> clean_actor
        _ -> clean_initiator
      }
      let dispatch_id = "dispatch:" <> ulid()
      let event_id = "event:" <> ulid()
      let now = iso_now()

      let workspace_ref =
        json.object([
          #("org_id", json.string(clean_org)),
          #("space_id", optional_string(workspace.space_id)),
          #("project_id", optional_string(workspace.project_id)),
        ])

      let payload =
        json.to_string(
          json.object([
            #("dispatch_id", json.string(dispatch_id)),
            #("initiator", json.string(initiator_value)),
            #("intent", json.string(clean_intent)),
            #("workspace_ref", workspace_ref),
            #("provider", optional_string(provider)),
            #("lane_id", optional_string(lane_id)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "dispatch.started",
          ts: now,
          actor: clean_actor,
          org_id: clean_org,
          space_id: option_to_envelope(workspace.space_id),
          project_id: option_to_envelope(workspace.project_id),
          dispatch_id: event_envelope.some(dispatch_id),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) ->
          Ok(StartedDispatch(dispatch_id: dispatch_id, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

/// Append a `dispatch.scope_granted` envelope. The grant must reference an
/// existing dispatch via `dispatch_id`; runtime enforcement of the scope
/// happens elsewhere.
pub fn grant_scope(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  dispatch_id: String,
  scope: ScopeGrant,
) -> Result(String, DispatchError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_dispatch = string.trim(dispatch_id)

  case clean_org, clean_actor, clean_dispatch {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyDispatchId)
    _, _, _ ->
      case
        list.is_empty(scope.read)
        && list.is_empty(scope.write)
        && list.is_empty(scope.call)
        && list.is_empty(scope.secrets)
      {
        True -> Error(EmptyScope)
        False -> {
          let event_id = "event:" <> ulid()
          let now = iso_now()
          let scope_obj =
            json.object([
              #(
                "read",
                json.preprocessed_array(list.map(scope.read, json.string)),
              ),
              #(
                "write",
                json.preprocessed_array(list.map(scope.write, json.string)),
              ),
              #(
                "call",
                json.preprocessed_array(list.map(scope.call, json.string)),
              ),
            ])
          let payload =
            json.to_string(
              json.object([
                #("dispatch_id", json.string(clean_dispatch)),
                #("scope", scope_obj),
                #(
                  "secrets",
                  json.preprocessed_array(list.map(scope.secrets, json.string)),
                ),
              ]),
            )
          let envelope =
            Envelope(
              event_id: event_id,
              kind: "dispatch.scope_granted",
              ts: now,
              actor: clean_actor,
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.some(clean_dispatch),
              execution_id: event_envelope.none(),
              payload_json: payload,
            )

          case bus.append(bus_subject, envelope) {
            Ok(_) -> Ok(event_id)
            Error(e) -> Error(AppendFailed(describe_append_error(e)))
          }
        }
      }
  }
}

/// Append a `dispatch.ended` envelope. Outcome must be one of
/// `ok | failed | cancelled`.
pub fn end_dispatch(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  dispatch_id: String,
  outcome: String,
  provider: Option(String),
) -> Result(String, DispatchError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_dispatch = string.trim(dispatch_id)
  let clean_outcome = string.trim(outcome)

  case clean_org, clean_actor, clean_dispatch, clean_outcome {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyDispatchId)
    _, _, _, "" -> Error(EmptyOutcome)
    _, _, _, _ ->
      case validate_outcome(clean_outcome) {
        Error(e) -> Error(e)
        Ok(_) -> {
          let event_id = "event:" <> ulid()
          let now = iso_now()
          let payload =
            json.to_string(
              json.object([
                #("dispatch_id", json.string(clean_dispatch)),
                #("outcome", json.string(clean_outcome)),
                #("provider", optional_string(provider)),
              ]),
            )
          let envelope =
            Envelope(
              event_id: event_id,
              kind: "dispatch.ended",
              ts: now,
              actor: clean_actor,
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.some(clean_dispatch),
              execution_id: event_envelope.none(),
              payload_json: payload,
            )

          case bus.append(bus_subject, envelope) {
            Ok(_) -> Ok(event_id)
            Error(e) -> Error(AppendFailed(describe_append_error(e)))
          }
        }
      }
  }
}

fn validate_outcome(value: String) -> Result(Nil, DispatchError) {
  case value {
    "ok" | "failed" | "cancelled" -> Ok(Nil)
    other -> Error(InvalidOutcome(other))
  }
}

pub fn describe_error(e: DispatchError) -> String {
  case e {
    EmptyOrg -> "org_id is required"
    EmptyActor -> "actor is required"
    EmptyIntent -> "intent is required"
    EmptyDispatchId -> "dispatch_id is required"
    EmptyOutcome -> "outcome is required"
    EmptyScope -> "scope must include at least one of read/write/call/secrets"
    InvalidOutcome(v) ->
      "invalid outcome: " <> v <> " (expected ok | failed | cancelled)"
    AppendFailed(reason) -> "append failed: " <> reason
  }
}

fn optional_string(value: Option(String)) -> json.Json {
  case value {
    Some(s) ->
      case string.trim(s) {
        "" -> json.null()
        trimmed -> json.string(trimmed)
      }
    None -> json.null()
  }
}

fn option_to_envelope(value: Option(String)) -> event_envelope.Option(String) {
  case value {
    Some(s) ->
      case string.trim(s) {
        "" -> event_envelope.none()
        trimmed -> event_envelope.some(trimmed)
      }
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
