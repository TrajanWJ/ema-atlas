---
title: forgecraft-resource-discipline
created: '2026-03-19'
updated: '2026-03-19'
type: research
status: active
source: unknown
tags: []
wiki_id: research/forgecraft-resource-discipline
imported_from: vault/Research/forgecraft-resource-discipline.md
imported_at: '2026-04-04T00:23:57.161Z'
summary: ''
---
# ForgeCraft MCP — Resource Discipline + Quality Scoring for AI Coding

**URL**: https://github.com/jghiringhelli/forgecraft-mcp  
**NPM**: `forgecraft-mcp`  
**Setup**: `npx forgecraft-mcp setup .`  
**Supports**: Claude (CLAUDE.md), Cursor, Copilot, Windsurf, Cline, Aider

## The Problem It Solves

AI coding assistants install duplicate VS Code extensions, spin up docker containers they never clean up, fill disks to 0 KB in one session. **ForgeCraft is the quality contract** that prevents this.

## 7-Property Generative Specification Model (Score 0-14)

| Property | Score | What It Checks |
|---|---|---|
| **Self-Describing** | 0-2 | Does the codebase explain itself? (CLAUDE.md presence + content) |
| **Bounded** | 0-2 | Is business logic leaking into routes? |
| **Verifiable** | 0-2 | Are there tests that ran in a real runtime? |
| **Defended** | 0-2 | Pre-commit hooks blocking bad commits? |
| **Auditable** | 0-2 | ADRs documented and findable? |
| **Composable** | 0-2 | Can you swap the DB without touching domain? |
| **Executable** | 0-2 | CI evidence the code actually ran? |

**Threshold: 11/14 to PASS**. Below = CI/CD blocks.

```bash
npx forgecraft-mcp verify .
# Shows score + evidence per property
```

## Resource Discipline Rules (Apply to Claude Code)

These are the specific conventions injected into CLAUDE.md:

### VS Code Extensions
```
Before installing: code --list-extensions | grep -i <name>
Only install if no version in required major range is already present.
Same extension cannot be downloaded twice in same day.
```

### Docker Containers
```
Before creating: docker ps -a --filter name=<service>
If exists: start it, don't create new.
Prefer: docker compose up (reuse) over docker run (always creates new).
Logs capped at 500 MB. docker system prune -f = maintenance, not emergency.
```

### Python Virtual Environments
```
One .venv per project root.
Reuse if Python major.minor matches.
Never create venv in subdirectory unless standalone installable package.
Unused deps: pip list --not-required.
```

### Synthetic/Time-Series Data
```
Before writing >100 MB generated data: ask retain/condense/delete.
```

### Disk Space
```
Check df -h before large operations.
Warn at <10% free. Block at <2% free.
```

## CLAUDE.md Generation

116 curated rule blocks. Auto-generates context-aware CLAUDE.md from your project type:

```bash
npx forgecraft-mcp setup .
# Detects: TypeScript? Python? Docker? React? Next.js?
# Generates appropriate rule blocks for your stack.
```

## Application to OpenClaw

### Resource Discipline → Already Encoded in CLAUDE.md
The resource discipline rules above align with what we added from instruction-catalog. Enhance our CLAUDE.md with:
- Docker container dedup check
- Extension dedup check  
- Disk space warning gate

### Quality Scoring → Dispatch Pre/Post Check
The 7-property model could gate dispatch task completion:
- `verifiable`: task spawns tests, tests pass before marking DONE
- `defended`: no unreviewed commits to main
- `auditable`: task writes outcome to dispatch done log

### What to Install
```bash
npx forgecraft-mcp setup .  # Run in active project dirs, not globally
```

Good for specific projects, not as a global tool. Run when starting a new significant codebase.

## Status
- No install needed (npx on demand)
- Apply to active projects: `npx forgecraft-mcp setup <project-dir>`
- Resource discipline rules extracted and applicable to CLAUDE.md additions
