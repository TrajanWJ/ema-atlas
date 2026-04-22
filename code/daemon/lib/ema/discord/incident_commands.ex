defmodule Ema.Discord.IncidentCommands do
  @moduledoc "Parse operator incident commands from Discord messages."

  alias Ema.ControlPlane.Incidents.Authority

  def maybe_handle(content, actor \\ "operator") when is_binary(content) do
    tokens = String.split(String.trim(content), ~r/\s+/, trim: true)

    case tokens do
      ["incidents"] ->
        {:ok, {:list, Authority.list(active: true)}}

      ["incidents", "all"] ->
        {:ok, {:list, Authority.list()}}

      ["ack", incident_id] ->
        do_action(incident_id, :ack, actor, %{})

      ["restart", incident_id] ->
        do_action(incident_id, :restart, actor, %{})

      ["kill", incident_id] ->
        do_action(incident_id, :kill, actor, %{})

      ["cancel", incident_id] ->
        do_action(incident_id, :cancel, actor, %{})

      ["snooze", incident_id, duration_ms] ->
        do_action(incident_id, :snooze, actor, %{duration_ms: duration_ms})

      _ ->
        :ignore
    end
  end

  defp do_action(incident_id, action, actor, attrs) do
    case Authority.request_action(incident_id, action, Map.put(attrs, :actor, actor)) do
      {:ok, incident} -> {:ok, {:action, action, incident}}
      {:error, reason} -> {:error, reason}
    end
  end
end
