---
title: Agent Orchestration Patterns
date: 2026-03-18T00:00:00.000Z
type: knowledge
summary: >-
  Best-in-class multi-agent orchestration patterns mapped to our dispatch
  architecture.
tags:
  - orchestration
  - patterns
  - multi-agent
  - token-budgets
  - self-improving
  - memory
  - dispatch
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
sources:
  - '[[GitHub Intel - Deep Sweep 2026-03-18]]'
  - '[[Web Intel - Deep Sweep 2026-03-18]]'
  - '[[Reddit Intel - Deep Sweep 2026-03-18]]'
  - AGENTS.md (current dispatch protocol)
derived_from:
  - Shannon (Kocoro-lab) — token budget control
  - agency-swarm (VRSEN) — communication flows
  - Gambit (Bolt Foundry) — typed deck interfaces
  - 20x (Peakflo) — self-improving skills
  - cortex-tms — doc staleness detection
  - Aegis Memory — trust hierarchy
  - n8n agent army — orchestrator routing
source: system
updated: '2026-03-18'
created: '2026-03-18'
wiki_id: system/Agent_Orchestration_Patterns
imported_from: vault/System/Agent Orchestration Patterns.md
imported_at: '2026-04-04T00:23:57.215Z'
---

# Agent Orchestration Patterns

Formalized reference of best-in-class orchestration patterns from community research, mapped to our system's architecture. Each pattern includes: what it is, where it comes from, how it maps to us, and concrete implementation guidance.

---

## 1. Dispatch Patterns

### 1.1 Our Current Model: File-Based Dispatch + Intelligent Delegation

**How it works:** JSON task files in `~/dispatch/queue/`, cron-driven engine every 10 minutes, DAG-based dependency resolution via `dispatch.sh`, agent capability matching via `agent-cards.json`. Based on Google DeepMind's Intelligent Delegation framework.

**Strengths:**
- Simple, debuggable (files are inspectable)
- DAG dependency resolution handles sequential workflows
- Circuit breaker prevents cascading failures
- Two-stage verification (spec compliance → quality check)

**Gaps identified by research:**

| Gap | Source | What They Do Better |
|---|---|---|
| No token budget per task | Shannon | Each agent/task gets a token ceiling; exceeded = abort or escalate |
| No typed interfaces | Gambit | Each agent declares input/output schemas; mismatches caught at dispatch time |
| No directional flow control | agency-swarm | Explicit graph of who-can-talk-to-whom; prevents crosstalk |
| No automatic skill refinement | 20x | Skills update themselves after every task based on outcomes |
| No per-step evaluation | Gambit | Built-in grader agents score each pipeline step, not just the final output |

### 1.2 Shannon's Token Budget Model

**Source:** Kocoro-lab/Shannon (1.2k stars, Go/Rust, production-grade)

Shannon assigns every task and agent a token budget — a hard ceiling on how much context/output a unit of work can consume. This prevents:
- Runaway agents eating entire context windows
- Verbose agents crowding out useful output
- Cost blowouts on recursive or exploratory tasks

**Pattern:**
```
task.create({
  agent: "researcher",
  budget: { input: 8000, output: 4000 },
  escalation: "truncate_and_summarize"  // or "abort" or "request_increase"
})
```

### 1.3 Gambit's Deck Pattern

**Source:** Bolt Foundry/Gambit (91 HN points, active)

Agents are "decks" — self-contained markdown or TypeScript files with **typed inputs and typed outputs**. The pipeline is LLM→LLM→LLM→compute, not compute→LLM→compute. Each step has a built-in grader that evaluates before passing to the next step.

**What we should adopt:**
- Typed contracts: each agent declares what it expects and what it returns
- Per-step grading: don't just verify the final output — verify each handoff
- Model routing per step: different agents can use different model configs

### 1.4 agency-swarm's Communication Flows

**Source:** VRSEN/agency-swarm (4.1k stars, OpenAI Agents SDK)

Defines explicit directional communication graphs. An agent can only talk to agents it's connected to. The CEO can talk to the VA and Developer, but the Developer can't talk to the CEO directly — it goes through the VA.

**Pattern:** `communication_flows = { CEO: [VA, Developer], VA: [CEO, Developer], Developer: [VA] }`

### 1.5 n8n Agent Army Orchestrator Pattern

**Source:** Reddit, 1,970 upvotes

Master orchestrator routes to 8 specialists. GPT-4.1 for orchestration (cheap, fast routing), Claude Sonnet for content creation (quality). PostgreSQL for cross-session memory.

**Key insight:** Model routing by role — the orchestrator doesn't need the smartest model, just the fastest one that can classify intent reliably.

---

## 2. Token Budget Control

### 2.1 Proposed Budget System for Our Agents

Based on Shannon's model, adapted for our Claude Code subagent architecture where agents are spawned processes, not persistent services.

#### Budget Tiers

| Agent | Input Budget | Output Budget | Rationale |
|---|---|---|---|
| 🤝 Right Hand | Unlimited | Unlimited | Persistent session, needs full context |
| 🔬 Researcher | 50K tokens | 15K tokens | Deep research needs room; output should be synthesized |
| 💻 Coder | 80K tokens | 30K tokens | Code tasks need large context; output includes code files |
| ⚙️ Ops | 20K tokens | 5K tokens | Ops tasks are usually focused; short status reports |
| 🛡️ Security | 30K tokens | 10K tokens | Audits need context but findings should be concise |
| 📚 Vault Keeper | 40K tokens | 10K tokens | Scans many files; output is reorganization plan |
| 🔭 Scout | 30K tokens | 10K tokens | Web scraping; output should be extracted facts |
| 🎯 Prompt Engineer | 15K tokens | 8K tokens | Works on single files; output is the improved prompt |
| 🛎️ Concierge | 10K tokens | 3K tokens | Simple lookups; brief answers |
| 😈 Devil's Advocate | 20K tokens | 8K tokens | Reviews existing output; adds critique layer |
| 🧠 Strategist | 30K tokens | 12K tokens | Multi-framework analysis; structured output |

#### Enforcement Mechanisms

Since our agents are Claude Code processes (not API calls we control at the proxy level), enforcement is **prompt-based + post-hoc**:

1. **Prompt-Level Budget:** Include in every spawn prompt:
   ```
   TOKEN BUDGET: Your output must not exceed ~{N}K tokens (~{N*750} words).
   If your findings exceed this, summarize and offer to provide details on request.
   ```

2. **Post-Hoc Verification:** Right Hand checks output length after collection. If an agent consistently exceeds budget:
   - Log to `memory/agent-performance.md` with `budget_exceeded: true`
   - Next dispatch includes stricter prompt: "Be concise. Previous output was {X}K tokens, budget is {Y}K."
   - After 3 budget violations: tighten the prompt template permanently

3. **Future: Proxy-Level Enforcement** (if we adopt LiteLLM or similar):
   - Set `max_tokens` per agent/task at the API proxy level
   - Hard cutoff prevents runaway generation regardless of prompt compliance

#### Budget Escalation Protocol

```
Agent hits budget ceiling
  ↓
Option A: Truncate + summarize (default for research/analysis)
Option B: Abort + report partial (for code generation — half-done code is worse than none)
Option C: Request increase (agent reports: "need ~{X}K more tokens because {reason}")
  ↓
Right Hand decides: grant increase, accept partial, or re-scope task
```

---

## 3. Self-Improving Skills

### 3.1 20x's Pattern

**Source:** Peakflo/20x — self-improving skill templates

20x attaches "skills" (reusable instruction templates) to task types. After every task completion:
1. Agent evaluates what worked and what didn't
2. Agent proposes updates to the skill template
3. Confidence score is updated (tracks reliability over time)
4. Next time that task type runs, the improved skill is used

**Key difference from our system:** 20x does this automatically after every task. Our `workflow-patterns.json` crystallization system requires 5+ successes and 70%+ rate before even flagging a candidate, and then requires human approval.

### 3.2 Mapping to Our Crystallization System

Our `workflow-patterns.json` already tracks recurring patterns. The gap is the **feedback loop** — we count successes but don't capture *what specifically worked*.

#### Proposed Enhancement: Outcome-Driven Skill Updates

**Phase 1: Structured Outcome Capture** (low effort, high value)

After every dispatched task, Right Hand records in `memory/outcome-tracker.json`:
```json
{
  "task_id": "...",
  "agent": "researcher",
  "task_type": "deep_research",
  "outcome": "success",
  "what_worked": ["triangulated queries", "source tiering", "HN Algolia fallback"],
  "what_failed": ["Brave API unavailable", "initial query too broad"],
  "prompt_effectiveness": 0.85,
  "output_quality": 0.9,
  "timestamp": "2026-03-18T03:00Z"
}
```

The `what_worked` and `what_failed` fields are the key addition — they capture specific techniques, not just pass/fail.

**Phase 2: Pattern Aggregation** (medium effort)

A periodic job (heartbeat or cron) scans `outcome-tracker.json` for recurring `what_worked` entries per `task_type`:
- If a technique appears in 3+ successful outcomes → add it to the agent's spawn prompt template
- If a technique appears in 3+ failures → add it to an anti-pattern list
- This is the 20x "self-improving skill" pattern adapted for our file-based architecture

**Phase 3: Automated [[Skill Proposals]]** (higher effort, requires human approval gate)

When enough outcome data accumulates for a task type (10+ completions):
1. Aggregate the `what_worked` patterns
2. Generate a proposed skill update (new prompt template section, new routing shortcut, or new script)
3. Write proposal to `vault/System/Skill Proposals/` for human review
4. Only deploy after Trajan approves

#### Crystallization Threshold Tuning

Current thresholds (5+ successes, 70%+ rate) are reasonable for safety but slow for learning. Proposed tiered approach:

| Confidence Level | Threshold | Action |
|---|---|---|
| **Signal** | 3+ occurrences | Log to [[Evolution Signals]], no action |
| **Candidate** | 5+ successes, 70%+ rate | Flag in workflow-patterns.json, propose to Trajan |
| **Proven** | 10+ successes, 85%+ rate | Auto-integrate into prompt templates (reversible) |
| **Hardened** | 20+ successes, 90%+ rate | Crystallize into skill/script (human approval) |

The "Proven" tier is the 20x-inspired addition — patterns with enough evidence auto-integrate without waiting for human approval, but remain reversible (tracked in workflow-patterns.json with `auto_integrated: true`).

---

## 4. Communication Flows

### 4.1 Current State

Our system has implicit communication flows: Right Hand dispatches to anyone, specialists return results to Right Hand, specialists don't talk to each other directly. The Orchestrator can spawn anyone.

### 4.2 Formalized Communication Graph

Adapted from agency-swarm's directional flow model, mapped to our [[agent roster]]:

```
┌──────────────────────────────────────────────────┐
│                   TRAJAN (human)                  │
│                       ↕                           │
│               🤝 RIGHT HAND (hub)                 │
│              ↙  ↓    ↓    ↓   ↘                   │
│           🔬   💻   ⚙️   🛡️   📚                  │
│          Res  Code  Ops  Sec  Vault               │
│           │              ↑                        │
│           ↓              │                        │
│          🔭 Scout ───────┘                        │
│                                                   │
│     Cross-cutting (invoked by Right Hand):        │
│     🎯 Prompt Eng  🛎️ Concierge                  │
│     😈 Devil's Adv  🧠 Strategist                │
│                                                   │
│     Orchestrator (complex multi-agent):           │
│     🎭 Orchestrator ←→ Right Hand                 │
└──────────────────────────────────────────────────┘
```

#### Flow Rules

| From | Can Talk To | Channel | Notes |
|---|---|---|---|
| Trajan | Right Hand | Discord/Telegram/CLI | All human input enters here |
| Right Hand | Any specialist | `sessions_spawn` | Hub-and-spoke: RH dispatches, collects, synthesizes |
| Any specialist | Right Hand | Return value | Results flow back; specialists never post to Discord |
| Scout | Security | Via Right Hand | Scout finds exposed endpoints → RH routes to Security |
| Researcher | Right Hand | Return value | Can recommend spawning other specialists in its report |
| Orchestrator | Any agent | `sessions_spawn` | For 3+ agent coordination; orchestrator manages the DAG |
| Right Hand | Orchestrator | `sessions_spawn` | Escalation path for complex workflows |
| Specialist → Specialist | **NEVER direct** | — | Always through Right Hand to maintain audit trail |

#### Information Flow Types

| Flow Type | Description | Example |
|---|---|---|
| **Command** | Right Hand tells specialist what to do | "Research X with these constraints" |
| **Result** | Specialist returns findings to Right Hand | Research report, code diff, audit findings |
| **Escalation** | Specialist reports it can't complete the task | BLOCKED/NEEDS_CONTEXT status |
| **Recommendation** | Specialist suggests follow-up work | "Security should review this endpoint" |
| **Context** | Right Hand provides vault refs or prior agent output | `vault_refs` in task file |
| **Feedback** | Right Hand tells specialist to revise output | Verification loop re-dispatch |

#### Anti-Patterns

- **Specialist-to-specialist direct calls:** Breaks the audit trail. Even if Coder needs Security review, it reports to Right Hand which then dispatches Security.
- **Orchestrator bypassing Right Hand for Discord:** Only Right Hand posts to Discord. Orchestrator coordinates agents but final presentation is always Right Hand.
- **Circular dependencies:** A dispatches to B which needs A's output. Break the cycle by having Right Hand hold intermediate state.

---

## 5. Doc Staleness Detection

### 5.1 cortex-tms Pattern

**Source:** cortex-tms/cortex-tms (170 stars, active)

cortex-tms uses git-based staleness detection: it tracks when documentation files (PATTERNS.md, ARCHITECTURE.md, CLAUDE.md) were last modified relative to code changes. If code changes significantly but docs haven't been updated, it flags them as potentially stale.

**Their approach:**
1. Track `git log` timestamps for doc files vs code files
2. If code in a module changes but the module's docs haven't been touched in N commits → flag
3. Validation checks ensure docs still accurately describe current behavior
4. Health-check reports show doc freshness scores

### 5.2 Our Staleness Problem

Our governance docs (AGENTS.md, SOUL.md, TOOLS.md) describe how agents *should* behave. But actual behavior drifts:
- New patterns emerge that aren't documented
- Documented patterns stop being used
- Thresholds and timeouts get learned but not updated in the docs
- [[Agent roster]] changes (skills added/removed) without doc updates

### 5.3 Proposed Staleness Detection System

#### Signal Sources

| Signal | Indicates Staleness When... | Check Method |
|---|---|---|
| **File age** | AGENTS.md/SOUL.md not modified in 14+ days | `stat -c %Y` on file |
| **Outcome drift** | Agent performance trends [[diverge]] from documented expectations | Compare `agent-performance.md` fitness scores vs AGENTS.md timeout/capability claims |
| **Pattern mismatch** | Documented routing rules don't match actual dispatch patterns | Compare `workflow-patterns.json` top patterns vs AGENTS.md routing table |
| **Skill drift** | Installed skills don't match [[agent roster]]'s skill lists | `ls ~/skills/` vs AGENTS.md skill columns |
| **Config drift** | [[OpenClaw config]] (agents, plugins) doesn't match TOOLS.md | Diff `openclaw config` output vs TOOLS.md claims |
| **Dead references** | AGENTS.md references files/scripts that don't exist | Check all paths mentioned in docs |

#### Implementation: Staleness Checker Script

A script (`~/bin/doc-staleness-check.sh`) that runs during heartbeats:

```bash
#!/bin/bash
# Doc Staleness Checker
# Run during heartbeats, outputs staleness report

STALE_THRESHOLD_DAYS=14
AGENTS_MD="$HOME/.openclaw/agents/main/workspace/AGENTS.md"
SOUL_MD="$HOME/.openclaw/agents/main/workspace/SOUL.md"
TOOLS_MD="$HOME/.openclaw/agents/main/workspace/TOOLS.md"

echo "=== Doc Staleness Report ==="

# 1. File age check
for doc in "$AGENTS_MD" "$SOUL_MD" "$TOOLS_MD"; do
  age_days=$(( ($(date +%s) - $(stat -c %Y "$doc")) / 86400 ))
  if [ $age_days -gt $STALE_THRESHOLD_DAYS ]; then
    echo "⚠️  $(basename $doc) last modified $age_days days ago (threshold: $STALE_THRESHOLD_DAYS)"
  else
    echo "✅ $(basename $doc) modified $age_days days ago"
  fi
done

# 2. Skill drift check
echo ""
echo "--- Skill Drift ---"
installed=$(ls ~/skills/ 2>/dev/null | sort)
# Compare against AGENTS.md skill references (manual review)
echo "Installed skills: $(echo $installed | wc -w)"
echo "Review AGENTS.md skill columns against: ~/skills/"

# 3. Dead reference check
echo ""
echo "--- Dead References ---"
grep -oP '~/bin/[a-z-]+\.sh' "$AGENTS_MD" | sort -u | while read script; do
  expanded=$(eval echo "$script")
  if [ ! -f "$expanded" ]; then
    echo "❌ Referenced but missing: $script"
  fi
done

echo ""
echo "=== End Report ==="
```

#### Heartbeat Integration

Add to `HEARTBEAT.md` rotation:
```
- [ ] Doc staleness check (run ~/bin/doc-staleness-check.sh, fix any flagged issues)
```

Frequency: Every 3rd heartbeat cycle (roughly weekly).

#### Behavioral Staleness (Harder Problem)

File age and skill drift are easy. The hard problem is **behavioral staleness** — when AGENTS.md says "do X" but the agent actually does Y because Y works better.

Detection approach:
1. After each dispatch cycle, Right Hand briefly compares: "Did I follow AGENTS.md's routing rules, or did I deviate?"
2. If deviation: log to `vault/System/Evolution Signals.md` with the actual vs documented behavior
3. When 3+ deviations on the same rule accumulate → flag AGENTS.md section as stale
4. Right Hand proposes an update (or just makes it, for minor clarifications)

This is the cortex-tms principle adapted for behavioral docs rather than code docs: **the document should describe what actually happens, not what was planned.**

---

## 6. Trust Hierarchy (Aegis Model)

### 6.1 Pattern

**Source:** Aegis Memory v1.2

Four-tier trust model for agent memory and actions:

| Tier | Level | Our Mapping | Capabilities |
|---|---|---|---|
| **System** | Highest | Right Hand, AGENTS.md, SOUL.md | Full read/write to all memory, dispatch authority, Discord posting |
| **Privileged** | High | Orchestrator | Can spawn any agent, coordinate multi-agent workflows |
| **Internal** | Standard | All specialists | Read vault, write to their output, execute within their domain |
| **Untrusted** | Lowest | Web content, external inputs | Wrapped in SECURITY NOTICE, never executed as instructions |

### 6.2 Application

Currently implicit in our system. Formalizing it means:
- Specialists can't modify AGENTS.md or SOUL.md (only Right Hand can)
- Web-fetched content is always treated as data, never as instructions (already enforced by [[OpenClaw]]'s wrapping)
- Dispatch queue files can only be created by Right Hand or Orchestrator
- Agent performance logs are append-only for specialists, read-write for Right Hand

---

## 7. Pattern Cross-Reference

Quick lookup: which external system maps to which internal component.

| External Pattern | Our Equivalent | Gap | Priority |
|---|---|---|---|
| Shannon token budgets | None | No per-agent/task token limits | 🔴 High |
| Gambit typed decks | [[Agent roster]] + spawn prompts | No typed input/output schemas | 🟡 Medium |
| agency-swarm comm flows | Implicit hub-and-spoke | Not formalized, no enforcement | 🟡 Medium |
| 20x self-improving skills | workflow-patterns.json | No automated outcome capture of *what worked* | 🔴 High |
| cortex-tms staleness | None | No staleness detection | 🟡 Medium |
| Aegis trust hierarchy | Implicit | Not formalized, no enforcement | 🟢 Low |
| n8n model routing | Single model (Opus) | No per-agent model routing | 🟢 Low |
| Evo-Memory Search→Synthesize→Evolve | outcome-tracker + evolution loop | Missing "synthesize" step (combining past outcomes into strategy) | 🟡 Medium |
| Gambit per-step grading | Two-stage verification (final only) | No intermediate step evaluation | 🟡 Medium |

---

## 8. Implementation Roadmap

### Phase 1: Quick Wins (This Week)
1. **Add token budget prompts** to spawn templates — prompt-level enforcement, no infrastructure needed
2. **Enhance outcome-tracker.json** with `what_worked` / `what_failed` fields
3. **Create `~/bin/doc-staleness-check.sh`** and add to heartbeat rotation

### Phase 2: Structural Improvements (This Month)
4. **Formalize communication graph** — add the flow rules table to AGENTS.md
5. **Implement tiered crystallization thresholds** (Signal → Candidate → Proven → Hardened)
6. **Add behavioral staleness logging** — deviations tracked in [[Evolution Signals]]

### Phase 3: Advanced Patterns (When Needed)
7. **Typed agent interfaces** — each agent declares expected input/output schemas
8. **Per-step grading** for sequential workflows (not just final verification)
9. **Proxy-level token enforcement** via LiteLLM (if cost becomes a concern)
10. **Model routing per agent** — use cheaper models for simple routing, premium for analysis

---

*Generated 2026-03-18. Update when new patterns are adopted or existing patterns prove ineffective.*
