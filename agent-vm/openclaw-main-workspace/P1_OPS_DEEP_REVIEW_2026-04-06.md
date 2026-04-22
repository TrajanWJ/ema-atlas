# P1 Ops Deep Review — 2026-04-06

Deep review of the remaining P1 items and related architecture questions:

1. `auto-resume.sh`
2. `system-integrity-scan.sh`
3. `dispatch-engine.sh`
4. host credential borrowing

---

## 1. `auto-resume.sh`

## What it actually does
- runs every 10 minutes
- checks for `CONTINUE.md`
- checks that EMA daemon is up
- queries `http://127.0.0.1:18789/api/sessions`
- if no active main session exists, triggers `EMA agent main "Check CONTINUE.md and resume interrupted work..."`

## Interpretation
This is not a general “resume everything” engine.
It is a **session resurrection nudge** keyed off `CONTINUE.md` + absence of active main session.

## Risk profile
High, but narrower than it first sounded.
Main risks are:
- false negatives/positives around active session detection
- hidden coupling to EMA gateway/session API shape
- repeated nudging if state becomes weird

## Recommendation
**Keep, but rename mentally as `continue-resume-nudge`, not broad auto-resume orchestration.**

## Specific concerns
- it checks `ema-daemon` but queries port `18789`; there may be runtime naming drift between EMA/OpenClaw concepts
- it backgrounds the resume trigger and doesn’t inspect whether it actually worked
- it extracts a resume channel but doesn’t appear to use it directly beyond logging

## Suggested future improvement
- document the exact runtime assumptions
- emit a more explicit reason/result log
- verify that session API and daemon identity match current platform reality

---

## 2. `system-integrity-scan.sh`

## What it actually does
Checks:
- dead webhooks
- duplicate cron entries
- missing/non-executable scripts referenced by cron
- Docker restart loops
- oversized logs
- stale dispatch tasks / dead PIDs
- service activity for `ema-daemon`, `oauth-guardian`, `mcp-server`
- bridge heartbeat freshness
- disk space
- daily note existence
- dispatch-env token age

With `--fix`, it can:
- dedupe crontab
- chmod scripts executable
- truncate logs
- move stale dispatch tasks to `done/`
- restart services via `sudo systemctl restart`

## Interpretation
This is a **mixed detector + mutator janitor** with broad scope.
It is useful, but it is doing too many qualitatively different things under one flag.

## Risk profile
Legitimately high.
Main reasons:
- `--fix --quiet` can mutate cron, services, logs, and dispatch state
- some fixes are much safer than others
- moving stale dispatch tasks to `done/` is especially eyebrow-raising
- service restart behavior assumes privilege/runtime model that may not match reality consistently

## Recommendation
**Keep only with skepticism. This deserves refactor later into detect-only + scoped fix modes.**

## Most concerning behavior
- stale active dispatch tasks with dead PID are moved to `done/`
  - that is not really “fixed”; it may be papering over ambiguous state
- `sudo systemctl restart` inside a cron-driven fix path is strong medicine
- `--quiet` makes forensic visibility worse exactly when mutation is happening

## Suggested future improvement
Split into at least three modes:
1. detect-only
2. safe-fix
   - chmod missing execute bits
   - maybe log truncation
3. dangerous-fix
   - service restart
   - dispatch state mutation
   - cron rewrite

If left as-is, it should remain explicitly high-risk.

---

## 3. `dispatch-engine.sh`

## What it actually does
This is not a simple queue worker.
It is an orchestration controller that handles:
- env bootstrap for cron context
- file + SQLite state integration
- locking
- stale task sweeps
- circuit breaker logic
- dependency validation
- intelligent scoring / routing
- malformed task quarantine
- checkpointing / partial capture
- spawning Claude-based work
- completion/failure handling
- feed emission
- learning capture
- chaining
- inbox polling
- timeout enforcement
- state/dashboard file generation
- pruning/cleanup

## Interpretation
This is a **dispatch control plane**, not just an executor.
It is one of the densest operational scripts in the system.

## Risk profile
High because it is central, not because it is obviously bad.
The danger is complexity concentration.

## Recommendation
**Keep as core infrastructure, but treat it like a subsystem deserving invariants and architecture notes.**

## Specific observations
- this script carries a lot of historically layered behavior
- it mixes controller logic, execution policy, learning capture, event emission, and janitorial work
- it already contains many guardrails, which is good
- but it is operating near the threshold where decomposition would help a lot

## Suggested future improvement
Document formal invariants for:
- queue → active → partial/done/failed transitions
- lock lifecycle
- timeout semantics
- checkpoint semantics
- task type filtering
- result file success criteria

Then later split responsibilities if needed.

---

## 4. Host credential borrowing

See also:
- `HOST_CREDENTIAL_BORROWING_DECISION_2026-04-06.md`

## Deep review conclusion
The current best label remains:
**compatibility bridge pending explicit operator decision**

That is the honest answer.
Not enough evidence says it is accidental junk.
Not enough evidence says it is proud canonical architecture.

So it should remain visible, documented, and unresolved until explicitly decided.

---

## Updated adjudication summary

### Keep as core
- `dispatch-engine.sh`
- `oauth-credentials-watcher.sh`
- OpenClaw gateway service

### Keep but constrain / better-document
- `auto-resume.sh`
- `system-integrity-scan.sh`
- host credential borrowing bridge

### Demote / break-glass
- `oauth-auto-approve.sh`

---

## My strongest opinions after reading the scripts

### Most dangerous by stealth
- `system-integrity-scan.sh --fix --quiet`

### Most dangerous by complexity concentration
- `dispatch-engine.sh`

### Most likely misunderstood by name
- `auto-resume.sh`

### Most architecturally unresolved
- host credential borrowing

---

## Best next moves from here

1. add these conclusions back into the registry notes/decisions
2. create a narrow follow-up review specifically for `system-integrity-scan.sh` mutation classes
3. create dispatch invariants doc for `dispatch-engine.sh`
4. get explicit operator decision on host credential borrowing
