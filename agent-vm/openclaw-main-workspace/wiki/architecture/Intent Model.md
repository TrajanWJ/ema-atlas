# Intent Model

## Summary
Intent is the active coordination layer linking project state, execution lineage, session evidence, and durable semantic memory.

## Current truth
- EMA now has initial `Intent` and `ProjectState` schemas, persistence helpers, bootstrap seeds, and read-first routes.
- Proposal and execution records already carry intent fields in the runtime.
- wiki-engine can store intent-like pages, but page-centric intent should not be treated as the sole live authority.

## Canonical target
Live authority for intent should be:
- EMA `IntentRecord`
- EMA `ProjectStateRecord`

Wiki should hold:
- intent mirror pages
- project summaries
- decisions and architecture pages linked to intents

## Transitional legacy notes
- older docs describe richer intent hierarchies than are currently live in daemon code
- wiki-engine intent pages are useful semantic mirrors but too weak to be sole coordination authority

## Active blockers
- canonical write/update API for intents is not complete yet
- session/proposal/execution linkage to intents needs hardening
- wiki intent mirrors are not yet fully created

## Next actions
- expose write/bootstrap endpoints for intent/project-state
- link intents to sessions/executions/wiki refs more deeply
- create the first 8 intent mirror pages

## Linked intents
- `int_ema_root`
- `int_wiki_buildout`
- `int_session_normalization`
- `int_host_cli_integration`

## Linked refs / source docs
- `INTENT_SCHEMA.md`
- `EMA_INTENT_BOOTSTRAP_IMPLEMENTATION_MAP.md`
- `EMA_INTENT_BOOTSTRAP_API_SPEC.md`
