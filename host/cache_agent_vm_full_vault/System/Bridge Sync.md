---
type: reference
domain: system-ops
confidence: 0.95
source: agent:vault-keeper
summary: "Bidirectional rsync bridge between agent-vm and host via ~/shared/, runs every 60s via systemd timer"
created: 2026-03-18
updated: 2026-03-18
aliases: [bridge-sync, shared folder sync]
title: "Bridge Sync"
status: active
---

# Bridge Sync — VM ↔ Host File Exchange

## Purpose

Bidirectional file synchronization between agent-vm (192.168.122.10) and the host machine (FerrissesWheel) via the `~/shared/` directory. Enables agents on the VM to exchange files, reports, and task artifacts with the host environment.

## Architecture

```
agent-vm:~/shared/ ←──rsync──→ host-machine:~/shared/
                    every 60s
                    via systemd timer
```

### Directory Layout

| Path | Writer | Purpose |
|---|---|---|
| `~/shared/inbox-host/` | VM only | Files for host to pick up |
| `~/shared/inbox-vm/` | Host only | Files for VM to pick up |
| `~/shared/reports/` | Both (prefixed `vm--` / `host--`) | Completed work products |
| `~/shared/tasks/` | Both (prefixed) | Structured task files |
| `~/shared/archive/` | Both | Processed inbox files |

### Naming Convention

All files prefixed with origin: `vm--2026-03-18-summary.md` or `host--task-build.json`.

## Implementation

- **Script:** `~/bin/bridge-sync.sh`
- **Service:** `bridge-sync.service` (Type=oneshot)
- **Timer:** `bridge-sync.timer` — fires every 60s, starts 30s after boot
- **Lock:** `/tmp/bridge-sync.lock` (flock, prevents overlapping runs)

### Sync Order

1. Host → VM (`rsync -avz --update` pull from host)
2. VM → Host (`rsync -avz --update` push to host)

Both use `--delay-updates` for atomic file placement.

## Health Check

```bash
cat ~/shared/.heartbeat    # stale if >120s old
systemctl status bridge-sync.timer
journalctl -u bridge-sync.service --since "1h ago"
```

## Related

- [[Host Machine Deep Crawl]] — host filesystem layout
- [[System Overview]] — overall architecture
