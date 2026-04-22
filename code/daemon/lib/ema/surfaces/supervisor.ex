defmodule Ema.Surfaces.Supervisor do
  @moduledoc """
  Supervises all execution surface connections.

  Boot order:
  1. Registry (for named session lookups)
  2. SessionSupervisor (DynamicSupervisor for Claude/Codex sessions)
  3. GatewayClient (WebSocket to OpenClaw)
  4. PeerRegistry (discovers and tracks peers)
  5. Discovery (enumerates all surfaces on startup)
  """

  use Supervisor

  alias Ema.Sessions.Supervisor, as: SessionsSupervisor
  alias Ema.Sessions.Registry, as: SessionRegistry

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    children = [
      # Registry for named session lookups
      {Registry, keys: :unique, name: Ema.Surfaces.Registry},

      # DynamicSupervisor for on-demand Claude/Codex sessions
      {DynamicSupervisor, name: Ema.Surfaces.SessionSupervisor, strategy: :one_for_one},

      # Gateway WebSocket client
      Ema.Surfaces.GatewayClient,

      # Peer tracking
      Ema.Surfaces.PeerRegistry,

      # Warm session pool (pre-spawns sessions for fast proxy responses)
      Ema.Surfaces.SessionPool,

      # Surface discovery (runs after others are up)
      Ema.Surfaces.Discovery
    ]

    Supervisor.init(children, strategy: :rest_for_one)
  end

  # --- Session management API ---

  @doc "Start a new Claude session"
  def start_claude_session(id, opts \\ []) do
    spec = {Ema.Surfaces.ClaudeSession, Keyword.put(opts, :id, id)}

    case DynamicSupervisor.start_child(Ema.Surfaces.SessionSupervisor, spec) do
      {:ok, _pid} = ok ->
        _ = SessionsSupervisor.register_session(id, :claude, Map.new(opts))
        execution_id = Keyword.get(opts, :execution_id, "claude-session:" <> to_string(id))
        _ = SessionRegistry.bind_host_session(execution_id, %{
          host_session_id: Keyword.get(opts, :host_session_id),
          provider_session_id: Keyword.get(opts, :provider_session_id) || Keyword.get(opts, :session_id) || id,
          source: Keyword.get(opts, :source, :live),
          surface_bindings: Keyword.get(opts, :surface_bindings, %{})
        })
        ok

      other ->
        other
    end
  end

  @doc "Start a new Codex session"
  def start_codex_session(id, opts \\ []) do
    spec = {Ema.Surfaces.CodexSession, Keyword.put(opts, :id, id)}

    case DynamicSupervisor.start_child(Ema.Surfaces.SessionSupervisor, spec) do
      {:ok, _pid} = ok ->
        _ = SessionsSupervisor.register_session(id, :codex, Map.new(opts))
        execution_id = Keyword.get(opts, :execution_id, "codex-session:" <> to_string(id))
        _ = SessionRegistry.bind_host_session(execution_id, %{
          host_session_id: Keyword.get(opts, :host_session_id),
          provider_session_id: Keyword.get(opts, :provider_session_id) || Keyword.get(opts, :session_id) || id,
          source: Keyword.get(opts, :source, :live),
          surface_bindings: Keyword.get(opts, :surface_bindings, %{})
        })
        ok

      other ->
        other
    end
  end

  @doc "Stop a session by ID"
  def stop_session(pid) when is_pid(pid) do
    DynamicSupervisor.terminate_child(Ema.Surfaces.SessionSupervisor, pid)
  end

  @doc "List all active sessions"
  def list_sessions do
    DynamicSupervisor.which_children(Ema.Surfaces.SessionSupervisor)
    |> Enum.map(fn {_, pid, _, _} -> pid end)
    |> Enum.filter(&is_pid/1)
  end
end
