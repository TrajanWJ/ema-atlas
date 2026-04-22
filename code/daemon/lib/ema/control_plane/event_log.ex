defmodule Ema.ControlPlane.EventLog do
  @moduledoc """
  Lightweight in-memory projection of recent execution events for operator views.
  """

  use GenServer

  alias Ema.Executions.Events

  @max_events 200

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def recent(limit \\ 50), do: GenServer.call(__MODULE__, {:recent, limit})

  @impl true
  def init(_opts) do
    Phoenix.PubSub.subscribe(Ema.PubSub, Events.topic())
    {:ok, %{events: []}}
  end

  @impl true
  def handle_call({:recent, limit}, _from, state) do
    {:reply, Enum.take(state.events, limit), state}
  end

  @impl true
  def handle_info({:execution_event, event}, state) do
    events = [event | state.events] |> Enum.take(@max_events)
    {:noreply, %{state | events: events}}
  end
end
