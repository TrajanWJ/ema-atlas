# Bootstrap Runbook

## Purpose

This is the operator-facing bring-up path for this machine.
Use it to verify health, restart core services, and understand what should auto-start.

---

## 60-second health check

Quick status:

```bash
/home/trajan/.openclaw/agents/main/workspace/bootstrap/bootstrap-status.sh
```

Full doctor:

```bash
/home/trajan/.openclaw/agents/main/workspace/bootstrap/bootstrap-doctor.sh
```

Check for:

- OpenClaw status returns normally
- `openclaw-gateway.service` is active
- `oauth-credentials-watcher.service` is active
- `ema-observer.service` is active if frontend is expected online
- MCP baseline parity checks pass
- cron count is nonzero

---

## Core always-on services

These are the default bring-up services:

- `openclaw-gateway.service`
- `oauth-credentials-watcher.service`
- `ema-observer.service`

Additional but non-core:

- `claudeforge.service`
- `opentabs.service` (currently optional / disabled)

---

## Restart core stack

Run:

```bash
/home/trajan/.openclaw/agents/main/workspace/bootstrap/bootstrap-restart.sh
```

This restarts:

- OpenClaw gateway
- OAuth credentials watcher
- EMA observer frontend

---

## Canonical MCP baseline

Canonical reference:

- `bootstrap/mcp-baseline.json`

Current sync helpers:

- `bootstrap/sync-mcp-baseline.py`
- `bootstrap/sync-codex-mcp.py`

Current behavior:

- syncs Claude MCP config from the canonical baseline
- syncs Codex MCP sections into `~/.codex/config.toml`
- keeps both tools aligned to one reference manifest

---

## Logs and state

### OpenClaw
- config: `~/.openclaw/openclaw.json`
- logs: `~/.openclaw/logs/`
- gateway service log target: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`

### systemd user services
Inspect with:

```bash
systemctl --user status <unit>
journalctl --user -u <unit> -n 100 --no-pager
```

### cron
Canonical source is the active user crontab.
Relevant logs are split across `/tmp`, `~/logs`, `/var/log`, and vault/system files depending on job.

---

## Recovery after reboot

Expected path:

1. user session starts
2. systemd user services come up
3. OpenClaw gateway comes up
4. OAuth watcher starts
5. EMA observer starts
6. cron restores / resumes scheduled automation

If behavior is wrong:

1. run bootstrap status script
2. inspect `openclaw status`
3. inspect `systemctl --user status openclaw-gateway.service`
4. inspect active crontab
5. inspect watcher/frontend logs

---

## What still needs follow-up

- security hardening is intentionally deferred in this runbook pass
- Codex MCP should be managed from the same canonical source eventually
- cron ownership should be reviewed before pruning or merging jobs
 be reviewed before pruning or merging jobs
