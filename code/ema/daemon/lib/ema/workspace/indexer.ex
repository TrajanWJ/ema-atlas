defmodule Ema.Workspace.Indexer do
  @moduledoc "Scans workspace/shared markdown files into a lightweight overlay index."

  @default_root Path.expand("~/Projects/ema/workspace/shared")

  def root do
    Application.get_env(:ema, :workspace_shared_root, @default_root)
  end

  def scan(root \\ root()) do
    %{
      root: root,
      actors: scan_domain(root, "actors", ["actors/*.md"]),
      handoffs: scan_domain(root, "handoffs", ["handoffs/*.md", "handoffs/active/*.md"]),
      schedules: scan_domain(root, "schedules", ["schedules/*.md", "schedules/active/*.md"]),
      sessions: scan_domain(root, "sessions", ["sessions/*.md", "sessions/active/*.md"])
    }
  end

  defp scan_domain(root, domain, patterns) do
    patterns
    |> Enum.flat_map(&Path.wildcard(Path.join(root, &1)))
    |> Enum.reject(fn path -> Path.basename(path) in ["README.md", "INDEX.md", ".gitkeep"] end)
    |> Enum.uniq()
    |> Enum.map(&parse_file(&1, domain, root))
    |> Enum.reject(&is_nil/1)
  end

  defp parse_file(path, domain, root) do
    with {:ok, body} <- File.read(path) do
      meta = parse_metadata(body)
      Map.merge(meta, %{
        "domain" => domain,
        "path" => Path.relative_to(path, root),
        "title" => parse_title(body),
        "body" => body
      })
    else
      _ -> nil
    end
  end

  defp parse_title(body) do
    body
    |> String.split("\n")
    |> Enum.find_value(fn line ->
      if String.starts_with?(line, "# "), do: String.trim_leading(line, "# ") |> String.trim(), else: nil
    end)
  end

  defp parse_metadata(body) do
    {meta, _nested} =
      body
      |> String.split("\n")
      |> Enum.reduce({%{}, nil}, fn line, {acc, nested_key} ->
        cond do
          Regex.match?(~r/^\-\s+([a-zA-Z0-9_]+):\s*(.*)$/, line) ->
            [_, key, value] = Regex.run(~r/^\-\s+([a-zA-Z0-9_]+):\s*(.*)$/, line)
            value = String.trim(value)
            if value == "" do
              {Map.put(acc, key, %{}), key}
            else
              {Map.put(acc, key, value), nil}
            end

          nested_key != nil and Regex.match?(~r/^\s{4}([a-zA-Z0-9_]+):\s*(.*)$/, line) ->
            [_, key, value] = Regex.run(~r/^\s{4}([a-zA-Z0-9_]+):\s*(.*)$/, line)
            nested = Map.get(acc, nested_key, %{}) |> Map.put(key, String.trim(value))
            {Map.put(acc, nested_key, nested), nested_key}

          true ->
            {acc, nested_key}
        end
      end)

    meta
  end
end
