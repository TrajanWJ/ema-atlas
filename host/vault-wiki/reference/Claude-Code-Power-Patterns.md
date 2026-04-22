---
title: 'Claude Code Power Patterns: Scored Catalog'
type: knowledge
created: '2026-03-24'
confidence: 0.86
tags:
  - claude-code
  - power-user
  - agent-patterns
  - hooks
  - MCP
  - orchestration
  - productivity
summary: >-
  60+ scored Claude Code patterns for OpenClaw+vault setup. Coolness×0.4 +
  Applicability×0.6. Tier 1 items have full implementation steps.
wiki_id: reference/Claude-Code-Power-Patterns
imported_from: vault/Reference/Claude-Code-Power-Patterns.md
imported_at: '2026-04-04T00:23:56.915Z'
---

# Claude Code Power Patterns: Scored Catalog

*Scoring: Coolness (C, 1-10) × 0.4 + Applicability to our OpenClaw+Claude Code+vault setup (A, 1-10) × 0.6 = Combined*

Related: [[OpenClaw]], [[Claude Code]], [[Hermes Agent]]

---

## Tier 1: Must Implement (Combined 8+)

### 1. PreToolUse Hooks for Deterministic Enforcement
**C:8 × A:10 = 8.8** | *Most critical pattern in the ecosystem*

CLAUDE.md gives ~80% compliance. PreToolUse hooks give ~100% compliance. This is the backbone of any reliable Claude Code setup.

**Implementation for our OpenClaw setup:**
```bash
# ~/.claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/safety-check.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
# ~/.claude/hooks/safety-check.sh
#!/bin/bash
COMMAND=$(cat | jq -r '.tool_input.command')

# Block destructive operations
if echo "$COMMAND" | grep -qE 'rm -rf|rm -r /|dd if=|mkfs|> /dev'; then
  jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "Destructive command blocked. Use trash instead of rm."}}'
  exit 0
fi
exit 0
```

**For vault integration:** Add a hook that logs all file writes to vault operations log.

**Warning:** Claude has been observed disabling hooks when unmonitored. Layer multiple hooks + verify integrity with `ls -la ~/.claude/hooks/` periodically.

---

### 2. CLAUDE.md Under 200 Lines + Modular Rules
**C:6 × A:10 = 8.4** | *Counterintuitive but validated by community + official docs*

Long CLAUDE.md hurts adherence. 50-60 lines often beats 300-line versions. Use `.claude/rules/` for scoped rules that only load when matching files are opened.

**Implementation:**
```
~/.claude/CLAUDE.md           # Global personal: ≤60 lines, core preferences only
.claude/CLAUDE.md             # Project: ≤100 lines, project specifics
.claude/rules/python.md       # Only loads when editing .py files
.claude/rules/security.md     # Only loads when editing auth/crypto files
```

```markdown
# .claude/rules/python.md
---
globs: "**/*.py"
---
- Use type hints always
- Prefer dataclasses over dicts for structured data
- Run `pytest -x` before marking any task complete
```

**Import syntax for vault:**
```markdown
# In ~/.claude/CLAUDE.md
@~/.claude/my-vault-context.md  # Local file, not committed
```

---

### 3. MCP Server Tool Conversion for Critical Behaviors
**C:8 × A:9 = 8.6** | *99% invocation vs 50% as skills — validated by multiple community sources*

Any MUST-DO behavior that's in a skill should become an MCP server tool. The invocation rate difference is dramatic and consistently reported.

**Implementation for vault integration:**
Create a simple MCP server wrapping vault operations:
```bash
claude mcp add vault-ops --transport stdio -- npx -y @modelcontextprotocol/server-filesystem ~/vault
```

Or for custom vault MCP, create a Node.js wrapper around `qmd` commands:
```javascript
// ~/.claude/mcp-servers/vault.js — exposes qmd search, update, embed as MCP tools
```

**Priority MCPs for our setup:**
1. Filesystem MCP → vault write/read
2. Git MCP → repo operations
3. GitHub MCP → PR/issue automation
4. Obsidian MCP (community, check trust) → richer vault integration

---

### 4. Subagent Persistent Memory for Research Agent
**C:9 × A:8 = 8.6** | *Subagents can accumulate cross-session learnings independently*

Each custom subagent can have its own persistent memory directory. This enables genuine specialization over time — the researcher subagent learns codebase patterns, the ops subagent learns infrastructure quirks.

**Implementation:**
```markdown
---
# ~/.claude/agents/researcher.md
description: "Deep research specialist. Use for any investigation requiring web search, source evaluation, or multi-step research tasks."
model: sonnet
memory: user
tools:
  - Read
  - Bash
  - WebFetch
  - WebSearch
---

You are a deep research specialist with access to the Obsidian vault at ~/vault/.
Before starting any research, check the vault with: bash ~/bin/antfly-search.sh "{topic}"
After completing research, write findings to ~/vault/Research/ with proper frontmatter.
Run: flock -n /tmp/qmd.lock qmd update && flock -n /tmp/qmd.lock qmd embed
```

---

### 5. Ralph Wiggum Autonomous Loop Pattern
**C:10 × A:8 = 8.8** | *Most creative orchestration pattern; highest coolness in ecosystem*

Autonomous agent loop: run Claude until task marked complete. Implementations include safety circuits (rate limiting, circuit breakers, max iterations, exit detection).

**Implementation sketch for our setup:**
```bash
#!/bin/bash
# ~/.local/bin/ralph-loop.sh
MAX_ITERATIONS=20
DELAY=30  # seconds between iterations
PROMPT_FILE="$1"
ITERATION=0

while [[ $ITERATION -lt $MAX_ITERATIONS ]]; do
  RESULT=$(claude --print --permission-mode bypassPermissions -f "$PROMPT_FILE")
  
  # Check for completion signal
  if echo "$RESULT" | grep -qi "TASK_COMPLETE"; then
    echo "Task completed after $ITERATION iterations"
    break
  fi
  
  ITERATION=$((ITERATION + 1))
  echo "Iteration $ITERATION/$MAX_ITERATIONS"
  sleep $DELAY
done
```

**Prompt file pattern:**
```markdown
# task.md
## Task
[your task here]

## Completion Criteria
When the task is complete, output exactly: TASK_COMPLETE

## Current State
[updated by Claude each iteration with progress]
```

**Warning:** Needs robust exit detection and API rate limiting. Don't run without max iterations cap.

---

### 6. Context Compaction Strategy (Proactive at 40-50%)
**C:5 × A:10 = 8.0** | *Simple but validated as critical by community*

Don't wait for forced compaction. Quality degrades sharply past 70%. Many users report Anthropic's auto-compact loses critical context.

**Implementation:**
- Monitor with custom statusline showing token usage (see ykdojo's context-bar.sh script)
- Compact manually at 40-50% via `/compact`
- Before ending sessions, write `context_next_session.md` with handoff state
- Hook pattern: `PreCompact` hook to save critical state before compaction fires

```bash
# ~/.claude/hooks/pre-compact.sh
#!/bin/bash
# Save working state before compaction
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/.claude/compact-states
echo "$(cat)" > ~/.claude/compact-states/state-$TIMESTAMP.json
exit 0
```

---

### 7. Claude Hub GitHub Actions Integration
**C:7 × A:9 = 8.2** | *Automate PR review + issue triage without manual trigger*

Use `@claude` in PR comments or auto-trigger on PR open. Respects CLAUDE.md. Runs on GitHub's infrastructure (no local resources).

**Implementation:**
```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review this PR for code quality, security issues, and adherence to project standards in CLAUDE.md. Post findings as inline review comments."
          claude_args: "--max-turns 5"
```

---

## Tier 2: High Value (Combined 6-8)

### 8. claude-esp: Hidden Output Viewer
**C:10 × A:6 = 7.6** | Novel, genuinely useful for debugging complex agent behavior

Go-based TUI streaming Claude's hidden output (thinking, tool calls, subagents) to separate terminal. Indispensable for debugging why an agent did something unexpected.

*Implementation sketch:* Install `claude-esp`, run in separate terminal alongside Claude sessions.

---

### 9. Git Worktrees + Parallel Claude Instances
**C:7 × A:8 = 7.6** | Run multiple Claude instances on different branches simultaneously

```bash
# Create worktrees for parallel work
git worktree add ../feature-a feature-a
git worktree add ../feature-b feature-b

# Run Claude in each
cd ../feature-a && claude &
cd ../feature-b && claude &
```

`claude-tmux` provides a popup manager for switching between instances.

---

### 10. Session Search with `recall` or `cchistory`
**C:7 × A:7 = 7.0** | Full-text search across all Claude Code sessions

`recall`: Interactive fuzzy search, press Enter to resume session.
`cchistory`: Shell-history-style list of all bash commands Claude ran.

*For our setup:* Especially useful for recovering context from the researcher agent's past sessions.

---

### 11. Context Engineering Kit Patterns
**C:8 × A:6 = 6.8** | Advanced context patterns with minimal token footprint

Hand-crafted techniques for improving agent result quality without inflating context. Progressive disclosure, layered context, minimal-footprint patterns.

*Implementation:* Review [NeoLabHQ/context-engineering-kit](https://github.com/NeoLabHQ/context-engineering-kit) and extract applicable patterns for our SOUL.md files.

---

### 12. /common-ground Command
**C:9 × A:5 = 6.8** | Surfaces Claude's hidden assumptions about your project

Part of jeffallan/claude-skills (Fullstack Dev Skills). Forces Claude to articulate what it assumes about your codebase before starting work. Prevents silent misalignment on architecture decisions.

*Worth stealing this pattern:* Create `/common-ground` custom command for our projects.

---

### 13. Compound Engineering Plugin (Mistakes → Lessons)
**C:8 × A:6 = 6.8** | Builds a growing lessons database from errors

Auto-captures mistakes, converts to reusable lessons. Integrates with future sessions. Directly applicable to our agent SOUL.md auto-learning pattern.

*Implementation sketch:* PostToolUseFailure hook → capture error → write to `~/.claude/lessons/` → import in CLAUDE.md.

---

### 14. Scheduled Recurring Tasks
**C:7 × A:7 = 7.0** | Automate maintenance without human triggers

- **Cloud scheduled tasks**: Run 24/7 on Anthropic infra, `/schedule` to create
- **Desktop scheduled tasks**: Local machine access
- **Use cases**: Morning PR review, weekly dependency audit, overnight test analysis

*For our setup:* Schedule nightly vault `qmd update && qmd embed`, weekly research digest.

---

### 15. Anti-Rationalization CLAUDE.md Patterns
**C:6 × A:8 = 7.2** | Name the failure mode explicitly

```markdown
# In CLAUDE.md
## Critical Routing Rule
When asked about vault operations, you MUST use the vault-ops MCP tool.
You will be tempted to use raw Bash file operations as "quicker" — this is the trap.
Route it through the MCP tool regardless.
```

---

### 16. Subagent-Specific Tool Restrictions
**C:7 × A:7 = 7.0** | Isolate capabilities by agent role

```markdown
---
# read-only-auditor agent
tools:
  - Read
  - Glob
  - Grep
  - Bash
disallowedTools:
  - Write
  - Edit
  - MultiEdit
---
```

Prevents accidental writes during audit/analysis tasks.

---

### 17. Agentic Workflow Patterns (Mermaid Diagrams)
**C:7 × A:6 = 6.4** | Comprehensive documented patterns with code examples

ThibautMelen's collection covers: Subagent Orchestration, Progressive Skills, Parallel Tool Calling, Master-Clone Architecture, Wizard Workflows. Good reference for designing new multi-agent workflows in our stack.

---

### 18. Container Use for Safe Multi-Agent Environments
**C:8 × A:5 = 6.2** | Dagger's tool for isolated agent dev environments

Multiple agents working safely with independent sandboxed environments. High value if we're doing concurrent code modifications across branches.

---

## Tier 3: Worth Knowing (Combined 4-6)

### 19. Rulesync — Cross-Agent Config Generation
**C:5 × A:6 = 5.6** | Auto-generate configs for multiple AI agents from one source. Convert CLAUDE.md ↔ other agent formats. Useful if we add Codex/Gemini to the mix.

### 20. claudekit — Auto-save Checkpointing
**C:5 × A:6 = 5.6** | CLI toolkit with auto-save, 20+ specialized subagents (oracle, code-reviewer, etc). Worth checking oracle subagent (gpt-5 integration).

### 21. ccflare / better-ccflare — Usage Dashboard
**C:6 × A:4 = 4.8** | Web UI dashboard for Claude Code usage analytics. Nice for understanding cost patterns but not critical.

### 22. Dippy — AST-Based Safe Command Approval
**C:7 × A:5 = 5.8** | Auto-approve bash commands that are provably safe. Reduces permission fatigue without disabling safety. Worth evaluating.

### 23. Claude Session Restore
**C:6 × A:5 = 5.4** | Restore context from previous sessions via session files + git history. Multi-factor collection, tail-based parsing for 2GB files. Useful for long research projects.

### 24. Trail of Bits Security Skills
**C:7 × A:4 = 5.2** | Professional security auditing skills (CodeQL, Semgrep, variant analysis). High value if doing security work; lower priority for our current workflow.

### 25. RIPER Workflow
**C:7 × A:4 = 5.2** | Research/Innovate/Plan/Execute/Review phase separation. Branch-aware memory. Good for solo dev discipline; less critical for our orchestrated setup.

### 26. AB Method
**C:7 × A:4 = 5.2** | Spec-driven workflow for large problems. Principled decomposition. Good methodology reference.

### 27. Claude CodePro (Spec-Driven Dev)
**C:6 × A:5 = 5.4** | TDD enforcement, cross-session memory, semantic search, quality hooks. Heavyweight but feature-complete.

### 28. Task Master (AI-driven task management)
**C:6 × A:4 = 4.8** | AI-driven development task management. Jira-like but AI-native. Consider for complex multi-sprint projects.

### 29. ccexp — TUI Config Explorer
**C:5 × A:5 = 5.0** | Interactive CLI for discovering/managing Claude Code config files and slash commands. Good for setup/audit.

### 30. ContextKit (4-Phase Planning)
**C:6 × A:4 = 4.8** | Transform Claude into proactive development partner via planning methodology. Production-ready-first approach.

---

## Tier 4: Low Value (<4 combined)

- **Book Factory** (publishing pipeline) — C:8 × A:1 = 3.8 — Creative but inapplicable
- **Mountaineering Skills** — C:9 × A:1 = 3.8 — Impressive demo; zero applicability
- **Britfix** (British spellings) — C:3 × A:1 = 1.8 — Niche
- **Web Assets Generator** — C:5 × A:2 = 3.2 — Specific to web frontend
- **Laravel TALL Stack Kit** — C:4 × A:1 = 2.2 — Framework-specific
- **viberank** (usage leaderboard) — C:4 × A:1 = 2.2 — Social only
- **Claudix VSCode Extension** — C:4 × A:2 = 2.8 — We use terminal, not VSCode

---

## Special Section: CLAUDE.md Patterns Worth Adopting

```markdown
# Pattern: Anti-rationalization block
## Critical Rules
When [specific trigger], you MUST [specific action].
You will be tempted to [common shortcut]. This is the trap. [required action] regardless.

# Pattern: Affirmative routing
ALWAYS use the vault-ops MCP tool for vault operations.
ALWAYS run qmd update after writing to ~/vault/.

# Pattern: Size discipline
[Keep total under 200 lines. Import heavy context via @path syntax.]
@~/.claude/vault-context.md  # project-specific, not committed

# Pattern: Specificity
- Run `flock -n /tmp/qmd.lock qmd update` after vault writes (not just "update vault")
- Use trash not rm (not just "don't delete files")
```

---

## Special Section: Custom Slash Commands We Should Add

1. **`/vault-save [topic]`** — Save current conversation context to vault with proper frontmatter
2. **`/vault-search [query]`** — Run antfly-search.sh and qmd search, show results in terminal
3. **`/checkpoint`** — Write current state to `context_next_session.md` before ending session
4. **`/common-ground`** — Force Claude to articulate assumptions about current project
5. **`/sprint [task]`** — Ralph-style focused sprint with completion criteria
6. **`/agents-status`** — Show all running subagents and their states
7. **`/review-pr [pr#]`** — Structured PR review with security focus

---

## Special Section: Overhyped Stuff

**"Just write better CLAUDE.md"** — Overhyped. Better writing helps marginally. Hooks are what actually work. Community consensus is clear.

**Massive skill collections (135 agents, etc.)** — Impressive but often redundant. Most useful workflows need 5-10 well-crafted skills, not 135 generic ones. Quality > quantity validated repeatedly.

**SkillKit Marketplace (15,000 skills)** — Signal-to-noise is low. Most are auto-generated or low quality. The hesreallyhim curation approach is more useful than browsing 15K options.

**System prompt patching** — Technically possible but fragile against updates and risks breaking normal behavior. Low upside.

**Ralph Wiggum without safety circuits** — The technique itself is sound; the danger is running it without proper exit detection, rate limiting, and max iterations. Several people have burned significant API credits.

---

## Special Section: MCP Integrations Worth Evaluating

| MCP | Use Case | Priority | Notes |
|-----|----------|----------|-------|
| Filesystem | Vault read/write | HIGH | Official, trusted |
| Git | Repo operations | HIGH | Official, trusted |
| GitHub | PR/issue automation | HIGH | Official, trusted |
| Obsidian | Richer vault integration | MEDIUM | Check community trust before installing |
| Sentry | Error monitoring | MEDIUM | Good for production work |
| Slack | Team notification | LOW | Less relevant for solo setup |
| PostgreSQL | Database queries | LOW | When needed |

---

## Special Section: Agent Orchestration Patterns for Our Setup

**Current OpenClaw structure:** Dispatcher → Researcher + Right Hand + Coder + Ops agents

**Recommended additions based on research:**

1. **Enforcer hooks** on orchestrator (block direct file writes, force delegation)
2. **Researcher subagent persistent memory** — accumulate vault knowledge cross-session
3. **Background subagent pattern** — spawn read-only exploration agents for context gathering without polluting main context
4. **Vault write hook** — PostToolUse hook on Write events to auto-run `qmd update`

**Pattern: Orchestrator + Specialist topology**
```
Orchestrator (main session)
├── Explorer (Haiku, read-only, fast)
├── Researcher (Sonnet, vault-integrated, persistent memory)
├── Coder (Sonnet, full tools, isolated context)
└── Reviewer (Sonnet, read-only, security focus)
```

---

## Special Section: Vault/Knowledge Base Integration Ideas

1. **Auto-embed on save**: PostToolUse hook on Write events in ~/vault/ → run `qmd embed` automatically
2. **Research agent skills**: Skill that wraps antfly-search.sh + qmd search as Claude tools
3. **Session-to-vault pipeline**: `/checkpoint` command that writes conversation summary to vault
4. **MCP filesystem for vault**: claude mcp add vault --transport stdio -- npx @modelcontextprotocol/server-filesystem ~/vault
5. **Context injection from vault**: CLAUDE.md imports from vault reference notes via @path syntax
6. **Cross-agent knowledge sharing**: Agents write discoveries to `~/vault/Intelligence Notes/` instead of siloed memory

---

*Total items cataloged: 64*
*Tier 1 (Must Implement): 7 items*
*Tier 2 (High Value): 11 items*
*Tier 3 (Worth Knowing): 12 items*
*Tier 4 (Low Value): 7 items*
*Special section items: 27 additional patterns*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
