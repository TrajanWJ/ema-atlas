defmodule Ema.Babysitter.ChannelPolicy do
  @moduledoc """
  Emission policy for babysitter updates.

  This module classifies a stream into emission tiers (`:hot`, `:medium`,
  `:quiet`) based on current stream state. The tiers are delivery-policy labels,
  not the semantic architecture of the babysitter surface.

    * `:hot`    — emit every tick
    * `:medium` — emit normally
    * `:quiet`  — suppress filler ticks except for keep-alives or fresh activity

  Semantic lane identity and cadence buckets live in `StreamChannels`; this
  module only decides whether the current snapshot should be pushed.
  """

  @type tier :: :hot | :medium | :quiet
  @type mode :: :auto | :operator

  @type emission_policy :: %{
          tier: tier(),
          emit?: boolean(),
          reason: String.t(),
          mode: mode(),
          keep_alive_ms: pos_integer(),
          cadence_factor: float()
        }

  @type operator_override :: %{
          tier: tier() | nil,
          emit: boolean() | nil,
          locked_at: DateTime.t(),
          locked_by: String.t()
        }

  @type classify_opts :: [
          operator_overrides: %{String.t() => operator_override()},
          global_config: map(),
          now: DateTime.t()
        ]

  @hot_threshold 6.0
  @medium_threshold 1.5
  @default_keep_alive_ms 300_000

  @tier_cadence %{
    hot: 0.6,
    medium: 1.0,
    quiet: 1.8
  }

  @spec classify(map(), classify_opts()) :: emission_policy()
  def classify(stream_state, opts \\ []) do
    overrides = Keyword.get(opts, :operator_overrides, %{})
    global = Keyword.get(opts, :global_config, %{})
    now = Keyword.get(opts, :now, DateTime.utc_now())

    stream = stream_state.stream
    override = Map.get(overrides, stream)

    hot_threshold = Map.get(global, :hot_threshold, @hot_threshold)
    medium_threshold = Map.get(global, :medium_threshold, @medium_threshold)
    keep_alive_ms = Map.get(global, :keep_alive_ms, @default_keep_alive_ms)

    {tier, mode} = resolve_tier(stream_state, override, hot_threshold, medium_threshold)
    {emit?, reason} = resolve_emission(tier, mode, stream_state, override, keep_alive_ms, now)
    cadence_factor = Map.get(global, :cadence_factor, Map.fetch!(@tier_cadence, tier))

    %{
      tier: tier,
      emit?: emit?,
      reason: reason,
      mode: mode,
      keep_alive_ms: keep_alive_ms,
      cadence_factor: cadence_factor
    }
  end

  @spec build_override(keyword()) :: operator_override()
  def build_override(opts \\ []) do
    %{
      tier: Keyword.get(opts, :tier),
      emit: Keyword.get(opts, :emit),
      locked_at: Keyword.get(opts, :locked_at, DateTime.utc_now()),
      locked_by: Keyword.get(opts, :locked_by, "operator")
    }
  end

  @spec tier_cadence() :: %{tier() => float()}
  def tier_cadence, do: @tier_cadence

  @spec thresholds() :: %{hot: float(), medium: float(), keep_alive_ms: pos_integer()}
  def thresholds do
    %{hot: @hot_threshold, medium: @medium_threshold, keep_alive_ms: @default_keep_alive_ms}
  end

  defp resolve_tier(stream_state, nil, hot_threshold, medium_threshold) do
    {auto_tier(stream_state.activity_score, hot_threshold, medium_threshold), :auto}
  end

  defp resolve_tier(stream_state, %{tier: nil}, hot_threshold, medium_threshold) do
    {auto_tier(stream_state.activity_score, hot_threshold, medium_threshold), :auto}
  end

  defp resolve_tier(_stream_state, %{tier: tier}, _hot, _medium) when tier in [:hot, :medium, :quiet] do
    {tier, :operator}
  end

  defp resolve_tier(stream_state, _override, hot_threshold, medium_threshold) do
    {auto_tier(stream_state.activity_score, hot_threshold, medium_threshold), :auto}
  end

  defp auto_tier(activity_score, hot_threshold, medium_threshold) do
    cond do
      activity_score >= hot_threshold -> :hot
      activity_score >= medium_threshold -> :medium
      true -> :quiet
    end
  end

  defp resolve_emission(:hot, _mode, _state, _override, _keep_alive_ms, _now) do
    {true, "hot_always_emit"}
  end

  defp resolve_emission(:medium, _mode, _state, _override, _keep_alive_ms, _now) do
    {true, "medium_emit"}
  end

  defp resolve_emission(:quiet, :operator, _state, %{emit: true}, _keep_alive_ms, _now) do
    {true, "operator_force_emit"}
  end

  defp resolve_emission(:quiet, :operator, _state, %{emit: false}, _keep_alive_ms, _now) do
    {false, "operator_suppress"}
  end

  defp resolve_emission(:quiet, _mode, stream_state, _override, keep_alive_ms, now) do
    last_tick = stream_state[:last_tick_at]

    cond do
      is_nil(last_tick) ->
        {true, "quiet_initial"}

      DateTime.diff(now, last_tick, :millisecond) >= keep_alive_ms ->
        {true, "quiet_keep_alive"}

      stream_state.activity_score > 0.0 and recent_event?(stream_state, now) ->
        {true, "quiet_activity_burst"}

      true ->
        {false, "quiet_suppress"}
    end
  end

  defp recent_event?(%{last_event_at: nil}, _now), do: false

  defp recent_event?(%{last_event_at: last_event}, now) do
    DateTime.diff(now, last_event, :second) < 30
  end
end
