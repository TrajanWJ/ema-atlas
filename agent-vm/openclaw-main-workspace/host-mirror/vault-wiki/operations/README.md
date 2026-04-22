---
title: README
created: '2026-03-16'
updated: '2026-03-16'
type: playbook
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: operations
tags:
  - docker
  - evolution
  - knowledge
  - mcp
  - openclaw
  - ops
summary: Operational documentation for agent-vm systems and services.
wiki_id: operations/README
imported_from: vault/Operations/README.md
imported_at: '2026-04-04T00:23:56.854Z'
---
# Operations

Operational documentation for agent-vm systems and services.

## Services
| Service | Manager | Health Check |
|---|---|---|
| [[OpenClaw]] Gateway | systemd (`openclaw-gateway`) | `openclaw status` |
| OAuth Guardian v4 | systemd (`oauth-guardian`) | `tail /var/log/oauth-guardian.log` |
| [[Claude Code Bot]] | systemd (`claude-code-bot`) | `systemctl status claude-code-bot` |
| Bridge Sync | systemd timer (`bridge-sync.timer`) | `cat ~/shared/.heartbeat` |
| QMD (vault search) | cron (every 30min) | `qmd search test` |
| Ontology Sync | cron (every 3h) | `/tmp/ontology-sync.log` |
| System Watchdog | cron (every 5min) | `/tmp/watchdog.log` |
| Gateway Watchdog | cron (every 2min) | `/var/log/gateway-watchdog.log` |
| Evolution Loop | cron (every 6h) | `/tmp/evolution-loop.log` |
| Message Harvester | cron (every 2h) | `/tmp/message-harvester.log` |
| Session Janitor | cron (daily 4AM) | `~/logs/session-janitor.log` |

## Key Paths
- Logs: `/var/log/` (oauth, gateway-watchdog), `/tmp/` (cron logs), `~/logs/` (janitor, autocommit)
- Config: `~/.openclaw/config.yaml`
- Credentials: `~/.claude/.credentials.json`
- Cron backup: `vault/System/cron-backup.txt`

## Runbooks
- **Auth failure:** Check guardian → restart oauth-guardian → if persists, run auto-login
- **Gateway down:** Watchdog auto-restarts within 2min. Manual: `sudo systemctl restart openclaw-gateway`
- **High load:** Check `ps aux --sort=-%cpu | head -5`, kill stuck processes (Firefox oauth, stale claude sessions)
- **Disk full:** Check `/tmp/` for log accumulation, `docker system prune`, clear old session data

## Related
- [[System Overview]]
- [[Discord Server Map]]
- [[Overnight Summary 2026-03-14]]
