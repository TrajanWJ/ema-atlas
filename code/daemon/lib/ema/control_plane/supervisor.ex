defmodule Ema.ControlPlane.Supervisor do
  @moduledoc "Supervises the minimal control-plane runtime."

  use Supervisor

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    children = [
      Ema.ControlPlane.Store,
      Ema.ControlPlane.EventLog,
      Ema.ControlPlane.Incidents.Authority,
      Ema.ControlPlane.ExecutionSupervisor,
      Ema.ControlPlane.DispatchReconciler
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
