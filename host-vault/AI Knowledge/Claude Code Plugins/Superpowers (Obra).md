# Superpowers (Obra)

> Battle-tested development workflow skills for Claude Code — brainstorming, TDD, debugging, planning.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [obra/superpowers](https://github.com/obra/superpowers) |
| **Stars** | 78,200+ |
| **By** | Jesse Vincent |
| **Version** | v5.0.1 (Jan 2026) |
| **License** | MIT |

## 14 Skills

| Skill | Category | Purpose |
|---|---|---|
| using-superpowers | Meta | Session start, skill routing |
| brainstorming | Process | Socratic method for pre-implementation design exploration |
| writing-plans | Process | Spec → detailed, bite-sized implementation plan |
| executing-plans | Process | Batch execution with human review checkpoints |
| dispatching-parallel-agents | Process | 2+ independent parallel subagent tasks |
| subagent-driven-development | Process | Per-task subagents with two-stage review (spec compliance + code quality) |
| test-driven-development | Quality | Red-Green-Refactor enforcement with anti-patterns reference |
| systematic-debugging | Quality | 4-phase root cause investigation (tracing, defense-in-depth, condition-based waiting) |
| verification-before-completion | Quality | Evidence before assertions — confirms fixes are genuine |
| receiving-code-review | Quality | Technical rigor on feedback response |
| requesting-code-review | Quality | Pre-merge verification with pre-review checklist |
| using-git-worktrees | Dev Support | Isolated parallel development branches |
| finishing-a-development-branch | Dev Support | Merge/PR decision guide |
| writing-skills | Dev Support | Create/edit skills following best practices |

## Install

| Platform | Command |
|---|---|
| **Claude Code (Official)** | `/plugin install superpowers@claude-plugins-official` |
| **Claude Code (Marketplace)** | `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install superpowers@superpowers-marketplace` |
| **Cursor** | `/add-plugin superpowers` or search marketplace |
| **Codex** | See `.codex/INSTALL.md` in repo |
| **OpenCode** | See `.opencode/INSTALL.md` in repo |
| **Gemini CLI** | `gemini extensions install https://github.com/obra/superpowers` |

Update: `/plugin update superpowers`

## Gotchas

- **124 open issues** as of Mar 2026 — very active development
- Test installation by requesting a feature plan or debugging assistance in a new session

Source: [README](https://github.com/obra/superpowers)

## See Also

- [[Claude Code Plugins MOC]]
- [[everything-claude-code]]
- [[Obsidian-Claude Connectivity]]

#claude-code #skills #essential
