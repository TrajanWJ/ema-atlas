//// Planner-graph writers for the Blueprint vApp.
////
//// Owns the canonical event families introduced in
//// `docs/architecture/07-blueprint-planner-events.md`:
////   - `blueprint.gac.*`         — Gap / Assumption / Clarification cards
////   - `blueprint.blocker.*`     — blocker cards
////   - `blueprint.aspiration.*`  — captured aspirations
////   - `blueprint.decision.*`    — canon-tier decision log
////
//// Each writer trims and validates inputs, builds an `Envelope`, and
//// appends through the canonical bus. Errors map back through
//// `PlannerError.describe_error`.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/string

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

pub type GacCreated {
  GacCreated(gac_id: String, event_id: String)
}

pub type GacAnswered {
  GacAnswered(gac_id: String, event_id: String)
}

pub type GacDeferred {
  GacDeferred(gac_id: String, event_id: String)
}

pub type GacPromoted {
  GacPromoted(gac_id: String, event_id: String)
}

pub type BlockerOpened {
  BlockerOpened(blocker_id: String, event_id: String)
}

pub type BlockerResolved {
  BlockerResolved(blocker_id: String, event_id: String)
}

pub type BlockerPromoted {
  BlockerPromoted(blocker_id: String, event_id: String)
}

pub type AspirationCaptured {
  AspirationCaptured(aspiration_id: String, event_id: String)
}

pub type AspirationPromoted {
  AspirationPromoted(aspiration_id: String, event_id: String)
}

pub type AspirationArchived {
  AspirationArchived(aspiration_id: String, event_id: String)
}

pub type DecisionLocked {
  DecisionLocked(decision_id: String, event_id: String)
}

pub type DecisionSuperseded {
  DecisionSuperseded(decision_id: String, event_id: String)
}

pub type PlannerError {
  EmptyOrg
  EmptyActor
  EmptyTitle
  EmptyQuestion
  EmptyBody
  EmptyTarget
  EmptyId
  InvalidCategory(value: String)
  InvalidPriority(value: String)
  InvalidResultAction(value: String)
  InvalidTimeframe(value: String)
  AppendFailed(reason: String)
}

// ---------------------------------------------------------------------------
// GAC card writers
// ---------------------------------------------------------------------------

pub fn gac_create(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  document_id: String,
  section_id: Option(String),
  category: String,
  priority: String,
  question: String,
  options_json: Option(String),
) -> Result(GacCreated, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let doc = string.trim(document_id)
  let q = string.trim(question)
  case org, actor, q {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyQuestion)
    _, _, _ ->
      case validate_category(category) {
        Error(e) -> Error(e)
        Ok(_) ->
          case validate_priority(priority) {
            Error(e) -> Error(e)
            Ok(_) -> {
              let gac_id = "blueprint_gac:" <> ulid()
              let event_id = "event:" <> ulid()
              let payload =
                json.to_string(
                  json.object([
                    #("gac_id", json.string(gac_id)),
                    #("document_id", json.string(doc)),
                    #("section_id", optional_string(section_id)),
                    #("category", json.string(category)),
                    #("priority", json.string(priority)),
                    #("question", json.string(q)),
                    #("options", raw_array(options_json)),
                    #("by", json.string(actor)),
                  ]),
                )
              append(
                bus_subject,
                envelope_for(
                  "blueprint.gac.created",
                  event_id,
                  actor,
                  org,
                  payload,
                ),
              )
              |> result.map(fn(_) {
                GacCreated(gac_id: gac_id, event_id: event_id)
              })
            }
          }
      }
  }
}

pub fn gac_answer(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  gac_id: String,
  selected: Option(String),
  freeform: Option(String),
  result_action: String,
  target: Option(String),
) -> Result(GacAnswered, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let gac = string.trim(gac_id)
  case org, actor, gac {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyId)
    _, _, _ ->
      case validate_result_action(result_action) {
        Error(e) -> Error(e)
        Ok(_) -> {
          let event_id = "event:" <> ulid()
          let payload =
            json.to_string(
              json.object([
                #("gac_id", json.string(gac)),
                #("selected", optional_string(selected)),
                #("freeform", optional_string(freeform)),
                #("result_action", json.string(result_action)),
                #("target", optional_string(target)),
                #("by", json.string(actor)),
              ]),
            )
          append(
            bus_subject,
            envelope_for(
              "blueprint.gac.answered",
              event_id,
              actor,
              org,
              payload,
            ),
          )
          |> result.map(fn(_) { GacAnswered(gac_id: gac, event_id: event_id) })
        }
      }
  }
}

pub fn gac_defer(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  gac_id: String,
  defer_to: String,
  reason: Option(String),
) -> Result(GacDeferred, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let gac = string.trim(gac_id)
  let to = string.trim(defer_to)
  case org, actor, gac, to {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyId)
    _, _, _, "" -> Error(EmptyTarget)
    _, _, _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("gac_id", json.string(gac)),
            #("defer_to", json.string(to)),
            #("reason", optional_string(reason)),
            #("by", json.string(actor)),
          ]),
        )
      append(
        bus_subject,
        envelope_for("blueprint.gac.deferred", event_id, actor, org, payload),
      )
      |> result.map(fn(_) { GacDeferred(gac_id: gac, event_id: event_id) })
    }
  }
}

pub fn gac_promote(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  gac_id: String,
  promoted_kind: String,
  target: String,
) -> Result(GacPromoted, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let gac = string.trim(gac_id)
  let tgt = string.trim(target)
  case org, actor, gac, tgt {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyId)
    _, _, _, "" -> Error(EmptyTarget)
    _, _, _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("gac_id", json.string(gac)),
            #("promoted_kind", json.string(promoted_kind)),
            #("target", json.string(tgt)),
            #("by", json.string(actor)),
          ]),
        )
      append(
        bus_subject,
        envelope_for("blueprint.gac.promoted", event_id, actor, org, payload),
      )
      |> result.map(fn(_) { GacPromoted(gac_id: gac, event_id: event_id) })
    }
  }
}

// ---------------------------------------------------------------------------
// Blocker writers
// ---------------------------------------------------------------------------

pub fn blocker_open(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  document_id: Option(String),
  section_id: Option(String),
  category: String,
  priority: String,
  title: String,
  description: Option(String),
  resolve_by: Option(String),
  promoted_from: Option(String),
) -> Result(BlockerOpened, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let blocker_title = string.trim(title)
  case org, actor, blocker_title {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyTitle)
    _, _, _ ->
      case validate_priority(priority) {
        Error(e) -> Error(e)
        Ok(_) -> {
          let blocker_id = "blueprint_blocker:" <> ulid()
          let event_id = "event:" <> ulid()
          let payload =
            json.to_string(
              json.object([
                #("blocker_id", json.string(blocker_id)),
                #("document_id", optional_string(document_id)),
                #("section_id", optional_string(section_id)),
                #("category", json.string(category)),
                #("priority", json.string(priority)),
                #("title", json.string(blocker_title)),
                #("description", optional_string(description)),
                #("resolve_by", optional_string(resolve_by)),
                #("promoted_from", optional_string(promoted_from)),
                #("by", json.string(actor)),
              ]),
            )
          append(
            bus_subject,
            envelope_for(
              "blueprint.blocker.opened",
              event_id,
              actor,
              org,
              payload,
            ),
          )
          |> result.map(fn(_) {
            BlockerOpened(blocker_id: blocker_id, event_id: event_id)
          })
        }
      }
  }
}

pub fn blocker_resolve(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  blocker_id: String,
  resolved_to: Option(String),
  note: Option(String),
) -> Result(BlockerResolved, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let blocker = string.trim(blocker_id)
  case org, actor, blocker {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyId)
    _, _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("blocker_id", json.string(blocker)),
            #("resolved_to", optional_string(resolved_to)),
            #("note", optional_string(note)),
            #("by", json.string(actor)),
          ]),
        )
      append(
        bus_subject,
        envelope_for(
          "blueprint.blocker.resolved",
          event_id,
          actor,
          org,
          payload,
        ),
      )
      |> result.map(fn(_) {
        BlockerResolved(blocker_id: blocker, event_id: event_id)
      })
    }
  }
}

pub fn blocker_promote(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  blocker_id: String,
  target_gac_id: String,
) -> Result(BlockerPromoted, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let blocker = string.trim(blocker_id)
  let tgt = string.trim(target_gac_id)
  case org, actor, blocker, tgt {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyId)
    _, _, _, "" -> Error(EmptyTarget)
    _, _, _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("blocker_id", json.string(blocker)),
            #("promoted_kind", json.string("gac")),
            #("target", json.string(tgt)),
            #("by", json.string(actor)),
          ]),
        )
      append(
        bus_subject,
        envelope_for(
          "blueprint.blocker.promoted",
          event_id,
          actor,
          org,
          payload,
        ),
      )
      |> result.map(fn(_) {
        BlockerPromoted(blocker_id: blocker, event_id: event_id)
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Aspiration writers
// ---------------------------------------------------------------------------

pub fn aspiration_capture(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  title: String,
  description: Option(String),
  timeframe: String,
  source_type: String,
  origin_app: Option(String),
  origin_text: Option(String),
) -> Result(AspirationCaptured, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let asp_title = string.trim(title)
  case org, actor, asp_title {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyTitle)
    _, _, _ ->
      case validate_timeframe(timeframe) {
        Error(e) -> Error(e)
        Ok(_) -> {
          let aspiration_id = "blueprint_aspiration:" <> ulid()
          let event_id = "event:" <> ulid()
          let source =
            json.object([
              #("type", json.string(source_type)),
              #("origin_app", optional_string(origin_app)),
              #("origin_text", optional_string(origin_text)),
            ])
          let payload =
            json.to_string(
              json.object([
                #("aspiration_id", json.string(aspiration_id)),
                #("title", json.string(asp_title)),
                #("description", optional_string(description)),
                #("timeframe", json.string(timeframe)),
                #("source", source),
                #("by", json.string(actor)),
              ]),
            )
          append(
            bus_subject,
            envelope_for(
              "blueprint.aspiration.captured",
              event_id,
              actor,
              org,
              payload,
            ),
          )
          |> result.map(fn(_) {
            AspirationCaptured(aspiration_id: aspiration_id, event_id: event_id)
          })
        }
      }
  }
}

pub fn aspiration_promote(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  aspiration_id: String,
  target_intent_id: String,
) -> Result(AspirationPromoted, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let asp = string.trim(aspiration_id)
  let tgt = string.trim(target_intent_id)
  case org, actor, asp, tgt {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyId)
    _, _, _, "" -> Error(EmptyTarget)
    _, _, _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("aspiration_id", json.string(asp)),
            #("promoted_kind", json.string("intent")),
            #("target", json.string(tgt)),
            #("by", json.string(actor)),
          ]),
        )
      append(
        bus_subject,
        envelope_for(
          "blueprint.aspiration.promoted",
          event_id,
          actor,
          org,
          payload,
        ),
      )
      |> result.map(fn(_) {
        AspirationPromoted(aspiration_id: asp, event_id: event_id)
      })
    }
  }
}

pub fn aspiration_archive(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  aspiration_id: String,
  reason: Option(String),
) -> Result(AspirationArchived, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let asp = string.trim(aspiration_id)
  case org, actor, asp {
    "", _, _ -> Error(EmptyOrg)
    _, "", _ -> Error(EmptyActor)
    _, _, "" -> Error(EmptyId)
    _, _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("aspiration_id", json.string(asp)),
            #("reason", optional_string(reason)),
            #("by", json.string(actor)),
          ]),
        )
      append(
        bus_subject,
        envelope_for(
          "blueprint.aspiration.archived",
          event_id,
          actor,
          org,
          payload,
        ),
      )
      |> result.map(fn(_) {
        AspirationArchived(aspiration_id: asp, event_id: event_id)
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Decision writers
// ---------------------------------------------------------------------------

pub fn decision_lock(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  title: String,
  body: String,
  supersedes: Option(String),
  source_node: Option(String),
) -> Result(DecisionLocked, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let dec_title = string.trim(title)
  let dec_body = string.trim(body)
  case org, actor, dec_title, dec_body {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyTitle)
    _, _, _, "" -> Error(EmptyBody)
    _, _, _, _ -> {
      let decision_id = "blueprint_dec:" <> ulid()
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("decision_id", json.string(decision_id)),
            #("title", json.string(dec_title)),
            #("body", json.string(dec_body)),
            #("supersedes", optional_string(supersedes)),
            #("source_node", optional_string(source_node)),
            #("by", json.string(actor)),
          ]),
        )
      append(
        bus_subject,
        envelope_for("blueprint.decision.locked", event_id, actor, org, payload),
      )
      |> result.map(fn(_) {
        DecisionLocked(decision_id: decision_id, event_id: event_id)
      })
    }
  }
}

pub fn decision_supersede(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  actor_id: String,
  decision_id: String,
  superseded_by: String,
  reason: Option(String),
) -> Result(DecisionSuperseded, PlannerError) {
  let org = string.trim(org_id)
  let actor = string.trim(actor_id)
  let dec = string.trim(decision_id)
  let by_id = string.trim(superseded_by)
  case org, actor, dec, by_id {
    "", _, _, _ -> Error(EmptyOrg)
    _, "", _, _ -> Error(EmptyActor)
    _, _, "", _ -> Error(EmptyId)
    _, _, _, "" -> Error(EmptyTarget)
    _, _, _, _ -> {
      let event_id = "event:" <> ulid()
      let payload =
        json.to_string(
          json.object([
            #("decision_id", json.string(dec)),
            #("superseded_by", json.string(by_id)),
            #("reason", optional_string(reason)),
            #("by", json.string(actor)),
          ]),
        )
      append(
        bus_subject,
        envelope_for(
          "blueprint.decision.superseded",
          event_id,
          actor,
          org,
          payload,
        ),
      )
      |> result.map(fn(_) {
        DecisionSuperseded(decision_id: dec, event_id: event_id)
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn envelope_for(
  kind: String,
  event_id: String,
  actor: String,
  org: String,
  payload: String,
) -> Envelope {
  Envelope(
    event_id: event_id,
    kind: kind,
    ts: iso_now(),
    actor: actor,
    org_id: org,
    space_id: event_envelope.none(),
    project_id: event_envelope.none(),
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: payload,
  )
}

fn append(
  bus_subject: Subject(bus.Msg),
  envelope: Envelope,
) -> Result(Int, PlannerError) {
  case bus.append(bus_subject, envelope) {
    Ok(txid) -> Ok(txid)
    Error(e) -> Error(AppendFailed(describe_append_error(e)))
  }
}

fn validate_category(category: String) -> Result(Nil, PlannerError) {
  case category {
    "gap" | "assumption" | "clarification" -> Ok(Nil)
    "tricky_question" | "deferred_decision" | "blocking_dependency" -> Ok(Nil)
    _ -> Error(InvalidCategory(category))
  }
}

fn validate_priority(priority: String) -> Result(Nil, PlannerError) {
  case priority {
    "critical" | "high" | "medium" | "low" -> Ok(Nil)
    _ -> Error(InvalidPriority(priority))
  }
}

fn validate_result_action(value: String) -> Result(Nil, PlannerError) {
  case value {
    "create_canon" | "create_intent" | "update_node" | "defer_to_blocker" ->
      Ok(Nil)
    _ -> Error(InvalidResultAction(value))
  }
}

fn validate_timeframe(value: String) -> Result(Nil, PlannerError) {
  case value {
    "near_term" | "mid_term" | "long_term" | "aspirational" -> Ok(Nil)
    _ -> Error(InvalidTimeframe(value))
  }
}

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

fn raw_array(value: Option(String)) -> json.Json {
  case value {
    Some(s) ->
      case string.trim(s) {
        "" -> json.preprocessed_array([])
        _ -> json.string(s)
      }
    None -> json.preprocessed_array([])
  }
}

fn describe_append_error(e: bus.AppendError) -> String {
  case e {
    bus.InvalidKind(kind) -> "invalid event kind: " <> kind
    bus.NotInCatalog(kind) -> "event kind not in catalog: " <> kind
    bus.PersistenceFailed(reason) -> "persistence failed: " <> reason
  }
}

pub fn describe_error(e: PlannerError) -> String {
  case e {
    EmptyOrg -> "org_id is required"
    EmptyActor -> "actor_id is required"
    EmptyTitle -> "title is required"
    EmptyQuestion -> "question is required"
    EmptyBody -> "body is required"
    EmptyTarget -> "target is required"
    EmptyId -> "id is required"
    InvalidCategory(v) -> "invalid category: " <> v
    InvalidPriority(v) -> "invalid priority: " <> v
    InvalidResultAction(v) -> "invalid result_action: " <> v
    InvalidTimeframe(v) -> "invalid timeframe: " <> v
    AppendFailed(reason) -> "append failed: " <> reason
  }
}

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String

@external(erlang, "ema_time_ffi", "ulid")
fn ulid() -> String
