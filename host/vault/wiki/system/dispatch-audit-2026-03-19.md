---
title: Dispatch Infrastructure Audit
created: '2026-03-19'
type: knowledge
status: active
confidence: 0.8
source: 'agent:ops'
tags:
  - agents
  - dispatch
  - audit
  - ops
domain: system-ops
summary: >-
  Audit of 7 dispatch scripts: 2 PASS, 3 NEEDS_FIX, 0 STUB. Critical issues:
  broken variable scoping in gap scanner, two competing chain systems, 3 scripts
  not wired to cron.
wiki_id: system/dispatch-audit-2026-03-19
imported_from: vault/System/dispatch-audit-2026-03-19.md
imported_at: '2026-04-04T00:23:57.273Z'
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

### 3. knowledge-gap-scanner.sh — **NEEDS_FIX** (Bug)

**Test output:** Produces valid JSONL. Found gaps across vault. But performance is degraded.

**Critical bug — Line 44-97: Associative array invisible in subshell**

```bash
declare -A EXISTING_FILES        # Line 44 — main shell
# ... populated in while loop ...
find "$VAULT" ... | while IFS= read -r file; do   # Line 56 — SUBSHELL (pipe)
    # Line 97:
    if [[ -z "${EXISTING_FILES[$link]+x}" ]]; then  # ALWAYS TRUE — array is empty in subshell
```

The `find ... | while` pipeline creates a subshell. Bash associative arrays (`declare -A`) are NOT inherited by subshells. So `EXISTING_FILES` is always empty inside the loop, meaning:
- Every `[[wikilink]]` triggers the fallback `find` on line 99
- This is an O(n × m) find operation (n=links, m=vault files)
- The scanner still **works** (fallback is correct), but it's ~100x slower than intended

**Also:** The `declare -A WIKILINK_SOURCES` on line 45 is declared but never used.

**Recommendation (P1):**
Replace the piped `while` with process substitution to keep the main shell:
```bash
while IFS= read -r file; do
    ...
done < <(find "$VAULT" -name "*.md" -type f 2>/dev/null | grep -vE "$SKIP_DIRS")
```

---

### 4. knowledge-loop.sh — **NEEDS_FIX** (Not Wired)

**Analysis:** Well-structured script. Anti-spam deduplication works. Creates properly formatted dispatch tasks.

**Issues:**
- **Not in cron** — `knowledge-loop.sh` is not scheduled anywhere. Not called from dispatch-engine, proactive-task-generator, or any hook.
- **Line 1:** Uses `set -uo pipefail` (missing `e`). This means errors in individual commands won't abort the script. Likely intentional since `grep -rl` returns non-zero when nothing matches, but worth noting.
- **Line 47:** Anti-spam check uses `grep -qF` on a `printf '%b'` output of newline-separated paths. Works but fragile — paths with special characters could false-match.
- **Task priority hardcoded to 3** (line 70) regardless of gap priority. A `low_confidence` gap (priority 1) creates a P3 task — should inherit gap priority.

**Recommendation (P2):**
- Add to cron: `0 */4 * * * flock -n /tmp/knowledge-loop.lock bash ~/bin/knowledge-loop.sh`
- Map gap priority to task priority (1→P2, 2→P3, 3→P4)

---

### 5. dispatch-engine.sh — **PASS**

**Dry-run output:** Clean. Shows queue/active/done/failed counts. Picks next task correctly.

**Strengths:**
- flock-based concurrency control
- Circuit breaker with half-open recovery
- SQLite backend with JSON fallback
- Dependency validation (ido4-inspired)
- Task locking prevents duplicate dispatch
- Checkpoint/partial progress recovery
- Reflexion injection from past learnings
- Stale task sweeping with configurable timeouts
- Completion hooks for pipeline chaining
- 7-day auto-pruning

**Minor issues:**
- **Line ~280:** `dispatch_task` references `$done_file` before it's defined (it's in check_completions scope). The outcome capture call uses it: `"$HOME/bin/dispatch-outcome-capture.sh" "$done_file"`. This is a copy-paste issue — `$done_file` is undefined at that point in dispatch_task. However, this code path (line ~280) is in `check_completions()`, not `dispatch_task()`, so it actually IS in scope. Verified: not a bug.
- dispatch-engine.sh doesn't filter by `status` field — it processes any .json in queue/. This means dispatch-task.sh's `"status": "queued"` and other scripts' `"status": "pending"` both work, but it's inconsistent.

**Recommendation:** Standardize on `"status": "pending"` for queue files. Update dispatch-task.sh line 40.

---

### 6. dispatch-task.sh — **PASS**

**Analysis:** Simple, clean, does one thing well.

**Issue:**
- **Line 40:** Sets `"status": "queued"` while every other script uses `"pending"`. Cosmetic but confusing for debugging.
- No `flock` but not needed — unique task IDs via timestamp+random prevent collisions.

**Recommendation:** Change line 40 from `"queued"` to `"pending"` for consistency.

---

### 7. proactive-task-generator.sh — **NEEDS_FIX** (Not Wired + JSON Safety)

**Analysis:** Comprehensive — 9 work sources, deduplication, good structure.

**Issues:**
- **Pruned from cron** — Comment in crontab explicitly says `proactive-task-generator` was pruned. Not running at all.
- **Lines ~68, ~80, etc.:** Uses heredoc (`cat > ... << EOF`) for JSON construction. Variables like `$desc` and `$context` are interpolated unsafely — any description containing `"`, `\`, or `$` will produce invalid JSON. Other scripts correctly use `jq -n` for this.
- **Line ~38:** Dedup check uses `grep -rl` with first 40 chars of description — fragile, could false-match.
- **Source 3 (line ~80):** References `research-loop-state.json` which may not exist, but `jq -r ... 2>/dev/null` handles it.
- **Source 6 (line ~107):** Parses message harvests with regex — works for simple cases but won't catch structured action items.
- **Source 8 (line ~130):** Checks `.result?` field in done/ tasks, but dispatch-engine stores results in separate files (`result_file` field), not inline.

**Recommendation (P2):**
- Re-add to cron: `0 */2 * * * flock -n /tmp/proactive.lock bash ~/bin/proactive-task-generator.sh`
- Replace all heredoc JSON with `jq -n` construction (same pattern as other scripts)
- Fix Source 8 to read `result_file` instead of `.result?`

---

## Integration Gap Summary

| Gap | Impact | Fix |
|---|---|---|
| dispatch-chain.sh not called from dispatch-engine.sh | chain_next tasks never trigger | Wire into check_completions() |
| Two competing chain systems (chain_next vs pipeline) | Confusion, dead code | Consolidate or document split |
| knowledge-loop.sh not in cron | Vault gaps never auto-fixed | Add cron entry |
| proactive-task-generator.sh pruned from cron | No proactive work generation | Re-add to cron |
| dispatch-task.sh status "queued" vs "pending" | Cosmetic inconsistency | Standardize to "pending" |

## Priority Ranking

1. **P1 — Wire dispatch-chain.sh into dispatch-engine.sh** — Without this, the entire chain system is dead code.
2. **P1 — Fix knowledge-gap-scanner.sh subshell scoping** — Currently ~100x slower than designed due to missed optimization.
3. **P2 — Add knowledge-loop.sh to cron** — Without this, gap detection never triggers remediation.
4. **P2 — Re-add proactive-task-generator.sh to cron** — Or decide it's intentionally disabled and document why.
5. **P2 — Fix heredoc JSON in proactive-task-generator.sh** — JSON injection from special characters in descriptions.
6. **P3 — Standardize status field** — "queued" → "pending" in dispatch-task.sh.
7. **P3 — Add flock to channel-sweep.sh** — Prevent state file corruption.

---

*Related: [[Memory Architecture]], [[Agent Performance Tracking]], [[Dispatch System Design]]*
