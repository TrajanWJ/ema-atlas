---
title: "Discord User Account Automation Risk"
created: 2026-03-30
type: operational-note
status: active
tags: [discord, automation, tos, risk, operations]
summary: "Using Discord user accounts (not bots) for automation violates ToS and risks account ban. Right Hand uses a bot account — this is compliant. Caution needed when any tooling touches user accounts."
summary: "Using Discord user accounts (not bots) for automation violates ToS and risks account ban. Right Hand uses a bot account — this is compliant. Caution needed when any tooling touches user accounts."
source: session-fragments (auto-knowledge scanner)
---

# Discord User Account Automation Risk

## The Risk

Automating Discord via **user accounts** (user tokens, selfbots) is explicitly against Discord's Terms of Service. Accounts caught doing this get flagged and banned — often without warning.

This includes:
- Sending messages programmatically via user tokens
- Scraping channels using user account credentials
- Automating reactions, joins, or DMs from a user account
- Any `curl` or API calls that authenticate as a user (not a bot)

## Right Hand's Current Setup — Compliant

Right Hand operates via a **Discord bot** (registered application with Bot token), not a user account. This is the compliant path. Bot accounts are explicitly designed for programmatic use.

Current status: ✅ No ToS violation risk in normal operation.

## Where Risk Could Enter

- If any tool or script ever uses Trajan's personal Discord token instead of the bot token
- If a Claude Code session is given Discord credentials and tries to scrape/post as a user
- If a browser automation session logs into Discord as Trajan and automates actions
- Any "selfbot" approach suggested by community scripts

## Guidance

- Always use bot tokens for Discord API calls
- If a task requires reading a channel Trajan's bot isn't in: add the bot to the channel, don't use Trajan's user token
- Browser automation that *views* Discord as a logged-in user (read-only, manually-triggered) is lower risk but still grey area
- Never store or use Trajan's personal Discord token in any script or config

## Related

- [[TOOLS.md]] — Discord channel access via message tool (uses bot)
- [[SOUL.md]] — "Ask before acting externally"
