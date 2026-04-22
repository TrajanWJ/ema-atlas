# Owner Review Packet — ops

Total entries: 47

## High-risk items
- `cron.auto-resume` — cron / recovery / mutator / status=active
- `cron.dispatch-engine` — cron / dispatch / executor / status=active
- `cron.host-oauth-sync` — cron / auth / mutator / status=compatibility
- `cron.integrity-scan-fix` — cron / integrity / mutator / status=active
- `cron.integrity-scan.log` — cron / health / mutator / status=active
- `cron.oauth-auto-approve` — cron / auth / mutator / status=dangerous-convenience
- `cron.oauth-auto-approve.log` — cron / maintenance / mutator / status=active
- `service.oauth-credentials-watcher` — service / auth / mutator / status=canonical
- `service.openclaw-gateway` — service / openclaw / executor / status=active

## Non-default statuses
- `cron.dispatch-schedule-loader` — status=canonical · related=cron.signal-to-queue, cron.proactive-task-generator
- `cron.gateway-watchdog` — status=high-risk-canonical · related=cron.session-watchdog, cron.system-watchdog
- `cron.host-oauth-sync` — status=compatibility · related=service.oauth-credentials-watcher, cron.oauth-auto-approve
- `cron.oauth-auto-approve` — status=dangerous-convenience · related=service.oauth-credentials-watcher, cron.host-oauth-sync
- `cron.session-watchdog` — status=canonical · related=cron.gateway-watchdog, cron.system-watchdog
- `cron.signal-to-queue` — status=canonical · related=cron.dispatch-schedule-loader, cron.proactive-task-generator
- `cron.system-watchdog` — status=canonical · related=cron.gateway-watchdog, cron.session-watchdog
- `service.oauth-credentials-watcher` — status=canonical · related=cron.host-oauth-sync, cron.oauth-auto-approve

## Sensitive / network-touching items
- `cron.auto-resume` — sensitive
- `cron.dispatch-engine` — sensitive
- `cron.gateway-watchdog` — config, sensitive
- `cron.host-oauth-sync` — credentials, sensitive
- `cron.host-oauth-sync.log` — credentials, sensitive
- `cron.integrity-scan-fix` — sensitive
- `cron.integrity-scan.log` — sensitive
- `cron.null` — config, sensitive
- `cron.oauth-auto-approve` — credentials, sensitive, network
- `cron.oauth-auto-approve.log` — credentials, sensitive
- `service.ema-observer` — network
- `service.oauth-credentials-watcher` — credentials, sensitive
- `service.openclaw-gateway` — config, sensitive, network
