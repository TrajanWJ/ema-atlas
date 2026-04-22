defmodule Ema.ControlPlane.Persistence do
  @moduledoc """
  Ecto-backed persistence context for control-plane entities.

  Provides a durable SQLite write path that shadows the in-memory Store.
  The Store remains the live authority; this module is called after state
  transitions to persist a durable copy for query, audit, and eventual
  migration off JSON files.
  """

  import Ecto.Query

  alias Ema.Repo

  alias Ema.ControlPlane.Schema.{
    Proposal,
    Execution,
    Outcome,
    Event,
    HostSession,
    HostSessionEvent,
    HostSessionMessage,
    SurfaceBinding,
    Intent,
    ProjectState
  }

  # --- Proposals ---

  def upsert_proposal(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %Proposal{}
    |> Proposal.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace_all_except, [:id, :inserted_at]},
      conflict_target: :id
    )
  end

  def get_proposal(id), do: Repo.get(Proposal, id)

  def list_proposals(opts \\ []) do
    Proposal
    |> maybe_filter_project(opts[:project])
    |> maybe_filter_status(opts[:status])
    |> order_by([p], desc: p.updated_at)
    |> limit(^Keyword.get(opts, :limit, 100))
    |> Repo.all()
  end

  # --- Executions ---

  def upsert_execution(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %Execution{}
    |> Execution.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace_all_except, [:id, :inserted_at]},
      conflict_target: :id
    )
  end

  def get_execution(id), do: Repo.get(Execution, id)

  def list_executions(opts \\ []) do
    Execution
    |> maybe_filter_project(opts[:project])
    |> maybe_filter_status(opts[:status])
    |> maybe_filter_proposal(opts[:proposal_id])
    |> order_by([e], desc: e.updated_at)
    |> limit(^Keyword.get(opts, :limit, 100))
    |> Repo.all()
  end

  def open_executions(project) do
    Execution
    |> where([e], e.project == ^project and e.status in ["created", "running", "blocked"])
    |> order_by([e], desc: e.updated_at)
    |> Repo.all()
  end

  # --- Outcomes ---

  def insert_outcome(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %Outcome{}
    |> Outcome.changeset(attrs)
    |> Repo.insert(on_conflict: :nothing, conflict_target: :id)
  end

  def get_outcome(id), do: Repo.get(Outcome, id)

  def list_outcomes(opts \\ []) do
    Outcome
    |> maybe_filter_project(opts[:project])
    |> maybe_filter_execution(opts[:execution_id])
    |> order_by([o], desc: o.inserted_at)
    |> limit(^Keyword.get(opts, :limit, 100))
    |> Repo.all()
  end

  # --- Events ---

  def insert_event(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %Event{}
    |> Event.changeset(attrs)
    |> Repo.insert(on_conflict: :nothing, conflict_target: :id)
  end

  def list_events(opts \\ []) do
    Event
    |> maybe_filter_execution(opts[:execution_id])
    |> maybe_filter_proposal(opts[:proposal_id])
    |> maybe_filter_type(opts[:type])
    |> order_by([e], desc: e.occurred_at)
    |> limit(^Keyword.get(opts, :limit, 200))
    |> Repo.all()
  end

  # --- Host Sessions ---

  def upsert_host_session(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %HostSession{}
    |> HostSession.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace_all_except, [:id, :inserted_at]},
      conflict_target: :id
    )
  end

  def get_host_session(id), do: Repo.get(HostSession, id)

  def get_host_session_by_provider(provider, provider_session_id) do
    HostSession
    |> where([s], s.provider == ^provider and s.provider_session_id == ^provider_session_id)
    |> limit(1)
    |> Repo.one()
  end

  def list_host_sessions(opts \\ []) do
    HostSession
    |> maybe_filter_provider(opts[:provider])
    |> maybe_filter_status(opts[:status])
    |> order_by([s], desc: s.last_activity_at, desc: s.inserted_at)
    |> limit(^Keyword.get(opts, :limit, 100))
    |> Repo.all()
  end

  def insert_host_session_event(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %HostSessionEvent{}
    |> HostSessionEvent.changeset(attrs)
    |> Repo.insert(on_conflict: :nothing, conflict_target: :id)
  end

  def list_host_session_events(host_session_id, opts \\ []) do
    HostSessionEvent
    |> where([e], e.host_session_id == ^host_session_id)
    |> maybe_filter_provider(opts[:provider])
    |> order_by([e], desc: e.occurred_at)
    |> limit(^Keyword.get(opts, :limit, 200))
    |> Repo.all()
  end

  def insert_host_session_message(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %HostSessionMessage{}
    |> HostSessionMessage.changeset(attrs)
    |> Repo.insert(on_conflict: :nothing, conflict_target: :id)
  end

  def list_host_session_messages(host_session_id, opts \\ []) do
    HostSessionMessage
    |> where([m], m.host_session_id == ^host_session_id)
    |> order_by([m], desc: m.occurred_at)
    |> limit(^Keyword.get(opts, :limit, 200))
    |> Repo.all()
  end

  def upsert_surface_binding(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %SurfaceBinding{}
    |> SurfaceBinding.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace_all_except, [:id, :inserted_at]},
      conflict_target: :id
    )
  end

  def list_surface_bindings(host_session_id) do
    SurfaceBinding
    |> where([b], b.host_session_id == ^host_session_id)
    |> order_by([b], desc: b.updated_at)
    |> Repo.all()
  end

  # --- Intents ---

  def upsert_intent(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %Intent{}
    |> Intent.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace_all_except, [:id, :inserted_at]},
      conflict_target: :id
    )
  end

  def get_intent(id), do: Repo.get(Intent, id)

  def list_intents(opts \\ []) do
    Intent
    |> maybe_filter_project(opts[:project])
    |> maybe_filter_status(opts[:status])
    |> maybe_filter_kind(opts[:kind])
    |> order_by([i], desc: i.updated_at)
    |> limit(^Keyword.get(opts, :limit, 100))
    |> Repo.all()
  end

  # --- Project state ---

  def upsert_project_state(attrs) when is_map(attrs) do
    attrs = normalize_keys(attrs)

    %ProjectState{}
    |> ProjectState.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace_all_except, [:id, :inserted_at]},
      conflict_target: :id
    )
  end

  def get_project_state(id), do: Repo.get(ProjectState, id)

  def get_project_state_by_project(project) do
    ProjectState
    |> where([p], p.project == ^project)
    |> limit(1)
    |> Repo.one()
  end

  # --- Sync from Store ---

  @doc """
  Persist a Store state snapshot to SQLite. Called after state transitions
  in the Store to maintain a durable shadow copy.
  """
  def sync_proposal(proposal_map) when is_map(proposal_map) do
    upsert_proposal(proposal_map)
  end

  def sync_execution(execution_map) when is_map(execution_map) do
    upsert_execution(execution_map)
  end

  def sync_outcome(outcome_map) when is_map(outcome_map) do
    insert_outcome(outcome_map)
  end

  def sync_event(event_map) when is_map(event_map) do
    insert_event(event_map)
  end

  def sync_host_session(session_map) when is_map(session_map) do
    upsert_host_session(session_map)
  end

  def sync_host_session_event(event_map) when is_map(event_map) do
    insert_host_session_event(event_map)
  end

  def sync_host_session_message(message_map) when is_map(message_map) do
    insert_host_session_message(message_map)
  end

  def sync_surface_binding(binding_map) when is_map(binding_map) do
    upsert_surface_binding(binding_map)
  end

  def sync_intent(intent_map) when is_map(intent_map) do
    upsert_intent(intent_map)
  end

  def sync_project_state(project_state_map) when is_map(project_state_map) do
    upsert_project_state(project_state_map)
  end

  # --- Query helpers ---

  def project_summary(project) do
    proposals = Repo.aggregate(where(Proposal, project: ^project), :count)
    executions = Repo.aggregate(where(Execution, project: ^project), :count)
    outcomes = Repo.aggregate(where(Outcome, project: ^project), :count)
    open = Repo.aggregate(open_executions_query(project), :count)

    %{
      project: project,
      proposals: proposals,
      executions: executions,
      outcomes: outcomes,
      open_executions: open
    }
  end

  # --- Private ---

  defp open_executions_query(project) do
    from(e in Execution,
      where: e.project == ^project and e.status in ["created", "running", "blocked"]
    )
  end

  defp maybe_filter_project(query, nil), do: query
  defp maybe_filter_project(query, project), do: where(query, [r], r.project == ^project)

  defp maybe_filter_status(query, nil), do: query
  defp maybe_filter_status(query, status), do: where(query, [r], r.status == ^status)

  defp maybe_filter_proposal(query, nil), do: query
  defp maybe_filter_proposal(query, id), do: where(query, [r], r.proposal_id == ^id)

  defp maybe_filter_execution(query, nil), do: query
  defp maybe_filter_execution(query, id), do: where(query, [r], r.execution_id == ^id)

  defp maybe_filter_type(query, nil), do: query
  defp maybe_filter_type(query, type), do: where(query, [r], r.type == ^type)

  defp maybe_filter_provider(query, nil), do: query
  defp maybe_filter_provider(query, provider), do: where(query, [r], r.provider == ^provider)

  defp maybe_filter_kind(query, nil), do: query
  defp maybe_filter_kind(query, kind), do: where(query, [r], r.kind == ^kind)

  defp normalize_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {k, normalize_value(v)}
      {k, v} when is_binary(k) -> {String.to_existing_atom(k), normalize_value(v)}
    end)
  rescue
    ArgumentError -> map
  end

  defp normalize_value(%DateTime{} = dt), do: dt

  defp normalize_value(v) when is_atom(v) and not is_nil(v) and not is_boolean(v),
    do: Atom.to_string(v)

  defp normalize_value(v), do: v
end
