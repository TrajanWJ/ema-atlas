import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string

pub type State {
  State(windows: List(Window), focused_window_id: Option(String))
}

pub type Window {
  Window(
    window_id: String,
    app_id: String,
    url: String,
    bounds: Option(Bounds),
    transparent: Bool,
    lifecycle: String,
  )
}

pub type Bounds {
  Bounds(x: Int, y: Int, width: Int, height: Int)
}

pub type WindowRequest {
  WindowRequest(
    window_id: String,
    app_id: String,
    url: String,
    bounds: Option(Bounds),
    transparent: Bool,
  )
}

pub fn new() -> State {
  State(windows: [], focused_window_id: None)
}

pub fn status_projection_json(state: State) -> String {
  json.to_string(
    json.object([
      #("available", json.bool(False)),
      #("transport", json.string("daemon-brokered")),
      #("protocol_version", json.string("place-companion.v0")),
      #("tracked_window_count", json.int(list.length(state.windows))),
      #("focused_window_id", case state.focused_window_id {
        Some(window_id) -> json.string(window_id)
        None -> json.null()
      }),
      #("last_error", json.string("native companion process not connected")),
    ]),
  )
}

pub fn windows_projection_json(state: State) -> String {
  json.to_string(
    json.object([
      #(
        "windows",
        json.preprocessed_array(list.map(state.windows, window_json)),
      ),
      #("focused_window_id", case state.focused_window_id {
        Some(window_id) -> json.string(window_id)
        None -> json.null()
      }),
    ]),
  )
}

pub fn open_window(state: State, req: WindowRequest) -> State {
  let window =
    Window(
      window_id: req.window_id,
      app_id: req.app_id,
      url: req.url,
      bounds: req.bounds,
      transparent: req.transparent,
      lifecycle: "pending_native_attach",
    )

  State(
    windows: [window, ..without_window(state.windows, req.window_id)],
    focused_window_id: Some(req.window_id),
  )
}

pub fn close_window(state: State, window_id: String) -> State {
  let focused_window_id = case state.focused_window_id {
    Some(focused) if focused == window_id -> None
    other -> other
  }

  State(
    windows: without_window(state.windows, window_id),
    focused_window_id: focused_window_id,
  )
}

pub fn focus_window(state: State, window_id: String) -> State {
  case find_window(state.windows, window_id) {
    Some(_) -> State(..state, focused_window_id: Some(window_id))
    None -> state
  }
}

pub fn reattach_ack(state: State, window_id: String) -> State {
  let windows =
    list.map(state.windows, fn(window) {
      case window.window_id == window_id {
        True -> Window(..window, lifecycle: "reattached")
        False -> window
      }
    })

  State(..state, windows: windows)
}

fn without_window(windows: List(Window), window_id: String) -> List(Window) {
  list.filter(windows, fn(window) { window.window_id != window_id })
}

fn find_window(windows: List(Window), window_id: String) -> Option(Window) {
  case list.find(windows, fn(window) { window.window_id == window_id }) {
    Ok(window) -> Some(window)
    Error(_) -> None
  }
}

fn window_json(window: Window) -> json.Json {
  json.object([
    #("window_id", json.string(window.window_id)),
    #("app_id", json.string(window.app_id)),
    #("url", json.string(window.url)),
    #("bounds", bounds_json(window.bounds)),
    #("transparent", json.bool(window.transparent)),
    #("lifecycle", json.string(window.lifecycle)),
  ])
}

fn bounds_json(bounds: Option(Bounds)) -> json.Json {
  case bounds {
    Some(bounds) ->
      json.object([
        #("x", json.int(bounds.x)),
        #("y", json.int(bounds.y)),
        #("width", json.int(bounds.width)),
        #("height", json.int(bounds.height)),
      ])
    None -> json.null()
  }
}

pub fn normalize_window_id(
  candidate: Option(String),
  fallback: String,
) -> String {
  normalize_optional(candidate, "companion:" <> fallback)
}

pub fn normalize_app_id(candidate: Option(String)) -> String {
  normalize_optional(candidate, "unknown")
}

pub fn normalize_url(candidate: Option(String), app_id: String) -> String {
  normalize_optional(candidate, "/?mode=panel&vapp=" <> app_id)
}

fn normalize_optional(candidate: Option(String), fallback: String) -> String {
  case candidate {
    Some(value) ->
      case string.trim(value) == "" {
        True -> fallback
        False -> value
      }
    None -> fallback
  }
}
