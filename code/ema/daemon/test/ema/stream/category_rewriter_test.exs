defmodule Ema.Stream.CategoryRewriterTest do
  use ExUnit.Case, async: true

  alias Ema.Stream.CategoryRewriter

  test "default channel specs align with the current Discord stream directory" do
    spec_names =
      CategoryRewriter.channel_specs()
      |> Enum.map(& &1.name)

    assert "babysitter-sprint" in spec_names
    assert "babysitter-live" in spec_names
    refute "alerts" in spec_names
  end

  test "rewrite supports explicit category and channel spec overrides" do
    custom_specs = [
      %{name: "babysitter-live", topic: "Current operator lane.", position: 0},
      %{name: "execution-log", topic: "Evidence.", position: 1}
    ]

    assert {:ok, result} =
             CategoryRewriter.rewrite(
               dry_run: true,
               category_name: "🧵 CURRENT STREAM",
               channel_specs: custom_specs
             )

    assert result.dry_run == true
    assert get_in(result, [:category, :name]) == "🧵 CURRENT STREAM"

    action_names = Enum.map(result.actions, fn action -> action.spec.name end)
    assert action_names == ["babysitter-live", "execution-log"]
  end
end
