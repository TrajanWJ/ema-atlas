defmodule Ema.ControlPlane.CommandTest do
  use ExUnit.Case, async: false

  alias Ema.ControlPlane.{Command, Store}
  alias Ema.ControlPlane.Incidents.Authority

  setup do
    File.rm(Path.expand("../../../../priv/control_plane_state.json", __DIR__))
    File.rm(Path.expand("../../../../priv/control_plane_incidents.json", __DIR__))

    :sys.replace_state(Store, fn _ ->
      %{proposals: %{}, executions: %{}, outcomes: %{}, projects: %{}}
    end)

    :sys.replace_state(Authority, fn _ ->
      %{incidents: %{}, events: [], executions: %{}}
    end)

    :ok
  end

  test "help returns command reference" do
    assert {:ok, %{kind: "help", result: %{help: help}}} = Command.run("help")
    assert help =~ "status"
    assert help =~ "incidents"
    assert help =~ "snooze"
    assert help =~ "kill"
    assert help =~ "dispatch"
    assert help =~ "reconcile"
    assert help =~ "sweep"
  end

  test "status returns global overview" do
    assert {:ok, %{kind: "status", result: result}} = Command.run("status")
    assert Map.has_key?(result, :review_queue)
  end

  test "approve transitions a proposal into approved" do
    {:ok, proposal} =
      Store.propose(%{project: "ema", intent: "queue-clarity", summary: "Make approval explicit"})

    assert {:ok, %{kind: "approve", result: approved}} = Command.run("approve #{proposal.id}")
    assert approved.status == "approved"
  end

  test "sweep triggers stale execution sweep" do
    assert {:ok, %{kind: "sweep", result: result}} = Command.run("sweep")
    assert is_map(result)
    assert Map.has_key?(result, :swept_count) or Map.has_key?(result, :updated_count)
  end

  test "reconcile returns dispatch reconciler stats" do
    assert {:ok, %{kind: "reconcile", result: result}} = Command.run("reconcile")
    assert Map.has_key?(result, :reconciled_count)
  end

  test "snooze with incident_id calls authority" do
    Application.put_env(:ema, :incident_no_progress_warn_ms, 1_000)
    on_exit(fn -> Application.delete_env(:ema, :incident_no_progress_warn_ms) end)

    # Create an incident via execution event
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Executions.Events.topic(),
      {:execution_event,
       %{
         execution_id: "test-exe-snooze",
         type: "execution_started",
         status: "running",
         occurred_at:
           DateTime.utc_now()
           |> DateTime.add(-5, :second)
           |> DateTime.truncate(:second)
           |> DateTime.to_iso8601(),
         payload: %{}
       }}
    )

    Authority.sweep(DateTime.utc_now())
    [incident] = Authority.list(active: true)
    incident_id = incident[:incident_id]

    assert {:ok, %{kind: "snooze"}} = Command.run("snooze #{incident_id}")
  end

  test "kill with incident_id calls authority" do
    Application.put_env(:ema, :incident_no_progress_warn_ms, 1_000)
    on_exit(fn -> Application.delete_env(:ema, :incident_no_progress_warn_ms) end)

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      Ema.Executions.Events.topic(),
      {:execution_event,
       %{
         execution_id: "test-exe-kill",
         type: "execution_started",
         status: "running",
         occurred_at:
           DateTime.utc_now()
           |> DateTime.add(-5, :second)
           |> DateTime.truncate(:second)
           |> DateTime.to_iso8601(),
         payload: %{}
       }}
    )

    Authority.sweep(DateTime.utc_now())
    [incident] = Authority.list(active: true)
    incident_id = incident[:incident_id]

    assert {:ok, %{kind: "kill"}} = Command.run("kill #{incident_id}")
  end

  test "db status returns persistence info" do
    assert {:ok, %{kind: "db_status", result: result}} = Command.run("db status")
    assert result.adapter == "sqlite3" or result.status == "unavailable"
  end

  test "unknown command returns error" do
    assert {:error, :unknown_command} = Command.run("nonexistent_command")
  end
end
