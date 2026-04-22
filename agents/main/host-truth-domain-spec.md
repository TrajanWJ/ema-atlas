# Host-Truth Domain Spec

**Status**: Draft v0
**Date**: 2026-04-06 UTC

## Purpose

Define a normalized host-health truth model that supports both:
- operator-facing status views
- transition-driven automation/eventing

This spec separates raw observations from normalized truth so dashboards and alerts do not flap on noisy input.

## Core Model

### RawProbeSample
Represents a single raw observation.

```ts
interface RawProbeSample {
  hostId: string
  observedAt: string
  source: 'agent' | 'heartbeat' | 'probe' | 'os' | 'network' | 'service'
  signals: {
    processAlive?: boolean
    reachable?: boolean
    lastHeartbeatAgeMs?: number
    criticalCheckPassRatio?: number
    cpuPressure?: number
    memoryPressure?: number
    diskPressure?: number
    queueLagMs?: number
    clockSkewMs?: number
    supervisorPresent?: boolean
  }
  metadata?: Record<string, unknown>
}
```

### NormalizedHostTruth
Current best normalized truth for one host.

```ts
interface NormalizedHostTruth {
  hostId: string
  computedAt: string
  truthVersion: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  score: number
  confidence: number
  reasons: ReasonCode[]
  signals: Record<string, number | boolean | null>
  stale: boolean
  stalenessMs: number
  maintenance: boolean
  silenced: boolean
  anomaly?: AnomalyAssessment
}
```

### HealthTransitionEvent
Only emitted when exposed truth transitions meaningfully.

```ts
interface HealthTransitionEvent {
  eventType: 'host.health.transition'
  hostId: string
  fromStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  toStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  transitionAt: string
  durationInPreviousStateMs: number
  reasonCodes: ReasonCode[]
  score: number
  confidence: number
  stale: boolean
  truthVersion: string
  sequence: number
  correlationKey: string
}
```

## Reason Codes

```ts
type ReasonCode =
  | 'HEARTBEAT_STALE'
  | 'SERVICE_DOWN'
  | 'NETWORK_UNREACHABLE'
  | 'CPU_PRESSURE'
  | 'MEMORY_PRESSURE'
  | 'DISK_PRESSURE'
  | 'SUPERVISOR_MISSING'
  | 'CHECK_DATA_STALE'
  | 'ANOMALY_LATENCY_SPIKE'
  | 'ANOMALY_RESTART_LOOP'
  | 'MAINTENANCE_MODE'
```

## Anomaly Model

```ts
interface AnomalyAssessment {
  present: boolean
  kind?:
    | 'RESTART_LOOP'
    | 'HEARTBEAT_JITTER'
    | 'LATENCY_REGRESSION'
    | 'FAILURE_BURST'
    | 'FLAPPING'
    | 'TELEMETRY_SILENCE'
  severity?: 'low' | 'medium' | 'high'
  confidence?: number
  recommendedPenalty?: number
  explanation?: string
}
```

## State Semantics

### Truth states
- `healthy`: enough fresh evidence indicates expected operation
- `degraded`: partial impairment, elevated risk, or significant anomaly
- `unhealthy`: major failure or sustained critical impairment
- `unknown`: insufficient or stale evidence; never treat as healthy

### Overlays
- `maintenance`: suppresses operational paging/automation but does not erase truth
- `silenced`: suppresses notification side effects only

## Health Computation

A reducer computes normalized truth from heterogeneous signals.

```ts
function computeNormalizedHostTruth(input: HostHealthInputs): NormalizedHostTruth
```

### Suggested weighting
- heartbeat freshness: 25%
- critical service checks: 30%
- network reachability: 15%
- system pressure: 10%
- supervisor integrity: 10%
- anomaly penalty: up to 10% negative adjustment

### Confidence drivers
- sample freshness
- sample count
- source diversity
- signal agreement
- anomaly confidence

## EMA + Hysteresis

Use dual smoothing:
- display EMA for operator stability
- event EMA for transition qualification

Suggested defaults:
- display alpha: `0.35–0.50`
- event alpha: `0.15–0.25`

Example thresholds:
- enter degraded: `< 0.80`
- exit degraded: `> 0.88`
- enter unhealthy: `< 0.45`
- exit unhealthy: `> 0.55`

## Staleness Rules

- No data must not appear healthy
- stale warning threshold and unknown threshold must be distinct
- once evidence ages beyond unknown TTL, truth becomes `unknown`
- `data freshness` must be shown separately from `health score`

## D1 Operator Projection

Operator endpoint should be human-first and summary-oriented.

```ts
interface OperatorHostStatusResponse {
  generatedAt: string
  summary: {
    healthy: number
    degraded: number
    unhealthy: number
    unknown: number
    hostsWithAnomalies: number
    staleHosts: number
  }
  hosts: Array<{
    hostId: string
    displayName: string
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
    score: number
    confidence: number
    since: string
    summaryLine: string
    topReasons: ReasonCode[]
    anomaly?: AnomalyAssessment
    stale: boolean
    maintenance: boolean
    lastHeartbeatAt?: string
    links?: { detail?: string; logs?: string; remediation?: string }
  }>
}
```

## D2 Eventing Rules

Emit a transition event only when:
- exposed truth state changes
- stale TTL pushes host into `unknown`
- recovery crosses hysteresis thresholds and stability window

Do not emit when:
- recomputation leaves the exposed state unchanged
- only internal score wiggles change but state does not
- duplicate retries would replay identical event

## Persistence Expectations

Minimum stores:
- `raw_probe_samples`
- `host_truth_current`
- `host_truth_history`
- `health_transition_outbox`

## Minimum Test Matrix

- one-sample spike does not flap operator state
- stale heartbeat transitions `healthy -> degraded -> unknown`
- repeated recomputation does not duplicate transition emission
- anomaly can degrade score without causing full outage state
- recovery requires sustained healthy evidence
- maintenance suppresses side effects without erasing truth
