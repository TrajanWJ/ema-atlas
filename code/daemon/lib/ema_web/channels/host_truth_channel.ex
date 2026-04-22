defmodule EmaWeb.HostTruthChannel do
  @moduledoc """
  Live channel for host-truth detail and transition events.
  """

  use Phoenix.Channel

  alias Ema.ControlPlane.HostTransitionLog
  alias Ema.Surfaces.{HostTruth, HostTruthWatcher}

  @impl true
  def join("host-truth:all", _payload, socket) do
    :ok = Phoenix.PubSub.subscribe(Ema.PubSub, HostTruthWatcher.topic())

    {:ok,
     %{
       status: "joined",
       snapshot: HostTruth.operator_detail(),
       transitions: HostTransitionLog.recent(25)
     }, socket}
  end

  @impl true
  def handle_info({:host_truth_transition, event}, socket) do
    push(socket, "host_truth_transition", event)
    {:noreply, socket}
  end
end
