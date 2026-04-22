defmodule Ema.Discord.IncidentCommandsTest do
  use ExUnit.Case, async: false

  alias Ema.ControlPlane.Incidents.Authority
  alias Ema.Discord.IncidentCommands

  setup do
    :sys.replace_state(Authority, fn _ -> %{incidents: %{}, events: [], executions: %{}} end)
    :ok
  end

  test "incidents command returns active incidents list" do
    assert {:ok, {:list, incidents}} = IncidentCommands.maybe_handle("incidents")
    assert incidents == []
  end
end
