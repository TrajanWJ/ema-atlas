#!/usr/bin/env bash
set -euo pipefail

# format-commit.sh — Generate a properly formatted commit message
#
# Usage:
#   format-commit.sh <type> <scope> <description> [why] [tests]
#   format-commit.sh --interactive
#   echo "description" | format-commit.sh --auto <type> <scope>
#
# Examples:
#   format-commit.sh fix auth "refresh token before expiry check" \
#     "token refresh was racing with expiry validation" \
#     "npm test -- --grep oauth → 14/14 passed"
#
#   format-commit.sh --interactive
#
# Output: prints the formatted commit message to stdout.
# To commit directly: format-commit.sh ... | git commit -F -

VALID_TYPES="feat fix chore refactor docs test perf ci"

usage() {
  cat <<'USAGE'
Usage:
  format-commit.sh <type> <scope> <description> [why] [tests]
  format-commit.sh --interactive

Types: feat fix chore refactor docs test perf ci
USAGE
  exit 1
}

validate_type() {
  local t="$1"
  for valid in $VALID_TYPES; do
    [[ "$t" == "$valid" ]] && return 0
  done
  echo "Error: invalid type '$t'. Must be one of: $VALID_TYPES" >&2
  exit 1
}

# Truncate subject to 72 chars
truncate_subject() {
  local subj="$1"
  if [[ ${#subj} -gt 72 ]]; then
    echo "${subj:0:69}..." 
  else
    echo "$subj"
  fi
}

interactive_mode() {
  echo "=== Commit Message Formatter ===" >&2
  echo "" >&2

  echo "Type (feat/fix/chore/refactor/docs/test/perf/ci):" >&2
  read -r type
  validate_type "$type"

  echo "Scope (module/area affected, e.g. auth, api, config):" >&2
  read -r scope

  echo "Description (imperative mood, e.g. 'add token refresh retry'):" >&2
  read -r description

  echo "Why? (motivation — one line, or multiple lines ending with empty line):" >&2
  why_lines=()
  while IFS= read -r line; do
    [[ -z "$line" ]] && break
    why_lines+=("$line")
  done

  echo "Tests run? (command + result, or 'n/a — reason'):" >&2
  read -r tests

  # Build why section
  local why_section=""
  for wl in "${why_lines[@]}"; do
    why_section+="- ${wl}"$'\n'
  done

  local subject
  subject=$(truncate_subject "${type}(${scope}): ${description}")

  cat <<MSG
${subject}

Why:
${why_section}
Tests: ${tests}
MSG
}

# Direct mode
direct_mode() {
  local type="$1"
  local scope="$2"
  local description="$3"
  local why="${4:-}"
  local tests="${5:-}"

  validate_type "$type"

  local subject
  subject=$(truncate_subject "${type}(${scope}): ${description}")

  # Build why — split on semicolons if multiple reasons provided
  local why_section=""
  if [[ -n "$why" ]]; then
    IFS=';' read -ra why_parts <<< "$why"
    for part in "${why_parts[@]}"; do
      part=$(echo "$part" | sed 's/^[[:space:]]*//')
      why_section+="- ${part}"$'\n'
    done
  else
    why_section="- <TODO: explain WHY this change is needed>"$'\n'
  fi

  # Tests
  if [[ -z "$tests" ]]; then
    tests="<TODO: paste exact test command + result>"
  fi

  cat <<MSG
${subject}

Why:
${why_section}
Tests: ${tests}
MSG
}

# --- Main ---

if [[ $# -eq 0 ]]; then
  usage
fi

if [[ "$1" == "--interactive" ]]; then
  interactive_mode
elif [[ "$1" == "--auto" ]]; then
  # Pipe mode: reads description from stdin
  shift
  [[ $# -lt 2 ]] && usage
  description=$(cat)
  direct_mode "$1" "$2" "$description" "${3:-}" "${4:-}"
else
  [[ $# -lt 3 ]] && usage
  direct_mode "$@"
fi
