---
title: "Networking"
created: 2026-03-14
updated: 2026-04-17
type: operations
status: active
confidence: 0.80
confidence_updated: 2026-04-17
source: operations
tags: [agent-vm, configuration, networking, ssh]
summary: "Full two-way SSH with passwordless sudo between host and VM."
---
# Networking

## VM Network

| Property | Value |
|---|---|
| Bridge | virbr0 |
| Subnet | 192.168.122.0/24 |
| VM IP | 192.168.122.10 (static, netplan) |
| Host IP | 192.168.122.1 |
| Gateway | 192.168.122.1 (host) |
| DNS | 192.168.122.1, 1.1.1.1 |
| Type | NAT (internet + host access) |

## SSH — Bidirectional Access

Full two-way SSH with passwordless sudo between host and VM.

### Host → VM

| Property | Value |
|---|---|
| Command | `ssh agent-vm` |
| Config | `~/.ssh/config` on host |
| Key | `~/.ssh/id_ed25519` (ed25519, host) |
| User | trajan |
| Sudo | passwordless (NOPASSWD) |

### VM → Host

| Property | Value |
|---|---|
| Command | `ssh host-machine` |
| Config | `~/.ssh/config` on VM |
| Key | `~/.ssh/id_ed25519` (ed25519, VM) |
| Target | 192.168.122.1 (virbr0 gateway) |
| User | trajan |
| Sudo | passwordless (NOPASSWD) |

### SSH Key Fingerprints

| Machine | Key | Fingerprint |
|---|---|---|
| Host (FerrissesWheel) | ed25519 | In VM `~/.ssh/known_hosts` |
| VM (agent-vm) | ed25519 | In Host `~/.ssh/known_hosts` |

### What This Enables

- **[[OpenClaw]] → Host filesystem:** `ssh host-machine 'cat /path/to/file'` or `scp`/`rsync`
- **Host → [[VM management]]:** `ssh agent-vm 'docker ps'`, `ssh agent-vm 'sudo systemctl ...'`
- **Cross-machine automation:** scripts, cron jobs, and agents can operate in both directions
- **Vault sync:** rsync between host vault and VM vault via SSH

## Port Map (verified 2026-04-17)

| Port | Bound To | Service | Accessible From |
|---|---|---|---|
| 22 | 0.0.0.0 | SSH (sshd) | 192.168.122.0/24 (UFW) |
| 3200 | 0.0.0.0 | next-server (Agent OS web) | UFW-restricted to host |
| 6080 | 0.0.0.0 | websockify (noVNC) | UFW-restricted to host |
| 8080 | 127.0.0.1 | antfly (vault search) | Localhost only (Docker) |
| 8090 | 0.0.0.0 | Agent OS demo (python3) | UFW-restricted to host |
| 8091 | 0.0.0.0 | python3 service | UFW-restricted to host |
| 8093 | 0.0.0.0 | Wiki API (node) | UFW-restricted to host |
| 8100 | 0.0.0.0 | mcpo | UFW-restricted to host |
| 8178 | 127.0.0.1 | whisper-server | Localhost only |
| 8180 | 0.0.0.0 | activepieces (Docker) | UFW-restricted to host |
| 8888 | 0.0.0.0 | node service | UFW-restricted to host |
| 8889 | 127.0.0.1 | searxng (Docker) | Localhost only |
| 8899 | 0.0.0.0 | python3 service | UFW-restricted to host |
| 9223 | 127.0.0.1 | lightpanda (browser) | Localhost only |
| 11434 | 127.0.0.1 | ollama | Localhost only |
| 12380 | 127.0.0.1 | antfly admin | Localhost only |
| 18789 | 0.0.0.0 | [[OpenClaw]] Gateway (legacy) | UFW-restricted to host |
| 18790 | 0.0.0.0 | Agent OS Bridge (node) | UFW-restricted to host |
| 56669 | 100.94.125.83 | Tailscale service | Tailscale network only |

**Key point:** UFW restricts inbound to 192.168.122.1 (host). Services binding 0.0.0.0 are still firewalled. Only SSH accepts connections from the full /24 subnet.

## Docker Networks

### Default bridge
- searxng, activepieces stack, antfly connected
- Containers resolve each other by service name

### Historical: agent-net + sandbox-net (Archived)
- ~~agent-net (bridge)~~ — was for OpenClaw-gateway + docker-socket-proxy
- ~~sandbox-net (internal)~~ — was for isolated OpenClaw sandboxes
- These networks are no longer in use since OpenClaw gateway containerization was removed

## UFW Rules (on VM)

```bash
# Default policy
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH from host
sudo ufw allow from 192.168.122.0/24 to any port 22

# Enable
sudo ufw enable
```

## DOCKER-USER iptables Chain

systemd bypasses UFW by default. The DOCKER-USER chain ensures firewall rules are respected:

```bash
# Drop all external access to systemd-published ports except from virbr0 subnet
sudo iptables -I DOCKER-USER -i enp1s0 ! -s 192.168.122.0/24 -j DROP

# Make persistent
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

This ensures that even if a container publishes a port, it's only accessible from the virbr0 subnet (the host).

## How OpenClaw Reaches the Host (Archived)

> [!info] Historical — OpenClaw gateway container is archived
> [[OpenClaw]] now runs as a native systemd service, not in a container. The SSH tunnel pattern below still works for any VM→host communication.

Via SSH using the VM's ed25519 key:

```
VM process → ssh host-machine → full host access as trajan
```

This allows VM agents to:
- Read/write files on the host (Obsidian vault, project dirs)
- Run commands on the host with sudo
- Sync data between VM and host

## Related Notes

- [[systemd Stack]] — compose file with network definitions
- [[OpenClaw Config]] — agent configuration and channels
- [[Architecture/System Overview|System Overview]] — architecture diagram
- [[Security/Hardening|Hardening]] — network-level security measures
- [[Operations/VM Management|VM Management]] — VM network configuration

#agent-vm #configuration #networking #ssh


- [[Docker Stack]]
- [[project_obsidian_vault]]
## Shared Folder Sync

Bidirectional rsync between `~/shared/` on both machines.

| Property | Value |
|---|---|
| Timer | `bridge-sync.timer` (systemd, 60s interval) |
| Script | `~/bin/bridge-sync.sh` |
| Direction | Bidirectional (host→VM, then VM→host) |
| Flags | `--update --delay-updates` |
| Health check | `~/shared/.heartbeat` (stale if >120s) |
| Logs | `~/shared/sync.log` |

### Folder Structure

| Directory | Who Writes | Purpose |
|---|---|---|
| `inbox-host/` | VM only | Drop files for host to pick up |
| `inbox-vm/` | Host only | Drop files for VM to pick up |
| `reports/` | Both (own prefix) | Completed work products |
| `tasks/` | Both (own prefix) | Structured task files |
| `archive/` | Both | Processed inbox files |

### Management

```bash
# Check status
systemctl status bridge-sync.timer

# Manual sync
~/bin/bridge-sync.sh

# Check health
cat ~/shared/.heartbeat
```
