# High-Risk Automation Policy

## Purpose

This policy exists for automations that can do meaningful damage, hide state changes, or create hard-to-explain behavior.

In this environment, high-risk automation usually means one or more of:
- touches credentials
- mutates config
- self-heals by changing state automatically
- triggers external effects
- performs browser-coupled approval flows
- repairs systems with AI assistance

---

## High-risk categories

### 1. Credential-touching automation
Examples:
- OAuth sync
- credential watchers
- token refresh/sync jobs
- browser OAuth auto-approval

Rules:
- there must be a declared primary path
- compatibility glue must be labeled as such
- dangerous convenience flows must never become normal-path dependencies

### 2. Config-mutating automation
Examples:
- doctor/fix loops
- recovery scripts that rewrite config or restore backups

Rules:
- must be explicitly documented in registry
- should log before/after actions clearly
- should be reviewed with extra care before modification

### 3. Self-healing controllers
Examples:
- gateway watchdogs that restart, repair, or invoke AI fixes

Rules:
- treat as controllers, not just watchdogs
- require explicit ownership
- document triggers, cooldowns, and fallback behavior

### 4. External-effect automations
Examples:
- jobs that post outward, sync across machines, query external systems, or publish results

Rules:
- declare external dependencies
- document failure behavior when remote systems are absent
- avoid hidden assumptions about tunnels, logins, or browser state

---

## Review expectations

For any high-risk automation change, review:
- owner
- domain
- trigger model
- what it reads
- what it writes
- whether it touches credentials/config
- whether it has external effects
- what fallback path exists if it fails

---

## Registry expectations

High-risk entries in the registry should include:
- `risk`
- `status`
- `related`
- `touchesCredentials`
- `touchesConfig`
- `writesSensitive`
- `requiresNetwork`
- a short `notes` field explaining why it matters

---

## Current examples to treat carefully

- `cron.gateway-watchdog`
- `cron.oauth-auto-approve`
- `cron.host-oauth-sync`
- `service.oauth-credentials-watcher`
- `cron.integrity-scan-fix`
- `cron.auto-resume`
- `service.openclaw-gateway`

---

## Bottom line

If an automation can silently mutate trust, auth, config, or recovery behavior, it is not “just a cron job.”
Treat it like infrastructure code with a blast radius.
