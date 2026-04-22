defmodule Ema.ControlPlane.Command do
  @moduledoc """
  Operator command grammar for the control plane.

  Supports status queries, proposal/execution lifecycle, incident management,
  dispatch reconciliation, and help.
  """

  alias Ema.ControlPlane.{DispatchReconciler, Persistence, Store}
  alias Ema.ControlPlane.Incidents.Authority

  @help_text """
  Control-plane commands:
    status                     — global status overview
    status <project>           — project-scoped status
    context_for <project>      — bounded project context snapshot
    incidents                  — active incidents
    incidents all              — all incidents (including resolved)
    approve <proposal_id>      — approve a proposal for execution
    run <proposal_id>          — execute an approved proposal
    complete <execution_id>    — mark execution succeeded
    fail <execution_id>        — mark execution failed
    ack <incident_id>          — acknowledge incident
    restart <incident_id>      — request restart for incident
    cancel <incident_id>       — cancel incident
    kill <incident_id>         — request kill for incident
    snooze <incident_id> [ms]  — snooze incident (default 30m)
    dispatch <description>     — dispatch task via gateway
    reconcile                  — show dispatch reconciler stats
    sweep                      — trigger stale execution sweep
    db status                  — Ecto persistence summary
    db query <project>         — query persisted project data
    help                       — show this help
    propose <proj>|<intent>|<summary> — create proposal
  """

  def run(command) when is_binary(command) do
    tokens = String.split(command, ~r/\s+/, trim: true)

    case tokens do
      ["help"] ->
        {:ok, %{kind: "help", result: %{help: @help_text}}}

      ["status"] ->
        {:ok, %{kind: "status", result: Store.status()}}

      ["status", project] ->
        {:ok, %{kind: "status", result: Store.context_for(project)}}

      ["context_for", project] ->
        {:ok, %{kind: "context_for", result: Store.context_for(project)}}

      ["incidents"] ->
        {:ok, %{kind: "incidents", result: Authority.list(active: true)}}

      ["incidents", "all"] ->
        {:ok, %{kind: "incidents", result: Authority.list()}}

      ["approve", proposal_id] ->
        wrap(Store.approve(proposal_id, %{}), "approve")

      ["run", proposal_id] ->
        wrap(Store.run(proposal_id, %{}), "run")

      ["complete", execution_id] ->
        wrap(Store.complete(execution_id, %{status: "succeeded"}), "complete")

      ["fail", execution_id] ->
        wrap(Store.complete(execution_id, %{status: "failed"}), "fail")

      ["ack", incident_id] ->
        wrap(Authority.request_action(incident_id, :ack, %{}), "ack")

      ["restart", incident_id] ->
        wrap(Authority.request_action(incident_id, :restart, %{}), "restart")

      ["cancel", incident_id] ->
        wrap(Authority.request_action(incident_id, :cancel, %{}), "cancel")

      ["kill", incident_id] ->
        wrap(Authority.request_action(incident_id, :kill, %{}), "kill")

      ["snooze", incident_id] ->
        wrap(Authority.request_action(incident_id, :snooze, %{}), "snooze")

      ["snooze", incident_id, duration_ms] ->
        wrap(
          Authority.request_action(incident_id, :snooze, %{duration_ms: duration_ms}),
          "snooze"
        )

      ["dispatch" | rest] when rest != [] ->
        description = Enum.join(rest, " ")
        dispatch_via_gateway(description)

      ["reconcile"] ->
        {:ok, %{kind: "reconcile", result: DispatchReconciler.stats()}}

      ["sweep"] ->
        {:ok, %{kind: "sweep", result: Store.sweep_stale()}}

      ["db", "status"] ->
        db_status()

      ["db", "query", project] ->
        db_query(project)

      _ ->
        parse_structured(command)
    end
  end

  defp parse_structured(command) do
    cond do
      String.starts_with?(command, "propose ") ->
        body = String.trim_leading(command, "propose ")

        case String.split(body, "|", parts: 3) do
          [project, intent, summary] ->
            wrap(
              Store.propose(%{
                project: String.trim(project),
                intent: String.trim(intent),
                summary: String.trim(summary)
              }),
              "propose"
            )

          _ ->
            {:error, :invalid_propose_syntax}
        end

      true ->
        {:error, :unknown_command}
    end
  end

  defp dispatch_via_gateway(description) do
    case Ema.Surfaces.GatewayClient.dispatch_task(%{
           description: description,
           agent: "coder",
           priority: 2,
           timeout_minutes: 30,
           tags: ["control-plane", "operator-dispatch"]
         }) do
      {:ok, result} -> {:ok, %{kind: "dispatch", result: result}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp db_status do
    try do
      proposals = Persistence.list_proposals(limit: 0) |> length()
      executions = Persistence.list_executions(limit: 0) |> length()

      {:ok,
       %{
         kind: "db_status",
         result: %{
           adapter: "sqlite3",
           proposals: proposals,
           executions: executions,
           status: "available"
         }
       }}
    rescue
      _ -> {:ok, %{kind: "db_status", result: %{status: "unavailable"}}}
    end
  end

  defp db_query(project) do
    try do
      {:ok, %{kind: "db_query", result: Persistence.project_summary(project)}}
    rescue
      _ -> {:ok, %{kind: "db_query", result: %{status: "unavailable", project: project}}}
    end
  end

  defp wrap({:ok, result}, kind), do: {:ok, %{kind: kind, result: result}}
  defp wrap({:error, reason}, _kind), do: {:error, reason}
end
