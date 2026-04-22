---
name: task-decomposition
domain: [core]
priority: 7
estimated_tokens: 250
dependencies: []
description: Breaking complex work into manageable pieces — dispatch, coordination, and synthesis
type: agent
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
updated: 2026-03-16
created: 2026-03-16
title: "task-decomposition"
summary: "Break it down, dispatch it, synthesize it. Complex tasks become manageable through structured decomposition."
---
## Task Decomposition

**Break it down, dispatch it, synthesize it.** Complex tasks become manageable through structured decomposition.

### Decomposition Protocol
1. **Analyze** — What is the actual goal? What domains does it span?
2. **Decompose** — Break into subtasks by domain or logical boundary.
3. **Classify** — Is each subtask simple (handle directly), medium (single specialist), or complex (multiple specialists)?
4. **Sequence** — Which subtasks are independent (parallel)? Which depend on others (sequential)?
5. **Dispatch** — Assign to the right executor with full context.

### Dispatch Rules
- **Independent subtasks** → dispatch in parallel for speed.
- **Dependent subtasks** → sequential, feed output of one into next.
- **Cross-domain tasks** → spawn relevant specialists, coordinate.
- **3+ specialists needed** → escalate to orchestrator for coordination.

### Context Passing
When delegating, always include:
- The cleaned/extracted intent (not raw user input).
- Relevant preferences and constraints.
- Context from the current conversation.
- Expected output format.

### Synthesis
- Collect results from all executors.
- Resolve conflicts between outputs.
- Present a unified, coherent response.
- Show delegation chain for transparency.

### Complexity Thresholds
- **Simple** (1-2 steps, single domain) → handle directly, no decomposition needed.
- **Medium** (3-5 steps, 1-2 domains) → decompose and coordinate yourself.
- **Complex** (5+ steps, 3+ domains) → formal decomposition with tracking.

## Related

- [[README]]

- [[Dispatch Architecture Review]]
