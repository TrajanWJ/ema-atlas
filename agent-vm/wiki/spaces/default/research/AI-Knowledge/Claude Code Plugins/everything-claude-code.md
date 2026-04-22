---
type: research
wiki_id: research/AI-Knowledge/Claude_Code_Plugins/everything-claude-code
imported_from: vault/Research/AI-Knowledge/Claude Code Plugins/everything-claude-code.md
imported_at: '2026-04-04T00:23:56.975Z'
tags: []
summary: ''
---
# everything-claude-code

> The agent harness performance optimization system — 65+ skills, 16 agents, 40+ commands.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) |
| **Stars** | 72,200+ |
| **By** | Affaan Mustafa |
| **License** | MIT |
| **Min version** | Claude Code CLI v2.1.0+ |

## What You Get

- **16 specialized subagents** — planner, architect, tdd-guide, code-reviewer, security-reviewer, build-error-resolver, e2e-runner, refactor-cleaner, doc-updater, go-reviewer, go-build-resolver, python-reviewer, database-reviewer, and more
- **65+ workflow skills** — React, Next.js, Docker, API design, Django, Spring Boot, etc.
- **40+ slash commands** — core, language-specific, learning, multi-agent, infrastructure, security
- **Language-specific rules** — TypeScript, Python, Go, Swift, PHP, C++, Java, Perl, Kotlin
- **Hooks** for session persistence and memory
- **Pre-built MCP configs** for GitHub, Supabase, Vercel, Railway

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

## Env Vars (optional)

| Variable | Values |
|---|---|
| `MAX_THINKING_TOKENS` | e.g., `10000` |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | e.g., `50` |
| `CLAUDE_CODE_SUBAGENT_MODEL` | e.g., `haiku` |
| `ECC_HOOK_PROFILE` | `minimal`, `standard`, `strict` |
| `ECC_DISABLED_HOOKS` | Comma-separated hooks to disable |
| `CLAUDE_PACKAGE_MANAGER` | Force npm/pnpm/yarn/bun |

## Key Commands

**Core:** `/plan`, `/tdd`, `/code-review`, `/build-fix`, `/e2e`, `/refactor-clean`, `/verify`, `/checkpoint`, `/evaluate`

**Language-specific:** `/go-review`, `/go-test`, `/go-build`, `/python-review`

**Learning:** `/learn`, `/learn-eval`, `/instinct-status`, `/instinct-import`, `/instinct-export`, `/evolve`, `/skill-create`

**Multi-agent:** `/multi-plan`, `/multi-execute`, `/multi-backend`, `/multi-frontend`, `/multi-workflow`, `/orchestrate`

**Infrastructure:** `/pm2`, `/sessions`, `/setup-pm`, `/update-docs`, `/update-codemaps`, `/test-coverage`, `/harness-audit`, `/loop-start`, `/loop-status`, `/quality-gate`, `/model-route`

**Security:** `/security-scan`

## Skill Categories (65+)

| Category | Examples |
|---|---|
| **Language Patterns** | TypeScript, Python, Go, Java/Spring, C++, Perl, Swift, Kotlin |
| **Infrastructure** | `api-design`, `docker-patterns`, `postgres-patterns`, `deployment-patterns` |
| **Testing** | `tdd-workflow`, `e2e-testing`, `eval-harness`, `verification-loop` |
| **AI/Agent** | `agentic-engineering`, `autonomous-loops`, `cost-aware-llm-pipeline` |
| **Business** | `article-writing`, `market-research`, `investor-materials` |
| **Data/Video** | ClickHouse analytics, video/audio processing |
| **Learning** | `continuous-learning-v2`, `instinct-extraction`, `skill-evolution` |

## Structure

```
agents/     → 16 specialized subagents
skills/     → 65+ SKILL.md-based workflows
commands/   → 40+ slash commands
rules/      → Language-specific guidelines (common/, typescript/, python/, golang/, swift/, php/)
hooks/      → Trigger-based automations
contexts/   → Dynamic prompt injection (dev, review, research modes)
mcp-configs/ → MCP server configurations
```

## Gotchas

- **Hooks duplicate error** — do NOT add `"hooks"` to `.claude-plugin/plugin.json`; Claude Code v2.1+ auto-loads `hooks/hooks.json`. Declaring it explicitly causes "Duplicate hooks file detected."
- **Rules aren't distributed via plugins** — install manually to `~/.claude/rules/` or `.claude/rules/`
- **MCP context drain** — each enabled MCP consumes tokens. Keep under 10 MCPs and 80 tools active
- **Token costs** — default Opus model is expensive; switch to Sonnet for 80%+ of tasks

Source: [README](https://github.com/affaan-m/everything-claude-code)

## Porting Skills

All use the same SKILL.md format (Agent Skills spec). Copy any skill directory to `.claude/skills/` in another project. Works across Claude Code, Codex CLI, OpenCode, Cursor, Gemini CLI.

## No Obsidian-Specific Skills

This collection doesn't include Obsidian skills. Use [[obsidian-skills (kepano)]] or [julianobarbosa/claude-code-skills](https://github.com/julianobarbosa/claude-code-skills) for that.

## See Also

- [[Obsidian-Claude Connectivity]] — central integration reference
- [[obsidian-skills (kepano)]] — Obsidian format skills

#claude-code #skills #agents #commands #essential
