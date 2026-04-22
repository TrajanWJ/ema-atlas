defmodule EmaWeb.BabysitterChannelTest do
  use EmaWeb.ChannelCase, async: false

  alias Ema.Babysitter.StreamTicker
  alias EmaWeb.BabysitterChannel
  alias EmaWeb.UserSocket

  test "joining the live babysitter stream returns a snapshot and pushes enriched updates" do
    {:ok, join_reply, _socket} =
      UserSocket
      |> socket("user-1", %{})
      |> subscribe_and_join(BabysitterChannel, "babysitter:babysitter-live")

    assert join_reply.status == "joined"
    assert get_in(join_reply, [:snapshot, :stream]) == "babysitter-live"
    assert get_in(join_reply, [:snapshot, :lane]) == :operator_rollup
    assert get_in(join_reply, [:snapshot, :cadence_bucket]) == :realtime

    snapshot =
      StreamTicker.ingest_activity("babysitter-live", %{
        message_count: 2,
        event_count: 1,
        token_pressure: 0.25,
        source: "channel-test"
      })

    assert_push "stream_updated", pushed
    assert pushed.stream == "babysitter-live"
    assert pushed.lane == :operator_rollup
    assert pushed.cadence_bucket == :realtime
    assert pushed.recent_event_count >= 1
    assert "channel-test" in pushed.sources
    assert pushed.last_interval_ms == snapshot.last_interval_ms
  end

  test "joining the aggregate babysitter stream receives updates from any stream" do
    {:ok, join_reply, _socket} =
      UserSocket
      |> socket("user-2", %{})
      |> subscribe_and_join(BabysitterChannel, "babysitter:all")

    assert join_reply.status == "joined"
    assert is_map(join_reply.snapshot.streams)
    assert is_map(join_reply.snapshot.cadence_buckets)

    StreamTicker.ingest_activity("babysitter-ops", %{
      message_count: 1,
      token_pressure: 0.85,
      source: "ops-feed"
    })

    assert_push "stream_updated", pushed
    assert pushed.stream == "babysitter-ops"
    assert pushed.cadence_bucket == :rapid
    assert pushed.reason == "token_pressure"
  end
end
