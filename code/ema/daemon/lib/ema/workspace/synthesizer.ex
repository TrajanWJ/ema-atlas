defmodule Ema.Workspace.Synthesizer do
  @moduledoc "Builds actor-scoped workspace packets from workspace overlay + runtime sessions."

  alias Ema.Workspace.IndexStore
  alias Ema.Sessions.Supervisor, as: SessionsSupervisor

  def actor_packet(actor_id, _opts \\ []) do
    snapshot = IndexStore.refresh()

    actor =
      Enum.find(snapshot.actors, fn item ->
        actor_field(item) == actor_id
      end) || %{"actor_id" => actor_id}

    handoffs =
      Enum.filter(snapshot.handoffs, fn item ->
        Map.get(item, "to") == actor_id
      end)

    schedules =
      snapshot.schedules
      |> Enum.filter(fn item -> Map.get(item, "actor") == actor_id end)
      |> Enum.sort_by(fn item -> get_in(item, ["scheduled_window", "start"]) || "" end)

    session_breadcrumbs =
      Enum.filter(snapshot.sessions, fn item ->
        Map.get(item, "actor_id") == actor_id or Map.get(item, "actor") == actor_id
      end)

    runtime_sessions = runtime_sessions(actor_id)

    %{
      actor: %{
        actor_id: actor_field(actor),
        harness: Map.get(actor, "harness"),
        role: Map.get(actor, "role"),
        status: Map.get(actor, "status")
      },
      current_focus: %{
        assignment: Map.get(actor, "assignment"),
        role: Map.get(actor, "role")
      },
      handoffs: %{
        inbox: Enum.map(handoffs, &trim_item/1)
      },
      agenda: %{
        items: Enum.map(schedules, &trim_item/1)
      },
      sessions: %{
        breadcrumbs: Enum.map(session_breadcrumbs, &trim_item/1),
        runtime: runtime_sessions
      },
      workspace_refs: %{
        root: snapshot.root
      },
      recommended_next_action: recommended_next_action(actor, handoffs, schedules, session_breadcrumbs, runtime_sessions)
    }
  end

  defp runtime_sessions(actor_id) do
    SessionsSupervisor.list_sessions()
    |> Enum.filter(fn session ->
      session_actor =
        get_in(session, [:surface_bindings, "actor_id"]) ||
          get_in(session, [:surface_bindings, :actor_id]) ||
          get_in(session, [:surface_bindings, "actor"]) ||
          get_in(session, [:surface_bindings, :actor])

      session_actor == actor_id
    end)
    |> Enum.map(fn session ->
      %{
        execution_id: Map.get(session, :execution_id),
        session_id: Map.get(session, :session_id),
        type: Map.get(session, :type),
        status: Map.get(session, :status)
      }
    end)
  rescue
    _ -> []
  end

  defp recommended_next_action(actor, handoffs, schedules, breadcrumbs, runtime_sessions) do
    cond do
      runtime_sessions != [] ->
        %{kind: "resume_runtime_session", summary: "Resume the active runtime session for this actor"}

      breadcrumbs != [] ->
        %{kind: "resume_breadcrumb_session", summary: "Resume the most recent session breadcrumb for this actor"}

      handoffs != [] ->
        %{kind: "review_handoff", summary: "Review the newest handoff addressed to this actor"}

      schedules != [] ->
        %{kind: "follow_schedule", summary: "Start the next scheduled block for this actor"}

      Map.get(actor, "assignment") not in [nil, ""] ->
        %{kind: "continue_assignment", summary: "Continue the current assignment recorded in the actor file"}

      true ->
        %{kind: "idle", summary: "No active work packet found for this actor"}
    end
  end

  defp actor_field(item), do: Map.get(item, "actor_id") || Map.get(item, "actor")

  defp trim_item(item) do
    item
    |> Map.drop(["body"])
  end
end
