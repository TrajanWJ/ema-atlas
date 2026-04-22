defmodule Ema.Surfaces.GatewayClient do
  @moduledoc """
  WebSocket client for OpenClaw Gateway.

  Connects to the gateway the same way `openclaw tui` does — via WebSocket on
  port 18789. This gives EMA:
  - Native dispatch (submit/claim tasks without file-based queues)
  - Real-time event stream (agent state, session updates)
  - Peer discovery (enumerate connected devices)
  - Message delivery (Discord, Telegram, etc. through gateway)

  Auth uses the operator token from the paired device registry.
  """

  use GenServer
  require Logger

  alias Ema.Executions.Events

  @gateway_url "ws://127.0.0.1:18789"
  @reconnect_delay 5_000
  @heartbeat_interval 30_000
  @health_check_interval 60_000

  defstruct [
    :conn,
    :stream,
    :status,
    :gateway_url,
    :auth_token,
    :connected_at,
    :last_heartbeat,
    :reconnect_timer,
    :heartbeat_timer,
    :health_timer,
    :buffer,
    :pending_requests,
    :gateway_info,
    :peers
  ]

  # --- Public API ---

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def dispatch_task(task) do
    GenServer.call(__MODULE__, {:dispatch, task}, 15_000)
  end

  def send_message(channel, message, opts \\ []) do
    GenServer.call(__MODULE__, {:send_message, channel, message, opts})
  end

  def get_peers do
    GenServer.call(__MODULE__, :get_peers)
  end

  def get_status do
    GenServer.call(__MODULE__, :get_status)
  end

  def get_sessions do
    GenServer.call(__MODULE__, {:gateway_command, "sessions.list", %{}})
  end

  def get_agent_status(agent_id) do
    GenServer.call(__MODULE__, {:gateway_command, "agent.status", %{agent: agent_id}})
  end

  # --- GenServer callbacks ---

  @impl true
  def init(opts) do
    gateway_url = Keyword.get(opts, :gateway_url, @gateway_url)
    auth_token = Keyword.get(opts, :auth_token)

    state = %__MODULE__{
      status: :disconnected,
      gateway_url: gateway_url,
      auth_token: auth_token,
      buffer: "",
      pending_requests: %{},
      peers: [],
      gateway_info: nil
    }

    send(self(), :connect)
    {:ok, state}
  end

  @impl true
  def handle_call({:dispatch, task}, from, %{status: :connected} = state) do
    request_id = "ema-#{System.unique_integer([:positive])}"
    execution_id = gateway_execution_id(task, request_id)

    Events.emit(execution_id, :execution_created, %{
      status: :queued,
      phase: :dispatch,
      actor: %{type: "surface", label: "gateway_client"},
      summary_line: "Gateway dispatch queued",
      payload: %{request_id: request_id, task: summarize_gateway_task(task)}
    })

    case build_agent_request(request_id, task) do
      {:ok, payload} ->
        case send_ws(state, payload) do
          :ok ->
            pending = Map.put(state.pending_requests, request_id, %{from: from, execution_id: execution_id, kind: :dispatch})

            Events.emit(execution_id, :execution_started, %{
              status: :running,
              phase: :dispatch,
              actor: %{type: "surface", label: "gateway_client"},
              summary_line: "Gateway dispatch sent",
              payload: %{request_id: request_id}
            })

            {:noreply, %{state | pending_requests: pending}}

          {:error, reason} ->
            Events.emit(execution_id, :execution_failed, %{
              status: :failed,
              phase: :done,
              actor: %{type: "surface", label: "gateway_client"},
              summary_line: "Gateway dispatch failed before send",
              payload: %{request_id: request_id, error: inspect(reason)}
            })

            {:reply, {:error, reason}, state}
        end

      {:error, reason} ->
        Events.emit(execution_id, :execution_failed, %{
          status: :failed,
          phase: :done,
          actor: %{type: "surface", label: "gateway_client"},
          summary_line: "Gateway dispatch request invalid",
          payload: %{request_id: request_id, error: inspect(reason)}
        })

        {:reply, {:error, reason}, state}
    end
  end

  def handle_call({:dispatch, _task}, _from, state) do
    {:reply, {:error, :not_connected}, state}
  end

  def handle_call({:send_message, channel, message, opts}, from, %{status: :connected} = state) do
    request_id = "ema-msg-#{System.unique_integer([:positive])}"

    case build_send_request(request_id, channel, message, opts) do
      {:ok, payload} ->
        case send_ws(state, payload) do
          :ok ->
            pending = Map.put(state.pending_requests, request_id, from)
            {:noreply, %{state | pending_requests: pending}}

          {:error, reason} ->
            {:reply, {:error, reason}, state}
        end

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call({:send_message, _, _, _}, _from, state) do
    {:reply, {:error, :not_connected}, state}
  end

  def handle_call(:get_peers, _from, state) do
    {:reply, {:ok, state.peers}, state}
  end

  def handle_call(:get_status, _from, state) do
    info = %{
      status: state.status,
      connected_at: state.connected_at,
      last_heartbeat: state.last_heartbeat,
      gateway_info: state.gateway_info,
      peer_count: length(state.peers),
      pending_requests: map_size(state.pending_requests)
    }

    {:reply, {:ok, info}, state}
  end

  def handle_call({:gateway_command, command, params}, from, %{status: :connected} = state) do
    request_id = "ema-cmd-#{System.unique_integer([:positive])}"

    payload = %{
      type: "req",
      id: request_id,
      method: command,
      params: params
    }

    case send_ws(state, payload) do
      :ok ->
        pending = Map.put(state.pending_requests, request_id, from)
        {:noreply, %{state | pending_requests: pending}}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call({:gateway_command, _, _}, _from, state) do
    {:reply, {:error, :not_connected}, state}
  end

  @impl true
  def handle_info(:connect, state) do
    auth_token = state.auth_token || load_operator_token()

    case connect_to_gateway(state.gateway_url, auth_token) do
      {:ok, conn, stream} ->
        Logger.info("[GatewayClient] connected to #{state.gateway_url}")

        heartbeat_timer = Process.send_after(self(), :heartbeat, @heartbeat_interval)
        health_timer = Process.send_after(self(), :health_check, @health_check_interval)

        Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:gateway", {:gateway_connected})

        {:noreply,
         %{
           state
           | conn: conn,
             stream: stream,
             status: :connected,
             auth_token: auth_token,
             connected_at: DateTime.utc_now(),
             heartbeat_timer: heartbeat_timer,
             health_timer: health_timer,
             buffer: ""
         }}

      {:error, reason} ->
        Logger.warning(
          "[GatewayClient] connection failed: #{inspect(reason)}, retrying in #{@reconnect_delay}ms"
        )

        timer = Process.send_after(self(), :connect, @reconnect_delay)
        {:noreply, %{state | status: :reconnecting, reconnect_timer: timer}}
    end
  end

  def handle_info(:heartbeat, %{status: :connected} = state) do
    send_ws(state, %{
      type: "req",
      id: "ema-hb-#{System.unique_integer([:positive])}",
      method: "heartbeat",
      params: %{}
    })

    timer = Process.send_after(self(), :heartbeat, @heartbeat_interval)
    {:noreply, %{state | last_heartbeat: DateTime.utc_now(), heartbeat_timer: timer}}
  end

  def handle_info(:heartbeat, state), do: {:noreply, state}

  def handle_info(:health_check, %{status: :connected} = state) do
    # Request peer list and gateway info
    send_request(state, "channels.status", %{})
    send_request(state, "system.status", %{})
    timer = Process.send_after(self(), :health_check, @health_check_interval)
    {:noreply, %{state | health_timer: timer}}
  end

  def handle_info(:health_check, state), do: {:noreply, state}

  # Handle gun messages
  def handle_info({:gun_ws, _conn, _stream, {:text, data}}, state) do
    case Jason.decode(data) do
      {:ok, message} ->
        {:noreply, handle_gateway_message(message, state)}

      {:error, _} ->
        Logger.warning(
          "[GatewayClient] received unparseable message: #{String.slice(data, 0, 200)}"
        )

        {:noreply, state}
    end
  end

  def handle_info({:gun_ws, _conn, _stream, {:close, code, reason}}, state) do
    Logger.warning("[GatewayClient] WebSocket closed: #{code} #{reason}")
    handle_disconnect(state)
  end

  def handle_info({:gun_down, _conn, :ws, reason, _}, state) do
    Logger.warning("[GatewayClient] connection down: #{inspect(reason)}")
    handle_disconnect(state)
  end

  def handle_info({:gun_error, _conn, _stream, reason}, state) do
    Logger.warning("[GatewayClient] error: #{inspect(reason)}")
    handle_disconnect(state)
  end

  def handle_info({:gun_upgrade, _conn, _stream, ["websocket"], _headers}, state) do
    Logger.debug("[GatewayClient] WebSocket upgrade complete")
    {:noreply, state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  # --- Private ---

  defp connect_to_gateway(url, auth_token) do
    uri = URI.parse(url)
    host = String.to_charlist(uri.host || "127.0.0.1")
    port = uri.port || 18789

    case :gun.open(host, port, %{protocols: [:http], transport: :tcp}) do
      {:ok, conn} ->
        case :gun.await_up(conn, 5_000) do
          {:ok, _protocol} ->
            path = "/?token=#{auth_token}&client=ema-daemon&version=0.1.0"
            stream = :gun.ws_upgrade(conn, String.to_charlist(path))

            receive do
              {:gun_upgrade, ^conn, ^stream, ["websocket"], _headers} ->
                {:ok, conn, stream}

              {:gun_response, ^conn, ^stream, _, status, _headers} ->
                :gun.close(conn)
                {:error, {:upgrade_failed, status}}

              {:gun_error, ^conn, ^stream, reason} ->
                :gun.close(conn)
                {:error, reason}
            after
              5_000 ->
                :gun.close(conn)
                {:error, :upgrade_timeout}
            end

          {:error, reason} ->
            :gun.close(conn)
            {:error, reason}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp handle_disconnect(state) do
    if state.heartbeat_timer, do: Process.cancel_timer(state.heartbeat_timer)
    if state.health_timer, do: Process.cancel_timer(state.health_timer)
    if state.conn, do: :gun.close(state.conn)

    # Fail all pending requests
    for {_id, from} <- state.pending_requests do
      GenServer.reply(from, {:error, :disconnected})
    end

    Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:gateway", {:gateway_disconnected})

    timer = Process.send_after(self(), :connect, @reconnect_delay)

    {:noreply,
     %{
       state
       | conn: nil,
         stream: nil,
         status: :reconnecting,
         reconnect_timer: timer,
         pending_requests: %{},
         heartbeat_timer: nil,
         health_timer: nil
     }}
  end

  defp handle_gateway_message(
         %{"type" => "event", "event" => "connect.challenge", "payload" => %{"nonce" => nonce}},
         state
       ) do
    Logger.info("[GatewayClient] received connect.challenge, sending connect request")

    case build_connect_request(state.auth_token, nonce) do
      {:ok, connect_req} ->
        redacted =
          connect_req
          |> put_in([:params, :auth, :token], redact_token(get_in(connect_req, [:params, :auth, :token])))
          |> put_in([:params, :auth, :deviceToken], redact_token(get_in(connect_req, [:params, :auth, :deviceToken])))
        Logger.warning("[GatewayClient] connect request payload=#{inspect(redacted, pretty: true, limit: :infinity)}")
        send_ws(state, connect_req)

      {:error, reason} ->
        Logger.error("[GatewayClient] failed to build signed connect request: #{inspect(reason)}")
    end

    state
  end

  # Handle connect response (type: "res" for the connect request)

  defp redact_token(nil), do: nil
  defp redact_token(token) when is_binary(token) do
    len = String.length(token)
    if len <= 10, do: String.duplicate("*", len), else: String.slice(token, 0, 6) <> "..." <> String.slice(token, -4, 4)
  end

  defp handle_gateway_message(%{"type" => "res", "ok" => true} = msg, state) do
    id = Map.get(msg, "id", "")

    if String.starts_with?(id, "ema-connect-") do
      Logger.info("[GatewayClient] connection accepted by gateway")
      Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:gateway", {:gateway_authenticated})

      # Request initial state
      send_request(state, "system.status", %{})
      state
    else
      # Regular response — route to pending requests
      handle_response(msg, state)
    end
  end

  defp handle_gateway_message(%{"type" => "res", "ok" => false} = msg, state) do
    id = Map.get(msg, "id", "")

    if String.starts_with?(id, "ema-connect-") do
      error = get_in(msg, ["error", "message"]) || "unknown"
      Logger.error("[GatewayClient] connection rejected: #{error}")
      state
    else
      handle_error_response(msg, state)
    end
  end

  defp handle_gateway_message(%{"type" => "response", "id" => _id} = msg, state) do
    handle_response(msg, state)
  end

  defp handle_gateway_message(%{"type" => "error", "id" => _id} = msg, state) do
    handle_error_response(msg, state)
  end

  defp handle_gateway_message(%{"type" => "system.peers", "peers" => peers}, state) do
    Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:gateway", {:peers_updated, peers})
    %{state | peers: peers}
  end

  defp handle_gateway_message(%{"type" => "system.info"} = info, state) do
    %{state | gateway_info: info}
  end

  defp handle_gateway_message(%{"type" => "dispatch.update"} = event, state) do
    Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:dispatch", {:dispatch_event, event})
    state
  end

  defp handle_gateway_message(%{"type" => "agent.event"} = event, state) do
    Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:agents", {:agent_event, event})
    state
  end

  defp handle_gateway_message(%{"type" => "message.received"} = event, state) do
    Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:messages", {:message_received, event})
    state
  end

  defp handle_gateway_message(%{"type" => type} = msg, state) do
    # Broadcast all unhandled gateway events for extensibility
    Phoenix.PubSub.broadcast(Ema.PubSub, "surfaces:gateway:raw", {:gateway_event, type, msg})
    state
  end

  defp handle_gateway_message(_msg, state), do: state

  defp handle_response(msg, state) do
    id = Map.get(msg, "id")

    case Map.pop(state.pending_requests, id) do
      {nil, _} ->
        state

      {%{from: from, execution_id: execution_id, kind: :dispatch}, remaining} ->
        payload = Map.get(msg, "payload", Map.get(msg, "data", msg))
        GenServer.reply(from, {:ok, payload})

        Events.emit(execution_id, :execution_completed, %{
          status: :succeeded,
          phase: :done,
          actor: %{type: "surface", label: "gateway_client"},
          summary_line: "Gateway dispatch acknowledged",
          payload: %{request_id: id, response: payload}
        })

        %{state | pending_requests: remaining}

      {from, remaining} ->
        GenServer.reply(from, {:ok, Map.get(msg, "payload", Map.get(msg, "data", msg))})
        %{state | pending_requests: remaining}
    end
  end

  defp handle_error_response(msg, state) do
    id = Map.get(msg, "id")

    case Map.pop(state.pending_requests, id) do
      {nil, _} ->
        state

      {%{from: from, execution_id: execution_id, kind: :dispatch}, remaining} ->
        error = Map.get(msg, "error", "unknown")
        GenServer.reply(from, {:error, error})

        Events.emit(execution_id, :execution_failed, %{
          status: :failed,
          phase: :done,
          actor: %{type: "surface", label: "gateway_client"},
          summary_line: "Gateway dispatch rejected",
          payload: %{request_id: id, error: error}
        })

        %{state | pending_requests: remaining}

      {from, remaining} ->
        GenServer.reply(from, {:error, Map.get(msg, "error", "unknown")})
        %{state | pending_requests: remaining}
    end
  end

  defp send_request(state, method, params) do
    request_id = "ema-#{method}-#{System.unique_integer([:positive])}"
    frame = %{type: "req", id: request_id, method: method, params: params}
    send_ws(state, frame)
    request_id
  end

  defp send_ws(%{conn: conn, stream: stream}, payload) when not is_nil(conn) do
    case Jason.encode(payload) do
      {:ok, json} ->
        :gun.ws_send(conn, stream, {:text, json})
        :ok

      {:error, reason} ->
        {:error, {:encode_error, reason}}
    end
  end

  defp send_ws(_, _), do: {:error, :not_connected}

  defp load_operator_token do
    # Prefer live OpenClaw state over inherited shell env so EMA follows
    # gateway token rotations instead of pinning stale process env.
    load_token_from_env_file() ||
      load_token_from_paired_devices() ||
      System.get_env("OPENCLAW_GATEWAY_TOKEN") ||
      System.get_env("CLAWDBOT_GATEWAY_TOKEN")
  end

  defp load_token_from_env_file do
    path = Path.expand("~/.openclaw/.env")

    case File.read(path) do
      {:ok, content} ->
        case Regex.run(~r/OPENCLAW_GATEWAY_TOKEN=(.+)/, content) do
          [_, token] -> String.trim(token)
          _ -> nil
        end

      _ ->
        nil
    end
  end

  defp load_token_from_paired_devices do
    path = Path.expand("~/.openclaw/devices/paired.json")

    case File.read(path) do
      {:ok, content} ->
        case Jason.decode(content) do
          {:ok, devices} ->
            devices
            |> Map.values()
            |> List.first()
            |> get_in(["tokens", "operator", "token"])

          _ ->
            nil
        end

      _ ->
        nil
    end
  end

  defp build_connect_request(auth_token, nonce) do
    with {:ok, identity} <- load_device_identity(),
         {:ok, device_auth} <- load_device_auth(),
         {:ok, device} <-
           build_signed_device(
             identity,
             auth_token || device_auth.token,
             device_auth.scopes,
             nonce
           ) do
      {:ok,
       %{
         type: "req",
         id: "ema-connect-#{System.unique_integer([:positive])}",
         method: "connect",
         params: %{
           minProtocol: 3,
           maxProtocol: 3,
           client: %{
             id: "gateway-client",
             version: "0.1.0",
             platform: "linux",
             mode: "backend"
           },
           role: "operator",
           scopes: device_auth.scopes,
           caps: [],
           commands: [],
           permissions: %{},
           auth: %{
             token: auth_token,
             deviceToken: device_auth.token
           },
           locale: "en-US",
           userAgent: "ema-gateway-client/0.1.0",
           device: device
         }
       }}
    end
  end

  defp build_agent_request(request_id, task) do
    message = get_task_value(task, :message) || get_task_value(task, :description)
    agent_id = get_task_value(task, :agent_id) || get_task_value(task, :agent)
    session_key = get_task_value(task, :session_key)
    thinking = get_task_value(task, :thinking)
    deliver = get_task_value(task, :deliver)
    timeout_seconds = normalize_timeout_seconds(get_task_value(task, :timeout_minutes))

    if is_binary(message) and String.trim(message) != "" do
      params =
        %{
          message: String.trim(message),
          idempotencyKey: "ema-agent-#{System.unique_integer([:positive])}",
          deliver: if(is_boolean(deliver), do: deliver, else: false)
        }
        |> maybe_put("agentId", normalize_optional_string(agent_id))
        |> maybe_put("sessionKey", normalize_optional_string(session_key))
        |> maybe_put("thinking", normalize_optional_string(thinking))
        |> maybe_put("timeout", timeout_seconds)

      {:ok, %{type: "req", id: request_id, method: "agent", params: params}}
    else
      {:error, :missing_message}
    end
  end

  defp build_send_request(request_id, target, message, opts) do
    with {:ok, channel, to} <- resolve_send_target(target, opts),
         text when is_binary(text) and text != "" <- String.trim(message) do
      params =
        %{
          to: to,
          message: text,
          idempotencyKey: "ema-send-#{System.unique_integer([:positive])}"
        }
        |> maybe_put("channel", channel)
        |> maybe_put("threadId", normalize_optional_string(keyword_get(opts, "reply_to")))
        |> maybe_put("sessionKey", normalize_optional_string(keyword_get(opts, "session_key")))

      {:ok, %{type: "req", id: request_id, method: "send", params: params}}
    else
      "" -> {:error, :missing_message}
      {:error, reason} -> {:error, reason}
    end
  end

  defp load_device_identity do
    path = Path.expand("~/.openclaw/identity/device.json")

    with {:ok, content} <- File.read(path),
         {:ok, identity} <- Jason.decode(content),
         device_id when is_binary(device_id) <- identity["deviceId"],
         public_key_pem when is_binary(public_key_pem) <- identity["publicKeyPem"],
         private_key_pem when is_binary(private_key_pem) <- identity["privateKeyPem"] do
      {:ok,
       %{
         device_id: device_id,
         public_key_pem: public_key_pem,
         private_key_pem: private_key_pem
       }}
    else
      _ -> {:error, {:invalid_device_identity, path}}
    end
  end

  defp load_device_auth do
    path = Path.expand("~/.openclaw/identity/device-auth.json")

    with {:ok, content} <- File.read(path),
         {:ok, auth} <- Jason.decode(content),
         token when is_binary(token) <- get_in(auth, ["tokens", "operator", "token"]),
         scopes when is_list(scopes) <- get_in(auth, ["tokens", "operator", "scopes"]) do
      {:ok,
       %{
         token: token,
         scopes: Enum.map(scopes, &to_string/1)
       }}
    else
      _ -> {:error, {:invalid_device_auth, path}}
    end
  end

  defp build_signed_device(identity, signature_token, scopes, nonce) do
    signed_at_ms = System.system_time(:millisecond)

    payload =
      build_device_auth_payload_v3(
        identity.device_id,
        "gateway-client",
        "backend",
        "operator",
        scopes,
        signed_at_ms,
        signature_token,
        nonce,
        "elixir",
        nil
      )

    with {:ok, private_key} <- decode_private_key(identity.private_key_pem),
         {:ok, public_key_raw} <- extract_public_key_raw(identity.public_key_pem) do
      signature = :public_key.sign(payload, :none, private_key)

      {:ok,
       %{
         id: identity.device_id,
         publicKey: Base.url_encode64(public_key_raw, padding: false),
         signature: Base.url_encode64(signature, padding: false),
         signedAt: signed_at_ms,
         nonce: nonce
       }}
    end
  end

  defp build_device_auth_payload_v3(
         device_id,
         client_id,
         client_mode,
         role,
         scopes,
         signed_at_ms,
         token,
         nonce,
         platform,
         device_family
       ) do
    [
      "v3",
      device_id,
      client_id,
      client_mode,
      role,
      Enum.join(scopes, ","),
      Integer.to_string(signed_at_ms),
      token || "",
      nonce,
      normalize_device_metadata(platform),
      normalize_device_metadata(device_family)
    ]
    |> Enum.join("|")
  end

  defp normalize_device_metadata(nil), do: ""
  defp normalize_device_metadata(value), do: value |> to_string() |> String.trim()

  defp normalize_timeout_seconds(nil), do: nil
  defp normalize_timeout_seconds(value) when is_integer(value) and value >= 0, do: value * 60

  defp normalize_timeout_seconds(value) when is_binary(value) do
    case Integer.parse(String.trim(value)) do
      {minutes, ""} when minutes >= 0 -> minutes * 60
      _ -> nil
    end
  end

  defp normalize_timeout_seconds(_), do: nil

  defp resolve_send_target(target, opts) when is_binary(target) do
    trimmed = String.trim(target)

    cond do
      trimmed == "" ->
        {:error, :missing_target}

      String.starts_with?(trimmed, "peer:") ->
        {:error, :unsupported_peer_target}

      true ->
        case String.split(trimmed, ":", parts: 2) do
          [channel, raw_to] when channel in ["discord", "slack"] ->
            {:ok, channel, normalize_channel_target(raw_to)}

          [channel, raw_to] when channel in ["telegram", "signal", "whatsapp", "sms"] ->
            {:ok, channel, String.trim(raw_to)}

          _ ->
            {:ok, normalize_optional_string(keyword_get(opts, "channel")), trimmed}
        end
    end
  end

  defp resolve_send_target(_, _), do: {:error, :missing_target}


  defp normalize_channel_target(value) do
    trimmed = String.trim(value)

    if String.contains?(trimmed, ":") do
      trimmed
    else
      "channel:" <> trimmed
    end
  end

  defp get_task_value(task, key) when is_map(task) do
    Map.get(task, key) || Map.get(task, Atom.to_string(key))
  end

  defp keyword_get(opts, key) when is_list(opts) do
    atom_key = String.to_atom(key)

    case List.keyfind(opts, atom_key, 0) || List.keyfind(opts, key, 0) do
      {_, value} -> value
      nil -> nil
    end
  end

  defp normalize_optional_string(nil), do: nil

  defp normalize_optional_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp normalize_optional_string(value), do: value |> to_string() |> normalize_optional_string()

  defp summarize_gateway_task(task) when is_map(task) do
    %{
      description: get_task_value(task, :description),
      agent: get_task_value(task, :agent),
      agent_id: get_task_value(task, :agent_id),
      session_key: get_task_value(task, :session_key)
    }
  end

  defp gateway_execution_id(task, request_id) do
    get_task_value(task, :execution_id) ||
      get_task_value(task, :session_key) ||
      "gateway-dispatch:" <> request_id
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp decode_private_key(private_key_pem) do
    case :public_key.pem_decode(private_key_pem) do
      [entry] -> {:ok, :public_key.pem_entry_decode(entry)}
      _ -> {:error, :invalid_private_key}
    end
  end

  defp extract_public_key_raw(public_key_pem) do
    case :public_key.pem_decode(public_key_pem) do
      [entry] ->
        case :public_key.pem_entry_decode(entry) do
          {{:ECPoint, point}, {:namedCurve, {1, 3, 101, 112}}} -> {:ok, point}
          other -> {:error, {:invalid_public_key, other}}
        end

      _ ->
        {:error, :invalid_public_key_pem}
    end
  end
end
