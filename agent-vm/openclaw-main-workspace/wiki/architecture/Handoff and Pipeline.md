# Handoff and Pipeline

## Summary
Handoff and pipeline behavior should preserve continuity across sessions, executions, surfaces, and semantic memory.

## Current truth
- handoff and pipeline ideas are present in daemon docs and runtime lineage flows
- continuity is still partly fragmented across sessions, surfaces, and semantic layers

## Canonical target
Handoffs should preserve:
- intent linkage
- session linkage
- execution lineage
- bounded context package continuity
- durable semantic summary in wiki

## Transitional legacy notes
- some handoff continuity still relies on session-local or surface-local memory assumptions

## Active blockers
- incomplete canonical session registry normalization
- incomplete wiki/intents mirror buildout

## Next actions
- bind handoff semantics to canonical session ids and intents
- ensure wiki mirrors reflect handoff outcomes
- keep pipeline continuity explicit rather than implied

## Linked intents
- `int_session_normalization`
- `int_host_cli_integration`
- `int_wiki_buildout`

## Linked refs / source docs
- `docs/daemon-wiki/HANDOFF.md`
- `EMA_HOST_SESSION_MODEL_2026-04-06.md`
- `CONTEXT_PACKAGE_SPEC.md`
