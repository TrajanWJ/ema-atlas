defmodule EmaIntentionFarmer.Cleaner do
  @moduledoc """
  Cleans parsed farmer records before they enter EMA projections.

  The cleaner removes empty/system-prompt noise, deduplicates by normalized
  text, and adds a simple quality score so HQ can separate strong backlog
  seeds from low-signal context.
  """

  @min_text_length 12

  @spec clean([map()]) :: [map()]
  def clean(records) do
    records
    |> Enum.map(&score/1)
    |> Enum.map(&classify/1)
    |> Enum.reject(&empty_or_low_signal?/1)
    |> dedupe()
  end

  defp score(record) do
    text = Map.get(record, :text, "")
    words = text |> String.split(~r/\s+/, trim: true) |> length()

    score =
      cond do
        words >= 30 -> 0.95
        words >= 12 -> 0.8
        words >= 5 -> 0.55
        true -> 0.25
      end

    record
    |> Map.put(:quality_score, score)
    |> Map.put(:confidence, score)
  end

  defp classify(record) do
    text = Map.get(record, :text, "")
    downcased = String.downcase(text)
    tags = tags_for(downcased)

    record
    |> Map.put(:tags, tags)
    |> Map.put(:review_state, :new)
    |> Map.put(:recommended_destination, recommended_destination(tags))
    |> Map.update!(:confidence, &confidence(&1, tags))
    |> Map.put(:title, normalized_title(record, tags))
  end

  defp empty_or_low_signal?(record) do
    text = Map.get(record, :text, "") |> String.trim()
    downcased = String.downcase(text)

    String.length(text) < @min_text_length ||
      String.starts_with?(downcased, "knowledge cutoff:") ||
      String.starts_with?(downcased, "you are chatgpt") ||
      String.starts_with?(downcased, "you are codex") ||
      String.contains?(downcased, "<permissions instructions>")
  end

  defp dedupe(records) do
    records
    |> Enum.reduce({MapSet.new(), []}, fn record, {seen, acc} ->
      key = dedupe_key(record)

      if MapSet.member?(seen, key) do
        {seen, acc}
      else
        {MapSet.put(seen, key), [Map.put(record, :dedupe_key, key) | acc]}
      end
    end)
    |> elem(1)
    |> Enum.reverse()
  end

  defp tags_for(text) do
    [
      tag_if(text, ~r/proslync|mrs\.? wilson|\bnil\b|athletic director|\bad\b|brand hq|revenue-share|revenue share|athlete|compliance/, "proslync_product_intent"),
      tag_if(text, ~r/tsc|typecheck|build|simulator|backend|desktop|active build|branch|dirty|worktree/, "proslync_build_process_intent"),
      tag_if(text, ~r/\bema\b|cockpit|lane|queue|vapp|daemon|projection|active builds/, "ema_build_process_intent"),
      tag_if(text, ~r/i want|we need|should|keep|don't|please|follow up|lost|stale|blocker|next/, "lost_followup"),
      tag_if(text, ~r/chronicle|activity|replay|event stream|session history/, "chronicle_pattern"),
      tag_if(text, ~r/duct tape|harness glue|dispatch|execution|tool\.timeline/, "harness_glue_pattern"),
      tag_if(text, ~r/cmux|multiplexer|session manager|\btui\b|codex\/claude sessions|claude tui|codex tui/, "session_manager_pattern")
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  defp tag_if(text, regex, tag) do
    if Regex.match?(regex, text), do: tag, else: nil
  end

  defp recommended_destination(tags) do
    cond do
      "proslync_product_intent" in tags or "proslync_build_process_intent" in tags ->
        :proslync_queue

      Enum.any?(tags, &(&1 in ["ema_build_process_intent", "harness_glue_pattern", "chronicle_pattern", "session_manager_pattern", "lost_followup"])) ->
        :ema_queue

      true ->
        :doc_only
    end
  end

  defp confidence(score, tags) do
    bonus = min(length(tags) * 0.05, 0.2)
    min(score + bonus, 0.99)
  end

  defp normalized_title(record, tags) do
    existing = Map.get(record, :title, "")
    prefix =
      cond do
        "proslync_product_intent" in tags -> "Proslync"
        "ema_build_process_intent" in tags -> "EMA"
        "harness_glue_pattern" in tags -> "Harness"
        "chronicle_pattern" in tags -> "Chronicle"
        "session_manager_pattern" in tags -> "Session"
        true -> "Intent"
      end

    "#{prefix}: #{existing}"
    |> String.replace(~r/\s+/, " ")
    |> String.slice(0, 160)
  end

  defp dedupe_key(record) do
    text =
      record
      |> Map.get(:text, "")
      |> String.downcase()
      |> String.replace(~r/\s+/, " ")
      |> String.trim()

    :crypto.hash(:sha256, text)
    |> Base.encode16(case: :lower)
  end
end
