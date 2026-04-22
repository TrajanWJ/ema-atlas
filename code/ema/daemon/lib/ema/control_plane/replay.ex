defmodule Ema.ControlPlane.Replay do
  @moduledoc """
  Consumer-facing replay helpers for HQ / dispatch-board style surfaces.

  Reuses the canonical execution event log plus host-truth projections and adds a
  small board-oriented aggregation layer so consumers can bootstrap from one
  endpoint without inventing their own stitching logic.
  """

  alias Ema.ControlPlane.{EventLog, HostTransitionLog, Incidents.Authority}
  alias Ema.Surfaces.HostTruth

  @ledger_file Path.expand("../../../priv/executions_events.jsonl", __DIR__)

  def dispatch_board(opts \\ []) do
    limit = Keyword.get(opts, :limit, 25)
    project = Keyword.get(opts, :project)
    intent = Keyword.get(opts, :intent)
    execution_id = Keyword.get(opts, :execution_id)

    execution_events =
      execution_events(limit * 4)
      |> filter_execution_events(project, intent, execution_id)
      |> Enum.take(limit)

    transitions = HostTransitionLog.recent(limit)

    %{
      generated_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      filters: %{project: project, intent: intent, execution_id: execution_id, limit: limit},
      summary: %{
        execution_event_count: length(execution_events),
        active_incident_count: length(Authority.list(active: true)),
        host_transition_count: length(transitions)
      },
      board: %{
        host_truth: HostTruth.operator_detail(),
        host_transitions: transitions,
        execution_stream: execution_events,
        execution_cards: execution_cards(execution_events)
      }
    }
  end

  defp execution_events(limit) do
    live = EventLog.recent(limit)

    if length(live) >= limit do
      live
    else
      ledger = ledger_events(limit * 3)

      (live ++ ledger)
      |> Enum.uniq_by(&event_identity/1)
      |> Enum.sort_by(&parse_dt(Map.get(&1, :occurred_at) || Map.get(&1, "occurred_at")), {:desc, DateTime})
      |> Enum.take(limit)
    end
  end

  defp filter_execution_events(events, project, intent, execution_id) do
    Enum.filter(events, fn event ->
      payload = Map.get(event, :payload) || Map.get(event, "payload") || %{}

      event_execution_id = Map.get(event, :execution_id) || Map.get(event, "execution_id")
      event_project = Map.get(payload, :project) || Map.get(payload, "project")
      event_intent = Map.get(payload, :intent) || Map.get(payload, "intent")

      matches_execution? = is_nil(execution_id) or event_execution_id == execution_id
      matches_project? = is_nil(project) or event_project == project
      matches_intent? = is_nil(intent) or event_intent == intent

      matches_execution? and matches_project? and matches_intent?
    end)
  end

  defp execution_cards(events) do
    events
    |> Enum.group_by(fn event -> Map.get(event, :execution_id) || Map.get(event, "execution_id") end)
    |> Enum.map(fn {execution_id, grouped} ->
      ordered = Enum.sort_by(grouped, &parse_dt(Map.get(&1, :occurred_at) || Map.get(&1, "occurred_at")), {:desc, DateTime})
      latest = hd(ordered)
      payload = Map.get(latest, :payload) || Map.get(latest, "payload") || %{}

      %{
        execution_id: execution_id,
        status: Map.get(latest, :status) || Map.get(latest, "status"),
        type: Map.get(latest, :type) || Map.get(latest, "type"),
        phase: Map.get(latest, :phase) || Map.get(latest, "phase"),
        summary_line: Map.get(latest, :summary_line) || Map.get(latest, "summary_line"),
        occurred_at: Map.get(latest, :occurred_at) || Map.get(latest, "occurred_at"),
        proposal_id: Map.get(payload, :proposal_id) || Map.get(payload, "proposal_id"),
        project: Map.get(payload, :project) || Map.get(payload, "project"),
        intent: Map.get(payload, :intent) || Map.get(payload, "intent"),
        event_count: length(grouped)
      }
    end)
    |> Enum.sort_by(&parse_dt(&1.occurred_at), {:desc, DateTime})
  end

  defp ledger_events(limit) do
    if File.exists?(@ledger_file) do
      @ledger_file
      |> File.read!()
      |> String.split("\n", trim: true)
      |> Enum.take(-limit)
      |> Enum.flat_map(fn line ->
        case Jason.decode(line) do
          {:ok, event} -> [event]
          _ -> []
        end
      end)
      |> Enum.reverse()
    else
      []
    end
  end

  defp event_identity(event) do
    {
      Map.get(event, :event_id) || Map.get(event, "event_id"),
      Map.get(event, :execution_id) || Map.get(event, "execution_id"),
      Map.get(event, :sequence) || Map.get(event, "sequence")
    }
  end

  defp parse_dt(nil), do: ~U[1970-01-01 00:00:00Z]

  defp parse_dt(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, dt, _} -> dt
      _ -> ~U[1970-01-01 00:00:00Z]
    end
  end
end
