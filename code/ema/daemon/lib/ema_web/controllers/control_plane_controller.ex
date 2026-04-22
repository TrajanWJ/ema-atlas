defmodule EmaWeb.ControlPlaneController do
  use EmaWeb, :controller

  alias Ema.ControlPlane.{
    Command,
    DispatchReconciler,
    EventLog,
    HostTransitionLog,
    Persistence,
    Replay,
    Store
  }

  alias Ema.ControlPlane.Incidents.Authority

  def status(conn, _params) do
    body =
      Store.status()
      |> Map.put(:incidents, %{active: Authority.list(active: true)})
      |> Map.put(:sweeper, Store.sweep_status())

    json(conn, body)
  end

  def create_proposal(
        conn,
        %{"project" => project, "intent" => intent, "summary" => summary} = params
      ) do
    attrs = %{
      project: project,
      intent: intent,
      summary: summary,
      context: Map.get(params, "context", %{}),
      metadata: Map.get(params, "metadata", %{})
    }

    case Store.propose(attrs) do
      {:ok, proposal} -> json(conn |> put_status(201), %{proposal: proposal})
      {:error, reason} -> render_error(conn, reason)
    end
  end

  def approve_proposal(conn, %{"id" => proposal_id} = params) do
    opts = %{
      operator: Map.get(params, "operator"),
      note: Map.get(params, "note")
    }

    case Store.approve(proposal_id, opts) do
      {:ok, proposal} -> json(conn, %{proposal: proposal})
      {:error, reason} -> render_error(conn, reason)
    end
  end

  def run_proposal(conn, %{"id" => proposal_id} = params) do
    opts = %{
      adapter: Map.get(params, "adapter", "local"),
      operator: Map.get(params, "operator"),
      operator_constraints: Map.get(params, "operator_constraints", []),
      metadata: Map.get(params, "metadata", %{})
    }

    case Store.run(proposal_id, opts) do
      {:ok, result} -> json(conn, result)
      {:error, reason} -> render_error(conn, reason)
    end
  end

  def complete_execution(conn, %{"id" => execution_id} = params) do
    attrs = %{
      status: Map.get(params, "status", "succeeded"),
      summary: Map.get(params, "summary"),
      details: Map.get(params, "details", %{}),
      metadata: Map.get(params, "metadata", %{})
    }

    case Store.complete(execution_id, attrs) do
      {:ok, result} -> json(conn, result)
      {:error, reason} -> render_error(conn, reason)
    end
  end

  def context_for(conn, %{"project" => project}) do
    json(conn, Store.context_for(project))
  end

  def sweeper(conn, _params) do
    json(conn, Store.sweep_status())
  end

  def live(conn, params) do
    limit = params |> Map.get("limit", "50") |> String.to_integer()
    json(conn, %{events: EventLog.recent(limit), incidents: Authority.recent_events(limit)})
  end

  def dispatch_board_replay(conn, params) do
    limit = params |> Map.get("limit", "25") |> String.to_integer()

    body =
      Replay.dispatch_board(
        limit: limit,
        project: Map.get(params, "project"),
        intent: Map.get(params, "intent"),
        execution_id: Map.get(params, "execution_id")
      )

    json(conn, body)
  end

  def incidents(conn, params) do
    active_only? = Map.get(params, "active", "true") != "false"
    json(conn, %{incidents: Authority.list(active: active_only?)})
  end

  def incident_action(conn, %{"id" => incident_id, "action" => action} = params) do
    attrs = %{
      actor: Map.get(params, "actor"),
      duration_ms: Map.get(params, "duration_ms")
    }

    case Authority.request_action(incident_id, action, attrs) do
      {:ok, incident} -> json(conn, %{incident: incident})
      {:error, reason} -> render_error(conn, reason)
    end
  end

  def host_transitions(conn, params) do
    limit = params |> Map.get("limit", "50") |> String.to_integer()
    json(conn, %{events: HostTransitionLog.recent(limit)})
  end

  def command(conn, %{"command" => command}) do
    case Command.run(command) do
      {:ok, result} -> json(conn, result)
      {:error, reason} -> render_error(conn, reason)
    end
  end

  def dispatch_update(conn, %{"id" => execution_id} = params) do
    attrs = %{
      status: Map.get(params, "status", "failed"),
      summary: Map.get(params, "summary", "dispatch update"),
      details: %{
        dispatch_id: Map.get(params, "dispatch_id"),
        adapter_status: Map.get(params, "adapter_status"),
        result: Map.get(params, "result")
      }
    }

    case Store.complete(execution_id, attrs) do
      {:ok, result} -> json(conn, %{source: "dispatch_update", result: result})
      {:error, reason} -> render_error(conn, reason)
    end
  end

  def reconciler(conn, _params) do
    json(conn, DispatchReconciler.stats())
  end

  def persistence_status(conn, params) do
    project = Map.get(params, "project")

    body =
      if project do
        Persistence.project_summary(project)
      else
        %{
          adapter: "sqlite3",
          proposals: length(Persistence.list_proposals(limit: 0)),
          executions: length(Persistence.list_executions(limit: 0)),
          status: "available"
        }
      end

    json(conn, body)
  end

  def project_state(conn, %{"project" => project}) do
    body =
      case Persistence.get_project_state_by_project(project) do
        nil -> %{project: nil}
        state -> %{project: serialize_project_state(state)}
      end

    json(conn, body)
  end

  def bootstrap_project(conn, %{"project" => project} = params) do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
    title = Map.get(params, "title", String.upcase(project))

    seed_intents =
      Map.get(params, "seed_intents", [
        "host-cli-integration",
        "session-normalization",
        "mcp-baseline",
        "wiki-buildout",
        "vault-deprecation"
      ])

    project_state =
      case Persistence.get_project_state_by_project(project) do
        nil ->
          {:ok, state} =
            Persistence.upsert_project_state(%{
              id: "proj_#{project}",
              project: project,
              title: title,
              status: "active",
              current_focus_intent_id: "int_#{String.replace(hd(seed_intents), "-", "_")}",
              primary_goal:
                Map.get(
                  params,
                  "primary_goal",
                  "Bootstrap canonical project state for #{project}"
                ),
              active_intent_ids: Enum.map(seed_intents, &"int_#{String.replace(&1, "-", "_")}"),
              blockers: wrap_list_map(Map.get(params, "blockers", [])),
              recent_decisions: wrap_list_map(Map.get(params, "recent_decisions", [])),
              next_actions: wrap_list_map(Map.get(params, "next_actions", [])),
              linked_refs: Map.get(params, "linked_refs", %{}),
              metadata: %{bootstrap_mode: "api", operator: Map.get(params, "operator")},
              inserted_at: now,
              updated_at: now
            })

          state

        state ->
          state
      end

    {created_intents, existing_intents} =
      Enum.reduce(seed_intents, {[], []}, fn slug, {created, existing} ->
        intent_id = "int_#{String.replace(slug, "-", "_")}"

        case Persistence.get_intent(intent_id) do
          nil ->
            {:ok, intent} =
              Persistence.upsert_intent(%{
                id: intent_id,
                project: project,
                slug: slug,
                title: slug |> String.split("-") |> Enum.map_join(" ", &Macro.camelize/1),
                kind: infer_intent_kind(slug),
                status: "active",
                priority: "high",
                current_focus: "Bootstrap #{slug}",
                summary: "Bootstrapped intent for #{slug}",
                objectives: wrap_list_map([]),
                blockers: wrap_list_map([]),
                next_actions: wrap_list_map([]),
                linked_refs: %{},
                metadata: %{bootstrap_mode: "api", operator: Map.get(params, "operator")},
                inserted_at: now,
                updated_at: now
              })

            {[serialize_intent(intent) | created], existing}

          intent ->
            {created, [serialize_intent(intent) | existing]}
        end
      end)

    json(conn, %{
      project: serialize_project_state(project_state),
      created_intents: Enum.reverse(created_intents),
      existing_intents: Enum.reverse(existing_intents)
    })
  end

  def list_project_intents(conn, %{"project" => project} = params) do
    limit = params |> Map.get("limit", "100") |> String.to_integer()

    opts =
      [project: project, limit: limit]
      |> maybe_put_opt(:status, Map.get(params, "status"))
      |> maybe_put_opt(:kind, Map.get(params, "kind"))

    json(conn, %{
      project: project,
      intents: Enum.map(Persistence.list_intents(opts), &serialize_intent/1)
    })
  end

  def update_intent(conn, %{"id" => id, "patch" => patch}) when is_map(patch) do
    case Persistence.get_intent(id) do
      nil ->
        render_error(conn, {:not_found, :intent, id})

      intent ->
        attrs = %{
          id: intent.id,
          project: intent.project,
          slug: intent.slug,
          title: intent.title,
          kind: intent.kind,
          status: Map.get(patch, "status", intent.status),
          priority: Map.get(patch, "priority", intent.priority),
          current_focus: Map.get(patch, "current_focus", intent.current_focus),
          summary: Map.get(patch, "summary", intent.summary),
          objectives: wrap_list_map(Map.get(patch, "objectives", intent.objectives || [])),
          blockers: wrap_list_map(Map.get(patch, "blockers", intent.blockers || [])),
          next_actions: wrap_list_map(Map.get(patch, "next_actions", intent.next_actions || [])),
          linked_refs: Map.get(patch, "linked_refs", intent.linked_refs || %{}),
          metadata: Map.merge(intent.metadata || %{}, %{"updated_via" => "api"}),
          inserted_at: intent.inserted_at,
          updated_at: DateTime.utc_now() |> DateTime.truncate(:microsecond)
        }

        case Persistence.upsert_intent(attrs) do
          {:ok, updated} -> json(conn, %{intent: serialize_intent(updated)})
          {:error, reason} -> render_error(conn, reason)
        end
    end
  end

  def update_intent(conn, _params) do
    render_error(conn, {:invalid_patch, :intent})
  end

  def intent_snapshot(conn, %{"project" => project}) do
    intents = Persistence.list_intents(project: project, limit: 100)
    project_state = Persistence.get_project_state_by_project(project)

    body = %{
      project: project,
      focus: project_state && project_state.current_focus_intent_id,
      active: Enum.count(intents, &(&1.status == "active")),
      blocked: Enum.count(intents, &(&1.status == "blocked")),
      top_blockers: intents |> Enum.flat_map(&normalize_list(&1.blockers)) |> Enum.take(5),
      next_actions: intents |> Enum.flat_map(&normalize_list(&1.next_actions)) |> Enum.take(5)
    }

    json(conn, body)
  end

  def project_package(conn, %{"project" => project} = params) do
    budget = Map.get(params, "budget", "medium")
    json(conn, Ema.Context.Injector.project_package(project, budget: budget))
  end

  def operator_package(conn, params) do
    budget = Map.get(params, "budget", "medium")

    limit_projects =
      params
      |> Map.get("limit_projects", "5")
      |> String.to_integer()

    json(
      conn,
      Ema.Context.Injector.operator_package(budget: budget, limit_projects: limit_projects)
    )
  end

  def session_evidence(conn, %{"project" => project} = params) do
    limit = params |> Map.get("limit", "10") |> String.to_integer()
    json(conn, Ema.Context.Injector.session_evidence(project, limit: limit))
  end

  defp render_error(conn, {:not_found, type, id}) do
    json(conn |> put_status(404), %{error: "not_found", message: "#{type} #{id} not found"})
  end

  defp render_error(conn, {:invalid_outcome_status, status}) do
    json(conn |> put_status(422), %{error: "invalid_outcome_status", message: inspect(status)})
  end

  defp render_error(conn, {:proposal_not_approved, status}) do
    json(conn |> put_status(409), %{error: "proposal_not_approved", message: inspect(status)})
  end

  defp render_error(conn, {:proposal_not_approvable, status}) do
    json(conn |> put_status(409), %{error: "proposal_not_approvable", message: inspect(status)})
  end

  defp render_error(conn, {:proposal_already_approved}) do
    json(conn |> put_status(409), %{error: "proposal_already_approved", message: "proposal already approved"})
  end

  defp render_error(conn, {:invalid_patch, :intent}) do
    json(conn |> put_status(400), %{error: "invalid_patch", message: "intent patch must be a map"})
  end

  defp render_error(conn, reason) do
    json(conn |> put_status(400), %{error: "bad_request", message: inspect(reason)})
  end

  defp maybe_put_opt(opts, _key, nil), do: opts
  defp maybe_put_opt(opts, key, value), do: Keyword.put(opts, key, value)

  defp infer_intent_kind(slug) when slug in ["session-normalization", "vault-deprecation"],
    do: "migration"

  defp infer_intent_kind(slug)
       when slug in ["mcp-baseline", "wiki-buildout", "host-cli-integration"],
       do: "integration"

  defp infer_intent_kind(_slug), do: "project-focus"

  defp normalize_list(nil), do: []
  defp normalize_list(%{"items" => items}) when is_list(items), do: items
  defp normalize_list(%{items: items}) when is_list(items), do: items
  defp normalize_list(value) when is_list(value), do: value
  defp normalize_list(value), do: [value]

  defp wrap_list_map(value) when is_list(value), do: %{"items" => value}
  defp wrap_list_map(value), do: value

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
      timestamps: %{
        created_at: intent.inserted_at,
        updated_at: intent.updated_at
      }
    }
  end

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
      timestamps: %{
        created_at: project_state.inserted_at,
        updated_at: project_state.updated_at
      }
    }
  end
end
