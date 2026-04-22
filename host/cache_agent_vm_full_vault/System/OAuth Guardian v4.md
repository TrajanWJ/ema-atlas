---
type: reference
domain: system-ops
confidence: 0.95
source: agent:vault-keeper
summary: "Systemd service that auto-refreshes Claude OAuth tokens at <20min remaining, syncs across 4 credential stores"
created: 2026-03-18
updated: 2026-03-18
aliases: [oauth-guardian, token refresh, auth guardian]
title: "OAuth Guardian v4"
status: active
---

# OAuth Guardian v4

## Purpose

Keeps Claude API authentication alive 24/7 by auto-refreshing OAuth tokens before expiry and syncing credentials across all consumers.

## How It Works

1. Checks token expiry every 60 seconds
2. When remaining lifetime < 20 minutes, refreshes using the refresh token
3. Writes new tokens to all 4 credential stores simultaneously
4. Restarts `openclaw-gateway` to pick up the fresh token
5. Never tests the API to check validity — relies solely on `expiresAt` timestamp

### Refresh Cycle

```
Token issued (480min TTL)
  → 460min pass...
  → Guardian detects <20min remaining
  → POST to console.anthropic.com/v1/oauth/token
  → New token written to 4 stores
  → Gateway restarted
  → New 480min cycle begins
```

Typical refresh interval: ~7.9 hours.

## Credential Stores Synced

1. `~/.claude/.credentials.json` — Claude CLI credentials
2. `~/.openclaw/agents/main/agent/auth-profiles.json` — OpenClaw auth profiles
3. `~/.openclaw/agents/main/agent/models.json` — Model configuration
4. `~/.openclaw/openclaw.json` — Main OpenClaw config

## Service Configuration

- **Unit:** `oauth-guardian.service`
- **Script:** `~/bin/oauth-guardian.sh`
- **Log:** `/var/log/oauth-guardian.log`
- **Restart:** Always (RestartSec=10)

## Troubleshooting

```bash
tail -20 /var/log/oauth-guardian.log          # Check recent activity
systemctl status oauth-guardian               # Service health
sudo systemctl restart oauth-guardian openclaw-gateway  # Nuclear reset
```

If refresh fails: check that `~/.claude/.credentials.json` has a valid `refreshToken`. If corrupt, re-authenticate via browser login.

## Related

- [[Security Posture - Agent System]] — auth security model
- [[System Overview]] — where OAuth Guardian fits
