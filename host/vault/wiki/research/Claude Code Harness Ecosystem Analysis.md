---
title: Claude Code Harness Ecosystem Analysis
created: '2026-03-30'
updated: '2026-03-30'
type: research
status: active
tags:
  - claude-code
  - harness
  - orchestration
  - sri-superman
  - ema
summary: >-
  Deep analysis of Claude Code CLI wrappers, harnesses, and orchestration
  frameworks — architecture patterns, gap analysis, and implications for SRI
  Superman
wiki_id: research/Claude_Code_Harness_Ecosystem_Analysis
imported_from: vault/Research/Claude Code Harness Ecosystem Analysis.md
imported_at: '2026-04-04T00:23:57.007Z'
---

# Claude Code Harness Ecosystem Analysis

## The Two Paths to Programmatic Claude Code

### Path 1: Claude Agent SDK (API-key only)
- `@anthropic-ai/claude-agent-sdk` (TS) / `claude-agent-sdk` (Python)
- Same agent loop, tools, and context management as Claude Code
- Built-in: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
- Hooks via callbacks: PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd
- **Cannot use OAuth/Max plan** — Anthropic explicitly prohibits third-party use of claude.ai login
- Streaming via async iterator pattern
- Supports: Bedrock, Vertex AI, Azure AI Foundry

### Path 2: Claude Code CLI as subprocess (Max plan compatible)
```
claude --print \
  --output-format stream-json \
  --input-format stream-json \
  --permission-mode bypassPermissions \
  --session-id <uuid> \
  --mcp-config ./tools.json \
  --agents '{...}'
```
- Uses existing OAuth/Max subscription auth
- JSONL streaming events: assistant/text, tool_use, result, system/api_retry
- Bidirectional via stdin/stdout JSON
- Session persistence via --session-id, --resume, --fork-session
- Hooks via `.claude/hooks.json` in working directory
- Plugins via `--plugin-dir`

## Project Landscape (Ranked by Relevance to SRI Superman)

### Tier 1: Claude Code Orchestration Harnesses

#### Citadel (⭐418, very active)
- **What:** Claude Code plugin — lives inside Claude Code, not a wrapper
- **Architecture:** 21 lifecycle hooks (JS) + 34 skills + state persistence
- **Key Patterns:**
  - 4-tier task routing: regex → session state → keyword → LLM classify (~500 tokens)
  - Campaign persistence: YAML frontmatter in `.planning/campaigns/`
  - Fleet mode: parallel agents in isolated git worktrees with discovery relay
  - Circuit breaker: 3 consecutive failures → suggest different approach; 5 trips → hard stop
  - Cost tracking: reads Claude Code session JSONL for real token counts, threshold alerts
  - Quality gate: cold-path verification lenses (performance, a11y, adversarial, contractual)
  - Governance: audit log for all Edit/Write/Bash/Agent tool calls
  - Session end: marks campaign continuation state, queues doc sync
  - Init: scaffolds `.planning/` tree, syncs scripts, sweeps stale coordination claims
- **Hooks breakdown:** circuit-breaker, cost-tracker, doc-sync, external-action-gate, governance, harness-health-util, init-project, intake-scanner, issue-monitor, organize-enforce, post-compact, post-edit, pre-compact, protect-files, quality-gate, restore-compact, session-end, stop-failure, subagent-stop, task-events, worktree-remove, worktree-setup
- **Skills:** architect, archon, autopilot, cost, create-app, create-skill, daemon, dashboard, design, do (router), doc-gen, experiment, fleet, improve, infra-audit, learn, live-preview, map, marshal, merge-review, organize, postmortem, pr-watch, prd, qa, refactor, research-fleet, research, review, scaffold, schedule, session-handoff, setup, systematic-debugging, test-gen, triage, verify, watch, workspace
- **Relevance:** Highest. Most of these patterns map directly to SRI Superman's needs.

#### c9r Orchestrator (⭐13, Rust)
- **What:** Kubernetes-style control plane for agent-first software delivery
- **Architecture:** CLI + gRPC daemon, SQLite persistence, sandbox enforcement
- **Key Patterns:**
  - Declarative YAML manifests with loop control, guard steps, DAG execution
  - Agent capability matching, health scoring, rotation, load balancing
  - CEL prehooks for conditional step execution
  - mTLS, RBAC, sandbox (macOS Seatbelt / Linux namespaces)
  - Webhook triggers with per-trigger signature verification
  - Long-running automation with task persistence and event streams
- **Relevance:** Infrastructure patterns (RBAC, sandbox, DAG execution) useful for production hardening

#### oh-my-agent (⭐524)
- **What:** Portable multi-agent harness — splits work across specialized agents
- **Architecture:** `.agents/` directory with role-based agents (frontend, backend, QA, PM, etc.)
- **Key Patterns:**
  - 14 specialized agents with two-layer skill design (~75% token savings)
  - Cross-IDE: works with Claude Code, Codex, Gemini CLI, etc.
  - CLI orchestrator for parallel agent execution
  - `/ultrawork` — 5-phase quality workflow with 11 review gates
  - Charter preflight and quality gates
  - Auto-detection of workflows from natural language keywords (11 languages)
- **Relevance:** Role-based agent design patterns, quality gate methodology

### Tier 2: Claude Code CLI Wrappers

#### Claude Code Server (⭐15, JS)
- **What:** HTTP API wrapper around Claude CLI
- **Key Patterns:**
  - RESTful API with session management, async task queue, SSE streaming
  - Webhook callbacks when async tasks complete
  - Load balancing across multiple API keys/providers
  - Rate limiting, statistics, batch processing (up to 10 concurrent)
  - TUI management tool
  - Swagger/OpenAPI documentation
- **Relevance:** API layer patterns for exposing Claude Code as a service

#### CCFlow (⭐1, Python)
- **What:** Lightweight wrapper that turns Claude Code into a remote-controllable engine
- **Key Patterns:**
  - `ClaudeOrchestrator` class — Python library for `claude -p` with stream-json parsing
  - Telegram bot layer — send prompts from phone, get streamed results
  - Project navigation (cd, ls, mkdir) across working directories
  - Session resume via session ID tracking
  - Sandbox mode via hook + prompt injection
  - Stop command — abort mid-execution
  - Table-to-image rendering for mobile readability
  - Zero external dependencies (stdlib only)
- **Relevance:** The "SaaS layer" approach — wraps Claude Code directly, Max plan compatible. Closest to what EMA's Claude.Bridge would do.

### Tier 3: Curated References

#### awesome-cli-coding-agents (⭐98)
- 80+ CLI coding agents catalogued with stars, features, and categories
- Includes agent infrastructure, session managers, parallel runners, orchestrators
- Notable entries beyond the above: OpenCode (122k⭐), Hermes Agent (8.7k⭐, self-improving with persistent memory), Letta Code (1.9k⭐, memory-first), Dexto (596⭐, sub-agent spawning)

## Architecture Patterns Extracted (For SRI Superman)

### 1. Process Management Layer
```
Your Backend (Elixir GenServer / Node.js)
  └── Manages Claude Code as a long-running Port/subprocess
      ├── stdin: JSON prompts
      ├── stdout: JSONL events (stream-json)
      ├── Session tracking via --session-id
      └── Lifecycle: spawn → monitor → restart → cleanup
```
**Who does this:** CCFlow, Claude Code Server, OpenClaw
**Gap:** Nobody does this in Elixir/OTP yet. EMA's GenServer approach is novel.

### 2. Hook System
```
Pre-tool hooks: audit, gate, inject context
Post-tool hooks: log, track cost, detect failures
Session hooks: init scaffolding, end persistence, compact recovery
Stop hooks: quality gates, verification lenses
```
**Who does this best:** Citadel (21 hooks, most comprehensive)
**Gap:** No hook system exists for the subprocess/wrapper approach — only for the plugin approach. EMA would need to build hook-equivalent logic at the GenServer level.

### 3. Task Routing
```
Tier 1: Pattern match (regex, zero tokens)
Tier 2: Session state check (mid-campaign resume, zero tokens)
Tier 3: Keyword lookup (skill keywords, zero tokens)
Tier 4: LLM classification (~500 tokens, structured complexity analysis)
```
**Who does this best:** Citadel (/do router)
**Gap:** Nobody combines routing with a proposal scoring system. SRI Superman's seed → score → route → execute pipeline is unique.

### 4. Parallel Agent Coordination
```
Option A: Git worktrees (Citadel fleet mode)
  - Each agent in isolated worktree
  - Discovery briefs shared between waves
  - Merge results at end

Option B: Workspace directories (oh-my-agent)
  - Each agent in separate directory
  - Artifacts shared via filesystem

Option C: Session isolation (Claude Code --agents flag)
  - Built-in sub-agent spawning
  - Parent-child relationship
```
**Gap:** Nobody does parallel agents with a shared knowledge graph/vault. SRI Superman's vault-connected agents would be novel.

### 5. Campaign/Session Persistence
```
Campaign state: YAML frontmatter + markdown body
Telemetry: JSONL files (agent runs, hook timing, cost)
Session costs: per-session JSONL with real/estimated cost
Discovery: compressed briefs between waves
Continuation: state files for cross-session resume
```
**Who does this best:** Citadel
**Gap:** File-based only. No database-backed persistence with queryable history. EMA's PostgreSQL-backed approach would be stronger.

### 6. Cost & Token Tracking
```
Real tokens: read Claude Code's session JSONL (~/.claude/projects/*/sessions/*.jsonl)
Threshold alerts: $5, $15, $30, $50, $75, $100, $150, $200, $300, $500
Burn rate: $/min over rolling window
Campaign budgets: cumulative cost per campaign slug
```
**Who does this best:** Citadel cost-tracker.js
**Gap:** Max plan doesn't have direct cost — but usage percentage tracking matters. Nobody tracks "am I about to hit my 5h rate limit?"

## Gaps & Blind Spots (What Nobody Does Yet)

### 1. Proposal Pipeline
Nobody has a seed → generate → refine → debate → tag → score → queue → approve → execute pipeline. This is SRI Superman's differentiator.

### 2. MCP as Bidirectional State
Most projects treat MCP as "tools Claude can call." Nobody treats MCP as the primary state bridge between the app and Claude sessions — where your app's vault, tasks, proposals, and project context are natively available to Claude without prompt injection.

### 3. UI-Native Agent Management
Citadel is CLI-only. Claude Code Server has a TUI. CCFlow has Telegram. Nobody has a proper desktop GUI with:
- Real-time agent status panels
- Proposal queue visualization
- Session timeline with tool call history
- Cost/token dashboards
- One-click approve/reject/steer

### 4. Multi-Model Pipeline Stages
Nobody uses different models per pipeline stage (opus for generation, sonnet for refinement, haiku for tagging). The SDK supports `--model` but no orchestrator leverages this for cost optimization.

### 5. Vault/Knowledge Graph Integration
Nobody connects Claude sessions to a persistent knowledge graph. Citadel's campaigns are project-scoped. There's no cross-project learning, no accumulated preference tracking, no decision history.

### 6. Rate Limit Awareness (Max Plan)
Nobody tracks or adapts to Max plan's 5h rolling usage window. This is critical for long-running autonomous workflows.

### 7. Agent Reputation/Fitness
Nobody scores agents by historical performance and routes based on fitness. Our AGENTS.md dispatch protocol does this — it's unique.

### 8. Context Recovery After Compaction
Citadel has pre-compact and restore-compact hooks, but they're basic. Nobody has intelligent context triage — deciding what to preserve vs. summarize vs. drop based on task relevance.

## What SRI Superman Should Steal

| From | Pattern | How |
|---|---|---|
| **Citadel** | 4-tier task routing | Implement in EMA's task classifier — regex first, LLM classify as fallback |
| **Citadel** | Circuit breaker | Track consecutive failures in GenServer state, escalate/switch strategy |
| **Citadel** | Quality gate lenses | Run verification after agent completion — a11y, security, contractual |
| **Citadel** | Campaign persistence | Campaign as first-class entity in PostgreSQL, not just files |
| **Citadel** | Cost tracking from session JSONL | Parse `~/.claude/projects/*/sessions/*.jsonl` for real token data |
| **Citadel** | Governance audit log | Log all tool calls to EMA's event system |
| **c9r** | RBAC + sandbox | Role-based permissions per agent, namespace isolation |
| **c9r** | Declarative workflows | YAML manifests for repeatable agent workflows |
| **oh-my-agent** | Role-based agent design | Specialized agents with domain-specific tool whitelists |
| **oh-my-agent** | Quality gates (11 review gates) | Multi-pass review before accepting agent output |
| **CCFlow** | ClaudeOrchestrator pattern | Direct port to Elixir GenServer with stream-json parsing |
| **CCFlow** | Session resume via ID | Track session IDs in EMA's DB for cross-session continuity |

## What SRI Superman Adds That Nobody Has

1. **Scored proposal queue** — AI-generated proposals ranked by impact/complexity
2. **Multi-model pipeline** — different Claude models per stage for cost optimization
3. **Vault-connected agents** — MCP tools that give Claude native access to your knowledge base
4. **Desktop-native UI** — Tauri app with real-time agent panels, not CLI/TUI
5. **Elixir/OTP supervision** — fault-tolerant agent process management
6. **Rate limit awareness** — adapts agent scheduling to Max plan usage windows
7. **Cross-project learning** — agents accumulate knowledge across all projects via vault
