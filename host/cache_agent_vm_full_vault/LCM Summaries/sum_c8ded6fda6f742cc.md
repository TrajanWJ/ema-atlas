# LCM Summary sum_c8ded6fda6f742cc

Created: 2026-03-24 05:07:00
Kind: leaf
Depth: 0
Conversation: 1077
Tokens: 1215
Descendants: 0
Earliest: 2026-03-24T03:57:56.000Z
Latest: 2026-03-24T04:49:49.000Z

## Content

[2026-03-24 03:57 UTC]
---
title: "Dispatch Infrastructure Audit"
created: 2026-03-19
type: system
status: active
confidence: 0.80
source: agent:ops
tags: [agents, dispatch, audit, ops]
domain: system-ops
summary: "Audit of 7 dispatch scripts: 2 PASS, 3 NEEDS_FIX, 0 STUB. Critical issues: broken variable scoping in gap scanner, two competing chain systems, 3 scripts not wired to cron."
---

# Dispatch Infrastructure Audit — 2026-03-19

## Executive Summary

| Script | Verdict | Critical Issues |
|---|---|---|
| channel-sweep.sh | **PASS** | Minor: no flock |
| dispatch-chain.sh | **NEEDS_FIX** | Not wired to anything — dead code |
| knowledge-gap-scanner.sh | **NEEDS_FIX** | Subshell variable scoping bug (associative array invisible in pipeline) |
| knowledge-loop.sh | **NEEDS_FIX** | Not in cron, not called from anywhere |
| dispatch-engine.sh | **PASS** | Mature, well-structured, minor status mismatch |
| dispatch-task.sh | **PASS** | Works, minor status value inconsistency |
| proactive-task-generator.sh | **NEEDS_FIX** | Pruned from cron, heredoc JSON injection risk |

**Overall:** Core engine (dispatch-engine.sh) is solid. The new scripts (built today) are well-written but have integration gaps — they're not wired into cron or the completion pipeline. Two competing chain mechanisms exist.

---

## Per-Script Details

### 1. channel-sweep.sh — **PASS**

**Dry-run output:** Runs clean. Swept 3 channels, processed config, updated state.

**Strengths:**
- Dual-mode design (CLI + stdin) is pragmatic given OpenClaw CLI limitations
- Intent detection covers major agent routing patterns
- Sweep state with processed_ids prevents duplicate processing
- State trimming (keep last 500 IDs) prevents unbounded growth

**Issues:**
- **No flock** — If two sweeps run simultaneously, sweep-state.json could be corrupted by concurrent `jq ... > tmp && mv` writes. Low risk if only called from heartbeat, but still a gap.
- **Line ~69:** `process_messages` iterates via `seq 0 $((N-1))` and calls `jq ".[$i]"` per message — O(n²) jq invocations. Fine for 10 messages, slow for 100+.

**Recommendation:** Add `flock` around state file writes. Consider `jq -c '.[]'` iteration pattern for performance.

---

### 2. dispatch-chain.sh — **NEEDS_FIX** (Integration Gap)

**Test output:** `scan` command works — found 0 unchained tasks (correct for current state).

**Core problem:** This script is **not called from anywhere**.

- `dispatch-engine.sh` does NOT call `dispatch-chain.sh scan` after task completion
- `dispatch-engine.sh` does NOT call `dispatch-chain.sh check` on completed tasks
- `dispatch-completion-hook.sh` uses a **different chain mechanism** (`pipeline_next_stage` / `pipeline_id`) that is completely separate from dispatch-chain.sh's `chain_next` field
- No cron entry for periodic `scan`

**Result:** Two competing chain systems exist:
1. `dispatch-chain.sh` — uses `chain_next` field, nested JSON chains
2. `dispatch-completion-hook.sh` — uses `pipeline_id` + `pipeline_next_stage`, pipeline directory

Neither references the other. Tasks created with `dispatch-chain.sh create --chain ...` will have `chain_next` fields that **no one ever reads**.

**Recommendation (P1):**
- Add to `dispatch-engine.sh` check_completions(), after moving task to done/:
  ```bash
  # Chain check
  if [[ -x "$HOME/bin/dispatch-chain.sh" ]]; then
      "$HOME/bin/dispatch-chain.sh" check "$done_file" 2>> "$LOG_FILE" || true
  fi
  ```
- OR: Run `dispatch-chain.sh scan` as a cron job every 10 minutes
- Long-term: consolidate the two chain mechanisms

---

[2026-03-24 03:57 UTC]


[2026-03-24 03:57 UTC]
#!/usr/bin/env bash
# dispatch-engine.sh — Continuous work loop. Runs every 10 minutes via cron.
# Reads ~/dispatch/queue/, spawns agents, tracks completion.
#
# Usage:
#   dispatch-engine.sh              # Normal dispatch cycle
#   dispatch-engine.sh --status     # Show queue/active/done counts
#   dispatch-engine.sh --dry-run    # Show what would happen without doing it

set -euo pipefail

# Ensure API key is available when running from cron (cron has minimal env)
if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
    # Try loading from .env files
    for envfile in "$HOME/.dispatch-env" "$HOME/.env" "$HOME/.openclaw/.env" "$HOME/.profile"; do
        if [[ -f "$envfile" ]]; then
            # shellcheck disable=SC1090
            set +u
            source "$envfile" 2>/dev/null || true
            set -u
            [[ -n "${ANTHROPIC_API_KEY:-}" ]] && break
        fi
    done
fi

# Last resort: extract live key directly from openclaw.json (oauth-guardian keeps it fresh)
if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
    ANTHROPIC_API_KEY=$(python3 -c "import json; print(json.load(open('$HOME/.openclaw/openclaw.json'))['models']['providers']['anthropic']['apiKey'])
[LCM fallback summary; truncated for context management]
