# Circuit Breaker — Runtime Agent Health Routing

Per-agent circuit breakers prevent cascading failures by routing around degraded agents automatically.

## States

```
CLOSED  → healthy, receives traffic normally
OPEN    → degraded, skipped by routing layer; logged as skipped_agents
HALF_OPEN → recovering, receives one probe request to test health
```

## State Transitions

- **CLOSED → OPEN**: failure_rate_1m > 50% AND request_count ≥ 5, OR p95_latency_ms > 5000
- **OPEN → HALF_OPEN**: after 30s (reopen_after timer expires)
- **HALF_OPEN → CLOSED**: probe request succeeds
- **HALF_OPEN → OPEN**: probe request fails; reset 30s timer

## Default Thresholds (per agent)

| Parameter | Default | Notes |
|---|---|---|
| `failure_rate_threshold` | 0.50 | OPEN if >50% errors in rolling 1m window |
| `latency_threshold_ms` | 5000 | OPEN if P95 > 5s |
| `min_requests` | 5 | Need ≥5 requests before tripping |
| `open_duration_s` | 30 | Stay OPEN 30s, then HALF_OPEN |
| `half_open_probe_count` | 1 | 1 probe request in HALF_OPEN state |

## Routing Integration

1. Before semantic ranking, filter out all `OPEN` agents
2. Log filtered agents: `skipped_agents: ["agent-x"], reason: "circuit_open"`
3. If top-ranked agent is `HALF_OPEN`, route to it (it's the probe)
4. If NO healthy agents remain → route to fallback agent + emit `no_healthy_agents` alert

## Fallback Agents

| Domain | Fallback |
|---|---|
| Technical | `coder` (if not OPEN), else `researcher` |
| Business | `writer` (if not OPEN), else human escalation |
| Life/Executive | `chief-of-staff` (if not OPEN) |
| Any domain degraded | `concierge` for safe acknowledgement + retry later |

## Latency-Weighted Routing Score

When multiple healthy agents are candidates:
```
adjusted_score = semantic_similarity - (p95_latency_ms / max_latency_ms) * 0.1
```
Default latency_weight: `0.1` (semantic fit dominates; latency is a tiebreaker).

## Health State Tracking

Each agent slot maintains:
- `circuit`: CLOSED | OPEN | HALF_OPEN
- `consecutive_failures`: int
- `failure_rate_1m`: float (rolling)
- `p95_latency_ms`: float (rolling)
- `last_failure_at`: timestamp
- `reopen_after`: timestamp (set when OPEN)

## Per-Agent Overrides

To override thresholds for specific agents, add to their roster entry:
```yaml
circuit_breaker:
  failure_rate_threshold: 0.3   # stricter for high-stakes agents
  latency_threshold_ms: 2000
  open_duration_s: 60
```

## High-Stakes Agent Overrides

Agents in `high-stakes-routing.md` get stricter defaults:
- `failure_rate_threshold: 0.25` (trip sooner)
- `open_duration_s: 60` (stay down longer before probing)

## Observability

Circuit state per agent is exposed in agent health checks.
Transitions are logged as structured events:
```
event: circuit_state_change
agent_id: <id>
from: CLOSED
to: OPEN
reason: failure_rate_exceeded
failure_rate_1m: 0.67
timestamp: <ISO8601>
```
