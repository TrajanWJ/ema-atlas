---
title: EMA Multi-Agent Workflow Analysis
created: '2026-04-03'
updated: '2026-04-03'
type: knowledge
status: active
confidence: 0.82
tags:
  - ema
  - workflow
  - agents
  - orchestration
  - roadmap
summary: >-
  Synthesis of Trajan's actual multi-agent workflow patterns and what EMA must
  support to serve them natively.
related:
  - '[[Architecture/EMA Full Integration Roadmap]]'
  - '[[System/Agent Orchestration Patterns]]'
  - '[[Trajan/Decisions]]'
wiki_id: system/architecture/EMA-Workflow-Analysis-2026-04-03
imported_from: vault/Architecture/EMA-Workflow-Analysis-2026-04-03.md
imported_at: '2026-04-04T00:23:56.749Z'
---

# EMA Multi-Agent Workflow Analysis
*Researcher subagent synthesis — 2026-04-03*
*Sources: vault/Trajan/Decisions.md, vault/Trajan/Preferences.md, vault/System/Agent Orchestration Patterns.md, vault/System/Agent Capabilities Matrix.md, vault/System/Agent Performance Patterns.md, vault/System/Evolution Signals.md, vault/System/Usage Patterns.md, vault/System/dispatch-audit-2026-03-19.md, vault/Codebases/EMA.md, vault/Projects/EMA Sprint Status.md, vault/Architecture/EMA-As-Executive-Layer-Synthesis.md*

---

## 1. Actual Workflow Pattern

The data shows a clear, consistent pattern: **hub-and-spoke with burst dispatch, not chains**.

Right Hand is the permanent hub. Every user intent enters through Right Hand. Right Hand decomposes, dispatches to specialists in parallel bursts (typically 4-6 agents per wave — per Preferences.md's "Continuous Agent Waves"), and then synthesizes results back into a single Discord message.

The canonical flow for a 3+ domain task:

```
Trajan → Right Hand (intent arrives)
  ↓ decompose into parallel tracks
  ├── Researcher (web intel, feasibility research)
  ├── Coder (implementation)
  ├── Ops (infra/health check)
  └── Vault Keeper (knowledge persistence)
  ↓ results collected by Right Hand
  ↓ Right Hand synthesizes + posts to Discord
  ↓ Trajan reviews (optional — often async/overnight)
  ↓ If gaps: targeted re-dispatch of specific agents
```

**Parallel vs. sequential:** Parallel is the default. Trajan's Decisions.md (2026-03-18) makes this explicit: "Agents can call each other" and "Any session can be switched between agents and personas effectively." Sequential dispatch (Security → Ops) only appears when outputs are inputs — specifically the documented Security→Ops delegation sequence from Evolution Signals, where security findings must exist before Ops can harden against them. The circuit breaker is: if Track A times out, the other tracks still complete and their results land.

**Diverge vs. Parallax:** These appear at different lifecycle stages. Diverge (`diverge` skill) is used upfront for ambiguous decisions — the 2026-03-19 decision about Discord restructure explicitly uses "multiple agents iterate, debate, and present a pitch" before structural changes. Parallax appears for post-design critique (Dashboard Design Process on 2026-03-16: "3 concepts → Devil's Advocate critique → product design critic review"). In practice: Diverge = explore the problem space. Parallax = stress-test a candidate solution from stakeholder angles.

**Agents never hand off peer-to-peer.** Agent Orchestration Patterns.md is explicit: "Specialist → Specialist: NEVER direct. Always through Right Hand to maintain audit trail." The one exception in the data is Scout → Security routing, but that also goes through Right Hand as intermediary. All results flow back to the hub.

---

## 2. Key Decision Points

Three documented inflection points where Trajan makes dispatch choices:

**Inflection 1: Scope gating before dispatch.** Decisions.md (2026-03-18, "Dispatch Reliability as P0") and Agent Capabilities Matrix entries like "Vault Keeper: Max 50 files per dispatch" reflect learned scope limits. The decision isn't *who* to dispatch — it's *how narrowly* to scope the task. Under-scoped dispatches (293-file vault audit, full ClawHub scan) reliably time out. Well-scoped dispatches (targeted link fixes, specific feature builds) succeed. Trajan makes this judgment manually before every dispatch; there's no automated scope checker.

**Inflection 2: Multi-agent deliberation gate for structural decisions.** The Discord restructure v2 (2026-03-19) decision is the clearest example: "deliberation rather than direct implementation — major structural changes go through multi-agent review first." The pattern: intent arrives → Right Hand checks if this is structural/irreversible → if yes, spawns deliberation wave (Diverge/Parallax/Devil's Advocate) before spawning implementation. For routine tasks, deliberation is skipped.

**Inflection 3: Overnight vs. synchronous dispatch.** Preferences.md makes this explicit: "When Trajan sleeps: continuous async progress." Tasks with no human dependency get dispatched to run overnight and land on the "desk" by morning. Tasks requiring Trajan's judgment are queued as forum posts. The distinction is: does the next step require input from Trajan? If not, dispatch now and let it run.

---

## 3. Failure Modes

Four concrete failure patterns from the data:

**Timeout-with-total-loss.** Vault Keeper's 293-file audit (Agent Performance Patterns, Task 3-4) timed out. The subsequent wikilink fix also timed out "with no incremental writes — total loss." The fix (Checkpoint-Based Execution Protocol, Decisions.md 2026-03-18) exists in the spec but wasn't yet enforced in agent prompts at time of failure.

**Gateway-restart-kills-everything.** Coder's feature build (Task 6) "lost to gateway restart — infra failure, not agent failure." The agent was fine; the infrastructure wasn't. This is the most trust-breaking failure in the log.

**Silent dispatch failure.** Dispatch Reliability decision (2026-03-18): "Agent dispatch is pathetic — current dispatch fails silently, agents don't actually run." The dispatch queue fires and nothing happens, with no visible signal to Trajan. He only discovers failures by checking.

**Rate-limit timeout.** Researcher's ClawHub scan (Task 5) "rate limited, needs longer timeout." Agent successfully starts work but gets throttled by external APIs. No retry logic, no partial capture.

Common denominator: all four failure modes involve **work starting, not completing, and Trajan not knowing**. The feedback loop breaks exactly at the point where it matters most.

---

## 4. EMA Affordances — What Maps, What's Missing

**What maps naturally:**

- **Tasks** ↔ dispatch queue. Every agent dispatch creates a task. EMA's task tracking with outcomes (success/failure/warning) directly maps to the outcome-tracker.json pattern already in use. The outcome data (what_worked, what_failed fields proposed in Agent Orchestration Patterns.md) is missing from EMA's current implementation.

- **Proposals** ↔ deliberation gate. The 4-stage pipeline (Generator → Refiner → RiskAnalyzer → Formatter) with quality gates maps directly to how major decisions work: Diverge/deliberation wave → Devil's Advocate critique → synthesis → action. Proposals are the deliberation gate formalized.

- **Vault search** ↔ pre-dispatch context injection. The Agent Orchestration Patterns section on "Cross-Agent Memory Sharing" (inject `learnings.md` before spawning, append after completion) maps to EMA's vault query. The gap: EMA's vault search is currently pull-only; agents don't auto-receive relevant vault context on spawn.

- **Outcome tracking** ↔ Reflexion pattern. Decisions.md (2026-03-18, "Reflexion Pattern for Dispatch"): inject "lessons learned from last 3 outcomes for that agent+task_type" before spawning. EMA's outcome tracker is the data source for this; the injection mechanism is the gap.

**What's missing / gaps:**

- **No dispatch visibility.** The biggest gap. When Trajan dispatches 5 agents, EMA has no view showing "3 running, 1 timed out, 1 waiting." He discovers failures post-hoc. There is no live dispatch board.

- **No scope advisor.** The scope-gating decision (Inflection 1) is entirely manual. EMA has the outcome data to know "Vault Keeper timeouts on >50 files" but doesn't surface this warning when a task is queued.

- **No structural decision gate.** The deliberation gate (Inflection 2) is Right Hand's judgment call. EMA has no mechanism to detect "this task is structural/irreversible" and automatically route it to deliberation vs. direct execution.

- **No failure feedback loop.** Silent dispatch failures (Failure Mode 3) require Trajan to poll. EMA's task tracking exists but doesn't push notifications on failure to wherever Trajan is working.

---

## 5. Recommendation: 4 EMA Affordances for Weeks 7-8

These are ordered by leverage on the actual workflow, not by technical complexity.

**#1 — Dispatch Board (live task state panel)**

A real-time view of all in-flight agent dispatches: status (queued/running/success/failed/partial), elapsed time, agent, brief description. Single-screen answer to "what are my agents actually doing?" Maps to EMA's Tasks domain. Required UI: a live list with status badges, elapsed timer, and a "view output" expand. This directly addresses the silent failure problem — Trajan sees failures the moment they happen, not when he next checks.

**#2 — Scope Advisor on task creation**

When a task is created for dispatch, check outcome history for that agent+task_type combination. If similar tasks have failed at that scope (file count, domain breadth, time estimate), surface a warning before dispatch: "Vault Keeper has timed out on similar audits — suggest scoping to <50 files." Uses EMA's outcome tracker as the data source. No new data required; just surface what's already captured. Closes the scope-gating decision gap.

**#3 — Deliberation gate trigger**

Flag tasks as "structural" or "reversible" at creation time (single checkbox or auto-detect from keywords like "restructure", "migrate", "delete", "rename globally"). Structural tasks automatically spawn a deliberation step — proposal drafted first, quality gates applied, then implementation task created from the approved proposal. This formalizes the pattern already documented in Decisions.md (2026-03-19). EMA's Proposals pipeline is exactly the deliberation gate; it just needs to be the mandatory precursor for structural tasks.

**#4 — Reflexion injection on dispatch**

Before any agent is spawned, query outcome tracker for the last 3 outcomes on that agent+task_type. Inject what_worked/what_failed summary into the agent's spawn prompt. This is the Reflexion pattern from Decisions.md (2026-03-18) that EMA's architecture mentions but doesn't implement. Concrete data exists (Agent Performance Patterns has outcome_type, duration, quality_score, feedback fields). The gap is the injection hook in the dispatch path. Low implementation effort; high reliability improvement.

---

## The Minimal Set

If EMA must support exactly the workflow Trajan has evolved, the minimum viable feature set is:

1. **See what's running** (Dispatch Board)
2. **Know before dispatching if it'll fail** (Scope Advisor)
3. **Route structural decisions through deliberation automatically** (Deliberation Gate)
4. **Make agents smarter on second dispatch** (Reflexion Injection)

Features 3 and 4 directly leverage EMA's existing Proposals pipeline and Outcome Tracker — they're integrations, not new domains. Features 1 and 2 are new UI/query work against existing task data.

What EMA doesn't need for this workflow: a generic agent orchestrator, arbitrary peer-to-peer agent messaging, or a new communication protocol. The actual workflow is hub-and-spoke with burst parallelism. EMA should make that pattern faster, more visible, and more reliable — not replace it with something more complex.

---

*Status: DONE*
*Files written: vault/Architecture/EMA-Workflow-Analysis-2026-04-03.md*
