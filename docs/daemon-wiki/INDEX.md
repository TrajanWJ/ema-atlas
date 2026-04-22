# EMA Daemon Wiki

Reference documentation for the EMA daemon system — Elixir/Phoenix OTP architecture, dispatch engine, routing, and governance.

## Contents

| Document | Description |
|----------|-------------|
| [DISPATCH.md](DISPATCH.md) | Task dispatch system — queue lifecycle, dispatch-engine.sh, lock files, surface routing |
| [ROUTING.md](ROUTING.md) | SmartRouter — provider selection strategies, signal consumption, dispatch routing |
| [CIRCUIT_BREAKER.md](CIRCUIT_BREAKER.md) | Per-provider health tracking — CLOSED/OPEN/HALF_OPEN states, OTP implementation |
| [GOVERNANCE.md](GOVERNANCE.md) | Quality gates, trust scoring, cost governance, proposal quality pipeline |
| [AGENTS.md](AGENTS.md) | Dynamic agent supervision — AgentWorker, AgentMemory, channel bridges |
| [HANDOFF.md](HANDOFF.md) | PubSub-based task handoff, proposal pipeline chaining, session fork/resume |

## Architecture Context

EMA runs as an Elixir/Phoenix daemon (port 4488) with OTP supervision trees. See [ARCHITECTURE.md](../ARCHITECTURE.md) for the full system overview.

**Key modules:**
- `Ema.Claude.*` — AI provider integration (Bridge, SmartRouter, CircuitBreaker, Governance)
- `Ema.ProposalEngine.*` — Autonomous proposal pipeline (8 stages)
- `Ema.Agents.*` — Dynamic agent supervision with channel bridges
- `Ema.Intelligence.*` — System monitoring (GapScanner, CostForecaster, TrustScorer)
- `Ema.SecondBrain.*` — Vault integration (VaultWatcher, GraphBuilder, SystemBrain)

**External dispatch:** `~/dispatch/` directory + `dispatch-engine.sh` (cron-driven, runs every minute)
