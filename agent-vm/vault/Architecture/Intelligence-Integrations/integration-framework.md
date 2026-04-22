---
title: "EMA Integration Framework — Unified Abstraction Layer"
type: architecture
created: 2026-04-10
confidence: high
source: internal design specification
tags: [ema, elixir, integrations, architecture, provider-pattern, event-pipeline]
summary: "Design spec for EMA's unified integration abstraction layer covering 7 provider types via shared behaviour, credential vault, event pipeline, sync engine, and circuit breaker patterns."
related:
  - "[[github-integration]]"
  - "[[discord-slack-integration]]"
  - "[[monitoring-observability]]"
  - "[[superman-architecture]]"
  - "[[MCP-GATEWAY-ARCH]]"
  - "[[BRIDGE-ASYNC-PATTERN]]"
---

# EMA Integration Framework — Unified Abstraction Layer

> Version: 1.0 · Status: Design Specification
> Covers all 7 integration types through a single provider behaviour, shared credential vault, event pipeline, and sync engine.

---

## Table of Contents

1. [Provider Interface (Behaviour)](#1-provider-interface)
2. [Integration Registry](#2-integration-registry)
3. [Event Pipeline](#3-event-pipeline)
4. [Credential Management](#4-credential-management)
5. [Sync Engine](#5-sync-engine)
6. [Error Handling & Circuit Breaker](#6-error-handling--circuit-breaker)
7. [Wiring into Core Loop](#7-wiring-into-core-loop)
8. [Integration Manager UI Spec](#8-integration-manager-ui-spec)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Provider Interface

Every integration implements the `Ema.Integrations.Provider` behaviour. This is the single contract that makes all 7 integrations interchangeable at the framework level.

### 1.1 Complete Behaviour Definition

```elixir
defmodule Ema.Integrations.Provider do
  @moduledoc """
  Behaviour that every integration provider must implement.
  Required callbacks form the minimum viable integration.
  Optional callbacks enable richer features (sync, webhooks, write-back).
  """

  # ── Types ──────────────────────────────────────────────────
  @type state :: term()
  @type credentials :: map()
  @type reason :: term()
  @type event :: Ema.Integrations.Event.t()
  @type resource_ref :: %{type: atom(), external_id: String.t(), meta: map()}
  @type sync_cursor :: %{since: DateTime.t(), cursor: String.t() | nil}
  @type health :: :healthy | :degraded | :unhealthy

  # ── Required Callbacks ─────────────────────────────────────

  @doc "Unique atom identifier, e.g. :github, :google_drive, :discord"
  @callback provider_id() :: atom()

  @doc "Human-readable name for UI display"
  @callback display_name() :: String.t()

  @doc "Auth type this provider uses"
  @callback auth_type() :: :oauth2 | :api_key | :ssh_key | :bot_token

  @doc "Establish connection with decrypted credentials. Returns opaque state."
  @callback connect(credentials()) :: {:ok, state()} | {:error, reason()}

  @doc "Gracefully tear down connection."
  @callback disconnect(state()) :: :ok

  @doc "Check if the connection is alive and functional."
  @callback health_check(state()) :: {:ok, health()} | {:error, reason()}

  @doc "Return rate-limit info: {requests_remaining, reset_at_unix, window_ms}"
  @callback rate_limit_status(state()) :: {:ok, {non_neg_integer(), integer(), pos_integer()}} | :unknown

  # ── Optional Callbacks (with defaults) ─────────────────────

  @doc "List resources visible through this integration (repos, folders, channels, etc.)"
  @callback list_resources(state(), opts :: keyword()) :: {:ok, [resource_ref()]} | {:error, reason()}

  @doc "Fetch incremental changes since cursor. Returns {events, new_cursor}."
  @callback fetch_changes(state(), sync_cursor()) :: {:ok, {[event()], sync_cursor()}} | {:error, reason()}

  @doc "Write back to the external system (post message, create issue, etc.)"
  @callback execute_action(state(), action :: atom(), params :: map()) :: {:ok, map()} | {:error, reason()}

  @doc "Handle an inbound webhook payload. Return normalized events."
  @callback handle_webhook(state(), headers :: map(), body :: binary()) :: {:ok, [event()]} | {:error, reason()}

  @doc "Return OAuth2 config for providers that use OAuth."
  @callback oauth_config() :: map() | nil

  @doc "Capabilities this provider supports."
  @callback capabilities() :: [atom()]
  # Possible: [:read, :write, :webhook, :sync, :realtime, :file_export, :file_import]

  @optional_callbacks [
    list_resources: 2,
    fetch_changes: 2,
    execute_action: 3,
    handle_webhook: 3,
    oauth_config: 0,
    capabilities: 0
  ]

  # ── Default Implementations ────────────────────────────────
  defmacro __using__(_opts) do
    quote do
      @behaviour Ema.Integrations.Provider

      def list_resources(_state, _opts), do: {:error, :not_supported}
      def fetch_changes(_state, _cursor), do: {:error, :not_supported}
      def execute_action(_state, _action, _params), do: {:error, :not_supported}
      def handle_webhook(_state, _headers, _body), do: {:error, :not_supported}
      def oauth_config, do: nil
      def capabilities, do: [:read]

      defoverridable [
        list_resources: 2,
        fetch_changes: 2,
        execute_action: 3,
        handle_webhook: 3,
        oauth_config: 0,
        capabilities: 0
      ]
    end
  end
end
```

### 1.2 Provider Implementations (Module Map)

| Provider | Module | Auth | Capabilities |
|---|---|---|---|
| GitHub | `Ema.Integrations.Providers.GitHub` | `:oauth2` | `[:read, :write, :webhook, :sync]` |
| Google Drive | `Ema.Integrations.Providers.GoogleDrive` | `:oauth2` | `[:read, :write, :sync, :file_export, :file_import]` |
| Discord | `Ema.Integrations.Providers.Discord` | `:bot_token` | `[:read, :write, :realtime, :webhook]` |
| Slack | `Ema.Integrations.Providers.Slack` | `:bot_token` | `[:read, :write, :realtime, :webhook]` |
| API Providers | `Ema.Integrations.Providers.ApiProvider` | `:api_key` | `[:read, :write]` |
| VPS Monitoring | `Ema.Integrations.Providers.VpsMonitor` | `:ssh_key` | `[:read, :sync]` |
| Project Meta | `Ema.Integrations.Providers.ProjectMeta` | `:api_key` | `[:read, :write, :sync]` |

### 1.3 Connection Strategy

**Single GenServer per integration instance.** No connection pooling — each integration instance (e.g., "Trajan's GitHub" or "Project X's Discord") gets its own `Ema.Integrations.Worker` GenServer that holds the provider state, manages the connection lifecycle, and serializes operations.

```elixir
defmodule Ema.Integrations.Worker do
  use GenServer

  defstruct [
    :instance_id,    # UUID
    :provider_mod,   # e.g. Ema.Integrations.Providers.GitHub
    :provider_state, # opaque state from provider.connect/1
    :status,         # :connecting | :connected | :disconnected | :error
    :circuit,        # circuit breaker state
    :last_health,    # last health_check result + timestamp
    :workspace_id    # which workspace this belongs to (nil = global)
  ]

  # ... lifecycle callbacks below
end
```

**Why not pooling?** EMA is a desktop app — one user, a handful of integrations. Pooling adds complexity with no benefit. If VPS monitoring needs concurrent SSH sessions, the VpsMonitor provider manages that internally.

---

## 2. Integration Registry

### 2.1 Registry Architecture

The registry is an **ETS table** backed by a **GenServer** for persistence and startup orchestration. ETS gives lock-free reads (any process can look up an integration); the GenServer handles writes and startup sequencing.

```elixir
defmodule Ema.Integrations.Registry do
  use GenServer

  @table :ema_integrations_registry

  # ── Public API ──────────────────────────────────────────────

  @doc "Register a provider module (done at compile time or app start)."
  def register_provider(provider_mod) when is_atom(provider_mod)

  @doc "List all registered provider modules."
  def list_providers() :: [module()]

  @doc "Start an integration instance for a workspace."
  def start_instance(provider_id, workspace_id, credentials) :: {:ok, instance_id} | {:error, reason}

  @doc "Stop and remove an instance."
  def stop_instance(instance_id) :: :ok

  @doc "Get the Worker pid for an instance."
  def get_worker(instance_id) :: {:ok, pid()} | {:error, :not_found}

  @doc "List all active instances, optionally filtered by workspace or provider."
  def list_instances(opts \\ []) :: [instance_info()]
  # opts: [workspace_id: uuid, provider_id: atom, status: atom]

  @doc "Reconnect an instance without full restart (hot-reload credentials)."
  def reconnect(instance_id, new_credentials \\ nil) :: :ok | {:error, reason}

  # ── ETS Layout ──────────────────────────────────────────────
  # Two tables:
  #   :ema_providers       → {provider_id, provider_mod, display_name, auth_type, capabilities}
  #   :ema_instances        → {instance_id, provider_id, workspace_id, worker_pid, status, started_at}
end
```

### 2.2 Instance Lifecycle

```
register_provider/1 (app boot)
       │
       ▼
start_instance/3 (user connects in Settings)
       │
       ▼
  Worker.init → provider.connect(credentials)
       │
       ├─ {:ok, state} → status: :connected, begin health loop
       │
       └─ {:error, _}  → status: :error, schedule retry
       │
       ▼
  Running (health checks every 60s, serves requests)
       │
       ├─ reconnect/2 → disconnect old, connect new, no downtime to callers
       │
       └─ stop_instance/1 → disconnect, deregister, terminate Worker
```

### 2.3 Scope: Per-Workspace vs Global

| Integration | Scope | Reason |
|---|---|---|
| API Providers (OpenAI, Anthropic) | **Global** | Keys are account-level, shared across workspaces |
| VPS Monitoring | **Global** | Servers exist independent of projects |
| GitHub | **Per-workspace** | Each project links to specific repos |
| Google Drive | **Per-workspace** | Each project has its own folder |
| Discord | **Per-workspace** | Channel routing is project-specific |
| Slack | **Per-workspace** | Same as Discord |
| Project Meta | **Per-workspace** | By definition project-scoped |

Global instances have `workspace_id: nil`. Per-workspace instances are created when a workspace links an integration.

### 2.4 Hot Reload

`reconnect/2` allows credential rotation (e.g., OAuth token refresh) without dropping the worker process. The worker calls `provider.disconnect(old_state)` then `provider.connect(new_credentials)` in sequence. Callers see a brief `:reconnecting` status but no crash.

---

## 3. Event Pipeline

### 3.1 Common Event Schema

Every integration event — whether from a GitHub webhook, a VPS metric poll, or a Discord message — is normalized into this struct before entering the pipeline:

```elixir
defmodule Ema.Integrations.Event do
  @moduledoc "Normalized event emitted by all integrations."

  @type t :: %__MODULE__{
    id: String.t(),
    instance_id: String.t(),
    provider_id: atom(),
    workspace_id: String.t() | nil,
    type: String.t(),         # e.g. "github.push", "discord.message", "vps.cpu_alert"
    action: String.t(),       # e.g. "created", "updated", "deleted", "triggered"
    source: String.t(),       # external URL or identifier
    actor: map() | nil,       # %{id: "...", name: "...", avatar: "..."} or nil for system events
    payload: map(),           # provider-specific data, always a map
    resource_refs: [map()],   # linked EMA resources [{type: :project, id: "..."}, ...]
    timestamp: DateTime.t(),  # when the event occurred externally
    received_at: DateTime.t(),# when EMA received it
    priority: :low | :normal | :high | :critical,
    idempotency_key: String.t() | nil  # for dedup
  }

  defstruct [
    :id, :instance_id, :provider_id, :workspace_id,
    :type, :action, :source, :actor, :payload,
    resource_refs: [], :timestamp, :received_at,
    priority: :normal, idempotency_key: nil
  ]
end
```

### 3.2 Event Flow Diagram

```
External Source
    │
    ├── Webhook (GitHub, Discord, Slack)
    │       ▼
    │   Phoenix Router: POST /api/webhooks/:provider/:instance_id
    │       ▼
    │   Ema.Integrations.WebhookController
    │       ▼
    │   Worker.handle_webhook(state, headers, body)
    │       ▼
    │   Provider normalizes → [%Event{}, ...]
    │
    ├── Polling (VPS, Google Drive, Project Meta)
    │       ▼
    │   SyncEngine timer fires
    │       ▼
    │   Worker.fetch_changes(state, cursor)
    │       ▼
    │   Provider normalizes → {[%Event{}, ...], new_cursor}
    │
    └── Realtime (Discord/Slack WebSocket)
            ▼
        Provider's internal WS handler
            ▼
        Provider normalizes → [%Event{}, ...]
            │
            ▼
    ┌──────────────────────────────────┐
    │  Ema.Integrations.EventPipeline  │
    │                                  │
    │  1. Dedup (idempotency_key)      │
    │  2. Enrich (link EMA resources)  │
    │  3. Persist (event log table)    │
    │  4. Broadcast                    │
    └──────────────────────────────────┘
            │
            ▼
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "integration_events",               # global topic
      {:integration_event, event}
    )
    Phoenix.PubSub.broadcast(
      Ema.PubSub,
      "integration_events:#{workspace_id}",  # workspace-scoped topic
      {:integration_event, event}
    )
            │
            ▼
    Ema.Pipes.TriggerEngine
    ├── pattern match event.type against pipe triggers
    ├── e.g. trigger: %{source: "integration", type: "github.push", branch: "main"}
    └── matched pipes execute their action chains
```

### 3.3 Pipes Subscription

Pipes subscribe to integration events via PubSub topic matching. The `TriggerEngine` GenServer subscribes to `"integration_events"` (global) and routes events to matching pipes:

```elixir
# In a Pipe definition (stored in DB):
%Ema.Pipes.Pipe{
  name: "Deploy on Main Push",
  trigger: %{
    source: "integration",
    type: "github.push",
    match: %{"payload.ref" => "refs/heads/main"}
  },
  actions: [
    %{type: "integration_action", provider: :discord, action: :send_message,
      params: %{channel: "deploys", content: "🚀 Push to main: {{event.payload.head_commit.message}}"}},
    %{type: "execution", command: "deploy", args: ["--env", "production"]}
  ]
}
```

### 3.4 Backpressure & Priority

Events are buffered in a **bounded GenStage pipeline** (optional, can start simple):

- **Simple mode (v1):** Direct PubSub broadcast, no buffering. Events are fire-and-forget to subscribers. If Pipes is slow, events queue in the subscriber's mailbox (standard BEAM behaviour — totally fine for desktop scale).
- **Scaled mode (v2):** GenStage producer-consumer with `max_demand: 50`. Priority queue: `:critical` events skip ahead. If buffer exceeds 1000, drop `:low` priority events and log a warning.

For v1 (desktop app), simple mode is correct. The BEAM VM handles thousands of queued messages without issue.

---

## 4. Credential Management

### 4.1 Encryption Strategy

Use **[Cloak](https://hex.pm/packages/cloak)** + **[Cloak.Ecto](https://hex.pm/packages/cloak_ecto)** for encryption at rest. Cloak provides AES-256-GCM encryption with key rotation support.

```elixir
# config/config.exs
config :ema, Ema.Vault,
  ciphers: [
    default: {
      Cloak.Ciphers.AES.GCM,
      tag: "AES.GCM.V1",
      key: Base.decode64!(System.get_env("EMA_ENCRYPTION_KEY")),
      iv_length: 12
    }
  ]
```

```elixir
defmodule Ema.Vault do
  use Cloak.Vault, otp_app: :ema
end

defmodule Ema.Encrypted.Binary do
  use Cloak.Ecto.Binary, vault: Ema.Vault
end

defmodule Ema.Encrypted.Map do
  use Cloak.Ecto.Map, vault: Ema.Vault
end
```

### 4.2 Credential Ecto Schema

```elixir
defmodule Ema.Integrations.Credential do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}

  schema "integration_credentials" do
    field :provider_id, Ecto.Enum, values: [
      :github, :google_drive, :discord, :slack,
      :openai, :anthropic, :vps, :project_meta
    ]
    field :workspace_id, :binary_id  # nil for global
    field :label, :string            # user-facing name, e.g. "My GitHub"
    field :auth_type, Ecto.Enum, values: [:oauth2, :api_key, :ssh_key, :bot_token]

    # Encrypted fields — stored as ciphertext in SQLite
    field :credentials, Ema.Encrypted.Map
    # For OAuth2: %{access_token: "...", refresh_token: "...", expires_at: unix, scope: "..."}
    # For API key: %{api_key: "sk-..."}
    # For SSH: %{private_key: "...", host: "...", port: 22, username: "..."}
    # For bot token: %{token: "...", guild_id: "..."}

    field :status, Ecto.Enum, values: [:active, :expired, :revoked, :error],
      default: :active
    field :last_refreshed_at, :utc_datetime_usec
    field :expires_at, :utc_datetime_usec
    field :error_message, :string

    timestamps(type: :utc_datetime_usec)
  end

  def changeset(credential, attrs) do
    credential
    |> cast(attrs, [:provider_id, :workspace_id, :label, :auth_type,
                    :credentials, :status, :expires_at])
    |> validate_required([:provider_id, :auth_type, :credentials])
    |> validate_credentials_shape()
  end

  defp validate_credentials_shape(changeset) do
    # Validate that credentials map has required keys for the auth_type
    case get_field(changeset, :auth_type) do
      :oauth2 ->
        validate_change(changeset, :credentials, fn :credentials, creds ->
          if Map.has_key?(creds, "access_token"), do: [], else: [credentials: "missing access_token"]
        end)
      :api_key ->
        validate_change(changeset, :credentials, fn :credentials, creds ->
          if Map.has_key?(creds, "api_key"), do: [], else: [credentials: "missing api_key"]
        end)
      _ -> changeset
    end
  end
end
```

### 4.3 OAuth Token Refresh Lifecycle

A dedicated GenServer per OAuth credential handles refresh:

```elixir
defmodule Ema.Integrations.OAuthRefresher do
  use GenServer

  @refresh_buffer_ms :timer.minutes(5)  # refresh 5 min before expiry

  defstruct [:credential_id, :provider_mod, :timer_ref]

  def start_link(credential_id) do
    GenServer.start_link(__MODULE__, credential_id,
      name: via_tuple(credential_id))
  end

  @impl true
  def init(credential_id) do
    credential = Repo.get!(Credential, credential_id)
    timer_ref = schedule_refresh(credential.expires_at)
    {:ok, %__MODULE__{credential_id: credential_id,
                       provider_mod: provider_for(credential.provider_id),
                       timer_ref: timer_ref}}
  end

  @impl true
  def handle_info(:refresh, state) do
    credential = Repo.get!(Credential, state.credential_id)

    case do_refresh(state.provider_mod, credential.credentials) do
      {:ok, new_tokens} ->
        {:ok, updated} = credential
          |> Credential.changeset(%{
            credentials: Map.merge(credential.credentials, new_tokens),
            expires_at: DateTime.from_unix!(new_tokens["expires_at"]),
            last_refreshed_at: DateTime.utc_now(),
            status: :active
          })
          |> Repo.update()

        # Notify the Worker to hot-reload credentials
        Registry.reconnect(find_instance(credential.id), updated.credentials)

        timer_ref = schedule_refresh(updated.expires_at)
        {:noreply, %{state | timer_ref: timer_ref}}

      {:error, reason} ->
        Repo.update!(Credential.changeset(credential, %{
          status: :error, error_message: inspect(reason)
        }))
        # Retry in 60s
        timer_ref = Process.send_after(self(), :refresh, :timer.seconds(60))
        {:noreply, %{state | timer_ref: timer_ref}}
    end
  end

  defp schedule_refresh(nil), do: nil
  defp schedule_refresh(expires_at) do
    ms_until_refresh = max(
      DateTime.diff(expires_at, DateTime.utc_now(), :millisecond) - @refresh_buffer_ms,
      0
    )
    Process.send_after(self(), :refresh, ms_until_refresh)
  end

  defp do_refresh(provider_mod, credentials) do
    config = provider_mod.oauth_config()
    OAuth2.Client.new(config)
    |> OAuth2.Client.put_param(:grant_type, "refresh_token")
    |> OAuth2.Client.put_param(:refresh_token, credentials["refresh_token"])
    |> OAuth2.Client.get_token()
    |> case do
      {:ok, %{token: token}} ->
        {:ok, %{
          "access_token" => token.access_token,
          "refresh_token" => token.refresh_token || credentials["refresh_token"],
          "expires_at" => token.expires_at
        }}
      {:error, _} = err -> err
    end
  end
end
```

### 4.4 Revocation & Cleanup

```elixir
defmodule Ema.Integrations.Credentials do
  @doc "Revoke and clean up a credential. Disconnects the worker, deletes from DB."
  def revoke(credential_id) do
    credential = Repo.get!(Credential, credential_id)

    # 1. Stop the OAuth refresher if running
    if credential.auth_type == :oauth2 do
      OAuthRefresher.stop(credential_id)
    end

    # 2. Disconnect the integration worker
    case Registry.find_instance_by_credential(credential_id) do
      {:ok, instance_id} -> Registry.stop_instance(instance_id)
      _ -> :ok
    end

    # 3. Attempt provider-side revocation (best effort)
    provider_mod = provider_for(credential.provider_id)
    if function_exported?(provider_mod, :revoke_token, 1) do
      provider_mod.revoke_token(credential.credentials)
    end

    # 4. Delete from database (encrypted data is gone)
    Repo.delete!(credential)

    # 5. Broadcast event
    PubSub.broadcast(Ema.PubSub, "integration_events",
      {:credential_revoked, credential.provider_id, credential.workspace_id})

    :ok
  end
end
```

### 4.5 UI Credential Management

Credentials are managed in **Settings → Integrations**. The UI never sees raw secrets — only metadata:

```json
// GET /api/integrations/credentials
[
  {
    "id": "cred_abc123",
    "provider_id": "github",
    "label": "Trajan's GitHub",
    "auth_type": "oauth2",
    "status": "active",
    "last_refreshed_at": "2026-04-03T20:00:00Z",
    "expires_at": "2026-04-03T21:00:00Z",
    "scopes": ["repo", "read:org"],
    "created_at": "2026-03-01T10:00:00Z"
  }
]
// Note: credentials map is NEVER serialized to the API. Only status/metadata.
```

---

## 5. Sync Engine

### 5.1 Architecture

```elixir
defmodule Ema.Integrations.SyncEngine do
  @moduledoc """
  Manages sync schedules for all integration instances.
  Each instance gets a sync record tracking cursor, last run, and schedule.
  """

  use GenServer

  # ── Sync Record (Ecto) ──────────────────────────────────────

  # Stored per-instance in the DB
  defmodule SyncState do
    use Ecto.Schema

    @primary_key {:id, :binary_id, autogenerate: true}
    schema "integration_sync_states" do
      field :instance_id, :binary_id
      field :provider_id, Ecto.Enum, values: [
        :github, :google_drive, :discord, :slack,
        :openai, :anthropic, :vps, :project_meta
      ]
      field :sync_mode, Ecto.Enum, values: [:webhook, :polling, :hybrid, :manual],
        default: :hybrid
      field :poll_interval_ms, :integer, default: 300_000  # 5 min default
      field :last_sync_at, :utc_datetime_usec
      field :last_sync_cursor, :string   # opaque cursor from provider
      field :last_sync_status, Ecto.Enum,
        values: [:success, :partial, :error], default: :success
      field :last_error, :string
      field :consecutive_errors, :integer, default: 0
      field :items_synced, :integer, default: 0

      timestamps(type: :utc_datetime_usec)
    end
  end
end
```

### 5.2 Per-Integration Sync Strategy

| Provider | Mode | Poll Interval | Rationale |
|---|---|---|---|
| GitHub | **Hybrid** (webhook-first, poll fallback) | 5 min fallback | Webhooks deliver 95% of events instantly; poll catches missed webhooks |
| Google Drive | **Hybrid** (changes watch + poll) | 10 min | Google's push notifications are unreliable; poll is the safety net |
| Discord | **Realtime** (WebSocket gateway) | N/A | Discord requires persistent WS connection; no polling needed |
| Slack | **Realtime** (WebSocket Events API) | N/A | Same as Discord |
| API Providers | **Manual** | N/A | No sync needed — just validate keys on health check |
| VPS Monitoring | **Polling** | 30 sec (metrics), 5 min (logs) | No webhook support; SSH-based collection |
| Project Meta | **Polling** | 15 min | Cross-reference check, low urgency |

### 5.3 Sync Loop

```elixir
defmodule Ema.Integrations.SyncRunner do
  @doc "Execute a single sync cycle for one instance."
  def run_sync(instance_id) do
    with {:ok, worker_pid} <- Registry.get_worker(instance_id),
         {:ok, sync_state} <- get_sync_state(instance_id),
         cursor = build_cursor(sync_state),
         {:ok, {events, new_cursor}} <- Worker.fetch_changes(worker_pid, cursor) do

      # Process events through the pipeline
      Enum.each(events, &EventPipeline.ingest/1)

      # Update sync state
      update_sync_state(sync_state, %{
        last_sync_at: DateTime.utc_now(),
        last_sync_cursor: new_cursor.cursor,
        last_sync_status: :success,
        consecutive_errors: 0,
        items_synced: sync_state.items_synced + length(events)
      })

      {:ok, length(events)}
    else
      {:error, reason} ->
        handle_sync_error(instance_id, reason)
    end
  end
end
```

### 5.4 Conflict Resolution

EMA uses a **last-write-wins with source-of-truth per field** strategy:

```
┌─────────────────────────────────────────────────────┐
│              Conflict Resolution Policy              │
├─────────────────────────┬───────────────────────────┤
│ Data Type               │ Canonical Source           │
├─────────────────────────┼───────────────────────────┤
│ Issue/PR status         │ GitHub (external wins)     │
│ File contents           │ Google Drive (external)    │
│ Chat messages           │ Discord/Slack (external)   │
│ EMA project metadata    │ EMA (internal wins)        │
│ Agent assignments       │ EMA (internal wins)        │
│ Task status in EMA      │ EMA (internal wins)        │
│ Deploy targets, domains │ EMA (internal wins)        │
│ VPS metrics             │ External (read-only)       │
└─────────────────────────┴───────────────────────────┘
```

Rule of thumb: **if the data originates externally, the external system is canonical. If it originates in EMA, EMA is canonical.** When both systems modify the same field, the conflict is logged and surfaced in the UI for manual resolution.

### 5.5 Incremental Sync

Every provider's `fetch_changes/2` accepts a `sync_cursor` that contains `since` (timestamp) and `cursor` (opaque provider-specific pagination token). Providers must implement incremental fetching — never full re-sync on every poll.

For initial sync (first connection), `cursor` is `nil` and `since` is a configurable lookback window (default: 7 days).

---

## 6. Error Handling & Circuit Breaker

### 6.1 Circuit Breaker

Each integration Worker includes a circuit breaker (implemented inline, no external dependency needed):

```elixir
defmodule Ema.Integrations.CircuitBreaker do
  @moduledoc "Simple circuit breaker. Three states: closed (normal), open (failing), half_open (testing)."

  defstruct [
    state: :closed,
    failure_count: 0,
    failure_threshold: 5,       # open after 5 consecutive failures
    reset_timeout_ms: 60_000,   # try again after 60s
    last_failure_at: nil,
    half_open_at: nil
  ]

  @type t :: %__MODULE__{}
  @type result :: {:ok, term()} | {:error, term()}

  @spec call(t(), (() -> result())) :: {result(), t()}
  def call(%{state: :open} = cb, _fun) do
    if time_to_half_open?(cb) do
      # Transition to half-open, allow one test call
      call(%{cb | state: :half_open}, _fun)  # re-enter with half_open
    else
      {{:error, :circuit_open}, cb}
    end
  end

  def call(%{state: state} = cb, fun) when state in [:closed, :half_open] do
    case fun.() do
      {:ok, _} = result ->
        {result, %{cb | state: :closed, failure_count: 0}}

      {:error, _} = result ->
        new_count = cb.failure_count + 1
        new_state = if new_count >= cb.failure_threshold, do: :open, else: cb.state
        {result, %{cb |
          state: new_state,
          failure_count: new_count,
          last_failure_at: System.monotonic_time(:millisecond)
        }}
    end
  end

  defp time_to_half_open?(%{last_failure_at: lf, reset_timeout_ms: timeout}) do
    System.monotonic_time(:millisecond) - lf >= timeout
  end
end
```

### 6.2 Retry Strategy

Retries happen inside the Worker, wrapping provider calls:

```elixir
defmodule Ema.Integrations.Retry do
  @doc "Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 retries)."
  def with_backoff(fun, opts \\ []) do
    max_retries = Keyword.get(opts, :max_retries, 5)
    base_ms = Keyword.get(opts, :base_ms, 1_000)

    do_retry(fun, 0, max_retries, base_ms)
  end

  defp do_retry(fun, attempt, max, _base) when attempt >= max do
    fun.()  # last attempt, no rescue
  end

  defp do_retry(fun, attempt, max, base) do
    case fun.() do
      {:ok, _} = result -> result
      {:error, :rate_limited} ->
        # Respect rate limit — wait longer
        Process.sleep(base * :math.pow(2, attempt) |> trunc() |> min(30_000))
        do_retry(fun, attempt + 1, max, base)
      {:error, reason} when reason in [:timeout, :econnrefused, :closed] ->
        Process.sleep(base * :math.pow(2, attempt) |> trunc() |> min(30_000))
        do_retry(fun, attempt + 1, max, base)
      {:error, _} = permanent_error ->
        permanent_error  # don't retry 4xx, auth errors, etc.
    end
  end
end
```

### 6.3 User Notification

```elixir
defmodule Ema.Integrations.Alerts do
  @doc "Called by Worker when circuit opens or consecutive errors exceed threshold."
  def notify_integration_failure(instance_id, provider_id, reason) do
    # 1. Broadcast to UI via WebSocket
    EmaWeb.Endpoint.broadcast("settings:integrations", "integration_error", %{
      instance_id: instance_id,
      provider_id: provider_id,
      reason: humanize_error(reason),
      timestamp: DateTime.utc_now()
    })

    # 2. Create a system notification (shown in app notification center)
    Ema.Notifications.create(%{
      type: :integration_error,
      title: "#{provider_display_name(provider_id)} connection failed",
      body: humanize_error(reason),
      severity: :warning,
      action_url: "/settings/integrations/#{instance_id}"
    })

    # 3. Emit event for Pipes (so users can build alerting flows)
    EventPipeline.ingest(%Event{
      type: "system.integration_error",
      action: "circuit_opened",
      provider_id: provider_id,
      payload: %{reason: reason, instance_id: instance_id},
      priority: :high
    })
  end
end
```

### 6.4 Stale Data Warnings

When a sync hasn't succeeded in `2 × poll_interval`, the UI shows a warning badge:

```elixir
def stale?(sync_state) do
  case sync_state.sync_mode do
    :polling ->
      DateTime.diff(DateTime.utc_now(), sync_state.last_sync_at, :millisecond) >
        sync_state.poll_interval_ms * 2
    :webhook ->
      # Webhooks: stale if no event in 24h (configurable)
      DateTime.diff(DateTime.utc_now(), sync_state.last_sync_at, :hour) > 24
    _ -> false
  end
end
```

---

## 7. Wiring into Core Loop

### 7.1 Pipes → Integration Actions (Outbound)

Pipes can trigger integration writes via a dedicated action type:

```elixir
defmodule Ema.Pipes.Actions.IntegrationAction do
  @behaviour Ema.Pipes.Action

  @impl true
  def execute(%{
    provider: provider_id,
    action: action_name,
    params: params,
    workspace_id: workspace_id
  }, context) do
    # Find the active instance for this provider + workspace
    case Registry.find_instance(provider_id, workspace_id) do
      {:ok, instance_id} ->
        {:ok, worker} = Registry.get_worker(instance_id)
        Worker.execute_action(worker, action_name, interpolate(params, context))
      {:error, :not_found} ->
        {:error, "No active #{provider_id} integration for this workspace"}
    end
  end

  # Template interpolation: replace {{event.payload.X}} with actual values
  defp interpolate(params, context) when is_map(params) do
    Map.new(params, fn {k, v} -> {k, interpolate(v, context)} end)
  end
  defp interpolate(str, context) when is_binary(str) do
    Regex.replace(~r/\{\{(\S+?)\}\}/, str, fn _, path ->
      get_in(context, String.split(path, ".")) || ""
    end)
  end
  defp interpolate(other, _), do: other
end
```

**Example Pipe definitions:**

```elixir
# On task completion → post to Discord
%Pipe{
  trigger: %{source: "ema", type: "task.completed"},
  actions: [
    %{type: "integration",
      provider: :discord,
      action: :send_message,
      params: %{
        channel: "task-updates",
        content: "✅ **{{event.payload.task_name}}** completed by {{event.actor.name}}"
      }}
  ]
}

# On GitHub PR merged → update project status
%Pipe{
  trigger: %{source: "integration", type: "github.pull_request", action: "closed",
             match: %{"payload.merged" => true}},
  actions: [
    %{type: "ema_update",
      entity: "project",
      field: "status",
      value: "deployed"}
  ]
}
```

### 7.2 Integration Events → EMA Objects (Inbound)

Certain integration events automatically create or update EMA entities:

```elixir
defmodule Ema.Integrations.ObjectMapper do
  @moduledoc "Maps integration events to EMA entity operations."

  @mappings %{
    "github.issues.opened" => &create_proposal_from_issue/1,
    "github.pull_request.opened" => &create_proposal_option_from_pr/1,
    "github.pull_request.closed" => &update_proposal_from_pr_close/1,
    "github.push" => &log_execution_from_push/1,
    "discord.message" => &maybe_create_note_from_message/1,
    "vps.alert" => &create_incident_from_alert/1
  }

  def process_event(%Event{type: type} = event) do
    case Map.get(@mappings, type) do
      nil -> :skip
      mapper_fn -> mapper_fn.(event)
    end
  end

  defp create_proposal_from_issue(%Event{payload: %{"issue" => issue}} = event) do
    Ema.Proposals.create(%{
      title: issue["title"],
      description: issue["body"],
      source: "github",
      external_id: "github:issue:#{issue["number"]}",
      external_url: issue["html_url"],
      workspace_id: event.workspace_id,
      status: :open
    })
  end

  defp create_proposal_option_from_pr(%Event{payload: %{"pull_request" => pr}} = event) do
    # Find the linked proposal (from the issue the PR references)
    case find_linked_proposal(pr, event.workspace_id) do
      {:ok, proposal} ->
        Ema.Proposals.add_option(proposal.id, %{
          title: pr["title"],
          description: pr["body"],
          source: "github",
          external_id: "github:pr:#{pr["number"]}",
          external_url: pr["html_url"]
        })
      _ -> :skip
    end
  end

  # ... other mappers
end
```

### 7.3 Agent Context Enrichment

When an agent is working on a task, its context is enriched with integration data:

```elixir
defmodule Ema.Agents.ContextBuilder do
  def build_context(agent, task) do
    base_context = %{
      agent: agent,
      task: task,
      workspace: task.workspace
    }

    # Enrich with integration data
    base_context
    |> maybe_add_github_context(task)
    |> maybe_add_recent_messages(task)
    |> maybe_add_vps_status(task)
  end

  defp maybe_add_github_context(ctx, task) do
    case Registry.find_instance(:github, task.workspace_id) do
      {:ok, instance_id} ->
        {:ok, worker} = Registry.get_worker(instance_id)
        case Worker.execute_action(worker, :get_repo_context, %{
          repo: task.linked_repo,
          include: [:open_prs, :recent_commits, :ci_status]
        }) do
          {:ok, github_ctx} -> Map.put(ctx, :github, github_ctx)
          _ -> ctx
        end
      _ -> ctx
    end
  end
end
```

---

## 8. Integration Manager UI Spec

### 8.1 API Endpoints

```
# ── Provider Discovery ────────────────────────────────────
GET    /api/integrations/providers
       → [{id, display_name, auth_type, capabilities, description, icon_url}]

# ── Credential Management ────────────────────────────────
GET    /api/integrations/credentials
       → [{id, provider_id, label, auth_type, status, expires_at, scopes, created_at}]
       # NEVER returns raw secrets

POST   /api/integrations/credentials
       Body: {provider_id, auth_type, credentials: {...}, label, workspace_id}
       → {id, status: "active"}

DELETE /api/integrations/credentials/:id
       → 204 (revokes + disconnects + deletes)

# ── OAuth Flow ────────────────────────────────────────────
GET    /api/integrations/oauth/:provider/authorize
       → {redirect_url}  (starts OAuth flow, redirects to provider)

GET    /api/integrations/oauth/:provider/callback?code=...&state=...
       → handles callback, stores tokens, redirects to Settings page

# ── Instance Management ──────────────────────────────────
GET    /api/integrations/instances
       Query: ?workspace_id=...&provider_id=...
       → [{instance_id, provider_id, workspace_id, status, connected_at, health}]

POST   /api/integrations/instances
       Body: {provider_id, credential_id, workspace_id, config: {...}}
       → {instance_id, status}

DELETE /api/integrations/instances/:id
       → 204 (disconnects + removes)

POST   /api/integrations/instances/:id/reconnect
       → {status: "reconnecting"}

POST   /api/integrations/instances/:id/sync
       → {status: "syncing"} (trigger manual sync)

# ── Health & Sync Status ─────────────────────────────────
GET    /api/integrations/instances/:id/status
       → {health, last_sync_at, last_sync_status, items_synced,
          consecutive_errors, circuit_state, rate_limit}

# ── Resource Linking ──────────────────────────────────────
GET    /api/integrations/instances/:id/resources
       → [{type, external_id, name, url, linked_project_id}]

POST   /api/integrations/instances/:id/resources/:external_id/link
       Body: {project_id}
       → 200

DELETE /api/integrations/instances/:id/resources/:external_id/link
       → 204
```

### 8.2 Connection Status Card Data Model

Each integration card in the Settings UI displays:

```typescript
interface IntegrationCard {
  instance_id: string;
  provider: {
    id: string;          // "github"
    name: string;        // "GitHub"
    icon: string;        // URL or icon component name
    capabilities: string[];
  };
  credential: {
    label: string;       // "Trajan's GitHub"
    auth_type: string;
    status: "active" | "expired" | "error" | "revoked";
  };
  connection: {
    status: "connected" | "connecting" | "disconnected" | "error";
    health: "healthy" | "degraded" | "unhealthy";
    connected_since: string;  // ISO datetime
    circuit_state: "closed" | "open" | "half_open";
  };
  sync: {
    mode: "webhook" | "polling" | "hybrid" | "realtime" | "manual";
    last_sync_at: string | null;
    last_sync_status: "success" | "partial" | "error";
    items_synced: number;
    is_stale: boolean;
    next_poll_at: string | null;
  };
  linked_resources: number;  // count of linked repos/folders/channels
  workspace_id: string | null;  // null = global
  actions: string[];  // ["reconnect", "sync_now", "configure", "disconnect"]
}
```

### 8.3 Real-Time Updates

The Settings → Integrations panel connects to a Phoenix Channel for live updates:

```elixir
defmodule EmaWeb.IntegrationsChannel do
  use EmaWeb, :channel

  def join("settings:integrations", _params, socket) do
    # Send initial state
    instances = Registry.list_instances()
    {:ok, %{instances: serialize(instances)}, socket}
  end

  # Broadcasts received from Workers/SyncEngine/Alerts:
  #   "instance_status_changed" → {instance_id, status, health}
  #   "sync_completed"          → {instance_id, sync_status, items}
  #   "integration_error"       → {instance_id, error}
  #   "credential_status"       → {credential_id, status}

  def handle_in("sync_now", %{"instance_id" => id}, socket) do
    SyncEngine.trigger_sync(id)
    {:reply, :ok, socket}
  end

  def handle_in("reconnect", %{"instance_id" => id}, socket) do
    Registry.reconnect(id)
    {:reply, :ok, socket}
  end
end
```

The channel pushes updates as they happen — no polling needed from the UI.

---

## 9. Testing Strategy

### 9.1 Mock Provider

```elixir
defmodule Ema.Integrations.Providers.Mock do
  @moduledoc "Mock provider for testing. Configurable responses."
  use Ema.Integrations.Provider

  def provider_id, do: :mock
  def display_name, do: "Mock Provider"
  def auth_type, do: :api_key

  def connect(%{"api_key" => "valid"}), do: {:ok, %{connected: true}}
  def connect(%{"api_key" => "slow"}), do: Process.sleep(5000) && {:ok, %{connected: true}}
  def connect(_), do: {:error, :invalid_credentials}

  def disconnect(_state), do: :ok

  def health_check(%{healthy: false}), do: {:error, :unhealthy}
  def health_check(_state), do: {:ok, :healthy}

  def rate_limit_status(_state), do: {:ok, {100, System.os_time(:second) + 3600, 3600_000}}

  def capabilities, do: [:read, :write, :webhook, :sync]

  def list_resources(_state, _opts) do
    {:ok, [
      %{type: :repo, external_id: "mock/repo-1", meta: %{name: "repo-1"}},
      %{type: :repo, external_id: "mock/repo-2", meta: %{name: "repo-2"}}
    ]}
  end

  def fetch_changes(_state, cursor) do
    events = [
      %Event{
        id: Ecto.UUID.generate(),
        type: "mock.item_changed",
        action: "updated",
        payload: %{item: "test"},
        timestamp: DateTime.utc_now(),
        received_at: DateTime.utc_now()
      }
    ]
    {:ok, {events, %{cursor | cursor: "next_page_token"}}}
  end

  def execute_action(_state, :send_message, params) do
    send(self(), {:mock_action, :send_message, params})
    {:ok, %{sent: true}}
  end
  def execute_action(_state, action, _params), do: {:error, {:unknown_action, action}}

  def handle_webhook(_state, _headers, body) do
    {:ok, [%Event{
      id: Ecto.UUID.generate(),
      type: "mock.webhook",
      action: "received",
      payload: Jason.decode!(body),
      timestamp: DateTime.utc_now(),
      received_at: DateTime.utc_now()
    }]}
  end
end
```

### 9.2 Integration Test Helpers

```elixir
defmodule Ema.IntegrationCase do
  @moduledoc "Test case template for integration tests."
  use ExUnit.CaseTemplate

  using do
    quote do
      import Ema.IntegrationCase

      setup do
        # Start a mock provider instance
        {:ok, instance_id} = Registry.start_instance(
          :mock, nil, %{"api_key" => "valid"}
        )
        on_exit(fn -> Registry.stop_instance(instance_id) end)
        %{instance_id: instance_id}
      end
    end
  end

  @doc "Simulate a webhook delivery to a provider instance."
  def deliver_webhook(instance_id, headers \\ %{}, body) do
    conn = Phoenix.ConnTest.build_conn()
      |> Plug.Conn.put_req_header("content-type", "application/json")
    for {k, v} <- headers, do: Plug.Conn.put_req_header(conn, k, v)

    Phoenix.ConnTest.post(conn, "/api/webhooks/mock/#{instance_id}", body)
  end

  @doc "Wait for an integration event to appear on PubSub."
  def assert_integration_event(type, timeout \\ 1000) do
    Phoenix.PubSub.subscribe(Ema.PubSub, "integration_events")
    assert_receive {:integration_event, %Event{type: ^type}}, timeout
  end

  @doc "Simulate a GitHub webhook with HMAC signature."
  def deliver_github_webhook(instance_id, event_type, payload) do
    body = Jason.encode!(payload)
    secret = get_webhook_secret(instance_id)
    signature = "sha256=" <> :crypto.mac(:hmac, :sha256, secret, body) |> Base.encode16(case: :lower)

    deliver_webhook(instance_id, %{
      "x-github-event" => event_type,
      "x-hub-signature-256" => signature,
      "x-github-delivery" => Ecto.UUID.generate()
    }, body)
  end
end
```

### 9.3 Circuit Breaker Testing

```elixir
defmodule Ema.Integrations.CircuitBreakerTest do
  use ExUnit.Case

  alias Ema.Integrations.CircuitBreaker

  test "opens after threshold failures" do
    cb = %CircuitBreaker{failure_threshold: 3}

    # 3 failures → circuit opens
    {_, cb} = CircuitBreaker.call(cb, fn -> {:error, :timeout} end)
    assert cb.state == :closed
    {_, cb} = CircuitBreaker.call(cb, fn -> {:error, :timeout} end)
    assert cb.state == :closed
    {_, cb} = CircuitBreaker.call(cb, fn -> {:error, :timeout} end)
    assert cb.state == :open

    # Calls rejected while open
    {{:error, :circuit_open}, _} = CircuitBreaker.call(cb, fn -> {:ok, :data} end)
  end

  test "transitions to half-open after reset timeout" do
    cb = %CircuitBreaker{
      state: :open,
      failure_count: 5,
      last_failure_at: System.monotonic_time(:millisecond) - 61_000,
      reset_timeout_ms: 60_000
    }

    # Should allow one test call (half-open)
    {{:ok, :recovered}, cb} = CircuitBreaker.call(cb, fn -> {:ok, :recovered} end)
    assert cb.state == :closed
    assert cb.failure_count == 0
  end

  test "re-opens on half-open failure" do
    cb = %CircuitBreaker{
      state: :open,
      failure_count: 5,
      failure_threshold: 5,
      last_failure_at: System.monotonic_time(:millisecond) - 61_000,
      reset_timeout_ms: 60_000
    }

    {{:error, :still_broken}, cb} = CircuitBreaker.call(cb, fn -> {:error, :still_broken} end)
    assert cb.state == :open
  end
end
```

### 9.4 Full Test Matrix

| Layer | Test Type | What's Tested |
|---|---|---|
| Provider Behaviour | Unit | Each callback in isolation with mock HTTP (Bypass/Mox) |
| Registry | Unit | start/stop/list/reconnect lifecycle |
| Event Pipeline | Integration | Webhook → normalize → PubSub → Pipes trigger matching |
| Credential | Unit | Encryption roundtrip, refresh lifecycle, revocation |
| Sync Engine | Integration | Poll cycle, cursor advancement, error accumulation |
| Circuit Breaker | Unit | State transitions, timing, threshold behaviour |
| Object Mapper | Integration | GitHub event → EMA Proposal creation |
| API Endpoints | Controller | Auth, validation, response shape |
| WebSocket Channel | Integration | Real-time status push on state changes |

**Test fixtures live in `test/support/fixtures/webhooks/`** with sample payloads per provider (e.g., `github_push.json`, `github_pr_opened.json`, `discord_message.json`).

---

## Appendix A: Database Migrations

```elixir
defmodule Ema.Repo.Migrations.CreateIntegrationTables do
  use Ecto.Migration

  def change do
    create table(:integration_credentials, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :provider_id, :string, null: false
      add :workspace_id, :binary_id  # null = global
      add :label, :string
      add :auth_type, :string, null: false
      add :credentials, :binary, null: false  # Cloak-encrypted
      add :status, :string, default: "active"
      add :last_refreshed_at, :utc_datetime_usec
      add :expires_at, :utc_datetime_usec
      add :error_message, :text
      timestamps(type: :utc_datetime_usec)
    end

    create index(:integration_credentials, [:provider_id])
    create index(:integration_credentials, [:workspace_id])

    create table(:integration_instances, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :provider_id, :string, null: false
      add :credential_id, references(:integration_credentials, type: :binary_id)
      add :workspace_id, :binary_id
      add :config, :map, default: %{}  # provider-specific config
      add :status, :string, default: "disconnected"
      timestamps(type: :utc_datetime_usec)
    end

    create index(:integration_instances, [:provider_id])
    create index(:integration_instances, [:workspace_id])
    create unique_index(:integration_instances, [:provider_id, :workspace_id],
      name: :one_provider_per_workspace)

    create table(:integration_sync_states, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :instance_id, references(:integration_instances, type: :binary_id,
        on_delete: :delete_all), null: false
      add :provider_id, :string, null: false
      add :sync_mode, :string, default: "hybrid"
      add :poll_interval_ms, :integer, default: 300_000
      add :last_sync_at, :utc_datetime_usec
      add :last_sync_cursor, :text
      add :last_sync_status, :string, default: "success"
      add :last_error, :text
      add :consecutive_errors, :integer, default: 0
      add :items_synced, :integer, default: 0
      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:integration_sync_states, [:instance_id])

    create table(:integration_events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :instance_id, :binary_id
      add :provider_id, :string, null: false
      add :workspace_id, :binary_id
      add :type, :string, null: false
      add :action, :string
      add :source, :string
      add :actor, :map
      add :payload, :map
      add :priority, :string, default: "normal"
      add :idempotency_key, :string
      add :timestamp, :utc_datetime_usec
      add :received_at, :utc_datetime_usec
      timestamps(type: :utc_datetime_usec)
    end

    create index(:integration_events, [:type])
    create index(:integration_events, [:instance_id])
    create index(:integration_events, [:workspace_id])
    create index(:integration_events, [:timestamp])
    create unique_index(:integration_events, [:idempotency_key],
      where: "idempotency_key IS NOT NULL")

    create table(:integration_resource_links, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :instance_id, references(:integration_instances, type: :binary_id,
        on_delete: :delete_all), null: false
      add :external_type, :string, null: false   # "repo", "folder", "channel"
      add :external_id, :string, null: false
      add :external_name, :string
      add :external_url, :string
      add :project_id, :binary_id, null: false
      add :meta, :map, default: %{}
      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:integration_resource_links, [:instance_id, :external_id])
    create index(:integration_resource_links, [:project_id])
  end
end
```

---

## Appendix B: Supervision Tree

```
Ema.Application
├── Ema.Repo
├── Ema.Vault (Cloak encryption)
├── Ema.PubSub (Phoenix.PubSub)
├── EmaWeb.Endpoint
│
├── Ema.Integrations.Supervisor          ← NEW
│   ├── Ema.Integrations.Registry       (GenServer + ETS)
│   ├── Ema.Integrations.SyncEngine     (GenServer, manages poll timers)
│   ├── Ema.Integrations.EventPipeline  (GenServer, dedup + broadcast)
│   ├── Ema.Integrations.WorkerSupervisor (DynamicSupervisor)
│   │   ├── Worker{github, workspace_1}
│   │   ├── Worker{discord, workspace_1}
│   │   ├── Worker{openai, global}
│   │   └── ...
│   └── Ema.Integrations.OAuthSupervisor (DynamicSupervisor)
│       ├── OAuthRefresher{cred_abc}
│       └── OAuthRefresher{cred_def}
│
├── Ema.Pipes.Supervisor
│   └── ... (existing)
│
└── Ema.Agents.Supervisor
    └── ... (existing)
```

---

## Appendix C: Module Summary

| Module | Type | Purpose |
|---|---|---|
| `Ema.Integrations.Provider` | Behaviour | Contract for all providers |
| `Ema.Integrations.Providers.*` | Implementations | GitHub, GoogleDrive, Discord, Slack, ApiProvider, VpsMonitor, ProjectMeta, Mock |
| `Ema.Integrations.Registry` | GenServer + ETS | Provider registration, instance tracking |
| `Ema.Integrations.Worker` | GenServer | Per-instance connection manager + circuit breaker |
| `Ema.Integrations.WorkerSupervisor` | DynamicSupervisor | Supervises Worker processes |
| `Ema.Integrations.SyncEngine` | GenServer | Poll scheduling, sync orchestration |
| `Ema.Integrations.SyncRunner` | Module | Executes single sync cycles |
| `Ema.Integrations.EventPipeline` | GenServer | Dedup, enrich, persist, broadcast events |
| `Ema.Integrations.Event` | Struct | Normalized event schema |
| `Ema.Integrations.Credential` | Ecto Schema | Encrypted credential storage |
| `Ema.Integrations.Credentials` | Context | CRUD + revocation for credentials |
| `Ema.Integrations.OAuthRefresher` | GenServer | Per-credential token refresh loop |
| `Ema.Integrations.OAuthSupervisor` | DynamicSupervisor | Supervises refreshers |
| `Ema.Integrations.CircuitBreaker` | Module | Three-state circuit breaker logic |
| `Ema.Integrations.Retry` | Module | Exponential backoff wrapper |
| `Ema.Integrations.Alerts` | Module | User notification on failures |
| `Ema.Integrations.ObjectMapper` | Module | Integration events → EMA entities |
| `Ema.Integrations.Supervisor` | Supervisor | Top-level integration tree |
| `Ema.Vault` | Cloak.Vault | Encryption key management |
| `EmaWeb.IntegrationsChannel` | Phoenix Channel | Real-time UI updates |
| `EmaWeb.IntegrationController` | Controller | REST API endpoints |
| `Ema.Pipes.Actions.IntegrationAction` | Pipes Action | Outbound integration writes from Pipes |
| `Ema.Agents.ContextBuilder` | Module | Enriches agent context with integration data |

## See Also

- [[github-integration]] — GitHub-specific provider implementation details
- [[discord-slack-integration]] — Real-time messaging provider implementations
- [[monitoring-observability]] — Observability patterns used by the event pipeline
- [[superman-architecture]] — Core EMA architecture that this framework plugs into
- [[MCP-GATEWAY-ARCH]] — MCP gateway architecture for external tool integration
- [[BRIDGE-ASYNC-PATTERN]] — Async bridge pattern used in event processing
