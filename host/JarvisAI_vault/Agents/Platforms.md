# Platforms

Connected messaging platforms for the JarvisAI agent fleet.

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
4. Restart OpenClaw: `docker compose restart openclaw-gateway`
5. Update this table with the new status

## Related Notes

- [[OpenClaw]] — gateway that manages platform connections
- [[Security/Hardening\|Hardening]] — credential management

#jarvisai #agents #platforms
