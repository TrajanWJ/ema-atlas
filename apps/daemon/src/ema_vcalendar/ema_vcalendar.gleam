//// ema_vcalendar — virtual calendar writer.
////
//// Handles the command path for agent-sim calendar state:
////
////   - `vcalendar.block.add`   → `calendar_block.added`
////   - `vcalendar.block.move`  → `calendar_block.moved`
////   - `vcalendar.phase.set`   → `vcalendar.phase_set`
////   - `checkup.schedule`      → `checkup.scheduled`
////   - `checkup.complete`      → `checkup.completed`
////
//// Each writer appends a canonical envelope through the daemon bus.
//// The vCalendar itself is a derived projection: it is rebuilt by
//// replaying these events (client-side in the CLI today; daemon-side
//// when a projection actor lands).

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string

pub type VcalendarError {
  EmptyOrg
  EmptyActor
  EmptyBlockKind
  EmptyLabel
  EmptyBlockId
  EmptyStartAt
  EmptyPhase
  EmptyLaneId
  EmptyCadence
  EmptyCheckupId
  EmptyResult
  AppendFailed(reason: String)
}

// ---------------------------------------------------------------------------
// vcalendar.block.add
// ---------------------------------------------------------------------------

pub type BlockCreated {
  BlockCreated(block_id: String, event_id: String)
}

pub type CheckupScheduled {
  CheckupScheduled(checkup_id: String, event_id: String)
}

pub fn add_block(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  kind: String,
  label: String,
  start_at: Option(String),
  end_at: Option(String),
) -> Result(BlockCreated, VcalendarError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let block_kind = string.trim(kind)
  let block_label = string.trim(label)

  case org, actor, block_kind, block_label {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyBlockKind)
    _, _, _, "" -> Error(EmptyLabel)
    _, _, _, _ -> {
      let now = iso_now()
      let block_id = "calendar_block:" <> ulid()
      let event_id = "event:" <> ulid()

      let payload =
        json.to_string(
          json.object([
            #("block_id", json.string(block_id)),
            #("actor_id", json.string(actor)),
            #("kind", json.string(block_kind)),
            #("label", json.string(block_label)),
            #("start_at", optional_string(start_at)),
            #("end_at", optional_string(end_at)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "calendar_block.added",
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
        Ok(_) -> Ok(BlockCreated(block_id: block_id, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

// ---------------------------------------------------------------------------
// vcalendar.block.move
// ---------------------------------------------------------------------------

pub fn move_block(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  block_id: String,
  start_at: String,
  end_at: Option(String),
) -> Result(String, VcalendarError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let block = string.trim(block_id)
  let start = string.trim(start_at)

  case org, actor, block, start {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyBlockId)
    _, _, _, "" -> Error(EmptyStartAt)
    _, _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()

      let payload =
        json.to_string(
          json.object([
            #("block_id", json.string(block)),
            #("actor_id", json.string(actor)),
            #("start_at", json.string(start)),
            #("end_at", optional_string(end_at)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "calendar_block.moved",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      append(bus_subject, envelope, event_id)
    }
  }
}

// ---------------------------------------------------------------------------
// vcalendar.phase.set
// ---------------------------------------------------------------------------

pub fn set_phase(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  label: String,
) -> Result(String, VcalendarError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let phase = string.trim(label)

  case org, actor, phase {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyPhase)
    _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()

      let payload =
        json.to_string(
          json.object([
            #("actor_id", json.string(actor)),
            #("label", json.string(phase)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "vcalendar.phase_set",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      append(bus_subject, envelope, event_id)
    }
  }
}

// ---------------------------------------------------------------------------
// checkup.schedule
// ---------------------------------------------------------------------------

pub type AutoCheckupTick {
  AutoCheckupTick(
    emitted: Int,
    lane_ids: List(String),
    /// Count of due lanes that were skipped because their lane.opened
    /// envelope had an empty `org_id`. This happens for legacy events
    /// written before envelope-scope plumbing landed (M1). Kept on the
    /// return so the IPC handler can surface a real diagnostic instead
    /// of silently emitting zero — see queue_item:01KQE5P02F015GF0KXM6KHZWWR.
    skipped_unscoped: Int,
  )
}

/// Scan all active/claimed lanes across every (org, space, project)
/// the daemon knows about; for each whose cadence threshold has elapsed
/// since the last `checkup.scheduled` event, emit a fresh
/// `checkup.scheduled` via `schedule_checkup`. Idempotent across ticks
/// because the canonical record advances `last_checkup_ts` each emit.
///
/// Each emitted `checkup.scheduled` carries the *lane's own* org_id
/// (captured from the lane.opened envelope by
/// `apply_lane_event_with_scope/2`), not a hard-coded one — so this
/// path correctly serves every org the daemon hosts, not just the
/// Founding-Fathers seed. SpaceId / ProjectId are threaded through to
/// `schedule_checkup_scoped/7`, which forwards them onto the envelope
/// once L1 (campaign:01KQE5GCV300F8V5MM5TFJNJNS, M1) plumbs them
/// through every vcalendar writer; for now `schedule_checkup/5` keeps
/// the legacy contract.
///
/// Defensive: if a lane's envelope `org_id` is empty (legacy event
/// before envelope-scope existed), we skip it rather than fall back to
/// a hard-coded org. The skip is observable via `skipped_unscoped` on
/// the return so the silent-zero case (queue_item:01KQE5P02F015GF0KXM6KHZWWR)
/// has a real diagnostic.
pub fn tick_auto_checkups(bus_subject: Subject(bus.Msg)) -> AutoCheckupTick {
  let due = bus.auto_checkup_due_lanes(bus_subject)
  let actor = "actor:agent:checkup-scheduler"
  let #(emitted_ids, skipped) =
    list.fold(due, #([], 0), fn(acc, row) {
      let #(emitted, skipped_count) = acc
      let #(org_id, _space_id, _project_id, lane_id, cadence) = row
      case org_id {
        "" -> #(emitted, skipped_count + 1)
        _ ->
          case schedule_checkup(bus_subject, org_id, actor, lane_id, cadence) {
            Ok(_) -> #([lane_id, ..emitted], skipped_count)
            Error(_) -> #(emitted, skipped_count)
          }
      }
    })
  AutoCheckupTick(
    emitted: list.length(emitted_ids),
    lane_ids: list.reverse(emitted_ids),
    skipped_unscoped: skipped,
  )
}

pub fn schedule_checkup(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  lane_id: String,
  cadence: String,
) -> Result(CheckupScheduled, VcalendarError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let lane = string.trim(lane_id)
  let cad = string.trim(cadence)

  case org, actor, lane, cad {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyLaneId)
    _, _, _, "" -> Error(EmptyCadence)
    _, _, _, _ -> {
      let now = iso_now()
      let checkup_id = "checkup:" <> ulid()
      let event_id = "event:" <> ulid()

      let payload =
        json.to_string(
          json.object([
            #("checkup_id", json.string(checkup_id)),
            #("lane_id", json.string(lane)),
            #("cadence", json.string(cad)),
            #("scheduled_by", json.string(actor)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "checkup.scheduled",
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
        Ok(_) ->
          Ok(CheckupScheduled(checkup_id: checkup_id, event_id: event_id))
        Error(e) -> Error(AppendFailed(describe_append_error(e)))
      }
    }
  }
}

// ---------------------------------------------------------------------------
// checkup.complete
// ---------------------------------------------------------------------------

pub fn complete_checkup(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  checkup_id: String,
  result: String,
) -> Result(String, VcalendarError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let checkup = string.trim(checkup_id)
  let res = string.trim(result)

  case org, actor, checkup, res {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyCheckupId)
    _, _, _, "" -> Error(EmptyResult)
    _, _, _, _ -> {
      let now = iso_now()
      let event_id = "event:" <> ulid()

      let payload =
        json.to_string(
          json.object([
            #("checkup_id", json.string(checkup)),
            #("completed_by", json.string(actor)),
            #("result", json.string(res)),
          ]),
        )

      let envelope =
        Envelope(
          event_id: event_id,
          kind: "checkup.completed",
          ts: now,
          actor: actor,
          org_id: org,
          space_id: event_envelope.none(),
          project_id: event_envelope.none(),
          dispatch_id: event_envelope.none(),
          execution_id: event_envelope.none(),
          payload_json: payload,
        )

      append(bus_subject, envelope, event_id)
    }
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

fn append(
  bus_subject: Subject(bus.Msg),
  envelope: Envelope,
  event_id: String,
) -> Result(String, VcalendarError) {
  case bus.append(bus_subject, envelope) {
    Ok(_) -> Ok(event_id)
    Error(e) -> Error(AppendFailed(describe_append_error(e)))
  }
}

fn optional_string(value: Option(String)) -> json.Json {
  case value {
    Some(s) -> json.string(string.trim(s))
    None -> json.null()
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
