---
type: knowledge
date: 2026-03-20T00:00:00.000Z
tags:
  - agent-tooling
  - telemetry
  - scaffolding
  - npm
  - lousy-agents
domain: agent-infrastructure
status: installed
version: 5.4.0
aliases:
  - lousy-agents
  - agent-shell
wiki_id: system/architecture/lousy-agents-scaffolding
imported_from: vault/Architecture/lousy-agents-scaffolding.md
imported_at: '2026-04-04T00:23:56.789Z'
summary: ''
---

# @lousy-agents/cli v5.4.0 — Agent Shell Telemetry & Scaffolding

## Core Concept

Lousy Agents provides two things: (1) project scaffolding for agent-friendly repos and (2) a telemetry wrapper ("agent-shell") that creates flight recordings of every npm script run by an agent.

## Agent-Shell Telemetry

`@lousy-agents/agent-shell` wraps any npm script and records a JSONL audit trail:

- Every command invocation: args, env snapshot, timestamps
- Exit codes and stdout/stderr capture
- Duration and resource usage
- Chained as a flight recorder for agent actions

This creates a complete audit trail of what agents actually did during execution — invaluable for debugging agent behavior after the fact.

## Scaffolding

```bash
npx @lousy-agents/cli init --kind webapp
```

Scaffolds a project with:
- **Vitest** for testing
- **Biome** for linting/formatting
- **Copilot** config for AI-assisted development
- Agent-shell wrappers pre-configured on npm scripts

## Steal This Pattern

**Wrap our `~/bin/` dispatch scripts with agent-shell-style telemetry.**

Current state: Our dispatch scripts (Right Hand, Scout, Ops, etc.) run and we have limited visibility into what they actually did beyond Discord logs and session files.

Proposed pattern:
```bash
# Before
~/bin/dispatch-scout.sh "find repos about X"

# After — wrapped with JSONL flight recording
agent-shell ~/bin/dispatch-scout.sh "find repos about X"
# -> writes ~/.agent-logs/2026-03-20T14:30:00-scout.jsonl
```

This would give us:
- Complete audit trail per dispatch
- Duration tracking for each agent run
- Ability to replay/review what happened
- Aggregatable metrics across agent fleet

## Install Status

Installed @lousy-agents/cli v5.4.0 on 2026-03-20.

## Related Notes

- [[agent-architecture-sota-2026-03-19]]
- [[strawpot-orchestration]]
