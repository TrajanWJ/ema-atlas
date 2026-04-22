defmodule EmaWeb.ControlPlaneChannelTest do
  use EmaWeb.ChannelCase, async: false

  alias Ema.ControlPlane.Store
  alias Ema.ControlPlane.Incidents.Authority

  setup do
    File.rm(Path.expand("../../../priv/control_plane_state.json", __DIR__))
    File.rm(Path.expand("../../../priv/control_plane_incidents.json", __DIR__))

    :sys.replace_state(Store, fn _ ->
      %{proposals: %{}, executions: %{}, outcomes: %{}, projects: %{}}
    end)

    :sys.replace_state(Authority, fn _ ->
      %{incidents: %{}, events: [], executions: %{}}
    end)

    {:ok, socket} = connect(EmaWeb.UserSocket, %{})
    {:ok, _reply, socket} = subscribe_and_join(socket, "control-plane:live", %{})
    {:ok, socket: socket}
  end

  test "join sends initial snapshot", %{socket: _socket} do
    assert_push "snapshot", snapshot, 1_000
    assert Map.has_key?(snapshot, :status)
    assert Map.has_key?(snapshot, :incidents)
    assert Map.has_key?(snapshot, :recent_events)
  end

  test "command message returns result", %{socket: socket} do
    ref = push(socket, "command", %{"command" => "status"})
    assert_reply ref, :ok, %{kind: "status"}
  end

  test "command help returns help text", %{socket: socket} do
    ref = push(socket, "command", %{"command" => "help"})
    assert_reply ref, :ok, %{kind: "help"}
  end

  test "status message returns store status", %{socket: socket} do
    ref = push(socket, "status", %{})
    assert_reply ref, :ok, status
    assert Map.has_key?(status, :projects)
  end

  test "incidents message returns active incidents", %{socket: socket} do
    ref = push(socket, "incidents", %{})
    assert_reply ref, :ok, %{incidents: incidents}
    assert is_list(incidents)
  end

  test "execution events are pushed to channel", %{socket: _socket} do
    # Wait for after_join to subscribe
    Process.sleep(50)

    Ema.Executions.Events.emit("test-channel-exec", :execution_started, %{
      status: :running,
      phase: :dispatch,
      summary_line: "channel test execution",
      payload: %{}
    })

    assert_push "execution_event", event, 1_000
    assert event[:execution_id] == "test-channel-exec" or event["execution_id"] == "test-channel-exec"
  end
end
