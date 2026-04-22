# EMA Discord Guild Configuration

> Last updated: 2026-04-05

Discord is the primary human-readable surface for EMA operations. Two guilds serve distinct purposes.

---

## Primary Guild — EMA Operations

| Field | Value |
|-------|-------|
| Guild ID | `1482230800916287710` |
| Purpose | Central operations hub for EMA agents, monitoring, dispatch, and feeds |
| Bot auth | Token stored in `~/.claude-code-bot.json` (key: `token`) |
| Env file | `~/bin/discord-webhooks-v2.env` |

### Channels

| Channel | ID | Purpose |
|---|---|---|
| concierge | `1482997518362214422` | Entry point, onboarding, general ops |
| dispatch | `1484014822642286654` | Task dispatch queue — commands routed to agent inboxes |
| desk | `1482996866428964904` | Trajan's working desk, human-in-the-loop channel |
| research-feed | `1482258431997116531` | Researcher agent output (papers, links, summaries) |
| code-output | `1484014829156175893` | Coder agent output (PRs, diffs, build results) |
| devils-corner | `1484014830280249395` | Devil's Advocate agent — contrarian analysis and risk flags |
| agent-feed / vault-feed | `1483018390015709315` | Vault keeper + general agent activity feed |
| links | `1482256987700990066` | Curated links (HN, TIL, external references) |
| heartbeat | `1482256931375546489` | System heartbeat pings — liveness signal |
| ops-log | `1482256984811114688` | Operational logs, monitoring output, system status |
| alerts | `1484014832599437372` | High-priority alerts and errors |
| security | `1484014833790877716` | Security events and audit trail |
| daily-brief | `1484015157029109771` | Daily briefing summaries |
| projects | `1482899212889751745` | Project updates and status |
| decisions | `1482939106223853740` | Architecture decisions, ADR mirrors |
| ingestor | `1482295358963974187` | Inbound data ingestion (RSS, webhooks, scrapers) |
| agent-status-voice | `1484015032038850640` | Voice channel for TTS agent status updates |

### EMA Daemon Integration

The EMA daemon (`~/Projects/ema/daemon/`) references Discord as a messaging surface in `Ema.Surfaces.Discovery`. The discovery module enumerates messaging capabilities including `:discord` on the EMA/EMA gateway.

A `DiscordChannel` module under `Ema.Agents.Supervisor.ChannelSupervisor` is planned but currently a stub. The intent is for the daemon to manage Discord channel subscriptions per-agent natively in Elixir, replacing the current shell-script approach. Until that lands, Discord integration runs through the shell scripts documented in `DISCORD_SCRIPTS.md` and the webhook URLs in `WEBHOOKS.md`.

---

## ClaudeForge Guild — Remote Claude Code Sessions

| Field | Value |
|-------|-------|
| Guild ID | `1484262889505292358` |
| Purpose | Remote Claude Code session management via Discord bot |
| Project | ClaudeForge (`~/Desktop/Coding/Projects/claude-remote-discord/`) |
| See also | `CLAUDEFORGE.md` in this directory |

### Channels

| Channel | ID | Purpose |
|---|---|---|
| command_center | `1484267775512936637` | Primary command interface for session dispatch |
| task_queue | `1484267777899364354` | Queued tasks awaiting execution |
| agent_log | `1484267780738912527` | Live agent output and activity stream |
| readme | `1484267786321530931` | Guild documentation and onboarding |
| commands | `1484267788817268838` | Bot command reference |
| architecture | `1484267790897643636` | System architecture notes |
| changelog | `1484267793519214726` | Release notes and changes |
| status | `1484267798837596181` | Current system status |
| errors | `1484267800884416717` | Error reporting |
| cron_jobs | `1484267802981302385` | Scheduled task configuration and logs |

---

## Environment Variables

Channel IDs are exported as shell variables via `~/bin/discord-webhooks-v2.env`:

```bash
source ~/bin/discord-webhooks-v2.env
# All CHAN_* vars become available, e.g.:
# CHAN_DISPATCH=1484014822642286654
# GUILD_ID=1482230800916287710
```
