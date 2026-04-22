# EMA Routing Engine

`Ema.Claude.SmartRouter` selects the optimal provider, account, and model for each AI task using 6 strategies and real-time fitness signals.

## SmartRouter GenServer

```elixir
# daemon/lib/ema/claude/smart_router.ex
defmodule Ema.Claude.SmartRouter do
  use GenServer

  # State holds quality scores, balanced weights, and routing history
  defstruct [
    :quality_scores,    # %{{provider_id, model} => float}
    :balanced_weights,  # %{cost: 0.35, latency: 0.35, quality: 0.30}
    :routing_history    # recent routes for round-robin
  ]
end
```

## 6 Routing Strategies

| Strategy | Selection Logic | Use Case |
|----------|----------------|----------|
| `:balanced` | Cost 35% + Latency 35% + Quality 30% weighted score | Default for most tasks |
| `:cheapest` | Lowest `cost_per_token` | Bulk processing, low-priority |
| `:fastest` | Lowest measured latency | Interactive, user-facing |
| `:best` | Highest quality tier score | Creative work, proposals |
| `:round_robin` | Rotate across healthy providers | Load distribution |
| `:failover` | Primary → fallback chain | High-reliability tasks |

## Provider Selection Flow

```
SmartRouter.route(prompt, opts)
  → Filter healthy providers (via CircuitBreaker)
  → Apply strategy scoring
  → ProviderRegistry.healthy_providers()
  → AccountManager.best_account_for_provider(provider)
  → Return RouteTarget{provider, model, account}
  → Adapter.run(route_target, prompt)
  → CircuitBreaker.record_success/failure()
  → CostTracker.record()
```

## Signal Consumption

SmartRouter consumes real-time signals from other EMA subsystems:

### Quality Signals (from F4 Scorer)

```elixir
def handle_cast({:quality_signal, provider_id, model, score}, state) do
  updated = Map.put(state.quality_scores, {provider_id, model}, score)
  {:noreply, %{state | quality_scores: updated}}
end
```

Scorer broadcasts quality scores after evaluating proposal outputs. SmartRouter uses these to weight the `:best` and `:balanced` strategies.

### Budget Signals (from F1 CostForecaster)

```elixir
def handle_cast({:budget_spike, :over_threshold}, state) do
  # Temporarily boost cost weight to favor cheaper providers
  {:noreply, %{state | balanced_weights: %{cost: 0.60, latency: 0.25, quality: 0.15}}}
end
```

## Dispatch Routing

Beyond AI provider routing, EMA routes tasks through the dispatch system:

### dispatch-engine.sh
The cron-driven executor routes tasks based on `type` and `agent` fields in the task JSON. See [DISPATCH.md](DISPATCH.md).

### ema-surface-dispatch.sh
Routes tasks to different EMA surfaces:
- **CLI:** Spawns Claude Code subprocess
- **Daemon API:** POST to `localhost:4488/api/tasks`
- **Webhook:** POST to Discord for notification/logging

## Provider Registry

`Ema.Claude.ProviderRegistry` tracks available providers:
- Anthropic (Claude models)
- OpenRouter (multi-model gateway)
- Ollama (local models)
- OpenAI-compatible endpoints

Each provider has health status, rate limits, and cost-per-token metrics updated in real-time.

## Account Manager

`Ema.Claude.AccountManager` manages multiple API keys per provider for:
- Rate limit distribution
- Cost tracking per account
- Key rotation on quota exhaustion
