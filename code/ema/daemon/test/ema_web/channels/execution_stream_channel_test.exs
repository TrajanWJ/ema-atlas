defmodule EmaWeb.ExecutionStreamChannelTest do
  use EmaWeb.ChannelCase, async: false

  alias Ema.Executions.Events
  alias EmaWeb.ExecutionStreamChannel

  test "joining execution stream returns recent events and pushes new execution events" do
    Events.emit("exec-join-seed", :execution_created, %{
      status: :queued,
      phase: :intake,
      summary_line: "seed event"
    })

    {:ok, join_reply, _socket} =
      socket(EmaWeb.UserSocket)
      |> subscribe_and_join(ExecutionStreamChannel, "execution-stream:all")

    assert join_reply.status == "joined"
    assert is_list(join_reply.events)

    Events.emit("exec-live", :execution_started, %{
      status: :running,
      phase: :implementation,
      summary_line: "live event"
    })

    assert_push "execution_event", pushed
    assert pushed.execution_id == "exec-live"
    assert pushed.type == "execution_started"
  end
end
