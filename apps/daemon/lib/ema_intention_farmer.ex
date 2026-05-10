defmodule EmaIntentionFarmer do
  @moduledoc """
  Harvests local Claude/Codex session artifacts into an intention backlog.

  This is the bootstrap layer for Launchpad/HQ intelligence: it discovers
  historical terminal sessions and project markdown, extracts human intents,
  deduplicates noisy/empty records, and stores the cleaned projection locally.

  The context is intentionally read-only against source artifacts. It never
  deletes or rewrites Claude/Codex files, and it does not spawn executions while
  loading history.
  """

  alias EmaIntentionFarmer.{Cleaner, Parser, Server, SourceRegistry}

  @type source :: %{
          required(:path) => String.t(),
          required(:source_type) => atom(),
          optional(:project_hint) => String.t() | nil
        }

  @type harvest_result :: %{
          required(:sources_seen) => non_neg_integer(),
          required(:records_parsed) => non_neg_integer(),
          required(:records_loaded) => non_neg_integer(),
          required(:duplicates_skipped) => non_neg_integer()
        }

  @doc "Discover Claude/Codex sessions and project markdown from the local machine."
  @spec discover_sources(keyword()) :: [source()]
  def discover_sources(opts \\ []) do
    SourceRegistry.discover(opts)
  end

  @doc """
  Discover, parse, clean, and load sources.

  Options are passed to `discover_sources/1`; use `:sources` to provide an
  explicit list for tests or one-off bootstrap runs.
  """
  @spec harvest(keyword()) :: {:ok, harvest_result()} | {:error, term()}
  def harvest(opts \\ []) do
    sources = Keyword.get_lazy(opts, :sources, fn -> discover_sources(opts) end)

    parse_opts = [
      max_records_per_source: Keyword.get(opts, :max_records_per_source, 2_000)
    ]

    parsed =
      sources
      |> maybe_limit(Keyword.get(opts, :max_sources))
      |> Enum.flat_map(&Parser.parse_source(&1, parse_opts))

    cleaned = Cleaner.clean(parsed)
    load_result = Server.load(cleaned)

    {:ok,
     %{
       sources_seen: sources |> maybe_limit(Keyword.get(opts, :max_sources)) |> length(),
       records_parsed: length(parsed),
       records_loaded: load_result.loaded,
       duplicates_skipped: load_result.duplicates + (length(parsed) - length(cleaned)),
       candidate_intents: length(cleaned),
       proslync_relevant: Enum.count(cleaned, &tagged?(&1, "proslync_product_intent")),
       ema_relevant: Enum.count(cleaned, &tagged?(&1, "ema_build_process_intent")),
       lost_followups: Enum.count(cleaned, &tagged?(&1, "lost_followup"))
     }}
  end

  @doc "Return every harvested intent currently in memory."
  @spec intents() :: [map()]
  def intents, do: Server.intents()

  @doc "Return every harvested session/source summary currently in memory."
  @spec sessions() :: [map()]
  def sessions, do: Server.sessions()

  @doc "Return counts for HQ/Dispatch Board status panels."
  @spec stats() :: map()
  def stats, do: Server.stats()

  @doc "Return the farmer projection map for HQ/Launchpad consumers."
  @spec projection(keyword()) :: map()
  def projection(opts \\ []) do
    limit = Keyword.get(opts, :limit, 25)
    all_intents = intents()

    %{
      source: "ema_intention_farmer",
      authority: "daemon_elixir_projection",
      stats: stats(),
      intents: Enum.take(all_intents, limit),
      top_tags: top_tags(all_intents),
      recommended_queue: recommended_queue(all_intents, limit)
    }
  end

  @doc "Return the farmer projection as JSON for future Gleam IPC bridging."
  @spec projection_json(keyword()) :: String.t()
  def projection_json(opts \\ []) do
    projection(opts)
    |> json_value()
    |> IO.iodata_to_binary()
  end

  @doc "Reset the projection. Test-only."
  @spec __reset__() :: :ok
  def __reset__, do: Server.reset()

  defp maybe_limit(items, nil), do: items
  defp maybe_limit(items, max) when is_integer(max) and max > 0, do: Enum.take(items, max)
  defp maybe_limit(_items, _max), do: []

  defp tagged?(intent, tag) do
    tag in Map.get(intent, :tags, [])
  end

  defp top_tags(intents) do
    intents
    |> Enum.flat_map(&Map.get(&1, :tags, []))
    |> Enum.frequencies()
    |> Enum.map(fn {tag, count} -> %{tag: tag, count: count} end)
    |> Enum.sort_by(&{-&1.count, &1.tag})
  end

  defp recommended_queue(intents, limit) do
    intents
    |> Enum.filter(&(Map.get(&1, :recommended_destination) in [:proslync_queue, :ema_queue]))
    |> Enum.filter(&(Map.get(&1, :review_state) in [:new, :accepted]))
    |> Enum.sort_by(&{-Map.get(&1, :confidence, 0.0), &1.title})
    |> Enum.take(limit)
  end

  defp json_value(value) when is_map(value) do
    entries =
      value
      |> Enum.map(fn {key, val} -> [json_string(to_string(key)), ":", json_value(val)] end)
      |> Enum.intersperse(",")

    ["{", entries, "}"]
  end

  defp json_value(value) when is_list(value) do
    ["[", value |> Enum.map(&json_value/1) |> Enum.intersperse(","), "]"]
  end

  defp json_value(value) when is_binary(value), do: json_string(value)
  defp json_value(value) when is_atom(value), do: json_string(to_string(value))
  defp json_value(value) when is_integer(value), do: Integer.to_string(value)

  defp json_value(value) when is_float(value),
    do: :erlang.float_to_binary(value, [:compact, decimals: 4])

  defp json_value(nil), do: "null"

  defp json_string(value) do
    escaped =
      value
      |> String.replace("\\", "\\\\")
      |> String.replace("\"", "\\\"")
      |> String.replace("\n", "\\n")
      |> String.replace("\r", "\\r")
      |> String.replace("\t", "\\t")

    ["\"", escaped, "\""]
  end
end
