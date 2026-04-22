# Implementation Planning Prompt

Sources: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [Wirasm/PRPs-agentic-eng](https://github.com/Wirasm/PRPs-agentic-eng), [mitsuhiko/agent-prompts](https://github.com/mitsuhiko/agent-prompts)

**When to use**: Before implementing complex features, major refactoring, or multi-file changes. Triggers automatically for complex feature requests.

---

## Core Principle: Bounded Scope

Every phase must be completable in one agent loop. If a phase can't finish in a single session, it's too big — split it further. Most "agent failures" are loop design failures, not model failures.

## Prompt

Create a detailed implementation plan for the following feature/change. Use exact file paths, function names, and variable names — no vague references.

**Feature**: `[describe the feature, change, or refactoring]`

### Step 1: Requirements Analysis
- What is the scope? What's in, what's out?
- What are the success metrics?
- What are the edge cases?
- What are the error scenarios?
- What are the acceptance criteria? (Given/When/Then format)

### Step 2: Architecture Review
- How does this fit into the existing system?
- What patterns are already in use that we should follow?
- What components need to be modified vs. created?
- What are the data flow changes?
- Are there architectural constraints? (server/client boundary, caching, middleware)

### Step 3: Phased Implementation

Break into independent, deliverable phases:

**Phase 1: Minimum Viable** (delivers basic value, can merge alone)
- Specific files to create/modify
- Exact changes per file
- Tests for this phase
- Risk level: Low/Medium/High
- Validation: `pnpm lint && pnpm typecheck && pnpm test`

**Phase 2: Core Completion** (full feature flow)
- Additional files and changes
- Integration tests
- Risk level
- Validation commands

**Phase 3: Edge Cases** (robustness)
- Error handling improvements
- Boundary condition handling
- Additional test coverage

**Phase 4: Polish** (optimization, UX)
- Performance improvements
- Documentation updates
- Monitoring additions

### Step 4: Per-Phase Detail (PRP Format)

For each phase, specify:
- **Actions**: Exact code changes with file paths
- **Rationale**: Why this approach over alternatives
- **Dependencies**: What must be done first
- **Risks**: What could go wrong
- **Test plan**: Specific tests to write
- **Exit criteria**: How to verify this phase is complete

### PRP (Production Ready Packet) Requirements

A PRP is a PRD + curated codebase intelligence + agent runbook. It contains everything an AI agent needs to ship production-ready code on the first pass.

Each phase's PRP must include:

| Element | Description | Example |
|---------|-------------|---------|
| **File paths** | Every file to create or modify | `src/app/api/users/route.ts` |
| **Library versions** | Exact versions to use | `zod@3.22.4` |
| **Code patterns** | Examples from existing codebase | "Follow the pattern in `src/app/api/auth/route.ts`" |
| **Validation commands** | How to verify correctness | `pnpm lint && pnpm typecheck && pnpm test -- --run` |
| **Bounded scope** | Single-session completable | Max 3-5 files modified per phase |
| **Success criteria** | Deterministic check | "Tests pass, lint clean, type-safe" |

### Quality Checks
- [ ] Each phase is independently mergeable
- [ ] Exact file paths provided (no "the relevant file")
- [ ] Edge cases and error scenarios addressed
- [ ] Existing patterns followed (no unnecessary novelty)
- [ ] Tests come with implementation, not after
- [ ] No function exceeds 50 lines
- [ ] Changes are incremental and verifiable
- [ ] Each phase completable in one agent loop (bounded scope principle)
- [ ] Validation commands are executable (not just described)

### Anti-Patterns to Avoid
- **Unbounded phases**: "Implement the full feature" as a single phase
- **Missing validation**: No way to verify correctness after each phase
- **Vague references**: "Update the relevant components" instead of exact paths
- **Big-bang delivery**: All-or-nothing with no intermediate value
- **Implicit dependencies**: Assuming the agent remembers prior context
