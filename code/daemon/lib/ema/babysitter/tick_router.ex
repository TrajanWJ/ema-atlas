defmodule Ema.Babysitter.TickRouter do
  @moduledoc """
  Canonical traffic-shaping router for babysitter tick events.

  This module is intentionally pure and side-effect free so it can be adopted in
  front of the existing `StreamTicker` without destabilizing cadence logic.

  Responsibilities:

    * normalize a raw activity payload into a `candidate`
    * resolve a per-stream tick profile
    * score the candidate into one of three attention routes: `:fast`, `:medium`, `:slow`
    * emit stable dedupe/group keys plus human-readable reasons

  It does **not** own coalescing windows, promotion/demotion state memory, or
  publish timing. Those remain runtime concerns for `StreamTicker`.
  """

  alias Ema.Babysitter.StreamChannels

  @type route :: :fast | :medium | :slow

  @type candidate :: %{
          stream: String.t(),
          entity_key: String.t(),
          dedupe_basis: String.t(),
          group_basis: String.t(),
          owner: String.t() | nil,
          kind: String.t(),
          subject: String.t() | nil,
          body: String.t() | nil,
          summary: String.t(),
          severity: non_neg_integer(),
          tags: [String.t()],
          source: String.t(),
          message_count: non_neg_integer(),
          event_count: non_neg_integer(),
          token_count: non_neg_integer(),
          token_pressure: float(),
          owner_mentioned?: boolean(),
          state_changed?: boolean(),
          urgent?: boolean(),
          quiet?: boolean(),
          inserted_at: DateTime.t()
        }

  @type tick_profile :: %{
          stream: String.t(),
          route_default: route(),
          dedupe_window_ms: pos_integer(),
          coalesce_window_ms: pos_integer(),
          promote_after_count: pos_integer(),
          demote_after_ms: pos_integer(),
          owner_weight: float(),
          max_render_items: pos_integer(),
          render_style: atom(),
          lane: atom(),
          cadence_bucket: atom()
        }

  @type decision :: %{
          route: route(),
          score: float(),
          reasons: [String.t()],
          dedupe_key: String.t(),
          group_key: String.t(),
          owner: String.t() | nil,
          summary: String.t(),
          severity: non_neg_integer(),
          route_default: route(),
          profile: tick_profile()
        }

  @global_defaults %{
    route_default: :slow,
    dedupe_window_ms: 45_000,
    coalesce_window_ms: 300_000,
    promote_after_count: 3,
    demote_after_ms: 600_000,
    owner_weight: 2.0,
    max_render_items: 5,
    render_style: :compact
  }

  @stream_overrides %{
    "babysitter-live" => %{
      route_default: :medium,
      dedupe_window_ms: 20_000,
      coalesce_window_ms: 180_000,
      promote_after_count: 2,
      demote_after_ms: 240_000,
      owner_weight: 2.5,
      max_render_items: 6
    },
    "babysitter-ops" => %{
      route_default: :medium,
      dedupe_window_ms: 30_000,
      coalesce_window_ms: 240_000,
      promote_after_count: 3,
      demote_after_ms: 360_000,
      owner_weight: 1.75
    },
    "babysitter-alerts" => %{
      route_default: :fast,
      dedupe_window_ms: 15_000,
      coalesce_window_ms: 120_000,
      promote_after_count: 1,
      demote_after_ms: 180_000,
      owner_weight: 2.25
    }
  }

  @bucket_overrides %{
    realtime: %{
      route_default: :medium,
      dedupe_window_ms: 20_000,
      coalesce_window_ms: 180_000,
      promote_after_count: 2,
      demote_after_ms: 240_000,
      owner_weight: 2.25
    },
    rapid: %{
      route_default: :medium,
      dedupe_window_ms: 30_000,
      coalesce_window_ms: 240_000,
      promote_after_count: 3,
      demote_after_ms: 360_000,
      owner_weight: 1.8
    },
    steady: %{
      route_default: :slow,
      dedupe_window_ms: 60_000,
      coalesce_window_ms: 420_000,
      promote_after_count: 3,
      demote_after_ms: 720_000,
      owner_weight: 1.5
    },
    default: %{}
  }

  @spec normalize_candidate(String.t(), map(), keyword()) :: candidate()
  def normalize_candidate(stream, attrs, opts \\ []) when is_binary(stream) and is_map(attrs) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    source = string_attr(attrs, [:source, "source", :channel, "channel"], "runtime")
    kind = string_attr(attrs, [:kind, "kind", :event_type, "event_type"], source)
    owner = string_attr(attrs, [:owner, "owner", :target_owner, "target_owner", :assignee, "assignee"])
    subject = string_attr(attrs, [:subject, "subject", :title, "title"])
    body = string_attr(attrs, [:body, "body", :text, "text", :content, "content", :summary, "summary"])
    entity_key = string_attr(attrs, [:entity_key, "entity_key", :session_id, "session_id", :source_id, "source_id"], stream)
    severity = normalize_severity(Map.get(attrs, :severity) || Map.get(attrs, "severity") || if(truthy?(Map.get(attrs, :urgent) || Map.get(attrs, "urgent")), do: 4, else: 1))
    tags = normalize_tags(Map.get(attrs, :tags) || Map.get(attrs, "tags") || [])
    message_count = positive_integer(Map.get(attrs, :message_count) || Map.get(attrs, "message_count") || Map.get(attrs, :messages) || Map.get(attrs, "messages"))
    event_count = positive_integer(Map.get(attrs, :event_count) || Map.get(attrs, "event_count") || Map.get(attrs, :events) || Map.get(attrs, "events"))
    token_count = positive_integer(Map.get(attrs, :token_count) || Map.get(attrs, "token_count") || Map.get(attrs, :tokens) || Map.get(attrs, "tokens"))

    token_pressure =
      attrs
      |> Map.get(:token_pressure, Map.get(attrs, "token_pressure", 0.0))
      |> normalize_ratio(0.0)

    owner_mentioned? =
      truthy?(Map.get(attrs, :owner_mentioned) || Map.get(attrs, "owner_mentioned")) or
        owner_mention_in_text?(owner, [subject, body])

    state_changed? = truthy?(Map.get(attrs, :state_changed) || Map.get(attrs, "state_changed"))
    urgent? = truthy?(Map.get(attrs, :urgent) || Map.get(attrs, "urgent")) or severity >= 4
    quiet? = truthy?(Map.get(attrs, :quiet) || Map.get(attrs, "quiet") || Map.get(attrs, :quiet_hint) || Map.get(attrs, "quiet_hint"))

    summary = summarize(subject, body, stream)
    dedupe_basis = Enum.join([kind, subject || "", body || "", owner || ""], "|")
    group_basis = Enum.join([kind, subject || summary, entity_key], "|")

    %{
      stream: stream,
      entity_key: entity_key,
      dedupe_basis: dedupe_basis,
      group_basis: group_basis,
      owner: owner,
      kind: kind,
      subject: subject,
      body: body,
      summary: summary,
      severity: severity,
      tags: tags,
      source: source,
      message_count: message_count,
      event_count: event_count,
      token_count: token_count,
      token_pressure: token_pressure,
      owner_mentioned?: owner_mentioned?,
      state_changed?: state_changed?,
      urgent?: urgent?,
      quiet?: quiet?,
      inserted_at: now
    }
  end

  @spec resolve_profile(String.t()) :: tick_profile()
  def resolve_profile(stream) when is_binary(stream) do
    metadata = StreamChannels.stream_metadata(stream)

    @global_defaults
    |> Map.merge(Map.get(@bucket_overrides, metadata.cadence_bucket, %{}))
    |> Map.merge(Map.get(@stream_overrides, stream, %{}))
    |> Map.merge(%{stream: stream, lane: metadata.lane, cadence_bucket: metadata.cadence_bucket})
  end

  @spec decide(candidate(), keyword()) :: decision()
  def decide(candidate, opts \\ []) when is_map(candidate) do
    profile = Keyword.get(opts, :profile, resolve_profile(candidate.stream))

    urgency = urgency_score(candidate)
    novelty = novelty_score(candidate)
    owner_relevance = owner_relevance_score(candidate, profile)
    burst_penalty = burst_penalty(candidate)
    staleness_bonus = staleness_bonus(candidate, Keyword.get(opts, :now, candidate.inserted_at))

    base_score = route_default_score(profile.route_default)
    score = Float.round(base_score + urgency + novelty + owner_relevance + staleness_bonus - burst_penalty, 2)

    forced_route = forced_route(candidate, profile)
    route = forced_route || classify_route(score)

    reasons =
      [
        reason_default(profile.route_default),
        if(candidate.owner_mentioned?, do: "mentioned-owner"),
        if(candidate.state_changed?, do: "state-changed"),
        if(candidate.urgent?, do: "urgent"),
        if(candidate.severity >= 4, do: "high-severity"),
        if(candidate.message_count + candidate.event_count >= profile.promote_after_count, do: "burst-activity"),
        if(candidate.token_pressure >= 0.75, do: "token-pressure"),
        if(candidate.quiet?, do: "quiet-hint"),
        if(novelty >= 1.25, do: "novel-signal")
      ]
      |> Enum.reject(&is_nil/1)
      |> Enum.uniq()

    %{
      route: route,
      score: score,
      reasons: reasons,
      dedupe_key: hash_key(candidate.stream, candidate.entity_key, candidate.dedupe_basis),
      group_key: hash_key(candidate.stream, candidate.entity_key, candidate.group_basis),
      owner: candidate.owner,
      summary: candidate.summary,
      severity: candidate.severity,
      route_default: profile.route_default,
      profile: profile
    }
  end

  defp forced_route(candidate, _profile) do
    cond do
      candidate.quiet? and candidate.severity <= 2 and not candidate.urgent? and not candidate.state_changed? -> :slow
      candidate.urgent? and candidate.owner_mentioned? -> :fast
      candidate.state_changed? and candidate.severity >= 4 -> :fast
      candidate.severity >= 5 -> :fast
      true -> nil
    end
  end

  defp classify_route(score) when score >= 7.5, do: :fast
  defp classify_route(score) when score >= 4.0, do: :medium
  defp classify_route(_score), do: :slow

  defp urgency_score(candidate) do
    score =
      candidate.severity * 0.9 +
        if(candidate.urgent?, do: 1.5, else: 0.0) +
        if(candidate.state_changed?, do: 1.2, else: 0.0)

    Float.round(score, 2)
  end

  defp novelty_score(candidate) do
    score =
      cond do
        candidate.state_changed? -> 1.0
        candidate.kind in ["incident", "alert"] -> 1.25
        String.length(candidate.summary) > 80 -> 0.5
        true -> 0.25
      end

    Float.round(score, 2)
  end

  defp owner_relevance_score(candidate, profile) do
    score =
      cond do
        candidate.owner_mentioned? -> profile.owner_weight
        is_binary(candidate.owner) and candidate.owner != "" -> profile.owner_weight * 0.5
        true -> 0.0
      end

    Float.round(score, 2)
  end

  defp burst_penalty(candidate) do
    activity = candidate.message_count + candidate.event_count

    cond do
      candidate.quiet? -> 1.25
      activity >= 8 and not candidate.state_changed? -> 0.9
      activity >= 5 and not candidate.urgent? -> 0.45
      true -> 0.0
    end
  end

  defp staleness_bonus(candidate, now) do
    age_seconds = max(DateTime.diff(now, candidate.inserted_at, :second), 0)

    cond do
      age_seconds >= 300 -> 0.5
      age_seconds >= 60 -> 0.25
      true -> 0.0
    end
  end

  defp route_default_score(:fast), do: 5.0
  defp route_default_score(:medium), do: 3.0
  defp route_default_score(:slow), do: 1.5

  defp reason_default(:fast), do: "fast-default"
  defp reason_default(:medium), do: "medium-default"
  defp reason_default(:slow), do: "slow-default"

  defp hash_key(stream, entity_key, basis) do
    :sha256
    |> :crypto.hash(Enum.join([stream, entity_key, basis], "|"))
    |> Base.encode16(case: :lower)
  end

  defp summarize(subject, body, stream) do
    [subject, body]
    |> Enum.reject(&is_nil/1)
    |> Enum.join(" — ")
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
    |> case do
      "" -> stream
      value when byte_size(value) > 160 -> String.slice(value, 0, 157) <> "..."
      value -> value
    end
  end

  defp owner_mention_in_text?(nil, _texts), do: false
  defp owner_mention_in_text?("", _texts), do: false

  defp owner_mention_in_text?(owner, texts) do
    owner_lc = String.downcase(owner)

    Enum.any?(texts, fn
      value when is_binary(value) -> String.contains?(String.downcase(value), owner_lc)
      _ -> false
    end)
  end

  defp string_attr(attrs, keys, fallback \\ nil) do
    Enum.find_value(keys, fallback, fn key ->
      case Map.get(attrs, key) do
        value when is_binary(value) ->
          trimmed = String.trim(value)
          if trimmed == "", do: nil, else: trimmed

        _ ->
          nil
      end
    end)
  end

  defp normalize_severity(value) when is_integer(value), do: min(max(value, 0), 5)

  defp normalize_severity(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> normalize_severity(parsed)
      _ -> 1
    end
  end

  defp normalize_severity(_), do: 1

  defp normalize_tags(value) when is_list(value) do
    value
    |> Enum.map(fn
      v when is_atom(v) -> Atom.to_string(v)
      v when is_binary(v) -> String.trim(v)
      _ -> nil
    end)
    |> Enum.reject(&is_nil/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.uniq()
  end

  defp normalize_tags(value) when is_binary(value) do
    value
    |> String.split(",", trim: true)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.uniq()
  end

  defp normalize_tags(_), do: []

  defp positive_integer(value) when is_integer(value) and value > 0, do: value
  defp positive_integer(value) when is_float(value) and value > 0, do: trunc(value)

  defp positive_integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} when parsed > 0 -> parsed
      _ -> 0
    end
  end

  defp positive_integer(_), do: 0

  defp normalize_ratio(value, _fallback) when is_float(value), do: clamp(value, 0.0, 1.0)
  defp normalize_ratio(value, _fallback) when is_integer(value), do: clamp(value / 1, 0.0, 1.0)

  defp normalize_ratio(value, fallback) when is_binary(value) do
    case Float.parse(value) do
      {parsed, ""} -> clamp(parsed, 0.0, 1.0)
      _ -> fallback
    end
  end

  defp normalize_ratio(_, fallback), do: fallback

  defp truthy?(value) when value in [true, 1, "1", "true", "yes", "on"], do: true
  defp truthy?(_), do: false

  defp clamp(value, min_value, _max_value) when value < min_value, do: min_value
  defp clamp(value, _min_value, max_value) when value > max_value, do: max_value
  defp clamp(value, _min_value, _max_value), do: value
end
