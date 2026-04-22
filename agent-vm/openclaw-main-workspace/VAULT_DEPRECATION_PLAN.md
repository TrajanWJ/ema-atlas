# Vault Deprecation Plan

## Goal
Demote vault from primary operational memory to import/archive/mirror role.

## New write targets
- EMA runtime/control state
- Wiki semantic memory
- Intent records

## Vault remains useful for
- historical notes
- import source
- archive/mirror

## Migration sequence
1. stop treating vault as required for active continuation
2. build wiki canonical project and architecture pages
3. move active project state into EMA + Wiki + Intents
4. keep vault optional for backfill/import only

## Rule
If a future agent needs vault to continue active work, migration is incomplete.
