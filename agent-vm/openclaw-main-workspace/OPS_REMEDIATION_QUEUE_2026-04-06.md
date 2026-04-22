# Ops Remediation Queue — 2026-04-06

Registry-driven queue for ops-owned automation review/action.

## P1

- `cron.oauth-auto-approve` — decision=demote · risk=critical · status=dangerous-convenience [credentials, sensitive, network]
  - note: Browser-coupled auth automation; should not be normal-path dependency.
  - related: `service.oauth-credentials-watcher`, `cron.host-oauth-sync`
- `cron.auto-resume` — decision=review · risk=high · status=active [sensitive]
- `cron.dispatch-engine` — decision=review · risk=high · status=active [sensitive]
- `cron.host-oauth-sync` — decision=review · risk=high · status=compatibility [credentials, sensitive]
  - note: Conditional canonical only if host→VM credential borrowing remains intentional.
  - related: `service.oauth-credentials-watcher`, `cron.oauth-auto-approve`
- `cron.integrity-scan-fix` — decision=review · risk=high · status=active [sensitive]
- `service.openclaw-gateway` — decision=review · risk=high · status=active [config, sensitive, network]
- `service.oauth-credentials-watcher` — decision=keep · risk=high · status=canonical [credentials, sensitive]
  - note: Primary local auth sync trigger; preferred source of truth in auth overlap cluster.
  - related: `cron.host-oauth-sync`, `cron.oauth-auto-approve`

## P2

- `cron.dispatch-schedule-loader` — decision=keep · risk=medium · status=canonical
  - note: Primary structured dispatch feeder.
  - related: `cron.signal-to-queue`, `cron.proactive-task-generator`
- `cron.gateway-watchdog` — decision=keep · risk=medium · status=high-risk-canonical [config, sensitive]
  - note: Self-healing gateway recovery controller with config mutation and AI-assisted repair behavior.
  - related: `cron.session-watchdog`, `cron.system-watchdog`
- `cron.session-watchdog` — decision=keep · risk=medium · status=canonical
  - note: Post-restart resume notifier, not a general watchdog.
  - related: `cron.gateway-watchdog`, `cron.system-watchdog`
- `cron.signal-to-queue` — decision=keep · risk=medium · status=canonical
  - note: Condition/signal-based dispatch feeder.
  - related: `cron.dispatch-schedule-loader`, `cron.proactive-task-generator`
- `cron.system-watchdog` — decision=keep · risk=medium · status=canonical
  - note: System alerting/remediation layer, broader than gateway recovery.
  - related: `cron.gateway-watchdog`, `cron.session-watchdog`

## P3

- `cron.agent-learning-sync.log` — decision=review · risk=medium · status=active
- `cron.auto-resume.log` — decision=review · risk=medium · status=active
- `cron.cron-backup.txt` — decision=review · risk=low · status=active
- `cron.cron-restore.log` — decision=review · risk=medium · status=active
- `cron.desk-dispatch.log` — decision=review · risk=medium · status=active
- `cron.dispatch-engine.log` — decision=review · risk=medium · status=active
- `cron.dispatch-heartbeat` — decision=review · risk=medium · status=active
- `cron.dispatch-heartbeat.log` — decision=review · risk=medium · status=active
- `cron.dispatch-schedule.log` — decision=review · risk=medium · status=active
- `cron.evolution-loop.log` — decision=review · risk=medium · status=active
- `cron.gateway-watchdog.log` — decision=review · risk=medium · status=active
- `cron.host-oauth-sync.log` — decision=review · risk=medium · status=active [credentials, sensitive]
- `cron.integrity-scan.log` — decision=review · risk=high · status=active [sensitive]
- `cron.links-pipeline.log` — decision=review · risk=medium · status=active
- `cron.memory-pressure.log` — decision=review · risk=medium · status=active
- `cron.morning-briefing-v2` — decision=review · risk=medium · status=active
- `cron.null` — decision=review · risk=medium · status=active [config, sensitive]
- `cron.oauth-auto-approve.log` — decision=review · risk=high · status=active [credentials, sensitive]
- `cron.overnight-digest.log` — decision=review · risk=medium · status=active
- `cron.proactive-task-generator.log` — decision=review · risk=medium · status=active
- `cron.proposal-cron.log` — decision=review · risk=medium · status=active
- `cron.session-janitor` — decision=review · risk=low · status=active
- `cron.session-janitor.log` — decision=review · risk=low · status=active
- `cron.signal-to-queue.log` — decision=review · risk=medium · status=active
- `cron.stale-task-cleanup` — decision=review · risk=low · status=active
- `cron.stale-task-cleanup.log` — decision=review · risk=low · status=active
- `cron.vault-janitor.log` — decision=review · risk=low · status=active
- `cron.watchdog.log` — decision=review · risk=medium · status=active
- `hook.claude.on-startup` — decision=review · risk=medium · status=active
- `service.claudeforge` — decision=review · risk=medium · status=active
- `service.ema-observer` — decision=review · risk=medium · status=active [network]
- `service.opentabs` — decision=review · risk=medium · status=active
- `service.session-migration` — decision=review · risk=medium · status=active
- `hook.claude.on-clear` — decision=keep · risk=low · status=active
- `hook.claude.tool-use-trace` — decision=keep · risk=low · status=active

