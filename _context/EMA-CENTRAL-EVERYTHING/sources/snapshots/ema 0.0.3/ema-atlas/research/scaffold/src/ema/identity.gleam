// ema/identity.gleam — identity registry subtree supervisor
//
// Per research/build-steps/02-identity-registry-skeleton.md: a
// rest_for_one supervisor over registry, policy_evaluator, ttl_sweeper.
// Boots after control_plane (depends on persistence + event_log).

import gleam/otp/static_supervisor as sup
import gleam/otp/supervision

import ema/identity/registry

pub fn supervised() -> supervision.ChildSpecification(sup.Supervisor) {
  sup.new(sup.RestForOne)
  |> sup.add(registry.supervised())
  // |> sup.add(policy_evaluator.supervised())  -- TODO step 02
  // |> sup.add(ttl_sweeper.supervised())       -- TODO step 02
  |> sup.supervised
}
