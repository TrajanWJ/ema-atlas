# Dispatch Substrate

## Summary
Dispatch remains part of the operational execution substrate, but it should be treated as transitional runtime evidence rather than the final cognitive/control authority.

## Current truth
- dispatch-related loops and artifacts still exist in the system
- replay/board/runtime flows still surface dispatch-oriented information
- execution lineage is increasingly being normalized into EMA control-plane models

## Canonical target
Dispatch should sit underneath EMA control-plane authority as execution substrate/runtime evidence, not above it.

## Transitional legacy notes
- dispatch shell / dispatch.db are still real in parts of the system
- older docs/specs sometimes over-center dispatch as if it were the architecture itself

## Active blockers
- dispatch truth and EMA truth are not fully collapsed into one mental model yet
- some operator surfaces still think in dispatch-first terms

## Next actions
- keep dispatch modeled as substrate
- keep normalizing operator views around EMA control-plane truth
- preserve replay/debuggability without preserving split-brain authority

## Linked intents
- `int_host_cli_integration`
- `int_openclaw_surface_alignment`
- `int_ema_root`

## Linked refs / source docs
- `docs/daemon-wiki/DISPATCH.md`
- `DISPATCH_SUBSTRATE_MAP_2026-04-06.md`
- `DISPATCH_ENGINE_INVARIANTS_2026-04-06.md`
