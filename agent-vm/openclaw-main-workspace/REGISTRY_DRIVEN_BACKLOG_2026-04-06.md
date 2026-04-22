# Registry-Driven Backlog — 2026-04-06

Action-oriented view derived from the curated automation registry.

## Keep

### P1
- `cron.dispatch-engine` — cron / ops / dispatch / status=canonical
- `cron.host-oauth-sync` — cron / ops / auth / status=canonical
- `service.oauth-credentials-watcher` — service / ops / auth / status=canonical

### P2
- `cron.dispatch-schedule-loader` — cron / ops / dispatch / status=canonical
- `cron.gateway-watchdog` — cron / ops / health / status=high-risk-canonical
- `cron.proactive-task-generator` — cron / strategist / dispatch / status=heuristic
- `cron.session-watchdog` — cron / ops / health / status=canonical
- `cron.signal-to-queue` — cron / ops / dispatch / status=canonical
- `cron.system-watchdog` — cron / ops / health / status=canonical

### P3
- `hook.claude.on-clear` — hook / ops / runtime / status=active
- `hook.claude.tool-use-trace` — hook / ops / observability / status=active

## Review

### P1
- `cron.auto-resume` — cron / ops / recovery / status=active
- `cron.integrity-scan-fix` — cron / ops / integrity / status=active
- `service.openclaw-gateway` — service / ops / openclaw / status=active

### P3
- `cron.agent-learning-sync.log` — cron / ops / maintenance / status=active
- `cron.auto-resume.log` — cron / ops / maintenance / status=active
- `cron.competitive-scan.log` — cron / researcher / research / status=active
- `cron.cron-backup.txt` — cron / ops / maintenance / status=active
- `cron.cron-restore.log` — cron / ops / maintenance / status=active
- `cron.desk-dispatch.log` — cron / ops / dispatch / status=active
- `cron.dispatch-engine.log` — cron / ops / dispatch / status=active
- `cron.dispatch-heartbeat` — cron / ops / dispatch / status=active
- `cron.dispatch-heartbeat.log` — cron / ops / health / status=active
- `cron.dispatch-schedule.log` — cron / ops / dispatch / status=active
- `cron.evolution-loop.log` — cron / ops / maintenance / status=active
- `cron.gateway-watchdog.log` — cron / ops / health / status=active
- `cron.github-trending-intel` — cron / researcher / intel / status=active
- `cron.github-trending.log` — cron / researcher / research / status=active
- `cron.host-oauth-sync.log` — cron / ops / maintenance / status=active
- `cron.integrity-scan.log` — cron / ops / health / status=active
- `cron.links-pipeline.log` — cron / ops / maintenance / status=active
- `cron.memory-pressure.log` — cron / ops / maintenance / status=active
- `cron.morning-briefing-v2` — cron / ops / maintenance / status=active
- `cron.null` — cron / ops / health / status=active
- `cron.oauth-auto-approve.log` — cron / ops / maintenance / status=active
- `cron.ontology-sync-extract` — cron / vault-keeper / knowledge / status=active
- `cron.ontology-sync.log` — cron / vault-keeper / knowledge / status=active
- `cron.overnight-digest.log` — cron / ops / maintenance / status=active
- `cron.proactive-task-generator.log` — cron / ops / maintenance / status=active
- `cron.proposal-cron.log` — cron / ops / dispatch / status=active
- `cron.qmd` — cron / vault-keeper / knowledge / status=active
- `cron.qmd-update-embed` — cron / vault-keeper / knowledge / status=active
- `cron.reddit-intel` — cron / researcher / intel / status=active
- `cron.reddit-intel.log` — cron / researcher / research / status=active
- `cron.research-implement-pipeline` — cron / researcher / research / status=active
- `cron.research-pipeline.log` — cron / researcher / research / status=active
- `cron.session-janitor` — cron / ops / maintenance / status=active
- `cron.session-janitor.log` — cron / ops / maintenance / status=active
- `cron.session-tree-expiry.log` — cron / vault-keeper / knowledge / status=active
- `cron.signal-to-queue.log` — cron / ops / maintenance / status=active
- `cron.stale-task-cleanup` — cron / ops / maintenance / status=active
- `cron.stale-task-cleanup.log` — cron / ops / maintenance / status=active
- `cron.transcript-scanner` — cron / vault-keeper / knowledge / status=active
- `cron.transcript-scanner.log` — cron / vault-keeper / knowledge / status=active
- `cron.vault-autocommit` — cron / vault-keeper / knowledge / status=active
- `cron.vault-autocommit.log` — cron / vault-keeper / knowledge / status=active
- `cron.vault-janitor` — cron / vault-keeper / knowledge / status=active
- `cron.vault-janitor.log` — cron / ops / maintenance / status=active
- `cron.vault-research-loop` — cron / vault-keeper / knowledge / status=active
- `cron.vault-research-loop.log` — cron / researcher / research / status=active
- `cron.watchdog.log` — cron / ops / health / status=active
- `hook.claude.on-startup` — hook / ops / runtime / status=active
- `hook.claude.safety-check` — hook / security / auth / status=active
- `hook.claude.vault-post-write` — hook / vault-keeper / knowledge / status=active
- `service.claudeforge` — service / ops / runtime / status=active
- `service.ema-observer` — service / ops / ema / status=active
- `service.opentabs` — service / ops / runtime / status=active
- `service.session-migration` — service / ops / runtime / status=active

## Demote

### P1
- `cron.oauth-auto-approve` — cron / ops / auth / status=dangerous-convenience

