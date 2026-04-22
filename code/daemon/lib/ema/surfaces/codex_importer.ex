defmodule Ema.Surfaces.CodexImporter do
  @moduledoc """
  Imports host-native Codex session history from ~/.codex/sessions.

  This importer aims for feature parity with the first Claude importer pass:
  - discovers Codex JSONL session files
  - extracts provider session id, cwd, timestamps, and a readable title
  - normalizes user/assistant/tool-style transcript records
  - persists host session + event/message rows when the persistence layer is available

  Codex logs are more event-oriented than Claude logs, so this importer also
  records normalized HostSessionEvent rows for function/tool lifecycle data.
  """

  require Logger

  alias Ema.ControlPlane.Persistence

  @root Path.expand("~/.codex/sessions")
  @max_preview_lines 250

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
      entries = raw |> String.split("\n", trim: true) |> Enum.map(&decode_line/1) |> Enum.reject(&is_nil/1)

      session = build_import_payload(path, entries)
      messages = normalize_messages(session.id, entries)
      events = normalize_events(session.id, entries)

      persist_errors = persist_session_bundle(session, messages, events)

      result = %{
        id: session.id,
        provider: session.provider,
        provider_session_id: session.provider_session_id,
        cwd: session.cwd,
        title: session.title,
        started_at: session.started_at,
        last_activity_at: session.last_activity_at,
        imported_messages: length(messages),
        imported_events: length(events),
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
    meta = Enum.find(entries, fn e -> e["type"] == "session_meta" end) || %{}
    payload = meta["payload"] || %{}
    session_id = payload["id"] || infer_session_id_from_filename(path)
    cwd = payload["cwd"] || extract_turn_cwd(entries)
    title = extract_title(entries, path)

    %{
      id: "codex-host:" <> session_id,
      provider: "codex",
      provider_session_id: session_id,
      provider_project_key: cwd || date_bucket_from_path(path),
      cwd: cwd,
      title: title,
      status: "imported",
      source: "imported",
      started_at: extract_first_timestamp(entries),
      last_activity_at: extract_last_timestamp(entries),
      metadata: %{
        path: path,
        line_count: length(entries),
        cli_version: payload["cli_version"],
        originator: payload["originator"],
        model_provider: payload["model_provider"]
      }
    }
  end

  defp normalize_messages(host_session_id, entries) do
    entries
    |> Enum.flat_map(fn entry ->
      payload = entry["payload"] || %{}

      case {entry["type"], payload["type"]} do
        {"event_msg", "user_message"} ->
          case payload["message"] do
            text when is_binary(text) and text != "" ->
              [%{id: make_id("msg"), host_session_id: host_session_id, role: "user", content: text, occurred_at: parse_ts(entry["timestamp"]), provider_event_id: nil, metadata: %{raw_type: "user_message"}}]
            _ -> []
          end

        {"response_item", "message"} ->
          case extract_response_text(payload) do
            nil -> []
            text -> [%{id: make_id("msg"), host_session_id: host_session_id, role: payload["role"] || "system", content: text, occurred_at: parse_ts(entry["timestamp"]), provider_event_id: nil, metadata: %{raw_type: "message"}}]
          end

        {"response_item", "agent_message"} ->
          case extract_response_text(payload) do
            nil -> []
            text -> [%{id: make_id("msg"), host_session_id: host_session_id, role: "assistant", content: text, occurred_at: parse_ts(entry["timestamp"]), provider_event_id: nil, metadata: %{raw_type: "agent_message"}}]
          end

        _ ->
          []
      end
    end)
  end

  defp normalize_events(host_session_id, entries) do
    entries
    |> Enum.with_index(1)
    |> Enum.flat_map(fn {entry, idx} ->
      payload = entry["payload"] || %{}
      top_type = entry["type"]
      payload_type = payload["type"] || top_type

      case {top_type, payload_type} do
        {"session_meta", _} ->
          [event_row(host_session_id, idx, entry, "session_meta", payload_type, payload)]

        {"turn_context", _} ->
          [event_row(host_session_id, idx, entry, "turn_context", payload_type, payload)]

        {"event_msg", "task_started"} ->
          [event_row(host_session_id, idx, entry, "lifecycle", "task_started", payload)]

        {"event_msg", "task_complete"} ->
          [event_row(host_session_id, idx, entry, "lifecycle", "task_complete", payload)]

        {"response_item", "function_call"} ->
          [event_row(host_session_id, idx, entry, "tool_call", payload["name"] || "function_call", payload)]

        {"response_item", "function_call_output"} ->
          [event_row(host_session_id, idx, entry, "tool_result", "function_call_output", payload)]

        {"event_msg", "token_count"} ->
          [event_row(host_session_id, idx, entry, "telemetry", "token_count", payload)]

        {"response_item", "reasoning"} ->
          [event_row(host_session_id, idx, entry, "reasoning", "reasoning", payload)]

        _ ->
          []
      end
    end)
  end

  defp event_row(host_session_id, sequence, entry, event_kind, provider_event_kind, payload) do
    %{
      id: make_id("evt"),
      host_session_id: host_session_id,
      provider: "codex",
      provider_event_kind: to_string(provider_event_kind),
      event_kind: event_kind,
      sequence: sequence,
      occurred_at: parse_ts(entry["timestamp"]),
      payload: payload,
      raw_ref: nil,
      metadata: %{top_type: entry["type"]}
    }
  end

  defp persist_session_bundle(session, messages, events) do
    errors = []

    errors =
      case safe_persist(fn -> Persistence.sync_host_session(session) end) do
        :ok -> errors
        {:error, reason} -> ["host_session: #{inspect(reason)}" | errors]
      end

    errors =
      Enum.reduce(messages, errors, fn message, acc ->
        case safe_persist(fn -> Persistence.sync_host_session_message(message) end) do
          :ok -> acc
          {:error, reason} -> ["host_session_message: #{inspect(reason)}" | acc]
        end
      end)

    Enum.reduce(events, errors, fn event, acc ->
      case safe_persist(fn -> Persistence.sync_host_session_event(event) end) do
        :ok -> acc
        {:error, reason} -> ["host_session_event: #{inspect(reason)}" | acc]
      end
    end)
    |> Enum.reverse()
  end

  defp safe_persist(fun) do
    fun.()
    :ok
  rescue
    e ->
      Logger.warning("[CodexImporter] persistence skipped: #{Exception.message(e)}")
      {:error, Exception.message(e)}
  catch
    kind, reason -> {:error, {kind, reason}}
  end

  defp extract_title(entries, path) do
    Enum.find_value(entries, infer_session_id_from_filename(path), fn entry ->
      payload = entry["payload"] || %{}

      cond do
        entry["type"] == "event_msg" and payload["type"] == "user_message" and is_binary(payload["message"]) ->
          payload["message"] |> String.trim() |> String.slice(0, 180)

        entry["type"] == "response_item" and payload["type"] in ["message", "agent_message"] ->
          extract_response_text(payload)

        true ->
          nil
      end
    end)
  end

  defp extract_turn_cwd(entries) do
    Enum.find_value(entries, fn entry ->
      payload = entry["payload"] || %{}
      if entry["type"] == "turn_context", do: payload["cwd"], else: nil
    end)
  end

  defp extract_response_text(%{"content" => content}) when is_list(content) do
    content
    |> Enum.map(fn
      %{"text" => text} when is_binary(text) -> text
      %{"type" => "output_text", "text" => text} when is_binary(text) -> text
      %{"type" => "input_text", "text" => text} when is_binary(text) -> text
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

  defp extract_response_text(%{"summary" => summary}) when is_list(summary) do
    summary
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

  defp extract_response_text(_), do: nil

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

  defp infer_session_id_from_filename(path) do
    Path.basename(path, ".jsonl")
    |> String.split("-")
    |> List.last()
  end

  defp date_bucket_from_path(path) do
    parts = Path.split(path)
    Enum.take(parts, -4) |> Enum.join("/")
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
