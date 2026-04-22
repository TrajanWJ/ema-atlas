// ema/babysitter.gleam — babysitter subtree supervisor
//
// Per research/build-steps/04-sessions-and-babysitter.md: one_for_one
// over stream_ticker, chain_scheduler, takeover_manager, tick_router,
// command_router, lane_registry. Ports OpenClaw takeover doctrine.

import gleam/otp/static_supervisor as sup
import gleam/otp/supervision

pub fn supervised() -> supervision.ChildSpecification(sup.Supervisor) {
  sup.new(sup.OneForOne)
  // |> sup.add(stream_ticker.supervised())     -- TODO step 04
  // |> sup.add(chain_scheduler.supervised())   -- TODO step 04
  // |> sup.add(takeover_manager.supervised())  -- TODO step 04
  // |> sup.add(tick_router.supervised())       -- TODO step 04
  // |> sup.add(command_router.supervised())    -- TODO step 04
  // |> sup.add(lane_registry.supervised())     -- TODO step 04
  |> sup.supervised
}
