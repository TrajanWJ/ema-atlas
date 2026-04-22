# LCM Summary sum_3f35a7763cedf6fe

Created: 2026-03-25 18:46:11
Kind: leaf
Depth: 0
Conversation: 693
Tokens: 1215
Descendants: 0
Earliest: 2026-03-24T21:39:00.000Z
Latest: 2026-03-24T21:39:01.000Z

## Content

[2026-03-24 21:39 UTC]
#!/usr/bin/env bash
# feed-emit.sh — Append to the persistent agent feed log
# Usage: feed-emit.sh --agent righthand --type task_started --content "Starting batch"
#        feed-emit.sh --agent ops --type error --content "Disk at 90%" --urgent
# 
# Types: task_started, task_completed, error, insight, vault_write, 
#        file_changed, question_asked, queue_new, queue_resolved, system

set -euo pipefail

FEED_FILE="$HOME/dispatch/feed.jsonl"
DISCORD_CHANNEL_ID=""  # Set when #agent-feed channel ID is available
CHANNEL_IDS="$HOME/dispatch/channel-ids.json"

# Defaults
AGENT="righthand"
TYPE="system"
CONTENT=""
PINNED="false"
URGENT="false"
CHANNEL="agent-feed"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent)   AGENT="$2"; shift 2 ;;
    --type)    TYPE="$2"; shift 2 ;;
    --content) CONTENT="$2"; shift 2 ;;
    --pinned)  PINNED="true"; shift ;;
    --urgent)  URGENT="true"; shift ;;
    --channel) CHANNEL="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: feed-emit.sh --agent AGENT --type TYPE --content TEXT [--pinned] [--urgent] [--channel CH]"
      exit 0 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$CONTENT" ]]; then
  echo "Error: --content is required"
  exit 1
fi

NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
DATE_PART=$(date -u +%Y%m%d)
SEQ=$(grep -c "\"f-${DATE_PART}-" "$FEED_FILE" 2>/dev/null | tail -1 || true)
SEQ=${SEQ:-0}
SEQ=$((SEQ + 1))
ID=$(printf "f-%s-%03d" "$DATE_PART" "$SEQ")

# Append to JSONL
jq -nc \
  --arg id "$ID" \
  --arg agent "$AGENT" \
  --arg type "$TYPE" \
  --arg content "$CONTENT" \
  --arg ts "$NOW" \
  --argjson pinned "$PINNED" \
  --argjson urgent "$URGENT" \
  --arg channel "$CHANNEL" \
  '{id:$id, agent:$agent, type:$type, content:$content, timestamp:$ts, pinned:$pinned, urgent:$urgent, channel:$channel}' \
  >> "$FEED_FILE"

echo "Feed: $ID ($TYPE) from $AGENT"

# Mirror to Discord #agent-feed if channel ID available
if [[ -f "$CHANNEL_IDS" ]]; then
  FEED_CH_ID=$(jq -r '."🤖-agent-feed" // empty' "$CHANNEL_IDS" 2>/dev/null)
  if [[ -n "$FEED_CH_ID" ]]; then
    # Type emoji mapping
    case "$TYPE" in
      task_started)   EMOJI="🚀" ;;
      task_completed) EMOJI="✅" ;;
      error)          EMOJI="🔴" ;;
      insight)        EMOJI="💡" ;;
      vault_write)    EMOJI="📝" ;;
      file_changed)   EMOJI="📁" ;;
      question_asked) EMOJI="❓" ;;
      queue_new)      EMOJI="📋" ;;
      queue_resolved) EMOJI="✔️" ;;
      *)              EMOJI="📌" ;;
    esac
    
    # Agent emoji lookup
    case "$AGENT" in
      righthand)  AEMOJI="🤝" ;;
      researcher) AEMOJI="🔬" ;;
      coder)      AEMOJI="💻" ;;
      ops)        AEMOJI="⚙️" ;;
      utility)    AEMOJI="🔧" ;;
      devil*)     AEMOJI="😈" ;;
      *)          AEMOJI="🤖" ;;
    esac

    MSG="${EMOJI} ${AEMOJI} **${AGENT}** — ${CONTENT}"
    
    # Post via openclaw system event (non-blocking, best-effort)
    openclaw message send --channel discord --to "channel:${FEED_CH_ID}" --message "$MSG" --silent 2>/dev/null &
  fi
fi

[2026-03-24 21:39 UTC]


[2026-03-24 21:39 UTC]
{
  "concierge": "1482997518362214422",
  "📋-dispatch": "1484014822642286654",
  "🗂️-desk": "1482996866428964904",
  "⚖️-decisions": "1482939106223853740",
  "🧠-prompt-lab": "1484014825670574180",
  "📡-ingestor-feed": "1482295358963974187",
  "📦-vault-feed": "1483018390015709315",
  "🔗-links": "1482256987700990066",
  "🔬-research-feed": "1482258431997116531",
  "💻-code-output": "1484014829156175893",
  "😈-devils-corner": "1484014830280249395",
  "🤖-agent-feed": "1483010758408274027",
  "🫀-heartbeat": "1482256931375546489",
  "🚨-alerts": "1484014832599437372",
  "🔒-security": "1484014833790877716",
  "⚙️-ops-log": "1482256984811114688",
  "📜-raw-logs": "1482547280325120076",
  "🚀-projects": "1482899212889751745",
  "💬-agent-status": "1484015032038850640",
  "🤖-agent-os-frontend": "1484411982487490701"
}

[2026-03-24 21:39 UTC]


[2026-03-24 21:39 UTC]
/home/trajan/bin/discord-webhooks-v2.env:57:CHAN_OPS_LOG="1482256984811114688"
/home/trajan/bin/webhook-manager.sh:288:    ["right-hand-agent-logs"]="1482256984811114688"
/home/trajan/bin/webhook-manager.sh:290:    ["ops-log"]="1482256984811114688"
/home/trajan/bin/webhook-manager.sh:300:    ["ops-log"]="Ops"

[2026-03-24 21:39 UTC]


[2026-03-24 21:39 UTC]
#!/usr/bin/env bash
# webhook-manager.sh — Centralized Discord webhook management
# Usage: webhook-manager.sh <command> [args]
set -euo pipefail

STATE_DIR="$HOME/state"
STATE_FILE="$STATE_DIR/webhooks.json"
RATE_LIMIT_FILE="/tmp/webhook-manager-last-post"
RATE_LIMIT_MS=2000

# --- Helpers ---

load_token() {
  if [[ -z "${DISCORD_BOT_TOKEN:-}" ]]; then
    if [[ -f "$HOME/.dispatch-env" ]]; then
      # shellcheck disable=SC1091
      source "$HOME/.dispatch-env"
    fi
  fi
  if
[LCM fallback summary; truncated for context management]
