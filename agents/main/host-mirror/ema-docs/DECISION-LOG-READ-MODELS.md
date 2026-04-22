# Decision Log Read Models

Status: draft architecture aid
Date: 2026-04-13

## Purpose

Define the Decision Log app as a cross-plane read model rather than a standalone CRUD shell.

## Suggested views

### Candidates
- Blueprint decision candidates
- reviewed provenance-derived decision candidates
- pending promotion candidates

### Canon
- ratified canon decisions
- supersedes chains
- implementation/gap overlays

### Operational
- decisions affecting goals, calendar, buildouts, and current commitments

### Runtime
- dispatch / redirect / attach / stop / escalation decisions
- linked execution artifacts and outcomes

### Outcomes
- decisions with downstream results
- positive/negative outcome notes
- unresolved follow-through

### Precedents
- similar past decisions
- linked rationale
- linked outcomes
- warnings when repeating failed patterns

## Important rule

Decision Log should aggregate across planes.
It should not imply that all decisions live in one table or one storage root.
