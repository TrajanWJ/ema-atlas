# Intent Mirror: Session Normalization

## Summary
Normalize Claude and Codex provider-native session truth into EMA as canonical session registry.

## Current focus
Preserve provider-native durable histories while demoting surface-local/session-local truths.

## Objectives
- maintain Claude import path
- harden Codex parity
- bind sessions to projects/executions/intents

## Blockers
- Codex parity still incomplete
- multiple overlapping session stores remain in play

## Next actions
- continue importer parity work
- add canonical session bindings
- ensure session evidence is part of context packages everywhere

## Runtime authority note
Canonical live authority for this intent lives in EMA control plane, not this page.

## Linked refs
- `projects/EMA`
- `architecture/Canonical Architecture`
- `SESSION_NORMALIZATION_PLAN.md`
