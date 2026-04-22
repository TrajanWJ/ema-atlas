# Intent Mirror: MCP Baseline

## Summary
Make the MCP baseline authoritative, layered, and generated across clients while documenting OpenClaw parity.

## Current focus
Stop hidden config drift and expose the real effective capability surface for Claude, Codex, and OpenClaw.

## Objectives
- define layered manifest model
- generate client configs from one source
- produce parity/diff reports

## Blockers
- Claude has unmanaged extras outside the baseline
- OpenClaw parity is documented but not yet generated/mechanical

## Next actions
- create layered manifest schema
- generate effective Claude/Codex diffs
- generate OpenClaw parity report

## Runtime authority note
Canonical live authority for this intent lives in EMA control plane, not this page.

## Linked refs
- `projects/EMA`
- `architecture/Canonical Architecture`
- `MCP_BASELINE_MANIFEST_SPEC.md`
- `OPENCLAW_CAPABILITY_PARITY.md`
