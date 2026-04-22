defmodule Ema.Context.Injector do
  @moduledoc """
  Canonical bounded context package builder.

  This module promotes context assembly into a first-class service so MCP,
  CLI, OpenClaw, and future surfaces can consume shared project/operator
  packages instead of assembling large ad hoc prompt bundles independently.
  """

  alias Ema.ControlPlane.{Persistence, Store}
  alias Ema.Surfaces.HostSessionSync

  def project_package(project, opts \\ []) do
    budget = Keyword.get(opts, :budget, "medium")
    maybe_refresh_host_sessions(opts)
    state = Store.context_for(project)
    intents = Persistence.list_intents(project: project, limit: intent_limit(budget))
    project_state = Persistence.get_project_state_by_project(project)
    sessions = host_session_evidence(project, budget)

    %{
      summary: project_summary(project, state, project_state, intents),
      host_truth: %{
        project: project,
        counts: Map.get(state, :counts, %{}),
        repo_context: Map.get(state, :repo_context, %{})
      },
      wiki: %{
        linked_pages: wiki_pages(project_state)
      },
      project_state: serialize_project_state(project_state),
      intents: Enum.map(intents, &serialize_intent/1),
      tasks: [],
      proposals: bounded_working_set(state, :proposal),
      executions: Map.get(state, :open_executions, []),
      sessions: sessions,
      recent_host_sessions: sessions,
      host_sessions_refreshed_at: DateTime.utc_now(),
      operator_notes: [],
      sources: build_sources(project_state, intents)
    }
  end

  def operator_package(opts \\ []) do
    budget = Keyword.get(opts, :budget, "medium")
    limit_projects = Keyword.get(opts, :limit_projects, 5)
    maybe_refresh_host_sessions(opts)
    intents = Persistence.list_intents(limit: intent_limit(budget))

    projects =
      intents
      |> Enum.map(& &1.project)
      |> Enum.reject(&is_nil/1)
      |> Enum.uniq()
      |> Enum.take(limit_projects)

    recent_sessions = recent_host_sessions(intent_limit(budget))

    %{
      summary: operator_summary(projects, intents),
      active_projects: projects,
      top_intents: Enum.map(Enum.take(intents, intent_limit(budget)), &serialize_intent/1),
      blockers:
        intents
        |> Enum.flat_map(&normalize_list(&1.blockers))
        |> Enum.take(10),
      next_actions:
        intents
        |> Enum.flat_map(&normalize_list(&1.next_actions))
        |> Enum.take(10),
      recent_host_sessions: recent_sessions,
      host_sessions_refreshed_at: DateTime.utc_now(),
      sources:
        Enum.map(intents, fn intent -> %{kind: "intent", id: intent.id, confidence: "high"} end)
    }
  end

  def session_evidence(project, opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)
    maybe_refresh_host_sessions(opts)

    sessions =
      Persistence.list_host_sessions(limit: 100)
      |> Enum.filter(&session_matches_project?(&1, project))
      |> Enum.take(limit)

    %{
      project: project,
      sessions: Enum.map(sessions, &serialize_host_session/1),
      host_sessions_refreshed_at: DateTime.utc_now(),
      derived_decisions: [],
      open_loops: [],
      sources:
        Enum.map(sessions, fn session ->
          %{kind: "session", id: session.id, confidence: "medium"}
        end)
    }
  end

  defp project_summary(project, _state, project_state, intents) do
    focus = project_state && project_state.current_focus_intent_id
    active = Enum.count(intents, &(&1.status in ["active", :active, "blocked", :blocked]))

    "#{project} project context package with #{active} active/blocked intents" <>
      if(focus, do: ", focus #{focus}", else: "")
  end

  defp operator_summary([], _intents), do: "No active projects discovered in operator package"

  defp operator_summary(projects, intents),
    do:
      "Operator package covering #{length(projects)} active projects and #{length(intents)} visible intents"

  defp intent_limit("small"), do: 3
  defp intent_limit("large"), do: 12
  defp intent_limit(_), do: 6

  defp bounded_working_set(state, kind) do
    state
    |> Map.get(:bounded_working_set, [])
    |> Enum.filter(fn item ->
      case kind do
        :proposal -> Map.has_key?(item, :execution_ids) or Map.has_key?(item, "execution_ids")
        _ -> true
      end
    end)
  end

  defp host_session_evidence(project, budget) do
    session_evidence(project, limit: intent_limit(budget), refresh?: false).sessions
  end

  defp recent_host_sessions(limit) do
    Persistence.list_host_sessions(limit: max(limit, 1))
    |> Enum.map(&serialize_host_session/1)
  end

  defp wiki_pages(nil), do: []

  defp wiki_pages(project_state) do
    refs = project_state.linked_refs || %{}
    Map.get(refs, :wiki_pages) || Map.get(refs, "wiki_pages") || []
  end

  defp build_sources(project_state, intents) do
    project_sources =
      if project_state do
        [%{kind: "project_state", id: project_state.id, confidence: "high"}]
      else
        []
      end

    intent_sources =
      Enum.map(intents, fn intent -> %{kind: "intent", id: intent.id, confidence: "high"} end)

    project_sources ++ intent_sources
  end

  defp serialize_project_state(nil), do: nil

  defp serialize_project_state(project_state) do
    %{
      id: project_state.id,
      project: project_state.project,
      title: project_state.title,
      status: project_state.status,
      current_focus_intent_id: project_state.current_focus_intent_id,
      primary_goal: project_state.primary_goal,
      active_intent_ids: project_state.active_intent_ids,
      blockers: normalize_list(project_state.blockers),
      recent_decisions: normalize_list(project_state.recent_decisions),
      next_actions: normalize_list(project_state.next_actions),
      linked_refs: project_state.linked_refs || %{},
      updated_at: project_state.updated_at
    }
  end

  defp serialize_intent(intent) do
    %{
      id: intent.id,
      project: intent.project,
      slug: intent.slug,
      title: intent.title,
      kind: intent.kind,
      status: intent.status,
      priority: intent.priority,
      current_focus: intent.current_focus,
      summary: intent.summary,
      objectives: normalize_list(intent.objectives),
      blockers: normalize_list(intent.blockers),
      next_actions: normalize_list(intent.next_actions),
      linked_refs: intent.linked_refs || %{},
      updated_at: intent.updated_at
    }
  end

  defp serialize_host_session(session) do
    %{
      id: session.id,
      provider: session.provider,
      provider_session_id: session.provider_session_id,
      cwd: session.cwd,
      title: session.title,
      status: session.status,
      started_at: session.started_at,
      last_activity_at: session.last_activity_at,
      metadata: session.metadata || %{}
    }
  end

  defp maybe_refresh_host_sessions(opts) do
    if Keyword.get(opts, :refresh?, true) do
      try do
        HostSessionSync.sync_now()
      catch
        :exit, _ -> :ok
      end
    else
      :ok
    end
  end

  defp normalize_list(nil), do: []
  defp normalize_list(value) when is_list(value), do: value
  defp normalize_list(value), do: [value]

  defp session_matches_project?(session, project) do
    values = [session.provider_project_key, session.cwd, session.title]

    Enum.any?(values, fn v ->
      is_binary(v) and String.contains?(String.downcase(v), String.downcase(project))
    end)
  end
end
