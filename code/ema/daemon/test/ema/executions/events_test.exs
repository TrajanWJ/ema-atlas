defmodule Ema.Executions.EventsTest do
  use EmaWeb.ConnCase, async: false

  alias Ema.Executions.Events

  setup do
    File.rm(Path.expand("../../../priv/executions_events.jsonl", __DIR__))
    :ok
  end

  test "emit broadcasts canonical execution envelope and appends durable ledger", %{conn: _conn} do
    Phoenix.PubSub.subscribe(Ema.PubSub, Events.topic())

    event =
      Events.emit("exec-123", :execution_started, %{
        status: :running,
        phase: :implementation,
        summary_line: "Execution started",
        payload: %{foo: "bar"}
      })

    assert event.execution_id == "exec-123"
    assert event.type == "execution_started"
    assert event.status == "running"
    assert event.phase == "implementation"
    assert event.summary_line == "Execution started"
    assert event.payload == %{foo: "bar"}
    assert is_binary(event.event_id)
    assert is_integer(event.sequence)
    assert is_binary(event.occurred_at)

    assert_receive {:execution_event, received}
    assert received.execution_id == "exec-123"
    assert received.type == "execution_started"
    assert received.status == "running"

    ledger = Path.expand("../../../priv/executions_events.jsonl", __DIR__)
    assert {:ok, body} = File.read(ledger)
    assert body =~ "\"execution_id\":\"exec-123\""
    assert body =~ "\"type\":\"execution_started\""
  end
end
