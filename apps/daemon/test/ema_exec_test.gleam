//// ema_exec writer tests.
////
//// Open an in-memory bus on a throwaway DB, exercise the execution +
//// tool writers, and confirm canonical envelopes land in SQLite.

import ema_daemon/bus
import ema_exec/ema_exec
import gleam/option.{None, Some}
import gleam/string
import gleeunit/should

pub fn execution_start_appends_canonical_event_test() {
  let path = tmp_path("ema-exec-start.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(ema_exec.StartedExecution(execution_id, event_id)) =
    ema_exec.start_execution(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "tool",
      "fs.read",
      Some("simulated"),
    )

  should.equal(string.starts_with(execution_id, "execution:"), True)
  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "execution.started", "org:test"),
    True,
  )

  let _ = delete_file(path)
}

pub fn execution_kind_validation_test() {
  let path = tmp_path("ema-exec-kind.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Error(ema_exec.InvalidKind(value)) =
    ema_exec.start_execution(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "weird_kind",
      "fs.read",
      None,
    )
  should.equal(value, "weird_kind")

  let _ = delete_file(path)
}

pub fn execution_end_appends_event_test() {
  let path = tmp_path("ema-exec-end.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(event_id) =
    ema_exec.end_execution(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "ok",
      42,
    )

  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "execution.ended", "org:test"),
    True,
  )

  let assert Error(ema_exec.InvalidOutcome(_)) =
    ema_exec.end_execution(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "nope",
      0,
    )

  let _ = delete_file(path)
}

pub fn execution_complete_appends_event_test() {
  let path = tmp_path("ema-exec-complete.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(event_id) =
    ema_exec.complete_execution(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "codex",
      0,
      42,
      12,
      3,
      ".ema-dev/harness-glue/codex/execution_test.jsonl",
      "prompt-hash",
      None,
    )

  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "execution.completed", "org:test"),
    True,
  )

  let _ = delete_file(path)
}

pub fn execution_timeout_appends_event_test() {
  let path = tmp_path("ema-exec-timeout.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(event_id) =
    ema_exec.timeout_execution(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "codex",
      60_000,
      60_001,
      12,
      3,
      ".ema-dev/harness-glue/codex/execution_test.jsonl",
      "prompt-hash",
    )

  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "execution.timeout", "org:test"),
    True,
  )

  let _ = delete_file(path)
}

pub fn execution_fail_appends_event_test() {
  let path = tmp_path("ema-exec-fail.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(event_id) =
    ema_exec.fail_execution(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "internal",
      "boom",
    )

  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "execution.failed", "org:test"),
    True,
  )

  let _ = delete_file(path)
}

pub fn execution_restart_interrupt_appends_event_test() {
  let path = tmp_path("ema-exec-restart-interrupt.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(event_id) =
    ema_exec.interrupt_by_restart(
      bus_subject,
      "org:test",
      "actor:boot_recovery_scanner",
      "dispatch:test",
      "execution:test",
      "running",
      "execution.started",
      "2026-05-10T00:00:00.000Z",
      "{}",
    )

  should.equal(string.starts_with(event_id, "event:"), True)
  should.equal(
    bus.event_exists(
      bus_subject,
      "execution.interrupted_by_restart",
      "org:test",
    ),
    True,
  )

  let _ = delete_file(path)
}

pub fn tool_invoke_return_error_lifecycle_test() {
  let path = tmp_path("ema-tool-lifecycle.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(invoke_id) =
    ema_exec.invoke_tool(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "fs.read",
      "{\"path\":\"/tmp/x\"}",
      Some("simulated"),
    )

  let assert Ok(return_id) =
    ema_exec.return_tool(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "fs.read",
      "ok (read 12 bytes)",
    )

  let assert Ok(error_id) =
    ema_exec.error_tool(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "fs.read",
      "timeout",
      "Read timed out",
    )

  should.equal(string.starts_with(invoke_id, "event:"), True)
  should.equal(string.starts_with(return_id, "event:"), True)
  should.equal(string.starts_with(error_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "tool.invoked", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "tool.returned", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "tool.errored", "org:test"),
    True,
  )

  let assert Error(ema_exec.InvalidErrorClass(value)) =
    ema_exec.error_tool(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "fs.read",
      "exploded",
      "boom",
    )
  should.equal(value, "exploded")

  let _ = delete_file(path)
}

pub fn tool_invoke_validates_required_fields_test() {
  let path = tmp_path("ema-tool-validation.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Error(ema_exec.EmptyArgsJson) =
    ema_exec.invoke_tool(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "fs.read",
      "",
      None,
    )
  let assert Error(ema_exec.EmptyToolName) =
    ema_exec.invoke_tool(
      bus_subject,
      "org:test",
      "actor:test",
      "dispatch:test",
      "execution:test",
      "",
      "{}",
      None,
    )

  let _ = delete_file(path)
}

@external(erlang, "ema_test_helpers", "tmp_path")
fn tmp_path(suffix: String) -> String

@external(erlang, "ema_test_helpers", "delete_file")
fn delete_file(path: String) -> Result(Nil, Nil)
