import gleeunit
import gleeunit/should

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import ema_swarm/scope_registry
import gleam/string

pub fn main() {
  gleeunit.main()
}

pub fn scope_paths_overlap_on_same_path_or_descendant_test() {
  should.equal(
    scope_registry.paths_overlap(
      "components/brand",
      "components/brand/deal-card.tsx",
    ),
    True,
  )
  should.equal(
    scope_registry.paths_overlap(
      "components/brand/deal-card.tsx",
      "components/brand",
    ),
    True,
  )
  should.equal(
    scope_registry.paths_overlap("components/brand", "components/backend"),
    False,
  )
}

pub fn scope_paths_normalize_duplicate_slashes_and_dots_test() {
  should.equal(
    scope_registry.normalize_path("./components//brand/"),
    "components/brand",
  )
}

pub fn scope_registry_projection_and_conflict_test() {
  let path = tmp_path("ema-scope-registry.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(_) =
    bus.append(
      bus_subject,
      scope_claim_envelope(
        "event:scope-claim-a",
        "scope_claim:a",
        "actor:a",
        "project:a",
        "components/brand",
      ),
    )

  let projection = bus.scope_registry_projection_json(bus_subject)

  should.equal(string.contains(projection, "\"claim_id\":\"scope_claim:a\""), True)
  should.equal(string.contains(projection, "\"path\":\"components/brand\""), True)
  should.equal(
    bus.scope_claim_conflict(
      bus_subject,
      "org:test",
      "project:a",
      "components/brand/deal-card.tsx",
    ),
    "scope_claim:a",
  )
  should.equal(
    bus.scope_claim_conflict(
      bus_subject,
      "org:test",
      "project:a",
      "components/backend/deals.ts",
    ),
    "",
  )

  let _ = delete_file(path)
}

fn scope_claim_envelope(
  event_id: String,
  claim_id: String,
  actor_id: String,
  project_id: String,
  path: String,
) -> Envelope {
  Envelope(
    event_id: event_id,
    kind: "scope.claimed",
    ts: "2026-05-10T00:00:00Z",
    actor: actor_id,
    org_id: "org:test",
    space_id: event_envelope.none(),
    project_id: event_envelope.some(project_id),
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: "{\"claim_id\":\"" <> claim_id <> "\",\"actor_id\":\"" <> actor_id <> "\",\"owner_kind\":\"swarm\",\"owner_id\":\"swarm:test\",\"path\":\"" <> path <> "\",\"status\":\"active\"}",
  )
}

@external(erlang, "ema_test_helpers", "tmp_path")
fn tmp_path(suffix: String) -> String

@external(erlang, "file", "delete")
fn delete_file(path: String) -> Result(Nil, Nil)
