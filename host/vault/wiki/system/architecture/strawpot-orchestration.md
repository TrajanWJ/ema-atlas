---
type: knowledge
date: 2026-03-20T00:00:00.000Z
tags:
  - agent-orchestration
  - multi-agent
  - roles-as-markdown
  - git-worktree
  - strawpot
domain: agent-architecture
status: installed
version: 0.1.51
aliases:
  - StrawPot
  - strawpot
wiki_id: system/architecture/strawpot-orchestration
imported_from: vault/Architecture/strawpot-orchestration.md
imported_at: '2026-04-04T00:23:56.796Z'
summary: ''
---

# StrawPot v0.1.51 — Role-Based Agent Orchestration

## Core Concept

StrawPot formalizes the "roles ARE Markdown files" pattern. Each agent role is defined as a Markdown document containing identity, capabilities, constraints, and delegation rules. The orchestrator reads these role files to understand what each agent can do and routes tasks accordingly.

This is essentially our SOUL.md / AGENTS.md pattern taken to its logical conclusion — a runtime that treats Markdown role definitions as executable agent specifications.

## Key Features

### Role-Based Orchestration
- Roles are `.md` files with structured frontmatter (capabilities, tools, constraints)
- Orchestrator parses role files at runtime to build delegation graph
- Roles compose — a role can reference sub-roles for delegation

### Recursive Delegation with Depth Limits
- Agents can delegate to sub-agents, which can delegate further
- Configurable `max_depth` prevents infinite delegation chains
- Each delegation level gets a scoped context window

### Git Worktree Isolation
- Each delegated task runs in its own git worktree
- Changes are isolated until the parent agent merges results
- Failed subtasks don't pollute the main working tree

### 3-Tier Persistent Memory
1. **Session memory** — within a single agent invocation
2. **Role memory** — persists across invocations of the same role
3. **Shared memory** — accessible across all roles in a project

### Any-Runtime Support
- Ships with Claude Code and Codex support out of the box
- Adding a new runtime requires only 2 files: a runtime adapter and a config entry
- Gemini CLI adapter also available

### StrawHub Registry (strawhub.dev)
- Community registry for sharing roles — comparable to ClaWHub for Claude skills
- `strawpot list` — browse available roles
- `strawpot install <role>` — install from registry
- `strawpot publish` — share your roles

## Commands

```bash
strawpot init              # Initialize project
strawpot run <role>        # Execute a role
strawpot list              # List available/installed roles
strawpot install <role>    # Install from StrawHub
strawpot publish           # Publish role to StrawHub
```

## Comparison to OpenClaw

| Aspect | OpenClaw | StrawPot |
|--------|----------|----------|
| Role definition | SOUL.md + AGENTS.md (convention) | Structured .md files (enforced schema) |
| Delegation | File-based dispatch, Discord | Built-in recursive delegation with depth limits |
| Isolation | Manual worktree management | Automatic git worktree per delegation |
| Memory | Ori + engram + sqlite-memory (stacked) | 3-tier built-in (simpler but less flexible) |
| Registry | No public registry | StrawHub at strawhub.dev |
| Runtimes | Claude Code primary | Any-runtime (2 cmds to add) |
| Maturity | Custom, battle-tested for our use | v0.1.51 — early but promising |

**Key takeaway:** StrawPot formalizes patterns we've been doing ad-hoc. Worth watching for the registry ecosystem and the any-runtime adapter pattern. Our memory stack is more capable but more complex.

## Install Status

Installed v0.1.51 on 2026-03-20.

## Related Notes

- [[agent-architecture-sota-2026-03-19]]
- [[Multi-Agent Orchestration]]
