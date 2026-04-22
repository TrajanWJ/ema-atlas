defmodule Ema.ControlPlane.DispatchReconcilerTest do
  use ExUnit.Case, async: false

  alias Ema.ControlPlane.{DispatchReconciler, Store}

  setup do
    File.rm(Path.expand("../../../../priv/control_plane_state.json", __DIR__))
    File.rm(Path.expand("../../../../priv/executions_events.jsonl", __DIR__))

    :sys.replace_state(Store, fn _ ->
      %{proposals: %{}, executions: %{}, outcomes: %{}, projects: %{}}
    end)

    :sys.replace_state(DispatchReconciler, fn _ ->
      %{reconciled_count: 0, last_reconciled_at: nil}
    end)

    :ok
  end

  test "dispatch event with terminal status auto-closes the execution" do
    # Create a proposal and run it to get an execution
    {:ok, proposal} =
      Store.propose(%{project: "ema", intent: "dispatch-test", summary: "test dispatch"})

    {:ok, %{execution: execution}} = Store.run(proposal.id, %{adapter: "gateway"})

    # Simulate gateway dispatch.update with completed status
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "surfaces:dispatch",
      {:dispatch_event,
       %{
         "type" => "dispatch.update",
         "execution_id" => execution.id,
         "status" => "completed",
         "summary" => "Gateway task finished"
       }}
    )

    Process.sleep(50)

    stats = DispatchReconciler.stats()
    assert stats.reconciled_count == 1
    assert stats.last_reconciled_at != nil
  end

  test "dispatch event without execution_id is ignored" do
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "surfaces:dispatch",
      {:dispatch_event, %{"type" => "dispatch.update", "status" => "completed"}}
    )

    Process.sleep(20)
    assert DispatchReconciler.stats().reconciled_count == 0
  end

  test "dispatch event with non-terminal status is ignored" do
    {:ok, proposal} =
      Store.propose(%{project: "ema", intent: "running-test", summary: "test"})

    {:ok, %{execution: execution}} = Store.run(proposal.id, %{adapter: "gateway"})

    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "surfaces:dispatch",
      {:dispatch_event,
       %{
         "type" => "dispatch.update",
         "execution_id" => execution.id,
         "status" => "running"
       }}
    )

    Process.sleep(20)
    assert DispatchReconciler.stats().reconciled_count == 0
  end
end
