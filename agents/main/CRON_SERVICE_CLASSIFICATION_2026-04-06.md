# Cron & Service Classification — 2026-04-06

## Core services

### Must stay healthy
- `openclaw-gateway.service`
- `oauth-credentials-watcher.service`
- `ema-observer.service`

### Optional / situational
- `claudeforge.service`
- `opentabs.service`

---

## Cron classification

## A. Core orchestration
High value; do not remove casually.

- gateway watchdog
- session watchdog
- system watchdog
- auto-resume
- dispatch schedule
- dispatch engine
- proactive task generator
- dispatch heartbeat
- signal-to-queue

## B. Knowledge / vault / indexing
Important, but can be tuned.

- memory-pressure
- qmd update/embed
- ontology sync extract
- transcript scanner
- vault research loop
- vault autocommit
- vault janitor

## C. Intel / research
Useful but policy-driven.

- reddit intel
- competitive scan
- github trending intel
- research-implement pipeline

## D. Cleanup / maintenance
Safe to keep, low drama.

- session janitor
- stale task cleanup
- tmp/log truncation cleanup
- cron backup
- session tree volatile check

## E. Higher-risk automation
Needs explicit review whenever touched.

- system integrity scan with `--fix`
- OAuth auto-approve
- host OAuth sync
- any job that mutates external systems or credentials automatically

---

## Recommendations

### Keep as-is for now
- core orchestration set
- cleanup/maintenance set

### Review next
- intel/research jobs for actual ROI
- vault/indexing cadence for duplication
- OAuth auto-approve safety assumptions
- integrity scan with automatic fix mode

### Candidate consolidation targets
- overlapping dispatch-related jobs
- overlapping vault/knowledge loops
- auth-related sync/approval flows
