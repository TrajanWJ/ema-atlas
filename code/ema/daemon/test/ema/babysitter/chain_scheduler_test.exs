defmodule Ema.Babysitter.ChainSchedulerTest do
  use ExUnit.Case, async: false

  alias Ema.Babysitter.ChainScheduler

  setup do
    for id <- ["operator-rollup", "hermes-watch", "attention-sentry", "custom-chain"] do
      case ChainScheduler.stop_chain(id) do
        {:ok, _} -> :ok
        _ -> :ok
      end
    end

    :ok
  end

  test "start_chain creates a running autonomous chain with next tick" do
    {:ok, chain} = ChainScheduler.start_chain("operator-rollup", %{})

    assert chain.id == "operator-rollup"
    assert chain.status == :running
    assert chain.autonomous_enabled == true
    assert chain.cadence_bucket == :fast
    assert %DateTime{} = chain.next_tick_at
  end

  test "set_tick_hint updates requested next tick and preserves running state" do
    {:ok, _chain} = ChainScheduler.start_chain("custom-chain", %{"profile" => "operator-rollup"})
    {:ok, updated} = ChainScheduler.set_tick_hint("custom-chain", %{"next_tick_hint_ms" => 600_000})

    assert updated.status == :running
    assert %DateTime{} = updated.requested_next_tick_at
    assert %DateTime{} = updated.next_tick_at
  end

  test "pause and resume chain lifecycle works" do
    {:ok, _chain} = ChainScheduler.start_chain("custom-chain", %{"profile" => "operator-rollup"})
    {:ok, paused} = ChainScheduler.pause_chain("custom-chain")
    assert paused.status == :paused
    refute paused.autonomous_enabled

    {:ok, resumed} = ChainScheduler.resume_chain("custom-chain")
    assert resumed.status == :running
    assert resumed.autonomous_enabled
    assert %DateTime{} = resumed.next_tick_at
  end

  test "snapshot exposes Hermes awareness and active chains" do
    {:ok, _chain} = ChainScheduler.start_chain("operator-rollup", %{})
    snapshot = ChainScheduler.snapshot()

    assert is_integer(snapshot.active_count)
    assert is_list(snapshot.chains)
    assert is_map(snapshot.hermes_status)
    assert snapshot.profiles["operator-rollup"].executor == :local
  end
end
