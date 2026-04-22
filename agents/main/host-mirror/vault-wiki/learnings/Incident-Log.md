---
title: "Incident Log"
type: reference
created: 2026-04-06
tags: [learnings, incidents, postmortem, operations]
summary: "Chronological log of all operational incidents with impact and resolution"
---

# Incident Log

## 2026-03-16

### Skill Deletion Disaster
- **Time**: Morning
- **Cause**: `rm -rf` on a directory that was a symlink; followed the symlink and deleted the actual target
- **Impact**: Loss of skill files and associated data
- **Recovery**: 30 minutes from backups
- **Lesson**: Never use `rm`. Use `trash`. See [[Critical-Lessons]].

### Gateway Restart Instability
- **Time**: 05:42 -- 07:30 UTC
- **Cause**: Unknown trigger caused cascading gateway restarts
- **Impact**: 10+ restarts over ~2 hours. All active agents disrupted.
- **Resolution**: Gateway stabilized after root cause (resource contention) was addressed.

### 5 Spawned Agents Lost to Restart
- **Time**: During gateway instability window
- **Cause**: No auto-resume capability configured for spawned agents
- **Impact**: 5 agents lost all progress. Work had to be re-dispatched.
- **Lesson**: Auto-resume after restarts is critical.

## 2026-03-17

### 18 Duplicate Cron Jobs + 40+ Gateway Restarts
- **Cause**: `openclaw doctor --fix` wiped cron array; recovery script created duplicates; duplicates caused resource contention triggering gateway restarts
- **Impact**: System load spiked. 40+ gateway restarts throughout the day.
- **Resolution**: Deduplication of crons, `cron-restore.sh` written for future use.

### auto-knowledge-gated Broken 14+ Hours
- **Cause**: Broken script went undetected due to lack of monitoring
- **Impact**: 14+ hours of knowledge capture missed
- **Resolution**: Added health check for auto-knowledge pipeline. Added to watchdog.

### High Load 13.78 from Duplicate QMD
- **Cause**: Multiple QMD processes running concurrently without locking
- **Impact**: System load hit 13.78 (on 6 vCPU). System became sluggish.
- **Resolution**: Added `flock` wrapper around all QMD invocations.

## 2026-04-04

### Anthropic OAuth Ban Scare
- **Source**: Hacker News report of Anthropic OAuth bans
- **Impact**: Investigation time. Reviewed our OAuth usage patterns.
- **Resolution**: Likely false alarm. No ban observed. Continued monitoring.

### Disk Pressure 88%
- **Cause**: Log accumulation, Docker images, and cached data
- **Impact**: Disk at 88% usage. Risk of filling up and causing service failures.
- **Resolution**: Cleaned 4.6 GB. Docker prune, log rotation, cache cleanup.

## 2026-04-05

### neo4j-genome Crash Loop
- **Duration**: 36-hour down period
- **Cause**: Broken configuration; service unable to start
- **Impact**: Graph database unavailable. Features depending on it degraded.
- **Resolution**: Service stopped permanently. Not worth maintenance cost.

### Proposal Engine Stall
- **Cause**: All 8 seeds had null schedules due to SeedController nil-overwrite bug
- **Impact**: No new proposals generated. Pipeline completely stalled.
- **Resolution**: Fixed SeedController to guard against nil overwrites. Reseeded schedules.

## Related

- [[Critical-Lessons]] -- lessons extracted from these incidents
- [[Infrastructure-Map]] -- infrastructure context
- [[Security-Audits]] -- security-related incident response
