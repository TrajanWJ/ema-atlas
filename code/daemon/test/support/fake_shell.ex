defmodule Ema.Claude.FakeShell do
  @behaviour Ema.Claude.Shell

  def put_response(command, args, response) do
    Agent.update(agent(), &Map.put(&1, {command, args}, response))
  end

  def reset do
    Agent.update(agent(), fn _ -> %{} end)
  end

  @impl true
  def cmd(command, args, _opts \\ []) do
    Agent.get(agent(), fn responses -> Map.get(responses, {command, args}) end) ||
      raise "missing fake shell response for #{inspect({command, args})}"
  end

  defp agent do
    case Process.whereis(__MODULE__) do
      nil ->
        {:ok, _pid} = Agent.start_link(fn -> %{} end, name: __MODULE__)
        __MODULE__

      _pid ->
        __MODULE__
    end
  end
end
