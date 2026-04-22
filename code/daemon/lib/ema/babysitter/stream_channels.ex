defmodule Ema.Babysitter.StreamChannels do
  @moduledoc """
  Canonical babysitter stream registry.

  This module separates:

    * semantic lane identity
    * cadence bucket identity
    * bounded cadence defaults

  `babysitter-live` remains the most chatty visible stream. Other streams start
  quieter and are allowed to stretch further under low activity or token pressure.
  """

  @type stream_name :: String.t()
  @type lane_id :: atom()
  @type bucket_id :: atom()

  @type lane_metadata :: %{
          id: lane_id(),
          label: String.t(),
          description: String.t()
        }

  @type bucket_metadata :: %{
          id: bucket_id(),
          label: String.t(),
          description: String.t(),
          min_interval_ms: pos_integer(),
          base_interval_ms: pos_integer(),
          max_interval_ms: pos_integer()
        }

  @type stream_metadata :: %{
          stream: stream_name(),
          lane: lane_id(),
          lane_metadata: lane_metadata(),
          cadence_bucket: bucket_id(),
          bucket_metadata: bucket_metadata(),
          cadence_bounds: %{
            min_interval_ms: pos_integer(),
            base_interval_ms: pos_integer(),
            max_interval_ms: pos_integer()
          }
        }

  @type stream_config :: %{
          stream: stream_name(),
          base_interval_ms: pos_integer(),
          min_interval_ms: pos_integer(),
          max_interval_ms: pos_integer(),
          manual_interval_ms: pos_integer() | nil,
          activity_window_ms: pos_integer(),
          token_pressure_threshold: float(),
          signal_floor: float()
        }

  @known_streams ["babysitter-live", "babysitter-ops", "babysitter-alerts"]

  @lane_registry %{
    operator_rollup: %{
      id: :operator_rollup,
      label: "Operator Rollup",
      description: "Mission-control deltas for the operator-facing babysitter surface."
    },
    operations: %{
      id: :operations,
      label: "Operations",
      description: "Implementation and system-state monitoring for babysitter operations."
    },
    attention: %{
      id: :attention,
      label: "Attention",
      description: "Escalations, incidents, and high-urgency babysitter alerts."
    },
    monitoring: %{
      id: :monitoring,
      label: "Monitoring",
      description: "Fallback semantic lane for uncategorized babysitter streams."
    }
  }

  @bucket_registry %{
    realtime: %{
      id: :realtime,
      label: "Realtime",
      description: "Fast operator feedback for active babysitter work.",
      base_interval_ms: 20_000,
      min_interval_ms: 8_000,
      max_interval_ms: 180_000
    },
    rapid: %{
      id: :rapid,
      label: "Rapid",
      description: "Frequent operational updates without full realtime intensity.",
      base_interval_ms: 45_000,
      min_interval_ms: 15_000,
      max_interval_ms: 300_000
    },
    steady: %{
      id: :steady,
      label: "Steady",
      description: "Lower-frequency alert and summary cadence.",
      base_interval_ms: 90_000,
      min_interval_ms: 30_000,
      max_interval_ms: 600_000
    },
    ultrafast: %{
      id: :ultrafast,
      label: "Ultrafast",
      description: "Tight autonomous loops for very active orchestration.",
      base_interval_ms: 15_000,
      min_interval_ms: 5_000,
      max_interval_ms: 30_000
    },
    fast: %{
      id: :fast,
      label: "Fast",
      description: "Short-cycle autonomous work within the current environment.",
      base_interval_ms: 120_000,
      min_interval_ms: 30_000,
      max_interval_ms: 300_000
    },
    medium: %{
      id: :medium,
      label: "Medium",
      description: "Mid-range synthesis and monitoring cadence.",
      base_interval_ms: 900_000,
      min_interval_ms: 300_000,
      max_interval_ms: 1_800_000
    },
    slow: %{
      id: :slow,
      label: "Slow",
      description: "Longer reflective cadence for lower-priority chains.",
      base_interval_ms: 3_600_000,
      min_interval_ms: 1_800_000,
      max_interval_ms: 5_400_000
    },
    trend: %{
      id: :trend,
      label: "Trend",
      description: "Broad trend and watchtower cadence.",
      base_interval_ms: 10_800_000,
      min_interval_ms: 5_400_000,
      max_interval_ms: 21_600_000
    },
    archive: %{
      id: :archive,
      label: "Archive",
      description: "Very low-frequency background or archival cadence.",
      base_interval_ms: 28_800_000,
      min_interval_ms: 21_600_000,
      max_interval_ms: 86_400_000
    },
    default: %{
      id: :default,
      label: "Default",
      description: "Fallback cadence bucket when no explicit bucket is registered.",
      base_interval_ms: 60_000,
      min_interval_ms: 20_000,
      max_interval_ms: 600_000
    }
  }

  @bucket_runtime_defaults %{
    realtime: %{
      manual_interval_ms: nil,
      activity_window_ms: 300_000,
      token_pressure_threshold: 0.65,
      signal_floor: 1.25
    },
    rapid: %{
      manual_interval_ms: nil,
      activity_window_ms: 420_000,
      token_pressure_threshold: 0.72,
      signal_floor: 1.0
    },
    steady: %{
      manual_interval_ms: nil,
      activity_window_ms: 600_000,
      token_pressure_threshold: 0.8,
      signal_floor: 0.85
    },
    ultrafast: %{
      manual_interval_ms: nil,
      activity_window_ms: 120_000,
      token_pressure_threshold: 0.65,
      signal_floor: 1.75
    },
    fast: %{
      manual_interval_ms: nil,
      activity_window_ms: 300_000,
      token_pressure_threshold: 0.7,
      signal_floor: 1.4
    },
    medium: %{
      manual_interval_ms: nil,
      activity_window_ms: 1_800_000,
      token_pressure_threshold: 0.75,
      signal_floor: 1.0
    },
    slow: %{
      manual_interval_ms: nil,
      activity_window_ms: 5_400_000,
      token_pressure_threshold: 0.82,
      signal_floor: 0.8
    },
    trend: %{
      manual_interval_ms: nil,
      activity_window_ms: 21_600_000,
      token_pressure_threshold: 0.88,
      signal_floor: 0.65
    },
    archive: %{
      manual_interval_ms: nil,
      activity_window_ms: 86_400_000,
      token_pressure_threshold: 0.92,
      signal_floor: 0.5
    },
    default: %{
      manual_interval_ms: nil,
      activity_window_ms: 300_000,
      token_pressure_threshold: 0.75,
      signal_floor: 1.0
    }
  }

  @stream_profiles %{
    "babysitter-live" => %{lane: :operator_rollup, cadence_bucket: :realtime},
    "babysitter-ops" => %{lane: :operations, cadence_bucket: :rapid},
    "babysitter-alerts" => %{lane: :attention, cadence_bucket: :steady}
  }

  @spec stream_names() :: [stream_name()]
  def stream_names, do: @known_streams

  @spec defaults() :: %{stream_name() => stream_config()}
  def defaults do
    Map.new(stream_names(), fn stream -> {stream, default_config(stream)} end)
  end

  @spec lane_registry() :: %{lane_id() => lane_metadata()}
  def lane_registry, do: @lane_registry

  @spec cadence_bucket_registry() :: %{bucket_id() => bucket_metadata()}
  def cadence_bucket_registry, do: @bucket_registry

  @spec stream_profile(stream_name()) :: %{lane: lane_id(), cadence_bucket: bucket_id()}
  def stream_profile(stream) do
    Map.get(@stream_profiles, stream, inferred_profile(stream))
  end

  @spec stream_metadata(stream_name()) :: stream_metadata()
  def stream_metadata(stream) do
    %{lane: lane, cadence_bucket: cadence_bucket} = stream_profile(stream)
    bucket = bucket_metadata(cadence_bucket)

    %{
      stream: stream,
      lane: lane,
      lane_metadata: lane_metadata(lane),
      cadence_bucket: cadence_bucket,
      bucket_metadata: bucket,
      cadence_bounds: %{
        min_interval_ms: bucket.min_interval_ms,
        base_interval_ms: bucket.base_interval_ms,
        max_interval_ms: bucket.max_interval_ms
      }
    }
  end

  @spec lane_metadata(lane_id()) :: lane_metadata()
  def lane_metadata(lane), do: Map.get(@lane_registry, lane, Map.fetch!(@lane_registry, :monitoring))

  @spec bucket_metadata(bucket_id()) :: bucket_metadata()
  def bucket_metadata(bucket), do: Map.get(@bucket_registry, bucket, Map.fetch!(@bucket_registry, :default))

  @spec default_config(stream_name()) :: stream_config()
  def default_config(stream) do
    %{cadence_bucket: cadence_bucket} = stream_profile(stream)
    bucket = bucket_metadata(cadence_bucket)

    runtime_defaults =
      Map.get(@bucket_runtime_defaults, cadence_bucket, Map.fetch!(@bucket_runtime_defaults, :default))

    runtime_defaults
    |> Map.merge(%{
      stream: stream,
      base_interval_ms: bucket.base_interval_ms,
      min_interval_ms: bucket.min_interval_ms,
      max_interval_ms: bucket.max_interval_ms
    })
  end

  @spec normalize_config(stream_name(), map()) :: stream_config()
  def normalize_config(stream, attrs) do
    merge_config(default_config(stream), attrs)
  end

  @spec merge_config(stream_config(), map()) :: stream_config()
  def merge_config(base_config, attrs) when is_map(base_config) and is_map(attrs) do
    config =
      Enum.reduce(attrs, base_config, fn {key, value}, acc ->
        case normalize_key(key) do
          :base_interval_ms -> Map.put(acc, :base_interval_ms, normalize_ms(value, acc.base_interval_ms))
          :min_interval_ms -> Map.put(acc, :min_interval_ms, normalize_ms(value, acc.min_interval_ms))
          :max_interval_ms -> Map.put(acc, :max_interval_ms, normalize_ms(value, acc.max_interval_ms))
          :manual_interval_ms -> Map.put(acc, :manual_interval_ms, normalize_optional_ms(value))
          :activity_window_ms -> Map.put(acc, :activity_window_ms, normalize_ms(value, acc.activity_window_ms))
          :token_pressure_threshold -> Map.put(acc, :token_pressure_threshold, normalize_ratio(value, acc.token_pressure_threshold))
          :signal_floor -> Map.put(acc, :signal_floor, normalize_positive_number(value, acc.signal_floor))
          _ -> acc
        end
      end)

    min_ms = min(config.min_interval_ms, config.max_interval_ms)
    max_ms = max(config.min_interval_ms, config.max_interval_ms)
    base_ms = clamp(config.base_interval_ms, min_ms, max_ms)
    manual_ms = if(config.manual_interval_ms, do: clamp(config.manual_interval_ms, min_ms, max_ms), else: nil)

    %{config | min_interval_ms: min_ms, max_interval_ms: max_ms, base_interval_ms: base_ms, manual_interval_ms: manual_ms}
  end

  defp inferred_profile(stream) do
    cond do
      stream == "babysitter-live" -> %{lane: :operator_rollup, cadence_bucket: :realtime}
      String.ends_with?(stream, "-live") -> %{lane: :operator_rollup, cadence_bucket: :realtime}
      String.contains?(stream, "alert") -> %{lane: :attention, cadence_bucket: :steady}
      String.contains?(stream, "ops") -> %{lane: :operations, cadence_bucket: :rapid}
      true -> %{lane: :monitoring, cadence_bucket: :default}
    end
  end

  defp normalize_key(:interval_ms), do: :manual_interval_ms
  defp normalize_key(:time_range_ms), do: :activity_window_ms
  defp normalize_key(:window_ms), do: :activity_window_ms
  defp normalize_key(key) when is_atom(key), do: key

  defp normalize_key(key) when is_binary(key) do
    case key do
      "base_interval_ms" -> :base_interval_ms
      "min_interval_ms" -> :min_interval_ms
      "max_interval_ms" -> :max_interval_ms
      "manual_interval_ms" -> :manual_interval_ms
      "interval_ms" -> :manual_interval_ms
      "activity_window_ms" -> :activity_window_ms
      "time_range_ms" -> :activity_window_ms
      "window_ms" -> :activity_window_ms
      "token_pressure_threshold" -> :token_pressure_threshold
      "signal_floor" -> :signal_floor
      _ -> nil
    end
  end

  defp normalize_key(_), do: nil

  defp normalize_ms(nil, fallback), do: fallback
  defp normalize_ms(value, _fallback) when is_integer(value) and value > 0, do: value

  defp normalize_ms(value, fallback) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} when parsed > 0 -> parsed
      _ -> fallback
    end
  end

  defp normalize_ms(_, fallback), do: fallback

  defp normalize_optional_ms(nil), do: nil
  defp normalize_optional_ms(""), do: nil
  defp normalize_optional_ms(value) when value in ["off", "auto"], do: nil
  defp normalize_optional_ms(value) when is_integer(value) and value > 0, do: value

  defp normalize_optional_ms(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} when parsed > 0 -> parsed
      _ -> nil
    end
  end

  defp normalize_optional_ms(_), do: nil

  defp normalize_ratio(value, _fallback) when is_float(value), do: clamp(value, 0.0, 1.0)
  defp normalize_ratio(value, _fallback) when is_integer(value), do: clamp(value / 1, 0.0, 1.0)

  defp normalize_ratio(value, fallback) when is_binary(value) do
    case Float.parse(value) do
      {parsed, ""} -> clamp(parsed, 0.0, 1.0)
      _ -> fallback
    end
  end

  defp normalize_ratio(_, fallback), do: fallback

  defp normalize_positive_number(value, _fallback) when is_float(value) and value > 0.0, do: value
  defp normalize_positive_number(value, _fallback) when is_integer(value) and value > 0, do: value / 1

  defp normalize_positive_number(value, fallback) when is_binary(value) do
    case Float.parse(value) do
      {parsed, ""} when parsed > 0.0 -> parsed
      _ -> fallback
    end
  end

  defp normalize_positive_number(_, fallback), do: fallback

  defp clamp(value, min_value, _max_value) when value < min_value, do: min_value
  defp clamp(value, _min_value, max_value) when value > max_value, do: max_value
  defp clamp(value, _min_value, _max_value), do: value
end
