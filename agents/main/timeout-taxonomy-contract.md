# Timeout Taxonomy Contract

**Status**: Draft v0
**Date**: 2026-04-06 UTC

## Purpose

Define the canonical timeout/error taxonomy for EMA/provider request handling so metrics, dashboards, logs, retries, and incident reports all classify degradation consistently.

## Primary Timeout Codes

```ts
type TimeoutCode =
  | 'QUEUE_TIMEOUT'
  | 'CONNECT_TIMEOUT'
  | 'UPSTREAM_READ_TIMEOUT'
  | 'TOTAL_DEADLINE_EXCEEDED'
  | 'CLIENT_CANCELLED'
```

## Related Error Codes

```ts
type RequestErrorCode =
  | TimeoutCode
  | 'UPSTREAM_4XX'
  | 'UPSTREAM_5XX'
  | 'UPSTREAM_529_OR_OVERLOADED'
  | 'TRANSPORT_ERROR'
  | 'POOL_ACQUIRE_FAILURE'
  | 'RETRY_BUDGET_EXHAUSTED'
  | 'UNKNOWN_UNCLASSIFIED'
```

## Classification Rules

Every failed or degraded request must:
- emit exactly one primary code
- optionally attach secondary detail fields
- preserve provider/model/route/streaming context

### Definitions
- `QUEUE_TIMEOUT`: request expired before leaving local queue
- `CONNECT_TIMEOUT`: outbound connect/TLS/DNS deadline hit before session established
- `UPSTREAM_READ_TIMEOUT`: upstream connection established, but first byte/token or expected read window exceeded
- `TOTAL_DEADLINE_EXCEEDED`: total request deadline exceeded regardless of substage
- `CLIENT_CANCELLED`: caller cancelled before completion

## Required Dimensions

```ts
interface TimeoutDimensions {
  provider?: string
  model?: string
  route?: string
  tenant?: string
  priorityClass?: string
  streaming?: boolean
  proxyInstance?: string
  host?: string
  region?: string
  requestSizeBucket?: 'small' | 'medium' | 'large'
  historySizeBucket?: 'small' | 'medium' | 'large'
  retryCount?: number
  queueWaitMs?: number
  connectMs?: number
  firstByteOrTokenMs?: number
  totalDurationMs?: number
}
```

## Metric Contract

Suggested canonical metrics:
- `ema_requests_total`
- `ema_requests_success_total`
- `ema_requests_failure_total{code=...}`
- `ema_request_latency_ms`
- `ema_request_queue_wait_ms`
- `ema_request_first_token_ms`
- `ema_request_retry_total`

## Logging Contract

Each failed/degraded request log should include:
- request id / correlation id
- primary code
- dimensions
- whether fallback attempted
- whether retry attempted
- final outcome

## Dashboard Requirements

All incident dashboards must support slicing by:
- code
- provider
- model
- streaming vs non-streaming
- route / tenant / priority class
- instance / host / region
- request/history size bucket

## Acceptance Criteria

- queue/connect/read/total/client-cancel are never conflated
- dashboards and logs use the same taxonomy
- retry/fallback decisions can be analyzed by primary code
- incident reports can distinguish local saturation from upstream slowness
