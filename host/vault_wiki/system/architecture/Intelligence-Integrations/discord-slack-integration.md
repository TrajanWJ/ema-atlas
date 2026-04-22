---
type: knowledge
wiki_id: system/architecture/Intelligence-Integrations/discord-slack-integration
imported_from: vault/Architecture/Intelligence-Integrations/discord-slack-integration.md
imported_at: '2026-04-04T00:23:56.760Z'
tags: []
summary: ''
---
# EMA Discord & Slack Integration Design

## Table of Contents
1. [Architecture Decision](#1-architecture-decision)
2. [OAuth2 + Bot Setup](#2-oauth2--bot-setup)
3. [Slash Commands](#3-slash-commands)
4. [Reaction Handling](#4-reaction-handling)
5. [Channel Routing Rules](#5-channel-routing-rules)
6. [Keyword Detection](#6-keyword-detection)
7. [Posting Formats](#7-posting-formats)
8. [Slack Design](#8-slack-design)
9. [Data Flow](#9-data-flow)
10. [Channels App API](#10-ema-channels-app-api)
11. [Bot Commands Reference](#11-bot-commands-reference-card)

---

## 1. Architecture Decision

### Option A: Own Bot (Nostrum)

EMA runs its own Discord bot using [Nostrum](https://github.com/Kraigie/nostrum), a native Elixir Discord library.

```
Discord API ←→ Nostrum (Elixir) ←→ EMA GenServers ←→ Pipes Engine
```

**Pros:**
- Zero external dependencies — pure Elixir, fits the OTP supervision tree
- Direct access to all Discord gateway events (presence, voice state, typing, etc.)
- Sub-second latency: no HTTP hop between EMA and a middleware
- Full control over rate limiting, caching, sharding
- Message tracking lives in the same DB as the rest of EMA
- Nostrum's `ConsumerSupervisor` maps cleanly to EMA's event-driven Pipes architecture

**Cons:**
- Two bots in the same guild (OpenClaw's + EMA's) — user confusion, duplicate event processing
- Must manage bot token, intents, gateway connection independently
- OpenClaw's existing Discord presence becomes redundant for EMA channels

### Option B: OpenClaw Gateway Proxy

EMA sends all Discord operations through OpenClaw's HTTP gateway (port 18789).

```
EMA (Elixir) → HTTP → OpenClaw Gateway (Node.js) → Discord API
Discord API → OpenClaw → Webhook/WS → EMA
```

**Pros:**
- Single bot identity in the guild
- OpenClaw already handles auth, rate limits, connection management
- No additional Discord application needed

**Cons:**
- **Hard dependency on OpenClaw uptime** — if the gateway restarts, EMA loses Discord
- Added latency (~50-150ms per message) through the HTTP proxy
- OpenClaw's plugin API is designed for AI agent workflows, not arbitrary event routing
- EMA becomes a second-class citizen on someone else's message bus
- Incoming event filtering is limited to what OpenClaw exposes (no raw gateway events)
- Two different runtimes (Node.js + Elixir) to debug when things break

### Option C: Hybrid

OpenClaw handles incoming messages (it's already listening), forwards relevant ones to EMA via webhook. EMA posts outgoing messages directly via Discord REST API or webhooks.

```
Incoming: Discord → OpenClaw → HTTP POST → EMA webhook endpoint
Outgoing: EMA → Discord REST API (direct) or Discord Webhooks
```

**Pros:**
- Avoids duplicate gateway connections for incoming events
- EMA controls its own outgoing identity (webhook avatars, names)
- Simpler than full Nostrum for outgoing-only

**Cons:**
- Split responsibility makes debugging harder ("did OpenClaw drop it or did EMA?")
- Still depends on OpenClaw for incoming events
- Webhooks can't do everything (no reactions, no slash commands, no thread management)
- Two systems to configure for one integration

### ✅ Recommendation: Option A — Own Bot (Nostrum)

**Rationale:**

1. **Independence.** EMA is a standalone system. Coupling it to OpenClaw's runtime for a core feature (messaging) creates a fragile dependency. When OpenClaw restarts (which it does — gateway restarts are a known pattern), EMA shouldn't lose Discord.

2. **Architecture fit.** Nostrum is built on OTP. It runs supervised GenServers that emit events — exactly like the rest of EMA. The integration is native, not bolted on.

3. **Full capability.** Only a direct gateway connection gives EMA access to reactions, presence, typing indicators, thread events, and slash command interactions. Proxying through OpenClaw limits EMA to whatever OpenClaw chooses to expose.

4. **Two-bot coexistence is fine.** Discord guilds routinely have 10+ bots. Users interact with EMA via `/ema` commands and EMA-branded embeds. OpenClaw continues to serve its own purpose (AI agent gateway). No conflict.

5. **OpenClaw coordination.** EMA and OpenClaw can share a Phoenix.PubSub topic for cross-system events if needed. OpenClaw can call EMA's API to trigger pipes. They coordinate at the application layer, not the Discord layer.

**Migration path:** If OpenClaw eventually adds a proper plugin SDK with event subscriptions, EMA could optionally route through it. But the Nostrum foundation ensures EMA never *depends* on it.

---

## 2. OAuth2 + Bot Setup

### Discord Application Configuration

```yaml
application:
  name: "EMA"
  description: "Execution Management Agent — task automation & deliberation"
  icon: "ema-logo.png"  # 512x512 minimum

bot:
  username: "EMA"
  public_bot: false  # Only Trajan's servers
  
gateway_intents:
  privileged:
    - MESSAGE_CONTENT        # Required for keyword detection
    - GUILD_MEMBERS          # Optional: track who's in the guild
  standard:
    - GUILDS                 # Guild metadata
    - GUILD_MESSAGES         # Messages in channels
    - GUILD_MESSAGE_REACTIONS # Reaction events
    - DIRECT_MESSAGES        # DM flow
    - DIRECT_MESSAGE_REACTIONS
```

### OAuth2 Scopes

| Scope | Purpose |
|-------|---------|
| `bot` | Bot user in guilds |
| `applications.commands` | Register slash commands |
| `guilds` | Read guild info for channel routing UI |

**OAuth2 URL (guild install):**
```
https://discord.com/oauth2/authorize?client_id={APP_ID}
  &scope=bot+applications.commands
  &permissions=379968
```

**Permission integer `379968` includes:**
- Send Messages, Embed Links, Attach Files, Read Message History
- Add Reactions, Use External Emojis
- Manage Messages (for pinning)
- Use Slash Commands
- Create Public Threads, Send Messages in Threads

### Bot Token vs User OAuth

| Scenario | Token Type |
|----------|-----------|
| All EMA operations | Bot token |
| "Connect your Discord" in Channels App UI | OAuth2 user flow (for channel listing) |
| Posting messages, reactions, commands | Bot token only |

EMA uses the **bot token** for all runtime operations. User OAuth is only used during the initial Channels App setup flow to let the user browse their guilds/channels and select which ones to link.

### Slash Commands: Guild-Specific

Register commands per-guild (instant propagation) rather than globally (up to 1 hour cache):

```elixir
# On guild join or config change
Nostrum.Api.ApplicationCommand.create_guild_command(guild_id, command_spec)
```

### Token Storage

```elixir
# config/runtime.exs
config :ema, :discord,
  bot_token: System.fetch_env!("EMA_DISCORD_BOT_TOKEN"),
  application_id: System.fetch_env!("EMA_DISCORD_APP_ID"),
  # Optional: per-guild overrides stored in DB
  guild_configs_table: :ema_discord_guild_configs
```

Bot token stored in environment variable, never in config files or DB. Guild-specific settings (linked channels, routing rules) stored in EMA's Postgres DB.

---

## 3. Slash Commands

### Command Tree

All commands live under `/ema` to avoid namespace collisions.

```
/ema
├── status                          # System overview
├── task
│   ├── create <title> [project] [priority]  # Create task
│   ├── list [project] [status]              # List tasks
│   └── done <id>                            # Mark complete
├── proposal
│   ├── approve <id> [reason]       # Approve proposal
│   ├── reject <id> <reason>        # Reject (reason required)
│   ├── list [status]               # List pending proposals
│   └── show <id>                   # Show proposal details
├── project
│   ├── switch <name>               # Set active project context
│   ├── list                        # List all projects
│   └── status [name]               # Project health summary
├── execute <prompt>                # Trigger agent execution
├── brain <text>                    # Capture to BrainDump
├── pipe
│   ├── list                        # List active pipes
│   ├── trigger <name> [input]      # Manually trigger a pipe
│   └── pause <name>                # Pause a pipe
├── config
│   ├── channel <event_type> [#channel]  # Route event to channel
│   └── keywords [add|remove] <word>     # Manage keywords
└── help [command]                  # Help text
```

### Command Specifications

```elixir
defmodule EMA.Discord.Commands do
  @commands [
    %{
      name: "ema",
      description: "EMA - Execution Management Agent",
      options: [
        %{
          name: "status",
          description: "Current EMA system state",
          type: 1  # SUB_COMMAND
        },
        %{
          name: "task",
          description: "Task management",
          type: 2,  # SUB_COMMAND_GROUP
          options: [
            %{
              name: "create",
              description: "Create a new task",
              type: 1,
              options: [
                %{name: "title", description: "Task title", type: 3, required: true},
                %{name: "project", description: "Project name", type: 3, required: false,
                  autocomplete: true},
                %{name: "priority", description: "Priority level", type: 3, required: false,
                  choices: [
                    %{name: "🔴 Critical", value: "critical"},
                    %{name: "🟠 High", value: "high"},
                    %{name: "🟡 Normal", value: "normal"},
                    %{name: "🟢 Low", value: "low"}
                  ]}
              ]
            },
            %{
              name: "list",
              description: "List tasks",
              type: 1,
              options: [
                %{name: "project", description: "Filter by project", type: 3, autocomplete: true},
                %{name: "status", description: "Filter by status", type: 3,
                  choices: [
                    %{name: "Active", value: "active"},
                    %{name: "Done", value: "done"},
                    %{name: "Blocked", value: "blocked"}
                  ]}
              ]
            },
            %{
              name: "done",
              description: "Mark task complete",
              type: 1,
              options: [
                %{name: "id", description: "Task ID", type: 3, required: true, autocomplete: true}
              ]
            }
          ]
        },
        %{
          name: "proposal",
          description: "Proposal deliberation",
          type: 2,
          options: [
            %{
              name: "approve",
              description: "Approve a proposal",
              type: 1,
              options: [
                %{name: "id", description: "Proposal ID", type: 3, required: true, autocomplete: true},
                %{name: "reason", description: "Approval note", type: 3}
              ]
            },
            %{
              name: "reject",
              description: "Reject a proposal",
              type: 1,
              options: [
                %{name: "id", description: "Proposal ID", type: 3, required: true, autocomplete: true},
                %{name: "reason", description: "Rejection reason", type: 3, required: true}
              ]
            },
            %{
              name: "list",
              description: "List proposals",
              type: 1,
              options: [
                %{name: "status", description: "Filter", type: 3,
                  choices: [
                    %{name: "Pending", value: "pending"},
                    %{name: "Approved", value: "approved"},
                    %{name: "Rejected", value: "rejected"},
                    %{name: "All", value: "all"}
                  ]}
              ]
            },
            %{
              name: "show",
              description: "Show proposal details",
              type: 1,
              options: [
                %{name: "id", description: "Proposal ID", type: 3, required: true, autocomplete: true}
              ]
            }
          ]
        },
        %{
          name: "project",
          description: "Project management",
          type: 2,
          options: [
            %{
              name: "switch",
              description: "Set active project context",
              type: 1,
              options: [
                %{name: "name", description: "Project name", type: 3, required: true, autocomplete: true}
              ]
            },
            %{name: "list", description: "List all projects", type: 1},
            %{
              name: "status",
              description: "Project health summary",
              type: 1,
              options: [
                %{name: "name", description: "Project name", type: 3, autocomplete: true}
              ]
            }
          ]
        },
        %{
          name: "execute",
          description: "Trigger Claude agent execution",
          type: 1,
          options: [
            %{name: "prompt", description: "What to execute", type: 3, required: true}
          ]
        },
        %{
          name: "brain",
          description: "Capture text to BrainDump",
          type: 1,
          options: [
            %{name: "text", description: "Text to capture", type: 3, required: true}
          ]
        },
        %{
          name: "help",
          description: "Command reference",
          type: 1,
          options: [
            %{name: "command", description: "Specific command", type: 3, autocomplete: true}
          ]
        }
      ]
    }
  ]
end
```

### Autocomplete Handler

```elixir
defmodule EMA.Discord.Autocomplete do
  def handle("project", partial) do
    EMA.Projects.search(partial, limit: 25)
    |> Enum.map(&%{name: &1.name, value: &1.slug})
  end

  def handle("id", partial) when context == :proposal do
    EMA.Proposals.search(partial, status: :pending, limit: 25)
    |> Enum.map(&%{name: "#{&1.id} — #{&1.title}", value: &1.id})
  end

  def handle("id", partial) when context == :task do
    EMA.Tasks.search(partial, status: :active, limit: 25)
    |> Enum.map(&%{name: "#{&1.id} — #{&1.title}", value: &1.id})
  end
end
```

### Interaction Response Pattern

All slash commands respond ephemerally first (only the invoker sees it), then post a public embed if the action succeeds:

```elixir
defmodule EMA.Discord.InteractionHandler do
  # Acknowledge immediately (Discord requires <3s response)
  def handle_interaction(%{type: 2, data: %{name: "ema"}} = interaction) do
    # Defer with ephemeral flag
    Nostrum.Api.Interaction.create_response(interaction, %{type: 5, data: %{flags: 64}})
    
    # Process async
    Task.start(fn ->
      result = dispatch_command(interaction)
      Nostrum.Api.Interaction.edit_response(interaction, result)
    end)
  end
end
```

---

## 4. Reaction Handling

### Message Tracking Database

Every message EMA posts to Discord is tracked for reaction routing:

```sql
CREATE TABLE discord_message_map (
  id              BIGSERIAL PRIMARY KEY,
  discord_msg_id  BIGINT NOT NULL UNIQUE,
  discord_ch_id   BIGINT NOT NULL,
  guild_id        BIGINT NOT NULL,
  ema_object_type VARCHAR(32) NOT NULL,  -- 'proposal', 'execution', 'task', 'braindump'
  ema_object_id   UUID NOT NULL,
  posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_discord_msg_map_object ON discord_message_map(ema_object_type, ema_object_id);
CREATE INDEX idx_discord_msg_map_msg ON discord_message_map(discord_msg_id);

-- Cleanup: messages older than 90 days (reactions on old messages are unlikely)
-- Cron: DELETE FROM discord_message_map WHERE posted_at < NOW() - INTERVAL '90 days';
```

### Reaction → Action Mapping

```elixir
defmodule EMA.Discord.ReactionRouter do
  @reaction_map %{
    "✅" => :approve,
    "❌" => :reject,
    "🚀" => :pin_to_project,
    "📌" => :capture_braindump,
    "🔄" => :retry_execution,
    "👀" => :mark_reviewed
  }

  def handle_reaction_add(emoji_name, message_id, user_id, channel_id) do
    action = Map.get(@reaction_map, emoji_name)
    
    with {:ok, mapping} <- lookup_message(message_id),
         {:ok, _} <- authorize_user(user_id, action, mapping) do
      dispatch_reaction(action, mapping, user_id)
    else
      {:error, :not_tracked} -> :ignore  # Not an EMA message
      {:error, :unauthorized} -> send_dm(user_id, "You don't have permission for that action.")
    end
  end

  defp dispatch_reaction(:approve, %{ema_object_type: "proposal", ema_object_id: id}, user_id) do
    EMA.Proposals.approve(id, approved_by: user_id, source: :discord_reaction)
    # Post confirmation in thread
  end

  defp dispatch_reaction(:reject, %{ema_object_type: "proposal", ema_object_id: id}, user_id) do
    # Open DM to ask for rejection reason
    {:ok, dm} = Nostrum.Api.User.create_dm(user_id)
    Nostrum.Api.Message.create(dm.id, %{
      content: "You rejected proposal `#{id}`. What's the reason?",
      components: [
        %{type: 1, components: [
          %{type: 4, custom_id: "reject_reason:#{id}", style: 1,
            label: "Rejection Reason", placeholder: "Why are you rejecting this?",
            required: true, min_length: 10, max_length: 500}
        ]}
      ]
    })
    # Actually: use a Modal interaction instead. See below.
  end

  defp dispatch_reaction(:pin_to_project, %{ema_object_type: "execution", ema_object_id: id}, _user_id) do
    EMA.Executions.pin_to_project(id)
  end

  defp dispatch_reaction(:capture_braindump, _mapping, user_id) do
    # For 📌 on ANY message (not just EMA messages), fetch the message content
    # and create a BrainDump entry
    with {:ok, msg} <- Nostrum.Api.Message.get(channel_id, message_id) do
      EMA.BrainDump.create(%{
        content: msg.content,
        source: :discord,
        source_url: message_url(msg),
        captured_by: user_id
      })
    end
  end
end
```

### Rejection Modal Flow

When a user reacts with ❌ on a proposal, EMA sends a modal (form popup) to collect the reason:

```elixir
defp open_rejection_modal(interaction, proposal_id) do
  Nostrum.Api.Interaction.create_response(interaction, %{
    type: 9,  # MODAL
    data: %{
      custom_id: "reject_proposal:#{proposal_id}",
      title: "Reject Proposal",
      components: [
        %{
          type: 1,  # ACTION_ROW
          components: [
            %{
              type: 4,  # TEXT_INPUT
              custom_id: "reason",
              style: 2,  # PARAGRAPH
              label: "Rejection Reason",
              placeholder: "Why should this proposal be rejected?",
              required: true,
              min_length: 10,
              max_length: 1000
            }
          ]
        }
      ]
    }
  })
end
```

> **Note on reaction-triggered modals:** Discord does not natively support opening a modal from a reaction event (only from button/select interactions). For the ❌ rejection flow, EMA instead sends an ephemeral message with a "Provide Reason" button. Clicking *that* button opens the modal. Alternatively, EMA can DM the user asking for the reason as a plain text reply.

### Reaction Summary Table

| Emoji | Target Object | Action | Confirmation |
|-------|--------------|--------|-------------|
| ✅ | Proposal | Approve | ✅ added by bot, thread reply |
| ❌ | Proposal | Reject (prompts reason) | DM/button → modal → thread reply |
| 🚀 | Execution | Pin to project | 📍 react added by bot |
| 📌 | Any message | Capture to BrainDump | 📌 react + ephemeral "Captured!" |
| 🔄 | Execution | Retry execution | Thread reply with new result |
| 👀 | Task | Mark as reviewed | Thread reply confirmation |

---

## 5. Channel Routing Rules

### Schema

```elixir
defmodule EMA.Channels.RoutingRule do
  use Ecto.Schema

  schema "channel_routing_rules" do
    field :guild_id, :integer
    field :event_type, :string        # "execution.completed", "proposal.ready", etc.
    field :target_channel_id, :integer
    field :format, :string, default: "embed"  # "embed", "compact", "silent"
    field :conditions, :map, default: %{}     # {"project": "ema", "priority": "critical"}
    field :enabled, :boolean, default: true
    field :priority, :integer, default: 0     # Higher = evaluated first
    
    belongs_to :project, EMA.Projects.Project  # nil = all projects

    timestamps()
  end
end
```

### Event Types

```yaml
# Core events that can be routed
events:
  execution:
    - execution.started
    - execution.completed
    - execution.failed
  proposal:
    - proposal.created
    - proposal.ready        # All requirements met, awaiting approval
    - proposal.approved
    - proposal.rejected
  task:
    - task.created
    - task.assigned
    - task.completed
    - task.overdue
  system:
    - system.alert          # Errors, failures
    - system.heartbeat      # Periodic health check
    - system.pipe_triggered
  braindump:
    - braindump.created
```

### Default Routes

```elixir
@default_routes [
  # All execution results go to #ema-executions
  %{event_type: "execution.*", target_channel: "ema-executions", format: "embed"},
  
  # Proposals go to #ema-proposals
  %{event_type: "proposal.*", target_channel: "ema-proposals", format: "embed"},
  
  # Alerts always go to #ema-alerts (highest priority)
  %{event_type: "system.alert", target_channel: "ema-alerts", format: "embed", priority: 100},
  
  # Failed executions ALSO go to alerts
  %{event_type: "execution.failed", target_channel: "ema-alerts", format: "compact", priority: 50},
  
  # Heartbeats to #ema-system (compact, no noise)
  %{event_type: "system.heartbeat", target_channel: "ema-system", format: "compact"},
  
  # Tasks to #ema-tasks
  %{event_type: "task.*", target_channel: "ema-tasks", format: "embed"},
  
  # BrainDump captures to #ema-brain
  %{event_type: "braindump.created", target_channel: "ema-brain", format: "compact"}
]
```

### Per-Project Overrides

```elixir
# Example: Project "phoenix-app" routes all events to its own channel
%RoutingRule{
  event_type: "*",
  target_channel_id: 123456789,  # #phoenix-app
  conditions: %{},
  project_id: "phoenix-app",
  priority: 10
}
```

### Routing Engine

```elixir
defmodule EMA.Channels.Router do
  @doc """
  Given an EMA event, find all matching routing rules and dispatch.
  Multiple rules can match — an event can post to multiple channels.
  """
  def route(%EMA.Event{} = event) do
    rules = 
      RoutingRule
      |> where([r], r.enabled == true)
      |> where([r], r.guild_id == ^event.guild_id)
      |> order_by([r], desc: r.priority)
      |> Repo.all()

    matching_rules = Enum.filter(rules, &matches?(&1, event))
    
    Enum.each(matching_rules, fn rule ->
      message = EMA.Discord.Formatter.format(event, rule.format)
      EMA.Discord.Poster.send(rule.target_channel_id, message)
    end)
  end

  defp matches?(rule, event) do
    event_match?(rule.event_type, event.type) &&
    project_match?(rule.project_id, event.project_id) &&
    conditions_match?(rule.conditions, event.metadata)
  end

  defp event_match?(pattern, event_type) do
    case String.split(pattern, ".") do
      [category, "*"] -> String.starts_with?(event_type, category <> ".")
      ["*"] -> true
      _ -> pattern == event_type
    end
  end
end
```

### Visual Rule Builder API

The Channels App UI provides a drag-and-drop rule builder. Backend API:

```
POST /api/channels/routing-rules
{
  "event_type": "execution.completed",
  "target_channel_id": "123456789",
  "format": "embed",
  "conditions": {"project": "ema"},
  "priority": 10,
  "enabled": true
}

GET /api/channels/routing-rules?guild_id=xxx
→ Returns all rules, ordered by priority

PUT /api/channels/routing-rules/:id
→ Update a rule

DELETE /api/channels/routing-rules/:id
→ Delete a rule

POST /api/channels/routing-rules/test
{
  "event_type": "execution.completed",
  "mock_data": {"project": "ema", "status": "success"}
}
→ Returns which channels would receive this event (dry-run)
```

---

## 6. Keyword Detection

### Default Keywords

```elixir
defmodule EMA.Discord.KeywordDetector do
  @default_prefixes [
    {"ema:", :braindump},        # "ema: look into rate limiting" → BrainDump
    {"task:", :create_task},      # "task: fix the login bug" → Task
    {"proposal:", :create_proposal}, # "proposal: switch to PostgreSQL" → Proposal
    {"note:", :braindump},       # "note: meeting at 3pm" → BrainDump
    {"bug:", :create_task},      # "bug: crash on startup" → Task (priority: high)
    {"idea:", :braindump},       # "idea: what if we used GraphQL?" → BrainDump
  ]

  @doc "Only process messages that start with a known prefix. No ambient scanning."
  def detect(message_content) do
    content = String.trim(message_content)
    
    Enum.find_value(@default_prefixes, fn {prefix, action} ->
      if String.starts_with?(String.downcase(content), prefix) do
        body = String.slice(content, String.length(prefix)..-1//1) |> String.trim()
        {action, body, prefix}
      end
    end)
  end
end
```

### Design Principles for False Positive Prevention

1. **Prefix-only matching.** Messages must *start with* a keyword prefix (e.g., `ema: ...`). No ambient keyword scanning in message bodies.
2. **Colon required.** The prefix must include a colon — `ema fix bug` does NOT trigger, `ema: fix bug` does.
3. **Bot messages ignored.** Never process messages from bots (including EMA itself).
4. **Channel allowlist.** Keyword detection only runs in channels explicitly opted-in via routing rules. By default, OFF in all channels.
5. **Minimum content length.** Require at least 3 characters after the prefix to avoid accidental triggers.
6. **Cooldown per user.** Max 5 captures per user per minute to prevent spam.

### Custom Keywords Per Guild

```sql
CREATE TABLE keyword_configs (
  id          BIGSERIAL PRIMARY KEY,
  guild_id    BIGINT NOT NULL,
  prefix      VARCHAR(32) NOT NULL,     -- "deploy:", "review:", etc.
  action      VARCHAR(32) NOT NULL,     -- "braindump", "create_task", "create_proposal"
  metadata    JSONB DEFAULT '{}',       -- {"default_project": "ema", "priority": "high"}
  enabled     BOOLEAN DEFAULT true,
  created_by  BIGINT,                   -- Discord user ID
  
  UNIQUE(guild_id, prefix)
);
```

### API for Keyword Management

```
GET  /api/channels/:guild_id/keywords         → list configured keywords
POST /api/channels/:guild_id/keywords         → add keyword { prefix, action, metadata }
PUT  /api/channels/:guild_id/keywords/:id     → update
DELETE /api/channels/:guild_id/keywords/:id   → remove
```

Also configurable via slash command:
```
/ema config keywords add deploy: create_task
/ema config keywords remove deploy:
/ema config keywords list
```

---

## 7. Posting Formats

### Execution Result Embed

```json
{
  "embeds": [{
    "title": "⚡ Execution Complete",
    "color": 5025616,
    "fields": [
      {"name": "Project", "value": "`phoenix-app`", "inline": true},
      {"name": "Agent", "value": "Claude Opus", "inline": true},
      {"name": "Status", "value": "✅ Success", "inline": true},
      {"name": "Duration", "value": "12.4s", "inline": true},
      {"name": "Pipe", "value": "`code-review`", "inline": true},
      {"name": "Tokens", "value": "3,847", "inline": true},
      {"name": "Output Preview", "value": "```\nFixed 3 type errors in auth.ex:\n- Line 42: expected String, got integer\n- Line 78: undefined function validate/1\n- Line 103: missing return type\n```"}
    ],
    "footer": {"text": "EMA • exec-a7f3b2"},
    "timestamp": "2026-04-03T21:30:00.000Z"
  }],
  "components": [{
    "type": 1,
    "components": [
      {"type": 2, "style": 1, "label": "View Full Output", "custom_id": "exec_view:a7f3b2"},
      {"type": 2, "style": 2, "label": "Re-run", "custom_id": "exec_rerun:a7f3b2", "emoji": {"name": "🔄"}},
      {"type": 2, "style": 5, "label": "Open in EMA", "url": "http://localhost:4488/executions/a7f3b2"}
    ]
  }]
}
```

### Failed Execution Embed

```json
{
  "embeds": [{
    "title": "❌ Execution Failed",
    "color": 15158332,
    "fields": [
      {"name": "Project", "value": "`phoenix-app`", "inline": true},
      {"name": "Agent", "value": "Claude Opus", "inline": true},
      {"name": "Duration", "value": "45.2s", "inline": true},
      {"name": "Error", "value": "```\nCompilationError: module EMA.Auth is not available\n```"},
      {"name": "Pipe", "value": "`deploy-staging`", "inline": true}
    ],
    "footer": {"text": "EMA • exec-b8c4d1"},
    "timestamp": "2026-04-03T21:32:00.000Z"
  }]
}
```

### Proposal Notification Embed

```json
{
  "embeds": [{
    "title": "📋 Proposal Ready for Review",
    "color": 16750848,
    "description": "**Switch primary database to PostgreSQL 16**\n\nMigrate from SQLite to PostgreSQL for better concurrency handling and full-text search support.",
    "fields": [
      {"name": "Type", "value": "🏗️ Architecture", "inline": true},
      {"name": "Impact", "value": "🔴 High", "inline": true},
      {"name": "Project", "value": "`ema-core`", "inline": true},
      {"name": "Readiness", "value": "✅ Requirements met\n✅ Impact assessed\n✅ Rollback plan ready", "inline": false},
      {"name": "Proposed By", "value": "Agent: Architect", "inline": true},
      {"name": "Deadline", "value": "<t:1712268000:R>", "inline": true}
    ],
    "footer": {"text": "EMA • prop-c9d5e2 • React ✅ to approve, ❌ to reject"}
  }],
  "components": [{
    "type": 1,
    "components": [
      {"type": 2, "style": 3, "label": "Approve", "custom_id": "proposal_approve:c9d5e2", "emoji": {"name": "✅"}},
      {"type": 2, "style": 4, "label": "Reject", "custom_id": "proposal_reject:c9d5e2", "emoji": {"name": "❌"}},
      {"type": 2, "style": 2, "label": "View Details", "custom_id": "proposal_view:c9d5e2"},
      {"type": 2, "style": 5, "label": "Open in EMA", "url": "http://localhost:4488/proposals/c9d5e2"}
    ]
  }]
}
```

### Task Assignment Notification

```json
{
  "embeds": [{
    "title": "📝 Task Assigned",
    "color": 3447003,
    "fields": [
      {"name": "Task", "value": "Fix authentication timeout on mobile", "inline": false},
      {"name": "Project", "value": "`phoenix-app`", "inline": true},
      {"name": "Priority", "value": "🟠 High", "inline": true},
      {"name": "Assigned To", "value": "Agent: Coder", "inline": true},
      {"name": "Due", "value": "<t:1712354400:R>", "inline": true}
    ],
    "footer": {"text": "EMA • task-d0e6f3"}
  }]
}
```

### Alert Format

```json
{
  "embeds": [{
    "title": "🚨 System Alert",
    "color": 15158332,
    "description": "**Deployment to staging failed**\n\nThe `deploy-staging` pipe failed after 3 retries.",
    "fields": [
      {"name": "Severity", "value": "🔴 Critical", "inline": true},
      {"name": "Source", "value": "Pipes Engine", "inline": true},
      {"name": "Time", "value": "<t:1712268000:f>", "inline": true},
      {"name": "Error", "value": "```\nConnection refused: staging.example.com:22\n```"}
    ],
    "footer": {"text": "EMA • alert-e1f7g4"}
  }],
  "content": "<@user_id>"
}
```

### Compact Format (for heartbeats, low-priority events)

```json
{
  "content": "💚 **EMA Heartbeat** — 3 active pipes, 12 tasks, 2 pending proposals • CPU 23% • Mem 1.2GB • `04:00 UTC`"
}
```

### BrainDump Capture Confirmation (ephemeral)

```json
{
  "content": "📌 **Captured to BrainDump**\n> look into rate limiting for the API\n`braindump-f2g8h5` • Project: `ema-core`",
  "flags": 64
}
```

### Elixir Formatter Module

```elixir
defmodule EMA.Discord.Formatter do
  def format(%EMA.Event{type: "execution.completed"} = event, "embed") do
    status_emoji = if event.data.success?, do: "✅ Success", else: "❌ Failed"
    color = if event.data.success?, do: 0x4CB016, else: 0xE74C3C
    
    %{
      embeds: [%{
        title: "⚡ Execution #{if event.data.success?, do: "Complete", else: "Failed"}",
        color: color,
        fields: [
          %{name: "Project", value: "`#{event.data.project}`", inline: true},
          %{name: "Agent", value: event.data.agent_name, inline: true},
          %{name: "Status", value: status_emoji, inline: true},
          %{name: "Duration", value: format_duration(event.data.duration_ms), inline: true},
          %{name: "Output Preview", value: truncate(event.data.output, 1000)}
        ],
        footer: %{text: "EMA • #{event.data.short_id}"},
        timestamp: DateTime.to_iso8601(event.timestamp)
      }],
      components: execution_buttons(event.data.short_id)
    }
  end

  def format(event, "compact") do
    %{content: compact_line(event)}
  end
  
  defp truncate(text, max) do
    if String.length(text) > max do
      String.slice(text, 0, max - 3) <> "..."
    else
      text
    end
  end
end
```

---

## 8. Slack Design

### Where Slack Differs from Discord

| Aspect | Discord | Slack |
|--------|---------|-------|
| Rich messages | Embeds (JSON) | Block Kit (JSON) |
| Slash commands | `Interaction` webhook | Bolt SDK event |
| Reactions | Emoji unicode | Emoji shortcode (`:white_check_mark:`) |
| Threads | Thread channels | Thread `ts` (timestamp-based) |
| Permissions | Role-based | Workspace + channel-level |
| Bot framework | Nostrum (Elixir) | Bolt SDK (JS/Python) or raw HTTP |
| OAuth | Bot token + app | Bot token + user token (xoxb/xoxp) |
| Buttons/menus | Components v2 | Block Kit interactive elements |
| Rate limits | 50 req/s per route | Tier-based (varies by method) |

### Slack OAuth Flow

```
1. User clicks "Add to Slack" in EMA Channels App
2. Redirect to:
   https://slack.com/oauth/v2/authorize?
     client_id={SLACK_CLIENT_ID}
     &scope=chat:write,commands,reactions:read,channels:history,groups:history
     &user_scope=
     &redirect_uri=http://localhost:4488/api/slack/oauth/callback

3. Slack redirects back with code
4. EMA exchanges code for bot token (xoxb-...)
5. Store token in DB, associated with workspace
```

### Block Kit Equivalents

**Execution Result (Slack Block Kit):**

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "⚡ Execution Complete"}
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Project:*\n`phoenix-app`"},
        {"type": "mrkdwn", "text": "*Agent:*\nClaude Opus"},
        {"type": "mrkdwn", "text": "*Status:*\n✅ Success"},
        {"type": "mrkdwn", "text": "*Duration:*\n12.4s"}
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Output Preview:*\n```Fixed 3 type errors in auth.ex:\n- Line 42: expected String, got integer\n- Line 78: undefined function validate/1```"
      }
    },
    {
      "type": "actions",
      "elements": [
        {"type": "button", "text": {"type": "plain_text", "text": "View Full Output"}, "action_id": "exec_view", "value": "a7f3b2"},
        {"type": "button", "text": {"type": "plain_text", "text": "🔄 Re-run"}, "action_id": "exec_rerun", "value": "a7f3b2"},
        {"type": "button", "text": {"type": "plain_text", "text": "Open in EMA"}, "url": "http://localhost:4488/executions/a7f3b2"}
      ]
    },
    {
      "type": "context",
      "elements": [
        {"type": "mrkdwn", "text": "EMA • exec-a7f3b2 • <!date^1712182200^{date_short_pretty} at {time}|2026-04-03>"}
      ]
    }
  ]
}
```

**Proposal (Slack Block Kit):**

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "📋 Proposal Ready for Review"}
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Switch primary database to PostgreSQL 16*\nMigrate from SQLite to PostgreSQL for better concurrency."
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Type:*\n🏗️ Architecture"},
        {"type": "mrkdwn", "text": "*Impact:*\n🔴 High"},
        {"type": "mrkdwn", "text": "*Project:*\n`ema-core`"},
        {"type": "mrkdwn", "text": "*Readiness:*\n✅ All requirements met"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {"type": "button", "text": {"type": "plain_text", "text": "✅ Approve"}, "style": "primary", "action_id": "proposal_approve", "value": "c9d5e2"},
        {"type": "button", "text": {"type": "plain_text", "text": "❌ Reject"}, "style": "danger", "action_id": "proposal_reject", "value": "c9d5e2"}
      ]
    }
  ]
}
```

### Shared Integration Interface

Both Discord and Slack implementations conform to a common Elixir behaviour:

```elixir
defmodule EMA.Channels.Platform do
  @doc "Behaviour that all messaging platform adapters must implement."
  
  @callback send_message(channel_id :: String.t(), message :: map()) :: {:ok, msg_id} | {:error, term()}
  @callback send_embed(channel_id :: String.t(), embed :: map()) :: {:ok, msg_id} | {:error, term()}
  @callback add_reaction(channel_id :: String.t(), message_id :: String.t(), emoji :: String.t()) :: :ok | {:error, term()}
  @callback create_thread(channel_id :: String.t(), message_id :: String.t(), name :: String.t()) :: {:ok, thread_id} | {:error, term()}
  @callback reply_in_thread(thread_id :: String.t(), message :: map()) :: {:ok, msg_id} | {:error, term()}
  @callback get_channels(guild_or_workspace_id :: String.t()) :: {:ok, [channel()]} | {:error, term()}
  @callback register_commands(guild_or_workspace_id :: String.t(), commands :: [map()]) :: :ok | {:error, term()}
  @callback format_event(event :: EMA.Event.t(), format :: String.t()) :: map()
end

defmodule EMA.Channels.Discord.Adapter do
  @behaviour EMA.Channels.Platform
  # Implements using Nostrum
end

defmodule EMA.Channels.Slack.Adapter do
  @behaviour EMA.Channels.Platform
  # Implements using Req HTTP client (no Bolt SDK needed — Elixir native)
end
```

### Elixir Slack Approach

Rather than pulling in a Node.js Bolt SDK, EMA uses a lightweight Elixir HTTP client approach:

```elixir
defmodule EMA.Channels.Slack.Client do
  @base_url "https://slack.com/api"
  
  def post_message(token, channel, blocks, opts \\ []) do
    Req.post!("#{@base_url}/chat.postMessage",
      headers: [{"Authorization", "Bearer #{token}"}],
      json: %{
        channel: channel,
        blocks: blocks,
        text: Keyword.get(opts, :fallback_text, "EMA notification")
      }
    )
  end

  def add_reaction(token, channel, timestamp, emoji) do
    Req.post!("#{@base_url}/reactions.add",
      headers: [{"Authorization", "Bearer #{token}"}],
      json: %{channel: channel, timestamp: timestamp, name: emoji}
    )
  end
end
```

Slack incoming events (slash commands, button clicks, reaction events) are received via a single webhook endpoint:

```elixir
# router.ex
scope "/api/slack" do
  post "/events", EMA.Channels.Slack.EventController, :handle
  post "/interactions", EMA.Channels.Slack.InteractionController, :handle
  post "/commands", EMA.Channels.Slack.CommandController, :handle
  get  "/oauth/callback", EMA.Channels.Slack.OAuthController, :callback
end
```

---

## 9. Data Flow

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Discord                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Messages  │  │Reactions │  │  Slash   │  │ Threads  │   │
│  └─────┬────┘  └────┬─────┘  │ Commands │  └────┬─────┘   │
│        │             │        └────┬─────┘       │          │
└────────┼─────────────┼─────────────┼─────────────┼──────────┘
         │             │             │             │
         ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nostrum Gateway                             │
│              (WebSocket to Discord API)                       │
│                                                              │
│  Supervised by: EMA.Discord.Supervisor                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               EMA.Discord.Consumer                           │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ KeywordDetector  │  │ ReactionRouter   │                  │
│  │ (prefix-match)   │  │ (msg_id → obj)   │                  │
│  └────────┬────────┘  └────────┬─────────┘                  │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌────────────────────────────────────────────┐             │
│  │           EventNormalizer                   │             │
│  │  Discord event → EMA.Event struct           │             │
│  └─────────────────────┬──────────────────────┘             │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Phoenix.PubSub                             │
│              topic: "ema:events"                             │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌────────────┐ ┌───────────┐ ┌──────────────┐
│ Pipes      │ │ Agent     │ │ Channels     │
│ Engine     │ │ System    │ │ Router       │
│            │ │           │ │              │
│ Triggers   │ │ GenServer │ │ Rules eval → │
│ automation │ │ execution │ │ format →     │
│ chains     │ │           │ │ post to      │
│            │ │           │ │ target ch    │
└──────┬─────┘ └─────┬─────┘ └──────┬───────┘
       │              │              │
       └──────┬───────┘              │
              │                      │
              ▼                      ▼
┌─────────────────────┐  ┌──────────────────────┐
│   EMA.Event output  │  │  EMA.Discord.Poster  │
│   (new events from  │──▶  (sends embeds,      │
│    pipe/agent runs)  │  │   tracks msg_ids)    │
└─────────────────────┘  └──────────┬───────────┘
                                    │
                                    ▼
                              Discord API
                            (REST: POST messages,
                             reactions, threads)
```

### Slack Flow (identical pattern, different transport)

```
┌────────────────────────────────────────┐
│               Slack                     │
│  Events API → POST /api/slack/events   │
│  Slash Cmds → POST /api/slack/commands │
│  Buttons   → POST /api/slack/interact  │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│  EMA.Channels.Slack.WebhookHandler     │
│  (Phoenix controller, verifies sig)    │
└──────────────────┬─────────────────────┘
                   │
                   ▼
           EventNormalizer
           (same as Discord path)
                   │
                   ▼
            Phoenix.PubSub
           topic: "ema:events"
```

### Sequence: Reaction Approval

```
User reacts ✅ on Proposal embed in Discord
    │
    ▼
Nostrum receives MESSAGE_REACTION_ADD event
    │
    ▼
EMA.Discord.Consumer.handle_event/1
    │
    ├─ Look up discord_msg_id in discord_message_map table
    │  → Found: {ema_object_type: "proposal", ema_object_id: "c9d5e2"}
    │
    ├─ Authorize: is this user allowed to approve? (check guild role or EMA permissions)
    │
    ▼
EMA.Proposals.approve("c9d5e2", approved_by: discord_user_id, source: :discord)
    │
    ├─ Proposal state: pending → approved
    ├─ PubSub broadcast: "proposal.approved"
    │
    ▼
Channels.Router matches "proposal.approved" → #ema-proposals
    │
    ▼
EMA.Discord.Poster sends confirmation embed + bot adds ✅ react
    │
    ▼
Thread reply: "✅ Approved by @Trajan"
```

### OpenClaw Coordination (Optional)

If EMA and OpenClaw need to coordinate on the same guild:

```
┌─────────────┐         ┌──────────────┐
│   OpenClaw   │         │     EMA      │
│  (AI agent)  │         │ (automation) │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │  HTTP: POST /api/ema/events
       │  (OpenClaw can trigger EMA pipes)
       │──────────────────────▶│
       │                       │
       │  PubSub (shared BEAM) │
       │  or HTTP webhook      │
       │◀──────────────────────│
       │  (EMA notifies OpenClaw of results)
       │                       │
```

Both bots coexist. OpenClaw handles AI agent conversations. EMA handles structured automation (tasks, proposals, executions). They can call each other's APIs but don't share a Discord connection.

---

## 10. EMA Channels App API

### Endpoints

#### List Connected Channels

```
GET /api/channels
```

**Response:**
```json
{
  "channels": [
    {
      "id": "ch_abc123",
      "platform": "discord",
      "platform_channel_id": "1234567890",
      "guild_id": "9876543210",
      "name": "#ema-executions",
      "type": "text",
      "status": "connected",
      "last_message_at": "2026-04-03T21:30:00Z",
      "message_count_today": 47,
      "routing_rules_count": 3
    },
    {
      "id": "ch_def456",
      "platform": "slack",
      "platform_channel_id": "C0123ABCDEF",
      "workspace_id": "T0123WXYZ",
      "name": "#ema-alerts",
      "type": "text",
      "status": "connected",
      "last_message_at": "2026-04-03T20:15:00Z",
      "message_count_today": 5,
      "routing_rules_count": 2
    }
  ],
  "total": 2
}
```

#### Add Channel Connection

```
POST /api/channels
```

**Request:**
```json
{
  "platform": "discord",
  "platform_channel_id": "1234567890",
  "guild_id": "9876543210",
  "purpose": "executions",
  "routing_rules": [
    {"event_type": "execution.*", "format": "embed"}
  ]
}
```

**Response:** `201 Created` with channel object.

#### Get Channel Messages (history from EMA's perspective)

```
GET /api/channels/:id/messages?limit=50&before=msg_id
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_001",
      "platform_msg_id": "1234567890123",
      "direction": "outgoing",
      "event_type": "execution.completed",
      "ema_object_id": "exec-a7f3b2",
      "content_preview": "⚡ Execution Complete — phoenix-app",
      "reactions": {"✅": 1, "🚀": 0},
      "posted_at": "2026-04-03T21:30:00Z"
    }
  ],
  "has_more": true,
  "cursor": "msg_000"
}
```

#### Configure Routing Rules

```
POST /api/channels/:id/routing-rules
```

**Request:**
```json
{
  "event_type": "proposal.ready",
  "format": "embed",
  "conditions": {"impact": "high"},
  "priority": 20,
  "enabled": true
}
```

#### Test Channel (send test message)

```
POST /api/channels/:id/test
```

**Request:**
```json
{
  "event_type": "execution.completed",
  "mock": true
}
```

**Response:**
```json
{
  "success": true,
  "platform_msg_id": "1234567890999",
  "latency_ms": 234
}
```

#### Get Channel Stats

```
GET /api/channels/:id/stats?period=7d
```

**Response:**
```json
{
  "channel_id": "ch_abc123",
  "period": "7d",
  "messages_sent": 312,
  "messages_received": 45,
  "reactions_processed": 23,
  "events_by_type": {
    "execution.completed": 187,
    "execution.failed": 12,
    "proposal.ready": 8,
    "task.created": 105
  },
  "peak_hour": 14,
  "avg_latency_ms": 189
}
```

#### Update Agent Identity per Channel

```
PUT /api/channels/:id/identity
```

**Request:**
```json
{
  "display_name": "EMA Bot",
  "avatar_url": "https://example.com/ema-avatar.png",
  "persona": "concise"
}
```

> Note: For Discord, custom display names/avatars per channel require using webhooks instead of the bot user. The adapter handles this transparently.

#### Delete Channel Connection

```
DELETE /api/channels/:id
```

Removes routing rules and stops monitoring. Does not delete Discord channel.

---

## 11. Bot Commands Reference Card

### Discord Help Embed

Shown when user runs `/ema help`:

```json
{
  "embeds": [{
    "title": "📖 EMA Command Reference",
    "color": 5814783,
    "description": "EMA — Execution Management Agent\nManage tasks, proposals, and automations from Discord.",
    "fields": [
      {
        "name": "📊 Status",
        "value": "`/ema status` — System overview (projects, tasks, pipes, health)",
        "inline": false
      },
      {
        "name": "📝 Tasks",
        "value": "`/ema task create <title> [project] [priority]` — Create task\n`/ema task list [project] [status]` — List tasks\n`/ema task done <id>` — Mark complete",
        "inline": false
      },
      {
        "name": "📋 Proposals",
        "value": "`/ema proposal list [status]` — List proposals\n`/ema proposal show <id>` — View details\n`/ema proposal approve <id> [reason]` — Approve\n`/ema proposal reject <id> <reason>` — Reject",
        "inline": false
      },
      {
        "name": "📁 Projects",
        "value": "`/ema project list` — All projects\n`/ema project switch <name>` — Set active context\n`/ema project status [name]` — Health summary",
        "inline": false
      },
      {
        "name": "⚡ Execution",
        "value": "`/ema execute <prompt>` — Run Claude agent\n`/ema pipe list` — Active pipes\n`/ema pipe trigger <name> [input]` — Fire a pipe",
        "inline": false
      },
      {
        "name": "🧠 BrainDump",
        "value": "`/ema brain <text>` — Quick capture\nOr prefix any message with `ema:`, `note:`, `idea:`",
        "inline": false
      },
      {
        "name": "⚙️ Config",
        "value": "`/ema config channel <event> [#channel]` — Route events\n`/ema config keywords add|remove <word>` — Keyword triggers",
        "inline": false
      },
      {
        "name": "🎯 Reactions",
        "value": "✅ Approve proposal\n❌ Reject proposal (prompts for reason)\n🚀 Pin execution to project\n📌 Capture any message to BrainDump\n🔄 Re-run execution\n👀 Mark task reviewed",
        "inline": false
      }
    ],
    "footer": {"text": "EMA v1.0 • http://localhost:4488"}
  }]
}
```

### Compact Reference (for DMs or quick lookup)

```
EMA Commands Quick Reference
━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ema status          → System state
/ema task create     → New task
/ema task list       → Browse tasks  
/ema task done       → Complete task
/ema proposal list   → Pending proposals
/ema proposal approve → Approve
/ema proposal reject  → Reject (reason required)
/ema project switch  → Change context
/ema execute         → Run agent
/ema brain           → Quick capture
/ema pipe trigger    → Fire automation
/ema help            → This message

Prefixes: ema: note: task: idea: bug:
Reactions: ✅ ❌ 🚀 📌 🔄 👀
```

---

## Elixir Module Structure

```
lib/ema/
├── channels/
│   ├── channel.ex                 # Ecto schema
│   ├── routing_rule.ex            # Ecto schema
│   ├── router.ex                  # Event → channel routing engine
│   ├── platform.ex                # Behaviour (interface)
│   ├── keyword_config.ex          # Ecto schema
│   └── stats.ex                   # Channel statistics
│
├── discord/
│   ├── supervisor.ex              # Starts Nostrum + consumers
│   ├── consumer.ex                # Nostrum.ConsumerSupervisor
│   ├── commands.ex                # Slash command definitions
│   ├── interaction_handler.ex     # Slash command + button dispatch
│   ├── autocomplete.ex            # Autocomplete for project/task IDs
│   ├── reaction_router.ex         # Emoji → action mapping
│   ├── keyword_detector.ex        # Prefix-based keyword capture
│   ├── formatter.ex               # EMA.Event → Discord embed
│   ├── poster.ex                  # Send messages, track msg_ids
│   ├── message_map.ex             # discord_msg_id ↔ ema_object_id
│   └── adapter.ex                 # Implements Platform behaviour
│
├── slack/
│   ├── client.ex                  # Slack Web API HTTP client
│   ├── event_handler.ex           # Incoming webhook handler
│   ├── interaction_handler.ex     # Button/modal callbacks
│   ├── command_handler.ex         # Slash command handler
│   ├── formatter.ex               # EMA.Event → Block Kit
│   ├── oauth.ex                   # OAuth2 flow
│   ├── message_map.ex             # slack_ts ↔ ema_object_id
│   └── adapter.ex                 # Implements Platform behaviour
│
└── channels_web/
    ├── channel_controller.ex      # REST API for Channels App
    ├── routing_rule_controller.ex # Routing rules CRUD
    └── slack_webhook_controller.ex # Slack event ingress
```

### Supervision Tree

```elixir
defmodule EMA.Discord.Supervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    children = [
      # Nostrum gateway connection
      Nostrum.Application,
      
      # Event consumer (handles all Discord events)
      {EMA.Discord.Consumer, []},
      
      # Message poster with rate limiting
      {EMA.Discord.Poster, []},
      
      # Message ID tracking cleanup (hourly)
      {EMA.Discord.MessageMap.Cleaner, interval: :timer.hours(1)}
    ]

    Supervisor.init(children, strategy: :rest_for_one)
  end
end
```

### Consumer Implementation

```elixir
defmodule EMA.Discord.Consumer do
  use Nostrum.Consumer

  alias EMA.Discord.{InteractionHandler, ReactionRouter, KeywordDetector}

  # Slash commands and buttons
  def handle_event({:INTERACTION_CREATE, interaction, _ws}) do
    InteractionHandler.handle(interaction)
  end

  # Reactions
  def handle_event({:MESSAGE_REACTION_ADD, reaction, _ws}) do
    # Skip bot reactions
    unless reaction.user_id == Nostrum.Cache.Me.get().id do
      ReactionRouter.handle_reaction_add(
        reaction.emoji.name,
        reaction.message_id,
        reaction.user_id,
        reaction.channel_id
      )
    end
  end

  # Messages (keyword detection)
  def handle_event({:MESSAGE_CREATE, msg, _ws}) do
    unless msg.author.bot do
      case KeywordDetector.detect(msg.content) do
        {action, body, _prefix} ->
          EMA.Events.broadcast(%EMA.Event{
            type: "keyword.detected",
            data: %{action: action, body: body, source_msg: msg}
          })
        nil -> :ignore
      end
    end
  end

  # Catch-all
  def handle_event(_event), do: :noop
end
```

---

## Configuration Summary

### Environment Variables

```bash
# Discord
EMA_DISCORD_BOT_TOKEN=Bot_MTIzNDU2Nzg5...
EMA_DISCORD_APP_ID=123456789012345678

# Slack (optional)
EMA_SLACK_CLIENT_ID=123456.789012
EMA_SLACK_CLIENT_SECRET=abcdef123456
EMA_SLACK_SIGNING_SECRET=abc123def456

# General
EMA_CHANNELS_ENABLED=discord,slack  # Which platforms to activate
```

### config/runtime.exs

```elixir
config :ema, :discord,
  enabled: "discord" in String.split(System.get_env("EMA_CHANNELS_ENABLED", ""), ","),
  bot_token: System.get_env("EMA_DISCORD_BOT_TOKEN"),
  application_id: System.get_env("EMA_DISCORD_APP_ID")

config :ema, :slack,
  enabled: "slack" in String.split(System.get_env("EMA_CHANNELS_ENABLED", ""), ","),
  client_id: System.get_env("EMA_SLACK_CLIENT_ID"),
  client_secret: System.get_env("EMA_SLACK_CLIENT_SECRET"),
  signing_secret: System.get_env("EMA_SLACK_SIGNING_SECRET")

config :nostrum,
  token: System.get_env("EMA_DISCORD_BOT_TOKEN"),
  gateway_intents: [
    :guilds, :guild_messages, :guild_message_reactions,
    :direct_messages, :direct_message_reactions, :message_content
  ]
```

---

## Summary

| Component | Decision | Rationale |
|-----------|----------|-----------|
| Discord bot | Own bot via Nostrum | Independence, OTP-native, full gateway access |
| OpenClaw | Coexist, coordinate via API | Both bots in guild, call each other's HTTP APIs |
| Slash commands | Guild-specific registration | Instant propagation, per-server customization |
| Reactions | Message map DB (discord_msg_id ↔ ema_object_id) | Reliable lookup, 90-day TTL |
| Routing | Rule engine with event types, conditions, priority | Flexible, per-project overrides, visual builder |
| Keywords | Prefix-only (`ema:`, `task:`, etc.), opt-in channels | No false positives, explicit activation |
| Slack | Same Platform behaviour, different adapter | Block Kit formatting, Elixir HTTP client, shared routing |
| Posting | Rich embeds + interactive buttons | Approve/reject without leaving Discord |
