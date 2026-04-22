// ema/sessions.gleam — sessions subtree supervisor
//
// Per research/build-steps/04-sessions-and-babysitter.md: rest_for_one
// over registry + monitor. Binds ExecutionId <-> SessionId <->
// Option(ProviderSessionId).

import gleam/otp/static_supervisor as sup
import gleam/otp/supervision

pub fn supervised() -> supervision.ChildSpecification(sup.Supervisor) {
  sup.new(sup.RestForOne)
  // |> sup.add(registry.supervised())   -- TODO step 04
  // |> sup.add(monitor.supervised())    -- TODO step 04
  |> sup.supervised
}
