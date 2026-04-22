---
title: "Everything Claude Code"
type: reference
created: 2025-12-15
updated: 2026-04-13
tags: [claude-code, skills, agents, commands, essential, plugin]
confidence: high
source: https://github.com/affaan-m/everything-claude-code
summary: "The largest Claude Code plugin — 38 agents, 156+ skills, 72 commands, multi-agent orchestration, and continuous learning via instinct extraction."
---

# Everything Claude Code

> The agent harness performance optimization system — 156+ skills, 38 agents, 72 commands.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) |
| **Stars** | 141,000+ |
| **By** | Affaan Mustafa |
| **License** | MIT |
| **Version** | v1.10.0 (April 2026) |
| **Min version** | Claude Code CLI v2.1.0+ |
| **Cross-harness** | Claude Code, Cursor, OpenCode, Codex, Gemini CLI |

## Overview

Everything Claude Code (ECC) is the largest open-source skill/agent collection for Claude Code. It transforms the base CLI into a structured engineering harness with specialized subagents for delegation, workflow skills for repeatable processes, and a continuous learning system that extracts patterns from sessions into reusable "instincts." The project has grown from a curated skill pack into a full agent orchestration framework with its own Rust-based control plane (ECC 2.0 Alpha).

## What You Get

- **38 specialized subagents** — planner, architect, tdd-guide, code-reviewer, security-reviewer, build-error-resolver, e2e-runner, refactor-cleaner, doc-updater, plus language-specific reviewers for Go, Python, Java, Kotlin, Rust, C++, TypeScript
- **156+ workflow skills** — React, Next.js, Docker, API design, Django, Spring Boot, database migrations, video processing, content creation, and more
- **72 commands** (legacy shims) — core, language-specific, learning, multi-agent, infrastructure, security
- **Language-specific rules** — TypeScript, Python, Go, Swift, PHP, C++, Java, Perl, Kotlin (selective install)
- **Hooks** for session persistence, memory management, and lifecycle automation
- **Pre-built MCP configs** for GitHub, Supabase, Vercel, Railway
- **AgentShield integration** for security scanning

## Architecture

ECC has a layered architecture where each component type serves a distinct role:

```
agents/      → 38 specialized subagents (delegation targets)
skills/      → 156+ SKILL.md-based workflows (primary work surface)
commands/    → 72 slash command shims (entry points, being phased out)
rules/       → Language-specific guidelines (common/, typescript/, python/, golang/, swift/, php/)
hooks/       → Trigger-based automations (SessionStart, Stop, pre/post-edit)
contexts/    → Dynamic prompt injection (dev, review, research modes)
mcp-configs/ → MCP server configurations
ecc2/        → Rust control-plane prototype (v2.0 Alpha)
```

**How they interact:** Skills are the primary workflow surface — agents delegate to them for specialized work. Commands act as legacy entry points that invoke skills. Hooks execute at lifecycle events and handle session persistence, memory load/save, and verification gates. The state store uses SQLite for session tracking and skill evolution metrics.

## Install

```bash
# Plugin install (in Claude Code CLI):
/plugin marketplace add affaan-m/everything-claude-code
/plugin install everything-claude-code@everything-claude-code

# Manual install (required for rules):
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code
./install.sh typescript   # or: ./install.sh typescript python golang
./install.sh --target cursor typescript   # for Cursor
```

Selective install lets you pick only the languages you need — no bloat from unused rule sets.

## Env Vars (optional)

| Variable | Values |
|---|---|
| `MAX_THINKING_TOKENS` | e.g., `10000` |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | e.g., `50` |
| `CLAUDE_CODE_SUBAGENT_MODEL` | e.g., `haiku` |
| `ECC_HOOK_PROFILE` | `minimal`, `standard`, `strict` |
| `ECC_DISABLED_HOOKS` | Comma-separated hook IDs to disable |
| `CLAUDE_PACKAGE_MANAGER` | Force npm/pnpm/yarn/bun |

## Key Commands

**Core:** `/plan`, `/tdd`, `/code-review`, `/build-fix`, `/e2e`, `/refactor-clean`, `/verify`, `/checkpoint`, `/evaluate`

**Language-specific:** `/go-review`, `/go-test`, `/go-build`, `/python-review`

**Learning:** `/learn`, `/learn-eval`, `/instinct-status`, `/instinct-import`, `/instinct-export`, `/evolve`, `/skill-create`, `/prune`

**Multi-agent:** `/multi-plan`, `/multi-execute`, `/multi-backend`, `/multi-frontend`, `/multi-workflow`, `/orchestrate`

**Infrastructure:** `/pm2`, `/sessions`, `/setup-pm`, `/update-docs`, `/update-codemaps`, `/test-coverage`, `/harness-audit`, `/loop-start`, `/loop-status`, `/quality-gate`, `/model-route`

**Security:** `/security-scan`

## Learning & Instinct System

ECC's continuous learning system extracts patterns from development sessions into reusable "instincts" — learned behaviors with confidence scoring:

1. **Extraction** — During sessions, patterns are automatically identified and captured
2. **Confidence scoring** — Each instinct carries a confidence level based on frequency and success rate
3. **Evolution** — `/evolve` clusters related instincts into full reusable skills
4. **Pruning** — `/prune` removes expired pending instincts that never reached confidence threshold
5. **Portability** — `/instinct-import` and `/instinct-export` allow sharing instincts across projects

This creates a feedback loop where the agent gets better at your specific codebase over time, learning project-specific patterns rather than relying solely on general training.

## Multi-Agent Orchestration

The operator lane handles complex workflows requiring coordination across agents:

- **`/multi-plan`** — Task decomposition: breaks work into parallelizable chunks assigned to appropriate agents
- **`/multi-execute`** — Coordinated execution across agents with dependency tracking
- **`/multi-backend`** / **`/multi-frontend`** — Domain-scoped orchestration
- **`/pm2`** — Process lifecycle management for multi-service setups

The context problem is solved through **staged retrieval** — initial decomposition provides a high-level plan, then progressive context refinement as each agent needs deeper knowledge of its slice.

## Hook Profiles

Three strictness levels via `ECC_HOOK_PROFILE`:

| Profile | Behavior |
|---|---|
| `minimal` | Bare-bones — session save/load only |
| `standard` | Balanced — recommended for daily use |
| `strict` | Comprehensive — full verification at every gate |

Individual hooks can be disabled via `ECC_DISABLED_HOOKS` (comma-separated IDs like `"pre:bash:tmux-reminder,post:edit:typecheck"`). Hooks include re-entrancy guards and memory throttling to prevent token explosion.

## Skill Categories (156+)

| Category | Examples |
|---|---|
| **Language Patterns** | TypeScript, Python, Go, Java/Spring, C++, Perl, Swift, Kotlin, Rust |
| **Infrastructure** | `api-design`, `docker-patterns`, `postgres-patterns`, `deployment-patterns` |
| **Testing** | `tdd-workflow`, `e2e-testing`, `eval-harness`, `verification-loop` |
| **AI/Agent** | `agentic-engineering`, `autonomous-loops`, `cost-aware-llm-pipeline` |
| **Business** | `article-writing`, `market-research`, `investor-materials` |
| **Data/Video** | ClickHouse analytics, video/audio processing |
| **Learning** | `continuous-learning-v2`, `instinct-extraction`, `skill-evolution` |
| **Operator** | `brand-voice`, `social-graph-ranker`, `connections-optimizer`, `customer-billing-ops` |

## ECC 2.0 Alpha (Rust Control Plane)

v1.10.0 introduced `ecc2/` — a Rust-based daemon for managing agent sessions outside Claude Code's own lifecycle:

- `ecc2 dashboard` — Overview of running sessions
- `ecc2 start` / `ecc2 stop` / `ecc2 resume` — Session lifecycle
- `ecc2 status` — Health and metrics
- `ecc2 daemon` — Background process management

This moves orchestration control out of the LLM context window and into a proper process manager.

## Gotchas

- **Hooks duplicate error** — do NOT add `"hooks"` to `.claude-plugin/plugin.json`; Claude Code v2.1+ auto-loads `hooks/hooks.json`. Declaring it explicitly causes "Duplicate hooks file detected."
- **Rules aren't distributed via plugins** — install manually to `~/.claude/rules/` or `.claude/rules/`
- **MCP context drain** — each enabled MCP consumes tokens. Keep under 10 MCPs and 80 tools active
- **Token costs** — default Opus model is expensive; switch to Sonnet for 80%+ of tasks via `/model-route`

## Porting Skills

All skills use the same SKILL.md format (Agent Skills spec). Copy any skill directory to `.claude/skills/` in another project. Works across Claude Code, Codex CLI, OpenCode, Cursor, Gemini CLI.

## No Obsidian-Specific Skills

This collection doesn't include Obsidian skills. Use [[obsidian-skills (kepano)]] or [julianobarbosa/claude-code-skills](https://github.com/julianobarbosa/claude-code-skills) for that.

## See Also

- [[Claude Code Plugins MOC]] — plugin index
- [[Obsidian-Claude Connectivity]] — central integration reference
- [[obsidian-skills (kepano)]] — Obsidian format skills
- [[Claude Code Configuration]] — base CLI configuration

Source: [GitHub README](https://github.com/affaan-m/everything-claude-code)
