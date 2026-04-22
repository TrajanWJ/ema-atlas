---
type: knowledge
wiki_id: system/Intelligence_Notes/webhookresearcher-discord-webhooks-v2env-still-ret
imported_from: >-
  vault/System/Intelligence
  Notes/webhookresearcher-discord-webhooks-v2env-still-ret.md
imported_at: '2026-04-04T00:23:57.252Z'
tags: []
summary: ''
---
# WEBHOOK_RESEARCHER (discord-webhooks-v2.env) still returns HTTP 10015 Unknown Webhook despite being marked applied on 2026-03-25 — the fix did not persist or was reverted

- **Category:** best-practice
- **Source:** a2ecdfe4.txt
- **Applied:** 2026-03-26T02:32:47Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

## Details

Re-inspect discord-webhooks-v2.env for WEBHOOK_RESEARCHER value. The webhook URL needs to be regenerated in Discord (Server Settings → Integrations → Webhooks) and the new URL written back to the env file. Verify with a curl POST before marking fixed again.

## Source Context

Extracted from agent result: `a2ecdfe4.txt`

---
Tags: #intelligence #best-practice #auto-applied
