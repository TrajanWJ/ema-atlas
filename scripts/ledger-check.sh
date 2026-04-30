#!/usr/bin/env bash
# ledger-check — every canonical orchestrator prompt must reference STATUS.md.
#
# Scans `doctrine/planning/orchestrator-prompts/*.md` at depth 1 (skips archive/).
# Excludes ORCHESTRATOR-INDEX.md, HANDOFF-*.md, and redirect stubs (files whose
# first line starts with "This file has been superseded.").
#
# Exit codes:
#   0  every canonical prompt references docs/orchestration/STATUS.md.
#   1  at least one canonical prompt is missing the reference.
#   2  setup failure (prompts dir missing, bad arguments).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
DESKTOP_ROOT="$(cd "$ROOT/../.." && pwd -P)"
PROMPTS_DIR="${EMA_PROMPTS_DIR:-$DESKTOP_ROOT/Projects/EMA/atlas/content/swarm/orchestrator-prompts}"
STATUS_REF="docs/orchestration/STATUS.md"

JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    -h|--help)
      cat <<EOF
ledger-check.sh — assert every canonical orchestrator prompt cites STATUS.md.

Usage:
  $0           human output
  $0 --json    JSON output for CI / swarm-sweep ingestion
  $0 -h       this help

Exits 0 clean, 1 on drift, 2 on setup failure.
EOF
      exit 0
      ;;
    *)
      echo "ledger-check: unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

missing=()
checked=0

if [[ -d "$PROMPTS_DIR" ]]; then
  for f in "$PROMPTS_DIR"/*.md; do
    [[ -f "$f" ]] || continue
    name="$(basename "$f")"
    if [[ "$name" == "ORCHESTRATOR-INDEX.md" ]]; then continue; fi
    if [[ "$name" == HANDOFF-* ]]; then continue; fi
    if head -n 1 "$f" | grep -q "has been superseded"; then continue; fi
    checked=$((checked + 1))
    if ! grep -q "$STATUS_REF" "$f"; then
      missing+=("$name")
    fi
  done
fi

if [[ "$JSON" -eq 1 ]]; then
  printf '{\n'
  printf '  "ok": %s,\n' "$( [[ ${#missing[@]} -eq 0 ]] && echo true || echo false )"
  printf '  "checked": %d,\n' "$checked"
  printf '  "missing_reference": ['
  first=1
  for m in "${missing[@]:-}"; do
    [[ -z "$m" ]] && continue
    if [[ $first -eq 1 ]]; then first=0; printf '"%s"' "$m"; else printf ', "%s"' "$m"; fi
  done
  printf ']\n}\n'
else
  if [[ ! -d "$PROMPTS_DIR" ]]; then
    echo "ledger-check: OK — no canonical prompts directory found at $PROMPTS_DIR; checked 0 prompt(s)."
  elif [[ ${#missing[@]} -eq 0 ]]; then
    echo "ledger-check: OK — $checked canonical prompt(s) reference $STATUS_REF."
  else
    echo "ledger-check: FAIL — canonical prompt(s) missing reference to $STATUS_REF:"
    for m in "${missing[@]}"; do echo "  - $m"; done
    echo ""
    echo "Add a '## Ledger anchor' section citing $STATUS_REF to each, or retitle/remove the file."
  fi
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  exit 1
fi
exit 0
