//// ema_artifact — daemon-canonical writer for `artifact.*` events.
////
//// The writer owns new artifact content writes. CLI surfaces may still read
//// legacy project-local sidecar indexes, but new artifact mutation commands
//// route through this module and append canonical events.

import ema_daemon/bus
import ema_daemon/event_envelope
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type ArtifactError {
  EmptyOrg
  EmptyActor
  EmptyArtifactId
  EmptyKind
  EmptyProject
  EmptyTitle
  EmptyContent
  EmptyHash
  EmptyStoragePath
  EmptyTarget
  InvalidKind(value: String)
  StorageFailed(reason: String)
  AppendFailed(reason: String)
}

pub type WrittenArtifact {
  WrittenArtifact(
    artifact_id: String,
    event_id: String,
    content_hash: String,
    storage_path: String,
    bytes: Int,
  )
}

pub fn create_artifact(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  project: String,
  kind: String,
  title: String,
  source_path: String,
  content: String,
) -> Result(WrittenArtifact, ArtifactError) {
  let artifact_id = "artifact:" <> ulid()
  case write_artifact_content(artifact_id, content) {
    Error(e) -> Error(e)
    Ok(#(hash, storage_path, bytes)) ->
      append_artifact_event(
        bus_subject,
        "artifact.created",
        org_id,
        actor,
        project,
        artifact_id,
        kind,
        title,
        hash,
        storage_path,
        bytes,
        [#("source_path", json.string(source_path))],
      )
  }
}

pub fn update_artifact(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  artifact_id: String,
  project: String,
  kind: String,
  title: String,
  source_path: String,
  content: String,
) -> Result(WrittenArtifact, ArtifactError) {
  case write_artifact_content(artifact_id, content) {
    Error(e) -> Error(e)
    Ok(#(hash, storage_path, bytes)) ->
      append_artifact_event(
        bus_subject,
        "artifact.updated",
        org_id,
        actor,
        project,
        artifact_id,
        kind,
        title,
        hash,
        storage_path,
        bytes,
        [#("source_path", json.string(source_path))],
      )
  }
}

pub fn link_artifact(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  artifact_id: String,
  project: String,
  kind: String,
  title: String,
  content_hash: String,
  storage_path: String,
  bytes: Int,
  target_kind: String,
  target_id: String,
) -> Result(String, ArtifactError) {
  case validate_existing_pointer(artifact_id, kind, content_hash, storage_path) {
    Error(e) -> Error(e)
    Ok(_) ->
      append_artifact_pointer_event(
        bus_subject,
        "artifact.linked",
        org_id,
        actor,
        project,
        artifact_id,
        kind,
        title,
        content_hash,
        storage_path,
        bytes,
        [
          #("target_kind", json.string(string.trim(target_kind))),
          #("target_id", json.string(string.trim(target_id))),
        ],
      )
  }
}

pub fn archive_artifact(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor: String,
  artifact_id: String,
  project: String,
  kind: String,
  title: String,
  content_hash: String,
  storage_path: String,
  bytes: Int,
  reason: String,
) -> Result(String, ArtifactError) {
  case validate_existing_pointer(artifact_id, kind, content_hash, storage_path) {
    Error(e) -> Error(e)
    Ok(_) ->
      append_artifact_pointer_event(
        bus_subject,
        "artifact.archived",
        org_id,
        actor,
        project,
        artifact_id,
        kind,
        title,
        content_hash,
        storage_path,
        bytes,
        [#("reason", json.string(string.trim(reason)))],
      )
  }
}

fn write_artifact_content(
  artifact_id: String,
  content: String,
) -> Result(#(String, String, Int), ArtifactError) {
  case string.trim(content) {
    "" -> Error(EmptyContent)
    _ ->
      case write_content(artifact_id, content) {
        Ok(stored) -> Ok(stored)
        Error(reason) -> Error(StorageFailed(reason))
      }
  }
}

fn append_artifact_event(
  bus_subject: Subject(bus.Msg),
  event_kind: String,
  org_id: String,
  actor: String,
  project: String,
  artifact_id: String,
  kind: String,
  title: String,
  content_hash: String,
  storage_path: String,
  bytes: Int,
  metadata_fields: List(#(String, json.Json)),
) -> Result(WrittenArtifact, ArtifactError) {
  use _ <- result_try(validate_common(org_id, actor, project, artifact_id, kind, title))
  use _ <- result_try(validate_pointer(content_hash, storage_path))
  let event_id = "event:" <> ulid()
  let now = iso_now()
  let clean_kind = normalize_kind(kind)
  let payload =
    artifact_payload(
      artifact_id,
      clean_kind,
      project,
      actor,
      content_hash,
      storage_path,
      bytes,
      title,
      metadata_fields,
    )
  let envelope =
    event_envelope.Envelope(
      event_id: event_id,
      kind: event_kind,
      ts: now,
      actor: string.trim(actor),
      org_id: string.trim(org_id),
      space_id: event_envelope.none(),
      project_id: event_envelope.some(string.trim(project)),
      dispatch_id: event_envelope.none(),
      execution_id: event_envelope.none(),
      payload_json: payload,
    )
  case bus.append(bus_subject, envelope) {
    Ok(_) ->
      Ok(WrittenArtifact(
        artifact_id: artifact_id,
        event_id: event_id,
        content_hash: content_hash,
        storage_path: storage_path,
        bytes: bytes,
      ))
    Error(e) -> Error(AppendFailed(describe_append_error(e)))
  }
}

fn append_artifact_pointer_event(
  bus_subject: Subject(bus.Msg),
  event_kind: String,
  org_id: String,
  actor: String,
  project: String,
  artifact_id: String,
  kind: String,
  title: String,
  content_hash: String,
  storage_path: String,
  bytes: Int,
  metadata_fields: List(#(String, json.Json)),
) -> Result(String, ArtifactError) {
  case
    append_artifact_event(
      bus_subject,
      event_kind,
      org_id,
      actor,
      project,
      artifact_id,
      kind,
      title,
      content_hash,
      storage_path,
      bytes,
      metadata_fields,
    )
  {
    Ok(WrittenArtifact(event_id: event_id, ..)) -> Ok(event_id)
    Error(e) -> Error(e)
  }
}

fn artifact_payload(
  artifact_id: String,
  kind: String,
  project: String,
  actor: String,
  content_hash: String,
  storage_path: String,
  bytes: Int,
  title: String,
  metadata_fields: List(#(String, json.Json)),
) -> String {
  json.to_string(
    json.object([
      #("artifact_id", json.string(string.trim(artifact_id))),
      #("kind", json.string(kind)),
      #("project", json.string(string.trim(project))),
      #("created_by", json.string(string.trim(actor))),
      #("content_hash", json.string(string.trim(content_hash))),
      #("storage_path", json.string(string.trim(storage_path))),
      #("bytes", json.int(bytes)),
      #("metadata", json.object([#("title", json.string(string.trim(title))), ..metadata_fields])),
    ]),
  )
}

fn validate_common(
  org_id: String,
  actor: String,
  project: String,
  artifact_id: String,
  kind: String,
  title: String,
) -> Result(Nil, ArtifactError) {
  case
    string.trim(org_id),
    string.trim(actor),
    string.trim(project),
    string.trim(artifact_id),
    string.trim(kind),
    string.trim(title)
  {
    "", _, _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _, _ -> Error(EmptyActor)
    _, _, "", _, _, _ -> Error(EmptyProject)
    _, _, _, "", _, _ -> Error(EmptyArtifactId)
    _, _, _, _, "", _ -> Error(EmptyKind)
    _, _, _, _, _, "" -> Error(EmptyTitle)
    _, _, _, _, _, _ -> validate_kind(kind)
  }
}

fn validate_existing_pointer(
  artifact_id: String,
  kind: String,
  content_hash: String,
  storage_path: String,
) -> Result(Nil, ArtifactError) {
  case string.trim(artifact_id), string.trim(kind) {
    "", _ -> Error(EmptyArtifactId)
    _, "" -> Error(EmptyKind)
    _, _ -> {
      use _ <- result_try(validate_kind(kind))
      validate_pointer(content_hash, storage_path)
    }
  }
}

fn validate_pointer(
  content_hash: String,
  storage_path: String,
) -> Result(Nil, ArtifactError) {
  case string.trim(content_hash), string.trim(storage_path) {
    "", _ -> Error(EmptyHash)
    _, "" -> Error(EmptyStoragePath)
    _, _ -> Ok(Nil)
  }
}

fn validate_kind(kind: String) -> Result(Nil, ArtifactError) {
  case normalize_kind(kind) {
    "report" -> Ok(Nil)
    "note" -> Ok(Nil)
    "output" -> Ok(Nil)
    "session_log" -> Ok(Nil)
    "proof" -> Ok(Nil)
    "other" -> Ok(Nil)
    value -> Error(InvalidKind(value))
  }
}

fn normalize_kind(kind: String) -> String {
  string.lowercase(string.trim(kind))
}

fn result_try(
  value: Result(Nil, ArtifactError),
  next: fn(Nil) -> Result(a, ArtifactError),
) -> Result(a, ArtifactError) {
  case value {
    Ok(v) -> next(v)
    Error(e) -> Error(e)
  }
}

pub fn describe_error(error: ArtifactError) -> String {
  case error {
    EmptyOrg -> "org_id is required"
    EmptyActor -> "actor is required"
    EmptyArtifactId -> "artifact_id is required"
    EmptyKind -> "artifact kind is required"
    EmptyProject -> "project_id is required"
    EmptyTitle -> "title is required"
    EmptyContent -> "content is required"
    EmptyHash -> "content_hash is required"
    EmptyStoragePath -> "storage_path is required"
    EmptyTarget -> "target is required"
    InvalidKind(value) -> "invalid artifact kind " <> value
    StorageFailed(reason) -> "artifact storage failed: " <> reason
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

@external(erlang, "ema_artifact_storage", "write_content")
fn write_content(artifact_id: String, content: String) -> Result(#(String, String, Int), String)
