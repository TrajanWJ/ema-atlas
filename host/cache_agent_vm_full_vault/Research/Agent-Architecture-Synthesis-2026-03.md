---
title: "Agent Architecture Synthesis — March 2026"
type: synthesis
tags: [agent-architecture, synthesis, implementation, superpowers, langchain, deep-agents, awesome-copilot, autonomous-learning]
created: "2026-03-18"
updated: 2026-03-18
confidence: 0.60
confidence_updated: 2026-03-18
source: agent:researcher
status: active
summary: "Consolidated synthesis of 4 major research threads (Superpowers, awesome-copilot, LangChain Deep Agents, arXiv 2603.15381). Key patterns extracted and implementation status tracked."
---

# Agent Architecture Synthesis — March 2026

**Synthesized from:**
- [[Superpowers Architecture - Stolen Patterns]] — process discipline, skill DAGs, adversarial review
- [[Awesome-Copilot-Deep-Dive]] — hooks, governance, modular SOUL, CSO
- [[LangChain-Deep-Agents]] — `write_todos`, virtual filesystem, pluggable backends
- [[Autonomous-Learning-System-ABC]] — System A/B/M autonomous learning
- [[Self-Organizing Agent Architectures]] — multi-agent coordination papers (March 2026)
- [[Multi-Agent Coordination Patterns]] — CrewAI, LangGraph, AutoGen taxonomy

---

## The Convergence: What They All Agree On

After synthesizing 6 major research threads, these patterns appear **universally**:

### 1. Planning Before Acting (Universal)
- Superpowers: Brainstorm → Spec → Plan → Implement (hard gates)
- Deep Agents: `write_todos` tool built-in
- LangGraph: State machine nodes force explicit decision points
- VMAO (arXiv 2603.11445): DAG decomposition before parallel execution
- **Our gap:** We plan ad-hoc in prose. Not visible, not trackable.

### 2. Context Isolation for Subagents (Universal)
- Superpowers: Fresh context per task, controller curates context
- Deep Agents: `task()` tool = isolated subagent context
- Hermes: Iteration budget shared, subagent context separate
- LangGraph: Separate graph state per subagent
- **Our status:** We do this well with `sessions_spawn`. Mostly implemented.

### 3. Adversarial Verification (Universal)
- Superpowers: "Implementer finished suspiciously quickly" framing
- Deep Agents: Two-stage review before completion
- VMAO: LLM verifier step in every DAG
- **Our gap:** We have verification-before-completion in SOUL.md but no adversarial framing. Agents tend to rubber-stamp their own work.

### 4. Discipline Over Capability (Universal)
- Superpowers: "Process over power" — skills add discipline, not new capabilities
- Awesome Copilot: Instructions = always-on constraints, not features
- System A/B/M: The bottleneck is externalised learning recipe, not model power
- **Our gap:** We keep adding new skills. We should be hardening existing discipline.

### 5. Anti-Rationalization (Universal)
- Superpowers: Explicit tables of excuses and why they're wrong
- VMAO: Verification mandate — previous runs don't count
- LangGraph HIL: Graph interrupts force explicit human approval
- **Our partial:** SOUL.md anti-patterns list covers some. Skill-check anti-rationalization added 2026-03-18.

---

## What We Have (System Audit)

| Capability | Status | Quality |
|---|---|---|
| Multi-agent routing | ✅ Done | Strong |
| Specialist agents (Research/Code/Ops/Security) | ✅ Done | Strong |
| Vault as knowledge base | ✅ Done | Strong |
| Subagent spawning | ✅ Done | Good |
| Daily memory notes | ✅ Done | Good |
| Self-evolution signals | ✅ Done | Partial |
| Discord as UI | ✅ Done | Strong |
| Dispatch system (file-based) | ✅ Done | Good |
| Context isolation | ✅ Done | Good |
| Planning before acting | ⚠️ Partial | Weak (ad-hoc) |
| Adversarial review | ⚠️ Partial | Not implemented |
| Hooks/lifecycle events | ❌ Missing | Not implemented |
| Governance audit | ❌ Missing | Not implemented |
| Structured TODO tracking | ❌ Missing | Not implemented |
| Virtual filesystem / scratch | ⚠️ Partial | Manual |
| Materiality test | ❌ Missing | Added 2026-03-18 |
| Skill-check anti-rationalization | ❌ Missing | Added 2026-03-18 |
| System M meta-controller | ❌ Missing | Orchestrator is crude version |

---

## Implementation Completed 2026-03-18

### ✅ Materiality Test → main SOUL.md
> "Would removing this change a decision or action?" If no — cut it.

Applied to: all output, vault writes, status updates, research summaries.

### ✅ Skill-Check Anti-Rationalization → main SOUL.md
Table of excuses and why they're wrong. Runs before every response.

### ✅ CSO (Agent Search Optimization) → main SOUL.md
Skill descriptions: trigger-only format. Never include process summaries.

### ✅ Structured Planning Protocol → main SOUL.md
`scratch/TODO-[task].md` for complex tasks. Step tracking, visible progress.

### ✅ Governance Audit Checklist → security SOUL.md
8-point checklist for agent/skill/workflow reviews.
Threat pattern scanning for sensitive agent messages.

### ✅ Scout Improvements → browser-automation SOUL.md
Materiality test, browser-vs-fetch reference list, structured scrape planning.

### ✅ Scratch Directory Infrastructure
Created `scratch/` dirs in main, coder, researcher workspaces.
Created `vault/Operations/governance-audit/` for audit logs.

### ✅ Vault Notes Written
- `Research/Awesome-Copilot-Deep-Dive.md`
- `Research/LangChain-Deep-Agents.md`
- `Research/Autonomous-Learning-System-ABC.md`
- This synthesis note

---

## Next Implementation Targets (Priority Order)

### 🔴 P1: Two-Stage Review for Coder
**From:** Superpowers adversarial review pattern
**What:** Every Coder task gets two passes:
1. Spec compliance (did they build what was asked?)
2. Code quality (did they build it well?)
**Where:** Coder SOUL.md + dispatch protocol
**Effort:** ~1 hour

### 🔴 P1: `write_todos` Planning Step
**From:** LangChain Deep Agents
**What:** Complex tasks start with explicit `scratch/TODO-*.md` before execution
**Where:** Orchestrator AGENTS.md + dispatch protocol
**Effort:** 30 minutes — mostly a protocol addition

### 🟡 P2: Structured Sub-Agent Input Schema
**From:** HLBPA agent design
**What:** When spawning agents, use a structured header format:
```
TASK: {name}
CONTEXT: {vault refs, background}
EXPECTED OUTPUT: {format, what you need back}
STATUS PROTOCOL: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
```
**Where:** main AGENTS.md spawning section
**Effort:** 30 minutes

### 🟡 P2: Session Logger Hook
**From:** awesome-copilot hooks/session-logger
**What:** Append-only JSONL log of session events to `vault/Operations/session-logs/`
**Where:** New script + cron
**Effort:** ~2 hours

### 🟡 P2: ADR Generator Integration
**From:** awesome-copilot agents/adr-generator
**What:** When Trajan makes architecture decisions, auto-generate ADR in vault
**Where:** vault-keeper SOUL.md trigger pattern
**Effort:** 1 hour

### 🟢 P3: Modular SOUL.md Split
**From:** awesome-copilot instructions pattern
**What:** Split monolithic SOUL.md into concern-specific files:
- soul-core.md (identity, voice)
- soul-routing.md (delegation rules)
- soul-memory.md (vault/memory protocol)
- soul-evolution.md (self-improvement)
**Effort:** 2 hours refactoring

### 🟢 P3: System M Meta-Controller Design
**From:** arXiv 2603.15381 System A/B/M
**What:** Design the Orchestrator as a formal System M — internally generates signals about when to observe vs. act. Currently it's explicit/manual.
**Where:** universal-orchestrator SOUL.md
**Effort:** 1 hour design + 2 hours implementation

---

## Key Insight: What System M Looks Like Here

From arXiv 2603.15381 — System M is the meta-controller that switches between observation (System A) and action (System B) based on internally-generated signals.

**Our mapping:**
- System A = Researcher (observe, gather, synthesize)
- System B = Coder/Ops (act, build, deploy)
- System M = Orchestrator (decides when to observe vs. act)

**Current Orchestrator problem:** It's activated explicitly by Right Hand. It doesn't internally decide "we need more information before acting" — Trajan has to say "research this first."

**System M Orchestrator would:**
1. Receive task
2. Internally estimate uncertainty: "Do I have enough info to act?"
3. If high uncertainty → spawn Researcher first (System A mode)
4. If low uncertainty → spawn Coder directly (System B mode)
5. Monitor results → decide if more research needed before continuing

This is the next architecture evolution. Not a config change — a fundamental routing intelligence upgrade.

---

## The Hermes Nudge System (Should We Implement?)

From [[Hermes Agent Architecture Study]]: periodic "nudge" injections into user messages remind agents to save memories and create skills. The nudge fires every N interactions.

**Pros:** Ensures knowledge is captured even if agents "forget" to save
**Cons:** Adds noise, could trigger on bad timing

**Better alternative:** The self-check nudges already in main SOUL.md (every ~10/15/20 interactions). The difference is Hermes injects at the API level; we declare in the prompt.

**Verdict:** Our approach is cleaner. Don't implement Hermes-style nudges.

---

## Architecture Diagram (Current vs. Target)

### Current (March 2026)
```
Trajan
  → Right Hand (routing + direct handling)
      → dispatch.sh (file-based queue)
          → Specialist Agents (Researcher/Coder/Ops/Security/Scout/...)
              → Vault (knowledge base)
```

### Target (Q2 2026)
```
Trajan
  → Right Hand (routing + discipline enforcement)
      → Orchestrator/System M (uncertainty estimation, A/B switching)
          → System A: Researcher (observe, gather)
          → System B: Coder/Ops (act, deploy)
          → Verifier (adversarial review)
      → Vault (write_todos + scratch → consolidated findings)
      → Governance (pre-flight scan → audit log)
```

The key addition: **verifier** between action and completion, and **Orchestrator** that internally estimates when more observation is needed.
