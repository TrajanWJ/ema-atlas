defmodule Ema.Surfaces.ClaudeSession do
  @moduledoc """
  Manages a persistent Claude CLI session via Erlang Port.

  Each session wraps a real `claude` process with `--session-id` for conversation
  continuity. Auth is handled by the CLI itself (OAuth auto-refresh), not by EMA.

  Sessions can be:
  - Started fresh with a new session ID
  - Resumed from an existing session ID
  - Kept alive for multi-turn conversations
  - Torn down and garbage collected

  Output is parsed from `--output-format stream-json` for structured events.
  """

  use GenServer
  require Logger

  alias Ema.Executions.Events
  alias Ema.Sessions.Supervisor, as: SessionsSupervisor

  @default_timeout 120_000
  @claude_cmd "claude"

  defstruct [
    :id,
    :session_id,
    :port,
    :pid,
    :status,
    :model,
    :started_at,
    :last_activity,
    :turn_count,
    :token_usage,
    :current_request,
    :buffer,
    :callers
  ]

  # --- Public API ---

  def start_link(opts) do
    id = Keyword.fetch!(opts, :id)
    GenServer.start_link(__MODULE__, opts, name: via(id))
  end

  def send_prompt(id, prompt, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, @default_timeout)
    GenServer.call(via(id), {:send_prompt, prompt, opts}, timeout + 5_000)
  end

  def send_prompt_async(id, prompt, opts \\ []) do
    GenServer.cast(via(id), {:send_prompt_async, prompt, opts, self()})
  end

  def status(id) do
    GenServer.call(via(id), :status)
  end

  def resume(id) do
    GenServer.call(via(id), :resume)
  end

  def stop_session(id) do
    GenServer.call(via(id), :stop_session)
  end

  def list_sessions do
    Registry.select(Ema.Surfaces.Registry, [{{:"$1", :_, :_}, [], [:"$1"]}])
  end

  # --- GenServer callbacks ---

  @impl true
  def init(opts) do
    id = Keyword.fetch!(opts, :id)
    session_id = Keyword.get(opts, :session_id, UUID.uuid4())
    model = Keyword.get(opts, :model, "sonnet")

    state = %__MODULE__{
      id: id,
      session_id: session_id,
      status: :idle,
      model: model,
      started_at: DateTime.utc_now(),
      last_activity: DateTime.utc_now(),
      turn_count: 0,
      token_usage: %{input: 0, output: 0},
      buffer: "",
      callers: %{}
    }

    _ =
      SessionsSupervisor.register_session(id, :claude, %{
        model: model,
        execution_id: execution_id(id, opts),
        status: :idle
      })

    Logger.info("[ClaudeSession:#{id}] initialized with session_id=#{session_id} model=#{model}")
    {:ok, state}
  end

  @impl true
  def handle_call({:send_prompt, _prompt, _opts}, _from, %{status: :busy} = state) do
    {:reply, {:error, :busy}, state}
  end

  def handle_call({:send_prompt, prompt, opts}, from, state) do
    timeout = Keyword.get(opts, :timeout, @default_timeout)
    model = Keyword.get(opts, :model, state.model)
    execution_id = execution_id(state.id, opts)

    Events.emit(execution_id, :execution_started, %{
      status: :running,
      phase: :implementation,
      actor: %{type: "surface", id: state.id, label: "claude_session"},
      summary_line: "Claude session prompt started",
      payload: %{session_id: state.session_id, model: model, mode: "sync"}
    })

    case spawn_claude(state.session_id, prompt, model, opts) do
      {:ok, port} ->
        SessionsSupervisor.record_progress(state.id, %{
          execution_id: execution_id,
          status: :running,
          type: :claude
        })

        ref = make_ref()
        timer = Process.send_after(self(), {:timeout, ref}, timeout)

        new_state = %{
          state
          | port: port,
            status: :busy,
            last_activity: DateTime.utc_now(),
            buffer: "",
            current_request: %{
              ref: ref,
              from: from,
              timer: timer,
              prompt: prompt,
              started_at: System.monotonic_time(:millisecond)
            }
        }

        {:noreply, new_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call(:status, _from, state) do
    info = %{
      id: state.id,
      session_id: state.session_id,
      status: state.status,
      model: state.model,
      started_at: state.started_at,
      last_activity: state.last_activity,
      turn_count: state.turn_count,
      token_usage: state.token_usage
    }

    {:reply, {:ok, info}, state}
  end

  def handle_call(:resume, _from, state) do
    {:reply, {:ok, state.session_id}, %{state | status: :idle}}
  end

  def handle_call(:stop_session, _from, state) do
    if state.port, do: Port.close(state.port)

    _ =
      SessionsSupervisor.mark_terminal(state.id, :stopped, %{
        execution_id: execution_id(state.id, [])
      })

    {:stop, :normal, :ok, %{state | status: :stopped, port: nil}}
  end

  @impl true
  def handle_cast({:send_prompt_async, prompt, opts, caller}, state) do
    model = Keyword.get(opts, :model, state.model)
    execution_id = execution_id(state.id, opts)

    Events.emit(execution_id, :execution_started, %{
      status: :running,
      phase: :implementation,
      actor: %{type: "surface", id: state.id, label: "claude_session"},
      summary_line: "Claude session async prompt started",
      payload: %{session_id: state.session_id, model: model, mode: "async"}
    })

    case spawn_claude(state.session_id, prompt, model, opts) do
      {:ok, port} ->
        SessionsSupervisor.record_progress(state.id, %{
          execution_id: execution_id,
          status: :running,
          type: :claude
        })

        ref = make_ref()
        timeout = Keyword.get(opts, :timeout, @default_timeout)
        timer = Process.send_after(self(), {:timeout, ref}, timeout)

        new_state = %{
          state
          | port: port,
            status: :busy,
            last_activity: DateTime.utc_now(),
            buffer: "",
            current_request: %{
              ref: ref,
              from: nil,
              caller: caller,
              timer: timer,
              prompt: prompt,
              started_at: System.monotonic_time(:millisecond)
            }
        }

        {:noreply, new_state}

      {:error, reason} ->
        send(caller, {:claude_error, state.id, reason})
        {:noreply, state}
    end
  end

  @impl true
  def handle_info({port, {:data, data}}, %{port: port} = state) do
    # Accumulate all data — parse on exit_status
    {:noreply, %{state | buffer: state.buffer <> data}}
  end

  def handle_info({port, {:exit_status, exit_status}}, %{port: port} = state) do
    elapsed =
      if state.current_request do
        System.monotonic_time(:millisecond) - state.current_request.started_at
      else
        0
      end

    result = parse_final_result(state.buffer, exit_status)

    # Update token usage from result
    token_usage =
      case result do
        {:ok, %{"usage" => usage}} ->
          %{
            input: state.token_usage.input + Map.get(usage, "input_tokens", 0),
            output: state.token_usage.output + Map.get(usage, "output_tokens", 0)
          }

        _ ->
          state.token_usage
      end

    # Cancel timeout timer
    if state.current_request do
      Process.cancel_timer(state.current_request.timer)
    end

    # Reply to caller
    if state.current_request do
      if state.current_request.from do
        GenServer.reply(state.current_request.from, result)
      end

      if caller = Map.get(state.current_request, :caller) do
        send(caller, {:claude_result, state.id, result, elapsed})
      end
    end

    emit_completion_event(state, result, elapsed)

    # Broadcast completion
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "surfaces:claude:#{state.id}",
      {:claude_complete, state.id, result, elapsed}
    )

    SessionsSupervisor.record_progress(state.id, %{
      execution_id: execution_id(state.id, []),
      status: :idle,
      type: :claude
    })

    Logger.info("[ClaudeSession:#{state.id}] turn completed in #{elapsed}ms exit=#{exit_status}")

    {:noreply,
     %{
       state
       | port: nil,
         status: :idle,
         turn_count: state.turn_count + 1,
         token_usage: token_usage,
         last_activity: DateTime.utc_now(),
         current_request: nil,
         buffer: ""
     }}
  end

  def handle_info({:timeout, ref}, state) do
    if state.current_request && state.current_request.ref == ref do
      if state.port, do: Port.close(state.port)

      elapsed = System.monotonic_time(:millisecond) - state.current_request.started_at
      timeout_result = {:error, %{code: :timeout, timeout_ms: elapsed, session_id: state.session_id}}

      if state.current_request.from do
        GenServer.reply(state.current_request.from, {:error, :timeout})
      end

      if caller = Map.get(state.current_request, :caller) do
        send(caller, {:claude_error, state.id, :timeout})
      end

      emit_timeout_terminal_summary(state, elapsed)

      Phoenix.PubSub.broadcast(
        Ema.PubSub,
        "surfaces:claude:#{state.id}",
        {:claude_complete, state.id, timeout_result, elapsed}
      )

      _ =
        SessionsSupervisor.mark_terminal(state.id, :timed_out, %{
          execution_id: execution_id(state.id, []),
          reason: :timeout,
          elapsed_ms: elapsed,
          session_id: state.session_id
        })

      Logger.warning("[ClaudeSession:#{state.id}] turn timed out after #{elapsed}ms")

      {:noreply,
       %{state | port: nil, status: :idle, current_request: nil, buffer: "", last_activity: DateTime.utc_now()}}
    else
      {:noreply, state}
    end
  end

  def handle_info(_msg, state), do: {:noreply, state}

  # --- Private ---

  defp spawn_claude(session_id, prompt, model, opts) do
    cmd = System.find_executable(@claude_cmd)

    if cmd do
      args = build_args(session_id, prompt, model, opts)

      port =
        Port.open({:spawn_executable, cmd}, [
          :binary,
          :exit_status,
          :stderr_to_stdout,
          {:args, args},
          {:env, build_env()},
          {:cd, ~c"/home/trajan"}
        ])

      {:ok, port}
    else
      {:error, :claude_not_found}
    end
  end

  defp build_args(session_id, prompt, model, opts) do
    base = [
      "--session-id",
      session_id,
      "--output-format",
      "json",
      "--model",
      model,
      "--permission-mode",
      "bypassPermissions",
      "--max-turns",
      to_string(Keyword.get(opts, :max_turns, 10)),
      "-p",
      prompt
    ]

    if Keyword.get(opts, :resume, false) do
      ["--resume" | base]
    else
      base
    end
  end

  defp build_env do
    # Inherit PATH for asdf shims, but scrub auth overrides so the Claude CLI
    # reads refreshed credentials from ~/.claude/.credentials.json.
    path = System.get_env("PATH", "/home/trajan/.asdf/shims:/usr/local/bin:/usr/bin:/bin")

    [
      {~c"PATH", String.to_charlist(path)},
      {~c"HOME", ~c"/home/trajan"},
      {~c"ANTHROPIC_API_KEY", ~c""},
      {~c"CLAUDE_CODE_OAUTH_TOKEN", ~c""}
    ]
  end


  defp parse_final_result(buffer, 0) do
    # JSON format returns a single JSON object with the full result
    trimmed = String.trim(buffer)

    case Jason.decode(trimmed) do
      {:ok, %{"result" => text} = parsed} when is_binary(text) ->
        {:ok, parsed}

      {:ok, parsed} ->
        {:ok, parsed}

      {:error, _} ->
        # Fallback: try to find JSON in the buffer (may have non-JSON prefix)
        case Regex.run(~r/\{.*\}/s, trimmed) do
          [json] ->
            case Jason.decode(json) do
              {:ok, parsed} -> {:ok, parsed}
              _ -> {:ok, %{"text" => trimmed}}
            end

          _ ->
            {:ok, %{"text" => trimmed}}
        end
    end
  end

  defp parse_final_result(buffer, exit_status) do
    {:error, %{code: :cli_error, exit_status: exit_status, output: String.slice(buffer, 0, 2000)}}
  end

  defp emit_timeout_terminal_summary(state, elapsed) do
    Events.emit(execution_id(state.id, []), :execution_timed_out, %{
      status: :timed_out,
      phase: :done,
      actor: %{type: "surface", id: state.id, label: "claude_session"},
      summary_line: "Claude session prompt timed out after #{elapsed}ms",
      payload: %{
        session_id: state.session_id,
        elapsed_ms: elapsed,
        timeout_ms: elapsed,
        model: state.model,
        buffered_output_preview: String.slice(state.buffer || "", 0, 280)
      }
    })
  end

  defp emit_completion_event(state, result, elapsed) do
    event_type = if match?({:ok, _}, result), do: :execution_completed, else: :execution_failed
    status = if match?({:ok, _}, result), do: :succeeded, else: :failed

    payload =
      case result do
        {:ok, response} ->
          %{
            session_id: state.session_id,
            elapsed_ms: elapsed,
            stop_reason: Map.get(response, "stop_reason"),
            usage: Map.get(response, "usage")
          }

        {:error, error} ->
          %{
            session_id: state.session_id,
            elapsed_ms: elapsed,
            error: error
          }
      end

    Events.emit(execution_id(state.id, []), event_type, %{
      status: status,
      phase: :done,
      actor: %{type: "surface", id: state.id, label: "claude_session"},
      summary_line:
        if(match?({:ok, _}, result),
          do: "Claude session prompt completed",
          else: "Claude session prompt failed"
        ),
      payload: payload
    })

    if match?({:error, _}, result) do
      _ =
        SessionsSupervisor.mark_terminal(state.id, :failed, %{
          execution_id: execution_id(state.id, [])
        })
    end
  end

  defp execution_id(id, opts) do
    Keyword.get(opts, :execution_id, "claude-session:" <> to_string(id))
  end

  defp via(id) do
    {:via, Registry, {Ema.Surfaces.Registry, {:claude_session, id}}}
  end
end
