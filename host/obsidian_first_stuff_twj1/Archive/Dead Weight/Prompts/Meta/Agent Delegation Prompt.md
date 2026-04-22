# Agent Delegation Prompt

Sources: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management), [mitsuhiko/agent-prompts](https://github.com/mitsuhiko/agent-prompts)

**When to use**: When deciding whether to delegate work to sub-agents and how to structure the delegation.

---

## Delegation Decision Tree

Before delegating, run through this decision tree:

```
1. Is this task well-defined with clear success criteria?
   NO  → Define it first (use [[Context Synthesis Prompt]] or [[Task Breakdown Prompt]])
   YES → Continue

2. Does this task require context from the current conversation?
   YES, heavily → Do it yourself (context transfer is lossy)
   YES, some    → Include explicit context in delegation
   NO           → Good candidate for delegation

3. Can the task be validated independently?
   NO  → Not ready for delegation — add validation criteria
   YES → Continue

4. Is this task parallelizable with other work?
   YES → Delegate for parallel execution
   NO  → Consider if delegation overhead is worth it

5. What agent type is needed?
   → See "When to Delegate" table below
```

## When to Delegate

### Automatic Delegation Triggers
| Situation | Delegate To | Why |
|-----------|-------------|-----|
| Complex feature request | [[Role - Planner]] | Needs decomposition before coding |
| Code just written or modified | [[Role - Reviewer]] | Fresh eyes catch issues author misses |
| Bug fix or new feature | TDD guide agent | Tests first, then implementation |
| System design decision | [[Role - Architect]] | Needs trade-off analysis |
| Security-sensitive change | Security reviewer agent | Specialized knowledge required |
| Build failure | Build error resolver agent | Focused diagnostic scope |
| Research question | Research agent | Doesn't need codebase context |
| Documentation update | Documentation agent | Parallelizable with dev work |

### When NOT to Delegate
| Situation | Why |
|-----------|-----|
| Task requires deep conversation context | Context transfer is lossy |
| Quick fix (< 5 minutes) | Delegation overhead exceeds task cost |
| Exploratory work with unclear direction | Agent needs tight feedback loop |
| Decision requiring human judgment | Delegate to human, not agent |
| Task touching > 10 files with tight coupling | Context window pressure too high |

### Parallel Execution
ALWAYS use parallel task execution when tasks are independent. Never sequence work that can run concurrently.

**Good parallel candidates:**
- Tests + documentation (independent outputs)
- Frontend + backend (clear API contract boundary)
- Multiple independent components
- Code review + performance benchmarks

**Bad parallel candidates:**
- Implementation + integration (integration depends on implementation)
- Schema migration + code using new schema
- Anything with shared file modifications

### Multi-Perspective Analysis
For complex decisions, deploy split-role sub-agents providing distinct viewpoints:
- Factual reviewer (correctness)
- Senior engineer (quality)
- Security expert (safety)
- Consistency reviewer (patterns)
- Redundancy checker (waste)

## Delegation Format

### Task Assignment Prompt Structure
```yaml
task_ref: "Phase-Task identifier"
agent_assignment: "role name"
memory_log_path: "path to log file"
execution_type: "single-step | multi-step"
```

### Content Requirements
1. **Objective**: What must be accomplished (single sentence)
2. **Context**: Relevant background (file paths, prior work, patterns to follow)
3. **Constraints**: Rules and limitations (what NOT to do is as important as what to do)
4. **Output**: Expected deliverables with format
5. **Validation**: How to verify success (executable commands)
6. **Escalation**: When to stop and ask for help

### Context Transfer Checklist

When delegating, include this context to prevent agent confusion:

| Context Type | Include? | Example |
|---|---|---|
| File paths to read | Always | `src/app/api/users/route.ts` |
| Patterns to follow | Always | "Follow the pattern in `src/app/api/auth/route.ts`" |
| Conventions | Always | "Use Zod for validation, early returns for guards" |
| What NOT to change | When relevant | "Do not modify the database schema" |
| Prior agent output | Cross-agent deps | "Agent A created `types.ts` with these exports: ..." |
| Business context | When complex | "This is for enterprise users who need audit trails" |
| Test strategy | Always | "Write unit tests with Vitest, mock external services" |

### Dependency Context

**Same-agent dependencies**: Reference previous work by file path with minimal duplication.

**Cross-agent dependencies**: Include comprehensive details:
- Explicit file-reading instructions
- Detailed output summaries from producing agent
- Usage guidance and integration requirements
- Clarification protocol for ambiguous aspects

## Sub-Agent Rules

- Each sub-agent works in its own worktree/branch (never share branches)
- Never deploy sub-agents out of sequence when dependencies exist
- Wait for phase completion before starting dependent phases
- Three-attempt debugging limit per agent — beyond that, escalate
- All work must be logged in designated memory files
- Sub-agents must validate their own output before reporting completion

## Handover Protocol

When an agent approaches context limits:
1. Complete current task cycle
2. Synthesize state from implementation plan and memory logs
3. Create handover file with: active context, coordination status, ready assignments, blocked items, working notes
4. Present for user review before transitioning
