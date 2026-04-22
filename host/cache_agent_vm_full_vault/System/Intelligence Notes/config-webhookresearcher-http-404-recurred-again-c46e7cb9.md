# Config Change: WEBHOOK_RESEARCHER HTTP 404 recurred again (c46e7cb9.txt) — researcher fell back to bot token direct post; thread-response-wrapper.sh still broken

- **Source:** c46e7cb9.txt
- **Suggested:** 2026-03-26T04:38:19Z
- **Impact:** 3/5

## Change Details

Regenerate WEBHOOK_RESEARCHER in Discord and update discord-webhooks-v2.env. This is a persistent recurrence — consider adding webhook health check to startup probe.

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied
