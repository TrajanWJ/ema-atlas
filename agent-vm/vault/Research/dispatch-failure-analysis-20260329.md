---
title: "Dispatch Failure Analysis — 2026-03-29"
type: reference
created: 2026-03-29
tags: [dispatch, ops, failures, api-key]
summary: "Analysis and cleanup of 42+ failed dispatch tasks caused by API key expiry (Mar 23-29)"
---

# Dispatch Failure Analysis — 2026-03-29

## Summary

Cleared 27 DB failed tasks + 42 filesystem failed task JSON files + 49 poisoned result files.

## Root Causes

### 1. API Key Invalidation (25 tasks, Mar 23–29)

All signal-sourced tasks failed because Claude returned `"Invalid API key · Fix external API key"` in their result files. The dispatch engine's false-done detection (`grep -qiE "^error:|unknown option|SyntaxError|ENOENT|EPERM|invalid api key|unauthorized"`) correctly caught these and marked them failed.

**Affected task categories:**
- 8 ops tasks: "Disk at 91%. Clean: docker prune, old logs..." (Mar 23–24)
- 17 utility tasks: "Dispatch has N failed tasks. Analyze failure patterns..." (Mar 26–29)

**API key was working before Mar 23 and is working again as of Mar 29** (this task ran successfully).

### 2. Self-Referential Loop

`signal-to-queue.sh` (line 52–53) fires when `ls $STATE_DIR/failed/*.json | wc -l > 10`, queuing:
```
"Dispatch has $failed_count failed tasks. Analyze failure patterns and clear resolved ones."
```

Because the API key was broken, each attempt itself failed → incrementing the count → triggering more tasks → more failures. **The loop generated a new task every 3 hours.**

### 3. Stale TUI Sessions (2 tasks, Mar 20)

- `gw-R2-01`: Wikilink Batch Fix — timed out, no output
- `gw-R2-02`: ClawHub Skill Scan — timed out, no output

Both from `righthand` agent via TUI source on 2026-03-20. Sessions are gone.

## Actions Taken

1. **DB**: Updated all 27 `failed` tasks to `cancelled` with note: "cleared: [original error] — bulk cleared 2026-03-29 after analysis"
2. **FS**: Moved 42 failed/*.json files to `dispatch/archive/cleared-20260329/`
3. **Results**: Moved 49 "Invalid API key" result files to `dispatch/archive/cleared-20260329/results/`
4. **Trigger silenced**: `failed/` dir is now empty → `signal-to-queue.sh` threshold check will no longer fire

## Disk Issue Context

The original 8 ops tasks were triggered because disk was at 91%. Current disk: **77%** (66G/87G used). The disk was cleaned between Mar 24 and today — those tasks no longer need re-running.

## Recommendations

1. **API key monitoring**: Add a cron that checks API key validity independently of task execution — avoid triggering failed cascades on auth errors.
2. **Self-loop guard**: `signal-to-queue.sh` should check if an identical task is already queued/active before adding another. Currently it deduplicates by title check — verify that's working.
3. **Result file error detection**: The `grep -qiE "invalid api key"` in `dispatch-engine.sh:711` correctly catches auth failures — no change needed.

## Links

- [[dispatch]] — main dispatch system
- [[ops]] — operations agent
