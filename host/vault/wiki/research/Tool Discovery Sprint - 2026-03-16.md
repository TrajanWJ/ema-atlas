---
title: Tool Discovery Sprint - 2026-03-16
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - obsidian
  - openclaw
  - ops
  - prompts
  - research
  - skills
summary: >-
  We have 24 skills including: `elite-longterm-memory`, `memory-hygiene`,
  `soulcraft`, `knowledge-graph`, `parallel-ai-research`, `mental-models`, `dive
wiki_id: research/Tool_Discovery_Sprint_-_2026-03-16
imported_from: vault/Research/Tool Discovery Sprint - 2026-03-16.md
imported_at: '2026-04-04T00:23:57.124Z'
---
# Tool Discovery Sprint — 2026-03-16

**Goal:** Find the 5 most useful, production-ready tools/skills/repos for our [[Agent Stack]].
**Method:** ClawHub search + GitHub research across prompt engineering, MCP, memory, orchestration, and workflow domains.

---

## Already Installed (for reference)

We have 24 skills including: `elite-longterm-memory`, `memory-hygiene`, `soulcraft`, `knowledge-graph`, `parallel-ai-research`, `mental-models`, `diverge`, `parallax`, `multi-agent-collaboration`, `intelligent-delegation`, `devloop-agent-pack`, `cron-mastery`, `taskr`, `personality-dynamics`, `recursive-knowledge-miner`.

---

## Top 5 Ranked Picks

### 🥇 1. FastMCP — The MCP Server Framework

| | |
|---|---|
| **Source** | GitHub — [PrefectHQ/fastmcp](https://github.com/PrefectHQ/fastmcp) |
| **What** | The standard Python framework for building MCP servers and clients. Powers ~70% of MCP servers across all languages. Originally FastMCP 1.0 was incorporated into the official MCP Python SDK. Now maintained standalone with 1M+ daily downloads. |
| **Why it matters** | We're running multiple MCP servers already (Serena, [[Engram]], CodeGraphContext, QMD). FastMCP v3 lets us build custom tool servers in minutes — wrap any Python function as an MCP tool with automatic schema generation, validation, and docs. The client SDK also lets us programmatically connect to any MCP server. |
| **Use case** | Build a custom MCP server that exposes our vault search, agent dispatch, or any bespoke tooling directly to Claude Code sessions. Replace janky bash wrappers with proper MCP tools. |
| **Install** | `uv pip install fastmcp` — trivial. Python 3.10+. |
| **Value** | 🔥🔥🔥🔥🔥 — This is infrastructure-level. Every custom tool we'd ever want to expose becomes a 10-line Python function. |

---

### 🥈 2. Claude Agent SDK (Python)

| | |
|---|---|
| **Source** | GitHub — [anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) |
| **What** | Official Anthropic Python SDK for Claude Code. Async API for querying Claude Code programmatically, with full tool access, custom MCP tools defined as Python functions, hooks, and interactive multi-turn conversations. Bundles Claude Code CLI automatically. |
| **Why it matters** | We spawn Claude Code via CLI with `--print --permission-mode bypassPermissions`. This SDK gives us **programmatic control** — define custom in-process MCP tools, handle streaming responses, set permission modes, manage multi-turn sessions. It's the official way to build on top of Claude Code. |
| **Use case** | Build Python scripts that orchestrate Claude Code agents with custom tools. E.g., a dispatch script that creates a ClaudeSDKClient, gives it vault-search as a custom tool, and runs a research task. Way cleaner than shell spawning. |
| **Install** | `pip install claude-agent-sdk` — bundles CLI. Python 3.10+. |
| **Value** | 🔥🔥🔥🔥🔥 — Official SDK. This is the future of how we should be spawning agents. |

---

### 🥉 3. prompt-optimizer (ClawHub)

| | |
|---|---|
| **Source** | ClawHub — `prompt-optimizer` by autogame-17 |
| **What** | Evaluate, optimize, and enhance prompts using 58 proven prompting techniques. Analyzes prompts for weaknesses, suggests improvements, applies techniques like [[chain-of-thought]], [[few-shot]], role prompting, etc. Recently updated (March 16, 2026). |
| **Why it matters** | We have `soulcraft` for SOUL.md crafting and `prompt-compiler` for compilation, but nothing that systematically evaluates a prompt against a library of 58 techniques. This is the "lint for prompts" we're missing. Perfect for optimizing agent dispatch prompts, AGENTS.md instructions, and any prompt that gets used repeatedly. |
| **Use case** | Run it on our agent spawn prompts. Run it on SOUL.md. Run it on the dispatch protocol section of AGENTS.md. Find where we're leaving performance on the table. |
| **Install** | `clawhub install prompt-optimizer` |
| **Value** | 🔥🔥🔥🔥 — Directly improves every agent we run. Low effort, high leverage. |

---

### 4. memory-tiering (ClawHub)

| | |
|---|---|
| **Source** | ClawHub — `memory-tiering` by SarielWang93 |
| **What** | Automated multi-tiered memory management with HOT, WARM, and COLD tiers. Automatically organizes, prunes, and archives context during memory operations or compactions. |
| **Why it matters** | Our current memory setup is: `MEMORY.md` (2500 char cap) + `memory/YYYY-MM-DD.md` daily notes + vault. It works but is manual. Memory-tiering could automate the lifecycle — hot context stays in MEMORY.md, warm context moves to daily notes, cold context archives to vault. Pairs well with our existing `memory-hygiene` and `elite-longterm-memory`. |
| **Use case** | Automate the "prune MEMORY.md when it gets full" dance. Let the system decide what's hot vs cold based on access patterns. |
| **Install** | `clawhub install memory-tiering` |
| **Value** | 🔥🔥🔥 — Solid quality-of-life improvement. Not urgent but would reduce manual memory management overhead. |

---

### 5. mcp-server-discovery (ClawHub)

| | |
|---|---|
| **Source** | ClawHub — `mcp-server-discovery` by Yanick112 |
| **What** | Discover, search, and manage MCP servers. Find servers by capability, get server information, generate MCP client configurations. |
| **Why it matters** | The MCP ecosystem is exploding. There are hundreds of MCP servers for everything — databases, APIs, file systems, home automation, git, etc. This skill lets us search and discover them without manually browsing GitHub. Pairs perfectly with FastMCP (build our own) + this (find existing ones). |
| **Use case** | "Find me an MCP server for Obsidian" or "What MCP servers exist for database access?" — instead of manual searching, the agent can discover and evaluate options. |
| **Install** | `clawhub install mcp-server-discovery` |
| **Value** | 🔥🔥🔥 — Useful as the MCP ecosystem grows. Discovery is a real pain point right now. |

---

## Honorable Mentions

| Skill/Tool | Source | Why it didn't make top 5 |
|---|---|---|
| `memory-reme` | ClawHub | ReMe-powered cross-session memory. Interesting but overlaps heavily with our existing [[elite-longterm-memory]] + [[memory-hygiene]] combo. |
| `agentic-mcp-server-builder` | ClawHub | Scaffolds MCP server projects. Useful but FastMCP already handles this better with its Python-native approach. |
| `context-optimizer` | ClawHub | Auto-compaction for 64k context. Built for DeepSeek specifically — may not translate well to our Claude stack. |
| `prompt-engineering-expert` | ClawHub | Generic prompt engineering advice. We already have `soulcraft` which is more targeted. |
| `agentic-workflow-automation` | ClawHub | Workflow blueprints. Only v0.1.0, feels early. Our AGENTS.md dispatch protocol already covers this well. |
| `mcp-hass` | ClawHub | Home Assistant via MCP. Cool but we don't run HA (yet). |

---

## Recommended Install Order

1. **prompt-optimizer** — instant value, zero risk: `clawhub install prompt-optimizer`
2. **FastMCP** — infrastructure play, install when ready to build custom tools: `uv pip install fastmcp`
3. **Claude Agent SDK** — install alongside FastMCP for the full programmatic stack: `pip install claude-agent-sdk`
4. **memory-tiering** — install after evaluating current memory pain points: `clawhub install memory-tiering`
5. **mcp-server-discovery** — install when MCP expansion is on the roadmap: `clawhub install mcp-server-discovery`

---

## Notes

- **Brave Search API** is not configured — limited GitHub trending research to direct URL fetches. Recommend configuring: `openclaw configure --section web`
- ClawHub has a LOT of duplicate/low-quality skills (multiple `code-review` variants, many `prompt-engineering` clones). Signal-to-noise ratio is rough — worth starring quality finds.
- The [[Claude Agent SDK]] is a game-changer for our architecture. Long-term, we should migrate agent spawning from CLI `claude --print` to SDK-based dispatch for better control, custom tools, and streaming.

---

*Sprint completed 2026-03-16 by 🔬 Researcher*
