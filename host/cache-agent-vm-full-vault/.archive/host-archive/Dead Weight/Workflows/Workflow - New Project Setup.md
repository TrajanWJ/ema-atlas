# Workflow: New Project Setup

Step-by-step for starting a new project that connects to the Obsidian vault.

---

## Prerequisites

- [ ] Claude Code CLI installed and authenticated
- [ ] Obsidian vault running with MCP bridge on port 22360
- [ ] Superpowers skills installed (`~/.claude/skills/`)
- [ ] QMD installed and configured for session indexing

## Phase 1: Create Project Scaffold

### 1.1 Initialize the project directory
```bash
mkdir ~/Desktop/Coding/Projects/my-project
cd ~/Desktop/Coding/Projects/my-project
# Init framework — pick based on [[My Stack Decisions]]
# e.g., npx create-next-app@latest . --typescript
# e.g., npm create vite@latest . -- --template react-ts
git init && git add -A && git commit -m "Initial scaffold"
```

### 1.2 Create CLAUDE.md at project root
This is the project's constitution for Claude Code. Include:

```markdown
# Project Name

## Purpose
[One paragraph: what this project does and why it exists]

## Tech Stack
- Framework: [e.g., Next.js 15]
- Language: TypeScript (strict mode)
- Styling: [e.g., Tailwind CSS]
- State: [e.g., Zustand]
- Testing: [e.g., Vitest + Playwright]
- Database: [e.g., SQLite via Drizzle]

## Architecture
[Key directories and what lives in each]

## Commands
- `npm run dev` — start dev server
- `npm test` — run tests
- `npm run lint` — lint check
- `npm run build` — production build

## Conventions
- Follow Obsidian vault conventions via MCP (port 22360)
- TDD: write failing test before implementation
- Functions < 50 lines, files < 800 lines
- Atomic commits with descriptive messages

## Key Files
- `src/` — application source
- `docs/superpowers/plans/` — implementation plans
- `CLAUDE.md` — this file (project constitution)
```

### 1.3 Set up Claude Code project config
```bash
# Create project-level settings
mkdir -p .claude
# Optionally create project-level agents
mkdir -p .claude/agents
```

## Phase 2: Create Vault Project Note

### 2.1 Create project note
Create `Trajan's Projects/ProjectName.md` in the vault with this structure:

```markdown
# Project Name

> One-line description.

## Quick Info

| Field | Value |
|---|---|
| **Location** | `~/Desktop/Coding/Projects/project-name` |
| **Stack** | Next.js, TypeScript, Tailwind |
| **Status** | Active — Phase 1 |
| **Repo** | [GitHub link or local] |
| **Started** | YYYY-MM-DD |

## Architecture Overview
[Key components and their relationships]

## Phase Progress

### Phase 1: [Name]
- [ ] Task 1
- [ ] Task 2

### Phase 2: [Name]
- [ ] Task 1

## Development Log
| Date | What | Session |
|---|---|---|
| YYYY-MM-DD | Project setup | [[Session link]] |

## Decisions
- [[ADR-NNNN - Decision Title]] — [brief summary]

## See Also
- [[My Stack Decisions]]
- [[Workflows MOC]]
```

### 2.2 Update Connected Projects
Add the project to [[My Stack Decisions]] in the Connected Projects table.

## Phase 3: Connect Vault to Project

### 3.1 Verify MCP bridge
```bash
# Test that Claude Code can reach the vault
claude --print-system-prompt | grep -i "mcp\|obsidian"
```

### 3.2 First Claude Code session
```bash
cd ~/Desktop/Coding/Projects/my-project
claude
```

In the first session, verify:
- [ ] Claude reads CLAUDE.md automatically
- [ ] Claude can access vault via MCP bridge on port 22360
- [ ] Superpowers skills are available (`/skills` to check)
- [ ] CodeGraphContext MCP is accessible (if applicable)

### 3.3 Initial planning session
```
Use the planner subagent to create an implementation plan for
[project name]. Save the plan to docs/superpowers/plans/
```

## Phase 4: Establish Development Loop

### 4.1 Create project-specific agents (optional)
If the project needs specialized subagents, create them in `.claude/agents/`:
```yaml
---
name: project-implementer
description: Implements features for [ProjectName] following project conventions.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
skills:
  - test-driven-development
---
```

### 4.2 Run first implementation cycle
Follow [[Workflow - Research to Implementation]] for the first feature:
1. Research (if needed) via [[Role - Researcher]]
2. Plan via [[Role - Planner]]
3. Implement via [[Role - Implementer]]
4. Review via [[Role - Reviewer]]
5. Log session using [[Session Summary Template]]

## Setup Checklist

- [ ] Project directory created and git initialized
- [ ] `CLAUDE.md` at project root with stack, commands, conventions
- [ ] `.claude/` directory created with any project-specific agents
- [ ] Project note created in `Trajan's Projects/` in vault
- [ ] [[My Stack Decisions]] Connected Projects table updated
- [ ] First Claude Code session tested — CLAUDE.md reads correctly
- [ ] MCP bridge verified (vault accessible from Claude Code)
- [ ] Superpowers skills verified available
- [ ] Implementation plan created and saved
- [ ] First session logged in `Session Log/`

## When to Use Claudian vs Claude Code CLI

| Scenario | Use |
|---|---|
| Writing code, running tests | Claude Code CLI (terminal) |
| Browsing vault, linking notes | Claudian sidebar (Obsidian) |
| Quick vault lookup during coding | Claude Code CLI via MCP bridge |
| Editing vault notes | Claudian sidebar or direct Obsidian edit |
| Multi-file implementation | Claude Code CLI |

## See Also

- [[Workflows MOC]]
- [[My Stack Decisions]]
- [[ExecuDeck]] — first project using this workflow
- [[Workflow - Daily Development]] — daily loop after setup

#workflow #setup
