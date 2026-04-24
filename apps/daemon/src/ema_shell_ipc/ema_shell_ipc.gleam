//// Localhost WebSocket IPC server.
////
//// M1 scope: implements the v0 handshake, ping/pong, a single
//// `debug.ping` command that round-trips through the bus, and the
//// subscribe->event stream. The wire format matches
//// `packages/contracts/ipc/shell-protocol.md`.

import gleam/dynamic/decode
import gleam/erlang/process.{type Subject}
import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import mist.{type Connection, type ResponseData}

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import ema_orgs/ema_orgs

pub const default_port: Int = 49_555

pub fn start(
  bus_subj: Subject(bus.Msg),
  bind: String,
  port: Int,
) -> Result(Nil, String) {
  let handler = fn(req: Request(Connection)) -> Response(ResponseData) {
    route(req, bus_subj)
  }

  case
    mist.new(handler)
    |> mist.bind(bind)
    |> mist.port(port)
    |> mist.start
  {
    Ok(_) -> Ok(Nil)
    Error(_e) ->
      Error("mist failed to bind " <> bind <> ":" <> int.to_string(port))
  }
}

// ---------------------------------------------------------------------------
// HTTP router — we only accept the WS upgrade.
// ---------------------------------------------------------------------------

fn route(
  req: Request(Connection),
  bus_subj: Subject(bus.Msg),
) -> Response(ResponseData) {
  mist.websocket(
    request: req,
    handler: fn(state, msg, conn) { handle_ws(state, msg, conn, bus_subj) },
    on_init: fn(_self) {
      let bus_delivery = process.new_subject()
      let selector =
        process.new_selector()
        |> process.select_map(bus_delivery, BusDelivery)
      #(
        ConnState(
          bus_delivery: bus_delivery,
          bus_subject: bus_subj,
          subscribed: False,
        ),
        Some(selector),
      )
    },
    on_close: fn(state) {
      case state.subscribed {
        True -> {
          process.send(
            bus_subj,
            bus.Unsubscribe(state.bus_delivery, process.new_subject()),
          )
          Nil
        }
        False -> Nil
      }
    },
  )
}

// ---------------------------------------------------------------------------
// Per-connection state
// ---------------------------------------------------------------------------

type ConnState {
  ConnState(
    bus_delivery: Subject(bus.Delivery),
    bus_subject: Subject(bus.Msg),
    subscribed: Bool,
  )
}

type WsCustom {
  BusDelivery(bus.Delivery)
}

fn handle_ws(
  state: ConnState,
  msg: mist.WebsocketMessage(WsCustom),
  conn: mist.WebsocketConnection,
  bus_subj: Subject(bus.Msg),
) -> mist.Next(ConnState, WsCustom) {
  case msg {
    mist.Text(text) -> handle_text(state, text, conn, bus_subj)
    mist.Binary(_) -> mist.continue(state)
    mist.Closed -> mist.stop()
    mist.Shutdown -> mist.stop()
    mist.Custom(BusDelivery(delivery)) ->
      handle_bus_delivery(state, delivery, conn)
  }
}

fn handle_bus_delivery(
  state: ConnState,
  delivery: bus.Delivery,
  conn: mist.WebsocketConnection,
) -> mist.Next(ConnState, WsCustom) {
  case delivery {
    bus.Event(txid, env) -> {
      let payload = event_message(txid, env)
      let _ = mist.send_text_frame(conn, payload)
      let _ =
        send_projection(
          conn,
          "event_trail",
          bus.event_trail_projection_json(state.bus_subject),
        )
      case env.kind {
        "org.created" ->
          send_projection(
            conn,
            "topbar",
            bus.topbar_projection_json(state.bus_subject),
          )
        _ -> Nil
      }
      mist.continue(state)
    }
    bus.SubscriptionDropped(reason) -> {
      let payload =
        json.to_string(
          json.object([
            #("v", json.int(0)),
            #("type", json.string("subscription_dropped")),
            #("channel", json.string("events")),
            #("reason", json.string(reason)),
          ]),
        )
      let _ = mist.send_text_frame(conn, payload)
      mist.continue(ConnState(..state, subscribed: False))
    }
  }
}

// ---------------------------------------------------------------------------
// Incoming message dispatch
// ---------------------------------------------------------------------------

fn handle_text(
  state: ConnState,
  text: String,
  conn: mist.WebsocketConnection,
  bus_subj: Subject(bus.Msg),
) -> mist.Next(ConnState, WsCustom) {
  case decode_envelope(text) {
    Error(_) -> {
      let _ = mist.send_text_frame(conn, err("", "invalid_args", "bad json"))
      mist.continue(state)
    }
    Ok(incoming) ->
      case incoming.kind {
        "hello" -> {
          let _ = mist.send_text_frame(conn, hello_ack())
          mist.continue(state)
        }
        "ping" -> {
          let _ = mist.send_text_frame(conn, pong(incoming.id))
          mist.continue(state)
        }
        "subscribe" -> {
          let _ = send_projection_snapshot(conn, bus_subj, incoming.channel)
          process.send(
            bus_subj,
            bus.Subscribe(state.bus_delivery, None, process.new_subject()),
          )
          mist.continue(ConnState(..state, subscribed: True))
        }
        "unsubscribe" -> {
          process.send(
            bus_subj,
            bus.Unsubscribe(state.bus_delivery, process.new_subject()),
          )
          mist.continue(ConnState(..state, subscribed: False))
        }
        "command" ->
          case incoming.op {
            Some("debug.ping") -> {
              let events = run_debug_ping(bus_subj)
              let _ =
                mist.send_text_frame(conn, command_ok(incoming.id, events))
              mist.continue(state)
            }
            Some("org.create") -> {
              case incoming.name {
                Some(name) ->
                  case ema_orgs.create(bus_subj, name) {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(conn, bus_subj, Some("topbar"))
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(ema_orgs.EmptyName) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          err(
                            incoming.id,
                            "invalid_args",
                            "org name is required",
                          ),
                        )
                      mist.continue(state)
                    }
                    Error(ema_orgs.AppendFailed(reason)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          err(incoming.id, "internal", reason),
                        )
                      mist.continue(state)
                    }
                  }
                None -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(incoming.id, "invalid_args", "missing args.name"),
                    )
                  mist.continue(state)
                }
              }
            }
            Some(op) -> {
              let _ =
                mist.send_text_frame(
                  conn,
                  err(incoming.id, "unknown_op", "no handler for " <> op),
                )
              mist.continue(state)
            }
            None -> {
              let _ =
                mist.send_text_frame(
                  conn,
                  err(incoming.id, "invalid_args", "missing op"),
                )
              mist.continue(state)
            }
          }
        other -> {
          let _ =
            mist.send_text_frame(
              conn,
              err(incoming.id, "unknown_op", "unknown type " <> other),
            )
          mist.continue(state)
        }
      }
  }
}

// ---------------------------------------------------------------------------
// JSON decode for incoming envelope shape we care about
// ---------------------------------------------------------------------------

type Incoming {
  Incoming(
    id: String,
    kind: String,
    op: Option(String),
    channel: Option(String),
    name: Option(String),
  )
}

fn decode_envelope(raw: String) -> Result(Incoming, String) {
  let decoder = {
    use id <- decode.field("id", decode.string)
    use kind <- decode.field("type", decode.string)
    use op <- decode.optional_field("op", None, decode.optional(decode.string))
    use channel <- decode.optional_field(
      "channel",
      None,
      decode.optional(decode.string),
    )
    use name <- decode.optional_field(
      "args",
      None,
      decode.optional(decode.at(["name"], decode.string)),
    )
    decode.success(Incoming(
      id: id,
      kind: kind,
      op: op,
      channel: channel,
      name: name,
    ))
  }
  case json.parse(raw, decoder) {
    Ok(env) -> Ok(env)
    Error(_) -> Error("decode failed")
  }
}

// ---------------------------------------------------------------------------
// Outgoing JSON helpers — respect the field-order lock for command_result.
// gleam_json preserves the insertion order of object entries on render.
// ---------------------------------------------------------------------------

fn hello_ack() -> String {
  json.to_string(
    json.object([
      #("v", json.int(0)),
      #("type", json.string("hello")),
      #("id", json.string("msg-hello-daemon")),
      #("daemon_version", json.string("0.0.5-dev")),
      #("accepted_device_id", json.string("device:dev-local")),
      #("note", json.null()),
    ]),
  )
}

fn pong(in_reply_to: String) -> String {
  json.to_string(
    json.object([
      #("v", json.int(0)),
      #("type", json.string("pong")),
      #("in_reply_to", json.string(in_reply_to)),
    ]),
  )
}

fn command_ok(in_reply_to: String, event_ids: List(String)) -> String {
  json.to_string(
    json.object([
      #("v", json.int(0)),
      #("type", json.string("command_result")),
      #("in_reply_to", json.string(in_reply_to)),
      #("ok", json.bool(True)),
      #("events", json.preprocessed_array(list.map(event_ids, json.string))),
    ]),
  )
}

fn err(in_reply_to: String, class: String, message: String) -> String {
  json.to_string(
    json.object([
      #("v", json.int(0)),
      #("type", json.string("command_result")),
      #("in_reply_to", json.string(in_reply_to)),
      #("ok", json.bool(False)),
      #(
        "error",
        json.object([
          #("class", json.string(class)),
          #("message", json.string(message)),
        ]),
      ),
    ]),
  )
}

fn event_message(_txid: Int, env: Envelope) -> String {
  json.to_string(
    json.object([
      #("v", json.int(0)),
      #("type", json.string("event")),
      #("channel", json.string("events")),
      #(
        "event",
        json.object([
          #("event_id", json.string(env.event_id)),
          #("kind", json.string(env.kind)),
          #("ts", json.string(env.ts)),
          #("actor", json.string(env.actor)),
          #("org_id", json.string(env.org_id)),
          #("payload_json", json.string(env.payload_json)),
        ]),
      ),
    ]),
  )
}

fn projection_message(name: String, data_json: String) -> String {
  "{\"v\":0,\"type\":\"projection\",\"name\":\""
  <> name
  <> "\",\"data\":"
  <> data_json
  <> "}"
}

fn send_projection(
  conn: mist.WebsocketConnection,
  name: String,
  data_json: String,
) -> Nil {
  let _ = mist.send_text_frame(conn, projection_message(name, data_json))
  Nil
}

fn send_projection_snapshot(
  conn: mist.WebsocketConnection,
  bus_subj: Subject(bus.Msg),
  channel: Option(String),
) -> Nil {
  case channel {
    Some("topbar") ->
      send_projection(conn, "topbar", bus.topbar_projection_json(bus_subj))
    Some("event_trail") ->
      send_projection(
        conn,
        "event_trail",
        bus.event_trail_projection_json(bus_subj),
      )
    Some(ch) -> {
      case string.contains(does: ch, contain: ".orgs") {
        True ->
          send_projection(conn, "topbar", bus.topbar_projection_json(bus_subj))
        False -> Nil
      }
    }
    _ -> Nil
  }
}

// ---------------------------------------------------------------------------
// debug.ping handler — emits a dispatch.started + dispatch.ended pair.
// ---------------------------------------------------------------------------

fn run_debug_ping(bus_subj: Subject(bus.Msg)) -> List(String) {
  let now = iso_now()
  let dispatch_id = "dispatch:debug-" <> now
  let started =
    Envelope(
      event_id: "event:" <> now <> "-dbg-start",
      kind: "dispatch.started",
      ts: now,
      actor: "actor:dev-console",
      org_id: "org:dev",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      dispatch_id: event_envelope.some(dispatch_id),
      execution_id: event_envelope.none(),
      payload_json: "{\"source\":\"debug.ping\"}",
    )
  let ended =
    Envelope(
      event_id: "event:" <> now <> "-dbg-end",
      kind: "dispatch.ended",
      ts: now,
      actor: "actor:dev-console",
      org_id: "org:dev",
      space_id: event_envelope.none(),
      project_id: event_envelope.none(),
      dispatch_id: event_envelope.some(dispatch_id),
      execution_id: event_envelope.none(),
      payload_json: "{\"source\":\"debug.ping\"}",
    )

  [started, ended]
  |> list.filter_map(fn(e) {
    case bus.append(bus_subj, e) {
      Ok(_txid) -> Ok(e.event_id)
      Error(_) -> Error(Nil)
    }
  })
}

@external(erlang, "ema_time_ffi", "iso_now")
fn iso_now() -> String
