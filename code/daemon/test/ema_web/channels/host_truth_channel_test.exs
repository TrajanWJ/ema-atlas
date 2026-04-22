defmodule EmaWeb.HostTruthChannelTest do
  use EmaWeb.ChannelCase, async: false

  alias EmaWeb.HostTruthChannel

  test "joining host truth stream returns snapshot and pushes transition events" do
    Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:host_truth", {:host_truth_transition, %{event_type: "host.health.transition", from: "healthy", to: "degraded", host_id: "ema-host"}})

    {:ok, join_reply, _socket} =
      socket(EmaWeb.UserSocket)
      |> subscribe_and_join(HostTruthChannel, "host-truth:all")

    assert join_reply.status == "joined"
    assert is_map(join_reply.snapshot)
    assert is_list(join_reply.transitions)

    Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:host_truth", {:host_truth_transition, %{event_type: "host.health.transition", from: "degraded", to: "healthy", host_id: "ema-host"}})

    assert_push "host_truth_transition", pushed
    assert pushed.event_type == "host.health.transition"
    assert pushed.to == "healthy"
  end
end
