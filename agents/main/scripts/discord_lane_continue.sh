#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <discord_channel_id> <lane_name> [extra_prompt_file]" >&2
  exit 2
fi

CHANNEL_ID="$1"
LANE_NAME="$2"
EXTRA_PROMPT_FILE="${3:-}"
SESSIONS_JSON="/home/trajan/.openclaw/agents/main/sessions/sessions.json"
SESSION_KEY="agent:main:discord:channel:${CHANNEL_ID}"
DISCORD_TARGET="channel:${CHANNEL_ID}"
TMP_JSON="$(mktemp)"
trap 'rm -f "$TMP_JSON"' EXIT

resolve_session_id() {
  python3 - <<'PY' "$SESSIONS_JSON" "$SESSION_KEY"
import json,sys
path,key=sys.argv[1],sys.argv[2]
with open(path) as f:
    data=json.load(f)
entry = data.get(key) if isinstance(data, dict) else None
if isinstance(entry, dict):
    for candidate in ('id','sessionId'):
        value=entry.get(candidate)
        if isinstance(value, str) and value.strip():
            print(value.strip())
            break
PY
}

SESSION_ID="$(resolve_session_id)"
if [[ -z "$SESSION_ID" ]]; then
  echo "missing session id for $SESSION_KEY" >&2
  openclaw message send --channel discord --target "$DISCORD_TARGET" --message "Lane session binding is missing for $LANE_NAME, continuation cannot run, the next action is to restore the session entry before auto-nudges can behave correctly."
  exit 3
fi

BASE_PROMPT=$(cat <<'EOF'
Read HEARTBEAT.md and DISCORD_SELF_NUDGE_SPEC.md from the workspace if relevant.
You are evaluating whether this lane needs continuation or a Discord self-nudge right now.
First, load context explicitly and behave like a good session citizen:
- Re-anchor on the lane's own session context before deciding anything.
- Read the most relevant recent context available in the current session before judging whether a nudge is needed.
- If the session context looks stale, missing, detached, too thin, or unable to act, treat that as the primary issue.
- Prefer continuation-worthy updates over vague status chatter.
- Use the lane-specific prompt below as specialization, not as a substitute for actual context loading.
Rules:
- Do not post just to look alive.
- If nothing materially changed, there is no real blocker, and no human attention is needed, reply with exactly: NO_REPLY
- Only post when there is a real blocker, a missing/stale lane binding, a failed continuation, thin/missing context that breaks good judgment, or a concrete next action that should surface in Discord.
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
Session key: $SESSION_KEY
Session id: $SESSION_ID

Before deciding, use this minimum context-loading sequence:
1. Reconstruct the lane's immediate purpose from the existing session and recent lane messages.
2. Check whether there is enough recent context to make a good nudge decision.
3. If context is too thin, stale, or broken, surface that instead of bluffing.
4. Only then decide between NO_REPLY versus one concise alert.

$EXTRA_PROMPT"

run_agent() {
  openclaw agent --session-id "$SESSION_ID" --message "$PROMPT" --json > "$TMP_JSON"
}

if ! run_agent; then
  if ! openclaw gateway status >/dev/null 2>&1; then
    openclaw gateway restart >/dev/null 2>&1 || true
    sleep 4
  fi
  run_agent
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

openclaw message send --channel discord --target "$DISCORD_TARGET" --message "$OUT"
