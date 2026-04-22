defmodule Ema.Surfaces.HostTruthWatcherTest do
  use EmaWeb.ConnCase, async: false

  alias Ema.Surfaces.HostTruthWatcher

  test "builds transition event when exposed host status changes", %{conn: _conn} do
    state = %{
      interval_ms: 5_000,
      last_overall_state: :healthy,
      last_domain_states: %{"provider_path" => :healthy},
      last_transition_at: nil,
      sequence: 0
    }

    operator = %{
      generated_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      overall_state: :degraded,
      headline: "DEGRADED: provider path degraded",
      top_causes: [%{domain: :provider_path, severity: :high, message: "timeouts present"}],
      operator_actions: ["route critical traffic to known-good provider path"],
      domains: %{
        provider_path: %{
          state: :degraded,
          summary: "Provider path is seeing recent timeout / CLI-level failures.",
          recommended_action: ["route critical traffic to known-good provider path"]
        }
      }
    }

    {events, next_state} = HostTruthWatcher.transition_events(operator, state)

    assert length(events) == 2

    assert Enum.any?(
             events,
             &(&1.event_type == "host.health.transition" and &1.from == "healthy" and
                 &1.to == "degraded")
           )

    assert Enum.any?(events, fn event ->
             event.event_type == "host.domain.transition" and event.domain == "provider_path" and
               event.from == "healthy" and event.to == "degraded"
           end)

    assert next_state.last_overall_state == :degraded
    assert next_state.last_domain_states["provider_path"] == :degraded
    assert next_state.sequence == 2
  end
end
