defmodule EmaWeb.BabysitterChannel do
  @moduledoc """
  Minimal channel for babysitter stream subscriptions.

  It subscribes the socket process to PubSub updates from `StreamTicker` and
  pushes the latest stream snapshot whenever the ticker state changes.
  """

  use Phoenix.Channel

  alias Ema.Babysitter.StreamTicker
  alias Phoenix.PubSub

  @impl true
  def join("babysitter:" <> stream, _payload, socket) do
    topic = socket.topic
    :ok = PubSub.subscribe(Ema.PubSub, topic)

    snapshot =
      case stream do
        "all" -> StreamTicker.snapshot()
        _ -> StreamTicker.stream_snapshot(stream)
      end

    {:ok, %{status: "joined", snapshot: snapshot}, assign(socket, :stream, stream)}
  end

  @impl true
  def handle_info({:babysitter_stream_updated, snapshot}, %{assigns: %{stream: "all"}} = socket) do
    push(socket, "stream_updated", snapshot)
    {:noreply, socket}
  end

  def handle_info({:babysitter_stream_updated, %{stream: stream} = snapshot}, %{assigns: %{stream: stream}} = socket) do
    push(socket, "stream_updated", snapshot)
    {:noreply, socket}
  end

  def handle_info(_message, socket), do: {:noreply, socket}
end
