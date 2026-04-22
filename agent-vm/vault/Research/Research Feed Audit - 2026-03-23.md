---
title: Research Feed Audit
date: 2026-03-23
type: research
tags: [agent-feed, github-interesting, steal-concepts, frontend-vision]
---

# Research Feed Audit — 2026-03-23

Swept 373 tracked items from github-interesting. Filtered noise, extracted signal.

## 🔥 Tier 1: Steal Now

### 1. GraphMemory MCP
- **Repo:** https://github.com/graph-memory/graphmemory
- **What:** 58 MCP tools + REST API + Web UI. Indexes markdown + code into 6 graph structures.
- **Steal:** Replace/augment QMD vault search. One install = queryable knowledge graph + web UI.
- **Effort:** Low — `npm install -g @graphmemory/server`

### 2. Cherry Studio
- **Repo:** https://github.com/CherryHQ/cherry-studio (42k ⭐)
- **What:** Electron multi-LLM desktop client. 300+ assistants, autonomous agents.
- **Steal:** Agent config UI, model management, conversation branching, prompt library — all patterns for OpenClaw frontend.
- **Effort:** High (study/adapt, not install)

### 3. Claude HUD
- **Repo:** https://github.com/jarrodwatts/claude-hud
- **What:** Claude Code plugin: context usage, active tools, running agents, todo progress.
- **Steal:** Install directly. Instant observability for all Claude Code sessions.
- **Effort:** Trivial — `/plugin install claude-hud`

### 4. Activepieces
- **Repo:** https://github.com/activepieces/activepieces
- **What:** Open source Zapier. ~400 MCP servers, visual workflow builder.
- **Steal:** Workflow builder for dispatch dashboard + MCP catalog.
- **Effort:** Medium — Docker deploy

### 5. KGN
- **Repo:** https://github.com/baobab00/kgn
- **What:** Knowledge graph CLI + MCP. PostgreSQL/pgvector. Multi-agent conflict detection.
- **Steal:** Agent conflict detection + task handoff patterns.
- **Effort:** Medium — needs PostgreSQL

## 📌 Tier 2: Worth Watching

### 6. GitHub Agentic Workflows (gh-aw)
- **Repo:** https://github.com/github/gh-aw
- **Steal:** Guardrails model + "workflow as markdown" dispatch templates

### 7. Cortex Obsidian Plugin
- **Repo:** https://github.com/ScottKirvan/Cortex
- **Steal:** Vault-native memory, per-note agent control

### 8. Archestra
- **Repo:** https://github.com/archestra-ai/archestra
- **Steal:** MCP registry UI + cost tracking dashboard

### 9. Oh-My-OpenAgent
- **Repo:** https://github.com/code-yeongyu/oh-my-openagent
- **Steal:** Multi-model routing (Claude orchestration, GPT reasoning, fast models for speed)

### 10. wshobson/agents
- **Repo:** https://github.com/wshobson/agents (32k ⭐)
- **Steal:** 146 skills with progressive disclosure, agent taxonomy

## 💡 Tier 3: Patterns to Study

| # | Project | Pattern |
|---|---------|---------|
| 11 | [TrendRadar](https://github.com/sansan0/TrendRadar) | Multi-platform trend monitor with smart alerts |
| 12 | [trend-pulse](https://github.com/claude-world/trend-pulse) | 20 trending sources as MCP server |
| 13 | [Presenton](https://github.com/presenton/presenton) | AI presentation generation from markdown |
| 14 | [Integuru](https://github.com/Integuru-AI/Integuru) | Reverse-engineer platform APIs from HAR files |
| 15 | [Obsidian Prompt Flow](https://github.com/ebullient/obsidian-prompt-flow) | Wikilink expansion into prompts |
| 16 | [Fluxer](https://github.com/fluxerapp/fluxer) | OSS Discord alternative |
| 17 | [MCP Graph Memory](https://github.com/prih/mcp-graph-memory) | Lighter graph memory alternative |

## Implementation Roadmap

### This Week (Quick Wins)
1. Install Claude HUD on all Claude Code sessions
2. Install GraphMemory → point at vault → add as MCP
3. Add trend-pulse as MCP server
4. Install Cortex in Obsidian

### Next Sprint
5. Deploy Activepieces for visual workflow prototyping
6. Deep study Cherry Studio architecture → frontend spec
7. Port KGN conflict detection to dispatch
8. Evaluate gh-aw for GitHub automation

### Frontend Vision (Longer Term)
9. Cherry Studio teardown → OpenClaw frontend spec
10. Agent dashboard (dispatch, sessions, vault)
11. Model routing from Oh-My-OpenAgent
12. MCP registry UI from Archestra
