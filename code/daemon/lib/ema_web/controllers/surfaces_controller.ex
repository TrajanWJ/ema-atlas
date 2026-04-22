defmodule EmaWeb.SurfacesController do
  use EmaWeb, :controller

  alias Ema.Surfaces.{
    Discovery,
    GatewayClient,
    PeerRegistry,
    Supervisor,
    ClaudeSession,
    CodexSession,
    HostTruth,
    ClaudeImporter,
    CodexImporter,
    HostSessionSync
  }

  alias Ema.Feedback.Broadcast
  alias Ema.ControlPlane.Persistence
  alias Ema.Sessions.Registry, as: SessionRegistry

  # GET /api/surfaces — all discovered surfaces + sessions
  def index(conn, _params) do
    {:ok, surfaces} = Discovery.get_surfaces()
    sessions = list_active_sessions()

    json(conn, %{
      surfaces: serialize_surfaces(surfaces),
      sessions: sessions,
      host_truth: HostTruth.snapshot(),
      discovered_at: get_discovery_time()
    })
  end

  # POST /api/surfaces/discover — re-run discovery
  def discover(conn, _params) do
    {:ok, surfaces} = Discovery.run_discovery()
    json(conn, %{surfaces: serialize_surfaces(surfaces)})
  end

  # GET /api/surfaces/gateway — gateway connection status
  def gateway(conn, _params) do
    case GatewayClient.get_status() do
      {:ok, status} -> json(conn, status)
      {:error, reason} -> json(conn |> put_status(503), %{error: reason})
    end
  end

  # GET /api/surfaces/peers — connected peers
  def peers(conn, _params) do
    {:ok, peers} = PeerRegistry.list_peers()
    {:ok, capabilities} = PeerRegistry.self_capabilities()

    json(conn, %{
      self: capabilities,
      peers: Enum.map(peers, &serialize_peer/1)
    })
  end

  # GET /api/surfaces/host-truth — host-observed loop state
  def host_truth(conn, _params) do
    json(conn, HostTruth.snapshot())
  end

  # GET /api/surfaces/operator-status — operator-focused host status projection
  def operator_status(conn, _params) do
    json(conn, HostTruth.operator_detail())
  end

  # POST /api/surfaces/peers/:peer_id/dispatch — dispatch task to specific peer
  def dispatch_to_peer(conn, %{"peer_id" => peer_id} = params) do
    task = Map.take(params, ["description", "agent", "priority", "timeout_minutes"])

    case PeerRegistry.dispatch_to_peer(peer_id, task) do
      {:ok, result} ->
        description = Map.get(task, "description", "(no description)")

        Broadcast.emit(
          :intent_stream,
          "[INTENT] Peer #{peer_id} ← #{String.slice(description, 0, 120)}"
        )

        json(conn, %{ok: true, result: result})

      {:error, reason} ->
        json(conn |> put_status(400), %{error: render_error(reason)})
    end
  end

  # GET /api/surfaces/sessions/import/claude — discover/import Claude host sessions
  def import_claude_sessions(conn, params) do
    limit = Map.get(params, "limit", 25)

    result =
      case Map.get(params, "mode", "import") do
        "discover" -> ClaudeImporter.discover_sessions(limit: parse_int(limit, 100))
        _ -> ClaudeImporter.import_recent(limit: parse_int(limit, 25))
      end

    json(conn, result)
  end

  # GET /api/surfaces/sessions/import/claude/:id/messages — preview Claude JSONL-derived messages
  def claude_imported_messages(conn, %{"id" => id}) do
    path = Path.join([ClaudeImporter.root(), "**", id <> ".jsonl"])

    case Path.wildcard(path) do
      [match | _] ->
        case ClaudeImporter.import_session(match) do
          {:ok, result} -> json(conn, %{ok: true, session: result})
          {:warning, result, warnings} -> json(conn, %{ok: true, session: result, warnings: warnings})
          {:error, reason} -> json(conn |> put_status(400), %{error: inspect(reason)})
        end

      [] ->
        json(conn |> put_status(404), %{error: "claude host session not found", provider_session_id: id})
    end
  end

  # GET /api/surfaces/sessions/import/codex — discover/import Codex host sessions
  def import_codex_sessions(conn, params) do
    limit = Map.get(params, "limit", 25)

    result =
      case Map.get(params, "mode", "import") do
        "discover" -> CodexImporter.discover_sessions(limit: parse_int(limit, 100))
        _ -> CodexImporter.import_recent(limit: parse_int(limit, 25))
      end

    json(conn, result)
  end

  # GET /api/surfaces/sessions/import/codex/:id/messages — preview Codex JSONL-derived import
  def codex_imported_messages(conn, %{"id" => id}) do
    path = Path.join([CodexImporter.root(), "**", "*" <> id <> ".jsonl"])

    case Path.wildcard(path) do
      [match | _] ->
        case CodexImporter.import_session(match) do
          {:ok, result} -> json(conn, %{ok: true, session: result})
          {:warning, result, warnings} -> json(conn, %{ok: true, session: result, warnings: warnings})
          {:error, reason} -> json(conn |> put_status(400), %{error: inspect(reason)})
        end

      [] ->
        json(conn |> put_status(404), %{error: "codex host session not found", provider_session_id: id})
    end
  end

  # POST /api/surfaces/host-sessions/sync — force host session import sync now
  def sync_host_sessions(conn, _params) do
    json(conn, HostSessionSync.sync_now())
  end

  # POST /api/surfaces/host-sessions/:id/resume — start a live surface session bound to imported host session
  def resume_host_session(conn, %{"id" => id} = params) do
    case Persistence.get_host_session(id) do
      nil ->
        json(conn |> put_status(404), %{error: "host session not found", id: id})

      host ->
        runtime_id = Map.get(params, "runtime_id", "resume-#{host.provider}-#{System.unique_integer([:positive])}")
        execution_id = Map.get(params, "execution_id", "#{host.provider}-session:" <> runtime_id)

        result =
          case host.provider do
            "claude" ->
              Supervisor.start_claude_session(runtime_id,
                session_id: host.provider_session_id,
                provider_session_id: host.provider_session_id,
                host_session_id: host.id,
                source: :imported_live_bound,
                execution_id: execution_id,
                resume: true,
                model: Map.get(params, "model", "sonnet"),
                surface_bindings: %{"host_session" => host.id}
              )

            "codex" ->
              Supervisor.start_codex_session(runtime_id,
                session_id: host.provider_session_id,
                provider_session_id: host.provider_session_id,
                host_session_id: host.id,
                source: :imported_live_bound,
                execution_id: execution_id,
                model: Map.get(params, "model"),
                surface_bindings: %{"host_session" => host.id}
              )

            other ->
              {:error, {:unsupported_provider, other}}
          end

        case result do
          {:ok, _pid} ->
            json(conn, %{ok: true, runtime_id: runtime_id, execution_id: execution_id, host_session_id: host.id, provider: host.provider})

          {:error, reason} ->
            json(conn |> put_status(400), %{error: inspect(reason), host_session_id: host.id})
        end
    end
  end

  # GET /api/surfaces/host-sessions — list persistence-backed imported host sessions
  def host_sessions(conn, params) do
    sessions =
      Persistence.list_host_sessions(
        provider: Map.get(params, "provider"),
        status: Map.get(params, "status"),
        limit: parse_int(Map.get(params, "limit", 100), 100)
      )

    json(conn, %{sessions: Enum.map(sessions, &serialize_host_session/1)})
  end

  # GET /api/surfaces/host-sessions/:id — inspect one imported host session with bindings
  def host_session(conn, %{"id" => id}) do
    case Persistence.get_host_session(id) do
      nil ->
        json(conn |> put_status(404), %{error: "host session not found", id: id})

      session ->
        json(conn, %{
          session: serialize_host_session(session),
          bindings: Enum.map(Persistence.list_surface_bindings(id), &serialize_binding/1),
          messages_count: length(Persistence.list_host_session_messages(id, limit: 1000)),
          events_count: length(Persistence.list_host_session_events(id, limit: 1000))
        })
    end
  end

  # GET /api/surfaces/host-sessions/:id/messages — normalized messages for imported session
  def host_session_messages(conn, %{"id" => id} = params) do
    messages = Persistence.list_host_session_messages(id, limit: parse_int(Map.get(params, "limit", 200), 200))
    json(conn, %{host_session_id: id, messages: Enum.map(messages, &serialize_message/1)})
  end

  # GET /api/surfaces/host-sessions/:id/events — normalized events for imported session
  def host_session_events(conn, %{"id" => id} = params) do
    events = Persistence.list_host_session_events(id, limit: parse_int(Map.get(params, "limit", 200), 200))
    json(conn, %{host_session_id: id, events: Enum.map(events, &serialize_event/1)})
  end

  # POST /api/surfaces/host-sessions/:id/bind — bind imported host session to EMA runtime/session surface metadata
  def bind_host_session(conn, %{"id" => id} = params) do
    binding = %{
      id: "bind_" <> Base.encode16(:crypto.strong_rand_bytes(6), case: :lower),
      host_session_id: id,
      surface_type: Map.get(params, "surface_type", "ema"),
      surface_id: Map.get(params, "surface_id", Map.get(params, "execution_id", "unknown")),
      binding_kind: Map.get(params, "binding_kind", "manual"),
      metadata: Map.get(params, "metadata", %{})
    }

    case Persistence.sync_surface_binding(binding) do
      {:ok, _} ->
        if execution_id = Map.get(params, "execution_id") do
          host = Persistence.get_host_session(id)

          _ =
            SessionRegistry.bind_host_session(execution_id, %{
              host_session_id: id,
              provider_session_id: host && host.provider_session_id,
              source: :imported_live_bound,
              surface_bindings: %{
                binding.surface_type => binding.surface_id
              }
            })
        end

        json(conn, %{ok: true, binding: binding})

      {:error, reason} ->
        json(conn |> put_status(400), %{error: inspect(reason)})
    end
  end

  # POST /api/surfaces/sessions/claude — start a new Claude session
  def create_claude_session(conn, params) do
    id = Map.get(params, "id", "claude-#{System.unique_integer([:positive])}")
    model = Map.get(params, "model", "sonnet")
    session_id = Map.get(params, "session_id")

    opts = [model: model]
    opts = if session_id, do: Keyword.put(opts, :session_id, session_id), else: opts

    case Supervisor.start_claude_session(id, opts) do
      {:ok, _pid} ->
        json(conn |> put_status(201), %{ok: true, id: id, type: :claude, model: model})

      {:error, {:already_started, _}} ->
        json(conn |> put_status(409), %{error: "session already exists", id: id})

      {:error, reason} ->
        json(conn |> put_status(500), %{error: inspect(reason)})
    end
  end

  # POST /api/surfaces/sessions/codex — start a new Codex session
  def create_codex_session(conn, params) do
    id = Map.get(params, "id", "codex-#{System.unique_integer([:positive])}")

    case Supervisor.start_codex_session(id) do
      {:ok, _pid} ->
        json(conn |> put_status(201), %{ok: true, id: id, type: :codex})

      {:error, reason} ->
        json(conn |> put_status(500), %{error: inspect(reason)})
    end
  end

  # POST /api/surfaces/sessions/:id/prompt — send prompt to session
  def send_prompt(conn, %{"id" => id, "prompt" => prompt} = params) do
    model = Map.get(params, "model")
    timeout = Map.get(params, "timeout", 120_000)
    async = Map.get(params, "async", false)

    opts = [timeout: timeout]
    opts = if model, do: Keyword.put(opts, :model, model), else: opts

    Broadcast.emit(
      :intent_stream,
      "[INTENT] Prompt → session #{id}: #{String.slice(prompt, 0, 120)}"
    )

    cond do
      session_alive?(:claude, id) and async ->
        ClaudeSession.send_prompt_async(id, prompt, opts)
        json(conn |> put_status(202), %{ok: true, async: true, id: id, type: :claude})

      session_alive?(:claude, id) ->
        case ClaudeSession.send_prompt(id, prompt, opts) do
          {:ok, result} -> json(conn, %{ok: true, type: :claude, result: result})
          {:error, reason} -> json(conn |> put_status(400), %{error: inspect(reason)})
        end

      session_alive?(:codex, id) and async ->
        CodexSession.send_prompt_async(id, prompt, opts)
        json(conn |> put_status(202), %{ok: true, async: true, id: id, type: :codex})

      session_alive?(:codex, id) ->
        case CodexSession.send_prompt(id, prompt, opts) do
          {:ok, result} -> json(conn, %{ok: true, type: :codex, result: result})
          {:error, reason} -> json(conn |> put_status(400), %{error: inspect(reason)})
        end

      true ->
        json(conn |> put_status(404), %{error: "session not found"})
    end
  end

  # GET /api/surfaces/sessions/:id — session status
  def session_status(conn, %{"id" => id}) do
    case safe_session_status(id) do
      {:ok, info} -> json(conn, info)
      {:error, _} -> json(conn |> put_status(404), %{error: "session not found"})
    end
  end

  # POST /api/surfaces/dispatch — native gateway dispatch
  def dispatch(conn, params) do
    task = %{
      description: Map.fetch!(params, "description"),
      agent: Map.get(params, "agent"),
      priority: Map.get(params, "priority", 2),
      timeout_minutes: Map.get(params, "timeout_minutes", 30),
      tags: Map.get(params, "tags", [])
    }

    case GatewayClient.dispatch_task(task) do
      {:ok, result} ->
        Broadcast.emit(
          :intent_stream,
          "[INTENT] Dispatching #{task.agent}: #{String.slice(task.description, 0, 140)}"
        )

        json(conn, %{ok: true, result: result})

      {:error, reason} ->
        json(conn |> put_status(502), %{error: render_error(reason)})
    end
  end

  # POST /api/surfaces/message — send message via gateway
  def send_gateway_message(conn, %{"channel" => channel, "message" => message} = params) do
    opts = Map.to_list(Map.take(params, ["format", "reply_to"]))

    case GatewayClient.send_message(channel, message, opts) do
      {:ok, result} -> json(conn, %{ok: true, result: result})
      {:error, reason} -> json(conn |> put_status(502), %{error: render_error(reason)})
    end
  end

  # --- Private ---

  defp list_active_sessions do
    claude_sessions =
      Ema.Surfaces.ClaudeSession.list_sessions()
      |> Enum.map(fn {:claude_session, id} ->
        case ClaudeSession.status(id) do
          {:ok, info} -> Map.put(info, :type, :claude)
          _ -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)

    codex_sessions =
      Registry.select(Ema.Surfaces.Registry, [{{{:codex_session, :"$1"}, :_, :_}, [], [:"$1"]}])
      |> Enum.map(fn
        {:codex_session, id} -> id
        id -> id
      end)
      |> Enum.map(fn id ->
        case CodexSession.status(id) do
          {:ok, info} -> Map.put(info, :type, :codex)
          _ -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)

    claude_sessions ++ codex_sessions
  end

  defp serialize_surfaces(surfaces) do
    Map.new(surfaces, fn {type, info} ->
      {type,
       %{
         type: info.type,
         id: info.id,
         status: info.status,
         auth: info.auth,
         model: info.model,
         version: info.version,
         details: info.details
       }}
    end)
  end

  defp serialize_host_session(session) do
    %{
      id: session.id,
      provider: session.provider,
      provider_session_id: session.provider_session_id,
      provider_project_key: session.provider_project_key,
      cwd: session.cwd,
      title: session.title,
      status: session.status,
      source: session.source,
      started_at: session.started_at,
      last_activity_at: session.last_activity_at,
      metadata: session.metadata
    }
  end

  defp serialize_message(message) do
    %{
      id: message.id,
      host_session_id: message.host_session_id,
      role: message.role,
      content: message.content,
      occurred_at: message.occurred_at,
      provider_event_id: message.provider_event_id,
      metadata: message.metadata
    }
  end

  defp serialize_event(event) do
    %{
      id: event.id,
      host_session_id: event.host_session_id,
      provider: event.provider,
      provider_event_kind: event.provider_event_kind,
      event_kind: event.event_kind,
      sequence: event.sequence,
      occurred_at: event.occurred_at,
      payload: event.payload,
      raw_ref: event.raw_ref,
      metadata: event.metadata
    }
  end

  defp serialize_binding(binding) do
    %{
      id: binding.id,
      host_session_id: binding.host_session_id,
      surface_type: binding.surface_type,
      surface_id: binding.surface_id,
      binding_kind: binding.binding_kind,
      metadata: binding.metadata,
      inserted_at: binding.inserted_at,
      updated_at: binding.updated_at
    }
  end

  defp serialize_peer(%PeerRegistry.Peer{} = peer) do
    Map.from_struct(peer)
  end

  defp serialize_peer(peer), do: peer

  defp get_discovery_time do
    case Discovery.get_surfaces() do
      {:ok, _} -> DateTime.utc_now() |> DateTime.to_iso8601()
      _ -> nil
    end
  end

  defp render_error(reason) when is_binary(reason), do: reason
  defp render_error(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp render_error(reason), do: reason

  defp safe_session_status(id) do
    cond do
      session_alive?(:claude, id) -> ClaudeSession.status(id)
      session_alive?(:codex, id) -> CodexSession.status(id)
      true -> {:error, :not_found}
    end
  end

  defp session_alive?(:claude, id), do: GenServer.whereis({:via, Registry, {Ema.Surfaces.Registry, {:claude_session, id}}}) != nil
  defp session_alive?(:codex, id), do: GenServer.whereis({:via, Registry, {Ema.Surfaces.Registry, {:codex_session, id}}}) != nil

  defp parse_int(value, default) when is_integer(value), do: value
  defp parse_int(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {n, _} -> n
      :error -> default
    end
  end
  defp parse_int(_, default), do: default
end
