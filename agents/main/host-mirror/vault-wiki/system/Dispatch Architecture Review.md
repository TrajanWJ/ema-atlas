---
title: Dispatch Architecture Review
type: knowledge
domain: agent-architecture
summary: >-
  Comprehensive review of dispatch infrastructure with 5 prioritized
  improvements and bug fixes
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: 'agent:dispatch-optimizer'
created: '2026-03-18'
updated: '2026-03-18'
status: active
tags:
  - dispatch
  - architecture
  - review
  - performance
aliases:
  - dispatch review
  - dispatch analysis
wiki_id: system/Dispatch_Architecture_Review
imported_from: vault/System/Dispatch Architecture Review.md
imported_at: '2026-04-04T00:23:57.224Z'
---

# Dispatch Architecture Review

## Current State Assessment

The dispatch system has **two parallel subsystems** that coexist but don't fully integrate:

### System 1: dispatch-engine.sh (Cron-Driven)
- **Mechanism:** File-based queue (`~/dispatch/{queue,active,done,failed}/`), spawns Claude Code `--print` processes
- **Frequency:** Runs **every 1 minute** via cron (config says 10min, cron says `*/1`)
- **Capacity:** MAX_ACTIVE=6 (dashboard hardcodes display to 3 — inconsistent)
- **Today's stats:** 21 completed, 0 failed (currently), 18 total failures earlier, 40 dispatches
- **Circuit breaker:** Functional — triggered for researcher at 3 failures, reset after success

### System 2: dispatch.sh (Structured V3 — DAG-based)
- **Mechanism:** task-queue.sh + dag-resolve.sh, supports dependencies and wave planning
- **Storage:** `/tmp/task-queue/` (volatile — lost on reboot)
- **Integration:** Not connected to dispatch-engine.sh's cron loop. Used for structured multi-step workflows.

### System 3: Direct sessions_spawn (Right Hand)
- **Mechanism:** Right Hand spawns subagents directly via OpenClaw's sessions_spawn
- **No file artifacts** — bypasses dispatch-engine entirely
- **Used for:** urgent/interactive tasks, P0/P1 direct instructions

### Actual Performance (from logs)
- **Success rate after stabilization:** ~100% (last 15+ tasks all succeeded)
- **Early failure pattern:** Exit code 127 (command not found) — Claude Code binary wasn't in cron's PATH
- **Circuit breaker triggered once** (researcher, 4 failures) — correctly recovered via half-open
- **Completion hooks:** Failing silently on ~30% of completions (non-fatal but pipeline chaining breaks)
- **Average throughput:** ~3-4 tasks per hour when queue is active

## Bugs Found

### 🔴 BUG 1: Duplicate Log Lines (Every Line Written Twice)
Every log entry appears twice. The `log()` function uses `tee -a` which writes once, but the cron output redirect (`>> /dev/null`) shouldn't cause this. Most likely cause: **two cron entries** or the script is being invoked twice per cycle. The duplicate `---Dispatch cycle start---` lines confirm this. The cron runs `*/1 * * * *` — check if there's a second cron or systemd timer also triggering it.

### 🟡 BUG 2: Dashboard MAX_ACTIVE Mismatch
`dispatch-engine.sh` sets `MAX_ACTIVE=6` but `dispatch-dashboard.sh` hardcodes `Active: $a_count / 3` in both display and Discord post. Should read from a shared config or the engine script.

### 🟡 BUG 3: Exit Code 127 Treated as Real Failure
The engine spawns Claude Code with `exec 200>&-` and `disown`. When `wait` can't find the PID, it returns 127 — not a real failure. The fix at line ~175 (`if [[ $exit_code -eq 127 ]]; then exit_code=0; fi`) exists but the early failures (03:30-04:04) suggest it was added mid-session or the fix wasn't effective because the process genuinely failed (PATH issue in cron env).

### 🟡 BUG 4: dispatch.sh V3 Uses /tmp (Volatile Storage)
`task-queue.sh` stores everything in `/tmp/task-queue/`. A reboot wipes all tasks, DAG state, and DLQ. Should use `~/dispatch/v3/` or similar persistent path.

### 🟢 BUG 5: Completion Hook Failures
`dispatch-completion-hook.sh` fails when the task has no `pipeline_id` field — but this is handled with an early exit. The real failures are when `$PFILE` (pipeline JSON) doesn't exist for tasks that DO have a pipeline_id. This means pipelines created by the research loop aren't always writing their pipeline manifest files.

### 🟢 BUG 6: Cron Frequency vs Documentation
AGENTS.md says "runs every 10 minutes" — cron is `*/1 * * * *` (every minute). The 1-minute frequency is better for responsiveness but burns CPU doing nothing 95% of the time. Should either update docs or change to `*/2` or `*/5`.

## 5 Improvements (Prioritized by Impact)

### 1. Unify the Two Queue Systems (HIGH IMPACT)
**Problem:** dispatch-engine.sh and dispatch.sh V3 are parallel, incompatible systems. Engine uses `~/dispatch/queue/`, V3 uses `/tmp/task-queue/`. No shared state.

**Fix:** Make dispatch-engine.sh consume tasks from BOTH sources. Or migrate fully to V3's DAG-based system and have the engine call `dispatch.sh wave` to determine what to run next.

**Why first:** Eliminates the "which system do I use?" confusion and enables dependency-aware scheduling for the cron-driven path.

### 2. Fix the Dual Execution / Duplicate Logging (HIGH IMPACT)
**Problem:** Every dispatch cycle runs twice, doubling log noise and potentially causing race conditions on task pickup (two cycles could pick the same task before it's moved to active/).

**Fix:** Audit crontab for duplicate entries. Add `flock` at script entry (already present but may not be working with the minute-frequency). Consider using a PID file with staleness check instead of flock.

**Why second:** Silent resource waste and potential race condition on concurrent task pickup.

### 3. Smarter Cron Frequency (MEDIUM IMPACT)
**Problem:** Running every 1 minute with empty queue = 1,440 idle cycles/day. Each cycle does filesystem scans.

**Fix:** Switch to event-driven: dispatch-task.sh and sessions_spawn completions trigger the engine directly. Keep cron as a fallback at `*/5` for cleanup/stale-sweep only. Alternative: use inotifywait on the queue directory.

**Why third:** Reduces system load and makes dispatch near-instant for new tasks.

### 4. Persistent V3 Storage + Reboot Resilience (MEDIUM IMPACT)
**Problem:** V3's task-queue.sh stores in `/tmp/` — reboot loses everything. dispatch-engine.sh is persistent but has no DAG support.

**Fix:** Change task-queue.sh's QUEUE_DIR to `~/dispatch/v3/` or similar. Add a startup recovery script that scans active/ for orphaned tasks (process died mid-execution).

**Why fourth:** Data loss on reboot is bad but reboots are rare on this VM.

### 5. Agent Performance Feedback Loop (MEDIUM-LOW IMPACT)
**Problem:** agent-cards.json has fitness scores and stats but they're manually maintained. The dispatch-failure-analyzer.sh exists but has never been run (`total_analyses: 0`).

**Fix:** Have dispatch-engine.sh auto-update agent-cards.json stats (avg_runtime, success_rate, tasks_completed) after each completion. Run failure-analyzer weekly via cron. Feed fitness scores back into agent matching in dispatch.sh.

**Why fifth:** The system currently works well enough without it, but as volume grows, auto-tuning routing becomes essential.

## Engine vs Direct Spawn Routing

### When to Use dispatch-engine.sh (Cron Path)
- P3-P4 background work (research loops, vault maintenance)
- Tasks that can wait 1-5 minutes for pickup
- Pipeline-chained work (research → implement → verify)
- Anything that benefits from queue ordering and priority sorting

### When to Use sessions_spawn (Direct)
- P0-P1 urgent/interactive tasks
- Trajan is waiting for a response
- Complex multi-agent orchestration where Right Hand needs to coordinate
- Tasks requiring OpenClaw's session infrastructure (channel binding, thread replies)

### Key Difference
dispatch-engine.sh spawns **Claude Code CLI processes** — they run headless with `--print --permission-mode bypassPermissions`. They have no OpenClaw session context, no channel binding, no identity bar.

sessions_spawn creates **OpenClaw subagent sessions** — they have full session context, can use all tools (message, browser, etc.), and auto-announce results back.

**Recommendation:** Use dispatch-engine.sh for "fire-and-forget" background work. Use sessions_spawn for anything interactive or that needs tool access beyond CLI.

## Race Condition Analysis

1. **Task double-pickup:** The flock prevents concurrent engine runs, but the duplicate log lines suggest it's not working perfectly. Low risk since `mv` (queue→active) is atomic on the same filesystem.

2. **Result file race:** The engine checks `kill -0 $pid` and reads the result file. If the process is writing its last bytes when the check runs, the file could be incomplete. Mitigation: check file hasn't been modified in last 5 seconds before declaring done.

3. **Health file corruption:** Multiple concurrent jq read-modify-write cycles on agent-health.json could clobber each other. The flock prevents this for the engine, but direct health updates from other scripts could race.

4. **Pipeline chain race:** Completion hook runs synchronously inside the engine cycle. If it's slow (qmd update, git commit), it blocks the next dispatch cycle. Currently mitigated by the 1-minute cron providing a natural retry.

## Related Notes
- [[Agent Architecture]]
- [[Memory Architecture]]
- [[agent-cards.json]]
