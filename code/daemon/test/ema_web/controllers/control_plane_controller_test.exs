defmodule EmaWeb.ControlPlaneControllerTest do
  use EmaWeb.ConnCase, async: false

  alias Ema.ControlPlane.Persistence
  alias Ema.Repo

  setup do
    File.rm(Path.expand("../../../priv/control_plane_state.json", __DIR__))
    File.rm(Path.expand("../../../priv/executions_events.jsonl", __DIR__))
    File.rm(Path.expand("../../../priv/control_plane_incidents.json", __DIR__))

    Repo.delete_all(Ema.ControlPlane.Schema.HostSessionMessage)
    Repo.delete_all(Ema.ControlPlane.Schema.HostSessionEvent)
    Repo.delete_all(Ema.ControlPlane.Schema.HostSession)
    Repo.delete_all(Ema.ControlPlane.Schema.Intent)
    Repo.delete_all(Ema.ControlPlane.Schema.ProjectState)

    :sys.replace_state(Ema.ControlPlane.Store, fn _ ->
      %{proposals: %{}, executions: %{}, outcomes: %{}, projects: %{}}
    end)

    :sys.replace_state(Ema.ControlPlane.Incidents.Authority, fn _ ->
      %{incidents: %{}, events: [], executions: %{}}
    end)

    :ok
  end

  test "proposal -> approval -> execution -> outcome lineage works", %{conn: conn} do
    conn =
      post(conn, "/api/control-plane/proposals", %{
        project: "ema-phase2-build",
        intent: "dispatch-board",
        summary: "Bootstrap dispatch-board execution lane"
      })

    %{"proposal" => proposal} = json_response(conn, 201)
    assert proposal["status"] == "pending_review"

    conn =
      post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/approve", %{
        operator: "trajan",
        note: "ready to execute"
      })

    %{"proposal" => approved_proposal} = json_response(conn, 200)
    assert approved_proposal["status"] == "approved"
    assert approved_proposal["approved_by"] == "trajan"

    conn =
      post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/run", %{
        operator: "trajan",
        adapter: "local"
      })

    %{"execution" => execution, "proposal" => updated_proposal} = json_response(conn, 200)
    assert execution["proposal_id"] == proposal["id"]
    assert execution["status"] == "running"
    assert updated_proposal["status"] == "running"

    conn =
      post(build_conn(), "/api/control-plane/executions/#{execution["id"]}/complete", %{
        status: "succeeded",
        summary: "Control-plane engine bootstrapped"
      })

    %{"outcome" => outcome, "execution" => completed_execution, "proposal" => completed_proposal} =
      json_response(conn, 200)

    assert outcome["execution_id"] == execution["id"]
    assert outcome["status"] == "succeeded"
    assert completed_execution["status"] == "completed"
    assert completed_proposal["status"] == "completed"
  end

  test "context_for returns deterministic bounded snapshot", %{conn: conn} do
    post(conn, "/api/control-plane/proposals", %{
      project: "ema-phase2-build",
      intent: "scope-advisor",
      summary: "Bootstrap scope advisor"
    })

    conn = get(build_conn(), "/api/control-plane/context_for", %{project: "ema-phase2-build"})
    body = json_response(conn, 200)

    assert body["project"] == "ema-phase2-build"
    assert is_list(body["active_goals"])
    assert is_list(body["relevant_outcomes"])
    assert is_list(body["open_executions"])
    assert is_list(body["bounded_working_set"])
    assert Map.has_key?(body["counts"], "proposals")
    assert Map.has_key?(body["review_queue"], "pending_review")
  end

  test "run is blocked until proposal is approved", %{conn: conn} do
    conn =
      post(conn, "/api/control-plane/proposals", %{
        project: "ema-phase2-build",
        intent: "approval-gate",
        summary: "Require explicit approval"
      })

    %{"proposal" => proposal} = json_response(conn, 201)

    conn =
      post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/run", %{
        operator: "trajan",
        adapter: "local"
      })

    body = json_response(conn, 409)
    assert body["error"] == "proposal_not_approved"
    assert body["message"] =~ "pending_review"
  end

  test "dispatch-board replay returns canonical execution + host-truth surfaces in one payload",
       %{conn: conn} do
    execution_id = "dispatch-board-exec"

    Ema.Executions.Events.emit(execution_id, :execution_started, %{
      status: :running,
      phase: :dispatch,
      summary_line: "dispatch board is live",
      payload: %{
        project: "ema-phase2-build",
        intent: "dispatch-board",
        proposal_id: "prp_dispatch"
      }
    })

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Surfaces.HostTruthWatcher.topic(),
      {:host_truth_transition,
       %{
         event_type: "host.domain.transition",
         domain: "dispatch_loop",
         from: "healthy",
         to: "degraded",
         host_id: "ema-host",
         at: DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.to_iso8601()
       }}
    )

    conn =
      get(conn, "/api/control-plane/replay/dispatch-board", %{
        project: "ema-phase2-build",
        intent: "dispatch-board",
        limit: "10"
      })

    body = json_response(conn, 200)

    assert get_in(body, ["filters", "project"]) == "ema-phase2-build"
    assert get_in(body, ["filters", "intent"]) == "dispatch-board"
    assert is_map(get_in(body, ["board", "host_truth"]))
    assert is_list(get_in(body, ["board", "host_transitions"]))
    assert is_list(get_in(body, ["board", "execution_stream"]))
    assert is_list(get_in(body, ["board", "execution_cards"]))

    [event | _] = body["board"]["execution_stream"]
    assert event["execution_id"] == execution_id
    assert event["payload"]["intent"] == "dispatch-board"

    [card | _] = body["board"]["execution_cards"]
    assert card["execution_id"] == execution_id
    assert card["intent"] == "dispatch-board"
    assert card["project"] == "ema-phase2-build"
  end

  test "stale executions are swept into explicit failure states", %{conn: conn} do
    conn =
      post(conn, "/api/control-plane/proposals", %{
        project: "ema-phase2-build",
        intent: "incident-hardening",
        summary: "Bootstrap stale execution handling"
      })

    %{"proposal" => proposal} = json_response(conn, 201)

    post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/approve", %{
      operator: "trajan"
    })

    conn =
      post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/run", %{
        operator: "trajan",
        adapter: "local"
      })

    %{"execution" => execution} = json_response(conn, 200)

    stale_now = DateTime.utc_now()

    stale_started_at =
      stale_now |> DateTime.add(-(31 * 60), :second) |> DateTime.truncate(:second)

    :sys.replace_state(Ema.ControlPlane.Store, fn state ->
      update_in(state, [:executions, execution["id"]], fn current ->
        %{
          current
          | started_at: stale_started_at,
            created_at: stale_started_at,
            updated_at: stale_started_at
        }
      end)
    end)

    sweep = Ema.ControlPlane.Store.sweep_stale(stale_now)
    assert sweep.updated_count == 1

    status = Ema.ControlPlane.Store.status()
    [project] = status.projects
    assert project.counts.executions == 1
    assert project.open_executions == []

    ledger = Path.expand("../../../priv/executions_events.jsonl", __DIR__)
    assert {:ok, body} = File.read(ledger)
    assert body =~ execution["id"]
    assert body =~ "execution_timed_out"
  end

  test "no-progress incidents open and can be acked through the API", %{conn: conn} do
    Application.put_env(:ema, :incident_no_progress_warn_ms, 1_000)
    on_exit(fn -> Application.delete_env(:ema, :incident_no_progress_warn_ms) end)

    conn =
      post(conn, "/api/control-plane/proposals", %{
        project: "ema-phase2-build",
        intent: "incident-authority",
        summary: "Bootstrap incident authority"
      })

    %{"proposal" => proposal} = json_response(conn, 201)

    post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/approve", %{
      operator: "trajan"
    })

    conn =
      post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/run", %{
        operator: "trajan",
        adapter: "local"
      })

    %{"execution" => execution} = json_response(conn, 200)

    old =
      DateTime.utc_now()
      |> DateTime.add(-5, :second)
      |> DateTime.truncate(:second)
      |> DateTime.to_iso8601()

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Executions.Events.topic(),
      {:execution_event,
       %{
         execution_id: execution["id"],
         type: "execution_started",
         status: "running",
         occurred_at: old,
         payload: %{"proposal_id" => proposal["id"]}
       }}
    )

    sweep = Ema.ControlPlane.Incidents.Authority.sweep(DateTime.utc_now())
    assert sweep.opened_count == 1

    conn = get(build_conn(), "/api/control-plane/incidents")
    %{"incidents" => [incident]} = json_response(conn, 200)
    assert incident["execution_id"] == execution["id"]
    assert incident["kind"] == "no_progress"
    assert incident["status"] == "open"

    conn =
      post(build_conn(), "/api/control-plane/incidents/#{incident["incident_id"]}/actions/ack", %{
        actor: "trajan"
      })

    %{"incident" => acked} = json_response(conn, 200)
    assert acked["status"] == "acked"
    assert acked["owner"] == "trajan"
  end

  test "progress events resolve open no-progress incidents", %{conn: conn} do
    Application.put_env(:ema, :incident_no_progress_warn_ms, 1_000)
    on_exit(fn -> Application.delete_env(:ema, :incident_no_progress_warn_ms) end)

    conn =
      post(conn, "/api/control-plane/proposals", %{
        project: "ema-phase2-build",
        intent: "incident-recovery",
        summary: "Bootstrap incident recovery"
      })

    %{"proposal" => proposal} = json_response(conn, 201)

    post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/approve", %{
      operator: "trajan"
    })

    conn =
      post(build_conn(), "/api/control-plane/proposals/#{proposal["id"]}/run", %{
        operator: "trajan",
        adapter: "local"
      })

    %{"execution" => execution} = json_response(conn, 200)

    old =
      DateTime.utc_now()
      |> DateTime.add(-5, :second)
      |> DateTime.truncate(:second)
      |> DateTime.to_iso8601()

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Executions.Events.topic(),
      {:execution_event,
       %{
         execution_id: execution["id"],
         type: "execution_started",
         status: "running",
         occurred_at: old,
         payload: %{"proposal_id" => proposal["id"]}
       }}
    )

    assert Ema.ControlPlane.Incidents.Authority.sweep(DateTime.utc_now()).opened_count == 1

    [incident] = Ema.ControlPlane.Incidents.Authority.list(active: true)
    assert incident[:status] == "open"

    now = DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.to_iso8601()

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Executions.Events.topic(),
      {:execution_event,
       %{
         execution_id: execution["id"],
         type: "execution_progress",
         status: "running",
         occurred_at: now,
         payload: %{"proposal_id" => proposal["id"]}
       }}
    )

    Process.sleep(20)
    assert Ema.ControlPlane.Incidents.Authority.list(active: true) == []
  end

  test "project state route returns nil when absent", %{conn: conn} do
    conn = get(conn, "/api/control-plane/projects/ema/state")
    assert json_response(conn, 200) == %{"project" => nil}
  end

  test "project state route returns serialized state when present", %{conn: conn} do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_project_state(%{
      id: "proj_ema",
      project: "ema",
      title: "EMA",
      status: "active",
      current_focus_intent_id: "int_host_cli_integration",
      inserted_at: now,
      updated_at: now
    })

    conn = get(conn, "/api/control-plane/projects/ema/state")
    %{"project" => project} = json_response(conn, 200)
    assert project["project"] == "ema"
    assert project["current_focus_intent_id"] == "int_host_cli_integration"
  end

  test "project intents route filters by project", %{conn: conn} do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_intent(%{
      id: "int_a",
      project: "ema",
      slug: "a",
      title: "A",
      kind: "integration",
      status: "active",
      inserted_at: now,
      updated_at: now
    })

    Persistence.upsert_intent(%{
      id: "int_b",
      project: "other",
      slug: "b",
      title: "B",
      kind: "migration",
      status: "blocked",
      inserted_at: now,
      updated_at: now
    })

    conn = get(conn, "/api/control-plane/projects/ema/intents")
    %{"intents" => intents} = json_response(conn, 200)
    assert length(intents) == 1
    assert hd(intents)["project"] == "ema"
  end

  test "project package route includes state intents and sources", %{conn: conn} do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_project_state(%{
      id: "proj_ema",
      project: "ema",
      title: "EMA",
      status: "active",
      linked_refs: %{wiki_pages: ["wiki:projects/EMA"]},
      inserted_at: now,
      updated_at: now
    })

    Persistence.upsert_intent(%{
      id: "int_ema_root",
      project: "ema",
      slug: "ema-root",
      title: "EMA Root",
      kind: "project-root",
      status: "active",
      inserted_at: now,
      updated_at: now
    })

    conn = get(conn, "/api/context/project/ema/package")
    body = json_response(conn, 200)
    assert body["project_state"]["project"] == "ema"
    assert length(body["intents"]) == 1
    assert body["wiki"]["linked_pages"] == ["wiki:projects/EMA"]
    assert is_list(body["sources"])
  end

  test "project bootstrap is idempotent and creates missing intents", %{conn: conn} do
    conn =
      post(conn, "/api/control-plane/projects/ema/bootstrap", %{
        title: "EMA",
        seed_intents: ["host-cli-integration", "session-normalization"]
      })

    body = json_response(conn, 200)
    assert body["project"]["project"] == "ema"
    assert length(body["created_intents"]) == 2

    conn =
      post(build_conn(), "/api/control-plane/projects/ema/bootstrap", %{
        title: "EMA",
        seed_intents: ["host-cli-integration", "session-normalization"]
      })

    body = json_response(conn, 200)
    assert length(body["created_intents"]) == 0
    assert length(body["existing_intents"]) == 2
  end

  test "intent update mutates canonical intent state", %{conn: conn} do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_intent(%{
      id: "int_test",
      project: "ema",
      slug: "test",
      title: "Test",
      kind: "integration",
      status: "active",
      inserted_at: now,
      updated_at: now
    })

    conn =
      post(conn, "/api/control-plane/intents/int_test/update", %{
        patch: %{
          status: "blocked",
          current_focus: "Need parity cleanup"
        }
      })

    body = json_response(conn, 200)
    assert body["intent"]["status"] == "blocked"
    assert body["intent"]["current_focus"] == "Need parity cleanup"
  end
end
