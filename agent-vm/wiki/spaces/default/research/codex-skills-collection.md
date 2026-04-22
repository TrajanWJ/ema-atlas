---
title: codex-skills-collection
created: '2026-03-19'
updated: '2026-03-19'
type: research
status: active
source: unknown
tags: []
wiki_id: research/codex-skills-collection
imported_from: vault/Research/codex-skills-collection.md
imported_at: '2026-04-04T00:23:57.156Z'
summary: ''
---
# codex-skills — Multi-Agent Skill Collection

**URL**: https://github.com/am-will/codex-skills  
**Install**: `npx skills add am-will/codex-skills`  
**Installer**: skills.sh CLI (`npx skills`)

## What It Is

A curated collection of OpenClaw/Codex/Claude Code skills covering planning, documentation, frontend, and browser automation. Mix of original skills + best patterns imported from Anthropic and Vercel.

## Skill Inventory

### Planning
- **planner**: Comprehensive phased plans with sprints + atomic tasks. Use for feature breakdowns, roadmaps.
- **plan-harder**: Enhanced variant for deep analysis + detailed task breakdown.
- **parallel-task**: Execute plan files by launching multiple parallel subagents simultaneously. Requires a plan from `planner`.

### Multi-Agent Orchestration
- **llm-council**: Spawns multiple AI planners (Claude, Codex, Gemini) to generate independent plans → judge agent synthesizes the best approach. Includes real-time web UI for monitoring + refining.

### Documentation Access
- **context7**: Fetch up-to-date library docs via Context7 API. Needs `CONTEXT7_API_KEY`.
- **openai-docs-skill**: Query OpenAI docs via MCP CLI.
- **read-github**: Read/search GitHub repos via gitmcp.io. Converts `github.com/owner/repo` → `gitmcp.io/owner/repo` for LLM-friendly access.
- **markdown-url**: Prefix any URL with `https://markdown.new/` for clean Markdown view.

### Frontend
- **frontend-design**: Distinctive frontend design system (from Anthropic).
- **frontend-responsive-ui**: Responsive UI standards (from Anthropic).
- **vercel-react-best-practices**: React/Next.js performance guidance (from Vercel).

### Browser Automation
- **gemini-computer-use**: Gemini 2.5 Computer Use browser control (Playwright + safety confirmation). Needs `GEMINI_API_KEY`.
- **agent-browser**: Fast Rust-based headless browser CLI from Vercel Labs. Snapshot/act pattern for AI agents. **Recommended over gemini-computer-use for speed.**

## Install Commands

```bash
# List available skills first
npx skills add am-will/codex-skills --list

# Install specific skills globally
npx skills add am-will/codex-skills --skill planner --skill context7 -g

# Install for specific agents
npx skills add am-will/codex-skills --skill planner -a claude-code -a codex -g

# Install all (interactive)
npx skills add am-will/codex-skills -g

# Non-interactive
npx skills add am-will/codex-skills --skill planner -g -y
```

## High-Value Skills for OpenClaw

### llm-council — Multi-Model Planning Synthesis
**This is the standout skill.** Spawns Claude + Codex + Gemini to independently plan the same task, then uses a judge agent to synthesize the best approach. Real-time web UI for monitoring.

**Application to OpenClaw**: This is exactly the multi-agent consultation pattern for complex decisions:
- Architecture decisions: Claude (reasoning), Codex (implementation), Gemini (synthesis)
- Research tasks: parallel search + independent analysis + synthesis
- Prompt engineering: multiple models write versions, judge picks best

**Requirement**: API keys for Anthropic + OpenAI + Google + subscription for Codex

### planner + parallel-task — Phased Execution
Two-step pattern:
1. `planner` → generates structured plan with sprints and atomic tasks
2. `parallel-task` → launches subagents to execute in parallel

**Application to OpenClaw**: This IS the dispatch system but for Claude Code context. Worth studying the plan schema for our task JSON format.

### read-github — LLM-Friendly Repo Reading
Converts GitHub URLs to gitmcp.io for clean markdown access without browser or auth. Critical for Scout's research tasks.

**Example**: `gitmcp.io/ywatanabe1989/scitex-python` → clean markdown README

### agent-browser — Vercel Labs Rust Browser
Fast headless browser with snapshot/act pattern. Already in our workspace as a skill. This is the same technology.

## Codex Agent Configurations

The `agents/` directory has TOML-based multi-agent configs for Codex:
- Specialized roles: architect, frontend, backend, security
- Worker tiers for parallel execution
- Purpose-built agent personas

**Application**: Template these for OpenClaw `openclaw.json` agent definitions.

## Install Status
- `npx skills add am-will/codex-skills --list` (checking)
- High priority: `planner`, `llm-council`, `read-github`
- For Claude Code specifically: `--agent claude-code`
