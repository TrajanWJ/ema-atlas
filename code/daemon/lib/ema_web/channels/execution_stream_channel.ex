defmodule EmaWeb.ExecutionStreamChannel do
  @moduledoc """
  Live channel for canonical execution events.
  """

  use Phoenix.Channel

  alias Ema.ControlPlane.EventLog
  alias Ema.Executions.Events

  @impl true
  def join("execution-stream:all", _payload, socket) do
    :ok = Phoenix.PubSub.subscribe(Ema.PubSub, Events.topic())
    {:ok, %{status: "joined", events: EventLog.recent(25)}, socket}
  end

  @impl true
  def handle_info({:execution_event, event}, socket) do
    push(socket, "execution_event", event)
    {:noreply, socket}
  end
end
