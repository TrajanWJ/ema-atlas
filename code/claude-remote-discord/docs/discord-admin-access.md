# Discord admin access for Alfred / ClaudeForge

This repo already accepts all in-guild users when `ALLOW_ALL_USERS=true`.
What still has to be true for real server-wide bot control is Discord-side permissioning.

## Current local state

- `ALLOW_ALL_USERS=true`
- `ALLOWED_USERS=...` is still present but ignored while allow-all is true
- Bot code requests `Guilds`, `GuildMessages`, and `MessageContent` intents by default
- Bot-to-bot chat stays disabled unless `ALLOW_BOT_MESSAGES=true`

## Productive bot-to-bot conversation lane

If you want Alfred/Hermes to talk to another bot without opening the floodgates:

1. Set `ALLOW_BOT_MESSAGES=true`
2. Optionally set `ALLOWED_BOT_USERS=` to the other bot's Discord user ID(s)
3. Keep those conversations in channels whose names start with one of `BOT_CHANNEL_PREFIXES` (default: `bot-`, `agent-`)
4. Restart the Alfred/ClaudeForge process

Those channels now act as dedicated coordination lanes. Bot-authored messages are wrapped with a simple protocol:
- confirm the concrete ask
- propose one next step
- ask at most one blocker
- avoid meta-chatter

## Generate the admin invite URL

From the repo root:

```bash
node scripts/discord-admin-url.mjs
```

That prints an OAuth2 invite URL using:

- scope: `bot applications.commands`
- permissions: `8` (`Administrator`)

## Discord-side checklist

1. Open the generated invite URL
2. Add the bot to the target server
3. Ensure the bot role still has `Administrator`
4. In the Discord Developer Portal, enable **Message Content Intent**
5. Re-invite if permissions/intents were changed after the original install
6. Restart the Alfred/ClaudeForge process

## Notes

- History access depends on the bot being present in the channel/thread and having permission to view it.
- Discord API calls can still fail from some environments/IPs even with a valid token; the running gateway/bot process may still work while direct ad-hoc REST tests fail.
- If you want tighter access control later, set `ALLOW_ALL_USERS=false` and use `ALLOWED_USERS=` with explicit Discord user IDs.
