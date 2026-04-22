defmodule EmaWeb.ControlPlaneChannel do
  @moduledoc """
  Live operator surface for the control plane.

  Subscribers receive real-time execution events, proposal events, incident
  updates, and dispatch reconciliation signals. Operators can also push
  commands directly through the channel.
  """

  use Phoenix.Channel

  alias Ema.ControlPlane.{Command, EventLog, Store}
  alias Ema.ControlPlane.Incidents.Authority
  alias Ema.Executions.Events

  @impl true
  def join("control-plane:live", _params, socket) do
    send(self(), :after_join)
    {:ok, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    Phoenix.PubSub.subscribe(Ema.PubSub, Events.topic())
    Phoenix.PubSub.subscribe(Ema.PubSub, Ema.ControlPlane.ProposalEvents.topic())
    Phoenix.PubSub.subscribe(Ema.PubSub, Ema.Surfaces.HostTruthWatcher.topic())
    Phoenix.PubSub.subscribe(Ema.PubSub, "surfaces:dispatch")

    # Bootstrap: send current state snapshot
    push(socket, "snapshot", %{
      status: Store.status(),
      incidents: Authority.list(active: true),
      recent_events: EventLog.recent(25)
    })

    {:noreply, socket}
  end

  def handle_info({:execution_event, event}, socket) do
    push(socket, "execution_event", event)
    {:noreply, socket}
  end

  def handle_info({:proposal_event, event}, socket) do
    push(socket, "proposal_event", event)
    {:noreply, socket}
  end

  def handle_info({:host_truth_transition, event}, socket) do
    push(socket, "host_truth_transition", event)
    {:noreply, socket}
  end

  def handle_info({:dispatch_event, event}, socket) do
    push(socket, "dispatch_event", event)
    {:noreply, socket}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  @impl true
  def handle_in("command", %{"command" => command}, socket) do
    case Command.run(command) do
      {:ok, result} -> {:reply, {:ok, result}, socket}
      {:error, reason} -> {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  def handle_in("status", _payload, socket) do
    {:reply, {:ok, Store.status()}, socket}
  end

  def handle_in("incidents", _payload, socket) do
    {:reply, {:ok, %{incidents: Authority.list(active: true)}}, socket}
  end
end
