defmodule Ema.Config.RegistryTest do
  use ExUnit.Case, async: false

  alias Ema.Config.{Registry, Resource}

  setup do
    Registry.clear()
    :ok
  end

  defp sample_resource(overrides \\ []) do
    defaults = %Resource{
      id: "test:user:example",
      type: :skill,
      name: "example",
      scope: :user,
      source_path: "/tmp/example.yaml"
    }
    struct(defaults, overrides)
  end

  test "register and lookup" do
    r = sample_resource()
    assert :ok = Registry.register(r)
    assert {:ok, found} = Registry.lookup(r.id)
    assert found.name == "example"
  end

  test "unregister removes resource" do
    r = sample_resource()
    Registry.register(r)
    Registry.unregister(r.id)
    assert {:error, :not_found} = Registry.lookup(r.id)
  end

  test "list_by_type filters correctly" do
    Registry.register(sample_resource(id: "a", type: :skill))
    Registry.register(sample_resource(id: "b", type: :agent))
    skills = Registry.list_by_type(:skill)
    assert length(skills) == 1
    assert hd(skills).type == :skill
  end

  test "list_by_scope filters correctly" do
    Registry.register(sample_resource(id: "a", scope: :user))
    Registry.register(sample_resource(id: "b", scope: :project))
    user_resources = Registry.list_by_scope(:user)
    assert length(user_resources) == 1
  end
end
