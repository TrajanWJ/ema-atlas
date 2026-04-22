defmodule Ema.ControlPlane.Incidents.Event do
  @moduledoc "Append-only incident-domain event envelope."

  @enforce_keys [:event_id, :incident_id, :type, :recorded_at]
  defstruct [
    :event_id,
    :incident_id,
    :execution_id,
    :proposal_id,
    :type,
    :source,
    :recorded_at,
    payload: %{}
  ]

  def new(attrs) when is_map(attrs) do
    %__MODULE__{
      event_id: Map.get(attrs, :event_id) || Map.get(attrs, "event_id") || UUID.uuid4(),
      incident_id: Map.get(attrs, :incident_id) || Map.get(attrs, "incident_id"),
      execution_id: Map.get(attrs, :execution_id) || Map.get(attrs, "execution_id"),
      proposal_id: Map.get(attrs, :proposal_id) || Map.get(attrs, "proposal_id"),
      type: normalize_atom(Map.get(attrs, :type) || Map.get(attrs, "type")),
      source: normalize_atom(Map.get(attrs, :source) || Map.get(attrs, "source")),
      recorded_at:
        Map.get(attrs, :recorded_at) || Map.get(attrs, "recorded_at") || DateTime.utc_now(),
      payload: Map.get(attrs, :payload) || Map.get(attrs, "payload") || %{}
    }
  end

  def serialize(%__MODULE__{} = event) do
    %{
      event_id: event.event_id,
      incident_id: event.incident_id,
      execution_id: event.execution_id,
      proposal_id: event.proposal_id,
      type: atom_to_string(event.type),
      source: atom_to_string(event.source),
      recorded_at: DateTime.to_iso8601(event.recorded_at),
      payload: event.payload
    }
  end

  def hydrate(map) do
    %__MODULE__{
      event_id: map["event_id"],
      incident_id: map["incident_id"],
      execution_id: map["execution_id"],
      proposal_id: map["proposal_id"],
      type: normalize_atom(map["type"]),
      source: normalize_atom(map["source"]),
      recorded_at: parse_iso!(map["recorded_at"]),
      payload: map["payload"] || %{}
    }
  end

  defp normalize_atom(nil), do: nil
  defp normalize_atom(value) when is_atom(value), do: value
  defp normalize_atom(value) when is_binary(value), do: String.to_atom(value)

  defp atom_to_string(nil), do: nil
  defp atom_to_string(value) when is_atom(value), do: Atom.to_string(value)
  defp atom_to_string(value), do: value

  defp parse_iso!(value) do
    {:ok, dt, _} = DateTime.from_iso8601(value)
    dt
  end
end
