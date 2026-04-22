---
title: Aspirational System Design
created: '2026-03-19'
updated: '2026-03-19'
type: knowledge
status: active
confidence: 0.6
source: 'agent:main'
domain: agent-architecture
summary: >-
  Futuristic agent system design — from queue-driven to intent-driven, from
  reactive to anticipatory, from tool to cognitive extension
tags:
  - aspirational
  - architecture
  - design
  - philosophy
  - future
aliases:
  - future-system
  - aspirational-design
wiki_id: system/architecture/Aspirational_System_Design
imported_from: vault/Architecture/Aspirational System Design.md
imported_at: '2026-04-04T00:23:56.734Z'
---

# Aspirational System Design

> The goal is not "AI that does tasks." The goal is **cognitive extension** — a system that thinks alongside Trajan, with its own operational memory, judgment, and initiative.

## Phase Model: Four Horizons

### Horizon 1: Queue-Driven (NOW — shipped 2026-03-19)
**Metaphor: Assembly line.** Tasks in, results out.

What we have: dispatch.sh v2, signal converters, feedback loops, heartbeat-driven execution. The system does what it's told and learns from outcomes.

**Capability:** Reliable task execution with automatic retry, chaining, and fitness scoring.
**Limitation:** Still fundamentally reactive. Needs explicit task creation.

---

### Horizon 2: Intent-Driven (NEXT — 30 days)
**Metaphor: Smart assistant.** Understands goals, decomposes into tasks autonomously.

**What changes:**
- **Intent parsing replaces task creation.** Trajan says "I want to ship the client template this week" → system decomposes into research, writing, review, delivery tasks.
- **Goal tracking.** Active goals persist across sessions. Each heartbeat checks: "Am I making progress on active goals?"
- **Predictive scheduling.** Based on outcome data: "This research task will take ~15 min based on 12 similar completions."
- **Context-aware routing.** Time of day, Trajan's activity level, task history all inform when/how to act.

**Key mechanism: Goal objects**
```json
{
  "id": "goal-client-template",
  "description": "Ship client template for Wilson Premier",
  "owner": "trajan",
  "deadline": "2026-03-26",
  "decomposition": [
    { "task": "Research competitive templates", "status": "done" },
    { "task": "Draft template v1", "status": "in_progress" },
    { "task": "Devil's Advocate review", "status": "blocked", "depends": "draft" },
    { "task": "Deliver to client", "status": "pending" }
  ],
  "auto_generated_tasks": true
}
```

Goals live in `~/dispatch/goals/`. Heartbeats check goal progress. Tasks auto-generate from decomposition.

---

### Horizon 3: Anticipatory (60 DAYS)
**Metaphor: Trusted advisor.** Sees what's coming before you do.

**What changes:**
- **Pattern prediction.** "Every Monday Trajan reviews PRs. Pre-queue the PR summary task for Sunday night."
- **Preemptive research.** "Trajan mentioned AI code review 3 times this week. Queue a deep research task before he asks."
- **Anomaly detection.** "Task completion time spiked 3x — investigate before reporting." 
- **Temporal awareness.** Deadlines approaching → auto-escalate priority. Weekend → batch low-priority work. Morning → prepare daily brief proactively.

**Key mechanism: Behavioral model**
The system maintains a lightweight model of Trajan's patterns:
- When does he check Discord? (Morning, evening, post-meeting)
- What does he care about this week? (Frequency analysis on topics)
- What triggers him to ask for something? (Preceding signals)
- What's his current cognitive load? (Inferred from message frequency, length, tone)

This isn't surveillance — it's the same thing a good chief of staff does: anticipate needs.

**Key mechanism: Anticipation queue**
A separate queue (`~/dispatch/anticipation/`) holds tasks that:
- Haven't been requested yet
- Are predicted to be useful based on patterns
- Execute proactively during idle time
- Get killed silently if proven irrelevant

---

### Horizon 4: Cognitive Extension (90+ DAYS)
**Metaphor: Second brain that acts.** Trajan's thinking and the system's thinking are integrated.

**What changes:**
- **Bidirectional learning.** The system doesn't just learn from Trajan — Trajan learns from the system. Daily briefs include "here's what I noticed you might be missing."
- **Perspective generation.** Before any major decision, the system automatically generates 3 perspectives: optimistic, pessimistic, orthogonal. Not because asked — because it's useful.
- **Knowledge synthesis.** Vault notes aren't just stored — they're connected, challenged, and evolved. The system notices when two notes contradict each other and flags it.
- **Taste and judgment.** The system develops preferences — "This source is usually unreliable," "This type of task works better with Researcher than Coder." Not just fitness scores, but nuanced routing intuition.
- **Executive function offload.** The system manages: what needs to happen this week, what's overdue, what's blocked, what's been forgotten. Trajan's working memory is extended by the system's.

**Key mechanism: The Inner Monologue**
The system maintains a private stream of observations:
```
[observation] Trajan hasn't mentioned Wilson project in 4 days — might be stalled
[observation] Three vault notes about auth patterns exist but none reference each other
[observation] Disk usage trend: +1.5GB/week, 6 weeks until critical
[observation] The "build X" task type has 95% success rate but "research X" only 60%
```

These feed into: anticipation queue, daily brief content, system improvements.

---

## Futuristic Functions (Speculative)

### The Divergence Engine
For any significant decision, automatically spawn three agents with different cognitive frames:
- **Optimist:** Best-case scenario, opportunity cost of not acting
- **Pessimist:** What could go wrong, hidden costs, second-order effects  
- **Orthogonal:** Reframe the question. "You're asking the wrong thing. The real question is..."

Present as a triptych in #decisions. Decision quality improves through structured disagreement.

### The Memory Palace
Vault evolves from flat files to a **spatial knowledge graph**:
- Notes have proximity (related notes cluster)
- Clusters have names (auto-generated topics)
- Navigation is visual — a map, not a file tree
- "Show me everything about auth" renders a neighborhood, not a search result
- Forgetting is intentional — low-confidence, low-access notes fade (but never delete)

### The Reputation System
Agents develop reputations over hundreds of tasks:
- Not just success rate, but **style profiles**: "Researcher is thorough but slow. Coder is fast but sometimes cuts corners on edge cases."
- Reputation informs task decomposition: "Break this into a fast part (Coder) and a thorough part (Researcher)"
- Agents can **specialize further** based on what they're good at, emergent from data

### The Ambient Dashboard
Discord voice channel #agent-status already shows status in the sidebar. Extend this:
- **Voice channel name updates** in real-time: "⏳ 3 tasks · 🟢 systems nominal"
- **Thread-based drill-down**: click the voice channel → see live task progress
- **Mobile-first**: the sidebar IS the dashboard. No separate app needed.
- **Emotional temperature**: 🟢 "All good" → 🟡 "Busy" → 🔴 "Needs attention" → 💀 "Something's broken"

### The Contract Layer
Every task dispatch includes a machine-readable contract:
```json
{
  "inputs": { "type": "research_query", "schema": "..." },
  "expected_outputs": { "type": "research_report", "schema": "..." },
  "quality_bar": { "min_sources": 3, "min_confidence": 0.7 },
  "sla": { "max_duration_min": 20, "max_tokens": 15000 },
  "verification": { "method": "two_stage", "reviewer": "devils_advocate" }
}
```
Contracts make expectations explicit. No more "the agent didn't know what I wanted." If the contract is satisfied, the task is done. If not, the gap is precisely identifiable.

### The Crystallization Engine
Patterns observed → patterns tested → patterns hardened → patterns automated:

```
OBSERVE: "Trajan always wants vault notes after research tasks"
  → Signal logged (count: 1)
  
CONFIRM: Same pattern 5 more times
  → Candidate rule: "After research task → auto-queue vault write"
  
TEST: Apply rule for 10 tasks
  → 8/10 kept, 2/10 Trajan deleted the vault note
  
HARDEN: Rule confirmed with conditions
  → "After research task → auto-queue vault write IF confidence > 0.6"
  
AUTOMATE: Rule becomes part of on_complete chain
  → No human intervention needed
```

This is how the system literally writes its own automation.

### The Forgetting Curve
Not everything should be remembered forever. Implement Ebbinghaus-style decay:
- New information: check in 1 day, 3 days, 7 days, 30 days
- If still relevant at each check → confidence increases
- If never referenced → confidence decays
- Below threshold → archive (not delete)
- This prevents vault bloat and keeps active knowledge fresh

---

## Design Psychology

### Cognitive Load Theory (Sweller)
**Principle:** Working memory is limited. Reduce extraneous load.
**Application:** Every Discord message competes for Trajan's limited attention. The system must be a net reducer of cognitive load, not an adder. This means: fewer channels, shorter messages, smart defaults, progressive disclosure.

### Flow State Protection (Csikszentmihalyi)
**Principle:** Interruptions destroy deep work. The cost of a context switch is 15-25 minutes.
**Application:** Never interrupt Trajan unless it's urgent. Batch notifications. If he's been active in #dispatch for 30+ minutes, he's in flow — hold non-urgent updates until he goes quiet.

### Paradox of Choice (Schwartz)
**Principle:** More options = worse decisions + less satisfaction.
**Application:** Agents should recommend ONE action, not present options. "I'd go with X because Y" beats "Here are 5 options." Only offer choices when the decision is genuinely ambiguous or high-stakes.

### Zeigarnik Effect
**Principle:** Unfinished tasks occupy mental space.
**Application:** The system tracks open loops so Trajan doesn't have to. Goal objects, active task lists, and the daily brief all serve to externalize unfinished business from Trajan's head into the system.

### Recognition-Primed Decision Making (Klein)
**Principle:** Experts don't analyze options — they pattern-match from experience.
**Application:** Present information in a way that supports pattern matching: consistent formats, familiar layouts, predictable locations. The identity bar, the status emojis, the channel structure — all support rapid recognition.

---

## Implementation Priority

| Horizon | When | Key Build |
|---|---|---|
| H1: Queue-driven | ✅ NOW | dispatch.sh v2, signals, schedule, feedback |
| H2: Intent-driven | 30 days | Goal objects, intent parsing, predictive scheduling |
| H3: Anticipatory | 60 days | Behavioral model, anticipation queue, temporal awareness |
| H4: Cognitive extension | 90+ days | Divergence engine, crystallization, memory palace |

## Related

- [[Queue Architecture v2]]
- [[Discord UX Philosophy]]
- [[Aspirational Agent System]]
- [[Aspirational Knowledge Loop]]
- [[Aspirational Integrations]]
