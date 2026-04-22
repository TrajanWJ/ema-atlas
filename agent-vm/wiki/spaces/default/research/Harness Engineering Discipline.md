---
title: Harness Engineering — The Emerging Discipline
created: '2026-04-01'
updated: '2026-04-01'
type: research
status: active
confidence: 0.9
tags:
  - harness-engineering
  - claude-code
  - meta-harness
  - agent-orchestration
  - scaffolding
summary: >-
  Harness engineering is emerging as its own discipline — the scaffolding around
  an LLM produces a 6x performance gap on the same benchmark. This note tracks
  the key papers, patterns, and players.
wiki_id: research/Harness_Engineering_Discipline
imported_from: vault/Research/Harness Engineering Discipline.md
imported_at: '2026-04-04T00:23:57.042Z'
---

# Harness Engineering — The Emerging Discipline

## The Core Insight

From the **Meta-Harness paper** (Lee et al., 2026, arXiv:2603.28052): the scaffolding (harness) around an LLM — not the model itself — produces a **6x performance gap** on the same benchmark. Same model, different harness = dramatically different results.

This means: **optimizing what wraps your AI is more impactful than optimizing the AI itself.**

## Key Concepts

### What Is a Harness?
Everything between the user's intent and the model's raw output:
- **Routing** — how tasks get classified and dispatched
- **Context management** — what gets injected, compacted, recovered
- **Tool orchestration** — which tools are available, how they're called, how results flow back
- **Safety & governance** — what gets gated, audited, circuit-broken
- **Persistence** — campaigns, sessions, memory across restarts
- **Evaluation** — quality gates, verification lenses, generator-evaluator loops

### Harness vs Framework vs Wrapper
| Layer | What It Is | Example |
|---|---|---|
| **Model** | Raw LLM inference | Claude Opus 4 |
| **Agent** | Model + tools + agent loop | Claude Code |
| **Harness** | Agent + routing + persistence + safety + evaluation | Citadel, EMA Bridge |
| **Meta-Harness** | Harness that evolves other harnesses | Harness Evolver |
| **Framework** | Build-your-own primitives | LangChain, CrewAI |
| **Wrapper** | Thin shell around CLI | CCFlow |

### The Two Integration Paths
1. **Plugin path** — Code runs *inside* Claude Code (hooks, skills, `.planning/` state). Citadel does this.
2. **Process path** — Code manages Claude Code as a subprocess from *outside*. EMA Bridge does this.
3. **Hybrid** — Both. Plugin for skills/hooks that need Claude's context. Process management for supervision/UI/persistence.

## Foundational Papers

### Meta-Harness (Lee et al., 2026)
- **Paper:** arXiv:2603.28052
- **Key finding:** 6x performance gap from scaffolding alone
- **Method:** End-to-end optimization of model harnesses using counterfactual diagnosis
- **Implication:** Prompt engineering < harness engineering

### Darwin Gödel Machine (Sakana AI)
- Self-improving AI that modifies its own architecture
- Relevant to harness evolution — the harness can improve itself

### AlphaEvolve (DeepMind)
- Evolutionary approach to code generation
- Relevant to the "evolving proposers" pattern in Harness Evolver

## Key Architecture Patterns

### 1. Tiered Routing (Citadel)
```
Tier 1: Regex pattern match      → 0 tokens, instant
Tier 2: Session state check      → 0 tokens, instant  
Tier 3: Keyword lookup           → 0 tokens, instant
Tier 4: LLM classification       → ~500 tokens, structured
```
**Principle:** Route to the cheapest execution path that can handle it.

### 2. Generator-Evaluator Loop (RalphCTL, Harness Evolver)
```
Generate → Evaluate → Pass? → Done
                   → Fail? → Feedback → Regenerate → Evaluate → ...
                   → Budget exhausted? → Best-effort output
```
**Principle:** Don't accept first output. Iterate until quality gate passes.

### 3. Circuit Breaker (Citadel)
```
Failure count < 3  → Continue normally
Failure count >= 3 → Suggest different approach
Trips >= 5         → Hard stop, escalate to human
Reset              → After successful operation
```
**Principle:** Fail fast, don't burn tokens on spiral failures.

### 4. Campaign Persistence (Citadel)
```
Session 1: Start campaign → write state to .planning/campaigns/
Session 2: /do continue → read state → resume exactly where left off
```
**Principle:** Work survives sessions. Context dies, state doesn't.

### 5. Parallel Agent Coordination (Citadel Fleet, Harness Evolver)
```
Wave 1: Spawn N agents in isolated worktrees
         Each writes discovery brief
         Discovery relay shares findings between agents
Wave 2: Build on Wave 1 discoveries
Merge:   Combine worktree results
```
**Principle:** Isolate for safety, share for intelligence.

### 6. Quality Gate Verification Lenses (Citadel)
```
Hot path (post-edit, every file change):
  - Syntax check
  - Import validation

Cold path (session end, changed files only):
  - Performance lens (transition-all, magic intervals)
  - Accessibility lens (missing aria-labels)
  - Adversarial lens (XSS vectors, unsafe patterns)
  - Contractual lens (skill files match structure)
  - Cross-reference lens (docs match code)
  - Custom regex rules
```
**Principle:** Two-pass verification — cheap checks inline, expensive checks at boundaries.

### 7. Defer-and-Resume (Claude Code v2.1.89)
```
Claude encounters dangerous operation
  → PreToolUse hook returns "defer"
  → Session pauses, writes state
  → External app shows approval UI
  → User approves/denies
  → -p --resume re-evaluates hook
```
**Principle:** Asynchronous human-in-the-loop without blocking the model.

### 8. Meta-Evolution (Harness Evolver)
```
Run agent on tasks → Collect traces → Analyze failures
  → Spawn 5 proposers (exploit, explore, crossover, 2 failure-targeted)
  → Each modifies actual harness code in isolated worktree
  → Evaluate all candidates → Select winner
  → Merge winner → Repeat
  → Auto-trigger Critic if scores jump too fast (gaming detection)
  → Auto-trigger Architect if stagnation (topology change)
```
**Principle:** The harness should improve itself based on its own performance data.

## The Player Landscape (April 2026)

| Project | Stars | Approach | Key Innovation |
|---|---|---|---|
| [[Citadel]] | 432 | Plugin (inside Claude) | 4-tier routing, fleet mode, campaign persistence |
| [[oh-my-agent]] | 531 | .agents/ directory | 14 role-based agents, /ultrawork quality workflow |
| [[Harness Evolver]] | 4 | Meta-evolution | Counterfactual diagnosis, 5 parallel proposers |
| [[RalphCTL]] | 0 | Sprint-based CLI | Generator-evaluator loop, multi-repo orchestration |
| [[c9r Orchestrator]] | 14 | K8s-style control plane | RBAC, sandbox, DAG execution, mTLS |
| [[CCFlow]] | 1 | Python wrapper | ClaudeOrchestrator, Telegram bot, session resume |
| [[Claude Code Server]] | 15 | HTTP API wrapper | REST, SSE streaming, load balancing |

## Cross-References
- [[Claude Code Harness Ecosystem Analysis]] — detailed project analysis
- [[EMA Claude Bridge Design]] — how EMA implements these patterns
- [[Self-Critique and Auto-Evolution Design]] — our own evolution framework
