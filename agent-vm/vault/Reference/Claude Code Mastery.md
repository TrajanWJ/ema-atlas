---
title: "Claude Code Mastery"
created: 2026-03-14
updated: 2026-03-16
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: system-generated
tags: [advanced-prompting-patterns, agent-teams-experimental, claudemd--the-most-important-file, context-management--cost-optimization, core-mental-model, custom-subagents, github-actions-integration, headless--programmatic-mode, hooks--lifecycle-automation, mcp-server-integration, memory-systems, our-custom-subagents-claudeagents, our-setup-openclaw-integration, permission-modes, pro-tips--patterns, skills-system]
summary: "1. [Core Mental Model](#core-mental-model)"
---
# Claude Code Mastery Guide

**Author:** Right Hand (auto-generated)
**Date:** 2026-03-14
**Source:** Official docs (code.claude.com), our VM setup, community patterns
**Status:** Active reference

---

## Table of Contents

1. [Core Mental Model](#core-mental-model)
2. [CLAUDE.md — The Most Important File](#claudemd--the-most-important-file)
3. [Memory Systems](#memory-systems)
4. [MCP Server Integration](#mcp-server-integration)
5. [Custom Subagents](#custom-subagents)
6. [Agent Teams (Experimental)](#agent-teams-experimental)
7. [Skills System](#skills-system)
8. [Hooks — Lifecycle Automation](#hooks--lifecycle-automation)
9. [Headless / Programmatic Mode](#headless--programmatic-mode)
10. [Context Management & Cost Optimization](#context-management--cost-optimization)
11. [Permission Modes](#permission-modes)
12. [Advanced Prompting Patterns](#advanced-prompting-patterns)
13. [GitHub Actions Integration](#github-actions-integration)
14. [Our Setup (OpenClaw Integration)](#our-setup-openclaw-integration)
15. [Pro Tips & Patterns](#pro-tips--patterns)

---

## Core Mental Model

Claude Code is an **agentic coding environment**, not a chatbot. It reads files, runs commands, makes changes, and works autonomously. The single most important constraint:

> **Context window fills up fast, and performance degrades as it fills.**

Everything — conversation, files read, command output — consumes context. Managing context is the #1 skill. Track it with a custom status line and compact aggressively.

**The four-phase workflow:**
1. **Explore** (Plan Mode) → read files, understand codebase
2. **Plan** → create detailed implementation plan (Ctrl+G to edit in editor)
3. **Implement** (Normal Mode) → code with verification
4. **Commit** → descriptive commit + PR

**Key insight:** Give Claude a way to verify its work (tests, screenshots, expected outputs). This is the single highest-leverage thing you can do.

---

## CLAUDE.md — The Most Important File

CLAUDE.md gives Claude persistent instructions loaded at session start. Keep it **under 200 lines** — bloated files cause instructions to be ignored.

### Locations (precedence order)

| Scope | Location | Shared? |
|---|---|---|
| Managed policy | `/etc/claude-code/CLAUDE.md` (Linux) | Org-wide |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team (via git) |
| User | `~/.claude/CLAUDE.md` | Personal |

### What to include vs exclude

**Include:**
- Bash commands Claude can't guess
- Code style rules differing from defaults
- Testing instructions, preferred runners
- Branch naming, PR conventions
- Architectural decisions specific to project
- Common gotchas, env vars

**Exclude:**
- Anything Claude can figure out from code
- Standard language conventions
- Detailed API docs (link instead)
- Frequently-changing info
- Long tutorials
- "Write clean code" style platitudes

### Import syntax

```markdown
# CLAUDE.md
See @README.md for project overview and @package.json for npm commands.

# Workflow
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

Imports resolve relative to the containing file, max 5 hops deep.

### Generate starter with /init

Run `/init` to auto-generate a CLAUDE.md from your codebase. It detects build systems, test frameworks, and code patterns. Refine from there.

### Project rules (`.claude/rules/`)

For larger projects, split instructions into topic-specific files:

```
.claude/
├── CLAUDE.md
└── rules/
    ├── testing.md
    ├── api-design.md
    ├── frontend/
    │   └── components.md
    └── backend/
        └── database.md
```

Rules can be **path-scoped** — they only load when Claude works with matching files, saving context.

### Emphasis for adherence

If Claude keeps ignoring a rule, the file is probably too long. Use emphasis like "IMPORTANT" or "YOU MUST" to improve adherence on critical rules.

---

## Memory Systems

### Two complementary systems

| | CLAUDE.md | Auto Memory |
|---|---|---|
| Who writes | You | Claude |
| Contains | Instructions, rules | Learnings, patterns |
| Scope | Project/user/org | Per working tree |
| Loaded | Every session | First 200 lines |
| Best for | Standards, workflows | Build commands, prefs |

### Auto memory

Claude learns from your corrections automatically. When you say "always use tabs" or "run `pnpm` not `npm`", Claude saves that. Stored per working tree.

Subagents can maintain their own auto memory (enable in subagent config).

---

## MCP Server Integration

MCP (Model Context Protocol) connects Claude Code to external tools. Three transport types:

### Adding servers

```bash
# Remote HTTP (recommended for cloud services)
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Remote SSE (deprecated, use HTTP)
claude mcp add --transport sse asana https://mcp.asana.com/sse

# Local stdio (for system access / custom scripts)
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server

# With auth headers
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

### Important: Option ordering

All options (`--transport`, `--env`, `--scope`, `--header`) must come **before** the server name. `--` separates the name from the command.

### Our MCP servers (on this VM)

We have 5 MCP servers configured for Claude Code:
- **Serena** — Semantic code navigation
- **[[Engram]]** — Persistent memory graph
- **CodeGraphContext** — Code graph database
- **QMD** — Vault semantic search
- **TaskMaster** — Task management

### Cost warning

Each MCP server adds tool definitions to context, even when idle. When definitions exceed 10% of context, Claude auto-defers them via tool search. Prefer CLI tools (`gh`, `aws`, `gcloud`) when available — they don't add persistent overhead.

### Managing servers

- `/mcp` — View configured servers, disable unused ones
- `/context` — See what's consuming context space
- `claude mcp list` — List all servers from CLI
- `claude mcp remove <name>` — Remove a server

---

## Custom Subagents

Subagents are specialized AI assistants running in their own context window. They preserve main context, enforce tool constraints, and can use cheaper/faster models.

### Built-in subagents

| Agent | Model | Tools | Purpose |
|---|---|---|---|
| **Explore** | Haiku | Read-only | Fast codebase search/analysis |
| **Plan** | Inherited | Read-only | Research for plan mode |
| **General-purpose** | Inherited | All | Complex multi-step tasks |
| **Bash** | Inherited | Terminal | Running commands |
| **Claude Code Guide** | Haiku | — | Questions about CC features |

### Creating custom subagents

Subagents are Markdown files with YAML frontmatter:

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. Analyze code and provide
specific, actionable feedback on quality, security, and best practices.
```

### Where to store them

| Location | Scope | Priority |
|---|---|---|
| `--agents` CLI flag | Current session | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All projects | 3 |
| Plugin `agents/` | Plugin scope | 4 (lowest) |

### Configuration options

Frontmatter fields: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, `memory`.

### Our custom subagents (~/.claude/agents/)

We have 10 custom subagents configured:

| Agent | Model | Purpose |
|---|---|---|
| `architect` | Opus | System design, scalability, tech decisions |
| `build-error-resolver` | Sonnet | Fix build/type errors with minimal diffs |
| `database-reviewer` | Sonnet | PostgreSQL optimization, schema design, RLS |
| `doc-updater` | Haiku | Documentation and codemap maintenance |
| `goal-aligner` | Sonnet | Goal audit and priority alignment |
| `inbox-processor` | Sonnet | GTD-style inbox processing |
| `note-organizer` | Sonnet | Vault organization and hygiene |
| `refactor-cleaner` | Sonnet | Dead code removal and consolidation |
| `security-reviewer` | Sonnet | OWASP Top 10, secrets, injection detection |
| `weekly-reviewer` | Sonnet | Weekly review and planning facilitation |

### CLI-defined subagents (ephemeral)

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "debugger": {
    "description": "Debugging specialist for errors and test failures.",
    "prompt": "You are an expert debugger..."
  }
}'
```

### Managing with /agents

Run `/agents` interactively to view, create, edit, or delete subagents. Run `claude agents` from CLI to list all configured agents.

---

## Agent Teams (Experimental)

Agent teams coordinate **multiple independent Claude Code sessions** working together. Unlike subagents (which report back to parent), teammates communicate directly with each other via shared task lists.

### Enable

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### When to use teams vs subagents

| | Subagents | Agent Teams |
|---|---|---|
| Context | Own window, results → parent | Own window, fully independent |
| Communication | Report back only | Direct teammate messaging |
| Coordination | Parent manages | Shared task list, self-coordination |
| Best for | Focused tasks | Complex collaborative work |
| Token cost | Lower | Higher (each is full instance) |

### Best use cases

- **Research with competing angles** — teammates investigate different aspects
- **New features** — each teammate owns a separate piece
- **Debugging hypotheses** — parallel theory testing
- **Cross-layer changes** — frontend/backend/tests each owned by different agent

### Display modes

- **In-process** (default) — all in one terminal, Shift+Down to cycle
- **Split panes** — each teammate gets own tmux/iTerm2 pane

### Task management

Shared task list with states: pending → in progress → completed. Task dependencies supported. File locking prevents race conditions on claims.

### Plan approval

Require teammates to plan before implementing:
```
Spawn an architect teammate to refactor auth.
Require plan approval before any changes.
```

---

## Skills System

Skills extend Claude's capabilities with on-demand instructions. They follow the [AgentSkills](https://agentskills.io) open standard.

### Bundled skills

| Skill | Purpose |
|---|---|
| `/batch <instruction>` | Parallel large-scale changes across codebase (git worktrees) |
| `/claude-api` | Claude API reference for your language |
| `/debug [description]` | Troubleshoot current session via debug log |
| `/loop [interval] <prompt>` | Run prompt repeatedly on schedule |
| `/simplify [focus]` | Review recent changes for quality issues, fix them |

### Creating skills

```bash
mkdir -p ~/.claude/skills/explain-code
```

```yaml
# ~/.claude/skills/explain-code/SKILL.md
---
name: explain-code
description: Explains code with visual diagrams and analogies
---

When explaining code, always include:
1. **Start with an analogy**
2. **Draw a diagram** (ASCII art)
3. **Walk through the code** step-by-step
4. **Highlight a gotcha**
```

### Skill locations

| Location | Scope |
|---|---|
| Enterprise managed | All org users |
| `~/.claude/skills/` | Personal (all projects) |
| `.claude/skills/` | Project only |
| Plugin skills | Plugin scope |

### Skill types

- **Reference content** — conventions, patterns, style guides (runs inline)
- **Task content** — step-by-step workflows (can delegate to subagent)

### Supporting files

```
my-skill/
├── SKILL.md           # Main instructions (required)
├── template.md        # Template for Claude to fill
├── examples/
│   └── sample.md      # Expected format
└── scripts/
    └── validate.sh    # Executable script
```

### Automatic discovery

Skills in subdirectory `.claude/skills/` are discovered when Claude works in that subdirectory — great for monorepos.

---

## Hooks — Lifecycle Automation

Hooks are user-defined shell commands, HTTP endpoints, or LLM prompts that fire at specific lifecycle points.

### Hook events

| Event | When | Can block? |
|---|---|---|
| `SessionStart` | Session begins/resumes | No |
| `UserPromptSubmit` | Before prompt processing | No |
| `PreToolUse` | Before tool execution | **Yes (deny)** |
| `PostToolUse` | After tool succeeds | No |
| `PostToolUseFailure` | After tool fails | No |
| `PermissionRequest` | Permission dialog appears | No |
| `SubagentStart` | Subagent spawned | No |
| `SubagentStop` | Subagent finishes | No |
| `Stop` | Claude finishes responding | No |
| `TaskCompleted` | Task marked complete | No |
| `PreCompact` | Before compaction | No |
| `PostCompact` | After compaction | No |
| `SessionEnd` | Session terminates | No |
| `ConfigChange` | Config file changes | No |
| `WorktreeCreate` | Worktree being created | No |
| `WorktreeRemove` | Worktree being removed | No |

### Example: Block destructive commands

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/block-rm.sh
COMMAND=$(jq -r '.tool_input.command')

if echo "$COMMAND" | grep -q 'rm -rf'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Destructive command blocked by hook"
    }
  }'
else
  exit 0
fi
```

### Hook types

- **Command hooks** — shell scripts, receive JSON on stdin
- **HTTP hooks** — POST to endpoints, receive JSON body
- **Prompt hooks** — LLM prompts evaluated at hook points

### Hook locations

| Location | Scope |
|---|---|
| `~/.claude/settings.json` | All projects |
| `.claude/settings.json` | Single project (shareable) |
| `.claude/settings.local.json` | Single project (gitignored) |
| Plugin `hooks/hooks.json` | Plugin scope |
| Skill/agent frontmatter | Component scope |

---

## Headless / Programmatic Mode

Run Claude Code non-interactively with `-p` (print mode). Built on the Agent SDK.

### Basic usage

```bash
# Simple query
claude -p "What does the auth module do?"

# With tool permissions
claude -p "Run tests and fix failures" --allowedTools "Bash,Read,Edit"

# Structured JSON output
claude -p "Summarize this project" --output-format json

# JSON with schema
claude -p "Extract function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'

# Streaming
claude -p "Explain recursion" --output-format stream-json --verbose --include-partial-messages
```

### Continuing conversations

```bash
# Continue most recent
claude -p "Review this codebase" 
claude -p "Now focus on database queries" --continue

# Resume specific session
session_id=$(claude -p "Start a review" --output-format json | jq -r '.session_id')
claude -p "Continue review" --resume "$session_id"
```

### Custom system prompts

```bash
# Append to default prompt
gh pr diff "$1" | claude -p \
  --append-system-prompt "You are a security engineer. Review for vulnerabilities." \
  --output-format json

# Fully replace system prompt
claude -p "task" --system-prompt "You are a Python expert."
```

### Auto-commit pattern

```bash
claude -p "Look at staged changes and create a commit" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"
```

Note: trailing ` *` enables prefix matching. The space before `*` is important.

---

## Context Management & Cost Optimization

### Key strategies

1. **Clear between tasks** — `/clear` when switching unrelated work. `/rename` first to find later.
2. **Custom compaction** — `/compact Focus on code samples and API usage`
3. **CLAUDE.md compaction instructions:**
   ```markdown
   # Compact instructions
   When you are using compact, focus on test output and code changes
   ```
4. **Choose right model** — Sonnet for most tasks, Opus for complex architecture, Haiku for subagents
5. **Minimize MCP overhead** — Disable unused servers, prefer CLI tools

### Cost benchmarks

- Average: ~$6/developer/day (API users)
- 90th percentile: <$12/day
- Monthly: ~$100-200/dev with Sonnet

### Rate limit guidance (by team size)

| Team Size | TPM/user | RPM/user |
|---|---|---|
| 1-5 | 200k-300k | 5-7 |
| 5-20 | 100k-150k | 2.5-3.5 |
| 20-50 | 50k-75k | 1.25-1.75 |

---

## Permission Modes

| Mode | What it does | Toggle |
|---|---|---|
| **Normal** | Asks permission for each tool | Default |
| **Auto-Accept** | Approves all tool calls | Shift+Tab (once) |
| **Plan** | Read-only, no modifications | Shift+Tab (twice) |
| **Bypass** | Skip all permission checks | `--permission-mode bypassPermissions` |

### Plan mode as default

```json
// .claude/settings.json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

### Permission rules (for allowedTools)

Use `Bash(prefix *)` syntax for prefix matching:
- `Bash(git diff *)` — allows any command starting with `git diff`
- `Bash(npm test *)` — allows npm test with any args

---

## Advanced Prompting Patterns

### 1. Verification-first prompting

Bad: "implement a function that validates email addresses"
Good: "write a validateEmail function. Test cases: user@example.com → true, invalid → false, user@.com → false. Run the tests after implementing."

### 2. Scoped tasks with context

Bad: "add tests for foo.py"
Good: "write a test for foo.py covering the edge case where the user is logged out. Avoid mocks."

### 3. Pattern-referencing

Bad: "add a calendar widget"
Good: "look at how existing widgets are implemented. HotDogWidget.php is a good example. Follow the pattern for a new calendar widget with month selection and pagination."

### 4. Root-cause debugging

Bad: "fix the login bug"
Good: "users report login fails after session timeout. Check auth flow in src/auth/, especially token refresh. Write a failing test that reproduces the issue, then fix it."

### 5. Git history analysis

"Look through ExecutionFactory's git history and summarize how its API came to be."

### 6. The /batch pattern

For large-scale changes, `/batch` decomposes work into 5-30 independent units, spawns one agent per unit in isolated git worktrees, and each opens a PR:
```
/batch migrate src/ from Solid to React
```

### 7. Multi-session pipeline

```bash
# Session 1: Research
claude -p "Analyze auth module, output findings as JSON" --output-format json > findings.json

# Session 2: Plan
cat findings.json | claude -p "Create migration plan based on these findings"

# Session 3: Implement
claude -p "Implement the plan" --continue
```

### 8. The simplify pattern

After making changes, run `/simplify` to spawn 3 parallel review agents that check for code reuse, quality, and efficiency issues, then auto-fix.

---

## GitHub Actions Integration

### Quick setup

Run `/install-github-app` in Claude Code to auto-configure.

### Basic workflow

```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          # Responds to @claude mentions in comments
```

### Advanced configuration

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "Review this PR for security issues"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_args: |
      --append-system-prompt "Follow our coding standards"
      --max-turns 10
      --model claude-sonnet-4-6
```

### Capabilities

- `@claude` mention in any PR/issue triggers action
- Creates complete PRs from issue descriptions
- Follows your CLAUDE.md guidelines
- Automatic code review on every PR (with GitHub Code Review)

---

## Our Setup (OpenClaw Integration)

### How we use Claude Code

On this VM, Claude Code is invoked by [[OpenClaw]] (Right Hand) as a background coding agent:

```bash
# Standard invocation (from OpenClaw)
cd /path/to/project && claude --permission-mode bypassPermissions --print 'task description'

# Background session
bash workdir:~/project background:true command:"claude --permission-mode bypassPermissions --print 'task'"
```

### Key rules for our setup

1. **Never spawn Claude Code inside `~/.openclaw/`** — it reads soul docs
2. Always use `--print --permission-mode bypassPermissions` (not `--dangerously-skip-permissions`)
3. Append notification on completion: `openclaw system event --text "Done: [summary]" --mode now`
4. For Codex/Pi/OpenCode: use `pty:true` instead

### Our MCP servers

| Server | Purpose |
|---|---|
| Serena | Semantic code navigation (go-to-definition, find-references) |
| [[Engram]] | Persistent memory graph across sessions |
| CodeGraphContext | Code structure graph database |
| QMD | Vault semantic search (`qmd search "query"`) |
| TaskMaster | Task tracking and management |

### Our 10 custom subagents

See [Custom Subagents section](#our-custom-subagents-claudeagents) above.

### Token sync

OAuth tokens auto-synced from Claude Code → [[OpenClaw]] every 30min via cron at `/home/trajan/bin/refresh-claude-token.sh`.

---

## Pro Tips & Patterns

### 1. Status line for context tracking

Configure a custom status line to always show context usage. Run `/statusline` to set up. Critical for knowing when to `/clear` or `/compact`.

### 2. Use /rename before /clear

Always `/rename` your session before clearing. This lets you `/resume` later if needed.

### 3. Pipe data to Claude

```bash
# Error logs
cat error.log | claude -p "Diagnose this error"

# PR diffs
gh pr diff 42 | claude -p "Review for security issues"

# Test output
npm test 2>&1 | claude -p "Fix failing tests"
```

### 4. Rich content in prompts

- Use `@filename` to reference files (Claude reads them before responding)
- Paste/drag images directly
- Give URLs for API docs (allowlist with `/permissions`)

### 5. Subagent model routing

- **Haiku** → Fast lookups, codebase exploration, doc updates
- **Sonnet** → General coding, reviews, bug fixes
- **Opus** → Architecture decisions, complex multi-step reasoning

### 6. Git worktrees for isolation

`/batch` uses git worktrees automatically. For manual use:
```bash
git worktree add ../feature-branch feature-branch
cd ../feature-branch && claude
```

### 7. Loop for monitoring

```
/loop 5m check if the deploy finished and tests pass
```

### 8. Session continuation for complex work

```bash
# Start work
claude -p "Begin refactoring auth module" --output-format json > session.json

# Check session ID
cat session.json | jq -r '.session_id'

# Continue later
claude -p "Continue with the database layer" --resume "$(cat session.json | jq -r '.session_id')"
```

### 9. Exclude irrelevant CLAUDE.md in monorepos

```json
// .claude/settings.json
{
  "claudeMdExcludes": ["packages/other-team/**"]
}
```

### 10. Debug Claude Code itself

If Claude is behaving unexpectedly:
```
/debug Claude keeps ignoring my CLAUDE.md rules about testing
```

This reads the session debug log and analyzes what's happening.

---

## Quick Reference Card

| Action | Command |
|---|---|
| Start Claude Code | `claude` |
| Headless mode | `claude -p "prompt"` |
| Plan mode | `claude --permission-mode plan` |
| Bypass permissions | `claude --permission-mode bypassPermissions` |
| Switch model | `/model` |
| Check cost | `/cost` |
| Clear context | `/clear` |
| Compact context | `/compact [focus]` |
| Rename session | `/rename` |
| Resume session | `/resume` or `claude --resume <id>` |
| Init CLAUDE.md | `/init` |
| Manage subagents | `/agents` |
| Manage MCP | `/mcp` |
| View context | `/context` |
| Manage permissions | `/permissions` |
| Batch changes | `/batch <instruction>` |
| Debug session | `/debug [issue]` |
| Loop task | `/loop [interval] <prompt>` |
| Simplify code | `/simplify [focus]` |
| Status line | `/statusline` |

---

*This guide is the definitive reference for Claude Code on this system. Update as new features land.*

## Related

- [[Overnight]]
- [[Summary]]
- [[2026-03-14]]
