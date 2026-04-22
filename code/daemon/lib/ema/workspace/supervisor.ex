defmodule Ema.Workspace.Supervisor do
  @moduledoc "Workspace overlay supervision tree."

  use Supervisor

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    Supervisor.init(
      [
        Ema.Workspace.IndexStore
      ],
      strategy: :one_for_one
    )
  end
end
