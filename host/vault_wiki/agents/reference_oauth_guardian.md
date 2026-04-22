---
name: OAuth Guardian & Dual-Account Token System
description: >-
  Complete reference for fixing OAuth/token issues — guardian v7, dual accounts
  (primary + secondary), circuit breaker, auto-login scripts, 5 config stores,
  manual recovery playbook
type: agent-learning
status: active
confidence: 0.95
confidence_updated: 2026-03-24T00:00:00.000Z
source: manual
updated: '2026-03-24'
created: '2026-03-16'
title: reference_oauth_guardian
summary: >-
  Guardian v7 manages two Anthropic OAuth accounts with circuit breaker,
  proactive refresh, rate limit protection, and Discord alerts
wiki_id: agents/reference_oauth_guardian
imported_from: vault/Agents/reference_oauth_guardian.md
imported_at: '2026-04-04T00:23:56.727Z'
tags: []
---
# OAuth Guardian System (v7)

## Architecture

Guardian v7 (`~/bin/oauth-guardian.sh`) runs as a **system-level** systemd service managing **two** Anthropic OAuth accounts:

- **Primary** (`anthropic:default`) — main account, stored in `~/.claude/.credentials.json`
- **Secondary/Backup** (`anthropic:secondary`) — fallback account, stored in `auth-profiles.json`

### Refresh tiers (per account)

1. **API refresh** — exchanges refresh_token at `https://console.anthropic.com/v1/oauth/token` (client_id: `9d1c250a-e61b-44d9-88ed-5944d1962f5e`). 3 retries with exponential backoff.
2. **Browser auto-login** (primary only) — `~/bin/auto-login.py` opens OAuth URL in Chrome Default profile, injects JS to click Authorize.
3. **Direct refresh with alt User-Agent** (secondary) — `~/bin/auto-login-secondary.py` retries the refresh with a browser User-Agent and longer backoff (6 retries, up to 10min).
4. **Primary-to-backup copy** — if secondary refresh fails completely, copies primary token as temporary backup.

### v7 Safety features (prevents repeat of 2026-03-24 outage)

| Feature | What it does |
|---------|-------------|
| **Proactive refresh** | Primary at 4h remaining, backup at 5h (was 60/90 min — too close to cliff) |
| **Circuit breaker** | After 3 consecutive 429s, pauses ALL refreshes for 1 hour |
| **Request budget** | Max 10 refresh requests per hour across both accounts |
| **Staggered timing** | Backup only refreshes in 2nd half of each minute (avoids shared rate limit) |
| **Escalating cooldown** | After exhaustion: 1h → 2h → 4h (was fixed 30min) |
| **Early Discord alert** | Notifies on first failure, not after all retries exhausted |
| **Fewer retries** | 3 (was 5) — fail fast, wait long instead of hammering |
| **Host machine fallback** | SSH to `host-machine` (192.168.122.1) to borrow its token when rate-limited |

### Thresholds

| Account | Refresh when < N min remaining |
|---------|-------------------------------|
| Primary | 240 min (4 hours) |
| Secondary | 300 min (5 hours, staggered) |

## Two Anthropic Accounts / Two Chrome Profiles

| Account | Chrome Profile | Claude.ai Login |
|---------|---------------|-----------------|
| Primary | `Default` | Main Anthropic account |
| Secondary | `Profile 1` | Backup Anthropic account |

**This is critical for manual recovery** — when logging in manually, use the correct Chrome profile to avoid cross-contaminating tokens.

## 5 Token Stores (must stay in sync)

### Primary token stores

| File | Key path |
|------|----------|
| `~/.claude/.credentials.json` | `claudeAiOauth.accessToken` (**source of truth**) |
| `~/.openclaw/agents/main/agent/auth-profiles.json` | `profiles["anthropic:default"].token` |
| `~/.openclaw/openclaw.json` | `models.providers.anthropic.apiKey` |
| `~/.openclaw/agents/main/agent/models.json` | `providers.anthropic.apiKey` |

### Secondary/backup token stores

| File | Key path |
|------|----------|
| `~/.openclaw/agents/main/agent/auth-profiles.json` | `profiles["anthropic:secondary"].access` + `.refresh` + `.expires` |
| `~/.openclaw/openclaw.json` | `models.providers["anthropic-backup"].apiKey` |
| `~/.openclaw/agents/main/agent/models.json` | `providers["anthropic-backup"].apiKey` |
| `~/.dispatch-env` | `ANTHROPIC_BACKUP_API_KEY` |

## Key Files

| File | Purpose |
|------|---------|
| `~/bin/oauth-guardian.sh` | Guardian v5 main loop (systemd service) |
| `~/bin/auto-login.py` | Browser auto-login for **primary** (Chrome Default) |
| `~/bin/auto-login-secondary.py` | Direct token refresh for **secondary** (alt User-Agent, backoff) |
| `/etc/systemd/system/oauth-guardian.service` | Guardian systemd unit (system-level, Restart=always) |
| `/etc/systemd/system/openclaw-gateway.service` | Gateway systemd unit (system-level, Restart=always) |
| `/var/log/oauth-guardian.log` | All guardian + auto-login logs |

## Manual Recovery Playbook

### Quick diagnosis

```bash
# Check services
sudo systemctl is-active oauth-guardian openclaw-gateway

# Check token expiry (primary)
python3 -c "import json,time; c=json.load(open('$HOME/.claude/.credentials.json'))['claudeAiOauth']; print(f'Primary: {int((c[\"expiresAt\"]/1000-time.time())/60)} min')"

# Check token expiry (secondary)
python3 -c "import json,time; ap=json.load(open('$HOME/.openclaw/agents/main/agent/auth-profiles.json')); e=ap['profiles']['anthropic:secondary'].get('expires',0); print(f'Secondary: {int((e/1000-time.time())/60)} min')"

# Recent guardian logs
tail -30 /var/log/oauth-guardian.log
```

### Manual token refresh (when auto-refresh is rate-limited)

#### Primary account

```bash
# 1. Back up secondary credentials (claude auth login overwrites .credentials.json)
#    (only needed if refreshing primary — skip if refreshing secondary)

# 2. Run login
claude auth login
# Browser opens → log in with PRIMARY account (Chrome Default) → click Authorize

# 3. Guardian auto-detects and syncs within 60s, or force:
sudo systemctl restart oauth-guardian openclaw-gateway
```

#### Secondary/backup account

```bash
# 1. Back up primary credentials
cp ~/.claude/.credentials.json ~/.claude/.credentials.json.primary-backup

# 2. Kill any stale auth processes
pkill -f "claude auth login"

# 3. Start fresh login
claude auth login &
# Wait for URL to appear in output

# 4. Open URL in Chrome Profile 1 (secondary account)
DISPLAY=:0 google-chrome --profile-directory="Profile 1" "<paste URL here>"
# Click Authorize in browser

# 5. Save secondary token to all stores
python3 -c "
import json, time, os
creds = json.load(open('$HOME/.claude/.credentials.json'))['claudeAiOauth']
new_access, new_refresh, new_expires = creds['accessToken'], creds['refreshToken'], creds['expiresAt']

# auth-profiles.json
ap = json.load(open('$HOME/.openclaw/agents/main/agent/auth-profiles.json'))
ap['profiles']['anthropic:secondary'] = {'type':'oauth','provider':'anthropic','access':new_access,'refresh':new_refresh,'expires':new_expires}
with open('$HOME/.openclaw/agents/main/agent/auth-profiles.json','w') as f: json.dump(ap,f,indent=2)

# openclaw.json
cfg = json.load(open('$HOME/.openclaw/openclaw.json'))
cfg['models']['providers']['anthropic-backup']['apiKey'] = new_access
with open('$HOME/.openclaw/openclaw.json','w') as f: json.dump(cfg,f,indent=2)

# models.json
m = json.load(open('$HOME/.openclaw/agents/main/agent/models.json'))
m.get('providers',m)['anthropic-backup']['apiKey'] = new_access
with open('$HOME/.openclaw/agents/main/agent/models.json','w') as f: json.dump(m,f,indent=2)

print(f'Saved. Expires in {int((new_expires/1000-time.time())/60)} min')
"

# 6. Restore primary credentials
cp ~/.claude/.credentials.json.primary-backup ~/.claude/.credentials.json

# 7. Restart gateway
sudo systemctl restart openclaw-gateway

# 8. Clean up
trash ~/.claude/.credentials.json.primary-backup
```

### Verify both tokens work

```bash
PRIMARY=$(python3 -c "import json; print(json.load(open('$HOME/.openclaw/openclaw.json'))['models']['providers']['anthropic']['apiKey'])")
BACKUP=$(python3 -c "import json; print(json.load(open('$HOME/.openclaw/openclaw.json'))['models']['providers']['anthropic-backup']['apiKey'])")
echo "Primary:" && curl -s -o /dev/null -w "%{http_code}" -X POST https://api.anthropic.com/v1/messages -H "x-api-key: $PRIMARY" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" -d '{"model":"claude-haiku-4-5-20251001","max_tokens":5,"messages":[{"role":"user","content":"hi"}]}'
echo ""
echo "Backup:" && curl -s -o /dev/null -w "%{http_code}" -X POST https://api.anthropic.com/v1/messages -H "x-api-key: $BACKUP" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" -d '{"model":"claude-haiku-4-5-20251001","max_tokens":5,"messages":[{"role":"user","content":"hi"}]}'
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Both tokens 401 | Tokens expired, guardian rate-limited | Manual recovery (see playbook above) |
| Primary 401, backup works | Primary expired or desync | `sudo systemctl restart oauth-guardian` (auto-refreshes) |
| Backup 401, primary works | Secondary expired | Run secondary manual recovery, or wait for guardian |
| Guardian "all retries exhausted" | Rate-limited on refresh endpoint | Guardian auto-tries host fallback; or manual: `ssh host-machine` to borrow token |
| OpenClaw 401 but `claude` CLI works | Token desync (config not updated) | `sudo systemctl restart oauth-guardian openclaw-gateway` |
| "Redirect URI not supported" | OAuth client rejects redirect | Use localhost callback with `/callback` path, or borrow token from host machine |
| Auto-login JS injection fails | Authorize button not on page, or Cloudflare challenge | Log into claude.ai manually in that Chrome profile first |
| Rate limit persists for hours | Token endpoint rate limit is on client_id + IP, shared across ALL accounts | Use host machine fallback (SSH), or wait — guardian v7 circuit breaker prevents worsening |

## Host Machine Fallback (when rate-limited)

The host machine (`host-machine` / 192.168.122.1) runs its own Claude Code session with valid tokens. When the VM's token refresh is rate-limited, SSH in and borrow the host's token:

```bash
# Automatic (guardian does this) or manual:
HOST_DATA=$(ssh host-machine "python3 -c \"
import json
c = json.load(open('/home/trajan/.claude/.credentials.json'))['claudeAiOauth']
print(json.dumps({'access': c['accessToken'], 'refresh': c['refreshToken'], 'expires': c['expiresAt']}))
\"")

echo "$HOST_DATA" | python3 -c "
import json, sys, os
data = json.loads(sys.stdin.read())
for fpath, key_path in [
    ('~/.openclaw/agents/main/agent/auth-profiles.json', None),
    ('~/.openclaw/openclaw.json', ['models', 'providers', 'anthropic-backup', 'apiKey']),
    ('~/.openclaw/agents/main/agent/models.json', ['providers', 'anthropic-backup', 'apiKey']),
]:
    fp = os.path.expanduser(fpath)
    d = json.load(open(fp))
    if key_path is None:
        d['profiles']['anthropic:secondary'] = {
            'type': 'oauth', 'provider': 'anthropic',
            'access': data['access'], 'refresh': data['refresh'], 'expires': data['expires'],
        }
    else:
        obj = d
        for k in key_path[:-1]: obj = obj[k]
        obj[key_path[-1]] = data['access']
    with open(fp, 'w') as f:
        json.dump(d, f, indent=2)
print('Done')
"
sudo systemctl restart openclaw-gateway
```

**Why this works:** Same public IP means shared rate limit on token refresh. But the host's *existing* token is already valid — no refresh needed, just copy it.

## Critical Rules

- **`claude auth login` overwrites `~/.claude/.credentials.json`** — always back up primary before refreshing secondary
- **Two Chrome profiles, two accounts** — Default = primary, Profile 1 = secondary
- **Host machine** (`ssh host-machine`) has its own valid tokens — borrow them when rate-limited
- **Never refresh in a tight loop** — refreshing revokes old token, breaking active sessions
- **Only refresh based on `expiresAt` timestamp** — don't use API response codes as trigger
- **Rate limits are on client_id + IP** — shared across ALL accounts on same machine/network. Can persist for hours after a retry storm.

## Related

- [[OAuth Guardian v4]] (superseded, historical reference)
- 2026-03-24 outage postmortem: both tokens expired, guardian rate-limited for 8h due to retry storm. Fixed by v7 circuit breaker + proactive refresh.
- [[Headless OAuth Recovery]]
- [[Secrets]]
- [[OpenClaw]]
