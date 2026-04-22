# Session Model

## Summary
EMA should become the canonical session registry while preserving Claude and Codex as provider-native session authorities.

## Current truth
- Claude and Codex both have durable host-native session artifacts.
- EMA already has session-related surfaces/import/runtime pieces.
- Surface-local/session-local representations still overlap across OpenClaw, ClaudeForge, Discord projections, and provider-native stores.

## Canonical target
EMA owns the canonical session registry with:
- EMA session id
- provider + provider session id
- project/workspace binding
- linked executions/tasks/proposals/intents
- linked surfaces
- normalized messages/events

## Transitional legacy notes
- Claude is closer to first-class normalization than Codex.
- some surface layers still treat live processes or local stores as if they were canonical session truth.

## Active blockers
- Codex parity still incomplete
- surface-local session truth still overlaps
- session bindings to intents/project state need further hardening

## Next actions
- continue Codex parity and import normalization
- bind sessions to project/intents more explicitly
- keep session evidence visible in context packages

## Linked intents
- `int_session_normalization`
- `int_host_cli_integration`
- `int_codex_parity`

## Linked refs / source docs
- `EMA_HOST_SESSION_MODEL_2026-04-06.md`
- `EMA_HOST_SESSION_IMPLEMENTATION_MAP_2026-04-06.md`
- `SESSION_NORMALIZATION_PLAN.md`
