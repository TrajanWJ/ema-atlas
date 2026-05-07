//// ema_dispatch writer tests.
////
//// Open an in-memory bus on a throwaway DB, exercise each writer, and
//// confirm that envelopes land in SQLite with the expected `dispatch_id`
//// stamped in the envelope.

import ema_daemon/bus
import ema_dispatch/ema_dispatch
import gleam/option.{None, Some}
import gleam/string
import gleeunit/should

pub fn dispatch_start_appends_canonical_event_test() {
  let path = tmp_path("ema-dispatch-start.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let workspace =
    ema_dispatch.WorkspaceRef(
      org_id: "org:test",
      space_id: Some("space:test"),
      project_id: Some("project:test"),
    )

  let assert Ok(ema_dispatch.StartedDispatch(dispatch_id, event_id)) =
    ema_dispatch.start_dispatch(
      bus_subject,
      "actor:test",
      "user:test",
      "Smoke run",
      workspace,
      Some("simulated"),
      Some("lane:test"),
    )

  should.equal(string.starts_with(dispatch_id, "dispatch:"), True)
  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "dispatch.started", "org:test"),
    True,
  )

  let _ = delete_file(path)
}

pub fn dispatch_start_validates_required_fields_test() {
  let path = tmp_path("ema-dispatch-validation.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let empty_workspace =
    ema_dispatch.WorkspaceRef(
      org_id: "",
      space_id: None,
      project_id: None,
    )
  let assert Error(ema_dispatch.EmptyOrg) =
    ema_dispatch.start_dispatch(
      bus_subject,
      "actor:test",
      "actor:test",
      "intent",
      empty_workspace,
      None,
      None,
    )

  let workspace =
    ema_dispatch.WorkspaceRef(
      org_id: "org:test",
      space_id: None,
      project_id: None,
    )
  let assert Error(ema_dispatch.EmptyActor) =
    ema_dispatch.start_dispatch(
      bus_subject,
      "",
      "actor:test",
      "intent",
      workspace,
      None,
      None,
    )
  let assert Error(ema_dispatch.EmptyIntent) =
    ema_dispatch.start_dispatch(
      bus_subject,
      "actor:test",
      "actor:test",
      "",
      workspace,
      None,
      None,
    )

  let _ = delete_file(path)
}

pub fn dispatch_scope_grant_appends_event_test() {
  let path = tmp_path("ema-dispatch-scope.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let scope =
    ema_dispatch.ScopeGrant(
      read: ["fs.read:project:test"],
      write: ["fs.write:project:test"],
      call: ["tool:fs.read"],
      secrets: [],
    )

  let assert Ok(event_id) =
    ema_dispatch.grant_scope(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      scope,
    )

  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "dispatch.scope_granted", "org:test"),
    True,
  )

  let assert Error(ema_dispatch.EmptyScope) =
    ema_dispatch.grant_scope(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      ema_dispatch.empty_scope_grant(),
    )

  let _ = delete_file(path)
}

pub fn dispatch_end_validates_outcome_test() {
  let path = tmp_path("ema-dispatch-end.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(event_id) =
    ema_dispatch.end_dispatch(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "ok",
      Some("simulated"),
    )

  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "dispatch.ended", "org:test"),
    True,
  )

  let assert Error(ema_dispatch.InvalidOutcome(value)) =
    ema_dispatch.end_dispatch(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "weird",
      None,
    )
  should.equal(value, "weird")

  let _ = delete_file(path)
}

@external(erlang, "ema_test_helpers", "tmp_path")
fn tmp_path(suffix: String) -> String

@external(erlang, "ema_test_helpers", "delete_file")
fn delete_file(path: String) -> Result(Nil, Nil)
