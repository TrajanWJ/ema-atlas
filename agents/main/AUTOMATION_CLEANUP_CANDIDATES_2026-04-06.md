# Automation Cleanup Candidates

## High-risk items
- `cron.auto-resume` — cron / recovery / mutator / canonical=True
- `cron.dispatch-engine` — cron / dispatch / executor / canonical=True
- `cron.host-oauth-sync` — cron / auth / mutator / canonical=True
- `cron.integrity-scan-fix` — cron / integrity / mutator / canonical=False
- `cron.oauth-auto-approve` — cron / auth / mutator / canonical=False
- `service.oauth-credentials-watcher` — service / auth / mutator / canonical=True
- `service.openclaw-gateway` — service / openclaw / executor / canonical=True

## Non-canonical / review-needed
- `cron.integrity-scan-fix` — cron / integrity / mutator
- `cron.oauth-auto-approve` — cron / auth / mutator
- `cron.proactive-task-generator` — cron / dispatch / feeder
- `cron.research-implement-pipeline` — cron / research / executor

## Overlap clusters
- `auth/mutator` (3): `cron.host-oauth-sync`, `cron.oauth-auto-approve`, `service.oauth-credentials-watcher`
- `dispatch/feeder` (3): `cron.dispatch-schedule-loader`, `cron.proactive-task-generator`, `cron.signal-to-queue`
- `health/detector` (3): `cron.gateway-watchdog`, `cron.session-watchdog`, `cron.system-watchdog`

## Ownership counts
- `ops`: 16
- `researcher`: 3
- `strategist`: 1
- `vault-keeper`: 6
