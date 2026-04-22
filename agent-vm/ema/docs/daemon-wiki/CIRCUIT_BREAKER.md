# EMA Circuit Breaker

`Ema.Claude.CircuitBreaker` is an OTP GenServer that tracks per-provider health and prevents cascading failures by routing around degraded providers.

## States

```
CLOSED    → healthy, receives traffic normally
OPEN      → degraded, SmartRouter skips this provider
HALF_OPEN → recovering, accepts one probe request to test health
```

## State Transitions

```
CLOSED ──[failure_rate > 50% OR p95 > 5s]──→ OPEN
OPEN   ──[30s elapsed]──→ HALF_OPEN
HALF_OPEN ──[probe succeeds]──→ CLOSED
HALF_OPEN ──[probe fails]──→ OPEN (reset 30s timer)
```

## OTP Implementation

```elixir
defmodule Ema.Claude.CircuitBreaker do
  use GenServer

  defstruct providers: %{}
  # Each provider entry:
  # %{
  #   circuit: :closed | :open | :half_open,
  #   consecutive_failures: 0,
  #   failure_rate_1m: 0.0,
  #   p95_latency_ms: 0.0,
  #   last_failure_at: nil,
  #   reopen_after: nil
  # }

  def record_success(provider_id) do
    GenServer.cast(__MODULE__, {:success, provider_id})
  end

  def record_failure(provider_id, reason) do
    GenServer.cast(__MODULE__, {:failure, provider_id, reason})
  end

  def healthy?(provider_id) do
    GenServer.call(__MODULE__, {:healthy?, provider_id})
  end
end
```

## Thresholds

| Parameter | Default | Notes |
|-----------|---------|-------|
| `failure_rate_threshold` | 0.50 | Trip if >50% errors in 1m window |
| `latency_threshold_ms` | 5000 | Trip if P95 > 5s |
| `min_requests` | 5 | Need ≥5 requests before tripping |
| `open_duration_s` | 30 | Stay OPEN 30s before probing |
| `half_open_probe_count` | 1 | 1 probe request in HALF_OPEN |

## SmartRouter Integration

SmartRouter calls `CircuitBreaker.healthy?/1` before including a provider in routing candidates:

```elixir
def route(prompt, opts) do
  providers = ProviderRegistry.all()
  healthy = Enum.filter(providers, &CircuitBreaker.healthy?(&1.id))
  # ... apply strategy scoring to healthy providers only
end
```

## Soft vs Hard Trip

| Type | Behavior | Trigger |
|------|----------|---------|
| **Soft trip** | Suggest alternative provider, allow override | Moderate failure rate, latency spikes |
| **Hard trip** | Force stop, escalate to Governance | Sustained failures, auth errors, provider down |

Hard trips emit a `{:circuit_hard_trip, provider_id}` message to `Ema.Claude.Governance` for escalation.

## CostTracker Integration

`Ema.Claude.CostTracker` feeds cost spike signals into CircuitBreaker. If a provider suddenly costs significantly more than baseline, CircuitBreaker can soft-trip to protect budget.
