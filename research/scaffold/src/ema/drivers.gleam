// ema/drivers.gleam — driver registry subtree supervisor
//
// Per research/build-steps/03-driver-registry-skeleton.md: a one_for_one
// supervisor over the registry actor and the bridge_to_event_log actor.
// Per-run drivers spawn under ema_execution/execution_supervisor (Step 4),
// not here.

import gleam/otp/static_supervisor as sup
import gleam/otp/supervision

import ema/drivers/registry

pub fn supervised() -> supervision.ChildSpecification(sup.Supervisor) {
  sup.new(sup.OneForOne)
  |> sup.add(registry.supervised())
  // |> sup.add(bridge_to_event_log.supervised())  -- TODO step 03
  |> sup.supervised
}
