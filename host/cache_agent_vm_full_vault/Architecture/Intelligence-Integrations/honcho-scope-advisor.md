# Honcho + Scope Advisor — Production Deployment & Session Architecture

> **Status:** Design Document  
> **EMA Component:** Phase 2 — User Modeling & Scope Control  
> **Honcho Version:** v3 (Workspaces / Peers / Sessions / Messages model)

---

## Table of Contents

1. [Honcho Production Deployment](#1-honcho-production-deployment)
2. [Honcho API Integration (Elixir Client)](#2-honcho-api-integration-elixir-client)
3. [Session Boundary Design](#3-session-boundary-design)
4. [User Modeling](#4-user-modeling)
5. [Scope Advisor System](#5-scope-advisor-system)
6. [Reflexion Injection Points](#6-reflexion-injection-points)
7. [Token Budget Management](#7-token-budget-management)
8. [Safety Constraints](#8-safety-constraints)
9. [Honcho + Scope Advisor Integration Points](#9-honcho--scope-advisor-integration-points)
10. [Production Config](#10-production-config)

---

## 1. Honcho Production Deployment

### Architecture Overview

Honcho v3 consists of four services: **API server** (FastAPI), **Deriver** (background reasoning worker), **PostgreSQL** (pgvector for storage + embeddings), and **Redis** (queue/cache). EMA communicates with Honcho via REST API over the local Docker network.

```
┌─────────────────────────────────────────────────┐
│  Host Machine                                    │
│                                                  │
│  ┌──────────────┐      HTTP :8000                │
│  │  EMA Daemon   │ ──────────────► ┌───────────┐ │
│  │  :4488        │                 │ Honcho API │ │
│  └──────────────┘                  └─────┬─────┘ │
│                                          │       │
│                              ┌───────────┼────┐  │
│                              │  Docker Net    │  │
│                              │                │  │
│                              │  ┌──────────┐  │  │
│                              │  │ Deriver  │  │  │
│                              │  └────┬─────┘  │  │
│                              │       │        │  │
│                              │  ┌────▼─────┐  │  │
│                              │  │ Postgres │  │  │
│                              │  │ pgvector │  │  │
│                              │  └──────────┘  │  │
│                              │  ┌──────────┐  │  │
│                              │  │  Redis   │  │  │
│                              │  └──────────┘  │  │
│                              └────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Docker Compose Configuration

```yaml
# docker-compose.honcho.yml
version: "3.8"

services:
  honcho-api:
    image: ghcr.io/plastic-labs/honcho:latest
    container_name: ema-honcho-api
    entrypoint: ["sh", "docker/entrypoint.sh"]
    restart: unless-stopped
    depends_on:
      honcho-db:
        condition: service_healthy
      honcho-redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:8000:8000"  # Only localhost — EMA connects directly
    environment:
      - DB_CONNECTION_URI=postgresql+psycopg://honcho:${HONCHO_DB_PASSWORD}@honcho-db:5432/honcho
      - CACHE_URL=redis://honcho-redis:6379/0?suppress=true
      - LLM_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - LLM_OPENAI_API_KEY=${OPENAI_API_KEY}  # Optional: for embeddings
    env_file:
      - .env.honcho
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - honcho-net
    deploy:
      resources:
        limits:
          memory: 1G

  honcho-deriver:
    image: ghcr.io/plastic-labs/honcho:latest
    container_name: ema-honcho-deriver
    entrypoint: ["/app/.venv/bin/python", "-m", "src.deriver"]
    restart: unless-stopped
    depends_on:
      honcho-db:
        condition: service_healthy
      honcho-redis:
        condition: service_healthy
    environment:
      - DB_CONNECTION_URI=postgresql+psycopg://honcho:${HONCHO_DB_PASSWORD}@honcho-db:5432/honcho
      - CACHE_URL=redis://honcho-redis:6379/0?suppress=true
      - LLM_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - LLM_OPENAI_API_KEY=${OPENAI_API_KEY}
      - METRICS_ENABLED=true
    env_file:
      - .env.honcho
    networks:
      - honcho-net
    deploy:
      resources:
        limits:
          memory: 2G  # Deriver runs LLM inference — needs headroom

  honcho-db:
    image: pgvector/pgvector:pg15
    container_name: ema-honcho-db
    restart: always
    command: ["postgres", "-c", "max_connections=200", "-c", "shared_buffers=256MB"]
    environment:
      - POSTGRES_DB=honcho
      - POSTGRES_USER=honcho
      - POSTGRES_PASSWORD=${HONCHO_DB_PASSWORD}
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - honcho-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U honcho -d honcho"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - honcho-net
    deploy:
      resources:
        limits:
          memory: 512M

  honcho-redis:
    image: redis:8-alpine
    container_name: ema-honcho-redis
    restart: always
    command: ["redis-server", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru"]
    volumes:
      - honcho-redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - honcho-net

volumes:
  honcho-pgdata:
    driver: local
  honcho-redis-data:
    driver: local

networks:
  honcho-net:
    driver: bridge
```

### Environment File (`.env.honcho`)

```bash
# .env.honcho — Honcho-specific env vars
HONCHO_DB_PASSWORD=change-me-in-production
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...          # Optional — only needed if EMBED_MESSAGES=true
# EMBED_MESSAGES=true          # Enable vector embeddings for search
# DERIVER_BATCH_SIZE=10        # Reasoning batch size
# DERIVER_POLL_INTERVAL=5      # Seconds between deriver polls
```

### Data Persistence & Backup

**Storage:** PostgreSQL with pgvector — the only correct choice for production. Honcho's reasoning system generates vector embeddings and formal logic conclusions that need relational + vector queries. SQLite cannot handle concurrent writes from API + Deriver.

**Backup strategy:**

```bash
#!/bin/bash
# /opt/ema/scripts/backup-honcho.sh — Run daily via cron
set -euo pipefail

BACKUP_DIR="/opt/ema/backups/honcho"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETAIN_DAYS=30

mkdir -p "$BACKUP_DIR"

# Dump PostgreSQL
docker exec ema-honcho-db pg_dump -U honcho -Fc honcho \
  > "$BACKUP_DIR/honcho-$TIMESTAMP.dump"

# Prune old backups
find "$BACKUP_DIR" -name "honcho-*.dump" -mtime +$RETAIN_DAYS -delete

echo "Honcho backup complete: honcho-$TIMESTAMP.dump"
```

**Cron entry:**
```
0 3 * * * /opt/ema/scripts/backup-honcho.sh >> /var/log/ema/honcho-backup.log 2>&1
```

### Reverse Proxy (Optional — VPS-hosted)

If EMA is hosted on a VPS with external access, add Caddy:

```yaml
  caddy:
    image: caddy:2-alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    networks:
      - honcho-net
```

```
# Caddyfile
ema.yourdomain.com {
    reverse_proxy /honcho/* honcho-api:8000 {
        header_up X-Forwarded-Proto {scheme}
    }
    reverse_proxy /* localhost:4488
}
```

For localhost-only deployments (the expected EMA case), the reverse proxy is unnecessary — Honcho API is bound to `127.0.0.1:8000`.

---

## 2. Honcho API Integration (Elixir Client)

Honcho has Python and TypeScript SDKs but no Elixir SDK. EMA needs an HTTP client.

### HTTP Client Module

```elixir
defmodule Ema.Honcho.Client do
  @moduledoc """
  HTTP client for Honcho v3 API.
  
  Honcho v3 data model:
  - Workspaces: top-level isolation (EMA uses one workspace)
  - Peers: users or agents — anything that persists over time
  - Sessions: interaction threads between peers
  - Messages: units of data within sessions, attributed to peers
  """

  use GenServer

  @default_workspace "ema-prod"

  defstruct [:base_url, :api_key, :workspace_id, :http_pool]

  # ──────────────────────────────────────────────
  # Client API
  # ──────────────────────────────────────────────

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Check if Honcho is reachable"
  def health_check do
    get("/health")
  end

  # ── Peers ──────────────────────────────────────

  @doc "Get or create a peer (user or agent) in the workspace"
  def get_or_create_peer(peer_id) when is_binary(peer_id) do
    # Honcho's peer() call is idempotent — creates if not exists
    post("/workspaces/#{workspace_id()}/peers", %{id: peer_id})
  end

  @doc "Query what Honcho knows about a peer (natural language)"
  def chat_about_peer(peer_id, question) when is_binary(question) do
    post("/workspaces/#{workspace_id()}/peers/#{peer_id}/chat", %{
      query: question
    })
  end

  @doc "Search a peer's message history"
  def search_peer(peer_id, query, opts \\ []) do
    post("/workspaces/#{workspace_id()}/peers/#{peer_id}/search", %{
      query: query,
      limit: Keyword.get(opts, :limit, 10)
    })
  end

  # ── Sessions ───────────────────────────────────

  @doc "Create a new session in the workspace"
  def create_session(session_id, peer_ids \\ []) do
    post("/workspaces/#{workspace_id()}/sessions", %{
      id: session_id,
      peer_ids: peer_ids
    })
  end

  @doc "Get session context (summary + recent messages)"
  def get_session_context(session_id, opts \\ []) do
    params = %{
      summary: Keyword.get(opts, :summary, true),
      tokens: Keyword.get(opts, :tokens, 10_000)
    }
    get("/workspaces/#{workspace_id()}/sessions/#{session_id}/context", params)
  end

  @doc "Get a peer's representation within a specific session"
  def get_session_representation(session_id, peer_id) do
    get("/workspaces/#{workspace_id()}/sessions/#{session_id}/representations/#{peer_id}")
  end

  # ── Messages ───────────────────────────────────

  @doc "Add messages to a session"
  def add_messages(session_id, messages) when is_list(messages) do
    post("/workspaces/#{workspace_id()}/sessions/#{session_id}/messages", %{
      messages: Enum.map(messages, fn msg ->
        %{peer_id: msg.peer_id, content: msg.content}
      end)
    })
  end

  @doc "Add a single message to a session"
  def add_message(session_id, peer_id, content) do
    add_messages(session_id, [%{peer_id: peer_id, content: content}])
  end

  # ── Reflexion (custom messages for self-improvement) ──

  @doc """
  Record a reflexion event. Implemented as a message from a 
  special "ema-system" peer in a dedicated reflexion session.
  """
  def record_reflexion(peer_id, reflexion) do
    session_id = "reflexion-#{peer_id}"
    system_peer = "ema-system"
    
    add_message(session_id, system_peer, Jason.encode!(%{
      type: "reflexion",
      peer_id: peer_id,
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      what_worked: reflexion.what_worked,
      what_failed: reflexion.what_failed,
      lesson: reflexion.lesson,
      task_context: reflexion.task_context
    }))
  end

  # ──────────────────────────────────────────────
  # GenServer Implementation
  # ──────────────────────────────────────────────

  @impl true
  def init(opts) do
    config = %__MODULE__{
      base_url: Keyword.fetch!(opts, :base_url),
      api_key: Keyword.get(opts, :api_key),
      workspace_id: Keyword.get(opts, :workspace_id, @default_workspace)
    }
    # Verify connection on startup
    case Req.get("#{config.base_url}/health") do
      {:ok, %{status: 200}} -> {:ok, config}
      error -> {:stop, {:honcho_unreachable, error}}
    end
  end

  # ──────────────────────────────────────────────
  # HTTP Helpers
  # ──────────────────────────────────────────────

  defp get(path, params \\ %{}) do
    config = :persistent_term.get(:honcho_config)
    Req.get("#{config.base_url}#{path}",
      params: params,
      headers: auth_headers(config),
      receive_timeout: 30_000
    )
    |> handle_response()
  end

  defp post(path, body) do
    config = :persistent_term.get(:honcho_config)
    Req.post("#{config.base_url}#{path}",
      json: body,
      headers: auth_headers(config),
      receive_timeout: 30_000
    )
    |> handle_response()
  end

  defp auth_headers(%{api_key: nil}), do: []
  defp auth_headers(%{api_key: key}), do: [{"authorization", "Bearer #{key}"}]

  defp workspace_id do
    :persistent_term.get(:honcho_config).workspace_id
  end

  defp handle_response({:ok, %{status: status, body: body}}) when status in 200..299 do
    {:ok, body}
  end
  defp handle_response({:ok, %{status: 429, headers: headers}}) do
    retry_after = get_retry_after(headers)
    {:error, {:rate_limited, retry_after}}
  end
  defp handle_response({:ok, %{status: status, body: body}}) do
    {:error, {:http_error, status, body}}
  end
  defp handle_response({:error, reason}) do
    {:error, {:connection_error, reason}}
  end

  defp get_retry_after(headers) do
    case List.keyfind(headers, "retry-after", 0) do
      {_, value} -> String.to_integer(value) * 1000
      nil -> 5_000
    end
  end
end
```

### Supervisor Integration

```elixir
defmodule Ema.Honcho.Supervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    config = Application.get_env(:ema, Ema.Honcho)

    children = [
      {Ema.Honcho.Client, config},
      {Ema.Honcho.SessionManager, []},
      {Ema.Honcho.ReflexionWorker, []}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
```

### Data Flow Summary

```
EMA Agent Action
      │
      ▼
Ema.Honcho.Client.add_message(session_id, peer_id, content)
      │
      ▼ HTTP POST
Honcho API → stores message → enqueues for Deriver
      │
      ▼ (async, seconds later)
Deriver reasons about message → updates peer representations
      │
      ▼ (on next query)
Ema.Honcho.Client.chat_about_peer("trajan", "What are their coding preferences?")
      │
      ▼
Returns synthesized answer from all accumulated reasoning
```

---

## 3. Session Boundary Design

### Session Types in EMA

EMA has four distinct interaction contexts, each mapping to a Honcho session type:

| EMA Concept | Honcho Session ID Pattern | Peers Involved | Lifetime |
|---|---|---|---|
| Agent Conversation | `conv-{agent_id}-{uuid}` | `trajan` + `agent-{id}` | Single conversation turn/thread |
| Campaign | `camp-{campaign_name}-{uuid}` | `trajan` + `agent-{id}` + sub-agents | Campaign lifetime (hours to days) |
| Project Context | `proj-{project_slug}` | `trajan` + all agents that touch project | Indefinite — represents project memory |
| Tauri App Session | `app-{date}-{session_num}` | `trajan` | Tauri window open → close |

### Session ID Generation

```elixir
defmodule Ema.Honcho.SessionId do
  @doc "Generate a session ID for a given context type"
  
  def for_conversation(agent_id) do
    "conv-#{agent_id}-#{short_uuid()}"
  end
  
  def for_campaign(campaign_name) do
    slug = Slug.slugify(campaign_name)
    "camp-#{slug}-#{short_uuid()}"
  end
  
  def for_project(project_slug) do
    "proj-#{project_slug}"
  end
  
  def for_app_session do
    date = Date.utc_today() |> Date.to_iso8601()
    "app-#{date}-#{System.unique_integer([:positive])}"
  end
  
  defp short_uuid, do: :crypto.strong_rand_bytes(6) |> Base.url_encode64(padding: false)
end
```

### Session Inheritance Rules

```
Decision: Does a sub-agent share its parent's session?

Campaign spawns sub-agent?
├── YES: Sub-agent gets its OWN session (conv-{sub_agent_id}-...)
│         BUT the campaign session ID is stored as metadata
│         so Honcho can reason across the campaign's full context
│
└── Why? Session isolation prevents sub-agent noise from polluting
          the parent campaign's conversation history. Honcho's
          cross-session peer reasoning still connects them.

Project context?
├── ALL sessions within a project reference the same proj-{slug} session
│   Messages about project decisions, files changed, etc. go here
│
└── This is the "institutional memory" — persists across campaigns
```

### Session Lifecycle

```
Created ──► Active ──► Idle (no messages for 1hr) ──► Archived (24hr idle)
                                                           │
                                                      Still queryable
                                                      No new messages
                                                      Reasoning preserved
```

**Cleanup policy:** Archived sessions are never deleted. Honcho's reasoning about peers persists regardless of session state. Storage is cheap; reasoning is expensive. Keep everything.

### Session Manager

```elixir
defmodule Ema.Honcho.SessionManager do
  @moduledoc """
  Manages Honcho session lifecycle for EMA.
  Maps EMA contexts (agents, campaigns, projects) to Honcho sessions.
  """
  use GenServer

  # State: %{ema_context_id => honcho_session_id}
  
  def get_or_create_session(context_type, context_id, peer_ids) do
    GenServer.call(__MODULE__, {:get_or_create, context_type, context_id, peer_ids})
  end

  def record_interaction(context_type, context_id, peer_id, content) do
    session_id = get_or_create_session(context_type, context_id, [peer_id])
    Ema.Honcho.Client.add_message(session_id, peer_id, content)
  end

  @impl true
  def handle_call({:get_or_create, type, id, peer_ids}, _from, state) do
    key = "#{type}:#{id}"
    case Map.get(state, key) do
      nil ->
        session_id = generate_session_id(type, id)
        Ema.Honcho.Client.create_session(session_id, peer_ids)
        {:reply, session_id, Map.put(state, key, session_id)}
      existing ->
        {:reply, existing, state}
    end
  end

  defp generate_session_id(:conversation, agent_id),
    do: Ema.Honcho.SessionId.for_conversation(agent_id)
  defp generate_session_id(:campaign, name),
    do: Ema.Honcho.SessionId.for_campaign(name)
  defp generate_session_id(:project, slug),
    do: Ema.Honcho.SessionId.for_project(slug)
  defp generate_session_id(:app, _),
    do: Ema.Honcho.SessionId.for_app_session()
end
```

---

## 4. User Modeling

### Signals Fed to Honcho

EMA captures the following signals and writes them as messages to Honcho sessions:

| Signal Category | What's Captured | Honcho Session | Peer |
|---|---|---|---|
| **Task Completion** | Task description, duration, outcome (success/partial/fail), files touched | `proj-{slug}` | `trajan` |
| **Proposal Decisions** | Proposal content, approve/reject/modify, time-to-decide, reason if given | `proj-{slug}` | `trajan` |
| **Agent Preferences** | Which agents succeed on which tasks, explicit feedback ("that was good/bad") | `app-{date}-*` | `trajan` |
| **Communication Style** | Message length preferences, detail level, format preferences (inferred) | `app-{date}-*` | `trajan` |
| **Scope Behavior** | Scope expansions approved vs denied, typical scope sizes preferred | `proj-{slug}` | `trajan` |
| **Time Patterns** | Active hours, response latency, batch vs interactive work style | `app-{date}-*` | `trajan` |

### Signal Ingestion Module

```elixir
defmodule Ema.Honcho.UserSignals do
  @moduledoc "Captures user behavior signals and feeds them to Honcho"

  alias Ema.Honcho.{Client, SessionManager}

  def record_task_completion(project, task_desc, outcome, metadata) do
    session = SessionManager.get_or_create_session(:project, project, ["trajan"])
    
    Client.add_message(session, "ema-system", """
    [TASK_COMPLETED]
    Task: #{task_desc}
    Outcome: #{outcome}
    Duration: #{metadata.duration_minutes} minutes
    Tokens used: #{metadata.tokens_used}
    Files modified: #{Enum.join(metadata.files, ", ")}
    Stayed in scope: #{metadata.in_scope?}
    """)
  end

  def record_proposal_decision(project, proposal, decision, reason \\ nil) do
    session = SessionManager.get_or_create_session(:project, project, ["trajan"])
    
    Client.add_message(session, "trajan", """
    [PROPOSAL_DECISION]
    Proposal: #{proposal.summary}
    Decision: #{decision}
    #{if reason, do: "Reason: #{reason}", else: ""}
    Time to decide: #{proposal.decision_time_seconds}s
    """)
  end

  def record_agent_feedback(agent_id, task_desc, rating, comment \\ nil) do
    session = SessionManager.get_or_create_session(:app, "feedback", ["trajan"])
    
    Client.add_message(session, "trajan", """
    [AGENT_FEEDBACK]
    Agent: #{agent_id}
    Task: #{task_desc}
    Rating: #{rating}/5
    #{if comment, do: "Comment: #{comment}", else: ""}
    """)
  end
end
```

### Consuming the User Model

Honcho's reasoning runs asynchronously in the Deriver. Once enough signals accumulate, EMA queries the user model via the `chat` endpoint:

```elixir
defmodule Ema.Honcho.UserModel do
  alias Ema.Honcho.Client

  @doc "Get user preferences for agent prompt enrichment"
  def get_prompt_context(peer_id \\ "trajan") do
    with {:ok, style} <- Client.chat_about_peer(peer_id,
           "What communication style does this user prefer? Be concise."),
         {:ok, prefs} <- Client.chat_about_peer(peer_id,
           "What are this user's key preferences for code quality, agent behavior, and task scope?") do
      {:ok, %{
        style_guidance: style,
        preference_summary: prefs
      }}
    end
  end

  @doc "Score a proposal based on user's historical approval patterns"  
  def score_proposal_fit(peer_id \\ "trajan", proposal_summary) do
    Client.chat_about_peer(peer_id, """
    Based on this user's history of approving and rejecting proposals,
    how likely are they to approve this proposal? Rate 1-10 and explain.
    
    Proposal: #{proposal_summary}
    """)
  end

  @doc "Get preferred alert routing for this user"
  def get_alert_preferences(peer_id \\ "trajan") do
    Client.chat_about_peer(peer_id, """
    Based on this user's interaction patterns, when should they be interrupted
    vs when should things queue? What severity level warrants immediate notification?
    """)
  end
end
```

### Agent Prompt Enrichment Flow

```
Agent receives task
      │
      ▼
Ema.Honcho.UserModel.get_prompt_context("trajan")
      │
      ▼
Returns: %{style_guidance: "Prefers concise, direct communication...",
           preference_summary: "Values working code over perfect code..."}
      │
      ▼
Injected into agent system prompt:
  "User context: #{style_guidance}\n#{preference_summary}"
      │
      ▼
Agent executes with personalized behavior
```

---

## 5. Scope Advisor System

### 5a. Scope Definition Language

```elixir
defmodule Ema.Scope do
  @moduledoc """
  Defines the boundaries of a task before dispatch.
  The Scope Advisor generates this; the Scope Monitor enforces it.
  """

  @type risk_level :: :low | :medium | :high | :critical

  @type t :: %__MODULE__{
    id: String.t(),
    project: String.t(),
    intent: String.t(),
    intent_hash: String.t(),           # Fingerprint for drift detection
    allowed_files: [String.t()],       # Glob patterns
    allowed_actions: [atom()],         # Whitelist of permitted action types
    forbidden_actions: [atom()],       # Explicit blacklist (overrides allowed)
    max_duration_minutes: pos_integer(),
    max_tokens: pos_integer(),
    max_files_modified: pos_integer(),
    max_new_files: pos_integer(),
    risk_level: risk_level(),
    expansion_requires: :auto | :human_approval | :proposal,
    created_at: DateTime.t(),
    expires_at: DateTime.t()
  }

  defstruct [
    :id, :project, :intent, :intent_hash,
    allowed_files: ["**/*"],
    allowed_actions: [:read, :edit, :create, :test, :build],
    forbidden_actions: [],
    max_duration_minutes: 30,
    max_tokens: 50_000,
    max_files_modified: 10,
    max_new_files: 3,
    risk_level: :medium,
    expansion_requires: :human_approval,
    created_at: nil,
    expires_at: nil
  ]
end
```

### Scope Examples

```elixir
# LOW RISK — Bug fix in a known area
%Ema.Scope{
  id: "scope-abc123",
  project: "wilson-premier",
  intent: "Fix the authentication redirect bug",
  allowed_files: ["lib/auth/**", "test/auth/**", "lib/wilson_premier_web/controllers/auth_*"],
  forbidden_actions: [:modify_database_schema, :add_dependency, :create_migration],
  max_duration_minutes: 30,
  max_tokens: 50_000,
  max_files_modified: 5,
  max_new_files: 1,
  risk_level: :low,
  expansion_requires: :auto  # Can expand to adjacent auth files without asking
}

# HIGH RISK — Feature implementation
%Ema.Scope{
  id: "scope-def456",
  project: "wilson-premier",
  intent: "Add OAuth2 Google login support",
  allowed_files: ["lib/auth/**", "lib/wilson_premier_web/**", "test/**", "config/**"],
  forbidden_actions: [:drop_table, :delete_migration],
  max_duration_minutes: 120,
  max_tokens: 200_000,
  max_files_modified: 20,
  max_new_files: 10,
  risk_level: :high,
  expansion_requires: :human_approval
}

# CRITICAL — Infrastructure change
%Ema.Scope{
  id: "scope-ghi789",
  project: "ema",
  intent: "Upgrade Ecto from 3.x to 4.x",
  allowed_files: ["mix.exs", "mix.lock", "lib/**", "test/**", "config/**"],
  forbidden_actions: [:drop_table],
  max_duration_minutes: 180,
  max_tokens: 500_000,
  max_files_modified: 50,
  max_new_files: 5,
  risk_level: :critical,
  expansion_requires: :proposal  # Must go through full proposal/deliberation gate
}
```

### 5b. Scope Advisor Decision Tree

The Scope Advisor analyzes a task description + project context and generates the scope definition automatically.

```
INPUT: task_description + project_context
                    │
                    ▼
            ┌─────────────┐
            │ Parse Intent │
            │  (LLM call)  │
            └──────┬──────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Classify Task Type            │
    │                              │
    │  bug_fix     → low base risk │
    │  feature     → medium        │
    │  refactor    → high          │
    │  infra       → critical      │
    │  docs        → low           │
    │  dependency  → high          │
    │  migration   → critical      │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ Apply Risk Modifiers          │
    │                              │
    │  +1 if touches DB schema     │
    │  +1 if modifies auth/security│
    │  +1 if changes dependencies  │
    │  +1 if > 10 files estimated  │
    │  +1 if no test coverage      │
    │  -1 if test-only changes     │
    │  -1 if docs-only changes     │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ Compute Risk Score            │
    │                              │
    │  0-1  → :low                 │
    │  2-3  → :medium              │
    │  4-5  → :high                │
    │  6+   → :critical            │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ Generate Scope Definition     │
    │                              │
    │  File patterns from intent   │
    │  Token budget from risk      │
    │  Duration from complexity    │
    │  Expansion policy from risk  │
    └──────────────────────────────┘
               │
               ▼
         OUTPUT: %Ema.Scope{}
```

### Risk Level → Scope Parameters Mapping

| Risk Level | Max Duration | Max Tokens | Max Files Modified | Max New Files | Expansion Policy |
|---|---|---|---|---|---|
| `:low` | 30 min | 50K | 5 | 1 | `:auto` |
| `:medium` | 60 min | 100K | 10 | 3 | `:human_approval` |
| `:high` | 120 min | 200K | 20 | 10 | `:human_approval` |
| `:critical` | 180 min | 500K | 50 | 5 | `:proposal` |

### Scope Advisor Module

```elixir
defmodule Ema.ScopeAdvisor do
  @moduledoc """
  Generates scope definitions for tasks before dispatch.
  Uses LLM for intent parsing + rule-based risk scoring.
  """

  alias Ema.{Scope, Bridge}

  @risk_modifiers %{
    touches_schema: 1,
    touches_auth: 1,
    changes_dependencies: 1,
    many_files: 1,
    no_tests: 1,
    test_only: -1,
    docs_only: -1
  }

  @doc "Generate a scope definition for a task"
  def advise(task_description, project_context) do
    with {:ok, intent} <- parse_intent(task_description),
         {:ok, classification} <- classify_task(intent, project_context),
         risk_score <- compute_risk(classification, project_context),
         risk_level <- risk_score_to_level(risk_score) do
      scope = %Scope{
        id: "scope-#{:crypto.strong_rand_bytes(8) |> Base.url_encode64(padding: false)}",
        project: project_context.project_slug,
        intent: task_description,
        intent_hash: :crypto.hash(:sha256, task_description) |> Base.encode16(case: :lower),
        allowed_files: classification.file_patterns,
        forbidden_actions: classification.forbidden_actions,
        max_duration_minutes: duration_for(risk_level),
        max_tokens: token_budget_for(risk_level),
        max_files_modified: max_files_for(risk_level),
        max_new_files: max_new_files_for(risk_level),
        risk_level: risk_level,
        expansion_requires: expansion_policy_for(risk_level),
        created_at: DateTime.utc_now(),
        expires_at: DateTime.utc_now() |> DateTime.add(duration_for(risk_level) * 60, :second)
      }

      {:ok, scope}
    end
  end

  defp parse_intent(task_description) do
    # LLM call to extract structured intent
    prompt = """
    Analyze this task and extract:
    1. Primary action (bug_fix | feature | refactor | infra | docs | dependency | migration)
    2. Affected file patterns (glob format)
    3. Potentially dangerous actions
    4. Estimated file count
    
    Task: #{task_description}
    
    Respond as JSON.
    """
    Bridge.quick_llm_call(prompt)
  end

  defp classify_task(intent, _project_context) do
    {:ok, %{
      task_type: intent.primary_action,
      file_patterns: intent.file_patterns,
      forbidden_actions: intent.dangerous_actions,
      estimated_files: intent.estimated_file_count
    }}
  end

  defp compute_risk(classification, project_context) do
    base = case classification.task_type do
      :bug_fix -> 0
      :docs -> 0
      :feature -> 2
      :refactor -> 3
      :dependency -> 3
      :infra -> 4
      :migration -> 5
    end

    modifiers = [
      if(touches_schema?(classification), do: @risk_modifiers.touches_schema, else: 0),
      if(touches_auth?(classification), do: @risk_modifiers.touches_auth, else: 0),
      if(changes_deps?(classification), do: @risk_modifiers.changes_dependencies, else: 0),
      if(classification.estimated_files > 10, do: @risk_modifiers.many_files, else: 0),
      if(test_only?(classification), do: @risk_modifiers.test_only, else: 0),
      if(docs_only?(classification), do: @risk_modifiers.docs_only, else: 0)
    ]

    max(0, base + Enum.sum(modifiers))
  end

  defp risk_score_to_level(score) when score <= 1, do: :low
  defp risk_score_to_level(score) when score <= 3, do: :medium
  defp risk_score_to_level(score) when score <= 5, do: :high
  defp risk_score_to_level(_score), do: :critical

  # Parameter lookups
  defp duration_for(:low), do: 30
  defp duration_for(:medium), do: 60
  defp duration_for(:high), do: 120
  defp duration_for(:critical), do: 180

  defp token_budget_for(:low), do: 50_000
  defp token_budget_for(:medium), do: 100_000
  defp token_budget_for(:high), do: 200_000
  defp token_budget_for(:critical), do: 500_000

  defp max_files_for(:low), do: 5
  defp max_files_for(:medium), do: 10
  defp max_files_for(:high), do: 20
  defp max_files_for(:critical), do: 50

  defp max_new_files_for(:low), do: 1
  defp max_new_files_for(:medium), do: 3
  defp max_new_files_for(:high), do: 10
  defp max_new_files_for(:critical), do: 5  # Fewer new files for infra — modify existing

  defp expansion_policy_for(:low), do: :auto
  defp expansion_policy_for(:medium), do: :human_approval
  defp expansion_policy_for(:high), do: :human_approval
  defp expansion_policy_for(:critical), do: :proposal

  # Detection helpers
  defp touches_schema?(c), do: Enum.any?(c.file_patterns, &String.contains?(&1, "migration"))
  defp touches_auth?(c), do: Enum.any?(c.file_patterns, &String.contains?(&1, "auth"))
  defp changes_deps?(c), do: Enum.any?(c.file_patterns, &(&1 in ["mix.exs", "package.json"]))
  defp test_only?(c), do: Enum.all?(c.file_patterns, &String.starts_with?(&1, "test/"))
  defp docs_only?(c), do: Enum.all?(c.file_patterns, &String.ends_with?(&1, ".md"))
end
```

### 5c. Scope Monitoring

The Scope Monitor runs as a Pipe listener, receiving events from agent execution and checking them against the active scope.

```elixir
defmodule Ema.ScopeMonitor do
  @moduledoc """
  Monitors agent execution against scope boundaries.
  Subscribes to Pipes events and flags violations in real-time.
  """

  use GenServer
  require Logger

  alias Ema.{Scope, Pipes}

  defmodule Violation do
    @type severity :: :warning | :error | :critical
    
    defstruct [:scope_id, :agent_id, :severity, :type, :detail, :timestamp, :auto_rollback?]
  end

  # ── Monitoring Checks ──────────────────────────

  @doc "Check if a file modification is within scope"
  def check_file(scope, file_path) do
    cond do
      matches_any_pattern?(file_path, scope.allowed_files) ->
        :ok

      is_test_file?(file_path) ->
        :ok  # Tests are always allowed

      true ->
        {:violation, %Violation{
          scope_id: scope.id,
          severity: :warning,
          type: :file_outside_scope,
          detail: "Modified file outside scope: #{file_path}",
          timestamp: DateTime.utc_now(),
          auto_rollback?: false
        }}
    end
  end

  @doc "Check if an action is permitted"
  def check_action(scope, action) do
    cond do
      action in scope.forbidden_actions ->
        {:violation, %Violation{
          scope_id: scope.id,
          severity: :error,
          type: :forbidden_action,
          detail: "Attempted forbidden action: #{action}",
          timestamp: DateTime.utc_now(),
          auto_rollback?: true
        }}

      scope.allowed_actions != [] and action not in scope.allowed_actions ->
        {:violation, %Violation{
          scope_id: scope.id,
          severity: :warning,
          type: :unlisted_action,
          detail: "Action not in allowed list: #{action}",
          timestamp: DateTime.utc_now(),
          auto_rollback?: false
        }}

      true ->
        :ok
    end
  end

  @doc "Check token budget"
  def check_tokens(scope, tokens_used) do
    percentage = tokens_used / scope.max_tokens * 100

    cond do
      percentage >= 100 ->
        {:violation, %Violation{
          scope_id: scope.id,
          severity: :error,
          type: :token_budget_exceeded,
          detail: "Token budget exhausted: #{tokens_used}/#{scope.max_tokens}",
          timestamp: DateTime.utc_now(),
          auto_rollback?: false
        }}

      percentage >= 80 ->
        {:violation, %Violation{
          scope_id: scope.id,
          severity: :warning,
          type: :token_budget_warning,
          detail: "Token budget at #{round(percentage)}%: #{tokens_used}/#{scope.max_tokens}",
          timestamp: DateTime.utc_now(),
          auto_rollback?: false
        }}

      true ->
        :ok
    end
  end

  @doc "Check duration"
  def check_duration(scope) do
    elapsed = DateTime.diff(DateTime.utc_now(), scope.created_at, :minute)

    cond do
      elapsed > scope.max_duration_minutes ->
        {:violation, %Violation{
          scope_id: scope.id,
          severity: :error,
          type: :duration_exceeded,
          detail: "Duration exceeded: #{elapsed}/#{scope.max_duration_minutes} minutes",
          timestamp: DateTime.utc_now(),
          auto_rollback?: false
        }}

      elapsed > scope.max_duration_minutes * 0.8 ->
        {:violation, %Violation{
          scope_id: scope.id,
          severity: :warning,
          type: :duration_warning,
          detail: "Duration at #{round(elapsed / scope.max_duration_minutes * 100)}%",
          timestamp: DateTime.utc_now(),
          auto_rollback?: false
        }}

      true ->
        :ok
    end
  end

  @doc "Check file count against limits"
  def check_file_counts(scope, modified_count, new_count) do
    violations = []

    violations =
      if modified_count > scope.max_files_modified do
        [%Violation{
          scope_id: scope.id,
          severity: :error,
          type: :too_many_files_modified,
          detail: "Modified #{modified_count} files (limit: #{scope.max_files_modified})",
          timestamp: DateTime.utc_now(),
          auto_rollback?: false
        } | violations]
      else
        violations
      end

    violations =
      if new_count > scope.max_new_files do
        [%Violation{
          scope_id: scope.id,
          severity: :warning,
          type: :too_many_new_files,
          detail: "Created #{new_count} files (limit: #{scope.max_new_files})",
          timestamp: DateTime.utc_now(),
          auto_rollback?: false
        } | violations]
      else
        violations
      end

    case violations do
      [] -> :ok
      list -> {:violations, list}
    end
  end

  # ── Pipe Event Handler ─────────────────────────

  def handle_pipe_event(%{type: :file_modified, path: path}, scope) do
    check_file(scope, path)
  end

  def handle_pipe_event(%{type: :action_executed, action: action}, scope) do
    check_action(scope, action)
  end

  def handle_pipe_event(%{type: :tokens_update, total: total}, scope) do
    check_tokens(scope, total)
  end

  def handle_pipe_event(%{type: :heartbeat}, scope) do
    check_duration(scope)
  end

  # ── Glob Matching ──────────────────────────────

  defp matches_any_pattern?(path, patterns) do
    Enum.any?(patterns, fn pattern ->
      PathGlob.match?(pattern, path)
    end)
  end

  defp is_test_file?(path) do
    String.starts_with?(path, "test/") or String.contains?(path, "_test.exs")
  end
end
```

### 5d. Scope Violation Handling

```
Violation Detected
       │
       ▼
  ┌─────────────┐
  │ Severity?    │
  └──────┬──────┘
         │
    ┌────┼────────────┐
    ▼    ▼            ▼
 :warning  :error   :critical
    │       │          │
    ▼       ▼          ▼
  Log &   Pause      Immediate
  Notify  Execution   Rollback
  Continue  │          │
    │       ▼          ▼
    │    Require     Kill agent
    │    human       process
    │    approval    Rollback
    │       │        all changes
    │    ┌──┼──┐     Notify user
    │    ▼     ▼       │
    │  Approve Deny    ▼
    │    │      │    Record
    │    ▼      ▼    reflexion
    │  Resume  Kill    
    │  (maybe   │     
    │  expand   ▼     
    │  scope) Record  
    │         reflexion
    ▼
  Accumulate
  (3 warnings → auto-pause)
```

**Violation severity rules:**

| Violation Type | Severity | Action |
|---|---|---|
| File outside scope (adjacent) | `:warning` | Log, notify, continue |
| File outside scope (unrelated) | `:error` | Pause, require approval |
| Forbidden action attempted | `:error` | Pause, require approval |
| Safety constraint violated | `:critical` | Kill + rollback |
| Token budget at 80% | `:warning` | Notify user |
| Token budget exhausted | `:error` | Pause, offer to extend |
| Duration at 80% | `:warning` | Notify user |
| Duration exceeded | `:error` | Pause, offer to extend |
| 3+ warnings accumulated | `:error` | Auto-escalate to pause |

**Automatic rollback triggers:**
- Any safety constraint violation (see §8)
- Forbidden action: `:modify_database_schema` when scope disallows it
- Forbidden action: `:delete_migration`
- Agent attempts to modify files in `~/.ssh/`, `~/.env`, credentials paths

### Scope Violation Handler

```elixir
defmodule Ema.ScopeViolationHandler do
  alias Ema.{ScopeMonitor.Violation, Pipes, Honcho}

  @warning_threshold 3  # Warnings before auto-escalation

  def handle(%Violation{severity: :warning} = v, state) do
    Logger.warning("Scope violation (warning): #{v.detail}")
    Pipes.emit(:scope_warning, v)
    
    warnings = Map.update(state.warnings, v.scope_id, 1, &(&1 + 1))
    
    if warnings[v.scope_id] >= @warning_threshold do
      handle(%{v | severity: :error}, %{state | warnings: warnings})
    else
      {:continue, %{state | warnings: warnings}}
    end
  end

  def handle(%Violation{severity: :error} = v, state) do
    Logger.error("Scope violation (error): #{v.detail}")
    Pipes.emit(:scope_error, v)
    
    if v.auto_rollback? do
      rollback_last_action(v)
    end
    
    # Pause agent execution
    Ema.AgentManager.pause(v.agent_id, reason: v.detail)
    
    # Request human approval
    Ema.UI.Notifications.scope_violation(v)
    
    {:paused, state}
  end

  def handle(%Violation{severity: :critical} = v, state) do
    Logger.error("CRITICAL scope violation: #{v.detail}")
    Pipes.emit(:scope_critical, v)
    
    # Kill agent immediately
    Ema.AgentManager.kill(v.agent_id)
    
    # Rollback all changes
    rollback_all_changes(v)
    
    # Record reflexion
    Honcho.Client.record_reflexion("agent-#{v.agent_id}", %{
      what_worked: "nothing — critical safety violation",
      what_failed: v.detail,
      lesson: "Task triggered safety constraint. Scope was insufficient.",
      task_context: v.scope_id
    })
    
    # Notify user urgently
    Ema.UI.Notifications.critical_violation(v)
    
    {:killed, state}
  end

  defp rollback_last_action(violation) do
    # Git-based rollback: revert last commit/change
    Logger.info("Rolling back last action for scope #{violation.scope_id}")
  end

  defp rollback_all_changes(violation) do
    # Git-based rollback: reset to pre-task state
    Logger.info("Rolling back ALL changes for scope #{violation.scope_id}")
  end
end
```

---

## 6. Reflexion Injection Points

### Reflexion Schema

```elixir
defmodule Ema.Reflexion do
  @type trigger :: :task_completed | :proposal_rejected | :agent_failure 
                 | :scope_violation | :budget_exceeded

  @type t :: %__MODULE__{
    trigger: trigger(),
    peer_id: String.t(),         # The agent or user being reflected on
    timestamp: DateTime.t(),
    task_context: String.t(),    # What was being done
    what_worked: String.t(),
    what_failed: String.t(),
    what_slowed: String.t(),
    lesson: String.t(),
    would_do_differently: String.t(),
    metrics: map()               # duration, tokens, files, etc.
  }

  defstruct [:trigger, :peer_id, :timestamp, :task_context,
             :what_worked, :what_failed, :what_slowed, 
             :lesson, :would_do_differently, :metrics]
end
```

### Injection Points

```
┌──────────────────────────────────────────────────────────────────┐
│                    EMA Task Lifecycle                             │
│                                                                  │
│  Task Created ──► Scope Defined ──► Agent Dispatched             │
│                                          │                       │
│                                          ▼                       │
│                                    Agent Executing               │
│                                     │    │    │                  │
│                                     ▼    ▼    ▼                  │
│                                  success fail scope_violation    │
│                                     │    │    │                  │
│                    ┌────────────────┘    │    └──────────┐       │
│                    ▼                     ▼               ▼       │
│             ◆ REFLEXION 1         ◆ REFLEXION 2    ◆ REFLEXION 3 │
│             Task Completed        Agent Failure    Scope Creep   │
│                                                                  │
│  Proposal Submitted ──► User Decides                             │
│                              │                                   │
│                         ┌────┼────┐                              │
│                         ▼         ▼                              │
│                      Approved   Rejected                         │
│                         │         │                              │
│                         ▼         ▼                              │
│                    (no action)  ◆ REFLEXION 4                    │
│                                Proposal Rejected                 │
└──────────────────────────────────────────────────────────────────┘
```

### Reflexion Templates

```elixir
defmodule Ema.Reflexion.Templates do
  @doc "Generate reflexion after successful task completion"
  def task_completed(agent_id, task, metrics) do
    %Ema.Reflexion{
      trigger: :task_completed,
      peer_id: "agent-#{agent_id}",
      timestamp: DateTime.utc_now(),
      task_context: task.description,
      what_worked: "Task completed successfully in #{metrics.duration_min} minutes",
      what_failed: if(metrics.scope_violations > 0,
        do: "#{metrics.scope_violations} scope warnings during execution",
        else: "No issues"),
      what_slowed: estimate_bottleneck(metrics),
      lesson: "#{task.type} tasks in #{task.project} typically take ~#{metrics.duration_min}min",
      would_do_differently: if(metrics.tokens_used > metrics.tokens_estimated * 1.5,
        do: "Token estimate was too low — adjust for #{task.type} tasks",
        else: "Estimate was accurate"),
      metrics: metrics
    }
  end

  def proposal_rejected(agent_id, proposal, rejection_reason) do
    %Ema.Reflexion{
      trigger: :proposal_rejected,
      peer_id: "agent-#{agent_id}",
      timestamp: DateTime.utc_now(),
      task_context: proposal.summary,
      what_worked: "Proposal was generated and presented",
      what_failed: "User rejected: #{rejection_reason || "no reason given"}",
      what_slowed: "n/a",
      lesson: "Proposals of type '#{proposal.type}' need: #{infer_quality_gap(rejection_reason)}",
      would_do_differently: "Check user preferences via Honcho before proposing",
      metrics: %{decision_time: proposal.decision_time_seconds}
    }
  end

  def agent_failure(agent_id, task, error) do
    %Ema.Reflexion{
      trigger: :agent_failure,
      peer_id: "agent-#{agent_id}",
      timestamp: DateTime.utc_now(),
      task_context: task.description,
      what_worked: "nothing — agent failed",
      what_failed: "Error: #{inspect(error)}",
      what_slowed: "n/a",
      lesson: "#{agent_id} cannot handle: #{task.type} — consider different agent or scope reduction",
      would_do_differently: "Pre-check agent capability before dispatch",
      metrics: %{error_type: classify_error(error)}
    }
  end

  def scope_violation(agent_id, scope, violation) do
    %Ema.Reflexion{
      trigger: :scope_violation,
      peer_id: "agent-#{agent_id}",
      timestamp: DateTime.utc_now(),
      task_context: scope.intent,
      what_worked: "Scope monitoring caught the violation",
      what_failed: "Agent drifted: #{violation.detail}",
      what_slowed: "n/a",
      lesson: "Scope for '#{scope.intent}' was too narrow or agent needs tighter constraints",
      would_do_differently: "Widen allowed_files or add explicit constraint in agent prompt",
      metrics: %{violation_type: violation.type, severity: violation.severity}
    }
  end

  defp estimate_bottleneck(metrics) do
    cond do
      metrics.tokens_used > metrics.tokens_estimated * 2 -> "Token usage 2x estimate — task was harder than expected"
      metrics.scope_violations > 2 -> "Multiple scope violations — scope definition was too narrow"
      metrics.duration_min > metrics.estimated_duration_min * 1.5 -> "Took 50%+ longer than estimated"
      true -> "Nothing significant"
    end
  end

  defp infer_quality_gap(nil), do: "unknown — ask user for feedback"
  defp infer_quality_gap(reason), do: reason

  defp classify_error(%{type: type}), do: type
  defp classify_error(_), do: :unknown
end
```

### Reflexion Worker (Background Process)

```elixir
defmodule Ema.Honcho.ReflexionWorker do
  @moduledoc """
  Buffers reflexion events and writes them to Honcho in batches.
  Avoids hammering the API with individual reflexion writes.
  """
  use GenServer

  @flush_interval_ms 30_000  # Flush every 30 seconds
  @max_buffer_size 10        # Or when buffer hits 10 items

  def record(reflexion) do
    GenServer.cast(__MODULE__, {:record, reflexion})
  end

  @impl true
  def init(_) do
    schedule_flush()
    {:ok, %{buffer: []}}
  end

  @impl true
  def handle_cast({:record, reflexion}, %{buffer: buffer} = state) do
    buffer = [reflexion | buffer]
    if length(buffer) >= @max_buffer_size do
      flush(buffer)
      {:noreply, %{state | buffer: []}}
    else
      {:noreply, %{state | buffer: buffer}}
    end
  end

  @impl true
  def handle_info(:flush, %{buffer: []} = state) do
    schedule_flush()
    {:noreply, state}
  end
  def handle_info(:flush, %{buffer: buffer} = state) do
    flush(buffer)
    schedule_flush()
    {:noreply, %{state | buffer: []}}
  end

  defp flush(reflexions) do
    Enum.each(reflexions, fn r ->
      Ema.Honcho.Client.record_reflexion(r.peer_id, r)
    end)
  end

  defp schedule_flush do
    Process.send_after(self(), :flush, @flush_interval_ms)
  end
end
```

---

## 7. Token Budget Management

### Budget Hierarchy

```
System Budget (monthly)
├── Per-Project Budget (monthly)
│   ├── Per-Campaign Budget (campaign lifetime)
│   │   └── Per-Task Budget (task lifetime)
│   └── Ad-hoc tasks
└── System overhead (reflexion, user modeling, etc.)
```

### Budget Configuration

```elixir
defmodule Ema.TokenBudget do
  @type t :: %__MODULE__{
    system_monthly_limit: pos_integer(),
    system_daily_limit: pos_integer(),
    per_project_monthly: pos_integer(),
    overhead_reserve_pct: float(),  # Reserve for reflexion/modeling
    current_usage: %{
      monthly: pos_integer(),
      daily: pos_integer(),
      by_project: %{String.t() => pos_integer()}
    }
  }

  defstruct [
    system_monthly_limit: 10_000_000,    # 10M tokens/month
    system_daily_limit: 500_000,          # 500K tokens/day
    per_project_monthly: 2_000_000,       # 2M tokens/project/month
    overhead_reserve_pct: 0.10,           # 10% for Honcho + reflexion
    current_usage: %{monthly: 0, daily: 0, by_project: %{}}
  ]

  @doc "Check if a task can be dispatched within budget"
  def can_dispatch?(%__MODULE__{} = budget, project, estimated_tokens) do
    available_daily = budget.system_daily_limit - budget.current_usage.daily
    available_monthly = budget.system_monthly_limit - budget.current_usage.monthly
    project_used = Map.get(budget.current_usage.by_project, project, 0)
    available_project = budget.per_project_monthly - project_used

    available = min(available_daily, min(available_monthly, available_project))

    cond do
      available <= 0 ->
        {:denied, :budget_exhausted, available}

      estimated_tokens > available ->
        {:denied, :insufficient_budget,
         %{requested: estimated_tokens, available: available}}

      estimated_tokens > available * 0.5 ->
        {:warning, :large_task,
         %{requested: estimated_tokens, remaining_after: available - estimated_tokens}}

      true ->
        {:ok, %{remaining_after: available - estimated_tokens}}
    end
  end
end
```

### Budget Exhaustion Handling

| Budget State | Behavior |
|---|---|
| **> 50% remaining** | Normal operation |
| **20-50% remaining** | Warning in UI, suggest scope reduction for new tasks |
| **5-20% remaining** | Graceful degradation: disable reflexion writing, disable user model queries, core tasks only |
| **< 5% remaining** | Hard stop: reject new tasks, allow only in-progress tasks to finish |
| **0% remaining** | Kill all running tasks, notify user, wait for next budget period |

### Budget Reporting (EMA UI)

```
┌─────────────────────────────────────────────┐
│ Token Budget                          ⚙️     │
├─────────────────────────────────────────────┤
│                                             │
│  Daily:    ████████████░░░░  312K / 500K    │
│  Monthly:  ██████░░░░░░░░░░  4.2M / 10M    │
│                                             │
│  By Project:                                │
│  wilson-premier  ██████████░░  1.8M / 2M ⚠️ │
│  ema             ████░░░░░░░░  800K / 2M    │
│  personal        ██░░░░░░░░░░  400K / 2M    │
│                                             │
│  Overhead (reflexion/modeling): 180K (4.2%) │
│                                             │
│  Recent: fix auth bug ............ 12K ✓    │
│          add OAuth support ....... 85K ✓    │
│          refactor user model ..... 42K ⏳    │
└─────────────────────────────────────────────┘
```

This maps to a React component in the Tauri app sidebar or a dedicated dashboard page.

---

## 8. Safety Constraints

### Always-Forbidden Actions (Global Blacklist)

These are enforced regardless of scope, risk level, or trust level:

```elixir
defmodule Ema.Safety do
  @moduledoc "Global safety constraints. These NEVER get bypassed."

  @always_forbidden [
    # Destructive file operations
    {:shell_pattern, ~r/rm\s+(-[rf]+\s+)?\/(?!tmp)/},           # rm -rf outside /tmp
    {:shell_pattern, ~r/rm\s+-[rf]*\s+~\//},                     # rm -rf in home dir
    {:shell_pattern, ~r/mkfs\./},                                  # Filesystem format
    {:shell_pattern, ~r/dd\s+if=.*of=\/dev/},                     # Raw disk write

    # Credential/secret exfiltration
    {:file_access, ~r/\.(env|pem|key|secret|credentials)/},
    {:file_access, ~r/~\/\.ssh\//},
    {:file_access, ~r/\/etc\/shadow/},
    {:shell_pattern, ~r/curl.*\|\s*sh/},                          # Pipe to shell
    {:shell_pattern, ~r/base64.*\|\s*(sh|bash)/},                 # Encoded execution

    # Database destruction
    {:sql_pattern, ~r/DROP\s+(DATABASE|TABLE|SCHEMA)/i},
    {:sql_pattern, ~r/TRUNCATE\s+TABLE/i},
    {:sql_pattern, ~r/DELETE\s+FROM\s+\w+\s*;/i},                # Unbounded DELETE

    # External communication without permission
    {:shell_pattern, ~r/curl\s+.*(-X\s+POST|--data)/},           # HTTP POST out
    {:shell_pattern, ~r/wget\s+/},                                 # Downloads
    {:shell_pattern, ~r/nc\s+-/},                                  # Netcat
    {:shell_pattern, ~r/ssh\s+(?!localhost)/},                     # SSH out (except localhost)

    # System-level dangerous
    {:shell_pattern, ~r/systemctl\s+(stop|disable)\s+(sshd|docker|postgresql)/},
    {:shell_pattern, ~r/iptables.*DROP/},
    {:shell_pattern, ~r/chmod\s+777/},
    {:shell_pattern, ~r/chown\s+root/}
  ]

  @doc "Check if a command or action violates safety constraints"
  def check(command) when is_binary(command) do
    violation = Enum.find(@always_forbidden, fn
      {:shell_pattern, regex} -> Regex.match?(regex, command)
      {:file_access, regex} -> Regex.match?(regex, command)
      {:sql_pattern, regex} -> Regex.match?(regex, command)
    end)

    case violation do
      nil -> :ok
      {type, pattern} ->
        {:violation, %{
          type: type,
          pattern: inspect(pattern),
          command: command,
          severity: :critical
        }}
    end
  end
end
```

### Enforcement Layers

Safety is enforced at **three layers** — defense in depth:

```
Layer 1: Pre-execution (Prompt Injection)
  Agent system prompt includes safety constraints.
  "You MUST NOT execute: [list of forbidden patterns]"
  → Weakest layer. LLMs can be jailbroken.

Layer 2: Execution Gateway (Real-time Check)
  Before Bridge.execute_command/1 runs any shell command,
  Ema.Safety.check/1 validates it.
  → Primary enforcement. Hard block before execution.

Layer 3: Post-execution Audit (Scope Monitor)
  After execution, diff analysis catches anything that slipped through.
  File changes, new processes, network connections audited.
  → Catches edge cases and novel attack vectors.
```

### Trust Levels

| Trust Level | Description | Capabilities | Safety Constraints |
|---|---|---|---|
| **`:sandbox`** | New/untested agent | Read-only + write to designated output dir | All forbidden + no shell access + no network |
| **`:standard`** | Verified agent (5+ successful tasks) | Read + write within scope + shell within scope | All forbidden + scope enforcement |
| **`:elevated`** | Trusted agent (20+ tasks, 90%+ success) | Read + write + shell + limited external API | All forbidden, but external API allowed with logging |
| **`:admin`** | Human-operated only | Full access | All forbidden still apply, but can be overridden per-action |

```elixir
defmodule Ema.Safety.TrustLevel do
  def capabilities(:sandbox), do: [:read_files]
  def capabilities(:standard), do: [:read_files, :write_files, :shell_scoped, :test, :build]
  def capabilities(:elevated), do: [:read_files, :write_files, :shell, :external_api_logged, :test, :build]
  def capabilities(:admin), do: [:all]

  def minimum_for_action(:shell), do: :standard
  def minimum_for_action(:external_api), do: :elevated
  def minimum_for_action(:modify_config), do: :elevated
  def minimum_for_action(:override_safety), do: :admin
end
```

---

## 9. Honcho + Scope Advisor Integration Points

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       EMA Task Lifecycle                             │
│                                                                     │
│  1. TASK RECEIVED                                                   │
│     │                                                               │
│     ▼                                                               │
│  2. PRE-DISPATCH ─────────────────────────────────────────────┐     │
│     │                                                         │     │
│     ├─► ScopeAdvisor.advise(task, project)                    │     │
│     │       → generates %Scope{}                              │     │
│     │                                                         │     │
│     ├─► Honcho.UserModel.get_prompt_context("trajan")         │     │
│     │       → user preferences for agent prompt enrichment    │     │
│     │                                                         │     │
│     ├─► Honcho.UserModel.score_proposal_fit(task_summary)     │     │
│     │       → risk adjustment based on user patterns          │     │
│     │                                                         │     │
│     └─► TokenBudget.can_dispatch?(project, estimated_tokens)  │     │
│             → budget check                                    │     │
│                                                               │     │
│  3. AGENT DISPATCHED (with scope + user context)              │     │
│     │                                                         │     │
│     ▼                                                         │     │
│  4. DURING EXECUTION ─── Pipes Events ──────────────┐        │     │
│     │                                                │        │     │
│     │  file_modified ──► ScopeMonitor.check_file()   │        │     │
│     │  action_exec   ──► ScopeMonitor.check_action() │        │     │
│     │  tokens_update ──► ScopeMonitor.check_tokens() │        │     │
│     │  heartbeat     ──► ScopeMonitor.check_duration()│       │     │
│     │                                                │        │     │
│     │  violation? ──► ViolationHandler.handle()      │        │     │
│     │                                                │        │     │
│  5. POST-COMPLETION ──────────────────────────────────┘       │     │
│     │                                                         │     │
│     ├─► Reflexion.Templates.task_completed()                  │     │
│     │       → writes reflexion to Honcho                      │     │
│     │                                                         │     │
│     ├─► Honcho.UserSignals.record_task_completion()           │     │
│     │       → feeds user model                                │     │
│     │                                                         │     │
│     ├─► TokenBudget.record_usage(project, actual_tokens)      │     │
│     │       → updates budget tracking                         │     │
│     │                                                         │     │
│     └─► ScopeReport.generate(scope, execution_log)            │     │
│             → scope compliance report                         │     │
│                                                               │     │
└─────────────────────────────────────────────────────────────────────┘
```

### Dashboard: Scope Health Widget

```
┌─────────────────────────────────────────────┐
│ Scope Health (Last 30 days)           ⚙️     │
├─────────────────────────────────────────────┤
│                                             │
│  Tasks in scope:      87%  ████████████░░   │
│  Tasks with warnings: 10%  ██░░░░░░░░░░░░  │
│  Tasks paused/killed:  3%  █░░░░░░░░░░░░░  │
│                                             │
│  Avg scope accuracy:  92%                   │
│  (how well ScopeAdvisor predicts needs)     │
│                                             │
│  Top violation types:                       │
│  1. file_outside_scope ............ 12      │
│  2. token_budget_warning .......... 8       │
│  3. duration_warning .............. 5       │
│                                             │
│  Reflexion insights:                        │
│  • Agent "coder" frequently needs auth/**   │
│    → Consider widening default scope        │
│  • Token estimates consistently 30% low     │
│    → Adjust estimation multiplier           │
│                                             │
└─────────────────────────────────────────────┘
```

### Scope Report (per-task, stored in Honcho)

```elixir
defmodule Ema.ScopeReport do
  def generate(scope, execution_log) do
    %{
      scope_id: scope.id,
      project: scope.project,
      intent: scope.intent,
      risk_level: scope.risk_level,
      
      # Compliance
      stayed_in_scope: execution_log.violations == [],
      violations: length(execution_log.violations),
      violation_details: execution_log.violations,
      
      # Budget
      tokens_estimated: scope.max_tokens,
      tokens_actual: execution_log.tokens_used,
      token_accuracy: execution_log.tokens_used / scope.max_tokens,
      
      # Duration
      duration_estimated: scope.max_duration_minutes,
      duration_actual: execution_log.duration_minutes,
      
      # Files
      files_in_scope: execution_log.files_in_scope,
      files_outside_scope: execution_log.files_outside_scope,
      
      # Outcome
      task_outcome: execution_log.outcome,
      
      completed_at: DateTime.utc_now()
    }
  end
end
```

---

## 10. Production Config

### EMA Application Config

```elixir
# config/config.exs
config :ema, Ema.Honcho,
  base_url: "http://localhost:8000",
  workspace_id: "ema-dev",
  api_key: nil  # Not needed for local self-hosted

config :ema, Ema.ScopeAdvisor,
  enabled: true,
  default_risk_level: :medium,
  auto_expand_threshold: :low  # Only auto-expand for low-risk tasks

config :ema, Ema.TokenBudget,
  system_monthly_limit: 10_000_000,
  system_daily_limit: 500_000,
  per_project_monthly: 2_000_000,
  overhead_reserve_pct: 0.10

config :ema, Ema.Safety,
  trust_default: :standard,
  audit_log_path: "priv/audit/safety.log"
```

```elixir
# config/prod.exs
config :ema, Ema.Honcho,
  base_url: System.get_env("HONCHO_URL", "http://localhost:8000"),
  workspace_id: System.get_env("HONCHO_WORKSPACE", "ema-prod"),
  api_key: System.get_env("HONCHO_API_KEY")

config :ema, Ema.TokenBudget,
  system_monthly_limit: String.to_integer(System.get_env("TOKEN_MONTHLY_LIMIT", "10000000")),
  system_daily_limit: String.to_integer(System.get_env("TOKEN_DAILY_LIMIT", "500000"))
```

### Complete Docker Compose (EMA + Honcho Stack)

```yaml
# docker-compose.yml — Full EMA infrastructure stack
version: "3.8"

services:
  # ── Honcho Services ──────────────────────────

  honcho-api:
    image: ghcr.io/plastic-labs/honcho:latest
    container_name: ema-honcho-api
    entrypoint: ["sh", "docker/entrypoint.sh"]
    restart: unless-stopped
    depends_on:
      honcho-db:
        condition: service_healthy
      honcho-redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      - DB_CONNECTION_URI=postgresql+psycopg://honcho:${HONCHO_DB_PASSWORD:-honcho-secret}@honcho-db:5432/honcho
      - CACHE_URL=redis://honcho-redis:6379/0?suppress=true
      - LLM_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    env_file:
      - path: .env.honcho
        required: false
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - ema-net
    deploy:
      resources:
        limits:
          memory: 1G

  honcho-deriver:
    image: ghcr.io/plastic-labs/honcho:latest
    container_name: ema-honcho-deriver
    entrypoint: ["/app/.venv/bin/python", "-m", "src.deriver"]
    restart: unless-stopped
    depends_on:
      honcho-db:
        condition: service_healthy
      honcho-redis:
        condition: service_healthy
    environment:
      - DB_CONNECTION_URI=postgresql+psycopg://honcho:${HONCHO_DB_PASSWORD:-honcho-secret}@honcho-db:5432/honcho
      - CACHE_URL=redis://honcho-redis:6379/0?suppress=true
      - LLM_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - METRICS_ENABLED=true
    env_file:
      - path: .env.honcho
        required: false
    networks:
      - ema-net
    deploy:
      resources:
        limits:
          memory: 2G

  honcho-db:
    image: pgvector/pgvector:pg15
    container_name: ema-honcho-db
    restart: always
    command: ["postgres", "-c", "max_connections=200", "-c", "shared_buffers=256MB"]
    environment:
      - POSTGRES_DB=honcho
      - POSTGRES_USER=honcho
      - POSTGRES_PASSWORD=${HONCHO_DB_PASSWORD:-honcho-secret}
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - honcho-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U honcho -d honcho"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - ema-net

  honcho-redis:
    image: redis:8-alpine
    container_name: ema-honcho-redis
    restart: always
    command: ["redis-server", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru"]
    volumes:
      - honcho-redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - ema-net

volumes:
  honcho-pgdata:
    driver: local
  honcho-redis-data:
    driver: local

networks:
  ema-net:
    driver: bridge
```

### Startup Sequence

```bash
#!/bin/bash
# /opt/ema/scripts/start.sh

set -euo pipefail

echo "Starting EMA infrastructure..."

# 1. Start Honcho stack
docker compose -f docker-compose.yml up -d honcho-db honcho-redis
echo "Waiting for database..."
sleep 5

docker compose -f docker-compose.yml up -d honcho-api honcho-deriver
echo "Waiting for Honcho API..."

# 2. Health check loop
for i in {1..30}; do
  if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "Honcho API is healthy"
    break
  fi
  echo "Waiting for Honcho... ($i/30)"
  sleep 2
done

# 3. Start EMA daemon
cd /opt/ema && mix phx.server &

echo "EMA stack is running"
echo "  Honcho API: http://localhost:8000"
echo "  EMA Daemon: http://localhost:4488"
```

### Monitoring

Honcho's docker-compose template includes Prometheus + Grafana. For EMA, expose metrics:

```elixir
# In EMA's endpoint or a dedicated metrics plug:
defmodule Ema.Metrics do
  def scope_metrics do
    %{
      tasks_total: counter(:ema_tasks_total),
      tasks_in_scope: counter(:ema_tasks_in_scope),
      scope_violations: counter(:ema_scope_violations, [:severity]),
      token_usage: histogram(:ema_token_usage, [:project]),
      reflexions_recorded: counter(:ema_reflexions_total, [:trigger])
    }
  end
end
```

---

## Implementation Priority

| Phase | Component | Effort | Dependencies |
|---|---|---|---|
| **Phase 2a** | Docker Compose + Honcho deploy | 1 day | Docker on host |
| **Phase 2a** | `Ema.Honcho.Client` HTTP module | 2 days | Honcho running |
| **Phase 2a** | `Ema.Honcho.SessionManager` | 1 day | Client module |
| **Phase 2b** | `Ema.Scope` struct + `ScopeAdvisor` | 3 days | LLM access |
| **Phase 2b** | `Ema.ScopeMonitor` + Pipes integration | 2 days | Pipes system |
| **Phase 2b** | `Ema.ScopeViolationHandler` | 1 day | Monitor |
| **Phase 2c** | `Ema.Honcho.UserSignals` | 1 day | Client + Session |
| **Phase 2c** | `Ema.Honcho.UserModel` | 1 day | Signals + Deriver running |
| **Phase 2c** | Reflexion templates + worker | 1 day | Client |
| **Phase 2d** | Token budget management | 2 days | — |
| **Phase 2d** | Safety constraints module | 1 day | — |
| **Phase 2d** | Dashboard UI (React) | 3 days | All backend complete |

**Total estimated effort:** ~19 days for full implementation.

**Quick win (Day 1):** Docker compose up, Honcho running, Client module with health check. You can start feeding messages to Honcho immediately and let the Deriver build user representations while you build the rest of the system.

---

## Key Design Decisions

1. **PostgreSQL, not SQLite.** Honcho requires pgvector for embeddings + concurrent writes from API and Deriver. Non-negotiable.

2. **Honcho v3 data model.** Workspaces → Peers → Sessions → Messages. EMA maps cleanly: workspace = `ema-prod`, peers = users + agents, sessions = conversations/campaigns/projects.

3. **No Elixir SDK exists.** Built HTTP client using `Req`. Thin wrapper — Honcho's REST API is simple enough that a full SDK isn't needed.

4. **Scope is pre-computed, not emergent.** The Scope Advisor generates the scope BEFORE dispatch, not during. This is a hard constraint — scope creep prevention requires upfront boundaries.

5. **Three-layer safety.** Prompt injection (weak) → execution gateway (primary) → post-execution audit (backstop). No single point of failure.

6. **Reflexion is batched.** The ReflexionWorker buffers writes to avoid hammering Honcho's API. 30-second flush interval or 10-item buffer, whichever comes first.

7. **Budget is hierarchical.** System → project → campaign → task. Each level can be independently configured and monitored.

8. **Warnings accumulate.** Three scope warnings auto-escalate to an error/pause. This prevents death by a thousand cuts — gradual drift that stays technically within warning threshold.
