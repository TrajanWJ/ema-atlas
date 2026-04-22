# LCM Summary sum_3c7eef4b39ce4937

Created: 2026-03-25 18:06:38
Kind: leaf
Depth: 0
Conversation: 1272
Tokens: 1215
Descendants: 0
Earliest: 2026-03-24T23:49:50.000Z
Latest: 2026-03-24T23:49:50.000Z

## Content

[2026-03-24 23:49 UTC]
=== CLAUDE.md (root) ===
# Claude Code Configuration - Ruflo v3.5

> **Ruflo v3.5** (2026-02-27) — First major stable release. Formerly "Claude Flow".
> 5,900+ commits, 55 alpha iterations, 259 MCP tools, 60+ agents, 8 AgentDB controllers.
> Packages: `@claude-flow/cli@3.5.0`, `claude-flow@3.5.0`, `ruflo@3.5.0`

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/src` for source code files
- Use `/tests` for test files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
- Use `/scripts` for utility scripts
- Use `/examples` for example code

## Project Architecture

- Follow Domain-Driven Design with bounded contexts
- Keep files under 500 lines
- Use typed interfaces for all public APIs
- Prefer TDD London School (mock-first) for new code
- Use event sourcing for state changes
- Ensure input validation at system boundaries

### Key Packages

| Package | Path | Purpose |
|---------|------|---------|
| `@claude-flow/cli` | `v3/@claude-flow/cli/` | CLI entry point (26 commands) |
| `@claude-flow/codex` | `v3/@claude-flow/codex/` | Dual-mode Claude + Codex collaboration |
| `@claude-flow/guidance` | `v3/@claude-flow/guidance/` | Governance control plane |
| `@claude-flow/hooks` | `v3/@claude-flow/hooks/` | 17 hooks + 12 workers |
| `@claude-flow/memory` | `v3/@claude-flow/memory/` | AgentDB + HNSW search |
| `@claude-flow/security` | `v3/@claude-flow/security/` | Input validation, CVE remediation |

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- Use Claude Code's Task tool for spawning agents, not just MCP

**Mandatory patterns:**
- ALWAYS batch ALL todos in ONE TodoWrite call (5-10+ minimum)
- ALWAYS spawn ALL agents in ONE message with full instructions via Task tool
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL terminal operations in ONE Bash message
- ALWAYS batch ALL memory store/retrieve operations in ONE message

---

## Swarm Orchestration

- MUST initialize the swarm using MCP tools when starting complex tasks
- MUST spawn concurrent agents using Claude Code's Task tool
- Never use MCP tools alone for execution — Task tool agents do the actual work

### MCP + Task Tool in SAME Message

- MUST call MCP tools AND Task tool in ONE message for complex work
- Always call MCP first, then IMMEDIATELY call Task tool to spawn agents

### 3-Tier Model Routing (ADR-026)

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| **1** | Agent Booster (WASM) | <1ms | $0 | Simple transforms (var→const, add types, etc.) — **Skip LLM entirely** |
| **2** | Haiku | ~500ms | $0.0002 | Simple tasks, low complexity (<30%) |
| **3** | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning, architecture, security (>30%) |

- Always check for `[AGENT_BOOSTER_AVAILABLE]` or `[TASK_MODEL_RECOMMENDATION]` before spawning agents
- Use Edit tool directly when `[AGENT_BOOSTER_AVAILABLE]` — intent types: `var-to-const`, `add-types`, `add-error-handling`, `async-await`, `add-logging`, `remove-console`

## Swarm Configuration & Anti-Drift

### Anti-Drift Coding Swarm (PREFERRED DEFAULT)

- ALWAYS use hierarchical topology for coding swarms
- Keep maxAgents at 6-8 for tight coordination
- Use specialized strategy for clear role boundaries
- Use `raft` consensus for hive-mind (leader maintains authoritative state)
- Run frequent checkpoints via `post-task` hooks
- Keep shared memory namespace for all agents
- Keep task cycles short with verification gates

```javascript
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})
```

## Dual-Mode Collaboration (Claude Code + Codex)

This repository uses **dual-mode orchestration** to run Claude Code (🔵) and OpenAI Codex (🟢) workers in parallel with shared memory coordination. Both platforms collaborate on development tasks with cross-learning.

### Why Dual-Mode?

| Single Platform | Dual-Mode Collaboration |
|----------------|------------------------|
| One model's perspective | Two AI platforms cross-validating |
| Limited reasoning styles | Complementar
[LCM fallback summary; truncated for context management]
