defmodule EmaResponsibilities.Server do
  @moduledoc """
  GenServer that owns the `EmaResponsibilities.Projection` ETS table.

  Mirrors `EmaClients.Server` — see that module's docs for the
  Gleam ↔ Elixir interop notes that apply equally here.
  """

  use GenServer

  alias EmaResponsibilities.Projection

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @spec start_link(any()) :: GenServer.on_start()
  def start_link(_opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @doc "Apply an event envelope. Synchronous."
  @spec apply_event(map()) :: :ok | {:error, term()}
  def apply_event(envelope) do
    GenServer.call(__MODULE__, {:apply_event, envelope})
  end

  @doc "Read every responsibility."
  @spec list() :: [map()]
  def list do
    ensure_started!()
    Projection.list()
  end

  @doc "Read a single responsibility by id."
  @spec get(String.t()) :: map() | :not_found
  def get(responsibility_id) do
    ensure_started!()
    Projection.get(responsibility_id)
  end

  @doc "Reset the projection. Test-only."
  @spec reset() :: :ok
  def reset do
    ensure_started!()
    GenServer.call(__MODULE__, :reset)
  end

  # ---------------------------------------------------------------------------
  # GenServer callbacks
  # ---------------------------------------------------------------------------

  @impl true
  def init(:ok) do
    Projection.ensure_table!()
    {:ok, %{}}
  end

  @impl true
  def handle_call({:apply_event, envelope}, _from, state) do
    result = Projection.apply(envelope)
    {:reply, result, state}
  end

  @impl true
  def handle_call(:reset, _from, state) do
    Projection.reset()
    {:reply, :ok, state}
  end

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

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
