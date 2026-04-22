---
title: "reliability-first-reorg-v1"
created: 2026-03-18
updated: 2026-03-18
type: project
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: project
tags: [agent-feed, alerts, auto-delegator, chat, concierge, desk, evolution-log, general, github-interesting, ops, overview, reddit-intel, trajans-office, vault-feed, worklog]
summary: "The system can't work independently for more than ~30 minutes. Sessions die silently, crons get wiped, no task survives a gateway restart. 95 out of 2"
---
# Reliability-First Reorg — v1 Plan

> The system has impressive architecture but terrible follow-through. 38% of Trajan's messages are just nudges. This plan fixes that.

**Created:** 2026-03-18
**Status:** 🔨 ACTIVE
**Principle:** Ship the simplest working version, then iterate from real failure data.

---

## The Core Problem

The system can't work independently for more than ~30 minutes. Sessions die silently, crons get wiped, no task survives a gateway restart. 95 out of 252 messages in 5 days were just "continue" or "are you there?"

**Root cause chain:**
1. Crons get wiped by `doctor --fix` → reliability scripts stop running
2. Gateway restarts kill all sessions → no recovery mechanism actually works
3. No continuous work loop → system does nothing unless prompted
4. 22 Discord channels → attention scattered, messages missed
5. Only 6 agent dispatches in 5 days → infrastructure built, never used

---

## Phase 0: Audit & Fix Foundation (2 hours)

**Before building anything new, fix what's broken.**

### 0a. Cron Persistence
```bash
# Verify crons are still alive
crontab -l | wc -l  # Should be 22+

# If wiped, restore from backup
cat /home/trajan/vault/System/cron-backup.txt

# Add to post-restart fixup: always restore crons
echo 'crontab /home/trajan/vault/System/cron-backup.txt' >> ~/bin/post-restart-fixup.sh

# Add cron backup to vault-autocommit (every 2h)
# So backup is always fresh
```

### 0b. Root-Cause Monitor Failures
The existing stack (gateway-watchdog, session-guardian, auto-resume) failed to catch 9-hour outages. Check:
- Are the crons running? (`grep -c guardian /var/log/syslog`)
- Do they actually trigger recovery? (check logs)
- Is CONTINUE.md being read on restart?

Fix whatever's broken before adding new monitors.

### 0c. Cron Backup Automation
```bash
# Add to crontab itself:
0 */6 * * * crontab -l > /home/trajan/vault/System/cron-backup.txt

# Add to @reboot:
@reboot sleep 30 && crontab /home/trajan/vault/System/cron-backup.txt
```

**Exit criteria:** Crons survive a gateway restart. Existing monitors actually run.

---

## Phase 1: Minimal Dispatch Engine (Day 1)

**The simplest possible continuous work loop.**

### Directory Structure
```
~/dispatch/
├── queue/          # Pending tasks (one JSON file each)
├── active/         # Currently being worked on
├── done/           # Completed (retained 7 days)
├── failed/         # Failed (retained 7 days)
└── dispatch.lock   # PID file to prevent race conditions
```

### Task File Format
```json
{
  "id": "2026-03-18-001",
  "priority": 1,
  "source": "trajan-direct",
  "description": "Deploy LetMeScale to Vercel",
  "agent": "coder",
  "created": "2026-03-18T02:40:00Z",
  "timeout_minutes": 30,
  "context": "Project lives on host machine at ~/Desktop/Coding/letmescale",
  "success_criteria": "Site accessible at letmescale.vercel.app",
  "next_task": null
}
```

Priority levels:
- **P0:** Revenue/client work (Wilson Premier, LetMeScale)
- **P1:** Trajan-direct instructions
- **P2:** System reliability fixes
- **P3:** Improvement (research implementation, skill installs)
- **P4:** Maintenance (vault cleanup, memory hygiene)

### dispatch-engine.sh (10-minute cron)
```
1. PID lock check (prevent double-run)
2. Stale task sweep:
   - Check active/ for tasks past timeout → move to failed/
   - Log failure reason
3. Capacity check:
   - Count files in active/
   - If active >= 3 → exit (conservative v1 limit)
4. Pick next task:
   - Sort queue/ by priority (ascending), then created (ascending)
   - Move task file from queue/ → active/
   - Record claimed_at timestamp
5. Dispatch:
   - Spawn agent via sessions_spawn or Claude Code
   - Log dispatch to #agent-feed
6. Check completed subagents:
   - For each active task, check if agent has finished
   - Move completed → done/, failed → failed/
   - If task has next_task, create it in queue/
7. Post summary to #agent-feed (if anything happened)
```

### Task Creation (Right Hand's job)
When Trajan gives an instruction in any channel:
1. Parse intent (already in AGENTS.md input processing)
2. Create task file in `~/dispatch/queue/`
3. Acknowledge to Trajan: "Queued: [task] → [agent], priority P[N]"
4. Dispatch engine picks it up within 10 minutes

### Cron Entry
```bash
*/10 * * * * flock -n ~/dispatch/dispatch.lock ~/bin/dispatch-engine.sh >> /tmp/dispatch-engine.log 2>&1
```

**Exit criteria:** Trajan drops a task → it gets queued → agent picks it up → result appears → next task starts. No nudging required.

---

## Phase 2: Discord Consolidation (Day 2)

### Target: 22 → 9 channels

**Keep (active, conversational):**
| Channel | Purpose | Session Type |
|---|---|---|
| #chat | Live conversation | Persistent |
| #trajans-office | Private 1-on-1 | Persistent |
| #concierge | Personal requests | Persistent |
| #desk | Executive inbox (forum) | Persistent |
| #general | Active work threads (forum) | Persistent |

**Keep (system, write-only):**
| Channel | Purpose | Session Type |
|---|---|---|
| #agent-feed | ALL agent activity, dispatch events, results | Write-only (no session) |
| #auto-delegator | Dispatch queue visibility, orchestration log | Write-only (log only) |

**Keep (project-specific, lifecycle-managed):**
| Channel | Purpose | Session Type |
|---|---|---|
| #ops | System operations (forum) | On-demand |
| Project channels | One per ACTIVE project | On-demand |

**Archive (kill crons first):**
- #worklog → merged into #agent-feed
- #evolution-log → merged into #agent-feed
- #alerts → merged into #agent-feed
- #overview → content moves to #auto-delegator
- #reddit-intel → becomes a dispatch queue source, not a channel
- #github-interesting → becomes a dispatch queue source, not a channel
- #vault-feed → merged into #agent-feed
- All 14 channels in Archive category → delete or leave archived

### Cron Migration
Before archiving, for each channel with a cron:
1. Identify the cron (`crontab -l | grep channel-name`)
2. Redirect output to #agent-feed instead
3. Or kill the cron if the feed is no longer needed
4. Update cron-backup.txt

### Write-Only Implementation
For #agent-feed and #auto-delegator:
- Right Hand posts via `message` tool from persistent sessions
- No session created for inbound messages
- If Trajan messages there, route to nearest persistent session (#chat)
- [[OpenClaw config]]: set `activation: "never"` if supported, otherwise just don't respond

**Exit criteria:** ≤9 active channels, no orphan crons, all Trajan messages answered within 60 seconds.

---

## Phase 3: Task Ingestion & Chaining (Day 3)

Close the loop — tasks enter the queue automatically.

### Ingestion Sources

**Source 1: Trajan messages (highest priority)**
Right Hand parses every Trajan message for task intent. If it's actionable:
```
Parse intent → Create task file → Acknowledge → Dispatch engine handles it
```
This is already in AGENTS.md's input processing. Just add the "write task file" step.

**Source 2: Desk forum posts**
The desk-watcher hook already detects tasks. Modify it to:
- Write task files to `~/dispatch/queue/` instead of dispatch-log.json
- This replaces the old dispatch-log.json entirely

**Source 3: Feed discoveries (github-interesting, reddit-intel)**
When research finds something implementable:
- Create a P3 task file with the discovery details
- Agent feed gets a notification
- Dispatch engine picks it up when higher-priority work is done

**Source 4: Completion chains**
When a task completes and has `next_task`:
- Dispatch engine creates the next task file in queue/
- Automatic sequential workflows without human intervention

**Source 5: Scheduled tasks**
Cron creates task files for recurring work:
```bash
# Daily vault maintenance (P4)
0 9 * * * echo '{"id":"daily-vault-'$(date +%Y%m%d)'","priority":4,"source":"cron","description":"Daily vault freshness check","agent":"vault-keeper","timeout_minutes":15}' > ~/dispatch/queue/daily-vault-$(date +%Y%m%d).json

# Weekly research sweep (P3)
0 10 * * 1 echo '{"id":"weekly-research-'$(date +%Y%m%d)'","priority":3,"source":"cron","description":"Weekly research sweep for new tools and patterns","agent":"researcher","timeout_minutes":30}' > ~/dispatch/queue/weekly-research-$(date +%Y%m%d).json
```

**Source 6: CONTINUE.md**
On restart, if CONTINUE.md exists:
- Parse interrupted tasks
- Re-create task files in queue/ with P1 priority
- Delete CONTINUE.md

### Backpressure Rules
- **Max queue depth:** 20 tasks. Beyond that, log a warning and stop accepting P4 tasks.
- **Max active:** 3 agents (v1). Increase to 6 after proving stability.
- **Stale threshold:** Active task past timeout → move to failed/, re-queue once at lower scope.
- **Duplicate detection:** Don't queue a task that's already queued or active (match on description hash).

**Exit criteria:** Tasks flow into the queue from 3+ sources. No manual queue management needed.

---

## Phase 4: Reliability Hardening (Day 4)

### 4a. Dispatch Heartbeat
```bash
# Every 15 minutes during active hours (8 AM - 11 PM EST = 13:00-04:00 UTC)
*/15 13-23,0-4 * * * ~/bin/dispatch-heartbeat.sh
```
Logic:
- If queue has P0/P1 tasks AND no task completed in 30 minutes → alert Trajan
- If active/ has stale tasks → re-queue or fail them
- Post status to #agent-feed every hour (tasks completed, queue depth, agent health)

### 4b. Channel Sweep
Every heartbeat, Right Hand checks:
- All persistent session channels for unread Trajan messages
- Any message older than 5 minutes without response → process immediately
- This prevents the "Trajan messaged #concierge but the session was dead" failure

### 4c. Circuit Breaker (per-agent)
Track in `~/dispatch/agent-health.json`:
```json
{
  "coder": { "failures": 0, "last_failure": null, "state": "closed" },
  "researcher": { "failures": 0, "last_failure": null, "state": "closed" }
}
```
- 3 failures in 30 minutes → "open" (skip for 60 minutes, use fallback agent)
- After 60 minutes → "half-open" (try one task)
- Success → "closed"

### 4d. Failure Taxonomy
```
Transient (retry automatically):  API rate limits, network blips, temp file issues
Agent (retry with changes):       Timeout, bad output, scope too large → halve scope, retry
Systemic (alert Trajan):          Gateway down, crons wiped, disk full → stop dispatching
Task (surface to Trajan):         Impossible, underspecified, needs human input → P1 follow-up
```

**Exit criteria:** Zero silent outages >15 minutes. Trajan sends zero "are you there?" messages in a week.

---

## Phase 5: Performance & Evolution (Week 2+)

Only after achieving 10+ tasks/day for a full week.

### 5a. Outcome Logging
Every completed task gets logged to `~/dispatch/outcomes.json`:
```json
{
  "task_id": "...",
  "agent": "coder",
  "duration_seconds": 340,
  "quality": 4,
  "spec_compliance": true,
  "failure_mode": null
}
```

### 5b. Fitness Scores
Calculate from outcomes (same formula as [[agent-performance]].md):
```
fitness = (success_rate × 0.6) + (speed_score × 0.2) + (quality_score × 0.2)
```
Use for routing: high-fitness agents get P0/P1 tasks, low-fitness get P3/P4 or simpler scopes.

### 5c. Evaluator Loop
Before marking any P0/P1 task as "done":
- Right Hand does a 30-second spec compliance check
- Read the actual output, compare to task description
- If issues: send back to agent (max 3 loops)
- Then mark done

### 5d. Session Optimization
Answer the open questions from [[Session Architecture Proposal]]:
- Test multi-channel → single session routing
- Test activation: "never" for write-only channels
- Implement session tiering (persistent / on-demand / disposable)

---

## What We're NOT Building (Yet)

1. ❌ Event-driven dispatch (cron is fine for v1)
2. ❌ Fitness-based routing (not enough data)
3. ❌ Agent-to-agent direct communication (Right Hand mediates everything)
4. ❌ DAG decomposition (sequential/parallel dispatch is enough)
5. ❌ [[Context Gateway]] integration (wait for stability first)
6. ❌ Custom scoring algorithms (simple P0-P4 priority sort)
7. ❌ Dashboard UI (file-based visibility is enough for now)

These become Phase 6+ once the basic loop is proven.

---

## Key Research Insights Applied

| Pattern | Source | How We Use It |
|---|---|---|
| Circuit Breaker | [[Multi-Agent Coordination Patterns]] §5 | Per-agent failure tracking, auto-cooldown |
| Multi-Agent Trap | Same, §9 takeaway #6 | Start with 3 agents, not 10 |
| Supervisor with Fallback | Same, §8 Pattern 1 | Right Hand → agent → retry → different agent → manual |
| Context as OS | Self-Organizing Architectures §4 | Workspace-per-agent = context engineering |
| Two-Stage Review | Superpowers §Pattern 1 | Spec compliance → quality check (Phase 5) |
| Handoff as Primitive | OpenAI SDK patterns | Right Hand is THE handoff mechanism |
| Verification-Driven | VMAO paper | Every output verified before "done" (Phase 5) |

---

## Success Metrics

| Metric | Current | Target (Week 1) | Target (Month 1) |
|---|---|---|---|
| "Continue"/"nudge" messages per day | ~19 | <5 | 0 |
| Tasks dispatched per day | ~1 | 5+ | 15+ |
| Agent dispatch success rate | 33% | 70%+ | 85%+ |
| Max silent gap (no activity) | 9 hours | 30 minutes | 15 minutes |
| Active Discord channels | 22 | 9 | 9 |
| Queue → completion time (P1) | ∞ (manual) | <30 min | <15 min |

---

## Build Order Checklist

- [ ] **Phase 0a:** Verify crons alive, restore if needed
- [ ] **Phase 0b:** Root-cause monitor failures (why 9h gaps?)
- [ ] **Phase 0c:** Automate cron backup/restore
- [ ] **Phase 1a:** Create ~/dispatch/ directory structure
- [ ] **Phase 1b:** Write dispatch-engine.sh with PID locking
- [ ] **Phase 1c:** Add 10-minute dispatch cron
- [ ] **Phase 1d:** Right Hand creates task files from Trajan messages
- [ ] **Phase 1e:** Test: queue task → dispatch → complete → next
- [ ] **Phase 2a:** Archive dead Discord channels (kill crons first)
- [ ] **Phase 2b:** Merge feed channels into #agent-feed
- [ ] **Phase 2c:** Make #agent-feed and #auto-delegator write-only
- [ ] **Phase 2d:** Verify all Trajan messages still get answered
- [ ] **Phase 3a:** Modify desk-watcher to write task files
- [ ] **Phase 3b:** Add completion chaining (next_task)
- [ ] **Phase 3c:** Add scheduled task crons
- [ ] **Phase 3d:** CONTINUE.md → queue integration
- [ ] **Phase 4a:** Dispatch heartbeat script + cron
- [ ] **Phase 4b:** Channel sweep in heartbeat
- [ ] **Phase 4c:** Per-agent circuit breakers
- [ ] **Phase 4d:** Failure taxonomy in dispatch engine

---

*This plan is a living document. Update after each phase based on what actually works.*

## Related

- [[Auto Delegator Layer]]
