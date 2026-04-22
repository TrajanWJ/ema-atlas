defmodule Ema.Sessions.Supervisor do
  @moduledoc "Session runtime supervisor + execution fact ownership API."

  use Supervisor

  alias Ema.Sessions.Registry

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def register_session(id, type, attrs \\ %{}), do: Registry.register_session(id, type, attrs)
  def record_progress(id, attrs \\ %{}), do: Registry.record_progress(id, attrs)
  def mark_terminal(id, status, attrs \\ %{}), do: Registry.mark_terminal(id, status, attrs)

  def request_action(execution_id, action, attrs \\ %{}),
    do: Registry.request_action(execution_id, action, attrs)

  def list_sessions, do: Registry.list_sessions()
  def status(execution_id), do: Registry.status(execution_id)

  @impl true
  def init(_opts) do
    Supervisor.init(
      [
        Registry
      ],
      strategy: :one_for_one
    )
  end
end
