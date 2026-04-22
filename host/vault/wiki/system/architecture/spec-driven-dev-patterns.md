---
title: Spec-Driven Development Patterns
type: knowledge
domain: agent-architecture
tags:
  - spec
  - workflow
  - gh-actions
  - worktree
  - implementation-pipeline
created: '2026-03-19'
confidence: 0.8
source: 'agent:coder'
summary: >-
  Spec-kit constitution→spec→plan→tasks→implement pipeline, gh-aw GitHub Actions
  + MCP workflows, and wade worktree-per-issue patterns applied to our issue
  pipeline.
wiki_id: system/architecture/spec-driven-dev-patterns
imported_from: vault/Architecture/spec-driven-dev-patterns.md
imported_at: '2026-04-04T00:23:56.796Z'
---

# Spec-Driven Development Patterns

## Overview

Three emerging tools define a converging spec-driven implementation philosophy:

| Tool | Origin | Core Mechanism |
|------|--------|----------------|
| `spec-kit` | github/spec-kit | Constitution → Spec → Plan → Tasks → Implement |
| `gh-aw` | github/gh-aw | Markdown-defined workflows in GitHub Actions + MCP Gateway |
| `wade` | ivanviragine/wade | Worktree-per-issue, parallel batch execution |

## Pattern 1: spec-kit — Constitution-Driven Implementation

### The Pipeline

```
CONSTITUTION.md          (invariants: style, security, architecture rules)
    ↓
SPEC.md                  (what to build: requirements, constraints, API contracts)
    ↓
PLAN.md                  (how to build it: approach, tradeoffs, tech choices)
    ↓
TASKS.md                 (atomic executable tasks from the plan)
    ↓
implement task #1        (agent implements one task)
implement task #2        (parallel or sequential)
    ...
```

### Key Insight

The constitution is immutable — it's the constraint layer that prevents each implementation from re-litigating fundamental decisions. SPEC is per-feature. Plan and Tasks are generated artifacts.

### Application to Our Pipeline

When Coder receives a GitHub issue via gh-issues:
1. Check for existing `CONSTITUTION.md` in the repo
2. If none, generate one from the codebase (style inference + explicit rules)
3. Generate SPEC from the issue
4. Generate PLAN from SPEC + CONSTITUTION
5. Break PLAN into atomic TASKS
6. Implement each task (parallelizable with wade)

This prevents the common failure: Claude implements issue #47 in a style that violates the decisions made for issue #23.

## Pattern 2: gh-aw — GitHub Actions + MCP Gateway Workflows

### Architecture

```
GitHub Issue/PR created
    ↓
.github/workflows/agentic.yml triggered
    ↓
GitHub Actions runner
    ↓ MCP Gateway (gh-aw provides this)
Agent (Claude Code, Codex, etc.)
    ↓
Actions: comment, label, create PR, run checks, deploy
```

### Key Features

- **Markdown-defined agent workflows** — workflows live in `.github/agentic/` as markdown
- **MCP Gateway** — agents call GitHub API via MCP tools (no API key juggling in agent context)
- **Firewall** — gh-aw ships an action firewall: agents can only call whitelisted GitHub API endpoints

### Our Integration Point

gh-aw is the missing bridge between our dispatch system and GitHub. Currently:
- Right Hand → spawns Coder → Coder does git ops manually
- With gh-aw: Right Hand → triggers gh-aw workflow → workflow spawns agent via MCP → agent has pre-authorized GitHub access

Use gh-aw when:
- The trigger is a GitHub event (issue opened, PR ready for review)
- The agent needs GitHub API access (labels, comments, merges)
- You want an audit trail in the GitHub Actions log

Don't use gh-aw when:
- Task is not GitHub-coupled (use our dispatch.sh instead)
- You need multi-repo coordination (dispatch is better)

## Pattern 3: wade — Worktree-Per-Issue

### How It Works

```bash
wade start 47          # creates ~/worktrees/issue-47 from main
wade start 48          # creates ~/worktrees/issue-48 from main (parallel)
wade start 49          # ...

# Each worktree is isolated — no shared state
# Agent works in its worktree independently

wade batch             # run all open issues in parallel
wade pr 47             # create PR for issue 47 from its worktree
```

### Why Worktrees Beat Branches

| Problem | Branch approach | Worktree approach |
|---------|-----------------|-------------------|
| Parallel work | Stash/checkout dance | Separate directories |
| Context isolation | Shared working tree | Each agent has its own |
| Conflict risk | High (shared files) | Zero until PR merge |
| Agent spawning | Complex | `cd worktrees/issue-N && claude-code ...` |

### Application to Our Pipeline

Current flow (fragile):
```
Coder spawned → works in main workspace → git branch → PR
```

Wade flow (robust):
```
wade start {issue_N} → Coder spawned in worktrees/issue-N → implements → wade pr {N}
```

For the gh-issues agent, wade is the execution harness. Each issue gets an isolated workspace.

## Combined Pattern: Full Issue Implementation Pipeline

```
GitHub Issue #N opened
    │
    ├─ gh-aw triggers workflow
    │
    ├─ wade start N (creates worktree)
    │
    ├─ Read CONSTITUTION.md
    ├─ Generate SPEC.md from issue
    ├─ Generate PLAN.md from spec
    ├─ Break into TASKS.md
    │
    ├─ Coder implements (in worktree, tasks sequentially or parallel)
    │
    ├─ Consensus gate (if required — see [[consensus-loop-pattern]])
    │
    ├─ wade pr N (creates PR)
    │
    └─ gh-aw posts PR link, labels issue as ACTIVE
```

## What to Build First

Priority order for adoption:
1. **wade** — lowest lift, immediate parallelism benefit, no external deps
2. **spec-kit constitution pattern** — standardize CONSTITUTION.md in our main projects
3. **gh-aw** — requires GitHub Actions setup, highest lift but most automation

## Related
- [[consensus-loop-pattern]]
- [[fleet-mem-coordination]]
- [[Agent Roster]]
