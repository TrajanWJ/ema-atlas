---
title: "DeerFlow Architecture Study"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.50
confidence_updated: 2026-03-18
source: external-research
tags: [mcp, openclaw, prompts, research, security, skills]
summary: "[[DeerFlow 2.0]] is ByteDance's open-source super agent harness — a ground-up rewrite that moved from a Deep Research framework to a general-purpo"
---
# DeerFlow Architecture Study

> **Source:** [bytedance/deer-flow](https://github.com/bytedance/deer-flow) (v2.0)
> **Date:** 2026-03-16
> **Purpose:** Extract actionable orchestration patterns for our [[OpenClaw]] agent system

## Overview

[[DeerFlow 2.0]] is ByteDance's open-source "super agent harness" — a ground-up rewrite that moved from a Deep Research framework to a general-purpose agent runtime. Built on LangGraph + LangChain, it ships with sandboxed execution, persistent memory, skill loading, and sub-agent delegation. It hit #1 on GitHub Trending (Feb 28, 2026).

**Architecture stack:**
- LangGraph Server (port 2024) — agent runtime
- Gateway API (port 8001) — REST API for models, MCP, skills, memory
- Next.js Frontend (port 3000)
- Nginx (port 2026) — unified reverse proxy
- Optional Provisioner (Kubernetes sandbox mode)

## Pattern 1: Ordered Middleware Chain (Most Actionable)

DeerFlow's lead agent runs through **11 middlewares in strict order**, each handling one concern. This is the cleanest pattern for composing agent behavior:

| # | Middleware | Purpose |
|---|-----------|---------|
| 1 | ThreadDataMiddleware | Creates per-thread directories |
| 2 | UploadsMiddleware | Tracks/injects uploaded files |
| 3 | SandboxMiddleware | Acquires sandbox, stores ID in state |
| 4 | DanglingToolCallMiddleware | Handles interrupted tool calls |
| 5 | SummarizationMiddleware | Context reduction near token limits |
| 6 | TodoListMiddleware | Task tracking (plan mode only) |
| 7 | TitleMiddleware | Auto-generates thread title |
| 8 | MemoryMiddleware | Queues conversations for async memory update |
| 9 | ViewImageMiddleware | Injects base64 images before LLM call |
| 10 | SubagentLimitMiddleware | Truncates excess subagent calls |
| 11 | ClarificationMiddleware | Intercepts clarification requests (must be last) |

**Relevance to us:** Our [[OpenClaw]] system has similar concerns scattered across AGENTS.md instructions. A formal middleware chain would make behavior more predictable and debuggable. Key candidates: context summarization, memory persistence, file injection, subagent rate limiting.

## Pattern 2: Subagent Execution Engine with Concurrency Control

DeerFlow's subagent system (`subagents/executor.py`) uses:
- **Two thread pools**: scheduler pool (3 workers) + execution pool (3 workers)
- **Global background task registry** with thread-safe locks
- **Structured status tracking**: PENDING → RUNNING → COMPLETED/FAILED/TIMED_OUT
- **Configurable timeouts per subagent type** (overridable via config.yaml)
- **Tool allow/deny lists per subagent** — each subagent gets a filtered tool set

The lead agent's system prompt enforces **hard concurrency limits** with explicit multi-batch planning:
- Count subtasks in thinking
- If count > N: batch into groups of N, execute sequentially
- Each batch runs in parallel
- Final turn synthesizes all results

**Built-in subagent types:**
- `general-purpose` — web research, code exploration, analysis
- `bash` — command execution (git, build, test)

**Relevance to us:** Our `sessions_spawn` approach is similar but less structured. We could adopt:
1. Explicit concurrency limits in system prompts (we don't enforce this)
2. Timeout overrides per agent type (we learned this empirically — Vault Keeper needs 8min+)
3. Tool filtering per subagent (we give all specialists full access)

## Pattern 3: Progressive Skill Loading

Skills are structured Markdown files loaded **only when needed**, not all at once:

```
/mnt/skills/public/
├── research/SKILL.md
├── report-generation/SKILL.md
├── slide-creation/SKILL.md
└── ...
/mnt/skills/custom/
└── your-custom-skill/SKILL.md
```

The loader (`skills/loader.py`) walks both `public/` and `custom/` directories, parses SKILL.md files for metadata, and respects an enabled/disabled state from `extensions_config.json`. Skills include `.skill` archives with optional frontmatter (`version`, `author`, `compatibility`).

**Relevance to us:** Our available_skills list in the system prompt loads ALL skill descriptions upfront. DeerFlow's approach of progressive loading would reduce context overhead — only inject the SKILL.md content when the task actually needs it.

## Pattern 4: Memory Architecture (Structured JSON + Async Queue)

DeerFlow's memory system (`agents/memory/`) has three components:

1. **Memory data structure** — structured JSON with sections:
   - `user.workContext`, `user.personalContext`, `user.topOfMind`
   - `history.recentMonths`, `history.earlierContext`, `history.longTermBackground`
   - `facts[]` — extracted facts array

2. **Memory queue** — async queue that buffers conversation turns for batch processing. The MemoryMiddleware filters to keep only user inputs + final AI responses (strips tool calls, upload blocks).

3. **Memory updater** — uses an LLM call with `MEMORY_UPDATE_PROMPT` to extract and update memory. File-cached with mtime-based invalidation.

**Relevance to us:** Our memory is unstructured daily notes + MEMORY.md. DeerFlow's tiered structure (work/personal/topOfMind + time-bucketed history + facts) is more queryable. The async queue pattern prevents memory writes from blocking the main conversation loop.

## Pattern 5: Harness/App Boundary (Publishable Framework Split)

DeerFlow enforces a strict dependency boundary:
- **Harness** (`deerflow.*`) — publishable agent framework (agents, tools, sandbox, models, config)
- **App** (`app.*`) — unpublished application layer (Gateway API, IM channels)

**Rule: App imports Harness, Harness NEVER imports App.** Enforced by `test_harness_boundary.py` in CI.

**Relevance to us:** Our [[OpenClaw]] skills and workspace files are entangled. If we ever want to extract reusable patterns (e.g., our dispatch protocol, memory system), this boundary pattern would help.

## Key Differences from Our System

| Aspect | DeerFlow | [[OpenClaw]] (Our Setup) |
|--------|----------|---------------------|
| Orchestration | LangGraph state machine | Ad-hoc Claude Code processes |
| Subagents | Thread pools with status tracking | `sessions_spawn` fire-and-forget |
| Memory | Structured JSON + async queue | Markdown files + manual updates |
| Skills | Progressive loading, parsed frontmatter | All descriptions in system prompt |
| Context management | SummarizationMiddleware | LCM (external system) |
| Sandbox | Docker containers per task | Full VM access, no isolation |

## Actionable Takeaways

1. **Adopt middleware-chain thinking** — formalize our agent's pre/post processing steps instead of embedding everything in AGENTS.md prose
2. **Add concurrency limits to subagent dispatch** — explicit counting + batching in system prompts
3. **Structure memory as queryable JSON** — tiered sections instead of flat markdown
4. **Progressive skill loading** — only inject full SKILL.md when task matches, not all descriptions in system prompt
5. **Tool filtering per specialist** — Vault Keeper doesn't need browser tools, Security doesn't need vault tools

## Links

- [[Context-Gateway Evaluation]] — alternative context management approach
- [[Claude Code Internals Study]] — Claude Code's own patterns
