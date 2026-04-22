defmodule Ema.Config.CollisionDetector do
  @moduledoc "Detects name+type collisions across scopes"

  alias Ema.Config.Resource

  @spec detect([Resource.t()]) :: [{:collision, atom(), String.t(), [Resource.t()]}]
  def detect(resources) do
    resources
    |> Enum.group_by(fn r -> {r.type, r.name} end)
    |> Enum.filter(fn {_key, group} ->
      scopes = Enum.map(group, & &1.scope) |> Enum.uniq()
      length(scopes) > 1
    end)
    |> Enum.map(fn {{type, name}, conflicting} ->
      {:collision, type, name, conflicting}
    end)
  end
end
