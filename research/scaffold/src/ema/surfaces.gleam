// ema/surfaces.gleam — HTTP surface supervisor (mist + wisp)
//
// Per ARCHITECTURE.md and GLEAM_BEAM_FIT.md "HTTP / web servers":
// the AGENT-CONTRACT.md verb set lands as wisp handlers running on a
// mist listener. Boots LAST (mirrors Elixir's "Endpoint is last"
// convention).

import gleam/otp/static_supervisor as sup
import gleam/otp/supervision

pub fn supervised() -> supervision.ChildSpecification(sup.Supervisor) {
  sup.new(sup.OneForOne)
  // |> sup.add(http_listener.supervised())   -- TODO: mist listener bound
  //                                              to a wisp router that
  //                                              implements AGENT-CONTRACT.md
  // |> sup.add(websocket_hub.supervised())   -- TODO: surface fan-out for
  //                                              event_log subscribers
  |> sup.supervised
}

// Sketch for the eventual http_listener wiring (commented to avoid
// pulling unresolved imports into the scaffold):
//
//   import mist
//   import wisp
//
//   fn handle_request(req: wisp.Request) -> wisp.Response {
//     todo as "AGENT-CONTRACT verb routing lands here"
//   }
//
//   pub fn start_listener(port: Int) {
//     wisp.mist_handler(handle_request, "secret-key")
//     |> mist.new
//     |> mist.port(port)
//     |> mist.start_http
//   }
