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

import ema_access_sessions/ema_access_sessions
import ema_artifact/ema_artifact
import ema_blueprint/ema_blueprint
import ema_blueprint/planner_nodes
import ema_canon/ema_canon
import ema_collab/ema_collab
import ema_companion/ema_companion
import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import ema_dispatch/ema_dispatch
import ema_exec/ema_exec
import ema_identity/ema_device_keys
import ema_identity/ema_identity
import ema_identity/ema_pairing
import ema_invites/ema_invites
import ema_memberships/ema_memberships
import ema_orgs/ema_orgs
import ema_presence/ema_presence
import ema_projects/ema_projects
import ema_replication/ema_collab_sync
import ema_replication/ema_peers
import ema_spaces/ema_spaces
import ema_swarm_coordination/agent_workspace
import ema_vcalendar/ema_vcalendar

pub const default_port: Int = 49_555

pub fn start(
  bus_subj: Subject(bus.Msg),
  collab_subj: Subject(ema_collab.Msg),
  bind: String,
  port: Int,
) -> Result(Nil, String) {
  let handler = fn(req: Request(Connection)) -> Response(ResponseData) {
    route(req, bus_subj, collab_subj)
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
  collab_subj: Subject(ema_collab.Msg),
) -> Response(ResponseData) {
  mist.websocket(
    request: req,
    handler: fn(state, msg, conn) {
      handle_ws(state, msg, conn, bus_subj, collab_subj)
    },
    on_init: fn(_self) {
      let bus_delivery = process.new_subject()
      let collab_delivery = process.new_subject()
      let selector =
        process.new_selector()
        |> process.select_map(bus_delivery, BusDelivery)
        |> process.select_map(collab_delivery, CollabDelivery)
      #(
        ConnState(
          bus_delivery: bus_delivery,
          bus_subject: bus_subj,
          collab_delivery: collab_delivery,
          collab_subject: collab_subj,
          bus_subscribed: False,
          collab_subscribed: False,
          subscribed_scope: None,
        ),
        Some(selector),
      )
    },
    on_close: fn(state) {
      case state.bus_subscribed {
        True -> bus.unsubscribe(bus_subj, state.bus_delivery)
        False -> Nil
      }
      case state.collab_subscribed {
        True -> ema_collab.unsubscribe(collab_subj, state.collab_delivery)
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
    collab_delivery: Subject(ema_collab.Delivery),
    collab_subject: Subject(ema_collab.Msg),
    bus_subscribed: Bool,
    collab_subscribed: Bool,
    subscribed_scope: Option(String),
  )
}

type WsCustom {
  BusDelivery(bus.Delivery)
  CollabDelivery(ema_collab.Delivery)
}

fn handle_ws(
  state: ConnState,
  msg: mist.WebsocketMessage(WsCustom),
  conn: mist.WebsocketConnection,
  bus_subj: Subject(bus.Msg),
  collab_subj: Subject(ema_collab.Msg),
) -> mist.Next(ConnState, WsCustom) {
  case msg {
    mist.Text(text) -> handle_text(state, text, conn, bus_subj, collab_subj)
    mist.Binary(_) -> mist.continue(state)
    mist.Closed -> mist.stop()
    mist.Shutdown -> mist.stop()
    mist.Custom(BusDelivery(delivery)) ->
      handle_bus_delivery(state, delivery, conn)
    mist.Custom(CollabDelivery(delivery)) ->
      handle_collab_delivery(state, delivery, conn)
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
      let _ =
        send_projection(
          conn,
          "chronicle.activity",
          bus.chronicle_activity_projection_json(state.bus_subject),
        )
      case env.kind {
        "org.created" ->
          send_projection(
            conn,
            "topbar",
            bus.topbar_projection_json(state.bus_subject),
          )
        "space.created" ->
          send_projection(
            conn,
            "topbar",
            bus.topbar_projection_json(state.bus_subject),
          )
        "project.created" ->
          send_projection(
            conn,
            "topbar",
            bus.topbar_projection_json(state.bus_subject),
          )
        "project.materialized" ->
          send_projection(
            conn,
            "project.filesystem_status",
            bus.project_filesystem_projection_json(state.bus_subject),
          )
        "project.materialization_failed" ->
          send_projection(
            conn,
            "project.filesystem_status",
            bus.project_filesystem_projection_json(state.bus_subject),
          )
        "membership.role_granted" ->
          send_projection(
            conn,
            "topbar",
            bus.topbar_projection_json(state.bus_subject),
          )
        "membership.role_revoked" ->
          send_projection(
            conn,
            "topbar",
            bus.topbar_projection_json(state.bus_subject),
          )
        "membership.removed" ->
          send_projection(
            conn,
            "topbar",
            bus.topbar_projection_json(state.bus_subject),
          )
        "access_session.challenge_created" ->
          send_projection(
            conn,
            "access_session.current",
            bus.access_session_projection_json(state.bus_subject),
          )
        "access_session.approved" ->
          send_projection(
            conn,
            "access_session.current",
            bus.access_session_projection_json(state.bus_subject),
          )
        "access_session.revoked" ->
          send_projection(
            conn,
            "access_session.current",
            bus.access_session_projection_json(state.bus_subject),
          )
        "access_session.expired" ->
          send_projection(
            conn,
            "access_session.current",
            bus.access_session_projection_json(state.bus_subject),
          )
        "device.registered" ->
          send_projection(
            conn,
            "device.registry",
            bus.device_projection_json(state.bus_subject),
          )
        "device.renamed" ->
          send_projection(
            conn,
            "device.registry",
            bus.device_projection_json(state.bus_subject),
          )
        "device.revoked" ->
          send_projection(
            conn,
            "device.registry",
            bus.device_projection_json(state.bus_subject),
          )
        "device.key_rotated" ->
          send_projection(
            conn,
            "device.registry",
            bus.device_projection_json(state.bus_subject),
          )
        "peer.trust_established" ->
          send_projection(
            conn,
            "peer.trust",
            bus.peer_trust_projection_json(state.bus_subject),
          )
        "peer.trust_revoked" ->
          send_projection(
            conn,
            "peer.trust",
            bus.peer_trust_projection_json(state.bus_subject),
          )
        "lane.opened" -> {
          send_projection(
            conn,
            "lane.registry",
            scoped_lane_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "lane.claimed" -> {
          send_projection(
            conn,
            "lane.registry",
            scoped_lane_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "lane.moved" -> {
          send_projection(
            conn,
            "lane.registry",
            scoped_lane_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "lane.released" -> {
          send_projection(
            conn,
            "lane.registry",
            scoped_lane_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "lane.blocked" -> {
          send_projection(
            conn,
            "lane.registry",
            scoped_lane_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "lane.closed" -> {
          send_projection(
            conn,
            "lane.registry",
            scoped_lane_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "queue_item.added" -> {
          send_projection(
            conn,
            "queue.registry",
            scoped_queue_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "queue_item.ready" -> {
          send_projection(
            conn,
            "queue.registry",
            scoped_queue_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "queue_item.blocked" -> {
          send_projection(
            conn,
            "queue.registry",
            scoped_queue_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "queue_item.closed" -> {
          send_projection(
            conn,
            "queue.registry",
            scoped_queue_registry(state.subscribed_scope, state.bus_subject),
          )
        }
        "campaign.created" ->
          send_projection(
            conn,
            "campaign.registry",
            bus.campaign_registry_projection_json(state.bus_subject),
          )
        "campaign.archived" ->
          send_projection(
            conn,
            "campaign.registry",
            bus.campaign_registry_projection_json(state.bus_subject),
          )
        "mission.created" ->
          send_projection(
            conn,
            "mission.registry",
            bus.mission_registry_projection_json(state.bus_subject),
          )
        "mission.started" ->
          send_projection(
            conn,
            "mission.registry",
            bus.mission_registry_projection_json(state.bus_subject),
          )
        "mission.paused" ->
          send_projection(
            conn,
            "mission.registry",
            bus.mission_registry_projection_json(state.bus_subject),
          )
        "mission.completed" ->
          send_projection(
            conn,
            "mission.registry",
            bus.mission_registry_projection_json(state.bus_subject),
          )
        "handoff.requested" ->
          send_projection(
            conn,
            "handoff.registry",
            bus.handoff_registry_projection_json(state.bus_subject),
          )
        "handoff.accepted" ->
          send_projection(
            conn,
            "handoff.registry",
            bus.handoff_registry_projection_json(state.bus_subject),
          )
        "handoff.rejected" ->
          send_projection(
            conn,
            "handoff.registry",
            bus.handoff_registry_projection_json(state.bus_subject),
          )
        "handoff.completed" ->
          send_projection(
            conn,
            "handoff.registry",
            bus.handoff_registry_projection_json(state.bus_subject),
          )
        "problem.logged" ->
          send_projection(
            conn,
            "problem.graph",
            bus.problem_graph_projection_json(state.bus_subject),
          )
        "problem.solution_added" ->
          send_projection(
            conn,
            "problem.graph",
            bus.problem_graph_projection_json(state.bus_subject),
          )
        "problem.linked" ->
          send_projection(
            conn,
            "problem.graph",
            bus.problem_graph_projection_json(state.bus_subject),
          )
        "agent.reported" ->
          send_projection(
            conn,
            "agent.reports",
            bus.agent_reports_projection_json(state.bus_subject),
          )
        "swarm.created" ->
          send_projection(
            conn,
            "swarm.registry",
            bus.swarm_registry_projection_json(state.bus_subject),
          )
        "swarm.started" ->
          send_projection(
            conn,
            "swarm.registry",
            bus.swarm_registry_projection_json(state.bus_subject),
          )
        "swarm.paused" ->
          send_projection(
            conn,
            "swarm.registry",
            bus.swarm_registry_projection_json(state.bus_subject),
          )
        "swarm.stopped" ->
          send_projection(
            conn,
            "swarm.registry",
            bus.swarm_registry_projection_json(state.bus_subject),
          )
        "swarm.report_generated" ->
          send_projection(
            conn,
            "swarm.registry",
            bus.swarm_registry_projection_json(state.bus_subject),
          )
        "blueprint.document.created" -> {
          send_projection(
            conn,
            "blueprint.sections",
            bus.blueprint_projection_json(state.bus_subject),
          )
        }
        "blueprint.document.renamed" -> {
          send_projection(
            conn,
            "blueprint.sections",
            bus.blueprint_projection_json(state.bus_subject),
          )
        }
        "blueprint.document.archived" -> {
          send_projection(
            conn,
            "blueprint.sections",
            bus.blueprint_projection_json(state.bus_subject),
          )
        }
        "blueprint.section.added" -> {
          send_projection(
            conn,
            "blueprint.sections",
            bus.blueprint_projection_json(state.bus_subject),
          )
        }
        "blueprint.section.renamed" -> {
          send_projection(
            conn,
            "blueprint.sections",
            bus.blueprint_projection_json(state.bus_subject),
          )
        }
        "blueprint.section.moved" -> {
          send_projection(
            conn,
            "blueprint.sections",
            bus.blueprint_projection_json(state.bus_subject),
          )
        }
        "blueprint.section.removed" -> {
          send_projection(
            conn,
            "blueprint.sections",
            bus.blueprint_projection_json(state.bus_subject),
          )
        }
        "blueprint.gac.created"
        | "blueprint.gac.answered"
        | "blueprint.gac.deferred"
        | "blueprint.gac.promoted"
        | "blueprint.blocker.opened"
        | "blueprint.blocker.resolved"
        | "blueprint.blocker.promoted"
        | "blueprint.aspiration.captured"
        | "blueprint.aspiration.promoted"
        | "blueprint.aspiration.archived"
        | "blueprint.decision.locked"
        | "blueprint.decision.superseded" -> {
          send_projection(
            conn,
            "blueprint.planner",
            bus.blueprint_planner_projection_json(state.bus_subject),
          )
        }
        "dispatch.started"
        | "dispatch.scope_granted"
        | "dispatch.ended" -> {
          send_projection(
            conn,
            "dispatch.registry",
            bus.dispatch_registry_projection_json(state.bus_subject),
          )
        }
        "execution.started"
        | "execution.completed"
        | "execution.ended"
        | "execution.failed"
        | "execution.timeout"
        | "execution.interrupted_by_restart" -> {
          send_projection(
            conn,
            "execution.registry",
            bus.execution_registry_projection_json(state.bus_subject),
          )
        }
        "tool.invoked"
        | "tool.returned"
        | "tool.errored" -> {
          send_projection(
            conn,
            "tool.timeline",
            bus.tool_timeline_projection_json(state.bus_subject, 200),
          )
        }
        _ -> Nil
      }
      mist.continue(state)
    }
    bus.Projection(name, data_json) -> {
      send_projection(conn, name, data_json)
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
      mist.continue(ConnState(..state, bus_subscribed: False))
    }
  }
}

fn handle_collab_delivery(
  state: ConnState,
  delivery: ema_collab.Delivery,
  conn: mist.WebsocketConnection,
) -> mist.Next(ConnState, WsCustom) {
  case delivery {
    ema_collab.DocumentChanged(snapshot) -> {
      send_projection(conn, "collab.document", snapshot.data_json)
      mist.continue(state)
    }
    ema_collab.SubscriptionDropped(reason) -> {
      let payload =
        json.to_string(
          json.object([
            #("v", json.int(0)),
            #("type", json.string("subscription_dropped")),
            #("channel", json.string("collab.document")),
            #("reason", json.string(reason)),
          ]),
        )
      let _ = mist.send_text_frame(conn, payload)
      mist.continue(ConnState(..state, collab_subscribed: False))
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
  collab_subj: Subject(ema_collab.Msg),
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
          case incoming.channel {
            Some("collab.document") -> {
              let _ =
                send_projection_snapshot(
                  conn,
                  bus_subj,
                  collab_subj,
                  incoming.channel,
                )
              ema_collab.subscribe(collab_subj, state.collab_delivery)
              mist.continue(ConnState(..state, collab_subscribed: True))
            }
            _ -> {
              let scope = case incoming.channel {
                Some("lane.registry") -> incoming.project_id
                Some("queue.registry") -> incoming.project_id
                _ -> None
              }
              let _ =
                send_projection_snapshot_scoped(
                  conn,
                  bus_subj,
                  collab_subj,
                  incoming.channel,
                  scope,
                )
              bus.subscribe(bus_subj, state.bus_delivery, None)
              mist.continue(
                ConnState(
                  ..state,
                  bus_subscribed: True,
                  subscribed_scope: case scope {
                    Some(_) -> scope
                    None -> state.subscribed_scope
                  },
                ),
              )
            }
          }
        }
        "unsubscribe" -> {
          bus.unsubscribe(bus_subj, state.bus_delivery)
          ema_collab.unsubscribe(collab_subj, state.collab_delivery)
          mist.continue(
            ConnState(..state, bus_subscribed: False, collab_subscribed: False),
          )
        }
        "command" ->
          case incoming.op {
            Some("debug.ping") -> {
              let events = run_debug_ping(bus_subj)
              let _ =
                mist.send_text_frame(conn, command_ok(incoming.id, events))
              mist.continue(state)
            }
            Some("companion.discover") -> {
              let status = bus.companion_status_projection_json(bus_subj)
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "companion.status", status),
                )
              send_projection(conn, "companion.status", status)
              mist.continue(state)
            }
            Some("companion.window.open") -> {
              let windows =
                bus.companion_open_window(
                  bus_subj,
                  companion_window_request(incoming),
                )
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "companion.windows", windows),
                )
              send_projection(
                conn,
                "companion.status",
                bus.companion_status_projection_json(bus_subj),
              )
              send_projection(conn, "companion.windows", windows)
              mist.continue(state)
            }
            Some("companion.window.close") -> {
              let windows =
                bus.companion_close_window(
                  bus_subj,
                  companion_window_id_from(incoming),
                )
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "companion.windows", windows),
                )
              send_projection(
                conn,
                "companion.status",
                bus.companion_status_projection_json(bus_subj),
              )
              send_projection(conn, "companion.windows", windows)
              mist.continue(state)
            }
            Some("companion.window.focus") -> {
              let windows =
                bus.companion_focus_window(
                  bus_subj,
                  companion_window_id_from(incoming),
                )
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "companion.windows", windows),
                )
              send_projection(conn, "companion.windows", windows)
              mist.continue(state)
            }
            Some("companion.window.reattach_ack") -> {
              let windows =
                bus.companion_reattach_ack(
                  bus_subj,
                  companion_window_id_from(incoming),
                )
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "companion.windows", windows),
                )
              send_projection(conn, "companion.windows", windows)
              mist.continue(state)
            }
            Some("desktop.presence.join") -> {
              let presence =
                bus.desktop_presence_join(
                  bus_subj,
                  presence_join_request(incoming),
                )
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "desktop.presence", presence),
                )
              send_projection(conn, "desktop.presence", presence)
              mist.continue(state)
            }
            Some("desktop.presence.leave") -> {
              let presence =
                bus.desktop_presence_leave(
                  bus_subj,
                  presence_session_id_from(incoming),
                )
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "desktop.presence", presence),
                )
              send_projection(conn, "desktop.presence", presence)
              mist.continue(state)
            }
            Some("desktop.presence.cursor") -> {
              let presence =
                bus.desktop_presence_cursor(
                  bus_subj,
                  presence_cursor_request(incoming),
                )
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "desktop.presence", presence),
                )
              send_projection(conn, "desktop.presence", presence)
              mist.continue(state)
            }
            Some("desktop.presence.location") -> {
              let presence =
                bus.desktop_presence_location(
                  bus_subj,
                  presence_location_request(incoming),
                )
              let _ =
                mist.send_text_frame(
                  conn,
                  command_data(incoming.id, "desktop.presence", presence),
                )
              send_projection(conn, "desktop.presence", presence)
              mist.continue(state)
            }
            Some("collab.document.open") -> {
              case
                ema_collab.open(
                  collab_subj,
                  document_id_from(incoming),
                  actor_id_from(incoming),
                )
              {
                Ok(snapshot) -> {
                  let _ =
                    mist.send_text_frame(conn, command_ok(incoming.id, []))
                  send_projection(conn, "collab.document", snapshot.data_json)
                  mist.continue(state)
                }
                Error(e) -> {
                  let _ =
                    mist.send_text_frame(conn, collab_error(incoming.id, e))
                  mist.continue(state)
                }
              }
            }
            Some("collab.document.replace") -> {
              case incoming.body {
                Some(body) ->
                  case
                    ema_collab.replace_body(
                      collab_subj,
                      document_id_from(incoming),
                      body,
                      actor_id_from(incoming),
                    )
                  {
                    Ok(snapshot) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [snapshot.update_id]),
                        )
                      send_projection(
                        conn,
                        "collab.document",
                        snapshot.data_json,
                      )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, collab_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                None -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(incoming.id, "invalid_args", "missing args.text"),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("org.create") -> {
              case incoming.name {
                Some(name) ->
                  case ema_orgs.create(bus_subj, name) {
                    Ok(event_ids) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, event_ids),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("topbar"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("project.filesystem_status"),
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
            Some("space.create") -> {
              case incoming.org_id {
                Some(org_id) ->
                  case incoming.name {
                    Some(name) ->
                      case ema_spaces.create(bus_subj, org_id, name) {
                        Ok(event_id) -> {
                          let _ =
                            mist.send_text_frame(
                              conn,
                              command_ok(incoming.id, [event_id]),
                            )
                          let _ =
                            send_projection_snapshot(
                              conn,
                              bus_subj,
                              collab_subj,
                              Some("topbar"),
                            )
                          let _ =
                            send_projection_snapshot(
                              conn,
                              bus_subj,
                              collab_subj,
                              Some("event_trail"),
                            )
                          mist.continue(state)
                        }
                        Error(ema_spaces.EmptyOrg) -> {
                          let _ =
                            mist.send_text_frame(
                              conn,
                              err(
                                incoming.id,
                                "invalid_args",
                                "space org_id is required",
                              ),
                            )
                          mist.continue(state)
                        }
                        Error(ema_spaces.EmptyName) -> {
                          let _ =
                            mist.send_text_frame(
                              conn,
                              err(
                                incoming.id,
                                "invalid_args",
                                "space name is required",
                              ),
                            )
                          mist.continue(state)
                        }
                        Error(ema_spaces.AppendFailed(reason)) -> {
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
                None -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(incoming.id, "invalid_args", "missing args.org_id"),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("project.create") -> {
              case incoming.org_id, incoming.space_id, incoming.name {
                Some(org_id), Some(space_id), Some(name) ->
                  case ema_projects.create(bus_subj, org_id, space_id, name) {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("topbar"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("project.filesystem_status"),
                        )
                      mist.continue(state)
                    }
                    Error(ema_projects.EmptyOrg) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          err(
                            incoming.id,
                            "invalid_args",
                            "missing args.org_id",
                          ),
                        )
                      mist.continue(state)
                    }
                    Error(ema_projects.EmptySpace) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          err(
                            incoming.id,
                            "invalid_args",
                            "missing args.space_id",
                          ),
                        )
                      mist.continue(state)
                    }
                    Error(ema_projects.EmptyName) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          err(
                            incoming.id,
                            "invalid_args",
                            "project name is required",
                          ),
                        )
                      mist.continue(state)
                    }
                    Error(ema_projects.AppendFailed(reason)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          err(incoming.id, "internal", reason),
                        )
                      mist.continue(state)
                    }
                    Error(ema_projects.MaterializationFailed(reason)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          err(incoming.id, "internal", reason),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.space_id, or args.name",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("actor.register") ->
              handle_pipeline_event(
                conn,
                state,
                incoming,
                "actor.created",
                incoming.actor_id,
                [
                  #("actor_id", required_json(incoming.actor_id)),
                  #("id", required_json(incoming.actor_id)),
                  #("kind", agent_workspace.opt(incoming.target_kind)),
                  #("display_name", agent_workspace.opt(incoming.display_name)),
                  #("role", agent_workspace.opt(incoming.role)),
                  #("dispatch", agent_workspace.opt(incoming.provider)),
                  #("perspective", agent_workspace.opt(incoming.relation)),
                ],
              )
            Some("intent.create") -> {
              let now = iso_now()
              handle_pipeline_event(
                conn,
                state,
                incoming,
                "intent.created",
                incoming.intent,
                [
                  #("intent_id", required_json(incoming.intent)),
                  #("slug", agent_workspace.opt(incoming.label)),
                  #("title", title_json(incoming)),
                  #("body", agent_workspace.opt(incoming.body)),
                  #("kind", agent_workspace.opt(incoming.target_kind)),
                  #("status", agent_workspace.opt(incoming.status)),
                  #("project_id", agent_workspace.opt(incoming.project_id)),
                  #("space_id", agent_workspace.opt(incoming.space_id)),
                  #("actor_id", json.string(actor_or_default(incoming))),
                  #("exit_condition", agent_workspace.opt(incoming.done_when)),
                  #("created_at", json.string(now)),
                ],
              )
            }
            Some("intent.update") -> {
              let now = iso_now()
              handle_pipeline_event(
                conn,
                state,
                incoming,
                "intent.updated",
                incoming.intent,
                [
                  #("intent_id", required_json(incoming.intent)),
                  #("changed_fields", csv_json_array(incoming.changed)),
                  #("actor_id", json.string(actor_or_default(incoming))),
                  #("updated_at", json.string(now)),
                  #("reason", agent_workspace.opt(incoming.reason)),
                  #("title", agent_workspace.opt(incoming.title)),
                  #("body", agent_workspace.opt(incoming.body)),
                  #("status", agent_workspace.opt(incoming.status)),
                  #("exit_condition", agent_workspace.opt(incoming.done_when)),
                ],
              )
            }
            Some("proposal.create") -> {
              let now = iso_now()
              let requires_approval = bool_from_option(incoming.verified, True)
              handle_pipeline_event(
                conn,
                state,
                incoming,
                "proposal.created",
                incoming.target,
                [
                  #("proposal_id", required_json(incoming.target)),
                  #("intent_id", required_json(incoming.intent)),
                  #("title", title_json(incoming)),
                  #("body", agent_workspace.opt(incoming.body)),
                  #("plan", agent_workspace.opt(incoming.context)),
                  #("approver_required", json.bool(requires_approval)),
                  #("proposed_by_actor_id", json.string(actor_or_default(incoming))),
                  #("status", json.string(case requires_approval {
                    True -> "created"
                    False -> "approved"
                  })),
                  #("created_at", json.string(now)),
                ],
              )
            }
            Some("proposal.approve") ->
              handle_proposal_decision(
                conn,
                state,
                incoming,
                "proposal.approved",
                "approved_by_actor_id",
                "approved_at",
                True,
              )
            Some("proposal.reject") ->
              handle_proposal_decision(
                conn,
                state,
                incoming,
                "proposal.rejected",
                "rejected_by_actor_id",
                "rejected_at",
                False,
              )
            Some("membership.role_grant") -> {
              case incoming.org_id, incoming.user_id, incoming.role {
                Some(org_id), Some(user_id), Some(role) ->
                  case
                    ema_memberships.grant_role(bus_subj, org_id, user_id, role)
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("topbar"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          membership_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.user_id, or args.role",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("identity.google_upsert") -> {
              case
                incoming.user_id,
                incoming.google_sub,
                incoming.email,
                incoming.display_name
              {
                Some(user_id), Some(google_sub), Some(email), Some(display_name)
                ->
                  case
                    ema_identity.upsert_google_user(
                      bus_subj,
                      user_id,
                      google_sub,
                      email,
                      display_name,
                      incoming.email_verified,
                    )
                  {
                    Ok(result) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, result.event_ids),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          identity_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing identity google args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("identity.authenticator_enable") -> {
              case incoming.user_id, incoming.secret_ref {
                Some(user_id), Some(secret_ref) ->
                  case
                    ema_identity.enable_authenticator(
                      bus_subj,
                      user_id,
                      secret_ref,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          identity_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing identity authenticator args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("device.register") -> {
              case
                incoming.org_id,
                incoming.device_id,
                incoming.user_id,
                incoming.name,
                incoming.pubkey,
                incoming.bootstrap
              {
                Some(org_id),
                  Some(device_id),
                  Some(user_id),
                  Some(name),
                  Some(pubkey),
                  Some(bootstrap)
                ->
                  case
                    ema_identity.register_device_with_attestation(
                      bus_subj,
                      org_id,
                      device_id,
                      user_id,
                      name,
                      pubkey,
                      bootstrap,
                      incoming.attested_by,
                      incoming.capabilities,
                    )
                  {
                    Ok(result) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [result.event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("device.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          identity_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing device registration args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("device.pairing_offer.create") -> {
              case
                incoming.org_id,
                incoming.user_id,
                incoming.name,
                incoming.pubkey
              {
                Some(org_id), Some(user_id), Some(name), Some(pubkey) ->
                  case
                    ema_pairing.create_offer(
                      org_id,
                      user_id,
                      name,
                      pubkey,
                      incoming.capabilities,
                    )
                  {
                    Ok(offer) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_data(
                            incoming.id,
                            "device.pairing_offer",
                            ema_pairing.offer_json(offer),
                          ),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          pairing_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing pairing offer args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("device.pairing_offer.approve") -> {
              case
                incoming.offer_id,
                incoming.org_id,
                incoming.user_id,
                incoming.device_id,
                incoming.name,
                incoming.pubkey,
                incoming.short_code,
                incoming.confirmed_short_code,
                incoming.attested_by
              {
                Some(offer_id),
                  Some(org_id),
                  Some(user_id),
                  Some(device_id),
                  Some(name),
                  Some(pubkey),
                  Some(short_code),
                  Some(confirmed_short_code),
                  Some(attested_by)
                ->
                  case
                    ema_pairing.approve_offer(
                      bus_subj,
                      offer_id,
                      org_id,
                      user_id,
                      device_id,
                      name,
                      pubkey,
                      incoming.capabilities,
                      short_code,
                      confirmed_short_code,
                      attested_by,
                    )
                  {
                    Ok(approval) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [approval.event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("device.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          pairing_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing pairing approval args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("device.local_register") -> {
              case incoming.org_id, incoming.user_id, incoming.name {
                Some(org_id), Some(user_id), Some(name) ->
                  case
                    ema_device_keys.register_local_macos_device(
                      bus_subj,
                      org_id,
                      user_id,
                      name,
                      case incoming.bootstrap {
                        Some(bootstrap) -> bootstrap
                        None -> "paired"
                      },
                    )
                  {
                    Ok(result) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [result.event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("device.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          device_key_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing local device registration args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("peer.trust_establish") -> {
              case
                incoming.org_id,
                incoming.peer_device,
                incoming.peer_pubkey,
                incoming.local_pubkey,
                incoming.ceremony_kind,
                incoming.ceremony_id
              {
                Some(org_id),
                  Some(peer_device),
                  Some(peer_pubkey),
                  Some(local_pubkey),
                  Some(ceremony_kind),
                  Some(ceremony_id)
                ->
                  case
                    lineage_proof_from(
                      incoming,
                      peer_pubkey,
                      local_pubkey,
                      org_id,
                      ceremony_id,
                    )
                  {
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          device_key_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                    Ok(lineage_proof) ->
                      case
                        ema_peers.establish_trust(
                          bus_subj,
                          org_id,
                          peer_device,
                          peer_pubkey,
                          local_pubkey,
                          ceremony_kind,
                          ceremony_id,
                          lineage_proof,
                        )
                      {
                        Ok(result) -> {
                          let _ =
                            mist.send_text_frame(
                              conn,
                              command_ok(incoming.id, [result.event_id]),
                            )
                          let _ =
                            send_projection_snapshot(
                              conn,
                              bus_subj,
                              collab_subj,
                              Some("peer.trust"),
                            )
                          mist.continue(state)
                        }
                        Error(e) -> {
                          let _ =
                            mist.send_text_frame(
                              conn,
                              peer_error(incoming.id, e),
                            )
                          mist.continue(state)
                        }
                      }
                  }
                _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing peer trust args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("replication.collab.frames_since") -> {
              case incoming.org_id, incoming.peer_device {
                Some(org_id), Some(peer_device) ->
                  case
                    ema_collab_sync.frames_since_for_peer(
                      bus_subj,
                      collab_subj,
                      org_id,
                      peer_device,
                      document_id_from(incoming),
                      int_or(incoming.after_revision, 0),
                    )
                  {
                    Ok(backlog) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_data(
                            incoming.id,
                            "collab.frame_backlog",
                            backlog.data_json,
                          ),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          collab_sync_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing replication collab frame args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("replication.collab.apply_frame") -> {
              case
                incoming.org_id,
                incoming.peer_device,
                incoming.frame_id,
                incoming.revision,
                incoming.body,
                incoming.created_at
              {
                Some(org_id),
                  Some(peer_device),
                  Some(frame_id),
                  Some(revision),
                  Some(body),
                  Some(created_at)
                ->
                  case
                    ema_collab_sync.apply_frame_from_peer(
                      bus_subj,
                      collab_subj,
                      org_id,
                      peer_device,
                      document_id_from(incoming),
                      frame_id,
                      revision,
                      body,
                      created_at,
                    )
                  {
                    Ok(snapshot) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_data(
                            incoming.id,
                            "collab.document",
                            snapshot.data_json,
                          ),
                        )
                      send_projection(
                        conn,
                        "collab.document",
                        snapshot.data_json,
                      )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          collab_sync_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing replication collab apply args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("invite.create") -> {
              case
                incoming.org_id,
                incoming.target_kind,
                incoming.target_value,
                incoming.role,
                incoming.expires_at
              {
                Some(org_id),
                  Some(target_kind),
                  Some(target_value),
                  Some(role),
                  Some(expires_at)
                ->
                  case
                    ema_invites.create(
                      bus_subj,
                      org_id,
                      target_kind,
                      target_value,
                      role,
                      expires_at,
                    )
                  {
                    Ok(ema_invites.InviteCreated(_, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("invite.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, invite_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(incoming.id, "invalid_args", "missing invite args"),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("invite.accept") -> {
              case
                incoming.org_id,
                incoming.invite_id,
                incoming.accepted_by,
                incoming.accepted_device,
                incoming.role
              {
                Some(org_id),
                  Some(invite_id),
                  Some(accepted_by),
                  Some(accepted_device),
                  Some(role)
                ->
                  case
                    ema_invites.accept(
                      bus_subj,
                      org_id,
                      invite_id,
                      accepted_by,
                      accepted_device,
                      role,
                    )
                  {
                    Ok(event_ids) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, event_ids),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("topbar"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("invite.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, invite_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing invite accept args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("invite.revoke") -> {
              case incoming.org_id, incoming.invite_id {
                Some(org_id), Some(invite_id) ->
                  case
                    ema_invites.revoke(
                      bus_subj,
                      org_id,
                      invite_id,
                      case incoming.reason {
                        Some(reason) -> reason
                        None -> "user_requested"
                      },
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("invite.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, invite_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing invite revoke args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("invite.expire") -> {
              case incoming.org_id, incoming.invite_id {
                Some(org_id), Some(invite_id) ->
                  case ema_invites.expire(bus_subj, org_id, invite_id) {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("invite.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, invite_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing invite expire args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("access_session.challenge") -> {
              case incoming.org_id, incoming.access_point, incoming.expires_at {
                Some(org_id), Some(access_point), Some(expires_at) ->
                  case
                    ema_access_sessions.create_challenge(
                      bus_subj,
                      org_id,
                      access_point,
                      incoming.scopes,
                      expires_at,
                    )
                  {
                    Ok(ema_access_sessions.Challenge(_, _, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("access_session.current"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          access_session_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing access session challenge args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("access_session.approve") -> {
              case
                incoming.org_id,
                incoming.challenge_id,
                incoming.user_id,
                incoming.approved_by_device,
                incoming.expires_at
              {
                Some(org_id),
                  Some(challenge_id),
                  Some(user_id),
                  Some(device),
                  Some(expires_at)
                ->
                  case
                    ema_access_sessions.approve(
                      bus_subj,
                      org_id,
                      challenge_id,
                      user_id,
                      device,
                      incoming.scopes,
                      expires_at,
                    )
                  {
                    Ok(ema_access_sessions.Approval(_, _, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("access_session.current"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          access_session_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing access session approve args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("access_session.revoke") -> {
              case incoming.org_id, incoming.session_id {
                Some(org_id), Some(session_id) ->
                  case
                    ema_access_sessions.revoke(
                      bus_subj,
                      org_id,
                      session_id,
                      case incoming.reason {
                        Some(reason) -> reason
                        None -> "user_requested"
                      },
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          access_session_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing access session revoke args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("access_session.expire") -> {
              case incoming.org_id, incoming.session_id {
                Some(org_id), Some(session_id) ->
                  case
                    ema_access_sessions.expire(bus_subj, org_id, session_id)
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          access_session_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing access session expire args",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("lane.open") -> {
              case incoming.org_id, incoming.actor_id, incoming.name {
                Some(org_id), Some(actor_id), Some(title) ->
                  case
                    agent_workspace.open_lane_linked(
                      bus_subj,
                      org_id,
                      actor_id,
                      title,
                      incoming.project_id,
                      incoming.mission_id,
                      incoming.scope,
                      incoming.done_when,
                      incoming.depends_on,
                      incoming.section_id,
                      incoming.gac_id,
                      incoming.decision_id,
                      incoming.cadence,
                    )
                  {
                    Ok(agent_workspace.LaneOpened(lane_id, event_id)) -> {
                      let warning =
                        emit_phase_warning_if_needed(bus_subj, "lane.open")
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_with_warning(
                            incoming.id,
                            lane_id,
                            [event_id],
                            warning,
                          ),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("lane.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          workspace_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, or args.name",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("queue.add") -> {
              case
                incoming.org_id,
                incoming.actor_id,
                incoming.name,
                incoming.reason
              {
                Some(org_id), Some(actor_id), Some(title), Some(why) ->
                  case
                    agent_workspace.add_queue_item_linked(
                      bus_subj,
                      org_id,
                      actor_id,
                      title,
                      why,
                      incoming.project_id,
                      incoming.mission_id,
                      incoming.lane_id,
                      incoming.done_when,
                      incoming.depends_on,
                      incoming.blocked_by,
                      incoming.source,
                      incoming.section_id,
                      incoming.gac_id,
                      incoming.decision_id,
                    )
                  {
                    Ok(agent_workspace.QueueItemAdded(queue_item_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, queue_item_id, [
                            event_id,
                          ]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("queue.registry"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          workspace_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, args.name, or args.reason",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("lane.claim") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "lane.claimed",
                "lane_id",
                incoming.lane_id,
                Some("lane.registry"),
                [
                  #("lane_id", required_json(incoming.lane_id)),
                  #("actor_id", json.string(actor_or_default(incoming))),
                  #("scope", agent_workspace.opt(incoming.scope)),
                  #("goal", agent_workspace.opt(incoming.goal)),
                  #("next", agent_workspace.opt(incoming.next)),
                  #("refresh_by", agent_workspace.opt(incoming.refresh_by)),
                  #("blocker", agent_workspace.opt(incoming.blocker)),
                ],
              )
            Some("lane.move") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "lane.moved",
                "lane_id",
                incoming.lane_id,
                Some("lane.registry"),
                [
                  #("lane_id", required_json(incoming.lane_id)),
                  #("from_status", json.null()),
                  #("to_status", agent_workspace.opt(incoming.status)),
                  #("moved_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("lane.block") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "lane.blocked",
                "lane_id",
                incoming.lane_id,
                Some("lane.registry"),
                [
                  #("lane_id", required_json(incoming.lane_id)),
                  #("reason", agent_workspace.opt(incoming.reason)),
                  #("depends_on", agent_workspace.opt(incoming.depends_on)),
                  #("blocked_by", agent_workspace.opt(incoming.blocked_by)),
                  #("marked_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("lane.release") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "lane.released",
                "lane_id",
                incoming.lane_id,
                Some("lane.registry"),
                [
                  #("lane_id", required_json(incoming.lane_id)),
                  #("released_by", json.string(actor_or_default(incoming))),
                  #("handoff_id", agent_workspace.opt(incoming.handoff_id)),
                  #("reason", agent_workspace.opt(incoming.reason)),
                ],
              )
            Some("lane.close") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "lane.closed",
                "lane_id",
                incoming.lane_id,
                Some("lane.registry"),
                [
                  #("lane_id", required_json(incoming.lane_id)),
                  #("closed_by", json.string(actor_or_default(incoming))),
                  #("reason", agent_workspace.opt(incoming.reason)),
                  #("verify", agent_workspace.opt(incoming.verify)),
                ],
              )
            Some("queue.ready") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "queue_item.ready",
                "queue_item_id",
                incoming.queue_item_id,
                Some("queue.registry"),
                [
                  #("queue_item_id", required_json(incoming.queue_item_id)),
                  #("reason", agent_workspace.opt(incoming.reason)),
                  #("marked_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("queue.block") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "queue_item.blocked",
                "queue_item_id",
                incoming.queue_item_id,
                Some("queue.registry"),
                [
                  #("queue_item_id", required_json(incoming.queue_item_id)),
                  #("blocked_by", agent_workspace.opt(incoming.blocked_by)),
                  #("reason", agent_workspace.opt(incoming.reason)),
                  #("marked_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("queue.close") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "queue_item.closed",
                "queue_item_id",
                incoming.queue_item_id,
                Some("queue.registry"),
                [
                  #("queue_item_id", required_json(incoming.queue_item_id)),
                  #("result", agent_workspace.opt(incoming.result)),
                  #("verify", agent_workspace.opt(incoming.verify)),
                  #("closed_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("campaign.create") -> {
              let campaign_id = agent_workspace.new_id("campaign")
              handle_workspace_event(
                conn,
                state,
                incoming,
                "campaign.created",
                "campaign_id",
                Some(campaign_id),
                Some("campaign.registry"),
                [
                  #("campaign_id", json.string(campaign_id)),
                  #("title", title_json(incoming)),
                  #("project_id", agent_workspace.opt(incoming.project_id)),
                  #("depends_on", agent_workspace.opt(incoming.depends_on)),
                  #("done_when", agent_workspace.opt(incoming.done_when)),
                  #("created_by", json.string(actor_or_default(incoming))),
                  #("status", json.string("active")),
                ],
              )
            }
            Some("campaign.archive") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "campaign.archived",
                "campaign_id",
                incoming.campaign_id,
                Some("campaign.registry"),
                [
                  #("campaign_id", required_json(incoming.campaign_id)),
                  #("reason", agent_workspace.opt(incoming.reason)),
                  #("archived_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("mission.create") -> {
              let mission_id = agent_workspace.new_id("mission")
              handle_workspace_event(
                conn,
                state,
                incoming,
                "mission.created",
                "mission_id",
                Some(mission_id),
                Some("mission.registry"),
                [
                  #("mission_id", json.string(mission_id)),
                  #("campaign_id", agent_workspace.opt(incoming.campaign_id)),
                  #("title", title_json(incoming)),
                  #("project_id", agent_workspace.opt(incoming.project_id)),
                  #("depends_on", agent_workspace.opt(incoming.depends_on)),
                  #("done_when", agent_workspace.opt(incoming.done_when)),
                  #("created_by", json.string(actor_or_default(incoming))),
                  #("status", json.string("ready")),
                ],
              )
            }
            Some("mission.start") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "mission.started",
                "mission_id",
                incoming.mission_id,
                Some("mission.registry"),
                [
                  #("mission_id", required_json(incoming.mission_id)),
                  #("started_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("mission.pause") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "mission.paused",
                "mission_id",
                incoming.mission_id,
                Some("mission.registry"),
                [
                  #("mission_id", required_json(incoming.mission_id)),
                  #("reason", agent_workspace.opt(incoming.reason)),
                  #("paused_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("mission.complete") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "mission.completed",
                "mission_id",
                incoming.mission_id,
                Some("mission.registry"),
                [
                  #("mission_id", required_json(incoming.mission_id)),
                  #("result", agent_workspace.opt(incoming.result)),
                  #("verify", agent_workspace.opt(incoming.verify)),
                  #("completed_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("handoff.request") -> {
              let handoff_id = agent_workspace.new_id("handoff")
              handle_workspace_event(
                conn,
                state,
                incoming,
                "handoff.requested",
                "handoff_id",
                Some(handoff_id),
                Some("handoff.registry"),
                [
                  #("handoff_id", json.string(handoff_id)),
                  #("project_id", agent_workspace.opt(incoming.project_id)),
                  #("from", agent_workspace.opt(incoming.from_actor)),
                  #("to", agent_workspace.opt(incoming.to_actor)),
                  #("needed", agent_workspace.opt(incoming.needed)),
                  #("context", agent_workspace.opt(incoming.context)),
                  #("source", agent_workspace.opt(incoming.source)),
                  #("verify", agent_workspace.opt(incoming.verify)),
                  #("depends_on", agent_workspace.opt(incoming.depends_on)),
                  #("status", json.string("pending")),
                ],
              )
            }
            Some("handoff.accept") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "handoff.accepted",
                "handoff_id",
                incoming.handoff_id,
                Some("handoff.registry"),
                [
                  #("handoff_id", required_json(incoming.handoff_id)),
                  #("accepted_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("handoff.reject") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "handoff.rejected",
                "handoff_id",
                incoming.handoff_id,
                Some("handoff.registry"),
                [
                  #("handoff_id", required_json(incoming.handoff_id)),
                  #("rejected_by", json.string(actor_or_default(incoming))),
                  #("reason", agent_workspace.opt(incoming.reason)),
                ],
              )
            Some("handoff.complete") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "handoff.completed",
                "handoff_id",
                incoming.handoff_id,
                Some("handoff.registry"),
                [
                  #("handoff_id", required_json(incoming.handoff_id)),
                  #("completed_by", json.string(actor_or_default(incoming))),
                  #("outcome", agent_workspace.opt(incoming.outcome)),
                  #("verify", agent_workspace.opt(incoming.verify)),
                ],
              )
            Some("problem.log") -> {
              let problem_id = agent_workspace.new_id("problem")
              handle_workspace_event(
                conn,
                state,
                incoming,
                "problem.logged",
                "problem_id",
                Some(problem_id),
                Some("problem.graph"),
                [
                  #("problem_id", json.string(problem_id)),
                  #("title", title_json(incoming)),
                  #("project_id", agent_workspace.opt(incoming.project_id)),
                  #("lane_id", agent_workspace.opt(incoming.lane_id)),
                  #("depends_on", agent_workspace.opt(incoming.depends_on)),
                  #("cause", agent_workspace.opt(incoming.cause)),
                  #("solution", agent_workspace.opt(incoming.solution_id)),
                  #("source", agent_workspace.opt(incoming.source)),
                  #("recurs", agent_workspace.opt(incoming.recurs)),
                  #("logged_by", json.string(actor_or_default(incoming))),
                  #("status", json.string("open")),
                ],
              )
            }
            Some("problem.solution") -> {
              let solution_id = agent_workspace.new_id("solution")
              handle_workspace_event(
                conn,
                state,
                incoming,
                "problem.solution_added",
                "solution_id",
                Some(solution_id),
                Some("problem.graph"),
                [
                  #("solution_id", json.string(solution_id)),
                  #("problem_id", required_json(incoming.problem_id)),
                  #("title", title_json(incoming)),
                  #("depends_on", agent_workspace.opt(incoming.depends_on)),
                  #("verify", agent_workspace.opt(incoming.verify)),
                  #("source", agent_workspace.opt(incoming.source)),
                  #("added_by", json.string(actor_or_default(incoming))),
                ],
              )
            }
            Some("problem.link") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "problem.linked",
                "problem_id",
                incoming.problem_id,
                Some("problem.graph"),
                [
                  #("problem_id", required_json(incoming.problem_id)),
                  #("from", agent_workspace.opt(incoming.target_kind)),
                  #("to", agent_workspace.opt(incoming.target_value)),
                  #("relation", agent_workspace.opt(incoming.relation)),
                  #("linked_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("agent.report") -> {
              let report_id = agent_workspace.new_id("agent_report")
              handle_workspace_event(
                conn,
                state,
                incoming,
                "agent.reported",
                "report_id",
                Some(report_id),
                Some("agent.reports"),
                [
                  #("report_id", json.string(report_id)),
                  #("actor_id", json.string(actor_or_default(incoming))),
                  #("lane_id", agent_workspace.opt(incoming.lane_id)),
                  #("changed", agent_workspace.opt(incoming.changed)),
                  #("verified", agent_workspace.opt(incoming.verified)),
                  #("risks", agent_workspace.opt(incoming.risks)),
                  #("next", agent_workspace.opt(incoming.next)),
                ],
              )
            }
            Some("swarm.create") -> {
              let swarm_id = agent_workspace.new_id("swarm")
              handle_workspace_event(
                conn,
                state,
                incoming,
                "swarm.created",
                "swarm_id",
                Some(swarm_id),
                Some("swarm.registry"),
                [
                  #("swarm_id", json.string(swarm_id)),
                  #("name", title_json(incoming)),
                  #("project_id", agent_workspace.opt(incoming.project_id)),
                  #("mission_id", agent_workspace.opt(incoming.mission_id)),
                  #("campaign_id", agent_workspace.opt(incoming.campaign_id)),
                  #("created_by", json.string(actor_or_default(incoming))),
                  #("status", json.string("created")),
                ],
              )
            }
            Some("swarm.start") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "swarm.started",
                "swarm_id",
                incoming.swarm_id,
                Some("swarm.registry"),
                [
                  #("swarm_id", required_json(incoming.swarm_id)),
                  #("started_by", json.string(actor_or_default(incoming))),
                ],
              )
            Some("swarm.pause") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "swarm.paused",
                "swarm_id",
                incoming.swarm_id,
                Some("swarm.registry"),
                [
                  #("swarm_id", required_json(incoming.swarm_id)),
                  #("paused_by", json.string(actor_or_default(incoming))),
                  #("reason", agent_workspace.opt(incoming.reason)),
                ],
              )
            Some("swarm.stop") ->
              handle_workspace_event(
                conn,
                state,
                incoming,
                "swarm.stopped",
                "swarm_id",
                incoming.swarm_id,
                Some("swarm.registry"),
                [
                  #("swarm_id", required_json(incoming.swarm_id)),
                  #("stopped_by", json.string(actor_or_default(incoming))),
                  #("reason", agent_workspace.opt(incoming.reason)),
                ],
              )
            Some("swarm.report") -> {
              let report_id = agent_workspace.new_id("swarm_report")
              handle_workspace_event(
                conn,
                state,
                incoming,
                "swarm.report_generated",
                "report_id",
                Some(report_id),
                Some("swarm.registry"),
                [
                  #("swarm_id", required_json(incoming.swarm_id)),
                  #("report_id", json.string(report_id)),
                  #("generated_by", json.string(actor_or_default(incoming))),
                  #("summary", agent_workspace.opt(incoming.body)),
                ],
              )
            }
            Some("blueprint.document.create") -> {
              case
                incoming.org_id,
                incoming.project_id,
                blueprint_title(incoming)
              {
                Some(org_id), Some(project_id), Some(title) ->
                  case
                    ema_blueprint.create_document(
                      bus_subj,
                      org_id,
                      incoming.space_id,
                      blueprint_actor_id(incoming),
                      project_id,
                      title,
                    )
                  {
                    Ok(ema_blueprint.DocumentCreated(document_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, document_id, [
                            event_id,
                          ]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("blueprint.sections"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          blueprint_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.project_id, or args.title (or args.name)",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.document.rename") -> {
              case
                incoming.org_id,
                incoming.actor_id,
                incoming.document_id,
                blueprint_title(incoming)
              {
                Some(org_id), Some(actor_id), Some(document_id), Some(title) ->
                  case
                    ema_blueprint.rename_document(
                      bus_subj,
                      org_id,
                      actor_id,
                      document_id,
                      title,
                    )
                  {
                    Ok(ema_blueprint.DocumentRenamed(doc_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, doc_id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("blueprint.sections"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          blueprint_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, args.document_id, or args.title",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.document.archive") -> {
              case incoming.org_id, incoming.actor_id, incoming.document_id {
                Some(org_id), Some(actor_id), Some(document_id) ->
                  case
                    ema_blueprint.archive_document(
                      bus_subj,
                      org_id,
                      actor_id,
                      document_id,
                      incoming.reason,
                    )
                  {
                    Ok(ema_blueprint.DocumentArchived(doc_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, doc_id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("blueprint.sections"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          blueprint_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, or args.document_id",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.section.add") -> {
              case
                incoming.org_id,
                incoming.document_id,
                blueprint_title(incoming)
              {
                Some(org_id), Some(document_id), Some(title) ->
                  case
                    ema_blueprint.add_section(
                      bus_subj,
                      org_id,
                      incoming.space_id,
                      incoming.project_id,
                      blueprint_actor_id(incoming),
                      document_id,
                      incoming.parent_section_id,
                      title,
                      blueprint_position(incoming),
                    )
                  {
                    Ok(ema_blueprint.SectionAdded(section_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, section_id, [
                            event_id,
                          ]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("blueprint.sections"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          blueprint_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.document_id, or args.title",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.section.rename") -> {
              case
                incoming.org_id,
                incoming.actor_id,
                incoming.section_id,
                blueprint_title(incoming)
              {
                Some(org_id), Some(actor_id), Some(section_id), Some(title) ->
                  case
                    ema_blueprint.rename_section(
                      bus_subj,
                      org_id,
                      actor_id,
                      section_id,
                      title,
                    )
                  {
                    Ok(ema_blueprint.SectionRenamed(sec_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, sec_id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("blueprint.sections"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          blueprint_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, args.section_id, or args.title",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.section.move") -> {
              case incoming.org_id, incoming.actor_id, incoming.section_id {
                Some(org_id), Some(actor_id), Some(section_id) ->
                  case
                    ema_blueprint.move_section(
                      bus_subj,
                      org_id,
                      actor_id,
                      section_id,
                      incoming.parent_section_id,
                      blueprint_position(incoming),
                    )
                  {
                    Ok(ema_blueprint.SectionMoved(sec_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, sec_id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("blueprint.sections"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          blueprint_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, or args.section_id",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.section.promote") -> {
              case
                incoming.org_id,
                incoming.section_id,
                blueprint_title(incoming),
                incoming.body
              {
                Some(org_id), Some(section_id), Some(title), Some(body) ->
                  case
                    ema_blueprint.promote_section_to_proposal(
                      bus_subj,
                      org_id,
                      blueprint_actor_id(incoming),
                      section_id,
                      title,
                      body,
                    )
                  {
                    Ok(ema_blueprint.SectionPromoted(
                      _section_id,
                      proposal_id,
                      drafted_event_id,
                      promoted_event_id,
                    )) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, proposal_id, [
                            drafted_event_id,
                            promoted_event_id,
                          ]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("blueprint.sections"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          blueprint_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.section_id, args.title, or args.body",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.section.remove") -> {
              case incoming.org_id, incoming.actor_id, incoming.section_id {
                Some(org_id), Some(actor_id), Some(section_id) ->
                  case
                    ema_blueprint.remove_section(
                      bus_subj,
                      org_id,
                      actor_id,
                      section_id,
                    )
                  {
                    Ok(ema_blueprint.SectionRemoved(sec_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, sec_id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("blueprint.sections"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          blueprint_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, or args.section_id",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.gac.create") -> {
              case
                incoming.org_id,
                incoming.document_id,
                incoming.category,
                incoming.priority,
                incoming.question
              {
                Some(org_id), Some(doc), Some(cat), Some(pri), Some(q) ->
                  handle_planner_result(
                    state,
                    conn,
                    bus_subj,
                    collab_subj,
                    incoming.id,
                    planner_nodes.gac_create(
                      bus_subj,
                      org_id,
                      blueprint_actor_id(incoming),
                      doc,
                      incoming.section_id,
                      cat,
                      pri,
                      q,
                      None,
                    ),
                    fn(r) {
                      case r {
                        planner_nodes.GacCreated(id, ev) -> #(id, ev)
                      }
                    },
                  )
                  |> mist.continue
                _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.document_id, args.category, args.priority, or args.question",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.gac.answer") -> {
              case incoming.org_id, incoming.gac_id, incoming.result_action {
                Some(org_id), Some(gac_id), Some(action) ->
                  handle_planner_result(
                    state,
                    conn,
                    bus_subj,
                    collab_subj,
                    incoming.id,
                    planner_nodes.gac_answer(
                      bus_subj,
                      org_id,
                      blueprint_actor_id(incoming),
                      gac_id,
                      incoming.selected,
                      incoming.freeform,
                      action,
                      incoming.target,
                    ),
                    fn(r) {
                      case r {
                        planner_nodes.GacAnswered(id, ev) -> #(id, ev)
                      }
                    },
                  )
                  |> mist.continue
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.gac_id, or args.result_action",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.blocker.open") -> {
              case
                incoming.org_id,
                incoming.category,
                incoming.priority,
                blueprint_title(incoming)
              {
                Some(org_id), Some(cat), Some(pri), Some(title) ->
                  handle_planner_result(
                    state,
                    conn,
                    bus_subj,
                    collab_subj,
                    incoming.id,
                    planner_nodes.blocker_open(
                      bus_subj,
                      org_id,
                      blueprint_actor_id(incoming),
                      incoming.document_id,
                      incoming.section_id,
                      cat,
                      pri,
                      title,
                      incoming.description,
                      incoming.refresh_by,
                      incoming.gac_id,
                    ),
                    fn(r) {
                      case r {
                        planner_nodes.BlockerOpened(id, ev) -> #(id, ev)
                      }
                    },
                  )
                  |> mist.continue
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.category, args.priority, or args.title",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.blocker.resolve") -> {
              case incoming.org_id, incoming.blocker_id {
                Some(org_id), Some(blocker_id) ->
                  handle_planner_result(
                    state,
                    conn,
                    bus_subj,
                    collab_subj,
                    incoming.id,
                    planner_nodes.blocker_resolve(
                      bus_subj,
                      org_id,
                      blueprint_actor_id(incoming),
                      blocker_id,
                      incoming.target,
                      incoming.reason,
                    ),
                    fn(r) {
                      case r {
                        planner_nodes.BlockerResolved(id, ev) -> #(id, ev)
                      }
                    },
                  )
                  |> mist.continue
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id or args.blocker_id",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.aspiration.capture") -> {
              case
                incoming.org_id,
                blueprint_title(incoming),
                incoming.timeframe
              {
                Some(org_id), Some(title), Some(timeframe) ->
                  handle_planner_result(
                    state,
                    conn,
                    bus_subj,
                    collab_subj,
                    incoming.id,
                    planner_nodes.aspiration_capture(
                      bus_subj,
                      org_id,
                      blueprint_actor_id(incoming),
                      title,
                      incoming.description,
                      timeframe,
                      case incoming.source_type {
                        Some(s) -> s
                        None -> "manual_tag"
                      },
                      incoming.origin_app,
                      incoming.origin_text,
                    ),
                    fn(r) {
                      case r {
                        planner_nodes.AspirationCaptured(id, ev) -> #(id, ev)
                      }
                    },
                  )
                  |> mist.continue
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.title, or args.timeframe",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("blueprint.decision.lock") -> {
              case incoming.org_id, blueprint_title(incoming), incoming.body {
                Some(org_id), Some(title), Some(body) ->
                  handle_planner_result(
                    state,
                    conn,
                    bus_subj,
                    collab_subj,
                    incoming.id,
                    planner_nodes.decision_lock(
                      bus_subj,
                      org_id,
                      blueprint_actor_id(incoming),
                      title,
                      body,
                      incoming.supersedes,
                      incoming.source_node,
                    ),
                    fn(r) {
                      case r {
                        planner_nodes.DecisionLocked(id, ev) -> #(id, ev)
                      }
                    },
                  )
                  |> mist.continue
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.title, or args.body",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("vcalendar.block.add") -> {
              case
                incoming.org_id,
                incoming.actor_id,
                incoming.block_kind,
                incoming.label
              {
                Some(org_id), Some(actor_id), Some(block_kind), Some(label) ->
                  case
                    ema_vcalendar.add_block(
                      bus_subj,
                      org_id,
                      actor_id,
                      block_kind,
                      label,
                      incoming.start_at,
                      incoming.end_at,
                    )
                  {
                    Ok(ema_vcalendar.BlockCreated(block_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, block_id, [event_id]),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          vcalendar_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, args.block_kind, or args.label",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("vcalendar.block.move") -> {
              case
                incoming.org_id,
                incoming.actor_id,
                incoming.block_id,
                incoming.start_at
              {
                Some(org_id), Some(actor_id), Some(block_id), Some(start_at) ->
                  case
                    ema_vcalendar.move_block(
                      bus_subj,
                      org_id,
                      actor_id,
                      block_id,
                      start_at,
                      incoming.end_at,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          vcalendar_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, args.block_id, or args.start_at",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("vcalendar.checkup.tick") -> {
              let result = ema_vcalendar.tick_auto_checkups(bus_subj)
              let ema_vcalendar.AutoCheckupTick(count, lane_ids, skipped) =
                result
              let body =
                "{\"v\":0,\"type\":\"command_result\",\"in_reply_to\":\""
                <> json_escape_inline(incoming.id)
                <> "\",\"ok\":true,\"events\":[],\"data\":{\"emitted\":"
                <> int.to_string(count)
                <> ",\"skipped_unscoped\":"
                <> int.to_string(skipped)
                <> ",\"lane_ids\":["
                <> string.join(
                  list.map(lane_ids, fn(id) {
                    "\"" <> json_escape_inline(id) <> "\""
                  }),
                  ",",
                )
                <> "]}}"
              let _ = mist.send_text_frame(conn, body)
              let _ =
                send_projection_snapshot(
                  conn,
                  bus_subj,
                  collab_subj,
                  Some("vcalendar.state"),
                )
              mist.continue(state)
            }
            Some("vcalendar.phase.set") -> {
              case incoming.org_id, incoming.actor_id, incoming.label {
                Some(org_id), Some(actor_id), Some(label) ->
                  case
                    ema_vcalendar.set_phase(bus_subj, org_id, actor_id, label)
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          vcalendar_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, or args.label",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("checkup.schedule") -> {
              case
                incoming.org_id,
                incoming.actor_id,
                incoming.lane_id,
                incoming.cadence
              {
                Some(org_id), Some(actor_id), Some(lane_id), Some(cadence) ->
                  case
                    ema_vcalendar.schedule_checkup(
                      bus_subj,
                      org_id,
                      actor_id,
                      lane_id,
                      cadence,
                    )
                  {
                    Ok(ema_vcalendar.CheckupScheduled(checkup_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, checkup_id, [
                            event_id,
                          ]),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          vcalendar_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, args.lane_id, or args.cadence",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("checkup.complete") -> {
              case
                incoming.org_id,
                incoming.actor_id,
                incoming.checkup_id,
                incoming.result
              {
                Some(org_id), Some(actor_id), Some(checkup_id), Some(result) ->
                  case
                    ema_vcalendar.complete_checkup(
                      bus_subj,
                      org_id,
                      actor_id,
                      checkup_id,
                      result,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          vcalendar_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.actor_id, args.checkup_id, or args.result",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            // -----------------------------------------------------------------
            // L2 — dispatch / execution / tool writer arms (humble-sketch
            // lane:01KR0RQ6JK). Additive only; never modify existing arms.
            // -----------------------------------------------------------------
            Some("dispatch.start") -> {
              case incoming.org_id, incoming.intent {
                Some(org_id), Some(intent) -> {
                  let workspace =
                    ema_dispatch.WorkspaceRef(
                      org_id: org_id,
                      space_id: incoming.space_id,
                      project_id: incoming.project_id,
                    )
                  let actor = actor_or_default(incoming)
                  let initiator = case incoming.initiator {
                    Some(value) -> value
                    None -> actor
                  }
                  case
                    ema_dispatch.start_dispatch(
                      bus_subj,
                      actor,
                      initiator,
                      intent,
                      workspace,
                      incoming.provider,
                      incoming.lane_id,
                    )
                  {
                    Ok(ema_dispatch.StartedDispatch(dispatch_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, dispatch_id, [
                            event_id,
                          ]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          dispatch_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                }
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id or args.intent",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("dispatch.scope_grant") -> {
              case incoming.org_id, incoming.dispatch_id {
                Some(org_id), Some(dispatch_id) -> {
                  let scope =
                    ema_dispatch.ScopeGrant(
                      read: incoming.read_scopes,
                      write: incoming.write_scopes,
                      call: incoming.call_scopes,
                      secrets: incoming.secret_refs,
                    )
                  case
                    ema_dispatch.grant_scope(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      scope,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          dispatch_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                }
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id or args.dispatch_id",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("dispatch.end") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.outcome
              {
                Some(org_id), Some(dispatch_id), Some(outcome) ->
                  case
                    ema_dispatch.end_dispatch(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      outcome,
                      incoming.provider,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          dispatch_error(incoming.id, e),
                        )
                      mist.continue(state)
                    }
                  }
                _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, or args.outcome",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("execution.start") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.exec_kind,
                incoming.name
              {
                Some(org_id), Some(dispatch_id), Some(kind), Some(name) ->
                  case
                    ema_exec.start_execution(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      kind,
                      name,
                      incoming.provider,
                    )
                  {
                    Ok(ema_exec.StartedExecution(execution_id, event_id)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, execution_id, [
                            event_id,
                          ]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, exec_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, args.exec_kind, or args.name",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("execution.end") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.execution_id,
                incoming.outcome
              {
                Some(org_id), Some(dispatch_id), Some(execution_id), Some(
                  outcome,
                ) -> {
                  let duration = case incoming.duration_ms {
                    Some(value) -> value
                    None -> 0
                  }
                  case
                    ema_exec.end_execution(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      execution_id,
                      outcome,
                      duration,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, exec_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, args.execution_id, or args.outcome",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("execution.complete") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.execution_id,
                incoming.provider,
                incoming.exit_code,
                incoming.duration_ms,
                incoming.stdout_bytes,
                incoming.stderr_bytes,
                incoming.session_file_path,
                incoming.prompt_hash
              {
                Some(org_id), Some(dispatch_id), Some(execution_id), Some(
                  provider,
                ), Some(exit_code), Some(duration_ms), Some(stdout_bytes), Some(
                  stderr_bytes,
                ), Some(session_file_path), Some(prompt_hash) -> {
                  case
                    ema_exec.complete_execution(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      execution_id,
                      provider,
                      exit_code,
                      duration_ms,
                      stdout_bytes,
                      stderr_bytes,
                      session_file_path,
                      prompt_hash,
                      incoming.canon_id,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, exec_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _, _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, args.execution_id, args.provider, args.exit_code, args.duration_ms, args.stdout_bytes, args.stderr_bytes, args.session_file_path, or args.prompt_hash",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("execution.fail") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.execution_id,
                incoming.error_class,
                incoming.error_message
              {
                Some(org_id), Some(dispatch_id), Some(execution_id), Some(
                  error_class,
                ), Some(error_message) -> {
                  let failed =
                    case
                      incoming.provider,
                      incoming.exit_code,
                      incoming.duration_ms,
                      incoming.stdout_bytes,
                      incoming.stderr_bytes,
                      incoming.session_file_path,
                      incoming.prompt_hash
                    {
                      Some(provider), Some(exit_code), Some(duration_ms), Some(
                        stdout_bytes,
                      ), Some(stderr_bytes), Some(session_file_path), Some(
                        prompt_hash,
                      ) ->
                        ema_exec.fail_execution_with_report(
                          bus_subj,
                          org_id,
                          actor_or_default(incoming),
                          dispatch_id,
                          execution_id,
                          error_class,
                          error_message,
                          provider,
                          exit_code,
                          duration_ms,
                          stdout_bytes,
                          stderr_bytes,
                          session_file_path,
                          prompt_hash,
                        )
                      _, _, _, _, _, _, _ ->
                        ema_exec.fail_execution(
                          bus_subj,
                          org_id,
                          actor_or_default(incoming),
                          dispatch_id,
                          execution_id,
                          error_class,
                          error_message,
                        )
                    }
                  case failed {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, exec_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, args.execution_id, args.error_class, or args.message",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("execution.timeout") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.execution_id,
                incoming.provider,
                incoming.timeout_ms,
                incoming.duration_ms,
                incoming.stdout_bytes,
                incoming.stderr_bytes,
                incoming.session_file_path,
                incoming.prompt_hash
              {
                Some(org_id), Some(dispatch_id), Some(execution_id), Some(
                  provider,
                ), Some(timeout_ms), Some(duration_ms), Some(stdout_bytes), Some(
                  stderr_bytes,
                ), Some(session_file_path), Some(prompt_hash) -> {
                  case
                    ema_exec.timeout_execution(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      execution_id,
                      provider,
                      timeout_ms,
                      duration_ms,
                      stdout_bytes,
                      stderr_bytes,
                      session_file_path,
                      prompt_hash,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, exec_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _, _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, args.execution_id, args.provider, args.timeout_ms, args.duration_ms, args.stdout_bytes, args.stderr_bytes, args.session_file_path, or args.prompt_hash",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("artifact.create") -> {
              case
                incoming.org_id,
                incoming.project_id,
                incoming.source_type,
                incoming.title,
                incoming.source,
                incoming.body
              {
                Some(org_id), Some(project_id), Some(kind), Some(title), Some(
                  source_path,
                ), Some(body) -> {
                  case
                    ema_artifact.create_artifact(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      project_id,
                      kind,
                      title,
                      source_path,
                      body,
                    )
                  {
                    Ok(ema_artifact.WrittenArtifact(
                      artifact_id: artifact_id,
                      event_id: event_id,
                      ..,
                    )) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, artifact_id, [
                            event_id,
                          ]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, artifact_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.project_id, args.source_type, args.title, args.source, or args.body",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("artifact.update") -> {
              case
                incoming.org_id,
                incoming.project_id,
                incoming.document_id,
                incoming.source_type,
                incoming.title,
                incoming.source,
                incoming.body
              {
                Some(org_id), Some(project_id), Some(artifact_id), Some(kind), Some(
                  title,
                ), Some(source_path), Some(body) -> {
                  case
                    ema_artifact.update_artifact(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      artifact_id,
                      project_id,
                      kind,
                      title,
                      source_path,
                      body,
                    )
                  {
                    Ok(ema_artifact.WrittenArtifact(event_id: event_id, ..)) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, artifact_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.project_id, args.document_id, args.source_type, args.title, args.source, or args.body",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("artifact.link") -> {
              case
                incoming.org_id,
                incoming.project_id,
                incoming.document_id,
                incoming.source_type,
                incoming.title,
                incoming.result,
                incoming.source,
                incoming.duration_ms,
                incoming.target_kind,
                incoming.target_value
              {
                Some(org_id), Some(project_id), Some(artifact_id), Some(kind), Some(
                  title,
                ), Some(content_hash), Some(storage_path), Some(bytes), Some(
                  target_kind,
                ), Some(target_id) -> {
                  case
                    ema_artifact.link_artifact(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      artifact_id,
                      project_id,
                      kind,
                      title,
                      content_hash,
                      storage_path,
                      bytes,
                      target_kind,
                      target_id,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, artifact_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _, _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.project_id, args.document_id, args.source_type, args.title, args.result, args.source, args.duration_ms, args.target_kind, or args.target_value",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("artifact.archive") -> {
              case
                incoming.org_id,
                incoming.project_id,
                incoming.document_id,
                incoming.source_type,
                incoming.title,
                incoming.result,
                incoming.source,
                incoming.duration_ms
              {
                Some(org_id), Some(project_id), Some(artifact_id), Some(kind), Some(
                  title,
                ), Some(content_hash), Some(storage_path), Some(bytes) -> {
                  let reason = case incoming.reason {
                    Some(value) -> value
                    None -> "archived"
                  }
                  case
                    ema_artifact.archive_artifact(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      artifact_id,
                      project_id,
                      kind,
                      title,
                      content_hash,
                      storage_path,
                      bytes,
                      reason,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, artifact_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.project_id, args.document_id, args.source_type, args.title, args.result, args.source, or args.duration_ms",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("canon.write") -> {
              case
                incoming.org_id,
                incoming.canon_kind,
                incoming.body,
                incoming.content_hash,
                incoming.source_kind,
                incoming.source_id
              {
                Some(org_id), Some(canon_kind), Some(body), Some(content_hash), Some(
                  source_kind,
                ), Some(source_id) -> {
                  case
                    ema_canon.write_canon(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      incoming.canon_id,
                      canon_kind,
                      body,
                      content_hash,
                      source_kind,
                      source_id,
                      incoming.approved_by_actor_id,
                      incoming.links,
                    )
                  {
                    Ok(ema_canon.WrittenCanon(
                      canon_id: canon_id,
                      event_id: event_id,
                      ..,
                    )) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok_resource(incoming.id, canon_id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, canon_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.canon_kind, args.body, args.content_hash, args.source_kind, or args.source_id",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("canon.supersede") -> {
              case
                incoming.org_id,
                incoming.canon_id,
                incoming.superseded_by_canon_id,
                incoming.reason
              {
                Some(org_id), Some(canon_id), Some(superseded_by), Some(
                  rationale,
                ) -> {
                  case
                    ema_canon.supersede_canon(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      canon_id,
                      superseded_by,
                      rationale,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, canon_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                }
                _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.canon_id, args.superseded_by_canon_id, or args.reason",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("tool.invoke") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.execution_id,
                incoming.tool_name,
                incoming.args_json
              {
                Some(org_id), Some(dispatch_id), Some(execution_id), Some(
                  tool_name,
                ), Some(args_json) ->
                  case
                    ema_exec.invoke_tool(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      execution_id,
                      tool_name,
                      args_json,
                      incoming.provider,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, exec_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, args.execution_id, args.tool_name, or args.args_json",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("tool.return") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.execution_id,
                incoming.tool_name,
                incoming.result_summary
              {
                Some(org_id), Some(dispatch_id), Some(execution_id), Some(
                  tool_name,
                ), Some(result_summary) ->
                  case
                    ema_exec.return_tool(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      execution_id,
                      tool_name,
                      result_summary,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, exec_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, args.execution_id, args.tool_name, or args.result_summary",
                      ),
                    )
                  mist.continue(state)
                }
              }
            }
            Some("tool.error") -> {
              case
                incoming.org_id,
                incoming.dispatch_id,
                incoming.execution_id,
                incoming.tool_name,
                incoming.error_class,
                incoming.error_message
              {
                Some(org_id), Some(dispatch_id), Some(execution_id), Some(
                  tool_name,
                ), Some(error_class), Some(error_message) ->
                  case
                    ema_exec.error_tool(
                      bus_subj,
                      org_id,
                      actor_or_default(incoming),
                      dispatch_id,
                      execution_id,
                      tool_name,
                      error_class,
                      error_message,
                    )
                  {
                    Ok(event_id) -> {
                      let _ =
                        mist.send_text_frame(
                          conn,
                          command_ok(incoming.id, [event_id]),
                        )
                      let _ =
                        send_projection_snapshot(
                          conn,
                          bus_subj,
                          collab_subj,
                          Some("event_trail"),
                        )
                      mist.continue(state)
                    }
                    Error(e) -> {
                      let _ =
                        mist.send_text_frame(conn, exec_error(incoming.id, e))
                      mist.continue(state)
                    }
                  }
                _, _, _, _, _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      err(
                        incoming.id,
                        "invalid_args",
                        "missing args.org_id, args.dispatch_id, args.execution_id, args.tool_name, args.error_class, or args.message",
                      ),
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
    document_id: Option(String),
    body: Option(String),
    frame_id: Option(String),
    revision: Option(Int),
    after_revision: Option(Int),
    created_at: Option(String),
    name: Option(String),
    device_id: Option(String),
    org_id: Option(String),
    space_id: Option(String),
    project_id: Option(String),
    mission_id: Option(String),
    target_kind: Option(String),
    target_value: Option(String),
    role: Option(String),
    expires_at: Option(String),
    invite_id: Option(String),
    accepted_by: Option(String),
    accepted_device: Option(String),
    access_point: Option(String),
    challenge_id: Option(String),
    user_id: Option(String),
    google_sub: Option(String),
    email: Option(String),
    display_name: Option(String),
    email_verified: Bool,
    secret_ref: Option(String),
    pubkey: Option(String),
    bootstrap: Option(String),
    attested_by: Option(String),
    capabilities: List(String),
    offer_id: Option(String),
    short_code: Option(String),
    confirmed_short_code: Option(String),
    peer_device: Option(String),
    peer_pubkey: Option(String),
    local_pubkey: Option(String),
    ceremony_kind: Option(String),
    ceremony_id: Option(String),
    lineage_proof: Option(String),
    approved_by_device: Option(String),
    session_id: Option(String),
    reason: Option(String),
    scope: Option(String),
    done_when: Option(String),
    depends_on: Option(String),
    blocked_by: Option(String),
    source: Option(String),
    scopes: List(String),
    actor_id: Option(String),
    room_id: Option(String),
    color: Option(String),
    surface: Option(String),
    x: Option(Int),
    y: Option(Int),
    block_id: Option(String),
    block_kind: Option(String),
    label: Option(String),
    start_at: Option(String),
    end_at: Option(String),
    lane_id: Option(String),
    cadence: Option(String),
    checkup_id: Option(String),
    result: Option(String),
    window_id: Option(String),
    app_id: Option(String),
    url: Option(String),
    bounds: Option(ema_companion.Bounds),
    transparent: Bool,
    section_id: Option(String),
    parent_section_id: Option(String),
    position: Option(Int),
    title: Option(String),
    campaign_id: Option(String),
    queue_item_id: Option(String),
    handoff_id: Option(String),
    problem_id: Option(String),
    solution_id: Option(String),
    swarm_id: Option(String),
    status: Option(String),
    goal: Option(String),
    next: Option(String),
    refresh_by: Option(String),
    blocker: Option(String),
    verify: Option(String),
    outcome: Option(String),
    from_actor: Option(String),
    to_actor: Option(String),
    needed: Option(String),
    context: Option(String),
    relation: Option(String),
    cause: Option(String),
    recurs: Option(String),
    changed: Option(String),
    verified: Option(String),
    risks: Option(String),
    category: Option(String),
    priority: Option(String),
    question: Option(String),
    gac_id: Option(String),
    result_action: Option(String),
    selected: Option(String),
    freeform: Option(String),
    target: Option(String),
    description: Option(String),
    blocker_id: Option(String),
    aspiration_id: Option(String),
    decision_id: Option(String),
    timeframe: Option(String),
    source_type: Option(String),
    origin_app: Option(String),
    origin_text: Option(String),
    supersedes: Option(String),
    source_node: Option(String),
    // L2 dispatch/exec/tool additive fields (humble-sketch lane:01KR0RQ6JK).
    intent: Option(String),
    dispatch_id: Option(String),
    execution_id: Option(String),
    provider: Option(String),
    initiator: Option(String),
    exec_kind: Option(String),
    tool_name: Option(String),
    args_json: Option(String),
    result_summary: Option(String),
    error_class: Option(String),
    error_message: Option(String),
    duration_ms: Option(Int),
    exit_code: Option(Int),
    timeout_ms: Option(Int),
    stdout_bytes: Option(Int),
    stderr_bytes: Option(Int),
    session_file_path: Option(String),
    prompt_hash: Option(String),
    canon_id: Option(String),
    canon_kind: Option(String),
    content_hash: Option(String),
    source_kind: Option(String),
    source_id: Option(String),
    approved_by_actor_id: Option(String),
    superseded_by_canon_id: Option(String),
    links: List(String),
    read_scopes: List(String),
    write_scopes: List(String),
    call_scopes: List(String),
    secret_refs: List(String),
  )
}

type IncomingArgs {
  IncomingArgs(
    document_id: Option(String),
    body: Option(String),
    frame_id: Option(String),
    revision: Option(Int),
    after_revision: Option(Int),
    created_at: Option(String),
    name: Option(String),
    device_id: Option(String),
    org_id: Option(String),
    space_id: Option(String),
    project_id: Option(String),
    mission_id: Option(String),
    target_kind: Option(String),
    target_value: Option(String),
    role: Option(String),
    expires_at: Option(String),
    invite_id: Option(String),
    accepted_by: Option(String),
    accepted_device: Option(String),
    access_point: Option(String),
    challenge_id: Option(String),
    user_id: Option(String),
    google_sub: Option(String),
    email: Option(String),
    display_name: Option(String),
    email_verified: Bool,
    secret_ref: Option(String),
    pubkey: Option(String),
    bootstrap: Option(String),
    attested_by: Option(String),
    capabilities: List(String),
    offer_id: Option(String),
    short_code: Option(String),
    confirmed_short_code: Option(String),
    peer_device: Option(String),
    peer_pubkey: Option(String),
    local_pubkey: Option(String),
    ceremony_kind: Option(String),
    ceremony_id: Option(String),
    lineage_proof: Option(String),
    approved_by_device: Option(String),
    session_id: Option(String),
    reason: Option(String),
    scope: Option(String),
    done_when: Option(String),
    depends_on: Option(String),
    blocked_by: Option(String),
    source: Option(String),
    scopes: List(String),
    actor_id: Option(String),
    room_id: Option(String),
    color: Option(String),
    surface: Option(String),
    x: Option(Int),
    y: Option(Int),
    block_id: Option(String),
    block_kind: Option(String),
    label: Option(String),
    start_at: Option(String),
    end_at: Option(String),
    lane_id: Option(String),
    cadence: Option(String),
    checkup_id: Option(String),
    result: Option(String),
    window_id: Option(String),
    app_id: Option(String),
    url: Option(String),
    bounds: Option(ema_companion.Bounds),
    transparent: Bool,
    section_id: Option(String),
    parent_section_id: Option(String),
    position: Option(Int),
    title: Option(String),
    campaign_id: Option(String),
    queue_item_id: Option(String),
    handoff_id: Option(String),
    problem_id: Option(String),
    solution_id: Option(String),
    swarm_id: Option(String),
    status: Option(String),
    goal: Option(String),
    next: Option(String),
    refresh_by: Option(String),
    blocker: Option(String),
    verify: Option(String),
    outcome: Option(String),
    from_actor: Option(String),
    to_actor: Option(String),
    needed: Option(String),
    context: Option(String),
    relation: Option(String),
    cause: Option(String),
    recurs: Option(String),
    changed: Option(String),
    verified: Option(String),
    risks: Option(String),
    category: Option(String),
    priority: Option(String),
    question: Option(String),
    gac_id: Option(String),
    result_action: Option(String),
    selected: Option(String),
    freeform: Option(String),
    target: Option(String),
    description: Option(String),
    blocker_id: Option(String),
    aspiration_id: Option(String),
    decision_id: Option(String),
    timeframe: Option(String),
    source_type: Option(String),
    origin_app: Option(String),
    origin_text: Option(String),
    supersedes: Option(String),
    source_node: Option(String),
    // L2 dispatch/exec/tool additive fields (humble-sketch lane:01KR0RQ6JK).
    intent: Option(String),
    dispatch_id: Option(String),
    execution_id: Option(String),
    provider: Option(String),
    initiator: Option(String),
    exec_kind: Option(String),
    tool_name: Option(String),
    args_json: Option(String),
    result_summary: Option(String),
    error_class: Option(String),
    error_message: Option(String),
    duration_ms: Option(Int),
    exit_code: Option(Int),
    timeout_ms: Option(Int),
    stdout_bytes: Option(Int),
    stderr_bytes: Option(Int),
    session_file_path: Option(String),
    prompt_hash: Option(String),
    canon_id: Option(String),
    canon_kind: Option(String),
    content_hash: Option(String),
    source_kind: Option(String),
    source_id: Option(String),
    approved_by_actor_id: Option(String),
    superseded_by_canon_id: Option(String),
    links: List(String),
    read_scopes: List(String),
    write_scopes: List(String),
    call_scopes: List(String),
    secret_refs: List(String),
  )
}

fn decode_envelope(raw: String) -> Result(Incoming, String) {
  let bounds_decoder = {
    use x <- decode.field("x", decode.int)
    use y <- decode.field("y", decode.int)
    use width <- decode.field("width", decode.int)
    use height <- decode.field("height", decode.int)
    decode.success(ema_companion.Bounds(x:, y:, width:, height:))
  }

  let args_decoder = {
    use document_id <- decode.optional_field(
      "document_id",
      None,
      decode.optional(decode.string),
    )
    use body <- decode.optional_field(
      "body",
      None,
      decode.optional(decode.string),
    )
    use text <- decode.optional_field(
      "text",
      None,
      decode.optional(decode.string),
    )
    use frame_id <- decode.optional_field(
      "frame_id",
      None,
      decode.optional(decode.string),
    )
    use revision <- decode.optional_field(
      "revision",
      None,
      decode.optional(decode.int),
    )
    use after_revision <- decode.optional_field(
      "after_revision",
      None,
      decode.optional(decode.int),
    )
    use created_at <- decode.optional_field(
      "created_at",
      None,
      decode.optional(decode.string),
    )
    use name <- decode.optional_field(
      "name",
      None,
      decode.optional(decode.string),
    )
    use device_id <- decode.optional_field(
      "device_id",
      None,
      decode.optional(decode.string),
    )
    use org_id <- decode.optional_field(
      "org_id",
      None,
      decode.optional(decode.string),
    )
    use space_id <- decode.optional_field(
      "space_id",
      None,
      decode.optional(decode.string),
    )
    use project_id <- decode.optional_field(
      "project_id",
      None,
      decode.optional(decode.string),
    )
    use mission_id <- decode.optional_field(
      "mission_id",
      None,
      decode.optional(decode.string),
    )
    use target_kind <- decode.optional_field(
      "target_kind",
      None,
      decode.optional(decode.string),
    )
    use target_value <- decode.optional_field(
      "target_value",
      None,
      decode.optional(decode.string),
    )
    use role <- decode.optional_field(
      "role",
      None,
      decode.optional(decode.string),
    )
    use expires_at <- decode.optional_field(
      "expires_at",
      None,
      decode.optional(decode.string),
    )
    use invite_id <- decode.optional_field(
      "invite_id",
      None,
      decode.optional(decode.string),
    )
    use accepted_by <- decode.optional_field(
      "accepted_by",
      None,
      decode.optional(decode.string),
    )
    use accepted_device <- decode.optional_field(
      "accepted_device",
      None,
      decode.optional(decode.string),
    )
    use access_point <- decode.optional_field(
      "access_point",
      None,
      decode.optional(decode.string),
    )
    use challenge_id <- decode.optional_field(
      "challenge_id",
      None,
      decode.optional(decode.string),
    )
    use user_id <- decode.optional_field(
      "user_id",
      None,
      decode.optional(decode.string),
    )
    use google_sub <- decode.optional_field(
      "google_sub",
      None,
      decode.optional(decode.string),
    )
    use email <- decode.optional_field(
      "email",
      None,
      decode.optional(decode.string),
    )
    use display_name <- decode.optional_field(
      "display_name",
      None,
      decode.optional(decode.string),
    )
    use email_verified <- decode.optional_field(
      "email_verified",
      False,
      decode.bool,
    )
    use secret_ref <- decode.optional_field(
      "secret_ref",
      None,
      decode.optional(decode.string),
    )
    use pubkey <- decode.optional_field(
      "pubkey",
      None,
      decode.optional(decode.string),
    )
    use bootstrap <- decode.optional_field(
      "bootstrap",
      None,
      decode.optional(decode.string),
    )
    use attested_by <- decode.optional_field(
      "attested_by",
      None,
      decode.optional(decode.string),
    )
    use capabilities <- decode.optional_field(
      "capabilities",
      [],
      decode.list(decode.string),
    )
    use offer_id <- decode.optional_field(
      "offer_id",
      None,
      decode.optional(decode.string),
    )
    use short_code <- decode.optional_field(
      "short_code",
      None,
      decode.optional(decode.string),
    )
    use confirmed_short_code <- decode.optional_field(
      "confirmed_short_code",
      None,
      decode.optional(decode.string),
    )
    use peer_device <- decode.optional_field(
      "peer_device",
      None,
      decode.optional(decode.string),
    )
    use peer_pubkey <- decode.optional_field(
      "peer_pubkey",
      None,
      decode.optional(decode.string),
    )
    use local_pubkey <- decode.optional_field(
      "local_pubkey",
      None,
      decode.optional(decode.string),
    )
    use ceremony_kind <- decode.optional_field(
      "ceremony_kind",
      None,
      decode.optional(decode.string),
    )
    use ceremony_id <- decode.optional_field(
      "ceremony_id",
      None,
      decode.optional(decode.string),
    )
    use lineage_proof <- decode.optional_field(
      "lineage_proof",
      None,
      decode.optional(decode.string),
    )
    use approved_by_device <- decode.optional_field(
      "approved_by_device",
      None,
      decode.optional(decode.string),
    )
    use session_id <- decode.optional_field(
      "session_id",
      None,
      decode.optional(decode.string),
    )
    use reason <- decode.optional_field(
      "reason",
      None,
      decode.optional(decode.string),
    )
    use scope <- decode.optional_field(
      "scope",
      None,
      decode.optional(decode.string),
    )
    use done_when <- decode.optional_field(
      "done_when",
      None,
      decode.optional(decode.string),
    )
    use depends_on <- decode.optional_field(
      "depends_on",
      None,
      decode.optional(decode.string),
    )
    use blocked_by <- decode.optional_field(
      "blocked_by",
      None,
      decode.optional(decode.string),
    )
    use source <- decode.optional_field(
      "source",
      None,
      decode.optional(decode.string),
    )
    use scopes <- decode.optional_field(
      "scopes",
      [],
      decode.list(decode.string),
    )
    use actor_id <- decode.optional_field(
      "actor_id",
      None,
      decode.optional(decode.string),
    )
    use room_id <- decode.optional_field(
      "room_id",
      None,
      decode.optional(decode.string),
    )
    use color <- decode.optional_field(
      "color",
      None,
      decode.optional(decode.string),
    )
    use surface <- decode.optional_field(
      "surface",
      None,
      decode.optional(decode.string),
    )
    use x <- decode.optional_field("x", None, decode.optional(decode.int))
    use y <- decode.optional_field("y", None, decode.optional(decode.int))
    use block_id <- decode.optional_field(
      "block_id",
      None,
      decode.optional(decode.string),
    )
    use block_kind <- decode.optional_field(
      "block_kind",
      None,
      decode.optional(decode.string),
    )
    use label <- decode.optional_field(
      "label",
      None,
      decode.optional(decode.string),
    )
    use start_at <- decode.optional_field(
      "start_at",
      None,
      decode.optional(decode.string),
    )
    use end_at <- decode.optional_field(
      "end_at",
      None,
      decode.optional(decode.string),
    )
    use lane_id <- decode.optional_field(
      "lane_id",
      None,
      decode.optional(decode.string),
    )
    use cadence <- decode.optional_field(
      "cadence",
      None,
      decode.optional(decode.string),
    )
    use checkup_id <- decode.optional_field(
      "checkup_id",
      None,
      decode.optional(decode.string),
    )
    use result <- decode.optional_field(
      "result",
      None,
      decode.optional(decode.string),
    )
    use window_id <- decode.optional_field(
      "window_id",
      None,
      decode.optional(decode.string),
    )
    use app_id <- decode.optional_field(
      "app_id",
      None,
      decode.optional(decode.string),
    )
    use url <- decode.optional_field(
      "url",
      None,
      decode.optional(decode.string),
    )
    use bounds <- decode.optional_field(
      "bounds",
      None,
      decode.optional(bounds_decoder),
    )
    use transparent <- decode.optional_field("transparent", False, decode.bool)
    use section_id <- decode.optional_field(
      "section_id",
      None,
      decode.optional(decode.string),
    )
    use parent_section_id <- decode.optional_field(
      "parent_section_id",
      None,
      decode.optional(decode.string),
    )
    use position <- decode.optional_field(
      "position",
      None,
      decode.optional(decode.int),
    )
    use title <- decode.optional_field(
      "title",
      None,
      decode.optional(decode.string),
    )
    use campaign_id <- decode.optional_field(
      "campaign_id",
      None,
      decode.optional(decode.string),
    )
    use queue_item_id <- decode.optional_field(
      "queue_item_id",
      None,
      decode.optional(decode.string),
    )
    use handoff_id <- decode.optional_field(
      "handoff_id",
      None,
      decode.optional(decode.string),
    )
    use problem_id <- decode.optional_field(
      "problem_id",
      None,
      decode.optional(decode.string),
    )
    use solution_id <- decode.optional_field(
      "solution_id",
      None,
      decode.optional(decode.string),
    )
    use swarm_id <- decode.optional_field(
      "swarm_id",
      None,
      decode.optional(decode.string),
    )
    use status <- decode.optional_field(
      "status",
      None,
      decode.optional(decode.string),
    )
    use goal <- decode.optional_field(
      "goal",
      None,
      decode.optional(decode.string),
    )
    use next <- decode.optional_field(
      "next",
      None,
      decode.optional(decode.string),
    )
    use refresh_by <- decode.optional_field(
      "refresh_by",
      None,
      decode.optional(decode.string),
    )
    use blocker <- decode.optional_field(
      "blocker",
      None,
      decode.optional(decode.string),
    )
    use verify <- decode.optional_field(
      "verify",
      None,
      decode.optional(decode.string),
    )
    use outcome <- decode.optional_field(
      "outcome",
      None,
      decode.optional(decode.string),
    )
    use from_actor <- decode.optional_field(
      "from",
      None,
      decode.optional(decode.string),
    )
    use to_actor <- decode.optional_field(
      "to",
      None,
      decode.optional(decode.string),
    )
    use needed <- decode.optional_field(
      "needed",
      None,
      decode.optional(decode.string),
    )
    use context <- decode.optional_field(
      "context",
      None,
      decode.optional(decode.string),
    )
    use relation <- decode.optional_field(
      "relation",
      None,
      decode.optional(decode.string),
    )
    use cause <- decode.optional_field(
      "cause",
      None,
      decode.optional(decode.string),
    )
    use recurs <- decode.optional_field(
      "recurs",
      None,
      decode.optional(decode.string),
    )
    use changed <- decode.optional_field(
      "changed",
      None,
      decode.optional(decode.string),
    )
    use verified <- decode.optional_field(
      "verified",
      None,
      decode.optional(decode.string),
    )
    use risks <- decode.optional_field(
      "risks",
      None,
      decode.optional(decode.string),
    )
    use category <- decode.optional_field(
      "category",
      None,
      decode.optional(decode.string),
    )
    use priority <- decode.optional_field(
      "priority",
      None,
      decode.optional(decode.string),
    )
    use question <- decode.optional_field(
      "question",
      None,
      decode.optional(decode.string),
    )
    use gac_id <- decode.optional_field(
      "gac_id",
      None,
      decode.optional(decode.string),
    )
    use result_action <- decode.optional_field(
      "result_action",
      None,
      decode.optional(decode.string),
    )
    use selected <- decode.optional_field(
      "selected",
      None,
      decode.optional(decode.string),
    )
    use freeform <- decode.optional_field(
      "freeform",
      None,
      decode.optional(decode.string),
    )
    use target <- decode.optional_field(
      "target",
      None,
      decode.optional(decode.string),
    )
    use description <- decode.optional_field(
      "description",
      None,
      decode.optional(decode.string),
    )
    use blocker_id <- decode.optional_field(
      "blocker_id",
      None,
      decode.optional(decode.string),
    )
    use aspiration_id <- decode.optional_field(
      "aspiration_id",
      None,
      decode.optional(decode.string),
    )
    use decision_id <- decode.optional_field(
      "decision_id",
      None,
      decode.optional(decode.string),
    )
    use timeframe <- decode.optional_field(
      "timeframe",
      None,
      decode.optional(decode.string),
    )
    use source_type <- decode.optional_field(
      "source_type",
      None,
      decode.optional(decode.string),
    )
    use origin_app <- decode.optional_field(
      "origin_app",
      None,
      decode.optional(decode.string),
    )
    use origin_text <- decode.optional_field(
      "origin_text",
      None,
      decode.optional(decode.string),
    )
    use supersedes <- decode.optional_field(
      "supersedes",
      None,
      decode.optional(decode.string),
    )
    use source_node <- decode.optional_field(
      "source_node",
      None,
      decode.optional(decode.string),
    )
    // L2 dispatch/exec/tool additive fields (humble-sketch lane:01KR0RQ6JK).
    use intent <- decode.optional_field(
      "intent",
      None,
      decode.optional(decode.string),
    )
    use dispatch_id <- decode.optional_field(
      "dispatch_id",
      None,
      decode.optional(decode.string),
    )
    use execution_id <- decode.optional_field(
      "execution_id",
      None,
      decode.optional(decode.string),
    )
    use provider <- decode.optional_field(
      "provider",
      None,
      decode.optional(decode.string),
    )
    use initiator <- decode.optional_field(
      "initiator",
      None,
      decode.optional(decode.string),
    )
    use exec_kind <- decode.optional_field(
      "exec_kind",
      None,
      decode.optional(decode.string),
    )
    use tool_name <- decode.optional_field(
      "tool_name",
      None,
      decode.optional(decode.string),
    )
    use args_json <- decode.optional_field(
      "args_json",
      None,
      decode.optional(decode.string),
    )
    use result_summary <- decode.optional_field(
      "result_summary",
      None,
      decode.optional(decode.string),
    )
    use error_class <- decode.optional_field(
      "error_class",
      None,
      decode.optional(decode.string),
    )
    use error_message <- decode.optional_field(
      "message",
      None,
      decode.optional(decode.string),
    )
    use duration_ms <- decode.optional_field(
      "duration_ms",
      None,
      decode.optional(decode.int),
    )
    use exit_code <- decode.optional_field(
      "exit_code",
      None,
      decode.optional(decode.int),
    )
    use timeout_ms <- decode.optional_field(
      "timeout_ms",
      None,
      decode.optional(decode.int),
    )
    use stdout_bytes <- decode.optional_field(
      "stdout_bytes",
      None,
      decode.optional(decode.int),
    )
    use stderr_bytes <- decode.optional_field(
      "stderr_bytes",
      None,
      decode.optional(decode.int),
    )
    use session_file_path <- decode.optional_field(
      "session_file_path",
      None,
      decode.optional(decode.string),
    )
    use prompt_hash <- decode.optional_field(
      "prompt_hash",
      None,
      decode.optional(decode.string),
    )
    use canon_id <- decode.optional_field(
      "canon_id",
      None,
      decode.optional(decode.string),
    )
    use canon_kind <- decode.optional_field(
      "canon_kind",
      None,
      decode.optional(decode.string),
    )
    use content_hash <- decode.optional_field(
      "content_hash",
      None,
      decode.optional(decode.string),
    )
    use source_kind <- decode.optional_field(
      "source_kind",
      None,
      decode.optional(decode.string),
    )
    use source_id <- decode.optional_field(
      "source_id",
      None,
      decode.optional(decode.string),
    )
    use approved_by_actor_id <- decode.optional_field(
      "approved_by_actor_id",
      None,
      decode.optional(decode.string),
    )
    use superseded_by_canon_id <- decode.optional_field(
      "superseded_by_canon_id",
      None,
      decode.optional(decode.string),
    )
    use links <- decode.optional_field(
      "links",
      [],
      decode.list(decode.string),
    )
    use read_scopes <- decode.optional_field(
      "read_scopes",
      [],
      decode.list(decode.string),
    )
    use write_scopes <- decode.optional_field(
      "write_scopes",
      [],
      decode.list(decode.string),
    )
    use call_scopes <- decode.optional_field(
      "call_scopes",
      [],
      decode.list(decode.string),
    )
    use secret_refs <- decode.optional_field(
      "secret_refs",
      [],
      decode.list(decode.string),
    )
    decode.success(IncomingArgs(
      document_id: document_id,
      body: option_or(body, text),
      frame_id: frame_id,
      revision: revision,
      after_revision: after_revision,
      created_at: created_at,
      name: name,
      device_id: device_id,
      org_id: org_id,
      space_id: space_id,
      project_id: project_id,
      mission_id: mission_id,
      target_kind: target_kind,
      target_value: target_value,
      role: role,
      expires_at: expires_at,
      invite_id: invite_id,
      accepted_by: accepted_by,
      accepted_device: accepted_device,
      access_point: access_point,
      challenge_id: challenge_id,
      user_id: user_id,
      google_sub: google_sub,
      email: email,
      display_name: display_name,
      email_verified: email_verified,
      secret_ref: secret_ref,
      pubkey: pubkey,
      bootstrap: bootstrap,
      attested_by: attested_by,
      capabilities: capabilities,
      offer_id: offer_id,
      short_code: short_code,
      confirmed_short_code: confirmed_short_code,
      peer_device: peer_device,
      peer_pubkey: peer_pubkey,
      local_pubkey: local_pubkey,
      ceremony_kind: ceremony_kind,
      ceremony_id: ceremony_id,
      lineage_proof: lineage_proof,
      approved_by_device: approved_by_device,
      session_id: session_id,
      reason: reason,
      scope: scope,
      done_when: done_when,
      depends_on: depends_on,
      blocked_by: blocked_by,
      source: source,
      scopes: scopes,
      actor_id: actor_id,
      room_id: room_id,
      color: color,
      surface: surface,
      x: x,
      y: y,
      block_id: block_id,
      block_kind: block_kind,
      label: label,
      start_at: start_at,
      end_at: end_at,
      lane_id: lane_id,
      cadence: cadence,
      checkup_id: checkup_id,
      result: result,
      window_id: window_id,
      app_id: app_id,
      url: url,
      bounds: bounds,
      transparent: transparent,
      section_id: section_id,
      parent_section_id: parent_section_id,
      position: position,
      title: title,
      campaign_id: campaign_id,
      queue_item_id: queue_item_id,
      handoff_id: handoff_id,
      problem_id: problem_id,
      solution_id: solution_id,
      swarm_id: swarm_id,
      status: status,
      goal: goal,
      next: next,
      refresh_by: refresh_by,
      blocker: blocker,
      verify: verify,
      outcome: outcome,
      from_actor: from_actor,
      to_actor: to_actor,
      needed: needed,
      context: context,
      relation: relation,
      cause: cause,
      recurs: recurs,
      changed: changed,
      verified: verified,
      risks: risks,
      category: category,
      priority: priority,
      question: question,
      gac_id: gac_id,
      result_action: result_action,
      selected: selected,
      freeform: freeform,
      target: target,
      description: description,
      blocker_id: blocker_id,
      aspiration_id: aspiration_id,
      decision_id: decision_id,
      timeframe: timeframe,
      source_type: source_type,
      origin_app: origin_app,
      origin_text: origin_text,
      supersedes: supersedes,
      source_node: source_node,
      intent: intent,
      dispatch_id: dispatch_id,
      execution_id: execution_id,
      provider: provider,
      initiator: initiator,
      exec_kind: exec_kind,
      tool_name: tool_name,
      args_json: args_json,
      result_summary: result_summary,
      error_class: error_class,
      error_message: error_message,
      duration_ms: duration_ms,
      exit_code: exit_code,
      timeout_ms: timeout_ms,
      stdout_bytes: stdout_bytes,
      stderr_bytes: stderr_bytes,
      session_file_path: session_file_path,
      prompt_hash: prompt_hash,
      canon_id: canon_id,
      canon_kind: canon_kind,
      content_hash: content_hash,
      source_kind: source_kind,
      source_id: source_id,
      approved_by_actor_id: approved_by_actor_id,
      superseded_by_canon_id: superseded_by_canon_id,
      links: links,
      read_scopes: read_scopes,
      write_scopes: write_scopes,
      call_scopes: call_scopes,
      secret_refs: secret_refs,
    ))
  }
  let decoder = {
    use id <- decode.field("id", decode.string)
    use kind <- decode.field("type", decode.string)
    use op <- decode.optional_field("op", None, decode.optional(decode.string))
    use channel <- decode.optional_field(
      "channel",
      None,
      decode.optional(decode.string),
    )
    use args <- decode.optional_field(
      "args",
      IncomingArgs(
        document_id: None,
        body: None,
        frame_id: None,
        revision: None,
        after_revision: None,
        created_at: None,
        name: None,
        device_id: None,
        org_id: None,
        space_id: None,
        project_id: None,
        mission_id: None,
        target_kind: None,
        target_value: None,
        role: None,
        expires_at: None,
        invite_id: None,
        accepted_by: None,
        accepted_device: None,
        access_point: None,
        challenge_id: None,
        user_id: None,
        google_sub: None,
        email: None,
        display_name: None,
        email_verified: False,
        secret_ref: None,
        pubkey: None,
        bootstrap: None,
        attested_by: None,
        capabilities: [],
        offer_id: None,
        short_code: None,
        confirmed_short_code: None,
        peer_device: None,
        peer_pubkey: None,
        local_pubkey: None,
        ceremony_kind: None,
        ceremony_id: None,
        lineage_proof: None,
        approved_by_device: None,
        session_id: None,
        reason: None,
        scope: None,
        done_when: None,
        depends_on: None,
        blocked_by: None,
        source: None,
        scopes: [],
        actor_id: None,
        room_id: None,
        color: None,
        surface: None,
        x: None,
        y: None,
        block_id: None,
        block_kind: None,
        label: None,
        start_at: None,
        end_at: None,
        lane_id: None,
        cadence: None,
        checkup_id: None,
        result: None,
        window_id: None,
        app_id: None,
        url: None,
        bounds: None,
        transparent: False,
        section_id: None,
        parent_section_id: None,
        position: None,
        title: None,
        campaign_id: None,
        queue_item_id: None,
        handoff_id: None,
        problem_id: None,
        solution_id: None,
        swarm_id: None,
        status: None,
        goal: None,
        next: None,
        refresh_by: None,
        blocker: None,
        verify: None,
        outcome: None,
        from_actor: None,
        to_actor: None,
        needed: None,
        context: None,
        relation: None,
        cause: None,
        recurs: None,
        changed: None,
        verified: None,
        risks: None,
        category: None,
        priority: None,
        question: None,
        gac_id: None,
        result_action: None,
        selected: None,
        freeform: None,
        target: None,
        description: None,
        blocker_id: None,
        aspiration_id: None,
        decision_id: None,
        timeframe: None,
        source_type: None,
        origin_app: None,
        origin_text: None,
        supersedes: None,
        source_node: None,
        intent: None,
        dispatch_id: None,
        execution_id: None,
        provider: None,
        initiator: None,
        exec_kind: None,
        tool_name: None,
        args_json: None,
        result_summary: None,
        error_class: None,
        error_message: None,
        duration_ms: None,
        exit_code: None,
        timeout_ms: None,
        stdout_bytes: None,
        stderr_bytes: None,
        session_file_path: None,
        prompt_hash: None,
        canon_id: None,
        canon_kind: None,
        content_hash: None,
        source_kind: None,
        source_id: None,
        approved_by_actor_id: None,
        superseded_by_canon_id: None,
        links: [],
        read_scopes: [],
        write_scopes: [],
        call_scopes: [],
        secret_refs: [],
      ),
      args_decoder,
    )
    decode.success(Incoming(
      id: id,
      kind: kind,
      op: op,
      channel: channel,
      document_id: args.document_id,
      body: args.body,
      frame_id: args.frame_id,
      revision: args.revision,
      after_revision: args.after_revision,
      created_at: args.created_at,
      name: args.name,
      device_id: args.device_id,
      org_id: args.org_id,
      space_id: args.space_id,
      project_id: args.project_id,
      mission_id: args.mission_id,
      target_kind: args.target_kind,
      target_value: args.target_value,
      role: args.role,
      expires_at: args.expires_at,
      invite_id: args.invite_id,
      accepted_by: args.accepted_by,
      accepted_device: args.accepted_device,
      access_point: args.access_point,
      challenge_id: args.challenge_id,
      user_id: args.user_id,
      google_sub: args.google_sub,
      email: args.email,
      display_name: args.display_name,
      email_verified: args.email_verified,
      secret_ref: args.secret_ref,
      pubkey: args.pubkey,
      bootstrap: args.bootstrap,
      attested_by: args.attested_by,
      capabilities: args.capabilities,
      offer_id: args.offer_id,
      short_code: args.short_code,
      confirmed_short_code: args.confirmed_short_code,
      peer_device: args.peer_device,
      peer_pubkey: args.peer_pubkey,
      local_pubkey: args.local_pubkey,
      ceremony_kind: args.ceremony_kind,
      ceremony_id: args.ceremony_id,
      lineage_proof: args.lineage_proof,
      approved_by_device: args.approved_by_device,
      session_id: args.session_id,
      reason: args.reason,
      scope: args.scope,
      done_when: args.done_when,
      depends_on: args.depends_on,
      blocked_by: args.blocked_by,
      source: args.source,
      scopes: args.scopes,
      actor_id: args.actor_id,
      room_id: args.room_id,
      color: args.color,
      surface: args.surface,
      x: args.x,
      y: args.y,
      block_id: args.block_id,
      block_kind: args.block_kind,
      label: args.label,
      start_at: args.start_at,
      end_at: args.end_at,
      lane_id: args.lane_id,
      cadence: args.cadence,
      checkup_id: args.checkup_id,
      result: args.result,
      window_id: args.window_id,
      app_id: args.app_id,
      url: args.url,
      bounds: args.bounds,
      transparent: args.transparent,
      section_id: args.section_id,
      parent_section_id: args.parent_section_id,
      position: args.position,
      title: args.title,
      campaign_id: args.campaign_id,
      queue_item_id: args.queue_item_id,
      handoff_id: args.handoff_id,
      problem_id: args.problem_id,
      solution_id: args.solution_id,
      swarm_id: args.swarm_id,
      status: args.status,
      goal: args.goal,
      next: args.next,
      refresh_by: args.refresh_by,
      blocker: args.blocker,
      verify: args.verify,
      outcome: args.outcome,
      from_actor: args.from_actor,
      to_actor: args.to_actor,
      needed: args.needed,
      context: args.context,
      relation: args.relation,
      cause: args.cause,
      recurs: args.recurs,
      changed: args.changed,
      verified: args.verified,
      risks: args.risks,
      category: args.category,
      priority: args.priority,
      question: args.question,
      gac_id: args.gac_id,
      result_action: args.result_action,
      selected: args.selected,
      freeform: args.freeform,
      target: args.target,
      description: args.description,
      blocker_id: args.blocker_id,
      aspiration_id: args.aspiration_id,
      decision_id: args.decision_id,
      timeframe: args.timeframe,
      source_type: args.source_type,
      origin_app: args.origin_app,
      origin_text: args.origin_text,
      supersedes: args.supersedes,
      source_node: args.source_node,
      intent: args.intent,
      dispatch_id: args.dispatch_id,
      execution_id: args.execution_id,
      provider: args.provider,
      initiator: args.initiator,
      exec_kind: args.exec_kind,
      tool_name: args.tool_name,
      args_json: args.args_json,
      result_summary: args.result_summary,
      error_class: args.error_class,
      error_message: args.error_message,
      duration_ms: args.duration_ms,
      exit_code: args.exit_code,
      timeout_ms: args.timeout_ms,
      stdout_bytes: args.stdout_bytes,
      stderr_bytes: args.stderr_bytes,
      session_file_path: args.session_file_path,
      prompt_hash: args.prompt_hash,
      canon_id: args.canon_id,
      canon_kind: args.canon_kind,
      content_hash: args.content_hash,
      source_kind: args.source_kind,
      source_id: args.source_id,
      approved_by_actor_id: args.approved_by_actor_id,
      superseded_by_canon_id: args.superseded_by_canon_id,
      links: args.links,
      read_scopes: args.read_scopes,
      write_scopes: args.write_scopes,
      call_scopes: args.call_scopes,
      secret_refs: args.secret_refs,
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
      #("daemon_version", json.string("0.0.6-dev")),
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

fn command_ok_resource(
  in_reply_to: String,
  resource_id: String,
  event_ids: List(String),
) -> String {
  json.to_string(
    json.object([
      #("v", json.int(0)),
      #("type", json.string("command_result")),
      #("in_reply_to", json.string(in_reply_to)),
      #("ok", json.bool(True)),
      #("events", json.preprocessed_array(list.map(event_ids, json.string))),
      #("resource", json.string(resource_id)),
    ]),
  )
}

// Soft phase enforcement (T3.1): wraps command_ok_resource and attaches a
// `warning` field when the current vcalendar phase is incompatible with
// the op. The write itself always proceeds — this is observation-only.
fn command_ok_with_warning(
  in_reply_to: String,
  resource_id: String,
  event_ids: List(String),
  warning: option.Option(String),
) -> String {
  case warning {
    option.None -> command_ok_resource(in_reply_to, resource_id, event_ids)
    option.Some(message) ->
      json.to_string(
        json.object([
          #("v", json.int(0)),
          #("type", json.string("command_result")),
          #("in_reply_to", json.string(in_reply_to)),
          #("ok", json.bool(True)),
          #("events", json.preprocessed_array(list.map(event_ids, json.string))),
          #("resource", json.string(resource_id)),
          #(
            "warning",
            json.object([
              #("class", json.string("phase_violation")),
              #("message", json.string(message)),
            ]),
          ),
        ]),
      )
  }
}

// Read the current canonical phase (best-effort, returns "" on failure).
fn current_phase(bus_subj: Subject(bus.Msg)) -> String {
  let raw = bus.vcalendar_projection_json(bus_subj)
  extract_string_field(raw, "current_phase")
}

// Tiny string-field extractor for the projection JSON. We only need this
// shape from the daemon — no full JSON parse needed.
fn extract_string_field(json_str: String, key: String) -> String {
  let pattern = "\"" <> key <> "\":\""
  case string.split_once(json_str, pattern) {
    Ok(#(_, after)) ->
      case string.split_once(after, "\"") {
        Ok(#(value, _)) -> value
        Error(_) -> ""
      }
    Error(_) -> ""
  }
}

// Returns Some(reason) if the op is incompatible with the phase, None otherwise.
fn phase_violation_for(op: String, phase: String) -> option.Option(String) {
  case phase {
    "" -> option.None
    "intake and orientation" -> option.None
    "planning and lane claim" -> option.None
    "execution block" -> option.None
    "review and checkup" ->
      case op {
        "lane.close" -> option.None
        "lane.move" -> option.None
        "handoff.request"
        | "handoff.accept"
        | "handoff.reject"
        | "handoff.complete" -> option.None
        "checkup.schedule" | "checkup.complete" -> option.None
        _ ->
          option.Some(
            "phase 'review and checkup' typically does not accept '"
            <> op
            <> "'; logged as incident.noted",
          )
      }
    "handoff and next-day queue" ->
      case op {
        "handoff.request"
        | "handoff.accept"
        | "handoff.reject"
        | "handoff.complete" -> option.None
        "checkup.schedule" | "checkup.complete" -> option.None
        "queue.add" | "queue.ready" | "queue.block" | "queue.close" ->
          option.None
        _ ->
          option.Some(
            "phase 'handoff and next-day queue' typically does not accept '"
            <> op
            <> "'; logged as incident.noted",
          )
      }
    _ -> option.None
  }
}

// Emit incident.noted when phase is violated. Returns the warning message
// to attach to the response, or None when no warning is needed. Any error
// in this path is swallowed — the canonical write has already succeeded.
fn emit_phase_warning_if_needed(
  bus_subj: Subject(bus.Msg),
  op: String,
) -> option.Option(String) {
  let phase = current_phase(bus_subj)
  case phase_violation_for(op, phase) {
    option.None -> option.None
    option.Some(message) -> {
      let _ =
        agent_workspace.append_event(
          bus_subj,
          "org:01J00000000000000000000001",
          "actor:agent:phase-watch",
          "incident.noted",
          "incident:phase_violation",
          option.None,
          [
            #("kind", json.string("phase_violation")),
            #("phase", json.string(phase)),
            #("op", json.string(op)),
          ],
        )
      option.Some(message)
    }
  }
}

fn command_data(
  in_reply_to: String,
  name: String,
  data_json: String,
) -> String {
  "{\"v\":0,\"type\":\"command_result\",\"in_reply_to\":\""
  <> json_escape_inline(in_reply_to)
  <> "\",\"ok\":true,\"data\":{\"name\":\""
  <> json_escape_inline(name)
  <> "\",\"value\":"
  <> data_json
  <> "}}"
}

fn handle_pipeline_event(
  conn: mist.WebsocketConnection,
  state: ConnState,
  incoming: Incoming,
  kind: String,
  resource_id: Option(String),
  fields: List(#(String, json.Json)),
) -> mist.Next(ConnState, WsCustom) {
  case incoming.org_id, resource_id {
    Some(org_id), Some(id) -> {
      case
        agent_workspace.append_event(
          state.bus_subject,
          org_id,
          actor_or_default(incoming),
          kind,
          id,
          incoming.project_id,
          fields,
        )
      {
        Ok(agent_workspace.WorkspaceEvent(resource_id, event_id)) -> {
          let _ =
            mist.send_text_frame(
              conn,
              command_ok_resource(incoming.id, resource_id, [event_id]),
            )
          let _ =
            send_projection_snapshot(
              conn,
              state.bus_subject,
              state.collab_subject,
              Some("event_trail"),
            )
          mist.continue(state)
        }
        Error(e) -> {
          let _ = mist.send_text_frame(conn, workspace_error(incoming.id, e))
          mist.continue(state)
        }
      }
    }
    _, _ -> {
      let _ =
        mist.send_text_frame(
          conn,
          err(incoming.id, "invalid_args", "missing args.org_id or resource id"),
        )
      mist.continue(state)
    }
  }
}

fn handle_proposal_decision(
  conn: mist.WebsocketConnection,
  state: ConnState,
  incoming: Incoming,
  kind: String,
  actor_key: String,
  timestamp_key: String,
  update_intent: Bool,
) -> mist.Next(ConnState, WsCustom) {
  case incoming.org_id, incoming.target, incoming.actor_id, incoming.reason {
    Some(org_id), Some(proposal_id), Some(actor_id), Some(rationale) -> {
      case update_intent, incoming.intent {
        True, None -> {
          let _ =
            mist.send_text_frame(
              conn,
              err(incoming.id, "invalid_args", "missing args.intent"),
            )
          mist.continue(state)
        }
        _, intent_id -> {
          let now = iso_now()
          case
            agent_workspace.append_event(
              state.bus_subject,
              org_id,
              actor_id,
              kind,
              proposal_id,
              incoming.project_id,
              [
                #("proposal_id", json.string(proposal_id)),
                #(actor_key, json.string(actor_id)),
                #("rationale", json.string(rationale)),
                #(timestamp_key, json.string(now)),
              ],
            )
          {
            Ok(agent_workspace.WorkspaceEvent(_, event_id)) -> {
              case update_intent, intent_id {
                True, Some(parent_intent_id) ->
                  append_intent_acceptance(
                    conn,
                    state,
                    incoming,
                    org_id,
                    actor_id,
                    parent_intent_id,
                    rationale,
                    now,
                    event_id,
                  )
                _, _ -> {
                  let _ =
                    mist.send_text_frame(
                      conn,
                      command_ok_resource(incoming.id, proposal_id, [event_id]),
                    )
                  let _ =
                    send_projection_snapshot(
                      conn,
                      state.bus_subject,
                      state.collab_subject,
                      Some("event_trail"),
                    )
                  mist.continue(state)
                }
              }
            }
            Error(e) -> {
              let _ =
                mist.send_text_frame(conn, workspace_error(incoming.id, e))
              mist.continue(state)
            }
          }
        }
      }
    }
    _, _, _, _ -> {
      let _ =
        mist.send_text_frame(
          conn,
          err(
            incoming.id,
            "invalid_args",
            "missing args.org_id, args.target, args.actor_id, or args.reason",
          ),
        )
      mist.continue(state)
    }
  }
}

fn append_intent_acceptance(
  conn: mist.WebsocketConnection,
  state: ConnState,
  incoming: Incoming,
  org_id: String,
  actor_id: String,
  intent_id: String,
  rationale: String,
  now: String,
  proposal_event_id: String,
) -> mist.Next(ConnState, WsCustom) {
  case
    agent_workspace.append_event(
      state.bus_subject,
      org_id,
      actor_id,
      "intent.updated",
      intent_id,
      incoming.project_id,
      [
        #("intent_id", json.string(intent_id)),
        #("changed_fields", json.preprocessed_array([json.string("status")])),
        #("actor_id", json.string(actor_id)),
        #("updated_at", json.string(now)),
        #("reason", json.string("proposal approved: " <> rationale)),
        #("status", json.string("accepted")),
      ],
    )
  {
    Ok(agent_workspace.WorkspaceEvent(_, intent_event_id)) -> {
      let _ =
        mist.send_text_frame(
          conn,
          command_ok_resource(incoming.id, intent_id, [
            proposal_event_id,
            intent_event_id,
          ]),
        )
      let _ =
        send_projection_snapshot(
          conn,
          state.bus_subject,
          state.collab_subject,
          Some("event_trail"),
        )
      mist.continue(state)
    }
    Error(e) -> {
      let _ = mist.send_text_frame(conn, workspace_error(incoming.id, e))
      mist.continue(state)
    }
  }
}

fn handle_workspace_event(
  conn: mist.WebsocketConnection,
  state: ConnState,
  incoming: Incoming,
  kind: String,
  resource_key: String,
  resource_id: Option(String),
  projection: Option(String),
  fields: List(#(String, json.Json)),
) -> mist.Next(ConnState, WsCustom) {
  case incoming.org_id, resource_id {
    Some(org_id), Some(id) -> {
      let resource_kind = case resource_key {
        "lane_id" -> "lane"
        "queue_item_id" -> "queue_item"
        _ -> ""
      }
      case
        resource_kind == ""
        || bus.workspace_resource_exists(
          state.bus_subject,
          resource_kind,
          id,
          org_id,
        )
      {
        False -> {
          let _ =
            mist.send_text_frame(
              conn,
              err(
                incoming.id,
                "not_found",
                resource_kind <> " not found: " <> id,
              ),
            )
          mist.continue(state)
        }
        True -> {
          case
            agent_workspace.append_event(
              state.bus_subject,
              org_id,
              actor_or_default(incoming),
              kind,
              id,
              incoming.project_id,
              fields,
            )
          {
            Ok(agent_workspace.WorkspaceEvent(resource_id, event_id)) -> {
              let _ =
                mist.send_text_frame(
                  conn,
                  command_ok_resource(incoming.id, resource_id, [event_id]),
                )
              let _ =
                send_projection_snapshot(
                  conn,
                  state.bus_subject,
                  state.collab_subject,
                  Some("event_trail"),
                )
              let _ =
                send_projection_snapshot(
                  conn,
                  state.bus_subject,
                  state.collab_subject,
                  projection,
                )
              mist.continue(state)
            }
            Error(e) -> {
              let _ =
                mist.send_text_frame(conn, workspace_error(incoming.id, e))
              mist.continue(state)
            }
          }
        }
      }
    }
    _, _ -> {
      let _ =
        mist.send_text_frame(
          conn,
          err(incoming.id, "invalid_args", "missing org_id or resource id"),
        )
      mist.continue(state)
    }
  }
}

fn handle_planner_result(
  state: ConnState,
  conn: mist.WebsocketConnection,
  bus_subj: Subject(bus.Msg),
  collab_subj: Subject(ema_collab.Msg),
  in_reply_to: String,
  result: Result(a, planner_nodes.PlannerError),
  unpack: fn(a) -> #(String, String),
) -> ConnState {
  case result {
    Ok(value) -> {
      let #(resource_id, event_id) = unpack(value)
      let _ =
        mist.send_text_frame(
          conn,
          command_ok_resource(in_reply_to, resource_id, [event_id]),
        )
      let _ =
        send_projection_snapshot(
          conn,
          bus_subj,
          collab_subj,
          Some("event_trail"),
        )
      let _ =
        send_projection_snapshot(
          conn,
          bus_subj,
          collab_subj,
          Some("blueprint.planner"),
        )
      state
    }
    Error(e) -> {
      let _ = mist.send_text_frame(conn, planner_error(in_reply_to, e))
      state
    }
  }
}

fn actor_or_default(incoming: Incoming) -> String {
  case incoming.actor_id {
    Some(actor_id) -> actor_id
    None -> "actor:dev-console"
  }
}

fn bool_from_option(value: Option(String), fallback: Bool) -> Bool {
  case value {
    Some(raw) ->
      case string.trim(raw) {
        "false" | "0" | "no" -> False
        _ -> True
      }
    None -> fallback
  }
}

fn csv_json_array(value: Option(String)) -> json.Json {
  case value {
    Some(raw) -> {
      let items =
        raw
        |> string.split(",")
        |> list.filter_map(fn(part) {
          case string.trim(part) {
            "" -> Error(Nil)
            clean -> Ok(json.string(clean))
          }
        })
      json.preprocessed_array(items)
    }
    None -> json.preprocessed_array([])
  }
}

fn required_json(value: Option(String)) -> json.Json {
  case value {
    Some(s) -> json.string(s)
    None -> json.null()
  }
}

fn title_json(incoming: Incoming) -> json.Json {
  case incoming.title {
    Some(title) -> json.string(title)
    None ->
      case incoming.name {
        Some(name) -> json.string(name)
        None -> json.null()
      }
  }
}

fn companion_window_request(incoming: Incoming) -> ema_companion.WindowRequest {
  let app_id = ema_companion.normalize_app_id(incoming.app_id)

  ema_companion.WindowRequest(
    window_id: companion_window_id_from(incoming),
    app_id: app_id,
    url: ema_companion.normalize_url(incoming.url, app_id),
    bounds: incoming.bounds,
    transparent: incoming.transparent,
  )
}

fn companion_window_id_from(incoming: Incoming) -> String {
  ema_companion.normalize_window_id(incoming.window_id, incoming.id)
}

fn presence_join_request(incoming: Incoming) -> ema_presence.JoinRequest {
  ema_presence.JoinRequest(
    org_id: string_or(incoming.org_id, "org:local"),
    space_id: string_or(incoming.space_id, "space:local"),
    room_id: string_or(incoming.room_id, "desktop_room:default"),
    session_id: presence_session_id_from(incoming),
    actor_id: string_or(incoming.actor_id, "actor:dev-console"),
    display_name: string_or(incoming.display_name, "Codex"),
    color: string_or(incoming.color, "#5eead4"),
  )
}

fn presence_cursor_request(incoming: Incoming) -> ema_presence.CursorRequest {
  ema_presence.CursorRequest(
    org_id: string_or(incoming.org_id, "org:local"),
    space_id: string_or(incoming.space_id, "space:local"),
    room_id: string_or(incoming.room_id, "desktop_room:default"),
    session_id: presence_session_id_from(incoming),
    actor_id: string_or(incoming.actor_id, "actor:dev-console"),
    display_name: string_or(incoming.display_name, "Codex"),
    color: string_or(incoming.color, "#5eead4"),
    x: int_or(incoming.x, 0),
    y: int_or(incoming.y, 0),
    surface: string_or(incoming.surface, "desktop"),
    window_id: incoming.window_id,
    app_id: incoming.app_id,
  )
}

fn presence_location_request(
  incoming: Incoming,
) -> ema_presence.LocationRequest {
  let app_id = string_or(incoming.app_id, "unknown")
  ema_presence.LocationRequest(
    org_id: string_or(incoming.org_id, "org:local"),
    space_id: string_or(incoming.space_id, "space:local"),
    room_id: string_or(incoming.room_id, "desktop_room:default"),
    session_id: presence_session_id_from(incoming),
    actor_id: string_or(incoming.actor_id, "actor:dev-console"),
    display_name: string_or(incoming.display_name, "Codex"),
    color: string_or(incoming.color, "#5eead4"),
    window_id: incoming.window_id,
    app_id: app_id,
    label: string_or(incoming.label, app_id),
  )
}

fn presence_session_id_from(incoming: Incoming) -> String {
  string_or(incoming.session_id, "presence:" <> incoming.id)
}

fn string_or(value: Option(String), fallback: String) -> String {
  case value {
    Some(raw) ->
      case string.trim(raw) {
        "" -> fallback
        clean -> clean
      }
    None -> fallback
  }
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

fn blueprint_title(incoming: Incoming) -> Option(String) {
  case incoming.title {
    Some(t) -> Some(t)
    None -> incoming.name
  }
}

fn blueprint_position(incoming: Incoming) -> Int {
  case incoming.position {
    Some(p) -> p
    None -> 0
  }
}

fn blueprint_actor_id(incoming: Incoming) -> String {
  case incoming.actor_id {
    Some(actor_id) -> actor_id
    None -> "actor:dev-console"
  }
}

fn blueprint_error(
  in_reply_to: String,
  error: ema_blueprint.BlueprintError,
) -> String {
  case error {
    ema_blueprint.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
    _ -> err(in_reply_to, "invalid_args", ema_blueprint.describe_error(error))
  }
}

fn planner_error(
  in_reply_to: String,
  error: planner_nodes.PlannerError,
) -> String {
  case error {
    planner_nodes.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
    _ -> err(in_reply_to, "invalid_args", planner_nodes.describe_error(error))
  }
}

fn membership_error(
  in_reply_to: String,
  error: ema_memberships.MembershipError,
) -> String {
  case error {
    ema_memberships.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    ema_memberships.EmptyUser ->
      err(in_reply_to, "invalid_args", "user_id is required")
    ema_memberships.InvalidRole(role) ->
      err(in_reply_to, "invalid_args", "invalid role " <> role)
    ema_memberships.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn invite_error(in_reply_to: String, error: ema_invites.InviteError) -> String {
  case error {
    ema_invites.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    ema_invites.EmptyInvite ->
      err(in_reply_to, "invalid_args", "invite_id is required")
    ema_invites.EmptyTarget ->
      err(in_reply_to, "invalid_args", "invite target is required")
    ema_invites.EmptyUser ->
      err(in_reply_to, "invalid_args", "accepted_by is required")
    ema_invites.EmptyDevice ->
      err(in_reply_to, "invalid_args", "accepted_device is required")
    ema_invites.EmptyExpiry ->
      err(in_reply_to, "invalid_args", "expires_at is required")
    ema_invites.InvalidRole(role) ->
      err(in_reply_to, "invalid_args", "invalid role " <> role)
    ema_invites.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn vcalendar_error(
  in_reply_to: String,
  error: ema_vcalendar.VcalendarError,
) -> String {
  case error {
    ema_vcalendar.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    ema_vcalendar.EmptyActor ->
      err(in_reply_to, "invalid_args", "actor_id is required")
    ema_vcalendar.EmptyBlockKind ->
      err(in_reply_to, "invalid_args", "block_kind is required")
    ema_vcalendar.EmptyLabel ->
      err(in_reply_to, "invalid_args", "label is required")
    ema_vcalendar.EmptyBlockId ->
      err(in_reply_to, "invalid_args", "block_id is required")
    ema_vcalendar.EmptyStartAt ->
      err(in_reply_to, "invalid_args", "start_at is required")
    ema_vcalendar.EmptyPhase ->
      err(in_reply_to, "invalid_args", "phase label is required")
    ema_vcalendar.EmptyLaneId ->
      err(in_reply_to, "invalid_args", "lane_id is required")
    ema_vcalendar.EmptyCadence ->
      err(in_reply_to, "invalid_args", "cadence is required")
    ema_vcalendar.EmptyCheckupId ->
      err(in_reply_to, "invalid_args", "checkup_id is required")
    ema_vcalendar.EmptyResult ->
      err(in_reply_to, "invalid_args", "result is required")
    ema_vcalendar.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn workspace_error(
  in_reply_to: String,
  error: agent_workspace.WorkspaceError,
) -> String {
  case error {
    agent_workspace.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    agent_workspace.EmptyActor ->
      err(in_reply_to, "invalid_args", "actor_id is required")
    agent_workspace.EmptyTitle ->
      err(in_reply_to, "invalid_args", "title/name is required")
    agent_workspace.EmptyWhy ->
      err(in_reply_to, "invalid_args", "why/reason is required")
    agent_workspace.EmptyLaneId ->
      err(in_reply_to, "invalid_args", "lane_id is required")
    agent_workspace.EmptyQueueItemId ->
      err(in_reply_to, "invalid_args", "queue_item_id is required")
    agent_workspace.EmptyScope ->
      err(in_reply_to, "invalid_args", "scope is required")
    agent_workspace.EmptyGoal ->
      err(in_reply_to, "invalid_args", "goal is required")
    agent_workspace.EmptyNext ->
      err(in_reply_to, "invalid_args", "next is required")
    agent_workspace.EmptyReason ->
      err(in_reply_to, "invalid_args", "reason is required")
    agent_workspace.EmptyStatus ->
      err(in_reply_to, "invalid_args", "status is required")
    agent_workspace.EmptyBlockedBy ->
      err(in_reply_to, "invalid_args", "blocked_by is required")
    agent_workspace.InvalidStatus(value) ->
      err(in_reply_to, "invalid_args", "invalid status " <> value)
    agent_workspace.InvalidCadence(value) ->
      err(in_reply_to, "invalid_args", "invalid cadence " <> value)
    agent_workspace.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn dispatch_error(
  in_reply_to: String,
  error: ema_dispatch.DispatchError,
) -> String {
  case error {
    ema_dispatch.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    ema_dispatch.EmptyActor ->
      err(in_reply_to, "invalid_args", "actor is required")
    ema_dispatch.EmptyIntent ->
      err(in_reply_to, "invalid_args", "intent is required")
    ema_dispatch.EmptyDispatchId ->
      err(in_reply_to, "invalid_args", "dispatch_id is required")
    ema_dispatch.EmptyOutcome ->
      err(in_reply_to, "invalid_args", "outcome is required")
    ema_dispatch.EmptyScope ->
      err(
        in_reply_to,
        "invalid_args",
        "scope must include at least one of read_scopes/write_scopes/call_scopes/secret_refs",
      )
    ema_dispatch.InvalidOutcome(value) ->
      err(in_reply_to, "invalid_args", "invalid outcome " <> value)
    ema_dispatch.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn exec_error(in_reply_to: String, error: ema_exec.ExecError) -> String {
  case error {
    ema_exec.EmptyOrg -> err(in_reply_to, "invalid_args", "org_id is required")
    ema_exec.EmptyActor -> err(in_reply_to, "invalid_args", "actor is required")
    ema_exec.EmptyDispatchId ->
      err(in_reply_to, "invalid_args", "dispatch_id is required")
    ema_exec.EmptyExecutionId ->
      err(in_reply_to, "invalid_args", "execution_id is required")
    ema_exec.EmptyKind -> err(in_reply_to, "invalid_args", "exec_kind is required")
    ema_exec.EmptyName -> err(in_reply_to, "invalid_args", "name is required")
    ema_exec.EmptyToolName ->
      err(in_reply_to, "invalid_args", "tool_name is required")
    ema_exec.EmptyArgsJson ->
      err(in_reply_to, "invalid_args", "args_json is required")
    ema_exec.EmptyResultSummary ->
      err(in_reply_to, "invalid_args", "result_summary is required")
    ema_exec.EmptyErrorClass ->
      err(in_reply_to, "invalid_args", "error_class is required")
    ema_exec.EmptyMessage ->
      err(in_reply_to, "invalid_args", "message is required")
    ema_exec.EmptyOutcome ->
      err(in_reply_to, "invalid_args", "outcome is required")
    ema_exec.EmptyPriorStatus ->
      err(in_reply_to, "invalid_args", "prior_status is required")
    ema_exec.InvalidKind(value) ->
      err(in_reply_to, "invalid_args", "invalid exec_kind " <> value)
    ema_exec.InvalidOutcome(value) ->
      err(in_reply_to, "invalid_args", "invalid outcome " <> value)
    ema_exec.InvalidErrorClass(value) ->
      err(in_reply_to, "invalid_args", "invalid error_class " <> value)
    ema_exec.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn artifact_error(
  in_reply_to: String,
  error: ema_artifact.ArtifactError,
) -> String {
  let reason = ema_artifact.describe_error(error)
  case error {
    ema_artifact.AppendFailed(_) -> err(in_reply_to, "internal", reason)
    ema_artifact.StorageFailed(_) -> err(in_reply_to, "internal", reason)
    _ -> err(in_reply_to, "invalid_args", reason)
  }
}

fn canon_error(in_reply_to: String, error: ema_canon.CanonError) -> String {
  let reason = ema_canon.describe_error(error)
  case error {
    ema_canon.AppendFailed(_) -> err(in_reply_to, "internal", reason)
    _ -> err(in_reply_to, "invalid_args", reason)
  }
}

fn identity_error(
  in_reply_to: String,
  error: ema_identity.IdentityError,
) -> String {
  case error {
    ema_identity.EmptyUser ->
      err(in_reply_to, "invalid_args", "user_id is required")
    ema_identity.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    ema_identity.EmptyDevice ->
      err(in_reply_to, "invalid_args", "device_id is required")
    ema_identity.EmptyGoogleSub ->
      err(in_reply_to, "invalid_args", "google_sub is required")
    ema_identity.EmptyEmail ->
      err(in_reply_to, "invalid_args", "email is required")
    ema_identity.EmptyDisplayName ->
      err(in_reply_to, "invalid_args", "display_name is required")
    ema_identity.EmptyName ->
      err(in_reply_to, "invalid_args", "device name is required")
    ema_identity.EmptyPubkey ->
      err(in_reply_to, "invalid_args", "pubkey is required")
    ema_identity.EmptySecretRef ->
      err(in_reply_to, "invalid_args", "secret_ref is required")
    ema_identity.InvalidBootstrap(value) ->
      err(in_reply_to, "invalid_args", "invalid bootstrap " <> value)
    ema_identity.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn device_key_error(
  in_reply_to: String,
  error: ema_device_keys.DeviceKeyError,
) -> String {
  case error {
    ema_device_keys.KeyGenerationFailed(reason) ->
      err(in_reply_to, "internal", "device key generation failed: " <> reason)
    ema_device_keys.KeyStorageFailed(reason) ->
      err(in_reply_to, "internal", "device key storage failed: " <> reason)
    ema_device_keys.SigningFailed(reason) ->
      err(in_reply_to, "internal", "device key signing failed: " <> reason)
    ema_device_keys.RegisterFailed(identity) ->
      identity_error(in_reply_to, identity)
  }
}

fn pairing_error(
  in_reply_to: String,
  error: ema_pairing.PairingError,
) -> String {
  case error {
    ema_pairing.EmptyOffer ->
      err(in_reply_to, "invalid_args", "offer_id is required")
    ema_pairing.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    ema_pairing.EmptyUser ->
      err(in_reply_to, "invalid_args", "user_id is required")
    ema_pairing.EmptyDevice ->
      err(in_reply_to, "invalid_args", "device_id is required")
    ema_pairing.EmptyName ->
      err(in_reply_to, "invalid_args", "device name is required")
    ema_pairing.EmptyPubkey ->
      err(in_reply_to, "invalid_args", "pubkey is required")
    ema_pairing.EmptyShortCode ->
      err(in_reply_to, "invalid_args", "short_code is required")
    ema_pairing.EmptyAttester ->
      err(in_reply_to, "invalid_args", "attested_by is required")
    ema_pairing.ShortCodeMismatch ->
      err(in_reply_to, "invalid_args", "confirmed_short_code does not match")
    ema_pairing.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn peer_error(in_reply_to: String, error: ema_peers.PeerTrustError) -> String {
  case error {
    ema_peers.EmptyOrg -> err(in_reply_to, "invalid_args", "org_id is required")
    ema_peers.EmptyPeerDevice ->
      err(in_reply_to, "invalid_args", "peer_device is required")
    ema_peers.EmptyPeerPubkey ->
      err(in_reply_to, "invalid_args", "peer_pubkey is required")
    ema_peers.EmptyLocalPubkey ->
      err(in_reply_to, "invalid_args", "local_pubkey is required")
    ema_peers.EmptyCeremony ->
      err(in_reply_to, "invalid_args", "ceremony_id is required")
    ema_peers.EmptyLineageProof ->
      err(in_reply_to, "invalid_args", "lineage_proof is required")
    ema_peers.InvalidCeremony(value) ->
      err(in_reply_to, "invalid_args", "invalid ceremony_kind " <> value)
    ema_peers.AppendFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn collab_sync_error(
  in_reply_to: String,
  error: ema_collab_sync.CollabSyncError,
) -> String {
  case error {
    ema_collab_sync.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    ema_collab_sync.EmptyPeer ->
      err(in_reply_to, "invalid_args", "peer_device is required")
    ema_collab_sync.PeerNotTrusted ->
      err(in_reply_to, "forbidden", "peer is not trusted for this org")
    ema_collab_sync.CollabFailed(collab_error_value) ->
      collab_error(in_reply_to, collab_error_value)
  }
}

fn access_session_error(
  in_reply_to: String,
  error: ema_access_sessions.AccessSessionError,
) -> String {
  case error {
    ema_access_sessions.EmptyOrg ->
      err(in_reply_to, "invalid_args", "org_id is required")
    ema_access_sessions.EmptyChallenge ->
      err(in_reply_to, "invalid_args", "challenge_id is required")
    ema_access_sessions.EmptySession ->
      err(in_reply_to, "invalid_args", "session_id is required")
    ema_access_sessions.EmptyUser ->
      err(in_reply_to, "invalid_args", "user_id is required")
    ema_access_sessions.EmptyDevice ->
      err(in_reply_to, "invalid_args", "approved_by_device is required")
    ema_access_sessions.EmptyAccessPoint ->
      err(in_reply_to, "invalid_args", "access_point is required")
    ema_access_sessions.EmptyExpiry ->
      err(in_reply_to, "invalid_args", "expires_at is required")
    ema_access_sessions.EmptyScopes ->
      err(in_reply_to, "invalid_args", "at least one scope is required")
    ema_access_sessions.AppendFailed(reason) ->
      err(in_reply_to, "internal", reason)
  }
}

fn collab_error(in_reply_to: String, error: ema_collab.CollabError) -> String {
  case error {
    ema_collab.EmptyDocument ->
      err(in_reply_to, "invalid_args", "target.id is required")
    ema_collab.EmptyPeer ->
      err(in_reply_to, "invalid_args", "peer_device_id is required")
    ema_collab.PersistenceFailed(reason) -> err(in_reply_to, "internal", reason)
  }
}

fn document_id_from(incoming: Incoming) -> String {
  case incoming.document_id {
    Some(document_id) -> document_id
    None -> ema_collab.default_document_id
  }
}

fn actor_id_from(incoming: Incoming) -> String {
  case incoming.user_id {
    Some(user_id) -> user_id
    None -> "actor:dev-console"
  }
}

fn lineage_proof_from(
  incoming: Incoming,
  peer_pubkey: String,
  local_pubkey: String,
  org_id: String,
  ceremony_id: String,
) -> Result(String, ema_device_keys.DeviceKeyError) {
  case incoming.lineage_proof {
    Some(lineage_proof) -> Ok(lineage_proof)
    None ->
      case incoming.device_id {
        Some(device_id) ->
          ema_device_keys.sign_lineage_proof(
            device_id,
            peer_pubkey,
            local_pubkey,
            org_id,
            ceremony_id,
          )
        None ->
          Error(ema_device_keys.SigningFailed(
            "missing args.lineage_proof or args.device_id",
          ))
      }
  }
}

fn option_or(primary: Option(a), fallback: Option(a)) -> Option(a) {
  case primary {
    Some(_) -> primary
    None -> fallback
  }
}

fn int_or(primary: Option(Int), fallback: Int) -> Int {
  case primary {
    Some(value) -> value
    None -> fallback
  }
}

fn json_escape_inline(value: String) -> String {
  value
  |> string.replace(each: "\\", with: "\\\\")
  |> string.replace(each: "\"", with: "\\\"")
  |> string.replace(each: "\n", with: "\\n")
  |> string.replace(each: "\r", with: "\\r")
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

fn scoped_lane_registry(
  scope: Option(String),
  bus_subj: Subject(bus.Msg),
) -> String {
  case scope {
    Some(project_id) ->
      bus.lane_registry_projection_json_scoped(bus_subj, project_id)
    None -> bus.lane_registry_projection_json(bus_subj)
  }
}

fn scoped_queue_registry(
  scope: Option(String),
  bus_subj: Subject(bus.Msg),
) -> String {
  case scope {
    Some(project_id) ->
      bus.queue_registry_projection_json_scoped(bus_subj, project_id)
    None -> bus.queue_registry_projection_json(bus_subj)
  }
}

fn send_projection_snapshot(
  conn: mist.WebsocketConnection,
  bus_subj: Subject(bus.Msg),
  collab_subj: Subject(ema_collab.Msg),
  channel: Option(String),
) -> Nil {
  send_projection_snapshot_scoped(conn, bus_subj, collab_subj, channel, None)
}

fn send_projection_snapshot_scoped(
  conn: mist.WebsocketConnection,
  bus_subj: Subject(bus.Msg),
  collab_subj: Subject(ema_collab.Msg),
  channel: Option(String),
  scope: Option(String),
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
    Some("access_session.current") ->
      send_projection(
        conn,
        "access_session.current",
        bus.access_session_projection_json(bus_subj),
      )
    Some("device.registry") ->
      send_projection(
        conn,
        "device.registry",
        bus.device_projection_json(bus_subj),
      )
    Some("peer.trust") ->
      send_projection(
        conn,
        "peer.trust",
        bus.peer_trust_projection_json(bus_subj),
      )
    Some("invite.registry") ->
      send_projection(
        conn,
        "invite.registry",
        bus.invite_projection_json(bus_subj),
      )
    Some("chronicle.activity") ->
      send_projection(
        conn,
        "chronicle.activity",
        bus.chronicle_activity_projection_json(bus_subj),
      )
    Some("project.filesystem_status") ->
      send_projection(
        conn,
        "project.filesystem_status",
        bus.project_filesystem_projection_json(bus_subj),
      )
    Some("space.installed_vapps") ->
      send_projection(
        conn,
        "space.installed_vapps",
        bus.space_vapps_projection_json(bus_subj),
      )
    Some("lane.registry") ->
      case scope {
        Some(project_id) ->
          send_projection(
            conn,
            "lane.registry",
            bus.lane_registry_projection_json_scoped(bus_subj, project_id),
          )
        None ->
          send_projection(
            conn,
            "lane.registry",
            bus.lane_registry_projection_json(bus_subj),
          )
      }
    Some("queue.registry") ->
      case scope {
        Some(project_id) ->
          send_projection(
            conn,
            "queue.registry",
            bus.queue_registry_projection_json_scoped(bus_subj, project_id),
          )
        None ->
          send_projection(
            conn,
            "queue.registry",
            bus.queue_registry_projection_json(bus_subj),
          )
      }
    Some("campaign.registry") ->
      send_projection(
        conn,
        "campaign.registry",
        bus.campaign_registry_projection_json(bus_subj),
      )
    Some("mission.registry") ->
      send_projection(
        conn,
        "mission.registry",
        bus.mission_registry_projection_json(bus_subj),
      )
    Some("handoff.registry") ->
      send_projection(
        conn,
        "handoff.registry",
        bus.handoff_registry_projection_json(bus_subj),
      )
    Some("problem.graph") ->
      send_projection(
        conn,
        "problem.graph",
        bus.problem_graph_projection_json(bus_subj),
      )
    Some("agent.reports") ->
      send_projection(
        conn,
        "agent.reports",
        bus.agent_reports_projection_json(bus_subj),
      )
    Some("swarm.registry") ->
      send_projection(
        conn,
        "swarm.registry",
        bus.swarm_registry_projection_json(bus_subj),
      )
    Some("blueprint.sections") ->
      send_projection(
        conn,
        "blueprint.sections",
        bus.blueprint_projection_json(bus_subj),
      )
    Some("blueprint.planner") ->
      send_projection(
        conn,
        "blueprint.planner",
        bus.blueprint_planner_projection_json(bus_subj),
      )
    Some("vcalendar.state") ->
      send_projection(
        conn,
        "vcalendar.state",
        bus.vcalendar_projection_json(bus_subj),
      )
    Some("intent_graph") ->
      send_projection(
        conn,
        "intent_graph",
        bus.intent_graph_projection_json(bus_subj),
      )
    Some("dispatch.registry") ->
      send_projection(
        conn,
        "dispatch.registry",
        bus.dispatch_registry_projection_json(bus_subj),
      )
    Some("execution.registry") ->
      send_projection(
        conn,
        "execution.registry",
        bus.execution_registry_projection_json(bus_subj),
      )
    Some("tool.timeline") ->
      send_projection(
        conn,
        "tool.timeline",
        bus.tool_timeline_projection_json(bus_subj, 200),
      )
    Some("companion.status") ->
      send_projection(
        conn,
        "companion.status",
        bus.companion_status_projection_json(bus_subj),
      )
    Some("companion.windows") ->
      send_projection(
        conn,
        "companion.windows",
        bus.companion_windows_projection_json(bus_subj),
      )
    Some("desktop.presence") ->
      send_projection(
        conn,
        "desktop.presence",
        bus.desktop_presence_projection_json(bus_subj),
      )
    Some("collab.document") ->
      case ema_collab.projection(collab_subj, ema_collab.default_document_id) {
        Ok(snapshot) ->
          send_projection(conn, "collab.document", snapshot.data_json)
        Error(_) -> Nil
      }
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
