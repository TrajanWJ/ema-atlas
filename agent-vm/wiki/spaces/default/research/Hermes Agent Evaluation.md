---
title: Hermes Agent Evaluation
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: agent-research
tags:
  - agents
  - evaluation
  - hermes
  - nous-research
  - self-improving
summary: >-
  [[Hermes Agent]] is a Python-based, self-improving AI agent by Nous Research.
  It runs as a persistent server process with a Reason → Act → Observe
wiki_id: research/Hermes_Agent_Evaluation
imported_from: vault/Research/Hermes Agent Evaluation.md
imported_at: '2026-04-04T00:23:57.043Z'
---
# Hermes Agent Evaluation

**Date:** 2026-03-16
**Source:** [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) (v0.2.0, MIT)
**Evaluator:** Researcher Agent

## Architecture Overview

[[Hermes Agent]] is a Python-based, self-improving AI agent by Nous Research. It runs as a persistent server process with a Reason → Act → Observe loop, multi-platform messaging gateway, and three-tier memory.

### Core Components
- **AIAgent** (`run_agent.py`, 6,211 lines) — Central orchestration loop with prompt assembly, LLM inference, tool dispatch, and context compression
- **Tool Registry** — Self-registering tools (48 built-in) with parallel execution (up to 8 workers)
- **Session Storage** — SQLite with WAL mode and FTS5 full-text search
- **Messaging Gateway** — 7 platforms (Telegram, Discord, Slack, WhatsApp, Signal, Email, Home Assistant)
- **Skills System** — 70+ bundled skills in agentskills.io format, loaded progressively
- **Prompt Builder** — Assembles identity (SOUL.md), context files, skills, memory guidance, platform hints

### Three-Tier Memory
| Tier | Storage | Scope |
|------|---------|-------|
| Inference memory | Context window | Current session |
| Procedural skills | `~/.hermes/skills/*/SKILL.md` | All sessions |
| Session history | SQLite FTS5 | All sessions |
| User model | Honcho API (optional) | Cross-device |

## Self-Improvement Mechanism

This is the headline feature. The learning loop works as follows:

1. **Autonomous Skill Creation** — After completing complex tasks, the agent creates new SKILL.md files capturing the procedure
2. **Skill Self-Improvement** — Skills are refined during subsequent use based on execution outcomes
3. **Periodic Memory Nudges** — The agent nudges itself to persist knowledge to long-term storage
4. **Session Search** — FTS5-indexed past conversations with LLM summarization for cross-session recall
5. **Honcho User Modeling** — Dialectic user modeling across sessions (optional integration)

### How It Compares to Our Self-Improvement

| Aspect | [[Hermes Agent]] | Our Stack |
|--------|-------------|-----------|
| Learning trigger | Automatic after complex tasks | Manual logging to `.learnings/` files |
| Skill creation | Agent creates SKILL.md autonomously | Manual skill creation |
| Feedback loop | Closed loop — skills improve during use | Open loop — learnings logged but not auto-applied |
| Memory search | FTS5 + LLM summarization | LCM compaction + grep |
| User modeling | Honcho (cross-device, dialectic) | `vault/Trajan/Preferences.md` (file-based) |
| Evolution pipeline | Built into agent core | Separate `evolution-loop` + `context-evolution` scripts |

**Key difference:** Hermes bakes the learning loop into the agent core. Our approach separates learning ([[self-improving-agent]] skill) from evolution ([[evolution-loop]] skill + [[context-evolution]] scripts). Hermes is more integrated; ours is more modular.

## Key Innovations

1. **Closed Learning Loop** — The only major agent framework where skill creation and improvement happen autonomously within the agent loop, not as a separate pipeline
2. **agentskills.io Compatibility** — Skills follow an open standard, making them portable
3. **RL Pipeline Integration** — Batch trajectory generation + Atropos RL environments for training tool-calling models. This is unique — most agent frameworks don't bridge to model training
4. **[[OpenClaw]] Migration Path** — `hermes claw migrate` imports SOUL.md, memories, skills, API keys directly from [[OpenClaw]]. They clearly see [[OpenClaw]] as a migration source
5. **6 Terminal Backends** — Local, Docker, SSH, Daytona, Singularity, Modal (serverless persistence)

## Maturity Assessment

- **v0.2.0** — Early but functional
- 216 PRs merged from 63 contributors
- 3,289 tests
- Comprehensive docs (74 files)
- Active development (updated hours ago)
- MIT license
- Backed by Nous Research (credible AI research lab)

**Verdict:** Surprisingly mature for v0.2.0. The contributor count and test coverage suggest real engineering investment, not a weekend project.

## Concerns

- **Monolithic core** — `run_agent.py` at 6,211 lines is a code smell. Our modular skill-based approach is cleaner
- **Python-only** — No Rust/compiled components for performance
- **Competitive positioning** — They explicitly target [[OpenClaw]] users with migration tooling. This is a direct competitor
- **Honcho dependency** — Cross-session memory requires external service

## Comparison With Our Stack

| Feature | Hermes | [[OpenClaw]] + Our Skills |
|---------|--------|----------------------|
| Self-improvement | Built-in, autonomous | Modular (3 separate skills) |
| Memory | SQLite FTS5 + Honcho | LCM (lossless compaction) + vault |
| Skills format | agentskills.io standard | [[OpenClaw]] SKILL.md |
| Gateway | Python, 7 platforms | Node.js, extensible plugins |
| Orchestration | Subagent delegation (Python RPC) | sessions_spawn + AGENTS.md routing |
| RL training | Built-in (Atropos) | Not present |
| Evolution | Implicit (self-improving) | Explicit ([[evolution-loop]] + cron) |

## Recommendation: **Borrow Patterns**

**Don't adopt** — We're too invested in [[OpenClaw]], and migrating would lose our customized orchestration model, vault integration, and Discord identity system.

**Borrow these patterns:**
1. **Autonomous skill creation** — Our [[self-improving-agent]] logs learnings but doesn't auto-create skills. We should add a "skill crystallization" step to the evolution loop that converts repeated `.learnings/` patterns into SKILL.md files
2. **FTS5 session search** — Their session search with LLM summarization is elegant. Our LCM does compaction but lacks the "search past sessions and summarize" UX. Worth adding as a skill
3. **Skill self-improvement during use** — Instead of waiting for [[evolution-loop]] cron runs, skills should capture performance feedback at execution time and self-patch

**Watch closely:** Nous Research is a serious lab. Their RL pipeline integration (trajectories → model training) is a genuinely novel direction that could make their agent get fundamentally better over time, not just prompt-level better.

---
*Tags:* #evaluation #agents #self-improving #nous-research #hermes
