---
title: Networking
created: '2026-03-14'
updated: '2026-03-16'
type: playbook
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: operations
tags:
  - agent-vm
  - configuration
  - networking
  - ssh
summary: Full two-way SSH with passwordless sudo between host and VM.
wiki_id: operations/Networking
imported_from: vault/Operations/Networking.md
imported_at: '2026-04-04T00:23:56.840Z'
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

## Port Map

| Port | Bound To | Service | Accessible From |
|---|---|---|---|
| 22 | VM host | SSH (sshd) | 192.168.122.0/24 (UFW) |
| 22 | Host | SSH (sshd) | VM + local |
| 18789 | container only | [[OpenClaw]] Gateway | Other containers on agent-net |
| 2375 | container only | systemd Socket Proxy | Other containers on agent-net |

**Key point:** No systemd ports are published outside containers. [[OpenClaw]] and the socket proxy have no host-level port bindings. SSH is the only externally accessible service.

## systemd Networks

### agent-net (bridge)
- Standard systemd bridge network
- [[OpenClaw]]-gateway and docker-socket-proxy connected
- Containers resolve each other by service name (systemd DNS)

### sandbox-net (internal)
- `internal: true` — no gateway, no internet access
- Only [[OpenClaw]]-gateway and spawned sandbox containers are connected
- Sandboxes can communicate with [[OpenClaw]] but cannot reach the internet or agent-net services

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

## How OpenClaw Reaches systemd

[[OpenClaw]] manages sandbox containers through the systemd Socket Proxy:

```
OpenClaw → tcp://docker-socket-proxy:2375 (DOCKER_HOST env var)
```

The proxy filters API calls — only container, network, and image operations are permitted.

## How OpenClaw Reaches the Host

Via SSH reverse tunnel using the VM's ed25519 key:

```
OpenClaw (in container or via exec) → ssh host-machine → full host access as trajan
```

This allows [[OpenClaw]] agents to:
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
