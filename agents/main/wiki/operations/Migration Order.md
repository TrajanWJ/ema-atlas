# Migration Order

## Summary
The migration should proceed by freezing canonical truth, validating first-run runtime surfaces, building semantic mirrors, and then normalizing clients/surfaces around shared authority.

## Recommended order
1. freeze canonical docs/contracts
2. validate EMA read-first bootstrap path
3. seed project state and intents
4. build the first canonical wiki pages and intent mirrors
5. normalize session registry behavior
6. normalize layered MCP manifest and parity reports
7. align OpenClaw/Claude/Codex/ClaudeForge to shared truth
8. continue vault deprecation and legacy demotion

## Why this order
It prioritizes:
- clarity before expansion
- runtime truth before semantic mirrors
- semantic mirrors before surface convenience
- controlled migration rather than more overlap

## Active blockers
- remaining MCP/plugin drift
- incomplete surface parity
- incomplete wiki/intents coverage

## Linked intents
- `int_ema_root`
- `int_wiki_buildout`
- `int_mcp_baseline`
- `int_vault_deprecation`

## Linked refs / source docs
- `CANONICAL_ARCHITECTURE.md`
- `READINESS_CHECKLIST_INTENT_BOOTSTRAP.md`
- `CLI_ROLLOUT_PLAN.md`
