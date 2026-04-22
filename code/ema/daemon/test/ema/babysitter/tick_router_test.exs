defmodule Ema.Babysitter.TickRouterTest do
  use ExUnit.Case, async: true

  alias Ema.Babysitter.TickRouter

  test "resolve_profile uses stream metadata plus route defaults" do
    profile = TickRouter.resolve_profile("babysitter-live")

    assert profile.stream == "babysitter-live"
    assert profile.lane == :operator_rollup
    assert profile.cadence_bucket == :realtime
    assert profile.route_default == :medium
    assert profile.dedupe_window_ms == 20_000
    assert profile.coalesce_window_ms == 180_000
    assert profile.promote_after_count == 2
    assert profile.render_style == :compact
  end

  test "normalize_candidate preserves owner, state, and summary signals" do
    now = DateTime.utc_now()

    candidate =
      TickRouter.normalize_candidate("babysitter-ops", %{
        source: "discord",
        kind: "deploy",
        owner: "trajan",
        subject: "api deploy failed",
        body: "trajan needs to inspect the red pipeline",
        severity: 4,
        state_changed: true,
        message_count: 2,
        event_count: 1,
        token_pressure: 0.42,
        tags: [:deploy, "failure"]
      }, now: now)

    assert candidate.stream == "babysitter-ops"
    assert candidate.owner == "trajan"
    assert candidate.owner_mentioned?
    assert candidate.state_changed?
    assert candidate.urgent?
    assert candidate.summary == "api deploy failed — trajan needs to inspect the red pipeline"
    assert candidate.tags == ["deploy", "failure"]
    assert candidate.inserted_at == now
  end

  test "owner mention plus urgent state forces fast route" do
    candidate =
      TickRouter.normalize_candidate("babysitter-live", %{
        kind: "incident",
        owner: "trajan",
        body: "trajan please look now",
        severity: 5,
        urgent: true,
        state_changed: true,
        message_count: 1
      })

    decision = TickRouter.decide(candidate)

    assert decision.route == :fast
    assert decision.score >= 7.5
    assert "mentioned-owner" in decision.reasons
    assert "urgent" in decision.reasons
    assert "state-changed" in decision.reasons
    assert decision.route_default == :medium
    assert is_binary(decision.dedupe_key)
    assert is_binary(decision.group_key)
    assert decision.dedupe_key != decision.group_key
  end

  test "quiet repeated activity stays slow with explainable reasons" do
    candidate =
      TickRouter.normalize_candidate("babysitter-alerts", %{
        kind: "status",
        body: "still green",
        severity: 1,
        quiet: true,
        message_count: 6,
        event_count: 3
      })

    decision = TickRouter.decide(candidate)

    assert decision.route == :slow
    assert "quiet-hint" in decision.reasons
    assert "burst-activity" in decision.reasons
    assert decision.score >= 4.0
    assert decision.profile.route_default == :fast
  end

  test "state changes promote otherwise routine ops traffic into medium" do
    candidate =
      TickRouter.normalize_candidate("babysitter-ops", %{
        kind: "pipeline",
        subject: "executor changed state",
        severity: 2,
        state_changed: true,
        message_count: 1,
        event_count: 1
      })

    decision = TickRouter.decide(candidate)

    assert decision.route == :medium
    assert decision.score >= 4.0
    assert "state-changed" in decision.reasons
    assert "medium-default" in decision.reasons
  end

  test "dedupe keys are stable for same semantic event" do
    attrs = %{
      kind: "deploy",
      subject: "api deploy failed",
      body: "check logs",
      owner: "trajan"
    }

    first = TickRouter.normalize_candidate("babysitter-ops", attrs)
    second = TickRouter.normalize_candidate("babysitter-ops", Map.put(attrs, :message_count, 2))

    first_decision = TickRouter.decide(first)
    second_decision = TickRouter.decide(second)

    assert first_decision.dedupe_key == second_decision.dedupe_key
    assert first_decision.group_key == second_decision.group_key
  end
end
