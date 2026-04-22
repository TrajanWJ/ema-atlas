defmodule Ema.Campaigns.FlowTest do
  use ExUnit.Case, async: true

  alias Ema.Campaigns.Flow

  describe "new/1" do
    test "creates a flow in :forming state with defaults" do
      flow = Flow.new()
      assert flow.status == :forming
      assert is_binary(flow.id)
      assert flow.proposals == []
      assert flow.discoveries == []
      assert flow.metadata == %{}
      assert %DateTime{} = flow.updated_at
      assert flow.started_at == nil
      assert flow.completed_at == nil
    end

    test "accepts custom attributes" do
      flow = Flow.new(%{id: "custom-id", metadata: %{source: "test"}})
      assert flow.id == "custom-id"
      assert flow.metadata == %{source: "test"}
      assert flow.status == :forming
    end
  end

  describe "valid_transition?/2" do
    test "allows forming -> ready" do
      assert Flow.valid_transition?(:forming, :ready)
    end

    test "allows forming -> cancelled" do
      assert Flow.valid_transition?(:forming, :cancelled)
    end

    test "allows ready -> running" do
      assert Flow.valid_transition?(:ready, :running)
    end

    test "allows running -> completed" do
      assert Flow.valid_transition?(:running, :completed)
    end

    test "allows running -> failed" do
      assert Flow.valid_transition?(:running, :failed)
    end

    test "allows running -> cancelled" do
      assert Flow.valid_transition?(:running, :cancelled)
    end

    test "rejects forming -> running (must go through ready)" do
      refute Flow.valid_transition?(:forming, :running)
    end

    test "rejects forming -> completed" do
      refute Flow.valid_transition?(:forming, :completed)
    end

    test "rejects ready -> completed (must go through running)" do
      refute Flow.valid_transition?(:ready, :completed)
    end

    test "rejects transitions from terminal states" do
      refute Flow.valid_transition?(:completed, :running)
      refute Flow.valid_transition?(:failed, :running)
      refute Flow.valid_transition?(:cancelled, :running)
    end
  end

  describe "transition/2" do
    test "forming -> ready succeeds with proposals" do
      flow = Flow.new() |> with_proposal()
      assert {:ok, %Flow{status: :ready}} = Flow.transition(flow, :ready)
    end

    test "forming -> ready fails without proposals" do
      flow = Flow.new()
      assert {:error, msg} = Flow.transition(flow, :ready)
      assert msg =~ "without at least one proposal"
    end

    test "ready -> running sets started_at" do
      {:ok, ready} = Flow.new() |> with_proposal() |> Flow.transition(:ready)
      assert {:ok, running} = Flow.transition(ready, :running)
      assert running.status == :running
      assert %DateTime{} = running.started_at
    end

    test "running -> completed sets completed_at" do
      running = flow_in_state(:running)
      assert {:ok, completed} = Flow.transition(running, :completed)
      assert completed.status == :completed
      assert %DateTime{} = completed.completed_at
    end

    test "running -> failed sets completed_at" do
      running = flow_in_state(:running)
      assert {:ok, failed} = Flow.transition(running, :failed)
      assert failed.status == :failed
      assert %DateTime{} = failed.completed_at
    end

    test "any -> cancelled sets completed_at" do
      for state <- [:forming, :ready, :running] do
        flow = flow_in_state(state)
        assert {:ok, cancelled} = Flow.transition(flow, :cancelled)
        assert cancelled.status == :cancelled
        assert %DateTime{} = cancelled.completed_at
      end
    end

    test "rejects invalid transitions" do
      flow = Flow.new()
      assert {:error, msg} = Flow.transition(flow, :completed)
      assert msg =~ "invalid transition"
    end

    test "rejects transitions from terminal states" do
      running = flow_in_state(:running)
      {:ok, completed} = Flow.transition(running, :completed)
      assert {:error, msg} = Flow.transition(completed, :running)
      assert msg =~ "terminal state"
    end
  end

  describe "add_proposal/2" do
    test "adds a proposal to the flow" do
      flow = Flow.new()
      proposal = %{id: "p1", status: :draft, result: nil}
      assert {:ok, updated} = Flow.add_proposal(flow, proposal)
      assert length(updated.proposals) == 1
      assert hd(updated.proposals).id == "p1"
    end

    test "rejects proposals without an id" do
      flow = Flow.new()
      assert {:error, msg} = Flow.add_proposal(flow, %{status: :draft})
      assert msg =~ ":id key"
    end

    test "rejects adding to terminal state" do
      running = flow_in_state(:running)
      {:ok, completed} = Flow.transition(running, :completed)
      assert {:error, _} = Flow.add_proposal(completed, %{id: "p1"})
    end
  end

  describe "remove_proposal/2" do
    test "removes a proposal by id" do
      flow = Flow.new()
      {:ok, flow} = Flow.add_proposal(flow, %{id: "p1", status: :draft, result: nil})
      {:ok, flow} = Flow.add_proposal(flow, %{id: "p2", status: :draft, result: nil})
      assert {:ok, updated} = Flow.remove_proposal(flow, "p1")
      assert length(updated.proposals) == 1
      assert hd(updated.proposals).id == "p2"
    end

    test "returns error for unknown proposal id" do
      flow = Flow.new()
      assert {:error, msg} = Flow.remove_proposal(flow, "nonexistent")
      assert msg =~ "not found"
    end

    test "rejects removal from terminal state" do
      running = flow_in_state(:running)
      {:ok, failed} = Flow.transition(running, :failed)
      assert {:error, _} = Flow.remove_proposal(failed, "p1")
    end
  end

  describe "add_discovery/2" do
    test "adds a discovery to the flow" do
      flow = Flow.new()
      discovery = %{source: "search", data: %{found: true}}
      assert {:ok, updated} = Flow.add_discovery(flow, discovery)
      assert length(updated.discoveries) == 1
    end

    test "rejects adding to terminal state" do
      running = flow_in_state(:running)
      {:ok, completed} = Flow.transition(running, :completed)
      assert {:error, _} = Flow.add_discovery(completed, %{data: "x"})
    end
  end

  describe "summary/1" do
    test "returns a JSON-serializable map" do
      flow = Flow.new(%{id: "sum-1", metadata: %{tag: "test"}})
      {:ok, flow} = Flow.add_proposal(flow, %{id: "p1"})
      {:ok, flow} = Flow.add_discovery(flow, %{data: "d1"})

      s = Flow.summary(flow)

      assert s.id == "sum-1"
      assert s.status == :forming
      assert s.proposal_count == 1
      assert s.discovery_count == 1
      assert is_binary(s.updated_at)
      assert s.started_at == nil
      assert s.completed_at == nil
      assert s.metadata == %{tag: "test"}
    end

    test "summary round-trips through Jason" do
      flow = Flow.new(%{id: "json-1"})
      s = Flow.summary(flow)
      assert {:ok, _json} = Jason.encode(s)
    end
  end

  # -- Helpers --

  defp with_proposal(%Flow{} = flow) do
    {:ok, flow} = Flow.add_proposal(flow, %{id: "default-proposal", status: :draft, result: nil})
    flow
  end

  defp flow_in_state(:forming), do: Flow.new()

  defp flow_in_state(:ready) do
    {:ok, flow} = Flow.new() |> with_proposal() |> Flow.transition(:ready)
    flow
  end

  defp flow_in_state(:running) do
    {:ok, flow} = flow_in_state(:ready) |> Flow.transition(:running)
    flow
  end
end
