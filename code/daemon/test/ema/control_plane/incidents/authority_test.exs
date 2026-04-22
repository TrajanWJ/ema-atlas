defmodule Ema.ControlPlane.Incidents.AuthorityTest do
  use ExUnit.Case, async: false

  alias Ema.ControlPlane.Incidents.Authority
  alias Ema.Sessions.Supervisor, as: SessionsSupervisor

  setup do
    File.rm(Path.expand("../../../../priv/control_plane_incidents.json", __DIR__))
    :sys.replace_state(Authority, fn _ -> %{incidents: %{}, events: [], executions: %{}} end)
    :sys.replace_state(Ema.Sessions.Registry, fn _ -> %{sessions: %{}, actions: []} end)
    Application.put_env(:ema, :incident_no_progress_warn_ms, 1_000)
    on_exit(fn -> Application.delete_env(:ema, :incident_no_progress_warn_ms) end)
    :ok
  end

  test "host truth degraded transition opens incident and healthy resolves it" do
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Surfaces.HostTruthWatcher.topic(),
      {:host_truth_transition,
       %{domain: "observer_api", to: "degraded", headline: "observer API down"}}
    )

    Process.sleep(20)
    [incident] = Authority.list(active: true)
    assert incident[:kind] == "host_mismatch"
    assert incident[:execution_id] == "host-truth:observer_api"

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Surfaces.HostTruthWatcher.topic(),
      {:host_truth_transition,
       %{domain: "observer_api", to: "healthy", headline: "observer API restored"}}
    )

    Process.sleep(20)
    assert Authority.list(active: true) == []
  end

  test "stream quiet opens evidence incident and resumed activity resolves it" do
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "babysitter:all",
      {:babysitter_stream_updated,
       %{stream: "babysitter-live", quieted: true, reason: "idle", activity_score: 0.0}}
    )

    Process.sleep(20)
    [incident] = Authority.list(active: true)
    assert incident[:kind] == "stream_lost"
    assert incident[:execution_id] == "stream:babysitter-live"

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "babysitter:all",
      {:babysitter_stream_updated,
       %{stream: "babysitter-live", quieted: false, reason: "active", activity_score: 2.0}}
    )

    Process.sleep(20)
    assert Authority.list(active: true) == []
  end

  test "restart action is recorded through sessions supervisor path" do
    now = DateTime.utc_now()

    {:ok, _session} =
      SessionsSupervisor.register_session("test-claude", :claude, %{
        execution_id: "claude-session:test-claude",
        model: "sonnet",
        status: :running,
        started_at: now,
        last_progress_at: DateTime.add(now, -10, :second)
      })

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Executions.Events.topic(),
      {:execution_event,
       %{
         execution_id: "claude-session:test-claude",
         type: "execution_started",
         status: "running",
         occurred_at: DateTime.add(now, -10, :second) |> DateTime.to_iso8601(),
         payload: %{}
       }}
    )

    assert Authority.sweep(DateTime.add(now, 2, :second)).opened_count == 1
    [incident] = Authority.list(active: true)

    {:ok, updated} =
      Authority.request_action(incident[:incident_id], :restart, %{actor: "trajan"})

    assert updated[:owner] == "trajan"

    Process.sleep(50)
    assert Enum.any?(Authority.recent_events(10), &(&1[:type] == "operator_requested_restart"))
  end

  test "kill action is recorded through sessions supervisor path" do
    now = DateTime.utc_now()

    {:ok, _session} =
      SessionsSupervisor.register_session("test-codex", :codex, %{
        execution_id: "codex-session:test-codex",
        status: :running,
        started_at: now,
        last_progress_at: DateTime.add(now, -10, :second)
      })

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Executions.Events.topic(),
      {:execution_event,
       %{
         execution_id: "codex-session:test-codex",
         type: "execution_started",
         status: "running",
         occurred_at: DateTime.add(now, -10, :second) |> DateTime.to_iso8601(),
         payload: %{}
       }}
    )

    assert Authority.sweep(DateTime.add(now, 2, :second)).opened_count == 1
    [incident] = Authority.list(active: true)

    {:ok, _updated} = Authority.request_action(incident[:incident_id], :kill, %{actor: "trajan"})

    Process.sleep(50)
    session = SessionsSupervisor.status("codex-session:test-codex")
    assert Enum.any?(session.operator_requests, &(&1.action == :kill))
  end
end
