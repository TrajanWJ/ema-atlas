# Decision Record Template (ADR)

Sources: [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record), [adr/madr](https://github.com/adr/madr) (MADR 4.0), [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config)

**When to use**: When making architectural decisions, choosing between technologies, establishing patterns, or making any decision that future sessions need to understand.

**Format**: Based on [MADR](https://adr.github.io/madr/) (Markdown Any Decision Records) v4.0 — the most widely adopted ADR format.

---

## Template

```markdown
# ADR-NNNN: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
**Deciders**: [who was involved]
**Project**: [[Project Name]]

## Decision Drivers

<!-- Forces that make this decision necessary. Check all that apply: -->
- [ ] Performance requirement
- [ ] Developer experience / ergonomics
- [ ] Bundle size / dependency weight
- [ ] Community support / ecosystem maturity
- [ ] Learning curve for the team
- [ ] Long-term maintenance burden
- [ ] Security implications
- [ ] Cost (hosting, licensing, API calls)
- [ ] Compatibility with existing stack
- [ ] Time-to-implement constraint
- [ ] Other: [describe]

## Context

What is the issue that we're seeing that is motivating this decision or change?
[Describe the forces at play — technical, business, organizational. Include constraints.]

## Decision

What is the change that we're proposing and/or doing?
[State the decision clearly in 1-2 sentences.]

## Options Considered

### Option A: [Name]
- **Description**: [how it works]
- **Pros**: [benefits]
- **Cons**: [drawbacks]
- **Risk**: [what could go wrong]

### Option B: [Name]
- **Description**: [how it works]
- **Pros**: [benefits]
- **Cons**: [drawbacks]
- **Risk**: [what could go wrong]

### Option C: [Name]
(if applicable)

## Consequences

### Positive
- [What becomes easier or better]

### Negative
- [What becomes harder or worse]

### Neutral
- [What changes but isn't clearly better or worse]

## Reversibility

How hard is it to change this decision later?
- **Easy**: Can switch in < 1 day with no data migration
- **Medium**: Requires refactoring but no data loss
- **Hard**: Requires data migration or breaks external contracts

## Validation

How will we know this was the right decision?
- [Metric to watch]
- [Signal to look for]
- [When to re-evaluate]

## Follow-Up Actions

- [ ] [Implementation task 1]
- [ ] [Update related convention or workflow note]
- [ ] [Update [[My Stack Decisions]] if stack-level]
- [ ] [Schedule re-evaluation date if needed]
- [ ] [Notify affected project notes]

## Related
- [[My Stack Decisions]]
- [Link to session that prompted this decision]
- [Link to superseded ADR, if any]

## Tags
#adr #[project] #[domain]
<!-- QMD keywords: [terms for future searchability] -->
```

---

## Real ADR Examples

### Example 1: State Management Choice

> **ADR-0001: Use Zustand over Redux for ExecuDeck state management**
>
> **Decision Drivers**: Developer experience, bundle size, learning curve
>
> **Context**: ExecuDeck needs client-side state for command palette, theme, and user preferences. Redux is the industry standard but adds boilerplate. Zustand is minimal and hook-based.
>
> **Decision**: Use Zustand.
>
> | | Redux Toolkit | Zustand | Jotai |
> |---|---|---|---|
> | Bundle size | 11kb | 1.2kb | 2.4kb |
> | Boilerplate | Medium | Minimal | Minimal |
> | DevTools | Excellent | Good | Fair |
> | Learning curve | Steep | Gentle | Gentle |
> | Ecosystem | Massive | Growing | Growing |
>
> **Consequences**: Faster development, smaller bundle. Fewer community examples for complex patterns.
> **Reversibility**: Medium — state logic is isolated, but touching every component that reads state.

### Example 2: Testing Framework

> **ADR-0002: Use Vitest over Jest for all new projects**
>
> **Decision Drivers**: Performance, Vite compatibility, ESM support
>
> **Decision**: Vitest — native ESM, same config as Vite, 2-5x faster on large suites.
>
> **Reversibility**: Easy — test files are nearly identical syntax.

### Example 3: Plugin Selection

> **ADR-0003: Use QMD over full-text Obsidian search for session recall**
>
> **Decision Drivers**: Token reduction, semantic search, local-first
>
> **Decision**: QMD provides BM25 + vector hybrid search with 60-95% token reduction vs raw file reads. Obsidian CLI used as fallback for tag-based queries.

---

## ADR Numbering

ADRs are numbered sequentially: `ADR-0001`, `ADR-0002`, etc. File names follow the pattern:
`ADR-0001 - Decision Title.md`

Check existing ADRs in `Session Log/` before assigning a number.
