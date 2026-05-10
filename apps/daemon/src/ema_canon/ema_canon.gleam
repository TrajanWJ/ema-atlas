//// ema_canon — daemon-canonical writer for `canon.*` events.
////
//// Canon writes are intentionally narrow in sprint 3: the writer validates
//// body hash equality before appending, then the bus projection persists the
//// node and links. Execution result canonization is the first consumer.

import ema_daemon/bus
import ema_daemon/event_envelope
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string

pub type CanonError {
  EmptyOrg
  EmptyActor
  EmptyCanonId
  EmptyKind
  EmptyBody
  EmptyHash
  EmptySourceKind
  EmptySourceId
  EmptySupersededBy
  EmptyRationale
  InvalidKind(value: String)
  InvalidSourceKind(value: String)
  InvalidLink(value: String)
  HashMismatch(expected: String, got: String)
  AppendFailed(reason: String)
}

pub type WrittenCanon {
  WrittenCanon(canon_id: String, event_id: String, content_hash: String)
}

pub fn write_canon(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  canon_id: Option(String),
  kind: String,
  body: String,
  content_hash: String,
  source_kind: String,
  source_id: String,
  approved_by: Option(String),
  links: List(String),
) -> Result(WrittenCanon, CanonError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_kind = string.trim(kind)
  let clean_body = body
  let clean_hash = string.trim(content_hash)
  let clean_source_kind = string.trim(source_kind)
  let clean_source_id = string.trim(source_id)
  let id = case canon_id {
    Some(raw) ->
      case string.trim(raw) {
        "" -> "canon:" <> ulid()
        clean -> clean
      }
    None -> "canon:" <> ulid()
  }

  case
    clean_org,
    clean_actor,
    id,
    clean_kind,
    string.trim(clean_body),
    clean_hash,
    clean_source_kind,
    clean_source_id
  {
    "", _, _, _, _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _, _, _, _ -> Error(EmptyActor)
    _, _, "", _, _, _, _, _ -> Error(EmptyCanonId)
    _, _, _, "", _, _, _, _ -> Error(EmptyKind)
    _, _, _, _, "", _, _, _ -> Error(EmptyBody)
    _, _, _, _, _, "", _, _ -> Error(EmptyHash)
    _, _, _, _, _, _, "", _ -> Error(EmptySourceKind)
    _, _, _, _, _, _, _, "" -> Error(EmptySourceId)
    _, _, _, _, _, _, _, _ -> {
      use _ <- result_try(validate_kind(clean_kind))
      use _ <- result_try(validate_source_kind(clean_source_kind))
      let expected_hash = sha256(clean_body)
      case expected_hash == clean_hash {
        False -> Error(HashMismatch(expected: expected_hash, got: clean_hash))
        True -> {
          use link_values <- result_try_links(normalize_links(links))
          let event_id = "event:" <> ulid()
          let now = iso_now()
          let payload =
            json.to_string(
              json.object([
                #("canon_id", json.string(id)),
                #("kind", json.string(clean_kind)),
                #("content_hash", json.string(clean_hash)),
                #("body", json.string(clean_body)),
                #("source_kind", json.string(clean_source_kind)),
                #("source_id", json.string(clean_source_id)),
                #("links", json.preprocessed_array(list.map(link_values, link_json))),
                #("written_by_actor_id", json.string(clean_actor)),
                #("approved_by_actor_id", optional_string(approved_by)),
                #("written_at", json.string(now)),
              ]),
            )
          let envelope =
            event_envelope.Envelope(
              event_id: event_id,
              kind: "canon.written",
              ts: now,
              actor: clean_actor,
              org_id: clean_org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.none(),
              execution_id: source_execution(clean_source_kind, clean_source_id),
              payload_json: payload,
            )
          case bus.append(bus_subject, envelope) {
            Ok(_) -> Ok(WrittenCanon(canon_id: id, event_id: event_id, content_hash: clean_hash))
            Error(e) -> Error(AppendFailed(describe_append_error(e)))
          }
        }
      }
    }
  }
}

pub fn supersede_canon(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  canon_id: String,
  superseded_by: String,
  rationale: String,
) -> Result(String, CanonError) {
  let clean_org = string.trim(org_id)
  let clean_actor = string.trim(actor)
  let clean_canon = string.trim(canon_id)
  let clean_by = string.trim(superseded_by)
  let clean_rationale = string.trim(rationale)
  case clean_org, clean_actor, clean_canon, clean_by, clean_rationale {
    "", _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _ -> Error(EmptyActor)
    _, _, "", _, _ -> Error(EmptyCanonId)
    _, _, _, "", _ -> Error(EmptySupersededBy)
    _, _, _, _, "" -> Error(EmptyRationale)
    _, _, _, _, _ -> {
      let event_id = "event:" <> ulid()
      let now = iso_now()
      let payload =
        json.to_string(
          json.object([
            #("canon_id", json.string(clean_canon)),
            #("superseded_by_canon_id", json.string(clean_by)),
            #("superseded_by_actor_id", json.string(clean_actor)),
            #("rationale", json.string(clean_rationale)),
            #("superseded_at", json.string(now)),
          ]),
        )
      let envelope =
        event_envelope.Envelope(
          event_id: event_id,
          kind: "canon.superseded",
          ts: now,
          actor: clean_actor,
          org_id: clean_org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
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

type CanonLink {
  CanonLink(kind: String, target_id: String)
}

fn normalize_links(values: List(String)) -> Result(List(CanonLink), CanonError) {
  values
  |> list.try_map(fn(value) {
    let clean = string.trim(value)
    let parts = string.split(clean, ":")
    case parts {
      [kind, ..target_parts] -> {
        let clean_kind = string.trim(kind)
        let target = string.join(target_parts, ":") |> string.trim
        case clean_kind, target {
          "", _ -> Error(InvalidLink(value))
          _, "" -> Error(InvalidLink(value))
          _, _ -> Ok(CanonLink(kind: clean_kind, target_id: target))
        }
      }
      _ -> Error(InvalidLink(value))
    }
  })
}

fn link_json(link: CanonLink) -> json.Json {
  json.object([
    #("kind", json.string(link.kind)),
    #("target_id", json.string(link.target_id)),
  ])
}

fn source_execution(source_kind: String, source_id: String) -> event_envelope.Option(String) {
  case source_kind {
    "execution" -> event_envelope.some(source_id)
    _ -> event_envelope.none()
  }
}

fn validate_kind(value: String) -> Result(Nil, CanonError) {
  case value {
    "execution_result" | "decision" | "doctrine" | "observation" | "retro" | "direction" -> Ok(Nil)
    other -> Error(InvalidKind(other))
  }
}

fn validate_source_kind(value: String) -> Result(Nil, CanonError) {
  case value {
    "execution" | "proposal" | "intent" | "manual" | "external" -> Ok(Nil)
    other -> Error(InvalidSourceKind(other))
  }
}

fn optional_string(value: Option(String)) -> json.Json {
  case value {
    Some(raw) ->
      case string.trim(raw) {
        "" -> json.null()
        clean -> json.string(clean)
      }
    None -> json.null()
  }
}

fn result_try(
  value: Result(Nil, CanonError),
  next: fn(Nil) -> Result(a, CanonError),
) -> Result(a, CanonError) {
  case value {
    Ok(v) -> next(v)
    Error(e) -> Error(e)
  }
}

fn result_try_links(
  value: Result(List(CanonLink), CanonError),
  next: fn(List(CanonLink)) -> Result(a, CanonError),
) -> Result(a, CanonError) {
  case value {
    Ok(v) -> next(v)
    Error(e) -> Error(e)
  }
}

pub fn describe_error(error: CanonError) -> String {
  case error {
    EmptyOrg -> "org_id is required"
    EmptyActor -> "actor is required"
    EmptyCanonId -> "canon_id is required"
    EmptyKind -> "canon kind is required"
    EmptyBody -> "body is required"
    EmptyHash -> "content_hash is required"
    EmptySourceKind -> "source_kind is required"
    EmptySourceId -> "source_id is required"
    EmptySupersededBy -> "superseded_by_canon_id is required"
    EmptyRationale -> "rationale is required"
    InvalidKind(value) -> "invalid canon kind " <> value
    InvalidSourceKind(value) -> "invalid source kind " <> value
    InvalidLink(value) -> "invalid canon link " <> value
    HashMismatch(expected, got) -> "content_hash mismatch: expected " <> expected <> " got " <> got
    AppendFailed(reason) -> reason
  }
}

fn describe_append_error(error: bus.AppendError) -> String {
  case error {
    bus.InvalidKind(kind) -> "invalid event kind " <> kind
    bus.NotInCatalog(kind) -> "event kind not in catalog " <> kind
    bus.PersistenceFailed(reason) -> "persistence failed: " <> reason
  }
}

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String

@external(erlang, "ema_time_ffi", "ulid")
fn ulid() -> String

@external(erlang, "ema_canon_hash", "sha256")
fn sha256(value: String) -> String
