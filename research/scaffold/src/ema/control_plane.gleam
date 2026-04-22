// ema/control_plane.gleam — control-plane subtree supervisor
//
// Per research/build-steps/01-control-plane-skeleton.md, this is a
// rest_for_one supervisor over:
//   persistence  -> event_log -> store -> command_bus
// plus replay (a pure module, no actor) and incidents (stub today).
//
// rest_for_one is deliberate: a crashed event_log restarts everything
// downstream so no command is appended without a healthy store +
// command_bus pair (see research/parts/authority-control-plane.md).

import gleam/otp/static_supervisor as sup
import gleam/otp/supervision

import ema/control_plane/event_log

pub fn supervised() -> supervision.ChildSpecification(sup.Supervisor) {
  sup.new(sup.RestForOne)
  // |> sup.add(persistence.supervised())     -- TODO step 01
  |> sup.add(event_log.supervised())
  // |> sup.add(store.supervised())           -- TODO step 01
  // |> sup.add(command_bus.supervised())     -- TODO step 01
  // |> sup.add(execution_supervisor.supervised())  -- TODO step 04
  // |> sup.add(incidents.supervised())       -- TODO (deferred)
  |> sup.supervised
}

pub fn start() -> Result(sup.Supervisor, actor_start_error) {
  todo as "wired in step 01 — see 01-control-plane-skeleton.md"
}
