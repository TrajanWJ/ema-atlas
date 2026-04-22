---
title: Code Patterns
type: system-reference
status: active
created: 2026-03-25
updated: 2026-04-06
tags: [code, patterns, snippets, system, reference, reuse]
confidence: 0.86
source: session-derived pattern catalog + vault cross-reference
summary: Curated reference for reusable code patterns captured from Claude Code / OpenClaw work. Explains what counts as a worthwhile pattern, how to classify/use patterns, and when raw snippet catalogs help versus when they become noise.
related:
  - [[Spec-Driven Development Patterns]]
  - [[Phoenix WebSocket + React 19 + Zustand — HQ Pattern Research]]
  - [[Agent Orchestration Patterns]]
---

# Code Patterns

> A code pattern is only valuable if it transfers. If it is just a one-off code fragment with no general lesson, it belongs in session history, not in a pattern library.

This note upgrades the old auto-generated snippet dump into a more useful system reference.

---

## Executive Summary

The old version of this note functioned mostly as a **catalog of captured code blocks** from Claude Code and OpenClaw sessions. That archive is still useful, but by itself it has three problems:

1. it over-represents snippets and under-explains why they matter
2. it mixes durable patterns with one-off examples
3. it makes retrieval harder because the useful abstraction is buried inside raw code

So the right way to use `Code Patterns` is:
- keep raw examples searchable,
- but organize the note around **pattern classes, evaluation criteria, and reuse guidance**.

The practical principle is:

> **Store examples as evidence; store patterns as transferable ideas.**

---

## What Counts as a Code Pattern

Not every block of code is a pattern.

A code block becomes a pattern when it demonstrates one or more of these:
- a repeatable solution to a recurring problem
- a reusable interface or control structure
- a debugging/operational idiom that generalizes
- a safe default for a class of tasks
- a structural shape that improves clarity, reliability, or maintainability

### Good pattern examples
- validation before destructive execution
- additive schema evolution
- hook-based post-write indexing
- socket lifecycle in external store, not React component state
- file-based queue with durable audit trail
- fallback-to-mock pattern for UI development
- envelope response shapes for paginated APIs

### Weak “patterns” that are really just snippets
- a one-time CLI invocation with project-specific names
- a data literal with no broader lesson
- a command sequence that only matters for one merge conflict in one repo
- generated JSON that exists only as an example artifact

The difference is transferability.

---

## What This Catalog Is For

This note is useful for four main jobs.

## 1. Reuse
When solving a problem that has likely appeared before, pattern search is often faster than re-deriving the approach.

## 2. Style stabilization
Patterns help keep recurring implementation shapes consistent across projects.

## 3. Agent grounding
Agents perform better when they can see examples of preferred implementation shapes, not just abstract advice.

## 4. Knowledge distillation
Session logs are noisy. Patterns are the distilled layer: “what should we reuse next time?”

---

## The Right Structure for a Pattern Library

A useful pattern library should preserve three layers:

### Layer 1 — Pattern summary
A short explanation of the recurring solution.

### Layer 2 — Why/when to use it
Context, constraints, anti-patterns, and tradeoffs.

### Layer 3 — Example snippet
Concrete code or command example proving the pattern is real.

If you only keep layer 3, the library becomes grep fodder instead of knowledge.

---

## Main Pattern Classes in This Environment

The captured examples in this environment cluster into a few recurring groups.

## 1. Operational shell patterns
These are command-line routines for:
- debugging
- inspection
- validation
- environment repair
- service health triage

Examples include:
- process inspection
- syscall observation
- JSON validation after manual edits
- lockfile regeneration after dependency-file conflicts

### Why these matter
These patterns are practical, repeatable, and often worth reusing exactly or with minor changes.

### What to watch out for
Some shell patterns are highly context-specific and should not be over-generalized.

---

## 2. Integration patterns
These show how components connect across system boundaries.

Examples from adjacent notes and catalogs:
- Phoenix WebSocket + Zustand lifecycle management
- MCP server usage patterns
- Obsidian runtime/tooling integration
- dispatch/queue/agent feed wiring

### Why these matter
Integration code is where systems usually become brittle. Pattern reuse here has outsized value.

---

## 3. Safety and validation patterns
These are among the highest-value patterns because they reduce trust failures.

Examples:
- validate JSON after merge conflict resolution
- explicit checks before continuing a destructive operation
- protected-file hooks
- schema extension via optional fields instead of breaking changes

### Why these matter
They do not just make code “cleaner.” They make the system less likely to do dumb or irreversible things.

---

## 4. Data-shape patterns
These are structured response or config shapes that recur across systems.

Examples:
- pagination envelopes
- event registries
- proposal/task schema shapes
- metadata-rich records for later automation
- structured logs and manifests

### Why these matter
In agent systems especially, the shape of data often matters more than the cleverness of the code manipulating it.

---

## 5. UX / frontend state patterns
Examples:
- socket stored outside React render cycle
- event feed models
- active-task panels
- bridge-or-mock fallback pattern
- cross-navigation linking

### Why these matter
Frontend systems become much easier to reason about when state and event patterns are consistent.

---

## 6. Orchestration patterns
These are patterns for multi-step, multi-agent, or asynchronous work.

Examples from adjacent system notes:
- file-based dispatch queues
- DAG/dependency routing
- typed task/proposal contracts
- proposal → approval → dispatch → evaluation loops
- agent handoff protocols

### Why these matter
This is where the local stack has the most compound leverage.

---

## How to Judge Whether a Pattern Is Worth Keeping

A simple test helps.

### Keep it if it has at least two of these:
- recurs across sessions or projects
- reduces risk or ambiguity
- captures a preferred local implementation style
- saves time when rediscovered
- provides a reusable interface or contract
- documents a non-obvious but durable lesson

### Don’t elevate it if it is mostly:
- project-specific literal data
- transient installation instructions that age fast
- obvious shell trivia with no system-specific relevance
- a one-off generated output blob

This keeps the pattern library from becoming cluttered.

---

## Pattern Quality Criteria

A strong stored pattern should usually answer:

### What problem does it solve?
Be concrete.

### When should it be used?
Avoid pattern cargo-culting.

### Why is this shape preferable?
Explain the tradeoff or local preference.

### What are the failure modes?
Patterns without boundary conditions become anti-patterns.

### What does a minimal example look like?
Keep one.

This applies especially when turning session snippets into vault knowledge.

---

## How Raw Snippet Catalogs Still Help

The old note was not useless — just incomplete.

Raw snippet catalogs are still good for:
- semantic/code search
- finding exact command syntax previously used
- copying a working starting point
- reminding future-you that a solution already existed

### The right stance
Do not delete raw examples. Instead:
- keep them searchable
- but pair them with stronger summaries and categorization

That is why the old dump still has value as source material.

---

## Common Anti-Patterns in Code Pattern Notes

## 1. Snippet hoarding
Saving every code block as if future-you will reuse it.

## 2. No abstraction layer
Showing code but not explaining the pattern.

## 3. No local preference signal
A pattern library should reflect what this system prefers, not just what happened once.

## 4. No aging mechanism
Installation steps, versions, and commands go stale quickly if treated as timeless truths.

## 5. No distinction between example and standard
A pattern note should say whether something is:
- recommended default
- one valid example
- legacy pattern
- experimental pattern

---

## Recommended Pattern Note Template

When promoting a raw snippet into a reusable vault note, use roughly this structure:

### Title
Short, reusable name.

### Problem
What recurring issue this pattern addresses.

### Pattern
Short explanation of the solution shape.

### Why it works
Tradeoffs / rationale.

### When to use it
Scope and fit.

### When not to use it
Boundary conditions.

### Example
Small code sample.

### Related notes
Link to adjacent architecture/system references.

This creates notes that are actually teachable to humans and agents.

---

## Strong Pattern Families Already Present in the Vault

The vault already contains richer pattern notes than the old raw snippet dump suggested.

### Examples worth cross-linking
- [[Spec-Driven Development Patterns]]
- [[Phoenix WebSocket + React 19 + Zustand — HQ Pattern Research]]
- [[Agent Orchestration Patterns]]
- dispatch-related intelligence pattern notes
- context-compression and continuity patterns
- schema and autonomy notes

### Why this matters
The best use of `Code Patterns` is not to duplicate those notes, but to act as:
- an umbrella reference
- a policy for what belongs in the code-pattern layer
- and a guide for promoting snippets into proper notes

---

## Local Guidance for Claude / Agent Workflows

For this environment, the right coding-pattern behavior is:

### Prefer patterns that are:
- deterministic
- inspectable
- composable
- easy to diff
- safe by default
- explicit about lifecycle/state

### Be suspicious of patterns that are:
- clever but opaque
- prompt-dependent without structured contracts
- hard to audit
- hard to test
- impossible to recover from when wrong

This preference shows up all over the surrounding architecture.

---

## Suggested Organization Going Forward

Rather than keeping one giant flat list of snippets, the healthier long-term structure is:

### Keep this note as the index/policy layer
Explain what code patterns are and how to use them.

### Store high-value reusable patterns as dedicated notes
Examples:
- dispatch patterns
- socket/store patterns
- schema patterns
- CLI/shell repair patterns
- validation patterns

### Preserve raw snippet archives as searchable evidence
Useful, but secondary.

### Promote recurring snippet classes into typed sub-notes when they show repeated value
This is where the library compounds.

---

## Example Pattern Evaluations

Here are a few examples of how to classify captured material.

### Example: “validate package.json after merge conflict, regenerate lockfile, continue merge”
**Verdict:** keep as a pattern.  
Why: repeatable operational repair sequence with clear safeguards.

### Example: “athlete metadata JSON literal”
**Verdict:** weak as a general pattern.  
Why: more example data than reusable implementation shape.

### Example: “store Phoenix socket in Zustand, not React state”
**Verdict:** strong pattern.  
Why: concrete architectural lesson with real reuse value.

### Example: “clone repo X and run install.sh”
**Verdict:** usually not a durable pattern.  
Why: ages quickly and is mostly install trivia unless part of a broader integration pattern.

---

## Bottom Line

A useful code-pattern library is not a scrapbook of code blocks. It is a **distillation layer** between noisy session history and reusable engineering memory.

The right rule is:

> **Capture examples, but promote only the patterns that actually transfer.**

That keeps the vault useful to both humans and agents.

---

## Legacy Note on the Raw Catalog

The prior version of this note served as an automatically generated snippet catalog (“37 patterns across 5 languages”). That raw material still has value as searchable evidence, but it should be treated as source data, not the final form of the pattern library.

If needed, the raw catalog can be reintroduced or split into:
- `Code Snippet Archive`
- or language-specific appendices

while this note remains the higher-level reference.

---

## See Also

- [[Spec-Driven Development Patterns]]
- [[Phoenix WebSocket + React 19 + Zustand — HQ Pattern Research]]
- [[Agent Orchestration Patterns]]
- [[System Data Flow]]

#code #patterns #reference #reuse #system
