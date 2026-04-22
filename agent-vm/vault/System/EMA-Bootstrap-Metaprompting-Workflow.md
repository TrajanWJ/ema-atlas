---
title: EMA Bootstrap + Metaprompting Consolidation
type: system
status: in-progress
created: 2026-04-03
author: Right Hand
tags: [bootstrap, metaprompting, workflow, ema, claude-code, discord, consolidation]
---

# 🚀 EMA Bootstrap & Metaprompting Consolidation

**Goal:** Migrate workflow from fragmented (Discord channels + Claude Code sessions + VM CLI) into EMA as the single control plane. System bootstraps itself. All metaprompting, dispatch, outcome tracking happens inside EMA.

---

## THE PROBLEM: Workflow Fragmentation

### Current State (Scattered)

```
Your Brain
  ↓
Discord #dispatch
  ↓ [Right Hand reads request]
  ↓
Claude Code session (host machine)
  ↓ [Researcher, Coder, etc. spawned]
  ↓
SSH to VM for CLI work
  ↓
OpenClaw agents on VM
  ↓
Results come back to Discord
  ↓ [Right Hand synthesizes]
  ↓
Vault gets written (qmd search stale for 30min)
  ↓
Next request starts from scratch
```

**Costs:**
- 5 separate UIs (Discord, Claude Code, terminal, Obsidian, OpenClaw)
- Metaprompts live in 3 places (SOUL.md, AGENTS.md, individual agent CLAUDE.md files)
- Context switching penalty: 15-30s every request
- Outcome learning happens manually (not automated)
- No unified trace of why a decision was made
- Can't iterate on prompts from within the system

### Desired State (Unified in EMA)

```
Your Brain
  ↓
EMA Bridge (native frontend)
  ↓ [all dispatch happens here]
  ├→ Intent classification (local)
  ├→ Proposal generation (Claude)
  ├→ Agent spawn (to host via MCP)
  ├→ Live progress (streaming)
  ├→ Vault integration (real-time write)
  ├→ Outcome tracking (immediate)
  └→ Prompt learning (meta-iteration)
```

**Gains:**
- Single UI for all work
- Metaprompts live in EMA (versioned, queryable)
- One trace from request → dispatch → outcome → learning
- Automated outcome collection (no manual work)
- Can A/B test prompts inside the running system

---

## BOOTSTRAP STRATEGY

### Phase 0: Bridge Configuration (Week of 2026-04-07)

**Goal:** Migrate your operational config from Discord + AGENTS.md into EMA, self-referentially.

#### 0.1 Config Inventory (This Week)

Audit everything that defines your workflow:

| Config | Currently | Target |
|---|---|---|
| **Agent roster** | AGENTS.md (static) | EMA agents table (queryable, versionable) |
| **Intent patterns** | AGENTS.md rules | EMA router rules (trainable, updatable) |
| **SOUL.md** | Agent file (read at startup) | EMA soul table (loaded at runtime, hot-reload) |
| **Dispatch protocol** | Discord webhooks + emoji | EMA Bridge commands + buttons |
| **Outcome tracking** | memory/outcome-tracker.json | EMA outcomes table (real-time) |
| **Prompt templates** | vault/System/*.md | EMA prompts table (versions, A/B test framework) |
| **Channel routing** | discord-output-format.md | EMA routing table (per-view, per-agent) |

#### 0.2 EMA Schema Updates (This Week)

Add to EMA daemon:

```elixir
defmodule Ema.Config do
  # Metaprompting & workflow bootstrap
  
  schema "agents" do
    field :agent_id, :string      # "researcher", "coder", etc.
    field :name, :string          # "🔬 Researcher"
    field :emoji, :string         # "🔬"
    field :color, :string         # "#0099FF"
    field :capabilities, {:array, :string}
    field :triggers, {:array, :string}  # "research", "lookup", etc.
    field :max_parallel, :integer
    field :timeout_seconds, :integer
    field :soul_version, :integer
    field :active, :boolean
    field :created_at, :utc_datetime
    field :updated_at, :utc_datetime
  end
  
  schema "intents" do
    field :intent_id, :string      # "research", "build", "review", etc.
    field :name, :string          # "Research & summarize"
    field :description, :string
    field :triggers, {:array, :string}  # keywords that match this intent
    field :default_agent, :string
    field :requires_proposal, :boolean
    field :vault_output_path, :string
    field :active, :boolean
  end
  
  schema "prompts" do
    field :prompt_id, :string      # "system_router_v2"
    field :name, :string
    field :kind, :string           # "system", "user", "metaprompt"
    field :content, :text
    field :version, :integer
    field :a_b_test_group, :string # "control", "variant_a", "variant_b"
    field :metrics, :map           # {success_rate: 0.87, avg_tokens: 2100}
    field :active, :boolean
    field :created_at, :utc_datetime
  end
  
  schema "outcomes" do
    field :outcome_id, :string
    field :task_id, :string
    field :agent_id, :string
    field :intent_id, :string
    field :result, :string         # "success", "failed", "blocked"
    field :input_tokens, :integer
    field :output_tokens, :integer
    field :duration_seconds, :float
    field :vault_write_path, :string
    field :prompt_version, :integer # which prompt was used?
    field :metadata, :map
    field :inserted_at, :utc_datetime
  end
  
  schema "routing_rules" do
    field :rule_id, :string
    field :condition, :string      # "contains 'build'" or "intent == 'research'"
    field :action, :string         # "route_to:coder" or "deliberation_gate"
    field :priority, :integer
    field :active, :boolean
  end
end
```

#### 0.3 Boot-Sequence Prompt (This Week)

Create a self-referential metaprompt that runs at startup:

**File:** `vault/System/EMA-Bootstrap-Metaprompt.md`

```markdown
# EMA Bootstrap Metaprompt

You are Right Hand, bootstrapping yourself into EMA.

## Task
Read EMA's current config (agents, intents, prompts, outcomes) and:
1. Verify it matches vault/System/*.md (SOUL, AGENTS)
2. Identify stale/broken rules
3. Suggest prompt improvements based on recent outcomes
4. Auto-generate new intents from patterns in your outcome history
5. Update EMA config from vault

## Process
- Load EMA agents table → compare with AGENTS.md
- Load EMA intents table → compare with routing rules in AGENTS.md
- Load recent outcomes (last 50) → analyze patterns
- Load prompts table → check versions, metrics, A/B test results
- Generate 3 improvement proposals
- Write updated agents/intents/prompts back to EMA
- Log changes to vault (changelog.md)

## Success Criteria
- ✅ All agents table matches AGENTS.md OR discrepancy logged
- ✅ All intents table matches routing rules OR new intent created
- ✅ All prompts table has metrics from last 50 outcomes
- ✅ 3 improvement proposals generated
- ✅ Changes committed to vault
```

This runs every time EMA starts, or on-demand via:
```bash
ema system bootstrap
```

---

## METAPROMPTING CONSOLIDATION (Week 7-8)

### Problem: Prompts Scattered Across 6 Places

| Location | What | Format | Version Control |
|---|---|---|---|
| SOUL.md (agent-vm) | Right Hand personality | Markdown | Git |
| AGENTS.md (agent-vm) | Routing + delegation | Markdown | Git |
| CLAUDE.md (host) | Global Claude Code config | YAML | File mtime |
| Individual agent CLAUDE.md (host projects) | Per-agent context | YAML | File mtime |
| Researcher/Coder/Ops CLAUDE.md (inside agents) | Specialist context | YAML | Git (unclear sync) |
| EMA daemon docs | Not represented | Markdown | Git |

**Result:** Changing a prompt means:
1. Edit SOUL.md
2. OR edit AGENTS.md
3. OR SSH to host and edit CLAUDE.md
4. Somehow sync back to agent-vm
5. Restart OpenClaw? Unclear.
6. Next request uses... which version? Unknown.

### Solution: Prompts as First-Class EMA Resources

#### 1.1 Prompts Table (EMA DB)

All prompts versioned in one place:

```sql
-- List all prompts and their metrics
SELECT 
  prompt_id, 
  name, 
  kind, 
  version, 
  active, 
  metrics->>'success_rate' as success,
  metrics->>'avg_tokens' as tokens,
  a_b_test_group
FROM prompts
ORDER BY kind, version DESC;

-- Get current system router prompt
SELECT content FROM prompts 
WHERE prompt_id = 'router_system' AND active = true;

-- Compare two versions of a prompt
SELECT version, content FROM prompts 
WHERE prompt_id = 'router_system' 
ORDER BY version;
```

#### 1.2 Prompt Editing (EMA CLI)

```bash
# View current Right Hand soul
ema prompts view system:soul

# Edit it (opens $EDITOR, validates format)
ema prompts edit system:soul --content="<new content>"

# A/B test two router prompts
ema prompts test router:intent --group-a=v3 --group-b=v4 --duration=1week

# Check metrics
ema prompts metrics router:intent --period=week

# Rollback to previous version
ema prompts rollback system:soul --to-version=12

# Batch update from vault
ema prompts import vault/System/Prompts/ --overwrite
```

#### 1.3 Hot-Reload in EMA

Daemon watches for prompt changes:

```elixir
defmodule Ema.PromptsServer do
  use GenServer
  
  def init(_) do
    {:ok, %{}, {:continue, :load_prompts}}
  end
  
  def handle_continue(:load_prompts, state) do
    prompts = load_active_prompts_from_db()
    # Update in-memory cache
    :ets.insert(:prompts_cache, prompts)
    
    # Watch for changes every 30s (configurable)
    schedule_refresh()
    {:noreply, state}
  end
  
  def handle_info(:refresh, state) do
    # Check if any active prompts changed
    new_prompts = load_active_prompts_from_db()
    :ets.insert(:prompts_cache, new_prompts)
    schedule_refresh()
    {:noreply, state}
  end
  
  # When Claude Code agent needs a prompt:
  def get(prompt_id) do
    case :ets.lookup(:prompts_cache, prompt_id) do
      [{_, content, version}] -> {:ok, content, version}
      [] -> {:error, :not_found}
    end
  end
end
```

When an agent spawns:
```elixir
{:ok, soul, soul_version} = PromptsServer.get("system:soul")
{:ok, router, router_version} = PromptsServer.get("router:intent")

# Pass both to Claude Code:
claude_spawn([
  "--soul", soul,
  "--metaprompt", router,
  "--metadata", "{\"soul_v\": #{soul_version}, \"router_v\": #{router_version}}"
])
```

### Phase 1: Prompts as Data (Week 7)

- [ ] Create prompts table in EMA
- [ ] Export SOUL.md, AGENTS.md, router rules → prompts table
- [ ] CLI commands: view, edit, list, metrics
- [ ] Hot-reload in daemon
- [ ] Test with one agent spawn

### Phase 2: Metrics & Learning (Week 8)

- [ ] Every outcome logs which prompt version was used
- [ ] Dashboard: prompt success rate by version
- [ ] A/B test framework: control vs. variant prompts
- [ ] Auto-suggest: "Try adding X to your soul" (based on outcomes)
- [ ] Batch import from vault

### Phase 3: Self-Improvement (Week 9+)

- [ ] Run prompt optimizer weekly (off-peak)
- [ ] System generates N variants of current prompt
- [ ] A/B test variants against control
- [ ] Winner auto-activates if >5% improvement
- [ ] Loser versions archived but versionable

---

## WORKFLOW MIGRATION (Week 7-9)

### Current Request → Proposed EMA Flow

**Before (Now):**
```
Discord: "Research EMA architecture improvements"
  ↓ [manual copy]
Claude Code (host): "Research..." [new session]
  ↓ [waits 2-3 min]
Results in Discord thread
  ↓ [manual copy]
Vault: Create note, qmd updates in 30min
```

**After (EMA):**
```
EMA Bridge: "Research EMA architecture improvements"
  ↓ [EMA Router classifies: research intent]
  ├→ Generate proposal (Deliberation Gate checks: low risk, proceed)
  ├→ Dispatch Researcher (Claude Code spawned with prompt version logged)
  ├→ Streaming progress in Task Workspace
  ├→ Output to Knowledge Hub real-time
  ├→ Outcome logged: {agent, intent, result, tokens, vault_path}
  ├→ Vault synchronized (qmd search hot-updated)
  └→ Metrics updated (router success rate, researcher tokens, etc.)
```

**Time:** ~30s-2min (same as now, but unified)  
**Data:** Fully traced (why → how → outcome)  
**Learning:** Automatic (next similar request uses learned patterns)

### Migration Steps

#### Step 1: Build Bridge UI → EMA Backend (Week 7)

**Frontend changes:**
- Bridge view sends intent to EMA API (not Discord webhook)
- API: `POST /api/tasks/dispatch` with intent, metadata

**Backend changes:**
- Receive intent → classify (Router)
- Check deliberation gate (structural tasks)
- Spawn agent via Claude Code on host
- Stream progress back to frontend
- Collect outcome

**Test:** One successful end-to-end dispatch (research task)

#### Step 2: Route Discord → EMA (Week 8)

**Option A: Bridge Discord Bot**
- Keep Discord #dispatch channel
- Bot forwards messages to EMA API
- Bot posts results back to Discord
- Gradual migration: encourage EMA UI

**Option B: Direct Sunset**
- Turn off Discord #dispatch webhooks
- Announce: use EMA Bridge instead
- Archive Discord threads to vault
- Migrate active projects

(Recommend Option A: no disruption, users self-migrate)

#### Step 3: Consolidate Agent Prompts (Week 8)

- Export all agent CLAUDE.md files to prompts table
- Update agent spawn to read from EMA instead of disk
- Hot-reload capability
- Version every prompt change

#### Step 4: Vault Integration (Week 9)

- Every outcome writes to vault via MCP
- EMA watches vault for changes (qmd search integration)
- Knowledge Hub pulls live vault data
- Agents can query vault for context (via MCP)

---

## SELF-REFERENTIAL WORK: System Working on Itself

### The Premise

**EMA doesn't just manage work — it manages its own improvement.**

Example workflow:

```
Week 1: Router prompt v1 (success rate 82%)
  ↓
Week 2: Generate 5 prompt variants (v1.a — v1.e)
  ↓
Route random 20% of tasks to each variant
  ↓
Collect metrics after 50 tasks:
  - v1 (control): 82% success
  - v1.a: 79% success (❌ worse)
  - v1.b: 85% success (✅ better! 3% gain)
  - v1.c: 80% success
  - v1.d: 84% success
  - v1.e: 81% success
  ↓
Activate v1.b as new default
  ↓
Store v1.a, v1.c, v1.d, v1.e as historical variants
  ↓
Generate 5 new variants based on v1.b
  ↓
Repeat weekly
```

### Implementation

**Metaprompt: Weekly Prompt Evolution**

```
You are the System Optimizer. Your job: improve EMA's prompts.

Every Sunday at 22:00 UTC, you run:

1. Load metrics from prompts table (last 7 days)
2. Identify underperforming prompts (<80% success)
3. For each underperformer:
   a) Analyze recent failures: what went wrong?
   b) Generate 3 variant prompts
   c) Store variants in prompts table with a/b test group = "variant"
4. For next week, route 15% of tasks to each variant
5. Log this week's evolution in vault/System/Prompt-Evolution-Log.md

Constraints:
- Don't change more than one concept per variant (isolate what helps)
- Keep variants similar to control (80%+ overlap)
- Never activate a variant without comparing metrics
```

This prompt runs as a scheduled task (Elixir GenServer):

```elixir
defmodule Ema.PromptOptimizer do
  use GenServer
  
  def init(_) do
    schedule_next_run()
    {:ok, %{}}
  end
  
  def handle_info(:optimize, state) do
    # Load metrics
    metrics = Ema.Prompts.metrics(since: 7.days.ago)
    
    # Find underperformers
    underperformers = Enum.filter(metrics, fn m -> m.success_rate < 0.80 end)
    
    # For each, spawn optimizer agent
    Enum.each(underperformers, fn metric ->
      spawn_optimizer_agent(metric.prompt_id, metric)
    end)
    
    schedule_next_run()
    {:noreply, state}
  end
end
```

---

## INTEGRATION ARCHITECTURE

### Config Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    EMA BOOTSTRAP CYCLE                      │
└─────────────────────────────────────────────────────────────┘

On startup / on-demand:

Vault (SOUL.md, AGENTS.md)
  ↓
EMA Bootstrap Metaprompt
  ↓
Compares with EMA config tables (agents, intents, prompts, rules)
  ↓
  ├→ Missing agents? Create them
  ├→ Stale intents? Archive them
  ├→ New rules? Test them (low traffic)
  └→ Updated prompts? Hot-reload them
  ↓
Write changelog.md to vault
  ↓
EMA Ready to Dispatch


During dispatch:

User posts request in EMA Bridge
  ↓
Request → EMA API
  ↓
Intent Classifier (Router prompt v2)
  ↓
Route to agent or deliberation gate
  ↓
Load active prompts (system, router, agent SOUL)
  ↓
Spawn Claude Code with prompts + version metadata
  ↓
Agent executes, logs outcome
  ↓
Outcome → EMA outcomes table
  ↓
Update prompt metrics (success_rate, avg_tokens)
  ↓
If A/B test, assign to group (control/variant_a/variant_b)
  ↓
Vault synchronized (outcome_tracker.json, learnings)
  ↓
Next similar request uses learned patterns


Weekly metaprompt:

Load metrics for all prompts
  ↓
Identify underperformers
  ↓
Generate variants
  ↓
A/B test next week
  ↓
Activate best variant
```

---

## CHECKLIST: Bootstrap & Consolidation

### Phase 0: Config Bridge (ASAP)

- [ ] Audit all config locations (Discord, AGENTS.md, SOUL.md, CLAUDE.md files)
- [ ] Create prompts, agents, intents, outcomes tables in EMA
- [ ] Write Bootstrap Metaprompt
- [ ] Test: Run bootstrap, verify all config migrated
- [ ] Create ema system bootstrap CLI command

### Phase 1: Metaprompts (Week 7)

- [ ] Export SOUL.md → prompts table (system:soul)
- [ ] Export Router rules → prompts table (router:intent)
- [ ] CLI: prompts view/edit/list/metrics
- [ ] Hot-reload in daemon
- [ ] Test: Spawn one agent, verify it reads from EMA

### Phase 2: Workflow (Week 8)

- [ ] Bridge API: POST /api/tasks/dispatch
- [ ] Agent spawn: reads prompts from EMA
- [ ] Outcome tracking: written to EMA table
- [ ] Vault sync: outcomes mirrored to vault
- [ ] Test: One end-to-end dispatch from EMA Bridge

### Phase 3: Self-Improvement (Week 9)

- [ ] PromptOptimizer GenServer (weekly A/B test run)
- [ ] Metrics dashboard (success rate by prompt version)
- [ ] Auto-activation (best variant becomes default)
- [ ] Prompt evolution log (vault changelog)

---

## BENEFITS

**For You:**
- Single UI for all work (EMA Bridge)
- No context switching (everything in one place)
- Traceability (request → dispatch → outcome → improvement)
- Prompt evolution (automated, measurable)
- Self-documenting system (config is queryable, versionable)

**For Agents:**
- Access to current prompts (no stale CLAUDE.md files)
- Context about their own performance (metrics dashboard)
- Ability to request prompt improvements (agents can log "this prompt is unclear")
- Training feedback (outcomes show what worked)

**For the System:**
- Self-improving (weekly prompt evolution)
- Observable (metrics on every decision)
- Debuggable (full trace from request to outcome)
- Reproducible (versioned prompts, auditable decisions)

---

## TIMELINE

| Week | Task | Status |
|---|---|---|
| Now | Audit config locations | TODO |
| Now | Create EMA schema | TODO |
| Week 7 | Prompts as data + hot-reload | TODO |
| Week 7 | CLI commands for prompts | TODO |
| Week 8 | Bridge API + dispatch flow | TODO |
| Week 8 | Outcome tracking + vault sync | TODO |
| Week 9 | PromptOptimizer + metrics | TODO |
| Week 10+ | Self-improvement loop | Continuous |

---

## NEXT STEP

1. Read this doc
2. Audit your current config (list all locations)
3. Decide: Phased migration or parallel (bridge Discord + EMA)?
4. Approve schema changes for EMA
5. Start Week 7 with prompts work

Ready? 🚀
