---
title: "Semantic vs Pragmatic Code Split"
source: https://aicode.swerdlow.dev
created: 2026-03-19
type: research
tags: [code-quality, ai-coding, architecture, agent-patterns]
confidence: 0.8
---

# Semantic vs Pragmatic Code Split

Author: Ben Swerdlow. Core principle: "Code should be self documenting."

## The Model
All code falls into three categories that should be treated differently by AI agents:

### Semantic Functions
- **Minimal, testable, no side effects**
- Accept all required inputs, return outputs directly
- Safe to reuse without understanding internals
- "Should not need any comments around them, the code itself should be a self describing definition"
- Extremely unit testable due to well-defined scope
- Range from simple (`quadratic_formula()`) to complex (`retry_with_exponential_backoff_and_run_y_in_between<Y: func, X: Func>(x: X, y: Y)`)
- **AI writes these freely** — high confidence, low risk

### Pragmatic Functions
- **Complex wrappers, expected to change completely over time**
- Wrap semantic functions + unique business logic
- Used in only a few places; if used everywhere, extract logic into semantic functions
- Examples: `provision_new_workspace_for_github_repo(repo, user)`, `handle_user_signup_webhook()`
- Integration testing within full app context (not unit tests)
- Include doc comments noting unexpected behaviors ("fails early on balance less than 10")
- **Need human review** — AI proposes, human validates

### Models (Data Structures)
- **Make wrong states impossible** (not just unlikely, not just handled)
- Each optional field = a question the codebase answers repeatedly (minimize them)
- Name precisely: names should indicate which fields belong
- **Composition over flattening**: `UserAndWorkspace { user: User, workspace: Workspace }` not merged fields
- **Brand types**: `DocumentId(UUID)` not bare `UUID` — prevents accidental ID swapping

## Design Rule
```
impossible > unlikely > handled > possible
```
Use the type system to eliminate invalid states at compile time. Don't write runtime checks for things the type system can prevent.

## Where Things Break

### Function Degradation
Semantic functions morph into pragmatic ones for convenience — someone adds a side effect, then another. Suddenly a "pure" function is causing unintended effects elsewhere. **Solution**: Name functions by usage location, not just functionality.

### Model Decay
"Just one more optional field" accumulates until models become "a loose bag of half-related data." **When fields no longer cohere around the model's name, split into distinct concepts.**

## Applied to Our Coder Agent

### Classification Gate
Before writing code, classify the task:

| Task Type | Category | Agent Behavior |
|-----------|----------|----------------|
| Pure utility function | Semantic | Full auto — write + test + commit |
| Data transformation | Semantic | Full auto |
| API endpoint handler | Pragmatic | Write + test, flag for review |
| Database migration | Pragmatic | Draft only, require human approval |
| Config/infra change | Pragmatic | Draft only, require human approval |
| State mutation logic | Pragmatic | Write + test, flag for review |
| Data model definition | Model | Draft, review field necessity + types |

### Implementation
Add to Coder SOUL:
```
Before writing code, classify:
- SEMANTIC (pure, testable, well-scoped): write freely, commit with tests
- PRAGMATIC (stateful, external deps, changes often): write and flag for Trajan review
- MODEL (data shape): draft, review optional fields + composition + brand types
```

## Related
- [[security-agent-attack-vectors-2026-03-19]] — GouvernAI risk tiers are similar classification
- [[intercept-mcp-guardrails]] — enforcement of the pragmatic review gate
