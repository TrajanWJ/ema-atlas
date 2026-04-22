defmodule Ema.Sessions.Monitor do
  @moduledoc """
  Lightweight runtime monitor for babysitter activity signals.

  This is not yet a full telemetry aggregation pipeline, but it gives the daemon a
  single process that can accept recent-behavior inputs, keep a short in-memory
  history, and forward normalized activity into the babysitter ticker.
  """

  use GenServer

  alias Ema.Babysitter.StreamTicker
  alias Ema.Stream.Manager

  @history_limit 50

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def record_activity(stream, attrs \\ %{}) when is_binary(stream) and is_map(attrs) do
    GenServer.cast(__MODULE__, {:record_activity, stream, attrs})
  end

  def snapshot do
    GenServer.call(__MODULE__, :snapshot)
  end

  @impl true
  def init(_opts), do: {:ok, %{recent: []}}

  @impl true
  def handle_call(:snapshot, _from, state) do
    {:reply, %{recent: state.recent}, state}
  end

  @impl true
  def handle_cast({:record_activity, stream, attrs}, state) do
    event = %{
      stream: stream,
      attrs: attrs,
      at: DateTime.utc_now()
    }

    {babysitter_stream, ticker_attrs} = ticker_target(stream, attrs)
    StreamTicker.record_activity(babysitter_stream, ticker_attrs)
    Manager.record_intent_activity(stream, attrs)

    recent =
      [event | state.recent]
      |> Enum.take(@history_limit)

    {:noreply, %{state | recent: recent}}
  end

  defp ticker_target(stream, attrs) do
    override =
      Map.get(attrs, :babysitter_stream) ||
        Map.get(attrs, "babysitter_stream")

    ticker_attrs =
      attrs
      |> Map.delete(:babysitter_stream)
      |> Map.delete("babysitter_stream")

    {override || stream, ticker_attrs}
  end
end
