defmodule Ema.Claude.ProviderRegistry do
  @moduledoc """
  Hardened provider selection and execution for EMA.

  Goals:
    * direct Claude CLI path is the primary path
    * auth/rate-limit/provider failures are classified quickly
    * Codex is a normal fallback, not an exceptional code path
    * provider health is remembered so one broken backend does not dead-end routing
    * EMA can call one execution surface and let the registry decide the backend
  """

  use GenServer

  alias Ema.Executions.Events

  @default_timeout 120_000
  @default_probe_timeout 8_000

  # --- public API ---

  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  def snapshot(server \\ __MODULE__) do
    GenServer.call(server, :snapshot)
  end

  def list_available(server \\ __MODULE__) do
    GenServer.call(server, :list_available)
  end

  def preflight(opts \\ [], server \\ __MODULE__) do
    GenServer.call(server, {:preflight, opts}, Keyword.get(opts, :timeout, 30_000))
  end

  def health_check(id, opts \\ [], server \\ __MODULE__) do
    GenServer.call(server, {:health_check, id, opts}, Keyword.get(opts, :timeout, 30_000))
  end

  def run(prompt, opts \\ [], server \\ __MODULE__) when is_binary(prompt) do
    timeout = Keyword.get(opts, :timeout, @default_timeout) + 5_000
    GenServer.call(server, {:run, prompt, opts}, timeout)
  end

  @doc """
  Async variant of `run/2`.

  Spawns the execution in a supervised Task and returns `{:ok, ref}`
  immediately.  When the task completes (or times out), the result is
  broadcast on the `"bridge:results"` PubSub topic as:

      {:bridge_result, ref, {:ok, payload} | {:error, reason}}
  """
  def async_run(prompt, opts \\ [], server \\ __MODULE__) when is_binary(prompt) do
    ref = make_ref()
    timeout = Keyword.get(opts, :timeout, @default_timeout)
    execution_id = "bridge-#{inspect(ref)}"

    Events.emit(execution_id, :execution_created, %{
      status: :queued,
      phase: :dispatch,
      summary_line: "Async provider execution queued",
      payload: %{timeout_ms: timeout}
    })

    Task.Supervisor.start_child(Ema.Claude.TaskSupervisor, fn ->
      Events.emit(execution_id, :execution_started, %{
        status: :running,
        phase: :implementation,
        summary_line: "Async provider execution started"
      })

      result =
        try do
          task = Task.async(fn -> run(prompt, opts, server) end)

          case Task.yield(task, timeout) || Task.shutdown(task, :brutal_kill) do
            {:ok, result} ->
              result

            nil ->
              {:error, %{code: :timeout, message: "async dispatch timed out after #{timeout}ms"}}
          end
        rescue
          e -> {:error, %{code: :exception, message: Exception.message(e)}}
        end

      case result do
        {:ok, payload} ->
          Events.emit(execution_id, :execution_completed, %{
            status: :succeeded,
            phase: :done,
            summary_line: "Async provider execution completed",
            payload: %{
              outcome: "success",
              provider: payload[:provider],
              attempts: payload[:attempts] || []
            }
          })

        {:error, error} ->
          status = if(error[:code] == :timeout, do: :timed_out, else: :failed)
          type = if(error[:code] == :timeout, do: :execution_timed_out, else: :execution_failed)

          Events.emit(execution_id, type, %{
            status: status,
            phase: :done,
            summary_line: "Async provider execution failed",
            payload: %{code: error[:code], message: error[:message], retryable: error[:retryable]}
          })
      end

      Phoenix.PubSub.broadcast(Ema.PubSub, "bridge:results", {:bridge_result, ref, result})
    end)

    {:ok, ref}
  end

  def reload(server \\ __MODULE__, providers \\ nil) do
    GenServer.call(server, {:reload, providers})
  end

  # --- GenServer ---

  @impl true
  def init(opts) do
    providers = load_providers(Keyword.get(opts, :providers))
    {:ok, build_state(providers)}
  end

  @impl true
  def handle_call(:snapshot, _from, state) do
    {:reply, %{providers: state.providers, updated_at: state.updated_at}, state}
  end

  def handle_call(:list_available, _from, state) do
    {:reply, render_provider_list(state), state}
  end

  def handle_call({:reload, providers}, _from, _state) do
    providers = load_providers(providers)
    new_state = build_state(providers)
    {:reply, %{ok: true, providers: render_provider_list(new_state)}, new_state}
  end

  def handle_call({:preflight, opts}, _from, state) do
    {result, new_state} = do_preflight_all(state, opts)
    {:reply, result, new_state}
  end

  def handle_call({:health_check, id, opts}, _from, state) do
    {result, new_state} = do_health_check(id, state, opts)
    {:reply, result, new_state}
  end

  def handle_call({:run, prompt, opts}, _from, state) do
    {result, new_state} = do_run(prompt, opts, state)
    {:reply, result, new_state}
  end

  # --- execution ---

  defp do_run(prompt, opts, state) do
    candidates = select_candidates(state, opts)

    case try_candidates(candidates, prompt, opts, state, []) do
      {{:ok, payload}, new_state, attempts} ->
        {{:ok, Map.put(payload, :attempts, Enum.reverse(attempts))}, new_state}

      {{:error, reason}, new_state, attempts} ->
        error =
          reason
          |> Map.put_new(:code, :no_provider_available)
          |> Map.put(:attempts, Enum.reverse(attempts))

        {{:error, error}, new_state}
    end
  end

  defp try_candidates([], _prompt, _opts, state, attempts) do
    {{:error, %{code: :no_provider_available, message: "no healthy provider available"}}, state,
     attempts}
  end

  defp try_candidates([provider_id | rest], prompt, opts, state, attempts) do
    provider = Map.fetch!(state.providers, provider_id)

    case execute_provider(provider, prompt, opts) do
      {:ok, payload, latency_ms} ->
        new_state = record_success(state, provider_id, latency_ms)
        attempt = %{provider: provider_id, status: :ok, latency_ms: latency_ms}

        {{:ok, Map.merge(payload, %{provider: provider_id, provider_type: provider.type})},
         new_state, [attempt | attempts]}

      {:error, error, latency_ms} ->
        new_state = record_failure(state, provider_id, error, latency_ms)

        attempt = %{
          provider: provider_id,
          status: :error,
          code: error.code,
          retryable: error.retryable,
          latency_ms: latency_ms
        }

        if fallback_allowed?(opts, error) and rest != [] do
          try_candidates(rest, prompt, opts, new_state, [attempt | attempts])
        else
          {{:error, Map.put(error, :provider, provider_id)}, new_state, [attempt | attempts]}
        end
    end
  end

  defp fallback_allowed?(opts, error) do
    Keyword.get(opts, :allow_fallback, true) and error.retryable != false
  end

  defp execute_provider(provider, prompt, opts) do
    started_at = System.monotonic_time(:millisecond)

    result =
      case provider.type do
        :claude ->
          run_claude(provider, prompt, opts)

        :codex ->
          run_codex(provider, prompt, opts)

        _ ->
          {:error,
           %{code: :unsupported_provider, message: "unsupported provider type", retryable: true}}
      end

    latency_ms = System.monotonic_time(:millisecond) - started_at

    case result do
      {:ok, payload} -> {:ok, payload, latency_ms}
      {:error, error} -> {:error, normalize_error(error), latency_ms}
    end
  end

  # --- preflight / health ---

  defp do_preflight_all(state, opts) do
    {checks, new_state} =
      Enum.reduce(render_provider_list(state), {[], state}, fn provider, {acc, st} ->
        {result, next_state} = do_health_check(provider.id, st, opts)
        {[result | acc], next_state}
      end)

    providers = Enum.reverse(checks)

    result = %{
      ok: Enum.all?(providers, & &1.healthy),
      checked_at: DateTime.utc_now(),
      providers: providers,
      summary: summarize_preflight(providers)
    }

    {result, new_state}
  end

  defp do_health_check(id, state, opts) do
    case Map.fetch(state.providers, id) do
      :error ->
        {%{
           id: id,
           healthy: false,
           error: %{code: :provider_not_found, message: "provider not found"}
         }, state}

      {:ok, provider} ->
        probe? = Keyword.get(opts, :probe, true)

        {result, latency_ms} =
          case provider.type do
            :claude ->
              preflight_claude(provider, probe?, opts)

            :codex ->
              preflight_codex(provider, probe?, opts)

            _ ->
              {{:error,
                %{
                  code: :unsupported_provider,
                  message: "unsupported provider type",
                  retryable: true
                }}, 0}
          end

        case result do
          {:ok, meta} ->
            new_state = record_success(state, id, latency_ms)

            {%{id: id, type: provider.type, healthy: true, latency_ms: latency_ms, details: meta},
             new_state}

          {:error, error} ->
            new_state = record_failure(state, id, normalize_error(error), latency_ms)

            {%{
               id: id,
               type: provider.type,
               healthy: false,
               latency_ms: latency_ms,
               error: normalize_error(error)
             }, new_state}
        end
    end
  end

  defp preflight_claude(provider, probe?, opts) do
    started_at = System.monotonic_time(:millisecond)
    shell = shell_module(opts)
    cmd = provider.cmd

    with :ok <- ensure_executable(cmd),
         {:ok, auth_status} <- claude_auth_status(shell, cmd),
         {:ok, probe_meta} <- maybe_probe_claude(provider, shell, probe?, opts) do
      latency = System.monotonic_time(:millisecond) - started_at
      {{:ok, %{auth: auth_status, probe: probe_meta}}, latency}
    else
      {:error, error} ->
        latency = System.monotonic_time(:millisecond) - started_at
        {{:error, error}, latency}
    end
  end

  defp preflight_codex(provider, probe?, opts) do
    started_at = System.monotonic_time(:millisecond)
    shell = shell_module(opts)
    cmd = provider.cmd

    with :ok <- ensure_executable(cmd),
         {:ok, login_status} <- codex_login_status(shell, cmd),
         {:ok, probe_meta} <- maybe_probe_codex(provider, shell, probe?, opts) do
      latency = System.monotonic_time(:millisecond) - started_at
      {{:ok, %{auth: login_status, probe: probe_meta}}, latency}
    else
      {:error, error} ->
        latency = System.monotonic_time(:millisecond) - started_at
        {{:error, error}, latency}
    end
  end

  # --- provider implementations ---

  defp run_claude(provider, prompt, opts) do
    shell = shell_module(opts)

    with :ok <- ensure_executable(provider.cmd),
         {:ok, output} <- claude_exec(shell, provider, prompt, opts) do
      parse_claude_output(output)
    end
  end

  defp run_codex(provider, prompt, opts) do
    shell = shell_module(opts)

    with :ok <- ensure_executable(provider.cmd),
         {:ok, output} <- codex_exec(shell, provider, prompt, opts) do
      parse_codex_output(output)
    end
  end

  defp claude_exec(shell, provider, prompt, opts) do
    args =
      ["--permission-mode", "bypassPermissions", "--print", "--output-format", "json"] ++
        model_args(provider, opts) ++
        [prompt]

    run_shell(shell, provider.cmd, args,
      cd: Keyword.get(opts, :cwd, File.cwd!()),
      timeout: Keyword.get(opts, :timeout, @default_timeout),
      stderr_to_stdout: true
    )
  end

  defp codex_exec(shell, provider, prompt, opts) do
    args =
      ["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "--json"] ++
        model_args(provider, opts) ++
        [prompt]

    run_shell(shell, provider.cmd, args,
      cd: Keyword.get(opts, :cwd, File.cwd!()),
      timeout: Keyword.get(opts, :timeout, @default_timeout),
      stderr_to_stdout: true
    )
  end

  defp maybe_probe_claude(_provider, _shell, false, _opts), do: {:ok, %{skipped: true}}

  defp maybe_probe_claude(provider, shell, true, opts) do
    probe_prompt =
      Keyword.get(opts, :probe_prompt, provider.probe_prompt || "Reply with exactly OK")

    case claude_exec(
           shell,
           provider,
           probe_prompt,
           Keyword.put_new(opts, :timeout, @default_probe_timeout)
         ) do
      {:ok, output} ->
        case parse_claude_output(output) do
          {:ok, payload} -> {:ok, %{result: payload.content}}
          {:error, error} -> {:error, error}
        end

      {:error, error} ->
        {:error, error}
    end
  end

  defp maybe_probe_codex(_provider, _shell, false, _opts), do: {:ok, %{skipped: true}}

  defp maybe_probe_codex(provider, shell, true, opts) do
    probe_prompt =
      Keyword.get(opts, :probe_prompt, provider.probe_prompt || "Reply with exactly OK")

    case codex_exec(
           shell,
           provider,
           probe_prompt,
           Keyword.put_new(opts, :timeout, @default_probe_timeout)
         ) do
      {:ok, output} ->
        case parse_codex_output(output) do
          {:ok, payload} -> {:ok, %{result: payload.content}}
          {:error, error} -> {:error, error}
        end

      {:error, error} ->
        {:error, error}
    end
  end

  # --- parsers ---

  defp parse_claude_output(output) do
    with {:ok, decoded} <- Jason.decode(output) do
      is_error = Map.get(decoded, "is_error", false)
      result = Map.get(decoded, "result", "")

      if is_error do
        {:error, classify_claude_error(result, decoded)}
      else
        {:ok,
         %{
           content: result,
           raw: decoded,
           session_id: Map.get(decoded, "session_id"),
           stop_reason: Map.get(decoded, "stop_reason")
         }}
      end
    else
      _ ->
        {:error,
         %{
           code: :parse_error,
           message: "failed to parse Claude output",
           retryable: true,
           raw: output
         }}
    end
  end

  defp parse_codex_output(output) do
    lines = String.split(output, "\n", trim: true)

    decoded =
      Enum.map(lines, fn line -> Jason.decode(line) end)
      |> Enum.filter(&match?({:ok, _}, &1))
      |> Enum.map(fn {:ok, item} -> item end)

    case Enum.find(
           decoded,
           &(get_in(&1, ["type"]) == "item.completed" and
               get_in(&1, ["item", "type"]) == "agent_message")
         ) do
      %{"item" => %{"text" => text}} ->
        {:ok, %{content: text, raw: decoded}}

      nil ->
        error_line = Enum.find(decoded, &(Map.get(&1, "type") in ["error", "turn.failed"]))

        if error_line do
          {:error, classify_codex_error(Jason.encode!(error_line), error_line)}
        else
          {:error,
           %{
             code: :parse_error,
             message: "failed to parse Codex output",
             retryable: true,
             raw: output
           }}
        end
    end
  end

  # --- auth / login probes ---

  defp claude_auth_status(shell, cmd) do
    case run_shell(shell, cmd, ["auth", "status"], stderr_to_stdout: true, timeout: 5_000) do
      {:ok, output} ->
        case Jason.decode(output) do
          {:ok, decoded} ->
            {:ok, decoded}

          _ ->
            {:error,
             %{
               code: :auth_status_parse_error,
               message: "failed to parse claude auth status",
               retryable: true,
               raw: output
             }}
        end

      {:error, error} ->
        {:error, error}
    end
  end

  defp codex_login_status(shell, cmd) do
    case run_shell(shell, cmd, ["login", "status"], stderr_to_stdout: true, timeout: 5_000) do
      {:ok, output} ->
        {:ok, %{raw: String.trim(output)}}

      {:error, error} ->
        {:error, error}
    end
  end

  # --- shell helpers ---

  defp run_shell(shell, cmd, args, opts) do
    timeout = Keyword.get(opts, :timeout, @default_timeout)
    shell_opts = Keyword.delete(opts, :timeout)

    task = Task.async(fn -> shell.cmd(cmd, args, shell_opts) end)

    case Task.yield(task, timeout) || Task.shutdown(task, :brutal_kill) do
      {:ok, {output, 0}} ->
        {:ok, output}

      {:ok, {output, status}} ->
        {:error, classify_shell_failure(cmd, output, status)}

      nil ->
        {:error,
         timeout_error("command timed out after #{timeout}ms", :total, %{source: :shell, raw: nil})}
    end
  rescue
    e in ErlangError ->
      if e.original == :enoent do
        {:error,
         %{
           code: :cli_missing,
           message: "#{cmd} is not installed or not on PATH",
           retryable: false
         }}
      else
        {:error, %{code: :shell_error, message: Exception.message(e), retryable: true}}
      end

    e in RuntimeError ->
      {:error, %{code: :shell_error, message: Exception.message(e), retryable: true}}
  end

  defp shell_module(opts) do
    Keyword.get(opts, :shell, Application.get_env(:ema, :claude_shell, Ema.Claude.SystemShell))
  end

  defp ensure_executable(cmd) do
    if System.find_executable(cmd),
      do: :ok,
      else:
        {:error,
         %{
           code: :cli_missing,
           message: "#{cmd} is not installed or not on PATH",
           retryable: false
         }}
  end

  defp model_args(provider, opts) do
    case Keyword.get(opts, :model) || Map.get(provider, :model) do
      nil -> []
      model -> ["--model", model]
    end
  end

  # --- classification ---

  defp classify_shell_failure(_cmd, output, status) do
    msg = String.trim(output)
    down = String.downcase(msg)

    cond do
      String.contains?(down, "oauth token has expired") or
        String.contains?(down, "failed to authenticate") or
          String.contains?(down, "authentication_error") ->
        %{code: :auth_expired, message: msg, retryable: true, exit_status: status}

      String.contains?(down, "rate limit") or String.contains?(down, "too many requests") ->
        %{code: :rate_limited, message: msg, retryable: true, exit_status: status}

      match?(%{}, timeout_or_cancel_error(msg, %{source: :shell, exit_status: status})) ->
        timeout_or_cancel_error(msg, %{source: :shell, exit_status: status})

      malformed_command_output?(down) ->
        %{
          code: :command_malformed,
          message: msg,
          retryable: false,
          exit_status: status
        }

      true ->
        %{
          code: :command_failed,
          message: msg,
          retryable: status != 2,
          exit_status: status
        }
    end
  end

  defp classify_claude_error(message, decoded) do
    msg = String.trim(message || "")
    down = String.downcase(msg)

    cond do
      String.contains?(down, "oauth token has expired") or
        String.contains?(down, "failed to authenticate") or
          String.contains?(down, "authentication_error") ->
        %{code: :auth_expired, message: msg, retryable: true, raw: decoded}

      String.contains?(down, "rate limit") or String.contains?(down, "too many requests") or
          String.contains?(down, "overloaded") ->
        %{code: :rate_limited, message: msg, retryable: true, raw: decoded}

      match?(%{}, timeout_or_cancel_error(msg, %{raw: decoded})) ->
        timeout_or_cancel_error(msg, %{raw: decoded})

      String.contains?(down, "not found") and String.contains?(down, "model") ->
        %{code: :model_unavailable, message: msg, retryable: true, raw: decoded}

      true ->
        %{code: :provider_error, message: msg, retryable: true, raw: decoded}
    end
  end

  defp classify_codex_error(message, decoded) do
    msg = String.trim(message || "")
    down = String.downcase(msg)
    timeout_error = timeout_or_cancel_error(msg, %{raw: decoded})

    cond do
      String.contains?(down, "logged in") == false and String.contains?(down, "login") ->
        %{code: :auth_expired, message: msg, retryable: true, raw: decoded}

      String.contains?(down, "rate limit") or String.contains?(down, "too many requests") ->
        %{code: :rate_limited, message: msg, retryable: true, raw: decoded}

      timeout_error != nil ->
        timeout_error

      malformed_command_output?(down) ->
        %{code: :command_malformed, message: msg, retryable: false, raw: decoded}

      true ->
        %{code: :provider_error, message: msg, retryable: true, raw: decoded}
    end
  end

  defp timeout_or_cancel_error(message, extra \\ %{}) do
    down = String.downcase(String.trim(message || ""))

    cond do
      client_cancelled_message?(down) ->
        cancel_error(message, Map.put(extra, :classification, :client_cancel))

      queue_timeout_message?(down) ->
        timeout_error(message, :queue, extra)

      connect_timeout_message?(down) ->
        timeout_error(message, :connect, extra)

      read_timeout_message?(down) ->
        timeout_error(message, :read, extra)

      timeout_message?(down) ->
        timeout_error(message, :total, extra)

      true ->
        false
    end
  end

  defp timeout_error(message, timeout_kind, extra \\ %{}) do
    extra
    |> Map.merge(%{
      code: :timeout,
      message: String.trim(message || ""),
      retryable: true,
      timeout_kind: timeout_kind,
      classification: {:timeout, timeout_kind}
    })
  end

  defp cancel_error(message, extra \\ %{}) do
    extra
    |> Map.merge(%{
      code: :client_cancelled,
      message: String.trim(message || ""),
      retryable: false,
      classification: :client_cancel
    })
  end

  defp client_cancelled_message?(down) do
    (String.contains?(down, "cancelled by user") or
       String.contains?(down, "canceled by user") or
       String.contains?(down, "user cancelled") or
       String.contains?(down, "user canceled") or
       String.contains?(down, "request aborted") or
       String.contains?(down, "request cancelled") or
       String.contains?(down, "request canceled") or
       String.contains?(down, "operation was aborted") or
       String.contains?(down, "context canceled") or
       String.contains?(down, "context cancelled")) and not timeout_message?(down)
  end

  defp queue_timeout_message?(down) do
    timeout_message?(down) and
      (String.contains?(down, "queue") or String.contains?(down, "queued") or
         String.contains?(down, "overloaded") or String.contains?(down, "capacity"))
  end

  defp connect_timeout_message?(down) do
    timeout_message?(down) and
      (String.contains?(down, "connect") or String.contains?(down, "connection") or
         String.contains?(down, "dial tcp") or String.contains?(down, "handshake"))
  end

  defp read_timeout_message?(down) do
    timeout_message?(down) and
      (String.contains?(down, "read") or String.contains?(down, "response") or
         String.contains?(down, "headers") or String.contains?(down, "first byte") or
         String.contains?(down, "socket hang up"))
  end

  defp timeout_message?(down) do
    String.contains?(down, "timed out") or String.contains?(down, "timeout")
  end

  defp malformed_command_output?(down) do
    String.contains?(down, "unexpected argument") or
      String.contains?(down, "usage: codex exec") or
      String.contains?(down, "title:: command not found") or
      String.contains?(down, "summary:: command not found")
  end

  defp summarize_preflight(providers) do
    failing = Enum.filter(providers, &(not &1.healthy))

    cond do
      failing == [] ->
        %{status: :healthy, primary_blocker: nil, codes: [], message: "all providers healthy"}

      true ->
        codes =
          failing
          |> Enum.map(&get_in(&1, [:error, :code]))
          |> Enum.filter(& &1)
          |> Enum.uniq()

        primary = List.first(codes)

        %{
          status: :degraded,
          primary_blocker: primary,
          codes: codes,
          message: blocker_message(primary, failing)
        }
    end
  end

  defp blocker_message(:auth_expired, failing),
    do:
      "provider authentication failed; refresh CLI auth before proposal generation" <>
        provider_hint_suffix(failing)

  defp blocker_message(:command_malformed, failing),
    do:
      "provider command invocation is malformed; inspect prompt/CLI argument construction" <>
        provider_hint_suffix(failing)

  defp blocker_message(:rate_limited, failing),
    do:
      "provider rate limited; retry later or prefer a healthy fallback" <>
        provider_hint_suffix(failing)

  defp blocker_message(:no_provider_available, _failing), do: "no healthy provider available"

  defp blocker_message(_other, failing),
    do:
      "provider checks failed; inspect provider errors for details" <>
        provider_hint_suffix(failing)

  defp provider_hint_suffix(failing) do
    ids = failing |> Enum.map(& &1.id) |> Enum.join(", ")
    if ids == "", do: "", else: " (providers: #{ids})"
  end

  defp normalize_error(%{code: _} = error), do: Map.put_new(error, :retryable, true)

  defp normalize_error(other),
    do: %{code: :provider_error, message: inspect(other), retryable: true}

  # --- health memory / selection ---

  defp build_state(providers) do
    entries =
      Enum.map(providers, fn provider ->
        {provider.id,
         Map.merge(provider, %{
           consecutive_failures: 0,
           last_error: nil,
           last_success_at: nil,
           last_latency_ms: nil,
           circuit_open_until: nil,
           health: :unknown
         })}
      end)

    %{providers: Map.new(entries), updated_at: DateTime.utc_now()}
  end

  defp load_providers(nil),
    do: load_providers(Application.get_env(:ema, :claude_providers, default_providers()))

  defp load_providers(providers) when is_list(providers) do
    providers
    |> Enum.map(&normalize_provider/1)
    |> Enum.filter(& &1.enabled)
  end

  defp normalize_provider(provider) do
    provider = Enum.into(provider, %{})

    %{
      id: Map.get(provider, :id) || Map.get(provider, "id"),
      type: normalize_type(Map.get(provider, :type) || Map.get(provider, "type")),
      cmd: Map.get(provider, :cmd) || Map.get(provider, "cmd"),
      model: Map.get(provider, :model) || Map.get(provider, "model"),
      enabled: Map.get(provider, :enabled, Map.get(provider, "enabled", true)),
      priority: Map.get(provider, :priority, Map.get(provider, "priority", 0)),
      probe_prompt: Map.get(provider, :probe_prompt) || Map.get(provider, "probe_prompt")
    }
  end

  defp default_providers do
    [
      %{
        id: "claude-cli",
        type: :claude,
        cmd: "claude",
        priority: 100,
        model: "sonnet",
        enabled: true,
        probe_prompt: "Reply with exactly OK"
      },
      %{
        id: "codex-cli",
        type: :codex,
        cmd: "codex",
        priority: 90,
        enabled: true,
        probe_prompt: "Reply with exactly OK"
      }
    ]
  end

  defp normalize_type(type) when type in [:claude, :codex], do: type
  defp normalize_type("claude"), do: :claude
  defp normalize_type("codex"), do: :codex
  defp normalize_type(other), do: other

  defp select_candidates(state, opts) do
    preferred = Keyword.get(opts, :provider)
    now = DateTime.utc_now()

    state.providers
    |> Map.values()
    |> Enum.filter(fn provider ->
      (is_nil(preferred) or provider.id == preferred) and provider.enabled and
        circuit_available?(provider, now)
    end)
    |> Enum.sort_by(fn provider ->
      {
        if(provider.id == preferred, do: 0, else: 1),
        health_rank(provider.health),
        -provider.priority
      }
    end)
    |> Enum.map(& &1.id)
  end

  defp health_rank(:healthy), do: 0
  defp health_rank(:unknown), do: 1
  defp health_rank(:degraded), do: 2
  defp health_rank(:unhealthy), do: 3
  defp health_rank(_), do: 4

  defp circuit_available?(provider, now) do
    case provider.circuit_open_until do
      nil -> true
      until -> DateTime.compare(until, now) != :gt
    end
  end

  defp record_success(state, provider_id, latency_ms) do
    update_provider(state, provider_id, fn provider ->
      provider
      |> Map.put(:consecutive_failures, 0)
      |> Map.put(:last_error, nil)
      |> Map.put(:last_success_at, DateTime.utc_now())
      |> Map.put(:last_latency_ms, latency_ms)
      |> Map.put(:circuit_open_until, nil)
      |> Map.put(:health, :healthy)
    end)
  end

  defp record_failure(state, provider_id, error, latency_ms) do
    cooldown_ms = cooldown_for(error)

    update_provider(state, provider_id, fn provider ->
      failures = provider.consecutive_failures + 1

      provider
      |> Map.put(:consecutive_failures, failures)
      |> Map.put(:last_error, error)
      |> Map.put(:last_latency_ms, latency_ms)
      |> Map.put(:circuit_open_until, DateTime.add(DateTime.utc_now(), cooldown_ms, :millisecond))
      |> Map.put(:health, if(failures >= 2, do: :unhealthy, else: :degraded))
    end)
  end

  defp cooldown_for(%{code: :auth_expired}), do: 30_000
  defp cooldown_for(%{code: :rate_limited}), do: 60_000
  defp cooldown_for(%{code: :timeout, timeout_kind: :queue}), do: 10_000
  defp cooldown_for(%{code: :timeout, timeout_kind: :connect}), do: 15_000
  defp cooldown_for(%{code: :timeout, timeout_kind: :read}), do: 20_000
  defp cooldown_for(%{code: :timeout, timeout_kind: :total}), do: 20_000
  defp cooldown_for(%{code: :timeout}), do: 20_000
  defp cooldown_for(%{code: :client_cancelled}), do: 1_000
  defp cooldown_for(%{code: :cli_missing}), do: 120_000
  defp cooldown_for(_), do: 15_000

  defp update_provider(state, provider_id, fun) do
    %{
      state
      | providers: Map.update!(state.providers, provider_id, fun),
        updated_at: DateTime.utc_now()
    }
  end

  defp render_provider_list(state) do
    state.providers
    |> Map.values()
    |> Enum.sort_by(&{-&1.priority, &1.id})
    |> Enum.map(fn provider ->
      %{
        id: provider.id,
        type: provider.type,
        cmd: provider.cmd,
        model: provider.model,
        priority: provider.priority,
        health: provider.health,
        consecutive_failures: provider.consecutive_failures,
        last_error: provider.last_error,
        last_success_at: provider.last_success_at,
        last_latency_ms: provider.last_latency_ms,
        circuit_open_until: provider.circuit_open_until,
        enabled: provider.enabled
      }
    end)
  end
end
