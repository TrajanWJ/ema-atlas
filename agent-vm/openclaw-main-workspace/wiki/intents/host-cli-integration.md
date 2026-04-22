# Intent Mirror: Host CLI Integration

## Summary
Normalize the host CLI integration stack across EMA, Claude, Codex, OpenClaw, and MCP.

## Current focus
Turn planning and recovery work into canonical read/write runtime surfaces and aligned client behavior.

## Objectives
- align CLI surface with EMA endpoints
- normalize OpenClaw/Claude/Codex roles
- make MCP/core tool usage coherent

## Blockers
- MCP/plugin drift
- surface overlap
- remaining provider/session asymmetry

## Next actions
- continue read/bootstrap route hardening
- continue CLI rollout mapping
- continue OpenClaw parity work

## Runtime authority note
Canonical live authority for this intent lives in EMA control plane, not this page.

## Linked refs
- `projects/EMA`
- `architecture/Canonical Architecture`
- `CLI_FEATURE_MAP.md`
