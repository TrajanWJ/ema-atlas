defmodule Ema.Babysitter.StreamTicker do
  @moduledoc """
  Adaptive babysitter cadence manager.

  It tracks per-stream activity, token pressure, semantic metadata, and
  configuration. Cadence decisions are shaped by:

    * semantic lane metadata from `StreamChannels`
    * cadence bucket defaults and bounds
    * manual overrides
    * recent weighted activity in the rolling activity window
    * stream idleness
    * token pressure

  Lower activity and higher token pressure both quiet the babysitter, while high
  activity promotes streams toward tighter cadence.
  """

  use GenServer

  alias Ema.Babysitter.ChannelPolicy
  alias Ema.Babysitter.StreamChannels
  alias Ema.Babysitter.TickRenderer
  alias Ema.Babysitter.TickRouter
  alias Phoenix.PubSub

  @type activity_sample :: %{
          at: DateTime.t(),
          weight: float(),
          message_count: non_neg_integer(),
          token_pressure: float(),
          source: String.t()
        }

  @type interval_decision :: %{
          ms: pos_integer(),
          effective_interval_ms: pos_integer(),
          next_tick_at: DateTime.t(),
          quieted: boolean(),
          reason: String.t(),
          activity_score: float(),
          promotion_reason: String.t() | nil,
          suppression_reason: String.t() | nil,
          lane: atom(),
          cadence_bucket: atom()
        }

  @type stream_state :: %{
          stream: String.t(),
          config: map(),
          metadata: map(),
          timer_ref: reference() | nil,
          last_interval_ms: pos_integer(),
          effective_interval_ms: pos_integer(),
          last_tick_at: DateTime.t() | nil,
          last_event_at: DateTime.t() | nil,
          next_tick_at: DateTime.t() | nil,
          recent_samples: [activity_sample()],
          tick_count: non_neg_integer(),
          token_pressure: float(),
          activity_score: float(),
          quieted: boolean(),
          reason: String.t(),
          promotion_reason: String.t() | nil,
          suppression_reason: String.t() | nil,
          emission_policy: map() | nil,
          current_route: atom() | nil,
          current_route_since: DateTime.t() | nil,
          promoted_at: DateTime.t() | nil,
          demotion_eligible_at: DateTime.t() | nil,
          last_transition: map() | nil,
          transition_reason: String.t() | nil,
          last_decision: map() | nil,
          recent_records: [map()],
          coalesce_groups: map()
        }

  def start_link(opts \\ []) do
    {name, init_opts} = Keyword.pop(opts, :name, __MODULE__)
    server_opts = if name, do: [name: name], else: []
    GenServer.start_link(__MODULE__, init_opts, server_opts)
  end

  def snapshot(server \\ __MODULE__) do
    GenServer.call(server, :snapshot)
  end

  def stream_snapshot(stream, server \\ __MODULE__) do
    GenServer.call(server, {:stream_snapshot, stream})
  end

  def update_stream(stream, attrs, server \\ __MODULE__) when is_map(attrs) do
    GenServer.call(server, {:update_stream, stream, attrs})
  end

  def ingest_activity(stream, attrs \\ %{}, server \\ __MODULE__) when is_map(attrs) do
    GenServer.call(server, {:ingest_activity, stream, attrs})
  end

  def record_activity(stream, attrs \\ %{}, server \\ __MODULE__) when is_map(attrs) do
    GenServer.cast(server, {:record_activity, stream, attrs})
  end

  def force_tick(stream, server \\ __MODULE__) do
    GenServer.call(server, {:force_tick, stream})
  end

  @impl true
  def init(opts) do
    now = now_from(opts)

    streams =
      Map.new(StreamChannels.stream_names(), fn stream ->
        stream_state = build_stream_state(stream)
        {stream, reschedule(stream_state, now)}
      end)

    {:ok, %{streams: streams}}
  end

  @impl true
  def handle_call(:snapshot, _from, state) do
    {:reply, render_snapshot(state), state}
  end

  def handle_call({:stream_snapshot, stream}, _from, state) do
    {:reply, render_stream(Map.get(state.streams, stream)), state}
  end

  def handle_call({:update_stream, stream, attrs}, _from, state) do
    now = DateTime.utc_now()
    {stream_state, state} = ensure_stream(state, stream)

    updated =
      stream_state
      |> Map.put(:config, StreamChannels.merge_config(stream_state.config, attrs))
      |> reschedule(now)

    publish_stream_update(updated)
    {:reply, render_stream(updated), put_stream(state, updated)}
  end

  def handle_call({:ingest_activity, stream, attrs}, _from, state) do
    now = DateTime.utc_now()
    {updated, next_state} = apply_activity(state, stream, attrs, now)
    publish_stream_update(updated)
    {:reply, render_stream(updated), next_state}
  end

  def handle_call({:force_tick, stream}, _from, state) do
    now = DateTime.utc_now()
    {stream_state, state} = ensure_stream(state, stream)
    updated = tick(stream_state, now)
    publish_stream_update(updated)
    {:reply, render_stream(updated), put_stream(state, updated)}
  end

  @impl true
  def handle_cast({:record_activity, stream, attrs}, state) do
    now = DateTime.utc_now()
    {updated, next_state} = apply_activity(state, stream, attrs, now)
    publish_stream_update(updated)
    {:noreply, next_state}
  end

  @impl true
  def handle_info({:stream_tick, stream}, state) do
    now = DateTime.utc_now()

    case Map.fetch(state.streams, stream) do
      {:ok, stream_state} ->
        updated = tick(stream_state, now)
        publish_stream_update(updated)
        {:noreply, put_stream(state, updated)}

      :error ->
        {:noreply, state}
    end
  end

  defp apply_activity(state, stream, attrs, now) do
    {stream_state, state} = ensure_stream(state, stream)
    sample = normalize_activity(attrs, now, stream_state.token_pressure)
    recent_samples = [sample | trim_samples(stream_state.recent_samples, now, stream_state.config.activity_window_ms)]

    routed_state =
      stream_state
      |> route_activity(attrs, now)
      |> Map.put(:recent_samples, recent_samples)
      |> Map.put(:last_event_at, if(sample.weight > 0, do: now, else: stream_state.last_event_at))
      |> Map.put(:token_pressure, sample.token_pressure)

    updated = reschedule(routed_state, now)

    {updated, put_stream(state, updated)}
  end

  defp build_stream_state(stream) do
    config = StreamChannels.default_config(stream)
    metadata = StreamChannels.stream_metadata(stream)

    %{
      stream: stream,
      config: config,
      metadata: metadata,
      timer_ref: nil,
      last_interval_ms: config.base_interval_ms,
      effective_interval_ms: config.base_interval_ms,
      last_tick_at: nil,
      last_event_at: nil,
      next_tick_at: nil,
      recent_samples: [],
      tick_count: 0,
      token_pressure: 0.0,
      activity_score: 0.0,
      quieted: false,
      reason: "base",
      promotion_reason: nil,
      suppression_reason: nil,
      emission_policy: nil,
      current_route: nil,
      current_route_since: nil,
      promoted_at: nil,
      demotion_eligible_at: nil,
      last_transition: nil,
      transition_reason: nil,
      last_decision: nil,
      recent_records: [],
      coalesce_groups: %{}
    }
  end

  defp ensure_stream(state, stream) do
    case Map.fetch(state.streams, stream) do
      {:ok, stream_state} -> {stream_state, state}
      :error ->
        stream_state = build_stream_state(stream)
        {stream_state, put_stream(state, stream_state)}
    end
  end

  defp put_stream(state, stream_state) do
    %{state | streams: Map.put(state.streams, stream_state.stream, stream_state)}
  end

  defp tick(stream_state, now) do
    stream_state
    |> Map.put(:last_tick_at, now)
    |> Map.update!(:tick_count, &(&1 + 1))
    |> reschedule(now)
  end

  defp reschedule(stream_state, now) do
    recent_samples = trim_samples(stream_state.recent_samples, now, stream_state.config.activity_window_ms)
    decision = next_interval(%{stream_state | recent_samples: recent_samples}, now)
    emission_policy = ChannelPolicy.classify(%{stream_state | activity_score: decision.activity_score, quieted: decision.quieted}, now: now)

    cancel_timer(stream_state.timer_ref)
    timer_ref = Process.send_after(self(), {:stream_tick, stream_state.stream}, decision.ms)

    stream_state
    |> Map.put(:timer_ref, timer_ref)
    |> Map.put(:last_interval_ms, decision.ms)
    |> Map.put(:effective_interval_ms, decision.effective_interval_ms)
    |> Map.put(:next_tick_at, decision.next_tick_at)
    |> Map.put(:quieted, decision.quieted)
    |> Map.put(:reason, decision.reason)
    |> Map.put(:promotion_reason, decision.promotion_reason)
    |> Map.put(:suppression_reason, decision.suppression_reason)
    |> Map.put(:activity_score, decision.activity_score)
    |> Map.put(:recent_samples, recent_samples)
    |> Map.put(:emission_policy, emission_policy)
  end

  defp next_interval(stream_state, now) do
    config = stream_state.config
    metadata = stream_state.metadata
    manual? = is_integer(config.manual_interval_ms) and config.manual_interval_ms > 0
    activity_score = activity_score(stream_state.recent_samples)
    idle_seconds = seconds_since(stream_state.last_event_at, now)
    token_pressure = stream_state.token_pressure

    activity_multiplier =
      cond do
        activity_score >= 12.0 -> 0.45
        activity_score >= 6.0 -> 0.7
        activity_score >= 2.0 -> 1.0
        activity_score > 0.0 -> 1.25
        true -> 1.6
      end

    idle_multiplier =
      cond do
        idle_seconds >= 1_800 -> 2.5
        idle_seconds >= 900 -> 2.0
        idle_seconds >= 300 -> 1.5
        true -> 1.0
      end

    token_multiplier =
      cond do
        token_pressure >= min(config.token_pressure_threshold + 0.2, 1.0) -> 2.2
        token_pressure >= config.token_pressure_threshold -> 1.6
        token_pressure >= 0.4 -> 1.2
        true -> 1.0
      end

    {interval_ms, quieted, promotion_reason, suppression_reason, reason} =
      if manual? do
        {config.manual_interval_ms, false, "manual_override", nil, "manual"}
      else
        raw = round(config.base_interval_ms * activity_multiplier * idle_multiplier * token_multiplier)
        interval_ms = clamp(raw, config.min_interval_ms, config.max_interval_ms)
        suppression_reason = suppression_reason(activity_score, idle_seconds, token_pressure, config)
        promotion_reason = promotion_reason(activity_score, token_pressure, interval_ms, metadata)
        quieted? = not is_nil(suppression_reason)
        reason = compose_reason(promotion_reason, suppression_reason, quieted?)
        {interval_ms, quieted?, promotion_reason, suppression_reason, reason}
      end

    %{
      ms: interval_ms,
      effective_interval_ms: interval_ms,
      next_tick_at: DateTime.add(now, interval_ms, :millisecond),
      quieted: quieted,
      reason: reason,
      activity_score: activity_score,
      promotion_reason: promotion_reason,
      suppression_reason: suppression_reason,
      lane: metadata.lane,
      cadence_bucket: metadata.cadence_bucket
    }
  end

  defp compose_reason("manual_override", _suppression_reason, _quieted), do: "manual"
  defp compose_reason(_promotion_reason, suppression_reason, true) when is_binary(suppression_reason), do: suppression_reason
  defp compose_reason(promotion_reason, _suppression_reason, false) when is_binary(promotion_reason), do: "active"
  defp compose_reason(_promotion_reason, _suppression_reason, false), do: "active"
  defp compose_reason(_promotion_reason, suppression_reason, _quieted), do: suppression_reason || "quieted"

  defp promotion_reason(activity_score, token_pressure, interval_ms, metadata) do
    cond do
      activity_score >= 12.0 -> "surge_activity"
      activity_score >= 6.0 -> "high_activity"
      token_pressure < 0.4 and interval_ms <= metadata.cadence_bounds.base_interval_ms -> "within_#{metadata.cadence_bucket}_bucket"
      activity_score > 0.0 -> "recent_activity"
      true -> nil
    end
  end

  defp suppression_reason(activity_score, idle_seconds, token_pressure, config) do
    signal_floor = Map.get(config, :signal_floor, 2.0)

    cond do
      token_pressure >= config.token_pressure_threshold -> "token_pressure"
      idle_seconds >= 300 -> "idle"
      activity_score < signal_floor -> "quieted"
      true -> nil
    end
  end

  defp trim_samples(samples, now, window_ms) do
    cutoff = DateTime.add(now, -window_ms, :millisecond)
    Enum.filter(samples, &(DateTime.compare(&1.at, cutoff) != :lt))
  end

  defp activity_score(samples) do
    samples
    |> Enum.reduce(0.0, fn sample, acc -> acc + sample.weight end)
    |> Float.round(2)
  end

  defp normalize_activity(attrs, now, fallback_token_pressure) do
    token_pressure =
      attrs
      |> extract_token_pressure(fallback_token_pressure)
      |> clamp(0.0, 1.0)

    message_count = positive_integer(get_value(attrs, [:message_count, "message_count", :messages, "messages"]))
    event_count = positive_integer(get_value(attrs, [:event_count, "event_count", :events, "events"]))
    token_count = positive_integer(get_value(attrs, [:token_count, "token_count", :tokens, "tokens"]))

    text_weight =
      case get_value(attrs, [:body, "body", :text, "text", :content, "content"]) do
        value when is_binary(value) and byte_size(value) > 0 -> 1.0
        _ -> 0.0
      end

    source =
      case get_value(attrs, [:source, "source", :channel, "channel"]) do
        value when is_binary(value) and byte_size(value) > 0 -> value
        _ -> "runtime"
      end

    quiet_hint? = truthy?(get_value(attrs, [:quiet, "quiet", :quiet_hint, "quiet_hint"]))
    urgent? = truthy?(get_value(attrs, [:urgent, "urgent", :priority, "priority"]))

    explicit_weight =
      case get_value(attrs, [:weight, "weight"]) do
        value when is_integer(value) and value > 0 -> value / 1
        value when is_float(value) and value > 0.0 -> value
        value when is_binary(value) ->
          case Float.parse(value) do
            {parsed, ""} when parsed > 0.0 -> parsed
            _ -> nil
          end

        _ -> nil
      end

    derived_weight =
      message_count * 1.5 +
        event_count * 1.0 +
        min(token_count / 500.0, 4.0) +
        text_weight +
        if(urgent?, do: 2.0, else: 0.0)

    weight = explicit_weight || derived_weight
    weight = if quiet_hint?, do: max(weight * 0.5, 0.5), else: weight

    %{
      at: now,
      weight: Float.round(weight, 2),
      message_count: message_count,
      token_pressure: token_pressure,
      source: source
    }
  end

  defp extract_token_pressure(attrs, fallback) do
    explicit = get_value(attrs, [:token_pressure, "token_pressure", :pressure, "pressure"])

    cond do
      is_integer(explicit) -> explicit / 1
      is_float(explicit) -> explicit
      is_binary(explicit) ->
        case Float.parse(explicit) do
          {parsed, ""} -> parsed
          _ -> token_ratio_from_counts(attrs, fallback)
        end

      true ->
        token_ratio_from_counts(attrs, fallback)
    end
  end

  defp token_ratio_from_counts(attrs, fallback) do
    token_count = positive_integer(get_value(attrs, [:token_count, "token_count", :tokens, "tokens"]))
    token_budget = positive_integer(get_value(attrs, [:token_budget, "token_budget", :budget, "budget"]))

    cond do
      token_count > 0 and token_budget > 0 -> token_count / token_budget
      true -> fallback
    end
  end

  defp get_value(attrs, keys) do
    Enum.find_value(keys, fn key -> Map.get(attrs, key) end)
  end

  defp positive_integer(nil), do: 0
  defp positive_integer(value) when is_integer(value) and value > 0, do: value

  defp positive_integer(value) when is_float(value) and value > 0 do
    trunc(value)
  end

  defp positive_integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} when parsed > 0 -> parsed
      _ -> 0
    end
  end

  defp positive_integer(_), do: 0

  defp truthy?(value) when value in [true, 1, "1", "true", "yes", "on"], do: true
  defp truthy?(_), do: false

  defp publish_stream_update(stream_state) do
    policy = stream_state.emission_policy || ChannelPolicy.classify(stream_state)
    suppressed_duplicate? = get_in(stream_state, [:last_decision, :duplicate?]) == true

    if policy.emit? and not suppressed_duplicate? do
      rendered = render_stream(%{stream_state | emission_policy: policy})
      topic = "babysitter:" <> stream_state.stream

      PubSub.broadcast(Ema.PubSub, topic, {:babysitter_stream_updated, rendered})
      PubSub.broadcast(Ema.PubSub, "babysitter:all", {:babysitter_stream_updated, rendered})
    end
  end

  defp render_snapshot(state) do
    %{
      streams: Map.new(state.streams, fn {name, stream_state} -> {name, render_stream(stream_state)} end),
      defaults: StreamChannels.defaults(),
      lanes: StreamChannels.lane_registry(),
      cadence_buckets: StreamChannels.cadence_bucket_registry()
    }
  end

  defp render_stream(nil), do: nil

  defp render_stream(stream_state) do
    metadata = stream_state.metadata
    last_decision = stream_state.last_decision || %{}

    Map.take(stream_state, [
      :stream,
      :config,
      :last_interval_ms,
      :effective_interval_ms,
      :last_tick_at,
      :last_event_at,
      :next_tick_at,
      :tick_count,
      :token_pressure,
      :activity_score,
      :quieted,
      :reason,
      :promotion_reason,
      :suppression_reason,
      :current_route,
      :current_route_since,
      :promoted_at,
      :demotion_eligible_at,
      :transition_reason
    ])
    |> Map.merge(%{
      lane: metadata.lane,
      lane_metadata: metadata.lane_metadata,
      cadence_bucket: metadata.cadence_bucket,
      bucket_metadata: metadata.bucket_metadata,
      cadence_bounds: metadata.cadence_bounds,
      emission_policy: stream_state.emission_policy,
      route_reason: last_decision[:route_reason],
      route_score: last_decision[:score],
      route_reasons: last_decision[:reasons] || [],
      route_default: last_decision[:route_default],
      owner: last_decision[:owner],
      summary: last_decision[:summary],
      dedupe_key: last_decision[:dedupe_key],
      group_key: last_decision[:group_key],
      duplicate_suppressed: last_decision[:duplicate?] || false,
      coalesced_count: last_decision[:coalesced_count] || 0,
      recent_record_count: length(stream_state.recent_records),
      coalesce_group_count: map_size(stream_state.coalesce_groups),
      last_transition: stream_state.last_transition
    })
    |> Map.put(:recent_event_count, length(stream_state.recent_samples))
    |> Map.put(:recent_message_count, Enum.reduce(stream_state.recent_samples, 0, &(&1.message_count + &2)))
    |> Map.put(:time_range_ms, stream_state.config.activity_window_ms)
    |> Map.put(:sources, stream_state.recent_samples |> Enum.map(& &1.source) |> Enum.uniq())
    |> then(fn rendered -> Map.put(rendered, :tick_render, TickRenderer.render(rendered)) end)
  end

  defp route_activity(stream_state, attrs, now) do
    candidate = TickRouter.normalize_candidate(stream_state.stream, attrs, now: now)
    decision = TickRouter.decide(candidate)
    profile = decision.profile

    recent_records = trim_recent_records(stream_state.recent_records, now, profile.coalesce_window_ms)
    coalesce_groups = trim_coalesce_groups(stream_state.coalesce_groups, now, profile.coalesce_window_ms)

    duplicate? = Enum.any?(recent_records, fn record ->
      record.dedupe_key == decision.dedupe_key and DateTime.diff(now, record.at, :millisecond) <= profile.dedupe_window_ms
    end)

    group = Map.get(coalesce_groups, decision.group_key, %{count: 0, last_summary: nil, last_at: now, route: decision.route})
    coalesced_count = group.count + 1

    updated_group = %{
      count: coalesced_count,
      last_summary: decision.summary,
      last_at: now,
      route: decision.route
    }

    routed_route = transition_route(stream_state, decision.route, duplicate?, coalesced_count, now)

    record = %{
      at: now,
      dedupe_key: decision.dedupe_key,
      group_key: decision.group_key,
      route: routed_route,
      summary: decision.summary,
      reasons: decision.reasons
    }

    route_reason = route_reason(stream_state.current_route, routed_route, duplicate?, coalesced_count, decision.reasons)
    transition = build_transition(stream_state.current_route, routed_route, route_reason, now)

    stream_state
    |> Map.put(:recent_records, [record | recent_records] |> Enum.take(50))
    |> Map.put(:coalesce_groups, Map.put(coalesce_groups, decision.group_key, updated_group))
    |> Map.put(:current_route, routed_route)
    |> Map.put(:current_route_since, route_since(stream_state.current_route, routed_route, stream_state.current_route_since, now))
    |> Map.put(:promoted_at, promoted_at(stream_state.current_route, routed_route, stream_state.promoted_at, now))
    |> Map.put(:demotion_eligible_at, demotion_eligible_at(routed_route, now, profile.demote_after_ms))
    |> Map.put(:last_transition, transition)
    |> Map.put(:transition_reason, if(transition, do: transition.reason, else: stream_state.transition_reason))
    |> Map.put(:last_decision, Map.merge(decision, %{duplicate?: duplicate?, coalesced_count: coalesced_count, route: routed_route, route_reason: route_reason}))
  end

  defp trim_recent_records(records, now, window_ms) do
    cutoff = DateTime.add(now, -window_ms, :millisecond)
    Enum.filter(records, &(DateTime.compare(&1.at, cutoff) != :lt))
  end

  defp trim_coalesce_groups(groups, now, window_ms) do
    cutoff = DateTime.add(now, -window_ms, :millisecond)

    Enum.reduce(groups, %{}, fn {key, group}, acc ->
      if DateTime.compare(group.last_at, cutoff) == :lt, do: acc, else: Map.put(acc, key, group)
    end)
  end

  defp transition_route(%{current_route: nil}, route, _duplicate?, _coalesced_count, _now), do: route

  defp transition_route(%{current_route: :fast, demotion_eligible_at: eligible_at} = _state, route, duplicate?, _coalesced_count, now)
       when route in [:slow, :medium] do
    cond do
      duplicate? -> :fast
      is_nil(eligible_at) -> :fast
      DateTime.compare(now, eligible_at) == :lt -> :fast
      route == :slow -> :medium
      true -> route
    end
  end

  defp transition_route(%{current_route: current_route}, _route, true, _coalesced_count, _now), do: current_route

  defp transition_route(%{current_route: current_route}, route, _duplicate?, coalesced_count, _now) when coalesced_count >= 3 do
    max_route(current_route, route, :medium)
  end

  defp transition_route(%{current_route: current_route}, route, _duplicate?, _coalesced_count, _now), do: max_route(current_route, route)

  defp max_route(left, right, extra \\ nil) do
    [left, right, extra]
    |> Enum.reject(&is_nil/1)
    |> Enum.max_by(&route_rank/1)
  end

  defp route_rank(:slow), do: 1
  defp route_rank(:medium), do: 2
  defp route_rank(:fast), do: 3
  defp route_rank(_), do: 0

  defp promoted_at(nil, route, _existing, now) when route in [:fast, :medium], do: now
  defp promoted_at(nil, _route, existing, _now), do: existing
  defp promoted_at(previous, route, existing, now) do
    if route_rank(route) > route_rank(previous), do: now, else: existing
  end

  defp demotion_eligible_at(:fast, now, demote_after_ms), do: DateTime.add(now, demote_after_ms, :millisecond)
  defp demotion_eligible_at(:medium, now, demote_after_ms), do: DateTime.add(now, round(demote_after_ms / 2), :millisecond)
  defp demotion_eligible_at(:slow, _now, _demote_after_ms), do: nil
  defp demotion_eligible_at(_route, _now, _demote_after_ms), do: nil

  defp build_transition(nil, route, reason, now) when route in [:fast, :medium, :slow] do
    %{from: nil, to: route, at: now, reason: reason}
  end

  defp build_transition(route, route, _reason, _now), do: nil

  defp build_transition(previous, route, reason, now) do
    %{from: previous, to: route, at: now, reason: reason}
  end

  defp route_since(nil, route, _existing_since, now) when route in [:fast, :medium, :slow], do: now
  defp route_since(route, route, existing_since, _now), do: existing_since
  defp route_since(_previous, _route, _existing_since, now), do: now

  defp route_reason(previous_route, routed_route, duplicate?, coalesced_count, reasons) do
    cond do
      duplicate? -> "duplicate-suppressed"
      previous_route != nil and previous_route != routed_route -> "route-transition"
      coalesced_count > 1 -> "coalesced"
      is_list(reasons) and reasons != [] -> List.first(reasons)
      true -> "routed"
    end
  end

  defp seconds_since(nil, _now), do: 86_400
  defp seconds_since(datetime, now), do: DateTime.diff(now, datetime, :second)

  defp cancel_timer(nil), do: :ok

  defp cancel_timer(timer_ref) do
    Process.cancel_timer(timer_ref, async: true, info: false)
    :ok
  end

  defp clamp(value, min_value, _max_value) when value < min_value, do: min_value
  defp clamp(value, _min_value, max_value) when value > max_value, do: max_value
  defp clamp(value, _min_value, _max_value), do: value

  defp now_from(opts) do
    case Keyword.get(opts, :now) do
      %DateTime{} = now -> now
      _ -> DateTime.utc_now()
    end
  end
end
