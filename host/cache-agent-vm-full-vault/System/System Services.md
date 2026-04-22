# System Services

> Background services, timers, and cron jobs that keep the system running.

---

## QMD (Semantic Search Index)

Keeps the vault searchable via hybrid BM25 + vector embeddings.

| Field | Value |
|---|---|
| **Binary** | `/usr/bin/qmd` (system-installed; also at `/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd`) |
| **Version** | 2.0.1 (179d450) |
| **Database** | SQLite (local) |
| **Embeddings** | ONNX runtime (local, no API calls) |

### Cron Job

```cron
*/30 * * * * cd /home/trajan && flock -n /tmp/qmd.lock timeout 300 bash -c "/usr/bin/qmd update && /usr/bin/qmd embed" 2>&1 | tail -5 >> /tmp/qmd-cron.log
```

Runs every 30 minutes:
1. `qmd update` — scans vault for new/changed files
2. `qmd embed` — generates vector embeddings for new content

### Manual Commands

```bash
# Force reindex
/usr/bin/qmd update
/usr/bin/qmd embed

# Search
/usr/bin/qmd search "query here"
```

### Troubleshooting

```bash
# Verify cron is registered
crontab -l | grep qmd

# Run manually to see errors
/usr/bin/qmd update
/usr/bin/qmd embed

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

## JarvisAI (Agent Command Center)

KVM virtual machine running the agent orchestration stack.

| Field | Value |
|---|---|
| **VM Name** | agent-vm |
| **IP** | 192.168.122.10 |
| **RAM** | 14 GB |
| **vCPUs** | 6 |

### Docker Stack

| Service | Port | Notes |
|---|---|---|
| Mission Control | :3000 | Agent orchestration dashboard |
| OpenClaw | internal | AI assistant (not exposed to host) |
| Docker Socket Proxy | internal | Secure Docker access for containers |

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

## Mission Control — Claude Code (Local)

Standalone Mission Control instance for monitoring local Claude Code sessions.

| Field | Value |
|---|---|
| **Location** | `~/mission-control-claude/` |
| **Service** | `mission-control-claude.service` (systemd user) |
| **Port** | 3011 |
| **URL** | http://127.0.0.1:3011 |
| **Node** | `/home/trajan/.nvm/versions/node/v22.22.1/bin/node` |
| **Database** | SQLite (`~/mission-control-claude/.data/mission-control.db`) |
| **Auth** | admin / see `.env` |
| **Gateway** | None (NEXT_PUBLIC_GATEWAY_OPTIONAL=true) |

Auto-discovers Claude Code sessions from `~/.claude/projects/`. No OpenClaw — Claude Code only.

### Commands

```bash
# Service management
systemctl --user status mission-control-claude
systemctl --user restart mission-control-claude
systemctl --user stop mission-control-claude

# View logs
journalctl --user -u mission-control-claude -f

# API check
curl -s http://127.0.0.1:3011/api/status -H "x-api-key: $(grep ^API_KEY ~/mission-control-claude/.env | cut -d= -f2)"
```

---

## Port Map

| Service | Port | Protocol | Always Running |
|---|---|---|---|
| obsidian-claude-code-mcp | 22360 | WebSocket + SSE | When Obsidian is open |
| QMD MCP | Dynamic | HTTP | On demand (Claude starts it) |
| CodeGraphContext MCP | Dynamic | stdio | On demand (Claude starts it) |
| Mission Control (Claude Code) | 3011 | HTTP | Yes (systemd user) |
| JarvisAI Mission Control | 3000 (VM) | HTTP | When VM running |

#system #services #systemd #cron
