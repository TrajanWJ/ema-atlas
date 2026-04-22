// EMA v0.0.3 — top-level entry module (SCAFFOLD SKETCH)
//
// Boots the seven-subtree supervision graph documented in
// ARCHITECTURE.md. Each subsystem owns its own supervisor module under
// src/ema/<subsystem>.gleam. This file only composes them.
//
// Boot order (from ARCHITECTURE.md + EMA_V0_0_3_PREP.md):
//   1. control_plane     -- persistence + event_log come up first
//   2. identity          -- registry replays from event_log
//   3. drivers           -- typed driver registry (5 kinds)
//   4. sessions          -- ExecutionId/SessionId/ProviderSessionId binding
//   5. babysitter        -- ticker, scheduler, takeover manager
//   6. collab            -- substrate TBD per OPEN_QUESTIONS Q2/Q8
//   7. surfaces          -- mist+wisp HTTP, last (mirrors the Elixir
//                           "Endpoint is last" convention)

import gleam/erlang/process
import gleam/io
import gleam/otp/static_supervisor as sup

import ema/babysitter
import ema/collab
import ema/control_plane
import ema/drivers
import ema/identity
import ema/sessions
import ema/surfaces

pub fn main() -> Nil {
  io.println("ema v0.0.3 booting")

  let _root =
    sup.new(sup.OneForOne)
    |> sup.add(control_plane.supervised())
    |> sup.add(identity.supervised())
    |> sup.add(drivers.supervised())
    |> sup.add(sessions.supervised())
    |> sup.add(babysitter.supervised())
    |> sup.add(collab.supervised())
    |> sup.add(surfaces.supervised())
    |> sup.start
    |> result_or_panic("root supervisor failed to start")

  // Block forever — the supervisor owns the lifecycle.
  process.sleep_forever()
}

fn result_or_panic(r: Result(a, b), msg: String) -> a {
  case r {
    Ok(v) -> v
    Error(_) -> panic as msg
  }
}
