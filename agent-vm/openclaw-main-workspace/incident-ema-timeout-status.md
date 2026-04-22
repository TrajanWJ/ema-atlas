# Incident: EMA Proxy / Provider Timeout Stabilization

**Status**: Investigating / recovery kickoff
**Date**: 2026-04-06 UTC
**Owner**: Recovery lane
**Severity**: High

## Summary

Recovered context indicates repeated degradation around the EMA proxy path, with Anthropic/provider timeout behavior and inconsistent fallback success. Current workspace lacks reliable incident artifacts, so this document establishes the minimum shared truth for stabilization work.

## Known Symptoms

- Proxy/provider timeout degradation on EMA path
- Anthropic path appears especially suspect in recovered notes
- Large histories may worsen failure frequency/latency
- Fallback behavior exists but is not yet clearly governed
- Prior work stalled because operational truth and telemetry were weak

## Current Risks

- Timeout causes are not sufficiently classified
- Raw vs EMA-smoothed signals may disagree
- Queueing/backpressure may be misread as upstream/provider failure
- Streaming and non-streaming timeout modes may be conflated
- Recovery could look better in smoothed metrics than in raw 1-minute windows

## Architecture Sketch

Request path under investigation:

1. client request enters EMA/control path
2. proxy/router selects provider/model
3. request may queue before outbound work starts
4. outbound transport connects to provider
5. provider begins response / first token / stream
6. proxy may retry, fail over, or timeout
7. result and status should be published to operator surfaces

Potential delay/failure buckets:
- local queue wait
- connect/TLS/DNS delay
- upstream read / first-byte delay
- total deadline exceeded
- client cancellation
- retry amplification
- pool saturation / concurrency exhaustion

## Timeout/Error Taxonomy

Every failed or degraded request should classify into exactly one primary timeout/error bucket plus optional secondary metadata.

### Primary timeout buckets
- `QUEUE_TIMEOUT`
- `CONNECT_TIMEOUT`
- `UPSTREAM_READ_TIMEOUT`
- `TOTAL_DEADLINE_EXCEEDED`
- `CLIENT_CANCELLED`

### Non-timeout error buckets
- `UPSTREAM_4XX`
- `UPSTREAM_5XX`
- `UPSTREAM_529_OR_OVERLOADED`
- `TRANSPORT_ERROR`
- `POOL_ACQUIRE_FAILURE`
- `RETRY_BUDGET_EXHAUSTED`
- `UNKNOWN_UNCLASSIFIED`

### Dimensions to attach
- provider
- model
- route
- tenant / priority class
- streaming vs non-streaming
- proxy instance / host / region
- request size / history size bucket
- retry count
- queue wait ms
- total duration ms
- time to first byte/token ms

## Required Dashboards / Telemetry

### Request quality
- request count
- success rate
- p50 / p95 / p99 latency
- time to first byte / first token
- timeout count by taxonomy bucket
- upstream status code mix

### Saturation
- in-flight requests
- queued requests
- queue wait time
- worker/concurrency utilization
- pool acquire latency
- active/idle connection counts if available
- retry rate and retry success rate

### Segmentation
- by provider
- by model
- by stream/non-stream
- by route / tenant / priority class
- by proxy instance / host / region
- by request size/history bucket

## Stabilization Stop / Go

### Stop: do not declare stabilized if any are true
- timeout rate is >2x baseline for 15+ minutes
- p99 is still climbing or oscillating
- queue wait is >20–25% of total request time
- retries are still elevated or rising
- recovery appears only in EMA-smoothed views
- any segmented slice remains obviously unhealthy while aggregate looks fine

### Go: safe to move out of mitigation when all are true for 30 minutes
- raw 1-minute and 5-minute timeout rates are near baseline
- p95 and p99 are flat or improving
- queue depth and queue wait are stable near normal
- retry volume is near baseline
- segmented views are healthy
- operator can explain what changed and why it helped

## Immediate Work

1. Wire timeout taxonomy into metrics/logging
2. Add raw and segmented incident dashboard views
3. Surface queue/concurrency/pool pressure explicitly
4. Document fallback policy and retry policy
5. Freeze untracked config churn while stabilizing

## Open Questions

- What is the current canonical provider/router path in EMA?
- What deadlines are configured at client, proxy, and provider layers?
- Is fallback policy deterministic, bounded, and auditable?
- Are streaming timeout rules distinct from non-streaming rules?
- What metric store/source of truth is canonical for operator decisions?
