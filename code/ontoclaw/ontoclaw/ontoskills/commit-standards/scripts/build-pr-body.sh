#!/usr/bin/env bash
set -euo pipefail

# build-pr-body.sh — Generate a PR body from branch commit history
#
# Usage:
#   build-pr-body.sh [base-branch] [intent]
#
# Arguments:
#   base-branch  — branch to diff against (default: main, falls back to master)
#   intent       — human-provided intent string (prompted if omitted and interactive)
#
# Output: PR body in markdown to stdout
#
# Example:
#   build-pr-body.sh main "Fix OAuth token refresh race condition"
#   build-pr-body.sh  # auto-detects base, prompts for intent if interactive

# --- Resolve base branch ---
BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  if git rev-parse --verify main &>/dev/null; then
    BASE="main"
  elif git rev-parse --verify master &>/dev/null; then
    BASE="master"
  else
    echo "Error: cannot determine base branch. Pass it as first argument." >&2
    exit 1
  fi
fi

CURRENT=$(git branch --show-current 2>/dev/null || echo "HEAD")

# Verify we have commits ahead of base
COMMIT_COUNT=$(git rev-list --count "${BASE}..HEAD" 2>/dev/null || echo 0)
if [[ "$COMMIT_COUNT" -eq 0 ]]; then
  echo "Error: no commits ahead of ${BASE}. Nothing to build a PR for." >&2
  exit 1
fi

# --- Intent ---
INTENT="${2:-}"
if [[ -z "$INTENT" ]] && [[ -t 0 ]]; then
  echo "Intent (what this PR does and WHY — in your words):" >&2
  read -r INTENT
fi
if [[ -z "$INTENT" ]]; then
  INTENT="<TODO: describe the intent of this PR>"
fi

# --- Gather commits ---
COMMITS=$(git log --reverse --format="- %s" "${BASE}..HEAD")

# --- Categorize file changes ---
CHANGED_FILES=$(git diff --name-only "${BASE}..HEAD" 2>/dev/null | sort)

categorize_files() {
  local src_files="" test_files="" config_files="" doc_files="" ci_files="" other_files=""

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    case "$f" in
      *test*|*spec*|*__tests__*|*.test.*|*.spec.*)
        test_files+="  - ${f}"$'\n' ;;
      *.yml|*.yaml|*.toml|*.ini|*.env*|*config*|*Dockerfile*|docker-compose*|*.conf|*.cfg)
        config_files+="  - ${f}"$'\n' ;;
      *.md|*.txt|*.rst|docs/*|doc/*)
        doc_files+="  - ${f}"$'\n' ;;
      .github/*|.circleci/*|.gitlab-ci*|Jenkinsfile|*.pipeline*)
        ci_files+="  - ${f}"$'\n' ;;
      *.js|*.ts|*.py|*.go|*.rs|*.rb|*.java|*.sh|*.c|*.cpp|*.h|*.hpp|*.cs|*.swift|*.kt)
        src_files+="  - ${f}"$'\n' ;;
      *)
        other_files+="  - ${f}"$'\n' ;;
    esac
  done <<< "$CHANGED_FILES"

  [[ -n "$src_files" ]] && echo "- **Source:**"$'\n'"${src_files}"
  [[ -n "$test_files" ]] && echo "- **Tests:**"$'\n'"${test_files}"
  [[ -n "$config_files" ]] && echo "- **Config:**"$'\n'"${config_files}"
  [[ -n "$doc_files" ]] && echo "- **Docs:**"$'\n'"${doc_files}"
  [[ -n "$ci_files" ]] && echo "- **CI/CD:**"$'\n'"${ci_files}"
  [[ -n "$other_files" ]] && echo "- **Other:**"$'\n'"${other_files}"
  return 0
}

FILE_CATEGORIES=$(categorize_files)

# --- Detect tests ---
TEST_FILES=$(echo "$CHANGED_FILES" | grep -iE '(test|spec|__tests__)' || true)
if [[ -n "$TEST_FILES" ]]; then
  TEST_VERDICT="✅ Tests added/modified in this PR"
else
  TEST_VERDICT="⚠️  No test files changed — verify test coverage"
fi

# --- Detect security/config changes ---
SECURITY_FILES=$(echo "$CHANGED_FILES" | grep -iE '(\.env|config|secret|key|auth|token|password|credential|Dockerfile|docker-compose|\.yml|\.yaml|\.toml|\.conf|\.cfg|permissions|\.htaccess|nginx|firewall)' || true)
if [[ -n "$SECURITY_FILES" ]]; then
  SECURITY_SECTION="⚠️  **Review required** — config/security-relevant files changed:"
  while IFS= read -r sf; do
    [[ -n "$sf" ]] && SECURITY_SECTION+=$'\n'"- \`${sf}\`"
  done <<< "$SECURITY_FILES"
else
  SECURITY_SECTION="No security-relevant changes detected."
fi

# --- Diff stats ---
DIFF_STAT=$(git diff --stat "${BASE}..HEAD" 2>/dev/null | tail -1)

# --- Build output ---
cat <<PRBODY
## Intent

> ${INTENT}

## Changes

${COMMITS}

### Files Changed (${COMMIT_COUNT} commits, ${DIFF_STAT})

${FILE_CATEGORIES}

## Testing

${TEST_VERDICT}

- <TODO: paste exact test commands and results>

## Risks

- <TODO: what could break, or "None — <justification>">

## Evidence

- <TODO: links to test output, logs, screenshots>

## Security & Config

${SECURITY_SECTION}
PRBODY
