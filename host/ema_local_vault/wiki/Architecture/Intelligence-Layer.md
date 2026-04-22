---
title: "Intelligence Layer"
space: wiki
tags: ["architecture", "intelligence", "agents", "routing", "monitoring"]
source: manual
---

# Intelligence Layer

**Status:** Operational. ~50 modules in `daemon/lib/ema/intelligence/` covering routing, trust, cost tracking, context management, gap scanning, reflexion, monitoring, autonomy, security, and learning.
**Last verified:** 2026-04-07

The Intelligence Layer is the cognitive substrate of EMA. It wraps every execution with routing decisions, context enrichment, cost tracking, outcome recording, trust scoring, and reflexion learning. Most modules are GenServers running on periodic timers within the daemon's OTP supervision tree.

## Module Groups

### Routing

Source: `daemon/lib/ema/intelligence/`

| Module | Type | Purpose |
|--------|------|---------|
| `Router` | Module | Event classifier — routes events to hub orchestrator or domain agents based on event type. Enriches with context via `ContextInjector` before routing. Broadcasts decisions to `intelligence:route`. |
| `RouteTrace` | Module | Logs routing decisions for observability and debugging |
| `UCBRouter` | GenServer (ETS-backed) | Multi-armed bandit agent selection using UCB1 algorithm. Tracks wins/trials per agent per task_type in ETS. Unvisited agents get infinity score (forced exploration). Called at dispatch time via `select_agent/2`. |

UCB1 formula: `avg_reward + sqrt(2 * ln(N) / n_i)` where N = total dispatches for task_type, n_i = dispatches to agent i.

### Trust

| Module | Type | Purpose |
|--------|------|---------|
| `TrustScorer` | GenServer (24h recalc) | Calculates 0-100 trust scores for agents based on completion rate (40pts), latency (20pts), error rate (20pts), and activity (20pts). Stores to `agent_trust_scores` table. |
| `TrustScore` | Ecto Schema | Schema for `agent_trust_scores` — score, completion_rate, avg_latency_ms, error_count, session_count, days_active, calculated_at |

Trust badges: >=90 Excellent (emerald), >=70 Good (teal), >=50 Fair (amber), <50 Unreliable (red).

### Cost / Budget

| Module | Type | Purpose |
|--------|------|---------|
| `TokenTracker` | GenServer | Records token usage and costs per Claude API call. Tracks per-model pricing (Opus $15/$75, Sonnet $3/$15, Haiku $0.25/$1.25 per 1M tokens). Budget checks every 15 min. |
| `TokenEvent` | Ecto Schema | Individual token usage records in `token_events` table |
| `TokenBudget` | Ecto Schema | Budget configuration in `token_budgets` table |
| `CostForecaster` | GenServer (hourly) | Monitors cost trends, detects spikes (>2x daily average), sends weekly digest on Sundays, alerts when monthly budget exceeded. Broadcasts to `intelligence:tokens`. |
| `BudgetEnforcer` | Module | Enforces spending limits before dispatch |
| `UsageRecord` | Ecto Schema | Usage tracking in `usage_records` table |

### Context

| Module | Type | Purpose |
|--------|------|---------|
| `ContextFetcher` | Module | Retrieves top-5 ranked context fragments for a project + task title. Scores fragments by keyword overlap with task title + stored relevance score. |
| `ContextIndexer` | Module | Indexes code and documentation into context fragments |
| `ContextStore` | Ecto Schema | Persisted context fragments in `context_fragments` table — file_path, content, relevance_score, project_slug |
| `ContextBuilder` | Module | Builds structured context bundles for agent prompts |

### Gaps

| Module | Type | Purpose |
|--------|------|---------|
| `GapScanner` | GenServer (60 min) | Periodically scans for gaps from all sources via `GapInbox.scan_all/0`. Broadcasts scan results to `gaps:live` channel. |
| `GapInbox` | Module | 7-source friction scanning, gap aggregation, counts |
| `Gap` | Ecto Schema | Gap records in `gaps` table |

### Reflexion

Cross-reference: [[Reflexion-System]] for full detail.

| Module | Type | Purpose |
|--------|------|---------|
| `ReflexionEntry` | Ecto Schema | Persisted lessons in `reflexion_entries` table |
| `ReflexionStore` | Module | CRUD for reflexion entries |
| `ReflexionInjector` | Module | Builds prompt prefix from past lessons |
| `ReflectionLoop` | Module | Post-execution reflection, outcome classification, lesson extraction |

### Intent Graph (Legacy)

These predate the `Ema.Intents` context module but remain in the intelligence namespace:

| Module | Type | Purpose |
|--------|------|---------|
| `IntentNode` | Ecto Schema | Nodes in `intent_nodes` table |
| `IntentEdge` | Ecto Schema | Edges in `intent_edges` table |
| `IntentCluster` | Ecto Schema | Clusters in `intent_clusters` — used by brain dump grouping (readiness_score, item_count, promoted) |
| `IntentMap` | Module | Graph operations on intent nodes/edges |

### Monitoring

| Module | Type | Purpose |
|--------|------|---------|
| `VmMonitor` | GenServer (30s poll) | Polls local tool availability (claude CLI, daemon health). Stores health events in `vm_health_events` table. Broadcasts via PubSub. |
| `VmHealthEvent` | Ecto Schema | Health snapshots in `vm_health_events` table |
| `SessionMemoryWatcher` | GenServer (60s poll) | Scans for new/updated Claude sessions, extracts memory fragments |
| `SessionMemory` | Module | Session memory management |
| `MemoryFragment` | Ecto Schema | Extracted memory in `memory_fragments` table |
| `GitWatcher` | Module | Monitors git repository changes |
| `GitEvent` | Ecto Schema | Git events in `git_events` table |

### Outcome Tracking

| Module | Type | Purpose |
|--------|------|---------|
| `OutcomeTracker` | GenServer | Records every agent task outcome to JSON file (`~/.local/share/ema/outcome-tracker.json`). Keeps last 500 entries. Tracks task_id, intent, project, agent, domain, status, tokens, time, quality_score. |
| `SignalProcessor` | GenServer | Aggregates signals from proposals, agents, quality gate, and routing events. Subscribes to 4 PubSub topics. Feeds `AgentFitnessStore` with normalized outcomes. |

### Autonomy

| Module | Type | Purpose |
|--------|------|---------|
| `AutonomyConfig` | GenServer (ETS-backed) | Per-agent or global autonomy level: `:assist` (human approval), `:auto` (execute within budget, notify), `:full` (execute, no notification). ETS read path <1us. |
| `AgentSupervisor` | Module | Intelligence-layer agent supervision |

### Security

| Module | Type | Purpose |
|--------|------|---------|
| `SecurityAuditor` | Module | Calculates security posture score (0-100) from 7 checks: daemon health, localhost binding, no published ports, cap_drop, DM pairing, docker socket proxy, regular updates. |
| `AuditLog` | Ecto Schema | Audit trail in `audit_logs` table |

### Learning

| Module | Type | Purpose |
|--------|------|---------|
| `VaultLearner` | GenServer | Post-task knowledge extraction — uses Claude to extract 2-5 atomic facts from agent output, writes as markdown notes to vault. Non-blocking (cast + Task.start). |
| `PromptVariantStore` | Module | Stores and retrieves prompt variants for A/B testing |
| `ScopeAdvisor` | Module | Advises on execution scope based on context |

### Superman Integration

| Module | Type | Purpose |
|--------|------|---------|
| `SupermanClient` | Module | Client interface to Superman system |
| `SupermanContinuityHook` | Module | Hooks into execution lifecycle for Superman continuity |
| `SupermanRuntime` | Module | Runtime bridge between intelligence and Superman |
| `SupermanWatcher` | Module | Watches Superman filesystem for changes |

### Wiki Sync

| Module | Type | Purpose |
|--------|------|---------|
| `WikiSync` | Module | Synchronizes intelligence state with wiki pages |
| `WikiSyncAction` | Ecto Schema | Sync action records in `wiki_sync_actions` table |

### Other

| Module | Type | Purpose |
|--------|------|---------|
| `ProjectGraph` | Module | Project relationship graph analysis |
| `Intelligence` | Module | Top-level context module for the intelligence namespace |

## Related

- [[Reflexion-System]] — Deep dive on the reflexion learning loop
- [[Context-Assembly]] — How context is built and injected into agent prompts
- [[MCP-Topology]] — External tool and server connections
