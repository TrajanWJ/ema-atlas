# Context Package

## Summary
EMA should assemble bounded context packages for all clients and surfaces.

## Current truth
- EMA now has a first-class `Ema.Context.Injector` scaffold.
- Read-first routes exist for:
  - project package
  - operator package
  - session evidence
- Focused tests now cover injector and controller read paths.

## Canonical target
All shared context should be assembled by EMA and consumed by:
- CLI
- MCP
- OpenClaw
- Claude
- Codex
- future UI surfaces

## Source precedence
1. live EMA host/runtime truth
2. durable wiki semantic memory
3. EMA project/task/execution state
4. EMA-normalized session evidence
5. local chat/session context

## Transitional legacy notes
- `context_for` remains a legacy/current helper during the migration
- clients still have residual ad hoc memory assembly behavior

## Active blockers
- wiki-engine semantic memory is not yet fully merged into EMA context packages
- shared context still leaks through surface-specific paths in some places

## Next actions
- promote context package endpoints as the shared-context contract
- phase down ad hoc context assembly across clients
- link wiki project pages and intent mirrors into package outputs more richly

## Linked intents
- `int_ema_root`
- `int_host_cli_integration`
- `int_wiki_buildout`
- `int_mcp_baseline`

## Linked refs / source docs
- `CONTEXT_PACKAGE_SPEC.md`
- `ema-shared-context-contract.md`
- `worker-context-contract-spec.md`
