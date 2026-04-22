# Implementation Sprint Kickoff

**Status**: Active
**Date**: 2026-04-06 UTC
**Intent**: Convert the recovery specs into the next implementable work slices.

## Active Lanes

### Lane 2 — Gateway / Operator Access
Goal: make host/gateway introspection real enough to support recovery decisions.

**Current artifacts**
- `gateway-operator-access-plan.md`

**Next tasks**
- classify auth/scope failure mode in current shell path
- document canonical operator diagnostic path
- write operator access notes/troubleshooting tree

### Lane 3 — Substrate Implementation Start
Goal: begin implementation-facing work from the new specs instead of accumulating only planning docs.

**Current artifacts**
- `incident-ema-timeout-status.md`
- `host-truth-domain-spec.md`
- `execution-event-state-spec.md`
- `worker-context-contract-spec.md`
- `memory-authority-decision.md`

## Priority Order

### Track 3A — Timeout / incident instrumentation contract
First practical build slice because incident truth is still the top dependency.

**Implement next**
- timeout taxonomy schema in code/config/docs
- metric names and event dimensions
- raw vs segmented dashboard contract

**Acceptance**
- one canonical taxonomy
- explicit metric names/dimensions
- no ambiguity between queue/connect/read/total/client-cancel

### Track 3B — Host-truth reducer and state machine
Second practical slice because control-plane truth depends on it.

**Implement next**
- normalized host-truth types
- reason-code enum
- state machine with hysteresis thresholds
- stale-data transition rules

**Acceptance**
- deterministic state transitions
- no-data => unknown, never healthy
- test matrix defined for flapping/staleness/recovery

### Track 3C — Execution state/event contract
Third practical slice because HQ and orchestration need a canonical execution model.

**Implement next**
- execution status enum
- execution event types
- append-only event contract
- completion callback payload contract

**Acceptance**
- timeline reconstructable from events
- terminal state durable and explicit
- blocked/waiting/retrying/orphaned represented distinctly

### Track 3D — Worker/context schema bootstrap
Fourth slice because multi-agent execution needs stable contracts before scale.

**Implement next**
- worker assignment schema
- context bundle schema
- worker result schema
- acceptance record schema

**Acceptance**
- assignment can be executed with bounded context
- result is machine-readable and verifier-friendly

### Track 3E — Memory ingestion authority wiring
Fifth slice because future retrieval/integration work depends on it.

**Implement next**
- ingest lifecycle doc/code stub
- source classification
- linkage model for brain dump -> project/task

**Acceptance**
- index is explicitly derived, not canonical
- project/task linkage is first-class

## Suggested Build Sequence

### Sprint A
- formalize timeout taxonomy
- formalize host-truth types + reasons
- formalize execution status/event enums

### Sprint B
- formalize D1 operator response schema
- formalize D2 transition event schema
- formalize worker assignment/result schemas

### Sprint C
- formalize ingest/update lifecycle
- formalize project/task linkage
- start mapping these docs to real code locations once repo substrate is available

## Definition of Forward Motion

This kickoff counts as successful only if the next iteration produces at least one of:
- code types/interfaces matching one of the specs
- a canonical schema file
- a runnable stub/projection
- tests that lock down lifecycle/state behavior

## Immediate Next Artifacts

- `gateway-operator-access-notes.md`
- `timeout-taxonomy-contract.md`
- `host-truth-state-machine.md`
- `execution-event-schema.md`
