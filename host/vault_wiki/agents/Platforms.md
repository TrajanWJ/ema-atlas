---
title: Platforms
created: '2026-03-14'
updated: '2026-03-16'
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
tags:
  - agent-vm
  - agents
  - platforms
summary: Connected messaging platforms for the agent-vm agent fleet.
wiki_id: agents/Platforms
imported_from: vault/Agents/Platforms.md
imported_at: '2026-04-04T00:23:56.689Z'
---
# Platforms

Connected messaging platforms for the agent-vm agent fleet.

## Platform Status

| Platform | Status | Bot Token Location | Notes |
|---|---|---|---|
| Telegram | Not connected | .env: TELEGRAM_BOT_TOKEN | Create bot via @BotFather |
| Discord | Not connected | .env: DISCORD_BOT_TOKEN | Create app at discord.com/developers |
| Slack | Not connected | .env: SLACK_BOT_TOKEN | Create app at api.slack.com |

## How to Connect a Platform

1. Obtain bot token/credentials from the platform
2. Add token to `/opt/jarvis/.env` on the VM
3. Run onboarding: `docker compose exec openclaw-gateway openclaw onboard`
4. Restart [[OpenClaw]]: `docker compose restart openclaw-gateway`
5. Update this table with the new status

## Related Notes

- [[OpenClaw]] — gateway that manages platform connections
- [[Security/Hardening|Hardening]] — credential management

#agent-vm #agents #platforms
