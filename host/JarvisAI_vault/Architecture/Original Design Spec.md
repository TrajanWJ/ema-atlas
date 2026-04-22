# Agent Command Center — Design Spec

> Replace CloudCLI with a full AI agent fleet: OpenClaw + Mission Control running in a hardened KVM VM with XFCE desktop and one-click KDE launcher.

**Date:** 2026-03-12
**Status:** Reviewed (2 review passes, all issues resolved)
**Author:** Trajan + Claude

---

## 1. Goals

1. Remove CloudCLI completely from the workstation
2. Deploy Mission Control (agent orchestration dashboard) in a local KVM VM
3. Deploy OpenClaw (AI assistant, 20+ messaging platforms) in the same VM
4. Harden with Docker security best practices inside the VM boundary
5. Provide a one-click desktop experience from KDE ("Agent Command Center")
6. Enable management of coding agents, messaging bots, and automation agents from a single dashboard

## 2. Non-Goals

- Running anything on a remote VPS (all local)
- Splitting into multiple VMs (single VM, may revisit later)
- Replacing Claude Code CLI on the workstation (this augments it)
- Custom agent framework development (using existing tools)

## 3. Architecture

### 3.1 VM Specification

| Field | Value |
|---|---|
| Hypervisor | KVM/QEMU via virt-manager |
| OS | Ubuntu Server 24.04 LTS + XFCE desktop |
| RAM | 14GB |
| vCPUs | 6 |
| Disk | 60GB qcow2 (thin-provisioned) |
| Network | NAT (virbr0, 192.168.122.0/24) |
| Hostname | agent-vm |

### 3.2 Container Layout

```
┌─────────────────── agent-vm (14GB RAM) ─────────────────┐
│                                                           │
│  XFCE Desktop (SPICE) ── Firefox → localhost:3000        │
│                                                           │
│  ┌─── docker network: agent-net (bridge) ──────────────┐ │
│  │                                                       │ │
│  │  mission-control (:3000)                             │ │
│  │    ├── image: built from builderz-labs/mission-control│ │
│  │    ├── read_only: true                               │ │
│  │    ├── cap_drop: ALL (+NET_BIND_SERVICE)             │ │
│  │    ├── no-new-privileges: true                       │ │
│  │    ├── mem_limit: 1GB                                │ │
│  │    ├── cpus: 1                                       │ │
│  │    ├── pids_limit: 256                               │ │
│  │    ├── volume: mc-data:/app/.data                    │ │
│  │    ├── env_file: .env                                │ │
│  │    └── ports: "192.168.122.10:3000:3000"              │ │
│  │         (bound to VM static IP only)                  │ │
│  │                                                       │ │
│  │  openclaw-gateway (NO published ports)               │ │
│  │    ├── image: built from openclaw/openclaw            │ │
│  │    ├── cap_drop: [NET_RAW, NET_ADMIN]                │ │
│  │    ├── no-new-privileges: true                       │ │
│  │    ├── mem_limit: 4GB                                │ │
│  │    ├── cpus: 3                                       │ │
│  │    ├── volume: oc-workspace:/workspace                │ │
│  │    ├── volume: oc-config:/home/node/.config           │ │
│  │    ├── env_file: .env                                │ │
│  │    ├── networks: [agent-net, sandbox-net]             │ │
│  │    └── NO host filesystem bind mounts                │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─── docker network: sandbox-net (internal, no egress)─┐ │
│  │                                                       │ │
│  │  openclaw-sandbox (spawned dynamically by gateway)   │ │
│  │    ├── mem_limit: 2GB                                │ │
│  │    ├── pids_limit: 128                               │ │
│  │    ├── network: sandbox-net ONLY (no internet)       │ │
│  │    └── isolated from mc-data volume                  │ │
│  │                                                       │ │
│  │  (gateway bridges agent-net ↔ sandbox-net,           │ │
│  │   proxying only approved outbound calls)              │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                           │
│  Named Volumes:                                           │
│    mc-data      — Mission Control SQLite DB               │
│    oc-workspace — OpenClaw working directory               │
│    oc-config    — OpenClaw config + credentials            │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Docker networks:**
- `agent-net` (bridge) — Mission Control + OpenClaw gateway. Has outbound internet for messaging APIs.
- `sandbox-net` (internal: true) — OpenClaw sandboxes only. No direct internet access. Gateway bridges the two networks and proxies only approved outbound calls from sandboxes.

**Port publishing:**
- Mission Control: `192.168.124.10:3000:3000` (host-only interface IP only, not 0.0.0.0)
- OpenClaw gateway: NO published ports. Reachable only via Docker service DNS (`openclaw-gateway:3001`) from containers on `agent-net`. This eliminates the Docker/UFW bypass issue entirely.

### 3.3 RAM Budget

| Component | Allocation |
|---|---|
| Ubuntu Server + XFCE + kernel | ~1.2GB |
| Docker engine | ~0.5GB |
| Mission Control | 1GB limit |
| OpenClaw gateway | 4GB limit |
| OpenClaw sandbox (max 1 concurrent) | 2GB limit |
| **Total committed** | **~8.7GB** |
| **Headroom** | **~5.3GB free** |

**Sandbox concurrency limit:** OpenClaw is configured to run at most 1 sandbox at a time (`MAX_SANDBOXES=1` in `.env`). This prevents memory exhaustion from multiple simultaneous sandboxes. If a second sandbox is requested, it queues until the first completes. This can be raised later if you add more RAM to the VM.

### 3.4 Network & Firewall

**Single network interface:** Use libvirt's default NAT network (`virbr0`, subnet `192.168.122.0/24`). This provides both internet access (for OpenClaw messaging APIs) and host-to-VM connectivity. No need for a second host-only bridge — the host can reach `192.168.122.x` via `virbr0` natively.

**Static IP:** `192.168.122.10` assigned via netplan in the VM (DHCP reservation or static config).

**UFW rules inside VM:**
```
ufw default deny incoming
ufw default allow outgoing
ufw allow from 192.168.122.1 to any port 22    proto tcp
ufw allow from 192.168.122.1 to any port 3000  proto tcp
ufw enable
```

Only the host (`192.168.122.1` = virbr0 gateway) can reach SSH and Mission Control. No other LAN devices can reach the VM.

**Docker port bindings:**
- Mission Control: `192.168.122.10:3000:3000` (VM's static IP, reachable from host only)
- OpenClaw gateway: NO published ports (container-to-container via Docker DNS only)

**Docker/UFW conflict mitigation:** Since OpenClaw gateway publishes no ports, Docker never creates iptables rules for it. Mission Control's port is bound to the VM's static IP (not 0.0.0.0), limiting exposure. Additionally, configure `/etc/docker/daemon.json` with `"iptables": true` (default) but add DOCKER-USER chain rules:
```
iptables -I DOCKER-USER -i enp1s0 -p tcp --dport 3000 -s 192.168.122.1 -j ACCEPT
iptables -I DOCKER-USER -i enp1s0 -p tcp --dport 3000 -j DROP
```

### 3.5 Security Layers

1. **VM boundary** — KVM hardware isolation; VM compromise does not reach workstation
2. **Docker hardening** — read_only, cap_drop, no-new-privileges, PID/memory/CPU limits
3. **Network segmentation** — Two Docker networks: `agent-net` (gateway + MC) and `sandbox-net` (internal, no internet). OpenClaw gateway bridges both. Sandboxes cannot reach the internet directly.
4. **Volume isolation** — OpenClaw cannot access Mission Control data; no host bind mounts
5. **API key management** — `.env` file (chmod 600) on VM, injected via `env_file`. Note: env vars are visible via `docker inspect` and `/proc/1/environ` inside the container. Docker socket access is restricted to root only. For higher security, migrate to Docker secrets (swarm mode) in the future.
6. **UFW + DOCKER-USER chain** — only host IP can reach SSH + Mission Control; OpenClaw has no published ports
7. **Sandbox isolation** — `sandbox-net` is `internal: true` (no outbound internet). Gateway proxies only approved API calls.

### 3.6 Authentication

**Mission Control:**
- First-run setup wizard creates admin user (username + password)
- Session cookie authentication (`__Host-` prefix in secure contexts)
- API key for programmatic access
- Role-based access: viewer, operator, admin
- Transport security relies on VM boundary (no TLS needed for localhost access inside VM; host-to-VM traffic traverses virbr0 which is local to the machine)

**OpenClaw:**
- API keys for Claude, messaging platforms stored in `.env`
- DM pairing disabled by default (`DISABLE_DM_PAIRING=true` in `.env`) to prevent unknown senders from interacting
- Skill installation requires explicit approval through Mission Control's quality gate

## 4. Desktop Experience

### 4.1 Inside VM (XFCE)

**Auto-start on login:**
- Firefox opens `http://localhost:3000` (Mission Control)

**XFCE desktop shortcuts:**
- "Mission Control" -> Firefox to localhost:3000
- "Docker Logs" -> terminal running `docker compose -f /opt/agent-stack/docker-compose.yml logs -f`
- "Restart Stack" -> `docker compose -f /opt/agent-stack/docker-compose.yml restart`
- "Stop Stack" -> `docker compose -f /opt/agent-stack/docker-compose.yml down`

**Firefox bookmark bar:**
- Mission Control: `http://localhost:3000`
- OpenClaw docs: `https://docs.openclaw.ai`

### 4.2 KDE Launcher (Workstation)

**File:** `~/.local/share/applications/agent-command-center.desktop`

**Behavior on click:**
1. Check if VM is running (`virsh domstate agent-vm`)
2. If off -> start it (`virsh start agent-vm`), wait for boot
3. Open `virt-viewer` with SPICE connection to `agent-vm`
4. VM desktop appears as a window on your KDE desktop

**Launcher script:** `~/bin/agent-command-center.sh`
```bash
#!/bin/bash
VM_NAME="agent-vm"
VM_IP="192.168.122.10"

STATE=$(virsh domstate "$VM_NAME" 2>/dev/null)
if [ "$STATE" != "running" ]; then
    virsh start "$VM_NAME" || { notify-send "Agent VM" "Failed to start VM"; exit 1; }
    echo "Waiting for VM to boot..."
    for i in $(seq 1 30); do
        nc -z "$VM_IP" 22 2>/dev/null && break
        sleep 1
    done
    if ! nc -z "$VM_IP" 22 2>/dev/null; then
        notify-send "Agent VM" "VM started but not reachable after 30s"
        exit 1
    fi
fi
virt-viewer --connect qemu:///system "$VM_NAME" &
```

**Icon:** Custom icon (can generate or use a suitable one from your icon theme)

**VM auto-start:** Disabled by default. The VM starts on-demand when you click the launcher. To enable auto-start on host boot: `virsh autostart agent-vm`.

### 4.3 SSH Access (Optional)

`~/.ssh/config` on workstation:
```
Host agent-vm
    HostName 192.168.122.10
    User trajan
    IdentityFile ~/.ssh/id_ed25519
```

## 5. CloudCLI Removal

### 5.1 Services to Stop and Disable

```bash
systemctl --user stop cloudcli
systemctl --user disable cloudcli
systemctl --user stop cloudcli-update.timer
systemctl --user disable cloudcli-update.timer
systemctl --user daemon-reload
```

### 5.2 Files to Remove

| Path | What |
|---|---|
| `~/.config/systemd/user/cloudcli.service` | systemd service |
| `~/.config/systemd/user/cloudcli-update.service` | update service |
| `~/.config/systemd/user/cloudcli-update.timer` | update timer |
| `~/.local/share/applications/cloudcli.desktop` | KDE shortcut |
| `~/claudecodeui/` | Install directory (721MB) |
| `~/.cloudcli-update.log` | Update log |

### 5.3 Vault Updates

| File | Action |
|---|---|
| CloudCLI notes | Archive |
| Stack decisions | Move CloudCLI to "Rejected / Deferred" with reason, add Mission Control + OpenClaw to installed |
| System services | Remove CloudCLI section, add Agent Command Center VM section |
| Port map | Remove port 3001 (CloudCLI), note VM ports |

## 6. Mission Control <-> OpenClaw Integration

**Connection:** Mission Control's gateway configuration points to `ws://openclaw-gateway:3001` (Docker service DNS on agent-net).

**What Mission Control sees:**
- All OpenClaw agent sessions, task queues, skill inventory
- Token usage and cost tracking across all messaging platforms
- Quality gates and approval workflows
- Webhook and cron job management
- Real-time logs via SSE

**What you manage from Mission Control:**
- Start/stop/configure OpenClaw agents
- Kanban task board for agent work
- Schedule recurring agent jobs in natural language
- Monitor security (prompt injection detection, credential scanning)
- Connect additional framework adapters (CrewAI, LangGraph, etc.) later

## 7. Onboarding Flow

1. Create and start VM
2. Install Ubuntu Server 24.04 + XFCE + Docker
3. Clone repos to `/opt/agent-stack/`
4. Configure `.env` with API keys
5. `docker compose up -d` — brings up both services
6. `docker compose exec openclaw-gateway onboard` — OpenClaw interactive setup
7. Open Mission Control at `http://localhost:3000` inside VM
8. Configure Mission Control auth (admin user + API key)
9. Add OpenClaw gateway as a connected agent system
10. Connect messaging platforms through OpenClaw onboarding
11. Set up KDE desktop shortcut on workstation
12. Verify end-to-end: send a message on Telegram -> OpenClaw responds -> Mission Control shows the activity

## 8. Backup & Recovery

**What to back up:**
- `/opt/agent-stack/.env` — API keys and config
- `/opt/agent-stack/docker-compose.yml` — composition
- Docker volumes: `mc-data`, `oc-workspace`, `oc-config`

**How:**
```bash
virsh snapshot-create-as agent-vm "pre-upgrade-$(date +%Y%m%d)"

docker compose -f /opt/agent-stack/docker-compose.yml run --rm \
  -v /backup:/backup alpine tar czf /backup/mc-data.tar.gz -C /data .
```

**Recovery:** Revert to VM snapshot, or recreate from docker-compose + restore volume backups.

### 8.1 Log Rotation

All containers use the `json-file` logging driver with rotation:
```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

This caps total log storage at ~30MB per container. Applied to all services in docker-compose.yml.

## 9. Reference: docker-compose.yml

```yaml
networks:
  agent-net:
    driver: bridge
  sandbox-net:
    driver: bridge
    internal: true

volumes:
  mc-data:
  oc-workspace:
  oc-config:

services:
  mission-control:
    build:
      context: ./mission-control
      dockerfile: Dockerfile
    ports:
      - "192.168.122.10:3000:3000"
    environment:
      - NODE_ENV=production
    env_file: .env
    volumes:
      - mc-data:/app/.data
    networks:
      - agent-net
    depends_on:
      openclaw-gateway:
        condition: service_healthy
    read_only: true
    tmpfs:
      - /tmp:size=100M
      - /app/.next/cache:size=200M
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    mem_limit: 1g
    cpus: 1
    pids_limit: 256
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  docker-socket-proxy:
    image: tecnativa/docker-socket-proxy:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - CONTAINERS=1
      - NETWORKS=1
      - IMAGES=1
      - POST=1
      - LOG_LEVEL=warning
    networks:
      - agent-net
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    mem_limit: 128m
    read_only: true
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  openclaw-gateway:
    build:
      context: ./openclaw
      dockerfile: Dockerfile
    env_file: .env
    environment:
      - MAX_SANDBOXES=1
      - DISABLE_DM_PAIRING=true
      - SANDBOX_NETWORK=sandbox-net
      - DOCKER_HOST=tcp://docker-socket-proxy:2375
    volumes:
      - oc-workspace:/workspace
      - oc-config:/home/node/.config
    networks:
      - agent-net
      - sandbox-net
    depends_on:
      docker-socket-proxy:
        condition: service_started
    cap_drop:
      - NET_RAW
      - NET_ADMIN
    security_opt:
      - no-new-privileges:true
    mem_limit: 4g
    cpus: 3
    pids_limit: 512
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

**Docker socket security:** The gateway does NOT mount the Docker socket directly. Instead, `tecnativa/docker-socket-proxy` provides a filtered TCP proxy that only allows container, network, and image operations — blocking privileged operations like volume mounts to host paths, exec into other containers, or host configuration changes. This contains the blast radius even if OpenClaw is compromised: it can spawn sandboxes but cannot escape to the VM's host filesystem via Docker.

**Service dependencies:** Mission Control depends on openclaw-gateway with `condition: service_healthy`. OpenClaw gateway depends on the docker-socket-proxy.

## 10. Future Expansion

- **Add more framework adapters** — CrewAI, LangGraph, AutoGen via Mission Control
- **Split VMs** — If OpenClaw becomes too risky, migrate it to VM2 (Approach B from brainstorming)
- **Add IronClaw** — Run alongside OpenClaw for security-sensitive tasks
- **Tailscale** — Access Mission Control from phone/tablet outside LAN
- **Automated VM provisioning** — Script the full setup with cloud-init for reproducibility

## See Also

- [[OpenClaw Research]] — detailed OpenClaw evaluation
- [[Mission Control Research]] — detailed Mission Control evaluation
- [[Self-Hosted AI Agent Platforms 2026]] — platform comparison
- [[System Overview]] — JarvisAI system overview

#architecture #design-spec #docker #kvm #jarvisai
