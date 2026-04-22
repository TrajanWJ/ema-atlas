---
title: "Orchestrator & Routing"
space: wiki
tags: ["architecture","orchestrator","routing","smartrouter"]
source: manual
---

# Orchestrator & Routing

EMA has two routing/orchestration layers: the AI SmartRouter (provider selection) and the dispatch engine (task-to-agent assignment).

## SmartRouter (AI Provider Routing)

Selects which AI provider handles a given request. Lives in `daemon/lib/ema/claude/`.

### 6 Routing Strategies

| Strategy | Logic | When |
|----------|-------|------|
| `:balanced` | 40% cost + 30% speed + 30% quality | Default |
| `:cheapest` | Minimize cost per token | Bulk tasks |
| `:fastest` | Minimize latency | Interactive sessions |
| `:best` | Maximize quality score | Critical work |
| `:round_robin` | Rotate across providers | Even distribution |
| `:failover` | Primary → secondary chain | Reliability |

### Provider Registry

GenServer tracking registered providers, health, capabilities:
- Dispatches bridge calls to selected provider
- Broadcasts results on PubSub `bridge:results`
- Health checks, rate limit tracking
- Circuit breaker per provider (soft trip at 3, hard at 5 failures)

### Account Manager

Multi-account rotation with per-account rate limit tracking. Handles 429 responses by rotating to next account.

### Quality Gate

Output verification for proposals and code reviews. Scores responses before accepting.

### Cost Tracker

Token usage + cost recording to SQLite. Tracks per-provider, per-model costs.

### Governance

Audit logging for tool calls (Edit, Write, Bash, Agent). Compliance trail.

## Dispatch Engine (Task-to-Agent Routing)

The bash dispatch engine assigns tasks to agents based on:
1. **Priority** — higher priority tasks dispatched first
2. **Agent availability** — only idle agents receive tasks
3. **Circuit state** — circuit_open agents are skipped
4. **Dependencies** — blocked tasks wait for depends_on completion
5. **Retry logic** — failed tasks retry if attempts < max_attempts

See [[Dispatch Engine]] for full details.

## Campaign Flow (Minimal)

`Ema.Campaigns.Flow` — single file, minimal implementation. Defines agent coordination topology for multi-step campaigns. Not actively used.

## Context Injection

Before any AI execution, context is assembled:

| Source | Module | What |
|--------|--------|------|
| Project context | `Ema.Context.Injector` | Project docs, recent activity |
| Claude ContextManager | `Ema.Claude.ContextManager` | Enriched prompts for pipeline stages |
| Superman (planned) | — | Code intelligence, intent graph |
| Reflexion (planned) | — | Past execution lessons |

## CLI

```bash
ema provider list              # Registered AI providers
ema provider status            # Provider fitness scores
ema task dispatch <id>         # Dispatch through engine
ema exec create "obj" --mode research  # Direct execution
```

## What's Missing

- No task routing intelligence (agent specialization, skill matching)
- No cost-aware task assignment (expensive tasks → cheaper agents)
- No feedback loop from execution results to routing decisions
- ~~Intent-to-execution mapping not implemented~~ — now implemented via Populator + Dispatcher + IntentFolder (dispatch engine bash path dormant with agent-vm offline)
- No orchestration UI beyond CLI

## Related

- [[AI Providers]]
- [[Dispatch Engine]]
- [[Execution System]]
