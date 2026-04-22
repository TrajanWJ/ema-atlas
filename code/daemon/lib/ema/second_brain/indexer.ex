defmodule Ema.SecondBrain.Indexer do
  @moduledoc """
  FTS5-backed vault indexer for the EMA Second Brain.

  Maintains a SQLite FTS5 virtual table that mirrors the vault markdown files.
  Provides full-text search across all notes with ranked results.

  ## Schema

  The FTS5 table lives in a dedicated SQLite database (separate from Ecto's
  ema_dev.db) because FTS5 virtual tables can't be managed via Ecto migrations.

  Uses Exqlite directly for DDL and raw FTS5 queries.

  ## Usage

      {:ok, pid} = Ema.SecondBrain.Indexer.start_link([])
      :ok = Ema.SecondBrain.Indexer.index_vault("/home/user/vault")
      {:ok, results} = Ema.SecondBrain.Indexer.fts5_search("agent dispatch", limit: 10)

  ## FTS5 query syntax

  Supports standard SQLite FTS5 syntax:
    - `"exact phrase"`
    - `token1 token2`  (implicit AND)
    - `token1 OR token2`
    - `^prefix*`       (prefix match)
    - `NEAR(a b, 5)`   (proximity)
  """

  use GenServer

  require Logger

  @db_name "second_brain_fts.db"
  @default_limit 20

  # --- Public API ---

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Full-text search across all indexed vault notes.

  Returns a list of maps with keys:
    - `:path`    — relative path within the vault
    - `:title`   — note title (first H1 or filename)
    - `:snippet` — FTS5 snippet with match highlighted
    - `:rank`    — BM25 relevance score (negative; closer to 0 = better)

  ## Options

    - `:limit`  — max results (default: #{@default_limit})
    - `:space`  — filter to a sub-directory (e.g. "Research", "Daily Notes")
  """
  @spec fts5_search(String.t(), keyword()) ::
          {:ok, [map()]} | {:error, term()}
  def fts5_search(query, opts \\ []) when is_binary(query) do
    GenServer.call(__MODULE__, {:fts5_search, query, opts}, 15_000)
  end

  @doc """
  Index (or re-index) the vault at the given directory path.

  Walks all .md files, extracts content, and upserts into the FTS5 table.
  Safe to call repeatedly — uses INSERT OR REPLACE semantics keyed on path.
  """
  @spec index_vault(String.t()) :: :ok | {:error, term()}
  def index_vault(vault_path) do
    GenServer.call(__MODULE__, {:index_vault, vault_path}, 120_000)
  end

  @doc """
  Index a single file (called by VaultWatcher on file-change events).
  """
  @spec index_file(String.t(), String.t()) :: :ok | {:error, term()}
  def index_file(vault_root, file_path) do
    GenServer.call(__MODULE__, {:index_file, vault_root, file_path}, 10_000)
  end

  @doc """
  Remove a file from the index (called by VaultWatcher on delete events).
  """
  @spec remove_file(String.t()) :: :ok | {:error, term()}
  def remove_file(rel_path) do
    GenServer.call(__MODULE__, {:remove_file, rel_path}, 5_000)
  end

  @doc """
  Return basic stats: row count and database path.
  """
  @spec stats() :: {:ok, map()} | {:error, term()}
  def stats do
    GenServer.call(__MODULE__, :stats, 5_000)
  end

  # --- GenServer callbacks ---

  @impl true
  def init(_opts) do
    db_path = resolve_db_path()
    Logger.info("[SecondBrain.Indexer] opening FTS5 db at #{db_path}")

    case open_and_init_db(db_path) do
      {:ok, conn} ->
        vault_path = Application.get_env(:ema, :vault_path, default_vault_path())
        {:ok, %{conn: conn, db_path: db_path, vault_path: vault_path}}

      {:error, reason} ->
        Logger.error("[SecondBrain.Indexer] failed to open db: #{inspect(reason)}")
        {:stop, reason}
    end
  end

  @impl true
  def handle_call({:fts5_search, query, opts}, _from, state) do
    limit = Keyword.get(opts, :limit, @default_limit)
    space = Keyword.get(opts, :space)

    result = do_fts5_search(state.conn, query, limit, space)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:index_vault, vault_path}, _from, state) do
    Logger.info("[SecondBrain.Indexer] full vault index started: #{vault_path}")
    result = do_index_vault(state.conn, vault_path)
    {:reply, result, %{state | vault_path: vault_path}}
  end

  @impl true
  def handle_call({:index_file, vault_root, file_path}, _from, state) do
    result = do_index_file(state.conn, vault_root, file_path)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:remove_file, rel_path}, _from, state) do
    result = do_remove_file(state.conn, rel_path)
    {:reply, result, state}
  end

  @impl true
  def handle_call(:stats, _from, state) do
    result = do_stats(state.conn, state.db_path)
    {:reply, result, state}
  end

  @impl true
  def terminate(_reason, state) do
    if state[:conn], do: Exqlite.Sqlite3.close(state.conn)
    :ok
  end

  # --- Internal implementation ---

  defp resolve_db_path do
    base =
      case :code.priv_dir(:ema) do
        {:error, _} -> Path.join(File.cwd!(), "priv")
        dir -> to_string(dir)
      end

    Path.join(base, @db_name)
  end

  defp default_vault_path do
    Path.expand("~/vault")
  end

  defp open_and_init_db(path) do
    with {:ok, conn} <- Exqlite.Sqlite3.open(path),
         :ok <- Exqlite.Sqlite3.execute(conn, "PRAGMA journal_mode=WAL"),
         :ok <- Exqlite.Sqlite3.execute(conn, "PRAGMA synchronous=NORMAL"),
         :ok <- create_fts5_table(conn) do
      {:ok, conn}
    end
  end

  defp create_fts5_table(conn) do
    # FTS5 virtual table: path is the rowid-column key (unindexed), rest are full-text columns.
    # content= makes this a "content table" style FTS (we own the content).
    ddl = """
    CREATE VIRTUAL TABLE IF NOT EXISTS vault_fts USING fts5(
      path UNINDEXED,
      title,
      body,
      tags UNINDEXED,
      tokenize = 'porter ascii'
    )
    """

    Exqlite.Sqlite3.execute(conn, ddl)
  end

  defp do_fts5_search(conn, query, limit, space) do
    # Sanitize query to prevent injection (FTS5 query syntax is a DSL, not SQL injection risk,
    # but we still escape double-quotes to prevent malformed queries).
    safe_query = String.replace(query, ~r/[^\w\s"'*^()\-|]/, " ")

    {sql, params} =
      if space && space != "" do
        {"""
         SELECT path, title,
                snippet(vault_fts, 2, '[', ']', '...', 12) AS snippet,
                rank
         FROM vault_fts
         WHERE vault_fts MATCH ?1
           AND path LIKE ?2
         ORDER BY rank
         LIMIT ?3
         """, [safe_query, "#{space}/%", limit]}
      else
        {"""
         SELECT path, title,
                snippet(vault_fts, 2, '[', ']', '...', 12) AS snippet,
                rank
         FROM vault_fts
         WHERE vault_fts MATCH ?1
         ORDER BY rank
         LIMIT ?2
         """, [safe_query, limit]}
      end

    case Exqlite.Sqlite3.prepare(conn, sql) do
      {:ok, stmt} ->
        Exqlite.Sqlite3.bind(stmt, params)
        rows = collect_rows(conn, stmt, [])
        Exqlite.Sqlite3.release(conn, stmt)

        results =
          Enum.map(rows, fn [path, title, snippet, rank] ->
            %{path: path, title: title, snippet: snippet, rank: rank}
          end)

        {:ok, results}

      {:error, reason} ->
        Logger.warning("[SecondBrain.Indexer] prepare failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp do_index_vault(conn, vault_path) do
    md_files =
      vault_path
      |> Path.join("**/*.md")
      |> Path.wildcard()

    Logger.info("[SecondBrain.Indexer] indexing #{length(md_files)} markdown files")

    # Batch within a single transaction for speed
    :ok = Exqlite.Sqlite3.execute(conn, "BEGIN")

    results =
      Enum.map(md_files, fn abs_path ->
        rel_path = Path.relative_to(abs_path, vault_path)
        do_index_file_inner(conn, vault_path, abs_path, rel_path)
      end)

    :ok = Exqlite.Sqlite3.execute(conn, "COMMIT")

    errors = Enum.filter(results, &match?({:error, _}, &1))

    if errors == [] do
      Logger.info("[SecondBrain.Indexer] vault index complete (#{length(md_files)} notes)")
      :ok
    else
      Logger.warning("[SecondBrain.Indexer] #{length(errors)} files failed to index")
      :ok
    end
  end

  defp do_index_file(conn, vault_root, file_path) do
    rel_path =
      if String.starts_with?(file_path, vault_root) do
        Path.relative_to(file_path, vault_root)
      else
        file_path
      end

    abs_path =
      if Path.type(file_path) == :absolute do
        file_path
      else
        Path.join(vault_root, file_path)
      end

    do_index_file_inner(conn, vault_root, abs_path, rel_path)
  end

  defp do_index_file_inner(conn, _vault_root, abs_path, rel_path) do
    case File.read(abs_path) do
      {:ok, content} ->
        {title, body, tags} = parse_markdown(content, rel_path)

        # DELETE existing row (FTS5 doesn't have upsert)
        case Exqlite.Sqlite3.prepare(conn, "DELETE FROM vault_fts WHERE path = ?1") do
          {:ok, del_stmt} ->
            Exqlite.Sqlite3.bind(del_stmt, [rel_path])
            Exqlite.Sqlite3.step(conn, del_stmt)
            Exqlite.Sqlite3.release(conn, del_stmt)
          _ -> :ok
        end

        # INSERT fresh row
        insert_sql = "INSERT INTO vault_fts(path, title, body, tags) VALUES (?1, ?2, ?3, ?4)"

        case Exqlite.Sqlite3.prepare(conn, insert_sql) do
          {:ok, ins_stmt} ->
            Exqlite.Sqlite3.bind(ins_stmt, [rel_path, title, body, tags])
            Exqlite.Sqlite3.step(conn, ins_stmt)
            Exqlite.Sqlite3.release(conn, ins_stmt)
            :ok

          {:error, reason} ->
            {:error, {rel_path, reason}}
        end

      {:error, reason} ->
        Logger.debug("[SecondBrain.Indexer] skip #{rel_path}: #{inspect(reason)}")
        {:error, {rel_path, reason}}
    end
  end

  defp do_remove_file(conn, rel_path) do
    case Exqlite.Sqlite3.prepare(conn, "DELETE FROM vault_fts WHERE path = ?1") do
      {:ok, stmt} ->
        Exqlite.Sqlite3.bind(stmt, [rel_path])
        Exqlite.Sqlite3.step(conn, stmt)
        Exqlite.Sqlite3.release(conn, stmt)
        :ok

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp do_stats(conn, db_path) do
    case Exqlite.Sqlite3.prepare(conn, "SELECT count(*) FROM vault_fts") do
      {:ok, stmt} ->
        rows = collect_rows(conn, stmt, [])
        Exqlite.Sqlite3.release(conn, stmt)
        count = get_in(rows, [Access.at(0), Access.at(0)]) || 0
        {:ok, %{count: count, db_path: db_path}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  # Walks all rows from a prepared + bound statement
  defp collect_rows(conn, stmt, acc) do
    case Exqlite.Sqlite3.step(conn, stmt) do
      {:row, row} -> collect_rows(conn, stmt, [row | acc])
      :done -> Enum.reverse(acc)
      {:error, _} -> Enum.reverse(acc)
    end
  end

  # Extracts title, body text, and tags from markdown content.
  # Title: first H1 heading, or frontmatter title, or filename stem.
  # Tags: frontmatter tags array joined as space-separated string.
  # Body: content with frontmatter stripped.
  defp parse_markdown(content, rel_path) do
    {frontmatter, body_raw} = split_frontmatter(content)
    title = extract_title(frontmatter, body_raw, rel_path)
    tags = extract_tags(frontmatter)
    # Strip markdown syntax from body for better tokenization
    body = clean_body(body_raw)
    {title, body, tags}
  end

  defp split_frontmatter("---\n" <> rest) do
    case String.split(rest, "\n---\n", parts: 2) do
      [fm, body] -> {fm, body}
      _ -> {"", rest}
    end
  end

  defp split_frontmatter(content), do: {"", content}

  defp extract_title(frontmatter, body, rel_path) do
    # Try frontmatter title: first
    fm_title =
      case Regex.run(~r/^title:\s*"?(.+?)"?\s*$/m, frontmatter) do
        [_, t] -> String.trim(t)
        _ -> nil
      end

    # Try first H1 in body
    h1_title =
      case Regex.run(~r/^#\s+(.+)$/m, body) do
        [_, t] -> String.trim(t)
        _ -> nil
      end

    fm_title || h1_title || Path.basename(rel_path, ".md")
  end

  defp extract_tags(frontmatter) do
    # Match YAML array: tags: [a, b, c]  or multi-line - item format
    case Regex.run(~r/^tags:\s*\[([^\]]*)\]/m, frontmatter) do
      [_, tags_str] ->
        tags_str
        |> String.split(",")
        |> Enum.map(&String.trim/1)
        |> Enum.reject(&(&1 == ""))
        |> Enum.join(" ")

      _ ->
        # Try multiline tags
        Regex.scan(~r/^  - (.+)$/m, frontmatter)
        |> Enum.map(fn [_, tag] -> String.trim(tag) end)
        |> Enum.join(" ")
    end
  end

  defp clean_body(body) do
    body
    # Strip wikilinks: [[target|alias]] → alias or target
    |> String.replace(~r/\[\[([^\]|]+)\|([^\]]+)\]\]/, "\\2")
    |> String.replace(~r/\[\[([^\]]+)\]\]/, "\\1")
    # Strip markdown links
    |> String.replace(~r/\[([^\]]+)\]\([^)]+\)/, "\\1")
    # Strip code blocks (don't index raw code)
    |> String.replace(~r/```[\s\S]*?```/, " ")
    |> String.replace(~r/`[^`]+`/, " ")
    # Strip HTML tags
    |> String.replace(~r/<[^>]+>/, " ")
    # Collapse whitespace
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
  end
end
