# Automation & Cron Deeper Cleanup — 2026-04-06

## What the cron surface currently is

The active user crontab is not just maintenance. It is a scheduler for a full orchestration layer.

Observed categories:
- watchdogs
- dispatch engine + queue loading
- vault/indexing
- research/intel
- proposal/review loops
- transcript scanning
- OAuth sync and auto-approval
- integrity scanning/fixing
- janitorial cleanup

---

## The main structural issue

There are too many jobs that look like they may be part of the same super-system but are expressed independently.

This creates four common failure modes:

1. duplicate work
2. hidden dependency ordering
3. hard-to-debug side effects
4. “works if all the folklore is true” operations

---

## Priority review buckets

### Bucket 1 — dispatch overlap
Review together:
- `dispatch.sh schedule`
- `dispatch-engine.sh`
- `dispatch-heartbeat.sh`
- `signal-to-queue.sh`
- `proactive-task-generator.sh`
- `desk-dispatch.sh`
- `parallel-dispatch.sh`
- `smart-dispatch.sh`
- `vector-dispatch.sh`

Questions:
- which ones are authoritative?
- which are feeders vs executors vs observers?
- which are still legacy?

### Bucket 2 — research/vault overlap
Review together:
- `vault-research-loop.sh`
- `research-implement-pipeline.sh`
- `transcript-scanner.sh`
- `research-digest.sh`
- `autoresearch-loop.sh`
- related ingest/link/quality jobs

Questions:
- where does raw research enter?
- where is it transformed?
- where does it become durable knowledge?

### Bucket 3 — auth/risk overlap
Review together:
- `sync-host-oauth.sh`
- `oauth-auto-approve.sh`
- `oauth-credentials-watcher.sh`

Questions:
- which one is the source of truth?
- which ones are convenience vs critical?
- what is safe to keep automated?

### Bucket 4 — integrity/self-healing overlap
Review together:
- `system-integrity-scan.sh --fix --quiet`
- watchdog scripts
- auto-resume
- session cleanup / stale cleanup

Questions:
- what is merely detect/report?
- what mutates state automatically?
- what can create hard-to-explain recovery behavior?

---

## Recommended classification model

Every automation should be labeled as one of:

- **detector** — notices a condition
- **feeder** — queues work
- **executor** — performs work
- **mutator** — changes system/content state
- **janitor** — cleanup/rotation/retention
- **publisher** — sends output outward

A lot of clarity problems disappear once jobs are tagged this way.

---

## Suggested next cleanup step

Make a machine-readable registry, e.g.:

```json
{
  "job": "dispatch-engine.sh",
  "class": "executor",
  "domain": "dispatch",
  "writes": ["/home/trajan/dispatch"],
  "reads": ["/home/trajan/dispatch/schedule.json"],
  "external": false,
  "risk": "medium"
}
```

Then generate docs from that.

---

## Bottom line

The cron system is already a platform.
Treating it like “just some cron jobs” is the mistake.
It needs typed ownership and a registry.
