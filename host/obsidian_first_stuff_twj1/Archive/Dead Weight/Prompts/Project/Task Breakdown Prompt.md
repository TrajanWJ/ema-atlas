# Task Breakdown Prompt

Sources: [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management), [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [Wirasm/PRPs-agentic-eng](https://github.com/Wirasm/PRPs-agentic-eng)

**When to use**: Decomposing a feature or project into agent-executable tasks. Before delegating work to sub-agents.

---

## Core Principle: Agent-Sized Work

Every task must be completable in a single agent loop — one session, one context window. If a task requires the agent to "remember" work from a prior session, it's too big or missing context.

**The bounded scope test:** Can an agent start this task with only the task description + file paths + codebase access and deliver a verifiable result? If not, add more context or split further.

## Prompt

Break down the following feature/project into discrete, executable tasks suitable for AI agent delegation.

**Feature**: `[describe the feature or project]`
**Context from discovery**: `[reference any prior exploration or requirements docs]`

### Step 1: Domain Analysis
- Identify logical work domains requiring different skill sets
- Map boundaries between domains
- Note which domains can be worked in parallel vs. sequentially

### Step 2: Phase Sequencing
Organize into phases based on natural dependencies:

```
Phase 1: Foundation (no dependencies)
Phase 2: Core Logic (depends on Phase 1)
Phase 3: Integration (depends on Phase 2)
Phase 4: Polish (depends on Phase 3)
```

### Step 3: Task Definition

For each task, specify:

```yaml
task_id: "P1-T1"
title: "Short descriptive name"
objective: "What this task must accomplish"
output: "Concrete deliverables (files, tests, configs)"
guidance: "How to approach this (patterns to follow, constraints)"
dependencies: ["P1-T0"]  # Tasks that must complete first
estimated_effort: "S/M/L"  # S=1-2 files, M=3-4 files, L=5+ files
agent_type: "implementer/researcher/reviewer"
validation: "pnpm lint && pnpm typecheck && pnpm test"
```

### Agent-Sized Work Rules

| Rule | Threshold | Action if Exceeded |
|------|-----------|-------------------|
| Max files modified | 5 files | Split into separate tasks |
| Max subtasks | 5 subtasks | Promote subtasks to independent tasks |
| Max context needed | 2 other tasks | Add explicit context to task description |
| Max scope | 1 logical change | Split by concern |
| Time estimate | 1 agent session | Break into sequential phases |

**The "Can I Verify It?" Test:** Every task must have a deterministic validation step. If you can't write a command that checks "did this task succeed?", the task is too vague.

Good: "Tests pass, new endpoint returns 200 with valid data, TypeScript compiles"
Bad: "Feature works correctly" or "Code is clean"

### Anti-Packing Rules
- Each task should be completable in a single agent session
- If a task has more than 5 subtasks, split it
- If a task touches more than 5 files extensively, split it
- If a task requires context from more than 2 other tasks, either add that context explicitly or consider sequencing
- If a task mixes creation and modification of unrelated files, split by concern

### Step 4: Dependency Mapping
- Same-agent dependencies: reference previous work by file path
- Cross-agent dependencies: include comprehensive integration details (file locations, data formats, API contracts)

**Dependency context checklist for cross-agent tasks:**
- [ ] File paths of inputs/outputs specified
- [ ] Data format documented (TypeScript types, JSON schema)
- [ ] API contracts defined (request/response shapes)
- [ ] Integration test criteria specified
- [ ] What to do if the upstream task's output doesn't match expectations

### Step 5: Validation
- [ ] Every task has clear success criteria
- [ ] Every task has executable validation commands
- [ ] No circular dependencies
- [ ] Phases can be delivered incrementally
- [ ] Each task has a defined output artifact
- [ ] Agent types assigned appropriately
- [ ] Effort estimates are realistic for single sessions
- [ ] Each task passes the "Can I Verify It?" test
- [ ] Cross-agent tasks include full integration context
