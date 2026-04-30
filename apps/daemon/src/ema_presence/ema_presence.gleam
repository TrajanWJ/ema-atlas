//// Ephemeral collaborative desktop presence.
////
//// This is daemon-owned state, but not coarse canon. Cursors and app location
//// are high-frequency collaboration signals that should replicate over the
//// mesh later without becoming event-log spam.

import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string

pub type State {
  State(
    revision: Int,
    sessions: List(Session),
    cursors: List(Cursor),
    locations: List(AppLocation),
  )
}

pub type Session {
  Session(
    session_id: String,
    actor_id: String,
    display_name: String,
    color: String,
    org_id: String,
    space_id: String,
    room_id: String,
    status: String,
    last_seen_at: String,
  )
}

pub type Cursor {
  Cursor(
    session_id: String,
    actor_id: String,
    display_name: String,
    color: String,
    org_id: String,
    space_id: String,
    room_id: String,
    x: Int,
    y: Int,
    surface: String,
    window_id: Option(String),
    app_id: Option(String),
    updated_at: String,
  )
}

pub type AppLocation {
  AppLocation(
    session_id: String,
    actor_id: String,
    display_name: String,
    color: String,
    org_id: String,
    space_id: String,
    room_id: String,
    window_id: Option(String),
    app_id: String,
    label: String,
    updated_at: String,
  )
}

pub type JoinRequest {
  JoinRequest(
    org_id: String,
    space_id: String,
    room_id: String,
    session_id: String,
    actor_id: String,
    display_name: String,
    color: String,
  )
}

pub type CursorRequest {
  CursorRequest(
    org_id: String,
    space_id: String,
    room_id: String,
    session_id: String,
    actor_id: String,
    display_name: String,
    color: String,
    x: Int,
    y: Int,
    surface: String,
    window_id: Option(String),
    app_id: Option(String),
  )
}

pub type LocationRequest {
  LocationRequest(
    org_id: String,
    space_id: String,
    room_id: String,
    session_id: String,
    actor_id: String,
    display_name: String,
    color: String,
    window_id: Option(String),
    app_id: String,
    label: String,
  )
}

pub fn new() -> State {
  State(revision: 0, sessions: [], cursors: [], locations: [])
}

pub fn join(state: State, req: JoinRequest, now: String) -> State {
  let session =
    Session(
      session_id: clean_or(req.session_id, "session:local"),
      actor_id: clean_or(req.actor_id, "actor:unknown"),
      display_name: clean_or(req.display_name, "Unknown"),
      color: clean_or(req.color, "#5eead4"),
      org_id: clean_or(req.org_id, "org:local"),
      space_id: clean_or(req.space_id, "space:local"),
      room_id: clean_or(req.room_id, "desktop_room:default"),
      status: "active",
      last_seen_at: now,
    )
  State(
    ..state,
    revision: state.revision + 1,
    sessions: [session, ..without_session(state.sessions, session.session_id)],
  )
}

pub fn leave(state: State, session_id: String) -> State {
  let clean_session = clean_or(session_id, "session:local")
  State(
    ..state,
    revision: state.revision + 1,
    sessions: without_session(state.sessions, clean_session),
    cursors: without_cursor(state.cursors, clean_session),
    locations: without_location(state.locations, clean_session),
  )
}

pub fn cursor(state: State, req: CursorRequest, now: String) -> State {
  let session_req =
    JoinRequest(
      org_id: req.org_id,
      space_id: req.space_id,
      room_id: req.room_id,
      session_id: req.session_id,
      actor_id: req.actor_id,
      display_name: req.display_name,
      color: req.color,
    )
  let joined = join(state, session_req, now)
  let c =
    Cursor(
      session_id: clean_or(req.session_id, "session:local"),
      actor_id: clean_or(req.actor_id, "actor:unknown"),
      display_name: clean_or(req.display_name, "Unknown"),
      color: clean_or(req.color, "#5eead4"),
      org_id: clean_or(req.org_id, "org:local"),
      space_id: clean_or(req.space_id, "space:local"),
      room_id: clean_or(req.room_id, "desktop_room:default"),
      x: req.x,
      y: req.y,
      surface: clean_or(req.surface, "desktop"),
      window_id: clean_option(req.window_id),
      app_id: clean_option(req.app_id),
      updated_at: now,
    )
  State(
    ..joined,
    revision: joined.revision + 1,
    cursors: [c, ..without_cursor(joined.cursors, c.session_id)],
  )
}

pub fn location(state: State, req: LocationRequest, now: String) -> State {
  let session_req =
    JoinRequest(
      org_id: req.org_id,
      space_id: req.space_id,
      room_id: req.room_id,
      session_id: req.session_id,
      actor_id: req.actor_id,
      display_name: req.display_name,
      color: req.color,
    )
  let joined = join(state, session_req, now)
  let loc =
    AppLocation(
      session_id: clean_or(req.session_id, "session:local"),
      actor_id: clean_or(req.actor_id, "actor:unknown"),
      display_name: clean_or(req.display_name, "Unknown"),
      color: clean_or(req.color, "#5eead4"),
      org_id: clean_or(req.org_id, "org:local"),
      space_id: clean_or(req.space_id, "space:local"),
      room_id: clean_or(req.room_id, "desktop_room:default"),
      window_id: clean_option(req.window_id),
      app_id: clean_or(req.app_id, "unknown"),
      label: clean_or(req.label, clean_or(req.app_id, "unknown")),
      updated_at: now,
    )
  State(
    ..joined,
    revision: joined.revision + 1,
    locations: [loc, ..without_location(joined.locations, loc.session_id)],
  )
}

pub fn projection_json(state: State) -> String {
  json.to_string(
    json.object([
      #("source", json.string("ema_presence")),
      #("authority", json.string("daemon_ephemeral")),
      #("revision", json.int(state.revision)),
      #("mesh_ready", json.bool(True)),
      #(
        "sessions",
        json.preprocessed_array(list.map(state.sessions, session_json)),
      ),
      #(
        "actors",
        json.preprocessed_array(list.map(state.sessions, actor_json)),
      ),
      #("cursors", json.preprocessed_array(list.map(state.cursors, cursor_json))),
      #(
        "app_locations",
        json.preprocessed_array(list.map(state.locations, location_json)),
      ),
      #(
        "window_outlines",
        json.preprocessed_array(list.map(state.locations, window_outline_json)),
      ),
    ]),
  )
}

fn session_json(s: Session) -> json.Json {
  json.object([
    #("session_id", json.string(s.session_id)),
    #("actor_id", json.string(s.actor_id)),
    #("display_name", json.string(s.display_name)),
    #("color", json.string(s.color)),
    #("org_id", json.string(s.org_id)),
    #("space_id", json.string(s.space_id)),
    #("room_id", json.string(s.room_id)),
    #("status", json.string(s.status)),
    #("last_seen_at", json.string(s.last_seen_at)),
  ])
}

fn actor_json(s: Session) -> json.Json {
  json.object([
    #("actor_id", json.string(s.actor_id)),
    #("display_name", json.string(s.display_name)),
    #("color", json.string(s.color)),
    #("kind", json.string("human")),
  ])
}

fn cursor_json(c: Cursor) -> json.Json {
  json.object([
    #("session_id", json.string(c.session_id)),
    #("actor_id", json.string(c.actor_id)),
    #("display_name", json.string(c.display_name)),
    #("color", json.string(c.color)),
    #("org_id", json.string(c.org_id)),
    #("space_id", json.string(c.space_id)),
    #("room_id", json.string(c.room_id)),
    #("x", json.int(c.x)),
    #("y", json.int(c.y)),
    #("surface", json.string(c.surface)),
    #("window_id", optional_string(c.window_id)),
    #("app_id", optional_string(c.app_id)),
    #("updated_at", json.string(c.updated_at)),
  ])
}

fn location_json(loc: AppLocation) -> json.Json {
  json.object([
    #("session_id", json.string(loc.session_id)),
    #("actor_id", json.string(loc.actor_id)),
    #("display_name", json.string(loc.display_name)),
    #("color", json.string(loc.color)),
    #("org_id", json.string(loc.org_id)),
    #("space_id", json.string(loc.space_id)),
    #("room_id", json.string(loc.room_id)),
    #("window_id", optional_string(loc.window_id)),
    #("app_id", json.string(loc.app_id)),
    #("label", json.string(loc.label)),
    #("updated_at", json.string(loc.updated_at)),
  ])
}

fn window_outline_json(loc: AppLocation) -> json.Json {
  json.object([
    #("actor_id", json.string(loc.actor_id)),
    #("display_name", json.string(loc.display_name)),
    #("window_id", optional_string(loc.window_id)),
    #("app_id", json.string(loc.app_id)),
    #("color", json.string(loc.color)),
  ])
}

fn without_session(sessions: List(Session), session_id: String) -> List(Session) {
  list.filter(sessions, fn(s) { s.session_id != session_id })
}

fn without_cursor(cursors: List(Cursor), session_id: String) -> List(Cursor) {
  list.filter(cursors, fn(c) { c.session_id != session_id })
}

fn without_location(
  locations: List(AppLocation),
  session_id: String,
) -> List(AppLocation) {
  list.filter(locations, fn(loc) { loc.session_id != session_id })
}

fn clean_or(value: String, fallback: String) -> String {
  case string.trim(value) {
    "" -> fallback
    clean -> clean
  }
}

fn clean_option(value: Option(String)) -> Option(String) {
  case value {
    Some(raw) ->
      case string.trim(raw) {
        "" -> None
        clean -> Some(clean)
      }
    None -> None
  }
}

fn optional_string(value: Option(String)) -> json.Json {
  case value {
    Some(v) -> json.string(v)
    None -> json.null()
  }
}
