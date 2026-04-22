---
title: Deer-Flow Research
type: research
created: '2026-03-24'
confidence: 0.88
tags:
  - deer-flow
  - bytedance
  - multi-agent
  - orchestration
  - research
  - langgraph
  - superagent
summary: >-
  ByteDance's DeerFlow 2.0 is an open-source SuperAgent harness
  (LangGraph+LangChain) with sandbox execution, progressive skills, and
  sub-agent orchestration.
wiki_id: research/Tools/Deer-Flow
imported_from: vault/Research/Tools/Deer-Flow.md
imported_at: '2026-04-04T00:23:57.128Z'
---

# DeerFlow: Research Report

*Sources: 7 total (5 primary/T1, 1 institutional/T2, 1 secondary/T3)*  
*Confidence: High (0.88) | Date: 2026-03-24*  
*Repository: [bytedance/deer-flow](https://github.com/bytedance/deer-flow) | License: MIT (not Apache-2.0 as previously noted) | Trending: #1 GitHub Feb 28, 2026*

> **Previous vault research:** See [[DeerFlow Architecture Study]] (2026-03-16) and [[DeerFlow 2.0 Evaluation]] (2026-03-16). This report consolidates, updates, and expands those with fresh data (March 24 fetch) plus full implementation extraction.

## Summary

DeerFlow 2.0 is ByteDance's ground-up rewrite of their original Deep Research framework into a full "SuperAgent harness" — a complete runtime for multi-step agentic workflows. Built on LangGraph + LangChain, it provides sandbox execution (Docker/Kubernetes), progressive skill loading, long-term memory, sub-agent orchestration, multi-channel IM support, and MCP integration. It hit #1 GitHub Trending on Feb 28, 2026. The architecture is genuinely well-engineered; the main weaknesses are LangChain lock-in and ByteDance's commercial InfoQuest integration being pushed into an ostensibly open-source project. **For our [[OpenClaw]] setup: don't adopt the stack, steal the patterns.** Three patterns are immediately worth implementing: progressive skill loading, ordered middleware chains, and structured memory tiers.

---

## 1. Architecture Overview

### What It Is

DeerFlow (Deep Exploration and Efficient Research Flow) is a **"SuperAgent harness"** — not just an agent framework but a complete runtime environment. The framing matters: it gives agents a real computer (filesystem, bash, code execution), not just tool call abstractions.

### Stack

```
LangGraph Server (port 2024)   — agent state machine runtime
Gateway API (port 8001)        — REST API: models, MCP, skills, memory
Next.js Frontend (port 3000)   — chat UI
Nginx (port 2026)              — unified reverse proxy
Optional Provisioner           — Kubernetes sandbox mode
```

### Agent Roles

**Lead Agent** — Receives user input, decomposes into tasks, spawns sub-agents, synthesizes results. Runs through an **ordered middleware chain of 11 stages** before each LLM call.

**Sub-Agents** — Spawned dynamically. Two built-in types:
- `general-purpose` — web research, code exploration, analysis
- `bash` — command execution (git, build, test, automation)

Sub-agents get: scoped context, filtered tool sets, configurable timeouts, and status tracking (PENDING → RUNNING → COMPLETED/FAILED/TIMED_OUT).

### Execution Flow

```
User Input
    → Lead Agent (middleware chain × 11)
    → Task Decomposition
    → Sub-Agent Dispatch (parallel pools)
        ├── Sub-Agent A: research tools
        ├── Sub-Agent B: bash execution
        └── Sub-Agent C: analysis
    → Synthesis
    → Response
```

### Execution Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| Flash | Fast single-pass, no planning | Quick factual queries |
| Standard | Normal agent loop | General tasks |
| Pro | Explicit planning before execution | Multi-step workflows |
| Ultra | Full sub-agent orchestration | Complex, hours-long tasks |

This clean mode taxonomy is worth stealing. See [[Deer-Flow-Implementation-Patterns]].

### Middleware Chain (Lead Agent)

The lead agent runs through 11 middlewares in strict order before each LLM invocation:

| # | Middleware | Purpose |
|---|-----------|---------|
| 1 | ThreadDataMiddleware | Creates per-thread directories |
| 2 | UploadsMiddleware | Tracks and injects uploaded files |
| 3 | SandboxMiddleware | Acquires sandbox, stores ID in state |
| 4 | DanglingToolCallMiddleware | Handles interrupted tool calls from prior turns |
| 5 | SummarizationMiddleware | Context reduction when near token limits |
| 6 | TodoListMiddleware | Task tracking (plan mode only) |
| 7 | TitleMiddleware | Auto-generates thread title |
| 8 | MemoryMiddleware | Queues conversations for async memory update |
| 9 | ViewImageMiddleware | Injects base64 images before LLM call |
| 10 | SubagentLimitMiddleware | Truncates excess subagent calls (rate limiting) |
| 11 | ClarificationMiddleware | Intercepts clarification requests — **must be last** |

The ordering is intentional and load-bearing. ClarificationMiddleware must be last because it can short-circuit the chain. SummarizationMiddleware must run before MemoryMiddleware so it doesn't queue truncated context.

### Sandbox Architecture

Each task runs in an isolated environment (configurable: local/Docker/Kubernetes):

```
/mnt/user-data/uploads/     — User-uploaded files
/mnt/user-data/workspace/   — Agent working directory
/mnt/skills/public/         — Built-in skills
/mnt/skills/custom/         — User skills
```

The All-in-One Sandbox (https://github.com/agent-infra/sandbox) combines Browser, Shell, File, MCP, and VSCode Server in a single Docker container. This is the recommended production setup.

---

## 2. Key Innovations

### Genuinely Novel

**1. Progressive Skill Loading**  
Skills are SKILL.md files loaded *only when the task needs them*. The context window stays lean. Our [[OpenClaw]] loads all skill descriptions at session start — this is our biggest contextual overhead compared to DeerFlow. The mechanism: agent sees a list of skill names/summaries in system context; when it selects one, the full SKILL.md is injected. Clean and efficient.

**2. Ordered Middleware Chain as First-Class Architecture**  
Most agent frameworks tuck cross-cutting concerns into the LLM prompt or scattered utility functions. DeerFlow formalizes these as ordered middlewares with explicit sequencing guarantees. This makes agent behavior predictable, testable, and composable. The concept is novel in agent frameworks even if the pattern is ancient in web servers.

**3. Harness/App Boundary Enforcement**  
`deerflow.*` (harness) never imports `app.*` (application layer). Enforced by CI test (`test_harness_boundary.py`). This is unusually disciplined for an AI project and enables the harness to be independently publishable/reusable.

**4. Sub-Agent Status Lifecycle**  
Structured PENDING → RUNNING → COMPLETED/FAILED/TIMED_OUT tracking with thread pools (scheduler pool: 3 workers, execution pool: 3 workers) and per-type timeout overrides. Most multi-agent systems use fire-and-forget.

### Repackaged Patterns (Not Novel)

- **Plan-and-execute** — well-established (Langchain agents, AutoGPT). DeerFlow's "Pro mode" is the same idea.
- **LangGraph state machine** — using the framework's native primitives, not inventing new ones
- **MCP integration** — MCP is becoming a standard; DeerFlow is an adopter, not an inventor
- **Long-term memory** — tiered memory exists in many systems (Mem0, MemGPT). DeerFlow's implementation is good but not unique.

---

## 3. Multi-Agent Coordination

### Concurrency Model

Two thread pools:
- **Scheduler pool** (3 workers): decides which sub-agents to spawn, in what order
- **Execution pool** (3 workers): executes sub-agents

The lead agent's system prompt enforces hard concurrency limits with explicit multi-batch planning:
1. Count subtasks in thinking
2. If count > N: batch into groups of N, execute sequentially
3. Each batch runs in parallel internally
4. Final turn synthesizes all results

This "count-then-batch" planning pattern is encoded in the system prompt, not the framework code — making it portable.

### Tool Filtering Per Sub-Agent

Each sub-agent gets a filtered tool set defined in config. `general-purpose` gets web + file tools; `bash` gets execution tools. This prevents tool confusion and reduces attack surface. Our specialists get full tool access by default — a gap worth addressing.

### Communication Pattern

Sub-agents communicate results back to the lead agent via structured return values through LangGraph's state system. No direct inter-agent communication — everything flows through the lead. This hub-and-spoke model prevents coordination complexity at the cost of some flexibility.

---

## 4. Memory Architecture

### Three-Component Model

**1. Memory Data Structure** — Structured JSON with semantic sections:
```json
{
  "user": {
    "workContext": "...",
    "personalContext": "...",
    "topOfMind": "..."
  },
  "history": {
    "recentMonths": "...",
    "earlierContext": "...",
    "longTermBackground": "..."
  },
  "facts": ["fact1", "fact2", "..."]
}
```

**2. Memory Queue** — Async queue buffering conversation turns for batch processing. MemoryMiddleware filters: keeps user inputs + final AI responses, strips tool calls and upload blocks. Prevents memory writes from blocking the main conversation loop.

**3. Memory Updater** — LLM call with `MEMORY_UPDATE_PROMPT` extracts and updates memory. File-cached with mtime-based invalidation. The LLM is asked to extract durable facts and update each section in the structure.

### Contrast with Our System

Our memory is unstructured (daily notes + MEMORY.md). DeerFlow's tiered structure (work/personal/topOfMind + time-bucketed history + facts array) is more queryable and durable. The async queue pattern is directly applicable to our OpenClaw setup.

---

## 5. Skills System

### Structure

```
skills/
├── public/             # Built-in skills (shipped with DeerFlow)
│   ├── research/
│   │   └── SKILL.md
│   ├── report-generation/
│   │   └── SKILL.md
│   ├── slide-creation/
│   │   └── SKILL.md
│   └── deep-search/
│       └── SKILL.md
└── custom/             # User-defined skills
    └── your-skill/
        └── SKILL.md
```

### SKILL.md Format

Skills use standard Markdown with optional frontmatter:
```markdown
---
version: 1.0.0
author: bytedance
compatibility: deerflow>=2.0
---
# Skill Name
[workflow definition, best practices, tool references]
```

Skills are packaged as `.skill` archives for distribution via the Gateway.

### Progressive Loading

1. Session starts with only skill names + one-line summaries in context
2. Agent identifies needed skill from task description
3. Full SKILL.md injected into context for that turn
4. Other skills remain out of context

**Our gap:** `available_skills` in our system prompt injects all descriptions at startup. Should migrate to progressive loading.

---

## 6. Configuration System

### Config Schema (config.yaml)

```yaml
# Config versioning — emits warnings when outdated
config_version: 1

models:
  - name: claude-sonnet-4.6
    display_name: Claude Sonnet 4.6 (Claude Code OAuth)
    use: deerflow.models.claude_provider:ClaudeChatModel
    model: claude-sonnet-4-6
    max_tokens: 4096
    supports_thinking: true

tool_groups:
  - name: web          # Web browsing and search
  - name: file:read    # Read-only file operations
  - name: file:write   # Write file operations
  - name: bash         # Shell command execution

sandbox:
  use: deerflow.community.aio_sandbox:AioSandboxProvider
  port: 8080
  auto_start: true
  container_prefix: deer-flow-sandbox
  mounts:
    - host_path: /path/on/host
      container_path: /path/in/container
      read_only: false

skills:
  path: /custom/path/to/skills
  container_path: /mnt/skills

title:
  enabled: true
  max_words: 6
  max_chars: 60

channels:
  langgraph_url: http://localhost:2024
  gateway_url: http://localhost:8001
  session:
    assistant_id: lead_agent
    config:
      recursion_limit: 100
    context:
      thinking_enabled: true
      is_plan_mode: false
      subagent_enabled: false
  telegram:
    enabled: true
    bot_token: $TELEGRAM_BOT_TOKEN
    allowed_users: []
    users:
      "123456789":
        assistant_id: vip_agent
        config:
          recursion_limit: 150
        context:
          thinking_enabled: true
          subagent_enabled: true
```

### Key Config Patterns Worth Stealing

1. **Config versioning with `config_version` field** — startup warning + `make config-upgrade` command. We have no config version tracking.
2. **Tool groups** — logical groupings of tools that can be assigned/denied per agent
3. **Per-user overrides in channel config** — VIP users get different agent config
4. **`supports_thinking`/`when_thinking_enabled` per model** — conditional thinking mode config
5. **Environment variable substitution** with `$` prefix in YAML

### Extensions Config (extensions_config.json)

MCP servers and skills managed separately from main config:
```json
{
  "mcpServers": {
    "brave-search": {
      "enabled": true,
      "type": "http",
      "url": "https://api.brave.com/mcp",
      "oauth": {
        "enabled": true,
        "token_url": "...",
        "grant_type": "client_credentials"
      }
    }
  }
}
```

Supports OAuth flows (client_credentials, refresh_token) for HTTP/SSE MCP servers. Auto-token-refresh is built in.

---

## 7. Research-Specific Patterns (v1 Legacy, Still Applicable)

DeerFlow v1 was a pure deep research framework. These patterns from v1 are still present in the v2 skills system:

- **Multi-query expansion** — decompose research questions into N search queries
- **Source tiering** — rate sources by authority before synthesis
- **Progressive refinement** — initial broad search → targeted follow-up → synthesis
- **Citation tracking** — structured reference management through research session

These are now encoded as the `deep-search` and `research` built-in skills rather than being hardcoded in the agent.

---

## 8. Community & Derivatives

*Based on GitHub issues list (1278 issues as of March 24, 2026) and prior research.*

- **Active issue volume** (~1278 open/recent issues) suggests large user base hitting edge cases — mature enough to have real-world problems, not just toy usage
- **v1 maintained on `main-1.x` branch** — ByteDance still accepting contributions there; two parallel maintained versions
- **Community pushed DeerFlow beyond research** (data pipelines, slide decks, dashboards) — validated the harness framing before ByteDance formally adopted it
- **InfoQuest integration** — BytePlus (ByteDance's commercial arm) tool being integrated. Watch for feature drift toward paid commercial tooling.
- **claude-to-deerflow skill** — enables Claude Code to interact with a running DeerFlow instance. Clever positioning as infrastructure.

---

## 9. What NOT to Steal

| Feature | Why It Doesn't Translate |
|---------|-------------------------|
| LangGraph state machine | Too heavy, different execution model. Our `sessions_spawn` + Claude Code is lighter and more flexible for our use case |
| LangChain dependency | Leaky abstractions, version hell. We use direct API calls |
| Docker/Kubernetes sandbox | We run on a dedicated agent VM — the VM itself is the sandbox |
| InfoQuest integration | ByteDance commercial product, no public API without their infrastructure |
| Nginx reverse proxy | We don't have the same multi-service topology |
| LangGraph checkpointing | Session resumption is handled differently in our system |
| Built-in UI (Next.js) | We use Discord/Telegram, not a web frontend |
| pnpm/uv requirement | Our stack is simpler — don't add dependencies for tooling parity |

---

## 10. My Assessment

**Is DeerFlow impressive or just hype?**

**Genuinely impressive.** The middleware chain architecture is clean engineering that most agent frameworks skip. The progressive skill loading is the right answer to context bloat. The config versioning with `config-upgrade` migration tooling shows production-mindedness unusual for OSS agent projects. The harness/app boundary enforcement in CI is exactly the kind of discipline that separates "research demo" from "real framework."

**Where the hype meets limits:**

1. **LangChain dependency** is a real liability. LangChain is notorious for breaking changes and leaky abstractions. ByteDance is betting heavily on it.
2. **ByteDance/commercial pressure** — InfoQuest being pushed in shows the OSS-as-lead-gen dynamic already at work. The "recommended models" list is Doubao-first (ByteDance's model).
3. **Complexity cost** — Requires Node.js 22+, pnpm, uv, nginx, Docker, LangGraph. Our stack is dramatically simpler and more maintainable by one person.
4. **No self-improvement** — Memory exists but there's no autonomous learning loop. Skills are static once written. Our `.learnings` auto-promotion system is actually more sophisticated here.

**Verdict:** DeerFlow is a well-engineered production framework from a team with real resources. It's not revolutionary — it synthesizes known patterns (ReAct planning, tool-use, memory, sandboxing) into a coherent whole. The value is in the coherence and engineering quality, not invention. Worth stealing patterns from. Not worth adopting wholesale.

Confidence calibration: 0.88 — high confidence on architecture (read source code docs directly), medium confidence on community sentiment (thin issue data).

---

## Sources

1. [T1] [bytedance/deer-flow README](https://github.com/bytedance/deer-flow) — Primary source, full README including architecture, modes, config examples
2. [T1] [backend/docs/CONFIGURATION.md](https://raw.githubusercontent.com/bytedance/deer-flow/main/backend/docs/CONFIGURATION.md) — Complete config schema reference
3. [T1] [backend/docs/MCP_SERVER.md](https://raw.githubusercontent.com/bytedance/deer-flow/main/backend/docs/MCP_SERVER.md) — MCP integration details, OAuth flows
4. [T1] [deerflow.tech](https://deerflow.tech) — Official website, All-in-One Sandbox, case studies
5. [T1] [[DeerFlow Architecture Study]] — Previous vault research (2026-03-16), middleware chain detail
6. [T1] [[DeerFlow 2.0 Evaluation]] — Previous vault research (2026-03-16), comparison tables, recommendations
7. [T2] [GitHub Issues](https://github.com/bytedance/deer-flow/issues) — Community signal (1278+ issues as of March 24, 2026)

---

*Related: [[OpenClaw]], [[Hermes Agent]], [[Multi-Agent Coordination Patterns]], [[DeerFlow Architecture Study]], [[DeerFlow 2.0 Evaluation]]*
