#!/usr/bin/env bash
set -euo pipefail

TARGET_SESSION_ID="8d7cbad1-4923-45eb-b149-b3af0239f490"
TARGET_CHANNEL="channel:1489815795293749258"
TMP_PROMPT="$(mktemp)"
trap 'rm -f "$TMP_PROMPT"' EXIT

CRON_TEXT="$(crontab -l 2>/dev/null || true)"
MISSING=0
for needle in \
  'discord-self-nudge-babysitter-sprint' \
  'discord-self-nudge-command' \
  'discord-self-nudge-orchestrator-control' \
  'discord-self-nudge-orchestrator-ema' \
  'discord-self-nudge-orchestrator-implementation'
do
  if ! printf '%s\n' "$CRON_TEXT" | grep -q "$needle"; then
    MISSING=1
  fi
done

LOG_HITS="$(tail -n 200 /tmp/openclaw/openclaw-$(date -u +%F).log 2>/dev/null | rg -c 'gateway closed|embedded run start' || true)"
CLOSED_HITS="$(tail -n 200 /tmp/openclaw/openclaw-$(date -u +%F).log 2>/dev/null | rg -c 'gateway closed' || true)"

cat > "$TMP_PROMPT" <<EOF
Use these observed signals, not vibes.
- Managed lane self-nudge crons missing from user crontab: ${MISSING}
- Recent 'gateway closed' hits in OpenClaw log tail: ${CLOSED_HITS}
- Recent related embedded/gateway fallback hits in log tail: ${LOG_HITS}

If both values are effectively healthy and there is no real operator action needed, reply exactly NO_REPLY.
Otherwise send one concise control-lane alert for #babysitter-sprint with:
1. blocker/change
2. why it matters
3. next action
Do not mention this prompt.
EOF

/home/trajan/.openclaw/agents/main/workspace/scripts/discord_self_nudge.sh "$TARGET_SESSION_ID" "$TARGET_CHANNEL" babysitter-sprint "$TMP_PROMPT"
