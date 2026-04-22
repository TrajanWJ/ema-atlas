---
title: "DeerFlow 2.0 Evaluation"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: agent-research
tags: [agents, bytedance, deerflow, evaluation, multi-agent, orchestration]
summary: "DeerFlow (Deep Exploration and Efficient Research Flow) is ByteDance's open-source SuperAgent harness. v2.0 is a ground-up rewrite — shares no cod"
---
# DeerFlow 2.0 Evaluation

**Date:** 2026-03-16
**Source:** [bytedance/deer-flow](https://github.com/bytedance/deer-flow) (v2.0, Apache-2.0)
**Evaluator:** Researcher Agent

## Architecture Overview

DeerFlow (Deep Exploration and Efficient Research Flow) is ByteDance's open-source "SuperAgent harness." v2.0 is a ground-up rewrite — shares no code with v1. Built on **LangGraph + LangChain**, it ships as a complete runtime for multi-step agent workflows with sandboxed execution.

### What Makes It a "SuperAgent"

The term isn't marketing fluff — it refers to a specific architectural pattern:
1. **Lead Agent** decomposes tasks and spawns sub-agents
2. **Sub-Agents** run in parallel with scoped context, tools, and termination conditions
3. **Sandboxed Execution** — Each task gets an isolated Docker container with full filesystem
4. **Multi-hour tasks** — Designed for workflows that take minutes to hours, not just chat turns

### Core Components
- **Lead Agent** — Task decomposition, sub-agent orchestration, result synthesis
- **Sub-Agents** — Spawned dynamically with isolated context and tools
- **Sandbox** — Docker containers (or Kubernetes pods) with real filesystem (reads, writes, bash, code execution)
- **Skills System** — Markdown-based SKILL.md files, loaded progressively (only when needed)
- **Long-Term Memory** — Persistent across sessions
- **Context Engineering** — Token-aware context management
- **MCP Integration** — Extensible tool servers with OAuth support
- **IM Channels** — Telegram, Slack, Feishu/Lark (long-polling/websocket, no public IP needed)

### Execution Modes
| Mode | Behavior |
|------|----------|
| Flash | Fast single-pass response |
| Standard | Normal agent loop |
| Pro | Planning before execution |
| Ultra | Full sub-agent orchestration |

## Key Innovations

### 1. Sandbox-First Architecture
DeerFlow doesn't just "call tools" — it gives agents a real computer. Each task runs in an isolated Docker container with:
- `/mnt/user-data/uploads/` — User files
- `/mnt/user-data/workspace/` — Agent working directory
- `/mnt/skills/public/` — Built-in skills
- `/mnt/skills/custom/` — User skills
- Full bash, filesystem, code execution

This is the biggest differentiator. Most agent frameworks (including ours) execute tools in the host environment. DeerFlow isolates each task.

### 2. Progressive Skill Loading
Skills are loaded only when the task needs them, not all at once. This keeps the context window lean — critical for token-sensitive models. Our [[OpenClaw]] loads all skills into the system prompt at session start.

### 3. Claude Code Integration
The `claude-to-deerflow` skill lets Claude Code interact with a running DeerFlow instance. This is clever positioning — they're becoming infrastructure that other agents can use.

### 4. LangGraph Foundation
Built on LangGraph's state machine model. This gives them:
- Checkpointing and resumption
- Branching and parallel execution
- Human-in-the-loop patterns
- Built-in streaming

## Multi-Agent Coordination Model

### DeerFlow's Approach
```
User Task → Lead Agent → Decomposition
                           ├── Sub-Agent A (research) ──┐
                           ├── Sub-Agent B (code)    ──┤→ Lead Agent → Synthesis → Output
                           └── Sub-Agent C (analysis) ──┘
```
- Sub-agents spawned dynamically based on task complexity
- Each gets scoped context and tools
- Parallel execution when possible
- Lead agent synthesizes all results

### Our Approach (AGENTS.md)
```
User Message → Right Hand → Classification
                              ├── Researcher (sessions_spawn) ──┐
                              ├── Coder (sessions_spawn)     ──┤→ Right Hand → Synthesis → Discord
                              └── Ops (sessions_spawn)       ──┘
```
- Pre-defined specialist agents with fixed roles
- Right Hand routes based on heuristics and performance history
- Parallel, sequential, or adversarial dispatch modes
- Identity bar system for Discord presentation

### Comparison

| Aspect | [[DeerFlow 2.0]] | Our Orchestration |
|--------|-------------|-------------------|
| Agent spawning | Dynamic, task-scoped | Pre-defined roster |
| Context isolation | Docker containers | Separate Claude Code processes |
| Skill loading | Progressive (on-demand) | All skills at session start |
| Execution environment | Sandboxed filesystem | Host filesystem (VM) |
| State management | LangGraph checkpoints | File-based (TASKS.md, vault) |
| Channel support | Telegram, Slack, Feishu | Discord, Telegram |
| Planning | Explicit "Pro" mode | Implicit in Right Hand routing |
| Framework | LangGraph + LangChain | [[OpenClaw]] + Claude Code |
| Memory | Built-in long-term | LCM + vault + daily notes |

## Maturity Assessment

- **#1 on GitHub Trending** (Feb 28, 2026) — massive community interest
- Ground-up v2.0 rewrite — shows commitment but also means early-stage code
- ByteDance backing — serious engineering resources
- Docker + Kubernetes support — production-ready deployment model
- Active development (updated hours ago)
- Apache-2.0 license

## Concerns

- **LangChain dependency** — Heavy framework lock-in. LangChain abstractions add complexity and can be leaky
- **ByteDance** — Potential geopolitical/trust concerns for some users
- **Complexity** — Requires Node.js 22+, pnpm, uv, nginx, Docker. Our stack is simpler
- **No self-improvement** — Has memory but no autonomous learning loop. Skills are static once written
- **InfoQuest integration** — BytePlus commercial toolset being pushed into an "open-source" project

## Recommendation: **Borrow Patterns**

**Don't adopt** — Too heavy, too many dependencies (LangGraph, LangChain, nginx, pnpm, uv), and our [[OpenClaw]]-native stack is lighter and more customizable.

**Borrow these patterns:**
1. **Progressive skill loading** — This is our biggest gap. We load all skills at session start, burning context. We should implement on-demand skill injection: list skill names/descriptions in the system prompt, load full SKILL.md only when the agent selects one
2. **Execution modes** — Flash/Standard/Pro/Ultra is a clean UX pattern. We could map this to our dispatch: Direct (flash), Single-agent (standard), Multi-agent (pro), Full orchestration (ultra)
3. **Sandboxed execution** — We run on a dedicated VM which provides some isolation, but per-task Docker containers would be cleaner for untrusted code execution
4. **Claude Code as client** — Their `claude-to-deerflow` skill is interesting. We could expose an [[OpenClaw]] API that Claude Code sessions can call into

**Skip:** The LangGraph foundation, the InfoQuest integration, and the Kubernetes provisioner mode. These solve ByteDance-scale problems we don't have.

---
*Tags:* #evaluation #agents #bytedance #deerflow #multi-agent #orchestration
