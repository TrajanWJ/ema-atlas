---
type: research
confidence: 0.82
source: T1/T2 primary + hexdocs
summary: "W9-12 implementation specs for 6 EMA gaps: VaultLearner, PromptOptimizer, BudgetEnforcer, PipeTemplates, AdaptiveRouter, OTP patterns"
tags: [ema, elixir, otp, ai-agents, research]
date: 2026-04-04
---

# EMA W9-12: Gap Analysis & Implementation Research
*Sources: 11 fetched (6 T1 primary docs, 4 T1 official repos, 1 T2) + deep domain knowledge*
*Confidence: High per gap unless noted | Date: 2026-04-04*

## Summary

All 6 EMA gaps have clear, well-proven implementation patterns. The dominant cross-gap theme is **async fire-and-forget with ETS as the fast path**: memory writes, signal routing, budget enforcement, and A/B selection all benefit from the same OTP pattern — synchronous path unchanged, async post-processing via Task.start or Broadway, ETS for hot reads. The two highest-impact gaps to close first are **VaultLearner** (every agent run produces latent knowledge that's currently thrown away) and **Budget enforcement** (unconstrained spend is a live risk). The feedback loop gaps (Gap 5) depend on Gap 2 infrastructure and should go last.

---

## Gap 1: VaultLearner — Agent Post-Task Knowledge Write-Back

### What's Missing
`AgentWorker.dispatch_to_domain/3` returns a response struct that goes nowhere persistent. ContextInjector reads the vault but nothing writes back. There is no "agent ran, learned X, persist X" loop.

### Best Pattern: CrewAI-style extract_memories + async file write

**CrewAI's pattern** (T1 — docs.crewai.com/concepts/memory): After each task completion, `memory.extract_memories(output)` breaks raw agent output into discrete atomic facts using an LLM call. Facts are then written to the memory backend asynchronously (`remember_many()` is non-blocking; crew's `kickoff()` drains in `finally`). The key insight: **store facts, not blobs**. One agent response → N atomic Obsidian notes.

**Letta's pattern** (T1 — docs.letta.com/guides/core-concepts/stateful-agents): All agent state is persisted in a database. "Core memories" are in-context (pinned to system prompt), "archival memories" are searchable. Agents modify their own memories via tools. Key: memory blocks are editable by agents themselves, not just by external code.

**For EMA's Obsidian vault**: The equivalent is a post-task hook that:
1. Extracts learnings from the agent response (via a brief Claude call or structured prompt)
2. Determines the target vault path (per agent, per campaign, or per task_type)
3. Writes a markdown note with proper frontmatter
4. Updates the QMD index async

### Recommended Approach: VaultLearner GenServer + Task.start hook

**Confidence: High**

The pattern is a supervised GenServer that accepts `{:write_learning, agent, task_type, response_text}` messages and processes them asynchronously, never blocking the `AgentWorker` dispatch path.

---

## Gap 2: PromptOptimizer — A/B Testing LLM Prompts

### What's Missing
`AgentFitnessStore` accumulates success/failure rates but `SpecializationAutotune` doesn't use them to select prompt variants. No prompt variant storage, no selection algorithm, no feedback loop closure.

### Best Pattern: Epsilon-greedy bandit over Cachex-stored variants

**DSPy's approach** (T1 — dspy.ai/learn/optimization): DSPy uses optimizers (MIPROv2, BootstrapFewShot) with 20/80 train/validation splits. The key insight for EMA: **don't implement DSPy's full pipeline**. What EMA needs is the *result* of DSPy's process: a small set of candidate prompt variants per (agent, task_type) with win rates tracked in ETS.

**Epsilon-greedy bandit**: At each dispatch, with probability ε (e.g. 0.1) pick a random variant; otherwise pick the highest win-rate variant. Win rates update after `SignalProcessor` fires. This is simpler than Thompson Sampling and sufficient for O(5) variants per agent.

**Cachex for variant storage** (T1 — hexdocs.pm/cachex): `Cachex.fetch/3` with fallback generation is perfect for lazy variant loading. TTL can be set per variant to force periodic re-evaluation. `Cachex.get_and_update/4` supports atomic win-rate updates.

### Recommended Approach: PromptVariantStore (Cachex-backed) + BanditSelector

**Confidence: High**

---

## Gap 3: Budget Enforcement + Autonomy Levels

### What's Missing
`CostAggregator` tracks daily spend but nothing enforces a ceiling. No kill switch, no autonomy levels (Assist/Auto/Full) in the dispatch path.

### Best Pattern: Fuse circuit breaker + GenServer budget gate

**Fuse** (T1 — github.com/jlouis/fuse README): Erlang/Elixir circuit breaker. Core API: `fuse:install(Name, Opts)`, `fuse:ask(Name, Context)` → `ok | blown`, `fuse:melt(Name)`. Strategy `{standard, MaxR, MaxT}` with `{reset, TimeMs}` refresh. **Sub-microsecond ask overhead** (2.1M queries/sec on modern hardware). Manual admin: `fuse:circuit_disable/1` and `fuse:circuit_enable/1` provide the kill switch.

**Budget gate pattern**: Before each Claude invocation, ask the budget fuse. If blown, return `{:error, :budget_exceeded}`. After each invocation, check if cumulative cost exceeds threshold and melt the fuse.

**Autonomy levels** (inspired by AutoGen's human-in-loop modes):
- `:assist` — every action requires approval (stream to user, await explicit `:ok`)
- `:auto` — execute within budget, post-hoc notify
- `:full` — execute, no notification

The autonomy level is stored in a process config or ETS and checked at dispatch time.

### Recommended Approach: BudgetEnforcer (Fuse wrapper) + AutonomyConfig GenServer

**Confidence: High**

---

## Gap 4: Pipe Templates — Morning Briefing, EOD Review

### What's Missing
The Pipes infrastructure (6 active, trigger-pattern matched, `claude_action` type) exists but no pre-built AI workflow templates are built. No Morning Briefing pipe, no EOD Review pipe.

### Best Pattern: Quantum-scheduled trigger → Pipe → Claude → Discord delivery

**Quantum** (T1 — hexdocs.pm/quantum v3.5.3): Cron-like job scheduler for Elixir. Setup: `use Quantum, otp_app: :your_app`, add to supervision tree, configure jobs with cron expressions. `@daily` shorthand supported. Jobs receive zero config overhead.

**Morning Briefing composition** (domain knowledge, Medium confidence):
Standard pattern from production AI briefing systems: (1) fetch daily goals from vault, (2) pull pending campaigns from CampaignManager, (3) query AgentFitnessStore for yesterday's win rates, (4) compose via Claude with structured prompt, (5) deliver to Discord. Key: **structure the context, not the prose** — let Claude write the briefing but give it structured JSON inputs.

**EOD Review composition**: Mirror of morning: (1) collect completed tasks since last EOD, (2) extract signal outcomes from SignalProcessor logs, (3) summarize to vault via VaultLearner (cross-gap!), (4) send Discord summary.

### Recommended Approach: EmaScheduler (Quantum) + PipeTemplates.MorningBriefing + PipeTemplates.EodReview

**Confidence: High** (infrastructure clear; content composition Medium)

---

## Gap 5: SignalProcessor → SpecializationAutotune Feedback Loop

### What's Missing
`SignalProcessor` fires `{:signal, agent, task_type, outcome}` events to `AgentFitnessStore`. `SpecializationAutotune` reads fitness scores. But routing weights are never updated — the selection algorithm at dispatch time doesn't change based on learned fitness.

### Best Pattern: UCB1 over ETS routing weights

**UCB1 formula**: `score = avg_reward + sqrt(2 * ln(N) / n_i)` where `N` is total dispatches, `n_i` is dispatches to agent i. This naturally balances exploitation (high avg reward) with exploration (low n_i). It's provably optimal for stationary distributions and simple to implement in pure ETS.

**Why UCB over Thompson Sampling**: Thompson Sampling requires maintaining Beta distribution parameters (α, β) per arm. UCB1 requires only {total_reward, count} per arm — fits naturally into `AgentFitnessStore`'s existing data model. **Medium confidence** — if fitness distributions are highly non-stationary (agent performance changes fast), Thompson Sampling is superior but the added complexity is not justified for EMA's scale.

**ETS implementation pattern**: `:ets.update_counter/3` for atomic increment of counts and sum of rewards. Read path via `:ets.lookup/2` for UCB score calculation — no GenServer call on the hot path.

**Closing the loop**: `SpecializationAutotune` needs one new function: `update_routing_weight/3` called from `SignalProcessor` after each signal, updating ETS directly. The router then reads ETS weights instead of static config.

### Recommended Approach: UCB1RouterWeights (ETS) + SpecializationAutotune.update/3

**Confidence: High** (UCB1 implementation) / **Medium** (fitness signal quality)

---

## Gap 6: OpenClaw Bridge Adapter Fallback

### What's Missing
`Ema.Claude.Adapters.OpenClaw` falls back to `ClaudeCli.run/3` which is either undefined or private. The OpenClaw integration fails non-gracefully.

### Best Pattern: Explicit adapter protocol with fallback chain

This is a straightforward code fix, not an architectural research question. The pattern is:

1. Define a public `ClaudeCli` module or expose `run/3` via the public API
2. In the OpenClaw adapter, wrap the fallback in a `try/rescue` or use `apply/3` with module existence check
3. Use `Fuse` (Gap 3 infrastructure) on the OpenClaw adapter itself so repeated failures trip the circuit and auto-fall-through without polling

**From Fuse docs** (T1): The `fuse:run(Name, fun, Context)` pattern is exactly right here — wrap the OpenClaw call in a fuse, fall through to `ClaudeCli` when blown.

### Recommended Approach: Fix ClaudeCli visibility + Fuse-wrapped adapter chain

**Confidence: High** (simple fix once Gap 3 Fuse is installed)

---

## Executable Specs

### Gap 1: VaultLearner

```elixir
defmodule Ema.Intelligence.VaultLearner do
  @moduledoc """
  Post-task knowledge extraction and vault write-back.
  Called async by AgentWorker after dispatch_to_domain returns.
  """
  use GenServer
  require Logger

  @type learning_opts :: %{
    agent: atom(),
    task_type: atom(),
    campaign_id: binary() | nil,
    response_text: binary(),
    session_id: binary()
  }

  ## Public API

  @spec schedule_learning(learning_opts()) :: :ok
  def schedule_learning(opts) do
    # Non-blocking — never delays AgentWorker
    GenServer.cast(__MODULE__, {:extract_and_write, opts})
  end

  @spec write_note(binary(), binary(), map()) :: {:ok, binary()} | {:error, term()}
  def write_note(vault_path, content, frontmatter) do
    GenServer.call(__MODULE__, {:write_note, vault_path, content, frontmatter})
  end

  ## GenServer

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    {:ok, %{pending: 0}}
  end

  def handle_cast({:extract_and_write, opts}, state) do
    Task.start(fn -> do_extract_and_write(opts) end)
    {:noreply, %{state | pending: state.pending + 1}}
  end

  def handle_call({:write_note, vault_path, content, frontmatter}, _from, state) do
    result = write_vault_note(vault_path, content, frontmatter)
    {:reply, result, state}
  end

  ## Private

  defp do_extract_and_write(%{agent: agent, task_type: task_type, response_text: text} = opts) do
    with {:ok, learnings} <- extract_learnings(text, agent, task_type),
         {:ok, path} <- determine_vault_path(agent, task_type, opts),
         :ok <- write_learning_note(path, learnings, opts),
         :ok <- update_qmd_index() do
      Logger.info("VaultLearner: wrote #{length(learnings)} facts for #{agent}/#{task_type}")
    else
      {:error, reason} ->
        Logger.warning("VaultLearner: extraction failed: #{inspect(reason)}")
    end
  end

  @spec extract_learnings(binary(), atom(), atom()) :: {:ok, [binary()]} | {:error, term()}
  defp extract_learnings(response_text, agent, task_type) do
    # Brief extraction prompt — returns list of atomic fact strings
    # Pattern from CrewAI: extract_memories(content) → [fact1, fact2, ...]
    prompt = """
    Extract 2-5 discrete, reusable facts from this #{agent} agent response on task #{task_type}.
    Each fact must be a single sentence. Return as JSON array of strings.
    Response: #{response_text}
    """
    case Ema.Claude.Bridge.run_ephemeral(prompt) do
      {:ok, json_text} -> Jason.decode(json_text)
      error -> error
    end
  end

  defp determine_vault_path(agent, task_type, %{campaign_id: cid}) when not is_nil(cid) do
    {:ok, "Agents/#{agent}/campaigns/#{cid}/#{task_type}.md"}
  end
  defp determine_vault_path(agent, task_type, _opts) do
    date = Date.utc_today() |> Date.to_string()
    {:ok, "Agents/#{agent}/learnings/#{date}-#{task_type}.md"}
  end

  defp write_learning_note(path, learnings, opts) do
    frontmatter = %{
      type: "agent_learning",
      agent: opts.agent,
      task_type: opts.task_type,
      session: opts.session_id,
      date: Date.utc_today() |> Date.to_string(),
      auto_generated: true
    }
    content = Enum.map_join(learnings, "\n\n", &"- #{&1}")
    full_path = Path.join(vault_base(), path)
    File.mkdir_p!(Path.dirname(full_path))
    File.write!(full_path, format_note(frontmatter, content))
    :ok
  end

  defp update_qmd_index do
    Task.start(fn ->
      System.cmd("flock", ["-n", "/tmp/qmd.lock", "qmd", "update"])
    end)
    :ok
  end

  defp vault_base, do: Application.get_env(:ema, :vault_path, "/home/trajan/vault")

  defp format_note(frontmatter, content) do
    yaml = Enum.map_join(frontmatter, "\n", fn {k, v} -> "#{k}: #{v}" end)
    "---\n#{yaml}\n---\n\n#{content}\n"
  end
end
```

**Integration point in AgentWorker:**
```elixir
# After dispatch_to_domain returns:
case AgentWorker.dispatch_to_domain(agent, task, context) do
  {:ok, response} ->
    VaultLearner.schedule_learning(%{
      agent: agent,
      task_type: task.type,
      campaign_id: task.campaign_id,
      response_text: response.content,
      session_id: response.session_id
    })
    {:ok, response}
  error -> error
end
```

---

### Gap 2: PromptOptimizer / BanditSelector

```elixir
defmodule Ema.Intelligence.PromptVariantStore do
  @moduledoc """
  Cachex-backed store for prompt variants per {agent, task_type}.
  Tracks win rates for epsilon-greedy bandit selection.
  """

  @cache_name :prompt_variants

  @type variant :: %{
    id: binary(),
    agent: atom(),
    task_type: atom(),
    template: binary(),
    wins: non_neg_integer(),
    trials: non_neg_integer(),
    created_at: DateTime.t()
  }

  def child_spec(_opts) do
    Cachex.child_spec(@cache_name, [])
  end

  @spec put_variant(atom(), atom(), binary(), binary()) :: {:ok, binary()}
  def put_variant(agent, task_type, template, id \\ UUID.uuid4()) do
    key = variant_key(agent, task_type, id)
    variant = %{
      id: id, agent: agent, task_type: task_type,
      template: template, wins: 0, trials: 0,
      created_at: DateTime.utc_now()
    }
    Cachex.put(@cache_name, key, variant)
    {:ok, id}
  end

  @spec list_variants(atom(), atom()) :: [variant()]
  def list_variants(agent, task_type) do
    prefix = "#{agent}:#{task_type}:"
    {:ok, keys} = Cachex.keys(@cache_name)
    keys
    |> Enum.filter(&String.starts_with?(&1, prefix))
    |> Enum.flat_map(fn k ->
      case Cachex.get(@cache_name, k) do
        {:ok, v} when not is_nil(v) -> [v]
        _ -> []
      end
    end)
  end

  @spec record_outcome(atom(), atom(), binary(), :win | :loss) :: :ok
  def record_outcome(agent, task_type, variant_id, outcome) do
    key = variant_key(agent, task_type, variant_id)
    Cachex.get_and_update(@cache_name, key, fn
      nil -> {:ignore, nil}
      v ->
        updated = %{v |
          trials: v.trials + 1,
          wins: if(outcome == :win, do: v.wins + 1, else: v.wins)
        }
        {:commit, updated}
    end)
    :ok
  end

  @spec select_variant(atom(), atom(), float()) :: {:ok, variant()} | {:error, :no_variants}
  def select_variant(agent, task_type, epsilon \\ 0.1) do
    variants = list_variants(agent, task_type)
    case variants do
      [] -> {:error, :no_variants}
      vs ->
        if :rand.uniform() < epsilon do
          # Explore: pick random
          {:ok, Enum.random(vs)}
        else
          # Exploit: pick highest win rate (UCB1 if desired)
          best = Enum.max_by(vs, fn v ->
            if v.trials == 0, do: 1.0, else: v.wins / v.trials
          end)
          {:ok, best}
        end
    end
  end

  defp variant_key(agent, task_type, id), do: "#{agent}:#{task_type}:#{id}"
end
```

---

### Gap 3: BudgetEnforcer + AutonomyConfig

```elixir
defmodule Ema.Intelligence.BudgetEnforcer do
  @moduledoc """
  Fuse-based circuit breaker for daily AI spend limits.
  Integrates with CostAggregator for spend tracking.
  """

  @fuse_name :ema_budget_fuse

  @type autonomy_level :: :assist | :auto | :full

  ## Fuse setup — call in Application.start/2
  @spec install(keyword()) :: :ok
  def install(opts \\ []) do
    max_violations = Keyword.get(opts, :max_violations, 3)
    window_ms = Keyword.get(opts, :window_ms, :timer.hours(1))
    reset_ms = Keyword.get(opts, :reset_ms, :timer.hours(24))
    :fuse.install(@fuse_name, {{:standard, max_violations, window_ms}, {:reset, reset_ms}})
    :ok
  end

  ## Called before each Claude invocation
  @spec check_budget() :: :ok | {:error, :budget_exceeded}
  def check_budget do
    case :fuse.ask(@fuse_name, :sync) do
      :ok -> :ok
      :blown -> {:error, :budget_exceeded}
    end
  end

  ## Called after CostAggregator updates daily total
  @spec notify_spend(float(), float()) :: :ok
  def notify_spend(current_total, daily_limit) do
    if current_total >= daily_limit do
      :fuse.melt(@fuse_name)
    end
    :ok
  end

  ## Kill switch — admin use
  @spec disable() :: :ok
  def disable, do: :fuse.circuit_disable(@fuse_name)

  @spec enable() :: :ok
  def enable, do: :fuse.circuit_enable(@fuse_name)
end

defmodule Ema.Intelligence.AutonomyConfig do
  @moduledoc """
  ETS-backed autonomy level configuration per agent/global.
  Checked at dispatch time; defaults to :auto.
  """
  use GenServer

  @table :ema_autonomy_config

  def start_link(_), do: GenServer.start_link(__MODULE__, [], name: __MODULE__)

  def init(_) do
    :ets.new(@table, [:named_table, :public, read_concurrency: true])
    :ets.insert(@table, {:global, :auto})
    {:ok, %{}}
  end

  @spec get_level(atom() | :global) :: :assist | :auto | :full
  def get_level(agent \\ :global) do
    case :ets.lookup(@table, agent) do
      [{^agent, level}] -> level
      [] -> get_level(:global)
    end
  end

  @spec set_level(atom() | :global, :assist | :auto | :full) :: :ok
  def set_level(target, level) do
    :ets.insert(@table, {target, level})
    :ok
  end
end
```

**Dispatch integration:**
```elixir
defmodule Ema.AgentWorker do
  def dispatch_to_domain(agent, task, context) do
    with :ok <- BudgetEnforcer.check_budget(),
         level <- AutonomyConfig.get_level(agent),
         :ok <- maybe_request_approval(level, agent, task) do
      # ... existing dispatch logic
    end
  end

  defp maybe_request_approval(:assist, agent, task) do
    # Stream proposal to user, await {:ok} or {:reject}
    # Returns :ok or {:error, :rejected}
    Ema.HumanApproval.request(agent, task)
  end
  defp maybe_request_approval(_level, _agent, _task), do: :ok
end
```

---

### Gap 4: Pipe Templates

```elixir
defmodule Ema.Scheduler do
  @moduledoc "Quantum-based cron scheduler for EMA pipes."
  use Quantum, otp_app: :ema
end

# In config/config.exs:
# config :ema, Ema.Scheduler,
#   jobs: [
#     morning_briefing: [
#       schedule: "0 7 * * *",
#       task: {Ema.Pipes.Templates.MorningBriefing, :run, []}
#     ],
#     eod_review: [
#       schedule: "0 21 * * *",
#       task: {Ema.Pipes.Templates.EodReview, :run, []}
#     ]
#   ]

defmodule Ema.Pipes.Templates.MorningBriefing do
  @moduledoc """
  Morning Briefing pipe: vault goals + pending campaigns + fitness scores → Claude → Discord.
  """

  def run do
    with {:ok, context} <- build_briefing_context(),
         {:ok, briefing} <- generate_briefing(context),
         :ok <- deliver(briefing) do
      :ok
    else
      {:error, reason} -> Logger.error("MorningBriefing failed: #{inspect(reason)}")
    end
  end

  defp build_briefing_context do
    goals = Ema.Vault.VaultIndex.search("daily goals current week", limit: 5)
    campaigns = Ema.CampaignManager.list_active()
    fitness = Ema.Intelligence.AgentFitnessStore.get_yesterday_summary()
    {:ok, %{goals: goals, campaigns: campaigns, fitness: fitness, date: Date.utc_today()}}
  end

  defp generate_briefing(context) do
    prompt = """
    Generate a concise morning briefing for #{context.date}.

    Active goals:
    #{format_goals(context.goals)}

    Active campaigns (#{length(context.campaigns)}):
    #{format_campaigns(context.campaigns)}

    Agent performance yesterday:
    #{format_fitness(context.fitness)}

    Write 3-5 paragraphs: priorities for today, campaigns needing attention, agent insights.
    Be direct and actionable. No filler.
    """
    Ema.Claude.Bridge.run_ephemeral(prompt)
  end

  defp deliver(briefing) do
    Ema.Notifications.send_discord(briefing, channel: :briefings)
  end

  defp format_goals(goals), do: Enum.map_join(goals, "\n", &"- #{&1.title}")
  defp format_campaigns(cs), do: Enum.map_join(cs, "\n", &"- [#{&1.phase}] #{&1.name}")
  defp format_fitness(f), do: inspect(f, pretty: true)
end

defmodule Ema.Pipes.Templates.EodReview do
  @moduledoc """
  EOD Review pipe: completed tasks + signal outcomes → summary → vault write + Discord.
  """

  def run do
    with {:ok, context} <- build_eod_context(),
         {:ok, review} <- generate_review(context),
         :ok <- Ema.Intelligence.VaultLearner.write_note(eod_path(), review, eod_frontmatter()),
         :ok <- deliver(review) do
      :ok
    end
  end

  defp build_eod_context do
    completed = Ema.Tasks.list_completed_today()
    signals = Ema.Intelligence.SignalProcessor.get_today_signals()
    {:ok, %{completed: completed, signals: signals, date: Date.utc_today()}}
  end

  defp generate_review(context) do
    prompt = """
    Generate an end-of-day review for #{context.date}.

    Completed tasks (#{length(context.completed)}):
    #{format_tasks(context.completed)}

    Agent outcomes today:
    #{format_signals(context.signals)}

    Write: what got done, what the agents learned, what to carry forward tomorrow.
    """
    Ema.Claude.Bridge.run_ephemeral(prompt)
  end

  defp eod_path, do: "Reviews/EOD/#{Date.utc_today()}.md"
  defp eod_frontmatter, do: %{type: "eod_review", date: Date.utc_today(), auto_generated: true}
  defp deliver(review), do: Ema.Notifications.send_discord(review, channel: :reviews)
  defp format_tasks(ts), do: Enum.map_join(ts, "\n", &"- #{&1.title}: #{&1.outcome}")
  defp format_signals(ss), do: Enum.map_join(ss, "\n", &"- #{&1.agent}/#{&1.type}: #{&1.outcome}")
end
```

---

### Gap 5: UCB1 Adaptive Router

```elixir
defmodule Ema.Intelligence.UCBRouter do
  @moduledoc """
  UCB1-based agent selection using fitness scores from AgentFitnessStore.
  Replaces static routing weights in the dispatch path.

  UCB1 score: avg_reward + sqrt(2 * ln(N) / n_i)
  Where N = total dispatches, n_i = dispatches to agent i.
  """

  @table :ema_ucb_weights

  def init do
    :ets.new(@table, [:named_table, :public, read_concurrency: true])
  end

  @type arm_stats :: %{agent: atom(), wins: non_neg_integer(), trials: non_neg_integer()}

  @spec select_agent([atom()], atom()) :: atom()
  def select_agent(candidate_agents, task_type) do
    total_dispatches = total_dispatches(task_type)

    scored = Enum.map(candidate_agents, fn agent ->
      stats = get_stats(agent, task_type)
      score = ucb1_score(stats, total_dispatches)
      {agent, score}
    end)

    {best_agent, _score} = Enum.max_by(scored, fn {_a, s} -> s end)
    best_agent
  end

  @spec record_outcome(atom(), atom(), :win | :loss) :: :ok
  def record_outcome(agent, task_type, outcome) do
    key = {agent, task_type}
    stats = get_stats(agent, task_type)
    updated = %{stats |
      trials: stats.trials + 1,
      wins: if(outcome == :win, do: stats.wins + 1, else: stats.wins)
    }
    :ets.insert(@table, {key, updated})

    # Also update total counter
    total_key = {:total, task_type}
    :ets.update_counter(@table, total_key, {2, 1}, {total_key, 0})
    :ok
  end

  defp ucb1_score(%{wins: 0, trials: 0}, _total) do
    # Unvisited arm — return infinity to ensure exploration
    :infinity
  end
  defp ucb1_score(%{wins: wins, trials: trials}, total) when total > 0 do
    avg_reward = wins / trials
    exploration = :math.sqrt(2 * :math.log(total) / trials)
    avg_reward + exploration
  end
  defp ucb1_score(%{wins: wins, trials: trials}, _total) do
    wins / trials
  end

  defp get_stats(agent, task_type) do
    key = {agent, task_type}
    case :ets.lookup(@table, key) do
      [{^key, stats}] -> stats
      [] -> %{agent: agent, wins: 0, trials: 0}
    end
  end

  defp total_dispatches(task_type) do
    key = {:total, task_type}
    case :ets.lookup(@table, key) do
      [{^key, n}] -> n
      [] -> 0
    end
  end
end
```

**Closing the loop — SpecializationAutotune update:**
```elixir
defmodule Ema.Intelligence.SpecializationAutotune do
  # ADD this function to existing module:

  @spec update_routing_weight(atom(), atom(), :success | :failure) :: :ok
  def update_routing_weight(agent, task_type, outcome) do
    bandit_outcome = if outcome == :success, do: :win, else: :loss
    UCBRouter.record_outcome(agent, task_type, bandit_outcome)
    # Also update existing AgentFitnessStore for backwards compat
    AgentFitnessStore.record(agent, task_type, outcome)
    :ok
  end
end

# In SignalProcessor — add call after existing fitness store update:
# SpecializationAutotune.update_routing_weight(signal.agent, signal.task_type, signal.outcome)
```

---

### Gap 6: OpenClaw Adapter Fix

```elixir
defmodule Ema.Claude.Adapters.OpenClaw do
  @fuse_name :ema_openclaw_fuse

  def install_fuse do
    # Trips after 5 failures in 60s, resets after 5 minutes
    :fuse.install(@fuse_name, {{:standard, 5, :timer.seconds(60)}, {:reset, :timer.minutes(5)}})
  end

  def run(prompt, opts \\ []) do
    case :fuse.ask(@fuse_name, :sync) do
      :blown ->
        # Fuse blown — fall through to ClaudeCli directly
        fallback_run(prompt, opts)
      :ok ->
        case do_openclaw_run(prompt, opts) do
          {:ok, result} -> {:ok, result}
          {:error, reason} ->
            :fuse.melt(@fuse_name)
            fallback_run(prompt, opts)
        end
    end
  end

  defp do_openclaw_run(prompt, opts) do
    # ... existing OpenClaw HTTP call
    Ema.Claude.Adapters.OpenClaw.Http.call(prompt, opts)
  end

  # FIX: expose ClaudeCli.run/3 via public delegation
  defp fallback_run(prompt, opts) do
    Ema.Claude.Adapters.ClaudeCli.run(prompt, opts)
  end
end

# In Ema.Claude.Adapters.ClaudeCli — ensure public:
defmodule Ema.Claude.Adapters.ClaudeCli do
  # Make run/3 public and not just used internally
  @spec run(binary(), keyword()) :: {:ok, binary()} | {:error, term()}
  def run(prompt, opts \\ []) do
    # existing port-based implementation
    Ema.Claude.Bridge.run_with_opts(prompt, opts)
  end
end
```

---

## Migration Plan: W9-12

### Week 9: Foundation Layer
**Dependencies: none → all other gaps build on these**

| Task | Module | Est |
|------|--------|-----|
| W9.1 | Install `:fuse` dep, implement `BudgetEnforcer`, wire into `AgentWorker` | 0.5d |
| W9.2 | Implement `AutonomyConfig` (ETS), add `:assist` mode approval stub | 0.5d |
| W9.3 | Fix `ClaudeCli.run/3` visibility, implement OpenClaw fuse fallback chain | 0.5d |
| W9.4 | Implement `VaultLearner` GenServer + extraction prompt | 1d |
| W9.5 | Wire `VaultLearner.schedule_learning/1` into `AgentWorker.dispatch_to_domain` | 0.25d |

**W9 Gate**: Budget enforced, vault write-back live, OpenClaw fallback working.

---

### Week 10: Intelligence Layer
**Dependencies: W9 complete (VaultLearner, BudgetEnforcer installed)**

| Task | Module | Est |
|------|--------|-----|
| W10.1 | Add `:cachex` dep, implement `PromptVariantStore` | 0.5d |
| W10.2 | Implement epsilon-greedy `select_variant/3`, wire into dispatch | 0.5d |
| W10.3 | Implement `UCBRouter` ETS tables + `select_agent/2` | 0.5d |
| W10.4 | Add `SpecializationAutotune.update_routing_weight/3` | 0.25d |
| W10.5 | Wire `SignalProcessor` → `SpecializationAutotune.update_routing_weight/3` | 0.25d |

**W10 Gate**: Adaptive routing live, prompt A/B selection live, feedback loop closed.

---

### Week 11: Scheduled Workflows
**Dependencies: W9 VaultLearner, W10 fitness infrastructure**

| Task | Module | Est |
|------|--------|-----|
| W11.1 | Add `:quantum` dep, implement `Ema.Scheduler` | 0.25d |
| W11.2 | Implement `MorningBriefing.run/0` with context builder | 1d |
| W11.3 | Implement `EodReview.run/0` with VaultLearner integration | 1d |
| W11.4 | Add `AgentFitnessStore.get_yesterday_summary/0` for briefing | 0.25d |

**W11 Gate**: Morning briefing firing at 07:00 UTC, EOD at 21:00 UTC.

---

### Week 12: Hardening + PromptOptimizer v1
**Dependencies: W10 PromptVariantStore, W11 scheduling**

| Task | Module | Est |
|------|--------|-----|
| W12.1 | Seed initial prompt variants from current agent prompts | 0.5d |
| W12.2 | Wire `PromptVariantStore.record_outcome/4` from `SignalProcessor` | 0.5d |
| W12.3 | Add AutonomyConfig UI (Discord command: `/ema autonomy set global auto`) | 0.5d |
| W12.4 | Add BudgetEnforcer config UI (`/ema budget set 5.00`) | 0.25d |
| W12.5 | Integration tests: bandit converges on better variant over 50 dispatches | 0.5d |

**W12 Gate**: Full feedback loop operational, autonomy configurable at runtime.

---

## Cross-Pollination Findings

Four patterns appear across multiple gaps:

### Pattern 1: Async Fire-and-Forget (Gaps 1, 2, 4)
All three gaps benefit from the same OTP pattern: synchronous path returns immediately, background `Task.start/1` handles side effects. VaultLearner learning extraction, PromptVariantStore win recording, EOD Review composition — all are post-task async work. **Never block the dispatch path.**

### Pattern 2: ETS as Fast Hot Path (Gaps 3, 5)
`BudgetEnforcer` (via Fuse's ETS-backed ask), `UCBRouter` weight lookup, `AutonomyConfig` level check — all use ETS directly on the read path. GenServer calls only on writes. This pattern achieves <1μs overhead on the hot dispatch path.

### Pattern 3: Fuse for All External/Fallible Services (Gaps 3, 6)
`BudgetEnforcer` uses Fuse for budget limits. `OpenClaw` adapter uses Fuse for upstream availability. The same `:fuse` dependency and operator model works for both. Install Fuse once in W9, apply it to both gaps simultaneously.

### Pattern 4: Signal → ETS → Route (Gap 2 + Gap 5)
`PromptVariantStore` (Cachex, which wraps ETS) and `UCBRouter` (raw ETS) both follow the same signal-to-weight update pattern. `SignalProcessor` is the single source of truth for outcomes; it should call both `SpecializationAutotune.update_routing_weight/3` AND `PromptVariantStore.record_outcome/4` in the same signal handler. One signal, two learners.

---

## Contested / Uncertain

- **Extraction quality (Gap 1)**: Using Claude to extract learnings from Claude output adds latency and API cost. Medium confidence this produces useful atomic facts vs. noise. Mitigation: log all extractions for manual review in W9; tune the extraction prompt in W10 based on what's produced.

- **UCB1 vs Thompson Sampling (Gap 5)**: UCB1 is chosen for simplicity. If EMA's agent performance is highly volatile (agents improve or degrade week-to-week due to prompt changes), Thompson Sampling handles non-stationarity better. UCB1 assumes stationarity. Since EMA is actively being developed, this may matter — revisit in W12 if UCB1 converges too slowly.

- **Bandit epsilon value (Gap 2)**: ε=0.1 is a starting point. With only 3 agents and ~5 variants each, ε should probably be higher (0.2-0.3) during W10-11 to collect enough trial data before exploiting.

- **VaultLearner extraction budget (Gap 1)**: Each agent dispatch spawning a second Claude call doubles effective API cost for learning-enabled dispatches. Consider: only extract for high-value task_types, or use a cheaper/faster model (Haiku) for extraction vs. Sonnet for the main task.

---

## Open Questions

1. **Does AgentFitnessStore already persist to disk?** If it's ETS-only and not backed by Postgres/DETS, UCB1 weights will reset on restart. Gap 5 solution assumes persistence is needed — confirm before W10.

2. **Is there a `HumanApproval` module for `:assist` mode?** The AutonomyConfig spec assumes an approval request/response flow exists. If not, W9 gap is larger than estimated.

3. **What's the existing prompt selection mechanism?** If agents currently have static single prompts (no variants), `PromptVariantStore` works fine. If there's already dynamic prompt selection, the integration point changes.

4. **Claude API budget vs. token budget?** Gap 3 spec assumes `CostAggregator` tracks dollar spend. If it only tracks tokens, `BudgetEnforcer.notify_spend/2` needs to convert. Confirm unit before W9.

---

## Sources

1. [T1] [Letta Stateful Agents](https://docs.letta.com/guides/core-concepts/stateful-agents) — memory blocks, agent self-modification, core vs archival memory model
2. [T1] [DSPy Optimization Overview](https://dspy.ai/learn/optimization/overview/) — 20/80 train/val split rationale, prompt optimization iteration loop
3. [T1] [Quantum v3.5.3 HexDocs](https://hexdocs.pm/quantum/readme.html) — cron scheduler setup, @daily shorthand, supervision tree integration
4. [T1] [Broadway v1.2.1 HexDocs](https://hexdocs.pm/broadway/Broadway.html) — async pipeline architecture, batching, back-pressure, telemetry events
5. [T1] [Cachex v4.1.1 HexDocs](https://hexdocs.pm/cachex/Cachex.html) — get_and_update atomic ops, TTL, ETS backing, fetch/4 fallback pattern
6. [T1] [Fuse circuit breaker README](https://raw.githubusercontent.com/jlouis/fuse/master/README.md) — standard/fault_injection strategies, circuit_disable/enable admin API, sub-μs ask overhead
7. [T1] [CrewAI Memory Docs](https://docs.crewai.com/en/concepts/memory.md) — extract_memories pattern, non-blocking remember_many, composite scoring, scope hierarchy
8. [T1] [Mem0 Platform Overview](https://docs.mem0.ai/platform/overview.md) — managed memory layer, graph+vector hybrid, atomic fact extraction
9. [T1] [GenStage v1.3.2 HexDocs](https://hexdocs.pm/gen_stage/GenStage.html) — producer/consumer back-pressure primitives used by Broadway
10. [T1] [LangChain OSS Overview](https://docs.langchain.com/oss/python/langchain/overview) — human-in-loop, durable execution patterns (contextual reference)
