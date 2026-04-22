# Routing Engine

## Summary
Routing determines how work, providers, and surfaces are selected. It should be governed by canonical control-plane policy rather than drifting per-surface heuristics.

## Current truth
- routing logic exists in both runtime and docs
- provider/model/surface behavior still overlaps across EMA, OpenClaw, Claude, Codex, and ClaudeForge
- MCP/plugin drift affects effective routing behavior indirectly

## Canonical target
Routing should be:
- policy-aware
- context-aware
- explicit
- observable
- bound to EMA control-plane decisions

## Transitional legacy notes
- provider-specific and surface-specific routing assumptions still leak through configs and plugins

## Active blockers
- hidden MCP/plugin extras
- incomplete Codex parity
- mixed safety/permission semantics across surfaces

## Next actions
- continue layered MCP manifest work
- continue provider parity work
- link routing policy with governance/safety docs

## Linked intents
- `int_mcp_baseline`
- `int_codex_parity`
- `int_openclaw_surface_alignment`

## Linked refs / source docs
- `docs/daemon-wiki/ROUTING.md`
- `OPENCLAW_CAPABILITY_PARITY.md`
- `MCP_BASELINE_MANIFEST_SPEC.md`
