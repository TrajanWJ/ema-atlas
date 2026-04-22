defmodule Ema.Surfaces.CodexSession do
  @moduledoc """
  Manages a persistent Codex CLI session via Erlang Port.

  Same pattern as ClaudeSession but for OpenAI's Codex CLI.
  Auth is handled by Codex's own login flow.
  """

  use GenServer
  require Logger

  alias Ema.Sessions.Supervisor, as: SessionsSupervisor

  @default_timeout 120_000
  @codex_cmd "codex"

  defstruct [
    :id,
    :session_id,
    :port,
    :status,
    :model,
    :started_at,
    :last_activity,
    :turn_count,
    :buffer,
    :current_request
  ]

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

  @impl true
  def init(opts) do
    id = Keyword.fetch!(opts, :id)
    session_id = Keyword.get(opts, :session_id, "ema-codex-#{id}")

    state = %__MODULE__{
      id: id,
      session_id: session_id,
      status: :idle,
      model: Keyword.get(opts, :model),
      started_at: DateTime.utc_now(),
      last_activity: DateTime.utc_now(),
      turn_count: 0,
      buffer: ""
    }

    _ =
      SessionsSupervisor.register_session(id, :codex, %{
        model: Keyword.get(opts, :model),
        execution_id: execution_id(id, opts),
        status: :idle
      })

    Logger.info("[CodexSession:#{id}] initialized")
    {:ok, state}
  end

  @impl true
  def handle_call({:send_prompt, _prompt, _opts}, _from, %{status: :busy} = state) do
    {:reply, {:error, :busy}, state}
  end

  def handle_call({:send_prompt, prompt, opts}, from, state) do
    timeout = Keyword.get(opts, :timeout, @default_timeout)

    case spawn_codex(prompt, opts) do
      {:ok, port} ->
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
              started_at: System.monotonic_time(:millisecond)
            }
        }

        {:noreply, new_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call(:status, _from, state) do
    {:reply,
     {:ok,
      %{
        id: state.id,
        session_id: state.session_id,
        status: state.status,
        turn_count: state.turn_count,
        last_activity: state.last_activity
      }}, state}
  end

  @impl true
  def handle_cast({:send_prompt_async, prompt, opts, caller}, state) do
    case spawn_codex(prompt, opts) do
      {:ok, port} ->
        ref = make_ref()
        timeout = Keyword.get(opts, :timeout, @default_timeout)
        timer = Process.send_after(self(), {:timeout, ref}, timeout)

        {:noreply,
         %{
           state
           | port: port,
             status: :busy,
             buffer: "",
             current_request: %{
               ref: ref,
               from: nil,
               caller: caller,
               timer: timer,
               started_at: System.monotonic_time(:millisecond)
             }
         }}

      {:error, reason} ->
        send(caller, {:codex_error, state.id, reason})
        {:noreply, state}
    end
  end

  @impl true
  def handle_info({port, {:data, data}}, %{port: port} = state) do
    {:noreply, %{state | buffer: state.buffer <> data}}
  end

  def handle_info({port, {:exit_status, exit_status}}, %{port: port} = state) do
    elapsed =
      if state.current_request do
        System.monotonic_time(:millisecond) - state.current_request.started_at
      else
        0
      end

    result =
      case exit_status do
        0 ->
          case Jason.decode(String.trim(state.buffer)) do
            {:ok, parsed} -> {:ok, parsed}
            _ -> {:ok, %{"text" => String.trim(state.buffer)}}
          end

        _ ->
          {:error,
           %{
             code: :cli_error,
             exit_status: exit_status,
             output: String.slice(state.buffer, 0, 2000)
           }}
      end

    if state.current_request do
      Process.cancel_timer(state.current_request.timer)

      if state.current_request.from do
        GenServer.reply(state.current_request.from, result)
      end

      if caller = Map.get(state.current_request, :caller) do
        send(caller, {:codex_result, state.id, result, elapsed})
      end
    end

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "surfaces:codex:#{state.id}",
      {:codex_complete, state.id, result}
    )

    {:noreply,
     %{
       state
       | port: nil,
         status: :idle,
         turn_count: state.turn_count + 1,
         last_activity: DateTime.utc_now(),
         current_request: nil,
         buffer: ""
     }}
  end

  def handle_info({:timeout, ref}, state) do
    if state.current_request && state.current_request.ref == ref do
      if state.port, do: Port.close(state.port)

      if state.current_request.from do
        GenServer.reply(state.current_request.from, {:error, :timeout})
      end

      {:noreply, %{state | port: nil, status: :idle, current_request: nil, buffer: ""}}
    else
      {:noreply, state}
    end
  end

  def handle_info(_msg, state), do: {:noreply, state}

  defp spawn_codex(prompt, _opts) do
    cmd = System.find_executable(@codex_cmd)

    if cmd do
      args = [
        "exec",
        "--skip-git-repo-check",
        "--sandbox",
        "workspace-write",
        "--json",
        prompt
      ]

      port =
        Port.open({:spawn_executable, cmd}, [
          :binary,
          :exit_status,
          :stderr_to_stdout,
          {:args, args},
          {:env,
           [
             {~c"PATH",
              ~c"/home/trajan/.asdf/shims:/home/trajan/.local/bin:/usr/local/bin:/usr/bin:/bin"}
           ]},
          {:cd, ~c"/home/trajan"}
        ])

      {:ok, port}
    else
      {:error, :codex_not_found}
    end
  end

  defp execution_id(id, opts) do
    Keyword.get(opts, :execution_id, "codex-session:" <> to_string(id))
  end

  defp via(id) do
    {:via, Registry, {Ema.Surfaces.Registry, {:codex_session, id}}}
  end
end
