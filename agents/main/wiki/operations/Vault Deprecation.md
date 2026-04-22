# Vault Deprecation

## Summary
Vault is deprecated as the primary operational memory substrate.

## Current truth
- Vault still contains useful historical/session-derived material.
- Some existing habits and tooling still assume vault-backed continuation.
- The new direction is wiki + intents + EMA context authority.

## Canonical target
New operational truth should be written to:
- EMA runtime/control state
- Wiki semantic memory
- Intent records

Vault should remain:
- import source
- archive/mirror
- historical fallback only

## Transitional legacy notes
- `vault-filesystem` remains in the MCP baseline for now as a transitional item
- migration is incomplete until active continuation works without vault as a dependency

## Active blockers
- some client/operator flows still assume vault-first lookup
- canonical wiki pages and intent mirrors are not fully built yet

## Next actions
- finish wiki page spine
- finish intent mirror buildout
- classify and deprecate transitional vault MCP usage

## Linked intents
- `int_vault_deprecation`
- `int_wiki_buildout`
- `int_mcp_baseline`

## Linked refs / source docs
- `VAULT_DEPRECATION_PLAN.md`
- `CANONICAL_ARCHITECTURE.md`
