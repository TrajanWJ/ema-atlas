---
type: config
wiki_id: >-
  system/Intelligence_Notes/config-webhookresearcher-at-discord-webhooks-v2env-return
imported_from: >-
  vault/System/Intelligence
  Notes/config-webhookresearcher-at-discord-webhooks-v2env-return.md
imported_at: '2026-04-04T00:23:57.244Z'
tags: []
summary: ''
---
# Config Change: WEBHOOK_RESEARCHER at discord-webhooks-v2.env returns 404 again — thread-response-wrapper.sh researcher webhook needs regeneration (same issue as b399d287.txt but recurred)

- **Source:** 149cbc6b.txt
- **Suggested:** 2026-03-26T02:32:42Z
- **Impact:** 3/5

## Change Details

Regenerate WEBHOOK_RESEARCHER Discord webhook and update discord-webhooks-v2.env. This is a repeat of the previously applied fix from b399d287.txt — the webhook was deleted/expired again. Consider adding webhook health check to system cron.

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied
