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
import ema_collab/ema_collab
import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import ema_identity/ema_device_keys
import ema_identity/ema_identity
import ema_invites/ema_invites
import ema_memberships/ema_memberships
import ema_orgs/ema_orgs
import ema_projects/ema_projects
import ema_replication/ema_collab_sync
import ema_replication/ema_peers
import ema_spaces/ema_spaces
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
              let _ =
                send_projection_snapshot(
                  conn,
                  bus_subj,
                  collab_subj,
                  incoming.channel,
                )
              bus.subscribe(bus_subj, state.bus_delivery, None)
              mist.continue(ConnState(..state, bus_subscribed: True))
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
                    ema_identity.register_device(
                      bus_subj,
                      org_id,
                      device_id,
                      user_id,
                      name,
                      pubkey,
                      bootstrap,
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
    peer_device: Option(String),
    peer_pubkey: Option(String),
    local_pubkey: Option(String),
    ceremony_kind: Option(String),
    ceremony_id: Option(String),
    lineage_proof: Option(String),
    approved_by_device: Option(String),
    session_id: Option(String),
    reason: Option(String),
    scopes: List(String),
    actor_id: Option(String),
    block_id: Option(String),
    block_kind: Option(String),
    label: Option(String),
    start_at: Option(String),
    end_at: Option(String),
    lane_id: Option(String),
    cadence: Option(String),
    checkup_id: Option(String),
    result: Option(String),
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
    peer_device: Option(String),
    peer_pubkey: Option(String),
    local_pubkey: Option(String),
    ceremony_kind: Option(String),
    ceremony_id: Option(String),
    lineage_proof: Option(String),
    approved_by_device: Option(String),
    session_id: Option(String),
    reason: Option(String),
    scopes: List(String),
    actor_id: Option(String),
    block_id: Option(String),
    block_kind: Option(String),
    label: Option(String),
    start_at: Option(String),
    end_at: Option(String),
    lane_id: Option(String),
    cadence: Option(String),
    checkup_id: Option(String),
    result: Option(String),
  )
}

fn decode_envelope(raw: String) -> Result(Incoming, String) {
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
      peer_device: peer_device,
      peer_pubkey: peer_pubkey,
      local_pubkey: local_pubkey,
      ceremony_kind: ceremony_kind,
      ceremony_id: ceremony_id,
      lineage_proof: lineage_proof,
      approved_by_device: approved_by_device,
      session_id: session_id,
      reason: reason,
      scopes: scopes,
      actor_id: actor_id,
      block_id: block_id,
      block_kind: block_kind,
      label: label,
      start_at: start_at,
      end_at: end_at,
      lane_id: lane_id,
      cadence: cadence,
      checkup_id: checkup_id,
      result: result,
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
        peer_device: None,
        peer_pubkey: None,
        local_pubkey: None,
        ceremony_kind: None,
        ceremony_id: None,
        lineage_proof: None,
        approved_by_device: None,
        session_id: None,
        reason: None,
        scopes: [],
        actor_id: None,
        block_id: None,
        block_kind: None,
        label: None,
        start_at: None,
        end_at: None,
        lane_id: None,
        cadence: None,
        checkup_id: None,
        result: None,
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
      peer_device: args.peer_device,
      peer_pubkey: args.peer_pubkey,
      local_pubkey: args.local_pubkey,
      ceremony_kind: args.ceremony_kind,
      ceremony_id: args.ceremony_id,
      lineage_proof: args.lineage_proof,
      approved_by_device: args.approved_by_device,
      session_id: args.session_id,
      reason: args.reason,
      scopes: args.scopes,
      actor_id: args.actor_id,
      block_id: args.block_id,
      block_kind: args.block_kind,
      label: args.label,
      start_at: args.start_at,
      end_at: args.end_at,
      lane_id: args.lane_id,
      cadence: args.cadence,
      checkup_id: args.checkup_id,
      result: args.result,
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

fn send_projection_snapshot(
  conn: mist.WebsocketConnection,
  bus_subj: Subject(bus.Msg),
  collab_subj: Subject(ema_collab.Msg),
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
