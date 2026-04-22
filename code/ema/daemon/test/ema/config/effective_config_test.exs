defmodule Ema.Config.EffectiveConfigTest do
  use ExUnit.Case

  alias Ema.Config.{EffectiveConfig, Resource}

  test "user scope wins over project scope" do
    resources = [
      %Resource{id: "a", type: :skill, name: "foo", scope: :project, source_path: "/a"},
      %Resource{id: "b", type: :skill, name: "foo", scope: :user, source_path: "/b"}
    ]
    result = EffectiveConfig.merge(resources)
    winners = Map.get(result, :skill, [])
    assert length(winners) == 1
    assert hd(winners).scope == :user
  end

  test "plugin scope loses to all others" do
    resources = [
      %Resource{id: "a", type: :agent, name: "bar", scope: :plugin, source_path: "/a"},
      %Resource{id: "b", type: :agent, name: "bar", scope: :agent, source_path: "/b"}
    ]
    result = EffectiveConfig.merge(resources)
    winners = Map.get(result, :agent, [])
    assert hd(winners).scope == :agent
  end
end
