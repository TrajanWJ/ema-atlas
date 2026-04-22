---
title: GitHub Agentic Workflows (gh-aw) Evaluation
created: '2026-03-23'
updated: '2026-03-23'
type: research
status: complete
tags:
  - github
  - agentic-workflows
  - ci-cd
  - automation
  - evaluation
related:
  - '[[Self-Critique and Auto-Evolution Design]]'
  - '[[Intelligent Delegation]]'
wiki_id: research/GitHub_Agentic_Workflows_Evaluation
imported_from: vault/Research/GitHub Agentic Workflows Evaluation.md
imported_at: '2026-04-04T00:23:57.032Z'
summary: ''
---

# GitHub Agentic Workflows (gh-aw) Evaluation

## Executive Summary

GitHub Agentic Workflows (gh-aw) is a GitHub Next / Microsoft Research project that adds a "Continuous AI" layer alongside CI/CD. Workflows are defined as **markdown files** with YAML frontmatter — natural language instructions for AI coding agents (Copilot, Claude Code, OpenAI Codex, Gemini CLI) running inside GitHub Actions with defense-in-depth guardrails.

**Verdict:** Impressive guardrails model worth studying. Direct integration into our OpenClaw dispatch system is limited (gh-aw is GitHub Actions-native), but we can adopt their workflow-as-markdown format and safe-outputs pattern for our own orchestration. The biggest value is using gh-aw for automated repo maintenance on GitHub repos we manage.

## How It Works

### Workflow Format: Markdown + YAML Frontmatter

A workflow is a `.md` file with YAML frontmatter between `---` delimiters. The frontmatter declares triggers, permissions, engine, tools, and safe outputs. The markdown body contains natural language instructions for the AI agent.

The `.md` file gets **compiled** into a `.lock.yml` GitHub Actions workflow via `gh aw compile`. The lock file is what actually runs — SHA-pinned actions, resolved imports, hardened permissions. Both files are committed to the repo.

**Key insight:** The markdown body can be edited freely and takes effect on next run without recompilation. Only frontmatter changes (permissions, tools, triggers) require recompilation.

### Compilation & Execution Flow

```
workflow.md → gh aw compile → workflow.lock.yml → GitHub Actions runner
                                                        ↓
                                              Pre-activation (role checks)
                                                        ↓
                                              Activation (content sanitization)
                                                        ↓
                                              Agent execution (read-only, sandboxed)
                                                        ↓
                                              Threat detection (AI analysis)
                                                        ↓
                                              Safe outputs (separate write jobs)
```

## Concrete Workflow Examples

### Example 1: Daily Status Report

```markdown
---
on:
  schedule: daily

permissions:
  contents: read
  issues: read
  pull-requests: read

safe-outputs:
  create-issue:
    title-prefix: "[team-status] "
    labels: [report, daily-status]
    close-older-issues: true
---

## Daily Issues Report

Create an upbeat daily status report for the team as a GitHub issue.

## What to include

- Recent repository activity (issues, PRs, discussions, releases, code changes)
- Progress tracking, goal reminders and highlights
- Project status and recommendations
- Actionable next steps for maintainers
```

### Example 2: Issue Triage with Claude

```markdown
---
on:
  issues:
    types: [opened]
  roles: [admin, maintainer, write]
  skip-bots: [dependabot, renovate]

engine: claude

permissions:
  contents: read
  issues: read

tools:
  github:
    min-integrity: approved

safe-outputs:
  add-labels:
    allowed: [bug, enhancement, question, documentation, good-first-issue]
    max: 3
  add-comment:
    max: 1

network:
  firewall: true
  allowed:
    - defaults
---

## Issue Triage Agent

You are a repository triage agent. When a new issue is opened:

1. Read the issue title and body carefully
2. Check existing labels on the repository
3. Classify the issue as bug, enhancement, question, documentation, or good-first-issue
4. Apply appropriate labels (max 3)
5. Post a welcome comment acknowledging the issue and explaining next steps

## Classification Rules

- **bug**: Describes broken behavior, includes error messages or stack traces
- **enhancement**: Requests new features or improvements
- **question**: Asks how to do something
- **documentation**: Reports doc issues or requests new docs
- **good-first-issue**: Simple, well-scoped, good for new contributors
```

### Example 3: CI Failure Doctor

```markdown
---
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    conclusions: [failure]

engine:
  id: claude
  model: claude-sonnet-4

permissions:
  contents: read
  actions: read
  pull-requests: read

safe-outputs:
  add-comment:
    max: 1
  create-pull-request:
    title-prefix: "[ci-fix] "
    labels: [automated-fix, ci]
    max: 1

network:
  firewall: true
  allowed:
    - defaults
---

## CI Failure Doctor

Analyze the failed CI run and attempt to fix it.

## Steps

1. Read the workflow run logs to identify the failure
2. Check the failing test or build step
3. Analyze the root cause
4. If the fix is straightforward (typo, missing import, config issue):
   - Create a PR with the fix
5. If the fix is complex or unclear:
   - Comment on the triggering PR with analysis and suggestions
```

### Example 4: Scheduled Dependency Review

```markdown
---
on:
  schedule:
    - cron: "0 9 * * MON"

engine: copilot

permissions:
  contents: read

safe-outputs:
  create-issue:
    title-prefix: "[deps] "
    labels: [dependencies, maintenance]
    close-older-issues: true
    expires: 7d

network:
  firewall: true
  allowed:
    - defaults
    - python
    - node
---

## Weekly Dependency Review

Review the repository's dependencies and create a summary issue.

## Analysis

- Check for outdated packages (major, minor, patch versions behind)
- Identify known security vulnerabilities
- Note deprecated packages
- Suggest priority upgrades
- Estimate effort for each upgrade (low/medium/high)
```

## Guardrails Model (Security Architecture)

gh-aw implements **defense-in-depth** across four layers:

### Layer 1: Substrate-Level Isolation

- **Container isolation** via Agent Workflow Firewall (AWF) — Docker container with iptables-controlled network
- **Squid proxy** enforces domain allowlists for all egress traffic
- **API proxy** holds auth tokens outside the agent container (prevents exfiltration via prompt injection)
- **MCP Gateway** spawns isolated containers per MCP server
- CPU/memory isolation via GitHub Actions runner VM

### Layer 2: Declarative Configuration

- **Network allowlists** — explicit domain declarations, no wildcards in strict mode
- **Tool allowlisting** — only explicitly listed MCP tools are available
- **Ecosystem bundles** — `python`, `node`, `defaults` instead of raw domains
- **Strict mode** (default: on) — refuses write permissions, requires explicit network config, enforces SHA-pinned actions

### Layer 3: Permission Separation (Safe Outputs)

This is the most innovative part:

- **Agent runs read-only** — no write permissions to GitHub API
- **Write operations are "safe outputs"** — structured declarations in frontmatter
- **Separate jobs** execute writes after agent completes
- **Each safe output type has its own scoped permissions** (e.g., `create-issue` job gets `issues: write`, nothing else)
- **Output sanitization** — secret redaction, URL domain filtering, XML escaping, size limits, reference escaping
- **Threat detection** — AI-powered analysis of agent output before safe outputs execute

Available safe outputs: create-issue, create-pull-request, add-comment, add-labels, remove-labels, close-issue, update-release, dispatch-workflow, upload-asset, and ~25 more.

### Layer 4: Integrity Filtering

- **Content trust levels** — filters GitHub content by author trust before the AI sees it
- **Levels:** `none` (all content) → `approved` (owners/members/collaborators only)
- Public repos auto-enforce `min-integrity: approved` to prevent prompt injection via untrusted issue content

### Additional Controls

| Control | Description |
|---|---|
| Role-based triggers | `roles: [admin, maintainer, write]` — who can trigger |
| Bot filtering | `skip-bots: [dependabot]` — prevent bot loops |
| Manual approval | `manual-approval: true` — environment protection rules |
| Stop-after deadline | `stop-after: 2026-06-01` — auto-disable triggers |
| Compilation-time checks | Schema validation, expression safety, SHA pinning, security scanners (actionlint, zizmor, poutine) |

## Supported AI Engines

| Engine | Value | Auth Secret |
|---|---|---|
| GitHub Copilot CLI | `copilot` (default) | `COPILOT_GITHUB_TOKEN` |
| Claude Code | `claude` | `ANTHROPIC_API_KEY` |
| OpenAI Codex | `codex` | `OPENAI_API_KEY` |
| Google Gemini CLI | `gemini` | `GEMINI_API_KEY` |

All support custom models, versions, CLI args, and API endpoint overrides.

## Installation & CLI

```bash
# Install
gh extension install github/gh-aw

# Add a sample workflow
gh aw add githubnext/agentics/workflows/daily-status.md

# Compile (generates .lock.yml)
gh aw compile my-workflow

# Check status
gh aw status

# Trigger manually
gh aw run my-workflow
```

**Note:** Requires `gh auth login` — our VM doesn't have gh authenticated. Would need a PAT or gh auth setup to use.

## Proposal: Integration with Our Dispatch System

### What gh-aw Does Well (That We Should Adopt)

1. **Workflow-as-markdown format** — Natural language instructions with structured frontmatter. Our AGENTS.md/SOUL.md already use this pattern. We could formalize dispatch tasks as `.md` files with frontmatter for routing metadata.

2. **Safe outputs pattern** — Read-only agent execution with structured write declarations. Our dispatch system could adopt this: agents declare what they *intend* to write (files, messages, API calls) in a structured manifest, and the dispatch system executes the writes after verification.

3. **Integrity filtering** — Filtering untrusted content before it reaches the AI. Relevant for any workflow triggered by external input (Discord messages from non-Trajan users, webhook payloads).

4. **Compilation + lock files** — Pinning exact versions and SHAs. Our skills could benefit from a similar "compile" step that resolves dependencies and pins versions.

### Concrete Integration Opportunities

#### 1. GitHub Repo Automation (Direct Use)

Use gh-aw directly on repos we manage:
- **Issue triage** on OpenClaw community repos
- **CI failure analysis** — auto-diagnose and fix broken builds
- **Documentation maintenance** — keep READMEs and docs current
- **Dependency audits** — weekly security/freshness reports
- **PR review assistance** — automated first-pass reviews

This requires:
- `gh auth login` on the VM (or PAT in GitHub secrets)
- Workflow `.md` files in `.github/agentic/` directory of target repos
- GitHub Actions enabled with appropriate secrets

#### 2. Dispatch Task Format (Adopt Pattern)

Create a `.dispatch/` directory with markdown task templates:

```markdown
---
agent: researcher
timeout: 600
priority: normal
safe-outputs:
  vault-write:
    path-prefix: "vault/Research/"
    max-files: 3
  discord-message:
    channels: [research]
    max: 1
---

## Research Task: {{topic}}

Research {{topic}} thoroughly. Include:
- Current state of the art
- Key players and projects
- Tradeoffs and comparisons
- Recommendation for our use case
```

The dispatch system would:
1. Parse frontmatter for routing (agent, timeout, priority)
2. Extract safe-outputs to set up verification gates
3. Pass markdown body as the agent's task prompt
4. Verify outputs match declared safe-outputs before committing

#### 3. Guardrails for External Triggers

When our system handles external input (Discord commands from other users, webhook payloads):
- Apply integrity filtering — classify input trust level
- Sanitize outputs before posting to external channels
- Enforce safe-output constraints (max messages, allowed channels)

### What Doesn't Fit

- **GitHub Actions dependency** — gh-aw is tightly coupled to GitHub Actions runners. Our dispatch runs on a local VM with `sessions_spawn`. We can't run gh-aw workflows locally.
- **Container sandboxing** — AWF requires Docker and iptables. Our agents run as Claude Code processes, not containers. We'd need a different isolation model.
- **Lock file compilation** — Over-engineered for our use case. Our dispatch is dynamic, not pre-compiled.

### Recommended Next Steps

1. **Set up gh auth** on the VM and install gh-aw for direct use on GitHub repos
2. **Create 2-3 starter workflows** for OpenClaw repos (issue triage, CI doctor, weekly status)
3. **Prototype dispatch-task-as-markdown** format inspired by gh-aw frontmatter
4. **Study the safe-outputs pattern** more deeply for adoption in our verification pipeline
5. **Monitor gh-aw development** — it's early-stage and evolving rapidly

## Key Takeaways

- gh-aw is the first serious attempt at "Continuous AI" alongside CI/CD — worth watching
- The **safe outputs** pattern (read-only agents + structured write declarations) is the most transferable idea
- The **workflow-as-markdown** format validates our existing approach (AGENTS.md, SOUL.md)
- Direct integration is limited by GitHub Actions coupling, but the design patterns are highly relevant
- The guardrails model (4-layer defense-in-depth) is a gold standard for agentic security
