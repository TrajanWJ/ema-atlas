defmodule Ema.ControlPlane.Store do
  @moduledoc """
  Minimal control-plane store with file-backed persistence.

  Owns canonical proposal -> execution -> outcome lineage, emits normalized
  execution events, exposes deterministic project context, and sweeps stale
  executions into explicit terminal states.
  """

  use GenServer

  alias Ema.ControlPlane.{Persistence, ProposalEvents}
  alias Ema.Executions.Events
  alias Ema.Surfaces.GatewayClient

  @state_file Path.expand("../../../priv/control_plane_state.json", __DIR__)

  defmodule Proposal do
    @enforce_keys [:id, :project, :intent, :summary, :status, :created_at, :updated_at]
    defstruct [
      :id,
      :project,
      :intent,
      :summary,
      :context,
      :status,
      :approved_by,
      :created_at,
      :updated_at,
      execution_ids: [],
      metadata: %{}
    ]
  end

  defmodule Execution do
    @enforce_keys [:id, :proposal_id, :project, :intent, :status, :created_at, :updated_at]
    defstruct [
      :id,
      :proposal_id,
      :project,
      :intent,
      :status,
      :adapter,
      :operator,
      :started_at,
      :completed_at,
      :created_at,
      :updated_at,
      :result,
      :context_bundle,
      :dispatch,
      metadata: %{}
    ]
  end

  defmodule Outcome do
    @enforce_keys [:id, :execution_id, :proposal_id, :project, :intent, :status, :created_at]
    defstruct [
      :id,
      :execution_id,
      :proposal_id,
      :project,
      :intent,
      :status,
      :summary,
      :details,
      :created_at,
      metadata: %{}
    ]
  end

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def propose(attrs), do: GenServer.call(__MODULE__, {:propose, attrs})
  def approve(proposal_id, opts \\ %{}), do: GenServer.call(__MODULE__, {:approve, proposal_id, opts})
  def run(proposal_id, opts \\ %{}), do: GenServer.call(__MODULE__, {:run, proposal_id, opts})
  def complete(execution_id, attrs), do: GenServer.call(__MODULE__, {:complete, execution_id, attrs})
  def sweep_stale(now \\ DateTime.utc_now()), do: GenServer.call(__MODULE__, {:sweep_stale, now})
  def sweep_status(), do: GenServer.call(__MODULE__, :sweep_status)
  def status(), do: GenServer.call(__MODULE__, :status)
  def context_for(project), do: GenServer.call(__MODULE__, {:context_for, project})

  @impl true
  def init(_opts) do
    {:ok, load_state()}
  end

  @impl true
  def handle_call({:propose, attrs}, _from, state) do
    now = DateTime.utc_now()

    proposal = %Proposal{
      id: id("prp"),
      project: Map.fetch!(attrs, :project),
      intent: Map.fetch!(attrs, :intent),
      summary: Map.fetch!(attrs, :summary),
      context: Map.get(attrs, :context, %{}),
      status: :pending_review,
      approved_by: Map.get(attrs, :operator),
      created_at: now,
      updated_at: now,
      metadata: Map.get(attrs, :metadata, %{})
    }

    new_state =
      state
      |> put_proposal(proposal)
      |> index_project(proposal.project, proposal.id, :proposal)
      |> persist_state()

    ProposalEvents.emit(proposal.id, :proposal_created, %{
      status: proposal.status,
      actor: Map.get(attrs, :operator),
      summary_line: "proposal drafted: #{proposal.project}/#{proposal.intent}",
      payload: %{project: proposal.project, intent: proposal.intent}
    })

    async_sync(:proposal, proposal)
    {:reply, {:ok, serialize_proposal(proposal)}, new_state}
  end

  def handle_call({:approve, proposal_id, opts}, _from, state) do
    with {:ok, proposal} <- fetch(state.proposals, proposal_id, :proposal),
         :ok <- ensure_proposal_approvable(proposal) do
      now = DateTime.utc_now()

      updated_proposal = %{
        proposal
        | status: :approved,
          approved_by: Map.get(opts, :operator),
          updated_at: now,
          metadata:
              proposal.metadata
              |> Map.put("approval_note", Map.get(opts, :note))
              |> Map.put("approved_at", DateTime.to_iso8601(now))
      }

      new_state =
        state
        |> put_proposal(updated_proposal)
        |> persist_state()

      ProposalEvents.emit(proposal.id, :proposal_approved, %{
        status: updated_proposal.status,
        actor: Map.get(opts, :operator),
        summary_line: "proposal approved for execution",
        payload: %{project: proposal.project, intent: proposal.intent, note: Map.get(opts, :note)}
      })

      async_sync(:proposal, updated_proposal)
      {:reply, {:ok, serialize_proposal(updated_proposal)}, new_state}
    else
      {:error, _} = error -> {:reply, error, state}
    end
  end

  def handle_call({:run, proposal_id, opts}, _from, state) do
    with {:ok, proposal} <- fetch(state.proposals, proposal_id, :proposal),
         :ok <- ensure_proposal_runnable(proposal) do
      now = DateTime.utc_now()
      adapter = Map.get(opts, :adapter, "local")
      context_bundle = build_context_bundle(state, proposal.project, proposal, opts)
      dispatch = dispatch_execution(adapter, proposal, context_bundle)
      execution_status = if match?({:ok, _}, dispatch), do: :running, else: :blocked

      execution = %Execution{
        id: id("exe"),
        proposal_id: proposal.id,
        project: proposal.project,
        intent: proposal.intent,
        status: execution_status,
        adapter: adapter,
        operator: Map.get(opts, :operator),
        started_at: now,
        completed_at: nil,
        created_at: now,
        updated_at: now,
        context_bundle: context_bundle,
        dispatch: normalize_dispatch(dispatch),
        result: nil,
        metadata: Map.get(opts, :metadata, %{})
      }

      updated_proposal = %{
        proposal
        | status: :running,
          approved_by: Map.get(opts, :operator),
          execution_ids: proposal.execution_ids ++ [execution.id],
          updated_at: now
      }

      new_state =
        state
        |> put_execution(execution)
        |> put_proposal(updated_proposal)
        |> index_project(proposal.project, execution.id, :execution)
        |> persist_state()

      ProposalEvents.emit(proposal.id, :proposal_running, %{
        status: updated_proposal.status,
        actor: Map.get(opts, :operator),
        summary_line: "proposal accepted into execution via #{adapter}",
        payload: %{execution_id: execution.id, adapter: adapter}
      })

      Events.emit(execution.id, :execution_created, %{
        status: :queued,
        phase: :intake,
        actor: Map.get(opts, :operator),
        summary_line: "execution created for #{proposal.project}/#{proposal.intent}",
        payload: %{proposal_id: proposal.id, dispatch: execution.dispatch, adapter: adapter}
      })

      Events.emit(execution.id, if(execution.status == :running, do: :execution_started, else: :execution_blocked), %{
        status: execution.status,
        phase: :dispatch,
        actor: Map.get(opts, :operator),
        summary_line: "#{proposal.project}/#{proposal.intent} via #{adapter}",
        payload: %{proposal_id: proposal.id, dispatch: execution.dispatch, adapter: adapter}
      })

      async_sync(:proposal, updated_proposal)
      async_sync(:execution, execution)

      {:reply,
       {:ok,
        %{proposal: serialize_proposal(updated_proposal), execution: serialize_execution(execution)}},
       new_state}
    else
      {:error, _} = error -> {:reply, error, state}
    end
  end

  def handle_call({:complete, execution_id, attrs}, _from, state) do
    with {:ok, execution} <- fetch(state.executions, execution_id, :execution),
         {:ok, proposal} <- fetch(state.proposals, execution.proposal_id, :proposal),
         {:ok, outcome_status} <- normalize_outcome_status(Map.get(attrs, :status, "succeeded")) do
      now = DateTime.utc_now()

      outcome = %Outcome{
        id: id("out"),
        execution_id: execution.id,
        proposal_id: proposal.id,
        project: execution.project,
        intent: execution.intent,
        status: outcome_status,
        summary: Map.get(attrs, :summary, execution.intent),
        details: Map.get(attrs, :details, %{}),
        created_at: now,
        metadata: Map.get(attrs, :metadata, %{})
      }

      execution_status = outcome_status_to_execution_status(outcome_status)

      updated_execution = %{
        execution
        | status: execution_status,
          completed_at: now,
          updated_at: now,
          result: serialize_outcome(outcome)
      }

      updated_proposal = %{
        proposal
        | status: execution_status_to_proposal_status(execution_status),
          updated_at: now
      }

      new_state =
        state
        |> put_execution(updated_execution)
        |> put_proposal(updated_proposal)
        |> put_outcome(outcome)
        |> index_project(execution.project, outcome.id, :outcome)
        |> persist_state()

      ProposalEvents.emit(proposal.id, proposal_event_type(execution_status), %{
        status: updated_proposal.status,
        summary_line: outcome.summary,
        payload: %{execution_id: execution.id, outcome_id: outcome.id}
      })

      Events.emit(execution.id, outcome_event_type(outcome_status), %{
        status: updated_execution.status,
        phase: :done,
        summary_line: outcome.summary,
        payload: %{proposal_id: proposal.id, outcome_id: outcome.id}
      })

      async_sync(:proposal, updated_proposal)
      async_sync(:execution, updated_execution)
      async_sync(:outcome, outcome)

      {:reply,
       {:ok,
        %{proposal: serialize_proposal(updated_proposal), execution: serialize_execution(updated_execution), outcome: serialize_outcome(outcome)}},
       new_state}
    else
      {:error, _} = error -> {:reply, error, state}
    end
  end

  def handle_call({:sweep_stale, now}, _from, state) do
    {new_state, sweep} = sweep_stale_executions(state, now)
    {:reply, sweep, new_state}
  end

  def handle_call(:sweep_status, _from, state) do
    now = DateTime.utc_now()
    orphan_cutoff = DateTime.add(now, -(5 * 60), :second)
    timeout_cutoff = DateTime.add(now, -(30 * 60), :second)

    stale_candidates =
      state.executions
      |> Map.values()
      |> Enum.filter(&(&1.status in [:created, :running, :blocked]))
      |> Enum.map(fn execution ->
        anchor = execution.started_at || execution.created_at

        %{
          id: execution.id,
          proposal_id: execution.proposal_id,
          project: execution.project,
          intent: execution.intent,
          status: Atom.to_string(execution.status),
          age_seconds: DateTime.diff(now, anchor, :second),
          stale_class:
            cond do
              execution.status == :blocked and DateTime.compare(anchor, orphan_cutoff) == :lt -> "orphan_candidate"
              DateTime.compare(anchor, timeout_cutoff) == :lt -> "timeout_candidate"
              true -> "healthy"
            end
        }
      end)

    {:reply,
     %{
       sweep_interval_ms: Application.get_env(:ema, :control_plane_sweep_interval_ms, 30_000),
       orphan_after_ms: Application.get_env(:ema, :control_plane_execution_orphan_ms, 5 * 60 * 1_000),
       timeout_after_ms: Application.get_env(:ema, :control_plane_execution_timeout_ms, 30 * 60 * 1_000),
       candidate_count: length(stale_candidates),
       candidates: stale_candidates
     }, state}
  end

  def handle_call(:status, _from, state) do
    projects = state.projects |> Map.keys() |> Enum.sort() |> Enum.map(&context_snapshot(state, &1))

    {:reply,
     %{
       projects: projects,
       review_queue: review_queue_snapshot(state),
       counts: %{
         proposals: map_size(state.proposals),
         executions: map_size(state.executions),
         outcomes: map_size(state.outcomes)
       }
     }, state}
  end

  def handle_call({:context_for, project}, _from, state) do
    {:reply, context_snapshot(state, project), state}
  end

  defp build_context_bundle(state, project, proposal, opts) do
    snapshot = context_snapshot(state, project)

    %{
      project: project,
      operator_constraints: Map.get(opts, :operator_constraints, []),
      proposal: serialize_proposal(proposal),
      active_goals: snapshot.active_goals,
      relevant_outcomes: snapshot.relevant_outcomes,
      open_executions: snapshot.open_executions,
      bounded_working_set: snapshot.bounded_working_set,
      repo_context: snapshot.repo_context,
      generated_at: DateTime.utc_now() |> DateTime.to_iso8601()
    }
  end

  defp context_snapshot(state, project) do
    proposals =
      state.proposals
      |> Map.values()
      |> Enum.filter(&(&1.project == project))
      |> Enum.sort_by(&sort_key/1)

    executions =
      state.executions
      |> Map.values()
      |> Enum.filter(&(&1.project == project))
      |> Enum.sort_by(&sort_key/1)

    outcomes =
      state.outcomes
      |> Map.values()
      |> Enum.filter(&(&1.project == project))
      |> Enum.sort_by(&sort_key/1, :desc)

    %{
      project: project,
      active_goals: proposals |> Enum.map(& &1.intent) |> Enum.uniq() |> Enum.sort(),
      relevant_outcomes: outcomes |> Enum.take(10) |> Enum.map(&serialize_outcome/1),
      review_queue: review_queue_snapshot(proposals),
      open_executions:
        executions
        |> Enum.filter(&(&1.status in [:created, :running, :blocked]))
        |> Enum.map(&serialize_execution/1),
      bounded_working_set:
        Enum.take(Enum.map(proposals, &serialize_proposal/1), -5) ++
          Enum.take(Enum.map(executions, &serialize_execution/1), -5),
      repo_context: repo_context(project),
      counts: %{
        proposals: length(proposals),
        executions: length(executions),
        outcomes: length(outcomes)
      }
    }
  end

  defp repo_context(project) do
    case project_root(project) do
      nil -> %{project_root: nil, docs: [], git: %{available: false}}
      root -> %{project_root: root, docs: list_docs(root), git: git_signals(root)}
    end
  end

  defp project_root("ema-phase2-build"), do: "/home/trajan/Projects/ema"
  defp project_root("ema"), do: "/home/trajan/Projects/ema"
  defp project_root(_), do: nil

  defp list_docs(root) do
    docs_dir = Path.join(root, "docs")

    if File.dir?(docs_dir) do
      docs_dir
      |> File.ls!()
      |> Enum.filter(&String.ends_with?(&1, ".md"))
      |> Enum.sort()
      |> Enum.take(12)
    else
      []
    end
  end

  defp git_signals(root) do
    case System.cmd("git", ["status", "--short"], cd: root, stderr_to_stdout: true) do
      {output, 0} ->
        lines = String.split(output, "\n", trim: true)
        %{available: true, dirty: lines != [], changed_count: length(lines), sample: Enum.take(lines, 10)}

      {output, code} ->
        %{available: false, dirty: false, changed_count: 0, error: String.trim(output), exit_status: code}
    end
  end

  defp dispatch_execution("gateway", proposal, context_bundle) do
    GatewayClient.dispatch_task(%{
      description: proposal.summary,
      agent: "coder",
      priority: 2,
      timeout_minutes: 30,
      tags: [proposal.project, proposal.intent, "control-plane"],
      context: context_bundle
    })
  end

  defp dispatch_execution(_adapter, _proposal, _context_bundle), do: {:ok, %{mode: "local_stub"}}

  defp sweep_stale_executions(state, now) do
    timeout_ms = Application.get_env(:ema, :control_plane_execution_timeout_ms, 30 * 60 * 1_000)
    orphan_ms = Application.get_env(:ema, :control_plane_execution_orphan_ms, 5 * 60 * 1_000)

    {new_state, swept} =
      Enum.reduce(state.executions, {state, []}, fn {_id, execution}, {acc, swept_acc} ->
        anchor = execution.started_at || execution.created_at || now
        age_ms = DateTime.diff(now, anchor, :millisecond)

        case stale_transition(execution.status, age_ms, timeout_ms, orphan_ms) do
          nil ->
            {acc, swept_acc}

          stale_status ->
            updated_execution = %{
              execution
              | status: stale_status,
                completed_at: now,
                updated_at: now,
                result: %{
                  status: Atom.to_string(stale_status),
                  summary: "execution swept as stale",
                  details: %{"swept_at" => DateTime.to_iso8601(now), "age_ms" => age_ms}
                }
            }

            proposal = Map.get(acc.proposals, execution.proposal_id)

            updated_state =
              acc
              |> put_execution(updated_execution)
              |> maybe_update_proposal_from_sweep(proposal, updated_execution, now)

            {updated_state, [%{execution: updated_execution, age_ms: age_ms} | swept_acc]}
        end
      end)

    persisted_state = persist_state(new_state)

    Enum.each(swept, fn %{execution: execution, age_ms: age_ms} ->
      ProposalEvents.emit(execution.proposal_id, proposal_event_type(execution.status), %{
        status: execution_status_to_proposal_status(execution.status),
        summary_line: "proposal swept due to stale execution",
        payload: %{execution_id: execution.id, age_ms: age_ms}
      })

      Events.emit(execution.id, stale_execution_event_type(execution.status), %{
        status: execution.status,
        phase: :done,
        summary_line: "execution swept as stale",
        payload: %{proposal_id: execution.proposal_id, age_ms: age_ms}
      })
    end)

    {persisted_state,
     %{
       updated_count: length(swept),
       swept_count: length(swept),
       swept_execution_ids: swept |> Enum.reverse() |> Enum.map(& &1.execution.id),
       timeout_after_ms: timeout_ms,
       orphan_after_ms: orphan_ms,
       swept_at: DateTime.to_iso8601(now)
     }}
  end

  defp stale_transition(status, age_ms, _timeout_ms, orphan_ms) when status == :blocked and age_ms >= orphan_ms,
    do: :orphaned

  defp stale_transition(status, age_ms, timeout_ms, _orphan_ms) when status in [:created, :running, :blocked] and age_ms >= timeout_ms,
    do: :timed_out

  defp stale_transition(_status, _age_ms, _timeout_ms, _orphan_ms), do: nil

  defp maybe_update_proposal_from_sweep(state, nil, _execution, _now), do: state

  defp maybe_update_proposal_from_sweep(state, proposal, execution, now) do
    put_proposal(state, %{
      proposal
      | status: execution_status_to_proposal_status(execution.status),
        updated_at: now
    })
  end

  defp load_state do
    with true <- File.exists?(@state_file),
         {:ok, raw} <- File.read(@state_file),
         {:ok, decoded} <- Jason.decode(raw) do
      hydrate_state(decoded)
    else
      _ -> %{proposals: %{}, executions: %{}, outcomes: %{}, projects: %{}}
    end
  end

  defp persist_state(state) do
    payload = %{
      proposals: Enum.into(state.proposals, %{}, fn {k, v} -> {k, serialize_proposal(v)} end),
      executions: Enum.into(state.executions, %{}, fn {k, v} -> {k, serialize_execution(v)} end),
      outcomes: Enum.into(state.outcomes, %{}, fn {k, v} -> {k, serialize_outcome(v)} end),
      projects: state.projects
    }

    @state_file |> Path.dirname() |> File.mkdir_p!()
    File.write!(@state_file, Jason.encode_to_iodata!(payload, pretty: true))
    state
  end

  defp hydrate_state(%{"proposals" => proposals, "executions" => executions, "outcomes" => outcomes, "projects" => projects}) do
    %{
      proposals: Enum.into(proposals, %{}, fn {k, v} -> {k, hydrate_proposal(v)} end),
      executions: Enum.into(executions, %{}, fn {k, v} -> {k, hydrate_execution(v)} end),
      outcomes: Enum.into(outcomes, %{}, fn {k, v} -> {k, hydrate_outcome(v)} end),
      projects: projects
    }
  end

  defp hydrate_state(_), do: %{proposals: %{}, executions: %{}, outcomes: %{}, projects: %{}}

  defp hydrate_proposal(map) do
    %Proposal{
      id: map["id"],
      project: map["project"],
      intent: map["intent"],
      summary: map["summary"],
      context: map["context"] || %{},
      status: String.to_existing_atom(map["status"]),
      approved_by: map["approved_by"],
      execution_ids: map["execution_ids"] || [],
      created_at: parse_iso!(map["created_at"]),
      updated_at: parse_iso!(map["updated_at"]),
      metadata: map["metadata"] || %{}
    }
  end

  defp hydrate_execution(map) do
    struct!(Execution, %{
      id: map["id"],
      proposal_id: map["proposal_id"],
      project: map["project"],
      intent: map["intent"],
      status: String.to_existing_atom(map["status"]),
      adapter: map["adapter"],
      operator: map["operator"],
      started_at: maybe_parse_iso(map["started_at"]),
      completed_at: maybe_parse_iso(map["completed_at"]),
      created_at: parse_iso!(map["created_at"]),
      updated_at: parse_iso!(map["updated_at"]),
      context_bundle: map["context_bundle"] || %{},
      dispatch: map["dispatch"],
      result: map["result"],
      metadata: map["metadata"] || %{}
    })
  end

  defp hydrate_outcome(map) do
    %Outcome{
      id: map["id"],
      execution_id: map["execution_id"],
      proposal_id: map["proposal_id"],
      project: map["project"],
      intent: map["intent"],
      status: String.to_existing_atom(map["status"]),
      summary: map["summary"],
      details: map["details"] || %{},
      created_at: parse_iso!(map["created_at"]),
      metadata: map["metadata"] || %{}
    }
  end

  defp outcome_status_to_execution_status(:succeeded), do: :completed
  defp outcome_status_to_execution_status(:failed), do: :failed
  defp outcome_status_to_execution_status(:cancelled), do: :cancelled

  defp outcome_event_type(:succeeded), do: :execution_completed
  defp outcome_event_type(:failed), do: :execution_failed
  defp outcome_event_type(:cancelled), do: :execution_cancelled

  defp proposal_event_type(:completed), do: :proposal_completed
  defp proposal_event_type(:failed), do: :proposal_failed
  defp proposal_event_type(:cancelled), do: :proposal_cancelled
  defp proposal_event_type(:timed_out), do: :proposal_timed_out
  defp proposal_event_type(:orphaned), do: :proposal_orphaned
  defp proposal_event_type(_), do: :proposal_running

  defp stale_execution_event_type(:timed_out), do: :execution_timed_out
  defp stale_execution_event_type(:orphaned), do: :execution_orphaned

  defp execution_status_to_proposal_status(:completed), do: :completed
  defp execution_status_to_proposal_status(:failed), do: :failed
  defp execution_status_to_proposal_status(:cancelled), do: :cancelled
  defp execution_status_to_proposal_status(:timed_out), do: :failed
  defp execution_status_to_proposal_status(:orphaned), do: :failed
  defp execution_status_to_proposal_status(_), do: :running

  defp normalize_outcome_status(status) when status in [:succeeded, :failed, :cancelled], do: {:ok, status}
  defp normalize_outcome_status("succeeded"), do: {:ok, :succeeded}
  defp normalize_outcome_status("failed"), do: {:ok, :failed}
  defp normalize_outcome_status("cancelled"), do: {:ok, :cancelled}
  defp normalize_outcome_status(other), do: {:error, {:invalid_outcome_status, other}}

  defp ensure_proposal_approvable(%Proposal{status: :pending_review}), do: :ok
  defp ensure_proposal_approvable(%Proposal{status: :approved}), do: {:error, {:proposal_already_approved}}
  defp ensure_proposal_approvable(%Proposal{status: status}), do: {:error, {:proposal_not_approvable, status}}

  defp ensure_proposal_runnable(%Proposal{status: :approved}), do: :ok
  defp ensure_proposal_runnable(%Proposal{status: status}), do: {:error, {:proposal_not_approved, status}}

  defp fetch(map, id, type) do
    case Map.fetch(map, id) do
      {:ok, value} -> {:ok, value}
      :error -> {:error, {:not_found, type, id}}
    end
  end

  defp put_proposal(state, proposal), do: put_in(state, [:proposals, proposal.id], proposal)
  defp put_execution(state, execution), do: put_in(state, [:executions, execution.id], execution)
  defp put_outcome(state, outcome), do: put_in(state, [:outcomes, outcome.id], outcome)

  defp index_project(state, project, id, kind) do
    projects = Map.get(state, :projects, %{})
    project_entry = Map.get(projects, project, %{})
    ids = Enum.uniq(Map.get(project_entry, kind, []) ++ [id])
    %{state | projects: Map.put(projects, project, Map.put(project_entry, kind, ids))}
  end

  defp review_queue_snapshot(%{proposals: proposals}) when is_map(proposals) do
    proposals
    |> Map.values()
    |> review_queue_snapshot()
  end

  defp review_queue_snapshot(proposals) when is_list(proposals) do
    pending_review =
      proposals
      |> Enum.filter(&(&1.status == :pending_review))
      |> Enum.sort_by(&sort_key/1, :desc)
      |> Enum.map(&serialize_proposal/1)

    approved_ready =
      proposals
      |> Enum.filter(&(&1.status == :approved))
      |> Enum.sort_by(&sort_key/1, :desc)
      |> Enum.map(&serialize_proposal/1)

    in_flight =
      proposals
      |> Enum.filter(&(&1.status == :running))
      |> Enum.sort_by(&sort_key/1, :desc)
      |> Enum.map(&serialize_proposal/1)

    %{
      pending_review_count: length(pending_review),
      approved_ready_count: length(approved_ready),
      in_flight_count: length(in_flight),
      pending_review: Enum.take(pending_review, 10),
      approved_ready: Enum.take(approved_ready, 10),
      in_flight: Enum.take(in_flight, 10)
    }
  end

  defp serialize_proposal(%Proposal{} = proposal) do
    %{
      id: proposal.id,
      project: proposal.project,
      intent: proposal.intent,
      summary: proposal.summary,
      context: proposal.context,
      status: Atom.to_string(proposal.status),
      approved_by: proposal.approved_by,
      execution_ids: proposal.execution_ids,
      created_at: DateTime.to_iso8601(proposal.created_at),
      updated_at: DateTime.to_iso8601(proposal.updated_at),
      metadata: proposal.metadata
    }
  end

  defp serialize_execution(%Execution{} = execution) do
    %{
      id: execution.id,
      proposal_id: execution.proposal_id,
      project: execution.project,
      intent: execution.intent,
      status: Atom.to_string(execution.status),
      adapter: execution.adapter,
      operator: execution.operator,
      started_at: maybe_iso(execution.started_at),
      completed_at: maybe_iso(execution.completed_at),
      created_at: DateTime.to_iso8601(execution.created_at),
      updated_at: DateTime.to_iso8601(execution.updated_at),
      context_bundle: execution.context_bundle,
      dispatch: execution.dispatch,
      result: execution.result,
      metadata: execution.metadata
    }
  end

  defp serialize_outcome(%Outcome{} = outcome) do
    %{
      id: outcome.id,
      execution_id: outcome.execution_id,
      proposal_id: outcome.proposal_id,
      project: outcome.project,
      intent: outcome.intent,
      status: Atom.to_string(outcome.status),
      summary: outcome.summary,
      details: outcome.details,
      created_at: DateTime.to_iso8601(outcome.created_at),
      metadata: outcome.metadata
    }
  end

  defp sort_key(%{created_at: dt, id: id}), do: {DateTime.to_unix(dt, :microsecond), id}

  defp maybe_parse_iso(nil), do: nil
  defp maybe_parse_iso(value), do: parse_iso!(value)

  defp parse_iso!(value) do
    {:ok, dt, _} = DateTime.from_iso8601(value)
    dt
  end

  defp maybe_iso(nil), do: nil
  defp maybe_iso(dt), do: DateTime.to_iso8601(dt)

  defp normalize_dispatch({:ok, result}), do: %{ok: true, result: result}
  defp normalize_dispatch({:error, reason}), do: %{ok: false, error: inspect(reason)}

  defp id(prefix), do: prefix <> "_" <> Base.encode16(:crypto.strong_rand_bytes(6), case: :lower)

  defp async_sync(kind, struct) do
    Task.start(fn ->
      try do
        serialized = case kind do
          :proposal -> serialize_proposal(struct)
          :execution -> serialize_execution(struct)
          :outcome -> serialize_outcome(struct)
        end

        case kind do
          :proposal -> Persistence.sync_proposal(serialized)
          :execution -> Persistence.sync_execution(serialized)
          :outcome -> Persistence.sync_outcome(serialized)
        end
      rescue
        e -> require Logger; Logger.warning("[Store] async ecto sync failed: #{Exception.message(e)}")
      end
    end)
  end
end
