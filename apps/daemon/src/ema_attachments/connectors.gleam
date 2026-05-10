//// Connectors writer (demo-stubbed).
////
//// Wave 1: the only "OAuth" is a state flip. `connector.connect`
//// appends a `connector.connected` event with `fake: true` and a
//// hard-coded display label. `connector.list_picker_items` returns a
//// hard-coded catalog. `connector.import_resource` produces a new
//// attachment record and emits `attachment.created` +
//// `connector.linked_resource_imported`.

import gleam/erlang/process.{type Subject}

pub type Provider {
  GoogleDrive
  Github
}

pub type Status {
  Disconnected
  Connected
}

pub type Connector {
  Connector(
    id: String,
    user_id: String,
    provider: Provider,
    status: Status,
    connected_at: Option(String),
    display_label: String,
    fake: Bool,
  )
}

pub type Option(a) {
  None
  Some(a)
}

pub type PickerItem {
  PickerItem(
    id: String,
    provider: Provider,
    display_name: String,
    // Loose hint: the surface treats these opaquely.
    kind_hint: String,
  )
}

pub type Msg {
  Connect(
    user_id: String,
    provider: Provider,
    reply: Subject(Result(String, Error)),
  )
  Disconnect(
    connector_id: String,
    by: String,
    reply: Subject(Result(Nil, Error)),
  )
  ListPickerItems(
    connector_id: String,
    reply: Subject(Result(List(PickerItem), Error)),
  )
  ImportResource(
    connector_id: String,
    picker_item_id: String,
    by: String,
    reply: Subject(Result(String, Error)),
  )
}

pub type Error {
  NotFound(id: String)
  WrongStatus(expected: Status)
  UnknownPickerItem(id: String)
  InvalidArgs(reason: String)
  PersistenceFailed(reason: String)
}

/// Fake display label for a just-"connected" connector.
/// Kept pure for tests.
pub fn demo_label(p: Provider) -> String {
  case p {
    GoogleDrive -> "demo@example.com"
    Github -> "gh:demo-user"
  }
}

/// Hard-coded in-memory catalog returned by `ListPickerItems`.
/// This is the only fixture data the daemon ships with — it disappears
/// when real OAuth replaces the stub.
pub fn demo_picker_items(provider: Provider) -> List(PickerItem) {
  case provider {
    GoogleDrive -> [
      PickerItem(
        id: "drive:doc-welcome",
        provider: GoogleDrive,
        display_name: "Welcome to EMA (Doc)",
        kind_hint: "drive_file",
      ),
      PickerItem(
        id: "drive:sheet-roadmap",
        provider: GoogleDrive,
        display_name: "0.0.6 Roadmap (Sheet)",
        kind_hint: "drive_file",
      ),
      PickerItem(
        id: "drive:folder-specs",
        provider: GoogleDrive,
        display_name: "Specs / (Folder)",
        kind_hint: "drive_folder",
      ),
    ]
    Github -> [
      PickerItem(
        id: "gh:anthropics/claude-code",
        provider: Github,
        display_name: "anthropics/claude-code",
        kind_hint: "git_repo",
      ),
      PickerItem(
        id: "gh:ema/runtime",
        provider: Github,
        display_name: "ema/runtime",
        kind_hint: "git_repo",
      ),
      PickerItem(
        id: "gh:ema/runtime@main:/docs",
        provider: Github,
        display_name: "ema/runtime · docs/ (path)",
        kind_hint: "git_path",
      ),
    ]
  }
}
