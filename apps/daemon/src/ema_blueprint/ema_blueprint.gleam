//// ema_blueprint — structural blueprint truth.
////
//// Owns the canonical `blueprint.document.*` and `blueprint.section.*`
//// events. Prose lives in BEAM-owned `ema_collab` rooms keyed by
//// `blueprint_sec:<ulid>`; this writer only handles the structural
//// plane (documents, section trees, moves).
////
//// See `docs/architecture/06-blueprint-boundaries.md` for the
//// canonical/collab split, and `packages/contracts/events/blueprint.md`
//// for payload shapes.

import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import gleam/erlang/process.{type Subject}
import gleam/int
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/string

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

pub type DocumentCreated {
  DocumentCreated(document_id: String, event_id: String)
}

pub type DocumentRenamed {
  DocumentRenamed(document_id: String, event_id: String)
}

pub type DocumentArchived {
  DocumentArchived(document_id: String, event_id: String)
}

pub type SectionAdded {
  SectionAdded(section_id: String, event_id: String)
}

pub type SectionRenamed {
  SectionRenamed(section_id: String, event_id: String)
}

pub type SectionMoved {
  SectionMoved(section_id: String, event_id: String)
}

pub type SectionRemoved {
  SectionRemoved(section_id: String, event_id: String)
}

pub type SectionPromoted {
  SectionPromoted(
    section_id: String,
    proposal_id: String,
    drafted_event_id: String,
    promoted_event_id: String,
  )
}

pub type BlueprintError {
  EmptyOrg
  EmptyActor
  EmptyTitle
  EmptyDocumentId
  EmptySectionId
  EmptyProjectId
  EmptyBody
  AppendFailed(reason: String)
}

// ---------------------------------------------------------------------------
// Document operations
// ---------------------------------------------------------------------------

pub fn create_document(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  space_id: Option(String),
  actor_id: String,
  project_id: String,
  title: String,
) -> Result(DocumentCreated, BlueprintError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let project = string.trim(project_id)
  let doc_title = string.trim(title)

  case org, actor, project, doc_title {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyProjectId)
    _, _, _, "" -> Error(EmptyTitle)
    _, _, _, _ -> {
      let now = iso_now()
      let document_id = "blueprint_doc:" <> ulid()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("document_id", json.string(document_id)),
            #("project_id", json.string(project)),
            #("title", json.string(doc_title)),
            #("created_by", json.string(actor)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "blueprint.document.created",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: optional_envelope_id(space_id),
          project_id: event_envelope.some(project),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) ->
          Ok(DocumentCreated(document_id: document_id, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

pub fn rename_document(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  document_id: String,
  new_title: String,
) -> Result(DocumentRenamed, BlueprintError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let doc = string.trim(document_id)
  let to_title = string.trim(new_title)

  case org, actor, doc, to_title {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyDocumentId)
    _, _, _, "" -> Error(EmptyTitle)
    _, _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("document_id", json.string(doc)),
            #("from", json.string("")),
            #("to", json.string(to_title)),
            #("renamed_by", json.string(actor)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "blueprint.document.renamed",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) -> Ok(DocumentRenamed(document_id: doc, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

pub fn archive_document(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  document_id: String,
  reason: Option(String),
) -> Result(DocumentArchived, BlueprintError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let doc = string.trim(document_id)

  case org, actor, doc {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyDocumentId)
    _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("document_id", json.string(doc)),
            #("reason", optional_string(reason)),
            #("archived_by", json.string(actor)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "blueprint.document.archived",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) -> Ok(DocumentArchived(document_id: doc, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Section operations
// ---------------------------------------------------------------------------

pub fn add_section(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  space_id: Option(String),
  project_id: Option(String),
  actor_id: String,
  document_id: String,
  parent_section_id: Option(String),
  title: String,
  position: Int,
) -> Result(SectionAdded, BlueprintError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let doc = string.trim(document_id)
  let sec_title = string.trim(title)

  case org, actor, doc, sec_title {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyDocumentId)
    _, _, _, "" -> Error(EmptyTitle)
    _, _, _, _ -> {
      let now = iso_now()
      let section_id = "blueprint_sec:" <> ulid()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("section_id", json.string(section_id)),
            #("document_id", json.string(doc)),
            #("parent_section_id", optional_string(parent_section_id)),
            #("title", json.string(sec_title)),
            #("position", json.int(position)),
            #("added_by", json.string(actor)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "blueprint.section.added",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: optional_envelope_id(space_id),
          project_id: optional_envelope_id(project_id),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) -> Ok(SectionAdded(section_id: section_id, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

pub fn rename_section(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  section_id: String,
  new_title: String,
) -> Result(SectionRenamed, BlueprintError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let sec = string.trim(section_id)
  let to_title = string.trim(new_title)

  case org, actor, sec, to_title {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptySectionId)
    _, _, _, "" -> Error(EmptyTitle)
    _, _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("section_id", json.string(sec)),
            #("from", json.string("")),
            #("to", json.string(to_title)),
            #("renamed_by", json.string(actor)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "blueprint.section.renamed",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) -> Ok(SectionRenamed(section_id: sec, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

pub fn move_section(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  section_id: String,
  to_parent_section_id: Option(String),
  to_position: Int,
) -> Result(SectionMoved, BlueprintError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let sec = string.trim(section_id)

  case org, actor, sec {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptySectionId)
    _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("section_id", json.string(sec)),
            #(
              "from",
              json.object([
                #("parent", json.string("")),
                #("position", json.int(0)),
              ]),
            ),
            #(
              "to",
              json.object([
                #("parent", optional_string(to_parent_section_id)),
                #("position", json.int(to_position)),
              ]),
            ),
            #("moved_by", json.string(actor)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "blueprint.section.moved",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) -> Ok(SectionMoved(section_id: sec, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

/// Promote a Blueprint section to a canonical proposal. Emits two events,
/// in order, in the same writer call: `proposal.drafted` first, then the
/// mirror `blueprint.section.promoted_to_proposal`. Per ADR 06's mirror
/// contract, the canonical proposal event lands first.
pub fn promote_section_to_proposal(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  section_id: String,
  title: String,
  body: String,
) -> Result(SectionPromoted, BlueprintError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let sec = string.trim(section_id)
  let prop_title = string.trim(title)
  let prop_body = string.trim(body)

  case org, actor, sec, prop_title, prop_body {
    "", _, _, _, _ -> Error(EmptyOrg)
    _, "", _, _, _ -> Error(EmptyActor)
    _, _, "", _, _ -> Error(EmptySectionId)
    _, _, _, "", _ -> Error(EmptyTitle)
    _, _, _, _, "" -> Error(EmptyBody)
    _, _, _, _, _ -> {
      let now = iso_now()
      let proposal_id = "proposal:" <> ulid()
      let drafted_event_id = "event:" <> ulid()
      let promoted_event_id = "event:" <> ulid()

      let drafted_payload =
        json.to_string(
          json.object([
            #("proposal_id", json.string(proposal_id)),
            #("title", json.string(prop_title)),
            #("body", json.string(prop_body)),
            #("source_section_id", json.string(sec)),
            #("drafted_by", json.string(actor)),
          ]),
        )

      let drafted_envelope =
        Envelope(
          event_id: drafted_event_id,
          kind: "proposal.drafted",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: drafted_payload,
        )

      case bus.append(bus_subject, drafted_envelope) {
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
        Ok(_) -> {
          let promoted_payload =
            json.to_string(
              json.object([
                #("section_id", json.string(sec)),
                #("proposal_id", json.string(proposal_id)),
                #("promoted_by", json.string(actor)),
              ]),
            )
          let promoted_envelope =
            Envelope(
              event_id: promoted_event_id,
              kind: "blueprint.section.promoted_to_proposal",
              ts: now,
              actor: actor,
              org_id: org,
              space_id: event_envelope.none(),
              project_id: event_envelope.none(),
              dispatch_id: event_envelope.none(),
              execution_id: event_envelope.none(),
              payload_json: promoted_payload,
            )
          case bus.append(bus_subject, promoted_envelope) {
            Ok(_) ->
              Ok(SectionPromoted(
                section_id: sec,
                proposal_id: proposal_id,
                drafted_event_id: drafted_event_id,
                promoted_event_id: promoted_event_id,
              ))
            Error(e) -> Error(AppendFailed(describe_append_error(e)))
          }
        }
      }
    }
  }
}

pub fn remove_section(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  section_id: String,
) -> Result(SectionRemoved, BlueprintError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let sec = string.trim(section_id)

  case org, actor, sec {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptySectionId)
    _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("section_id", json.string(sec)),
            #("removed_by", json.string(actor)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "blueprint.section.removed",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      case bus.append(bus_subject, envelope) {
        Ok(_) -> Ok(SectionRemoved(section_id: sec, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

fn optional_envelope_id(
  value: Option(String),
) -> event_envelope.Option(String) {
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

pub fn describe_error(e: BlueprintError) -> String {
  case e {
    EmptyOrg -> "org_id is required"
    EmptyActor -> "actor_id is required"
    EmptyTitle -> "title is required"
    EmptyDocumentId -> "document_id is required"
    EmptySectionId -> "section_id is required"
    EmptyProjectId -> "project_id is required"
    EmptyBody -> "body is required"
    AppendFailed(reason) -> "append failed: " <> reason
  }
}

pub fn describe_position(p: Int) -> String {
  int.to_string(p)
}

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String

@external(erlang, "ema_time_ffi", "ulid")
fn ulid() -> String
