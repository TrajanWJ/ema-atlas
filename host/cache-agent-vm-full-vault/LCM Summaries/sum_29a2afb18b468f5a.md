# LCM Summary sum_29a2afb18b468f5a

Created: 2026-03-16 21:39:45
Kind: leaf
Depth: 0
Conversation: 19
Tokens: 1215
Descendants: 0
Earliest: 2026-03-16T18:12:22.000Z
Latest: 2026-03-16T18:19:40.000Z

## Content

[2026-03-16 18:12 UTC]
2026-03-16T18:04:36.683Z info gateway/channels/discord {"subsystem":"gateway/channels/discord"} discord channels resolved: 1482230800916287710/1483010758408274027→1482230800916287710/1483010758408274027 (guild:T.Central; channel:agent-feed), 1482230800916287710/1483010759452790845→1482230800916287710/1483010759452790845 (guild:T.Central; channel:evolution-log), 1482230800916287710/1482955597765935258→1482230800916287710/1482955597765935258 (guild:T.Central; channel:worklog)
2026-03-16T18:09:36.338Z info gateway/channels/discord {"subsystem":"gateway/channels/discord"} discord channels resolved: 1482230800916287710/1483010758408274027→1482230800916287710/1483010758408274027 (guild:T.Central; channel:agent-feed), 1482230800916287710/1483010759452790845→1482230800916287710/1483010759452790845 (guild:T.Central; channel:evolution-log), 1482230800916287710/1482955597765935258→1482230800916287710/1482955597765935258 (guild:T.Central; channel:worklog)
openclaw logs 2... -30 | grep -i "discord\|guild\|route\|inbound" | head -10
openclaw logs 2... -30 | grep -i "discord\|guild\|route\|inbound" | head -10
---
Bindings:
  ops ← {"channel": "discord", "peer": {"kind": "channel", "id": "1482899211811815536"}, "guildId": "1482230800916287710"}
  coder ← {"channel": "discord", "peer": {"kind": "channel", "id": "1482899212889751745"}, "guildId": "1482230800916287710"}
  researcher ← {"channel": "discord", "peer": {"kind": "channel", "id": "1482899213917360171"}, "guildId": "1482230800916287710"}
  concierge ← {"channel": "discord", "peer": {"kind": "channel", "id": "1482997518362214422"}, "guildId": "1482230800916287710"}
  main ← {"channel": "discord", "guildId": "1482230800916287710"}

[2026-03-16 18:12 UTC]
Bindings look correct — `main` catches all guild messages from `1482230800916287710`. Discord is connected and logged in as `traclaw1`. I can send to guild channels fine.

The issue might be that when you message in the guild, it's creating a *separate* guild session that isn't responding, while this DM session is the one that's active and processing.

[2026-03-16 18:12 UTC]
openclaw logs 2... -30 | grep -i "discord\|guild\|route\|inbound" | head -10
openclaw logs 2... -30 | grep -i "discord\|guild\|route\|inbound" | head -10
2026-03-16T18:12:00.699Z info exec: elevated command # Check for recent inbound guild messages in the logs
open...\|message.*create\|dispatch\|route.*main\|lane" | head -15
2026-03-16T18:12:00.701Z info exec: elevated command # Check for recent inbound guild messages in the logs
open...\|message.*create\|dispatch\|route.*main\|lane" | head -15

[2026-03-16 18:12 UTC]


[2026-03-16 18:12 UTC]
│ Sessions        │ 89 active · default claude-opus-4-6 (200k ctx) · 10 stores                                         │
└─────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┘

Security audit
Summary: 8 critical · 9 warn · 1 info
  CRITICAL Control UI allowed origins contains wildcard
    gateway.controlUi.allowedOrigins includes "*" which effectively disables origin allowlisting for Control UI/WebChat requests.
    Fix: Replace wildcard origins with explicit trusted origins (for example https://control.example.com).
  CRITICAL DANGEROUS: Control UI device auth disabled
    gateway.controlUi.dangerouslyDisableDeviceAuth=true disables device identity checks for the Control UI.
    Fix: Disable it unless you are in a short-lived break-glass scenario.
  CRITICAL Open groupPolicy with elevated tools enabled
    Found groupPolicy="open" at: - channels.telegram.groupPolicy - channels.discord.groupPolicy With tools.elevated enabled, a prompt injection in those rooms can …
    Fix: Set groupPolicy="allowlist" and keep elevated allowlists extremely tight.
  CRITICAL Open groupPolicy with runtime/filesystem tools exposed
    Found groupPolicy="open" at: - channels.telegram.groupPolicy - channels.discord.groupPolicy Risky tool exposure contexts: - agents.defaults (sandbox=off; runti…
    Fix: For open groups, prefer tools.profile="messaging" (or deny group:runtime/group:fs), set tools.fs.workspaceOnly=true, and use agents.defaults.sandbox.mode="all" for exposed agents.
  CRITICAL Telegram DMs are open
    channels.telegram.dmPolicy="open" allows anyone to DM the bot.
    Fix: Use pairing/allowlist; if you really need open DMs, ensure channels.telegram.allowFrom includes "*".
  CRITICAL Telegram security warning
--
Sessions
┌─────────────────────────────────────────────┬────────┬─────────┬─────────────────┬───────────────────────────────────┐
│ Key                                         │ Kind   │ Age     │ Model           │ Tokens                            │
├─────────────────────────────────────────────┼────────┼─────────┼───────────
[LCM fallback summary; truncated for context management]
