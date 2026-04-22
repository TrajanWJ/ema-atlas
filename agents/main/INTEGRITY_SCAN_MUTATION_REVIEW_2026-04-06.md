# Integrity Scan Mutation Review — 2026-04-06

Focused review of `system-integrity-scan.sh` mutation classes.

---

## Why this needs its own review

`system-integrity-scan.sh --fix --quiet` combines multiple mutation types under one switch.
That makes it operationally useful and governance-hostile at the same time.

The goal of this review is to classify each mutation type by safety level.

---

## Mutation classes

## A. Cron deduplication

### Behavior
- reads current crontab
- removes duplicate lines
- reinstalls deduplicated crontab

### Safety level
**Medium**

### Why
- duplicate removal is often fine
- but cron files are control-plane state, not cache
- false-positive dedupe could remove intentional duplicated jobs if semantics were ever relying on duplication

### Recommendation
- allowed in `safe-fix` only if duplicate definition is strict exact-line duplication
- should always log before/after counts

---

## B. chmod missing execute bits on referenced scripts

### Behavior
- finds cron-referenced scripts that exist but are not executable
- runs `chmod +x`

### Safety level
**Low**

### Why
- this is the cleanest mutation in the script
- it restores intended execution posture without changing script content

### Recommendation
- safe to keep in `safe-fix`

---

## C. log truncation

### Behavior
- truncates oversized logs to 100K

### Safety level
**Low to Medium**

### Why
- operationally normal
- but destructive to forensic history if done too aggressively or without rotation

### Recommendation
- keep in `safe-fix` only if rotation/backup behavior is acceptable
- prefer rotate/compress over blunt truncation where possible

---

## D. stale dispatch task mutation

### Behavior
- for dead-PID active tasks, moves task JSON into `done/`

### Safety level
**High**

### Why
- this is semantically dangerous
- dead PID does not imply successful task completion
- moving ambiguous work into `done/` corrupts lifecycle truth

### Recommendation
- remove from generic `safe-fix`
- if retained at all, redirect to:
  - `failed/`
  - `partial/`
  - or a dedicated `quarantine/` state
- this should never silently mark ambiguous work as done

---

## E. service restart via `sudo systemctl restart`

### Behavior
- restarts named services when inactive

### Safety level
**High**

### Why
- crosses privilege boundary
- assumes sudo path works non-interactively
- restart side effects can be significant
- service identity may not even map cleanly to current runtime expectations

### Recommendation
- dangerous-fix only
- should not live in quiet broad-spectrum cron repair without strong justification

---

## F. no-op / observational checks

Includes:
- dead webhooks
- docker restart loops
- bridge heartbeat freshness
- disk space
- daily note existence
- token age

### Safety level
**Low**

### Recommendation
- fine in detect-only mode
- no issue

---

## Recommended future mode split

## detect-only
Allowed:
- all checks
- no mutation

## safe-fix
Allowed:
- chmod execute bits
- maybe log rotation/truncation
- maybe strict cron dedupe with explicit logging

## dangerous-fix
Allowed:
- service restart
- dispatch state mutation
- any broad state rewrite

---

## Immediate conclusion

The worst mutation currently present is:
- **dead PID active task → move to `done/`**

That is the mutation most likely to silently falsify system truth.

The second riskiest is:
- **`sudo systemctl restart` in broad fix mode**

---

## Bottom line

`system-integrity-scan.sh` is not bad.
It is over-bundled.
Its fix actions need separation by blast radius.
