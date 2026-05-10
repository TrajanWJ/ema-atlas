defmodule EmaIntentionFarmer.SourceRegistry do
  @moduledoc """
  Discovers local Claude/Codex, Chronicle, Duct Tape, EMA, and Proslync
  sources.

  Discovery is bounded and explicit: it looks at the current user's agent
  session stores plus known EMA project roots. Parsing is handled downstream.
  """

  @spec discover(keyword()) :: [map()]
  def discover(opts \\ []) do
    home = Keyword.get_lazy(opts, :home, fn -> System.user_home!() end)
    max_sources = Keyword.get(opts, :max_sources)

    sources =
      case Keyword.get(opts, :roots) do
        nil -> default_sources(home, opts)
        roots -> sources_from_roots(List.wrap(roots), opts)
      end

    sources
    |> Enum.uniq_by(&{&1.source_type, &1.path})
    |> maybe_limit(max_sources)
  end

  defp default_sources(home, opts) do
    project_roots = Keyword.get(opts, :project_roots, default_project_roots(home))

    [
      Path.join(home, ".claude/projects/**/*.jsonl"),
      Path.join(home, ".codex/sessions/**/*.jsonl"),
      Path.join(home, ".codex/archived_sessions/*.jsonl"),
      Path.join(home, ".codex/history.jsonl"),
      Path.join(home, ".codex/session_index.jsonl"),
      Path.join(home, ".codex/memories/MEMORY.md"),
      Path.join(home, ".codex/memories/rollout_summaries/*.md")
    ]
    |> Enum.flat_map(&expand_path/1)
    |> Kernel.++(markdown_sources(project_roots))
    |> Enum.map(&source_for_path(&1, opts))
  end

  defp sources_from_roots(roots, opts) do
    roots
    |> Enum.flat_map(&expand_root/1)
    |> Enum.map(&source_for_path(&1, opts))
  end

  defp expand_root(root) do
    root
    |> expand_path()
    |> Enum.flat_map(fn path ->
      cond do
        File.regular?(path) ->
          [path]

        File.dir?(path) ->
          source_files_under(path)

        true ->
          []
      end
    end)
  end

  defp markdown_sources(project_roots) do
    project_roots
    |> Enum.flat_map(&source_files_under/1)
  end

  defp source_files_under(root) do
    [
      "AGENTS.md",
      "CLAUDE.md",
      "README.md",
      "MEMORY.md",
      "project.md",
      "queue/README.md",
      "docs/architecture/*.md",
      "docs/vapps/*.md",
      "docs/superpowers/specs/*.md",
      "docs/superpowers/plans/*.md",
      "blueprint/*.md",
      "atlas/**/*.md"
    ]
    |> Enum.map(&Path.join(root, &1))
    |> Enum.flat_map(&expand_path/1)
  end

  defp expand_path(path) do
    matches = Path.wildcard(path)

    cond do
      matches != [] -> Enum.filter(matches, &File.regular?/1)
      File.regular?(path) -> [path]
      File.dir?(path) -> [path]
      true -> []
    end
  end

  defp source_for_path(path, opts) do
    source_family = source_family(path)
    source_type = source_type(path, source_family)

    %{
      path: path,
      source_type: source_type,
      project_hint: Keyword.get(opts, :project_hint) || project_hint(path, source_family),
      source_family: source_family
    }
  end

  defp default_project_roots(home) do
    [
      Path.join(home, "Desktop/Projects/*"),
      Path.join(home, "Desktop/Active builds/*")
    ]
    |> Enum.flat_map(&Path.wildcard/1)
    |> Enum.filter(&File.dir?/1)
  end

  defp source_type(path, source_family) do
    downcased = String.downcase(path)

    cond do
      String.ends_with?(downcased, ".jsonl") and String.contains?(downcased, "/.claude/") ->
        :claude_project

      String.ends_with?(downcased, ".jsonl") and
          (String.contains?(downcased, "/.codex/sessions/") or
             String.contains?(downcased, "/.codex/archived_sessions/")) ->
        :codex_session

      String.ends_with?(downcased, ".jsonl") and String.contains?(downcased, "/.codex/") ->
        :codex_history

      String.contains?(downcased, "/.codex/memories/") ->
        :codex_memory

      source_family == :proslync ->
        :proslync_repo

      source_family == :ema ->
        :ema_doc

      true ->
        :donor_project
    end
  end

  defp source_family(path) do
    downcased = String.downcase(path)

    cond do
      String.contains?(downcased, "proslync") -> :proslync
      String.contains?(downcased, "/ema-0.0.6") or String.contains?(downcased, "/projects/ema/") -> :ema
      String.contains?(downcased, "chronicle") -> :chronicle
      String.contains?(downcased, "duct-tape") -> :duct_tape
      String.contains?(downcased, "multiplexer") or String.contains?(downcased, "cmux") or String.contains?(downcased, "t3code") -> :session_manager
      true -> :general
    end
  end

  defp project_hint(path, source_family) do
    downcased = String.downcase(path)

    cond do
      String.contains?(downcased, "proslync-app-ios-final") -> "proslync-app-ios-final"
      source_family == :proslync -> "proslync"
      source_family == :ema -> "EMA"
      source_family == :duct_tape -> "duct-tape-onion-harness"
      source_family == :chronicle -> "chronicle"
      source_family == :session_manager -> "ema-agent-multiplexer-interface"
      true -> nil
    end
  end

  defp maybe_limit(items, nil), do: items
  defp maybe_limit(items, max) when is_integer(max) and max > 0, do: Enum.take(items, max)
  defp maybe_limit(_items, _max), do: []
end
