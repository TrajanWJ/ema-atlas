---
title: "WEBHOOK_RESEARCHER HTTP 404 Recurrence — Persistent Webhook Invalidation Pattern"
type: reference
created: 2026-03-26
updated: 2026-04-17
confidence: high
source: c46e7cb9.txt, cross-referenced with 149cbc6b.txt, b399d287.txt, dc7beb5c.txt, 2d043f24.txt
impact: 3/5
tags: [discord, webhook, config-change, reliability, thread-response-wrapper]
summary: "Recurring WEBHOOK_RESEARCHER 404/10015 errors cause silent research delivery failures; documents root cause, fallback behavior, and proposed permanent fix"
---

# WEBHOOK_RESEARCHER HTTP 404 Recurrence (c46e7cb9)

## Summary

The `WEBHOOK_RESEARCHER` Discord webhook, configured in `~/bin/discord-webhooks-v2.env`, repeatedly returns HTTP 404 (or Discord error code 10015 "Unknown Webhook"), causing the researcher agent's findings to be silently dropped. When this failure occurs, the system falls back to a bot token direct post, but the underlying delivery mechanism via `thread-response-wrapper.sh` remains broken. This note documents the recurring pattern and proposes a permanent resolution.

## Incident Timeline

This issue has recurred at least **four times** across a 5-day window in late March 2026:

1. **2026-03-25** — First observed: webhook 10015 error detected, `thread-response-wrapper.sh` silently fails with no posts made. Fix applied: webhook regenerated. (Source: [[discord-webhook-10015-unknown-webhook-error-patter|2d043f24]])
2. **2026-03-26 ~02:30 UTC** — Recurrence: webhook returns 404 again despite prior fix. Same regeneration applied. Cron-based health check suggested. (Source: [[config-webhookresearcher-at-discord-webhooks-v2env-return|149cbc6b]])
3. **2026-03-26 ~04:38 UTC** — Third recurrence within 2 hours: researcher fell back to bot token direct post. `thread-response-wrapper.sh` still broken. (Source: c46e7cb9 — this incident)
4. **2026-03-26 ~22:09 UTC** — Fourth recurrence: error code 10015 returns, researcher findings silently dropped. Impact raised to 4/5. (Source: [[config-webhookresearcher-returning-unknown-webhook-code-1|dc7beb5c]])
5. **2026-03-30** — Still recurring: webhook 10015 error observed again. (Source: [[config-webhookresearcher-in-discord-webhooks-v2env-return|4f0b3f61]])

## Root Cause Analysis

### Why Webhooks Get Invalidated

Discord webhooks can be deleted or invalidated in several ways:

- **Manual deletion** via Discord Server Settings → Integrations → Webhooks
- **Channel deletion** — if the target channel is removed, all its webhooks become invalid
- **Server restructuring** — channel moves or permission changes can orphan webhooks
- **Discord rate limiting or abuse detection** — repeated rapid posts may trigger webhook removal
- **Bot/integration cleanup** — server admins or automated tools pruning unused integrations

The rapid recurrence pattern (3 times in 20 hours) suggests either an automated cleanup process is running, or the regenerated webhook URL is not being persisted correctly to `discord-webhooks-v2.env` (i.e., the fix is applied in memory but not written to disk, or a stale cached copy overwrites the fix).

### Why the Failure Is Silent

`thread-response-wrapper.sh` does not validate the webhook URL before posting. When Discord returns a 404 or 10015 error, the script does not:
- Log the failure prominently
- Retry with an alternative delivery method
- Alert the operator

This means research findings are generated, processed, and then silently discarded at the final delivery step.

## Fallback Behavior

When the webhook fails, the system falls back to a **bot token direct post** via the Discord Bot API (`POST /channels/{id}/messages`). This works but bypasses the webhook's threading model — messages arrive as standalone bot messages rather than properly threaded responses, reducing the organizational quality of the `#research-feed` channel.

## Affected Components

| Component | Role | Impact |
|-----------|------|--------|
| `discord-webhooks-v2.env` | Stores `WEBHOOK_RESEARCHER` URL | Config becomes stale when webhook is invalidated |
| `thread-response-wrapper.sh` | Wraps webhook posts with threading | Silent failure — no error handling for 404/10015 |
| Researcher agent | Produces findings for delivery | Output silently dropped on webhook failure |
| `#research-feed` channel | Delivery target | Missing research posts; fallback posts unthreaded |

## Recommended Permanent Fix

### 1. Startup Webhook Validation
Add an HTTP HEAD check at `thread-response-wrapper.sh` startup:
```bash
# Validate webhook URL before attempting delivery
http_code=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_RESEARCHER")
if [ "$http_code" != "200" ]; then
    echo "ERROR: WEBHOOK_RESEARCHER invalid (HTTP $http_code)" >&2
    exit 1
fi
```

### 2. Cron-Based Health Check
Add a periodic webhook health check to system cron that alerts on failure:
```bash
# Every 15 minutes, verify all webhooks in discord-webhooks-v2.env
*/15 * * * * /home/trajan/bin/check-webhook-health.sh
```

### 3. Automatic Fallback with Logging
When webhook delivery fails, log the failure explicitly and fall back to bot token delivery with a warning annotation so the operator can see which posts were delivered via fallback.

### 4. Investigate Persistence
Verify that webhook regeneration is actually being written to the correct `discord-webhooks-v2.env` file and that no other process is overwriting it with stale values.

## Related Notes

- [[discord-webhook-10015-unknown-webhook-error-patter]] — Original detection of the 10015 error pattern
- [[webhookresearcher-discord-webhooks-v2env-still-ret]] — Fix non-persistence investigation
- [[config-webhookresearcher-returning-unknown-webhook-code-1]] — Fourth recurrence with elevated impact
- [[config-webhookresearcher-at-discord-webhooks-v2env-return]] — Second recurrence with cron suggestion
- [[config-webhookresearcher-in-discord-webhooks-v2env-return]] — March 30 recurrence
- [[Discord Server Architecture v5]] — Broader Discord integration architecture

## Status

This is a **known recurring issue** that has been repeatedly patched with webhook regeneration but lacks a permanent fix. The core problems are: (1) no webhook health monitoring, (2) silent failure in `thread-response-wrapper.sh`, and (3) possible config persistence issues. All three must be addressed to prevent further recurrence.

---
Tags: #intelligence #config-change #webhook-reliability #recurring-issue
