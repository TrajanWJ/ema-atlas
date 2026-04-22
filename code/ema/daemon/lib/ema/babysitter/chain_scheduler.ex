defmodule Ema.Babysitter.ChainScheduler do
  @moduledoc """
  Independent-first autonomous chain scheduler for the babysitter environment.

  This scheduler sits above `StreamTicker` and manages named autonomous chains
  with explicit START/STOP controls, bounded cadence buckets, Hermes-backed
  optional generation, and lightweight cross-chain awareness.
  """

  use GenServer

  alias Ema.Babysitter.StreamChannels
  alias Ema.Babysitter.StreamTicker
  alias Ema.Feedback.Broadcast
  alias Ema.Surfaces.HermesClient

  @type chain_status :: :running | :paused | :stopped | :error

  @default_profiles %{
    "operator-rollup" => %{
      stream: "babysitter-live",
      lane: :operator_rollup,
      cadence_bucket: :fast,
      priority: 100,
      visibility_mode: :operator_rollup,
      executor: :local,
      description: "Visible work/orchestrator rollup for the current babysitter environment."
    },
    "hermes-watch" => %{
      stream: "babysitter-live",
      lane: :operator_rollup,
      cadence_bucket: :medium,
      priority: 90,
      visibility_mode: :operator_rollup,
      executor: :hermes,
      description: "Hermes-backed autonomous orchestration watcher."
    },
    "model-routing" => %{
      stream: "babysitter-ops",
      lane: :operations,
      cadence_bucket: :slow,
      priority: 70,
      visibility_mode: :ops,
      executor: :hermes,
      description: "Model/harness/agent routing observations."
    },
    "attention-sentry" => %{
      stream: "babysitter-alerts",
      lane: :attention,
      cadence_bucket: :medium,
      priority: 95,
      visibility_mode: :attention,
      executor: :local,
      description: "Escalation and operator-attention sentry."
    }
  }

  defstruct [
    :id,
    :profile,
    :stream,
    :lane,
    :cadence_bucket,
    :status,
    :autonomous_enabled,
    :requested_next_tick_at,
    :next_tick_at,
    :last_tick_at,
    :last_event_at,
    :parent_chain_id,
    :related_chain_ids,
    :activity_score,
    :token_pressure,
    :priority,
    :visibility_mode,
    :last_summary,
    :last_control_command,
    :timer_ref,
    :executor,
    :description,
    :emit_count,
    :last_error,
    :metadata
  ]

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: Keyword.get(opts, :name, __MODULE__))
  end

  @spec snapshot(GenServer.server()) :: map()
  def snapshot(server \\ __MODULE__), do: GenServer.call(server, :snapshot)

  @spec list_chains(GenServer.server()) :: [map()]
  def list_chains(server \\ __MODULE__), do: GenServer.call(server, :list_chains)

  @spec chain_status(String.t(), GenServer.server()) :: {:ok, map()} | {:error, :not_found}
  def chain_status(id, server \\ __MODULE__), do: GenServer.call(server, {:chain_status, id})

  @spec start_chain(String.t(), map(), GenServer.server()) :: {:ok, map()} | {:error, term()}
  def start_chain(id_or_profile, opts \\ %{}, server \\ __MODULE__) when is_binary(id_or_profile) and is_map(opts) do
    GenServer.call(server, {:start_chain, id_or_profile, opts})
  end

  @spec stop_chain(String.t(), GenServer.server()) :: {:ok, map()} | {:error, :not_found}
  def stop_chain(id, server \\ __MODULE__), do: GenServer.call(server, {:stop_chain, id})

  @spec pause_chain(String.t(), GenServer.server()) :: {:ok, map()} | {:error, :not_found}
  def pause_chain(id, server \\ __MODULE__), do: GenServer.call(server, {:pause_chain, id})

  @spec resume_chain(String.t(), GenServer.server()) :: {:ok, map()} | {:error, :not_found}
  def resume_chain(id, server \\ __MODULE__), do: GenServer.call(server, {:resume_chain, id})

  @spec set_tick_hint(String.t(), map(), GenServer.server()) :: {:ok, map()} | {:error, term()}
  def set_tick_hint(id, attrs, server \\ __MODULE__) when is_binary(id) and is_map(attrs) do
    GenServer.call(server, {:set_tick_hint, id, attrs})
  end

  @spec profile_registry() :: map()
  def profile_registry, do: @default_profiles

  @impl true
  def init(_opts) do
    {:ok,
     %{
       chains: %{},
       last_operator_emit_at: nil,
       hermes_status: %{status: :unknown, base_url: HermesClient.base_url(), model: HermesClient.configured_model(), models: [], error: nil}
     }}
  end

  @impl true
  def handle_call(:snapshot, _from, state) do
    {:reply, build_snapshot(state), state}
  end

  def handle_call(:list_chains, _from, state) do
    {:reply, state.chains |> Map.values() |> Enum.map(&serialize_chain/1), state}
  end

  def handle_call({:chain_status, id}, _from, state) do
    case Map.get(state.chains, id) do
      nil -> {:reply, {:error, :not_found}, state}
      chain -> {:reply, {:ok, serialize_chain(chain)}, state}
    end
  end

  def handle_call({:start_chain, id_or_profile, opts}, _from, state) do
    now = DateTime.utc_now()
    {chain, state} = upsert_chain(state, id_or_profile, opts, now)
    emit_control_message(:start, chain)
    {:reply, {:ok, serialize_chain(chain)}, state}
  end

  def handle_call({:stop_chain, id}, _from, state) do
    case Map.get(state.chains, id) do
      nil -> {:reply, {:error, :not_found}, state}
      chain ->
        cancel_timer(chain.timer_ref)
        stopped = %{chain | status: :stopped, autonomous_enabled: false, timer_ref: nil, next_tick_at: nil, last_control_command: "STOP"}
        emit_control_message(:stop, stopped)
        {:reply, {:ok, serialize_chain(stopped)}, put_in(state.chains[id], stopped)}
    end
  end

  def handle_call({:pause_chain, id}, _from, state) do
    case Map.get(state.chains, id) do
      nil -> {:reply, {:error, :not_found}, state}
      chain ->
        cancel_timer(chain.timer_ref)
        paused = %{chain | status: :paused, autonomous_enabled: false, timer_ref: nil, next_tick_at: nil, last_control_command: "PAUSE"}
        emit_control_message(:pause, paused)
        {:reply, {:ok, serialize_chain(paused)}, put_in(state.chains[id], paused)}
    end
  end

  def handle_call({:resume_chain, id}, _from, state) do
    case Map.get(state.chains, id) do
      nil -> {:reply, {:error, :not_found}, state}
      chain ->
        now = DateTime.utc_now()
        resumed = chain |> Map.put(:status, :running) |> Map.put(:autonomous_enabled, true) |> Map.put(:last_control_command, "RESUME")
        {rescheduled, next_state} = reschedule_chain(%{state | chains: Map.put(state.chains, id, resumed)}, resumed, now)
        emit_control_message(:resume, rescheduled)
        {:reply, {:ok, serialize_chain(rescheduled)}, next_state}
    end
  end

  def handle_call({:set_tick_hint, id, attrs}, _from, state) do
    case Map.get(state.chains, id) do
      nil -> {:reply, {:error, :not_found}, state}
      chain ->
        hinted = apply_hint(chain, attrs)

        if chain.status == :running and chain.autonomous_enabled do
          now = DateTime.utc_now()
          {rescheduled, next_state} = reschedule_chain(%{state | chains: Map.put(state.chains, id, hinted)}, hinted, now)
          {:reply, {:ok, serialize_chain(rescheduled)}, next_state}
        else
          updated = %{hinted | next_tick_at: nil}
          {:reply, {:ok, serialize_chain(updated)}, %{state | chains: Map.put(state.chains, id, updated)}}
        end
    end
  end

  @impl true
  def handle_info({:chain_tick, id}, state) do
    case Map.get(state.chains, id) do
      %__MODULE__{status: :running, autonomous_enabled: true} = chain ->
        now = DateTime.utc_now()
        {updated, next_state} = execute_tick(state, chain, now)
        {:noreply, next_state}

      _ ->
        {:noreply, state}
    end
  end

  def handle_info(_msg, state), do: {:noreply, state}

  defp upsert_chain(state, id_or_profile, opts, now) do
    {id, profile_key, profile} = resolve_chain_identity(id_or_profile, opts)
    existing = Map.get(state.chains, id)
    bucket = normalize_bucket(Map.get(opts, "cadence_bucket") || Map.get(opts, :cadence_bucket) || profile.cadence_bucket)
    metadata = StreamChannels.bucket_metadata(bucket)

    stream = Map.get(opts, "stream") || Map.get(opts, :stream) || profile.stream
    lane = Map.get(opts, "lane") || Map.get(opts, :lane) || profile.lane
    related_chain_ids = List.wrap(Map.get(opts, "related_chain_ids") || Map.get(opts, :related_chain_ids) || profile[:related_chain_ids] || [])

    chain =
      struct(existing || %__MODULE__{}, %{
        id: id,
        profile: profile_key,
        stream: stream,
        lane: lane,
        cadence_bucket: bucket,
        status: :running,
        autonomous_enabled: true,
        parent_chain_id: Map.get(opts, "parent_chain_id") || Map.get(opts, :parent_chain_id),
        related_chain_ids: related_chain_ids,
        activity_score: Map.get(opts, "activity_score") || Map.get(opts, :activity_score) || 0.0,
        token_pressure: Map.get(opts, "token_pressure") || Map.get(opts, :token_pressure) || 0.0,
        priority: Map.get(opts, "priority") || Map.get(opts, :priority) || profile.priority,
        visibility_mode: Map.get(opts, "visibility_mode") || Map.get(opts, :visibility_mode) || profile.visibility_mode,
        last_control_command: "START",
        executor: Map.get(opts, "executor") || Map.get(opts, :executor) || profile.executor,
        description: Map.get(opts, "description") || Map.get(opts, :description) || profile.description,
        emit_count: (existing && existing.emit_count) || 0,
        last_error: existing && existing.last_error,
        metadata: Map.merge((existing && existing.metadata) || %{}, %{
          "cadence_bounds" => %{min_interval_ms: metadata.min_interval_ms, base_interval_ms: metadata.base_interval_ms, max_interval_ms: metadata.max_interval_ms}
        })
      })
      |> apply_hint(opts)

    StreamTicker.update_stream(stream, %{
      min_interval_ms: metadata.min_interval_ms,
      base_interval_ms: metadata.base_interval_ms,
      max_interval_ms: metadata.max_interval_ms,
      manual_interval_ms: nil
    })

    reschedule_chain(%{state | chains: Map.put(state.chains, id, chain)}, chain, now)
  end

  defp resolve_chain_identity(id_or_profile, opts) do
    profile = Map.get(opts, "profile") || Map.get(opts, :profile)

    cond do
      Map.has_key?(@default_profiles, id_or_profile) ->
        {id_or_profile, id_or_profile, Map.fetch!(@default_profiles, id_or_profile)}

      is_binary(profile) and Map.has_key?(@default_profiles, profile) ->
        {id_or_profile, profile, Map.fetch!(@default_profiles, profile)}

      true ->
        {id_or_profile, "operator-rollup", Map.fetch!(@default_profiles, "operator-rollup")}
    end
  end

  defp normalize_bucket(bucket) when is_atom(bucket) do
    if Map.has_key?(StreamChannels.cadence_bucket_registry(), bucket), do: bucket, else: :medium
  end

  defp normalize_bucket(bucket) when is_binary(bucket) do
    case Enum.find(StreamChannels.cadence_bucket_registry(), fn {key, _meta} -> Atom.to_string(key) == bucket end) do
      {key, _meta} -> key
      nil -> :medium
    end
  end

  defp reschedule_chain(state, chain, now) do
    cancel_timer(chain.timer_ref)
    delay_ms = compute_delay_ms(chain, state, now)
    next_tick_at = DateTime.add(now, delay_ms, :millisecond)
    timer_ref = Process.send_after(self(), {:chain_tick, chain.id}, delay_ms)
    updated = %{chain | timer_ref: timer_ref, next_tick_at: next_tick_at}
    {updated, %{state | chains: Map.put(state.chains, chain.id, updated)}}
  end

  defp compute_delay_ms(chain, state, now) do
    bucket = StreamChannels.bucket_metadata(chain.cadence_bucket)
    requested_delay = requested_delay_ms(chain.requested_next_tick_at, now)
    active_count = state.chains |> Map.values() |> Enum.count(&(&1.status == :running and &1.autonomous_enabled))
    related_active = state.chains |> Map.values() |> Enum.count(fn other -> other.id in chain.related_chain_ids and other.status == :running end)

    base_delay = requested_delay || bucket.base_interval_ms
    fairness_penalty = if active_count > 2, do: min((active_count - 2) * 5_000, 30_000), else: 0
    related_penalty = if related_active > 0, do: min(related_active * 3_000, 15_000), else: 0

    hermes_penalty =
      if chain.executor == :hermes and get_in(state, [:hermes_status, :status]) not in [:ready, "ready"] do
        round(bucket.base_interval_ms * 0.5)
      else
        0
      end

    clamp(base_delay + fairness_penalty + related_penalty + hermes_penalty, bucket.min_interval_ms, bucket.max_interval_ms)
  end

  defp execute_tick(state, chain, now) do
    state = maybe_refresh_hermes_status(state, chain)
    scheduler_snapshot = build_snapshot(state)

    {summary, next_tick_hint_ms, error} =
      case chain.executor do
        :hermes ->
          case HermesClient.generate_chain_update(chain, scheduler_snapshot) do
            {:ok, %{summary: summary, next_tick_hint_ms: hint}} -> {summary, hint, nil}
            {:error, reason} -> {HermesClient.fallback_summary(chain, scheduler_snapshot), nil, inspect(reason)}
          end

        _ ->
          {local_summary(chain, scheduler_snapshot), nil, nil}
      end

    updated =
      chain
      |> Map.put(:last_tick_at, now)
      |> Map.put(:last_event_at, now)
      |> Map.put(:last_summary, summary)
      |> Map.put(:emit_count, chain.emit_count + 1)
      |> Map.put(:last_error, error)
      |> maybe_apply_hint_ms(next_tick_hint_ms, now)

    StreamTicker.record_activity(updated.stream, %{source: "chain_tick", body: summary, state_changed: true, weight: 2.5})

    {rescheduled, next_state} =
      reschedule_chain(%{state | chains: Map.put(state.chains, updated.id, updated)}, updated, now)

    emit_tick_message(rescheduled, scheduler_snapshot)
    {rescheduled, next_state}
  end

  defp maybe_refresh_hermes_status(state, %{executor: :hermes}) do
    hermes_status =
      case HermesClient.status(timeout: 2_500) do
        {:ok, info} -> info
        {:error, info} -> info
      end

    Map.put(state, :hermes_status, hermes_status)
  end

  defp maybe_refresh_hermes_status(state, _chain), do: state

  defp build_snapshot(state) do
    hermes_status = Map.get(state, :hermes_status, %{status: :unknown, base_url: HermesClient.base_url(), model: HermesClient.configured_model(), models: [], error: nil})

    active_chains =
      state.chains
      |> Map.values()
      |> Enum.filter(&(&1.status == :running and &1.autonomous_enabled))
      |> Enum.map(&serialize_chain/1)

    %{
      active_count: length(active_chains),
      chains: active_chains,
      hermes_status: hermes_status,
      profiles: @default_profiles
    }
  end

  defp serialize_chain(chain) do
    %{
      id: chain.id,
      profile: chain.profile,
      stream: chain.stream,
      lane: chain.lane,
      cadence_bucket: chain.cadence_bucket,
      status: chain.status,
      autonomous_enabled: chain.autonomous_enabled,
      requested_next_tick_at: chain.requested_next_tick_at,
      next_tick_at: chain.next_tick_at,
      last_tick_at: chain.last_tick_at,
      last_event_at: chain.last_event_at,
      parent_chain_id: chain.parent_chain_id,
      related_chain_ids: chain.related_chain_ids,
      activity_score: chain.activity_score,
      token_pressure: chain.token_pressure,
      priority: chain.priority,
      visibility_mode: chain.visibility_mode,
      last_summary: chain.last_summary,
      last_control_command: chain.last_control_command,
      executor: chain.executor,
      description: chain.description,
      emit_count: chain.emit_count,
      last_error: chain.last_error,
      metadata: chain.metadata
    }
  end

  defp local_summary(chain, snapshot) do
    hermes = snapshot.hermes_status
    hermes_text = "Hermes=#{hermes.status}"
    related = Enum.join(chain.related_chain_ids, ", ")
    related_text = if related == "", do: "no related chains", else: "aware of #{related}"
    "#{chain.id} tick ##{chain.emit_count + 1} · #{chain.cadence_bucket} · #{related_text} · active=#{snapshot.active_count} · #{hermes_text}"
  end

  defp emit_control_message(action, chain) do
    body =
      case action do
        :start -> "▶️ START #{chain.id} · #{chain.cadence_bucket} · executor=#{chain.executor} · stream=#{chain.stream}"
        :stop -> "⏹️ STOP #{chain.id} · stream=#{chain.stream}"
        :pause -> "⏸️ PAUSE #{chain.id} · stream=#{chain.stream}"
        :resume -> "⏯️ RESUME #{chain.id} · #{chain.cadence_bucket} · executor=#{chain.executor}"
      end

    Broadcast.emit(:babysitter_live, body)
  end

  defp emit_tick_message(chain, snapshot) do
    message =
      "🧠 #{chain.id} · #{chain.last_summary}\n-# bucket=#{chain.cadence_bucket} · next=#{format_dt(chain.next_tick_at)} · active=#{snapshot.active_count}"

    Broadcast.emit(:babysitter_live, message)
  end

  defp requested_delay_ms(nil, _now), do: nil
  defp requested_delay_ms(%DateTime{} = dt, now) do
    ms = DateTime.diff(dt, now, :millisecond)
    if ms > 0, do: ms, else: nil
  end

  defp maybe_apply_hint_ms(chain, nil, _now), do: chain
  defp maybe_apply_hint_ms(chain, ms, now) when is_integer(ms) and ms > 0 do
    %{chain | requested_next_tick_at: DateTime.add(now, ms, :millisecond)}
  end

  defp maybe_apply_hint_ms(chain, _other, _now), do: chain

  defp apply_hint(chain, attrs) do
    hint_ms = extract_hint_ms(attrs)
    requested_at = Map.get(attrs, "requested_next_tick_at") || Map.get(attrs, :requested_next_tick_at)

    cond do
      is_integer(hint_ms) and hint_ms > 0 ->
        %{chain | requested_next_tick_at: DateTime.add(DateTime.utc_now(), hint_ms, :millisecond)}

      match?(%DateTime{}, requested_at) ->
        %{chain | requested_next_tick_at: requested_at}

      is_binary(requested_at) ->
        case DateTime.from_iso8601(requested_at) do
          {:ok, dt, _} -> %{chain | requested_next_tick_at: dt}
          _ -> chain
        end

      true ->
        chain
    end
  end

  defp extract_hint_ms(attrs) do
    value = Map.get(attrs, "next_tick_hint_ms") || Map.get(attrs, :next_tick_hint_ms) || Map.get(attrs, "interval_ms") || Map.get(attrs, :interval_ms)

    cond do
      is_integer(value) and value > 0 -> value
      is_float(value) and value > 0 -> round(value)
      is_binary(value) ->
        case Integer.parse(value) do
          {parsed, ""} when parsed > 0 -> parsed
          _ -> nil
        end
      true -> nil
    end
  end

  defp format_dt(nil), do: "unscheduled"
  defp format_dt(%DateTime{} = dt), do: DateTime.to_iso8601(dt)

  defp cancel_timer(nil), do: :ok
  defp cancel_timer(timer_ref), do: Process.cancel_timer(timer_ref, async: true, info: false)

  defp clamp(value, min_value, _max_value) when value < min_value, do: min_value
  defp clamp(value, _min_value, max_value) when value > max_value, do: max_value
  defp clamp(value, _min_value, _max_value), do: value
end
