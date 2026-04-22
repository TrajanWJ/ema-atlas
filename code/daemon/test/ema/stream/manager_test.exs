defmodule Ema.Stream.ManagerTest do
  use ExUnit.Case, async: false

  alias Ema.Sessions.Monitor
  alias Ema.Stream.Manager

  setup_all do
    Application.ensure_all_started(:ema)
    :ok
  end

  setup do
    reset_monitor()
    reset_manager()
    :ok
  end

  test "session activity becomes recent intent and survives scheduled queue drain" do
    Monitor.record_activity("trajan-coder", %{
      source: "agent_thought",
      body: "rebuild StreamTicker content",
      last_tool: "mix test"
    })

    assert_eventually(fn ->
      snapshot = Manager.snapshot()
      snapshot.pending_intents == ["trajan-coder → rebuild StreamTicker content"]
    end)

    snapshot = Manager.snapshot()
    assert [%{summary: "trajan-coder → rebuild StreamTicker content"}] = snapshot.recent_intents

    Manager.tick_now()
    Manager.tick_now()
    Manager.tick_now()

    assert_eventually(fn ->
      snapshot = Manager.snapshot()
      snapshot.tick_count >= 3 and snapshot.pending_intents == []
    end)

    snapshot = Manager.snapshot()
    assert [%{summary: "trajan-coder → rebuild StreamTicker content"}] = snapshot.recent_intents
    assert Map.has_key?(snapshot.last_emissions, :intent_stream)
  end

  defp reset_monitor do
    :sys.replace_state(Monitor, fn _state -> %{recent: []} end)
  end

  defp reset_manager do
    :sys.replace_state(Manager, fn state ->
      %{
        state
        | tick_count: 0,
          pending_transitions: [],
          pending_intents: [],
          recent_intents: [],
          pending_thoughts: %{},
          pending_memory_writes: [],
          incidents: [],
          consecutive_degraded: 0,
          degrade_started_at: nil,
          last_known_status: :ok,
          digest_events: [],
          last_digest_at: nil,
          digest_has_content: false,
          last_emissions: %{}
      }
    end)
  end

  defp assert_eventually(fun, attempts \\ 30)

  defp assert_eventually(fun, attempts) when attempts > 0 do
    if fun.() do
      assert true
    else
      Process.sleep(25)
      assert_eventually(fun, attempts - 1)
    end
  end

  defp assert_eventually(_fun, 0) do
    flunk("condition not met in time")
  end
end
