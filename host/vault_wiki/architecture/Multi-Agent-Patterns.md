---
title: "Multi-Agent Patterns"
type: reference
created: 2026-04-06
tags: [architecture, agents, orchestration, patterns]
summary: "Agent orchestration patterns discovered through operational experience"
---

# Multi-Agent Patterns

## Core Orchestration Modes

### Sequential Handoff (A -> B -> C)

Agents execute in sequence. Each agent completes its work and hands off to the next with a structured envelope. Simplest pattern. Use when tasks have strict ordering dependencies.

### Parallel Dispatch

Independent tasks dispatched to multiple agents simultaneously. No inter-agent communication during execution. Results collected and merged by the orchestrator. Use when tasks share no state.

### Open-Ended Collaboration (Forum-Style Async)

Agents post to a shared channel asynchronously. No fixed execution order. Each agent reads the channel and contributes when it has something relevant. Use for exploratory or creative tasks where the interaction pattern is unpredictable.

### Swarm Mode

Multiple agents work on the same problem space simultaneously with minimal coordination. Overlap is accepted and resolved after the fact. Use when speed matters more than efficiency.

## Delegation Protocols

### Sub-Agent Delegation Status Codes

Every sub-agent terminates with one of four status codes:

- **DONE** -- Task completed successfully, results available
- **DONE_WITH_CONCERNS** -- Task completed but with caveats that need attention
- **BLOCKED** -- Cannot proceed, requires input or resolution
- **NEEDS_CONTEXT** -- Insufficient information to begin or continue

### Handoff Envelope

Structured output from every agent delegation:

```
agent: <agent identity>
completed: <what was accomplished>
confidence: <low/medium/high>
gaps: <what remains unknown or unfinished>
```

### Delegation Monitoring

Time-based escalation for delegated tasks:

- **3 minutes** -- Status check. Agent should report progress.
- **5 minutes** -- Active check. Verify agent is not stuck.
- **10 minutes** -- Kill threshold. Terminate and reassign or escalate.

## Advanced Patterns

### Consensus Loop

**Pattern:** Claude implements. GPT and Codex review independently. Disagreements trigger re-examination.

**Value:** Cross-model review catches blind spots that same-model self-review misses. Each model has different failure modes.

### Karpathy Autoresearch

**Pattern:** 3-stage pipeline from cheap to expensive:

1. **Stage 1 (Cheap):** Broad search, keyword extraction, source identification using fast/cheap models
2. **Stage 2 (Medium):** Focused retrieval, source reading, fact extraction
3. **Stage 3 (Expensive):** Synthesis, analysis, judgment using frontier models

**Value:** Most research tokens are spent on retrieval and reading, not thinking. Use cheap models for the mechanical work.

### Strawpot

**Pattern:** Roles-as-Markdown with recursive delegation and 3-tier memory.

- Roles defined as markdown files specifying agent personality, capabilities, and constraints
- Agents can recursively delegate to sub-agents with the same protocol
- Three memory tiers: working (context window), session (files), persistent (vault)

### Bayesian Agent Routing (TrueSkill-Style)

**Status:** Analyzed and decided NOT to implement.

**Concept:** Route tasks to agents using Bayesian skill ratings (similar to TrueSkill). Each agent's rating updates based on task outcomes. Better-rated agents get harder tasks.

**Rejection rationale:** Overhead of maintaining ratings exceeds benefit at current scale. The routing problem is better solved by explicit role assignment than statistical inference.

### Dispatch Nag Injection

**Pattern:** After N conversation turns without a dispatch update, inject a reminder into the agent's context prompting it to report status.

**Purpose:** Prevents agents from going silent during long tasks. The "nag" is a lightweight coordination mechanism.

### Pike's 5 Rules Applied to Agents

Rob Pike's rules of programming, adapted for agent systems:

1. You can't tell where an agent will spend its tokens. Bottlenecks occur in surprising places. Don't optimize agent routing until you measure.
2. Measure. Don't tune for speed until you've measured, and even then don't tune unless one part dominates.
3. Fancy agent orchestration is slow when N (number of agents) is small, which it usually is.
4. Simple agent patterns work. Don't use swarm mode when sequential handoff suffices.
5. Data (vault state) dominates. If you've chosen the right data structures, the agent orchestration almost doesn't matter.

### Scientific Method for Agents (SciTeX Evidence Chains)

**Pattern:** Agents conduct investigation using formal evidence chains:

1. **Hypothesis** -- State what you expect to find
2. **Experiment** -- Define the test (command, query, code change)
3. **Observation** -- Record actual results
4. **Conclusion** -- Accept/reject hypothesis based on evidence

**Value:** Prevents agents from confirmation bias and narrative-driven debugging. Forces evidence-based reasoning with auditable chains.
