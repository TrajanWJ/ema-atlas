# Consolidation Recommendations — 2026-04-06

This is the first concrete pruning/consolidation plan derived from:

- the curated automation registry
- overlap cluster review
- bootstrap docs and maps

---

## 1. Auth cluster

### Keep as primary
- `oauth-credentials-watcher.service`

### Keep only if architecture requires it
- `sync-host-oauth.sh`

### Treat as dangerous convenience
- `oauth-auto-approve.sh`

### Recommendation
Do **not** remove anything yet, but formalize this hierarchy in docs and registry:

1. watcher = primary
2. host sync = compatibility glue
3. auto-approve = emergency convenience only

### Why
Because the auth system currently spans:
- host state
- browser state
- local file state

The only clean local truth source is the credential watcher.

---

## 2. Dispatch feeder cluster

### Keep as canonical
- `dispatch.sh schedule`
- `signal-to-queue.sh`

### Keep as heuristic layer
- `proactive-task-generator.sh`

### Recommendation
No deletion yet. Instead:
- document feeder hierarchy explicitly
- route future feeder additions through the same hierarchy
- prefer using dispatch API abstractions consistently

### Technical debt note
`proactive-task-generator.sh` directly writes queue files in places instead of always using a canonical dispatch interface.
If touched later, normalize that first.

---

## 3. Health cluster

### Keep all three
- `gateway-watchdog.sh`
- `session-watchdog.sh`
- `system-watchdog.sh`

### Recommendation
Do not consolidate these by name similarity.
They are different roles:

1. gateway recovery controller
2. post-restart resume notifier
3. system alerting/remediation

### Important operational rule
Treat `gateway-watchdog.sh` as a **high-risk self-healing controller**, not a harmless detector.
Any edits to it should get extra scrutiny.

---

## 4. Registry-driven review buckets

### Immediate review bucket A — high-risk mutators
Review first:
- `cron.oauth-auto-approve`
- `cron.host-oauth-sync`
- `service.oauth-credentials-watcher`
- `cron.integrity-scan-fix`
- `cron.auto-resume`
- `cron.gateway-watchdog`

### Immediate review bucket B — canonical vs heuristic feeders
Review second:
- `cron.dispatch-schedule-loader`
- `cron.signal-to-queue`
- `cron.proactive-task-generator`

### Immediate review bucket C — maintenance sprawl
Review third:
- low-risk janitors and cleanup jobs with overlapping domains

---

## 5. Suggested next implementation steps

1. add `status` + `related` semantics to docs/views derived from registry
2. generate owner-specific review lists from registry
3. add a `writesSensitive` / `touchesCredentials` / `touchesConfig` flag to registry
4. create a change policy doc for high-risk automations

---

## Bottom line

The right next move is not “delete things.”
It is:
- clarify hierarchy
- codify dangerous vs canonical vs heuristic
- then prune from a position of control
