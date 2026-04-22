---
title: "Claude Code Configuration"
type: reference
created: 2026-03-11
updated: 2026-04-12
tags: [claude-code, configuration, essential, hooks, security, context-engineering]
summary: "Highest-leverage Claude Code config: CLAUDE.md, settings.json, hooks, worktrees, plugins"
---

# Claude Code Configuration

> The highest-leverage configuration changes for Claude Code — CLAUDE.md, settings.json, .claudeignore, hooks, subagents, and worktrees.

---

## 1. CLAUDE.md — The Single Most Important File

### Key Principle

Claude's context window fills up fast, and performance degrades as it fills. CLAUDE.md is read on **every single turn** — keep it concise and actionable.

### Structure

Run `/init` to generate a starter CLAUDE.md based on your project, then refine. No required format, but keep it short and human-readable:

```markdown
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible

# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, not the whole test suite
```

### What to Include vs Exclude

| Include | Exclude |
|---|---|
| Bash commands Claude can't guess | Anything Claude can figure out by reading code |
| Code style rules that differ from defaults | Standard language conventions Claude already knows |
| Testing instructions and test runners | Detailed API documentation (link to docs instead) |
| Repo etiquette (branch naming, PR conventions) | Information that changes frequently |
| Architectural decisions specific to your project | Long explanations or tutorials |
| Developer environment quirks (required env vars) | File-by-file descriptions of the codebase |
| Common gotchas or non-obvious behaviors | Self-evident practices like "write clean code" |

### Key Rules

- If Claude keeps ignoring a rule, the file is probably too long and the rule is getting lost
- Add emphasis ("IMPORTANT", "YOU MUST") to improve adherence on critical rules
- Check CLAUDE.md into git so your team can contribute
- Treat it like code: review when things go wrong, prune regularly
- Use `@path/to/import` syntax to reference other files without inlining them

### Three-Tier System

| Level | File | Purpose |
|---|---|---|
| Global | `~/.claude/CLAUDE.md` | Universal rules (test always, simple code) |
| Project | `.claude/CLAUDE.md` (or `./CLAUDE.md`) | Stack, structure, commands, conventions |
| Subdirectory | `packages/api/.claude/CLAUDE.md` | Package-specific context (auto-loaded on demand) |

### Best Starting Point

[Trail of Bits config](https://github.com/trailofbits/claude-code-config) — battle-tested defaults from security auditors.

---

## 2. .claudeignore — Instant 30-40% Token Savings

Create `.claudeignore` at project root:

```
.next/
node_modules/
dist/
build/
*.min.js
*.map
*.lock
coverage/
.git/
```

Adding just `.next/` cuts context by 30-40% in Next.js projects. **Zero tradeoffs.**

---

## 3. settings.json Optimization

**Priority order:**
1. Enterprise managed (highest)
2. `~/.claude/settings.json` (user-level)
3. `.claude/settings.json` (project-level, in git)
4. `.claude/settings.local.json` (personal, not in git)

### Key Settings

```json
{
  "$schema": "https://json-schema.store.org/claude-code-settings.json",
  "permissions": {
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(git push --force:*)",
      "Bash(git push origin main:*)"
    ],
    "allow": [
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ]
  }
}
```

- Permission rules: deny first, ask, allow (first match wins)
- **Schema line** gives autocomplete in editors

### Sandbox (Linux)

```bash
sudo apt install bubblewrap socat
# Then in Claude Code:
/sandbox
```

With sandboxing enabled, you get autonomy with better security than `--dangerously-skip-permissions`. Sandbox defines upfront boundaries rather than bypassing all checks.

**Never allow:** `allowUnixSockets` broadly (bypasses sandbox via docker.sock), writes to `$PATH`, system config, or shell dotfiles.

---

## 4. Hooks That Actually Matter

| Hook | What To Do | Why |
|---|---|---|
| **PreToolUse** | [[Dippy]] (auto-approve safe) + [[Lasso claude-hooks]] (injection scan) | Safety + flow |
| **PostToolUse** | Auto-lint/format after file edits, auto-test after code changes | Catch errors immediately |
| **SessionStart** | Pull fresh context, `async: true` for background | No cold starts |
| **Stop** | Auto-push staging, quality checks, generate summaries | Clean endings |
| **Compact** | Control what's preserved vs discarded | Better auto-compaction |

Unlike CLAUDE.md instructions which are advisory, **hooks are deterministic** — they guarantee the action happens.

Claude can write hooks for you: "Write a hook that runs eslint after every file edit." Run `/hooks` for interactive configuration, or edit `.claude/settings.json` directly.

---

## 5. Context Engineering

| Technique | Token Savings | Effort |
|---|---|---|
| `.claudeignore` | 30-40% | 2 minutes |
| Plan Mode (Shift+Tab) | 40-60% | Zero (behavioral) |
| One session per task + `/clear` | Significant | Discipline |
| Compact at 70% usage or `/compact <instructions>` | Moderate | Proactive |
| `/btw` for side questions (never enters context) | Moderate | Zero |
| Truncate verbose command output via hooks | Moderate | Hook setup |
| Keep CLAUDE.md concise | Moderate | Editing |
| Use subagents for investigation (separate context) | Significant | Prompting |

### Rewind Options

- **`Esc`** — stop Claude mid-action, context preserved
- **`Esc + Esc`** or **`/rewind`** — open rewind menu, restore conversation/code/both, or summarize from a point
- **`/clear`** — reset context between unrelated tasks
- After 2+ failed corrections, `/clear` and write a better initial prompt

---

## 6. Git Worktrees for Parallel Development

```bash
claude --worktree my-feature   # Creates isolated worktree + starts Claude
```

- Add `.claude/worktrees/` to `.gitignore`
- Use sparse checkout + worktree for monorepos
- Pull from main at checkpoints to prevent drift

---

## 7. Skills and Subagents

### Skills

Create `SKILL.md` files in `.claude/skills/` for domain knowledge and reusable workflows:
- Claude applies them automatically when relevant
- Invoke directly with `/skill-name`
- Use `disable-model-invocation: true` for side-effect workflows (manual trigger only)

### Custom Subagents

Place in `.claude/agents/` (project) or `~/.claude/agents/` (global). Run in their own context with their own allowed tools.

**Community resource:** [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) — 100+ pre-built agents. [subagents.app](https://subagents.app) for browsing.

### Plugins

Run `/plugin` to browse the marketplace. Plugins bundle skills, hooks, subagents, and MCP servers into a single installable unit.

---

## 8. Underrated Tips

| Tip | What It Does |
|---|---|
| **Esc Esc** or `/rewind` | Undo when Claude goes off-track (saves massive tokens vs fixing in-context) |
| **`/btw`** | Side questions in dismissible overlay — never enters conversation history |
| **`/loop`** | Recurring monitoring — poll deploys, babysit PRs |
| **`/context`** | Prevents context bloat in large codebases |
| **`ultrathink`** in prompts | Triggers high-effort reasoning mode |
| **`claude -p "prompt"`** | Non-interactive mode for CI/scripts; `--output-format json` for structured output |
| **`--allowedTools`** | Scope permissions for batch operations |
| **`@` references** | Reference files directly instead of describing locations |
| **Pipe data** | `cat error.log \| claude` to send file contents directly |

---

## Priority Order

1. **[[Dippy]]** — auto-approve safe commands (immediate QoL)
2. **[[Lasso claude-hooks]]** — prompt injection defense
3. **.claudeignore** — instant 30-40% context savings
4. **CLAUDE.md optimization** — keep concise, include only what Claude can't infer
5. **Trail of Bits settings.json** — security baseline
6. **Sandbox** — `/sandbox` on Linux
7. **Git worktrees** — parallel development
8. **Skills + subagents** — specialized workflows

## Resources

- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) — official docs (primary source for this note)
- [Trail of Bits Config](https://github.com/trailofbits/claude-code-config) — gold standard settings.json + CLAUDE.md
- [HumanLayer Blog](https://www.humanlayer.dev/blog/writing-a-good-claude-md) — CLAUDE.md best practices
- [VoltAgent Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) — 100+ agents

#claude-code #configuration #essential #hooks #security #context-engineering
