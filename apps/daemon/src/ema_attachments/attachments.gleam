//// Attachments writer.
////
//// Handles commands that mutate attachment records and emits
//// `attachment.*` events to the bus. Pointer metadata only — raw
//// file bytes are out of scope for 0.0.6 wave 1.

import gleam/erlang/process.{type Subject}

pub type AttachmentKind {
  KindFile
  KindFolder
  KindGitRepo
  KindGitPath
  KindDriveFile
  KindDriveFolder
}

pub type AttachmentSource {
  SourceLocal
  SourceGoogleDrive
  SourceGithub
  SourceGitUrl
}

pub type SourceRef {
  LocalRef(blob_id: String)
  DriveRef(drive_file_id: String, owner_email: String)
  GithubRef(
    owner: String,
    repo: String,
    ref: Option(String),
    path: Option(String),
  )
  GitUrlRef(url: String, ref: Option(String), path: Option(String))
}

pub type Option(a) {
  None
  Some(a)
}

pub type LinkPoint {
  LinkPoint(object_kind: String, object_id: String)
}

pub type Attachment {
  Attachment(
    id: String,
    kind: AttachmentKind,
    source: AttachmentSource,
    display_name: String,
    mime: Option(String),
    size_bytes: Option(Int),
    source_ref: SourceRef,
    created_by: String,
    created_at: String,
    updated_at: String,
  )
}

pub type Msg {
  Rename(
    attachment_id: String,
    name: String,
    reply: Subject(Result(Nil, Error)),
  )
  Delete(attachment_id: String, by: String, reply: Subject(Result(Nil, Error)))
  Link(
    attachment_id: String,
    object_kind: String,
    object_id: String,
    by: String,
    reply: Subject(Result(Nil, Error)),
  )
  Unlink(
    attachment_id: String,
    object_kind: String,
    object_id: String,
    by: String,
    reply: Subject(Result(Nil, Error)),
  )
  /// Called by `connectors.gleam` when an import produces a new
  /// attachment record. Writes the `attachment.created` event.
  CreateFromImport(
    attachment: Attachment,
    reply: Subject(Result(String, Error)),
  )
}

pub type Error {
  NotFound(id: String)
  InvalidArgs(reason: String)
  PersistenceFailed(reason: String)
}

/// Invariants enforced on a new attachment before emitting
/// `attachment.created`. Kept here so the rule is testable without
/// starting the actor.
pub fn validate(a: Attachment) -> Result(Nil, Error) {
  // source_ref tag must match source
  case a.source, a.source_ref {
    SourceLocal, LocalRef(_) -> Ok(Nil)
    SourceGoogleDrive, DriveRef(_, _) -> Ok(Nil)
    SourceGithub, GithubRef(_, _, _, _) -> Ok(Nil)
    SourceGitUrl, GitUrlRef(_, _, _) -> Ok(Nil)
    _, _ -> Error(InvalidArgs("source_ref tag does not match source"))
  }
}
