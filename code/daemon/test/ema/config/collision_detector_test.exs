defmodule Ema.Config.CollisionDetectorTest do
  use ExUnit.Case

  alias Ema.Config.{CollisionDetector, Resource}

  test "no collisions when all resources are unique" do
    resources = [
      %Resource{id: "a", type: :skill, name: "foo", scope: :user, source_path: "/a"},
      %Resource{id: "b", type: :skill, name: "bar", scope: :user, source_path: "/b"}
    ]
    assert CollisionDetector.detect(resources) == []
  end

  test "detects collision when same name+type in different scopes" do
    resources = [
      %Resource{id: "a", type: :skill, name: "foo", scope: :user, source_path: "/a"},
      %Resource{id: "b", type: :skill, name: "foo", scope: :project, source_path: "/b"}
    ]
    collisions = CollisionDetector.detect(resources)
    assert length(collisions) == 1
    {:collision, :skill, "foo", conflicting} = hd(collisions)
    assert length(conflicting) == 2
  end

  test "same name+type same scope is not a collision" do
    resources = [
      %Resource{id: "a", type: :skill, name: "foo", scope: :user, source_path: "/a"},
      %Resource{id: "b", type: :skill, name: "foo", scope: :user, source_path: "/b"}
    ]
    assert CollisionDetector.detect(resources) == []
  end
end
