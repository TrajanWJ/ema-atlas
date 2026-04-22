---
title: "EMA Monitoring & Observability — Complete Stack Design"
type: reference
created: 2026-04-14
tags: [ema, monitoring, observability, telemetry, prometheus, grafana, elixir, alerting]
confidence: 0.9
source: internal-architecture
summary: "Full observability stack spec for EMA: Elixir :telemetry → Prometheus → Grafana, with alerting, dashboards, and structured logging via Loki."
---

# EMA Monitoring & Observability — Complete Stack Design

> **Version:** 1.0  
> **Status:** Production-ready specification  
> **Stack:** Elixir :telemetry → Prometheus (via TelemetryMetricsPrometheus) → Grafana  
> **Scope:** Superman, Integrations, Agent/Bridge, Pipes, Honcho, System Health

**Related:** [[superman-architecture]], [[integration-framework]], [[honcho-scope-advisor]], [[discord-slack-integration]], [[github-integration]]

---

## 1. Telemetry Architecture

### Data Flow

```
Elixir :telemetry events
  → TelemetryMetricsPrometheus.Core (in-process)
  → /metrics endpoint (Phoenix plug)
  → Prometheus scrape (15s interval)
  → Grafana dashboards + Alertmanager
  
Logs:
  Elixir Logger → JSON backend → structured files → Promtail → Loki → Grafana
```

### Naming Convention

All telemetry events follow `[:ema, <subsystem>, <action>]`:

```
[:ema, :superman, :embed]          — embedding pipeline
[:ema, :superman, :search]         — vector search
[:ema, :superman, :graph, :update] — knowledge graph mutation
[:ema, :integration, :sync]        — integration sync cycle
[:ema, :integration, :webhook]     — inbound webhook processing
[:ema, :integration, :rate_limit]  — rate limit check
[:ema, :agent, :execute]           — agent task execution
[:ema, :bridge, :session]          — Claude Code session lifecycle
[:ema, :pipes, :step]              — pipe step execution
[:ema, :honcho, :session]          — Honcho session ops
[:ema, :system, :health]           — periodic health pulse
```

### `Ema.Telemetry` Module

```elixir
defmodule Ema.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  @impl true
  def init(_arg) do
    children = [
      {TelemetryMetricsPrometheus.Core, [metrics: metrics(), name: :ema_prometheus]},
      {Ema.Telemetry.Poller, []}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp metrics do
    superman_metrics() ++
      integration_metrics() ++
      agent_metrics() ++
      pipes_metrics() ++
      honcho_metrics() ++
      system_metrics()
  end

  # ── Superman Metrics ──────────────────────────────────────────────

  defp superman_metrics do
    [
      # Embedding pipeline
      distribution("ema.superman.embed.duration",
        unit: {:native, :millisecond},
        tags: [:item_type, :project_id],
        reporter_options: [buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000]]
      ),
      counter("ema.superman.embed.total",
        tags: [:item_type, :project_id, :status]
      ),
      last_value("ema.superman.embed.queue_depth"),
      last_value("ema.superman.embed.throughput",
        description: "Items embedded per second (rolling 1m window)"
      ),

      # Index staleness
      last_value("ema.superman.index.staleness_seconds",
        tags: [:item_type, :project_id],
        description: "Seconds since oldest un-re-embedded item"
      ),
      last_value("ema.superman.index.coverage_ratio",
        tags: [:project_id],
        description: "Fraction of items with fresh embeddings (0.0–1.0)"
      ),
      last_value("ema.superman.index.total_items",
        tags: [:project_id]
      ),

      # Vector search
      distribution("ema.superman.search.duration",
        unit: {:native, :millisecond},
        tags: [:query_type, :project_id],
        reporter_options: [buckets: [5, 10, 25, 50, 100, 250, 500]]
      ),
      counter("ema.superman.search.total",
        tags: [:query_type, :project_id, :status]
      ),

      # Knowledge graph
      last_value("ema.superman.graph.node_count",
        tags: [:node_type, :project_id]
      ),
      last_value("ema.superman.graph.edge_count",
        tags: [:edge_type, :project_id]
      ),
      counter("ema.superman.graph.mutations_total",
        tags: [:mutation_type, :project_id]
      ),

      # Context injection
      counter("ema.superman.context.injection_total",
        tags: [:project_id, :status]
      ),

      # Intent clusters
      last_value("ema.superman.intent.cluster_count",
        tags: [:project_id]
      ),
      counter("ema.superman.intent.detection_total",
        tags: [:project_id, :status]
      )
    ]
  end

  # ── Integration Metrics ───────────────────────────────────────────

  defp integration_metrics do
    [
      # Sync lifecycle
      distribution("ema.integration.sync.duration",
        unit: {:native, :millisecond},
        tags: [:integration, :project_id],
        reporter_options: [buckets: [100, 500, 1000, 5000, 10_000, 30_000]]
      ),
      counter("ema.integration.sync.total",
        tags: [:integration, :project_id, :status]
      ),
      last_value("ema.integration.sync.last_success_timestamp",
        tags: [:integration, :project_id],
        description: "Unix timestamp of last successful sync"
      ),

      # Webhook processing
      distribution("ema.integration.webhook.processing_duration",
        unit: {:native, :millisecond},
        tags: [:integration, :event_type],
        reporter_options: [buckets: [10, 50, 100, 250, 500, 1000]]
      ),
      counter("ema.integration.webhook.total",
        tags: [:integration, :event_type, :status]
      ),

      # Rate limits
      last_value("ema.integration.rate_limit.remaining",
        tags: [:integration],
        description: "Remaining API calls in current window"
      ),
      last_value("ema.integration.rate_limit.limit",
        tags: [:integration],
        description: "Total API calls allowed in current window"
      ),
      last_value("ema.integration.rate_limit.reset_timestamp",
        tags: [:integration]
      ),

      # OAuth
      last_value("ema.integration.oauth.expiry_timestamp",
        tags: [:integration],
        description: "Unix timestamp when OAuth token expires"
      ),
      counter("ema.integration.oauth.refresh_total",
        tags: [:integration, :status]
      ),

      # Event queue
      last_value("ema.integration.queue.depth",
        tags: [:integration],
        description: "Pending events in integration queue"
      ),

      # Connection state
      last_value("ema.integration.connected",
        tags: [:integration],
        description: "1 = connected, 0 = disconnected"
      ),
      last_value("ema.integration.last_event_timestamp",
        tags: [:integration],
        description: "Unix timestamp of last received event"
      )
    ]
  end

  # ── Agent / Bridge Metrics ────────────────────────────────────────

  defp agent_metrics do
    [
      distribution("ema.agent.execution.duration",
        unit: {:native, :millisecond},
        tags: [:agent_type, :project_id],
        reporter_options: [buckets: [1000, 5000, 15_000, 30_000, 60_000, 120_000, 300_000]]
      ),
      counter("ema.agent.execution.total",
        tags: [:agent_type, :project_id, :status]
      ),
      last_value("ema.agent.active_count",
        tags: [:agent_type]
      ),

      # Token consumption
      counter("ema.agent.tokens.input_total",
        tags: [:agent_type, :project_id, :model]
      ),
      counter("ema.agent.tokens.output_total",
        tags: [:agent_type, :project_id, :model]
      ),
      counter("ema.agent.tokens.cost_cents_total",
        tags: [:agent_type, :project_id, :model],
        description: "Estimated cost in cents"
      ),

      # Bridge
      last_value("ema.bridge.circuit_breaker.state",
        tags: [:target],
        description: "0=closed, 1=half_open, 2=open"
      ),
      counter("ema.bridge.session.total",
        tags: [:status]
      ),
      last_value("ema.bridge.session.active_count"),
      distribution("ema.bridge.session.duration",
        unit: {:native, :millisecond},
        tags: [:status],
        reporter_options: [buckets: [5000, 15_000, 60_000, 300_000, 600_000]]
      ),
      counter("ema.bridge.errors_total",
        tags: [:error_type]
      )
    ]
  end

  # ── Pipes Metrics ─────────────────────────────────────────────────

  defp pipes_metrics do
    [
      distribution("ema.pipes.step.duration",
        unit: {:native, :millisecond},
        tags: [:pipe_name, :step_name, :project_id],
        reporter_options: [buckets: [10, 50, 100, 500, 1000, 5000]]
      ),
      counter("ema.pipes.step.total",
        tags: [:pipe_name, :step_name, :status]
      ),
      last_value("ema.pipes.active_count"),
      counter("ema.pipes.completed_total",
        tags: [:pipe_name, :status]
      ),
      last_value("ema.pipes.queue_depth",
        tags: [:pipe_name]
      )
    ]
  end

  # ── Honcho Metrics ────────────────────────────────────────────────

  defp honcho_metrics do
    [
      last_value("ema.honcho.session.active_count"),
      counter("ema.honcho.session.total",
        tags: [:status]
      ),
      distribution("ema.honcho.session.duration",
        unit: {:native, :millisecond},
        reporter_options: [buckets: [60_000, 300_000, 900_000, 1_800_000, 3_600_000]]
      ),
      last_value("ema.honcho.scope.count",
        tags: [:scope_type]
      ),
      counter("ema.honcho.user_model.update_total",
        tags: [:update_type]
      )
    ]
  end

  # ── System Metrics ────────────────────────────────────────────────

  defp system_metrics do
    [
      last_value("ema.system.memory.total_bytes"),
      last_value("ema.system.memory.process_bytes"),
      last_value("ema.system.memory.ets_bytes"),
      last_value("ema.system.memory.binary_bytes"),
      last_value("ema.system.cpu.scheduler_utilization"),
      last_value("ema.system.process_count"),
      last_value("ema.system.port_count"),
      last_value("ema.system.run_queue"),

      # Database
      distribution("ema.system.db.query_duration",
        unit: {:native, :millisecond},
        tags: [:source],
        reporter_options: [buckets: [1, 5, 10, 25, 50, 100, 250]]
      ),
      last_value("ema.system.db.pool_size"),
      last_value("ema.system.db.pool_checked_out"),
      last_value("ema.system.db.size_bytes"),

      # PubSub
      counter("ema.system.pubsub.messages_total",
        tags: [:topic]
      ),
      last_value("ema.system.pubsub.subscriber_count",
        tags: [:topic]
      ),

      # Vault
      last_value("ema.system.vault.index_size_bytes"),
      distribution("ema.system.vault.search_duration",
        unit: {:native, :millisecond},
        reporter_options: [buckets: [5, 10, 25, 50, 100, 250]]
      )
    ]
  end
end
```

### Periodic Poller

```elixir
defmodule Ema.Telemetry.Poller do
  use GenServer

  @poll_interval_ms 15_000

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  @impl true
  def init(_) do
    schedule_poll()
    {:ok, %{}}
  end

  @impl true
  def handle_info(:poll, state) do
    emit_vm_metrics()
    emit_db_metrics()
    emit_superman_staleness()
    emit_integration_liveness()
    emit_rate_limits()
    schedule_poll()
    {:noreply, state}
  end

  defp schedule_poll, do: Process.send_after(self(), :poll, @poll_interval_ms)

  defp emit_vm_metrics do
    mem = :erlang.memory()
    :telemetry.execute([:ema, :system, :health], %{
      total_bytes: mem[:total],
      process_bytes: mem[:processes],
      ets_bytes: mem[:ets],
      binary_bytes: mem[:binary],
      process_count: :erlang.system_info(:process_count),
      port_count: :erlang.system_info(:port_count),
      run_queue: :erlang.statistics(:run_queue)
    }, %{})

    # Scheduler utilization (requires :scheduler_wall_time)
    case :scheduler.utilization(1) do
      [{:total, util, _} | _rest] ->
        :telemetry.execute([:ema, :system, :health], %{
          scheduler_utilization: util
        }, %{})
      _ -> :ok
    end
  end

  defp emit_db_metrics do
    # Query Ecto pool stats + DB size
    case Ema.Repo.__adapter__().storage_status(Ema.Repo.config()) do
      :up ->
        pool_stats = DBConnection.get_connection_metrics(Ema.Repo)
        :telemetry.execute([:ema, :system, :db], pool_stats, %{})
      _ -> :ok
    end
  end

  defp emit_superman_staleness do
    Ema.Superman.Index.staleness_report()
    |> Enum.each(fn {project_id, item_type, staleness_seconds, coverage} ->
      :telemetry.execute([:ema, :superman, :index], %{
        staleness_seconds: staleness_seconds,
        coverage_ratio: coverage
      }, %{project_id: project_id, item_type: item_type})
    end)
  end

  defp emit_integration_liveness do
    Ema.Integrations.all()
    |> Enum.each(fn integration ->
      :telemetry.execute([:ema, :integration, :liveness], %{
        connected: if(integration.connected?, do: 1, else: 0),
        last_event_timestamp: integration.last_event_at |> DateTime.to_unix(),
        queue_depth: integration.queue_depth
      }, %{integration: integration.name})
    end)
  end

  defp emit_rate_limits do
    Ema.Integrations.rate_limit_status()
    |> Enum.each(fn {name, remaining, limit, reset_at} ->
      :telemetry.execute([:ema, :integration, :rate_limit], %{
        remaining: remaining,
        limit: limit,
        reset_timestamp: reset_at
      }, %{integration: name})
    end)
  end
end
```

### Phoenix LiveDashboard Integration

```elixir
# router.ex
import Phoenix.LiveDashboard.Router

scope "/" do
  pipe_through [:browser, :admin_auth]

  live_dashboard "/dashboard",
    metrics: Ema.Telemetry,
    additional_pages: [
      superman: Ema.Dashboard.SupermanPage,
      integrations: Ema.Dashboard.IntegrationsPage
    ],
    ecto_repos: [Ema.Repo],
    ecto_psql_extras_options: [long_running_queries: [threshold: "200 milliseconds"]]
end
```

---

## 2. Prometheus Metrics Spec — Complete Reference

### Superman Metrics (`ema_superman_*`)

| Name | Type | Labels | Description | Alert Threshold |
|------|------|--------|-------------|-----------------|
| `ema_superman_embed_duration_milliseconds` | histogram | `item_type`, `project_id` | Time to embed a single item | p95 > 5000ms |
| `ema_superman_embed_total` | counter | `item_type`, `project_id`, `status` | Total embedding operations | error rate > 5% |
| `ema_superman_embed_queue_depth` | gauge | — | Items waiting to be embedded | > 1000 |
| `ema_superman_embed_throughput` | gauge | — | Items/sec rolling 1m window | < 1 item/sec sustained |
| `ema_superman_index_staleness_seconds` | gauge | `item_type`, `project_id` | Age of oldest stale item | > 86400 (24h) |
| `ema_superman_index_coverage_ratio` | gauge | `project_id` | Fraction with fresh embeddings | < 0.5 |
| `ema_superman_index_total_items` | gauge | `project_id` | Total indexed items | — |
| `ema_superman_search_duration_milliseconds` | histogram | `query_type`, `project_id` | Vector search latency | p95 > 250ms |
| `ema_superman_search_total` | counter | `query_type`, `project_id`, `status` | Total search queries | error rate > 5% |
| `ema_superman_graph_node_count` | gauge | `node_type`, `project_id` | Knowledge graph nodes | — |
| `ema_superman_graph_edge_count` | gauge | `edge_type`, `project_id` | Knowledge graph edges | — |
| `ema_superman_graph_mutations_total` | counter | `mutation_type`, `project_id` | Graph add/update/delete ops | — |
| `ema_superman_context_injection_total` | counter | `project_id`, `status` | Context injection attempts | failure rate > 10% |
| `ema_superman_intent_cluster_count` | gauge | `project_id` | Active intent clusters | — |
| `ema_superman_intent_detection_total` | counter | `project_id`, `status` | Intent detection attempts | — |

### Integration Metrics (`ema_integration_*`)

| Name | Type | Labels | Description | Alert Threshold |
|------|------|--------|-------------|-----------------|
| `ema_integration_sync_duration_milliseconds` | histogram | `integration`, `project_id` | Full sync cycle time | p95 > 30s |
| `ema_integration_sync_total` | counter | `integration`, `project_id`, `status` | Sync attempts | error rate > 20% |
| `ema_integration_sync_last_success_timestamp` | gauge | `integration`, `project_id` | Last successful sync (unix) | now - value > 3600 |
| `ema_integration_webhook_processing_duration_milliseconds` | histogram | `integration`, `event_type` | Webhook → processed time | p95 > 1000ms |
| `ema_integration_webhook_total` | counter | `integration`, `event_type`, `status` | Webhooks received | — |
| `ema_integration_rate_limit_remaining` | gauge | `integration` | Remaining API calls | < 20% of limit |
| `ema_integration_rate_limit_limit` | gauge | `integration` | Total allowed calls | — |
| `ema_integration_rate_limit_reset_timestamp` | gauge | `integration` | Window reset time (unix) | — |
| `ema_integration_oauth_expiry_timestamp` | gauge | `integration` | Token expiry (unix) | < 1h from now |
| `ema_integration_oauth_refresh_total` | counter | `integration`, `status` | Token refresh attempts | failure > 0 |
| `ema_integration_queue_depth` | gauge | `integration` | Pending events | > 500 |
| `ema_integration_connected` | gauge | `integration` | Connection state (0/1) | == 0 |
| `ema_integration_last_event_timestamp` | gauge | `integration` | Last event received (unix) | now - value > 3600 |

### Agent / Bridge Metrics (`ema_agent_*`, `ema_bridge_*`)

| Name | Type | Labels | Description | Alert Threshold |
|------|------|--------|-------------|-----------------|
| `ema_agent_execution_duration_milliseconds` | histogram | `agent_type`, `project_id` | Agent task duration | p95 > 300s |
| `ema_agent_execution_total` | counter | `agent_type`, `project_id`, `status` | Task completions | error rate > 10% |
| `ema_agent_active_count` | gauge | `agent_type` | Currently running agents | > 20 |
| `ema_agent_tokens_input_total` | counter | `agent_type`, `project_id`, `model` | Input tokens consumed | — |
| `ema_agent_tokens_output_total` | counter | `agent_type`, `project_id`, `model` | Output tokens consumed | — |
| `ema_agent_tokens_cost_cents_total` | counter | `agent_type`, `project_id`, `model` | Estimated cost (cents) | daily > 5000 |
| `ema_bridge_circuit_breaker_state` | gauge | `target` | 0=closed, 1=half, 2=open | == 2 |
| `ema_bridge_session_total` | counter | `status` | Session lifecycle events | — |
| `ema_bridge_session_active_count` | gauge | — | Active Claude sessions | > 10 |
| `ema_bridge_session_duration_milliseconds` | histogram | `status` | Session duration | — |
| `ema_bridge_errors_total` | counter | `error_type` | Bridge errors by type | > 10/5m |

### Pipes Metrics (`ema_pipes_*`)

| Name | Type | Labels | Description | Alert Threshold |
|------|------|--------|-------------|-----------------|
| `ema_pipes_step_duration_milliseconds` | histogram | `pipe_name`, `step_name`, `project_id` | Step execution time | p95 > 5s |
| `ema_pipes_step_total` | counter | `pipe_name`, `step_name`, `status` | Step executions | error rate > 15% |
| `ema_pipes_active_count` | gauge | — | Running pipes | > 50 |
| `ema_pipes_completed_total` | counter | `pipe_name`, `status` | Pipe completions | — |
| `ema_pipes_queue_depth` | gauge | `pipe_name` | Pending pipe triggers | > 100 |

### Honcho Metrics (`ema_honcho_*`)

| Name | Type | Labels | Description | Alert Threshold |
|------|------|--------|-------------|-----------------|
| `ema_honcho_session_active_count` | gauge | — | Active sessions | — |
| `ema_honcho_session_total` | counter | `status` | Session lifecycle events | — |
| `ema_honcho_session_duration_milliseconds` | histogram | — | Session duration | — |
| `ema_honcho_scope_count` | gauge | `scope_type` | Scopes by type | — |
| `ema_honcho_user_model_update_total` | counter | `update_type` | User model updates | — |

### System Metrics (`ema_system_*`)

| Name | Type | Labels | Description | Alert Threshold |
|------|------|--------|-------------|-----------------|
| `ema_system_memory_total_bytes` | gauge | — | Total BEAM memory | > 4GB |
| `ema_system_memory_process_bytes` | gauge | — | Process heap memory | > 2GB |
| `ema_system_memory_ets_bytes` | gauge | — | ETS table memory | > 1GB |
| `ema_system_memory_binary_bytes` | gauge | — | Binary/refc memory | > 1GB |
| `ema_system_cpu_scheduler_utilization` | gauge | — | BEAM scheduler util (0–1) | > 0.85 |
| `ema_system_process_count` | gauge | — | BEAM process count | > 100k |
| `ema_system_port_count` | gauge | — | BEAM port count | > 10k |
| `ema_system_run_queue` | gauge | — | Scheduler run queue | > 50 |
| `ema_system_db_query_duration_milliseconds` | histogram | `source` | DB query latency | p95 > 100ms |
| `ema_system_db_pool_size` | gauge | — | Connection pool size | — |
| `ema_system_db_pool_checked_out` | gauge | — | Active connections | > 90% of pool |
| `ema_system_db_size_bytes` | gauge | — | Database size on disk | > 10GB |
| `ema_system_pubsub_messages_total` | counter | `topic` | PubSub messages sent | — |
| `ema_system_pubsub_subscriber_count` | gauge | `topic` | Subscribers per topic | — |
| `ema_system_vault_index_size_bytes` | gauge | — | Vault index size | > 2GB |
| `ema_system_vault_search_duration_milliseconds` | histogram | — | Vault search latency | p95 > 250ms |

---

## 3. Alert Rules (Prometheus Alertmanager Format)

```yaml
# prometheus/alerts/ema_alerts.yml

groups:
  # ════════════════════════════════════════════
  # CRITICAL — Immediate action required
  # ════════════════════════════════════════════
  - name: ema_critical
    rules:
      - alert: EmaDaemonDown
        expr: up{job="ema"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "EMA daemon is down"
          description: "EMA Phoenix daemon has been unreachable for > 1 minute."
          runbook: "/docs/runbooks/ema-daemon-down.md"

      - alert: IntegrationAuthExpired
        expr: |
          (ema_integration_oauth_expiry_timestamp - time()) < 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "OAuth token expired for {{ $labels.integration }}"
          description: "Integration {{ $labels.integration }} token expired {{ $value | humanizeDuration }} ago. All API calls will fail."
          runbook: "/docs/runbooks/oauth-expired.md"

      - alert: SupermanIndexFullyStale
        expr: |
          ema_superman_index_coverage_ratio == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Superman index 100% stale for project {{ $labels.project_id }}"
          description: "No items have fresh embeddings. Context injection is non-functional."
          runbook: "/docs/runbooks/superman-index-stale.md"

      - alert: IntegrationDisconnected
        expr: |
          ema_integration_connected == 0
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Integration {{ $labels.integration }} disconnected for > 15m"
          description: "Integration has been disconnected. Attempting auto-reconnect."

      - alert: BridgeCircuitBreakerOpen
        expr: |
          ema_bridge_circuit_breaker_state == 2
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Bridge circuit breaker OPEN for {{ $labels.target }}"
          description: "Claude Code bridge has tripped circuit breaker. Agent execution is blocked."

      - alert: SystemMemoryCritical
        expr: |
          ema_system_memory_total_bytes > 4e9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "EMA BEAM memory > 4GB"
          description: "Current: {{ $value | humanize1024 }}. Possible memory leak or runaway process."

  # ════════════════════════════════════════════
  # WARNING — Investigate soon
  # ════════════════════════════════════════════
  - name: ema_warning
    rules:
      - alert: IntegrationSyncBehind
        expr: |
          (time() - ema_integration_sync_last_success_timestamp) > 3600
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.integration }} sync > 1h behind"
          description: "Last successful sync was {{ $value | humanizeDuration }} ago for project {{ $labels.project_id }}."

      - alert: RateLimitHighConsumption
        expr: |
          (ema_integration_rate_limit_remaining / ema_integration_rate_limit_limit) < 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.integration }} rate limit > 80% consumed"
          description: "Only {{ $value | humanizePercentage }} remaining. Resets at {{ with printf `ema_integration_rate_limit_reset_timestamp{integration=\"%s\"}` $labels.integration | query }}{{ . | first | value | humanizeTimestamp }}{{ end }}."

      - alert: AgentErrorRateHigh
        expr: |
          (
            rate(ema_agent_execution_total{status="error"}[5m])
            / rate(ema_agent_execution_total[5m])
          ) > 0.10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Agent {{ $labels.agent_type }} error rate > 10%"
          description: "Error rate: {{ $value | humanizePercentage }} over last 10m."

      - alert: OAuthExpiringWithinHour
        expr: |
          (ema_integration_oauth_expiry_timestamp - time()) < 3600
          and
          (ema_integration_oauth_expiry_timestamp - time()) > 0
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.integration }} OAuth token expires in < 1h"
          description: "Token expires in {{ $value | humanizeDuration }}. Auto-refresh should handle this."

      - alert: SupermanIndexDegraded
        expr: |
          ema_superman_index_coverage_ratio < 0.5
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Superman index coverage < 50% for {{ $labels.project_id }}"
          description: "Coverage: {{ $value | humanizePercentage }}. Context quality degraded."

      - alert: EmbeddingQueueBacklog
        expr: |
          ema_superman_embed_queue_depth > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Embedding queue depth > 1000"
          description: "{{ $value }} items queued. Pipeline may be stalled."

      - alert: SearchLatencyHigh
        expr: |
          histogram_quantile(0.95, rate(ema_superman_search_duration_milliseconds_bucket[5m])) > 250
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Superman search p95 > 250ms"
          description: "p95 latency: {{ $value }}ms. Search performance degraded."

      - alert: IntegrationQueueDeep
        expr: |
          ema_integration_queue_depth > 500
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.integration }} event queue depth > 500"
          description: "{{ $value }} events queued. Processing may be falling behind."

      - alert: HighSchedulerUtilization
        expr: |
          ema_system_cpu_scheduler_utilization > 0.85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "BEAM scheduler utilization > 85%"
          description: "Schedulers at {{ $value | humanizePercentage }}. May need to investigate hot processes."

      - alert: DatabaseQuerySlow
        expr: |
          histogram_quantile(0.95, rate(ema_system_db_query_duration_milliseconds_bucket[5m])) > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "DB query p95 > 100ms"
          description: "p95: {{ $value }}ms. Check slow query log."

      - alert: DailyTokenSpendHigh
        expr: |
          increase(ema_agent_tokens_cost_cents_total[24h]) > 5000
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Daily token spend > $50"
          description: "24h spend: ${{ $value | humanize }}. Review agent activity."

  # ════════════════════════════════════════════
  # INFO — Notifications, no action needed
  # ════════════════════════════════════════════
  - name: ema_info
    rules:
      - alert: EmbeddingBatchCompleted
        expr: |
          increase(ema_superman_embed_total{status="success"}[5m]) > 100
        for: 0m
        labels:
          severity: info
        annotations:
          summary: "Embedding batch: {{ $value }} items processed in 5m"

      - alert: IntegrationReconnected
        expr: |
          ema_integration_connected == 1
          and
          (ema_integration_connected offset 5m) == 0
        for: 0m
        labels:
          severity: info
        annotations:
          summary: "{{ $labels.integration }} reconnected"
          description: "Integration was previously disconnected, now connected."

      - alert: NewProjectLinked
        expr: |
          increase(ema_superman_index_total_items[5m]) > 0
          unless
          ema_superman_index_total_items offset 5m > 0
        for: 0m
        labels:
          severity: info
        annotations:
          summary: "New project indexed: {{ $labels.project_id }}"
```

### Alertmanager Configuration

```yaml
# alertmanager/alertmanager.yml

global:
  resolve_timeout: 5m

route:
  receiver: default
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: critical-channel
      group_wait: 10s
      repeat_interval: 1h
    - match:
        severity: warning
      receiver: warning-channel
      repeat_interval: 4h
    - match:
        severity: info
      receiver: info-channel
      repeat_interval: 24h

receivers:
  - name: default
    webhook_configs:
      - url: 'http://localhost:4488/api/webhooks/alertmanager'
        send_resolved: true

  - name: critical-channel
    webhook_configs:
      - url: 'http://localhost:4488/api/webhooks/alertmanager'
        send_resolved: true
    # EMA forwards to Discord #alerts-critical

  - name: warning-channel
    webhook_configs:
      - url: 'http://localhost:4488/api/webhooks/alertmanager'
        send_resolved: true
    # EMA forwards to Discord #alerts-warning

  - name: info-channel
    webhook_configs:
      - url: 'http://localhost:4488/api/webhooks/alertmanager'
        send_resolved: true
    # EMA forwards to Discord #alerts-info

inhibit_rules:
  - source_match:
      severity: critical
    target_match:
      severity: warning
    equal: ['alertname', 'integration']
  - source_match:
      alertname: EmaDaemonDown
    target_match:
      severity: warning
    # Suppress all warnings when daemon is down
```

---

## 4. Grafana Dashboard Specs

### Dashboard 1: EMA System Overview

```json
{
  "dashboard": {
    "title": "EMA - System Overview",
    "uid": "ema-overview",
    "refresh": "30s",
    "time": { "from": "now-6h", "to": "now" },
    "templating": {
      "list": [
        {
          "name": "project_id",
          "type": "query",
          "query": "label_values(ema_superman_index_total_items, project_id)",
          "includeAll": true,
          "multi": true
        }
      ]
    },
    "panels": [
      {
        "title": "Daemon Status",
        "type": "stat",
        "gridPos": { "h": 4, "w": 3, "x": 0, "y": 0 },
        "targets": [{ "expr": "up{job=\"ema\"}" }],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              { "type": "value", "options": { "1": { "text": "UP", "color": "green" }, "0": { "text": "DOWN", "color": "red" } } }
            ]
          }
        }
      },
      {
        "title": "Active Agents",
        "type": "stat",
        "gridPos": { "h": 4, "w": 3, "x": 3, "y": 0 },
        "targets": [{ "expr": "sum(ema_agent_active_count)" }],
        "fieldConfig": { "defaults": { "color": { "mode": "thresholds" }, "thresholds": { "steps": [{ "value": 0, "color": "green" }, { "value": 15, "color": "yellow" }, { "value": 20, "color": "red" }] } } }
      },
      {
        "title": "Bridge Sessions",
        "type": "stat",
        "gridPos": { "h": 4, "w": 3, "x": 6, "y": 0 },
        "targets": [{ "expr": "ema_bridge_session_active_count" }]
      },
      {
        "title": "Token Spend Today ($)",
        "type": "stat",
        "gridPos": { "h": 4, "w": 3, "x": 9, "y": 0 },
        "targets": [{ "expr": "increase(ema_agent_tokens_cost_cents_total[24h]) / 100" }],
        "fieldConfig": { "defaults": { "unit": "currencyUSD", "thresholds": { "steps": [{ "value": 0, "color": "green" }, { "value": 25, "color": "yellow" }, { "value": 50, "color": "red" }] } } }
      },
      {
        "title": "BEAM Memory",
        "type": "stat",
        "gridPos": { "h": 4, "w": 3, "x": 12, "y": 0 },
        "targets": [{ "expr": "ema_system_memory_total_bytes" }],
        "fieldConfig": { "defaults": { "unit": "bytes", "thresholds": { "steps": [{ "value": 0, "color": "green" }, { "value": 2e9, "color": "yellow" }, { "value": 4e9, "color": "red" }] } } }
      },
      {
        "title": "Scheduler Utilization",
        "type": "gauge",
        "gridPos": { "h": 4, "w": 3, "x": 15, "y": 0 },
        "targets": [{ "expr": "ema_system_cpu_scheduler_utilization" }],
        "fieldConfig": { "defaults": { "unit": "percentunit", "min": 0, "max": 1, "thresholds": { "steps": [{ "value": 0, "color": "green" }, { "value": 0.7, "color": "yellow" }, { "value": 0.85, "color": "red" }] } } }
      },
      {
        "title": "Superman Index Coverage",
        "type": "bargauge",
        "gridPos": { "h": 4, "w": 6, "x": 18, "y": 0 },
        "targets": [{ "expr": "ema_superman_index_coverage_ratio{project_id=~\"$project_id\"}", "legendFormat": "{{ project_id }}" }],
        "fieldConfig": { "defaults": { "unit": "percentunit", "min": 0, "max": 1, "thresholds": { "steps": [{ "value": 0, "color": "red" }, { "value": 0.5, "color": "yellow" }, { "value": 0.8, "color": "green" }] } } }
      },
      {
        "title": "Integration Status Grid",
        "type": "state-timeline",
        "gridPos": { "h": 6, "w": 12, "x": 0, "y": 4 },
        "targets": [{ "expr": "ema_integration_connected", "legendFormat": "{{ integration }}" }],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              { "type": "value", "options": { "1": { "text": "Connected", "color": "green" }, "0": { "text": "Disconnected", "color": "red" } } }
            ]
          }
        }
      },
      {
        "title": "Pipe Throughput",
        "type": "timeseries",
        "gridPos": { "h": 6, "w": 12, "x": 12, "y": 4 },
        "targets": [
          { "expr": "rate(ema_pipes_completed_total{status=\"success\"}[5m])", "legendFormat": "{{ pipe_name }} (success)" },
          { "expr": "rate(ema_pipes_completed_total{status=\"error\"}[5m])", "legendFormat": "{{ pipe_name }} (error)" }
        ]
      },
      {
        "title": "Agent Execution Duration (p95)",
        "type": "timeseries",
        "gridPos": { "h": 6, "w": 12, "x": 0, "y": 10 },
        "targets": [{ "expr": "histogram_quantile(0.95, rate(ema_agent_execution_duration_milliseconds_bucket{project_id=~\"$project_id\"}[5m]))", "legendFormat": "{{ agent_type }}" }],
        "fieldConfig": { "defaults": { "unit": "ms" } }
      },
      {
        "title": "Token Consumption by Model",
        "type": "piechart",
        "gridPos": { "h": 6, "w": 6, "x": 12, "y": 10 },
        "targets": [{ "expr": "increase(ema_agent_tokens_cost_cents_total{project_id=~\"$project_id\"}[24h])", "legendFormat": "{{ model }} / {{ agent_type }}" }]
      },
      {
        "title": "DB Query Latency (p50/p95/p99)",
        "type": "timeseries",
        "gridPos": { "h": 6, "w": 6, "x": 18, "y": 10 },
        "targets": [
          { "expr": "histogram_quantile(0.50, rate(ema_system_db_query_duration_milliseconds_bucket[5m]))", "legendFormat": "p50" },
          { "expr": "histogram_quantile(0.95, rate(ema_system_db_query_duration_milliseconds_bucket[5m]))", "legendFormat": "p95" },
          { "expr": "histogram_quantile(0.99, rate(ema_system_db_query_duration_milliseconds_bucket[5m]))", "legendFormat": "p99" }
        ],
        "fieldConfig": { "defaults": { "unit": "ms" } }
      }
    ]
  }
}
```

### Dashboard 2: Superman Intelligence

```json
{
  "dashboard": {
    "title": "EMA - Superman Intelligence",
    "uid": "ema-superman",
    "refresh": "1m",
    "time": { "from": "now-24h", "to": "now" },
    "templating": {
      "list": [
        {
          "name": "project_id",
          "type": "query",
          "query": "label_values(ema_superman_index_total_items, project_id)",
          "includeAll": true,
          "multi": true
        }
      ]
    },
    "panels": [
      {
        "title": "Index Coverage by Project",
        "type": "bargauge",
        "gridPos": { "h": 5, "w": 8, "x": 0, "y": 0 },
        "targets": [{ "expr": "ema_superman_index_coverage_ratio{project_id=~\"$project_id\"}", "legendFormat": "{{ project_id }}" }],
        "fieldConfig": { "defaults": { "unit": "percentunit", "min": 0, "max": 1, "thresholds": { "steps": [{ "value": 0, "color": "red" }, { "value": 0.5, "color": "yellow" }, { "value": 0.8, "color": "green" }] } } }
      },
      {
        "title": "Embedding Throughput (items/sec)",
        "type": "timeseries",
        "gridPos": { "h": 5, "w": 8, "x": 8, "y": 0 },
        "targets": [{ "expr": "ema_superman_embed_throughput", "legendFormat": "throughput" }],
        "fieldConfig": { "defaults": { "unit": "ops" } }
      },
      {
        "title": "Embedding Queue Depth",
        "type": "stat",
        "gridPos": { "h": 5, "w": 4, "x": 16, "y": 0 },
        "targets": [{ "expr": "ema_superman_embed_queue_depth" }],
        "fieldConfig": { "defaults": { "thresholds": { "steps": [{ "value": 0, "color": "green" }, { "value": 500, "color": "yellow" }, { "value": 1000, "color": "red" }] } } }
      },
      {
        "title": "Total Indexed Items",
        "type": "stat",
        "gridPos": { "h": 5, "w": 4, "x": 20, "y": 0 },
        "targets": [{ "expr": "sum(ema_superman_index_total_items{project_id=~\"$project_id\"})" }]
      },
      {
        "title": "Embedding Latency (p50/p95/p99)",
        "type": "timeseries",
        "gridPos": { "h": 6, "w": 12, "x": 0, "y": 5 },
        "targets": [
          { "expr": "histogram_quantile(0.50, rate(ema_superman_embed_duration_milliseconds_bucket{project_id=~\"$project_id\"}[5m]))", "legendFormat": "p50" },
          { "expr": "histogram_quantile(0.95, rate(ema_superman_embed_duration_milliseconds_bucket{project_id=~\"$project_id\"}[5m]))", "legendFormat": "p95" },
          { "expr": "histogram_quantile(0.99, rate(ema_superman_embed_duration_milliseconds_bucket{project_id=~\"$project_id\"}[5m]))", "legendFormat": "p99" }
        ],
        "fieldConfig": { "defaults": { "unit": "ms" } }
      },
      {
        "title": "Search Latency Heatmap",
        "type": "heatmap",
        "gridPos": { "h": 6, "w": 12, "x": 12, "y": 5 },
        "targets": [{ "expr": "rate(ema_superman_search_duration_milliseconds_bucket{project_id=~\"$project_id\"}[5m])", "format": "heatmap" }],
        "options": { "calculate": false, "yAxis": { "unit": "ms" } }
      },
      {
        "title": "Knowledge Graph Growth",
        "type": "timeseries",
        "gridPos": { "h": 6, "w": 12, "x": 0, "y": 11 },
        "targets": [
          { "expr": "sum(ema_superman_graph_node_count{project_id=~\"$project_id\"}) by (node_type)", "legendFormat": "nodes: {{ node_type }}" },
          { "expr": "sum(ema_superman_graph_edge_count{project_id=~\"$project_id\"}) by (edge_type)", "legendFormat": "edges: {{ edge_type }}" }
        ]
      },
      {
        "title": "Intent Clusters",
        "type": "timeseries",
        "gridPos": { "h": 6, "w": 6, "x": 12, "y": 11 },
        "targets": [
          { "expr": "ema_superman_intent_cluster_count{project_id=~\"$project_id\"}", "legendFormat": "{{ project_id }}" },
          { "expr": "rate(ema_superman_intent_detection_total{status=\"success\", project_id=~\"$project_id\"}[5m])", "legendFormat": "detections/s" }
        ]
      },
      {
        "title": "Context Injection Success Rate",
        "type": "timeseries",
        "gridPos": { "h": 6, "w": 6, "x": 18, "y": 11 },
        "targets": [{ "expr": "rate(ema_superman_context_injection_total{status=\"success\", project_id=~\"$project_id\"}[5m]) / rate(ema_superman_context_injection_total{project_id=~\"$project_id\"}[5m])", "legendFormat": "{{ project_id }}" }],
        "fieldConfig": { "defaults": { "unit": "percentunit", "min": 0, "max": 1 } }
      },
      {
        "title": "Staleness Map — Items Due for Re-embedding",
        "description": "Shows items grouped by staleness bucket. Red = stale > 24h, yellow = 6-24h, green = fresh.",
        "type": "table",
        "gridPos": { "h": 8, "w": 24, "x": 0, "y": 17 },
        "targets": [
          { "expr": "ema_superman_index_staleness_seconds{project_id=~\"$project_id\"}", "format": "table", "instant": true }
        ],
        "transformations": [
          { "id": "organize", "options": { "renameByName": { "project_id": "Project", "item_type": "Type", "Value": "Staleness (s)" } } }
        ],
        "fieldConfig": {
          "overrides": [
            {
              "matcher": { "id": "byName", "options": "Staleness (s)" },
              "properties": [
                { "id": "unit", "value": "s" },
                { "id": "thresholds", "value": { "steps": [{ "value": 0, "color": "green" }, { "value": 21600, "color": "yellow" }, { "value": 86400, "color": "red" }] } },
                { "id": "custom.displayMode", "value": "color-background" }
              ]
            }
          ]
        }
      }
    ]
  }
}
```

### Dashboard 3: Integration Health

```json
{
  "dashboard": {
    "title": "EMA - Integration Health",
    "uid": "ema-integrations",
    "refresh": "30s",
    "time": { "from": "now-12h", "to": "now" },
    "templating": {
      "list": [
        {
          "name": "integration",
          "type": "query",
          "query": "label_values(ema_integration_connected, integration)",
          "includeAll": true,
          "multi": true
        }
      ]
    },
    "panels": [
      {
        "title": "Integration Status Overview",
        "type": "table",
        "gridPos": { "h": 8, "w": 24, "x": 0, "y": 0 },
        "targets": [
          { "expr": "ema_integration_connected{integration=~\"$integration\"}", "format": "table", "instant": true, "refId": "connected" },
          { "expr": "time() - ema_integration_sync_last_success_timestamp{integration=~\"$integration\"}", "format": "table", "instant": true, "refId": "last_sync_age" },
          { "expr": "rate(ema_integration_sync_total{status=\"error\", integration=~\"$integration\"}[1h]) / rate(ema_integration_sync_total{integration=~\"$integration\"}[1h])", "format": "table", "instant": true, "refId": "error_rate" },
          { "expr": "ema_integration_rate_limit_remaining{integration=~\"$integration\"} / ema_integration_rate_limit_limit{integration=~\"$integration\"}", "format": "table", "instant": true, "refId": "rate_remaining" },
          { "expr": "ema_integration_queue_depth{integration=~\"$integration\"}", "format": "table", "instant": true, "refId": "queue" }
        ],
        "transformations": [
          { "id": "merge" },
          {
            "id": "organize",
            "options": {
              "renameByName": {
                "integration": "Integration",
                "Value #connected": "Status",
                "Value #last_sync_age": "Last Sync Age",
                "Value #error_rate": "Error Rate",
                "Value #rate_remaining": "Rate Limit Left",
                "Value #queue": "Queue Depth"
              }
            }
          }
        ],
        "fieldConfig": {
          "overrides": [
            {
              "matcher": { "id": "byName", "options": "Status" },
              "properties": [
                { "id": "mappings", "value": [{ "type": "value", "options": { "1": { "text": "✅ Connected", "color": "green" }, "0": { "text": "❌ Disconnected", "color": "red" } } }] }
              ]
            },
            {
              "matcher": { "id": "byName", "options": "Last Sync Age" },
              "properties": [
                { "id": "unit", "value": "s" },
                { "id": "thresholds", "value": { "steps": [{ "value": 0, "color": "green" }, { "value": 1800, "color": "yellow" }, { "value": 3600, "color": "red" }] } },
                { "id": "custom.displayMode", "value": "color-background" }
              ]
            },
            {
              "matcher": { "id": "byName", "options": "Error Rate" },
              "properties": [
                { "id": "unit", "value": "percentunit" },
                { "id": "thresholds", "value": { "steps": [{ "value": 0, "color": "green" }, { "value": 0.1, "color": "yellow" }, { "value": 0.3, "color": "red" }] } },
                { "id": "custom.displayMode", "value": "color-background" }
              ]
            },
            {
              "matcher": { "id": "byName", "options": "Rate Limit Left" },
              "properties": [
                { "id": "unit", "value": "percentunit" },
                { "id": "thresholds", "value": { "steps": [{ "value": 0, "color": "red" }, { "value": 0.2, "color": "yellow" }, { "value": 0.5, "color": "green" }] } },
                { "id": "custom.displayMode", "value": "color-background" }
              ]
            }
          ]
        }
      },
      {
        "title": "Webhook Delivery Latency",
        "type": "timeseries",
        "gridPos": { "h": 7, "w": 12, "x": 0, "y": 8 },
        "targets": [
          { "expr": "histogram_quantile(0.50, rate(ema_integration_webhook_processing_duration_milliseconds_bucket{integration=~\"$integration\"}[5m]))", "legendFormat": "{{ integration }} p50" },
          { "expr": "histogram_quantile(0.95, rate(ema_integration_webhook_processing_duration_milliseconds_bucket{integration=~\"$integration\"}[5m]))", "legendFormat": "{{ integration }} p95" }
        ],
        "fieldConfig": { "defaults": { "unit": "ms" } }
      },
      {
        "title": "OAuth Token Expiry Countdown",
        "type": "bargauge",
        "gridPos": { "h": 7, "w": 6, "x": 12, "y": 8 },
        "targets": [{ "expr": "(ema_integration_oauth_expiry_timestamp{integration=~\"$integration\"} - time()) / 3600", "legendFormat": "{{ integration }}" }],
        "fieldConfig": {
          "defaults": {
            "unit": "h",
            "min": 0,
            "thresholds": { "steps": [{ "value": 0, "color": "red" }, { "value": 1, "color": "yellow" }, { "value": 12, "color": "green" }] }
          }
        }
      },
      {
        "title": "Event Queue Depth Over Time",
        "type": "timeseries",
        "gridPos": { "h": 7, "w": 6, "x": 18, "y": 8 },
        "targets": [{ "expr": "ema_integration_queue_depth{integration=~\"$integration\"}", "legendFormat": "{{ integration }}" }]
      },
      {
        "title": "Rate Limit Consumption (% Used)",
        "type": "timeseries",
        "gridPos": { "h": 7, "w": 12, "x": 0, "y": 15 },
        "targets": [{ "expr": "1 - (ema_integration_rate_limit_remaining{integration=~\"$integration\"} / ema_integration_rate_limit_limit{integration=~\"$integration\"})", "legendFormat": "{{ integration }}" }],
        "fieldConfig": { "defaults": { "unit": "percentunit", "min": 0, "max": 1, "thresholds": { "steps": [{ "value": 0, "color": "green" }, { "value": 0.7, "color": "yellow" }, { "value": 0.9, "color": "red" }] } } }
      },
      {
        "title": "Sync Error Rate by Integration",
        "type": "timeseries",
        "gridPos": { "h": 7, "w": 12, "x": 12, "y": 15 },
        "targets": [{ "expr": "rate(ema_integration_sync_total{status=\"error\", integration=~\"$integration\"}[5m]) / rate(ema_integration_sync_total{integration=~\"$integration\"}[5m])", "legendFormat": "{{ integration }}" }],
        "fieldConfig": { "defaults": { "unit": "percentunit" } }
      }
    ]
  }
}
```

---

## 5. Stale Integration Detection

### Detection Algorithm

```elixir
defmodule Ema.Integrations.StalenessDetector do
  @moduledoc """
  Monitors integration liveness by tracking event recency.
  Runs as a periodic GenServer, checking every 5 minutes.
  """
  use GenServer

  @check_interval_ms 300_000  # 5 minutes
  @thresholds %{
    warning:  15 * 60,    # 15 minutes — no events
    alert:    60 * 60,    # 1 hour
    critical: 4 * 60 * 60 # 4 hours — trigger auto-reconnect
  }

  # Per-integration expected event cadence (seconds).
  # If an integration normally has gaps > threshold, adjust here.
  @expected_cadence %{
    "github"  => 86_400,  # Active repos should have at least daily activity
    "discord" => 300,     # Heartbeat every 5 min via WebSocket
    "slack"   => 300,     # Similar to Discord
    "drive"   => 3_600,   # Hourly sync check
    "vps"     => 300,     # SSH keepalive / health ping every 5 min
    "api"     => 3_600,   # Varies; default 1h
    "email"   => 3_600    # IMAP IDLE or periodic poll
  }

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    schedule_check()
    {:ok, %{escalation_state: %{}}}
  end

  @impl true
  def handle_info(:check, state) do
    new_state = check_all_integrations(state)
    schedule_check()
    {:noreply, new_state}
  end

  defp check_all_integrations(state) do
    now = System.system_time(:second)

    Ema.Integrations.all()
    |> Enum.reduce(state, fn integration, acc ->
      last_event = integration.last_event_at |> DateTime.to_unix()
      silence_duration = now - last_event
      expected = Map.get(@expected_cadence, integration.name, 3_600)

      # Only alert if silence exceeds expected cadence
      cond do
        silence_duration < expected ->
          clear_escalation(acc, integration.name)

        silence_duration >= @thresholds.critical ->
          escalate(acc, integration.name, :critical, silence_duration)
          attempt_auto_reconnect(integration)
          acc

        silence_duration >= @thresholds.alert ->
          escalate(acc, integration.name, :alert, silence_duration)

        silence_duration >= @thresholds.warning ->
          escalate(acc, integration.name, :warning, silence_duration)

        true ->
          acc
      end
    end)
  end

  defp escalate(state, name, level, duration) do
    current_level = get_in(state, [:escalation_state, name])

    # Only emit telemetry on escalation (not repeated same-level)
    if current_level != level do
      :telemetry.execute(
        [:ema, :integration, :staleness],
        %{silence_duration: duration, level: level_to_int(level)},
        %{integration: name}
      )

      Logger.warning(
        "Integration #{name} stale: #{duration}s silence (#{level})",
        integration: name, level: level, silence_seconds: duration
      )
    end

    put_in(state, [:escalation_state, name], level)
  end

  defp attempt_auto_reconnect(integration) do
    Logger.warning("Attempting auto-reconnect for #{integration.name}")

    case Ema.Integrations.reconnect(integration.name) do
      :ok ->
        Logger.info("Auto-reconnect succeeded for #{integration.name}")
      {:error, reason} ->
        Logger.error("Auto-reconnect failed for #{integration.name}: #{inspect(reason)}")
    end
  end

  defp clear_escalation(state, name) do
    if get_in(state, [:escalation_state, name]) do
      Logger.info("Integration #{name} recovered — events flowing again")
    end
    put_in(state, [:escalation_state, name], nil)
  end

  defp level_to_int(:warning), do: 1
  defp level_to_int(:alert), do: 2
  defp level_to_int(:critical), do: 3

  defp schedule_check, do: Process.send_after(self(), :check, @check_interval_ms)
end
```

### Per-Integration Detection Specifics

| Integration | Signal | Detection Method |
|-------------|--------|-----------------|
| **GitHub** | No webhook delivery | `last_event_timestamp` not advancing for repos with recent commits (cross-reference via API) |
| **Discord** | WebSocket dropped | `connected` gauge = 0; also detect via heartbeat ACK timeout in Gateway module |
| **Slack** | Socket Mode disconnect | `connected` gauge = 0; RTM/Socket ping/pong failure |
| **Drive** | File timestamps frozen | Compare `last_modified` from API poll vs local cache; no delta = stale |
| **VPS** | SSH timeout | Connection probe fails; `connected` = 0 after 3 consecutive probe failures (30s apart) |
| **API Providers** | Error rate spike | 5xx rate > 50% over 5m window on health-check endpoint pings |

---

## 6. Failed Indexing Detection

### Embedding Failure Detection

```elixir
defmodule Ema.Superman.IndexHealthChecker do
  @moduledoc """
  Periodic checks for Superman indexing health:
  - Embedding API availability
  - Index consistency (vector count vs item count)
  - Stale items (not re-embedded within threshold)
  - Knowledge graph consistency
  """
  use GenServer

  @check_interval_ms 60_000  # Every minute
  @staleness_threshold_seconds 86_400  # 24 hours

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)

  @impl true
  def init(_) do
    schedule_check()
    {:ok, %{consecutive_embed_failures: 0}}
  end

  @impl true
  def handle_info(:check, state) do
    state =
      state
      |> check_embedding_api()
      |> check_index_consistency()
      |> check_stale_items()
      |> check_graph_consistency()

    schedule_check()
    {:noreply, state}
  end

  # ── Embedding API Health ──────────────────────────────────────

  defp check_embedding_api(state) do
    case Ema.Superman.Embeddings.health_check() do
      :ok ->
        %{state | consecutive_embed_failures: 0}

      {:error, reason} ->
        failures = state.consecutive_embed_failures + 1

        if failures >= 3 do
          :telemetry.execute(
            [:ema, :superman, :embed, :api_down],
            %{consecutive_failures: failures},
            %{reason: reason}
          )
          Logger.error("Embedding API down: #{failures} consecutive failures. Reason: #{inspect(reason)}")
        end

        %{state | consecutive_embed_failures: failures}
    end
  end

  # ── Index Consistency ─────────────────────────────────────────

  defp check_index_consistency(state) do
    Ema.Superman.Index.all_projects()
    |> Enum.each(fn project_id ->
      item_count = Ema.Superman.Index.item_count(project_id)
      vector_count = Ema.Superman.VectorStore.count(project_id)

      mismatch = abs(item_count - vector_count)
      mismatch_ratio = if item_count > 0, do: mismatch / item_count, else: 0

      if mismatch_ratio > 0.05 do  # > 5% mismatch
        :telemetry.execute(
          [:ema, :superman, :index, :corruption],
          %{item_count: item_count, vector_count: vector_count, mismatch: mismatch},
          %{project_id: project_id}
        )
        Logger.error(
          "Index corruption detected for #{project_id}: #{item_count} items vs #{vector_count} vectors (#{mismatch} mismatch)"
        )
      end
    end)

    state
  end

  # ── Stale Items ───────────────────────────────────────────────

  defp check_stale_items(state) do
    now = System.system_time(:second)

    Ema.Superman.Index.all_projects()
    |> Enum.each(fn project_id ->
      stale_items = Ema.Superman.Index.items_older_than(project_id, now - @staleness_threshold_seconds)
      total_items = Ema.Superman.Index.item_count(project_id)
      stale_ratio = if total_items > 0, do: length(stale_items) / total_items, else: 0

      :telemetry.execute(
        [:ema, :superman, :index],
        %{
          staleness_seconds: oldest_staleness(stale_items, now),
          coverage_ratio: 1.0 - stale_ratio,
          total_items: total_items
        },
        %{project_id: project_id, item_type: "all"}
      )
    end)

    state
  end

  # ── Knowledge Graph Consistency ───────────────────────────────

  defp check_graph_consistency(state) do
    Ema.Superman.Index.all_projects()
    |> Enum.each(fn project_id ->
      # Check for orphaned edges (edges referencing non-existent nodes)
      orphaned = Ema.Superman.Graph.orphaned_edges(project_id)

      if length(orphaned) > 0 do
        :telemetry.execute(
          [:ema, :superman, :graph, :inconsistency],
          %{orphaned_edges: length(orphaned)},
          %{project_id: project_id}
        )
        Logger.warning("Knowledge graph inconsistency: #{length(orphaned)} orphaned edges in #{project_id}")
      end

      # Check for duplicate nodes (same entity, multiple nodes)
      duplicates = Ema.Superman.Graph.duplicate_nodes(project_id)

      if length(duplicates) > 0 do
        Logger.info("Knowledge graph: #{length(duplicates)} potential duplicate nodes in #{project_id}")
      end
    end)

    state
  end

  defp oldest_staleness([], _now), do: 0
  defp oldest_staleness(stale_items, now) do
    stale_items
    |> Enum.map(& now - DateTime.to_unix(&1.last_embedded_at))
    |> Enum.max(fn -> 0 end)
  end

  defp schedule_check, do: Process.send_after(self(), :check, @check_interval_ms)
end
```

---

## 7. Health Check Endpoints

### Router

```elixir
# lib/ema_web/router.ex
scope "/health", EmaWeb.HealthController do
  get "/", :liveness
  get "/ready", :readiness
  get "/superman", :superman
  get "/integrations/:name", :integration
  get "/detailed", :detailed
end
```

### Controller + Response Schemas

```elixir
defmodule EmaWeb.HealthController do
  use EmaWeb, :controller

  # GET /health — Basic liveness (for load balancers / k8s probes)
  # Response: 200 {"status": "ok", "timestamp": "2026-04-03T21:00:00Z"}
  #           503 {"status": "error", "reason": "..."}
  def liveness(conn, _params) do
    json(conn, %{
      status: "ok",
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      version: Application.spec(:ema, :vsn) |> to_string()
    })
  end

  # GET /health/ready — Readiness (all critical deps connected?)
  # Response: 200 {"status": "ready", "checks": {...}}
  #           503 {"status": "not_ready", "checks": {...}, "failures": [...]}
  def readiness(conn, _params) do
    checks = %{
      database: check_database(),
      vector_store: check_vector_store(),
      integrations: check_integrations_connected()
    }

    failures = checks |> Enum.filter(fn {_, v} -> v.status != "ok" end) |> Enum.map(&elem(&1, 0))

    status_code = if Enum.empty?(failures), do: 200, else: 503
    status_text = if Enum.empty?(failures), do: "ready", else: "not_ready"

    conn
    |> put_status(status_code)
    |> json(%{
      status: status_text,
      checks: checks,
      failures: failures,
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
    })
  end

  # GET /health/superman — Superman indexing pipeline status
  # Response: 200/503
  # {
  #   "status": "ok" | "degraded" | "error",
  #   "embedding_api": "ok" | "down",
  #   "queue_depth": 42,
  #   "throughput_items_per_sec": 3.5,
  #   "projects": [
  #     {"id": "proj_1", "coverage": 0.95, "staleness_seconds": 1200, "item_count": 500, "vector_count": 498}
  #   ]
  # }
  def superman(conn, _params) do
    embedding_api = case Ema.Superman.Embeddings.health_check() do
      :ok -> "ok"
      _ -> "down"
    end

    projects = Ema.Superman.Index.all_projects()
    |> Enum.map(fn pid ->
      %{
        id: pid,
        coverage: Ema.Superman.Index.coverage(pid),
        staleness_seconds: Ema.Superman.Index.max_staleness(pid),
        item_count: Ema.Superman.Index.item_count(pid),
        vector_count: Ema.Superman.VectorStore.count(pid)
      }
    end)

    overall = cond do
      embedding_api == "down" -> "error"
      Enum.any?(projects, & &1.coverage < 0.5) -> "degraded"
      true -> "ok"
    end

    status_code = if overall == "error", do: 503, else: 200

    conn
    |> put_status(status_code)
    |> json(%{
      status: overall,
      embedding_api: embedding_api,
      queue_depth: Ema.Superman.EmbedQueue.depth(),
      throughput_items_per_sec: Ema.Superman.EmbedQueue.throughput(),
      projects: projects,
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
    })
  end

  # GET /health/integrations/:name — Per-integration health
  # Response: 200/503
  # {
  #   "integration": "github",
  #   "status": "connected" | "disconnected" | "degraded",
  #   "connected": true,
  #   "last_sync_at": "2026-04-03T20:45:00Z",
  #   "last_event_at": "2026-04-03T21:00:00Z",
  #   "error_rate_1h": 0.02,
  #   "rate_limit": {"remaining": 4200, "limit": 5000, "resets_at": "2026-04-03T22:00:00Z"},
  #   "oauth_expires_at": "2026-04-04T21:00:00Z",
  #   "queue_depth": 5
  # }
  def integration(conn, %{"name" => name}) do
    case Ema.Integrations.get(name) do
      nil ->
        conn |> put_status(404) |> json(%{error: "Unknown integration: #{name}"})

      int ->
        rl = Ema.Integrations.rate_limit_for(name)

        status = cond do
          not int.connected? -> "disconnected"
          int.error_rate_1h > 0.2 -> "degraded"
          true -> "connected"
        end

        status_code = if status == "disconnected", do: 503, else: 200

        conn
        |> put_status(status_code)
        |> json(%{
          integration: name,
          status: status,
          connected: int.connected?,
          last_sync_at: int.last_sync_at,
          last_event_at: int.last_event_at,
          error_rate_1h: int.error_rate_1h,
          rate_limit: %{remaining: rl.remaining, limit: rl.limit, resets_at: rl.reset_at},
          oauth_expires_at: int.oauth_expires_at,
          queue_depth: int.queue_depth,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        })
    end
  end

  # GET /health/detailed — Full JSON report (all subsystems)
  # Response: always 200 (informational — use specific endpoints for probes)
  def detailed(conn, _params) do
    json(conn, %{
      daemon: %{
        status: "ok",
        version: Application.spec(:ema, :vsn) |> to_string(),
        uptime_seconds: System.monotonic_time(:second),
        otp_release: System.otp_release()
      },
      system: %{
        memory: :erlang.memory() |> Map.new(),
        process_count: :erlang.system_info(:process_count),
        port_count: :erlang.system_info(:port_count),
        run_queue: :erlang.statistics(:run_queue)
      },
      database: check_database(),
      superman: superman_summary(),
      integrations: Ema.Integrations.all() |> Enum.map(&integration_summary/1),
      agents: %{
        active: Ema.Agents.active_count(),
        bridge_state: Ema.Bridge.circuit_breaker_state(),
        sessions: Ema.Bridge.active_sessions()
      },
      pipes: %{
        active: Ema.Pipes.active_count(),
        queued: Ema.Pipes.queued_count()
      },
      honcho: %{
        active_sessions: Ema.Honcho.active_session_count()
      },
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
    })
  end

  # ── Private helpers ───────────────────────────────────────────

  defp check_database do
    case Ecto.Adapters.SQL.query(Ema.Repo, "SELECT 1", []) do
      {:ok, _} -> %{status: "ok", pool_size: Ema.Repo.config()[:pool_size]}
      {:error, err} -> %{status: "error", error: inspect(err)}
    end
  end

  defp check_vector_store do
    case Ema.Superman.VectorStore.ping() do
      :ok -> %{status: "ok"}
      {:error, err} -> %{status: "error", error: inspect(err)}
    end
  end

  defp check_integrations_connected do
    all = Ema.Integrations.all()
    connected = Enum.count(all, & &1.connected?)
    %{status: if(connected == length(all), do: "ok", else: "degraded"), connected: connected, total: length(all)}
  end

  defp superman_summary do
    %{
      embedding_api: Ema.Superman.Embeddings.health_check() |> elem(0) |> to_string(),
      queue_depth: Ema.Superman.EmbedQueue.depth(),
      project_count: Ema.Superman.Index.all_projects() |> length()
    }
  end

  defp integration_summary(int) do
    %{name: int.name, connected: int.connected?, last_event_at: int.last_event_at, queue_depth: int.queue_depth}
  end
end
```

---

## 8. Log Strategy

### Structured Logging Format

```elixir
# config/config.exs
config :logger, :default_handler,
  config: [
    formatter: {
      LoggerJSON.Formatters.GoogleCloudLogger,  # or BasicLogger for local
      metadata: [:request_id, :integration, :project_id, :agent_type, :pipe_name, :module]
    }
  ]

config :logger,
  level: :info,
  backends: [:console, {LoggerFileBackend, :file_log}]

config :logger, :file_log,
  path: "/var/log/ema/ema.log",
  level: :info,
  format: :json,
  rotate: %{max_bytes: 104_857_600, keep: 10}  # 100MB, keep 10 rotated files
```

### Log Level Policy per Module

| Module | Level | Rationale |
|--------|-------|-----------|
| `Ema.Superman.Embeddings` | `:debug` | Verbose for pipeline debugging; filterable in Loki |
| `Ema.Superman.Graph` | `:info` | Log mutations (add/remove node/edge), not reads |
| `Ema.Superman.Search` | `:info` | Log queries >p95 latency at `:warning` |
| `Ema.Integrations.*` | `:info` | Sync start/complete/error; webhook received |
| `Ema.Integrations.RateLimit` | `:warning` | Only when >70% consumed |
| `Ema.Agent.*` | `:info` | Execution start/end/error |
| `Ema.Bridge` | `:info` | Session lifecycle; `:warning` for circuit breaker transitions |
| `Ema.Pipes.*` | `:info` | Step start/complete; `:debug` for intermediate data |
| `Ema.Honcho` | `:info` | Session create/expire |
| `Ema.System` | `:warning` | Only anomalies (high memory, long queries) |

### Log Aggregation: Promtail → Loki → Grafana

```yaml
# /etc/promtail/config.yml
server:
  http_listen_port: 9080

positions:
  filename: /var/lib/promtail/positions.yaml

clients:
  - url: http://localhost:3100/loki/api/v1/push

scrape_configs:
  - job_name: ema
    static_configs:
      - targets: [localhost]
        labels:
          job: ema
          __path__: /var/log/ema/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            module: module
            integration: integration
            project_id: project_id
      - labels:
          level:
          module:
          integration:
          project_id:
```

### Retention Policy

| Tier | Retention | Storage |
|------|-----------|---------|
| Raw logs (structured JSON files) | 7 days | Local `/var/log/ema/` with logrotate |
| Loki indexed logs | 30 days | Loki local storage |
| Aggregated metrics (Prometheus) | 90 days | Prometheus TSDB |
| Alert history | 1 year | Alertmanager + daily summary notes |

---

## 9. Error Tracking

### Self-Hosted Error Aggregation (Preferred over Sentry)

For a self-hosted system, a lightweight custom error aggregation module avoids external SaaS dependencies:

```elixir
defmodule Ema.ErrorTracker do
  @moduledoc """
  In-process error aggregation with deduplication and sustained-failure alerting.
  Errors are grouped by {module, function, error_type}. Only sustained failures
  (N errors in M seconds) trigger alerts, not individual retries.
  """
  use GenServer

  @sustained_threshold 5          # N errors
  @sustained_window_seconds 300   # within M seconds
  @cleanup_interval_ms 600_000    # Prune old entries every 10 min

  defstruct groups: %{}, alerted: MapSet.new()

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)

  @doc "Record an error. Call from rescue/catch blocks."
  def record(module, function, error_type, metadata \\ %{}) do
    GenServer.cast(__MODULE__, {:record, module, function, error_type, metadata})
  end

  @impl true
  def init(_) do
    schedule_cleanup()
    {:ok, %__MODULE__{}}
  end

  @impl true
  def handle_cast({:record, mod, fun, err_type, meta}, state) do
    key = {mod, fun, err_type}
    now = System.system_time(:second)

    entries = Map.get(state.groups, key, [])
    entries = [now | entries] |> Enum.filter(& &1 > now - @sustained_window_seconds)

    state = %{state | groups: Map.put(state.groups, key, entries)}

    # Check sustained failure threshold
    if length(entries) >= @sustained_threshold and key not in state.alerted do
      emit_sustained_failure_alert(mod, fun, err_type, length(entries), meta)
      state = %{state | alerted: MapSet.put(state.alerted, key)}
      {:noreply, state}
    else
      {:noreply, state}
    end
  end

  @impl true
  def handle_info(:cleanup, state) do
    now = System.system_time(:second)

    groups = state.groups
    |> Enum.map(fn {key, entries} ->
      {key, Enum.filter(entries, & &1 > now - @sustained_window_seconds)}
    end)
    |> Enum.reject(fn {_, entries} -> Enum.empty?(entries) end)
    |> Map.new()

    # Clear alert state for groups that have recovered
    cleared = MapSet.difference(state.alerted, MapSet.new(Map.keys(groups)))
    alerted = MapSet.difference(state.alerted, cleared)

    schedule_cleanup()
    {:noreply, %{state | groups: groups, alerted: alerted}}
  end

  defp emit_sustained_failure_alert(mod, fun, err_type, count, meta) do
    :telemetry.execute(
      [:ema, :error_tracker, :sustained_failure],
      %{count: count, window_seconds: @sustained_window_seconds},
      %{module: mod, function: fun, error_type: err_type, metadata: meta}
    )

    Logger.error(
      "Sustained failure: #{inspect(mod)}.#{fun} — #{err_type} × #{count} in #{@sustained_window_seconds}s",
      module: mod, function: fun, error_type: err_type, count: count
    )
  end

  defp schedule_cleanup, do: Process.send_after(self(), :cleanup, @cleanup_interval_ms)
end
```

### Error Grouping Strategy

| Scenario | Behavior |
|----------|----------|
| Single retry failure | Log at `:debug`, no alert. Retries are normal. |
| 3 consecutive retries, then success | Log success at `:info`. No alert. |
| 5+ failures in 5 minutes (same group) | **Sustained failure** — emit telemetry event + `:error` log. Alert fires. |
| Error storm (50+ in 1 minute) | Rate-limit log output to 1 per 10 seconds per group. Alert once. |
| Recovery after sustained failure | Log at `:info`, clear alert state. Alertmanager auto-resolves. |

### Optional: Sentry Integration (if external tracking desired)

```elixir
# mix.exs
{:sentry, "~> 10.0"},
{:jason, "~> 1.4"},
{:hackney, "~> 1.8"}

# config/runtime.exs
config :sentry,
  dsn: System.get_env("SENTRY_DSN"),
  environment_name: :prod,
  included_environments: [:prod],
  enable_source_code_context: true,
  root_source_code_paths: [File.cwd!()],
  before_send: {Ema.SentryFilter, :filter}

# Filter out transient errors
defmodule Ema.SentryFilter do
  def filter(event) do
    # Don't send retryable errors
    case event.original_exception do
      %Mint.TransportError{} -> false
      %DBConnection.ConnectionError{} -> false
      _ -> event
    end
  end
end
```

---

## 10. Operational Runbooks

### Runbook: Superman Index is 100% Stale

**Alert:** `SupermanIndexFullyStale`  
**Severity:** Critical  
**Impact:** Context injection non-functional. Agent responses lack project-specific knowledge.

**Diagnosis:**

```bash
# 1. Check embedding API health
curl -s localhost:4488/health/superman | jq .

# 2. Check embedding queue
curl -s localhost:4488/health/superman | jq '.queue_depth'

# 3. Check embedding API key / connection
# Look at recent logs for embedding failures
journalctl -u ema --since "1 hour ago" | grep -i embed | tail -50

# 4. Check if it's a single project or all
curl -s localhost:4488/health/superman | jq '.projects[] | {id, coverage, staleness_seconds}'
```

**Recovery:**

```bash
# If embedding API is down (external):
# 1. Check provider status page
# 2. Wait for recovery; queue will drain automatically
# 3. If prolonged (>1h), switch to fallback model:
curl -X POST localhost:4488/api/admin/superman/config \
  -H "Content-Type: application/json" \
  -d '{"embedding_model": "fallback-local"}'

# If queue is stuck (internal):
# 1. Check for crashed embedding worker
curl -s localhost:4488/health/detailed | jq '.system.process_count'

# 2. Restart embedding pipeline (not full daemon)
curl -X POST localhost:4488/api/admin/superman/restart-pipeline

# If index is corrupted:
# 1. Verify vector count vs item count
curl -s localhost:4488/health/superman | jq '.projects[] | {id, item_count, vector_count}'

# 2. If mismatch > 5%, rebuild index for affected project:
curl -X POST localhost:4488/api/admin/superman/reindex \
  -H "Content-Type: application/json" \
  -d '{"project_id": "PROJECT_ID", "force": true}'
```

**Verification:**
- Coverage ratio climbing: `watch -n 10 'curl -s localhost:4488/health/superman | jq ".projects[].coverage"'`
- Queue draining: depth should decrease steadily
- Alert auto-resolves when coverage > 0

---

### Runbook: GitHub Integration Stopped Syncing

**Alert:** `IntegrationSyncBehind` (integration=github)  
**Severity:** Warning → Critical (4h)  
**Impact:** Code changes not reflected in Superman index. Stale project context.

**Diagnosis:**

```bash
# 1. Check integration health
curl -s localhost:4488/health/integrations/github | jq .

# 2. Check OAuth token
curl -s localhost:4488/health/integrations/github | jq '.oauth_expires_at'

# 3. Check rate limits
curl -s localhost:4488/health/integrations/github | jq '.rate_limit'

# 4. Check webhook deliveries (GitHub side)
# Go to repo Settings → Webhooks → Recent Deliveries
# Look for failed deliveries (non-200 responses)

# 5. Check EMA logs for webhook processing errors
journalctl -u ema --since "2 hours ago" | grep -i "github\|webhook" | tail -50

# 6. Check if it's a network issue
curl -s https://api.github.com/rate_limit -H "Authorization: Bearer $(cat /path/to/token)"
```

**Recovery:**

```bash
# If OAuth expired:
curl -X POST localhost:4488/api/admin/integrations/github/refresh-token

# If webhook secret mismatch:
# 1. Regenerate webhook secret in GitHub repo settings
# 2. Update EMA config:
curl -X PUT localhost:4488/api/admin/integrations/github/config \
  -d '{"webhook_secret": "new_secret"}'

# If rate limited:
# Wait for reset. Check: curl -s localhost:4488/health/integrations/github | jq '.rate_limit.resets_at'
# Reduce polling frequency if persistent:
curl -X PUT localhost:4488/api/admin/integrations/github/config \
  -d '{"poll_interval_seconds": 300}'

# If webhook URL unreachable (firewall/DNS):
# 1. Verify EMA is accessible: curl -s https://YOUR_EMA_URL/api/webhooks/github
# 2. Check firewall rules, reverse proxy config
# 3. Re-register webhook if URL changed

# Force manual sync:
curl -X POST localhost:4488/api/admin/integrations/github/sync \
  -d '{"project_id": "PROJECT_ID"}'
```

**Verification:**
- `last_sync_at` updating: `watch -n 30 'curl -s localhost:4488/health/integrations/github | jq .last_sync_at'`
- Event flow resumed: `last_event_at` advancing
- Alert auto-resolves when sync age < 1h

---

### Runbook: Honcho Session Data Corrupted

**Alert:** Manual detection (user reports, inconsistent behavior)  
**Severity:** High  
**Impact:** User modeling broken, session context lost, agents may behave inconsistently.

**Diagnosis:**

```bash
# 1. Check Honcho health
curl -s localhost:4488/health/detailed | jq '.honcho'

# 2. Check for database errors
journalctl -u ema --since "4 hours ago" | grep -i "honcho\|session\|corrupt" | tail -50

# 3. Check session counts (anomalies?)
curl -s localhost:4488/health/detailed | jq '.honcho.active_sessions'

# 4. Check database integrity
# Connect to DB and run:
# SELECT count(*) FROM honcho_sessions WHERE data IS NULL;
# SELECT count(*) FROM honcho_sessions WHERE updated_at < NOW() - INTERVAL '30 days';

# 5. Check for encoding issues
# SELECT id, octet_length(data) FROM honcho_sessions ORDER BY octet_length(data) DESC LIMIT 10;
```

**Recovery:**

```bash
# 1. If specific sessions corrupted:
# Identify affected sessions from logs
# Delete and let them rebuild:
curl -X DELETE localhost:4488/api/admin/honcho/sessions/SESSION_ID

# 2. If widespread corruption — restore from backup:
# a. Stop EMA to prevent further writes
sudo systemctl stop ema

# b. Check available backups
ls -la /var/backups/ema/

# c. Restore Honcho tables only (preserve other data)
pg_restore --data-only --table=honcho_sessions --table=honcho_scopes \
  /var/backups/ema/latest.dump -d ema_prod

# d. Restart EMA
sudo systemctl start ema

# 3. If no backup available:
# Clear all sessions (users will need to re-establish context):
curl -X POST localhost:4488/api/admin/honcho/reset \
  -d '{"confirm": true, "preserve_user_models": true}'
```

**Prevention:**
- Ensure daily DB backups: `pg_dump ema_prod > /var/backups/ema/$(date +%Y%m%d).dump`
- Add Honcho data integrity check to daily cron
- Monitor `ema_honcho_session_total{status="error"}` for early warning

---

### Runbook: Agent Token Budget Exceeded

**Alert:** `DailyTokenSpendHigh`  
**Severity:** Warning  
**Impact:** Cost overrun. May need to pause non-essential agent activity.

**Diagnosis:**

```bash
# 1. Check current spend
curl -s localhost:4488/health/detailed | jq '.agents'

# 2. Get per-agent token breakdown (last 24h)
curl -s 'localhost:4488/api/admin/agents/token-usage?period=24h' | jq .

# 3. Identify the culprit — which agent/project/model consumed the most
curl -s 'localhost:4488/api/admin/agents/token-usage?period=24h&group_by=agent_type,project_id,model' | jq '.[] | select(.cost_cents > 500)'

# 4. Check for runaway agents (stuck in retry loops)
curl -s localhost:4488/health/detailed | jq '.agents.active'
journalctl -u ema --since "6 hours ago" | grep -i "agent.*retry\|agent.*error\|token" | tail -50

# 5. Check Prometheus for the spike
# Query: increase(ema_agent_tokens_cost_cents_total[1h]) — look for step-function jumps
```

**Recovery:**

```bash
# 1. If a specific agent is running away — kill it:
curl -X POST localhost:4488/api/admin/agents/kill \
  -d '{"agent_id": "AGENT_ID"}'

# 2. Set a hard budget cap (prevents future overspend):
curl -X PUT localhost:4488/api/admin/agents/config \
  -d '{"daily_budget_cents": 5000, "per_agent_budget_cents": 1000}'

# 3. If caused by expensive model usage, downgrade:
curl -X PUT localhost:4488/api/admin/agents/config \
  -d '{"default_model": "claude-haiku-4-5", "expensive_model_requires_approval": true}'

# 4. Review what was charged:
# The token usage API returns per-request logs.
# Export for analysis:
curl -s 'localhost:4488/api/admin/agents/token-usage?period=24h&format=csv' > /tmp/token-usage.csv
```

**What Counts as "Charged":**
- Input tokens: prompt + context + system prompt
- Output tokens: model response
- Cost = (input × input_price) + (output × output_price) per model
- Cached tokens are tracked separately (lower cost)
- Bridge sessions: full conversation history sent each turn (cost grows linearly with turns)

**Prevention:**
- Set budget caps before they're needed
- Monitor `ema_agent_tokens_cost_cents_total` daily
- Use cheaper models for routine tasks; expensive models for complex ones
- Limit conversation history length in Bridge sessions (sliding window)

---

## Appendix: Prometheus Scrape Configuration

```yaml
# prometheus/prometheus.yml (relevant job)
scrape_configs:
  - job_name: ema
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: /metrics
    static_configs:
      - targets: ['localhost:4488']
        labels:
          instance: ema-daemon
```

## Appendix: Application Supervision Tree Integration

```elixir
# lib/ema/application.ex
defmodule Ema.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # ... existing children ...
      
      # Telemetry
      Ema.Telemetry,
      Ema.Telemetry.Poller,
      
      # Health monitors
      Ema.Integrations.StalenessDetector,
      Ema.Superman.IndexHealthChecker,
      Ema.ErrorTracker,
      
      # ... Phoenix endpoint last ...
      EmaWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Ema.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

## Appendix: Dependencies

```elixir
# mix.exs
defp deps do
  [
    {:telemetry, "~> 1.2"},
    {:telemetry_metrics, "~> 1.0"},
    {:telemetry_poller, "~> 1.0"},
    {:telemetry_metrics_prometheus_core, "~> 1.1"},
    {:phoenix_live_dashboard, "~> 0.8"},
    {:logger_json, "~> 6.0"},
    {:logger_file_backend, "~> 0.0.13"},
    # Optional: Sentry
    # {:sentry, "~> 10.0"},
  ]
end
```
