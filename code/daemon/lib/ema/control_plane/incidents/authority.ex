defmodule Ema.ControlPlane.Incidents.Authority do
  @moduledoc """
  Canonical incident authority for control-plane executions.

  This GenServer is the single writer for incident state transitions. Runtime
  surfaces and operator commands may only submit observations or request actions.
  """

  use GenServer

  alias Ema.ControlPlane.Incidents.{Event, Executor, Incident, Policy}
  alias Ema.Executions.Events

  @state_file Path.expand("../../../../priv/control_plane_incidents.json", __DIR__)
  @running_statuses MapSet.new([
                      "created",
                      "queued",
                      "planning",
                      "ready",
                      "running",
                      "verifying",
                      "blocked",
                      "waiting_human",
                      "retrying",
                      :created,
                      :queued,
                      :planning,
                      :ready,
                      :running,
                      :verifying,
                      :blocked,
                      :waiting_human,
                      :retrying
                    ])
  @terminal_statuses MapSet.new([
                       "completed",
                       "failed",
                       "cancelled",
                       "timed_out",
                       "orphaned",
                       "succeeded",
                       :completed,
                       :failed,
                       :cancelled,
                       :timed_out,
                       :orphaned,
                       :succeeded
                     ])
  @progress_types MapSet.new([
                    "execution_started",
                    "execution_progress",
                    "execution_resumed",
                    "execution_ready",
                    "execution_planning_started",
                    "execution_verification_started",
                    "execution_merge_started",
                    :execution_started,
                    :execution_progress,
                    :execution_resumed,
                    :execution_ready,
                    :execution_planning_started,
                    :execution_verification_started,
                    :execution_merge_started
                  ])

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def list(opts \\ []), do: GenServer.call(__MODULE__, {:list, opts})
  def get(incident_id), do: GenServer.call(__MODULE__, {:get, incident_id})
  def recent_events(limit \\ 50), do: GenServer.call(__MODULE__, {:recent_events, limit})

  def request_action(incident_id, action, attrs \\ %{}),
    do: GenServer.call(__MODULE__, {:request_action, incident_id, action, attrs})

  def sweep(now \\ DateTime.utc_now()), do: GenServer.call(__MODULE__, {:sweep, now})

  @impl true
  def init(_opts) do
    Phoenix.PubSub.subscribe(Ema.PubSub, Events.topic())
    Phoenix.PubSub.subscribe(Ema.PubSub, Ema.Surfaces.HostTruthWatcher.topic())
    Phoenix.PubSub.subscribe(Ema.PubSub, "babysitter:all")
    state = load_state()
    schedule_sweep()
    {:ok, state}
  end

  @impl true
  def handle_call({:list, opts}, _from, state) do
    incidents =
      state.incidents
      |> Map.values()
      |> Enum.sort_by(&sort_key/1, {:desc, DateTime})
      |> maybe_filter(opts)
      |> Enum.map(&Incident.serialize/1)

    {:reply, incidents, state}
  end

  def handle_call({:get, incident_id}, _from, state) do
    reply = state.incidents |> Map.get(incident_id) |> maybe_serialize()
    {:reply, reply, state}
  end

  def handle_call({:recent_events, limit}, _from, state) do
    {:reply, state.events |> Enum.take(limit) |> Enum.map(&Event.serialize/1), state}
  end

  def handle_call({:request_action, incident_id, action, attrs}, _from, state) do
    case Map.fetch(state.incidents, incident_id) do
      {:ok, incident} ->
        now = DateTime.utc_now()
        actor = Map.get(attrs, :actor) || Map.get(attrs, "actor") || "operator"

        {updated_incident, event, extra_state} =
          apply_action(incident, normalize_action(action), attrs, actor, now)

        next_state =
          state
          |> merge_execution_metadata(extra_state)
          |> put_incident(updated_incident)
          |> append_event(event)
          |> persist_state()

        maybe_emit_execution_signal(updated_incident, event)
        maybe_execute_action(updated_incident, event)
        {:reply, {:ok, Incident.serialize(updated_incident)}, next_state}

      :error ->
        {:reply, {:error, {:not_found, :incident, incident_id}}, state}
    end
  end

  def handle_call({:sweep, now}, _from, state) do
    {next_state, opened_ids} = detect_no_progress(state, now)

    {:reply,
     %{
       opened_incident_ids: opened_ids,
       opened_count: length(opened_ids),
       swept_at: DateTime.to_iso8601(now)
     }, next_state}
  end

  @impl true
  def handle_info(:sweep, state) do
    {next_state, _opened_ids} = detect_no_progress(state, DateTime.utc_now())
    schedule_sweep()
    {:noreply, next_state}
  end

  def handle_info({:execution_event, event}, state) do
    next_state =
      state
      |> update_execution_state(event)
      |> maybe_resolve_from_execution_event(event)
      |> persist_state()

    {:noreply, next_state}
  end

  def handle_info({:host_truth_transition, event}, state) do
    next_state =
      state
      |> apply_host_truth_transition(event)
      |> persist_state()

    {:noreply, next_state}
  end

  def handle_info({:babysitter_stream_updated, snapshot}, state) do
    next_state =
      state
      |> apply_stream_observation(snapshot)
      |> persist_state()

    {:noreply, next_state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  defp detect_no_progress(state, now) do
    Enum.reduce(state.executions, {state, []}, fn {execution_id, exec_state},
                                                  {acc_state, opened_ids} ->
      status = exec_get(exec_state, :status)

      cond do
        not running_status?(status) ->
          {acc_state, opened_ids}

        snoozed_active?(active_incident_for_execution(acc_state, execution_id), now) ->
          {acc_state, opened_ids}

        true ->
          last_progress_at =
            exec_get(exec_state, :last_progress_at) || exec_get(exec_state, :started_at) ||
              exec_get(exec_state, :last_event_at)

          age_ms = DateTime.diff(now, normalize_execution_time(last_progress_at), :millisecond)

          cond do
            age_ms < Policy.no_progress_warn_ms() ->
              {acc_state, opened_ids}

            incident = active_incident_for_execution(acc_state, execution_id) ->
              refreshed = refresh_incident(incident, exec_state, age_ms, now)

              event =
                build_event(refreshed, :observation_recorded, :watchdog, %{
                  age_ms: age_ms,
                  execution_status: status
                })

              next_state =
                acc_state
                |> put_incident(refreshed)
                |> append_event(event)
                |> persist_state()

              {next_state, opened_ids}

            true ->
              incident = new_no_progress_incident(exec_state, age_ms, now)

              event =
                build_event(incident, :incident_opened, :watchdog, %{
                  age_ms: age_ms,
                  execution_status: status
                })

              next_state =
                acc_state
                |> put_incident(%{incident | last_event_id: event.event_id})
                |> append_event(event)
                |> persist_state()

              {next_state, [incident.incident_id | opened_ids]}
          end
      end
    end)
    |> then(fn {next_state, ids} -> {next_state, Enum.reverse(ids)} end)
  end

  defp new_no_progress_incident(exec_state, age_ms, now) do
    severity = if age_ms >= Policy.no_progress_error_ms(), do: :error, else: :warn
    status = exec_get(exec_state, :status)

    %Incident{
      incident_id: "inc_" <> Base.encode16(:crypto.strong_rand_bytes(6), case: :lower),
      execution_id: exec_get(exec_state, :execution_id),
      proposal_id: exec_get(exec_state, :proposal_id),
      kind: :no_progress,
      status: :open,
      severity: severity,
      owner: nil,
      detected_at: now,
      updated_at: now,
      snoozed_until: nil,
      recommended_action: "ack or restart after checking execution facts",
      evidence_summary: "no durable progress for #{age_ms}ms while execution remains #{status}",
      metadata: %{
        execution_status: status,
        last_progress_at: maybe_iso(exec_get(exec_state, :last_progress_at)),
        started_at: maybe_iso(exec_get(exec_state, :started_at)),
        last_event_type: exec_get(exec_state, :last_event_type)
      }
    }
  end

  defp refresh_incident(incident, exec_state, age_ms, now) do
    severity = if age_ms >= Policy.no_progress_error_ms(), do: :error, else: :warn
    status = exec_get(exec_state, :status)

    %{
      incident
      | severity: severity,
        updated_at: now,
        recommended_action:
          if(severity == :error,
            do: "restart or kill after verifying liveness",
            else: incident.recommended_action
          ),
        evidence_summary: "no durable progress for #{age_ms}ms while execution remains #{status}",
        metadata:
          Map.merge(incident.metadata || %{}, %{
            execution_status: status,
            last_progress_at: maybe_iso(exec_get(exec_state, :last_progress_at)),
            started_at: maybe_iso(exec_get(exec_state, :started_at)),
            last_event_type: exec_get(exec_state, :last_event_type)
          })
    }
  end

  defp apply_action(incident, :ack, _attrs, actor, now) do
    updated = %{incident | status: :acked, owner: actor, updated_at: now}
    event = build_event(updated, :incident_acked, :operator, %{actor: actor})
    {%{updated | last_event_id: event.event_id}, event, %{}}
  end

  defp apply_action(incident, :cancel, _attrs, actor, now) do
    updated = %{
      incident
      | status: :canceled,
        owner: actor,
        updated_at: now,
        recommended_action: nil
    }

    event = build_event(updated, :incident_canceled, :operator, %{actor: actor})
    {%{updated | last_event_id: event.event_id}, event, %{}}
  end

  defp apply_action(incident, :restart, _attrs, actor, now) do
    updated = %{
      incident
      | owner: actor,
        updated_at: now,
        recommended_action: "restart requested; resolve on new durable progress"
    }

    event = build_event(updated, :operator_requested_restart, :operator, %{actor: actor})

    {%{updated | last_event_id: event.event_id}, event,
     %{restart_requested_for: incident.execution_id}}
  end

  defp apply_action(incident, :kill, _attrs, actor, now) do
    updated = %{
      incident
      | owner: actor,
        updated_at: now,
        recommended_action: "kill requested; resolve on terminal execution fact"
    }

    event = build_event(updated, :operator_requested_kill, :operator, %{actor: actor})

    {%{updated | last_event_id: event.event_id}, event,
     %{kill_requested_for: incident.execution_id}}
  end

  defp apply_action(incident, :snooze, attrs, actor, now) do
    duration_ms =
      parse_duration_ms(Map.get(attrs, :duration_ms) || Map.get(attrs, "duration_ms")) ||
        Policy.default_snooze_ms()

    snoozed_until = DateTime.add(now, duration_ms, :millisecond)

    updated = %{
      incident
      | status: :snoozed,
        owner: actor,
        updated_at: now,
        snoozed_until: snoozed_until
    }

    event =
      build_event(updated, :incident_snoozed, :operator, %{actor: actor, duration_ms: duration_ms})

    {%{updated | last_event_id: event.event_id}, event, %{}}
  end

  defp apply_action(incident, action, _attrs, actor, now) do
    updated = %{incident | owner: actor, updated_at: now}

    event =
      build_event(updated, :operator_action_recorded, :operator, %{actor: actor, action: action})

    {%{updated | last_event_id: event.event_id}, event, %{}}
  end

  defp maybe_emit_execution_signal(incident, %Event{type: :operator_requested_restart}) do
    Events.emit(incident.execution_id, :execution_retry_scheduled, %{
      status: :retrying,
      phase: :dispatch,
      actor: %{type: "incident_authority", id: incident.incident_id},
      summary_line: "incident restart requested",
      payload: %{incident_id: incident.incident_id}
    })
  end

  defp maybe_emit_execution_signal(_incident, _event), do: :ok

  defp maybe_execute_action(incident, %Event{type: :operator_requested_restart}) do
    Task.start(fn ->
      _ =
        Executor.execute(incident.execution_id, :restart, %{
          actor: incident.owner,
          incident_id: incident.incident_id
        })
    end)

    :ok
  end

  defp maybe_execute_action(incident, %Event{type: :operator_requested_kill}) do
    Task.start(fn ->
      _ =
        Executor.execute(incident.execution_id, :kill, %{
          actor: incident.owner,
          incident_id: incident.incident_id
        })
    end)

    :ok
  end

  defp maybe_execute_action(_incident, _event), do: :ok

  defp update_execution_state(state, event) do
    execution_id = event[:execution_id] || event["execution_id"]

    if is_nil(execution_id),
      do: state,
      else: do_update_execution_state(state, event, execution_id)
  end

  defp do_update_execution_state(state, event, execution_id) do
    occurred_at = parse_event_time(event[:occurred_at] || event["occurred_at"])
    type = event[:type] || event["type"]
    status = event[:status] || event["status"]
    payload = event[:payload] || event["payload"] || %{}

    current =
      Map.get(state.executions, execution_id, %{
        execution_id: execution_id,
        proposal_id: payload["proposal_id"] || payload[:proposal_id],
        status: status,
        started_at: occurred_at,
        last_event_at: occurred_at,
        last_progress_at: if(progress_type?(type), do: occurred_at, else: nil),
        last_event_type: type
      })

    updated =
      current
      |> Map.put(
        :proposal_id,
        exec_get(current, :proposal_id) || payload["proposal_id"] || payload[:proposal_id]
      )
      |> Map.put(:status, status || exec_get(current, :status))
      |> Map.put(:last_event_at, occurred_at)
      |> Map.put(:last_event_type, type)
      |> maybe_put_started_at(type, occurred_at)
      |> maybe_put_progress_at(type, occurred_at)

    %{state | executions: Map.put(state.executions, execution_id, updated)}
  end

  defp maybe_resolve_from_execution_event(state, event) do
    execution_id = event[:execution_id] || event["execution_id"]
    type = event[:type] || event["type"]
    status = event[:status] || event["status"]

    cond do
      is_nil(execution_id) ->
        state

      terminal_type?(type) or terminal_status?(status) ->
        resolve_active_for_execution(state, execution_id, event)

      progress_type?(type) ->
        maybe_resolve_on_progress(state, execution_id, event)

      true ->
        state
    end
  end

  defp resolve_active_for_execution(state, execution_id, event) do
    case active_incident_for_execution(state, execution_id) do
      nil ->
        state

      incident ->
        now = parse_event_time(event[:occurred_at] || event["occurred_at"])

        payload = %{
          execution_event_type: event[:type] || event["type"],
          execution_status: event[:status] || event["status"]
        }

        updated = %{
          incident
          | status: :resolved,
            updated_at: now,
            recommended_action: nil,
            snoozed_until: nil
        }

        resolution_event = build_event(updated, :incident_resolved, :authority, payload)

        state
        |> put_incident(%{updated | last_event_id: resolution_event.event_id})
        |> append_event(resolution_event)
    end
  end

  defp maybe_resolve_on_progress(state, execution_id, event) do
    case active_incident_for_execution(state, execution_id) do
      %Incident{kind: :no_progress} = incident ->
        now = parse_event_time(event[:occurred_at] || event["occurred_at"])

        updated = %{
          incident
          | status: :resolved,
            updated_at: now,
            recommended_action: nil,
            snoozed_until: nil,
            evidence_summary: "durable progress resumed"
        }

        resolution_event =
          build_event(updated, :incident_resolved, :authority, %{
            execution_event_type: event[:type] || event["type"]
          })

        state
        |> put_incident(%{updated | last_event_id: resolution_event.event_id})
        |> append_event(resolution_event)

      _ ->
        state
    end
  end

  defp active_incident_for_execution(state, execution_id) do
    state.incidents
    |> Map.values()
    |> Enum.filter(&(&1.execution_id == execution_id and &1.status in [:open, :acked, :snoozed]))
    |> Enum.sort_by(&sort_key/1, {:desc, DateTime})
    |> List.first()
  end

  defp apply_host_truth_transition(state, event) do
    domain = event[:domain] || event["domain"] || "overall"
    to_state = event[:to] || event["to"]
    execution_id = "host-truth:" <> to_string(domain)

    cond do
      to_state in ["degraded", "stalled", :degraded, :stalled, "unhealthy", :unhealthy] ->
        existing = active_incident_for_execution(state, execution_id)
        incident = existing || new_host_truth_incident(domain, event)

        updated = %{
          incident
          | status: :open,
            severity: host_truth_severity(to_state),
            updated_at: DateTime.utc_now(),
            evidence_summary: host_truth_summary(event),
            recommended_action: "inspect host-truth anomalies before taking recovery action"
        }

        observation =
          build_event(
            updated,
            if(existing, do: :observation_recorded, else: :incident_opened),
            :host_truth,
            %{transition: event}
          )

        state
        |> put_incident(%{updated | last_event_id: observation.event_id})
        |> append_event(observation)

      to_state in ["healthy", :healthy] ->
        resolve_active_for_execution(state, execution_id, %{
          type: "host_truth_recovered",
          status: "healthy",
          occurred_at: DateTime.utc_now() |> DateTime.to_iso8601()
        })

      true ->
        state
    end
  end

  defp apply_stream_observation(state, snapshot) do
    stream = snapshot[:stream] || snapshot["stream"]
    quieted = !!(snapshot[:quieted] || snapshot["quieted"])
    reason = snapshot[:reason] || snapshot["reason"]
    activity_score = snapshot[:activity_score] || snapshot["activity_score"] || 0.0
    execution_id = "stream:" <> to_string(stream)

    cond do
      quieted and reason == "idle" ->
        existing = active_incident_for_execution(state, execution_id)
        incident = existing || new_stream_incident(stream, snapshot)

        updated = %{
          incident
          | status: :open,
            severity: :warn,
            updated_at: DateTime.utc_now(),
            evidence_summary: stream_summary(snapshot),
            recommended_action:
              "treat stream quiet as evidence only; verify execution facts before recovery"
        }

        observation =
          build_event(
            updated,
            if(existing, do: :observation_recorded, else: :incident_opened),
            :stream,
            %{snapshot: snapshot}
          )

        state
        |> put_incident(%{updated | last_event_id: observation.event_id})
        |> append_event(observation)

      activity_score > 0.0 or not quieted ->
        resolve_active_for_execution(state, execution_id, %{
          type: "stream_activity_resumed",
          status: "healthy",
          occurred_at: DateTime.utc_now() |> DateTime.to_iso8601()
        })

      true ->
        state
    end
  end

  defp running_status?(status), do: MapSet.member?(@running_statuses, status)
  defp terminal_status?(status), do: MapSet.member?(@terminal_statuses, status)
  defp progress_type?(type), do: MapSet.member?(@progress_types, type)

  defp terminal_type?(type),
    do:
      type in [
        "execution_completed",
        "execution_failed",
        "execution_cancelled",
        "execution_timed_out",
        "execution_orphaned",
        :execution_completed,
        :execution_failed,
        :execution_cancelled,
        :execution_timed_out,
        :execution_orphaned
      ]

  defp build_event(incident, type, source, payload) do
    Event.new(%{
      incident_id: incident.incident_id,
      execution_id: incident.execution_id,
      proposal_id: incident.proposal_id,
      type: type,
      source: source,
      recorded_at: DateTime.utc_now(),
      payload: payload
    })
  end

  defp append_event(state, %Event{} = event) do
    %{state | events: [event | state.events] |> Enum.take(500)}
  end

  defp put_incident(state, %Incident{} = incident) do
    %{state | incidents: Map.put(state.incidents, incident.incident_id, incident)}
  end

  defp merge_execution_metadata(state, extra) do
    execution_id = extra[:restart_requested_for] || extra[:kill_requested_for]

    if execution_id do
      executions =
        Map.update(
          state.executions,
          execution_id,
          %{execution_id: execution_id, operator_requests: [extra]},
          fn current ->
            Map.update(current, :operator_requests, [extra], &[extra | &1])
          end
        )

      %{state | executions: executions}
    else
      state
    end
  end

  defp maybe_filter(incidents, opts) do
    active_only? = Keyword.get(opts, :active, false)

    if active_only? do
      Enum.filter(incidents, &(&1.status in [:open, :acked, :snoozed]))
    else
      incidents
    end
  end

  defp maybe_serialize(nil), do: nil
  defp maybe_serialize(incident), do: Incident.serialize(incident)

  defp sort_key(incident), do: incident.updated_at

  defp schedule_sweep do
    Process.send_after(self(), :sweep, Policy.sweep_interval_ms())
  end

  defp snoozed_active?(nil, _now), do: false

  defp snoozed_active?(%Incident{status: :snoozed, snoozed_until: %DateTime{} = until}, now),
    do: DateTime.compare(until, now) == :gt

  defp snoozed_active?(_, _), do: false

  defp maybe_put_started_at(exec_state, type, occurred_at) do
    if type in ["execution_created", "execution_started", :execution_created, :execution_started] do
      Map.put(exec_state, :started_at, exec_get(exec_state, :started_at) || occurred_at)
    else
      exec_state
    end
  end

  defp maybe_put_progress_at(exec_state, type, occurred_at) do
    if progress_type?(type),
      do: Map.put(exec_state, :last_progress_at, occurred_at),
      else: exec_state
  end

  defp normalize_action(action) when is_atom(action), do: action
  defp normalize_action(action) when is_binary(action), do: String.to_atom(action)

  defp parse_duration_ms(nil), do: nil
  defp parse_duration_ms(value) when is_integer(value) and value > 0, do: value

  defp parse_duration_ms(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} when parsed > 0 -> parsed
      _ -> nil
    end
  end

  defp parse_duration_ms(_), do: nil

  defp normalize_execution_time(%DateTime{} = dt), do: dt

  defp normalize_execution_time(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, dt, _} -> dt
      _ -> DateTime.utc_now()
    end
  end

  defp normalize_execution_time(_), do: DateTime.utc_now()

  defp parse_event_time(%DateTime{} = dt), do: dt

  defp parse_event_time(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, dt, _} -> dt
      _ -> DateTime.utc_now()
    end
  end

  defp parse_event_time(_), do: DateTime.utc_now()

  defp new_host_truth_incident(domain, event) do
    now = DateTime.utc_now()

    %Incident{
      incident_id: "inc_" <> Base.encode16(:crypto.strong_rand_bytes(6), case: :lower),
      execution_id: "host-truth:" <> to_string(domain),
      proposal_id: nil,
      kind: :host_mismatch,
      status: :open,
      severity: host_truth_severity(event[:to] || event["to"]),
      owner: nil,
      detected_at: now,
      updated_at: now,
      snoozed_until: nil,
      recommended_action: "inspect host-truth anomalies before taking recovery action",
      evidence_summary: host_truth_summary(event),
      metadata: %{transition: event}
    }
  end

  defp new_stream_incident(stream, snapshot) do
    now = DateTime.utc_now()

    %Incident{
      incident_id: "inc_" <> Base.encode16(:crypto.strong_rand_bytes(6), case: :lower),
      execution_id: "stream:" <> to_string(stream),
      proposal_id: nil,
      kind: :stream_lost,
      status: :open,
      severity: :warn,
      owner: nil,
      detected_at: now,
      updated_at: now,
      snoozed_until: nil,
      recommended_action:
        "treat stream quiet as evidence only; verify execution facts before recovery",
      evidence_summary: stream_summary(snapshot),
      metadata: %{snapshot: snapshot}
    }
  end

  defp host_truth_severity(state) when state in ["stalled", :stalled, "unhealthy", :unhealthy],
    do: :error

  defp host_truth_severity(state) when state in ["degraded", :degraded], do: :warn
  defp host_truth_severity(_), do: :warn

  defp host_truth_summary(event) do
    domain = event[:domain] || event["domain"] || "overall"
    to_state = event[:to] || event["to"] || "unknown"
    headline = event[:headline] || event["headline"] || "host truth transition observed"
    "host-truth #{domain} transitioned to #{to_state}: #{headline}"
  end

  defp stream_summary(snapshot) do
    stream = snapshot[:stream] || snapshot["stream"] || "unknown"
    reason = snapshot[:reason] || snapshot["reason"] || "quiet"
    activity_score = snapshot[:activity_score] || snapshot["activity_score"] || 0.0
    "stream #{stream} observed #{reason} state with activity_score=#{activity_score}"
  end

  defp exec_get(exec_state, key) when is_map(exec_state) do
    Map.get(exec_state, key) || Map.get(exec_state, Atom.to_string(key))
  end

  defp maybe_iso(nil), do: nil
  defp maybe_iso(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp maybe_iso(value) when is_binary(value), do: value
  defp maybe_iso(value), do: to_string(value)

  defp load_state do
    with true <- File.exists?(@state_file),
         {:ok, raw} <- File.read(@state_file),
         {:ok, decoded} <- Jason.decode(raw) do
      %{
        incidents:
          Enum.into(decoded["incidents"] || %{}, %{}, fn {id, incident} ->
            {id, Incident.hydrate(incident)}
          end),
        events: Enum.map(decoded["events"] || [], &Event.hydrate/1),
        executions: decoded["executions"] || %{}
      }
    else
      _ -> %{incidents: %{}, events: [], executions: %{}}
    end
  end

  defp persist_state(state) do
    payload = %{
      incidents:
        Enum.into(state.incidents, %{}, fn {id, incident} ->
          {id, Incident.serialize(incident)}
        end),
      events: Enum.map(state.events, &Event.serialize/1),
      executions: state.executions
    }

    @state_file |> Path.dirname() |> File.mkdir_p!()
    File.write!(@state_file, Jason.encode_to_iodata!(payload, pretty: true))
    state
  end
end
