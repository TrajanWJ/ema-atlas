defmodule Ema.Surfaces.HostTruthTest do
  use ExUnit.Case, async: true

  alias Ema.Surfaces.HostTruth

  test "builds operator domains and ignores queue index artifacts" do
    root = make_dispatch_fixture!()

    snapshot =
      HostTruth.snapshot(
        dispatch_root: root,
        dispatch_log_file: missing_path(root, "dispatch.log"),
        observer_event_lines: [],
        dispatch_engine: %{running: true, processes: ["123 dispatch-engine.sh"]},
        port_listening: true,
        observed_at: ~U[2026-04-06 07:33:00Z]
      )

    assert snapshot.overall_state == :healthy
    assert snapshot.status == :healthy
    assert snapshot.health.status == :healthy
    assert snapshot.counts.queue == 0
    assert snapshot.counts.queue_artifacts == 1
    assert snapshot.counts.queue_index_present == true

    assert snapshot.domains.dispatch_loop.state == :healthy
    assert snapshot.domains.dispatch_loop.evidence.queue_count == 0
    assert snapshot.domains.dispatch_loop.evidence.queue_artifacts == 1
    assert snapshot.domains.observer_api.state == :healthy
    assert snapshot.domains.provider_path.state == :healthy
    assert snapshot.domains.gateway_protocol.state == :healthy
    assert snapshot.operator_actions == []
    assert snapshot.transitions == []
  end

  test "marks stalled observer and degraded provider/gateway domains from host evidence" do
    root = make_dispatch_fixture!()

    observer_lines = [
      "2026-04-06T06:53:55.285+00:00 [diagnostic] lane task error: error=\"FailoverError: LLM request timed out.\"",
      "2026-04-06T06:53:56.445+00:00 [agent/embedded] embedded run agent end: provider=anthropic error=LLM error api_error: EMA proxy error: %{code: :cli_error, exit_status: 7, output: \"\"}",
      "2026-04-06T06:57:39.015+00:00 [ws] ⇄ res ✗ system.status 0ms errorCode=INVALID_REQUEST errorMessage=unknown method: system.status",
      "2026-04-06T06:57:39.085+00:00 [ws] ⇄ res ✗ heartbeat 1ms errorCode=INVALID_REQUEST errorMessage=unknown method: heartbeat"
    ]

    snapshot =
      HostTruth.snapshot(
        dispatch_root: root,
        dispatch_log_file: missing_path(root, "dispatch.log"),
        observer_event_lines: observer_lines,
        dispatch_engine: %{running: true, processes: ["123 dispatch-engine.sh"]},
        port_listening: false,
        observed_at: ~U[2026-04-06 07:33:00Z]
      )

    assert snapshot.overall_state == :stalled
    assert snapshot.health.status == :blocked

    assert snapshot.domains.observer_api.state == :stalled
    assert snapshot.domains.observer_api.severity == :critical

    assert snapshot.domains.provider_path.state == :degraded
    assert snapshot.domains.provider_path.evidence.timeout_count == 1
    assert snapshot.domains.provider_path.evidence.cli_error_count == 1

    assert snapshot.domains.gateway_protocol.state == :degraded

    assert Enum.sort(snapshot.domains.gateway_protocol.evidence.unsupported_methods) ==
             ["heartbeat", "system.status"]

    assert Enum.any?(snapshot.top_causes, &(&1.domain == :observer_api))
    assert Enum.any?(snapshot.operator_actions, &String.contains?(&1, "known-good provider path"))

    anomaly_codes = Enum.map(snapshot.anomalies, & &1.code)
    assert :observer_api_unreachable in anomaly_codes
    assert :provider_path_errors_present in anomaly_codes
    assert :unsupported_gateway_methods in anomaly_codes
  end

  defp make_dispatch_fixture! do
    root = Path.join(System.tmp_dir!(), "ema-host-truth-#{System.unique_integer([:positive])}")

    for dir <- ~w(queue active done failed partial results) do
      File.mkdir_p!(Path.join(root, dir))
    end

    File.write!(Path.join([root, "queue", "index.json"]), "[]")

    File.write!(
      Path.join([root, "done", "task-1.json"]),
      Jason.encode!(%{"id" => "task-1", "done_at" => "2026-04-06T07:00:00Z"})
    )

    File.write!(Path.join([root, "results", "task-1.txt"]), "ok")

    root
  end

  defp missing_path(root, filename), do: Path.join(root, filename)
end
