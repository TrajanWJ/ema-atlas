defmodule Ema.Surfaces.PeerRegistry do
  @moduledoc """
  Tracks connected peers and their capabilities for distributed dispatch.

  Peers are discovered via:
  1. OpenClaw gateway WebSocket (primary) — all devices connected to gateway
  2. mDNS/Bonjour broadcast (LAN fallback)
  3. Manual registration (SSH tunnels, remote gateways)

  Every peer has equal dispatch authority — any peer can assign work to any
  other peer. The gateway mediates routing.

  Peer capabilities include:
  - Available AI surfaces (Claude, Codex, Ollama, etc.)
  - Auth status per surface
  - Current load (active sessions, memory, CPU)
  - Network latency to gateway
  """

  use GenServer
  require Logger

  @refresh_interval 60_000

  defstruct [
    :peers,
    :self_id,
    :capabilities,
    :refresh_timer
  ]

  defmodule Peer do
    defstruct [
      :id,
      :device_id,
      :display_name,
      :platform,
      :role,
      :scopes,
      :surfaces,
      :load,
      :latency_ms,
      :connected_at,
      :last_seen,
      :dispatch_capable
    ]
  end

  # --- Public API ---

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def list_peers do
    GenServer.call(__MODULE__, :list_peers)
  end

  def get_peer(peer_id) do
    GenServer.call(__MODULE__, {:get_peer, peer_id})
  end

  def dispatch_to_peer(peer_id, task) do
    GenServer.call(__MODULE__, {:dispatch_to_peer, peer_id, task})
  end

  def broadcast_to_peers(message) do
    GenServer.call(__MODULE__, {:broadcast, message})
  end

  def self_capabilities do
    GenServer.call(__MODULE__, :self_capabilities)
  end

  def register_self(capabilities) do
    GenServer.cast(__MODULE__, {:register_self, capabilities})
  end

  # --- GenServer ---

  @impl true
  def init(_opts) do
    Phoenix.PubSub.subscribe(Ema.PubSub, "surfaces:gateway")

    state = %__MODULE__{
      peers: %{},
      self_id: generate_self_id(),
      capabilities: detect_local_capabilities()
    }

    timer = Process.send_after(self(), :refresh, @refresh_interval)

    Logger.info("[PeerRegistry] initialized with self_id=#{state.self_id}")
    {:ok, %{state | refresh_timer: timer}}
  end

  @impl true
  def handle_call(:list_peers, _from, state) do
    peers = Map.values(state.peers)
    {:reply, {:ok, peers}, state}
  end

  def handle_call({:get_peer, peer_id}, _from, state) do
    case Map.get(state.peers, peer_id) do
      nil -> {:reply, {:error, :not_found}, state}
      peer -> {:reply, {:ok, peer}, state}
    end
  end

  def handle_call({:dispatch_to_peer, peer_id, task}, _from, state) do
    case Map.get(state.peers, peer_id) do
      nil ->
        {:reply, {:error, :peer_not_found}, state}

      %Peer{dispatch_capable: false} ->
        {:reply, {:error, :peer_not_dispatch_capable}, state}

      _peer ->
        result = Ema.Surfaces.GatewayClient.dispatch_task(
          Map.put(task, :target_peer, peer_id)
        )
        {:reply, result, state}
    end
  end

  def handle_call({:broadcast, message}, _from, state) do
    results = for {peer_id, _peer} <- state.peers do
      {peer_id, Ema.Surfaces.GatewayClient.send_message("peer:#{peer_id}", message)}
    end
    {:reply, {:ok, results}, state}
  end

  def handle_call(:self_capabilities, _from, state) do
    {:reply, {:ok, state.capabilities}, state}
  end

  @impl true
  def handle_cast({:register_self, capabilities}, state) do
    {:noreply, %{state | capabilities: Map.merge(state.capabilities, capabilities)}}
  end

  @impl true
  def handle_info({:peers_updated, raw_peers}, state) when is_list(raw_peers) do
    peers = raw_peers
    |> Enum.map(&parse_peer/1)
    |> Enum.reject(&is_nil/1)
    |> Map.new(fn peer -> {peer.id, peer} end)

    Logger.info("[PeerRegistry] peers updated: #{map_size(peers)} peer(s)")

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "surfaces:peers",
      {:peers_changed, Map.values(peers)}
    )

    {:noreply, %{state | peers: peers}}
  end

  def handle_info({:gateway_connected}, state) do
    # Request peer list on connect
    Ema.Surfaces.GatewayClient.get_peers()
    {:noreply, state}
  end

  def handle_info({:gateway_disconnected}, state) do
    # Mark all peers as potentially stale
    {:noreply, state}
  end

  def handle_info(:refresh, state) do
    # Re-detect local capabilities and refresh peers
    capabilities = detect_local_capabilities()
    Ema.Surfaces.GatewayClient.get_peers()

    timer = Process.send_after(self(), :refresh, @refresh_interval)
    {:noreply, %{state | capabilities: capabilities, refresh_timer: timer}}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  # --- Private ---

  defp parse_peer(raw) when is_map(raw) do
    %Peer{
      id: Map.get(raw, "id") || Map.get(raw, "deviceId"),
      device_id: Map.get(raw, "deviceId"),
      display_name: Map.get(raw, "displayName", "unknown"),
      platform: Map.get(raw, "platform"),
      role: Map.get(raw, "role", "peer"),
      scopes: Map.get(raw, "scopes", []),
      surfaces: Map.get(raw, "surfaces", []),
      load: Map.get(raw, "load", %{}),
      latency_ms: Map.get(raw, "latencyMs"),
      connected_at: Map.get(raw, "connectedAt"),
      last_seen: DateTime.utc_now(),
      dispatch_capable: "operator.write" in Map.get(raw, "scopes", [])
    }
  end

  defp parse_peer(_), do: nil

  defp detect_local_capabilities do
    %{
      claude: check_binary("claude"),
      codex: check_binary("codex"),
      openclaw: check_binary("openclaw"),
      ollama: check_binary("ollama"),
      platform: to_string(:os.type() |> elem(1)),
      hostname: node_hostname(),
      memory_mb: get_memory_mb(),
      ema_version: "0.1.0"
    }
  end

  defp check_binary(name) do
    case System.find_executable(name) do
      nil -> %{available: false}
      path ->
        # Try to get auth status
        %{
          available: true,
          path: path,
          auth: check_auth(name)
        }
    end
  end

  defp check_auth("claude") do
    case System.cmd("claude", ["auth", "status", "--json"],
           stderr_to_stdout: true, env: [{"PATH", System.get_env("PATH", "")}]) do
      {output, 0} ->
        case Jason.decode(output) do
          {:ok, status} -> Map.get(status, "authenticated", false)
          _ -> :unknown
        end
      _ -> :unknown
    end
  rescue
    _ -> :unknown
  end

  defp check_auth(_), do: :unknown

  defp node_hostname do
    {:ok, hostname} = :inet.gethostname()
    to_string(hostname)
  end

  defp get_memory_mb do
    case File.read("/proc/meminfo") do
      {:ok, content} ->
        case Regex.run(~r/MemTotal:\s+(\d+)/, content) do
          [_, kb] -> div(String.to_integer(kb), 1024)
          _ -> 0
        end
      _ -> 0
    end
  end

  defp generate_self_id do
    :crypto.strong_rand_bytes(16) |> Base.encode16(case: :lower) |> binary_part(0, 12)
  end
end
