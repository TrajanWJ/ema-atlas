---
title: "OpenClaw EMA Development Notes"
type: reference
created: 2026-04-06
tags: [openclaw, archived, ema, development, architecture, meta-prompts]
summary: "EMA development methodology docs created during OpenClaw era - meta-prompts, practices, and architecture patterns"
---

# OpenClaw EMA Development Notes

These documents were created within the OpenClaw agent workspace during the design phase of EMA. They represent the development methodology and architecture decisions that shaped EMA's implementation.

## Meta-Prompt Playbook

A complete question hierarchy for all development phases to prevent bad code upstream:

### Phase 0: Orientation
- What phase are we in?
- Last artifact produced?
- Most important thing right now?
- How would we define failure?
- Who needs to know?

### Phase 1: Clarification
- Stakeholder intent
- System boundaries
- Success criteria
- Risk/constraints
- Prior art

### Phase 2: Design
- Architecture decisions
- Contracts between components
- Failure modes
- Evolution paths
- Trade-offs

### Phase 3: Implementation
- Correctness checkpoints
- Coverage targets
- Testability
- Observability
- Performance

### Phase 4: Verification
- Spec compliance
- Integration testing
- Regression checking
- Learned questions
- Debt questions

### Anti-Patterns to Watch
- **Phase skipping** -- jumping to implementation without design
- **Assumption burial** -- hiding critical assumptions in code
- **Stub proliferation** -- too many TODO/stub functions
- **Silent coupling** -- hidden dependencies between modules
- **Undefined success** -- no clear criteria for "done"
- **Learning loss** -- not capturing lessons for future sessions

## Development Practices

Stack: **Elixir 1.16 / Phoenix 1.8 / SQLite / React 19 / Tauri 2 / TypeScript**

### Module Independence
- 3-dependency limit per module
- Dependency injection patterns
- Failure mode documentation required
- Configuration hierarchy
- Interface versioning

### Naming Conventions
- Modules: `EMA.Context.SubContext`
- Functions: `verb_noun` pattern
- Variables: descriptive, no abbreviations
- Files: organized by context, not type

### Testing
- 90%+ context API coverage target
- Tests organized by context
- Property-based testing for data transformations

### Async Patterns
- OTP GenServer as first choice
- Task.async/await for one-off concurrent work
- Phoenix.PubSub for broadcasting

### Elixir-Specific
- Pattern matching on function heads (not if/case)
- Error handling with tagged tuples `{:ok, result}` / `{:error, reason}`
- OTP supervision trees for fault tolerance

### React/TypeScript
- Zustand stores per domain
- Phoenix channel integration pattern for real-time updates

## Architecture Patterns

### 1. Context Boundary Pattern
Phoenix Contexts as bounded contexts with public APIs (`EMA.Tasks`) and private implementation (schemas, queries, workers).

### 2. Claude Runner Isolation Pattern
All Claude invocations through `EMA.Claude.Runner` with standardized contract.

### 3. Pipeline Pattern
Multi-stage processing with failure isolation (e.g., Proposal Pipeline).

### 4. GenServer State Machine Pattern
Explicit state transitions for long-running processes. Used in Campaign Flow: `forming -> ready -> running -> completed/failed/cancelled`.

### 5. Channel Broadcast Pattern
Consistent Phoenix channel structure with topic constants.

### 6. MCP Tool Pattern
Standard structure for MCP tool handlers with error handling and structured responses.

### 7. Schema + Changeset Pattern
Ecto schema structure with create and update changesets.

### Anti-Patterns
- **God Module** -- too many responsibilities in one module
- **Context Bypass** -- reaching into another context's internals
- **Silent Failure** -- swallowing errors without logging
- **Blocking GenServer** -- doing heavy work in handle_call/handle_cast

## Related

- [[OpenClaw System Overview]]
- [[EMA]]
