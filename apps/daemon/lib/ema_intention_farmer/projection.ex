defmodule EmaIntentionFarmer.Projection do
  @moduledoc """
  ETS-backed projection for harvested sessions and intents.
  """

  @sessions_table :ema_intention_farmer_sessions
  @intents_table :ema_intention_farmer_intents

  @spec ensure_tables!() :: :ok
  def ensure_tables! do
    ensure_table(@sessions_table)
    ensure_table(@intents_table)
    :ok
  end

  @spec load([map()]) :: %{loaded: non_neg_integer(), duplicates: non_neg_integer()}
  def load(records) do
    ensure_tables!()

    Enum.reduce(records, %{loaded: 0, duplicates: 0}, fn record, acc ->
      intent_id = "harvested_intent:" <> Map.fetch!(record, :dedupe_key)

      if :ets.member(@intents_table, intent_id) do
        %{acc | duplicates: acc.duplicates + 1}
      else
        session_id = session_id(record)
        session = session_record(record, session_id)
        intent = intent_record(record, intent_id, session_id)

        :ets.insert(@sessions_table, {session_id, session})
        :ets.insert(@intents_table, {intent_id, intent})
        %{acc | loaded: acc.loaded + 1}
      end
    end)
  end

  @spec sessions() :: [map()]
  def sessions do
    ensure_tables!()
    @sessions_table |> :ets.tab2list() |> Enum.map(&elem(&1, 1)) |> Enum.sort_by(& &1.source_path)
  end

  @spec intents() :: [map()]
  def intents do
    ensure_tables!()
    @intents_table |> :ets.tab2list() |> Enum.map(&elem(&1, 1)) |> Enum.sort_by(& &1.loaded_at)
  end

  @spec stats() :: map()
  def stats do
    ensure_tables!()

    intents = intents()
    tags = intents |> Enum.flat_map(&Map.get(&1, :tags, []))

    %{
      sessions: :ets.info(@sessions_table, :size),
      intents: length(intents),
      sources_seen: :ets.info(@sessions_table, :size),
      records_parsed: length(intents),
      candidate_intents: length(intents),
      proslync_relevant: Enum.count(intents, &tagged?(&1, "proslync_product_intent")),
      ema_relevant: Enum.count(intents, &tagged?(&1, "ema_build_process_intent")),
      lost_followups: Enum.count(intents, &tagged?(&1, "lost_followup")),
      duplicates_skipped: 0,
      by_source_type: Enum.frequencies_by(intents, & &1.source_type),
      by_intent_type: Enum.frequencies_by(intents, & &1.intent_type),
      by_tag: Enum.frequencies(tags)
    }
  end

  @spec reset() :: :ok
  def reset do
    ensure_tables!()
    :ets.delete_all_objects(@sessions_table)
    :ets.delete_all_objects(@intents_table)
    :ok
  end

  defp ensure_table(table) do
    case :ets.whereis(table) do
      :undefined -> :ets.new(table, [:named_table, :public, read_concurrency: true])
      _tid -> table
    end
  end

  defp session_id(record) do
    "harvested_session:" <>
      (:crypto.hash(:sha256, "#{record.source_type}:#{record.source_path}")
       |> Base.encode16(case: :lower))
  end

  defp session_record(record, session_id) do
    %{
      session_id: session_id,
      source_type: record.source_type,
      source_path: record.source_path,
      source_family: Map.get(record, :source_family, :general),
      project_hint: Map.get(record, :project_hint),
      last_loaded_at: now()
    }
  end

  defp intent_record(record, intent_id, session_id) do
    %{
      intent_id: intent_id,
      session_id: session_id,
      source_type: record.source_type,
      source_path: record.source_path,
      source_family: Map.get(record, :source_family, :general),
      source_index: record.source_index,
      project_hint: Map.get(record, :project_hint),
      intent_type: record.intent_type,
      title: record.title,
      text: record.text,
      quality_score: record.quality_score,
      confidence: Map.get(record, :confidence, record.quality_score),
      tags: Map.get(record, :tags, []),
      review_state: Map.get(record, :review_state, :new),
      recommended_destination: Map.get(record, :recommended_destination, :doc_only),
      evidence_ref: Map.get(record, :evidence_ref),
      occurred_at: Map.get(record, :occurred_at),
      role: Map.get(record, :role),
      source_fingerprint: record.source_fingerprint,
      raw_excerpt: record.raw_excerpt,
      loaded_at: now()
    }
  end

  defp tagged?(intent, tag) do
    tag in Map.get(intent, :tags, [])
  end

  defp now do
    DateTime.utc_now()
    |> DateTime.truncate(:second)
    |> DateTime.to_iso8601()
  end
end
