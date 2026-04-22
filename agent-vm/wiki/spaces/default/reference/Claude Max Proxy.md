---
title: Claude Max Proxy
created: '2026-03-14'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: reference
tags:
  - auth
  - deprecated
  - openclaw
summary: >-
  The proxy (`opencode-claude-max-proxy`) routed API calls through Claude Code
  auth but:
wiki_id: reference/Claude_Max_Proxy
imported_from: vault/Reference/Claude Max Proxy.md
imported_at: '2026-04-04T00:23:56.910Z'
---
# Claude Max Proxy (DEPRECATED)

> **Deprecated 2026-03-14.** Replaced by native [[OpenClaw]] gateway with OAuth Guardian v4 token sync.

---

## Why Deprecated

The proxy (`opencode-claude-max-proxy`) routed API calls through Claude Code auth but:
- Dropped `tool_use` blocks causing "terminated" errors
- Added unnecessary complexity (extra service, extra port)
- Required manual restarts when auth expired

## Current Setup

[[OpenClaw]] gateway runs natively as a systemd service (`openclaw-gateway.service`). Auth is managed by OAuth Guardian v4 which auto-syncs tokens.

```bash
# Current (native)
sudo systemctl status openclaw-gateway
sudo systemctl status oauth-guardian

# Old (deprecated, disabled)
# sudo systemctl status claude-max-proxy  ← no longer exists
```

## What Was Replaced

| Old Component | Replaced By |
|---|---|
| `claude-max-proxy.service` (port 3456) | `openclaw-gateway.service` (port 18789) |
| `anthropic-max-proxy` [[OpenClaw]] plugin | Native model provider |
| Manual token refresh cron | OAuth Guardian v4 (auto) |

## Related Notes

- [[Reference/System Services]] — current services
- [[Agents/OpenClaw]] — gateway setup

#openclaw #deprecated #auth
