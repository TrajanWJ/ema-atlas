defmodule Ema.ControlPlane.Incidents.Executor do
  @moduledoc "Executes incident-authority recovery actions through session ownership."

  alias Ema.Sessions.Supervisor

  def execute(execution_id, action, attrs \\ %{}) do
    Supervisor.request_action(execution_id, action, attrs)
  end
end
