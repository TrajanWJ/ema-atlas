#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# ClaudeForge API Client for OpenClaw
# Lets OpenClaw agents on the VM interact with ClaudeForge sessions.
#
# Usage:
#   claudeforge.sh create <project-dir> [session-name] [provider]
#   claudeforge.sh send <session-id> <message> [--wait]
#   claudeforge.sh status [session-id]
#   claudeforge.sh stop <session-id>
#   claudeforge.sh resume <session-id>
#   claudeforge.sh messages <session-id> [--limit N]
#   claudeforge.sh list [--active]
#   claudeforge.sh projects
#
# Environment:
#   CLAUDEFORGE_URL     — base URL (default: http://localhost:3001)
#   CLAUDEFORGE_API_KEY — API key for auth (optional in dev mode)
#
# All output is JSON for easy parsing by agents.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

API="${CLAUDEFORGE_URL:-http://localhost:3001}"
API_KEY="${CLAUDEFORGE_API_KEY:-}"

# Build auth headers
AUTH_HEADERS=(-H "Content-Type: application/json")
if [ -n "$API_KEY" ]; then
  AUTH_HEADERS+=(-H "Authorization: Bearer $API_KEY")
fi

usage() {
  cat >&2 <<'EOF'
Usage: claudeforge.sh <command> [args...]

Commands:
  create <dir> [name] [provider]   Create session in project directory
  send <session-id> <message>      Send message (add --wait to poll for response)
  status [session-id]              System status or session details
  stop <session-id>                Stop a session
  resume <session-id>              Resume a stopped session
  messages <session-id> [--limit N] Get session messages
  list [--active]                  List sessions (optionally only active)
  projects                         List open projects

Environment:
  CLAUDEFORGE_URL      Base URL (default: http://localhost:3001)
  CLAUDEFORGE_API_KEY  API key for authentication
EOF
  exit 1
}

# Helpers
api_get() {
  curl -sf "${AUTH_HEADERS[@]}" "$API$1" 2>/dev/null || {
    echo '{"error": "Request failed — is ClaudeForge running at '"$API"'?"}' >&2
    exit 1
  }
}

api_post() {
  local path="$1"
  local data="${2:-{}}"
  curl -sf -X POST "${AUTH_HEADERS[@]}" -d "$data" "$API$path" 2>/dev/null || {
    echo '{"error": "Request failed — is ClaudeForge running at '"$API"'?"}' >&2
    exit 1
  }
}

[ $# -lt 1 ] && usage
CMD="$1"
shift

case "$CMD" in
  create)
    DIR="${1:?directory required}"
    NAME="${2:-openclaw-session}"
    PROVIDER="${3:-claude}"

    # First ensure project is open
    PROJECT=$(api_post "/api/projects/open" \
      "$(jq -nc --arg d "$DIR" '{directory: $d}')")

    PROJECT_ID=$(echo "$PROJECT" | jq -r '.project.id // .id // empty')
    PROJECT_NAME=$(echo "$PROJECT" | jq -r '.project.name // .name // empty')

    if [ -z "$PROJECT_ID" ]; then
      echo '{"error": "Failed to open project", "details": '"$PROJECT"'}' >&2
      exit 1
    fi

    # Create session
    RESULT=$(api_post "/api/sessions" \
      "$(jq -nc \
        --arg pid "$PROJECT_ID" \
        --arg dir "$DIR" \
        --arg pname "$PROJECT_NAME" \
        --arg name "$NAME" \
        --arg prov "$PROVIDER" \
        '{projectId: $pid, directory: $dir, projectName: $pname, name: $name, provider: $prov}')")

    echo "$RESULT" | jq .
    ;;

  send)
    SESSION_ID="${1:?session-id required}"
    MESSAGE="${2:?message required}"
    WAIT=false

    # Check for --wait flag
    for arg in "$@"; do
      [ "$arg" = "--wait" ] && WAIT=true
    done

    # Escape message for JSON
    ESCAPED=$(printf '%s' "$MESSAGE" | jq -Rs .)

    RESULT=$(api_post "/api/sessions/$SESSION_ID/message" \
      "{\"content\": $ESCAPED}")

    if [ "$WAIT" = true ]; then
      # Poll for new assistant messages
      BEFORE_COUNT=$(api_get "/api/sessions/$SESSION_ID/messages?limit=1000" | jq 'length')
      MAX_WAIT=120
      ELAPSED=0

      while [ $ELAPSED -lt $MAX_WAIT ]; do
        sleep 2
        ELAPSED=$((ELAPSED + 2))

        STATUS=$(api_get "/api/sessions/$SESSION_ID" | jq -r '.status')
        CURRENT_COUNT=$(api_get "/api/sessions/$SESSION_ID/messages?limit=1000" | jq 'length')

        if [ "$STATUS" = "idle" ] && [ "$CURRENT_COUNT" -gt "$BEFORE_COUNT" ]; then
          # Get the latest assistant messages
          api_get "/api/sessions/$SESSION_ID/messages?limit=5" | \
            jq '[.[] | select(.role == "assistant" and .toolCall == null)] | last // {content: "No response"}'
          exit 0
        fi

        if [ "$STATUS" = "error" ]; then
          echo '{"error": "Session entered error state"}' >&2
          exit 1
        fi
      done

      echo '{"error": "Timed out waiting for response", "elapsed": '"$ELAPSED"'}' >&2
      exit 1
    else
      echo "$RESULT" | jq .
    fi
    ;;

  status)
    if [ $# -gt 0 ]; then
      api_get "/api/sessions/$1" | jq .
    else
      api_get "/api/system/status" | jq .
    fi
    ;;

  stop)
    SESSION_ID="${1:?session-id required}"
    api_post "/api/sessions/$SESSION_ID/stop" | jq .
    ;;

  resume)
    SESSION_ID="${1:?session-id required}"
    api_post "/api/sessions/$SESSION_ID/resume" | jq .
    ;;

  messages)
    SESSION_ID="${1:?session-id required}"
    shift
    LIMIT=100

    while [ $# -gt 0 ]; do
      case "$1" in
        --limit) LIMIT="${2:?limit value required}"; shift 2 ;;
        *) shift ;;
      esac
    done

    api_get "/api/sessions/$SESSION_ID/messages?limit=$LIMIT" | jq .
    ;;

  list)
    if [ "${1:-}" = "--active" ]; then
      api_get "/api/sessions/active" | jq .
    else
      api_get "/api/sessions" | jq .
    fi
    ;;

  projects)
    api_get "/api/projects" | jq .
    ;;

  *)
    echo "Unknown command: $CMD" >&2
    usage
    ;;
esac
