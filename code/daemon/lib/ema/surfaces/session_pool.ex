defmodule Ema.Surfaces.SessionPool do
  @moduledoc """
  Warm session pool for Claude CLI.

  Maintains a pool of pre-created ClaudeSession processes, one per model.
  When a request comes in, the pool hands out an idle session instantly —
  no cold start. If all sessions for a model are busy, creates an overflow session.

  This makes the Anthropic proxy respond in <1s for the session dispatch
  (the actual LLM inference time depends on the model, not CLI startup).
  """

  use GenServer
  require Logger

  alias Ema.Surfaces.Supervisor

  # Only pre-warm sonnet (most used). Others created on demand.
  # Keep pool small to avoid OOM on 8GB VMs.
  @models ["sonnet"]
  @pool_size_per_model 1
  @overflow_max 3

  defstruct [:pools, :overflow_count]

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Get an idle session for a model. Returns session_id."
  def checkout(model \\ "sonnet") do
    GenServer.call(__MODULE__, {:checkout, model}, 10_000)
  end

  @doc "Return a session to the pool after use."
  def checkin(session_id) do
    GenServer.cast(__MODULE__, {:checkin, session_id})
  end

  @doc "Get pool status"
  def status do
    GenServer.call(__MODULE__, :status)
  end

  @impl true
  def init(_opts) do
    # Pre-warm sessions for each model
    pools = Map.new(@models, fn model ->
      sessions = for i <- 1..@pool_size_per_model do
        id = "pool-#{model}-#{i}"
        case Supervisor.start_claude_session(id, model: model) do
          {:ok, _} -> %{id: id, status: :idle, model: model}
          {:error, {:already_started, _}} -> %{id: id, status: :idle, model: model}
          {:error, reason} ->
            Logger.warning("[SessionPool] failed to start #{id}: #{inspect(reason)}")
            nil
        end
      end
      |> Enum.reject(&is_nil/1)

      {model, sessions}
    end)

    Logger.info("[SessionPool] warmed #{Enum.sum(Enum.map(pools, fn {_, s} -> length(s) end))} sessions across #{length(@models)} models")

    {:ok, %__MODULE__{pools: pools, overflow_count: 0}}
  end

  @impl true
  def handle_call({:checkout, model}, _from, state) do
    pool = Map.get(state.pools, model, [])

    case Enum.find_index(pool, & &1.status == :idle) do
      nil ->
        # No idle session — create overflow
        if state.overflow_count < @overflow_max do
          overflow_id = "pool-overflow-#{model}-#{System.unique_integer([:positive])}"
          Supervisor.start_claude_session(overflow_id, model: model)
          Logger.info("[SessionPool] created overflow session #{overflow_id}")
          {:reply, {:ok, overflow_id}, %{state | overflow_count: state.overflow_count + 1}}
        else
          {:reply, {:error, :pool_exhausted}, state}
        end

      idx ->
        session = Enum.at(pool, idx)
        updated_pool = List.replace_at(pool, idx, %{session | status: :busy})
        pools = Map.put(state.pools, model, updated_pool)
        {:reply, {:ok, session.id}, %{state | pools: pools}}
    end
  end

  def handle_call(:status, _from, state) do
    summary = Map.new(state.pools, fn {model, sessions} ->
      idle = Enum.count(sessions, & &1.status == :idle)
      busy = Enum.count(sessions, & &1.status == :busy)
      {model, %{idle: idle, busy: busy, total: length(sessions)}}
    end)
    {:reply, {:ok, %{pools: summary, overflow: state.overflow_count}}, state}
  end

  @impl true
  def handle_cast({:checkin, session_id}, state) do
    pools = Map.new(state.pools, fn {model, sessions} ->
      updated = Enum.map(sessions, fn s ->
        if s.id == session_id, do: %{s | status: :idle}, else: s
      end)
      {model, updated}
    end)

    {:noreply, %{state | pools: pools}}
  end
end
