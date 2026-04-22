# Governance and Safety

## Summary
Governance and safety should constrain routing, automation, and surface behavior so the system remains legible and safe while gaining capability.

## Current truth
- policy/safety concerns appear across daemon docs, wrappers, provider flags, and surface-specific behavior
- some approval/automation semantics still differ across surfaces

## Canonical target
Governance and safety should define:
- acceptable automation levels
- authority boundaries
- approval vocabulary
- high-risk escalation paths
- surface behavior constraints

## Transitional legacy notes
- provider flags and surface-specific permission modes still vary
- some safety semantics are implicit in scripts/plugins rather than explicit shared policy

## Active blockers
- safety mode inconsistency across surfaces
- duplicated control paths in overlapping surfaces

## Next actions
- normalize permission vocabulary
- document cross-surface policy mapping
- keep governance pages linked to routing and OpenClaw parity work

## Linked intents
- `int_ema_root`
- `int_openclaw_surface_alignment`
- `int_mcp_baseline`

## Linked refs / source docs
- `docs/daemon-wiki/GOVERNANCE.md`
- `HIGH_RISK_AUTOMATION_POLICY.md`
- `OPENCLAW_CAPABILITY_PARITY.md`
