//// ema_exec — canonical writer for `execution.*` and `tool.*` events.
////
//// An execution is one tool invocation, one task run, or one provider
//// session inside a dispatch. The `execution_id` is stable for replay.
//// Every envelope carries both `dispatch_id` and `execution_id` so the
//// chain can be reconstructed.
////
//// Pattern reference: `apps/daemon/src/ema_orgs/ema_orgs.gleam` and
//// `apps/daemon/src/ema_swarm_coordination/agent_workspace.gleam`.

import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/string

pub type ExecError {
  EmptyOrg
  EmptyActor
  EmptyDispatchId
  EmptyExecutionId
  EmptyKind
  EmptyName
  EmptyToolName
  EmptyArgsJson
  EmptyResultSummary
  EmptyErrorClass
  EmptyMessage
  EmptyOutcome
  InvalidKind(value: String)
  InvalidOutcome(value: String)
  InvalidErrorClass(value: String)
  AppendFailed(reason: String)
}

pub type StartedExecution {
  StartedExecution(execution_id: String, event_id: String)
}

/// Append an `execution.started` envelope. Mints a fresh
/// `execution:<ulid>` and returns it alongside the event_id.
pub fn start_execution(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  dispatch_id: String,
  kind: String,
  name: String,
  provider: Option(String),
) -> Result(StartedExecution, ExecError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_dispatch = string.trim(dispatch_id)
  let clean_kind = string.trim(kind)
  let clean_name = string.trim(name)

  case clean_org, clean_actor, clean_dispatch, clean_kind, clean_name {
    "", _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _ -> Error(EmptyActor)
    _, _, "", _, _ -> Error(EmptyDispatchId)
    _, _, _, "", _ -> Error(EmptyKind)
    _, _, _, _, "" -> Error(EmptyName)
    _, _, _, _, _ ->
      case validate_kind(clean_kind) {
        Error(e) -> Error(e)
        Ok(_) -> {
          let execution_id = "execution:" <> ulid()
          let event_id = "event:" <> ulid()
          let now = iso_now()
          let payload =
            json.to_string(
              json.object([
                #("execution_id", json.string(execution_id)),
                #("dispatch_id", json.string(clean_dispatch)),
                #("kind", json.string(clean_kind)),
                #("name", json.string(clean_name)),
                #("provider", optional_string(provider)),
              ]),
            )
          let envelope =
            Envelope(
              event_id: event_id,
              kind: "execution.started",
              ts: now,
              actor: clean_actor,
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.some(clean_dispatch),
              execution_id: event_envelope.some(execution_id),
              payload_json: payload,
            )

          case bus.append(bus_subject, envelope) {
            Ok(_) ->
              Ok(StartedExecution(
                execution_id: execution_id,
                event_id: event_id,
              ))
            Error(e) -> Error(AppendFailed(describe_append_error(e)))
          }
        }
      }
  }
}

/// Append an `execution.ended` envelope.
pub fn end_execution(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  dispatch_id: String,
  execution_id: String,
  outcome: String,
  duration_ms: Int,
) -> Result(String, ExecError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_dispatch = string.trim(dispatch_id)
  let clean_execution = string.trim(execution_id)
  let clean_outcome = string.trim(outcome)

  case clean_org, clean_actor, clean_dispatch, clean_execution, clean_outcome {
    "", _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _ -> Error(EmptyActor)
    _, _, "", _, _ -> Error(EmptyDispatchId)
    _, _, _, "", _ -> Error(EmptyExecutionId)
    _, _, _, _, "" -> Error(EmptyOutcome)
    _, _, _, _, _ ->
      case validate_outcome(clean_outcome) {
        Error(e) -> Error(e)
        Ok(_) -> {
          let event_id = "event:" <> ulid()
          let now = iso_now()
          let payload =
            json.to_string(
              json.object([
                #("execution_id", json.string(clean_execution)),
                #("outcome", json.string(clean_outcome)),
                #("duration_ms", json.int(duration_ms)),
              ]),
            )
          let envelope =
            Envelope(
              event_id: event_id,
              kind: "execution.ended",
              ts: now,
              actor: clean_actor,
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.some(clean_dispatch),
              execution_id: event_envelope.some(clean_execution),
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

/// Append an `execution.failed` envelope.
pub fn fail_execution(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  dispatch_id: String,
  execution_id: String,
  error_class: String,
  message: String,
) -> Result(String, ExecError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_dispatch = string.trim(dispatch_id)
  let clean_execution = string.trim(execution_id)
  let clean_class = string.trim(error_class)
  let clean_msg = string.trim(message)

  case clean_org, clean_actor, clean_dispatch, clean_execution, clean_class {
    "", _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _ -> Error(EmptyActor)
    _, _, "", _, _ -> Error(EmptyDispatchId)
    _, _, _, "", _ -> Error(EmptyExecutionId)
    _, _, _, _, "" -> Error(EmptyErrorClass)
    _, _, _, _, _ ->
      case clean_msg {
        "" -> Error(EmptyMessage)
        _ -> {
          let event_id = "event:" <> ulid()
          let now = iso_now()
          let payload =
            json.to_string(
              json.object([
                #("execution_id", json.string(clean_execution)),
                #("error_class", json.string(clean_class)),
                #("message", json.string(clean_msg)),
              ]),
            )
          let envelope =
            Envelope(
              event_id: event_id,
              kind: "execution.failed",
              ts: now,
              actor: clean_actor,
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.some(clean_dispatch),
              execution_id: event_envelope.some(clean_execution),
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

/// Append a `tool.invoked` envelope. `args_json` is a string carrying
/// already-redacted JSON; the writer does not parse it.
pub fn invoke_tool(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  dispatch_id: String,
  execution_id: String,
  tool_name: String,
  args_json: String,
  provider: Option(String),
) -> Result(String, ExecError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_dispatch = string.trim(dispatch_id)
  let clean_execution = string.trim(execution_id)
  let clean_tool = string.trim(tool_name)
  let clean_args = string.trim(args_json)

  case clean_org, clean_actor, clean_dispatch, clean_execution, clean_tool {
    "", _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _ -> Error(EmptyActor)
    _, _, "", _, _ -> Error(EmptyDispatchId)
    _, _, _, "", _ -> Error(EmptyExecutionId)
    _, _, _, _, "" -> Error(EmptyToolName)
    _, _, _, _, _ ->
      case clean_args {
        "" -> Error(EmptyArgsJson)
        _ -> {
          let event_id = "event:" <> ulid()
          let now = iso_now()
          // Embed args_json as a string field. Downstream consumers that
          // want it parsed can do so; the daemon does not validate the
          // shape here. This keeps the writer agnostic to provider tools.
          let payload =
            json.to_string(
              json.object([
                #("execution_id", json.string(clean_execution)),
                #("tool_name", json.string(clean_tool)),
                #("args_json", json.string(clean_args)),
                #("provider", optional_string(provider)),
              ]),
            )
          let envelope =
            Envelope(
              event_id: event_id,
              kind: "tool.invoked",
              ts: now,
              actor: clean_actor,
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.some(clean_dispatch),
              execution_id: event_envelope.some(clean_execution),
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

/// Append a `tool.returned` envelope.
pub fn return_tool(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  dispatch_id: String,
  execution_id: String,
  tool_name: String,
  result_summary: String,
) -> Result(String, ExecError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_dispatch = string.trim(dispatch_id)
  let clean_execution = string.trim(execution_id)
  let clean_tool = string.trim(tool_name)
  let clean_summary = string.trim(result_summary)

  case clean_org, clean_actor, clean_dispatch, clean_execution, clean_tool {
    "", _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _ -> Error(EmptyActor)
    _, _, "", _, _ -> Error(EmptyDispatchId)
    _, _, _, "", _ -> Error(EmptyExecutionId)
    _, _, _, _, "" -> Error(EmptyToolName)
    _, _, _, _, _ ->
      case clean_summary {
        "" -> Error(EmptyResultSummary)
        _ -> {
          let event_id = "event:" <> ulid()
          let now = iso_now()
          let payload =
            json.to_string(
              json.object([
                #("execution_id", json.string(clean_execution)),
                #("tool_name", json.string(clean_tool)),
                #("result_summary", json.string(truncate(clean_summary, 280))),
              ]),
            )
          let envelope =
            Envelope(
              event_id: event_id,
              kind: "tool.returned",
              ts: now,
              actor: clean_actor,
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.some(clean_dispatch),
              execution_id: event_envelope.some(clean_execution),
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

/// Append a `tool.errored` envelope.
pub fn error_tool(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  dispatch_id: String,
  execution_id: String,
  tool_name: String,
  error_class: String,
  message: String,
) -> Result(String, ExecError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_dispatch = string.trim(dispatch_id)
  let clean_execution = string.trim(execution_id)
  let clean_tool = string.trim(tool_name)
  let clean_class = string.trim(error_class)
  let clean_msg = string.trim(message)

  case clean_org, clean_actor, clean_dispatch, clean_execution, clean_tool {
    "", _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _ -> Error(EmptyActor)
    _, _, "", _, _ -> Error(EmptyDispatchId)
    _, _, _, "", _ -> Error(EmptyExecutionId)
    _, _, _, _, "" -> Error(EmptyToolName)
    _, _, _, _, _ ->
      case clean_class, clean_msg {
        "", _ -> Error(EmptyErrorClass)
        _, "" -> Error(EmptyMessage)
        _, _ ->
          case validate_tool_error_class(clean_class) {
            Error(e) -> Error(e)
            Ok(_) -> {
              let event_id = "event:" <> ulid()
              let now = iso_now()
              let payload =
                json.to_string(
                  json.object([
                    #("execution_id", json.string(clean_execution)),
                    #("tool_name", json.string(clean_tool)),
                    #("error_class", json.string(clean_class)),
                    #("message", json.string(truncate(clean_msg, 280))),
                  ]),
                )
              let envelope =
                Envelope(
                  event_id: event_id,
                  kind: "tool.errored",
                  ts: now,
                  actor: clean_actor,
                  org_id: clean_org,
                  space_id: event_envelope.none(),
                  project_id: event_envelope.none(),
                  dispatch_id: event_envelope.some(clean_dispatch),
                  execution_id: event_envelope.some(clean_execution),
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
}

fn validate_kind(value: String) -> Result(Nil, ExecError) {
  case value {
    "tool" | "task" | "session" -> Ok(Nil)
    other -> Error(InvalidKind(other))
  }
}

fn validate_outcome(value: String) -> Result(Nil, ExecError) {
  case value {
    "ok" | "failed" | "cancelled" -> Ok(Nil)
    other -> Error(InvalidOutcome(other))
  }
}

fn validate_tool_error_class(value: String) -> Result(Nil, ExecError) {
  case value {
    "timeout"
    | "denied"
    | "not_found"
    | "invalid_args"
    | "upstream"
    | "internal" -> Ok(Nil)
    other -> Error(InvalidErrorClass(other))
  }
}

pub fn describe_error(e: ExecError) -> String {
  case e {
    EmptyOrg -> "org_id is required"
    EmptyActor -> "actor is required"
    EmptyDispatchId -> "dispatch_id is required"
    EmptyExecutionId -> "execution_id is required"
    EmptyKind -> "kind is required"
    EmptyName -> "name is required"
    EmptyToolName -> "tool_name is required"
    EmptyArgsJson -> "args_json is required"
    EmptyResultSummary -> "result_summary is required"
    EmptyErrorClass -> "error_class is required"
    EmptyMessage -> "message is required"
    EmptyOutcome -> "outcome is required"
    InvalidKind(v) ->
      "invalid execution kind: " <> v <> " (expected tool | task | session)"
    InvalidOutcome(v) ->
      "invalid outcome: " <> v <> " (expected ok | failed | cancelled)"
    InvalidErrorClass(v) ->
      "invalid tool error_class: "
      <> v
      <> " (expected timeout | denied | not_found | invalid_args | upstream | internal)"
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

fn truncate(value: String, max_len: Int) -> String {
  case string.length(value) > max_len {
    True -> string.slice(value, 0, max_len)
    False -> value
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
