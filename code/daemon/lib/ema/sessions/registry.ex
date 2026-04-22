defmodule Ema.Sessions.Registry do
  @moduledoc """
  Execution/session fact registry.

  Keeps durable-enough in-memory ownership over live session facts so incident
  recovery can act through one runtime authority instead of ad hoc surface code.
  """

  use GenServer

  alias Ema.Executions.Events
  alias Ema.Surfaces.{ClaudeSession, CodexSession, Supervisor}

  @history_limit 200

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def register_session(id, type, attrs \\ %{}) do
    GenServer.call(__MODULE__, {:register_session, id, type, attrs})
  end

  def record_progress(id, attrs \\ %{}) do
    GenServer.cast(__MODULE__, {:record_progress, id, attrs})
  end

  def mark_terminal(id, status, attrs \\ %{}) do
    GenServer.call(__MODULE__, {:mark_terminal, id, status, attrs})
  end

  def request_action(execution_id, action, attrs \\ %{}) do
    GenServer.call(__MODULE__, {:request_action, execution_id, action, attrs})
  end

  def list_sessions do
    GenServer.call(__MODULE__, :list_sessions)
  end

  def status(execution_id) do
    GenServer.call(__MODULE__, {:status, execution_id})
  end

  def bind_host_session(execution_id, attrs \\ %{}) do
    GenServer.call(__MODULE__, {:bind_host_session, execution_id, attrs})
  end

  @impl true
  def init(_opts) do
    {:ok, %{sessions: %{}, actions: []}}
  end

  @impl true
  def handle_call({:register_session, id, type, attrs}, _from, state) do
    now = DateTime.utc_now()

    execution_id =
      Map.get(attrs, :execution_id) || Map.get(attrs, "execution_id") ||
        default_execution_id(type, id)

    session = %{
      execution_id: execution_id,
      session_id: id,
      type: normalize_type(type),
      model: Map.get(attrs, :model) || Map.get(attrs, "model"),
      provider_session_id: Map.get(attrs, :provider_session_id) || Map.get(attrs, "provider_session_id") || id,
      host_session_id: Map.get(attrs, :host_session_id) || Map.get(attrs, "host_session_id"),
      source: Map.get(attrs, :source) || Map.get(attrs, "source") || :live,
      surface_bindings: Map.get(attrs, :surface_bindings) || Map.get(attrs, "surface_bindings") || %{},
      status: Map.get(attrs, :status) || Map.get(attrs, "status") || :idle,
      started_at: Map.get(attrs, :started_at) || now,
      last_progress_at: Map.get(attrs, :last_progress_at) || now,
      last_activity_at: now,
      operator_requests: []
    }

    {:reply, {:ok, session}, %{state | sessions: Map.put(state.sessions, execution_id, session)}}
  end

  def handle_call({:mark_terminal, id, status, attrs}, _from, state) do
    execution_id = Map.get(attrs, :execution_id) || Map.get(attrs, "execution_id") || id

    updated =
      Map.update(
        state.sessions,
        execution_id,
        %{execution_id: execution_id, session_id: id, type: :unknown, provider_session_id: id, source: :live, status: status},
        fn session ->
          session
          |> Map.put(:status, status)
          |> Map.put(:last_activity_at, DateTime.utc_now())
        end
      )

    {:reply, :ok, %{state | sessions: updated}}
  end

  def handle_call({:request_action, execution_id, action, attrs}, _from, state) do
    now = DateTime.utc_now()
    actor = Map.get(attrs, :actor) || Map.get(attrs, "actor") || "incident-authority"

    action_entry = %{
      execution_id: execution_id,
      action: normalize_action(action),
      actor: actor,
      requested_at: now,
      attrs: attrs
    }

    sessions =
      case Map.fetch(state.sessions, execution_id) do
        {:ok, session} ->
          Map.put(state.sessions, execution_id, %{
            session
            | operator_requests: [action_entry | session.operator_requests] |> Enum.take(20)
          })

        :error ->
          state.sessions
      end

    next_state = %{
      state
      | sessions: sessions,
        actions: [action_entry | state.actions] |> Enum.take(@history_limit)
    }

    result = maybe_async_perform_action(execution_id, action_entry, sessions)

    {:reply, result, next_state}
  end

  def handle_call(:list_sessions, _from, state) do
    {:reply, Map.values(state.sessions), state}
  end

  def handle_call({:status, execution_id}, _from, state) do
    {:reply, Map.get(state.sessions, execution_id), state}
  end

  def handle_call({:bind_host_session, execution_id, attrs}, _from, state) do
    updated =
      Map.update(state.sessions, execution_id, nil, fn session ->
        session
        |> maybe_put(:host_session_id, Map.get(attrs, :host_session_id) || Map.get(attrs, "host_session_id"))
        |> maybe_put(:provider_session_id, Map.get(attrs, :provider_session_id) || Map.get(attrs, "provider_session_id"))
        |> maybe_put(:source, Map.get(attrs, :source) || Map.get(attrs, "source") || :imported_live_bound)
        |> merge_surface_bindings(Map.get(attrs, :surface_bindings) || Map.get(attrs, "surface_bindings"))
        |> Map.put(:last_activity_at, DateTime.utc_now())
      end)

    {:reply, Map.get(updated, execution_id), %{state | sessions: updated}}
  end

  @impl true
  def handle_cast({:record_progress, id, attrs}, state) do
    execution_id = Map.get(attrs, :execution_id) || Map.get(attrs, "execution_id") || id
    now = Map.get(attrs, :at) || Map.get(attrs, "at") || DateTime.utc_now()

    sessions =
      Map.update(
        state.sessions,
        execution_id,
        %{
          execution_id: execution_id,
          session_id: id,
          type: Map.get(attrs, :type) || Map.get(attrs, "type") || :unknown,
          provider_session_id: Map.get(attrs, :provider_session_id) || Map.get(attrs, "provider_session_id") || id,
          host_session_id: Map.get(attrs, :host_session_id) || Map.get(attrs, "host_session_id"),
          source: Map.get(attrs, :source) || Map.get(attrs, "source") || :live,
          surface_bindings: Map.get(attrs, :surface_bindings) || Map.get(attrs, "surface_bindings") || %{},
          status: Map.get(attrs, :status) || Map.get(attrs, "status") || :running,
          started_at: now,
          last_progress_at: now,
          last_activity_at: now,
          operator_requests: []
        },
        fn session ->
          session
          |> Map.put(
            :status,
            Map.get(attrs, :status) || Map.get(attrs, "status") || session.status
          )
          |> maybe_put(:provider_session_id, Map.get(attrs, :provider_session_id) || Map.get(attrs, "provider_session_id"))
          |> maybe_put(:host_session_id, Map.get(attrs, :host_session_id) || Map.get(attrs, "host_session_id"))
          |> maybe_put(:source, Map.get(attrs, :source) || Map.get(attrs, "source"))
          |> merge_surface_bindings(Map.get(attrs, :surface_bindings) || Map.get(attrs, "surface_bindings"))
          |> Map.put(:last_progress_at, now)
          |> Map.put(:last_activity_at, now)
        end
      )

    {:noreply, %{state | sessions: sessions}}
  end

  defp maybe_async_perform_action(execution_id, %{action: action} = action_entry, sessions)
       when action in [:restart, :kill] do
    Task.start(fn ->
      _ = perform_action(execution_id, action_entry, sessions)
    end)

    {:ok, %{recorded: true, action: action, queued: true}}
  end

  defp maybe_async_perform_action(execution_id, action_entry, sessions) do
    perform_action(execution_id, action_entry, sessions)
  end

  defp perform_action(execution_id, %{action: :restart} = action, sessions) do
    case Map.get(sessions, execution_id) do
      %{type: :claude, session_id: session_id} = session ->
        _ = safe_stop(session)

        case Supervisor.start_claude_session(session_id,
               model: session.model,
               execution_id: execution_id,
               resume: true
             ) do
          {:ok, _pid} ->
            Events.emit(execution_id, :execution_resumed, %{
              status: :running,
              phase: :dispatch,
              actor: %{type: "sessions_supervisor", id: session_id},
              summary_line: "claude session restart requested",
              payload: %{action: "restart", requested_by: action.actor}
            })

            {:ok, %{mode: :claude, restarted: true, session_id: session_id}}

          {:error, {:already_started, _}} ->
            {:ok,
             %{mode: :claude, restarted: false, reason: :already_started, session_id: session_id}}

          {:error, reason} ->
            {:error, reason}
        end

      %{type: :codex, session_id: session_id} = session ->
        _ = safe_stop(session)

        case Supervisor.start_codex_session(session_id, execution_id: execution_id) do
          {:ok, _pid} ->
            Events.emit(execution_id, :execution_resumed, %{
              status: :running,
              phase: :dispatch,
              actor: %{type: "sessions_supervisor", id: session_id},
              summary_line: "codex session restart requested",
              payload: %{action: "restart", requested_by: action.actor}
            })

            {:ok, %{mode: :codex, restarted: true, session_id: session_id}}

          {:error, reason} ->
            {:error, reason}
        end

      nil ->
        infer_action_from_execution_id(execution_id, action)

      _ ->
        {:error, :unsupported_session_type}
    end
  end

  defp perform_action(execution_id, %{action: :kill}, sessions) do
    case Map.get(sessions, execution_id) do
      %{type: _type} = session ->
        case safe_stop(session) do
          :ok ->
            Events.emit(execution_id, :execution_cancelled, %{
              status: :cancelled,
              phase: :done,
              actor: %{type: "sessions_supervisor", id: session.session_id},
              summary_line: "session kill requested",
              payload: %{action: "kill"}
            })

            {:ok, %{killed: true, session_id: session.session_id}}

          other ->
            other
        end

      nil ->
        infer_action_from_execution_id(execution_id, %{action: :kill})
    end
  end

  defp perform_action(_execution_id, %{action: action}, _sessions),
    do: {:ok, %{recorded: true, action: action}}

  defp infer_action_from_execution_id(
         "claude-session:" <> session_id,
         %{action: :restart} = action
       ) do
    try do
      case ClaudeSession.status(session_id) do
        {:ok, info} ->
          _ = safe_stop(%{type: :claude, session_id: session_id})

          Supervisor.start_claude_session(session_id,
            model: info.model,
            execution_id: "claude-session:" <> session_id,
            resume: true
          )

          Events.emit("claude-session:" <> session_id, :execution_resumed, %{
            status: :running,
            phase: :dispatch,
            actor: %{type: "sessions_supervisor", id: session_id},
            summary_line: "claude session restart requested",
            payload: %{action: "restart", requested_by: action.actor}
          })

          {:ok, %{mode: :claude, restarted: true, session_id: session_id}}

        _ ->
          {:error, :session_not_found}
      end
    catch
      :exit, _ ->
        {:ok, %{mode: :claude, restarted: false, session_id: session_id, delegated: false}}
    end
  end

  defp infer_action_from_execution_id("claude-session:" <> session_id, %{action: :kill}) do
    try do
      case ClaudeSession.stop_session(session_id) do
        :ok -> {:ok, %{killed: true, session_id: session_id}}
        other -> other
      end
    catch
      :exit, _ -> {:ok, %{killed: false, session_id: session_id, delegated: false}}
    end
  end

  defp infer_action_from_execution_id(_execution_id, _action),
    do: {:ok, %{recorded: true, delegated: false}}

  defp safe_stop(%{type: :claude, session_id: session_id}) do
    try do
      ClaudeSession.stop_session(session_id)
    catch
      :exit, _ -> :ok
    end
  end

  defp safe_stop(%{type: :codex, session_id: session_id}) do
    try do
      case CodexSession.status(session_id) do
        {:ok, _} ->
          case Registry.lookup(Ema.Surfaces.Registry, {:codex_session, session_id}) do
            [{pid, _}] -> Supervisor.stop_session(pid)
            _ -> :ok
          end

        _ ->
          :ok
      end
    catch
      :exit, _ -> :ok
    end
  end

  defp safe_stop(_), do: :ok

  defp default_execution_id(:claude, id), do: "claude-session:" <> to_string(id)
  defp default_execution_id(:codex, id), do: "codex-session:" <> to_string(id)
  defp default_execution_id(type, id), do: to_string(type) <> ":" <> to_string(id)

  defp normalize_type(type) when is_atom(type), do: type
  defp normalize_type(type) when is_binary(type), do: String.to_atom(type)

  defp normalize_action(action) when is_atom(action), do: action
  defp normalize_action(action) when is_binary(action), do: String.to_atom(action)

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp merge_surface_bindings(map, nil), do: map
  defp merge_surface_bindings(map, bindings) when is_map(bindings) do
    Map.update(map, :surface_bindings, bindings, &Map.merge(&1 || %{}, bindings))
  end
  defp merge_surface_bindings(map, _), do: map
end
