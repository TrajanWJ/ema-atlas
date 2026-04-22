#!/usr/bin/env bash
set -euo pipefail

# Agent Factory v2 — Template-based agent generator
# Creates new specialist agents with SOUL.md, CLAUDE.md, and directory structure

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"
AGENTS_BASE="${HOME}/.openclaw/agents"
AGENT_CARDS="${HOME}/.openclaw/agents/main/workspace/agent-cards.json"

# Default accent colors per type
declare -A TYPE_COLORS=(
  [researcher]="#2BA89E"
  [coder]="#57A773"
  [ops]="#6C7A89"
  [security]="#E74C3C"
  [utility]="#9B59B6"
)

# Default capabilities per type
declare -A TYPE_CAPABILITIES=(
  [researcher]="research,analysis,evaluation,web-search,source-verification"
  [coder]="coding,debugging,code-review,refactoring,testing"
  [ops]="system-health,monitoring,cron,service-management,troubleshooting"
  [security]="security-audit,vulnerability-scanning,hardening,threat-modeling"
  [utility]="task-execution,file-operations,data-processing"
)

# Default cost tiers
declare -A TYPE_COST=(
  [researcher]="medium"
  [coder]="high"
  [ops]="medium"
  [security]="medium"
  [utility]="low"
)

usage() {
  cat <<EOF
Agent Factory v2 — Create specialist agents from templates

Usage:
  $(basename "$0") --name "Agent Name" --id agent-id --type TYPE [OPTIONS]

Required:
  --name NAME       Display name (e.g., "Data Analyst")
  --id ID           Agent ID, lowercase-hyphen (e.g., data-analyst)
  --type TYPE       Template type: researcher|coder|ops|security|utility

Options:
  --emoji EMOJI     Agent emoji (default: type-specific)
  --scope DESC      Agent scope/description
  --color HEX       Accent color (default: type-specific)
  --skills LIST     Comma-separated skill names
  --capabilities    Comma-separated capabilities (default: type-specific)
  --no-register     Skip agent-cards.json registration
  --dry-run         Show what would be created without writing
  --force           Overwrite existing agent directory
  -h, --help        Show this help

Types:
  researcher  — Deep-dive investigation, analysis, source verification
  coder       — Building, fixing, reviewing code
  ops         — System health, monitoring, infrastructure
  security    — Auditing, hardening, vulnerability scanning
  utility     — General-purpose task execution

Examples:
  $(basename "$0") --name "Data Analyst" --id data-analyst --type researcher --emoji 📊 --scope "Data analysis and visualization"
  $(basename "$0") --name "DevOps" --id devops --type ops --emoji 🔧 --scope "CI/CD and deployment"
  $(basename "$0") --name "Code Reviewer" --id code-reviewer --type coder --skills "agent-tester" --scope "Code review and quality"
EOF
  exit 0
}

# Parse arguments
NAME="" ID="" TYPE="" EMOJI="" SCOPE="" COLOR="" SKILLS="" CAPABILITIES=""
NO_REGISTER=false DRY_RUN=false FORCE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) NAME="$2"; shift 2 ;;
    --id) ID="$2"; shift 2 ;;
    --type) TYPE="$2"; shift 2 ;;
    --emoji) EMOJI="$2"; shift 2 ;;
    --scope) SCOPE="$2"; shift 2 ;;
    --color) COLOR="$2"; shift 2 ;;
    --skills) SKILLS="$2"; shift 2 ;;
    --capabilities) CAPABILITIES="$2"; shift 2 ;;
    --no-register) NO_REGISTER=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --force) FORCE=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

# Validate required args
[[ -z "$NAME" ]] && { echo "Error: --name is required"; exit 1; }
[[ -z "$ID" ]] && { echo "Error: --id is required"; exit 1; }
[[ -z "$TYPE" ]] && { echo "Error: --type is required"; exit 1; }

# Validate type
if [[ ! -d "${TEMPLATES_DIR}/${TYPE}" ]]; then
  echo "Error: Unknown type '${TYPE}'. Available: researcher, coder, ops, security, utility"
  exit 1
fi

# Validate ID format
if [[ ! "$ID" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Error: ID must be lowercase alphanumeric with hyphens (e.g., data-analyst)"
  exit 1
fi

# Set defaults
AGENT_DIR="${AGENTS_BASE}/${ID}/workspace"
COLOR="${COLOR:-${TYPE_COLORS[$TYPE]}}"
CAPABILITIES="${CAPABILITIES:-${TYPE_CAPABILITIES[$TYPE]}}"
SCOPE="${SCOPE:-${NAME} specialist agent}"

# Default emojis per type
if [[ -z "$EMOJI" ]]; then
  case "$TYPE" in
    researcher) EMOJI="🔬" ;;
    coder) EMOJI="💻" ;;
    ops) EMOJI="⚙️" ;;
    security) EMOJI="🛡️" ;;
    utility) EMOJI="🔧" ;;
  esac
fi

# Check for existing agent
if [[ -d "$AGENT_DIR" ]] && [[ "$FORCE" != true ]]; then
  echo "Error: Agent directory already exists: ${AGENT_DIR}"
  echo "Use --force to overwrite"
  exit 1
fi

echo "═══════════════════════════════════════════"
echo "  Agent Factory v2"
echo "═══════════════════════════════════════════"
echo ""
echo "  Name:         ${EMOJI} ${NAME}"
echo "  ID:           ${ID}"
echo "  Type:         ${TYPE}"
echo "  Color:        ${COLOR}"
echo "  Scope:        ${SCOPE}"
echo "  Skills:       ${SKILLS:-none}"
echo "  Capabilities: ${CAPABILITIES}"
echo "  Directory:    ${AGENT_DIR}"
echo ""

if [[ "$DRY_RUN" == true ]]; then
  echo "[DRY RUN] Would create:"
  echo "  ${AGENT_DIR}/SOUL.md"
  echo "  ${AGENT_DIR}/CLAUDE.md"
  echo "  ${AGENT_DIR}/IDENTITY.md"
  echo "  ${AGENT_DIR}/scratch/"
  echo "  ${AGENT_DIR}/memory/"
  [[ "$NO_REGISTER" != true ]] && echo "  + Register in agent-cards.json"
  exit 0
fi

# Create directory structure
echo "Creating directory structure..."
mkdir -p "${AGENT_DIR}"/{scratch,memory,skills}

# Generate SOUL.md from template
echo "Generating SOUL.md..."
sed \
  -e "s/{{NAME}}/${NAME}/g" \
  -e "s/{{EMOJI}}/${EMOJI}/g" \
  -e "s|{{ACCENT_COLOR}}|${COLOR}|g" \
  -e "s|{{SCOPE}}|${SCOPE}|g" \
  "${TEMPLATES_DIR}/${TYPE}/SOUL.md" > "${AGENT_DIR}/SOUL.md"

# Generate CLAUDE.md from shared template
echo "Generating CLAUDE.md..."
sed \
  -e "s/{{NAME}}/${NAME}/g" \
  -e "s/{{EMOJI}}/${EMOJI}/g" \
  -e "s/{{ID}}/${ID}/g" \
  -e "s|{{SCOPE}}|${SCOPE}|g" \
  "${TEMPLATES_DIR}/CLAUDE.md.template" > "${AGENT_DIR}/CLAUDE.md"

# Generate IDENTITY.md
echo "Generating IDENTITY.md..."
cat > "${AGENT_DIR}/IDENTITY.md" <<EOF
# IDENTITY.md

- **Name:** ${NAME}
- **Emoji:** ${EMOJI}
- **Role:** ${SCOPE}
- **Accent Color:** ${COLOR}
- **Type:** ${TYPE}
- **Created:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

# Copy discord-output-format.md if it exists in main workspace
MAIN_DOF="${AGENTS_BASE}/main/workspace/discord-output-format.md"
if [[ -f "$MAIN_DOF" ]]; then
  echo "Copying discord-output-format.md..."
  cp "$MAIN_DOF" "${AGENT_DIR}/discord-output-format.md"
fi

# Copy USER.md and TOOLS.md references
for f in USER.md TOOLS.md; do
  SRC="${AGENTS_BASE}/main/workspace/${f}"
  if [[ -f "$SRC" ]]; then
    ln -sf "$SRC" "${AGENT_DIR}/${f}" 2>/dev/null || cp "$SRC" "${AGENT_DIR}/${f}"
  fi
done

# Register in agent-cards.json
if [[ "$NO_REGISTER" != true ]] && [[ -f "$AGENT_CARDS" ]]; then
  echo "Registering in agent-cards.json..."

  # Check if agent already registered
  if jq -e ".agents[] | select(.id == \"${ID}\")" "$AGENT_CARDS" >/dev/null 2>&1; then
    echo "  Agent '${ID}' already in agent-cards.json — updating..."
    # Remove existing entry
    jq "(.agents) |= map(select(.id != \"${ID}\"))" "$AGENT_CARDS" > "${AGENT_CARDS}.tmp"
    mv "${AGENT_CARDS}.tmp" "$AGENT_CARDS"
  fi

  # Build capabilities JSON array
  CAPS_JSON=$(echo "$CAPABILITIES" | tr ',' '\n' | jq -R . | jq -s .)

  # Build skills JSON array
  if [[ -n "$SKILLS" ]]; then
    SKILLS_JSON=$(echo "$SKILLS" | tr ',' '\n' | jq -R . | jq -s .)
  else
    SKILLS_JSON="[]"
  fi

  # Add new agent entry
  jq --arg id "$ID" \
     --arg name "${EMOJI} ${NAME}" \
     --argjson caps "$CAPS_JSON" \
     --argjson skills "$SKILLS_JSON" \
     --arg cost "${TYPE_COST[$TYPE]}" \
     --arg scope "$SCOPE" \
     '.agents += [{
       "id": $id,
       "name": $name,
       "capabilities": $caps,
       "skills": $skills,
       "avg_runtime_sec": 120,
       "default_timeout_sec": 300,
       "success_rate": 1.0,
       "fitness": 0.5,
       "cost_tier": $cost,
       "tasks_completed": 0,
       "tasks_total": 0,
       "failure_modes": [],
       "best_for": [$scope],
       "avoid_for": [],
       "infra_available": ["guardrails", "task-watchdog"]
     }]' "$AGENT_CARDS" > "${AGENT_CARDS}.tmp"

  mv "${AGENT_CARDS}.tmp" "$AGENT_CARDS"
  echo "  ✓ Registered"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Agent '${EMOJI} ${NAME}' created!"
echo "═══════════════════════════════════════════"
echo ""
echo "Files created:"
echo "  ${AGENT_DIR}/SOUL.md"
echo "  ${AGENT_DIR}/CLAUDE.md"
echo "  ${AGENT_DIR}/IDENTITY.md"
echo ""
echo "To spawn this agent:"
echo "  sessions_spawn with task for agent '${ID}'"
echo ""
echo "To customize further, edit:"
echo "  ${AGENT_DIR}/SOUL.md"
