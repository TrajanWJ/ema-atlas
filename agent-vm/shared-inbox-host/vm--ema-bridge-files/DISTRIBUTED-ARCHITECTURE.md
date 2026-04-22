# EMA Distributed Architecture Design

**Status:** Research Draft  
**Author:** EMA Researcher Agent  
**Date:** 2026-04-01  
**Scope:** Multi-backend registry, account management, P2P clustering, CRDT sync  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Part A: Elixir Clustering for Desktop Apps](#part-a-elixir-clustering-for-desktop-apps)
4. [Part B: CRDT / Sync Engines](#part-b-crdt--sync-engines)
5. [Part C: Distributed AI Call Routing](#part-c-distributed-ai-call-routing)
6. [Part D: Account Management](#part-d-account-management)
7. [Part E: Elixir Ecosystem — Library Survey](#part-e-elixir-ecosystem--library-survey)
8. [Elixir Module Structure](#elixir-module-structure)
9. [Protocol Definitions](#protocol-definitions)
10. [Risk Analysis](#risk-analysis)
11. [Recommended Implementation Order](#recommended-implementation-order)
12. [Library Reference Card](#library-reference-card)

---

## Executive Summary

EMA is uniquely positioned to exploit Elixir's distributed actor model for something the AI tooling world hasn't done well: **intelligent, self-healing, multi-node AI orchestration built natively on OTP**.

The core thesis:
- **Erlang distribution over Tailscale VPN** is the right transport. No Kubernetes, no external coordination service. Just `epmd` + Tailscale Magic DNS + `libcluster` gossip.
- **Horde + DeltaCrdt** replaces external state stores for process registry and cluster membership. No Redis, no Postgres needed for coordinator state.
- **A provider-agnostic router** modeled on LiteLLM's patterns but implemented as a GenServer pool with token-bucket rate limiting per account.
- **SQLite + delta-CRDT** for local-first sync. Each node owns its data. Sync is eventually consistent. AI content uses last-write-wins for most fields, with explicit merge for structured data.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EMA DISTRIBUTED MESH                               │
│                                                                             │
│  ┌──────────────────┐          Tailscale Mesh         ┌──────────────────┐ │
│  │   LAPTOP NODE    │◄───────────────────────────────►│  WORKSTATION NODE│ │
│  │                  │                                  │                  │ │
│  │ ┌──────────────┐ │          Erlang dist            │ ┌──────────────┐ │ │
│  │ │ EMA Phoenix  │ │  (authenticated, encrypted)     │ │ EMA Phoenix  │ │ │
│  │ │ + LiveView   │ │                                  │ │ + LiveView   │ │ │
│  │ └──────┬───────┘ │                                  │ └──────┬───────┘ │ │
│  │        │         │                                  │        │         │ │
│  │ ┌──────▼───────┐ │                                  │ ┌──────▼───────┐ │ │
│  │ │ AI Router    │ │                                  │ │ AI Router    │ │ │
│  │ │ (GenServer)  │ │                                  │ │ (GenServer)  │ │ │
│  │ └──────┬───────┘ │                                  │ └──────┬───────┘ │ │
│  │        │         │                                  │        │         │ │
│  │ ┌──────▼───────┐ │                                  │ ┌──────▼───────┐ │ │
│  │ │ Provider Pool│ │                                  │ │ Provider Pool│ │ │
│  │ │ Claude (2acc)│ │                                  │ │ Codex CLI    │ │ │
│  │ │ OpenRouter   │ │                                  │ │ Ollama local │ │ │
│  │ │ Ollama local │ │                                  │ │ Claude API   │ │ │
│  │ └──────────────┘ │                                  │ └──────────────┘ │ │
│  │                  │                                  │                  │ │
│  │ ┌──────────────┐ │      DeltaCrdt Sync             │ ┌──────────────┐ │ │
│  │ │  SQLite DB   │◄┼─────────────────────────────────┼►│  SQLite DB   │ │ │
│  │ │  (local)     │ │                                  │ │  (local)     │ │ │
│  │ └──────────────┘ │                                  │ └──────────────┘ │ │
│  └──────────────────┘                                  └──────────────────┘ │
│                              │                                               │
│                    ┌─────────▼─────────┐                                    │
│                    │    VPS NODE       │                                    │
│                    │  (always-on)      │                                    │
│                    │  Claude/OpenRouter│                                    │
│                    │  SQLite replica   │                                    │
│                    └───────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────┐
│              SINGLE NODE INTERNAL ARCHITECTURE           │
│                                                          │
│  Tauri Shell ──► Phoenix LiveView ──► EMA.Router         │
│                                           │              │
│                        ┌──────────────────┼───────────┐ │
│                        │                  │           │ │
│                    Local?            Network?    Distributed? │
│                        │                  │           │ │
│                  EMA.Provider      EMA.Provider  EMA.Cluster │
│                  .Claude           .OpenRouter   .Router     │
│                  .Ollama           .Codex                    │
│                  .MCP              .OpenClaw                 │
│                                                          │
│  EMA.Sync ──► DeltaCrdt ──► Horde.Registry              │
│      └──────► SQLite (Ecto)                              │
└──────────────────────────────────────────────────────────┘
```

---

## Part A: Elixir Clustering for Desktop Apps

### A.1 Why Erlang Distribution Works Here

Erlang's built-in distribution (`disterl`) is a TCP-based full-mesh overlay with:
- Encrypted cookie-based authentication
- Node name resolution (via DNS or explicit IPs)
- Transparent message passing between processes on different nodes
- Built-in `net_kernel` for connection management

For a mesh of 2–10 desktop machines, `disterl` is **ideal**. The typical limits of disterl (60–200 nodes) don't apply here — EMA will never have more than a dozen nodes.

### A.2 Tailscale as Transport Layer

**Problem:** Desktop-to-desktop `epmd` over the public internet requires open firewall ports and NAT traversal.  
**Solution:** Tailscale creates a private WireGuard VPN mesh where all nodes get stable `100.x.y.z` addresses and MagicDNS names (e.g., `laptop.tailnet-name.ts.net`).

```
# Node naming with Tailscale MagicDNS
node_name = :"ema@#{System.get_env("TAILSCALE_HOSTNAME", hostname)}.tailnet-name.ts.net"

# In config.exs
config :libcluster,
  topologies: [
    ema_mesh: [
      strategy: Cluster.Strategy.Gossip,
      config: [
        port: 45892,
        if_addr: "0.0.0.0",
        multicast_addr: "230.1.1.251",
        multicast_ttl: 1,  # LAN only; for WAN use Epmd strategy with Tailscale IPs
        secret: System.get_env("EMA_CLUSTER_SECRET")
      ]
    ]
  ]
```

For WAN (multiple locations), use the Epmd strategy with known Tailscale hostnames:

```elixir
config :libcluster,
  topologies: [
    ema_wan: [
      strategy: Cluster.Strategy.Epmd,
      config: [
        hosts: [
          :"ema@laptop.tailnet-name.ts.net",
          :"ema@workstation.tailnet-name.ts.net",
          :"ema@vps.tailnet-name.ts.net"
        ]
      ]
    ]
  ]
```

**Key points:**
- Tailscale MagicDNS provides stable hostnames even when IPs change
- WireGuard encryption handles all node communication security
- Cookie authentication (`~/.erlang.cookie`) provides a second auth layer
- Tailscale's DERP relay handles NAT traversal automatically

**Source:** [Tailscale Quickstart](https://tailscale.com/docs/how-to/quickstart) — Tailscale assigns stable 100.x.y.z IPs with MagicDNS across all devices regardless of network changes.

### A.3 libcluster — Configuration for Desktop Mesh

**Library:** `{:libcluster, "~> 3.5"}` (20M+ total downloads, actively maintained)

libcluster v3.5.0 supports multiple clustering strategies. For EMA's desktop-to-desktop use case:

**Recommended: Two-tier topology**
1. **LAN gossip** for same-network nodes (laptop + workstation on home network)
2. **Epmd** for cross-network nodes (VPS, work machine via Tailscale)

```elixir
# lib/ema/application.ex
def start(_type, _args) do
  topologies = build_topologies()
  
  children = [
    {Cluster.Supervisor, [topologies, [name: EMA.ClusterSupervisor]]},
    EMA.Horde.Registry,
    EMA.Horde.Supervisor,
    EMA.Sync.Supervisor,
    EMA.Router,
    # ...
  ]
  
  Supervisor.start_link(children, strategy: :one_for_one)
end

defp build_topologies do
  base_nodes = Application.get_env(:ema, :peer_nodes, [])
  
  [
    ema_local: [
      strategy: Cluster.Strategy.Gossip,
      config: [
        port: 45892,
        if_addr: "100.0.0.0/8",  # Tailscale range only
        secret: cluster_secret()
      ]
    ],
    ema_static: [
      strategy: Cluster.Strategy.Epmd,
      config: [hosts: base_nodes]
    ]
  ]
end
```

### A.4 Horde — Distributed Registry and Supervisor

**Library:** `{:horde, "~> 0.10.0"}` (built on DeltaCrdt)

Horde provides:
- `Horde.Registry` — distributed process registry (CRDT-backed, eventually consistent)
- `Horde.DynamicSupervisor` — distributed supervisor that redistributes processes when nodes go down

**Key characteristics (from official docs):**
- Built on `delta_crdt` library — AWLWWMap
- Cluster membership is fully dynamic (nodes join/leave gracefully)
- Uses hash ring to limit race conditions during membership changes
- CAP theorem: AP (available + partition tolerant), not consistent
- Duplicate processes possible during partition; Horde.Registry terminates extras on discovery

**For EMA:** Use Horde.Registry to track which node owns which AI job, and Horde.DynamicSupervisor to restart provider workers on surviving nodes if a laptop sleeps.

```elixir
# lib/ema/horde/registry.ex
defmodule EMA.Horde.Registry do
  use Horde.Registry
  
  def start_link(opts) do
    Horde.Registry.start_link(__MODULE__, [keys: :unique, name: __MODULE__], opts)
  end
  
  def init(init_arg) do
    [members: get_members()]
    |> Keyword.merge(init_arg)
    |> Horde.Registry.init()
  end
  
  defp get_members do
    Node.list() 
    |> Enum.map(&{__MODULE__, &1})
    |> Kernel.++([{__MODULE__, Node.self()}])
  end
end

# Register an AI job
Horde.Registry.register(EMA.Horde.Registry, {:ai_job, job_id}, job_metadata)

# Look up where a job is running
Horde.Registry.lookup(EMA.Horde.Registry, {:ai_job, job_id})
```

### A.5 Connection Resilience for Desktop Nodes

Desktop nodes have unique failure modes:
- **Sleep/wake cycles** — node drops off network, Erlang marks it down
- **VPN reconnect** — IP may change briefly
- **Suspend-to-RAM** — TCP connections drop after ~30s of inactivity

**Strategies:**

```elixir
# 1. Generous net_tick_time — don't mark nodes down too fast
# In vm.args or config:
# -kernel net_ticktime 120  (default 60 seconds)
# This gives laptops 120s before being considered dead

# 2. Monitor node_up/node_down events and reconcile state
defmodule EMA.NodeMonitor do
  use GenServer
  
  def init(_) do
    :net_kernel.monitor_nodes(true, [:nodedown_reason])
    {:ok, %{}}
  end
  
  def handle_info({:nodedown, node, reason}, state) do
    Logger.info("Node #{node} went down: #{inspect(reason)}")
    # Reschedule any jobs that were on that node
    EMA.Router.reschedule_from_node(node)
    {:noreply, state}
  end
  
  def handle_info({:nodeup, node}, state) do
    Logger.info("Node #{node} came up")
    # Rebalance workload
    EMA.Router.rebalance()
    # Sync CRDT state
    EMA.Sync.sync_with_node(node)
    {:noreply, state}
  end
end
```

```elixir
# 3. Horde auto-healing — processes restart on surviving nodes
{Horde.DynamicSupervisor, [
  name: EMA.Horde.Supervisor,
  strategy: :one_for_one,
  distribution_strategy: Horde.UniformDistribution,
  # On partition: both sides continue (don't halt)
]}
```

### A.6 Alternative: Partisan for Advanced Scenarios

**Library:** `lasp-lang/partisan` (Erlang, usable from Elixir)

Partisan bypasses `disterl` entirely and uses custom TCP-based membership. Useful if:
- You want HyParView gossip protocol (partial membership, no full-mesh)
- You need multiple TCP channels per peer to avoid head-of-line blocking
- Scaling to 50+ nodes

**For EMA v1:** Skip Partisan. It's overkill for 2–5 nodes and adds complexity. Revisit if cluster size exceeds 10.

**Source:** [Partisan GitHub](https://github.com/lasp-lang/partisan) — designed for "high-performance, high-scalability" but only needed beyond standard disterl limits.

---

## Part B: CRDT / Sync Engines

### B.1 The Sync Problem for EMA

EMA needs to sync:
- **Projects** (metadata, status, campaigns) — structured, infrequent writes
- **Second Brain notes** — text documents, frequent small edits
- **AI job history** — append-only log, no conflicts
- **Account state** (rate limit counters, cooldown windows) — requires coordination
- **Provider registry** (which backends are available per node) — local state, broadcast to cluster

### B.2 DeltaCrdt — The Right Primitive

**Library:** `{:delta_crdt, "~> 0.6.3"}` (26M+ total downloads, basis of Horde)

Implements delta-state CRDTs based on academic papers:
- [Delta State Replicated Data Types — Almeida et al. 2016](https://arxiv.org/pdf/1603.01529.pdf)
- [Efficient Synchronization of State-based CRDTs — Enes et al. 2018](https://arxiv.org/pdf/1803.02750.pdf)

Uses `MerkleMap` for efficient sync — only delta changes are transmitted, not full state.

**Available CRDT types:**
- `DeltaCrdt.AWLWWMap` — Add-Wins Last-Write-Wins Map (best for most EMA data)
- `DeltaCrdt.AWSet` — Add-Wins Set
- `DeltaCrdt.RWLWWMap` — Remove-Wins variant

```elixir
# Simple usage example from docs:
{:ok, node1_crdt} = DeltaCrdt.start_link(DeltaCrdt.AWLWWMap, name: :projects_crdt)
{:ok, node2_crdt} = DeltaCrdt.start_link(DeltaCrdt.AWLWWMap, name: :projects_crdt)

# Connect them
DeltaCrdt.set_neighbours(node1_crdt, [node2_crdt])

# Write on node1, read on node2 (eventually consistent)
DeltaCrdt.put(node1_crdt, "project:123", %{name: "EMA", status: :active})
DeltaCrdt.read(node2_crdt)  # => %{"project:123" => %{...}}
```

**⚠️ Atom warning from docs:** Any atom contained in a key or value will be replicated to all nodes and never garbage collected. Use string keys and binary/string values.

### B.3 Data Architecture: SQLite + CRDT Overlay

**Recommended approach: Two layers**

```
Layer 1: SQLite (Ecto)     — Persistent, queryable, per-node source of truth
Layer 2: DeltaCrdt         — In-memory sync overlay for live state across nodes
```

```elixir
# Sync writes SQLite locally, then replicates via DeltaCrdt
defmodule EMA.Sync.Project do
  @crdt_name :ema_projects_crdt
  
  def upsert(project) do
    # 1. Write to local SQLite
    {:ok, saved} = EMA.Repo.insert_or_update(changeset(project))
    
    # 2. Replicate to cluster via CRDT
    key = "project:#{saved.id}"
    value = serialize(saved)
    DeltaCrdt.put(@crdt_name, key, value)
    
    {:ok, saved}
  end
  
  def get_all do
    # Read from local SQLite (already synced)
    EMA.Repo.all(EMA.Project)
  end
  
  # When CRDT receives update from remote node:
  def handle_crdt_update({key, value}) do
    case String.split(key, ":") do
      ["project", id] ->
        project = deserialize(value)
        EMA.Repo.insert_or_update(project_changeset(id, project), 
          on_conflict: :replace_all,
          conflict_target: :id)
      _ ->
        :ignore
    end
  end
end
```

### B.4 Conflict Resolution Strategy

**AI-generated content is append-heavy.** EMA's conflict model:

| Data Type | Conflict Strategy | Rationale |
|-----------|------------------|-----------|
| Projects (name, status) | Last-Write-Wins (LWW) | Low contention, clear winner |
| Second Brain notes | LWW on whole doc | Notes edited on one machine at a time typically |
| AI job history | Append-only set | Jobs never modify in place |
| Rate limit counters | Max-wins | Conservative; always use worst case |
| Provider availability | Per-node truth | Each node knows its own providers |
| Account credentials | Per-node secrets | Never synced; stay local |

**Implementing LWW with timestamps:**

```elixir
defmodule EMA.Sync.LWW do
  # AWLWWMap already implements LWW using Hybrid Logical Clocks
  # Wrap values with HLC timestamp for human-readable audit
  
  def put(crdt, key, value) do
    stamped = %{value: value, ts: :erlang.system_time(:millisecond), node: Node.self()}
    DeltaCrdt.put(crdt, key, stamped)
  end
  
  def merge_winner(v1, v2) do
    if v1.ts >= v2.ts, do: v1, else: v2
  end
end
```

**For collaborative notes (future):** Consider `automerge-rs` via NIF or Yjs via NodeJS port. But for EMA v1, LWW on whole-document is sufficient — users rarely edit notes on two machines simultaneously.

### B.5 ElectricSQL — Not Recommended for v1

Electric SQL provides Postgres ↔ SQLite sync via a server-side Postgres instance.

**Why skip it for EMA:**
- Requires a central Postgres server (EMA is peer-to-peer, no central server)
- Adds infrastructure complexity (Electric SQL service)
- Designed for client-server, not peer-to-peer meshes
- Great if EMA ever adds a hosted backend; wrong for pure P2P

**If EMA adds a hosted backend (EMA Cloud):** Electric SQL would be excellent for syncing the cloud Postgres to local SQLite instances.

---

## Part C: Distributed AI Call Routing

### C.1 Provider Abstraction Layer

Every AI backend implements a common behaviour:

```elixir
defmodule EMA.Provider do
  @type model_id :: String.t()
  @type account_id :: String.t()
  @type capability :: :code | :research | :summary | :creative | :embedding
  
  @type provider_info :: %{
    id: atom(),
    name: String.t(),
    node: node(),
    account_id: account_id(),
    models: [model_id()],
    capabilities: [capability()],
    cost_tier: :free | :cheap | :moderate | :expensive,
    rate_limit: EMA.RateLimit.t(),
    latency_p50_ms: integer()
  }
  
  @callback call(request :: map(), opts :: keyword()) :: 
    {:ok, map()} | {:error, :rate_limited} | {:error, term()}
  
  @callback stream(request :: map(), opts :: keyword()) ::
    {:ok, Enumerable.t()} | {:error, term()}
    
  @callback health_check() :: :ok | {:error, term()}
  
  @callback provider_info() :: provider_info()
end
```

### C.2 Provider Implementations

```elixir
# Claude CLI wrapper (existing EMA functionality, formalized)
defmodule EMA.Provider.ClaudeCLI do
  @behaviour EMA.Provider
  
  def call(request, opts) do
    account = Keyword.get(opts, :account, :default)
    env = build_env(account)
    
    args = [
      "--print",
      "--permission-mode", "bypassPermissions",
      request.prompt
    ]
    
    case System.cmd("claude", args, env: env, stderr_to_stdout: false) do
      {output, 0} -> {:ok, %{content: output, model: "claude", provider: :claude_cli}}
      {error, _} -> {:error, {:cli_error, error}}
    end
  end
  
  defp build_env(account) do
    creds = EMA.AccountStore.get(account)
    [
      {"ANTHROPIC_API_KEY", creds.api_key},
      {"CLAUDE_CONFIG_DIR", creds.config_dir}
    ]
  end
end

# Codex CLI wrapper
defmodule EMA.Provider.CodexCLI do
  @behaviour EMA.Provider
  
  def call(request, opts) do
    args = ["--quiet", "--no-color", request.prompt]
    
    case System.cmd("codex", args, stderr_to_stdout: false) do
      {output, 0} -> {:ok, %{content: output, model: "codex", provider: :codex}}
      {error, _} -> {:error, {:cli_error, error}}
    end
  end
end

# OpenRouter API (unified gateway)
defmodule EMA.Provider.OpenRouter do
  @behaviour EMA.Provider
  
  def call(request, opts) do
    model = Keyword.get(opts, :model, "anthropic/claude-3-haiku")
    
    body = %{
      model: model,
      messages: [%{role: "user", content: request.prompt}],
      stream: false
    }
    
    Req.post("https://openrouter.ai/api/v1/chat/completions",
      json: body,
      headers: [{"Authorization", "Bearer #{api_key()}"}]
    )
    |> handle_response()
  end
end

# Ollama (local LLM)
defmodule EMA.Provider.Ollama do
  @behaviour EMA.Provider
  
  def call(request, opts) do
    model = Keyword.get(opts, :model, "llama3")
    
    Req.post("http://localhost:11434/api/generate",
      json: %{model: model, prompt: request.prompt, stream: false}
    )
    |> handle_response()
  end
end

# MCP-compatible generic backend
defmodule EMA.Provider.MCP do
  @behaviour EMA.Provider
  # Uses ex_mcp library for protocol-compliant MCP client
  # ex_mcp v0.9.0 supports: stdio, HTTP/SSE, BEAM transports
end
```

### C.3 The Router — LiteLLM Patterns in Elixir

LiteLLM (Python) taught us the key routing patterns (source: [LiteLLM Router docs](https://docs.litellm.ai/docs/routing)):
1. **Deployment model** — multiple instances of same model across providers
2. **Weighted shuffle** — route based on RPM capacity
3. **Cooldown on failure** — cool down a deployment for N seconds after failure
4. **Priority ordering** — try cheapest first, fall back to more expensive
5. **Pre-call checks** — filter deployments that can't handle the request

Translating to Elixir:

```elixir
defmodule EMA.Router do
  use GenServer
  
  @type routing_strategy :: :cost_optimized | :capability_first | :latency_first | :round_robin
  
  defstruct [
    :providers,          # Map of provider_id => provider_info
    :rate_limiters,      # Map of {provider_id, account_id} => EMA.RateLimit
    :cooldowns,          # Map of provider_id => DateTime (when cooldown expires)
    :metrics,            # Recent latency/cost metrics per provider
    :strategy            # Default routing strategy
  ]
  
  def route(request, opts \\ []) do
    GenServer.call(__MODULE__, {:route, request, opts})
  end
  
  def handle_call({:route, request, opts}, _from, state) do
    strategy = Keyword.get(opts, :strategy, state.strategy)
    
    candidates = 
      state.providers
      |> filter_capable(request)      # Must support required capabilities
      |> filter_cooled_down(state)     # Not in cooldown window
      |> filter_rate_limited(state)   # Has remaining quota
      |> rank_by_strategy(strategy, state)
    
    case candidates do
      [] -> 
        {:reply, {:error, :no_providers_available}, state}
      
      [best | fallbacks] ->
        result = try_provider(best, request, fallbacks)
        state = update_metrics(state, best, result)
        {:reply, result, state}
    end
  end
  
  # Routing strategies
  defp rank_by_strategy(providers, :cost_optimized, _state) do
    Enum.sort_by(providers, &cost_score/1)
  end
  
  defp rank_by_strategy(providers, :capability_first, state) do
    Enum.sort_by(providers, &(-capability_match_score(&1, state)))
  end
  
  defp rank_by_strategy(providers, :latency_first, state) do
    Enum.sort_by(providers, &latency_score(&1, state))
  end
  
  defp try_provider(provider, request, fallbacks) do
    case provider.module.call(request) do
      {:ok, result} -> 
        {:ok, result}
      
      {:error, :rate_limited} ->
        # Immediate cooldown on rate limit
        trigger_cooldown(provider, :rate_limited)
        try_fallbacks(fallbacks, request)
      
      {:error, reason} when length(fallbacks) > 0 ->
        trigger_cooldown(provider, reason)
        try_fallbacks(fallbacks, request)
      
      {:error, reason} ->
        {:error, reason}
    end
  end
end
```

### C.4 Rate Limit Tracking — Token Bucket per Account

```elixir
defmodule EMA.RateLimit do
  @moduledoc """
  Token bucket implementation for per-account rate limit tracking.
  Tracks both RPM (requests per minute) and TPM (tokens per minute).
  """
  
  defstruct [
    :rpm_limit,      # Max requests per minute
    :tpm_limit,      # Max tokens per minute
    :rpm_remaining,  # Current remaining RPM
    :tpm_remaining,  # Current remaining TPM
    :window_start,   # When current window started
    :window_ms       # Window duration (default: 60_000)
  ]
  
  def new(rpm_limit, tpm_limit) do
    %__MODULE__{
      rpm_limit: rpm_limit,
      tpm_limit: tpm_limit,
      rpm_remaining: rpm_limit,
      tpm_remaining: tpm_limit,
      window_start: System.monotonic_time(:millisecond),
      window_ms: 60_000
    }
  end
  
  def check_and_consume(%__MODULE__{} = rl, estimated_tokens \\ 1) do
    now = System.monotonic_time(:millisecond)
    rl = maybe_reset_window(rl, now)
    
    cond do
      rl.rpm_remaining <= 0 ->
        {:error, :rpm_exhausted, ms_until_reset(rl, now)}
      
      rl.tpm_remaining < estimated_tokens ->
        {:error, :tpm_exhausted, ms_until_reset(rl, now)}
      
      true ->
        updated = %{rl | 
          rpm_remaining: rl.rpm_remaining - 1,
          tpm_remaining: rl.tpm_remaining - estimated_tokens
        }
        {:ok, updated}
    end
  end
  
  defp maybe_reset_window(rl, now) do
    if now - rl.window_start >= rl.window_ms do
      %{rl | 
        rpm_remaining: rl.rpm_limit,
        tpm_remaining: rl.tpm_limit,
        window_start: now
      }
    else
      rl
    end
  end
end
```

### C.5 Capability-Based Routing Matrix

```elixir
defmodule EMA.Router.Capability do
  @capability_matrix %{
    # Task type => {preferred_providers, acceptable_providers}
    code:       {[:codex, :claude_cli, :claude_api], [:openrouter_claude, :openrouter_gpt4]},
    research:   {[:claude_api, :openrouter_claude], [:openrouter_perplexity, :claude_cli]},
    summary:    {[:ollama, :openrouter_haiku, :claude_api], [:claude_cli]},
    creative:   {[:claude_api, :openrouter_claude], [:claude_cli, :openrouter_gpt4]},
    embedding:  {[:ollama_nomic, :openrouter_embed], []},
    quick_qa:   {[:ollama, :openrouter_haiku], [:claude_cli]}
  }
  
  def preferred_for(task_type) do
    {preferred, acceptable} = Map.get(@capability_matrix, task_type, {[], []})
    preferred ++ acceptable
  end
  
  # Cost tiers for cost_optimized routing
  @cost_tiers %{
    ollama: 0,          # Free (local compute)
    codex: 1,           # Effectively free (included in Copilot)
    openrouter_haiku: 2,  # ~$0.25/M tokens
    openrouter_sonnet: 5, # ~$3/M tokens
    claude_api: 5,        # ~$3/M tokens  
    openrouter_opus: 9,   # ~$15/M tokens
    claude_cli: 6         # Max subscription cost (amortized)
  }
  
  def cost_score(provider_id), do: Map.get(@cost_tiers, provider_id, 10)
end
```

### C.6 Distributed Routing — Cross-Node Call Delegation

```elixir
defmodule EMA.Router.Distributed do
  @moduledoc """
  Routes AI calls across nodes in the EMA cluster.
  Uses Horde.Registry to find available providers on remote nodes.
  """
  
  def route_globally(request, opts) do
    local_result = EMA.Router.route(request, Keyword.put(opts, :local_only, true))
    
    case local_result do
      {:ok, _} = success -> success
      
      {:error, :no_providers_available} ->
        # Try remote nodes
        route_to_remote_node(request, opts)
      
      {:error, :rate_limited} ->
        route_to_remote_node(request, opts)
    end
  end
  
  defp route_to_remote_node(request, opts) do
    available_remote_providers =
      Node.list()
      |> Enum.flat_map(&get_remote_providers/1)
      |> filter_by_capability(request)
    
    case available_remote_providers do
      [] -> {:error, :cluster_exhausted}
      
      [provider | _] ->
        # RPC to remote node's router
        :rpc.call(provider.node, EMA.Router, :route, [request, opts])
    end
  end
  
  defp get_remote_providers(node) do
    case :rpc.call(node, EMA.Router, :list_available_providers, [], 5000) do
      {:badrpc, _} -> []
      providers -> providers
    end
  end
end
```

---

## Part D: Account Management

### D.1 The cc-switch Pattern

`cc-switch` is the pattern of maintaining multiple Claude configurations (different `~/.config/claude/` directories, different API keys, different Max account sessions) and switching between them.

Analogous to `nvm` (Node Version Manager):
- `nvm use 18` → sets `PATH`, `NVM_BIN`, symlinks
- `cc-switch use personal` → sets `ANTHROPIC_API_KEY`, `CLAUDE_CONFIG_DIR`

**EMA's approach:** Instead of a shell alias pattern, EMA manages accounts programmatically as named profiles in a credential store.

### D.2 Credential Store Design

```elixir
defmodule EMA.AccountStore do
  @moduledoc """
  Per-node credential store. Credentials NEVER sync across nodes.
  Each machine has its own local accounts.
  
  Storage: OS keychain via :erlang_keyring or encrypted ETS + file backup.
  """
  
  defstruct [
    :id,           # :personal, :work, :org_shared
    :name,         # "Personal Claude Max"
    :type,         # :claude_max | :anthropic_api | :openrouter | :openai | :ollama
    :api_key,      # API key (nil for OAuth-based)
    :config_dir,   # For Claude CLI: ~/.config/claude/personal/
    :session_token,# OAuth session token (Claude Max)
    :refresh_token,# OAuth refresh token
    :token_expiry, # DateTime
    :rate_limits,  # %{rpm: 1000, tpm: 100_000}
    :priority,     # Routing priority (lower = preferred)
    :tags          # [:personal, :has_opus, :high_rate_limit]
  ]
  
  # Accounts are loaded at startup from encrypted local file
  # ~/.ema/accounts.enc (encrypted with machine key from OS keychain)
  
  def load_accounts do
    path = Path.join(ema_config_dir(), "accounts.enc")
    
    case File.read(path) do
      {:ok, encrypted} ->
        key = get_machine_key()
        decrypt_and_parse(encrypted, key)
      
      {:error, :enoent} ->
        []
    end
  end
  
  def get(account_id) do
    :persistent_term.get({:ema_account, account_id}, nil)
  end
  
  def list_by_type(type) do
    all_accounts()
    |> Enum.filter(&(&1.type == type))
    |> Enum.sort_by(&(&1.priority))
  end
end
```

### D.3 OAuth Token Rotation

Claude Max accounts use browser-based OAuth sessions, not raw API keys. The session cookie expires periodically.

```elixir
defmodule EMA.Auth.TokenRefresher do
  use GenServer
  
  # Check token expiry every 5 minutes
  @check_interval_ms 5 * 60 * 1000
  # Refresh 10 minutes before expiry
  @refresh_buffer_ms 10 * 60 * 1000
  
  def handle_info(:check_tokens, state) do
    now = DateTime.utc_now()
    
    EMA.AccountStore.list_all()
    |> Enum.filter(fn account ->
      account.token_expiry != nil and
      DateTime.diff(account.token_expiry, now, :millisecond) < @refresh_buffer_ms
    end)
    |> Enum.each(&refresh_token/1)
    
    schedule_check()
    {:noreply, state}
  end
  
  defp refresh_token(%{type: :anthropic_api} = account) do
    # API keys don't expire; skip
    :ok
  end
  
  defp refresh_token(%{type: :claude_max} = account) do
    # OAuth refresh flow
    # Note: Claude Max sessions are complex (browser-managed)
    # Practical approach: use claude CLI's own auth mechanism
    # and treat config_dir as the auth unit
    case System.cmd("claude", ["--print", "whoami"], 
                    env: [{"CLAUDE_CONFIG_DIR", account.config_dir}]) do
      {_, 0} -> :ok  # Session still valid
      {_, _} -> notify_session_expired(account)
    end
  end
  
  defp notify_session_expired(account) do
    # Surface to user via Phoenix.PubSub → LiveView notification
    Phoenix.PubSub.broadcast(EMA.PubSub, "auth_events", 
      {:session_expired, account.id})
  end
end
```

### D.4 Rate Limit Pooling Across Accounts

When one Claude Max account hits its rate limit, automatically try the next:

```elixir
defmodule EMA.Router.AccountRotation do
  @doc """
  Try accounts in priority order until one succeeds.
  Track exhaustion to avoid hammering rate-limited accounts.
  """
  
  def call_with_rotation(provider_type, request, opts) do
    accounts = 
      EMA.AccountStore.list_by_type(provider_type)
      |> Enum.reject(&account_cooled_down?/1)
    
    do_call_with_rotation(accounts, request, opts)
  end
  
  defp do_call_with_rotation([], _request, _opts) do
    {:error, :all_accounts_rate_limited}
  end
  
  defp do_call_with_rotation([account | rest], request, opts) do
    case EMA.Provider.ClaudeCLI.call(request, Keyword.put(opts, :account, account.id)) do
      {:ok, result} -> 
        {:ok, result}
      
      {:error, :rate_limited} ->
        # Cool down this account for 60 seconds
        set_cooldown(account.id, 60_000)
        do_call_with_rotation(rest, request, opts)
      
      {:error, reason} ->
        {:error, reason}
    end
  end
end
```

### D.5 Shared Org Credentials (Future)

For team use: org-level accounts (API keys, OpenRouter keys) can be stored in the CRDT layer:

```elixir
# Org credentials sync across nodes (API keys only, not OAuth sessions)
# Encrypted with a shared org key derived from master password
defmodule EMA.AccountStore.Shared do
  def sync_org_accounts(org_crdt) do
    org_accounts = DeltaCrdt.read(org_crdt)
    
    Enum.each(org_accounts, fn {key, encrypted_account} ->
      account = decrypt_org_account(encrypted_account)
      EMA.AccountStore.register(account)
    end)
  end
end
```

---

## Part E: Elixir Ecosystem — Library Survey

### E.1 AI/LLM Libraries

| Library | Version | Downloads | Notes |
|---------|---------|-----------|-------|
| `langchain` | 0.6.3 | 70K/month | Multi-provider (Claude, OpenAI, Gemini, Ollama, xAI Grok, Perplexity, Bumblebee). Well-maintained. Best multi-model support. |
| `jido_ai` | 2.1.0 | 5K/month | Agent-centric. 8 reasoning strategies (ReAct, CoT, ToT, etc.). Built on `req_llm`. Excellent for agentic workflows. |
| `req_llm` | latest | 63K/month | Low-level provider abstraction for Anthropic/OpenAI/Google/etc. Used by `jido_ai`. |
| `ex_mcp` | 0.9.0 | 434/month | MCP client/server (stdio, HTTP/SSE, BEAM). Supports ACP for Claude Code/Codex. **Key for EMA's MCP backend support.** |
| `llm_models` | — | 63K/month | Model metadata catalog with capability lookups. Useful for EMA's routing logic. |

**Recommendation for EMA:**
- Use `langchain ~> 0.6.0` as the **unified model interface** for all API-based providers (Claude API, OpenAI, Ollama, etc.)
- Use `ex_mcp ~> 0.9.0` for the **MCP/ACP backend** integration (Claude Code CLI, Codex CLI via ACP protocol)
- `jido_ai ~> 2.0` is interesting for advanced agent patterns but adds significant complexity — Phase 2+

**Source:** [LangChain.ex Hexdocs](https://hexdocs.pm/langchain/readme.html) — supports Claude (including thinking), xAI Grok, Gemini, Ollama, Perplexity, and OpenAI-compatible endpoints.

### E.2 Clustering Libraries

| Library | Version | Downloads | Notes |
|---------|---------|-----------|-------|
| `libcluster` | 3.5.0 | 980K/month | De-facto standard. Gossip, Epmd, DNS, K8s strategies. ✅ Use this. |
| `horde` | 0.10.0 | 3K/month | Distributed registry + supervisor via DeltaCrdt. ✅ Use this. |
| `delta_crdt` | 0.6.3 | 115K/month | Foundation for Horde. Use directly for app state sync. ✅ Use this. |
| `dns_cluster` | — | 773K/month | Simple DNS-based clustering for k8s. Not needed for desktop. |

### E.3 CRDT Libraries

| Library | Version | Notes |
|---------|---------|-------|
| `delta_crdt` | 0.6.3 | ✅ Best option. AWLWWMap, AWSet. Active, powers Horde. |
| `crdt` (Erlang) | — | Simple reference implementations. Lower downloads. |
| `mraft` | — | Raft consensus for Erlang. Heavier weight; use if strong consistency needed. |

**Source:** [DeltaCrdt GitHub](https://github.com/derekkraan/delta_crdt_ex) — implements AWLWWMap via delta-state CRDTs, uses MerkleMap for efficient sync.

### E.4 OpenRouter API Design Patterns

OpenRouter exposes an OpenAI-compatible API with **provider routing extensions**:
- `X-Title` header for app attribution
- `provider.order` to specify which providers to try
- `provider.allow_fallbacks: false` to disable automatic fallback
- Model naming: `anthropic/claude-3-haiku`, `openai/gpt-4o`, etc.

EMA can use OpenRouter as a **cloud fallback** when all local providers are rate-limited:

```elixir
defmodule EMA.Provider.OpenRouter do
  @base_url "https://openrouter.ai/api/v1"
  
  def call(request, opts) do
    model = Keyword.get(opts, :model, cheapest_available())
    
    Req.post("#{@base_url}/chat/completions",
      json: %{
        model: model,
        messages: [%{role: "user", content: request.prompt}],
        provider: %{
          order: ["Anthropic", "OpenAI"],  # Provider preference
          allow_fallbacks: true
        }
      },
      headers: [
        {"Authorization", "Bearer #{api_key()}"},
        {"X-Title", "EMA - Personal AI Executive"}
      ]
    )
  end
end
```

---

## Elixir Module Structure

```
lib/ema/
├── application.ex              # OTP Application, supervision tree
├── cluster/
│   ├── supervisor.ex           # Cluster.Supervisor + libcluster topologies
│   ├── node_monitor.ex         # nodeup/nodedown event handler
│   └── topology.ex             # Dynamic topology configuration
│
├── horde/
│   ├── registry.ex             # Horde.Registry (distributed process names)
│   └── supervisor.ex           # Horde.DynamicSupervisor (distributed processes)
│
├── sync/
│   ├── supervisor.ex           # Sync subsystem supervisor
│   ├── crdt_manager.ex         # DeltaCrdt instances lifecycle
│   ├── project_sync.ex         # Project CRDT ↔ SQLite bridge
│   ├── note_sync.ex            # Second Brain note sync
│   └── provider_registry.ex   # Which providers available on each node (CRDT)
│
├── router/
│   ├── router.ex               # Main GenServer: route(request, opts)
│   ├── capability.ex           # Capability matrix, cost tiers
│   ├── rate_limit.ex           # Token bucket per account
│   ├── account_rotation.ex     # Multi-account fallback logic
│   ├── distributed.ex          # Cross-node routing via RPC
│   └── metrics.ex              # Latency/cost telemetry
│
├── provider/
│   ├── behaviour.ex            # EMA.Provider behaviour definition
│   ├── claude_cli.ex           # Claude Code CLI subprocess
│   ├── codex_cli.ex            # Codex CLI subprocess
│   ├── claude_api.ex           # Anthropic API (via LangChain.ex)
│   ├── openrouter.ex           # OpenRouter.ai gateway
│   ├── ollama.ex               # Local Ollama instance
│   ├── openai.ex               # OpenAI API
│   ├── mcp.ex                  # Generic MCP-compatible backend (ex_mcp)
│   └── openclaw.ex             # OpenClaw gateway integration
│
├── accounts/
│   ├── account_store.ex        # Local credential store
│   ├── token_refresher.ex      # OAuth token rotation
│   └── shared_accounts.ex      # Org-level shared credentials via CRDT
│
└── web/
    ├── live/
    │   ├── cluster_dashboard_live.ex  # Node mesh visualization
    │   ├── provider_status_live.ex    # Provider health/rate limits
    │   └── account_manager_live.ex   # Add/edit accounts
    └── components/
        └── provider_badge.ex         # Provider status indicators
```

---

## Protocol Definitions

### P1: Node Discovery and Handshake

When a new node joins the cluster (via `nodeup` event):

```elixir
# Message type: :ema_node_handshake
%{
  type: :ema_node_handshake,
  node: node(),
  version: "1.0.0",
  capabilities: [:routing, :sync, :providers],
  providers: [
    %{
      id: :claude_cli,
      type: :claude_cli,
      accounts: [:personal, :work],  # Account IDs only (no credentials)
      capabilities: [:code, :research, :creative],
      rate_limit: %{rpm: 50, tpm: 100_000},
      cost_tier: :moderate,
      available: true
    }
  ],
  crdt_clocks: %{
    projects: "...",  # Current vector clock
    notes: "..."
  }
}
```

### P2: AI Job Delegation

When routing a job to a remote node:

```elixir
# Sent via :rpc.call/4
# Module: EMA.Router
# Function: :execute_job
# Args: [job]

%{
  job_id: "job_#{:crypto.strong_rand_bytes(8) |> Base.encode16()}",
  type: :ai_call,
  request: %{
    prompt: "...",
    context: "...",
    max_tokens: 4096
  },
  routing: %{
    preferred_provider: :codex_cli,  # Requested provider
    required_capability: :code,
    max_cost_tier: :moderate,
    timeout_ms: 30_000
  },
  origin_node: node(),
  submitted_at: DateTime.utc_now()
}
```

Job response:

```elixir
%{
  job_id: "job_...",
  status: :completed,  # :completed | :failed | :timeout
  result: %{
    content: "...",
    model: "claude-3-5-sonnet",
    provider: :claude_cli,
    account: :personal,
    tokens_used: %{input: 150, output: 512},
    latency_ms: 3420
  },
  executed_on: node(),
  completed_at: DateTime.utc_now()
}
```

### P3: Provider Registry Sync

Broadcast to cluster when provider availability changes:

```elixir
# Via DeltaCrdt (provider_registry CRDT)
# Key: "provider:#{node_name}:#{provider_id}"
# Value:
%{
  node: node(),
  provider_id: :ollama,
  available: true,
  last_seen: System.system_time(:second),
  health: :healthy,  # :healthy | :degraded | :unavailable
  rate_limit_state: %{
    rpm_remaining: 47,
    tpm_remaining: 80_000,
    window_resets_at: 1711930860
  }
}
```

### P4: Rate Limit Notification

When a node detects rate limiting, it broadcasts to prevent peers from routing there:

```elixir
# Via Phoenix.PubSub (cluster-wide topic)
# Topic: "provider_events"
%{
  type: :rate_limit_hit,
  node: node(),
  provider_id: :claude_api,
  account_id: :personal,
  retry_after_ms: 60_000,
  timestamp: System.system_time(:millisecond)
}
```

### P5: CRDT State Reconciliation

After a node reconnects (woke from sleep):

```elixir
# Automatically handled by DeltaCrdt's MerkleMap-based sync
# Manual sync trigger:
DeltaCrdt.set_neighbours(local_crdt, remote_crdts)
# DeltaCrdt will exchange deltas automatically using the Merkle comparison
# No additional protocol needed — this is built into delta_crdt
```

---

## Risk Analysis

### R1: Erlang Distribution Security Over Internet

**Risk:** Erlang's cookie-based auth is a single shared secret. If compromised, full remote code execution.  
**Severity:** 🔴 Critical  
**Mitigation:**
- Erlang distribution only binds to Tailscale interface (`100.x.y.z`), never public interfaces
- WireGuard encryption (Tailscale) protects all traffic in transit
- Rotate cookie periodically via deployment config
- Consider `inet_dist_listen_options` to restrict to Tailscale IPs only

```elixir
# vm.args — restrict Erlang distribution to Tailscale interface
-kernel inet_dist_listen_min 9100
-kernel inet_dist_listen_max 9200
# Bind epmd to Tailscale interface only (configure in OS)
```

### R2: Horde Eventual Consistency — Duplicate Processes

**Risk:** During network partition, two nodes might both start the same AI job worker.  
**Severity:** 🟡 Medium  
**Mitigation:**
- Horde.Registry terminates duplicates when partition heals (verified behavior per docs)
- Use idempotent job IDs — same job run twice produces same output
- For critical non-idempotent work, use `Horde.UniformQuorumDistribution` (halts if quorum lost)

### R3: Desktop Node Sleep/Wake Race Conditions

**Risk:** Node goes to sleep during an active AI call. Job is lost. User gets no response.  
**Severity:** 🟡 Medium  
**Mitigation:**
- Implement job acknowledgment with timeout + retry
- Store in-flight jobs in SQLite before dispatching
- Use `net_ticktime 120` to give 2 minutes before marking node down
- On sleep detection (OS event), flush in-flight jobs and broadcast `:going_offline` before suspend

### R4: DeltaCrdt Atom Leakage

**Risk:** AWLWWMap stores atom keys/values in BEAM's global atom table. Never garbage collected.  
**Severity:** 🟡 Medium  
**Mitigation:**
- **Never use atoms as CRDT keys or values** — always strings/binaries
- Serialize all CRDT values as JSON before storing
- Document this constraint in code comments

### R5: Credential Exposure

**Risk:** Account credentials (API keys, OAuth tokens) accidentally synced via CRDT.  
**Severity:** 🔴 Critical  
**Mitigation:**
- Credentials stored in per-node encrypted file only (never DeltaCrdt)
- Use OS keychain (via `erlang_keyring`) for master encryption key
- Code review: CRDT stores account IDs and rate limit metadata only, never secrets
- Integration test that asserts no credential fields appear in CRDT state

### R6: LangChain.ex Dependency Drift

**Risk:** LangChain.ex is actively developed (0.6.3). Breaking changes could affect all providers.  
**Severity:** 🟢 Low  
**Mitigation:**
- EMA.Provider behaviour abstracts LangChain.ex behind a stable interface
- Pin to minor version: `{:langchain, "~> 0.6"}`
- EMA can swap LangChain for direct HTTP calls if needed

### R7: Ollama + Codex CLI Latency

**Risk:** Ollama/Codex CLI are subprocess-based and slow (3–30s per call). Blocks router thread.  
**Severity:** 🟡 Medium  
**Mitigation:**
- Implement all provider calls with `Task.async/await` + configurable timeout
- Use `Task.Supervisor` for subprocess providers to prevent process leaks
- Track latency per provider in router metrics; use for cost_optimized routing

### R8: Tailscale as Single Point of Failure

**Risk:** If Tailscale goes down, nodes can't find each other. EMA cluster splits.  
**Severity:** 🟡 Medium  
**Mitigation:**
- Each node functions fully standalone when cluster is unavailable
- Local providers (Ollama, Claude CLI with local keys) work independently
- LAN gossip works without Tailscale for same-network nodes
- Store last-known peer IPs in config for static fallback

### R9: Rate Limit State Desync

**Risk:** Two nodes independently consume from same rate-limited account. Both think they have capacity.  
**Severity:** 🟡 Medium  
**Mitigation:**
- Route all calls for a given account through one designated node (consistent hashing)
- If primary node is down, any node can take over but starts conservatively (assume 50% consumed)
- Broadcast rate limit hits via PubSub for fast propagation
- Each account has a "home node" registered in Horde.Registry

---

## Recommended Implementation Order

### Phase 0: Foundations (Week 1–2)
**Goal:** EMA works standalone with multiple local providers

1. **Provider Behaviour + ClaudeCLI** (existing, just formalize)
2. **OllamaProvider** (HTTP to localhost:11434) 
3. **OpenRouterProvider** (HTTP, unified API key)
4. **EMA.RateLimit** (token bucket, in-memory)
5. **EMA.Router** (GenServer, single-node, cost/capability routing)
6. **EMA.AccountStore** (local encrypted file, multiple accounts)

**Milestone:** Route a prompt to cheapest available local provider. Account rotation on rate limit.

---

### Phase 1: Multi-Account + Advanced Routing (Week 3–4)
**Goal:** cc-switch equivalent works in EMA

1. **EMA.AccountStore** — UI for adding/editing accounts
2. **EMA.Auth.TokenRefresher** — Detect expired sessions
3. **EMA.Router.AccountRotation** — Try accounts in priority order
4. **CodexCLI + OpenAI providers**
5. **EMA.Router.Capability** — full capability matrix
6. **LiveView: Provider Status Dashboard**

**Milestone:** 3+ Claude accounts, automatic failover. Cost-optimized routing working.

---

### Phase 2: Clustering (Week 5–6)
**Goal:** Two EMA instances form a cluster and share provider capacity

1. **`libcluster` + Tailscale setup**
2. **`horde` registry + supervisor**
3. **`EMA.NodeMonitor`** — nodeup/nodedown handling
4. **`EMA.Router.Distributed`** — cross-node routing via RPC
5. **Provider Registry CRDT** — broadcast available providers
6. **Job Delegation Protocol** — P2 protocol above

**Milestone:** Laptop EMA routes to workstation's Codex when Claude rate-limited.

---

### Phase 3: CRDT Sync (Week 7–8)
**Goal:** Projects and notes sync across nodes

1. **`delta_crdt` setup** — start CRDTs in application supervisor
2. **`EMA.Sync.Project`** — CRDT ↔ SQLite bridge for projects
3. **`EMA.Sync.Note`** — Second Brain sync
4. **Conflict resolution** — LWW timestamps
5. **Reconnect sync** — Handle laptop waking up and syncing deltas
6. **LiveView: Sync Status indicator**

**Milestone:** Create project on laptop, appears on workstation within seconds.

---

### Phase 4: Polish + Production (Week 9–12)
**Goal:** Production-ready distributed operation

1. **MCP backend support** (via `ex_mcp`)
2. **OpenClaw gateway integration**
3. **Metrics & observability** (Telemetry + LiveDashboard)
4. **Cluster dashboard** — visual mesh topology
5. **Security hardening** (Tailscale-only bind, cookie rotation)
6. **Connection resilience testing** (simulate sleeps, partitions)

---

## Library Reference Card

### Core Dependencies

```elixir
# mix.exs
def deps do
  [
    # Clustering
    {:libcluster, "~> 3.5"},          # Node discovery and clustering
    {:horde, "~> 0.10"},              # Distributed registry + supervisor
    {:delta_crdt, "~> 0.6.3"},        # CRDT primitives (also pulled by horde)
    
    # AI/LLM
    {:langchain, "~> 0.6"},           # Multi-provider LLM client
    {:ex_mcp, "~> 0.9"},              # MCP/ACP protocol (Claude Code, Codex CLI)
    {:req, "~> 0.5"},                  # HTTP client (for OpenRouter, Ollama)
    
    # Database
    {:ecto_sqlite3, "~> 0.15"},       # SQLite via Ecto
    {:ecto, "~> 3.12"},
    
    # Phoenix (existing)
    {:phoenix, "~> 1.7"},
    {:phoenix_live_view, "~> 1.0"},
    {:phoenix_pubsub, "~> 2.1"},
    
    # Utilities
    {:jason, "~> 1.4"},               # JSON serialization
    {:telemetry, "~> 1.2"},           # Metrics
    {:telemetry_metrics, "~> 1.0"},
  ]
end
```

### Key Version Notes

| Package | Version | Why Pinned |
|---------|---------|------------|
| `libcluster` | `~> 3.5` | Stable for years; no breaking changes expected |
| `horde` | `~> 0.10` | Not at 1.0 yet; minor version pin for stability |
| `delta_crdt` | `~> 0.6.3` | Pin exact minor; CRDT semantics are stable |
| `langchain` | `~> 0.6` | Active development; minor version allows bug fixes |
| `ex_mcp` | `~> 0.9` | Pre-1.0; monitor for breaking changes |

---

## Appendix: Partisan Evaluation

Partisan is an alternative distribution layer that bypasses standard `disterl`. Supports:
- HyParView gossip (partial membership, scales to thousands of nodes)
- Multiple TCP channels per peer (avoid head-of-line blocking)
- Pluggable overlays

**For EMA:** Not needed. Standard `disterl` with `net_ticktime 120` handles 2–10 desktop nodes perfectly. Partisan's advantages emerge at 50+ nodes or when you need partial membership (gossip to subset of cluster).

**Revisit when:** EMA grows to a team product with 10+ nodes per user, or when you need custom topology (e.g., star topology where laptops only communicate via VPS).

**Source:** [Partisan GitHub](https://github.com/lasp-lang/partisan) — designed for "high-performance, high-scalability" at 60–200+ nodes. Overhead not justified for EMA's scale.

---

## Appendix: LiteLLM Routing Patterns Summary

LiteLLM's routing patterns are the best-in-class reference for multi-LLM orchestration (Python, but architecture is applicable):

1. **Deployment model** — Group multiple provider instances under a single alias
2. **Weighted shuffle** (default) — Pick based on RPM weight
3. **Latency-based routing** — Track P95 latency, route to fastest
4. **Cooldowns** — Auto-cooldown on 429/rate-limit (5s default), auto-recovery
5. **Priority ordering** (`order: 1,2,3`) — Try cheapest first, escalate
6. **Pre-call checks** — Filter by context window, region requirements
7. **Max parallel requests** — Semaphore per deployment
8. **Fallback chains** — Primary → fallback → emergency fallback

EMA's `EMA.Router` implements all these patterns natively in GenServer + token buckets.

**Source:** [LiteLLM Router documentation](https://docs.litellm.ai/docs/routing)

---

## Appendix: Electric SQL Future Integration

If EMA ever adds a hosted backend (EMA Cloud):

```
[EMA App Nodes] ←── Electric SQL Sync ──→ [EMA Cloud Postgres]
     │                                              │
  Local SQLite                              Central Postgres
  (per device)                           (canonical state, billing)
```

Electric SQL's shape-based sync would allow:
- Selective sync (only sync projects user has access to)
- Server-side filtering (don't sync other users' data)
- Offline-first with automatic reconnect sync

For now: pure P2P with DeltaCrdt is simpler and sufficient.

---

*End of document. Research sources: Hex.pm packages, HexDocs, LiteLLM documentation, Partisan GitHub, Tailscale documentation, DeltaCrdt GitHub, LangChain.ex documentation, Horde documentation, ElectricSQL documentation.*
