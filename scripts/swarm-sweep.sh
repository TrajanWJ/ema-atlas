#!/usr/bin/env bash
# swarm-sweep — read-only swarm health check.
#
# Six diagnostics:
#   1. pid files vs live processes (.ema-dev/pids/*.pid)
#   2. expected dev ports (49555 daemon, 5173 web) — listener present?
#   3. git branches: merged vs unmerged vs stale (older than N days without merge)
#   4. placeholder writer modules under apps/daemon/src/ema_*/*.gleam (<= 10 lines)
#   5. every orchestrator prompt referenced in ORCHESTRATOR-INDEX.md exists on disk
#   6. ledger-check.sh passes (every canonical prompt references STATUS.md)
#
# Read-only by contract (per WORKSPACE-HYGIENE collision rules). Does not
# delete pids, kill processes, or rewrite git history. Safe to run as a cron.
#
# Exit codes:
#   0  clean — nothing worth alerting on
#   1  drift detected in at least one check
#   2  setup failure (missing ROOT dirs, etc)

set -euo pipefail

ROOT="/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24"
WORKSPACE="/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING"
PID_DIR="$ROOT/.ema-dev/pids"
DAEMON_PORT=49555
WEB_PORT=5173
STALE_BRANCH_DAYS=7
PROMPTS_DIR="$WORKSPACE/doctrine/planning/orchestrator-prompts"
INDEX_FILE="$PROMPTS_DIR/ORCHESTRATOR-INDEX.md"
LEDGER_CHECK="$ROOT/scripts/ledger-check.sh"

JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    -h|--help)
      cat <<EOF
swarm-sweep.sh — read-only multi-check of swarm + workspace health.

Six checks:
  1. pid files vs live processes
  2. dev ports (49555, 5173) listeners
  3. git branches — merged / unmerged / stale (> ${STALE_BRANCH_DAYS}d)
  4. placeholder writer modules (<=10 lines each)
  5. ORCHESTRATOR-INDEX.md references resolve to files on disk
  6. ledger-check.sh passes

Usage:
  $0           human output
  $0 --json    JSON output for ingestion
  $0 -h       this help

Exits 0 clean, 1 on drift, 2 on setup failure. Read-only.
EOF
      exit 0
      ;;
    *)
      echo "swarm-sweep: unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

if [[ ! -d "$ROOT" ]]; then
  echo "swarm-sweep: ROOT not found at $ROOT" >&2
  exit 2
fi

# Accumulators
stale_pids=()           # "name:pid"
live_pids=()            # "name:pid"
port_listeners=()       # "port:pid" or "port:none"
merged_branches=()
unmerged_branches=()
stale_branches=()       # "branch:age-days"
git_available=0
placeholder_modules=()  # "path:lines"
missing_index_targets=()
index_targets_checked=0
ledger_rc=0
ledger_output=""

# --- 1. pids ------------------------------------------------------------
if [[ -d "$PID_DIR" ]]; then
  for pf in "$PID_DIR"/*.pid; do
    [[ -f "$pf" ]] || continue
    name="$(basename "$pf" .pid)"
    pid="$(tr -d '[:space:]' <"$pf" 2>/dev/null || true)"
    if [[ -z "$pid" ]]; then
      stale_pids+=("$name:empty")
      continue
    fi
    if kill -0 "$pid" 2>/dev/null; then
      live_pids+=("$name:$pid")
    else
      stale_pids+=("$name:$pid")
    fi
  done
fi

# --- 2. ports -----------------------------------------------------------
for port in "$DAEMON_PORT" "$WEB_PORT"; do
  pids_on_port="$(lsof -t -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | tr '\n' ',' | sed 's/,$//')"
  if [[ -n "$pids_on_port" ]]; then
    port_listeners+=("$port:$pids_on_port")
  else
    port_listeners+=("$port:none")
  fi
done

# --- 3. git -------------------------------------------------------------
if command -v git >/dev/null 2>&1 && git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  git_available=1
  # default branch: main, falling back to current HEAD if no main.
  default_branch="main"
  if ! git -C "$ROOT" show-ref --verify --quiet "refs/heads/$default_branch"; then
    default_branch="$(git -C "$ROOT" symbolic-ref --short HEAD 2>/dev/null || echo HEAD)"
  fi
  while IFS= read -r b; do
    b="$(echo "$b" | sed 's/^[* ] *//' | sed 's/[[:space:]]*$//')"
    [[ -z "$b" || "$b" == "$default_branch" ]] && continue
    merged_branches+=("$b")
  done < <(git -C "$ROOT" branch --merged "$default_branch" 2>/dev/null || true)
  while IFS= read -r b; do
    b="$(echo "$b" | sed 's/^[* ] *//' | sed 's/[[:space:]]*$//')"
    [[ -z "$b" || "$b" == "$default_branch" ]] && continue
    unmerged_branches+=("$b")
    # age
    last_commit_ts="$(git -C "$ROOT" log -1 --format=%ct "$b" 2>/dev/null || echo 0)"
    if [[ "$last_commit_ts" -gt 0 ]]; then
      now="$(date +%s)"
      age_days=$(( (now - last_commit_ts) / 86400 ))
      if [[ "$age_days" -ge "$STALE_BRANCH_DAYS" ]]; then
        stale_branches+=("$b:$age_days")
      fi
    fi
  done < <(git -C "$ROOT" branch --no-merged "$default_branch" 2>/dev/null || true)
fi

# --- 4. placeholder writer modules -------------------------------------
if [[ -d "$ROOT/apps/daemon/src" ]]; then
  while IFS= read -r gfile; do
    lines=$(wc -l <"$gfile" | tr -d '[:space:]')
    if [[ "$lines" -le 10 ]]; then
      rel="${gfile#$ROOT/}"
      placeholder_modules+=("$rel:$lines")
    fi
  done < <(find "$ROOT/apps/daemon/src" -type f -name '*.gleam' 2>/dev/null)
fi

# --- 5. index references -----------------------------------------------
if [[ -f "$INDEX_FILE" ]]; then
  while IFS= read -r ref; do
    index_targets_checked=$((index_targets_checked + 1))
    if [[ ! -f "$PROMPTS_DIR/$ref" && ! -f "$PROMPTS_DIR/archive/2026-04-24/$ref" ]]; then
      missing_index_targets+=("$ref")
    fi
  done < <(grep -oE '`[A-Z][A-Z0-9-]*\.md`' "$INDEX_FILE" | tr -d '`' | sort -u)
fi

# --- 6. ledger-check ----------------------------------------------------
if [[ -x "$LEDGER_CHECK" ]]; then
  set +e
  ledger_output="$("$LEDGER_CHECK" --json 2>&1)"
  ledger_rc=$?
  set -e
else
  ledger_output='{"ok": null, "note": "ledger-check.sh not executable or missing"}'
  ledger_rc=2
fi

# --- tally --------------------------------------------------------------
drift=0
[[ ${#stale_pids[@]} -gt 0 ]] && drift=1
[[ ${#stale_branches[@]} -gt 0 ]] && drift=1
[[ ${#missing_index_targets[@]} -gt 0 ]] && drift=1
[[ "$ledger_rc" -ne 0 ]] && drift=1

# --- emit ---------------------------------------------------------------
if [[ "$JSON" -eq 1 ]]; then
  emit_array() {
    local name="$1"; shift
    printf '  "%s": [' "$name"
    local first=1
    for item in "$@"; do
      [[ -z "$item" ]] && continue
      if [[ $first -eq 1 ]]; then first=0; printf '"%s"' "$item"; else printf ', "%s"' "$item"; fi
    done
    printf ']'
  }
  printf '{\n'
  printf '  "ok": %s,\n' "$( [[ $drift -eq 0 ]] && echo true || echo false )"
  printf '  "timestamp": "%s",\n' "$(date -u +%FT%TZ)"
  emit_array "stale_pids" "${stale_pids[@]:-}"; printf ',\n'
  emit_array "live_pids" "${live_pids[@]:-}"; printf ',\n'
  emit_array "port_listeners" "${port_listeners[@]:-}"; printf ',\n'
  printf '  "git_available": %s,\n' "$( [[ $git_available -eq 1 ]] && echo true || echo false )"
  emit_array "merged_branches" "${merged_branches[@]:-}"; printf ',\n'
  emit_array "unmerged_branches" "${unmerged_branches[@]:-}"; printf ',\n'
  emit_array "stale_branches" "${stale_branches[@]:-}"; printf ',\n'
  emit_array "placeholder_modules" "${placeholder_modules[@]:-}"; printf ',\n'
  emit_array "missing_index_targets" "${missing_index_targets[@]:-}"; printf ',\n'
  printf '  "ledger_check_rc": %d,\n' "$ledger_rc"
  printf '  "ledger_check_output": %s\n' "$ledger_output"
  printf '}\n'
else
  echo "swarm-sweep $(date -u +%FT%TZ)"
  echo ""
  echo "[1] pid files"
  if [[ ${#live_pids[@]} -eq 0 && ${#stale_pids[@]} -eq 0 ]]; then
    echo "    no pid files."
  fi
  for p in "${live_pids[@]:-}"; do [[ -n "$p" ]] && echo "    live:  $p"; done
  for p in "${stale_pids[@]:-}"; do [[ -n "$p" ]] && echo "    stale: $p"; done
  echo ""
  echo "[2] ports"
  for p in "${port_listeners[@]:-}"; do [[ -n "$p" ]] && echo "    $p"; done
  echo ""
  echo "[3] git branches"
  if [[ $git_available -eq 0 ]]; then
    echo "    git not available or no repo — skipped."
  else
    echo "    merged:   ${#merged_branches[@]}"
    echo "    unmerged: ${#unmerged_branches[@]}"
    if [[ ${#stale_branches[@]} -gt 0 ]]; then
      echo "    stale (> ${STALE_BRANCH_DAYS}d unmerged):"
      for b in "${stale_branches[@]}"; do echo "      - $b"; done
    fi
  fi
  echo ""
  echo "[4] placeholder writer modules (<=10 lines)"
  if [[ ${#placeholder_modules[@]} -eq 0 ]]; then
    echo "    none."
  else
    for m in "${placeholder_modules[@]}"; do echo "    - $m"; done
  fi
  echo ""
  echo "[5] ORCHESTRATOR-INDEX.md references"
  echo "    checked: $index_targets_checked"
  if [[ ${#missing_index_targets[@]} -gt 0 ]]; then
    echo "    missing on disk:"
    for t in "${missing_index_targets[@]}"; do echo "      - $t"; done
  else
    echo "    all resolve."
  fi
  echo ""
  echo "[6] ledger-check"
  echo "    rc=$ledger_rc"
  echo "$ledger_output" | sed 's/^/    /'
  echo ""
  if [[ "$drift" -eq 0 ]]; then
    echo "swarm-sweep: OK — no drift detected."
  else
    echo "swarm-sweep: DRIFT detected (see checks above)."
  fi
fi

if [[ "$drift" -gt 0 ]]; then
  exit 1
fi
exit 0
