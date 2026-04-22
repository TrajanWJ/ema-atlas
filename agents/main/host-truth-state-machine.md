# Host-Truth State Machine

**Status**: Draft v0
**Date**: 2026-04-06 UTC

## States

Truth states:
- `healthy`
- `degraded`
- `unhealthy`
- `unknown`

Overlays:
- `maintenance`
- `silenced`

## Core Rules

- `unknown` means insufficient or stale evidence
- no data must never be treated as healthy
- overlays affect notification/automation behavior, not underlying truth
- operator display and transition eventing share truth state but apply different smoothing thresholds

## Inputs

Primary inputs:
- heartbeat freshness
- critical service check pass ratio
- network reachability
- supervisor integrity
- system pressure
- anomaly assessment
- data freshness

## Threshold Model

Example score thresholds:
- enter `degraded` when score < 0.80
- exit `degraded` when score > 0.88
- enter `unhealthy` when score < 0.45
- exit `unhealthy` when score > 0.55

### Unknown thresholds
- stale warning threshold marks host stale
- unknown TTL transitions host to `unknown`

## Allowed Transitions

- `unknown -> healthy | degraded | unhealthy`
- `healthy -> degraded | unknown`
- `degraded -> healthy | unhealthy | unknown`
- `unhealthy -> degraded | unknown`
- overlays may be toggled on any state

## Transition Guards

A transition should only occur when:
- minimum evidence threshold met
- minimum confidence threshold met
- debounce/stability window satisfied
- stale-data rules evaluated

## Recovery Rules

- recovery from `unhealthy` should normally pass through `degraded` before `healthy`
- recovery requires sustained healthy evidence, not a single good sample
- repeated oscillation should be penalized by anomaly/flapping logic

## Eventing Rules

Emit health transition only when exposed truth state changes.
Do not emit for score-only movement inside same state band.

## Example Transition Cases

### Healthy to degraded
- heartbeat age rises beyond expected window
- service check pass ratio drops
- anomaly penalty pushes score below degraded threshold

### Degraded to unhealthy
- critical checks fail persistently
- supervisor missing with high confidence
- reachability failure plus stale telemetry

### Any active state to unknown
- evidence exceeds unknown TTL
- telemetry silence makes confidence insufficient

### Recovery
- score improves above hysteresis exit threshold
- confidence stabilizes
- stale flag clears

## Minimum Tests

- one-sample spike does not flip state unnecessarily
- stale heartbeat drives `healthy -> degraded -> unknown`
- recovery requires sustained evidence
- identical recomputation does not emit duplicate transition
- no-data path never returns `healthy`
