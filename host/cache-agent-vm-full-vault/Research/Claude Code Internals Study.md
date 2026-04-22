---
title: "Claude Code Internals Study"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [knowledge, openclaw, prompts, research, security, skills]
summary: "The official Claude Code repository (now at `anthropics/claude-code`) contains not just the CLI tool but a rich **plugin ecosystem** with agents, comm"
---
# Claude Code Internals Study

> **Source:** [anthropics/claude-code](https://github.com/anthropics/claude-code) (official repo, previously shareAI-lab/learn-claude-code)
> **Date:** 2026-03-16
> **Purpose:** Extract implementation patterns for our [[OpenClaw]] multi-agent system

## Overview

The official Claude Code repository (now at `anthropics/claude-code`) contains not just the CLI tool but a rich **plugin ecosystem** with agents, commands, skills, and hooks. The plugin system is the most relevant part for our work — it defines patterns for:
- Multi-agent orchestration (feature-dev plugin)
- Code review pipelines (pr-review-toolkit)
- Hook-based automation (hookify)
- Agent development best practices (plugin-dev)

## Pattern 1: Feature Development Multi-Agent Pipeline

The `feature-dev` plugin implements a **5-phase multi-agent workflow** for building features:

### Phase Structure
```
Phase 1: Discovery      → Understand what needs to be built
Phase 2: Exploration     → 2-3 code-explorer agents analyze codebase in parallel
Phase 3: Clarification   → Ask ALL questions before designing (critical phase)
Phase 4: Architecture    → 2-3 code-architect agents propose different approaches
Phase 5: Implementation  → Build based on chosen architecture
```

### Agent Roles

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| `code-explorer` | Sonnet | Glob, Grep, Read, WebFetch | Trace execution paths, map architecture, find patterns |
| `code-architect` | Sonnet | Glob, Grep, Read, WebFetch | Design implementation blueprints with file:line specificity |
| `code-reviewer` | Sonnet | Glob, Grep, Read, WebFetch | Review PRs for quality, security, patterns |

### Key Design Decisions
- **Explorers return file lists** — "include a list of 5-10 key files to read". The orchestrator then reads those files to build context before proceeding. This avoids bloating agent context.
- **Architects make confident choices** — "Make decisive choices - pick one approach and commit." No wishy-washy "here are 3 options." The architect recommends one.
- **Clarification is mandatory** — Phase 3 explicitly says "DO NOT SKIP." All ambiguities resolved before design begins.
- **[[Diverge]] then converge** — Multiple agents explore different angles, then results are synthesized.

**Relevance to us:** Our specialist dispatch is ad-hoc. The feature-dev pattern of Discovery → Exploration → Clarification → Architecture → Implementation is more disciplined. We should adopt the "explorers return file lists, orchestrator reads files" pattern — it prevents subagents from accumulating too much context.

## Pattern 2: Agent Definition Format (Frontmatter + System Prompt)

Claude Code plugins define agents as Markdown files with YAML frontmatter:

```yaml
---
name: code-reviewer
description: Use this agent when [triggering conditions]...
  <example>
  Context: [scenario]
  user: "[request]"
  assistant: "[response]"
  <commentary>[why this agent triggers]</commentary>
  </example>
model: sonnet
color: green
tools: ["Read", "Write", "Grep", "Glob"]
---

You are [role]. Your core responsibilities: ...
```

### Critical Fields
- **`description`** — The most important field. Defines triggering conditions with concrete examples. Uses `<example>` blocks with `<commentary>` explaining why.
- **`tools`** — Explicit tool allow-list per agent. Agents only get the tools they need.
- **`model`** — Can specify different models per agent (e.g., Sonnet for fast analysis, Opus for complex work).
- **`color`** — Visual identifier in the UI.

**Relevance to us:** Our [[agent roster]] in AGENTS.md lists skills but doesn't define triggering conditions with examples. The `<example>` + `<commentary>` pattern would make routing more reliable. Also, our agents all share the same tool set — per-agent tool filtering would reduce error surface.

## Pattern 3: Hook-Based Automation (Event System)

The `hookify` plugin implements an event-driven automation system:

### Hook Events
| Event | When | Use For |
|-------|------|---------|
| `PreToolUse` | Before tool execution | Validate operations, block dangerous commands |
| `PostToolUse` | After tool execution | React to results, log changes |
| `Stop` | Agent wants to stop | Enforce completion standards |
| `SubagentStop` | Subagent wants to stop | Quality gate for subagent output |
| `SessionStart` | Session begins | Load project context |
| `SessionEnd` | Session ends | Cleanup, persist state |
| `UserPromptSubmit` | User sends prompt | Input validation, routing |
| `PreCompact` | Before context compaction | Preserve critical info |
| `Notification` | Event notification | Alert routing |

### Hook Types
1. **Prompt-based** (recommended) — LLM evaluates whether to allow/block
2. **Command-based** — Bash scripts for deterministic checks

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "prompt",
        "prompt": "Evaluate if this tool use is appropriate: $TOOL_INPUT",
        "timeout": 30
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh",
        "timeout": 60
      }
    ]
  }
}
```

**Relevance to us:** Our system has no hook/event system. We could implement:
- `PreDispatch` — validate before spawning a subagent (check performance history, apply rate limits)
- `PostDispatch` — verify subagent output meets contract
- `PreCompact` — save critical context before LCM compaction
- `SessionStart` — our startup sequence in AGENTS.md is essentially this, but informal

## Pattern 4: Agent System Prompt Design Patterns

The `plugin-dev/skills/agent-development` skill documents proven patterns:

### Analysis Agent Template
```markdown
You are an expert [domain] analyzer...

**Analysis Process:**
1. Gather Context — Read [what]
2. Initial Scan — Identify obvious [issues]
3. Deep Analysis — Examine [specific aspects]
4. Synthesize Findings — Group related issues
5. Prioritize — Rank by [severity]
6. Generate Report — Format per template

**Quality Standards:**
- Every finding includes file:line reference
- Issues categorized by severity
- Recommendations are specific and actionable

**Edge Cases:**
- No issues found: Positive feedback
- Too many issues: Group and prioritize top 10
- Unclear code: Request clarification
```

### Key Prompt Design Principles
1. **Explicit process steps** — numbered, concrete actions (not vague "analyze the code")
2. **Quality standards section** — defines what "good output" looks like
3. **Edge case handling** — tells the agent what to do in degenerate cases
4. **Output format specification** — exact structure expected
5. **Tool list is explicit** — agents only see tools they should use

**Relevance to us:** Our specialist prompts (in `sessions_spawn` calls) are ad-hoc. Following this template would make outputs more consistent. The edge case section is particularly valuable — our agents sometimes return empty or unhelpful results without knowing what to do instead.

## Pattern 5: PR Review Multi-Agent Pipeline

The `pr-review-toolkit` plugin spawns specialized review agents:

| Agent | Focus |
|-------|-------|
| `code-reviewer` | General quality review |
| `code-simplifier` | Find unnecessary complexity |
| `comment-analyzer` | Analyze PR comments for patterns |
| `pr-test-analyzer` | Evaluate test coverage |
| `silent-failure-hunter` | Find error handling gaps |
| `type-design-analyzer` | Review type system usage |

Each agent has a narrow, well-defined scope. The orchestrator synthesizes their findings.

**Relevance to us:** When we do code review (via Coder or GitHub skill), we dispatch one agent. Splitting into specialized reviewers (quality, tests, security, simplicity) would catch more issues. The "silent-failure-hunter" concept — an agent specifically looking for missing error handling — is clever.

## Actionable Takeaways

1. **Adopt the 5-phase feature development workflow** — Discovery → Exploration → Clarification → Architecture → Implementation. Especially the "don't skip clarification" rule.

2. **Make agents return file lists, not file contents** — Subagents identify important files, orchestrator reads them. Prevents context bloat in subagent conversations.

3. **Add triggering examples to agent definitions** — `<example>` + `<commentary>` blocks for each specialist, so routing decisions are grounded in concrete scenarios.

4. **Implement tool filtering per specialist** — Vault Keeper gets vault tools only. Coder gets file + exec tools. Security gets scanning tools. Reduces error surface and confusion.

5. **Add edge case handling to all agent prompts** — What to do when there's nothing to report, too many results, or ambiguous input. Prevents empty/unhelpful returns.

6. **Consider hook events for our dispatch protocol** — PreDispatch validation, PostDispatch verification, PreCompact preservation.

## Links

- [[DeerFlow Architecture Study]] — DeerFlow's middleware chain is similar to hooks
- [[Context-Gateway Evaluation]] — PreCompact hook relates to context management
- [[Self-Critique and Auto-Evolution Design]] — our existing agent improvement system
