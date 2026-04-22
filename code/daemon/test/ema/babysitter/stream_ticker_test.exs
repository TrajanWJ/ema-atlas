defmodule Ema.Babysitter.StreamTickerTest do
  use ExUnit.Case, async: true

  alias Ema.Babysitter.StreamTicker

  defp start_ticker do
    {:ok, pid} = StreamTicker.start_link(name: nil)
    pid
  end

  test "default streams expose lane metadata, cadence buckets, and bounded defaults" do
    pid = start_ticker()

    live = StreamTicker.stream_snapshot("babysitter-live", pid)
    ops = StreamTicker.stream_snapshot("babysitter-ops", pid)

    assert live.stream == "babysitter-live"
    assert live.lane == :operator_rollup
    assert live.cadence_bucket == :realtime
    assert live.cadence_bounds.base_interval_ms == 20_000
    assert live.config.base_interval_ms == 20_000
    assert live.config.min_interval_ms == 8_000
    assert live.config.max_interval_ms == 180_000

    assert ops.stream == "babysitter-ops"
    assert ops.lane == :operations
    assert ops.cadence_bucket == :rapid
    assert ops.cadence_bounds.base_interval_ms > live.cadence_bounds.base_interval_ms
    assert ops.config.max_interval_ms >= live.config.max_interval_ms
  end

  test "manual interval override wins over adaptive logic" do
    pid = start_ticker()

    updated = StreamTicker.update_stream("babysitter-live", %{manual_interval_ms: 45_000}, pid)
    forced = StreamTicker.force_tick("babysitter-live", pid)

    assert updated.config.manual_interval_ms == 45_000
    assert forced.last_interval_ms == 45_000
    assert forced.effective_interval_ms == 45_000
    assert forced.promotion_reason == "manual_override"
    assert is_nil(forced.suppression_reason)
    assert forced.reason == "manual"
    refute forced.quieted
  end

  test "low activity plus token pressure quiets the stream with explicit suppression reasoning" do
    pid = start_ticker()

    snapshot =
      StreamTicker.ingest_activity(
        "babysitter-live",
        %{message_count: 1, token_pressure: 0.95, source: "runtime"},
        pid
      )

    assert snapshot.quieted
    assert snapshot.suppression_reason == "token_pressure"
    assert snapshot.reason == "token_pressure"
    assert snapshot.last_interval_ms >= snapshot.config.base_interval_ms
    assert snapshot.activity_score > 0.0
    assert is_binary(snapshot.promotion_reason)
  end

  test "busy streams shorten cadence while preserving promotion reasoning" do
    pid = start_ticker()

    Enum.each(1..4, fn _ ->
      StreamTicker.ingest_activity(
        "babysitter-live",
        %{message_count: 3, event_count: 1, token_pressure: 0.2, source: "discord"},
        pid
      )
    end)

    snapshot = StreamTicker.force_tick("babysitter-live", pid)

    refute snapshot.quieted
    assert snapshot.reason == "active"
    assert snapshot.last_interval_ms <= snapshot.config.base_interval_ms
    assert snapshot.promotion_reason in ["high_activity", "surge_activity", "within_realtime_bucket"]
    assert is_nil(snapshot.suppression_reason)
    assert snapshot.recent_event_count >= 4
    assert snapshot.recent_message_count >= 12
    assert snapshot.time_range_ms == snapshot.config.activity_window_ms
    assert "discord" in snapshot.sources
    assert get_in(snapshot, [:emission_policy, :tier]) in [:hot, :medium]
  end

  test "explicit activity weights and signal floors affect cadence decisions" do
    pid = start_ticker()
    StreamTicker.update_stream("babysitter-live", %{signal_floor: 3.0}, pid)

    quieted =
      StreamTicker.ingest_activity(
        "babysitter-live",
        %{weight: 2.0, source: "agent-thought"},
        pid
      )

    assert quieted.activity_score == 2.0
    assert quieted.suppression_reason == "quieted"

    active =
      StreamTicker.ingest_activity(
        "babysitter-live",
        %{weight: 4.5, source: "agent-thought"},
        pid
      )

    assert active.activity_score >= 6.5
    refute active.quieted
    assert active.reason == "active"
  end

  test "routed decisions expose dedupe and coalescing debug fields" do
    pid = start_ticker()

    first =
      StreamTicker.ingest_activity(
        "babysitter-live",
        %{kind: "deploy", subject: "api deploy failed", body: "trajan please inspect", owner: "trajan", severity: 4, state_changed: true},
        pid
      )

    second =
      StreamTicker.ingest_activity(
        "babysitter-live",
        %{kind: "deploy", subject: "api deploy failed", body: "trajan please inspect", owner: "trajan", severity: 4, state_changed: true},
        pid
      )

    assert first.current_route in [:fast, :medium]
    assert is_binary(first.dedupe_key)
    assert is_binary(first.group_key)
    assert first.duplicate_suppressed == false
    assert first.coalesced_count == 1
    assert "mentioned-owner" in first.route_reasons
    assert first.last_transition.to == first.current_route
    assert first.transition_reason in ["route-transition", "mentioned-owner", "medium-default", "fast-default"]

    assert second.dedupe_key == first.dedupe_key
    assert second.group_key == first.group_key
    assert second.duplicate_suppressed == true
    assert second.coalesced_count >= 2
    assert second.route_reason == "duplicate-suppressed"
    assert second.recent_record_count >= 2
    assert second.coalesce_group_count >= 1
    assert get_in(second, [:tick_render, :route]) in [:fast, :medium]
    assert is_binary(get_in(second, [:tick_render, :header]))
    assert get_in(second, [:tick_render, :duplicate_suppressed]) == true
  end

  test "fast routes get transition timestamps and resist immediate demotion" do
    pid = start_ticker()

    first =
      StreamTicker.ingest_activity(
        "babysitter-live",
        %{kind: "incident", body: "trajan check this now", owner: "trajan", severity: 5, urgent: true, state_changed: true},
        pid
      )

    second =
      StreamTicker.ingest_activity(
        "babysitter-live",
        %{kind: "status", body: "steady state", quiet: true, severity: 1},
        pid
      )

    assert first.current_route == :fast
    assert %DateTime{} = first.promoted_at
    assert %DateTime{} = first.demotion_eligible_at
    assert first.last_transition.to == :fast

    assert second.current_route == :fast
    assert second.transition_reason == first.transition_reason
    assert second.last_transition == nil
  end
end
