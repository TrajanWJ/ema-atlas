# EMA Discord Scripts

> Last updated: 2026-04-05

Discord interaction from EMA is handled through two sets of shell scripts:
- **Operational scripts** at `~/bin/` — cron jobs and system-level automation
- **Claude Code bot tools** at `~/claude-code-bot/tools/` — used by Claude Code agents during task execution

All scripts authenticate via the bot token stored in `~/.claude-code-bot.json` (key: `token`) and/or webhook URLs from `~/bin/discord-webhooks-v2.env`.

---

## Operational Scripts (`~/bin/`)

### discord-dispatch-watcher.sh

Polls **#dispatch** (`1484014822642286654`) for commands from Trajan, then routes them to agent inboxes.

| Field | Value |
|---|---|
| Location | `~/bin/discord-dispatch-watcher.sh` |
| Schedule | Cron: every minute (`* * * * *`) |
| Auth | Bot token from `~/.claude-code-bot.json` |
| State file | `~/dispatch/dispatch-last-id.txt` (tracks last processed message) |
| Inbox dir | `~/dispatch/inter-agent/` |

Behavior:
1. Fetches up to 50 messages after the last processed ID
2. Filters to messages from Trajan only (`353926471829045250`)
3. Routes based on message prefix to the appropriate agent inbox file (e.g., `ops.inbox`)
4. Updates the last-processed ID after each message

### proposal-discord-mirror.sh

Mirrors EMA proposal lifecycle events to Discord.

| Field | Value |
|---|---|
| Location | `~/bin/proposal-discord-mirror.sh` |
| Target channel | `1484447892679823360` (proposals) |
| Auth | Bot token from `~/.env.discord` |

Usage:
```bash
proposal-discord-mirror.sh <action> <proposal.json>
# Actions: created, auto-execute, escalate, dismissed, approved, resolved
```

Reads the proposal JSON file and formats a Discord embed with title, type, priority, source, and triage verdict.

### dashboard-discord.sh

Posts a system dashboard summary to Discord using Components v2 markdown formatting.

| Field | Value |
|---|---|
| Location | `~/bin/dashboard-discord.sh` |
| Data sources | systemd services, Docker containers, bridge-sync timer |

Collects status of:
- System services (gateway, oauth-guardian, bridge-sync)
- Docker containers
- EMA daemon health

### discord-nudge-all.sh

Sends a broadcast message to all core EMA channels. Used for operational nudges like post-restart notifications.

| Field | Value |
|---|---|
| Location | `~/bin/discord-nudge-all.sh` |
| Auth | Bot token via `DISCORD_BOT_TOKEN` env var |
| Env | Sources `~/bin/discord-webhooks-v2.env` for channel IDs |

Usage:
```bash
discord-nudge-all.sh                    # Default: EMA is back online...
discord-nudge-all.sh Custom message   # Custom nudge text
```

Posts to all 16 operational channels (concierge through ingestor).

---

## Claude Code Bot Tools (`~/claude-code-bot/tools/`)

These are lightweight CLI tools that Claude Code agents call during task execution. Each takes channel IDs and message content as arguments.

### discord-send.sh

Send a text message to a channel.

```bash
discord-send.sh <channel_id> <message>
# Returns: message ID or error
```

### discord-history.sh

Read recent messages from a channel for context.

```bash
discord-history.sh <channel_id> [count]
# count defaults to 10
# Returns: formatted [timestamp] author: content lines (oldest first)
```

### discord-route.sh

Dynamic agent-to-channel message router. Resolves the target channel from agent identity and topic, using a routing config.

```bash
discord-route.sh --agent <agent_id> --topic <topic> <message>
discord-route.sh --agent ops --topic alerts CPU at 95%
discord-route.sh --agent researcher --topic links Found paper: ...
discord-route.sh --agent coder --channel 1482899212889751745 PR ready
echo long msg | discord-route.sh --agent ops --topic errors --stdin
discord-route.sh --agent ops --topic alerts --dry-run test
```

Options:
- `--agent` — Agent ID (ops, researcher, coder, etc.) — sets identity
- `--topic` — Route by topic (alerts, errors, logs) — resolved from routing config
- `--channel` — Explicit channel ID override (skips topic routing)
- `--stdin` — Read message body from stdin
- `--dry-run` — Print resolved route without sending

Routing priority: `--channel` > `--topic` > fallback (agent-feed)

### discord-thread.sh

Create a thread in a channel, optionally from an existing message.

```bash
discord-thread.sh <channel_id> <thread_name> [message_id]
# Returns: thread channel ID or error
# Threads auto-archive after 24 hours (1440 minutes)
```

### discord-upload.sh

Upload a file to a channel with an optional message.

```bash
discord-upload.sh <channel_id> <file_path> [message]
# Returns: message ID or error
```

### discord-react.sh

Add an emoji reaction to a message.

```bash
discord-react.sh <channel_id> <message_id> <emoji>
# Emoji is URL-encoded automatically
# Returns: ok
```

---

## Authentication

All scripts use the same bot token, stored in two places:
- `~/.claude-code-bot.json` — primary (key: `token`), used by bot tools
- `~/.env.discord` / `~/.ema/.env` — `DISCORD_BOT_TOKEN` env var, used by operational scripts

The bot must have the following Discord permissions in the EMA guild:
- Send Messages
- Read Message History
- Manage Threads (for thread creation)
- Attach Files (for uploads)
- Add Reactions
- Use External Emojis
