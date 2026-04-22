# Overlap Cluster Review — 2026-04-06

Focused review of the three hottest overlap clusters:

1. auth mutators
2. dispatch feeders
3. health detectors

This review is based on actual script contents, not guesses.

---

## 1. Auth mutators

### Components reviewed
- `sync-host-oauth.sh`
- `oauth-auto-approve.sh`
- `oauth-credentials-watcher.sh`

### What each actually does

#### `sync-host-oauth.sh`
Role:
- pulls Claude and Codex credentials from a remote `host-machine` via SSH
- writes them into `~/.claude/oauth-sources/`
- effectively imports host auth state into VM-side accessible files

This is a **cross-machine credential synchronizer**.

#### `oauth-auto-approve.sh`
Role:
- detects Claude OAuth pages in Chrome
- attempts auto-click approval via CDP
- falls back to direct refresh flow via `refresh-EMA-oauth.sh`
- then syncs resulting token to EMA

This is a **browser-coupled auth automation mutator**.
It is the most operationally spooky of the three.

#### `oauth-credentials-watcher.sh`
Role:
- watches `~/.claude/.credentials.json`
- debounces writes
- syncs token changes to EMA whenever the credential file changes

This is a **local file-change-triggered sync daemon**.
It is the cleanest source of truth among the three.

### Problem
All three can participate in token propagation, but with very different trigger models:
- periodic pull from host
- aggressive browser automation
- local file watch daemon

That means auth mutation is distributed across:
- remote host state
- browser state
- local file state

### Recommended ownership model

#### Canonical
- `oauth-credentials-watcher.sh`
  - should be treated as the **primary local sync trigger**

#### Conditional canonical
- `sync-host-oauth.sh`
  - only canonical if host→VM sync is still an intentional architectural dependency
  - otherwise it should be demoted to compatibility glue

#### Non-canonical / dangerous convenience
- `oauth-auto-approve.sh`
  - should remain **explicitly non-canonical**
  - treat as emergency convenience automation, not core platform truth

### Recommendation
- Keep watcher as primary
- Keep host sync only if you still need cross-machine credential borrowing
- Treat auto-approve as risky convenience; do not let the system depend on it for normal auth health

---

## 2. Dispatch feeders

### Components reviewed
- `dispatch.sh schedule`
- `proactive-task-generator.sh`
- `signal-to-queue.sh`

### What each actually does

#### `dispatch.sh schedule`
Role:
- canonical dispatch interface
- reads `schedule.json`
- queues due tasks on schedule

This is a **structured scheduled feeder**.
It is the cleanest and most canonical of the set.

#### `proactive-task-generator.sh`
Role:
- scans many sources for agent-discoverable work
- writes tasks directly into dispatch queue
- can also post feed/proposal artifacts
- has broad, heuristic, opportunistic behavior

This is a **heuristic opportunity generator**.
Valuable, but much noisier than schedule-based feeding.

#### `signal-to-queue.sh`
Role:
- checks a smaller set of explicit signals
- uses `dispatch.sh add` to queue tasks
- mostly detector→queue behavior

This is a **signal-based feeder** and is conceptually cleaner than the proactive generator.

### Problem
All three feed dispatch, but at different abstraction levels:
- strict scheduled tasks
- explicit detected signals
- broad heuristic proactive opportunity creation

That is not inherently bad.
The issue is lacking a declared hierarchy.

### Recommended ownership model

#### Canonical feeder tiers
1. `dispatch.sh schedule`
   - **canonical structured feeder**
2. `signal-to-queue.sh`
   - **canonical signal feeder**
3. `proactive-task-generator.sh`
   - **non-canonical heuristic feeder**

### Recommendation
- Keep all three, but with explicit tiering
- Do **not** treat proactive generation as authoritative
- Make it clear that:
  - schedule = intended work
  - signal-to-queue = condition-triggered work
  - proactive = suggestion/opportunity work

### Additional note
`proactive-task-generator.sh` currently writes queue tasks directly rather than routing everything through one canonical abstraction. That weakens invariants.
If touched later, it should probably use a single dispatch API consistently.

---

## 3. Health detectors

### Components reviewed
- `gateway-watchdog.sh`
- `session-watchdog.sh`
- `system-watchdog.sh`

### What each actually does

#### `gateway-watchdog.sh`
Role:
- validates EMA config proactively
- detects EMA daemon crashes
- attempts recovery
- may call `EMA doctor --fix`
- may invoke Claude Code to repair config
- may restore backup config
- syncs tokens after recovery

This is **not just a detector**.
It is a **detector + mutator + self-healer + AI repair agent**.
It is the heaviest script in the cluster by far.

#### `session-watchdog.sh`
Role:
- detects recent gateway restart
- checks `CONTINUE.md`
- nudges main agent to resume after gateway restart

This is a **restart-resume coordinator**.
It is narrow and understandable.

#### `system-watchdog.sh`
Role:
- checks for gateway down, errors, disk, load, memory, OOMs, auth missing, stuck browser OAuth processes, broken Claude CLI
- may auto-restart gateway
- may kill stuck browser processes
- sends EMA system events

This is also **not just a detector**.
It is a **system alerting + limited auto-remediation script**.

### Problem
This cluster is labeled like three watchdogs, but in reality:
- one is gateway self-healing with AI intervention
- one is restart/resume coordination
- one is broad system alerting/remediation

So the overlap is partly semantic confusion.
The names understate the differences.

### Recommended ownership model

#### Canonical
- `gateway-watchdog.sh`
  - canonical **gateway recovery controller**
- `session-watchdog.sh`
  - canonical **post-restart resume notifier**
- `system-watchdog.sh`
  - canonical **system health alerting/remediation**

### Recommendation
Keep all three, but stop thinking of them as interchangeable detectors.
They are three different roles:

1. gateway recovery
2. session continuity
3. system alerting

### Important warning
`gateway-watchdog.sh` is the most dangerous automation reviewed so far because it can:
- mutate config
- invoke repair tools
- restore backups
- attempt AI-driven fixes

It needs explicit respect in the registry and docs as a high-risk self-healing controller, not a simple watchdog.

---

## Final recommendations

### Auth cluster
- primary: watcher
- optional architecture glue: host sync
- risky convenience only: auto-approve

### Dispatch feeder cluster
- primary: dispatch schedule
- secondary canonical: signal feeder
- suggestion layer only: proactive generator

### Health cluster
- keep all three
- rename mentally by function, not by “watchdog” label
- especially flag gateway-watchdog as high-risk self-healing automation

---

## Immediate follow-up actions worth doing later

1. reflect these roles into the curated registry
2. add a `status` field (`canonical`, `compatibility`, `dangerous-convenience`, `heuristic`, etc.)
3. add `related` links between overlap-cluster members
4. upgrade docs to show feeder hierarchy and auth hierarchy explicitly
