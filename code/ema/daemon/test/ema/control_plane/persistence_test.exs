defmodule Ema.ControlPlane.PersistenceTest do
  use ExUnit.Case, async: false

  alias Ema.ControlPlane.Persistence
  alias Ema.Repo

  setup do
    # Clean tables before each test
    Repo.delete_all(Ema.ControlPlane.Schema.Event)
    Repo.delete_all(Ema.ControlPlane.Schema.Outcome)
    Repo.delete_all(Ema.ControlPlane.Schema.Execution)
    Repo.delete_all(Ema.ControlPlane.Schema.Proposal)
    Repo.delete_all(Ema.ControlPlane.Schema.Intent)
    Repo.delete_all(Ema.ControlPlane.Schema.ProjectState)
    :ok
  end

  test "upsert_proposal creates and updates a proposal" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    attrs = %{
      id: "prp_test_001",
      project: "ema",
      intent: "test-persistence",
      summary: "Testing Ecto persistence layer",
      status: "draft",
      inserted_at: now,
      updated_at: now
    }

    assert {:ok, proposal} = Persistence.upsert_proposal(attrs)
    assert proposal.id == "prp_test_001"
    assert proposal.project == "ema"
    assert proposal.status == "draft"

    # Upsert with updated status
    assert {:ok, updated} = Persistence.upsert_proposal(%{attrs | status: "running"})
    assert updated.status == "running"
  end

  test "upsert_execution creates an execution" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_proposal(%{
      id: "prp_test_002",
      project: "ema",
      intent: "test",
      summary: "test",
      status: "running",
      inserted_at: now,
      updated_at: now
    })

    attrs = %{
      id: "exe_test_001",
      proposal_id: "prp_test_002",
      project: "ema",
      intent: "test",
      status: "running",
      adapter: "local",
      started_at: now,
      inserted_at: now,
      updated_at: now
    }

    assert {:ok, execution} = Persistence.upsert_execution(attrs)
    assert execution.id == "exe_test_001"
    assert execution.status == "running"
  end

  test "insert_outcome creates an outcome" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_proposal(%{
      id: "prp_out_test",
      project: "ema",
      intent: "test",
      summary: "test",
      status: "running",
      inserted_at: now,
      updated_at: now
    })

    Persistence.upsert_execution(%{
      id: "exe_out_test",
      proposal_id: "prp_out_test",
      project: "ema",
      intent: "test",
      status: "completed",
      inserted_at: now,
      updated_at: now
    })

    attrs = %{
      id: "out_test_001",
      execution_id: "exe_out_test",
      proposal_id: "prp_out_test",
      project: "ema",
      intent: "test",
      status: "succeeded",
      summary: "completed successfully",
      inserted_at: now
    }

    assert {:ok, outcome} = Persistence.insert_outcome(attrs)
    assert outcome.id == "out_test_001"
    assert outcome.status == "succeeded"
  end

  test "list_proposals filters by project and status" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_proposal(%{
      id: "prp_a",
      project: "ema",
      intent: "a",
      summary: "a",
      status: "draft",
      inserted_at: now,
      updated_at: now
    })

    Persistence.upsert_proposal(%{
      id: "prp_b",
      project: "other",
      intent: "b",
      summary: "b",
      status: "running",
      inserted_at: now,
      updated_at: now
    })

    assert length(Persistence.list_proposals(project: "ema")) == 1
    assert length(Persistence.list_proposals(project: "other")) == 1
    assert length(Persistence.list_proposals(status: "draft")) == 1
    assert length(Persistence.list_proposals()) == 2
  end

  test "project_summary returns correct counts" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Persistence.upsert_proposal(%{
      id: "prp_sum",
      project: "ema",
      intent: "test",
      summary: "test",
      status: "running",
      inserted_at: now,
      updated_at: now
    })

    Persistence.upsert_execution(%{
      id: "exe_sum",
      proposal_id: "prp_sum",
      project: "ema",
      intent: "test",
      status: "running",
      inserted_at: now,
      updated_at: now
    })

    summary = Persistence.project_summary("ema")
    assert summary.project == "ema"
    assert summary.proposals == 1
    assert summary.executions == 1
    assert summary.open_executions == 1
  end

  test "insert_event persists a control-plane event" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    attrs = %{
      id: "evt_test_001",
      execution_id: "exe_test_001",
      type: "execution_started",
      status: "running",
      phase: "dispatch",
      occurred_at: now
    }

    assert {:ok, event} = Persistence.insert_event(attrs)
    assert event.id == "evt_test_001"

    events = Persistence.list_events(execution_id: "exe_test_001")
    assert length(events) == 1
  end

  test "upsert_intent creates and updates an intent" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    attrs = %{
      id: "int_test_001",
      project: "ema",
      slug: "test-intent",
      title: "Test Intent",
      kind: "integration",
      status: "active",
      priority: "high",
      current_focus: "test focus",
      inserted_at: now,
      updated_at: now
    }

    assert {:ok, intent} = Persistence.upsert_intent(attrs)
    assert intent.id == "int_test_001"
    assert intent.project == "ema"

    assert {:ok, updated} = Persistence.upsert_intent(%{attrs | status: "blocked"})
    assert updated.status == "blocked"
  end

  test "list_intents filters by project status and kind" do
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

    assert length(Persistence.list_intents(project: "ema")) == 1
    assert length(Persistence.list_intents(status: "blocked")) == 1
    assert length(Persistence.list_intents(kind: "integration")) == 1
  end

  test "upsert_project_state and get_project_state_by_project work" do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    attrs = %{
      id: "proj_ema",
      project: "ema",
      title: "EMA",
      status: "active",
      inserted_at: now,
      updated_at: now
    }

    assert {:ok, project_state} = Persistence.upsert_project_state(attrs)
    assert project_state.id == "proj_ema"

    fetched = Persistence.get_project_state_by_project("ema")
    assert fetched.id == "proj_ema"
    assert fetched.project == "ema"
  end
end
