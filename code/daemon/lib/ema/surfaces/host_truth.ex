defmodule Ema.Surfaces.HostTruth do
  @moduledoc """
  Read-only host-truth view over the live dispatch loop and operator-facing EMA state.

  This module deliberately prefers host-observed evidence over derived databases.
  It reads dispatch directories, recent task artifacts, host logs, process state,
  and listener state to produce both:

  * a low-level loop snapshot (`counts`, `recent`, `malformed_failures`, etc.)
  * a higher-level operator contract (`overall_state`, `domains`, `top_causes`)

  The API keeps the original loop-health fields for compatibility while adding a
  fuller domain-oriented operator view for D1/D2 work.
  """

  @default_dispatch_root Path.expand("~/dispatch")
  @default_dispatch_log_file Path.expand("~/logs/dispatch-engine.log")
  @default_observer_log_file Path.expand("~/logs/ema-observer.log")
  @default_http_port 4488

  @type snapshot_opt ::
          {:dispatch_root, String.t()}
          | {:dispatch_log_file, String.t()}
          | {:observer_log_file, String.t()}
          | {:observer_event_lines, [String.t()]}
          | {:dispatch_engine, map()}
          | {:port_listening, boolean()}
          | {:http_port, non_neg_integer()}
          | {:observed_at, DateTime.t()}

  def snapshot(opts \\ []) do
    observed_at = Keyword.get(opts, :observed_at, DateTime.utc_now())
    dispatch_root = Keyword.get(opts, :dispatch_root, dispatch_root())
    dispatch_log_file = Keyword.get(opts, :dispatch_log_file, dispatch_log_file())

    counts = counts(dispatch_root)
    dispatch_engine = dispatch_engine_status(opts)

    recent = %{
      queue: recent_tasks(dispatch_root, "queue", 5),
      active: recent_tasks(dispatch_root, "active", 5),
      done: recent_tasks(dispatch_root, "done", 5),
      failed: recent_tasks(dispatch_root, "failed", 5)
    }

    malformed_failures = malformed_failures(dispatch_root, 5)
    recent_log_tail = log_tail(dispatch_log_file, 20)

    observer = observer_signals(opts, observed_at)

    anomalies =
      anomalies(
        counts,
        dispatch_engine,
        recent,
        malformed_failures,
        recent_log_tail,
        observer,
        observed_at
      )

    operator_status =
      operator_status(counts, dispatch_engine, recent, anomalies, observer, observed_at)

    health = legacy_health_summary(operator_status, counts, dispatch_engine, anomalies)

    %{
      observed_at: DateTime.to_iso8601(observed_at),
      root: dispatch_root,
      health: health,
      status: operator_status.overall_state,
      overall_state: operator_status.overall_state,
      headline: operator_status.headline,
      summary: operator_status.summary,
      domains: operator_status.domains,
      top_causes: operator_status.top_causes,
      operator_actions: operator_status.operator_actions,
      transitions: operator_status.transitions,
      evidence: operator_status.evidence,
      anomalies: anomalies,
      dispatch_engine: dispatch_engine,
      counts: counts,
      recent: recent,
      malformed_failures: malformed_failures,
      recent_log_tail: recent_log_tail,
      observer: observer
    }
  end

  def operator_status(opts \\ []) do
    snapshot = snapshot(opts)
    status = operator_status_label(snapshot.overall_state)

    host = %{
      host_id: host_id(),
      display_name: host_display_name(),
      status: status,
      score: operator_score(status, snapshot.top_causes),
      confidence: operator_confidence(snapshot),
      since: snapshot.observed_at,
      summary_line: snapshot.headline,
      top_reasons: Enum.map(snapshot.top_causes, &top_cause_code/1),
      anomaly: operator_anomaly(snapshot.top_causes),
      stale: status == :unknown,
      maintenance: false,
      last_heartbeat_at: snapshot.observed_at,
      links: %{
        detail: "/api/surfaces/host-truth",
        logs: dispatch_log_file()
      },
      counts: snapshot.counts,
      dispatch_engine: snapshot.dispatch_engine,
      operator_actions: snapshot.operator_actions
    }

    %{
      generated_at: snapshot.observed_at,
      summary: %{
        healthy: if(status == :healthy, do: 1, else: 0),
        degraded: if(status == :degraded, do: 1, else: 0),
        unhealthy: if(status == :unhealthy, do: 1, else: 0),
        unknown: if(status == :unknown, do: 1, else: 0),
        hosts_with_anomalies: if(snapshot.top_causes != [], do: 1, else: 0),
        stale_hosts: if(status == :unknown, do: 1, else: 0)
      },
      hosts: [host]
    }
  end

  def operator_detail(opts \\ []) do
    data = snapshot(opts)

    %{
      generated_at: data.observed_at,
      overall_state: data.overall_state,
      headline: data.headline,
      summary: data.summary,
      domains: data.domains,
      top_causes: data.top_causes,
      operator_actions: data.operator_actions,
      transitions: data.transitions,
      evidence: data.evidence,
      links: %{
        detail: "/api/surfaces/host-truth"
      }
    }
  end

  defp dispatch_root,
    do: Application.get_env(:ema, :host_truth_dispatch_root, @default_dispatch_root)

  defp dispatch_log_file,
    do: Application.get_env(:ema, :host_truth_dispatch_log_file, @default_dispatch_log_file)

  defp observer_log_file,
    do: Application.get_env(:ema, :host_truth_observer_log_file, @default_observer_log_file)

  defp http_port, do: Application.get_env(:ema, :host_truth_http_port, @default_http_port)

  defp counts(dispatch_root) do
    queue_artifacts = count_json(dispatch_root, "queue", include_index?: true)
    effective_queue = count_json(dispatch_root, "queue")

    %{
      queue: effective_queue,
      queue_artifacts: queue_artifacts,
      queue_index_present: queue_artifacts > effective_queue,
      active: count_json(dispatch_root, "active"),
      done: count_json(dispatch_root, "done"),
      failed: count_json(dispatch_root, "failed"),
      partial: count_json(dispatch_root, "partial"),
      results: count_txt(dispatch_root, "results")
    }
  end

  defp dispatch_engine_status(opts) do
    case Keyword.get(opts, :dispatch_engine) do
      nil -> dispatch_engine_status_from_host()
      status -> normalize_dispatch_engine(status)
    end
  end

  defp dispatch_engine_status_from_host do
    case System.cmd("pgrep", ["-af", "dispatch-engine.sh"], stderr_to_stdout: true) do
      {output, 0} ->
        lines = output |> String.split("\n", trim: true) |> Enum.take(10)

        %{
          running: true,
          processes: lines
        }

      {_output, _code} ->
        %{
          running: false,
          processes: []
        }
    end
  end

  defp normalize_dispatch_engine(status) do
    %{
      running: Map.get(status, :running, Map.get(status, "running", false)),
      processes: Map.get(status, :processes, Map.get(status, "processes", []))
    }
  end

  defp recent_tasks(dispatch_root, dir, limit) do
    dir
    |> json_files(dispatch_root)
    |> Enum.map(&task_entry/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.sort_by(& &1.sort_key, {:desc, DateTime})
    |> Enum.take(limit)
    |> Enum.map(&Map.drop(&1, [:sort_key]))
  end

  defp malformed_failures(dispatch_root, limit) do
    "failed"
    |> json_files(dispatch_root)
    |> Enum.map(&task_entry/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.filter(fn task ->
      reason = Map.get(task, :failure_reason) || ""
      String.contains?(reason, "invalid JSON")
    end)
    |> Enum.sort_by(& &1.sort_key, {:desc, DateTime})
    |> Enum.take(limit)
    |> Enum.map(&Map.take(&1, [:id, :failed_at, :failure_reason, :raw_file, :path]))
  end

  defp task_entry(path) do
    with {:ok, body} <- File.read(path),
         {:ok, payload} <- Jason.decode(body) do
      sort_source =
        payload["failed_at"] || payload["done_at"] || payload["claimed_at"] ||
          payload["created"] || payload["created_at"] ||
          file_mtime_iso(path)

      %{
        id: payload["id"] || Path.basename(path, ".json"),
        status: payload["status"],
        agent: payload["agent"],
        description: payload["description"],
        failure_reason: payload["failure_reason"] || payload["error"],
        result_file: payload["result_file"],
        raw_file: payload["raw_file"],
        created_at: payload["created"] || payload["created_at"],
        claimed_at: payload["claimed_at"],
        done_at: payload["done_at"],
        failed_at: payload["failed_at"],
        path: path,
        sort_key: parse_dt(sort_source)
      }
    else
      _ -> nil
    end
  end

  defp log_tail(path, lines) do
    if File.exists?(path) do
      path
      |> File.read!()
      |> String.split("\n", trim: true)
      |> Enum.take(-lines)
    else
      []
    end
  end

  defp count_json(dispatch_root, dir, opts \\ []) do
    dir
    |> json_files(dispatch_root, opts)
    |> length()
  end

  defp count_txt(dispatch_root, dir) do
    dispatch_root
    |> Path.join(dir)
    |> Path.join("*.txt")
    |> Path.wildcard()
    |> length()
  end

  defp json_files(dir, dispatch_root, opts \\ []) do
    include_index? = Keyword.get(opts, :include_index?, false)

    dispatch_root
    |> Path.join(dir)
    |> Path.join("*.json")
    |> Path.wildcard()
    |> Enum.reject(fn path -> not include_index? and Path.basename(path) == "index.json" end)
  end

  defp file_mtime_iso(path) do
    {:ok, stat} = File.stat(path, time: :posix)
    stat.mtime |> DateTime.from_unix!() |> DateTime.to_iso8601()
  end

  defp observer_signals(opts, observed_at) do
    lines = observer_event_lines(opts)
    port = Keyword.get(opts, :http_port, http_port())
    port_listening = Keyword.get_lazy(opts, :port_listening, fn -> port_listening?(port) end)

    unsupported_methods = unsupported_methods(lines)
    provider_errors = provider_errors(lines)

    %{
      http_port: port,
      port_listening: port_listening,
      recent_lines: Enum.take(lines, -80),
      unsupported_methods: unsupported_methods,
      unsupported_method_count: length(unsupported_methods),
      provider_errors: provider_errors,
      provider_error_count: length(provider_errors),
      timeout_count: Enum.count(provider_errors, &(&1.class == :timeout)),
      cli_error_count: Enum.count(provider_errors, &(&1.class == :cli_error)),
      last_provider_error_at: latest_timestamp(provider_errors),
      inferred_at: DateTime.to_iso8601(observed_at)
    }
  end

  defp observer_event_lines(opts) do
    case Keyword.get(opts, :observer_event_lines) do
      lines when is_list(lines) ->
        lines

      _ ->
        observer_event_lines_from_host(Keyword.get(opts, :observer_log_file, observer_log_file()))
    end
  end

  defp observer_event_lines_from_host(log_file) do
    cond do
      File.exists?(log_file) ->
        log_tail(log_file, 250)

      true ->
        journal_tail()
    end
  end

  defp journal_tail do
    case System.cmd(
           "journalctl",
           ["--user", "--since", "90 minutes ago", "--no-pager", "-o", "cat"],
           stderr_to_stdout: true
         ) do
      {output, 0} -> output |> String.split("\n", trim: true) |> Enum.take(-250)
      _ -> []
    end
  end

  defp port_listening?(port) do
    case System.cmd("ss", ["-ltn"], stderr_to_stdout: true) do
      {output, 0} -> String.contains?(output, ":#{port}")
      _ -> false
    end
  end

  defp unsupported_methods(lines) do
    lines
    |> Enum.flat_map(fn line ->
      case Regex.run(~r/unknown method: ([A-Za-z0-9._-]+)/, line, capture: :all_but_first) do
        [method] -> [method]
        _ -> []
      end
    end)
    |> Enum.uniq()
  end

  defp provider_errors(lines) do
    lines
    |> Enum.filter(fn line ->
      String.contains?(line, "LLM request timed out") or
        String.contains?(line, "EMA proxy error") or
        String.contains?(line, "exit_status")
    end)
    |> Enum.map(fn line ->
      class =
        cond do
          String.contains?(line, "timed out") -> :timeout
          String.contains?(line, "exit_status") -> :cli_error
          String.contains?(line, "EMA proxy error") -> :proxy_error
          true -> :unknown
        end

      %{
        class: class,
        message: String.trim(line),
        at: extract_timestamp(line)
      }
    end)
  end

  defp latest_timestamp(errors) do
    errors
    |> Enum.map(&Map.get(&1, :at))
    |> Enum.reject(&is_nil/1)
    |> Enum.sort({:desc, DateTime})
    |> List.first()
    |> case do
      nil -> nil
      dt -> DateTime.to_iso8601(dt)
    end
  end

  defp extract_timestamp(line) do
    case Regex.run(~r/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/, line,
           capture: :all_but_first
         ) do
      [ts] -> parse_dt(ts)
      _ -> nil
    end
  end

  defp anomalies(
         counts,
         dispatch_engine,
         recent,
         malformed_failures,
         recent_log_tail,
         observer,
         observed_at
       ) do
    []
    |> maybe_add(counts.queue > 0 and not dispatch_engine.running, %{
      code: :queued_work_without_dispatch_engine,
      severity: :high,
      domain: :dispatch_loop,
      message: "Queued work exists, but dispatch engine is not running.",
      details: %{queue: counts.queue}
    })
    |> maybe_add(counts.active > 0 and not dispatch_engine.running, %{
      code: :active_work_without_dispatch_engine,
      severity: :critical,
      domain: :dispatch_loop,
      message: "Active tasks exist, but dispatch engine is not running.",
      details: %{active: counts.active, tasks: Enum.take(recent.active, 3)}
    })
    |> maybe_add(length(malformed_failures) > 0, %{
      code: :malformed_task_failures_present,
      severity: :medium,
      domain: :dispatch_loop,
      message: "Malformed task failures are present in failed/.",
      details: %{count: length(malformed_failures), tasks: malformed_failures}
    })
    |> maybe_add(stale_active_tasks(recent.active, observed_at) != [], %{
      code: :stale_active_tasks,
      severity: :high,
      domain: :dispatch_loop,
      message: "One or more active tasks look stale.",
      details: %{tasks: stale_active_tasks(recent.active, observed_at)}
    })
    |> maybe_add(recent_failure_spike?(recent.failed, observed_at), %{
      code: :recent_failure_spike,
      severity: :medium,
      domain: :dispatch_loop,
      message: "Multiple recent failures observed in failed/.",
      details: %{recent_failures: Enum.take(recent.failed, 3)}
    })
    |> maybe_add(stuck_empty_cycles?(counts, dispatch_engine, recent_log_tail), %{
      code: :idle_empty_cycles,
      severity: :low,
      domain: :dispatch_loop,
      message: "Dispatch engine is cycling with an empty queue.",
      details: %{log_tail: Enum.take(recent_log_tail, -5)}
    })
    |> maybe_add(not observer.port_listening, %{
      code: :observer_api_unreachable,
      severity: :critical,
      domain: :observer_api,
      message: "Host-truth observer API is not listening on its configured HTTP port.",
      details: %{port: observer.http_port}
    })
    |> maybe_add(observer.timeout_count > 0 or observer.cli_error_count > 0, %{
      code: :provider_path_errors_present,
      severity: provider_error_severity(observer),
      domain: :provider_path,
      message: "Recent provider-path errors were observed in EMA logs.",
      details: %{
        timeout_count: observer.timeout_count,
        cli_error_count: observer.cli_error_count,
        recent_errors: Enum.take(observer.provider_errors, -5)
      }
    })
    |> maybe_add(observer.unsupported_method_count > 0, %{
      code: :unsupported_gateway_methods,
      severity: :medium,
      domain: :gateway_protocol,
      message: "EMA is issuing gateway methods that the peer reports as unsupported.",
      details: %{methods: observer.unsupported_methods}
    })
    |> Enum.reverse()
  end

  defp provider_error_severity(observer) do
    cond do
      observer.timeout_count > 0 and observer.cli_error_count > 0 -> :high
      observer.timeout_count >= 2 -> :high
      observer.cli_error_count >= 3 -> :high
      true -> :medium
    end
  end

  defp maybe_add(list, true, item), do: [item | list]
  defp maybe_add(list, false, _item), do: list

  defp stale_active_tasks(tasks, observed_at) do
    cutoff = DateTime.add(observed_at, -20 * 60, :second)

    Enum.filter(tasks, fn task ->
      case Map.get(task, :claimed_at) do
        nil -> false
        claimed_at -> DateTime.compare(parse_dt(claimed_at), cutoff) == :lt
      end
    end)
  end

  defp recent_failure_spike?(failed_tasks, observed_at) do
    cutoff = DateTime.add(observed_at, -30 * 60, :second)

    failed_tasks
    |> Enum.filter(fn task ->
      case Map.get(task, :failed_at) do
        nil -> false
        failed_at -> DateTime.compare(parse_dt(failed_at), cutoff) == :gt
      end
    end)
    |> length() >= 3
  end

  defp stuck_empty_cycles?(counts, dispatch_engine, recent_log_tail) do
    dispatch_engine.running and counts.queue == 0 and counts.active == 0 and
      Enum.count(recent_log_tail, &String.contains?(&1, "Queue empty, nothing to do.")) >= 3
  end

  defp operator_status(counts, dispatch_engine, recent, anomalies, observer, observed_at) do
    domains = %{
      observer_api: observer_api_domain(observer),
      dispatch_loop: dispatch_loop_domain(counts, dispatch_engine, recent, anomalies),
      provider_path: provider_path_domain(observer),
      gateway_protocol: gateway_protocol_domain(observer)
    }

    overall_state = rollup_state(domains)
    top_causes = top_causes(domains)
    operator_actions = operator_actions(domains)

    %{
      overall_state: overall_state,
      headline: headline(overall_state, domains),
      summary: summary(overall_state, domains),
      domains: domains,
      top_causes: top_causes,
      operator_actions: operator_actions,
      transitions: [],
      evidence: %{
        generated_at: DateTime.to_iso8601(observed_at),
        counts: counts,
        dispatch_engine_running: dispatch_engine.running,
        effective_queue_count: counts.queue,
        queue_artifacts: counts.queue_artifacts,
        provider_error_count: observer.provider_error_count,
        unsupported_method_count: observer.unsupported_method_count
      }
    }
  end

  defp observer_api_domain(observer) do
    cond do
      observer.port_listening ->
        %{
          state: :healthy,
          severity: :info,
          summary: "Host-truth API listener is reachable on the configured HTTP port.",
          evidence: %{http_port: observer.http_port, port_listening: true},
          recommended_action: []
        }

      true ->
        %{
          state: :stalled,
          severity: :critical,
          summary: "Host-truth API listener is not reachable on the configured HTTP port.",
          evidence: %{http_port: observer.http_port, port_listening: false},
          recommended_action: [
            "restore the EMA daemon listener",
            "separate bind failure from crash-loop behavior"
          ]
        }
    end
  end

  defp dispatch_loop_domain(counts, dispatch_engine, recent, anomalies) do
    dispatch_anomalies = Enum.filter(anomalies, &(&1.domain == :dispatch_loop))

    {state, severity, summary, actions} =
      cond do
        counts.active > 0 and not dispatch_engine.running ->
          {:stalled, :critical, "Active dispatch work exists, but the engine is not running.",
           ["restart dispatch engine", "inspect stale active tasks"]}

        counts.queue > 0 and not dispatch_engine.running ->
          {:degraded, :high, "Queued dispatch work exists, but the engine is not running.",
           ["restart dispatch engine", "verify queue consumer is active"]}

        stale_active_tasks(recent.active, DateTime.utc_now()) != [] ->
          {:degraded, :high, "Dispatch has stale active tasks that may be stuck.",
           ["inspect stale task ownership", "check worker progress before retrying"]}

        counts.active > 0 ->
          {:healthy, :info, "Dispatch engine is running with active work in flight.", []}

        counts.queue == 0 ->
          {:healthy, :info, "Dispatch is effectively idle; no queued or active work.", []}

        true ->
          {:healthy, :low, "Dispatch queue has pending work and appears readable.", []}
      end

    %{
      state: state,
      severity: severity,
      summary: summary,
      evidence: %{
        queue_count: counts.queue,
        queue_artifacts: counts.queue_artifacts,
        queue_index_present: counts.queue_index_present,
        active_count: counts.active,
        done_count: counts.done,
        failed_count: counts.failed,
        partial_count: counts.partial,
        results_count: counts.results,
        dispatch_engine_running: dispatch_engine.running,
        anomaly_count: length(dispatch_anomalies)
      },
      recommended_action: actions
    }
  end

  defp provider_path_domain(observer) do
    cond do
      observer.timeout_count > 0 or observer.cli_error_count > 0 ->
        %{
          state: :degraded,
          severity: provider_error_severity(observer),
          summary: "Provider path is seeing recent timeout / CLI-level EMA proxy failures.",
          evidence: %{
            timeout_count: observer.timeout_count,
            cli_error_count: observer.cli_error_count,
            last_error_at: observer.last_provider_error_at,
            recent_errors: Enum.take(observer.provider_errors, -5)
          },
          recommended_action: [
            "route critical traffic to a known-good provider path",
            "split proxy failures by backend and exit code"
          ]
        }

      true ->
        %{
          state: :healthy,
          severity: :info,
          summary: "No recent provider-path timeout or CLI failures were observed.",
          evidence: %{timeout_count: 0, cli_error_count: 0, last_error_at: nil},
          recommended_action: []
        }
    end
  end

  defp gateway_protocol_domain(observer) do
    cond do
      observer.unsupported_method_count > 0 ->
        %{
          state: :degraded,
          severity: :medium,
          summary: "Gateway protocol mismatch detected; unsupported methods are being called.",
          evidence: %{
            unsupported_method_count: observer.unsupported_method_count,
            unsupported_methods: observer.unsupported_methods
          },
          recommended_action: [
            "align EMA gateway calls with the supported control-plane contract",
            "treat repeated unknown-method responses as a protocol anomaly"
          ]
        }

      true ->
        %{
          state: :healthy,
          severity: :info,
          summary: "No recent gateway protocol mismatches were observed.",
          evidence: %{unsupported_method_count: 0, unsupported_methods: []},
          recommended_action: []
        }
    end
  end

  defp rollup_state(domains) do
    states = domains |> Map.values() |> Enum.map(& &1.state)

    cond do
      :stalled in states -> :stalled
      :degraded in states -> :degraded
      true -> :healthy
    end
  end

  defp top_causes(domains) do
    domains
    |> Enum.map(fn {domain, info} -> Map.put(info, :domain, domain) end)
    |> Enum.reject(&(&1.state == :healthy))
    |> Enum.sort_by(fn info -> {severity_rank(info.severity), domain_rank(info.domain)} end)
    |> Enum.map(fn info ->
      %{
        domain: info.domain,
        severity: info.severity,
        message: info.summary
      }
    end)
    |> Enum.take(5)
  end

  defp operator_actions(domains) do
    domains
    |> Enum.flat_map(fn {_domain, info} -> info.recommended_action end)
    |> Enum.uniq()
    |> Enum.take(8)
  end

  defp headline(overall_state, domains) do
    state = overall_state |> Atom.to_string() |> String.upcase()

    segments = [
      domain_segment("observer", domains.observer_api),
      domain_segment("dispatch", domains.dispatch_loop),
      domain_segment("provider", domains.provider_path),
      domain_segment("gateway", domains.gateway_protocol)
    ]

    "#{state}: " <> Enum.join(segments, "; ")
  end

  defp summary(overall_state, domains) do
    cond do
      overall_state == :stalled ->
        "Operator action required: at least one core EMA domain is stalled."

      overall_state == :degraded ->
        "EMA is partially functional but one or more operator domains are degraded."

      true ->
        "EMA host-truth domains appear healthy from current host evidence."
    end
    |> Kernel.<>(" " <> Enum.join(Enum.map(Map.values(domains), & &1.summary), " "))
  end

  defp domain_segment(name, domain) do
    "#{name} #{Atom.to_string(domain.state)}"
  end

  defp legacy_health_summary(operator_status, counts, _dispatch_engine, anomalies) do
    queue_state =
      cond do
        counts.active > 0 -> :working
        counts.queue > 0 -> :queued
        true -> :idle
      end

    %{
      status: legacy_status(operator_status.overall_state),
      summary: operator_status.headline,
      queue_state: queue_state,
      anomaly_count: length(anomalies),
      actionable: operator_status.overall_state in [:degraded, :stalled]
    }
  end

  defp legacy_status(:stalled), do: :blocked
  defp legacy_status(:degraded), do: :degraded
  defp legacy_status(:healthy), do: :healthy

  defp operator_status_label(:healthy), do: :healthy
  defp operator_status_label(:degraded), do: :degraded
  defp operator_status_label(:stalled), do: :unhealthy
  defp operator_status_label(_), do: :unknown

  defp operator_score(status, top_causes) do
    base =
      case status do
        :healthy -> 0.96
        :degraded -> 0.68
        :unhealthy -> 0.24
        :unknown -> 0.5
      end

    penalty = Enum.count(top_causes) * 0.05
    Float.round(max(base - min(penalty, 0.25), 0.0), 3)
  end

  defp operator_confidence(snapshot) do
    confidence =
      0.55 +
        if(snapshot.dispatch_engine.running, do: 0.15, else: 0.0) +
        if(snapshot.observer.port_listening, do: 0.15, else: 0.0) +
        if(snapshot.top_causes == [], do: 0.1, else: 0.0) +
        if(length(snapshot.recent_log_tail) > 0, do: 0.05, else: 0.0)

    Float.round(min(confidence, 0.99), 3)
  end

  defp operator_anomaly([]), do: nil

  defp operator_anomaly([top_cause | _]) do
    %{
      present: true,
      kind: top_cause_code(top_cause),
      severity: top_cause[:severity] || top_cause["severity"],
      details: %{message: top_cause[:message] || top_cause["message"]}
    }
  end

  defp top_cause_code(top_cause) do
    (top_cause[:domain] || top_cause["domain"] || :unknown)
    |> to_string()
  end

  defp host_id do
    System.get_env("EMA_HOST_ID") || System.get_env("HOSTNAME") ||
      hostname_string(:inet.gethostname())
  end

  defp host_display_name do
    System.get_env("EMA_HOST_DISPLAY_NAME") || host_id()
  end

  defp hostname_string({:ok, hostname}), do: List.to_string(hostname)
  defp hostname_string(_), do: "ema-host"

  defp severity_rank(:critical), do: 0
  defp severity_rank(:high), do: 1
  defp severity_rank(:medium), do: 2
  defp severity_rank(:low), do: 3
  defp severity_rank(:info), do: 4
  defp severity_rank(_), do: 5

  defp domain_rank(:observer_api), do: 0
  defp domain_rank(:provider_path), do: 1
  defp domain_rank(:gateway_protocol), do: 2
  defp domain_rank(:dispatch_loop), do: 3
  defp domain_rank(_), do: 9

  defp parse_dt(nil), do: ~U[1970-01-01 00:00:00Z]

  defp parse_dt(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, dt, _} -> dt
      _ -> ~U[1970-01-01 00:00:00Z]
    end
  end
end
