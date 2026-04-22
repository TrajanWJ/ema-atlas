# EMA

## Summary
EMA is the canonical host control plane for the emerging agent stack. It should own runtime truth, session normalization, project state, intents, tasks/proposals/executions, and bounded context assembly.

## Current truth
- EMA already has a real daemon control-plane and surfaces spine.
- EMA already has proposal/execution/outcome lineage, host-truth projection, OpenClaw integration, and bounded context nucleus.
- EMA now also has initial intent/project-state scaffolding, a migration for intent/project-state tables, read-first API routes, and bootstrap seed data.

## Canonical target
EMA becomes the canonical authority for:
- project state
- intent state
- canonical session registry
- context packages
- surface bindings
- runtime/control truth

## Transitional legacy notes
- ClaudeForge remains a parallel surface/task/session stack in parts.
- wiki-engine remains a separate semantic subsystem that still needs normalization into EMA context assembly.
- dispatch shell / dispatch.db remain transitional runtime evidence in places.
- vault remains historical/import/archive and is being demoted from primary active memory.

## Active blockers
- split session truth across EMA / provider-native stores / surfaces
- duplicated context assembly across clients and tools
- MCP/plugin drift, especially Claude extras outside baseline
- vault dependence not fully removed yet

## Next actions
- finish wiki/intents buildout
- normalize session registry behavior in EMA
- operationalize layered MCP baseline + parity reports
- bind surfaces cleanly to EMA truth

## Linked intents
- `int_ema_root`
- `int_host_cli_integration`
- `int_session_normalization`
- `int_mcp_baseline`
- `int_wiki_buildout`

## Linked refs / source docs
- `CANONICAL_ARCHITECTURE.md`
- `INTENT_SCHEMA.md`
- `CONTEXT_PACKAGE_SPEC.md`
- `EMA_INTENT_BOOTSTRAP_IMPLEMENTATION_MAP.md`
- `EMA_INTENT_BOOTSTRAP_API_SPEC.md`
- `CLI_FEATURE_MAP.md`
