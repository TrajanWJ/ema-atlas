# EMA GitHub Integration — Complete Specification

> Bidirectional sync between EMA (Elixir/Phoenix + Tauri/React) and GitHub.
> Version: 1.0 | Status: Design Spec

---

## Table of Contents

1. [OAuth2 Flow](#1-oauth2-flow)
2. [Webhook Infrastructure](#2-webhook-infrastructure)
3. [Repo ↔ Project Linking](#3-repo--project-linking)
4. [Bidirectional Sync Flows](#4-bidirectional-sync-flows)
5. [API Rate Limit Management](#5-api-rate-limit-management)
6. [Database Schema](#6-database-schema)
7. [Elixir Module Structure](#7-elixir-module-structure)
8. [Auto-Proposal on PR Flow](#8-auto-proposal-on-pr-flow)
9. [Auto-Task on Deploy Failure](#9-auto-task-on-deploy-failure)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. OAuth2 Flow

### 1.1 GitHub App vs OAuth App Decision

**Recommendation: GitHub App** (not classic OAuth App).

| Concern | OAuth App | GitHub App |
|---|---|---|
| Rate limit | 5,000/hr shared across users | 5,000/hr per installation |
| Webhook registration | Manual per-repo | Automatic on install |
| Permissions | Broad scopes | Fine-grained per-resource |
| Token expiry | Never (classic) | 1hr installation tokens (auto-refresh) |
| Org install | Per-user | Per-org with repo selection |

GitHub Apps give us automatic webhook registration, better rate limits, and granular permissions. The trade-off is slightly more complex token management (installation tokens expire hourly), but we need a token refresh flow anyway for fine-grained PATs.

### 1.2 GitHub App Permissions Required

```yaml
# GitHub App manifest permissions
permissions:
  contents: write        # Read/write repo contents, create branches
  pull_requests: write   # Create/manage PRs
  issues: write          # Close issues, add labels
  actions: read          # Read workflow run status
  metadata: read         # Basic repo metadata (implicit)
  
# Subscribe to events
events:
  - push
  - pull_request
  - workflow_run
  - issues
  - release
  - deployment_status
```

### 1.3 Authorization URL Construction

```elixir
defmodule Ema.Integrations.GitHub.Auth do
  @github_app_client_id System.get_env("GITHUB_APP_CLIENT_ID")
  @authorize_url "https://github.com/login/oauth/authorize"

  @doc """
  Generate OAuth2 authorization URL for user-level access.
  GitHub App also needs user authorization for API calls on behalf of users.
  """
  def authorize_url(user_id) do
    state = generate_state_token(user_id)
    
    params = URI.encode_query(%{
      client_id: @github_app_client_id,
      redirect_uri: "http://localhost:4488/api/auth/github/callback",
      state: state,
      # GitHub App user auth doesn't use scopes — permissions come from the app manifest
    })

    {:ok, "#{@authorize_url}?#{params}"}
  end

  defp generate_state_token(user_id) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    # Store in ETS with 10-minute TTL for CSRF verification
    :ets.insert(:github_oauth_states, {token, user_id, System.system_time(:second) + 600})
    token
  end
end
```

### 1.4 Callback Handling — Phoenix Router

```elixir
# router.ex
scope "/api/auth", Ema.Integrations.GitHub do
  get "/github/callback", AuthController, :callback
end

# auth_controller.ex
defmodule Ema.Integrations.GitHub.AuthController do
  use EmaWeb, :controller

  alias Ema.Integrations.GitHub.Auth

  def callback(conn, %{"code" => code, "state" => state}) do
    with :ok <- Auth.verify_state(state),
         {:ok, user_id} <- Auth.get_user_from_state(state),
         {:ok, tokens} <- Auth.exchange_code(code),
         {:ok, github_user} <- Auth.fetch_github_user(tokens.access_token),
         {:ok, _connection} <- Auth.store_connection(user_id, github_user, tokens) do
      
      conn
      |> put_flash(:info, "GitHub connected: #{github_user["login"]}")
      |> redirect(to: "/settings/integrations")
    else
      {:error, :invalid_state} ->
        conn |> put_status(400) |> json(%{error: "Invalid or expired OAuth state"})
      {:error, reason} ->
        conn |> put_status(500) |> json(%{error: "GitHub auth failed: #{inspect(reason)}"})
    end
  end
end
```

### 1.5 Token Exchange

```elixir
def exchange_code(code) do
  body = Jason.encode!(%{
    client_id: @github_app_client_id,
    client_secret: System.get_env("GITHUB_APP_CLIENT_SECRET"),
    code: code
  })

  case Req.post("https://github.com/login/oauth/access_token", 
    body: body,
    headers: [{"accept", "application/json"}, {"content-type", "application/json"}]
  ) do
    {:ok, %{status: 200, body: %{"access_token" => token} = body}} ->
      {:ok, %{
        access_token: token,
        refresh_token: body["refresh_token"],  # Present for GitHub App user tokens
        expires_at: calculate_expiry(body["expires_in"])
      }}
    {:ok, %{body: %{"error" => error}}} ->
      {:error, error}
  end
end

defp calculate_expiry(nil), do: nil  # Classic OAuth tokens don't expire
defp calculate_expiry(seconds), do: DateTime.utc_now() |> DateTime.add(seconds, :second)
```

### 1.6 Token Storage (Encrypted)

```elixir
defmodule Ema.Integrations.GitHub.Connection do
  use Ecto.Schema
  import Ecto.Changeset

  # Uses Cloak for field-level encryption
  schema "github_connections" do
    field :user_id, :binary_id
    field :github_user_id, :integer
    field :github_login, :string
    field :access_token, Ema.Encrypted.Binary    # AES-256-GCM via Cloak
    field :refresh_token, Ema.Encrypted.Binary    # AES-256-GCM via Cloak
    field :token_expires_at, :utc_datetime
    field :scopes, {:array, :string}
    field :account_type, Ecto.Enum, values: [:personal, :organization]
    field :installation_id, :integer              # GitHub App installation ID
    field :status, Ecto.Enum, values: [:active, :revoked, :expired], default: :active
    
    timestamps()
  end

  def changeset(connection, attrs) do
    connection
    |> cast(attrs, [:user_id, :github_user_id, :github_login, :access_token,
                     :refresh_token, :token_expires_at, :scopes, :account_type,
                     :installation_id, :status])
    |> validate_required([:user_id, :github_user_id, :github_login, :access_token])
    |> unique_constraint([:user_id, :github_user_id])
  end
end
```

### 1.7 Token Refresh (GitHub App Installation Tokens)

```elixir
defmodule Ema.Integrations.GitHub.TokenManager do
  use GenServer
  require Logger

  @refresh_buffer_seconds 300  # Refresh 5 min before expiry

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @doc "Get a valid token, refreshing if needed."
  def get_token(connection_id) do
    GenServer.call(__MODULE__, {:get_token, connection_id})
  end

  @impl true
  def init(state) do
    # Schedule periodic token health check every 5 minutes
    :timer.send_interval(300_000, :check_expiring_tokens)
    {:ok, state}
  end

  @impl true
  def handle_call({:get_token, connection_id}, _from, state) do
    connection = Repo.get!(Connection, connection_id)

    case token_status(connection) do
      :valid ->
        {:reply, {:ok, connection.access_token}, state}
      
      :expiring_soon ->
        case refresh_token(connection) do
          {:ok, new_connection} -> {:reply, {:ok, new_connection.access_token}, state}
          {:error, _} = err -> {:reply, err, state}
        end
      
      :expired ->
        case refresh_token(connection) do
          {:ok, new_connection} -> {:reply, {:ok, new_connection.access_token}, state}
          {:error, _} -> {:reply, {:error, :token_expired_and_refresh_failed}, state}
        end
    end
  end

  @impl true
  def handle_info(:check_expiring_tokens, state) do
    expiring_soon = DateTime.utc_now() |> DateTime.add(@refresh_buffer_seconds)
    
    Connection
    |> where([c], c.status == :active and c.token_expires_at < ^expiring_soon)
    |> Repo.all()
    |> Enum.each(&refresh_token/1)

    {:noreply, state}
  end

  defp token_status(%{token_expires_at: nil}), do: :valid  # Classic tokens
  defp token_status(%{token_expires_at: exp}) do
    now = DateTime.utc_now()
    cond do
      DateTime.compare(exp, now) == :lt -> :expired
      DateTime.compare(exp, DateTime.add(now, @refresh_buffer_seconds)) == :lt -> :expiring_soon
      true -> :valid
    end
  end

  defp refresh_token(%{refresh_token: nil} = conn) do
    # GitHub App: generate installation token instead
    refresh_installation_token(conn)
  end
  defp refresh_token(%{refresh_token: refresh} = conn) do
    case Auth.refresh_access_token(refresh) do
      {:ok, new_tokens} ->
        conn
        |> Connection.changeset(%{
          access_token: new_tokens.access_token,
          refresh_token: new_tokens.refresh_token,
          token_expires_at: new_tokens.expires_at
        })
        |> Repo.update()
      error -> error
    end
  end

  defp refresh_installation_token(%{installation_id: inst_id} = conn) do
    jwt = generate_github_app_jwt()
    
    case Req.post("https://api.github.com/app/installations/#{inst_id}/access_tokens",
      headers: [{"authorization", "Bearer #{jwt}"}, {"accept", "application/vnd.github+json"}]
    ) do
      {:ok, %{status: 201, body: %{"token" => token, "expires_at" => exp}}} ->
        conn
        |> Connection.changeset(%{
          access_token: token,
          token_expires_at: DateTime.from_iso8601(exp) |> elem(1)
        })
        |> Repo.update()
      _ -> {:error, :installation_token_failed}
    end
  end

  defp generate_github_app_jwt do
    now = System.system_time(:second)
    claims = %{
      "iat" => now - 60,
      "exp" => now + (10 * 60),  # 10 minute max
      "iss" => System.get_env("GITHUB_APP_ID")
    }
    JOSE.JWT.sign(github_app_private_key(), claims) |> JOSE.JWS.compact() |> elem(1)
  end
end
```

### 1.8 Multi-Account Support

Users can connect multiple GitHub accounts (personal + org installations):

```elixir
# Query all active connections for a user
def list_connections(user_id) do
  Connection
  |> where([c], c.user_id == ^user_id and c.status == :active)
  |> order_by([c], asc: c.account_type)
  |> Repo.all()
end

# When making API calls, resolve which connection to use based on repo ownership
def connection_for_repo(user_id, repo_owner) do
  Connection
  |> where([c], c.user_id == ^user_id and c.status == :active)
  |> Repo.all()
  |> Enum.find(fn conn ->
    # Check if this connection has access to repos owned by repo_owner
    case API.check_repo_access(conn, repo_owner) do
      {:ok, true} -> true
      _ -> false
    end
  end)
end
```

---

## 2. Webhook Infrastructure

### 2.1 Endpoint Design

```elixir
# router.ex
scope "/api/webhooks", Ema.Integrations.GitHub do
  post "/github", WebhookController, :handle
end

# Optional: per-installation webhook path for multi-tenant
scope "/api/webhooks", Ema.Integrations.GitHub do
  post "/github/:installation_id", WebhookController, :handle
end
```

### 2.2 Webhook Controller

```elixir
defmodule Ema.Integrations.GitHub.WebhookController do
  use EmaWeb, :controller
  require Logger

  # Raw body must be preserved for signature verification.
  # Plug.Parsers must be configured to cache raw body for this route.

  def handle(conn, _params) do
    with {:ok, raw_body} <- read_raw_body(conn),
         :ok <- verify_signature(conn, raw_body),
         {:ok, event} <- parse_event(conn, raw_body) do
      
      # Persist raw event for replay capability
      persist_raw_event(event)
      
      # Dispatch asynchronously — webhook response must be fast (<10s)
      Task.Supervisor.start_child(Ema.TaskSupervisor, fn ->
        Ema.Integrations.GitHub.Events.process(event)
      end)

      conn |> put_status(200) |> json(%{status: "accepted"})
    else
      {:error, :invalid_signature} ->
        Logger.warning("GitHub webhook signature verification failed")
        conn |> put_status(401) |> json(%{error: "Invalid signature"})
      {:error, reason} ->
        Logger.error("GitHub webhook error: #{inspect(reason)}")
        conn |> put_status(400) |> json(%{error: "Bad request"})
    end
  end

  defp read_raw_body(conn) do
    case conn.assigns[:raw_body] do
      nil -> {:error, :no_raw_body}
      body -> {:ok, body}
    end
  end

  defp parse_event(conn, raw_body) do
    event_type = get_req_header(conn, "x-github-event") |> List.first()
    delivery_id = get_req_header(conn, "x-github-delivery") |> List.first()
    payload = Jason.decode!(raw_body)

    {:ok, %{
      event_type: event_type,
      delivery_id: delivery_id,
      action: payload["action"],
      payload: payload,
      received_at: DateTime.utc_now()
    }}
  end

  defp persist_raw_event(event) do
    %Ema.Integrations.GitHub.WebhookEvent{}
    |> Ema.Integrations.GitHub.WebhookEvent.changeset(%{
      delivery_id: event.delivery_id,
      event_type: event.event_type,
      action: event.action,
      payload: event.payload,
      status: :received
    })
    |> Repo.insert(on_conflict: :nothing, conflict_target: :delivery_id)
  end
end
```

### 2.3 Signature Verification

```elixir
@webhook_secret System.get_env("GITHUB_WEBHOOK_SECRET")

defp verify_signature(conn, raw_body) do
  case get_req_header(conn, "x-hub-signature-256") |> List.first() do
    "sha256=" <> signature ->
      expected = :crypto.mac(:hmac, :sha256, @webhook_secret, raw_body)
                 |> Base.encode16(case: :lower)
      
      if Plug.Crypto.secure_compare(signature, expected) do
        :ok
      else
        {:error, :invalid_signature}
      end
    
    _ ->
      {:error, :invalid_signature}
  end
end
```

### 2.4 Raw Body Caching Plug

```elixir
defmodule EmaWeb.Plugs.CacheRawBody do
  @moduledoc "Caches raw request body for webhook signature verification."
  
  def init(opts), do: opts

  def call(conn, _opts) do
    {:ok, body, conn} = Plug.Conn.read_body(conn)
    conn
    |> Plug.Conn.assign(:raw_body, body)
    |> Plug.Conn.put_private(:raw_body, body)
  end
end

# In endpoint.ex, BEFORE Plug.Parsers for the webhook path:
plug :match
plug EmaWeb.Plugs.CacheRawBody, only: "/api/webhooks/github"
plug Plug.Parsers, ...
```

### 2.5 GitHub Events to Subscribe To

| GitHub Event | Action Filter | EMA Behavior |
|---|---|---|
| `push` | — | Update project activity, track commits |
| `pull_request` | `opened`, `closed`, `merged`, `synchronize` | Create/update proposal, close linked items |
| `workflow_run` | `completed` | Check conclusion; if `failure` → urgent task |
| `deployment_status` | — | Track deploy status, trigger pipes on failure |
| `issues` | `opened`, `closed`, `labeled` | Sync labeled issues, close mirrored tasks |
| `release` | `published` | Log release in project activity |
| `installation` | `created`, `deleted`, `suspend`, `unsuspend` | Manage connection lifecycle |
| `installation_repositories` | `added`, `removed` | Update repo links |

### 2.6 Webhook Registration Strategy

**GitHub App = automatic.** When a user installs the EMA GitHub App on their org/account, GitHub automatically sends all subscribed events to our webhook URL. No manual per-repo webhook creation needed.

```
Installation flow:
1. User clicks "Install EMA GitHub App" → redirected to GitHub
2. User selects repos (or "All repositories")
3. GitHub sends `installation.created` webhook
4. EMA stores installation_id, offered repos
5. User maps repos to EMA projects in the UI
```

For self-hosted EMA instances that can't expose a public webhook URL:

```elixir
defmodule Ema.Integrations.GitHub.Poller do
  @moduledoc """
  Fallback polling for environments without public webhook endpoints.
  Checks for new events every 60 seconds per repo.
  """
  use GenServer

  @poll_interval_ms 60_000

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    schedule_poll()
    {:ok, %{}}
  end

  @impl true
  def handle_info(:poll, state) do
    repos = RepoLinker.list_linked_repos()
    
    for repo <- repos do
      poll_repo_events(repo)
    end

    schedule_poll()
    {:noreply, state}
  end

  defp poll_repo_events(repo) do
    sync_state = SyncState.get(repo.id)
    
    # Poll commits since last sync
    API.list_commits(repo, since: sync_state.last_commit_at)
    |> Enum.each(&Events.process_commit_event(repo, &1))

    # Poll PRs since last sync  
    API.list_pull_requests(repo, since: sync_state.last_pr_at, state: "all")
    |> Enum.each(&Events.process_pr_event(repo, &1))

    # Poll workflow runs
    API.list_workflow_runs(repo, created: ">#{sync_state.last_workflow_at}")
    |> Enum.each(&Events.process_workflow_event(repo, &1))

    SyncState.update_timestamps(repo.id)
  end

  defp schedule_poll do
    Process.send_after(self(), :poll, @poll_interval_ms)
  end
end
```

---

## 3. Repo ↔ Project Linking

### 3.1 Ecto Schema

```elixir
defmodule Ema.Integrations.GitHub.RepoLink do
  use Ecto.Schema
  import Ecto.Changeset

  schema "github_repo_links" do
    field :project_id, :binary_id
    field :connection_id, :id          # FK to github_connections
    field :github_repo_id, :integer    # GitHub's numeric repo ID (stable across renames)
    field :owner, :string              # e.g. "elixir-lang"
    field :repo_name, :string          # e.g. "elixir"
    field :full_name, :string          # e.g. "elixir-lang/elixir"
    field :default_branch, :string, default: "main"
    field :watched_branches, {:array, :string}, default: []  # Empty = watch default only
    field :sync_enabled, :boolean, default: true
    field :auto_proposal_on_pr, :boolean, default: true
    field :auto_task_on_deploy_fail, :boolean, default: true
    field :label_filter, {:array, :string}, default: []  # Only sync issues with these labels
    
    timestamps()
  end

  def changeset(link, attrs) do
    link
    |> cast(attrs, [:project_id, :connection_id, :github_repo_id, :owner, :repo_name,
                     :full_name, :default_branch, :watched_branches, :sync_enabled,
                     :auto_proposal_on_pr, :auto_task_on_deploy_fail, :label_filter])
    |> validate_required([:project_id, :connection_id, :github_repo_id, :full_name])
    |> unique_constraint([:project_id, :github_repo_id])
  end
end
```

### 3.2 Project Resources Tab Data Model

The Resources tab aggregates linked repos with live status:

```elixir
defmodule Ema.Integrations.GitHub.RepoLinker do
  alias Ema.Integrations.GitHub.{RepoLink, API, SyncState}

  @doc "Returns enriched repo data for the Project Resources tab."
  def list_project_repos(project_id) do
    RepoLink
    |> where([r], r.project_id == ^project_id and r.sync_enabled == true)
    |> Repo.all()
    |> Enum.map(fn link ->
      sync = SyncState.get(link.id)
      %{
        id: link.id,
        full_name: link.full_name,
        default_branch: link.default_branch,
        watched_branches: link.watched_branches,
        last_commit_at: sync.last_commit_at,
        last_commit_message: sync.last_commit_message,
        open_prs: sync.open_pr_count,
        latest_deploy_status: sync.latest_deploy_status,  # :success | :failure | :pending | nil
        settings: %{
          auto_proposal_on_pr: link.auto_proposal_on_pr,
          auto_task_on_deploy_fail: link.auto_task_on_deploy_fail,
          label_filter: link.label_filter
        }
      }
    end)
  end

  @doc "Link a GitHub repo to an EMA project."
  def link_repo(project_id, connection_id, repo_full_name) do
    with {:ok, repo_data} <- API.get_repo(connection_id, repo_full_name) do
      %RepoLink{}
      |> RepoLink.changeset(%{
        project_id: project_id,
        connection_id: connection_id,
        github_repo_id: repo_data["id"],
        owner: repo_data["owner"]["login"],
        repo_name: repo_data["name"],
        full_name: repo_data["full_name"],
        default_branch: repo_data["default_branch"]
      })
      |> Repo.insert()
      |> tap(fn {:ok, link} ->
        # Kick off initial sync
        Ema.Integrations.GitHub.Sync.initial_sync(link)
        # Broadcast to UI
        Phoenix.PubSub.broadcast(Ema.PubSub, "project:#{project_id}", 
          {:repo_linked, link})
      end)
    end
  end

  @doc "Unlink a repo from a project."
  def unlink_repo(link_id) do
    Repo.get!(RepoLink, link_id)
    |> Ecto.Changeset.change(sync_enabled: false)
    |> Repo.update()
  end
end
```

### 3.3 Auto-Suggestion Engine

When a new GitHub App installation provides repo access, suggest matches to existing projects:

```elixir
defmodule Ema.Integrations.GitHub.AutoSuggest do
  @moduledoc "Suggest repo ↔ project links based on name similarity."

  def suggest_links(installation_repos) do
    projects = Repo.all(Ema.Projects.Project)
    
    for repo <- installation_repos,
        project <- projects,
        score = similarity_score(repo, project),
        score > 0.5 do
      %{
        repo: repo["full_name"],
        project_id: project.id,
        project_name: project.name,
        confidence: score,
        reason: match_reason(repo, project)
      }
    end
    |> Enum.sort_by(& &1.confidence, :desc)
  end

  defp similarity_score(repo, project) do
    name_score = String.jaro_distance(
      repo["name"] |> String.downcase(),
      project.name |> String.downcase() |> String.replace(~r/\s+/, "-")
    )
    
    # Boost if project description mentions the repo
    desc_boost = if project.description && 
      String.contains?(String.downcase(project.description), String.downcase(repo["name"])),
      do: 0.2, else: 0.0

    min(name_score + desc_boost, 1.0)
  end

  defp match_reason(repo, project) do
    cond do
      String.downcase(repo["name"]) == String.downcase(project.name) |> String.replace(~r/\s+/, "-") ->
        "Exact name match"
      String.jaro_distance(String.downcase(repo["name"]), String.downcase(project.name)) > 0.8 ->
        "Similar name"
      true ->
        "Partial match"
    end
  end
end
```

---

## 4. Bidirectional Sync Flows

### Flow A: GitHub Commit → EMA Project Activity Update

```
┌─────────────┐    webhook     ┌──────────────┐    process    ┌─────────────┐
│   GitHub     │──────────────→│  Webhook      │─────────────→│  Sync       │
│   push event │               │  Handler      │              │  Coordinator│
└─────────────┘               └──────────────┘              └──────┬──────┘
                                                                    │
                                              ┌─────────────────────┤
                                              ▼                     ▼
                                    ┌─────────────┐      ┌──────────────┐
                                    │ Update       │      │ Broadcast    │
                                    │ Project      │      │ PubSub       │
                                    │ Activity     │      │ (UI update)  │
                                    └─────────────┘      └──────────────┘
```

**Trigger:** `push` webhook event on watched branch.

**Processing:**
```elixir
defmodule Ema.Integrations.GitHub.Flows.CommitActivity do
  alias Ema.Integrations.GitHub.{RepoLink, SyncState}

  def handle(%{event_type: "push", payload: payload}) do
    repo_id = payload["repository"]["id"]
    branch = payload["ref"] |> String.replace("refs/heads/", "")
    commits = payload["commits"]

    # Find all project links for this repo
    links = RepoLink
    |> where([r], r.github_repo_id == ^repo_id and r.sync_enabled == true)
    |> Repo.all()
    |> Enum.filter(fn link ->
      branch == link.default_branch or branch in link.watched_branches
    end)

    for link <- links do
      # Create activity entries for each commit
      for commit <- commits do
        Ema.Projects.create_activity(link.project_id, %{
          type: :github_commit,
          title: "Commit on #{branch}",
          description: commit["message"] |> String.split("\n") |> List.first(),
          metadata: %{
            sha: commit["id"],
            author: commit["author"]["name"],
            branch: branch,
            url: commit["url"],
            files_changed: length(commit["added"]) + length(commit["modified"]) + length(commit["removed"])
          },
          occurred_at: commit["timestamp"]
        })
      end

      # Update sync state
      last_commit = List.last(commits)
      SyncState.update(link.id, %{
        last_commit_at: last_commit["timestamp"],
        last_commit_sha: last_commit["id"],
        last_commit_message: last_commit["message"] |> String.split("\n") |> List.first()
      })

      # Broadcast to UI
      Phoenix.PubSub.broadcast(Ema.PubSub, "project:#{link.project_id}",
        {:github_commits, %{branch: branch, count: length(commits)}})
    end

    :ok
  end
end
```

**Error Handling:**
- Unknown repo ID → log warning, skip (repo may have been unlinked)
- DB insert failure → retry up to 3 times with exponential backoff
- PubSub broadcast failure → log, don't retry (non-critical)

---

### Flow B: GitHub PR Opened → EMA Proposal Creation Prompt

**Trigger:** `pull_request` webhook, action: `opened`.

```elixir
defmodule Ema.Integrations.GitHub.Flows.PRToProposal do

  def handle(%{event_type: "pull_request", action: "opened", payload: payload}) do
    repo_id = payload["repository"]["id"]
    pr = payload["pull_request"]

    links = RepoLink
    |> where([r], r.github_repo_id == ^repo_id and r.sync_enabled == true and r.auto_proposal_on_pr == true)
    |> Repo.all()

    for link <- links do
      # Evaluate if PR warrants a proposal (see Section 8 for structural detection)
      significance = evaluate_pr_significance(pr)

      if significance in [:structural, :major] do
        # Create a proposal prompt (not auto-creating — surfacing to user)
        Ema.Proposals.create_proposal_prompt(link.project_id, %{
          source: :github_pr,
          title: "PR: #{pr["title"]}",
          description: pr["body"],
          metadata: %{
            pr_number: pr["number"],
            pr_url: pr["html_url"],
            author: pr["user"]["login"],
            base_branch: pr["base"]["ref"],
            head_branch: pr["head"]["ref"],
            additions: pr["additions"],
            deletions: pr["deletions"],
            changed_files: pr["changed_files"],
            significance: significance
          }
        })

        # Notify via PubSub — UI shows "New PR → Create Proposal?" card
        Phoenix.PubSub.broadcast(Ema.PubSub, "project:#{link.project_id}",
          {:proposal_prompt, %{source: :github_pr, pr_number: pr["number"]}})
      else
        # Still log the PR as project activity
        Ema.Projects.create_activity(link.project_id, %{
          type: :github_pr_opened,
          title: "PR ##{pr["number"]}: #{pr["title"]}",
          metadata: %{pr_number: pr["number"], url: pr["html_url"]}
        })
      end
    end
  end

  # Also handle PR merged/closed to update existing proposals
  def handle(%{event_type: "pull_request", action: action, payload: payload})
      when action in ["closed", "merged"] do
    pr = payload["pull_request"]
    repo_id = payload["repository"]["id"]

    # Find any proposals linked to this PR
    Ema.Proposals.update_by_github_pr(repo_id, pr["number"], %{
      status: if(pr["merged"], do: :accepted, else: :rejected),
      resolved_at: DateTime.utc_now()
    })
  end
end
```

**Error Handling:**
- PR body too large → truncate to 10KB for proposal description
- Duplicate PR event (redelivery) → idempotent via `delivery_id` check
- Link missing → skip silently

---

### Flow C: GitHub Deployment Failed → EMA Urgent Task + Pipes Trigger

**Trigger:** `workflow_run` webhook, conclusion: `failure`.

```elixir
defmodule Ema.Integrations.GitHub.Flows.DeployFailure do
  
  def handle(%{event_type: "workflow_run", payload: payload}) do
    workflow = payload["workflow_run"]
    
    # Only act on failures
    unless workflow["conclusion"] == "failure", do: return(:ignored)

    repo_id = payload["repository"]["id"]
    
    links = RepoLink
    |> where([r], r.github_repo_id == ^repo_id and r.sync_enabled == true 
                  and r.auto_task_on_deploy_fail == true)
    |> Repo.all()

    for link <- links do
      # Create urgent task
      {:ok, task} = Ema.Tasks.create_task(%{
        project_id: link.project_id,
        title: "Fix deployment: #{workflow["name"]} failed on #{workflow["head_branch"]}",
        description: """
        ## Deployment Failure

        **Workflow:** #{workflow["name"]}
        **Branch:** #{workflow["head_branch"]}
        **Commit:** #{workflow["head_sha"] |> String.slice(0..6)}
        **Run URL:** #{workflow["html_url"]}
        **Trigger:** #{workflow["event"]}
        **Started:** #{workflow["run_started_at"]}

        [View full logs](#{workflow["html_url"]})
        """,
        priority: :high,
        status: :open,
        source: :github_workflow_failure,
        metadata: %{
          github_workflow_run_id: workflow["id"],
          github_repo: link.full_name,
          workflow_name: workflow["name"],
          branch: workflow["head_branch"],
          commit_sha: workflow["head_sha"],
          run_url: workflow["html_url"]
        }
      })

      # Fire Pipes trigger for downstream automation
      Ema.Pipes.Engine.trigger(%{
        event: "github.deployment.failed",
        project_id: link.project_id,
        task_id: task.id,
        data: %{
          repo: link.full_name,
          workflow: workflow["name"],
          branch: workflow["head_branch"],
          run_url: workflow["html_url"]
        }
      })

      # Broadcast
      Phoenix.PubSub.broadcast(Ema.PubSub, "project:#{link.project_id}",
        {:urgent_task_created, %{task_id: task.id, source: :deploy_failure}})
    end
  end
end
```

**Error Handling:**
- Duplicate workflow_run events → deduplicate via `workflow_run.id` in task metadata
- Pipe trigger failure → log error, task still created (Pipes failure ≠ task creation failure)
- Rapid sequential failures (flapping) → rate-limit: max 1 task per workflow per 10 minutes

```elixir
defp should_create_task?(link, workflow) do
  # Prevent flapping — check for recent task for same workflow
  recent_cutoff = DateTime.utc_now() |> DateTime.add(-600, :second)
  
  existing = Ema.Tasks.query()
  |> where([t], t.project_id == ^link.project_id 
                and t.source == :github_workflow_failure
                and fragment("metadata->>'workflow_name' = ?", ^workflow["name"])
                and t.inserted_at > ^recent_cutoff)
  |> Repo.exists?()

  not existing
end
```

---

### Flow D: EMA Task Created → GitHub Branch Creation

**Trigger:** User clicks "Create branch" on a Task in EMA UI.

```elixir
defmodule Ema.Integrations.GitHub.Flows.TaskToBranch do
  alias Ema.Integrations.GitHub.{API, TokenManager, RepoLink}

  @doc "Create a GitHub branch from an EMA task."
  def create_branch(task_id, repo_link_id, opts \\ []) do
    task = Ema.Tasks.get_task!(task_id)
    link = Repo.get!(RepoLink, repo_link_id) |> Repo.preload(:connection)
    
    branch_name = opts[:branch_name] || generate_branch_name(task)
    base_branch = opts[:base_branch] || link.default_branch

    with {:ok, token} <- TokenManager.get_token(link.connection_id),
         {:ok, base_sha} <- API.get_branch_sha(token, link.full_name, base_branch),
         {:ok, _ref} <- API.create_branch(token, link.full_name, branch_name, base_sha) do
      
      # Update task with branch info
      Ema.Tasks.update_task(task, %{
        metadata: Map.merge(task.metadata || %{}, %{
          "github_branch" => branch_name,
          "github_repo" => link.full_name,
          "github_branch_url" => "https://github.com/#{link.full_name}/tree/#{branch_name}"
        })
      })

      # Log activity
      Ema.Projects.create_activity(link.project_id, %{
        type: :github_branch_created,
        title: "Branch created: #{branch_name}",
        metadata: %{task_id: task_id, branch: branch_name}
      })

      {:ok, %{branch: branch_name, url: "https://github.com/#{link.full_name}/tree/#{branch_name}"}}
    end
  end

  defp generate_branch_name(task) do
    slug = task.title
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9\s-]/, "")
    |> String.replace(~r/\s+/, "-")
    |> String.slice(0..50)
    |> String.trim("-")

    "ema/task-#{task.id |> String.slice(0..7)}/#{slug}"
  end
end
```

**API Calls:**
```elixir
# In Ema.Integrations.GitHub.API

def get_branch_sha(token, repo, branch) do
  case get("/repos/#{repo}/git/ref/heads/#{branch}", token) do
    {:ok, %{status: 200, body: %{"object" => %{"sha" => sha}}}} -> {:ok, sha}
    {:ok, %{status: 404}} -> {:error, :branch_not_found}
    error -> {:error, error}
  end
end

def create_branch(token, repo, branch_name, sha) do
  post("/repos/#{repo}/git/refs", token, %{
    ref: "refs/heads/#{branch_name}",
    sha: sha
  })
  |> case do
    {:ok, %{status: 201} = resp} -> {:ok, resp.body}
    {:ok, %{status: 422}} -> {:error, :branch_already_exists}
    error -> {:error, error}
  end
end
```

**Error Handling:**
- Branch name conflict → append random suffix, retry once
- Token expired → `TokenManager` handles refresh transparently
- Base branch not found → return error to UI, let user pick branch
- Network failure → retry up to 2 times with backoff

---

### Flow E: EMA Proposal Accepted → GitHub PR Draft

**Trigger:** Proposal status changes to `:accepted` and has a linked task with a GitHub branch.

```elixir
defmodule Ema.Integrations.GitHub.Flows.ProposalToPR do
  
  def create_pr_from_proposal(proposal_id, opts \\ []) do
    proposal = Ema.Proposals.get_proposal!(proposal_id) |> Repo.preload(:project)
    
    # Find the associated task's branch info
    task = find_linked_task(proposal)
    branch = get_in(task.metadata, ["github_branch"])
    repo_full_name = get_in(task.metadata, ["github_repo"])
    
    unless branch && repo_full_name do
      return({:error, :no_github_branch})
    end

    link = RepoLink |> where([r], r.full_name == ^repo_full_name) |> Repo.one!()
    
    with {:ok, token} <- TokenManager.get_token(link.connection_id),
         {:ok, pr} <- API.create_pull_request(token, repo_full_name, %{
           title: opts[:title] || proposal.title,
           body: build_pr_body(proposal, task),
           head: branch,
           base: opts[:base] || link.default_branch,
           draft: opts[:draft] != false  # Default to draft
         }) do
      
      # Store PR reference on the proposal
      Ema.Proposals.update_proposal(proposal, %{
        metadata: Map.merge(proposal.metadata || %{}, %{
          "github_pr_number" => pr["number"],
          "github_pr_url" => pr["html_url"],
          "github_pr_state" => "draft"
        })
      })

      Ema.Projects.create_activity(link.project_id, %{
        type: :github_pr_created,
        title: "PR ##{pr["number"]} created from proposal",
        metadata: %{proposal_id: proposal_id, pr_number: pr["number"]}
      })

      {:ok, pr}
    end
  end

  defp build_pr_body(proposal, task) do
    """
    ## #{proposal.title}

    #{proposal.description}

    ---
    
    **EMA Task:** #{task.title} (`#{task.id}`)
    **EMA Proposal:** #{proposal.id}
    
    _Created automatically by EMA_
    """
  end

  defp find_linked_task(proposal) do
    # Proposals link to tasks through the project's task list
    Ema.Tasks.get_by_proposal(proposal.id)
  end
end
```

**Error Handling:**
- No branch exists → prompt user to create branch first (Flow D)
- PR already exists for branch → return existing PR URL
- Branch has no commits ahead of base → warn user, create anyway if forced

---

### Flow F: EMA Task Completed → GitHub Issue Close

**Trigger:** Task status changes to `:completed` and has a linked GitHub issue.

```elixir
defmodule Ema.Integrations.GitHub.Flows.TaskCloseIssue do
  
  def handle_task_completed(task) do
    github_issue = get_in(task.metadata, ["github_issue_number"])
    github_repo = get_in(task.metadata, ["github_repo"])

    unless github_issue && github_repo, do: return(:no_linked_issue)

    link = RepoLink |> where([r], r.full_name == ^github_repo) |> Repo.one()
    unless link, do: return(:repo_not_linked)

    with {:ok, token} <- TokenManager.get_token(link.connection_id),
         {:ok, _} <- API.close_issue(token, github_repo, github_issue, %{
           comment: "Closed by EMA — Task `#{task.id}` completed.\n\n#{task.completion_note || ""}"
         }) do
      
      Ema.Projects.create_activity(link.project_id, %{
        type: :github_issue_closed,
        title: "Issue ##{github_issue} closed (task completed)",
        metadata: %{task_id: task.id, issue_number: github_issue}
      })

      :ok
    end
  end
end

# In API module:
def close_issue(token, repo, issue_number, opts \\ %{}) do
  # Add closing comment if provided
  if comment = opts[:comment] do
    post("/repos/#{repo}/issues/#{issue_number}/comments", token, %{body: comment})
  end

  # Close the issue
  patch("/repos/#{repo}/issues/#{issue_number}", token, %{state: "closed"})
end
```

**Error Handling:**
- Issue already closed → log, skip (idempotent)
- Permission denied → log warning, notify user in UI
- Issue in different repo than linked → use the repo from task metadata, not from link

---

## 5. API Rate Limit Management

### 5.1 Rate Limit Tracker

```elixir
defmodule Ema.Integrations.GitHub.RateLimiter do
  use GenServer
  require Logger

  @moduledoc """
  Tracks GitHub API rate limits per connection and applies backpressure.
  GitHub REST: 5,000 req/hr per installation (GitHub App).
  GitHub GraphQL: 5,000 points/hr.
  """

  defstruct [:limits, :queues]

  def start_link(_) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @doc "Execute an API call with rate limit awareness."
  def execute(connection_id, fun) when is_function(fun, 0) do
    GenServer.call(__MODULE__, {:execute, connection_id, fun}, 30_000)
  end

  @impl true
  def init(_) do
    {:ok, %{limits: %{}, queues: %{}}}
  end

  @impl true
  def handle_call({:execute, conn_id, fun}, from, state) do
    limit = Map.get(state.limits, conn_id, %{remaining: 5000, reset_at: nil})

    cond do
      limit.remaining > 100 ->
        # Plenty of headroom — execute immediately
        {result, new_limit} = execute_and_track(fun)
        new_state = put_in(state.limits[conn_id], new_limit)
        {:reply, result, new_state}

      limit.remaining > 10 ->
        # Getting low — execute but log warning
        Logger.warning("GitHub rate limit low for connection #{conn_id}: #{limit.remaining} remaining")
        {result, new_limit} = execute_and_track(fun)
        new_state = put_in(state.limits[conn_id], new_limit)
        {:reply, result, new_state}

      limit.remaining > 0 ->
        # Critical — execute only essential requests
        {result, new_limit} = execute_and_track(fun)
        new_state = put_in(state.limits[conn_id], new_limit)
        {:reply, result, new_state}

      true ->
        # Exhausted — queue until reset
        wait_ms = max(0, DateTime.diff(limit.reset_at, DateTime.utc_now(), :millisecond))
        Logger.warning("GitHub rate limit exhausted for #{conn_id}, queuing for #{wait_ms}ms")
        Process.send_after(self(), {:dequeue, conn_id, from, fun}, wait_ms)
        {:noreply, state}
    end
  end

  @impl true
  def handle_info({:dequeue, conn_id, from, fun}, state) do
    {result, new_limit} = execute_and_track(fun)
    new_state = put_in(state.limits[conn_id], new_limit)
    GenServer.reply(from, result)
    {:noreply, new_state}
  end

  defp execute_and_track(fun) do
    result = fun.()
    
    new_limit = case result do
      {:ok, %{headers: headers}} ->
        %{
          remaining: parse_header(headers, "x-ratelimit-remaining", 5000),
          reset_at: parse_reset_header(headers),
          limit: parse_header(headers, "x-ratelimit-limit", 5000)
        }
      _ ->
        %{remaining: 5000, reset_at: nil, limit: 5000}
    end

    {result, new_limit}
  end

  defp parse_header(headers, name, default) do
    case List.keyfind(headers, name, 0) do
      {_, value} -> String.to_integer(value)
      nil -> default
    end
  end

  defp parse_reset_header(headers) do
    case List.keyfind(headers, "x-ratelimit-reset", 0) do
      {_, value} -> DateTime.from_unix!(String.to_integer(value))
      nil -> nil
    end
  end
end
```

### 5.2 Caching Strategy

```elixir
defmodule Ema.Integrations.GitHub.Cache do
  @moduledoc """
  ETS-based cache for frequently-accessed GitHub data.
  Uses conditional requests (ETags) to minimize rate limit consumption.
  """

  @cache_table :github_cache
  @default_ttl_seconds 300  # 5 minutes

  def init do
    :ets.new(@cache_table, [:set, :public, :named_table, read_concurrency: true])
  end

  def get_or_fetch(cache_key, ttl \\ @default_ttl_seconds, fetch_fn) do
    case :ets.lookup(@cache_table, cache_key) do
      [{_, value, etag, expires_at}] when expires_at > System.system_time(:second) ->
        {:ok, value}
      
      [{_, value, etag, _expired}] ->
        # Expired — try conditional request
        case fetch_fn.(etag) do
          {:ok, :not_modified} ->
            # Refresh TTL
            :ets.insert(@cache_table, {cache_key, value, etag, System.system_time(:second) + ttl})
            {:ok, value}
          {:ok, new_value, new_etag} ->
            :ets.insert(@cache_table, {cache_key, new_value, new_etag, System.system_time(:second) + ttl})
            {:ok, new_value}
          error -> error
        end
      
      [] ->
        case fetch_fn.(nil) do
          {:ok, value, etag} ->
            :ets.insert(@cache_table, {cache_key, value, etag, System.system_time(:second) + ttl})
            {:ok, value}
          {:ok, value} ->
            :ets.insert(@cache_table, {cache_key, value, nil, System.system_time(:second) + ttl})
            {:ok, value}
          error -> error
        end
    end
  end

  @doc "Cache TTLs by data type."
  def ttl_for(:repo_metadata), do: 3600      # 1 hour — rarely changes
  def ttl_for(:branch_list), do: 300          # 5 min
  def ttl_for(:pr_state), do: 60              # 1 min — changes frequently
  def ttl_for(:workflow_runs), do: 120        # 2 min
  def ttl_for(_), do: @default_ttl_seconds
end
```

### 5.3 Conditional Requests (ETag Support)

```elixir
# In API module — all GET requests use conditional headers
def get(path, token, opts \\ []) do
  etag = opts[:etag]
  
  headers = [
    {"authorization", "Bearer #{token}"},
    {"accept", "application/vnd.github+json"},
    {"x-github-api-version", "2022-11-28"}
  ]
  headers = if etag, do: [{"if-none-match", etag} | headers], else: headers

  case Req.get("https://api.github.com#{path}", headers: headers) do
    {:ok, %{status: 304}} ->
      {:ok, :not_modified}
    {:ok, %{status: 200} = resp} ->
      new_etag = Req.Response.get_header(resp, "etag") |> List.first()
      {:ok, resp.body, new_etag}
    {:ok, %{status: status} = resp} ->
      {:error, %{status: status, body: resp.body}}
  end
end
```

---

## 6. Database Schema

### 6.1 Migration

```elixir
defmodule Ema.Repo.Migrations.CreateGitHubIntegrationTables do
  use Ecto.Migration

  def change do
    # --- github_connections ---
    create table(:github_connections) do
      add :user_id, :binary_id, null: false
      add :github_user_id, :integer, null: false
      add :github_login, :string, null: false
      add :access_token, :binary, null: false         # Encrypted via Cloak
      add :refresh_token, :binary                      # Encrypted via Cloak
      add :token_expires_at, :utc_datetime
      add :scopes, {:array, :string}, default: []
      add :account_type, :string, null: false, default: "personal"
      add :installation_id, :integer
      add :status, :string, null: false, default: "active"
      
      timestamps()
    end

    create unique_index(:github_connections, [:user_id, :github_user_id])
    create index(:github_connections, [:status])
    create index(:github_connections, [:installation_id])

    # --- github_repo_links ---
    create table(:github_repo_links) do
      add :project_id, :binary_id, null: false
      add :connection_id, references(:github_connections, on_delete: :restrict), null: false
      add :github_repo_id, :integer, null: false
      add :owner, :string, null: false
      add :repo_name, :string, null: false
      add :full_name, :string, null: false
      add :default_branch, :string, default: "main"
      add :watched_branches, {:array, :string}, default: []
      add :sync_enabled, :boolean, default: true
      add :auto_proposal_on_pr, :boolean, default: true
      add :auto_task_on_deploy_fail, :boolean, default: true
      add :label_filter, {:array, :string}, default: []

      timestamps()
    end

    create unique_index(:github_repo_links, [:project_id, :github_repo_id])
    create index(:github_repo_links, [:github_repo_id])
    create index(:github_repo_links, [:connection_id])
    create index(:github_repo_links, [:sync_enabled])

    # --- github_webhook_events ---
    create table(:github_webhook_events) do
      add :delivery_id, :string, null: false
      add :event_type, :string, null: false
      add :action, :string
      add :repo_id, :integer
      add :payload, :map, null: false
      add :status, :string, null: false, default: "received"  # received, processed, failed, ignored
      add :processed_at, :utc_datetime
      add :error_message, :text

      timestamps()
    end

    create unique_index(:github_webhook_events, [:delivery_id])
    create index(:github_webhook_events, [:event_type, :action])
    create index(:github_webhook_events, [:repo_id])
    create index(:github_webhook_events, [:status])
    create index(:github_webhook_events, [:inserted_at])

    # --- github_sync_state ---
    create table(:github_sync_state) do
      add :repo_link_id, references(:github_repo_links, on_delete: :delete_all), null: false
      add :last_commit_at, :utc_datetime
      add :last_commit_sha, :string
      add :last_commit_message, :string
      add :last_pr_at, :utc_datetime
      add :last_workflow_at, :utc_datetime
      add :last_issue_at, :utc_datetime
      add :last_release_at, :utc_datetime
      add :open_pr_count, :integer, default: 0
      add :latest_deploy_status, :string    # success, failure, pending
      add :cursor_positions, :map, default: %{}  # For pagination cursors per resource type
      add :full_sync_at, :utc_datetime      # Last time a full sync was performed

      timestamps()
    end

    create unique_index(:github_sync_state, [:repo_link_id])
  end
end
```

### 6.2 Raw SQL (PostgreSQL)

```sql
-- github_connections
CREATE TABLE github_connections (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    github_user_id INTEGER NOT NULL,
    github_login VARCHAR(255) NOT NULL,
    access_token BYTEA NOT NULL,
    refresh_token BYTEA,
    token_expires_at TIMESTAMPTZ,
    scopes VARCHAR(255)[] DEFAULT '{}',
    account_type VARCHAR(50) NOT NULL DEFAULT 'personal',
    installation_id INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, github_user_id)
);

CREATE INDEX idx_github_connections_status ON github_connections(status);
CREATE INDEX idx_github_connections_installation ON github_connections(installation_id);

-- github_repo_links
CREATE TABLE github_repo_links (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID NOT NULL,
    connection_id BIGINT NOT NULL REFERENCES github_connections(id) ON DELETE RESTRICT,
    github_repo_id INTEGER NOT NULL,
    owner VARCHAR(255) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) NOT NULL,
    default_branch VARCHAR(255) DEFAULT 'main',
    watched_branches VARCHAR(255)[] DEFAULT '{}',
    sync_enabled BOOLEAN DEFAULT TRUE,
    auto_proposal_on_pr BOOLEAN DEFAULT TRUE,
    auto_task_on_deploy_fail BOOLEAN DEFAULT TRUE,
    label_filter VARCHAR(255)[] DEFAULT '{}',
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, github_repo_id)
);

CREATE INDEX idx_github_repo_links_repo_id ON github_repo_links(github_repo_id);
CREATE INDEX idx_github_repo_links_connection ON github_repo_links(connection_id);
CREATE INDEX idx_github_repo_links_sync ON github_repo_links(sync_enabled);

-- github_webhook_events
CREATE TABLE github_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    delivery_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(100),
    repo_id INTEGER,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_type_action ON github_webhook_events(event_type, action);
CREATE INDEX idx_webhook_events_repo ON github_webhook_events(repo_id);
CREATE INDEX idx_webhook_events_status ON github_webhook_events(status);
CREATE INDEX idx_webhook_events_inserted ON github_webhook_events(inserted_at);

-- Partition webhook_events by month for performance (events accumulate fast)
-- Consider: CREATE TABLE github_webhook_events ... PARTITION BY RANGE (inserted_at);

-- github_sync_state
CREATE TABLE github_sync_state (
    id BIGSERIAL PRIMARY KEY,
    repo_link_id BIGINT NOT NULL UNIQUE REFERENCES github_repo_links(id) ON DELETE CASCADE,
    last_commit_at TIMESTAMPTZ,
    last_commit_sha VARCHAR(40),
    last_commit_message VARCHAR(500),
    last_pr_at TIMESTAMPTZ,
    last_workflow_at TIMESTAMPTZ,
    last_issue_at TIMESTAMPTZ,
    last_release_at TIMESTAMPTZ,
    open_pr_count INTEGER DEFAULT 0,
    latest_deploy_status VARCHAR(50),
    cursor_positions JSONB DEFAULT '{}',
    full_sync_at TIMESTAMPTZ,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook event cleanup: auto-delete events older than 90 days
-- Run via pg_cron or EMA's own scheduler:
-- DELETE FROM github_webhook_events WHERE inserted_at < NOW() - INTERVAL '90 days';
```

### 6.3 Complete Ecto Schemas

```elixir
# github_webhook_events schema
defmodule Ema.Integrations.GitHub.WebhookEvent do
  use Ecto.Schema
  import Ecto.Changeset

  schema "github_webhook_events" do
    field :delivery_id, :string
    field :event_type, :string
    field :action, :string
    field :repo_id, :integer
    field :payload, :map
    field :status, Ecto.Enum, values: [:received, :processed, :failed, :ignored], default: :received
    field :processed_at, :utc_datetime
    field :error_message, :string

    timestamps()
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [:delivery_id, :event_type, :action, :repo_id, :payload, :status, 
                     :processed_at, :error_message])
    |> validate_required([:delivery_id, :event_type, :payload])
    |> unique_constraint(:delivery_id)
  end
end

# github_sync_state schema
defmodule Ema.Integrations.GitHub.SyncState do
  use Ecto.Schema
  import Ecto.Changeset

  schema "github_sync_state" do
    belongs_to :repo_link, Ema.Integrations.GitHub.RepoLink
    field :last_commit_at, :utc_datetime
    field :last_commit_sha, :string
    field :last_commit_message, :string
    field :last_pr_at, :utc_datetime
    field :last_workflow_at, :utc_datetime
    field :last_issue_at, :utc_datetime
    field :last_release_at, :utc_datetime
    field :open_pr_count, :integer, default: 0
    field :latest_deploy_status, Ecto.Enum, values: [:success, :failure, :pending]
    field :cursor_positions, :map, default: %{}
    field :full_sync_at, :utc_datetime

    timestamps()
  end

  def changeset(state, attrs) do
    state
    |> cast(attrs, [:last_commit_at, :last_commit_sha, :last_commit_message, :last_pr_at,
                     :last_workflow_at, :last_issue_at, :last_release_at, :open_pr_count,
                     :latest_deploy_status, :cursor_positions, :full_sync_at])
  end

  def get(repo_link_id) do
    __MODULE__
    |> where([s], s.repo_link_id == ^repo_link_id)
    |> Repo.one()
    |> case do
      nil -> %__MODULE__{repo_link_id: repo_link_id}
      state -> state
    end
  end

  def update(repo_link_id, attrs) do
    get(repo_link_id)
    |> changeset(attrs)
    |> Repo.insert_or_update()
  end
end
```

---

## 7. Elixir Module Structure

```
lib/ema/integrations/github/
├── github.ex                  # Top-level context module (public API facade)
├── auth.ex                    # OAuth2 flow, authorization URL, code exchange
├── auth_controller.ex         # Phoenix controller for OAuth callback
├── token_manager.ex           # GenServer: token refresh, expiry tracking
├── webhook_controller.ex      # Phoenix controller for incoming webhooks
├── webhook_handler.ex         # Event routing: webhook → appropriate flow
├── api.ex                     # GitHub REST API client (Req-based)
├── graphql.ex                 # GitHub GraphQL client (for efficient bulk queries)
├── rate_limiter.ex            # GenServer: rate limit tracking + backpressure
├── cache.ex                   # ETS cache with ETag/conditional request support
├── sync.ex                    # Bidirectional sync coordinator
├── repo_linker.ex             # Project ↔ repo association management
├── auto_suggest.ex            # Auto-suggest repo ↔ project links
├── events.ex                  # GitHub event → EMA event normalization
├── poller.ex                  # Fallback polling for non-webhook environments
│
├── flows/
│   ├── commit_activity.ex     # Flow A: push → project activity
│   ├── pr_to_proposal.ex      # Flow B: PR opened → proposal prompt
│   ├── deploy_failure.ex      # Flow C: workflow_run failure → urgent task
│   ├── task_to_branch.ex      # Flow D: EMA task → GitHub branch
│   ├── proposal_to_pr.ex      # Flow E: proposal accepted → PR draft
│   └── task_close_issue.ex    # Flow F: task completed → issue close
│
├── schemas/
│   ├── connection.ex          # github_connections Ecto schema
│   ├── repo_link.ex           # github_repo_links Ecto schema
│   ├── webhook_event.ex       # github_webhook_events Ecto schema
│   └── sync_state.ex          # github_sync_state Ecto schema
│
└── supervisor.ex              # Supervision tree for GitHub integration
```

### 7.1 Supervision Tree

```elixir
defmodule Ema.Integrations.GitHub.Supervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    children = [
      # Token refresh manager
      Ema.Integrations.GitHub.TokenManager,
      
      # Rate limit tracker
      Ema.Integrations.GitHub.RateLimiter,
      
      # Cache initialization
      {Task, fn -> Ema.Integrations.GitHub.Cache.init() end},
      
      # Fallback poller (only starts if webhooks are unavailable)
      {Ema.Integrations.GitHub.Poller, enabled: webhook_mode() == :polling},
      
      # Task supervisor for async webhook processing
      {Task.Supervisor, name: Ema.Integrations.GitHub.TaskSupervisor}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp webhook_mode do
    if System.get_env("GITHUB_WEBHOOK_URL") do
      :webhook
    else
      :polling
    end
  end
end
```

### 7.2 Public API Facade

```elixir
defmodule Ema.Integrations.GitHub do
  @moduledoc """
  Public API for the GitHub integration. All external calls go through here.
  """

  alias Ema.Integrations.GitHub.{Auth, RepoLinker, Sync, API, TokenManager}

  # --- Authentication ---
  defdelegate authorize_url(user_id), to: Auth
  defdelegate list_connections(user_id), to: Auth
  defdelegate revoke_connection(connection_id), to: Auth

  # --- Repo Linking ---
  defdelegate link_repo(project_id, connection_id, repo_full_name), to: RepoLinker
  defdelegate unlink_repo(link_id), to: RepoLinker
  defdelegate list_project_repos(project_id), to: RepoLinker
  defdelegate suggest_links(installation_repos), to: Ema.Integrations.GitHub.AutoSuggest

  # --- Sync Actions (user-initiated) ---
  def create_branch(task_id, repo_link_id, opts \\ []) do
    Ema.Integrations.GitHub.Flows.TaskToBranch.create_branch(task_id, repo_link_id, opts)
  end

  def create_pr(proposal_id, opts \\ []) do
    Ema.Integrations.GitHub.Flows.ProposalToPR.create_pr_from_proposal(proposal_id, opts)
  end

  def close_issue(task_id) do
    task = Ema.Tasks.get_task!(task_id)
    Ema.Integrations.GitHub.Flows.TaskCloseIssue.handle_task_completed(task)
  end

  # --- Manual Sync ---
  def force_sync(repo_link_id) do
    Sync.full_sync(repo_link_id)
  end

  # --- Status ---
  def connection_status(user_id) do
    connections = Auth.list_connections(user_id)
    Enum.map(connections, fn conn ->
      %{
        id: conn.id,
        github_login: conn.github_login,
        account_type: conn.account_type,
        status: conn.status,
        token_healthy: TokenManager.token_healthy?(conn.id)
      }
    end)
  end
end
```

### 7.3 Event Normalization & Routing

```elixir
defmodule Ema.Integrations.GitHub.Events do
  @moduledoc "Routes GitHub webhook events to the appropriate flow handler."
  require Logger

  alias Ema.Integrations.GitHub.Flows.{
    CommitActivity,
    PRToProposal,
    DeployFailure,
    TaskCloseIssue
  }

  def process(%{event_type: event_type, action: action} = event) do
    Logger.info("Processing GitHub event: #{event_type}/#{action}")
    
    result = route(event)

    # Update webhook event status
    WebhookEvent
    |> where([e], e.delivery_id == ^event.delivery_id)
    |> Repo.update_all(set: [
      status: (if match?({:ok, _}, result) or result == :ok, do: :processed, else: :failed),
      processed_at: DateTime.utc_now(),
      error_message: error_message(result)
    ])

    result
  end

  defp route(%{event_type: "push"} = event) do
    CommitActivity.handle(event)
  end

  defp route(%{event_type: "pull_request", action: action} = event)
       when action in ["opened", "closed", "merged", "synchronize"] do
    PRToProposal.handle(event)
  end

  defp route(%{event_type: "workflow_run"} = event) do
    DeployFailure.handle(event)
  end

  defp route(%{event_type: "deployment_status"} = event) do
    DeployFailure.handle_deployment_status(event)
  end

  defp route(%{event_type: "issues", action: action} = event)
       when action in ["opened", "closed", "labeled"] do
    handle_issue_event(event)
  end

  defp route(%{event_type: "release", action: "published"} = event) do
    handle_release_event(event)
  end

  defp route(%{event_type: "installation"} = event) do
    handle_installation_event(event)
  end

  defp route(%{event_type: event_type} = event) do
    Logger.debug("Unhandled GitHub event: #{event_type}")
    :ignored
  end

  # --- Issue Sync ---
  defp handle_issue_event(%{payload: payload} = _event) do
    issue = payload["issue"]
    repo_id = payload["repository"]["id"]
    labels = Enum.map(issue["labels"], & &1["name"])

    links = RepoLink
    |> where([r], r.github_repo_id == ^repo_id and r.sync_enabled == true)
    |> Repo.all()
    |> Enum.filter(fn link ->
      link.label_filter == [] or Enum.any?(link.label_filter, &(&1 in labels))
    end)

    for link <- links do
      Ema.Projects.create_activity(link.project_id, %{
        type: :"github_issue_#{payload["action"]}",
        title: "Issue ##{issue["number"]}: #{issue["title"]}",
        metadata: %{
          issue_number: issue["number"],
          url: issue["html_url"],
          labels: labels,
          state: issue["state"]
        }
      })
    end
  end

  # --- Release Logging ---
  defp handle_release_event(%{payload: payload}) do
    release = payload["release"]
    repo_id = payload["repository"]["id"]

    links = RepoLink
    |> where([r], r.github_repo_id == ^repo_id and r.sync_enabled == true)
    |> Repo.all()

    for link <- links do
      Ema.Projects.create_activity(link.project_id, %{
        type: :github_release,
        title: "Release #{release["tag_name"]}: #{release["name"]}",
        metadata: %{
          tag: release["tag_name"],
          url: release["html_url"],
          prerelease: release["prerelease"],
          body: String.slice(release["body"] || "", 0..500)
        }
      })
    end
  end

  # --- Installation Lifecycle ---
  defp handle_installation_event(%{action: "created", payload: payload}) do
    installation = payload["installation"]
    repos = payload["repositories"] || []

    # Store/update connection with installation_id
    # Trigger auto-suggest for repo ↔ project linking
    Ema.Integrations.GitHub.AutoSuggest.suggest_links(repos)
    |> broadcast_suggestions()
  end

  defp handle_installation_event(%{action: "deleted", payload: payload}) do
    installation_id = payload["installation"]["id"]
    
    # Mark connection as revoked
    Connection
    |> where([c], c.installation_id == ^installation_id)
    |> Repo.update_all(set: [status: :revoked])
  end

  defp error_message(:ok), do: nil
  defp error_message({:ok, _}), do: nil
  defp error_message(:ignored), do: "Event ignored (no matching handler)"
  defp error_message({:error, reason}), do: inspect(reason)
end
```

---

## 8. Auto-Proposal on PR Flow

### 8.1 PR Significance Detection

```elixir
defmodule Ema.Integrations.GitHub.PRAnalyzer do
  @moduledoc """
  Evaluate whether a PR is "structural" enough to warrant a Proposal in EMA.
  Structural = new features, architectural changes, large refactors.
  Minor = typo fixes, dependency bumps, small patches.
  """

  @structural_thresholds %{
    changed_files: 5,       # 5+ files = likely structural
    additions: 200,          # 200+ lines added
    total_changes: 300       # 300+ total line changes
  }

  @structural_title_patterns [
    ~r/feat(\(|:|\s)/i,           # feat: or feat(scope):
    ~r/feature/i,
    ~r/\badd\b.*\bnew\b/i,       # "add new ..."
    ~r/refactor/i,
    ~r/redesign/i,
    ~r/migration/i,
    ~r/breaking/i,
    ~r/\bapi\b.*\bchange/i,
    ~r/architect/i
  ]

  @minor_patterns [
    ~r/\bfix\b.*\btypo\b/i,
    ~r/bump\s+version/i,
    ~r/update.*dependenc/i,
    ~r/\bchore\b/i,
    ~r/\bdocs?\b\s*:/i,
    ~r/readme/i
  ]

  @spec evaluate(map()) :: :structural | :major | :minor
  def evaluate(pr) do
    scores = [
      size_score(pr),
      title_score(pr["title"]),
      label_score(pr["labels"] || []),
      file_pattern_score(pr)
    ]

    total = Enum.sum(scores)

    cond do
      total >= 3.0 -> :structural
      total >= 1.5 -> :major
      true -> :minor
    end
  end

  defp size_score(pr) do
    changes = (pr["additions"] || 0) + (pr["deletions"] || 0)
    files = pr["changed_files"] || 0

    cond do
      files >= @structural_thresholds.changed_files and changes >= @structural_thresholds.total_changes -> 2.0
      files >= @structural_thresholds.changed_files or changes >= @structural_thresholds.additions -> 1.0
      true -> 0.0
    end
  end

  defp title_score(nil), do: 0.0
  defp title_score(title) do
    cond do
      Enum.any?(@minor_patterns, &Regex.match?(&1, title)) -> -0.5
      Enum.any?(@structural_title_patterns, &Regex.match?(&1, title)) -> 1.5
      true -> 0.0
    end
  end

  defp label_score(labels) do
    label_names = Enum.map(labels, & &1["name"] |> String.downcase())
    cond do
      "enhancement" in label_names or "feature" in label_names -> 1.0
      "breaking-change" in label_names -> 1.5
      "documentation" in label_names or "chore" in label_names -> -0.5
      true -> 0.0
    end
  end

  defp file_pattern_score(pr) do
    # If PR touches migration files, config files, or new directories — structural signal
    # This requires fetching the file list (additional API call)
    # For now, use changed_files count as a proxy
    if (pr["changed_files"] || 0) > 15, do: 0.5, else: 0.0
  end
end
```

### 8.2 Proposal Prompt Creation

When a structural PR is detected, EMA creates a "proposal prompt" — not a full proposal, but a UI notification that surfaces the option to the user:

```elixir
defmodule Ema.Proposals.ProposalPrompt do
  use Ecto.Schema

  schema "proposal_prompts" do
    field :project_id, :binary_id
    field :source, Ecto.Enum, values: [:github_pr, :github_issue, :manual]
    field :title, :string
    field :description, :string
    field :metadata, :map
    field :status, Ecto.Enum, values: [:pending, :accepted, :dismissed], default: :pending
    field :dismissed_at, :utc_datetime

    timestamps()
  end
end
```

**UI Flow:**
1. PR webhook arrives → `PRAnalyzer.evaluate/1` returns `:structural`
2. `ProposalPrompt` created with `status: :pending`
3. PubSub broadcasts to `project:{id}` channel
4. React UI shows card: "**PR #42: Add user authentication** — Create Proposal?"
5. User clicks "Create Proposal" → full `Proposal` created with PR metadata pre-filled
6. User clicks "Dismiss" → prompt marked `:dismissed`

---

## 9. Auto-Task on Deploy Failure

### 9.1 Workflow Run Failure Handler

Already covered in Flow C (Section 4). Additional details:

### 9.2 Deployment Status Events

For repos using GitHub Deployments API (not just Actions):

```elixir
defmodule Ema.Integrations.GitHub.Flows.DeployFailure do
  # ... (Flow C code from Section 4) ...

  def handle_deployment_status(%{event_type: "deployment_status", payload: payload}) do
    status = payload["deployment_status"]
    deployment = payload["deployment"]
    repo_id = payload["repository"]["id"]

    case status["state"] do
      "failure" ->
        create_deploy_failure_task(repo_id, %{
          environment: deployment["environment"],
          description: status["description"],
          url: status["target_url"],
          creator: deployment["creator"]["login"],
          ref: deployment["ref"]
        })

      "error" ->
        create_deploy_failure_task(repo_id, %{
          environment: deployment["environment"],
          description: "Deployment error: #{status["description"]}",
          url: status["target_url"],
          creator: deployment["creator"]["login"],
          ref: deployment["ref"]
        })

      state when state in ["success", "inactive"] ->
        # Resolve any open deploy-failure tasks for this environment
        resolve_deploy_tasks(repo_id, deployment["environment"])

      _ -> :ok
    end
  end

  defp create_deploy_failure_task(repo_id, info) do
    links = RepoLink
    |> where([r], r.github_repo_id == ^repo_id and r.sync_enabled == true 
                  and r.auto_task_on_deploy_fail == true)
    |> Repo.all()

    for link <- links do
      unless duplicate_recent_task?(link, info) do
        {:ok, task} = Ema.Tasks.create_task(%{
          project_id: link.project_id,
          title: "Fix deployment: #{info.environment} failed (#{link.full_name})",
          description: """
          ## Deployment Failure — #{info.environment}

          **Repo:** #{link.full_name}
          **Ref:** #{info.ref}
          **Triggered by:** #{info.creator}
          **Details:** #{info.description}
          #{if info.url, do: "\n[View deployment](#{info.url})", else: ""}
          """,
          priority: :high,
          status: :open,
          source: :github_deployment_failure,
          metadata: %{
            "github_repo" => link.full_name,
            "environment" => info.environment,
            "deploy_ref" => info.ref
          }
        })

        # Pipes trigger
        Ema.Pipes.Engine.trigger(%{
          event: "github.deployment.failed",
          project_id: link.project_id,
          task_id: task.id,
          data: Map.put(info, :repo, link.full_name)
        })
      end
    end
  end

  defp resolve_deploy_tasks(repo_id, environment) do
    links = RepoLink |> where([r], r.github_repo_id == ^repo_id) |> Repo.all()

    for link <- links do
      Ema.Tasks.query()
      |> where([t], t.project_id == ^link.project_id
                    and t.source == :github_deployment_failure
                    and t.status == :open
                    and fragment("metadata->>'environment' = ?", ^environment))
      |> Repo.all()
      |> Enum.each(fn task ->
        Ema.Tasks.update_task(task, %{
          status: :completed,
          completion_note: "Auto-resolved: deployment to #{environment} succeeded"
        })
      end)
    end
  end

  defp duplicate_recent_task?(link, info) do
    cutoff = DateTime.utc_now() |> DateTime.add(-600, :second)
    
    Ema.Tasks.query()
    |> where([t], t.project_id == ^link.project_id
                  and t.source in [:github_workflow_failure, :github_deployment_failure]
                  and fragment("metadata->>'environment' = ?", ^info.environment)
                  and t.inserted_at > ^cutoff)
    |> Repo.exists?()
  end
end
```

### 9.3 Pipes Integration

The `github.deployment.failed` pipe trigger enables downstream automation:

```elixir
# Example Pipe definition that reacts to deploy failures:
%Ema.Pipes.Pipe{
  name: "Deploy Failure Notification",
  trigger: %{
    event: "github.deployment.failed",
    conditions: %{
      "data.environment" => ["production", "staging"]
    }
  },
  actions: [
    %{type: :notify, channel: "#deployments", template: "🚨 Deploy failed: {{data.repo}} → {{data.environment}}"},
    %{type: :assign, to: "on-call", when: %{"data.environment" => "production"}}
  ]
}
```

---

## 10. Testing Strategy

### 10.1 Webhook Fixture Files

```
test/fixtures/github/
├── webhooks/
│   ├── push_single_commit.json
│   ├── push_multiple_commits.json
│   ├── pull_request_opened.json
│   ├── pull_request_merged.json
│   ├── pull_request_closed.json
│   ├── workflow_run_success.json
│   ├── workflow_run_failure.json
│   ├── deployment_status_success.json
│   ├── deployment_status_failure.json
│   ├── issues_opened.json
│   ├── issues_labeled.json
│   ├── release_published.json
│   ├── installation_created.json
│   └── installation_deleted.json
├── api_responses/
│   ├── get_repo.json
│   ├── get_branch.json
│   ├── create_ref.json
│   ├── create_pull_request.json
│   ├── close_issue.json
│   ├── list_commits.json
│   └── rate_limit.json
└── signatures/
    └── test_helpers.ex    # Helper to generate valid HMAC signatures
```

### 10.2 Test Helpers

```elixir
defmodule Ema.Integrations.GitHub.TestHelpers do
  @test_webhook_secret "test-webhook-secret-for-testing"

  def sign_payload(payload) when is_binary(payload) do
    "sha256=" <> (:crypto.mac(:hmac, :sha256, @test_webhook_secret, payload)
                  |> Base.encode16(case: :lower))
  end

  def webhook_conn(event_type, payload, opts \\ []) do
    body = if is_binary(payload), do: payload, else: Jason.encode!(payload)
    delivery_id = opts[:delivery_id] || Ecto.UUID.generate()

    build_conn()
    |> put_req_header("x-github-event", event_type)
    |> put_req_header("x-github-delivery", delivery_id)
    |> put_req_header("x-hub-signature-256", sign_payload(body))
    |> put_req_header("content-type", "application/json")
    |> assign(:raw_body, body)
  end

  def fixture(name) do
    Path.join([__DIR__, "..", "fixtures", "github", "webhooks", "#{name}.json"])
    |> File.read!()
    |> Jason.decode!()
  end
end
```

### 10.3 Unit Tests — Webhook Signature Verification

```elixir
defmodule Ema.Integrations.GitHub.WebhookControllerTest do
  use EmaWeb.ConnCase
  import Ema.Integrations.GitHub.TestHelpers

  describe "POST /api/webhooks/github" do
    test "accepts valid signature" do
      payload = fixture("push_single_commit")
      conn = webhook_conn("push", payload)
      
      conn = post(conn, "/api/webhooks/github")
      assert json_response(conn, 200)["status"] == "accepted"
    end

    test "rejects invalid signature" do
      payload = fixture("push_single_commit") |> Jason.encode!()
      
      conn = build_conn()
      |> put_req_header("x-github-event", "push")
      |> put_req_header("x-github-delivery", Ecto.UUID.generate())
      |> put_req_header("x-hub-signature-256", "sha256=invalid")
      |> put_req_header("content-type", "application/json")
      |> assign(:raw_body, payload)

      conn = post(conn, "/api/webhooks/github")
      assert json_response(conn, 401)
    end

    test "rejects missing signature" do
      conn = build_conn()
      |> put_req_header("x-github-event", "push")
      |> put_req_header("content-type", "application/json")
      |> assign(:raw_body, "{}")

      conn = post(conn, "/api/webhooks/github")
      assert json_response(conn, 401)
    end
  end
end
```

### 10.4 Integration Tests — Sync Flows

```elixir
defmodule Ema.Integrations.GitHub.Flows.CommitActivityTest do
  use Ema.DataCase
  import Ema.Integrations.GitHub.TestHelpers

  setup do
    project = insert(:project)
    connection = insert(:github_connection)
    repo_link = insert(:github_repo_link, 
      project_id: project.id,
      connection_id: connection.id,
      github_repo_id: 123456,
      full_name: "org/repo",
      sync_enabled: true
    )
    insert(:github_sync_state, repo_link_id: repo_link.id)

    %{project: project, repo_link: repo_link}
  end

  test "push event creates project activities", %{project: project} do
    event = %{
      event_type: "push",
      delivery_id: Ecto.UUID.generate(),
      action: nil,
      payload: fixture("push_multiple_commits"),
      received_at: DateTime.utc_now()
    }

    assert :ok = CommitActivity.handle(event)
    
    activities = Ema.Projects.list_activities(project.id)
    assert length(activities) == 3  # 3 commits in fixture
    assert hd(activities).type == :github_commit
  end

  test "push on unwatched branch is ignored", %{project: project, repo_link: repo_link} do
    # Update repo_link to only watch "main"
    Repo.update!(Ecto.Changeset.change(repo_link, watched_branches: []))

    event = %{
      event_type: "push",
      delivery_id: Ecto.UUID.generate(),
      action: nil,
      payload: fixture("push_single_commit") |> put_in(["ref"], "refs/heads/feature-x"),
      received_at: DateTime.utc_now()
    }

    CommitActivity.handle(event)
    assert Ema.Projects.list_activities(project.id) == []
  end
end
```

### 10.5 VCR-Style HTTP Cassettes (using Bypass)

```elixir
defmodule Ema.Integrations.GitHub.APITest do
  use ExUnit.Case

  setup do
    bypass = Bypass.open()
    original_url = Application.get_env(:ema, :github_api_url)
    Application.put_env(:ema, :github_api_url, "http://localhost:#{bypass.port}")
    
    on_exit(fn ->
      Application.put_env(:ema, :github_api_url, original_url)
    end)

    %{bypass: bypass}
  end

  test "create_branch handles success", %{bypass: bypass} do
    Bypass.expect_once(bypass, "POST", "/repos/org/repo/git/refs", fn conn ->
      {:ok, body, conn} = Plug.Conn.read_body(conn)
      assert Jason.decode!(body)["ref"] == "refs/heads/ema/task-abc12345/fix-login"
      
      Plug.Conn.resp(conn, 201, Jason.encode!(%{
        "ref" => "refs/heads/ema/task-abc12345/fix-login",
        "object" => %{"sha" => "abc123"}
      }))
    end)

    assert {:ok, _} = API.create_branch("test-token", "org/repo", "ema/task-abc12345/fix-login", "def456")
  end

  test "create_branch handles 422 conflict", %{bypass: bypass} do
    Bypass.expect_once(bypass, "POST", "/repos/org/repo/git/refs", fn conn ->
      Plug.Conn.resp(conn, 422, Jason.encode!(%{
        "message" => "Reference already exists"
      }))
    end)

    assert {:error, :branch_already_exists} = API.create_branch("test-token", "org/repo", "existing-branch", "abc123")
  end

  test "rate limit tracking from response headers", %{bypass: bypass} do
    Bypass.expect(bypass, "GET", "/repos/org/repo", fn conn ->
      conn
      |> Plug.Conn.put_resp_header("x-ratelimit-remaining", "4500")
      |> Plug.Conn.put_resp_header("x-ratelimit-limit", "5000")
      |> Plug.Conn.put_resp_header("x-ratelimit-reset", "#{System.system_time(:second) + 3600}")
      |> Plug.Conn.resp(200, Jason.encode!(%{"id" => 123, "full_name" => "org/repo"}))
    end)

    {:ok, _body, _etag} = API.get("/repos/org/repo", "test-token")
    # Rate limiter state should now reflect 4500 remaining
  end
end
```

### 10.6 Test Repo Setup

For end-to-end testing against real GitHub:

```elixir
# config/test.exs
config :ema, :github,
  # Use a dedicated test org/repo
  test_repo: "ema-test-org/integration-test-repo",
  test_token: System.get_env("GITHUB_TEST_TOKEN"),
  webhook_secret: "test-webhook-secret-for-testing",
  api_url: System.get_env("GITHUB_API_URL", "https://api.github.com")

# For CI: use Bypass (mock) by default
# For local e2e: set GITHUB_E2E=true to hit real GitHub
config :ema, :github_e2e, System.get_env("GITHUB_E2E") == "true"
```

```elixir
defmodule Ema.Integrations.GitHub.E2ETest do
  use ExUnit.Case

  @moduletag :e2e
  @moduletag :github

  # Only runs with: mix test --include e2e
  # Requires GITHUB_TEST_TOKEN and a real test repo

  setup do
    unless Application.get_env(:ema, :github_e2e) do
      ExUnit.skip("Set GITHUB_E2E=true for end-to-end tests")
    end

    config = Application.get_env(:ema, :github)
    %{repo: config[:test_repo], token: config[:test_token]}
  end

  test "full branch lifecycle", %{repo: repo, token: token} do
    branch_name = "ema-test/#{System.system_time(:second)}"
    
    # Get default branch SHA
    {:ok, sha} = API.get_branch_sha(token, repo, "main")
    
    # Create branch
    {:ok, _} = API.create_branch(token, repo, branch_name, sha)
    
    # Verify branch exists
    {:ok, _} = API.get_branch_sha(token, repo, branch_name)
    
    # Cleanup
    API.delete_branch(token, repo, branch_name)
  end
end
```

### 10.7 Property-Based Tests

```elixir
defmodule Ema.Integrations.GitHub.PRAnalyzerPropertyTest do
  use ExUnit.Case
  use ExUnitProperties

  property "PRs with very high line changes are always structural or major" do
    check all additions <- integer(500..10000),
              deletions <- integer(100..5000),
              files <- integer(10..100) do
      pr = %{
        "additions" => additions,
        "deletions" => deletions,
        "changed_files" => files,
        "title" => "Some PR",
        "labels" => []
      }

      result = PRAnalyzer.evaluate(pr)
      assert result in [:structural, :major]
    end
  end

  property "PRs with minimal changes are minor" do
    check all additions <- integer(0..10),
              deletions <- integer(0..5),
              files <- integer(1..2) do
      pr = %{
        "additions" => additions,
        "deletions" => deletions,
        "changed_files" => files,
        "title" => "fix: typo in readme",
        "labels" => [%{"name" => "documentation"}]
      }

      result = PRAnalyzer.evaluate(pr)
      assert result == :minor
    end
  end
end
```

---

## Appendix A: Environment Variables

```bash
# Required
GITHUB_APP_ID=123456
GITHUB_APP_CLIENT_ID=Iv1.abcdef123456
GITHUB_APP_CLIENT_SECRET=secret_value
GITHUB_APP_PRIVATE_KEY_PATH=/etc/ema/github-app.pem
GITHUB_WEBHOOK_SECRET=whsec_random_string

# Optional
GITHUB_API_URL=https://api.github.com        # Override for GitHub Enterprise
GITHUB_WEBHOOK_URL=https://ema.example.com/api/webhooks/github  # Public URL for webhooks
```

## Appendix B: Phoenix Router (Complete GitHub Routes)

```elixir
# router.ex

scope "/api", EmaWeb do
  pipe_through :api

  # OAuth callback
  scope "/auth/github", Ema.Integrations.GitHub do
    get "/callback", AuthController, :callback
  end

  # Webhook endpoint (no auth pipe — uses signature verification)
  scope "/webhooks", Ema.Integrations.GitHub do
    post "/github", WebhookController, :handle
    post "/github/:installation_id", WebhookController, :handle
  end

  # GitHub management API (authenticated)
  scope "/github", Ema.Integrations.GitHub do
    pipe_through :authenticated

    # Connections
    get "/connections", ConnectionController, :index
    post "/connections/authorize", ConnectionController, :authorize
    delete "/connections/:id", ConnectionController, :revoke

    # Repo linking
    get "/repos/available", RepoController, :available    # List repos from all connections
    get "/repos/suggestions", RepoController, :suggestions # Auto-suggest links
    post "/repos/link", RepoController, :link
    delete "/repos/:id", RepoController, :unlink
    put "/repos/:id/settings", RepoController, :update_settings

    # Actions
    post "/branches", ActionController, :create_branch
    post "/pull-requests", ActionController, :create_pr
    post "/sync/:repo_link_id", ActionController, :force_sync

    # Status
    get "/status", StatusController, :index
  end
end
```

## Appendix C: Sequence Diagrams

### OAuth Flow
```
User          EMA UI        EMA Backend       GitHub
 │               │               │               │
 │──Connect───→ │               │               │
 │               │──GET /auth──→│               │
 │               │               │──Build URL──→│
 │               │←──Redirect───│               │
 │←──Redirect to GitHub─────────│               │
 │               │               │               │
 │──Authorize──→│               │               │
 │               │               │←──Callback───│
 │               │               │──Exchange────→│
 │               │               │←──Tokens─────│
 │               │               │──Store────→DB │
 │←──Connected──│←──Success────│               │
```

### Webhook Processing
```
GitHub        EMA Webhook      Event Router      Flow Handler       EMA State
  │               │               │                 │                  │
  │──POST────────→│               │                 │                  │
  │               │──Verify Sig──→│                 │                  │
  │               │──Store Raw───→│                 │                  │
  │←──200 OK─────│               │                 │                  │
  │               │──Dispatch────→│                 │                  │
  │               │               │──Route──────────→│                  │
  │               │               │                 │──Update─────────→│
  │               │               │                 │──PubSub Broadcast→│
  │               │               │                 │←─────────────────│
  │               │               │←──Result────────│                  │
  │               │               │──Update Status──→DB               │
```

### Branch Creation (EMA → GitHub)
```
User          EMA UI        Task Flow         GitHub API       Token Mgr
 │               │               │               │               │
 │──Create ──→ │               │               │               │
 │  Branch       │──POST /api──→│               │               │
 │               │               │──Get Token──→│               │
 │               │               │               │←──Token──────│
 │               │               │──GET sha────→│               │
 │               │               │←──sha────────│               │
 │               │               │──POST ref───→│               │
 │               │               │←──201────────│               │
 │               │               │──Update Task→DB              │
 │               │←──Branch URL─│               │               │
 │←──Success────│               │               │               │
```
