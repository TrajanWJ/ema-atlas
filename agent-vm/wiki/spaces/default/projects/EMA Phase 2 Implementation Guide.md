---
title: EMA Phase 2 Implementation Guide
created: '2026-04-03'
updated: '2026-04-03'
type: project
status: active
confidence: 0.9
tags:
  - ema
  - phase-2
  - implementation
  - roadmap
  - campaigns
  - persistence
  - intelligence
  - guide
summary: >-
  Step-by-step guide for Phase 2 development — persistent intelligence,
  multi-turn sessions, campaigns, and the 4 MVP Trajan affordances. Ready to
  build.
related:
  - '[[Projects/EMA Master Knowledge Base]]'
  - '[[Architecture/EMA Full Integration Roadmap]]'
wiki_id: projects/EMA_Phase_2_Implementation_Guide
imported_from: vault/Projects/EMA Phase 2 Implementation Guide.md
imported_at: '2026-04-04T00:23:56.883Z'
---

# EMA Phase 2 Implementation Guide

> **Duration:** Weeks 7-8 (estimated 3 weeks)  
> **Scope:** Persistent intelligence layer + 4 MVP Trajan affordances  
> **Start:** After Phase 1 daemon auto-start issue resolved  
> **Build Trigger:** When `~/Projects/ema` is ready for focused Phase 2 work

---

## What Phase 2 Delivers

✅ Multi-turn Claude sessions with memory (no more fire-and-forget)  
✅ Campaign system for persistent, compound project context  
✅ SessionWatcher bidirectionality (EMA spawns sessions, Claude can see them)  
✅ 4 MVP Trajan affordances (Dispatch Board, Scope Advisor, Deliberation Gate, Reflexion Injection)

**Result:** Agents start having real context. Projects compound knowledge. Users see what's actually happening.

---

## Prerequisites

1. **Daemon auto-start fixed** — Tauri can launch and connect to daemon
2. **Bridge module integrated** — All `Runner.run()` callsites can use `Bridge` instead
3. **Phase 1 tests passing** — `mix test` in daemon dir passes cleanly
4. **Git is clean** — Last Phase 1 commit (5c577f0) is pushed, branch is main

**Check:**
```bash
cd ~/Projects/ema/daemon
mix test  # Should pass
git log --oneline -1  # Should show recent Phase 1 work
```

---

## Phase 2.1: Multi-Turn Sessions (Week 7, Days 1-2)

### 2.1.1 Wire Bridge Into Proposal Pipeline

**Current state:** Runner.run() calls in proposal generation, refinement, risk analysis, formatting.

**Goal:** Replace all 6 callsites with Bridge.send_message(session_id, msg) calls.

**Steps:**

1. **Identify the 6 callsites**
   ```bash
   cd ~/Projects/ema/daemon
   grep -r "Runner.run" lib/ --include="*.ex" | head -10
   ```
   Expected in: `Ema.Proposals.Pipeline.*` modules

2. **Update each callsite**
   
   Before:
   ```elixir
   Ema.Claude.Runner.run(prompt_text, model: "sonnet", timeout: 120_000)
   ```
   
   After:
   ```elixir
   # Ensure session exists
   {:ok, session} = Ema.Claude.Bridge.ensure_session(proposal.id, model: "sonnet")
   
   # Send message, get streaming result
   {:ok, result} = Ema.Claude.Bridge.send_message(session, prompt_text, 
     callback: fn event -> 
       # Broadcast to frontend for real-time updates
       broadcast_proposal_update(proposal.id, event)
     end)
   
   # Mark proposal stage as complete
   Ema.Proposals.update_stage(proposal, stage, result)
   ```

3. **Implement session lifecycle for proposals**
   ```elixir
   # In Ema.Proposals context
   def start_proposal_session(proposal, model: model) do
     Ema.Claude.Bridge.start_session(
       id: proposal.id,
       model: model,
       context: build_proposal_context(proposal)
     )
   end
   
   def add_stage_result(proposal, stage, result) do
     # Append to session memory
     Ema.Claude.Bridge.add_memory(proposal.id, 
       "#{stage} complete: #{result.summary}")
   end
   
   def finish_proposal_session(proposal) do
     Ema.Claude.Bridge.end_session(proposal.id)
   end
   ```

4. **Test locally**
   ```bash
   # Create a test proposal via API
   curl -X POST http://localhost:4488/api/proposals \
     -H "Content-Type: application/json" \
     -d '{"seed":"Redesign task system","project_id":1}'
   
   # Watch frontend for real-time streaming updates
   # Should see: Generator → Refiner → RiskAnalyzer → Formatter stages in sequence
   ```

**Verification:**
- [ ] All 6 Runner.run() callsites replaced with Bridge.send_message()
- [ ] Proposal pipeline completes successfully (same output as before)
- [ ] Real-time streaming visible in frontend (intermediate results show up)
- [ ] Session memory persists across stages (refiner sees generator output)
- [ ] Tests pass: `mix test lib/ema/proposals/`

---

### 2.1.2 Add Session Persistence to DB

**Goal:** Store active sessions in SQLite so they survive daemon restarts.

**Schema migration:**
```elixir
# priv/repo/migrations/TIMESTAMP_create_claude_sessions.exs
defmodule Ema.Repo.Migrations.CreateClaudeSessions do
  use Ecto.Migration

  def change do
    create table(:claude_sessions) do
      add :session_id, :string, null: false
      add :context_type, :string  # "proposal", "task", "campaign"
      add :context_id, :binary_id  # proposal_id, task_id, campaign_id
      add :model, :string
      add :status, :string, default: "active"  # active, paused, completed
      add :memory, :map  # accumulated context, serialized
      add :token_count, :integer, default: 0
      add :created_at_time, :utc_datetime
      add :completed_at, :utc_datetime
      
      timestamps()
    end

    create unique_index(:claude_sessions, [:session_id])
    create index(:claude_sessions, [:context_type, :context_id])
  end
end
```

**Ecto schema:**
```elixir
# lib/ema/claude/session.ex
defmodule Ema.Claude.Session do
  use Ecto.Schema

  schema "claude_sessions" do
    field :session_id, :string
    field :context_type, :string  # "proposal", "task", "campaign"
    field :context_id, Ecto.UUID
    field :model, :string
    field :status, :string
    field :memory, :map
    field :token_count, :integer
    field :created_at_time, :utc_datetime
    field :completed_at, :utc_datetime
    
    timestamps()
  end

  def changeset(attrs) do
    __MODULE__
    |> Ecto.Changeset.cast(attrs, [
      :session_id, :context_type, :context_id, :model, 
      :status, :memory, :token_count, :created_at_time, :completed_at
    ])
    |> Ecto.Changeset.validate_required([
      :session_id, :context_type, :context_id, :model
    ])
  end
end
```

**Bridge updates:**
```elixir
# lib/ema/claude/bridge.ex
def start_session(opts) do
  session_id = UUID.uuid4()
  {:ok, session} = Ema.Claude.Bridge.Port.start(session_id, opts)
  
  # Persist to DB
  Ema.Repo.insert!(%Ema.Claude.Session{
    session_id: session_id,
    context_type: opts[:context_type],
    context_id: opts[:context_id],
    model: opts[:model],
    status: "active",
    memory: %{},
    created_at_time: DateTime.utc_now()
  })
  
  {:ok, session}
end

def send_message(session_id, message, callback: callback) do
  # Send via Port
  {:ok, result} = Ema.Claude.Bridge.Port.send(session_id, message)
  
  # Update session memory
  session = Ema.Repo.get_by(Ema.Claude.Session, session_id: session_id)
  memory = (session.memory || %{}) |> Map.put("last_exchange", %{
    role: "assistant",
    content: result
  })
  Ema.Repo.update!(Ecto.Changeset.change(session, memory: memory))
  
  {:ok, result}
end

def resume_session(session_id) do
  session = Ema.Repo.get_by!(Ema.Claude.Session, session_id: session_id)
  {:ok, _} = Ema.Claude.Bridge.Port.resume(session_id, session.memory)
  session
end
```

**Test:**
```bash
mix ecto.migrate
mix test lib/ema/claude/session_test.exs
```

**Verification:**
- [ ] Migration runs cleanly
- [ ] Sessions are stored to DB
- [ ] Memory persists across daemon restarts
- [ ] Old sessions can be resumed via session_id
- [ ] Tests pass

---

## Phase 2.2: Campaign System (Week 7, Days 3-5)

### 2.2.1 Create Campaign Schema & Lifecycle

**Schema migration:**
```elixir
# priv/repo/migrations/TIMESTAMP_create_campaigns.exs
defmodule Ema.Repo.Migrations.CreateCampaigns do
  use Ecto.Migration

  def change do
    create table(:campaigns) do
      add :project_id, references(:projects, on_delete: :cascade)
      add :slug, :string, null: false
      add :name, :string, null: false
      add :goal, :text
      add :status, :string, default: "active"  # active, paused, completed, archived
      add :sessions, {:array, :string}  # session_ids from claude_sessions
      add :discoveries, :map  # accumulated findings + insights
      add :cost_usd, :decimal, default: 0
      add :created_at_time, :utc_datetime
      add :completed_at, :utc_datetime
      
      timestamps()
    end

    create unique_index(:campaigns, [:project_id, :slug])
    create index(:campaigns, [:status])
  end
end
```

**Ecto context:**
```elixir
# lib/ema/campaigns.ex (new file)
defmodule Ema.Campaigns do
  use Ecto.Schema
  import Ecto.Changeset
  alias Ema.Repo

  schema "campaigns" do
    field :slug, :string
    field :name, :string
    field :goal, :string
    field :status, :string
    field :sessions, {:array, :string}
    field :discoveries, :map
    field :cost_usd, :decimal
    field :created_at_time, :utc_datetime
    field :completed_at, :utc_datetime
    
    belongs_to :project, Ema.Projects.Project
    timestamps()
  end

  def changeset(attrs) do
    __MODULE__
    |> cast(attrs, [
      :slug, :name, :goal, :status, :sessions, 
      :discoveries, :cost_usd, :created_at_time, :completed_at, :project_id
    ])
    |> validate_required([:slug, :name, :project_id])
    |> unique_constraint([:project_id, :slug])
  end

  # Campaigns context functions
  def create_campaign(project_id, attrs) do
    %Ema.Campaigns{}
    |> changeset(Map.merge(attrs, %{
      "project_id" => project_id,
      "status" => "active",
      "sessions" => [],
      "discoveries" => %{},
      "cost_usd" => 0,
      "created_at_time" => DateTime.utc_now()
    }))
    |> Repo.insert()
  end

  def add_session(campaign, session_id) do
    sessions = (campaign.sessions || []) ++ [session_id]
    Repo.update!(changeset(campaign, %{sessions: sessions}))
  end

  def record_discovery(campaign, discovery_key, discovery_value) do
    discoveries = (campaign.discoveries || %{}) |> Map.put(discovery_key, discovery_value)
    Repo.update!(changeset(campaign, %{discoveries: discoveries}))
  end

  def complete_campaign(campaign) do
    Repo.update!(changeset(campaign, %{
      status: "completed",
      completed_at: DateTime.utc_now()
    }))
  end

  def get_active_campaigns(project_id) do
    Repo.all(from c in __MODULE__, 
      where: c.project_id == ^project_id and c.status == "active")
  end
end
```

**Bridge integration:**
```elixir
# lib/ema/claude/bridge.ex — new function
def start_campaign_session(campaign_id, model: model) do
  campaign = Ema.Repo.get!(Ema.Campaigns, campaign_id)
  
  # Build context from all previous sessions in campaign
  memory = build_campaign_memory(campaign)
  
  {:ok, session} = start_session(
    context_type: "campaign",
    context_id: campaign_id,
    model: model,
    memory: memory
  )
  
  # Add to campaign
  Ema.Campaigns.add_session(campaign, session.session_id)
  
  {:ok, session}
end

defp build_campaign_memory(campaign) do
  # Aggregate all discoveries from previous sessions
  memory = %{
    "goal" => campaign.goal,
    "discoveries" => campaign.discoveries || %{},
    "sessions_count" => length(campaign.sessions || [])
  }
  
  # Fetch previous session summaries
  campaign.sessions
  |> Enum.each(fn session_id ->
    session = Ema.Repo.get_by!(Ema.Claude.Session, session_id: session_id)
    memory["session_#{session_id}"] = session.memory
  end)
  
  memory
end
```

**Test:**
```bash
mix ecto.migrate
mix test lib/ema/campaigns_test.exs
```

**Verification:**
- [ ] Migration runs cleanly
- [ ] Campaigns can be created with create_campaign()
- [ ] Sessions are tracked in campaigns
- [ ] Discoveries accumulate in campaign.discoveries
- [ ] Campaign context is built from previous sessions
- [ ] Tests pass

---

### 2.2.2 Wire Campaigns Into Proposal & Task Systems

**In Proposals context:**
```elixir
# lib/ema/proposals.ex
def generate_proposal_in_campaign(campaign_id, seed) do
  campaign = Ema.Repo.get!(Ema.Campaigns, campaign_id)
  
  # Create proposal
  {:ok, proposal} = create_proposal(%{
    seed: seed,
    project_id: campaign.project_id,
    campaign_id: campaign_id
  })
  
  # Start campaign session (reuses prior campaign context)
  {:ok, session} = Ema.Claude.Bridge.start_campaign_session(campaign_id, model: "opus")
  
  # Run proposal pipeline with campaign context
  {:ok, refined} = run_proposal_pipeline(proposal, session)
  
  # Record new discoveries
  if refined.key_insights do
    Ema.Campaigns.record_discovery(campaign, "proposal_#{proposal.id}", %{
      insights: refined.key_insights,
      risks: refined.risks
    })
  end
  
  {:ok, refined}
end
```

**In Tasks context:**
```elixir
# lib/ema/tasks.ex
def create_task_from_proposal(proposal, campaign_id) do
  campaign = Ema.Repo.get!(Ema.Campaigns, campaign_id)
  
  # Create task from proposal
  {:ok, task} = create_task(%{
    title: proposal.title,
    description: proposal.formatted,
    project_id: campaign.project_id,
    campaign_id: campaign_id
  })
  
  # When task is completed, record discovery
  # (see 2.2.3 below)
  
  {:ok, task}
end
```

**Test:**
```bash
curl -X POST http://localhost:4488/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "slug": "auth-refactor",
    "name": "Refactor Auth System",
    "goal": "Move from OAuth 2.0 to JWT + refresh tokens"
  }'

# Creates proposal in campaign (should inherit prior discoveries)
curl -X POST http://localhost:4488/api/campaigns/1/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "seed": "Design new JWT flow"
  }'
```

**Verification:**
- [ ] Proposals created in campaigns have access to campaign context
- [ ] Tasks created from proposals are linked to campaigns
- [ ] Discoveries accumulate across sessions
- [ ] Proposal pipeline reuses campaign session when appropriate
- [ ] Tests pass

---

## Phase 2.3: SessionWatcher Bidirectionality (Week 7–8, Days 1-3)

### 2.3.1 Enhance SessionWatcher for Active Session Creation

**Current:** SessionWatcher only reads `~/.claude/projects/**/*.jsonl` files.

**Goal:** EMA can spawn Claude sessions that SessionWatcher detects and links.

**Implementation:**
```elixir
# lib/ema/claude_sessions/session_manager.ex
defmodule Ema.ClaudeSessions.SessionManager do
  # New function: spawn a session and have SessionWatcher pick it up
  def spawn_session_for_project(project_path, prompt_template, model: model) do
    # 1. Spawn Claude Code with --session-id pointing to project
    session_id = UUID.uuid4()
    
    Task.async(fn ->
      System.cmd("claude", [
        "--print",
        "--output-format", "stream-json",
        "--session-id", session_id,
        "--working-dir", project_path,
        prompt_template
      ])
    end)
    
    # 2. SessionWatcher will detect the JSONL file when it polls in 30s
    # 3. Return session_id immediately so EMA can track it
    {:ok, session_id}
  end
  
  def list_active_sessions do
    # Still uses pgrep to find active `claude` processes
    {output, 0} = System.cmd("pgrep", ["-f", "claude"])
    
    output
    |> String.split("\n")
    |> Enum.filter(&(&1 != ""))
    |> Enum.map(fn pid ->
      # Extract session ID from /proc/PID/cmdline
      {output, 0} = System.cmd("cat", ["/proc/#{pid}/cmdline"])
      parse_session_id_from_cmdline(output)
    end)
    |> Enum.uniq()
  end
end
```

**SessionWatcher enhancement:**
```elixir
# lib/ema/claude_sessions/session_watcher.ex
def poll_sessions do
  # 1. Read existing JSONL files (as before)
  sessions_from_files = find_session_files()
  
  # 2. Check active processes (new)
  active_pids = SessionManager.list_active_sessions()
  
  # 3. For each active PID, try to extract session ID
  # 4. If session exists in DB, update its status to "active"
  # 5. If session doesn't exist, create it (EMA-spawned sessions)
  
  Enum.each(sessions_from_files ++ active_pids, fn session_info ->
    upsert_session(session_info)
  end)
end

defp upsert_session(session_info) do
  Repo.insert!(
    %Ema.ClaudeSessions.ClaudeSession{
      session_id: session_info.session_id,
      project_path: session_info.project_path,
      status: "active",
      token_count: session_info.token_count,
      files_touched: session_info.files_touched
    },
    on_conflict: [set: [status: "active", updated_at: DateTime.utc_now()]],
    conflict_target: :session_id
  )
end
```

**Verification:**
- [ ] EMA can spawn Claude sessions via SessionManager.spawn_session_for_project()
- [ ] SessionWatcher detects spawned sessions within 30s
- [ ] Sessions appear in EMA's session list
- [ ] Tests pass

---

### 2.3.2 Bidirectional Sync

**Goal:** Changes in EMA (proposals created, tasks completed) trigger files that Claude sessions can read.

```elixir
# lib/ema/pipes/rules.ex (new module)
def proposal_generated(proposal) do
  # 1. Write proposal to a shared file that Claude sessions can read
  project_path = proposal.project.path
  proposals_file = Path.join(project_path, ".ema/proposals.json")
  
  proposals = read_existing_proposals(proposals_file) ++ [
    %{
      id: proposal.id,
      title: proposal.title,
      status: "pending_review",
      generated_at: DateTime.utc_now()
    }
  ]
  
  File.write!(proposals_file, Jason.encode!(proposals, pretty: true))
  
  # 2. If there's an active campaign session, notify it
  if proposal.campaign_id do
    campaign = Repo.get!(Ema.Campaigns, proposal.campaign_id)
    # Could send notification to active session
  end
end

def task_completed(task) do
  project_path = task.project.path
  completions_file = Path.join(project_path, ".ema/completions.json")
  
  completions = read_existing_completions(completions_file) ++ [
    %{
      task_id: task.id,
      title: task.title,
      completed_at: DateTime.utc_now()
    }
  ]
  
  File.write!(completions_file, Jason.encode!(completions, pretty: true))
end
```

**Verification:**
- [ ] Proposal created → `.ema/proposals.json` updated with new proposal
- [ ] Task completed → `.ema/completions.json` updated
- [ ] Claude sessions can read these files to see EMA activities
- [ ] Tests pass

---

## Phase 2.4: Four MVP Trajan Affordances (Week 8)

### 2.4.1 Dispatch Board (Live Task State)

**Goal:** Real-time view of all in-flight agent dispatches.

**New Ecto schema:**
```elixir
# priv/repo/migrations/TIMESTAMP_create_dispatch_tasks.exs
defmodule Ema.Repo.Migrations.CreateDispatchTasks do
  use Ecto.Migration

  def change do
    create table(:dispatch_tasks) do
      add :task_id, references(:tasks, on_delete: :cascade)
      add :agent, :string  # "researcher", "coder", "ops", "security", etc.
      add :description, :string
      add :status, :string  # "queued", "running", "success", "failed", "partial"
      add :started_at, :utc_datetime
      add :completed_at, :utc_datetime
      add :output, :text
      add :error_message, :text
      
      timestamps()
    end

    create index(:dispatch_tasks, [:status])
    create index(:dispatch_tasks, [:started_at])
  end
end

# lib/ema/dispatch_tasks/dispatch_task.ex
defmodule Ema.DispatchTasks.DispatchTask do
  use Ecto.Schema
  import Ecto.Changeset

  schema "dispatch_tasks" do
    field :agent, :string
    field :description, :string
    field :status, :string
    field :started_at, :utc_datetime
    field :completed_at, :utc_datetime
    field :output, :string
    field :error_message, :string
    
    belongs_to :task, Ema.Tasks.Task
    timestamps()
  end

  def changeset(attrs) do
    __MODULE__
    |> cast(attrs, [:agent, :description, :status, :started_at, :completed_at, :output, :error_message, :task_id])
    |> validate_required([:agent, :status, :task_id])
  end
end
```

**Context:**
```elixir
# lib/ema/dispatch_tasks.ex
defmodule Ema.DispatchTasks do
  alias Ema.Repo
  alias Ema.DispatchTasks.DispatchTask

  def create_dispatch(task_id, agent, description) do
    %DispatchTask{}
    |> DispatchTask.changeset(%{
      task_id: task_id,
      agent: agent,
      description: description,
      status: "queued",
      started_at: DateTime.utc_now()
    })
    |> Repo.insert()
  end

  def update_status(dispatch, status, result: result) do
    Repo.update!(DispatchTask.changeset(dispatch, %{
      status: status,
      completed_at: DateTime.utc_now(),
      output: result
    }))
  end

  def list_in_flight do
    Repo.all(from d in DispatchTask, 
      where: d.status in ["queued", "running"],
      order_by: [desc: d.started_at])
  end

  def list_recent(limit: limit) do
    Repo.all(from d in DispatchTask, 
      order_by: [desc: d.started_at],
      limit: ^limit)
  end
end
```

**Phoenix controller:**
```elixir
# lib/ema_web/controllers/dispatch_controller.ex
defmodule EmaWeb.DispatchController do
  use EmaWeb, :controller
  alias Ema.DispatchTasks

  def index(conn, _params) do
    in_flight = DispatchTasks.list_in_flight()
    json(conn, %{
      in_flight: in_flight,
      elapsed_secs: Enum.map(in_flight, fn d ->
        DateTime.diff(DateTime.utc_now(), d.started_at)
      end)
    })
  end

  def recent(conn, %{"limit" => limit}) do
    recent = DispatchTasks.list_recent(limit: String.to_integer(limit))
    json(conn, %{recent: recent})
  end
end
```

**React component:**
```tsx
// app/src/components/DispatchBoard.tsx
import { useEffect, useState } from 'react';

export function DispatchBoard() {
  const [dispatches, setDispatches] = useState([]);
  const [elapsedSecs, setElapsedSecs] = useState({});

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('http://localhost:4488/api/dispatch');
      const data = await res.json();
      setDispatches(data.in_flight);
      setElapsedSecs(data.elapsed_secs);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dispatch-board">
      <h2>In-Flight Dispatches</h2>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Description</th>
            <th>Status</th>
            <th>Elapsed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {dispatches.map((d) => (
            <tr key={d.id} className={`status-${d.status}`}>
              <td>{d.agent}</td>
              <td>{d.description}</td>
              <td><span className={`badge ${d.status}`}>{d.status}</span></td>
              <td>{elapsedSecs[d.id]}s</td>
              <td><button onClick={() => viewOutput(d.id)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Verification:**
- [ ] Dispatch tasks can be created via create_dispatch()
- [ ] Status updates work (queued → running → success/failed/partial)
- [ ] API endpoint /api/dispatch returns in-flight dispatches
- [ ] React component displays live dispatch board with 2s updates
- [ ] Tests pass

---

### 2.4.2 Scope Advisor (Task Creation Warning)

**Goal:** When task is created for dispatch, check outcome history and warn if scope exceeds learned limits.

**Context:**
```elixir
# lib/ema/outcome_tracker.ex
defmodule Ema.OutcomeTracker do
  # Get past outcomes for an agent + task_type combination
  def get_outcomes_for(agent, task_type, limit: limit) do
    Repo.all(from o in OutcomeRecord,
      where: o.agent == ^agent and o.task_type == ^task_type,
      order_by: [desc: o.created_at],
      limit: ^limit)
  end

  # Analyze failure patterns
  def analyze_failure_pattern(agent, task_type) do
    outcomes = get_outcomes_for(agent, task_type, limit: 10)
    failures = Enum.filter(outcomes, &(&1.outcome == "failed"))
    success_count = length(outcomes) - length(failures)
    
    # Extract common failure reasons
    failure_reasons = failures
      |> Enum.map(& &1.failure_reason)
      |> Enum.frequencies()
      |> Enum.sort_by(fn {_k, v} -> v end, :desc)
    
    %{
      success_rate: success_count / length(outcomes),
      common_failures: failure_reasons,
      avg_duration: average_duration(outcomes),
      scope_limit: infer_scope_limit(outcomes, failures)
    }
  end

  defp infer_scope_limit(outcomes, failures) do
    # If failures often have larger scope, warn about it
    failed_scopes = failures |> Enum.map(& &1.scope_estimate)
    success_scopes = (Enum.map(outcomes, & &1.scope_estimate) -- failed_scopes)
    
    case {failed_scopes, success_scopes} do
      {[], _} -> nil  # No failures, no warning
      {f, s} when length(f) > 0 and length(s) > 0 ->
        max_success = Enum.max(s)
        "warn_if_scope > #{max_success}"
      _ -> nil
    end
  end
end
```

**Hook into task creation:**
```elixir
# lib/ema/tasks.ex
def create_task_for_dispatch(agent, description, scope_estimate) do
  # Check outcome history
  analysis = OutcomeTracker.analyze_failure_pattern(agent, "dispatch")
  
  # Build warnings
  warnings = []
  
  if analysis.success_rate < 0.7 do
    warnings = warnings ++ [
      "Agent has #{trunc(analysis.success_rate * 100)}% success rate on similar tasks"
    ]
  end
  
  if analysis.scope_limit and scope_estimate > analysis.scope_limit do
    warnings = warnings ++ [
      "Similar tasks have failed at this scope — suggest reducing to #{analysis.scope_limit}"
    ]
  end
  
  {:ok, task} = create_task(%{agent: agent, description: description})
  
  {:ok, %{task: task, warnings: warnings}}
end
```

**Phoenix controller:**
```elixir
# lib/ema_web/controllers/tasks_controller.ex
def create_with_advisor(conn, %{"agent" => agent, "description" => desc, "scope" => scope}) do
  case Tasks.create_task_for_dispatch(agent, desc, scope) do
    {:ok, %{task: task, warnings: warnings}} ->
      json(conn, %{
        task: task,
        warnings: warnings,
        should_deliberate: length(warnings) > 1
      })
  end
end
```

**React component:**
```tsx
// app/src/components/TaskCreationForm.tsx
export function TaskCreationForm({ agent }) {
  const [scope, setScope] = useState(50);
  const [warnings, setWarnings] = useState([]);
  const [shouldDeliberate, setShouldDeliberate] = useState(false);

  const handleCreate = async (description) => {
    const res = await fetch('http://localhost:4488/api/tasks/create-with-advisor', {
      method: 'POST',
      body: JSON.stringify({ agent, description, scope })
    });
    const data = await res.json();
    setWarnings(data.warnings);
    setShouldDeliberate(data.should_deliberate);
    
    if (data.should_deliberate) {
      // Route to deliberation gate (see 2.4.3)
    }
  };

  return (
    <div className="task-creation">
      {warnings.length > 0 && (
        <div className="warnings">
          {warnings.map(w => <p key={w}>{w}</p>)}
        </div>
      )}
      <button onClick={() => handleCreate("...")}>Create Task</button>
    </div>
  );
}
```

**Verification:**
- [ ] OutcomeTracker.analyze_failure_pattern() returns pattern analysis
- [ ] Warnings are generated when scope exceeds learned limits
- [ ] API endpoint returns warnings + should_deliberate flag
- [ ] React component displays warnings before task creation
- [ ] Tests pass

---

### 2.4.3 Deliberation Gate (Structural Decision Routing)

**Goal:** Flag tasks as "structural", auto-route to Proposals pipeline first.

**Schema:**
```elixir
# Add to Tasks.Task schema
field :is_structural, :boolean, default: false
field :deliberation_proposal_id, Ecto.UUID

# In tasks migration
add :is_structural, :boolean, default: false
add :deliberation_proposal_id, :binary_id
```

**Detection logic:**
```elixir
# lib/ema/tasks.ex
def classify_if_structural(description) do
  structural_keywords = [
    "restructure", "migrate", "delete", "rename globally",
    "refactor architecture", "change database", "break compatibility"
  ]
  
  is_structural = Enum.any?(structural_keywords, fn keyword ->
    String.contains?(String.downcase(description), keyword)
  end)
  
  is_structural
end
```

**Routing logic:**
```elixir
# lib/ema/tasks.ex
def create_task(attrs) do
  is_structural = classify_if_structural(attrs["description"])
  
  if is_structural do
    # Route to deliberation gate
    {:deliberate_first, convert_to_proposal_seed(attrs)}
  else
    # Direct execution
    %Task{}
    |> Task.changeset(Map.merge(attrs, %{is_structural: false}))
    |> Repo.insert()
  end
end

defp convert_to_proposal_seed(task_attrs) do
  %{
    seed: task_attrs["description"],
    project_id: task_attrs["project_id"],
    context: "structural_decision",
    follow_up_task_id: task_attrs["id"]  # to create task after proposal accepted
  }
end
```

**Phoenix controller:**
```elixir
# lib/ema_web/controllers/tasks_controller.ex
def create(conn, params) do
  case Tasks.create_task(params) do
    {:ok, task} ->
      json(conn, %{task: task, status: "created"})
    
    {:deliberate_first, proposal_seed} ->
      # Auto-create proposal for deliberation
      {:ok, proposal} = Proposals.create_proposal(proposal_seed)
      json(conn, %{
        proposal: proposal,
        status: "deliberation_required",
        message: "This is a structural decision. Generate and review proposals first."
      })
  end
end
```

**React component:**
```tsx
// When user attempts to create a structural task:
if (response.status === "deliberation_required") {
  return <ProposalGenerator proposalId={response.proposal.id} />;
}

// After proposal is accepted:
handleProposalAccepted = async (proposal) => {
  const task = await Tasks.create_task_from_proposal(proposal);
  navigate(`/tasks/${task.id}`);
};
```

**Verification:**
- [ ] Structural keywords trigger deliberation gate
- [ ] Deliberation gate converts task to proposal seed
- [ ] Proposal is generated for review
- [ ] After proposal accepted, task is created automatically
- [ ] Non-structural tasks bypass deliberation
- [ ] Tests pass

---

### 2.4.4 Reflexion Injection (Past Outcome Summaries)

**Goal:** Before spawning agent, inject summary of last 3 outcomes into spawn prompt.

**Context:**
```elixir
# lib/ema/agent_memory.ex
def inject_reflexion(agent, task_type, base_prompt) do
  # Get last 3 outcomes
  outcomes = OutcomeTracker.get_outcomes_for(agent, task_type, limit: 3)
  
  if length(outcomes) == 0 do
    base_prompt
  else
    reflexion_section = build_reflexion_section(outcomes)
    "#{base_prompt}\n\n#{reflexion_section}"
  end
end

defp build_reflexion_section(outcomes) do
  what_worked = outcomes
    |> Enum.filter(& &1.outcome == "success")
    |> Enum.map(& &1.what_worked)
    |> Enum.uniq()

  what_failed = outcomes
    |> Enum.filter(& &1.outcome == "failed")
    |> Enum.map(& &1.what_failed)
    |> Enum.uniq()

  """
  ## Reflexion from recent outcomes:

  What worked in the past:
  #{what_worked |> Enum.join("\n  - ")}

  What failed before (avoid these):
  #{what_failed |> Enum.join("\n  - ")}

  Apply these lessons to your current task.
  """
end
```

**Hook into dispatch:**
```elixir
# lib/ema/dispatch_tasks.ex (or wherever agent dispatch happens)
def dispatch_agent(agent, description, task_type: task_type) do
  base_prompt = build_prompt(description)
  
  # Inject reflexion
  enriched_prompt = AgentMemory.inject_reflexion(agent, task_type, base_prompt)
  
  # Spawn agent with enriched prompt
  {:ok, dispatch} = create_dispatch(agent, description)
  
  # Send to agent via OpenClaw or similar
  Sessions.send(agent, enriched_prompt)
  
  {:ok, dispatch}
end
```

**Verification:**
- [ ] OutcomeTracker.get_outcomes_for() returns past outcomes
- [ ] Reflexion section is built from what_worked/what_failed fields
- [ ] Reflexion is prepended to agent dispatch prompt
- [ ] Agent receives enriched prompt with past lessons
- [ ] Outcome data is recorded after each dispatch
- [ ] Tests pass

---

## Integration Checklist

After all 4 affordances are built:

- [ ] Dispatch Board shows all in-flight tasks in real-time
- [ ] When creating a task, Scope Advisor warns if similar tasks have failed at that scope
- [ ] Structural tasks automatically route to Proposals pipeline first
- [ ] Agent dispatches receive Reflexion summary of past outcomes
- [ ] All 4 features work together (e.g., structural task → proposal → deliberation → dispatch with reflexion)
- [ ] Frontend displays all UI components without errors
- [ ] API endpoints tested and documented
- [ ] Database migrations run cleanly
- [ ] Tests pass: `mix test`
- [ ] Pre-commit checks pass: `mix precommit`

---

## Build & Test Commands

```bash
# Run all tests
cd ~/Projects/ema/daemon
mix test

# Watch for changes
mix test.watch

# Run specific test file
mix test lib/ema/campaigns_test.exs

# Check formatting
mix format --check-formatted

# Code linting
mix credo

# Pre-commit checks
mix precommit

# Start daemon for manual testing
mix phx.server

# In another terminal, start frontend
cd ~/Projects/ema/app
npm run dev
```

---

## Success Criteria

Phase 2 is complete when:

1. ✅ Multi-turn sessions replace all Runner.run() calls
2. ✅ Campaign system stores persistent context across sessions
3. ✅ SessionWatcher can spawn and detect EMA-created sessions
4. ✅ Dispatch Board displays live in-flight agent dispatches
5. ✅ Scope Advisor warns before dispatch if scope exceeds limits
6. ✅ Deliberation Gate routes structural tasks through Proposals first
7. ✅ Reflexion Injection adds past outcome summaries to agent prompts
8. ✅ All tests pass
9. ✅ No regressions in Phase 1 features

**Timeline:** 3 weeks (Weeks 7-8 + start of Week 9)

---

## If Stuck

### Session persistence times out
- Check if daemon restarts are losing session_id
- Add logging to Bridge.resume_session() to debug
- Ensure SQLite is persisting sessions correctly

### Campaign discovery accumulation not working
- Verify campaign.discoveries is updating via record_discovery()
- Check that JSONL output is being parsed correctly
- Add logging to build_campaign_memory()

### Dispatch board shows no in-flight tasks
- Verify create_dispatch() is being called when agents spawn
- Check that update_status() is called when dispatch completes
- Ensure WebSocket is broadcasting updates to frontend

### Reflexion section not appearing in prompts
- Verify OutcomeTracker is recording outcomes after each dispatch
- Check that what_worked/what_failed fields are populated
- Add logging to inject_reflexion() to debug prompt building

---

## Next Phase (Phase 3+)

After Phase 2 completes:
- Phase 3: Autonomous Pipes (AI-powered event-driven actions)
- Phase 4: Knowledge Synthesis (Second Brain + Claude integration)
- Phase 5: Autonomous Agency (6 specialized agents)
- Phase 6: Meta-Intelligence (self-improvement loops)

Each phase builds on previous ones, compounding intelligence over time.
