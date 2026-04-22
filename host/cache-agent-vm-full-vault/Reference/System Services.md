---
title: "System Services"
created: 2026-03-14
updated: 2026-03-16
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: reference
tags: [cron, services, system, systemd]
summary: "Keeps the vault searchable via hybrid BM25 + vector embeddings."
---
# System Services

> Background services, timers, and cron jobs that keep the system running.

---

## QMD (Semantic Search Index)

Keeps the vault searchable via hybrid BM25 + vector embeddings.

| Field | Value |
|---|---|
| **Binary** | `/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd` |
| **Version** | 2.0.1 (179d450) |
| **Database** | SQLite (local) |
| **Embeddings** | ONNX runtime (local, no API calls) |

### Cron Job

```cron
*/30 * * * * /home/trajan/.nvm/versions/node/v22.22.1/bin/qmd update --quiet && /home/trajan/.nvm/versions/node/v22.22.1/bin/qmd embed --quiet 2>/dev/null
```

Runs every 30 minutes:
1. `qmd update` — scans vault for new/changed files
2. `qmd embed` — generates vector embeddings for new content

### Manual Commands

```bash
# Force reindex
/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd update
/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd embed

# Search
/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd search "query here"
```

### Troubleshooting

```bash
# Verify cron is registered
crontab -l | grep qmd

# Run manually to see errors (without --quiet)
/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd update
/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd embed

# Check if QMD MCP responds (via Claude Code)
# Use the qmd query tool — if it returns results, it's working
```

---

## CodeGraphContext (FalkorDB)

Graph database for code structure analysis.

| Field | Value |
|---|---|
| **Binary** | `/home/trajan/.local/bin/cgc` |
| **Database** | `/home/trajan/.codegraphcontext/falkordb.db` |
| **Socket** | `/home/trajan/.codegraphcontext/falkordb.sock` |
| **Logs** | `/home/trajan/.codegraphcontext/logs/cgc.log` |
| **Disk usage** | 1.5 MB |

Runs as MCP server — started on demand by Claude Code, not a background service.

### Troubleshooting

```bash
# Check binary exists
ls -la /home/trajan/.local/bin/cgc

# Check logs
cat /home/trajan/.codegraphcontext/logs/cgc.log | tail -20

# Database size
du -sh /home/trajan/.codegraphcontext/
```

---

## OpenClaw Gateway (Native)

Runs [[OpenClaw]] gateway directly on the VM (no Docker). Auth synced from Claude Code OAuth via cron.

| Field | Value |
|---|---|
| **Service** | `openclaw-gateway.service` (systemd) |
| **Port** | 18789 |
| **Binary** | `/usr/bin/openclaw gateway --bind lan` |
| **Config** | `~/.openclaw/openclaw.json` |
| **Auth** | `~/.openclaw/agents/main/agent/auth-profiles.json` |
| **Status** | Enabled, auto-start on boot |
| **Channels** | Telegram + Discord |

```bash
sudo systemctl status openclaw-gateway
sudo systemctl restart openclaw-gateway
openclaw status          # full health check
openclaw agent --agent main --message "test"
```

### Token Refresh Cron

```cron
*/30 * * * * /home/trajan/bin/refresh-claude-token.sh
```

Syncs Claude Code OAuth token → [[OpenClaw]] auth-profiles every 30 min. If Claude Code auth expires, run `claude /login` on the VM.

## Claude Max Proxy (DEPRECATED)

Replaced by native [[OpenClaw]] gateway. Previously routed API calls through Claude Code auth but dropped tool_use blocks causing "terminated" errors. Service disabled.

```bash
# Was: sudo systemctl status claude-max-proxy
# Now disabled — use openclaw-gateway.service instead
```

---

## Other User Services

Notable user-level systemd services:

| Service | Status | What |
|---|---|---|
| `combine-sink-watcher.service` | active | Auto-creates combined audio sink when AirPods connect |

User timers:

| Timer | Interval | What |
|---|---|---|
| `launchpadlib-cache-clean.timer` | Daily | Cleans launchpad cache |

---

## agent-vm (Agent Command Center)

KVM virtual machine running the agent orchestration stack.

| Field | Value |
|---|---|
| **VM Name** | agent-vm |
| **IP** | 192.168.122.10 |
| **RAM** | 14 GB |
| **vCPUs** | 6 |

### Services (on VM)

| Service | Port | Notes |
|---|---|---|
| [[OpenClaw]] Gateway | 18789 | Native (systemd), LAN-bound |
| OAuth Guardian v4 | — | Auto token refresh (systemd) |
| Bridge Sync | — | rsync to host every 60s (systemd timer) |
| [[Laminar]] | 5667, 8000-8002 | Observability (Docker compose) |

### KDE Launcher

Desktop shortcut runs `~/bin/agent-command-center.sh`

### Commands

```bash
# VM management
virsh start agent-vm
virsh stop agent-vm

# SSH access
ssh agent-vm

# GUI console
virt-viewer agent-vm
```

---

## Port Map

| Service | Port | Protocol | Always Running |
|---|---|---|---|
| [[OpenClaw]]-gateway | 18789 | WebSocket | Always (systemd) |
| obsidian-claude-code-mcp | 22360 | WebSocket + SSE | When Obsidian is open |
| QMD MCP | Dynamic | HTTP | On demand (Claude starts it) |
| CodeGraphContext MCP | Dynamic | stdio | On demand (Claude starts it) |

#system #services #systemd #cron

## Related

- [[Claude Usage Gated Cron]]
- [[project_obsidian_vault]]
