---
title: "EMA Architecture Overview"
space: wiki
tags: ["architecture", "ema", "core", "verified-2026-04-06"]
source: manual
---

# EMA Architecture Overview

**Status:** Host daemon is the primary system. Full schema operational with 117 migrations. All major subsystems compile and run. Actor workspace system operational with human↔agent collaboration.
**Last verified:** 2026-04-06

Personal operating system for a solo developer. Orchestrates AI agent sessions, tracks workflow intent, manages a knowledge vault, and provides observability into all running processes.

## Stack

| Layer | Tech | Port |
|-------|------|------|
| Daemon | Phoenix 1.8, Elixir, OTP | localhost:4488 |
| Frontend | Tauri 2 + React 19 + Zustand | localhost:1420 (dev) |
| Database | SQLite via ecto_sqlite3 | `~/.local/share/ema/ema_dev.db` |
| Vault | Markdown files + FTS5 | `~/.local/share/ema/vault/` |
| CLI | Elixir escript (v3.0.0) | N/A |

## OTP Supervision Tree

Source: `daemon/lib/ema/application.ex`

The application starts with `strategy: :one_for_one` under `Ema.Supervisor`. Children are split between always-on processes and conditionally-started subsystems.

### Always-On Children (started unconditionally)

| Process | Purpose |
|---------|---------|
| `EmaWeb.Telemetry` | Telemetry supervision |
| `Ema.Repo` | Ecto SQLite connection |
| `Ecto.Migrator` | Auto-migration on boot |
| `DNSCluster` | DNS-based cluster discovery |
| `Phoenix.PubSub` | Internal event bus (`Ema.PubSub`) |
| `Ema.Feedback.Supervisor` | Discord delivery consumers + internal visibility |
| `Registry` (Agents) | Named process registry for agents |
| `Task.Supervisor` | `Ema.TaskSupervisor` for async work |
| `Ema.Prompts.Loader` | Prompt template loading |
| `Ema.Prompts.Optimizer` | Prompt optimization |
| `Ema.Agents.Supervisor` | Agent process DynamicSupervisor |
| `Ema.Agents.NetworkMonitor` | Agent network health monitoring |
| `Ema.Claude.SessionManager` | AI session tracking |
| `Ema.Claude.BridgeDispatch` | Async Claude dispatch with retries |
| `Ema.Focus.Timer` | Focus timer GenServer |
| `Ema.Pipes.Supervisor` | Workflow automation (Registry -> Loader -> Executor) |
| `Ema.Ingestor.Processor` | Ingest job processor |
| `Ema.Intelligence.TokenTracker` | Token usage tracking |
| `Ema.Executions.Dispatcher` | Execution dispatch via PubSub |
| `Ema.Intents.Populator` | Auto-creates intents from domain events |
| `Ema.Intelligence.TrustScorer` | Agent trust scoring |
| `Ema.Intelligence.VmMonitor` | VM resource monitoring |
| `Ema.Intelligence.CostForecaster` | Cost forecasting |
| `Ema.Intelligence.SessionMemoryWatcher` | Session memory monitoring |
| `Ema.Intelligence.GapScanner` | Gap detection |
| `Ema.Intelligence.ContextIndexer` | Context indexing |
| `Ema.Intelligence.AgentSupervisor` | Intelligence agent supervision |
| `Ema.Intelligence.AutonomyConfig` | Autonomy configuration |
| `Ema.Intelligence.UCBRouter` | Multi-armed bandit routing |
| `Ema.Intelligence.PromptVariantStore` | Prompt variant A/B storage |
| `Ema.Intelligence.VaultLearner` | Vault learning |
| `Registry` (Projects) | Per-project worker registry |
| `DynamicSupervisor` (Projects) | Project context caching workers |
| `Registry` (CLI) | CLI session registry |
| `DynamicSupervisor` (CLI) | CLI session runners |
| `EmaWeb.Endpoint` | Phoenix HTTP/WS server |

### Conditionally-Started Subsystems

Each guarded by a `maybe_start_*` function checking config flags:

| Subsystem | Config Guard | Children |
|-----------|-------------|----------|
| Babysitter | Not in MCP stdio mode | `Ema.Babysitter.Supervisor` |
| Session Store | `:start_session_store` (default true) | `Ema.Persistence.SessionStore` |
| Campaign Manager | `:start_campaign_manager` (default true) | `Ema.Campaigns.CampaignManager` |
| Quality | `:start_quality` (default true) | `Ema.Quality.Supervisor` |
| Orchestration | `:start_orchestration` (default true) | `Ema.Orchestration.Supervisor` |
| AI Bridge | `:ai_backend == :bridge` | `Ema.Claude.BridgeSupervisor`, `Ema.Claude.ExecutionSupervisor` |
| Claude Sessions | `:start_claude_sessions` (default true) | `Ema.ClaudeSessions.Supervisor` |
| Cluster | `:start_cluster` (default **false**) | `Ema.Claude.NodeCoordinator` |
| Canvas | `:start_canvas` (default true) | `Ema.Canvas.Supervisor` |
| Superman | `:start_second_brain` (default true) | `Ema.Superman.Supervisor` |
| Second Brain | `:start_second_brain` (default true) | `Ema.SecondBrain.Supervisor` |
| Responsibilities | `:start_otp_workers` (default true) | `Ema.Responsibilities.Supervisor` |
| Vectors | `:proposal_engine[:enabled]` | `Ema.Vectors.Supervisor` |
| Proposal Engine | `:proposal_engine[:enabled]` | `Ema.ProposalEngine.Supervisor` |
| MetaMind | `:metamind[:enabled]` | `Ema.MetaMind.Supervisor` |
| Evolution | `:evolution_engine` (default true) | `Ema.Evolution.Supervisor` |
| Voice | `:start_voice` (default true) | `Ema.Voice.Supervisor`, `Ema.Discord.Bridge` |
| Git Watcher | `:start_git_watcher` (default true) | `Ema.Intelligence.GitWatcher` |
| Harvesters | `:start_harvesters` (default true) | `Ema.Harvesters.Supervisor` |
| Intention Farmer | `:start_intention_farmer` (default true) | `Ema.IntentionFarmer.Supervisor` |
| Temporal | `:start_temporal` (default true) | `Ema.Temporal.Engine` |
| MCP | `:mcp_server[:enabled]` (default **false**) | `Ema.MCP.Server` |

### Post-Start Initialization

After `Supervisor.start_link/2` returns:

1. `Ema.PluginRegistry.init()` — ETS-backed plugin registry
2. `Ema.Hooks.init()` — Hook system ETS tables
3. `Ema.Sessions.Orchestrator.init_table()` — Session orchestrator ETS
4. `Ema.Intelligence.BudgetEnforcer.install()` — Fuse circuit breakers (best-effort)
5. `Ema.Actors.Bootstrap.ensure_defaults()` — Create/sync actor records (1 human + 3 agents currently seeded; 17 definitions in code), backfill agent FKs
6. `Ema.Agents.Supervisor.start_active_agents()` — Boot agents marked active in DB (async, 200ms delay)
7. `Ema.IntentionFarmer.StartupBootstrap.run_async()` — Startup bootstrap (if not MCP mode, if enabled)
7. `Ema.SecondBrain.Indexer.reindex_all()` — FTS index population (async, 3s delay)

## Current Configuration

From `daemon/config/config.exs`:

- **AI backend:** `:bridge` (multi-backend router active)
- **Proposal engine:** enabled
- **Seed preflight:** `:enrich_only` mode (minimum score 15, duplicate threshold 0.6)
- **Startup bootstrap:** disabled (manual during active construction)
- **MCP server:** disabled by default (enabled via `runtime.exs` or `dev.exs`)
- **Cluster:** disabled by default

## Key Subsystem Map

| Subsystem | Wiki Page | Status |
|-----------|-----------|--------|
| Intent Engine | [[Intent-System]] | Operational — schemas, CRUD, populator, MCP tools |
| Execution System | [[Execution-System]] | Operational — dispatcher, router, intent folders |
| Proposal Pipeline | [[Proposal-Pipeline]] | Operational — 9 stages, vector scoring, diagnostics |
| MCP Server | [[MCP-Topology]] | Operational — 17 core tools + workspace tools, 11 resources, stdio transport |
| Babysitter | [[Babysitter System]] | Operational — stream-of-consciousness, Discord |
| Second Brain | — | Operational — vault watcher, graph builder, FTS5 |
| Actors/Workspace | — | Operational — 4 actors (1 human + 3 agents); 17 agent definitions exist in code but only 3 are seeded and active |
| Agents | — | Operational — per-agent supervision, memory compression, linked to Actors via FK |
| Pipes | — | Operational — 22 triggers, 15 actions, 7 stock pipes |

## Related

- [[Intent-System]]
- [[Execution-System]]
- [[Proposal-Pipeline]]
- [[MCP-Topology]]
- [[Babysitter System]]
- [[Dispatch Engine]]
