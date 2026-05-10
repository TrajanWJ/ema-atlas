defmodule EmaIntentionFarmer.Server do
  @moduledoc """
  GenServer owner for the Intention Farmer projection.
  """

  use GenServer

  alias EmaIntentionFarmer.Projection

  @spec start_link(any()) :: GenServer.on_start()
  def start_link(_opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @spec load([map()]) :: %{loaded: non_neg_integer(), duplicates: non_neg_integer()}
  def load(records) do
    ensure_started!()
    GenServer.call(__MODULE__, {:load, records}, 30_000)
  end

  @spec sessions() :: [map()]
  def sessions do
    ensure_started!()
    Projection.sessions()
  end

  @spec intents() :: [map()]
  def intents do
    ensure_started!()
    Projection.intents()
  end

  @spec stats() :: map()
  def stats do
    ensure_started!()
    Projection.stats()
  end

  @spec reset() :: :ok
  def reset do
    ensure_started!()
    GenServer.call(__MODULE__, :reset)
  end

  @impl true
  def init(:ok) do
    Projection.ensure_tables!()
    {:ok, %{}}
  end

  @impl true
  def handle_call({:load, records}, _from, state) do
    {:reply, Projection.load(records), state}
  end

  @impl true
  def handle_call(:reset, _from, state) do
    {:reply, Projection.reset(), state}
  end

  defp ensure_started! do
    case Process.whereis(__MODULE__) do
      nil ->
        case start_link() do
          {:ok, _pid} -> :ok
          {:error, {:already_started, _pid}} -> :ok
        end

      _pid ->
        :ok
    end
  end
end
