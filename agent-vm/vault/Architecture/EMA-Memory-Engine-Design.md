---
title: "EMA Memory Engine — Native Design"
type: architecture
status: design-complete
created: 2026-04-04
author: EMA Architect
tags: [ema, memory, honcho, superman, intents, proposals, context, architecture]
related:
  - "[[Architecture/Intelligence-Integrations/superman-architecture]]"
  - "[[System/HONCHO-DECISION-2026-04-04]]"
  - "[[Projects/EMA-Phase-2-Corrected-Roadmap-2026-04-03]]"
---

# EMA Memory Engine — Native Design

> **Decision context:** Trajan chose to skip external Honcho and build a native memory engine. EMA already has better primitives — `.superman` files encode project intent, proposals capture decision history, the execution log is outcome history, and the vault is a queryable semantic knowledge graph. This document specifies how to cross-pollinate Honcho's concepts into EMA's existing data model.

---

## Why Native

| Honcho Concept | Honcho Approach | EMA Native Equivalent |
|---|---|---|
| User model | External service, serialized user data | `.superman` IDENTITY + persistent intent history |
| Session memory | Managed API, session-scoped storage | `ClaudeSessions.SessionWatcher` outcomes + execution log |
| Metamemory | Service-level decay and salience | OutcomeStore signal processor (what worked, what didn't) |
| Context injection | Pre-dispatch API call | `Superman.context_for/2` → `ContextAssembler` |
| Cross-session persistence | Remote database | Vault notes + proposal history + execution log (all local SQLite) |
| Memory tiers | Managed internally | Hot / Warm / Cold tiering in ContextAssembler |

**The insight:** EMA's data model already *is* a memory system. IntentStore doesn't need to track goals — `.superman` files already do. OutcomeStore doesn't need a new schema — the execution log already captures outcomes. ContextAssembler doesn't need to call an external service — Superman's context assembly design is already spec'd. The `Ema.Memory` module is a thin, coherent API surface over these existing primitives.

---

## Module Topology

```
Ema.Memory                         ← public API surface (thin facade)
  ├── Ema.Memory.IntentStore        ← reads/writes .superman INTENT entries
  ├── Ema.Memory.OutcomeStore       ← wraps execution log, records outcomes
  ├── Ema.Memory.ContextAssembler   ← Superman.context_for/2 implementation
  └── Ema.Memory.WikiIndex          ← vault semantic search (Week 8-9)
```

```
       ┌─────────────────────────────────┐
       │           Ema.Memory            │
       │    (public API — thin facade)   │
       └──┬──────────┬────────┬──────────┘
          │          │        │
          ▼          ▼        ▼
   IntentStore  OutcomeStore  ContextAssembler
        │             │              │
        ▼             ▼              ▼
  .superman files  execution     Hot/Warm/Cold
  intents table    log table     tier assembly
        │             │              │
        └─────────────┴──────────────┘
                      │
                      ▼
           %Ema.Memory.Context{}
              (returned to callers)
```

---

## 1. `Ema.Memory` — Public API Surface

The top-level module is a thin facade. It does no data work itself — it delegates to the appropriate sub-module and returns normalized structs.

### API

```elixir
defmodule Ema.Memory do
  @moduledoc """
  Native EMA Memory Engine.

  Public API for context assembly, intent tracking, outcome learning,
  and semantic vault search. Replaces external Honcho with EMA-native primitives.

  ## Design philosophy
  EMA already has memory — this module makes it legible.
  .superman files = intent history
  Execution log = outcome history
  Vault = semantic knowledge
  Proposals = decision history
  Memory is the API that cross-pollinates these four.
  """

  alias Ema.Memory.{IntentStore, OutcomeStore, ContextAssembler}

  @doc """
  Main entry point. Assembles full tiered context for a project.

  Returns a %Ema.Memory.Context{} struct with hot/warm/cold tiers,
  respecting the token budget (default 4000 tokens).

  ## Options
  - `max_tokens` (integer, default 4000) — token budget for assembled context
  - `tiers` (list, default [:hot, :warm, :cold]) — which tiers to include
  - `include` (list) — explicit inclusions: :intents, :proposals, :executions, :notes
  - `format` (:struct | :prompt_block) — return struct or formatted string for injection

  ## Example
      iex> Ema.Memory.context_for("proj_kamel", max_tokens: 2000)
      %Ema.Memory.Context{
        hot: %{executions: [...], proposals: [...], intents: [...]},
        warm: %{outcomes: [...], wiki_notes: [...]},
        cold: %{identity: "...", description: "..."},
        token_count: 1843
      }
  """
  @spec context_for(String.t(), keyword()) :: Ema.Memory.Context.t()
  def context_for(project_id, opts \\ []) do
    ContextAssembler.assemble(project_id, opts)
  end

  @doc """
  Record the result of an execution for future learning.

  Called post-execution by the SessionHarvester. Writes to OutcomeStore,
  which persists the structured outcome for Reflexion injection and Scope Advisor.

  ## Example
      iex> Ema.Memory.record_outcome("exec_abc", %{
      ...>   status: :success,
      ...>   agent: "coder",
      ...>   duration_ms: 42_000,
      ...>   summary: "Migrated auth to JWT, all tests passing",
      ...>   task_type: "code_migration",
      ...>   tokens_used: 18500
      ...> })
      {:ok, %OutcomeStore.Outcome{...}}
  """
  @spec record_outcome(String.t(), map()) :: {:ok, OutcomeStore.Outcome.t()} | {:error, term()}
  def record_outcome(execution_id, result) do
    OutcomeStore.record(execution_id, result)
  end

  @doc """
  Retrieve intent history for a project — what has the user wanted before?

  Returns intents in reverse chronological order (most recent first).
  Includes open, modified, and closed intents with full timestamps.

  ## Options
  - `status` (:open | :closed | :all, default :all)
  - `limit` (integer, default 50)

  ## Example
      iex> Ema.Memory.get_intent_history("proj_kamel", status: :open)
      [
        %IntentStore.Intent{text: "Migrate from Devise to JWT", status: :open, ...},
        %IntentStore.Intent{text: "Fix N+1 queries", status: :open, ...}
      ]
  """
  @spec get_intent_history(String.t(), keyword()) :: [IntentStore.Intent.t()]
  def get_intent_history(project_id, opts \\ []) do
    IntentStore.history(project_id, opts)
  end

  @doc """
  Semantic vault search scoped to a project.

  Embeds the query string and returns vault notes ranked by cosine similarity.
  Falls back to full-text search if the embedding pipeline is not yet active.

  ## Options
  - `limit` (integer, default 5)
  - `scope` (:project | :global, default :project)

  ## Example
      iex> Ema.Memory.relevant_notes("proj_kamel", "JWT authentication migration")
      [
        %{title: "Auth Architecture Notes", path: "vault/...", score: 0.92},
        %{title: "Devise vs JWT Tradeoffs", path: "vault/...", score: 0.87}
      ]
  """
  @spec relevant_notes(String.t(), String.t(), keyword()) :: [map()]
  def relevant_notes(project_id, query, opts \\ []) do
    # WikiIndex is Week 8-9; for now fall back to full-text search
    case Code.ensure_loaded(Ema.Memory.WikiIndex) do
      {:module, _} ->
        Ema.Memory.WikiIndex.search(project_id, query, opts)
      {:error, _} ->
        Ema.VaultIndex.search(query, Keyword.merge([project_id: project_id], opts))
    end
  end

  @doc """
  Retrieve successful execution patterns for a project.

  Delegates to OutcomeStore.get_successful_patterns/1.
  Used by Scope Advisor and Reflexion injection to seed smarter prompts.
  """
  @spec successful_patterns(String.t()) :: [OutcomeStore.Pattern.t()]
  def successful_patterns(project_id) do
    OutcomeStore.get_successful_patterns(project_id)
  end
end
```

### Context Struct

```elixir
defmodule Ema.Memory.Context do
  @moduledoc "Assembled tiered memory context for a project"

  @type t :: %__MODULE__{
    project_id: String.t(),
    assembled_at: DateTime.t(),
    hot: hot_tier(),
    warm: warm_tier(),
    cold: cold_tier(),
    token_count: non_neg_integer(),
    tiers_included: [atom()]
  }

  @type hot_tier :: %{
    executions: [map()],       # last 2h executions with summaries
    proposals: [map()],        # active/pending proposals
    intents: [map()]           # open intents from .superman file
  }

  @type warm_tier :: %{
    outcomes: [map()],         # last 48h execution outcomes
    wiki_notes: [map()]        # recently accessed or semantically relevant notes
  }

  @type cold_tier :: %{
    identity: String.t() | nil,        # .superman IDENTITY line
    description: String.t() | nil,     # project description from DB
    constraints: [String.t()],         # .superman CONSTRAINT entries
    relationships: [String.t()]        # .superman RELATIONSHIP entries
  }

  defstruct [
    :project_id, :assembled_at,
    :hot, :warm, :cold,
    token_count: 0,
    tiers_included: [:hot, :warm, :cold]
  ]

  @doc "Format as a prompt block for agent injection"
  def as_prompt_block(%__MODULE__{} = ctx) do
    """
    === EMA MEMORY CONTEXT (#{Date.utc_today()}) ===

    PROJECT: #{ctx.cold[:identity] || ctx.cold[:description] || "Unknown"}

    #{format_constraints(ctx.cold[:constraints])}
    #{format_section("OPEN INTENTS", ctx.hot[:intents])}
    #{format_section("ACTIVE PROPOSALS", ctx.hot[:proposals])}
    #{format_section("RECENT EXECUTIONS", ctx.hot[:executions])}
    #{format_section("RECENT OUTCOMES (48h)", ctx.warm[:outcomes])}
    #{format_section("RELEVANT NOTES", ctx.warm[:wiki_notes])}
    === END EMA MEMORY CONTEXT ===
    """
  end
end
```

---

## 2. `Ema.Memory.IntentStore` — Intent Persistence

IntentStore owns the lifecycle of project intents. It reads from and writes to `.superman` files, mirrors to a SQLite table for queryability, and tracks intent history.

### Schema

```sql
CREATE TABLE memory_intents (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id  TEXT NOT NULL,
  text        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'intent',
  -- type: 'intent' | 'constraint' | 'relationship' | 'context' | 'identity' | 'priority'
  status      TEXT NOT NULL DEFAULT 'open',
  -- status: 'open' | 'closed' | 'superseded'
  weight      REAL NOT NULL DEFAULT 0.9,
  source      TEXT NOT NULL DEFAULT 'superman_file',
  -- source: 'superman_file' | 'proposal_approved' | 'manual'
  superseded_by TEXT,           -- FK → another intent id
  closed_reason TEXT,           -- why it was closed
  inserted_at TEXT NOT NULL,    -- ISO8601
  updated_at  TEXT NOT NULL,
  closed_at   TEXT             -- NULL if still open
);

CREATE INDEX idx_intents_project ON memory_intents(project_id);
CREATE INDEX idx_intents_status  ON memory_intents(project_id, status);
CREATE INDEX idx_intents_type    ON memory_intents(project_id, type);
```

### Module

```elixir
defmodule Ema.Memory.IntentStore do
  @moduledoc """
  Reads/writes .superman INTENT entries per project.
  Persists intent edits back to .superman files.
  Tracks intent history with timestamps.

  The .superman file is the source of truth for open intents.
  The DB table is the queryable history and supports closed/superseded intents.
  """

  alias Ema.Repo
  alias Ema.Memory.IntentStore.Intent

  defmodule Intent do
    @type t :: %__MODULE__{
      id: String.t(),
      project_id: String.t(),
      text: String.t(),
      type: :intent | :constraint | :relationship | :context | :identity | :priority,
      status: :open | :closed | :superseded,
      weight: float(),
      source: :superman_file | :proposal_approved | :manual,
      inserted_at: DateTime.t(),
      updated_at: DateTime.t(),
      closed_at: DateTime.t() | nil
    }
    defstruct [:id, :project_id, :text, :type, :status, :weight, :source,
               :inserted_at, :updated_at, :closed_at]
  end

  @doc "Sync .superman file → DB. Called by VaultWatcher on .superman file change."
  @spec sync_from_file(String.t()) :: {:ok, [Intent.t()]} | {:error, term()}
  def sync_from_file(project_id) do
    project = Ema.Projects.get_project!(project_id)
    superman_path = Path.join(project.path || "", ".superman")

    case Superman.FileReader.parse(superman_path) do
      {:ok, entries} ->
        # Upsert all entries from file
        intents = Enum.map(entries, fn entry ->
          upsert_from_superman_entry(project_id, entry)
        end)

        # Mark any intents no longer in the file as closed
        close_removed_intents(project_id, entries)

        {:ok, intents}
      {:error, :enoent} ->
        {:ok, []}  # no .superman file — valid, not an error
      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc "Return intent history for a project (most recent first)"
  @spec history(String.t(), keyword()) :: [Intent.t()]
  def history(project_id, opts \\ []) do
    status = Keyword.get(opts, :status, :all)
    limit  = Keyword.get(opts, :limit, 50)
    type   = Keyword.get(opts, :type, :intent)  # default: only INTENT entries

    query = """
      SELECT * FROM memory_intents
      WHERE project_id = ?1
        #{if type != :all, do: "AND type = ?3", else: ""}
        #{if status != :all, do: "AND status = ?4", else: ""}
      ORDER BY inserted_at DESC
      LIMIT ?2
    """

    params = [project_id, limit, to_string(type), to_string(status)]
    Repo.query!(query, params)
    |> format_rows()
  end

  @doc "Get only open intents (what the user is actively pursuing)"
  @spec open_intents(String.t()) :: [Intent.t()]
  def open_intents(project_id) do
    history(project_id, status: :open, type: :intent)
  end

  @doc "Add a new intent — also appends to .superman file"
  @spec add_intent(String.t(), String.t(), keyword()) :: {:ok, Intent.t()} | {:error, term()}
  def add_intent(project_id, text, opts \\ []) do
    type   = Keyword.get(opts, :type, :intent)
    source = Keyword.get(opts, :source, :manual)

    # Write to DB
    intent = insert_intent(project_id, text, type, source)

    # Append to .superman file if source is manual
    if source == :manual do
      append_to_superman_file(project_id, type, text)
    end

    {:ok, intent}
  end

  @doc "Close an intent (completed, abandoned, superseded)"
  @spec close_intent(String.t(), String.t(), keyword()) :: {:ok, Intent.t()} | {:error, term()}
  def close_intent(intent_id, reason, opts \\ []) do
    superseded_by = Keyword.get(opts, :superseded_by)
    status = if superseded_by, do: "superseded", else: "closed"

    Repo.query!("""
      UPDATE memory_intents
      SET status = ?2, closed_reason = ?3, superseded_by = ?4, closed_at = ?5, updated_at = ?5
      WHERE id = ?1
    """, [intent_id, status, reason, superseded_by, now_iso()])

    # Remove from .superman file
    remove_from_superman_file(intent_id)

    {:ok, get_intent!(intent_id)}
  end

  @doc """
  Update intent when a proposal implies intent change.
  Called by the Proposal → Memory feedback loop on proposal approval.
  """
  @spec update_from_proposal(String.t(), map()) :: {:ok, Intent.t()} | :no_change
  def update_from_proposal(project_id, proposal) do
    # Check if the proposal title/description signals an intent change
    case detect_intent_signal(proposal) do
      {:new_intent, text} ->
        add_intent(project_id, text, source: :proposal_approved)
      {:closes_intent, pattern} ->
        close_matching_intents(project_id, pattern, "Resolved via proposal: #{proposal.title}")
      :no_change ->
        :no_change
    end
  end

  # --- Private ---

  defp upsert_from_superman_entry(project_id, %{type: type, value: value, weight: weight}) do
    Repo.query!("""
      INSERT INTO memory_intents (id, project_id, text, type, status, weight, source, inserted_at, updated_at)
      VALUES (lower(hex(randomblob(8))), ?1, ?2, ?3, 'open', ?4, 'superman_file', ?5, ?5)
      ON CONFLICT(project_id, text, type) DO UPDATE SET
        weight = ?4, status = 'open', updated_at = ?5
    """, [project_id, value, type, weight, now_iso()])
  end

  defp detect_intent_signal(proposal) do
    title_lower = String.downcase(proposal.title || "")
    cond do
      String.contains?(title_lower, ~w[migrate add implement build create]) ->
        {:new_intent, "#{proposal.title}"}
      String.contains?(title_lower, ~w[fix resolve complete close finish]) ->
        {:closes_intent, proposal.title}
      true ->
        :no_change
    end
  end

  defp append_to_superman_file(project_id, type, text) do
    project = Ema.Projects.get_project!(project_id)
    superman_path = Path.join(project.path || "", ".superman")
    keyword = type |> to_string() |> String.upcase()
    File.write!(superman_path, "\n#{keyword}: #{text}", [:append])
  end

  defp now_iso, do: DateTime.utc_now() |> DateTime.to_iso8601()
end
```

---

## 3. `Ema.Memory.OutcomeStore` — Execution Learning

OutcomeStore wraps the existing execution log to make it queryable as a learning source. It records structured outcomes from every execution, surfaces successful patterns for Reflexion injection, and feeds the Scope Advisor.

### Schema

```sql
CREATE TABLE memory_outcomes (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  execution_id    TEXT NOT NULL UNIQUE,
  project_id      TEXT NOT NULL,
  task_type       TEXT,          -- 'code_migration', 'bug_fix', 'research', etc. (inferred)
  agent_id        TEXT,          -- 'coder', 'codex', 'researcher', etc.
  status          TEXT NOT NULL, -- 'success' | 'failure' | 'partial' | 'timeout'
  summary         TEXT,          -- human-readable outcome summary
  what_worked     TEXT,          -- JSON array of effective patterns
  what_failed     TEXT,          -- JSON array of failure patterns
  scope_tokens    INTEGER,       -- tokens used (gauge of task scope)
  duration_ms     INTEGER,       -- execution wall time
  proposal_id     TEXT,          -- if outcome is from a proposal execution
  reflexion_notes TEXT,          -- lessons distilled from this outcome (set by Reflexion)
  inserted_at     TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX idx_outcomes_project   ON memory_outcomes(project_id);
CREATE INDEX idx_outcomes_agent     ON memory_outcomes(project_id, agent_id);
CREATE INDEX idx_outcomes_task_type ON memory_outcomes(project_id, task_type);
CREATE INDEX idx_outcomes_status    ON memory_outcomes(project_id, status);
CREATE INDEX idx_outcomes_time      ON memory_outcomes(project_id, inserted_at DESC);
```

### Module

```elixir
defmodule Ema.Memory.OutcomeStore do
  @moduledoc """
  Execution learning — wraps the execution log and provides queryable
  outcome history for Reflexion injection and Scope Advisor.

  The execution log is the source record.
  This store adds structured metadata (task_type, patterns, lessons)
  on top of the raw execution record.
  """

  alias Ema.Repo

  defmodule Outcome do
    @type t :: %__MODULE__{
      id: String.t(),
      execution_id: String.t(),
      project_id: String.t(),
      task_type: String.t() | nil,
      agent_id: String.t() | nil,
      status: :success | :failure | :partial | :timeout,
      summary: String.t() | nil,
      what_worked: [String.t()],
      what_failed: [String.t()],
      scope_tokens: non_neg_integer() | nil,
      duration_ms: non_neg_integer() | nil,
      proposal_id: String.t() | nil,
      reflexion_notes: String.t() | nil,
      inserted_at: DateTime.t()
    }
    defstruct [:id, :execution_id, :project_id, :task_type, :agent_id, :status,
               :summary, :what_worked, :what_failed, :scope_tokens, :duration_ms,
               :proposal_id, :reflexion_notes, :inserted_at, :updated_at]
  end

  defmodule Pattern do
    @type t :: %__MODULE__{
      task_type: String.t(),
      agent_id: String.t(),
      success_rate: float(),
      avg_duration_ms: non_neg_integer(),
      common_patterns: [String.t()],
      scope_warning: String.t() | nil,  # for Scope Advisor
      sample_count: non_neg_integer()
    }
    defstruct [:task_type, :agent_id, :success_rate, :avg_duration_ms,
               :common_patterns, :scope_warning, :sample_count]
  end

  @doc """
  Record the outcome of an execution.
  Called by SessionHarvester on execution completion.

  ## Example
      Ema.Memory.OutcomeStore.record("exec_123", %{
        status: :success,
        agent: "coder",
        duration_ms: 45_000,
        summary: "Migrated auth to JWT, 12 files modified",
        task_type: "code_migration",
        tokens_used: 22_000,
        proposal_id: "prop_456"
      })
  """
  @spec record(String.t(), map()) :: {:ok, Outcome.t()} | {:error, term()}
  def record(execution_id, result) do
    # Look up the linked execution to get project_id
    execution = Ema.Executions.get_execution!(execution_id)

    task_type = result[:task_type] || infer_task_type(execution)
    what_worked = result[:what_worked] || extract_success_patterns(result)
    what_failed = result[:what_failed] || extract_failure_patterns(result)

    Repo.query!("""
      INSERT INTO memory_outcomes
        (execution_id, project_id, task_type, agent_id, status, summary,
         what_worked, what_failed, scope_tokens, duration_ms, proposal_id, inserted_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?12)
      ON CONFLICT(execution_id) DO UPDATE SET
        status = ?5, summary = ?6, what_worked = ?7, what_failed = ?8,
        scope_tokens = ?9, duration_ms = ?10, updated_at = ?12
    """, [
      execution_id,
      execution.project_id,
      task_type,
      result[:agent],
      to_string(result[:status] || :unknown),
      result[:summary],
      Jason.encode!(what_worked),
      Jason.encode!(what_failed),
      result[:tokens_used],
      result[:duration_ms],
      result[:proposal_id],
      now_iso()
    ])
    |> then(fn _ -> {:ok, get_outcome_by_execution!(execution_id)} end)
  end

  @doc """
  Get outcomes for a project, most recent first.

  ## Options
  - `limit` (integer, default 20)
  - `status` (:success | :failure | :all, default :all)
  - `agent_id` (string) — filter by agent
  - `task_type` (string) — filter by task type
  - `since` (DateTime) — only outcomes after this time
  """
  @spec get_outcomes_for(String.t(), keyword()) :: [Outcome.t()]
  def get_outcomes_for(project_id, opts \\ []) do
    limit     = Keyword.get(opts, :limit, 20)
    status    = Keyword.get(opts, :status, :all)
    agent_id  = Keyword.get(opts, :agent_id)
    task_type = Keyword.get(opts, :task_type)
    since     = Keyword.get(opts, :since)

    conditions = build_conditions([
      {:status, status},
      {:agent_id, agent_id},
      {:task_type, task_type},
      {:since, since}
    ])

    Repo.query!("""
      SELECT * FROM memory_outcomes
      WHERE project_id = ?1 #{conditions}
      ORDER BY inserted_at DESC
      LIMIT ?2
    """, [project_id, limit])
    |> format_rows()
  end

  @doc """
  Get recent outcomes across all projects (for ContextAssembler hot tier).
  Returns last N hours of outcomes for this project.
  """
  @spec get_recent(String.t(), keyword()) :: [Outcome.t()]
  def get_recent(project_id, opts \\ []) do
    hours = Keyword.get(opts, :hours, 2)
    limit = Keyword.get(opts, :limit, 10)
    since = DateTime.add(DateTime.utc_now(), -hours * 3600, :second)

    get_outcomes_for(project_id, limit: limit, since: since)
  end

  @doc """
  Aggregate successful patterns for a project.
  Used by Scope Advisor and Reflexion injection.

  Returns grouped patterns by (agent_id, task_type) with:
  - success rate
  - average duration
  - common effective patterns
  - scope warning if failures cluster around high-token tasks
  """
  @spec get_successful_patterns(String.t()) :: [Pattern.t()]
  def get_successful_patterns(project_id) do
    Repo.query!("""
      SELECT
        agent_id,
        task_type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successes,
        AVG(duration_ms) as avg_duration,
        AVG(scope_tokens) as avg_tokens,
        MAX(CASE WHEN status = 'failure' AND scope_tokens IS NOT NULL THEN scope_tokens END) as max_failure_tokens
      FROM memory_outcomes
      WHERE project_id = ?1
      GROUP BY agent_id, task_type
      HAVING total >= 2
      ORDER BY successes DESC
    """, [project_id])
    |> format_patterns()
  end

  @doc """
  Get lessons for Reflexion injection — formatted for agent prompt.
  Returns string ready to inject into an agent's system prompt.

  ## Example output
      "Previous lessons for coder on code_migration tasks:
       ✅ What worked: Checking existing tests before refactoring, explicit file list
       ❌ What failed: Assuming file structure without listing, missing edge cases
       ⚠️ Scope: Similar tasks have timed out above ~20,000 tokens"
  """
  @spec reflexion_block(String.t(), String.t(), String.t()) :: String.t()
  def reflexion_block(project_id, agent_id, task_type) do
    outcomes = get_outcomes_for(project_id,
      agent_id: agent_id,
      task_type: task_type,
      limit: 3,
      status: :all
    )

    case outcomes do
      [] ->
        ""
      _ ->
        worked = outcomes |> Enum.flat_map(& &1.what_worked) |> Enum.uniq() |> Enum.take(3)
        failed = outcomes |> Enum.flat_map(& &1.what_failed) |> Enum.uniq() |> Enum.take(3)

        scope_warning = compute_scope_warning(project_id, agent_id, task_type)

        """
        Previous lessons for #{agent_id} on #{task_type || "similar"} tasks:
        #{if worked != [], do: "✅ What worked: #{Enum.join(worked, ", ")}", else: ""}
        #{if failed != [], do: "❌ What failed: #{Enum.join(failed, ", ")}", else: ""}
        #{scope_warning}
        """
        |> String.trim()
    end
  end

  @doc """
  Record a proposal approval outcome.
  Called by Proposal → Memory feedback loop.
  """
  @spec record_proposal_approval(map()) :: {:ok, term()} | {:error, term()}
  def record_proposal_approval(proposal) do
    Repo.query!("""
      INSERT INTO memory_outcomes
        (execution_id, project_id, task_type, agent_id, status, summary,
         what_worked, what_failed, proposal_id, inserted_at, updated_at)
      VALUES (?1, ?2, 'proposal_approved', 'human', 'success', ?3, '[]', '[]', ?4, ?5, ?5)
      ON CONFLICT(execution_id) DO NOTHING
    """, [
      "proposal_approval_#{proposal.id}",
      proposal.project_id,
      "Proposal approved: #{proposal.title}",
      proposal.id,
      now_iso()
    ])
  end

  # --- Private ---

  defp infer_task_type(execution) do
    title = String.downcase(execution.title || execution.description || "")
    cond do
      String.contains?(title, ~w[migrate refactor rewrite]) -> "code_migration"
      String.contains?(title, ~w[fix bug debug patch]) -> "bug_fix"
      String.contains?(title, ~w[research find analyze investigate]) -> "research"
      String.contains?(title, ~w[build create implement add feature]) -> "feature_build"
      String.contains?(title, ~w[review audit check scan]) -> "review"
      true -> "general"
    end
  end

  defp compute_scope_warning(project_id, agent_id, task_type) do
    pattern = get_successful_patterns(project_id)
              |> Enum.find(& &1.agent_id == agent_id and &1.task_type == task_type)

    case pattern do
      %{scope_warning: warning} when not is_nil(warning) ->
        "⚠️ Scope: #{warning}"
      _ ->
        ""
    end
  end

  defp now_iso, do: DateTime.utc_now() |> DateTime.to_iso8601()
end
```

---

## 4. `Ema.Memory.ContextAssembler` — Hot/Warm/Cold Context Assembly

See the companion document: **[[Architecture/EMA-Memory-ContextAssembler-Spec]]** for the full implementation spec of `Superman.context_for/2`.

Brief summary:
- **Hot tier** (last 2h): executions, active proposals, open intents
- **Warm tier** (last 48h): outcomes, recently accessed wiki notes
- **Cold tier** (always): `.superman` IDENTITY + project description + constraints
- **Token budget**: `max_tokens` param (default 4000) with graceful degradation
- **Output**: `%Ema.Memory.Context{}` struct (formatatable as prompt block)

---

## 5. Integration Plan: Proposal → Memory Feedback Loop

When a proposal is approved, three things happen synchronously in the approval transaction:

### Approval Hook

```elixir
defmodule Ema.Proposals.ApprovalHandler do
  @moduledoc """
  Called on proposal approval. Triggers Memory feedback loop.
  Three effects: (1) OutcomeStore record, (2) IntentStore update,
  (3) implicit ContextAssembler refresh (hot tier picks up next call).
  """

  alias Ema.Memory.{OutcomeStore, IntentStore}

  @doc "Called after Ema.Proposals.approve/2 commits to DB"
  def on_approval(proposal) do
    # 1. Record approval pattern in OutcomeStore
    #    Teaches the system what kinds of proposals get approved
    OutcomeStore.record_proposal_approval(proposal)

    # 2. Update IntentStore if proposal implies intent change
    #    e.g., "Migrate auth to JWT" → new INTENT entry in .superman file
    IntentStore.update_from_proposal(proposal.project_id, proposal)

    # 3. ContextAssembler doesn't need explicit notification
    #    On next context_for/2 call, hot tier queries from last 2h
    #    and will include this approval automatically
    :ok
  end
end
```

### Wire into Proposals context

```elixir
# In Ema.Proposals (existing context module)
def approve(proposal_id, opts \\ []) do
  proposal = get_proposal!(proposal_id)

  with {:ok, updated} <- update_proposal(proposal, %{status: :approved, approved_at: now()}) do
    # Existing: trigger execution dispatch
    Ema.Executions.dispatch_from_proposal(updated)

    # NEW: memory feedback loop
    Ema.Proposals.ApprovalHandler.on_approval(updated)

    {:ok, updated}
  end
end
```

### What the feedback loop enables

```
Proposal approved: "Migrate auth from Devise to JWT"
  │
  ├─▶ OutcomeStore records:
  │     type: proposal_approved, agent: human, status: success
  │     What worked: (tracked over time — approval patterns emerge)
  │
  ├─▶ IntentStore writes:
  │     New INTENT: "Migrate auth from Devise to JWT" → .superman file updated
  │     Any prior closed intents that match → marked superseded
  │
  └─▶ Next ContextAssembler call:
        Hot tier includes: "Proposal approved 23 min ago: Migrate auth to JWT"
        Hot tier intents: now includes the new intent
        ContextAssembler returns richer context to next agent spawn
```

---

## File Structure

```
daemon/lib/ema/memory/
├── memory.ex                  ← Ema.Memory public API (thin facade)
├── context.ex                 ← %Ema.Memory.Context{} struct + prompt formatter
├── intent_store.ex            ← IntentStore module
├── outcome_store.ex           ← OutcomeStore module
├── context_assembler.ex       ← ContextAssembler (Superman.context_for/2 impl)
└── wiki_index.ex              ← WikiIndex (Week 8-9, semantic vault search)

daemon/lib/ema/proposals/
└── approval_handler.ex        ← NEW: proposal → memory feedback loop

daemon/priv/repo/migrations/
├── YYYYMMDD_create_memory_intents.exs
└── YYYYMMDD_create_memory_outcomes.exs
```

---

## Implementation Order (Priority)

| Week | Module | Effort | Rationale |
|---|---|---|---|
| **Week 7** | `OutcomeStore` | ~2h | Wraps existing execution log — quick win |
| **Week 7** | `IntentStore` | ~3h | Reads .superman files + DB mirror |
| **Week 7** | `ApprovalHandler` | ~1h | Wires proposal approval to memory |
| **Week 8** | `ContextAssembler` | ~4h | The actual `Superman.context_for/2` impl |
| **Week 8-9** | `WikiIndex` | ~6h | Semantic embedding pipeline |
| **Week 8-9** | `Ema.Memory` facade | ~1h | Wire all sub-modules under public API |

---

## Open Questions

1. **`.superman` file writeback** — IntentStore writes new INTENT entries back to `.superman` files. This modifies files the user also edits manually. Need to ensure VaultWatcher doesn't create a sync loop (write → watch event → re-parse → re-write).

2. **Task type inference** — OutcomeStore infers task type from execution title. Quality depends on titling conventions. May need a lightweight LLM call for clean classification.

3. **WikiIndex fallback** — Until the embedding pipeline exists (Week 8-9), `Ema.Memory.relevant_notes/3` falls back to `Ema.VaultIndex.search/2` (full-text). This is fine — the API is stable, the backend can upgrade.

4. **Reflexion feedback quality** — `what_worked` and `what_failed` fields in OutcomeStore start as inferred patterns (from execution result text). For high quality, these need the executing agent to return structured self-assessment. Consider adding reflexion fields to the execution result schema.

---

*This document specifies the native EMA Memory Engine. Companion document: [[Architecture/EMA-Memory-ContextAssembler-Spec]]. Decision record: [[System/HONCHO-DECISION-2026-04-04]].*
