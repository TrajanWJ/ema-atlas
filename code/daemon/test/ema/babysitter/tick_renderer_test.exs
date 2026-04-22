defmodule Ema.Babysitter.TickRendererTest do
  use ExUnit.Case, async: true

  alias Ema.Babysitter.TickRenderer

  test "renders compact operator-facing summary" do
    rendered =
      TickRenderer.render(%{
        current_route: :fast,
        owner: "trajan",
        route_score: 8.25,
        summary: "api deploy failed",
        route_reasons: ["mentioned-owner", "state-changed", "high-severity"],
        coalesced_count: 3,
        duplicate_suppressed: false
      })

    assert rendered.header == "FAST · owner:trajan · score:8.3"
    assert rendered.summary == "api deploy failed"
    assert rendered.compact == "api deploy failed (+2 related)"
    assert rendered.why == "mentioned-owner, state-changed, high-severity"
    assert rendered.route == :fast
    assert rendered.owner == "trajan"
  end

  test "duplicates surface duplicate suppression in why line" do
    rendered =
      TickRenderer.render(%{
        current_route: :medium,
        owner: nil,
        route_score: 4.0,
        summary: "steady state",
        route_reasons: ["medium-default"],
        coalesced_count: 2,
        duplicate_suppressed: true
      })

    assert rendered.header == "MEDIUM · owner:shared · score:4.0"
    assert rendered.why == "duplicate-suppressed"
    assert rendered.compact == "steady state (+1 related)"
  end
end
