---
title: instruction-catalog
created: '2026-03-19'
updated: '2026-03-19'
type: research
status: active
source: unknown
tags: []
wiki_id: research/instruction-catalog
imported_from: vault/Research/instruction-catalog.md
imported_at: '2026-04-04T00:23:57.162Z'
summary: ''
---
# instruction-catalog — Latent Capability Activators for Claude Code

**URL**: https://github.com/manolitnora/instruction-catalog  
**What it is**: 30 one-paragraph CLAUDE.md instructions that activate behaviors Claude Code already has but doesn't do by default.  
**Install**: `git clone` + `./install.sh` or paste `all-in-one.md` directly

## Core Insight

Claude Code has vast latent capabilities — self-review, codebase mapping, dependency tracing, pattern matching. It just doesn't activate them proactively. These instructions are **activators**, not plugins. No code, no dependencies. Just text in CLAUDE.md.

## Catalog (30 instructions across 9 categories)

### Memory & Documentation
- **session-scribe**: Auto-documents SOPs, dead ends, lessons, key commands on every turn. Memory decay via `last_used`.
- **feedback-loop**: Saves every user correction to memory. Same mistake never happens twice.
- **codebase-tour**: Maps architecture on first visit to new project. Saves to memory.

### Code Quality  
- **auto-reviewer**: Self-reviews code before presenting it. Catches bugs silently.
- **refactor-guard**: Traces all callers before modifying a function. Prevents breaking changes.
- **dependency-check**: Searches codebase for existing solutions before adding packages.
- **pattern-matcher**: Finds existing patterns before creating new code.
- **dead-code-finder**: Removes orphaned imports/functions after refactoring.
- **type-tightener**: Narrows `any` and broad TypeScript types when touching TS code.

### Debugging
- **bug-hunter**: Checks git blame + recent changes first on test failure. Finds regressions.
- **error-pattern**: Searches memory for same error string. Surfaces past fixes.
- **flaky-detector**: Reruns failed tests before debugging. Flags intermittent failures as flaky.

### Context
- **test-first-reader**: Reads tests before implementation to understand intent.
- **context-builder**: Silently reads related files and git history before starting work.

### Performance
- **n-plus-one**: Spots database queries inside loops. Suggests batching.
- **bundle-watcher**: Warns on heavy new packages. Suggests lightweight alternatives.

### Git Workflow
- **branch-namer**: Suggests descriptive branch names from task context.
- **pr-describer**: Auto-generates PR descriptions from diffs.
- **conflict-resolver**: Reads both sides of merge conflicts before resolving.

### Documentation
- **changelog-writer**: Release notes from git history, grouped by Added/Changed/Fixed/Removed.
- **api-documenter**: Updates API docs when endpoints change. Flags undocumented endpoints.

### Team
- **standup-writer**: Generates daily standup updates for Slack/Teams.
- **handoff-note**: Context notes so next person picks up with zero ramp-up.

### Safety & Governance
- **constitution**: Hard rules. Never delete prod data, commit secrets, force push main.
- **audit-trail**: Logs every destructive action with timestamp + reason.
- **approval-gate**: Requires explicit "yes" before destructive operations.
- **scope-lock**: Prevents modifications outside current task scope. Keeps PRs focused.
- **commit-guard**: Blocks secrets, large files, .env from entering git.
- **blast-radius**: Estimates impact before modifying shared code. Warns on high-impact changes.

### Meta
- **confidence-signal**: Labels guesses as guesses. Doesn't present uncertainty as fact.
- **assumption-checker**: Lists assumptions before acting on ambiguous tasks.
- **retry-strategy**: Switches approach after 2 failures instead of retrying same thing.

## All-in-One Block (installed below)

The all-in-one compresses all 30 into one block, ~82% fewer tokens. Applied to CLAUDE.md.

## Application to OpenClaw Agents

These principles should be implemented in **SOUL.md and SKILL.md files**:

### Already doing:
- `session-scribe` → memory/YYYY-MM-DD.md (but could be more granular)
- `confidence-signal` → explicitly in Researcher SOUL.md
- `assumption-checker` → ad-hoc, not systematic

### Should implement:
- `feedback-loop` → When Trajan corrects an agent, auto-append correction to SOUL.md
- `retry-strategy` → 2-failure switch is explicit: agents often retry same broken approach
- `blast-radius` → Before any agent edits shared config (openclaw.json, CLAUDE.md), estimate impact
- `scope-lock` → Orchestrator should enforce: each spawned sub-agent stays in its domain
- `constitution` → Exists as Red Lines in AGENTS.md but not enforced in dispatch pipeline

## Status
- Vault documented
- All-in-one block applied to CLAUDE.md (see implementation notes)
