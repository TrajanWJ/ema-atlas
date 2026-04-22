# Babysitter Surface Governor Execution Plan

See mirrored canonical content in `vault/System/Operations/Babysitter Surface Governor Execution Plan.md`.

## Summary

Babysitter becomes the **surface governor** for EMA.

- semantic lanes define **what** an update means
- cadence buckets define **how fast** it may move
- adaptive tick policy adjusts **within bucket bounds**
- `#babysitter-live` remains operator rollup only

## Core model

### Control plane
- `#babysitter-sprint`

### Semantic lanes
- `#system-heartbeat`
- `#intent-stream`
- `#pipeline-flow`
- `#agent-thoughts`
- `#intelligence-layer`
- `#memory-writes`
- `#execution-log`
- `#babysitter-live`

### Cadence buckets
- hot → 5s–30s
- warm → 30s–120s
- medium → 5m–30m
- slow → 30m–3h
- archive/trend → 3h+

## Execution focus

Primary EMA code touchpoints:
- `daemon/lib/ema/babysitter/stream_channels.ex`
- `daemon/lib/ema/babysitter/stream_ticker.ex`
- `daemon/lib/ema/babysitter/channel_policy.ex`
- `daemon/lib/ema/stream/manager.ex`
- `daemon/lib/ema/stream/babysitter.ex`
- `docs/REALTIME_SURFACE.md`

## Immediate actions
1. encode lane × bucket registry
2. refactor ticker to be bucket-aware
3. expose lane/bucket/reason in babysitter snapshot
4. align visible routing so `#babysitter-live` is operator delta only
5. verify end-to-end and update realtime docs

## Related
- [[Babysitter Stream Master Guide]]
- [[Babysitter Operator Cheat Sheet]]
- [[EMA Sprint — 2026-04-04]]
