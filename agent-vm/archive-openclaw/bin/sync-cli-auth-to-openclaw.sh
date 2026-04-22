#!/usr/bin/env bash
# sync-cli-auth-to-openclaw.sh — Keep OpenClaw's API key in sync with Claude CLI's live OAuth token
#
# The CLI handles OAuth refresh internally. This script extracts the live token
# and writes it to OpenClaw's config so gateway-dispatched agents also get fresh auth.
#
# Run via cron: */10 * * * * /home/trajan/bin/sync-cli-auth-to-openclaw.sh

set -euo pipefail

CREDS_FILE="$HOME/.claude/.credentials.json"
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
LOG="$HOME/.openclaw/logs/cli-auth-sync.log"

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOG"; }

# Extract the live OAuth access token from Claude CLI credentials
if [[ ! -f "$CREDS_FILE" ]]; then
  log "SKIP: no credentials file"
  exit 0
fi

ACCESS_TOKEN=$(python3 -c "
import json, time
with open('$CREDS_FILE') as f:
    d = json.load(f)
oauth = d.get('claudeAiOauth', {})
token = oauth.get('accessToken', '')
expires = oauth.get('expiresAt', 0)
remaining_h = (expires - time.time() * 1000) / 3600000
if remaining_h < 0:
    print('EXPIRED')
else:
    print(token)
" 2>/dev/null)

if [[ "$ACCESS_TOKEN" == "EXPIRED" || -z "$ACCESS_TOKEN" ]]; then
  log "SKIP: token expired or empty"
  exit 0
fi

# Update OpenClaw config with the live token
python3 << PYEOF
import json

with open("$OPENCLAW_CONFIG") as f:
    cfg = json.load(f)

providers = cfg.get("models", {}).get("providers", {})
changed = False

for name in ["anthropic", "anthropic-backup"]:
    if name in providers:
        old_key = providers[name].get("apiKey", "")
        if old_key != "$ACCESS_TOKEN":
            providers[name]["apiKey"] = "$ACCESS_TOKEN"
            changed = True

if changed:
    with open("$OPENCLAW_CONFIG", "w") as f:
        json.dump(cfg, f, indent=2)
    print("SYNCED")
else:
    print("UNCHANGED")
PYEOF

RESULT=$?
if [[ $RESULT -eq 0 ]]; then
  log "OK: CLI token synced to OpenClaw providers"
else
  log "ERROR: sync failed"
fi
