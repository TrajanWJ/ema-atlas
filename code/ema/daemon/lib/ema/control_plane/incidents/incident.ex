defmodule Ema.ControlPlane.Incidents.Incident do
  @moduledoc "Materialized current-state record for execution incidents."

  @enforce_keys [
    :incident_id,
    :execution_id,
    :kind,
    :status,
    :severity,
    :detected_at,
    :updated_at
  ]
  defstruct [
    :incident_id,
    :execution_id,
    :proposal_id,
    :kind,
    :status,
    :severity,
    :owner,
    :detected_at,
    :updated_at,
    :snoozed_until,
    :recommended_action,
    :evidence_summary,
    :last_event_id,
    metadata: %{}
  ]

  def serialize(%__MODULE__{} = incident) do
    %{
      incident_id: incident.incident_id,
      execution_id: incident.execution_id,
      proposal_id: incident.proposal_id,
      kind: Atom.to_string(incident.kind),
      status: Atom.to_string(incident.status),
      severity: Atom.to_string(incident.severity),
      owner: incident.owner,
      detected_at: DateTime.to_iso8601(incident.detected_at),
      updated_at: DateTime.to_iso8601(incident.updated_at),
      snoozed_until: maybe_iso(incident.snoozed_until),
      recommended_action: incident.recommended_action,
      evidence_summary: incident.evidence_summary,
      last_event_id: incident.last_event_id,
      metadata: incident.metadata
    }
  end

  def hydrate(map) do
    %__MODULE__{
      incident_id: map["incident_id"],
      execution_id: map["execution_id"],
      proposal_id: map["proposal_id"],
      kind: String.to_atom(map["kind"]),
      status: String.to_atom(map["status"]),
      severity: String.to_atom(map["severity"]),
      owner: map["owner"],
      detected_at: parse_iso!(map["detected_at"]),
      updated_at: parse_iso!(map["updated_at"]),
      snoozed_until: maybe_parse_iso(map["snoozed_until"]),
      recommended_action: map["recommended_action"],
      evidence_summary: map["evidence_summary"],
      last_event_id: map["last_event_id"],
      metadata: map["metadata"] || %{}
    }
  end

  defp maybe_iso(nil), do: nil
  defp maybe_iso(dt), do: DateTime.to_iso8601(dt)

  defp maybe_parse_iso(nil), do: nil
  defp maybe_parse_iso(value), do: parse_iso!(value)

  defp parse_iso!(value) do
    {:ok, dt, _} = DateTime.from_iso8601(value)
    dt
  end
end
