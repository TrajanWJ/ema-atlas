#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "usage: $0 <session_id> <discord_target> <lane_name> [extra_prompt_file]" >&2
  exit 2
fi

SESSION_ID="$1"
DISCORD_TARGET="$2"
LANE_NAME="$3"
EXTRA_PROMPT_FILE="${4:-}"
TMP_JSON="$(mktemp)"
trap 'rm -f "$TMP_JSON"' EXIT

BASE_PROMPT=$(cat <<'EOF'
Read HEARTBEAT.md and DISCORD_SELF_NUDGE_SPEC.md from the workspace if relevant.
You are evaluating whether this lane needs a Discord self-nudge right now.
Rules:
- Do not post just to look alive.
- If nothing materially changed, there is no real blocker, and no human attention is needed, reply with exactly: NO_REPLY
- Otherwise reply with one concise alert only.
- Include: (1) blocker/change, (2) why it matters, (3) next action.
- No preamble, no markdown heading, no extra commentary.
EOF
)

EXTRA_PROMPT=""
if [[ -n "$EXTRA_PROMPT_FILE" && -f "$EXTRA_PROMPT_FILE" ]]; then
  EXTRA_PROMPT="$(cat "$EXTRA_PROMPT_FILE")"
fi

PROMPT="$BASE_PROMPT

Lane name: $LANE_NAME
Target Discord lane: $DISCORD_TARGET

$EXTRA_PROMPT"

run_agent_json() {
  openclaw agent --session-id "$SESSION_ID" --message "$PROMPT" --json > "$TMP_JSON"
}

if ! run_agent_json; then
  if openclaw gateway status >/dev/null 2>&1; then
    run_agent_json
  else
    openclaw gateway restart >/dev/null 2>&1 || true
    sleep 4
    run_agent_json
  fi
fi

OUT=$(python3 - <<'PY' "$TMP_JSON"
import json,sys
p=sys.argv[1]
with open(p) as f:
    data=json.load(f)
text=''
for key in ('output','message','text','content'):
    if isinstance(data.get(key), str) and data.get(key).strip():
        text=data.get(key).strip()
        break
if not text:
    result=data.get('result') or {}
    for key in ('output','message','text','content'):
        if isinstance(result.get(key), str) and result.get(key).strip():
            text=result.get(key).strip()
            break
    if not text:
        payloads=result.get('payloads') or []
        if isinstance(payloads, list):
            for item in payloads:
                if isinstance(item, dict):
                    for key in ('text','message','content','output'):
                        if isinstance(item.get(key), str) and item.get(key).strip():
                            text=item.get(key).strip()
                            break
                if text:
                    break
if not text:
    final=data.get('final') or {}
    for key in ('output','message','text','content'):
        if isinstance(final.get(key), str) and final.get(key).strip():
            text=final.get(key).strip()
            break
print(text)
PY
)

OUT="$(printf '%s' "$OUT" | tr -d '\r')"

if [[ -z "$OUT" || "$OUT" == "NO_REPLY" || "$OUT" == "HEARTBEAT_OK" ]]; then
  exit 0
fi

if ! openclaw message send --channel discord --target "$DISCORD_TARGET" --message "$OUT"; then
  openclaw gateway restart >/dev/null 2>&1 || true
  sleep 4
  openclaw message send --channel discord --target "$DISCORD_TARGET" --message "$OUT"
fi
