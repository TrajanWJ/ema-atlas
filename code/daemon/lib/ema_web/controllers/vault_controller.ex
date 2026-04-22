defmodule EmaWeb.VaultController do
  @moduledoc """
  REST endpoints for the Second Brain vault search.

  Routes:
    GET /api/vault/search?q=query[&space=subdir][&limit=N]  — FTS5 full-text search
    GET /api/vault/tree[?space=subdir]                       — Directory listing
    GET /api/vault/stats                                     — Index health/count
    POST /api/vault/index                                    — Trigger re-index
  """

  use EmaWeb, :controller

  alias Ema.SecondBrain.Indexer

  require Logger

  # GET /api/vault/search?q=...
  def search(conn, params) do
    query = Map.get(params, "q", "") |> String.trim()
    space = Map.get(params, "space")

    limit =
      params
      |> Map.get("limit", "20")
      |> Integer.parse()
      |> case do
        {n, ""} when n > 0 and n <= 100 -> n
        _ -> 20
      end

    if query == "" do
      json(conn |> put_status(400), %{error: "q parameter required"})
    else
      opts = [limit: limit] ++ if(space, do: [space: space], else: [])

      case Indexer.fts5_search(query, opts) do
        {:ok, results} ->
          json(conn, %{
            ok: true,
            query: query,
            count: length(results),
            results: results
          })

        {:error, reason} ->
          Logger.warning("[VaultController] search error: #{inspect(reason)}")
          json(conn |> put_status(500), %{error: "search failed", detail: inspect(reason)})
      end
    end
  end

  # GET /api/vault/tree
  def tree(conn, params) do
    vault_path = Application.get_env(:ema, :vault_path, Path.expand("~/vault"))
    space = Map.get(params, "space")

    base =
      if space && space != "" do
        Path.join(vault_path, space)
      else
        vault_path
      end

    if File.exists?(base) do
      entries = build_tree(base, vault_path, 0)
      json(conn, %{ok: true, path: space || "/", entries: entries})
    else
      json(conn |> put_status(404), %{error: "space not found: #{space}"})
    end
  end

  # GET /api/vault/stats
  def stats(conn, _params) do
    case Indexer.stats() do
      {:ok, info} ->
        json(conn, Map.put(info, :ok, true))

      {:error, reason} ->
        json(conn |> put_status(500), %{error: inspect(reason)})
    end
  end

  # POST /api/vault/index
  def reindex(conn, _params) do
    vault_path = Application.get_env(:ema, :vault_path, Path.expand("~/vault"))

    Task.start(fn ->
      Logger.info("[VaultController] background re-index triggered")
      Indexer.index_vault(vault_path)
    end)

    json(conn, %{ok: true, message: "re-index started in background", vault: vault_path})
  end

  # --- Private helpers ---

  defp build_tree(base, vault_root, depth) when depth < 4 do
    case File.ls(base) do
      {:ok, entries} ->
        entries
        |> Enum.reject(&String.starts_with?(&1, "."))
        |> Enum.sort()
        |> Enum.map(fn name ->
          abs = Path.join(base, name)
          rel = Path.relative_to(abs, vault_root)

          if File.dir?(abs) do
            %{
              name: name,
              path: rel,
              type: :directory,
              children: build_tree(abs, vault_root, depth + 1)
            }
          else
            %{name: name, path: rel, type: :file}
          end
        end)

      {:error, _} ->
        []
    end
  end

  defp build_tree(_base, _vault_root, _depth), do: []
end
