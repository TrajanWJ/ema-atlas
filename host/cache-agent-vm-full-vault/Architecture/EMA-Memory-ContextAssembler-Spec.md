---
title: "EMA Memory ContextAssembler — Superman.context_for/2 Implementation Spec"
type: implementation-spec
status: design-complete
created: 2026-04-04
author: EMA Architect
tags: [ema, memory, superman, context, context-assembler, hot-warm-cold, token-budget]
related:
  - "[[Architecture/EMA-Memory-Engine-Design]]"
  - "[[Architecture/Intelligence-Integrations/superman-architecture]]"
  - "[[System/HONCHO-DECISION-2026-04-04]]"
---

# EMA Memory ContextAssembler — `Superman.context_for/2` Implementation Spec

> **What this is:** The concrete implementation spec for `Superman.context_for/2` — the single most important function in EMA's intelligence layer. It assembles tiered context from five sources (execution log, proposals, intents, outcomes, vault) within a token budget, and returns a `%Superman.Context{}` / `%Ema.Memory.Context{}` struct ready for agent injection or API response.

---

## The Function Signature

```elixir
@spec context_for(project_id :: String.t(), opts :: keyword()) :: Ema.Memory.Context.t()
```

This function exists in two call paths:
1. `Superman.context_for(project_id, opts)` — legacy name, called from existing Superman module
2. `Ema.Memory.context_for(project_id, opts)` — new canonical location in Memory facade

Both delegate to `Ema.Memory.ContextAssembler.assemble/2`. The Superman module becomes a thin alias after this implementation.

---

## Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  COLD TIER (always first)                    │
│                                                             │
│  Source: .superman IDENTITY + project.description           │
│  Source: .superman CONSTRAINT entries                        │
│  Source: .superman RELATIONSHIP entries                      │
│                                                             │
│  Why first: These are structural headers that orient        │
│  the entire context. Never trim. Always include.            │
│  Typical size: 100–300 tokens                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   HOT TIER (inject next)                    │
│                                                             │
│  Source: Executions from last 2 hours (OutcomeStore)        │
│  Source: Active/pending proposals (Proposals context)       │
│  Source: Open intents (IntentStore.open_intents/1)          │
│                                                             │
│  Why hot: Most actionable context. What is happening        │
│  RIGHT NOW. Highest signal for the current task.            │
│  Typical size: 500–1500 tokens                              │
│  Trim order: executions detail → proposal detail            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   WARM TIER (inject last)                   │
│                                                             │
│  Source: Last 48h execution outcomes (OutcomeStore)         │
│  Source: Recently accessed wiki notes (VaultIndex / WikiIndex│
│                                                             │
│  Why warm: Supporting context. Useful patterns from         │
│  recent past. Wiki notes relevant to current intents.       │
│  Typical size: 800–2000 tokens                              │
│  Trim order: wiki notes → outcome details → outcome count   │
└─────────────────────────────────────────────────────────────┘
```

### Token Budget Allocation (default 4000 tokens)

| Tier | Allocation | Notes |
|---|---|---|
| Cold (always) | ~300 tokens | IDENTITY + constraints — never trimmed |
| Hot — intents | ~300 tokens | Open intents from .superman — rarely > 10 entries |
| Hot — proposals | ~400 tokens | Active proposals: title + status + 1-line summary |
| Hot — executions | ~500 tokens | Last 2h executions: title + status + result_summary |
| Warm — outcomes | ~800 tokens | Last 48h: title + agent + status + lessons |
| Warm — wiki notes | ~700 tokens | Top 3-5 relevant notes: title + 2-line excerpt |
| **Total** | **~3000** | **~1000 tokens buffer for per-call variation** |

If budget is tighter (e.g., `max_tokens: 2000`), the trim waterfall drops warm tier first, then hot tier details.

---

## Data Sources and Query Shapes

### Cold Tier Sources

```elixir
# Source 1: .superman file entries (FileReader)
# Reads: IDENTITY, CONSTRAINT, RELATIONSHIP entries
Superman.FileReader.parse(superman_path)
# → [{type: "identity", value: "StudioKamel SaaS — Rails + Hotwire on Render"}, ...]

# Source 2: Project DB record
Ema.Projects.get_project!(project_id)
# → %Project{name: "StudioKamel", description: "...", status: :active, ...}
```

### Hot Tier Sources

```elixir
# Source 3: Recent executions (last 2h)
Ema.Memory.OutcomeStore.get_recent(project_id, hours: 2, limit: 5)
# → [%Outcome{summary: "Fixed N+1 in dashboard", status: :success, duration_ms: 32000, ...}]

# Alternative if OutcomeStore not yet seeded (falls back to Executions context)
Ema.Executions.list_executions(project_id, since: two_hours_ago, limit: 5)
# → [%Execution{title: "...", status: "success", result: "...", inserted_at: ...}]

# Source 4: Active proposals
Ema.Proposals.list_proposals(project_id, status: [:pending, :approved, :in_progress])
# → [%Proposal{title: "Migrate to JWT", status: :approved, ...}]

# Source 5: Open intents
Ema.Memory.IntentStore.open_intents(project_id)
# → [%Intent{text: "Fix N+1 queries in dashboard", weight: 0.9, ...}]
# Fallback (if IntentStore not yet built):
Superman.FileReader.parse(superman_path) |> Enum.filter(& &1.type == "intent")
```

### Warm Tier Sources

```elixir
# Source 6: Last 48h outcomes
Ema.Memory.OutcomeStore.get_recent(project_id, hours: 48, limit: 10)

# Source 7: Relevant vault notes
# Priority: WikiIndex semantic search → VaultIndex text search → none
case wiki_index_available?() do
  true  -> Ema.Memory.WikiIndex.search(project_id, intents_as_query(open_intents), limit: 5)
  false -> Ema.VaultIndex.search(intents_as_query(open_intents), project_id: project_id, limit: 5)
end
# → [%{title: "Auth Architecture Notes", path: "...", excerpt: "...", score: 0.92}]
```

---

## Implementation

```elixir
defmodule Ema.Memory.ContextAssembler do
  @moduledoc """
  Implements Superman.context_for/2 — hot/warm/cold tiered context assembly.

  This is the core of EMA's intelligence layer. Called before every agent
  dispatch and for the GET /api/projects/:id/context endpoint.

  Token budget is respected via a waterfall trim strategy:
  cold tier is never trimmed, warm tier is trimmed first.
  """

  alias Ema.Memory.{IntentStore, OutcomeStore}
  alias Ema.Memory.Context
  alias Superman.FileReader

  @default_max_tokens 4000
  @chars_per_token 4  # rough approximation — refine with Tiktoken if needed

  # Trim order: lowest priority trimmed first
  @trim_order [:warm_wiki_notes, :warm_outcomes_detail, :warm_outcomes_count,
               :hot_executions_detail, :hot_proposals_detail, :hot_intents_detail]

  @doc """
  Assemble tiered context for a project within a token budget.

  ## Options
  - `max_tokens` (integer, default 4000)
  - `tiers` ([:hot, :warm, :cold] — default all three)
  - `format` (:struct | :prompt_block — default :struct)

  Returns `%Ema.Memory.Context{}` struct.
  """
  @spec assemble(String.t(), keyword()) :: Context.t()
  def assemble(project_id, opts \\ []) do
    max_tokens = Keyword.get(opts, :max_tokens, @default_max_tokens)
    tiers      = Keyword.get(opts, :tiers, [:cold, :hot, :warm])
    format     = Keyword.get(opts, :format, :struct)

    # Step 1: Load project metadata
    project = load_project(project_id)
    superman_data = load_superman_data(project)

    # Step 2: Assemble tiers (parallel where possible)
    raw = assemble_tiers(project_id, project, superman_data, tiers)

    # Step 3: Apply token budget
    budgeted = apply_token_budget(raw, max_tokens)

    # Step 4: Build output struct
    ctx = %Context{
      project_id: project_id,
      assembled_at: DateTime.utc_now(),
      hot: budgeted.hot,
      warm: budgeted.warm,
      cold: budgeted.cold,
      token_count: estimate_tokens(budgeted),
      tiers_included: tiers
    }

    case format do
      :struct -> ctx
      :prompt_block -> Context.as_prompt_block(ctx)
    end
  end

  # --- Step 2: Tier Assembly ---

  defp assemble_tiers(project_id, project, superman_data, tiers) do
    # Cold is cheap (no DB queries beyond the project already loaded)
    cold = if :cold in tiers, do: assemble_cold(project, superman_data), else: %{}

    # Hot and warm run in parallel (both are DB queries)
    {hot, warm} = if :hot in tiers or :warm in tiers do
      tasks = [
        hot:  Task.async(fn -> if :hot  in tiers, do: assemble_hot(project_id), else: %{} end),
        warm: Task.async(fn -> if :warm in tiers, do: assemble_warm(project_id), else: %{} end)
      ]
      results = Task.await_many(Keyword.values(tasks), 5_000)
      {Enum.at(results, 0), Enum.at(results, 1)}
    else
      {%{}, %{}}
    end

    %{cold: cold, hot: hot, warm: warm}
  end

  defp assemble_cold(project, superman_data) do
    %{
      identity:      find_superman_value(superman_data, "identity") || project.description,
      description:   project.description,
      constraints:   find_superman_values(superman_data, "constraint"),
      relationships: find_superman_values(superman_data, "relationship"),
      priorities:    find_superman_values(superman_data, "priority")
    }
  end

  defp assemble_hot(project_id) do
    two_hours_ago = DateTime.add(DateTime.utc_now(), -7200, :second)

    # Parallel sub-queries
    [executions_task, proposals_task, intents_task] = [
      Task.async(fn ->
        # Prefer OutcomeStore (richer), fall back to Executions
        case OutcomeStore.get_recent(project_id, hours: 2, limit: 5) do
          [] -> load_recent_executions(project_id, two_hours_ago)
          outcomes -> format_outcomes_for_hot(outcomes)
        end
      end),
      Task.async(fn ->
        Ema.Proposals.list_proposals(project_id,
          status: [:pending, :approved, :in_progress],
          limit: 5
        )
        |> format_proposals_for_hot()
      end),
      Task.async(fn ->
        case Code.ensure_loaded(IntentStore) do
          {:module, _} ->
            IntentStore.open_intents(project_id) |> format_intents_for_hot()
          {:error, _} ->
            load_superman_intents_fallback(project_id)
        end
      end)
    ]

    [executions, proposals, intents] = Task.await_many([executions_task, proposals_task, intents_task], 5_000)

    %{
      executions: executions,
      proposals: proposals,
      intents: intents
    }
  end

  defp assemble_warm(project_id) do
    [outcomes_task, wiki_task] = [
      Task.async(fn ->
        OutcomeStore.get_recent(project_id, hours: 48, limit: 10)
        |> format_outcomes_for_warm()
      end),
      Task.async(fn ->
        load_relevant_wiki_notes(project_id)
      end)
    ]

    [outcomes, wiki_notes] = Task.await_many([outcomes_task, wiki_task], 5_000)

    %{
      outcomes: outcomes,
      wiki_notes: wiki_notes
    }
  end

  # --- Step 3: Token Budget ---

  defp apply_token_budget(raw, max_tokens) do
    current = estimate_tokens(raw)
    if current <= max_tokens do
      raw
    else
      trim_to_budget(raw, max_tokens)
    end
  end

  defp trim_to_budget(raw, max_tokens) do
    Enum.reduce_while(@trim_order, raw, fn trim_key, acc ->
      if estimate_tokens(acc) <= max_tokens do
        {:halt, acc}
      else
        {:cont, apply_trim(acc, trim_key)}
      end
    end)
  end

  # Trim strategies — each reduces a specific section

  defp apply_trim(ctx, :warm_wiki_notes) do
    # Remove wiki notes entirely (warm tier — lowest priority)
    update_in(ctx, [:warm], &Map.put(&1, :wiki_notes, []))
  end

  defp apply_trim(ctx, :warm_outcomes_detail) do
    # Keep only title + status for outcomes (no lessons/patterns)
    outcomes = get_in(ctx, [:warm, :outcomes]) || []
    slim = Enum.map(outcomes, &Map.take(&1, [:summary, :status, :agent_id, :duration_ms]))
    update_in(ctx, [:warm], &Map.put(&1, :outcomes, slim))
  end

  defp apply_trim(ctx, :warm_outcomes_count) do
    # Cut warm outcomes to 5 (from 10)
    outcomes = get_in(ctx, [:warm, :outcomes]) || []
    update_in(ctx, [:warm], &Map.put(&1, :outcomes, Enum.take(outcomes, 5)))
  end

  defp apply_trim(ctx, :hot_executions_detail) do
    # Trim execution result_summary (keep title + status only)
    execs = get_in(ctx, [:hot, :executions]) || []
    slim = Enum.map(execs, &Map.take(&1, [:title, :status, :duration_ms, :agent]))
    update_in(ctx, [:hot], &Map.put(&1, :executions, slim))
  end

  defp apply_trim(ctx, :hot_proposals_detail) do
    # Trim proposals to title + status only
    proposals = get_in(ctx, [:hot, :proposals]) || []
    slim = Enum.map(proposals, &Map.take(&1, [:title, :status]))
    update_in(ctx, [:hot], &Map.put(&1, :proposals, slim))
  end

  defp apply_trim(ctx, :hot_intents_detail) do
    # Reduce intents to first 5 (shouldn't normally be needed)
    intents = get_in(ctx, [:hot, :intents]) || []
    update_in(ctx, [:hot], &Map.put(&1, :intents, Enum.take(intents, 5)))
  end

  # Never trim cold tier — it's tiny and critical

  # --- Token Estimation ---

  defp estimate_tokens(ctx) do
    ctx
    |> render_as_text()
    |> String.length()
    |> div(@chars_per_token)
  end

  defp render_as_text(ctx) when is_map(ctx) do
    ctx
    |> Jason.encode!()
    |> String.length()
    |> then(fn _ -> Jason.encode!(ctx) end)
  rescue
    _ -> inspect(ctx)
  end

  # --- Helper Loaders ---

  defp load_project(project_id) do
    Ema.Projects.get_project!(project_id)
  rescue
    _ -> %{id: project_id, name: "Unknown", description: nil, path: nil}
  end

  defp load_superman_data(project) do
    path = Path.join(project.path || "", ".superman")
    case FileReader.parse(path) do
      {:ok, entries} -> entries
      {:error, _}    -> []
    end
  end

  defp load_recent_executions(project_id, since) do
    Ema.Executions.list_executions(project_id,
      since: since,
      limit: 5,
      order: :desc
    )
    |> Enum.map(fn exec ->
      %{
        title: exec.title || exec.description,
        status: exec.status,
        agent: exec.agent_id,
        duration_ms: exec.duration_ms,
        result_summary: truncate(exec.result, 200)
      }
    end)
  end

  defp load_relevant_wiki_notes(project_id) do
    # Build a query from open intents (if available)
    query = build_intent_query(project_id)

    cond do
      # Prefer semantic search
      wiki_index_available?() ->
        Ema.Memory.WikiIndex.search(project_id, query, limit: 5)
      # Fall back to full-text
      query != "" ->
        Ema.VaultIndex.search(query, project_id: project_id, limit: 5)
        |> format_vault_results()
      # No query, no notes
      true ->
        []
    end
  end

  defp build_intent_query(project_id) do
    case Code.ensure_loaded(IntentStore) do
      {:module, _} ->
        IntentStore.open_intents(project_id)
        |> Enum.map(& &1.text)
        |> Enum.take(3)
        |> Enum.join(", ")
      {:error, _} ->
        ""
    end
  end

  # --- Formatting Helpers ---

  defp format_outcomes_for_hot(outcomes) do
    Enum.map(outcomes, fn o ->
      %{
        summary: o.summary,
        status: o.status,
        agent: o.agent_id,
        duration_ms: o.duration_ms,
        inserted_at: o.inserted_at
      }
    end)
  end

  defp format_outcomes_for_warm(outcomes) do
    Enum.map(outcomes, fn o ->
      %{
        summary: o.summary,
        status: o.status,
        agent: o.agent_id,
        duration_ms: o.duration_ms,
        what_worked: Enum.take(o.what_worked || [], 2),
        what_failed: Enum.take(o.what_failed || [], 2),
        inserted_at: o.inserted_at
      }
    end)
  end

  defp format_proposals_for_hot(proposals) do
    Enum.map(proposals, fn p ->
      %{
        id: p.id,
        title: p.title,
        status: p.status,
        summary: truncate(p.description || p.problem_statement, 150),
        score: p.score,
        created_at: p.inserted_at
      }
    end)
  end

  defp format_intents_for_hot(intents) do
    Enum.map(intents, fn i ->
      %{
        text: i.text,
        weight: i.weight,
        added_at: i.inserted_at
      }
    end)
  end

  defp load_superman_intents_fallback(project_id) do
    project = Ema.Projects.get_project!(project_id)
    path = Path.join(project.path || "", ".superman")
    case FileReader.parse(path) do
      {:ok, entries} ->
        entries
        |> Enum.filter(& &1.type == "intent")
        |> Enum.map(& %{text: &1.value, weight: &1.weight, added_at: nil})
      {:error, _} -> []
    end
  end

  defp format_vault_results(results) do
    Enum.map(results, fn r ->
      %{
        title: r.title || Path.basename(r.path || "", ".md"),
        path: r.path,
        excerpt: truncate(r.content, 200),
        score: nil
      }
    end)
  end

  defp find_superman_value(entries, type) do
    entries |> Enum.find(& &1.type == type) |> case do
      nil -> nil
      entry -> entry.value
    end
  end

  defp find_superman_values(entries, type) do
    entries |> Enum.filter(& &1.type == type) |> Enum.map(& &1.value)
  end

  defp wiki_index_available? do
    match?({:module, _}, Code.ensure_loaded(Ema.Memory.WikiIndex))
  end

  defp truncate(nil, _), do: nil
  defp truncate(text, max) when byte_size(text) > max do
    String.slice(text, 0, max) <> "…"
  end
  defp truncate(text, _), do: text
end
```

---

## Prompt Block Format

When `format: :prompt_block` is requested (or `Context.as_prompt_block/1` is called), the struct renders as:

```
=== EMA MEMORY CONTEXT (2026-04-04) ===

PROJECT: StudioKamel client management SaaS — Ruby on Rails + Hotwire, deployed on Render

CONSTRAINTS:
  • Never modify billing module without explicit approval
  • All API endpoints must have request validation
  • Database migrations must be reversible

OPEN INTENTS:
  • Migrate from Devise to custom JWT auth system [weight: 0.9]
  • Add multi-tenant workspace support [weight: 0.5]
  • Fix N+1 queries in dashboard endpoint [weight: 0.7]

ACTIVE PROPOSALS:
  • "JWT Auth Migration" — status: approved (approved 14 min ago)
  • "Dashboard Query Optimization" — status: pending

RECENT EXECUTIONS (last 2h):
  • "Fix N+1 in Project#index" — success, 32s, coder
    Result: Added eager loading for tasks and proposals, P95 query time 340ms→41ms

RECENT OUTCOMES (last 48h):
  • "Refactor auth module" — success, 45s, coder
    Worked: Explicit file list, checking existing tests first
  • "Investigate Devise token issue" — partial, 78s, researcher
    Failed: Could not reproduce in dev environment, prod-only issue

RELEVANT NOTES:
  • "Auth Architecture Notes" — vault/Architecture/auth-notes.md
    JWT vs Devise analysis, decision log, migration plan outline

=== END EMA MEMORY CONTEXT ===
```

---

## Integration Points

### 1. Pre-dispatch agent injection

```elixir
# In Ema.Executions.dispatch/2 (or Pipes trigger handler)
defp build_prompt(base_prompt, project_id, opts) do
  context_block = Ema.Memory.context_for(project_id,
    max_tokens: 2000,
    format: :prompt_block
  )

  """
  #{context_block}

  ---

  #{base_prompt}
  """
end
```

### 2. HQ Dashboard API (`GET /api/projects/:id/context`)

```elixir
defmodule EmaWeb.ProjectContextController do
  use EmaWeb, :controller

  def show(conn, %{"id" => project_id}) do
    ctx = Ema.Memory.context_for(project_id, max_tokens: 8000)

    json(conn, %{
      project_id: project_id,
      generated_at: DateTime.to_iso8601(ctx.assembled_at),
      token_count: ctx.token_count,
      cold: ctx.cold,
      hot: ctx.hot,
      warm: ctx.warm
    })
  end
end
```

### 3. Reflexion injection (Week 8)

```elixir
# In agent spawn, after context_for
reflexion = Ema.Memory.OutcomeStore.reflexion_block(project_id, agent_id, task_type)

# Prepend to base prompt if non-empty
final_prompt = if reflexion != "", do: "#{reflexion}\n\n#{base_prompt}", else: base_prompt
```

---

## Caching Strategy

Context assembly involves DB queries. For high-frequency callers (HQ polling, rapid dispatch), cache at the context level:

```elixir
# In ContextAssembler — cache with 30s TTL
# Cold tier: cached 5min (changes rarely)
# Hot tier: cached 30s (execution frequency)
# Warm tier: cached 2min (outcome frequency)

# Use Process dictionary for within-request caching
# Use ETS for cross-request caching (Superman.ContextCache GenServer)
defmodule Ema.Memory.ContextCache do
  use GenServer

  @hot_ttl_ms  30_000    # 30 seconds
  @warm_ttl_ms 120_000   # 2 minutes
  @cold_ttl_ms 300_000   # 5 minutes

  def get_or_fetch(project_id, tier, fetch_fn) do
    key = {project_id, tier}
    case :ets.lookup(:memory_context_cache, key) do
      [{^key, value, expires_at}] when expires_at > now_ms() ->
        value
      _ ->
        value = fetch_fn.()
        ttl = Map.get(%{hot: @hot_ttl_ms, warm: @warm_ttl_ms, cold: @cold_ttl_ms}, tier, @hot_ttl_ms)
        :ets.insert(:memory_context_cache, {key, value, now_ms() + ttl})
        value
    end
  end

  defp now_ms, do: System.monotonic_time(:millisecond)
end
```

---

## Failure Modes and Fallbacks

| Failure | Behavior |
|---|---|
| `.superman` file missing | Cold tier uses project.description only, no intents/constraints |
| OutcomeStore empty (not yet seeded) | Hot executions fall back to `Ema.Executions.list_executions/2` |
| IntentStore not yet built | Hot intents fall back to `Superman.FileReader` direct parse |
| WikiIndex not built | Warm wiki_notes use `Ema.VaultIndex.search/2` (full-text fallback) |
| DB query timeout | Return partial context with `partial: true` flag in struct |
| Ollama unavailable (WikiIndex) | Skip wiki notes entirely, continue with other tiers |
| Over token budget (all trims applied) | Return cold + hot only, drop warm entirely |

ContextAssembler **never raises** — it degrades gracefully and always returns a `%Context{}` struct.

---

## Performance Budget

| Operation | Expected latency | Acceptable max |
|---|---|---|
| Cold tier load (file read + project DB) | ~10ms | 50ms |
| Hot tier load (3 parallel DB queries) | ~30ms | 100ms |
| Warm tier load (2 parallel DB queries + file search) | ~50ms | 200ms |
| Token estimation | ~5ms | 20ms |
| **Total (no cache)** | **~100ms** | **300ms** |
| **Total (cached)** | **<5ms** | 20ms |

Target: `context_for/2` returns in under 200ms from cold start. This is well within the acceptable window for pre-dispatch prompt assembly.

---

## Testing Approach

```elixir
defmodule Ema.Memory.ContextAssemblerTest do
  use Ema.DataCase

  describe "assemble/2" do
    test "returns cold tier even with no .superman file" do
      project = insert(:project, description: "Test project")
      ctx = ContextAssembler.assemble(project.id)

      assert ctx.cold.description == "Test project"
      assert ctx.hot.intents == []
    end

    test "respects token budget" do
      project = insert(:project)
      insert_list(20, :execution, project_id: project.id)  # lots of data

      ctx = ContextAssembler.assemble(project.id, max_tokens: 500)

      assert ctx.token_count <= 500
    end

    test "cold tier never trimmed below 100 tokens" do
      project = insert(:project, description: "X")
      ctx = ContextAssembler.assemble(project.id, max_tokens: 50)

      # Cold tier identity is always present
      assert ctx.cold.description == "X"
    end

    test "warm tier trimmed before hot tier" do
      project = insert(:project)
      insert_list(5, :execution, project_id: project.id)
      insert_list(10, :outcome, project_id: project.id)
      insert_list(5, :vault_note)  # warm wiki notes

      # Use a budget that forces trimming
      ctx_full   = ContextAssembler.assemble(project.id, max_tokens: 4000)
      ctx_tight  = ContextAssembler.assemble(project.id, max_tokens: 1000)

      # Warm wiki notes should be gone in tight budget
      assert ctx_tight.warm.wiki_notes == []
      # Hot executions should still be present (trimmed last)
      assert ctx_tight.hot.executions != []
    end
  end
end
```

---

## Migration from Superman.Context to Ema.Memory.ContextAssembler

The existing `Superman.Context.for_project/2` (from the superman-architecture spec) is superseded by this implementation. Migration path:

```elixir
# Before (Superman.Context)
Superman.Context.for_project(project_id, max_tokens: 4000)

# After (Ema.Memory)
Ema.Memory.context_for(project_id, max_tokens: 4000)

# Or via Superman alias (backwards compat)
Superman.context_for(project_id, max_tokens: 4000)
# → delegates to Ema.Memory.ContextAssembler.assemble/2
```

The Superman module retains its public API but becomes a thin alias:

```elixir
defmodule Superman do
  def context_for(project_id, opts \\ []) do
    Ema.Memory.ContextAssembler.assemble(project_id, opts)
  end

  def search(query, opts \\ []) do
    Superman.VectorStore.search(query, opts)  # unchanged
  end
end
```

---

*This document specifies `Superman.context_for/2` as `Ema.Memory.ContextAssembler.assemble/2`. Parent document: [[Architecture/EMA-Memory-Engine-Design]]. When building, implement OutcomeStore + IntentStore first (Week 7), then implement this assembler (Week 8).*
