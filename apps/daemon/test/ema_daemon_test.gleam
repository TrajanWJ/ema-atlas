import gleeunit
import gleeunit/should

import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}

pub fn main() {
  gleeunit.main()
}

/// M1 smoke test: start a bus on a throwaway db and confirm the first
/// two appends produce txid 1 and 2, respectively.
pub fn bus_assigns_sequential_txids_test() {
  let path = tmp_path("ema-m1-bus.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let e1 = sample_envelope("event:test-1")
  let e2 = sample_envelope("event:test-2")

  let assert Ok(txid1) = bus.append(bus_subject, e1)
  let assert Ok(txid2) = bus.append(bus_subject, e2)

  should.equal(txid1, 1)
  should.equal(txid2, 2)

  let _ = delete_file(path)
}

fn sample_envelope(event_id: String) -> event_envelope.Envelope {
  Envelope(
    event_id: event_id,
    kind: "dispatch.started",
    ts: "2026-04-24T00:00:00Z",
    actor: "actor:test",
    org_id: "org:test",
    space_id: event_envelope.none(),
    project_id: event_envelope.none(),
    dispatch_id: event_envelope.some("dispatch:test"),
    execution_id: event_envelope.none(),
    payload_json: "{}",
  )
}

@external(erlang, "ema_test_helpers", "tmp_path")
fn tmp_path(suffix: String) -> String

@external(erlang, "ema_test_helpers", "delete_file")
fn delete_file(path: String) -> Result(Nil, Nil)
