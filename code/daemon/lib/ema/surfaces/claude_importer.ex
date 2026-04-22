defmodule Ema.Surfaces.ClaudeImporter do
  @moduledoc """
  Imports host-native Claude session history from ~/.claude/projects.

  This is the first durable import path for EMA host sessions:
  - discovers Claude project/session JSONL files
  - extracts session identity, cwd/project key, timestamps
  - normalizes basic user/assistant transcript messages
  - attempts to persist into ControlPlane persistence tables when available

  The importer is intentionally tolerant:
  - malformed JSONL lines are skipped
  - missing tables/persistence failures are captured and returned as warnings
  - import can still be used as a read-only discovery/reporting surface
  """

  require Logger

  alias Ema.ControlPlane.Persistence

  @root Path.expand("~/.claude/projects")
  @max_preview_lines 200

  def root, do: @root

  def discover_sessions(opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)

    sessions =
      if File.dir?(@root) do
        @root
        |> Path.join("**/*.jsonl")
        |> Path.wildcard()
        |> Enum.map(&build_session_preview/1)
        |> Enum.reject(&is_nil/1)
        |> Enum.sort_by(fn s -> s.last_activity_at || ~U[1970-01-01 00:00:00Z] end, {:desc, DateTime})
        |> Enum.take(limit)
      else
        []
      end

    %{
      root: @root,
      present: File.dir?(@root),
      count: length(sessions),
      sessions: sessions
    }
  end

  def import_recent(opts \\ []) do
    limit = Keyword.get(opts, :limit, 25)

    discovered = discover_sessions(limit: limit)

    {results, warnings} =
      Enum.reduce(discovered.sessions, {[], []}, fn session, {acc, warn_acc} ->
        case import_session(session.path) do
          {:ok, result} -> {[result | acc], warn_acc}
          {:warning, result, warning} -> {[result | acc], [warning | warn_acc]}
          {:error, reason} -> {acc, [inspect(reason) | warn_acc]}
        end
      end)

    %{
      root: discovered.root,
      present: discovered.present,
      imported: length(results),
      warnings: Enum.reverse(warnings),
      sessions: Enum.reverse(results)
    }
  end

  def import_session(path) when is_binary(path) do
    with true <- File.exists?(path),
         {:ok, raw} <- File.read(path) do
      lines = String.split(raw, "\n", trim: true)
      entries = Enum.map(lines, &decode_line/1) |> Enum.reject(&is_nil/1)

      session = build_import_payload(path, entries)
      messages = normalize_messages(session.id, entries)

      persist_errors = persist_session_bundle(session, messages)

      result = %{
        id: session.id,
        provider: session.provider,
        provider_session_id: session.provider_session_id,
        cwd: session.cwd,
        title: session.title,
        started_at: session.started_at,
        last_activity_at: session.last_activity_at,
        imported_messages: length(messages),
        path: path
      }

      case persist_errors do
        [] -> {:ok, result}
        errs -> {:warning, result, errs}
      end
    else
      false -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  defp build_session_preview(path) do
    entries =
      path
      |> preview_lines(@max_preview_lines)
      |> Enum.map(&decode_line/1)
      |> Enum.reject(&is_nil/1)

    if entries == [] do
      nil
    else
      build_import_payload(path, entries)
      |> Map.put(:path, path)
    end
  end

  defp build_import_payload(path, entries) do
    first_user = Enum.find(entries, fn e -> e["type"] == "user" end)
    first_assistant = Enum.find(entries, fn e -> e["type"] == "assistant" end)
    session_id = extract_session_id(entries, path)
    project_key = project_key_from_path(path)

    %{
      id: "claude-host:" <> session_id,
      provider: "claude",
      provider_session_id: session_id,
      provider_project_key: project_key,
      cwd: extract_cwd(entries) || decode_project_slug(project_key),
      title: extract_title(first_user, first_assistant, path),
      status: "imported",
      source: "imported",
      started_at: extract_first_timestamp(entries),
      last_activity_at: extract_last_timestamp(entries),
      metadata: %{
        path: path,
        project_key: project_key,
        line_count: length(entries)
      }
    }
  end

  defp normalize_messages(host_session_id, entries) do
    entries
    |> Enum.flat_map(fn entry ->
      case entry["type"] do
        "user" ->
          case extract_message_text(entry["message"]) do
            nil -> []
            text -> [%{id: make_id("msg"), host_session_id: host_session_id, role: "user", content: text, occurred_at: parse_ts(entry["timestamp"]), provider_event_id: entry["uuid"], metadata: %{raw_type: "user"}}]
          end

        "assistant" ->
          case extract_message_text(entry["message"]) do
            nil -> []
            text -> [%{id: make_id("msg"), host_session_id: host_session_id, role: "assistant", content: text, occurred_at: parse_ts(entry["timestamp"]), provider_event_id: entry["uuid"], metadata: %{raw_type: "assistant"}}]
          end

        _ ->
          []
      end
    end)
  end

  defp persist_session_bundle(session, messages) do
    errors = []

    errors =
      case safe_persist(fn -> Persistence.sync_host_session(session) end) do
        :ok -> errors
        {:error, reason} -> ["host_session: #{inspect(reason)}" | errors]
      end

    Enum.reduce(messages, errors, fn message, acc ->
      case safe_persist(fn -> Persistence.sync_host_session_message(message) end) do
        :ok -> acc
        {:error, reason} -> ["host_session_message: #{inspect(reason)}" | acc]
      end
    end)
    |> Enum.reverse()
  end

  defp safe_persist(fun) do
    fun.()
    :ok
  rescue
    e ->
      Logger.warning("[ClaudeImporter] persistence skipped: #{Exception.message(e)}")
      {:error, Exception.message(e)}
  catch
    kind, reason -> {:error, {kind, reason}}
  end

  defp extract_session_id(entries, path) do
    Enum.find_value(entries, Path.basename(path, ".jsonl"), fn entry -> entry["sessionId"] end)
  end

  defp extract_cwd(entries) do
    Enum.find_value(entries, fn entry -> entry["cwd"] end)
  end

  defp extract_title(first_user, first_assistant, path) do
    extract_message_text(first_user && first_user["message"]) ||
      extract_message_text(first_assistant && first_assistant["message"]) ||
      Path.basename(path, ".jsonl")
  end

  defp extract_first_timestamp(entries) do
    entries
    |> Enum.map(&parse_ts(&1["timestamp"]))
    |> Enum.reject(&is_nil/1)
    |> Enum.sort({:asc, DateTime})
    |> List.first()
  end

  defp extract_last_timestamp(entries) do
    entries
    |> Enum.map(&parse_ts(&1["timestamp"]))
    |> Enum.reject(&is_nil/1)
    |> Enum.sort({:desc, DateTime})
    |> List.first()
  end

  defp extract_message_text(nil), do: nil

  defp extract_message_text(%{"content" => content}) when is_list(content) do
    content
    |> Enum.map(fn
      %{"text" => text} when is_binary(text) -> text
      _ -> nil
    end)
    |> Enum.reject(&is_nil/1)
    |> Enum.join("\n")
    |> String.trim()
    |> case do
      "" -> nil
      text -> text
    end
  end

  defp extract_message_text(%{"content" => content}) when is_binary(content) do
    String.trim(content)
  end

  defp extract_message_text(%{"text" => text}) when is_binary(text), do: String.trim(text)
  defp extract_message_text(text) when is_binary(text), do: String.trim(text)
  defp extract_message_text(_), do: nil

  defp project_key_from_path(path) do
    path
    |> Path.dirname()
    |> Path.basename()
  end

  defp decode_project_slug(slug) do
    slug
    |> String.trim_leading("-")
    |> String.split("-")
    |> Enum.reject(&(&1 == ""))
    |> Enum.join("/")
    |> then(&"/" <> &1)
  end

  defp preview_lines(path, max_lines) do
    path
    |> File.stream!([], :line)
    |> Enum.take(max_lines)
  rescue
    _ -> []
  end

  defp decode_line(line) do
    case Jason.decode(line) do
      {:ok, obj} -> obj
      _ -> nil
    end
  end

  defp parse_ts(nil), do: nil
  defp parse_ts(ts) when is_binary(ts) do
    case DateTime.from_iso8601(ts) do
      {:ok, dt, _} -> dt
      _ -> nil
    end
  end

  defp make_id(prefix), do: prefix <> "_" <> Base.encode16(:crypto.strong_rand_bytes(6), case: :lower)
end
