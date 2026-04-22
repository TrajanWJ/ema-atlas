# Intent Mirror: Codex Parity

## Summary
Bring Codex to parity with Claude in canonical session handling, MCP alignment, and operator-visible semantics.

## Current focus
Reduce the gap between Claude’s more mature integration path and Codex’s still-partial normalization.

## Objectives
- preserve provider-native session truth
- normalize Codex import/resume/event handling
- keep Codex aligned to the same MCP/core capability story

## Blockers
- Codex session parity still incomplete
- some tooling and surface assumptions still skew Claude-first

## Next actions
- continue Codex import and binding normalization
- continue layered MCP manifest work
- verify Codex reads the same context/intents/project state as Claude and OpenClaw

## Runtime authority note
Canonical live authority for this intent lives in EMA control plane, not this page.

## Linked refs
- `SESSION_NORMALIZATION_PLAN.md`
- `MCP_BASELINE_MANIFEST_SPEC.md`
- `architecture/Session Model`
