defmodule Ema.Discord.IncidentsView do
  @moduledoc "Render active incidents for Discord/operator surfaces."

  def render_list([]), do: "No active incidents."

  def render_list(incidents) when is_list(incidents) do
    header = "**Active incidents**\n"

    body =
      incidents
      |> Enum.map(&render_incident/1)
      |> Enum.join("\n")

    header <> body
  end

  def render_incident(incident) do
    id = incident[:incident_id] || incident["incident_id"]
    kind = incident[:kind] || incident["kind"]
    status = incident[:status] || incident["status"]
    severity = incident[:severity] || incident["severity"]
    exec_id = incident[:execution_id] || incident["execution_id"]
    evidence = incident[:evidence_summary] || incident["evidence_summary"] || ""

    "- `#{id}` #{kind}/#{status}/#{severity} on `#{exec_id}` — #{String.slice(evidence, 0, 180)}"
  end

  def render_action(action, incident) do
    id = incident[:incident_id] || incident["incident_id"]
    status = incident[:status] || incident["status"]
    "[ACK] #{action} applied to #{id} -> #{status}"
  end
end
