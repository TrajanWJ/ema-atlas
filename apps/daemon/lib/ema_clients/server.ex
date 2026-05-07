defmodule EmaClients.Server do
  @moduledoc """
  GenServer that owns the `EmaClients.Projection` ETS table.

  The server's only job is to serialize writes to the projection and to
  expose a synchronous API for the public `EmaClients` module. Reads
  hit ETS directly (it's a public table), so they don't need to round-
  trip through the GenServer.

  ## Cross-language note (Gleam ↔ Elixir)

  Gleam can call this GenServer two ways:

    1. By registered atom — every Elixir module compiles to an atom
       prefixed with `Elixir.`. So Gleam code calling
       `:gen_server.call(:'Elixir.EmaClients.Server', :list)` reaches
       this server with no further glue.

    2. As a child spec — `child_spec/1` is the standard OTP callback,
       so the Gleam supervisor can put `EmaClients.Server` in its
       `children` list directly. From Gleam, that's most naturally
       written as `:gen_server.start_link(:'Elixir.EmaClients.Server', ...)`
       inside the supervisor's start logic.

  Slice 2 wires path 1 (`Application.start(:ema_daemon_elixir)`) and
  documents path 2 in `supervisor.gleam` as a TODO.
  """

  use GenServer

  alias EmaClients.Projection

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @spec start_link(any()) :: GenServer.on_start()
  def start_link(_opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @doc "Apply an event envelope. Synchronous — returns when the projection is updated."
  @spec apply_event(map()) :: :ok | {:error, term()}
  def apply_event(envelope) do
    GenServer.call(__MODULE__, {:apply_event, envelope})
  end

  @doc "Read every client. ETS hit — no GenServer involvement."
  @spec list() :: [map()]
  def list do
    ensure_started!()
    Projection.list()
  end

  @doc "Read a single client by id."
  @spec get(String.t()) :: map() | :not_found
  def get(client_id) do
    ensure_started!()
    Projection.get(client_id)
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
        # Auto-start in test contexts that don't run the supervisor.
        case start_link() do
          {:ok, _pid} -> :ok
          {:error, {:already_started, _pid}} -> :ok
        end

      _pid ->
        :ok
    end
  end
end
