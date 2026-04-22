defmodule Ema.Config.EffectiveConfig do
  @moduledoc "Merges resources with scope priority: user > project > agent > plugin"

  alias Ema.Config.{Resource, Registry, Scanner}

  @scope_priority %{user: 0, project: 1, agent: 2, plugin: 3}

  @spec merge([Resource.t()]) :: %{atom() => [Resource.t()]}
  def merge(resources) do
    resources
    |> Enum.group_by(fn r -> {r.type, r.name} end)
    |> Enum.map(fn {{type, _name}, group} ->
      winner =
        group
        |> Enum.sort_by(fn r -> Map.get(@scope_priority, r.scope, 99) end)
        |> List.first()

      {type, winner}
    end)
    |> Enum.group_by(fn {type, _} -> type end, fn {_, r} -> r end)
  end

  @spec compute() :: {:ok, %{atom() => [Resource.t()]}} | {:error, term()}
  def compute do
    with {:ok, resources} <- Scanner.scan() do
      Enum.each(resources, &Registry.register/1)
      {:ok, merge(resources)}
    end
  end
end
