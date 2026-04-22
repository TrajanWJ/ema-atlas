defmodule Ema.Surfaces.Discovery do
  @moduledoc """
  On-login enumeration of all execution surfaces and their state.

  When EMA starts (or a user logs in), Discovery:
  1. Connects to OpenClaw gateway WebSocket
  2. Enumerates all connected peers and their capabilities
  3. Checks Claude CLI auth status
  4. Checks Codex CLI auth status
  5. Discovers OpenClaw agent roster
  6. Detects available local AI surfaces (Ollama, etc.)
  7. Surfaces everything as a unified status map

  This replaces the fragile "check one thing at a time" approach with
  a single boot-time discovery that populates the Surface Registry.
  """

  use GenServer
  require Logger

  @discovery_timeout 30_000

  defstruct [
    :status,
    :started_at,
    :completed_at,
    :surfaces,
    :errors
  ]

  defmodule SurfaceInfo do
    defstruct [
      :type,
      :id,
      :status,
      :auth,
      :model,
      :version,
      :details
    ]
  end

  # --- Public API ---

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def run_discovery do
    GenServer.call(__MODULE__, :run_discovery, @discovery_timeout)
  end

  def get_surfaces do
    GenServer.call(__MODULE__, :get_surfaces)
  end

  def get_surface(type) do
    GenServer.call(__MODULE__, {:get_surface, type})
  end

  # --- GenServer ---

  @impl true
  def init(_opts) do
    state = %__MODULE__{
      status: :pending,
      surfaces: %{},
      errors: []
    }

    # Run discovery after a short delay to let other surfaces boot
    Process.send_after(self(), :auto_discover, 3_000)
    {:ok, state}
  end

  @impl true
  def handle_call(:run_discovery, _from, state) do
    new_state = do_discovery(state)
    {:reply, {:ok, new_state.surfaces}, new_state}
  end

  def handle_call(:get_surfaces, _from, state) do
    {:reply, {:ok, state.surfaces}, state}
  end

  def handle_call({:get_surface, type}, _from, state) do
    case Map.get(state.surfaces, type) do
      nil -> {:reply, {:error, :not_found}, state}
      surface -> {:reply, {:ok, surface}, state}
    end
  end

  @impl true
  def handle_info(:auto_discover, state) do
    new_state = do_discovery(state)

    Logger.info("[Discovery] completed: #{map_size(new_state.surfaces)} surfaces found, #{length(new_state.errors)} errors")

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "surfaces:discovery",
      {:discovery_complete, new_state.surfaces}
    )

    {:noreply, new_state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  # --- Discovery Logic ---

  defp do_discovery(state) do
    started_at = DateTime.utc_now()

    tasks = [
      Task.async(fn -> {:claude, discover_claude()} end),
      Task.async(fn -> {:codex, discover_codex()} end),
      Task.async(fn -> {:hermes, discover_hermes()} end),
      Task.async(fn -> {:openclaw, discover_openclaw()} end),
      Task.async(fn -> {:gateway, discover_gateway()} end),
      Task.async(fn -> {:ollama, discover_ollama()} end)
    ]

    results = Task.yield_many(tasks, @discovery_timeout)

    {surfaces, errors} = Enum.reduce(results, {%{}, []}, fn
      {_task, {:ok, {type, {:ok, info}}}}, {surfs, errs} ->
        {Map.put(surfs, type, info), errs}

      {_task, {:ok, {type, {:error, reason}}}}, {surfs, errs} ->
        {surfs, [{type, reason} | errs]}

      {task, nil}, {surfs, errs} ->
        Task.shutdown(task, :brutal_kill)
        {surfs, [{:timeout, "task timed out"} | errs]}

      _, acc -> acc
    end)

    %{state |
      status: :complete,
      started_at: started_at,
      completed_at: DateTime.utc_now(),
      surfaces: surfaces,
      errors: errors
    }
  end

  defp discover_claude do
    case System.find_executable("claude") do
      nil -> {:error, :not_installed}
      path ->
        auth = check_claude_auth()
        version = get_cli_version("claude")

        session_store = claude_session_store_facts()

        {:ok, %SurfaceInfo{
          type: :claude,
          id: "claude-cli",
          status: if(auth == :authenticated, do: :ready, else: :auth_required),
          auth: auth,
          version: version,
          details: %{
            path: path,
            session_support: true,
            streaming: true,
            models: ["opus", "sonnet", "haiku"],
            oauth_auto_refresh: true,
            session_store_root: session_store.root,
            session_store_present: session_store.present,
            discoverable_sessions: session_store.discoverable_sessions,
            last_session_at: session_store.last_session_at,
            session_projects: session_store.projects
          }
        }}
    end
  end

  defp discover_codex do
    case System.find_executable("codex") do
      nil -> {:error, :not_installed}
      path ->
        version = get_cli_version("codex")

        session_store = codex_session_store_facts()

        {:ok, %SurfaceInfo{
          type: :codex,
          id: "codex-cli",
          status: :ready,
          auth: :token_based,
          version: version,
          details: %{
            path: path,
            sandbox_modes: ["workspace-write", "workspace-read", "none"],
            session_store_root: session_store.root,
            session_store_present: session_store.present,
            discoverable_sessions: session_store.discoverable_sessions,
            last_session_at: session_store.last_session_at,
            structured_event_logs: true
          }
        }}
    end
  end

  defp discover_openclaw do
    case System.find_executable("openclaw") do
      nil -> {:error, :not_installed}
      _path ->
        # Check gateway status via HTTP
        gateway_status = check_openclaw_gateway()
        agents = list_openclaw_agents()

        {:ok, %SurfaceInfo{
          type: :openclaw,
          id: "openclaw-gateway",
          status: if(gateway_status == :live, do: :ready, else: :gateway_down),
          auth: :operator_token,
          version: get_openclaw_version(),
          details: %{
            gateway_status: gateway_status,
            gateway_port: 18789,
            agents: agents,
            dispatch_capable: true,
            messaging: [:discord, :telegram, :whatsapp]
          }
        }}
    end
  end

  defp discover_hermes do
    alias Ema.Surfaces.HermesClient

    case HermesClient.status(timeout: 5_000) do
      {:ok, info} ->
        {:ok,
         %SurfaceInfo{
           type: :hermes,
           id: "hermes-api",
           status: :ready,
           auth: if(Application.get_env(:ema, :hermes_api_key), do: :bearer_token, else: :none),
           model: info.model,
           details: %{
             base_url: info.base_url,
             models: info.models,
             model_count: length(info.models),
             session_continuity: true,
             responses_api: true,
             stream_of_thought_executor: true
           }
         }}

      {:error, info} ->
        {:ok,
         %SurfaceInfo{
           type: :hermes,
           id: "hermes-api",
           status: info.status,
           auth: if(Application.get_env(:ema, :hermes_api_key), do: :bearer_token, else: :none),
           model: info.model,
           details: %{
             base_url: info.base_url,
             models: info.models,
             error: inspect(info.error),
             stream_of_thought_executor: true
           }
         }}
    end
  end

  defp discover_gateway do
    case Ema.Surfaces.GatewayClient.get_status() do
      {:ok, status} ->
        {:ok, %SurfaceInfo{
          type: :gateway,
          id: "ema-gateway-client",
          status: status.status,
          auth: :operator_token,
          details: %{
            connected_at: status.connected_at,
            gateway_info: status.gateway_info,
            peer_count: status.peer_count
          }
        }}
      {:error, reason} ->
        {:error, reason}
    end
  rescue
    _ -> {:error, :gateway_client_not_started}
  end

  defp discover_ollama do
    case Req.get("http://localhost:11434/api/tags", receive_timeout: 5_000) do
      {:ok, %{status: 200, body: %{"models" => models}}} ->
        {:ok, %SurfaceInfo{
          type: :ollama,
          id: "ollama-local",
          status: :ready,
          auth: :none,
          details: %{
            models: Enum.map(models, & &1["name"]),
            endpoint: "http://localhost:11434"
          }
        }}
      _ ->
        {:error, :not_running}
    end
  rescue
    _ -> {:error, :not_running}
  end

  # --- Helpers ---

  defp check_claude_auth do
    # Read the credentials file directly — faster than spawning a process
    creds_path = Path.expand("~/.claude/.credentials.json")

    case File.read(creds_path) do
      {:ok, content} ->
        case Jason.decode(content) do
          {:ok, %{"claudeAiOauth" => %{"expiresAt" => expires}}} ->
            now_ms = System.os_time(:millisecond)
            if expires > now_ms, do: :authenticated, else: :expired

          _ -> :unknown
        end
      _ -> :no_credentials
    end
  end

  defp check_openclaw_gateway do
    case Req.get("http://localhost:18789/health", receive_timeout: 3_000) do
      {:ok, %{status: 200, body: %{"ok" => true}}} -> :live
      _ -> :down
    end
  rescue
    _ -> :down
  end

  defp list_openclaw_agents do
    agents_dir = Path.expand("~/.openclaw/agents")

    case File.ls(agents_dir) do
      {:ok, entries} ->
        entries
        |> Enum.filter(fn e ->
          File.dir?(Path.join(agents_dir, e)) and e != "archived"
        end)
      _ -> []
    end
  end

  defp get_cli_version(cmd) do
    case System.cmd(cmd, ["--version"], stderr_to_stdout: true) do
      {version, 0} -> String.trim(version)
      _ -> "unknown"
    end
  rescue
    _ -> "unknown"
  end

  defp get_openclaw_version do
    case System.cmd("openclaw", ["--version"], stderr_to_stdout: true) do
      {version, 0} -> String.trim(version)
      _ -> "unknown"
    end
  rescue
    _ -> "unknown"
  end

  defp claude_session_store_facts do
    root = Path.expand("~/.claude/projects")

    session_files =
      if File.dir?(root) do
        Path.wildcard(Path.join(root, "**/*.jsonl"))
      else
        []
      end

    %{
      root: root,
      present: File.dir?(root),
      discoverable_sessions: length(session_files),
      last_session_at: latest_file_mtime_iso(session_files),
      projects: claude_project_count(root)
    }
  end

  defp codex_session_store_facts do
    root = Path.expand("~/.codex/sessions")

    session_files =
      if File.dir?(root) do
        Path.wildcard(Path.join(root, "**/*.jsonl"))
      else
        []
      end

    %{
      root: root,
      present: File.dir?(root),
      discoverable_sessions: length(session_files),
      last_session_at: latest_file_mtime_iso(session_files)
    }
  end

  defp claude_project_count(root) do
    if File.dir?(root) do
      case File.ls(root) do
        {:ok, entries} ->
          entries
          |> Enum.map(&Path.join(root, &1))
          |> Enum.count(&File.dir?/1)

        _ ->
          0
      end
    else
      0
    end
  end

  defp latest_file_mtime_iso([]), do: nil

  defp latest_file_mtime_iso(paths) do
    paths
    |> Enum.reduce([], fn path, acc ->
      case File.stat(path, time: :posix) do
        {:ok, stat} -> [{stat.mtime, path} | acc]
        _ -> acc
      end
    end)
    |> Enum.max_by(fn {mtime, _path} -> mtime end, fn -> nil end)
    |> case do
      nil -> nil
      {mtime, _path} -> DateTime.from_unix!(mtime) |> DateTime.to_iso8601()
    end
  end
end
