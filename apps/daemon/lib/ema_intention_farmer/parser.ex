defmodule EmaIntentionFarmer.Parser do
  @moduledoc """
  Streaming parser for local agent artifacts.

  The daemon side currently avoids extra JSON dependencies, so JSONL extraction
  is deliberately conservative: it pulls common text fields from each line and
  treats the original line as provenance. Malformed or non-message lines are
  ignored by the cleaner rather than failing a whole harvest.
  """

  @text_keys ~w(prompt text content message summary command cmd)

  @markdown_source_types [:markdown, :ema_doc, :donor_project, :proslync_repo, :codex_memory]

  @type source :: %{required(:path) => String.t(), required(:source_type) => atom()}

  @spec parse_source(source(), keyword()) :: [map()]
  def parse_source(source, opts \\ [])

  def parse_source(%{path: path, source_type: source_type} = source, _opts)
      when source_type in @markdown_source_types do
    case File.read(path) do
      {:ok, body} ->
        [
          base_record(source, 0, body)
          |> Map.merge(%{
            intent_type: :context_note,
            title: Path.basename(path),
            text: body
          })
        ]

      {:error, _} ->
        []
    end
  end

  def parse_source(%{path: path} = source, opts) do
    max_records = Keyword.get(opts, :max_records_per_source, 2_000)

    if File.regular?(path) do
      path
      |> File.stream!([], :line)
      |> Stream.take(max_records)
      |> Stream.with_index()
      |> Stream.map(fn {line, index} -> parse_jsonl_line(source, index, line) end)
      |> Enum.reject(&is_nil/1)
    else
      []
    end
  rescue
    _ -> []
  end

  defp parse_jsonl_line(source, index, line) do
    text =
      line
      |> extract_text()
      |> normalize_text()

    case text do
      "" ->
        nil

      value ->
        base_record(source, index, line)
        |> Map.merge(%{
          intent_type: infer_intent_type(value),
          title: summarize(value),
          text: value,
          role: extract_scalar(line, "role"),
          occurred_at: extract_scalar(line, "timestamp") || extract_scalar(line, "created_at")
        })
    end
  end

  defp base_record(source, index, raw) do
    source_type = Map.fetch!(source, :source_type)
    path = Map.fetch!(source, :path)
    line_number = index + 1
    fingerprint = fingerprint("#{source_type}:#{path}:#{index}:#{raw}")

    %{
      id: "parsed_record:" <> fingerprint,
      source_type: source_type,
      source_path: path,
      source_family: Map.get(source, :source_family, :general),
      source_index: index,
      project_hint: Map.get(source, :project_hint),
      source_fingerprint: fingerprint,
      evidence_ref: evidence_ref(path, line_number),
      raw_excerpt: raw |> normalize_text() |> String.slice(0, 800)
    }
  end

  defp extract_text(line) do
    @text_keys
    |> Enum.flat_map(fn key ->
      Regex.scan(~r/"#{key}"\s*:\s*"((?:[^"\\]|\\.)*)"/, line, capture: :all_but_first)
    end)
    |> List.flatten()
    |> Enum.map(&unescape_json_string/1)
    |> Enum.reject(&(String.trim(&1) == ""))
    |> Enum.join("\n")
  end

  defp unescape_json_string(value) do
    value
    |> String.replace(~s(\\n), "\n")
    |> String.replace(~s(\\t), "\t")
    |> String.replace(~s(\\"), ~s("))
    |> String.replace(~s(\\\\), ~s(\\))
  end

  defp extract_scalar(line, key) do
    case Regex.run(~r/"#{key}"\s*:\s*"((?:[^"\\]|\\.)*)"/, line, capture: :all_but_first) do
      [value] -> unescape_json_string(value) |> normalize_text()
      _ -> nil
    end
  end

  defp infer_intent_type(text) do
    downcased = String.downcase(text)

    cond do
      Regex.match?(~r/\b(fix|bug|broken|error|failing|regression)\b/, downcased) ->
        :fix

      Regex.match?(~r/\b(build|implement|add|wire|ship|create)\b/, downcased) ->
        :task

      Regex.match?(~r/\b(why|how|what|question|explain)\b/, downcased) ->
        :question

      Regex.match?(~r/\b(explore|inspect|investigate|audit|research)\b/, downcased) ->
        :exploration

      true ->
        :goal
    end
  end

  defp summarize(text) do
    text
    |> String.split(~r/\s+/, trim: true)
    |> Enum.take(18)
    |> Enum.join(" ")
    |> String.slice(0, 140)
  end

  defp normalize_text(text) do
    text
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
  end

  defp fingerprint(value) do
    :crypto.hash(:sha256, value)
    |> Base.encode16(case: :lower)
  end

  defp evidence_ref(path, line_number) do
    if String.ends_with?(String.downcase(path), ".jsonl") do
      "jsonl:#{path}##{line_number}"
    else
      "md:#{path}##{line_number}"
    end
  end
end
