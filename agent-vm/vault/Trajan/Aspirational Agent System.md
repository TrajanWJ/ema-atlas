---
title: "Aspirational Agent System"
created: 2026-03-18
updated: 2026-03-19
type: aspirational
status: active
confidence: 0.75
confidence_updated: 2026-03-19
source: personal
tags: [agents, architecture, knowledge, ops, prompts, research]
summary: "A fully autonomous multi-agent system that:"
---
# Aspirational Agent System

> **Status:** 🔨 IN PROGRESS
> **Current State Doc:** [[Agent Architecture Overview]], [[AGENTS.md]]
> **Last Revised:** 2026-03-19 (confidence raised 0.40 → 0.75 by Vault Keeper)

## The Vision

A fully autonomous multi-agent system that:
1. **Self-dispatches** — Tasks get extracted, routed, and executed without human intervention
2. **Self-heals** — Failures trigger automatic retries, fallbacks, and circuit breakers
3. **Self-improves** — Performance data feeds back into routing decisions
4. **Self-monitors** — Dashboard, alerts, and heartbeats catch issues before humans notice
5. **Proactively works** — Agents find work to do, not just respond to commands

---

## Current Agent Roster

**Source:** `~/.openclaw/openclaw.json` (27 configured agents as of 2026-03-18)

### Core Agents (Active, sonnet-4-6)

| Agent | Role | Channel | Status |
|---|---|---|---|
| **Right Hand** (`main`) | Primary orchestration hub — Trajan's main voice; dispatches to all specialists; synthesizes results; posts to Discord | #desk / all channels | ✅ Active |
| **Concierge** | Personal concierge — recommendations, scheduling, lookups, errands; warm personal interface | #concierge | ✅ Active |
| **Universal Orchestrator** | Silent coordinator for 3+ agent workflows; manages DAG-based task chains | Internal only | ✅ Active |
| **Researcher** | Deep research, web scraping, source triangulation; outputs to #research-feed | Background spawn | ✅ Active |
| **Coder** | Build tasks, code review, implementation; outputs to #code-output | Background spawn | ✅ Active |
| **Ops** | System health, cron management, evolution cycles | Background spawn | ✅ Active |
| **Security** | Vulnerability scanning, hardening audits; outputs to #security | Background spawn | ✅ Active |
| **Vault Keeper** | Knowledge organization, confidence scoring, gap-filling, ontology sync | Background spawn | ✅ Active |
| **Browser Automation (Scout)** | Web research requiring JS rendering, form interaction | Background spawn | ✅ Active |
| **Prompt Engineer** | SOUL.md optimization, agent prompt tuning; works in #prompt-lab | Background spawn | ✅ Active |
| **Devil's Advocate** | Review gate — challenges assumptions, surfaces failure modes; outputs to #devils-corner | Background spawn | ✅ Active |
| **Quality Lead** | Output quality verification, two-stage verification gate | Internal gate | ✅ Active |
| **Life Lead** | Life/personal domain routing — wellness, personal goals | Background spawn | ✅ Active |

### Specialist Agents (Configured, Not Always Active)

| Agent | Role |
|---|---|
| **Strategist** | Multi-framework strategic analysis |
| **Tech Lead** | Technical architecture decisions |
| **Analyst** | Data analysis, pattern finding |
| **PM** | Project management, milestone tracking |
| **Writer** | Content creation, long-form writing |
| **Marketer** | Go-to-market, outreach strategy |
| **Biz Dev** | Business development, partnership framing |
| **Business Lead** | Business strategy, agency growth |
| **Chief of Staff** | Cross-domain coordination, priority management |
| **Account Manager** | Client relationship management |
| **Creative Director** | Creative vision, brand direction |
| **Finance** | Financial modeling, budgeting |
| **Architect** | System architecture (partially merged into Tech Lead) |
| **Wellness** | Personal wellness tracking |

> **Note:** All specialists are spawned on demand as Claude Code background processes or EMA subagents. They do **not** post to Discord directly — Right Hand posts on their behalf.

---

## How Dispatch / Priority Queue Works

The system has **three parallel dispatch mechanisms** that coexist:

### System 1: File-Based Dispatch Engine (`dispatch-engine.sh`)
- **Queue:** JSON task files in `~/dispatch/{queue,active,done,failed}/`
- **Frequency:** Cron every 1 minute (`*/1 * * * *`; docs say 10min — inconsistency)
- **Capacity:** MAX_ACTIVE=6 concurrent tasks
- **Mechanism:** Engine picks up tasks from `queue/`, moves to `active/`, spawns Claude Code `--print --permission-mode bypassPermissions`, moves to `done/` or `failed/`
- **Circuit breaker:** After 3 consecutive failures for an agent → agent is suspended; requires manual reset or health recovery
- **Agent matching:** `agent-cards.json` stores fitness scores, success rates, avg runtimes per agent

**Task priority levels:**

| Priority | Label | Use For | Pickup |
|---|---|---|---|
| P0 | Critical | System down, security breach | Immediate (bypass queue) |
| P1 | Urgent | Trajan waiting for response | Next cycle (<1min) |
| P2 | High | Time-sensitive work | Within 5 min |
| P3 | Normal | Standard background work | Within 10 min |
| P4 | Low | Research loops, vault maintenance | When idle |

### System 2: DAG-Based Dispatch (`dispatch.sh` V3)
- **Mechanism:** `task-queue.sh` + `dag-resolve.sh` — supports dependency ordering and wave planning
- **Storage:** `/tmp/task-queue/` (volatile — lost on reboot; known bug, should use persistent path)
- **Use case:** Multi-step sequential workflows where Task B depends on Task A's output
- **Integration gap:** Not connected to System 1's cron loop — used manually for structured pipelines

### System 3: Direct `sessions_spawn` (Right Hand)
- **Mechanism:** Right Hand spawns EMA subagent sessions directly
- **No file artifacts** — bypasses dispatch-engine entirely
- **Use for:** P0/P1 urgent tasks, tasks requiring tool access (browser, message, etc.), interactive work where Trajan is waiting

### Dispatch Decision Tree

```
New task arrives
  ├── P0/P1 or Trajan is waiting → sessions_spawn (direct)
  ├── Multi-agent workflow (3+ agents) → sessions_spawn Orchestrator
  ├── Sequential pipeline with dependencies → dispatch.sh V3 + DAG
  └── Background/async (P3-P4) → drop JSON to ~/dispatch/queue/
```

### Bidirectional #dispatch Protocol (v5)
The `#📋-dispatch` Discord channel echoes structured confirmations back to Trajan:
- Post any task → `dispatch-echo.sh` (runs every 2min) parses intent via Claude Haiku
- Replies with: Task ID, Agent assigned, Priority, Vault output path, ETA
- Makes the machine prove it heard the command

---

## Agent Coordination Protocols

### Hub-and-Spoke Model
All agent communication flows through Right Hand. Specialists **never** talk to each other directly.

```
TRAJAN
  ↕
🤝 RIGHT HAND (hub — only agent with Discord write access)
  ├── spawns → 🔬 Researcher
  ├── spawns → 💻 Coder
  ├── spawns → ⚙️ Ops
  ├── spawns → 🛡️ Security
  ├── spawns → 📚 Vault Keeper
  ├── spawns → 🔭 Scout (browser)
  ├── spawns → 🎯 Prompt Engineer
  └── spawns → 😈 Devil's Advocate
  
For 3+ agent workflows → escalates to:
🎭 ORCHESTRATOR (coordinates DAG, manages parallel waves, synthesizes)
```

### Communication Flow Rules

| From | Can Talk To | Channel | Notes |
|---|---|---|---|
| Trajan | Right Hand | Discord, Telegram, CLI | All human input enters here |
| Right Hand | Any specialist | `sessions_spawn` | Dispatches, collects, synthesizes |
| Specialist | Right Hand | Return value (auto-announce) | Results flow back; never to Discord |
| Orchestrator | Any agent | `sessions_spawn` | 3+ agent coordination only |
| Right Hand | Orchestrator | `sessions_spawn` | Escalation for complex workflows |
| Specialist → Specialist | **NEVER direct** | — | Breaks audit trail |

### Reaction Routing (v5 Innovation)
React to any Discord message with an emoji → routes to the appropriate agent:

| Emoji | Agent | Action |
|---|---|---|
| 🔬 | Researcher | Research this content |
| 💻 | Coder | Implement / analyze code |
| 💾 | Vault Keeper | Save to vault |
| 📋 | Concierge | Create #desk task |

### Task File Protocol
Each dispatch task is a JSON file with:
```json
{
  "task_id": "TASK-20260319-001",
  "agent": "researcher",
  "priority": "P3",
  "task": "Research X",
  "context": "...",
  "vault_output": "vault/Research/X.md",
  "pipeline_id": null,
  "created": "2026-03-19T05:00Z"
}
```

### Two-Stage Verification
For significant outputs, Right Hand runs a verification loop:
1. **Spec compliance** — Did the agent follow the task spec?
2. **Quality check** — Is the output actually useful / correct?
3. If either fails → re-dispatch with correction prompt
4. After 2 failures → escalate to Devil's Advocate for review

### Self-Learning Loop
```
Failure/Correction → Signal logged → Evolution Signal captured
  → Confidence threshold check (>95% immediate, <80% wait for 3 signals)
  → Prompt modification in AGENTS.md / SOUL.md
  → Propagated to all agents on next session
  → Audit trail in vault/System/Evolution Log.md
```

---

## Current vs Target System State Gap

### What's Working Now ✅
- 27 agents configured in EMA
- File-based dispatch engine running every 1min via cron
- Circuit breakers functional (tested in real failure scenarios)
- Hub-and-spoke model enforced (Right Hand speaks for all)
- v5 Discord architecture live (named webhooks, reaction routing, ambient status)
- Vault as persistent truth (~200+ notes, QMD search, ontology sync)
- Self-learning loop partially implemented (Evolution Signals, CONTINUE protocol)
- Two-stage verification gate implemented

### What's Partially Working 🔨
- **Dispatch unification:** Two queue systems (dispatch-engine.sh + dispatch.sh V3) coexist but don't integrate
- **Proactive work:** Agents can self-initiate but ~90% of work is still Trajan-triggered
- **Performance feedback:** `agent-cards.json` exists but stats are manually maintained; failure analyzer has never run
- **Self-improving skills:** `workflow-patterns.json` tracks patterns but no automated `what_worked` capture

### What Was Just Shipped (2026-03-19) ✅
- **Dispatch v2:** Single `dispatch.sh` replacing 22 dead scripts. Queue/run/done/fail/chain.
- **Feedback loop:** Outcome tracker + fitness recalc pipeline
- **Signal converters:** `signal-to-queue.sh` replaces proactive-task-generator
- **Schedule system:** `schedule.json` replaces 10+ single-purpose crons
- **Cron cleanup:** 40 → 19 crons. Signal generators, not executors.
- **Discord UX redesign:** Calm technology principles, ⚡ACTIVE archived, topics rewritten

### What's Missing / Not Built 🎯
- **Goal objects:** Intent-driven decomposition (Horizon 2)
- **Anticipation queue:** Predictive task generation from behavioral patterns (Horizon 3)
- **Crystallization engine:** Pattern → candidate → proven → automated (Horizon 4)
- **Contract layer:** Machine-readable task specs with quality bars
- **Memory palace:** Spatial knowledge graph navigation
- **Divergence engine:** Auto-generate opposing perspectives for decisions

### Gap Summary Table

| Capability | Current | Target | Gap |
|---|---|---|---|
| Tasks dispatched/day | ~2-5 | 10-20 | 4-10x increase needed |
| Success rate | ~100% (small N) | >85% (large N) | Need volume to validate |
| Proactive tasks (%) | ~10% | >40% | Autonomy loop not built |
| Avg task latency | ~5 min | <3 min | Dispatch unification needed |
| Human intervention rate | ~60% | <20% | Self-healing + confidence needed |
| Agent self-improvement | Manual | Automatic | 20x pattern not implemented |
| Token budget enforcement | None | Per-agent caps | Not built |
| Dispatch systems unified | 2 parallel | 1 unified | Architectural debt |

---

## Next 90 Days Roadmap

> Ordered by impact-to-effort ratio. Aligned with Trajan's goal: a self-organizing system that frees him to focus on revenue.

### Month 1 — Stabilize & Unify (Days 1–30)

**Week 1–2: Dispatch Fixes**
- [ ] Fix cron frequency inconsistency (update AGENTS.md or cron to agree on interval)
- [ ] Fix duplicate log lines in dispatch-engine.sh (audit crontab for double entries)
- [ ] Fix V3 storage: move `/tmp/task-queue/` → `~/dispatch/v3/` (persistent)
- [ ] Add token budget prompts to all spawn templates (prompt-level enforcement)

**Week 3–4: Feedback Loop**
- [ ] Enhance outcome tracking: add `what_worked` / `what_failed` to each task completion
- [ ] Wire `dispatch-failure-analyzer.sh` to run weekly via cron
- [ ] Auto-update `agent-cards.json` stats after each task completion
- [ ] Build `~/bin/doc-staleness-check.sh` and add to heartbeat

**Month 1 Milestone:** Dispatch system is clean, stable, and self-documenting. Failure analyzer running.

---

### Month 2 — Autonomy & Intelligence (Days 31–60)

**Proactive Work Loop**
- [ ] Research loop runs without Trajan prompting (Researcher scans #links, HN, vault gaps)
- [ ] Vault Keeper self-initiates gap-fills when confidence <0.50 files detected
- [ ] Channel sweep catches dropped messages; no task goes unprocessed >30min
- [ ] Links pipeline: drop URL → Researcher analyzes → vault note created, no human step

**Agent Intelligence**
- [ ] Formalize communication graph in AGENTS.md with explicit flow rules
- [ ] Implement tiered crystallization: Signal → Candidate → Proven → Hardened
- [ ] Devil's Advocate reviews all major vault writes (confidence scores are his opinion)
- [ ] Unify the two dispatch queues: migrate V3 DAG logic into dispatch-engine.sh

**Month 2 Milestone:** 40% of tasks are proactively initiated. Dispatch is a single unified system.

---

### Month 3 — Intelligence & Scale (Days 61–90)

**Self-Improving Skills (20x Pattern)**
- [ ] Pattern aggregation job: scans outcome-tracker for recurring `what_worked` per task type
- [ ] Auto-integrate "Proven" patterns (10+ successes, 85%+ rate) into prompt templates
- [ ] Skill Proposals pipeline: accumulate 10+ outcomes → generate proposal → Trajan approves

**Advanced Orchestration**
- [ ] Multi-step workflow templates as first-class vault objects
- [ ] Human-in-the-loop gates: high-stakes tasks require explicit `/approve` before execution
- [ ] Cost-aware routing: use cheaper models (Haiku) for routing/classification, Sonnet for analysis
- [ ] Cross-agent memory: agents query vault refs at task start, not just at end

**Revenue-Linked Work**
- [ ] Wilson Premier Properties: agent automates client deliverable prep (research, drafts)
- [ ] New client pipeline: Biz Dev + Marketer agents run outreach campaigns proactively
- [ ] Daily brief includes revenue metrics + Trajan's active work items

**Month 3 Milestone:** Human intervention rate <30%. At least one agent-driven revenue action per week. Trajan can take a day off and the system still moves forward.

---

## Target Agent Capabilities

### Dispatch Layer (✅ Built)
- Task extraction from messages → dispatch queue
- Priority-based scheduling with circuit breakers
- Stale task detection and auto-cleanup
- Weekly optimizer that tunes parameters

### Autonomy Layer (🔨 Building)
- Channel sweep catches all dropped messages
- Vault ingestion creates tasks from knowledge gaps
- Research loop proposes improvements continuously
- Agents chain work without human in the loop

### Intelligence Layer (🎯 Target)
- Agents learn from each other's results (via vault + outcome-tracker)
- Dispatch engine predicts best agent from task content
- Cost-aware routing (fast agent for simple tasks, thorough agent for complex)
- Cross-agent memory sharing via vault refs in task files

### Orchestration Layer (🎯 Target)
- Multi-step workflows as first-class objects
- Workflow templates that agents can invoke
- Parallel/sequential/conditional branching
- Human-in-the-loop gates for high-stakes decisions

---

## Key Metrics (Target)

| Metric | Current | 30-day | 60-day | 90-day |
|---|---|---|---|---|
| Tasks dispatched/day | ~2-5 | 8-12 | 12-18 | 15-25 |
| Success rate | 100% (small N) | >90% | >88% | >85% |
| Proactive tasks (%) | ~10% | >25% | >35% | >45% |
| Avg task latency | ~5min | <4min | <3min | <2min |
| Human intervention rate | ~60% | <40% | <30% | <20% |
| Dispatch systems unified | 2 | 2→1 | 1 | 1 |

---

## Related

- [[Architecture/Agent Architecture Overview]]
- [[Architecture/System Overview]]
- [[Architecture/Design Decisions]]
- [[Architecture/Agent Orchestration Patterns]]
- [[Architecture/Dispatch Architecture Review]]
- [[Architecture/Discord Server Architecture v5]]
- [[Agents/Agent Roster]]
- [[Aspirational Integrations]]
- [[Aspirational Knowledge Loop]]
- [[Auto Delegator Layer]]
