---
title: "Threat Model"
created: 2026-03-14
updated: 2026-03-16
type: security
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: security
tags: [agent-vm, security, threat-model]
summary: "The VM boundary is the primary security perimeter. Everything inside the VM is considered less trusted than the host."
---
# Threat Model

## What's Protected

| Asset | Location | Why It Matters |
|---|---|---|
| Workstation filesystem | Host machine | Personal files, source code, other projects |
| SSH keys | ~/.ssh on host | Access to remote servers, GitHub, etc. |
| Credentials & API keys | Various host locations | Cloud accounts, services, financial data |
| Other VMs/containers | Host hypervisor | Isolation between different workloads |

The VM boundary is the primary security perimeter. Everything inside the VM is considered "less trusted" than the host.

## Attack Surface

### 1. OpenClaw Skills (Untrusted Code)

**Threat:** A malicious or compromised skill executes arbitrary code inside the [[OpenClaw]] container or sandbox.

**Mitigations:**
- Skills execute in sandbox containers on internal network (no internet)
- MAX_SANDBOXES=1 limits blast radius
- systemd Socket Proxy prevents container escape
- [[OpenClaw]] container has cap_drop NET_RAW/NET_ADMIN
- Manual review before installing community skills
- Pin skill versions

### 2. Messaging Platform Connections

**Threat:** An attacker sends crafted messages through a connected platform (Telegram, Discord, etc.) to exploit [[OpenClaw]] parsing or skill execution.

**Mitigations:**
- DISABLE_DM_PAIRING prevents unauthorized bot pairing
- Platform bot tokens stored in .env on VM, not on host
- [[OpenClaw]] container memory-limited to 4GB, PID-limited to 512
- Sandbox isolation for code execution
- Platform-specific rate limiting

### 3. systemd Socket

**Threat:** A compromised [[OpenClaw]] container uses systemd API access to escape to the host (e.g., creating a privileged container with host mounts).

**Mitigations:**
- systemd Socket Proxy (Tecnativa) filters API calls
- Volume operations blocked — cannot mount host paths
- Exec operations blocked — cannot exec into other containers
- Socket mounted read-only into proxy
- Proxy itself has cap_drop ALL, read_only, no-new-privileges

### 4. Network-Based Attacks

**Threat:** An attacker on the virbr0 network or a compromised container attempts lateral movement.

**Mitigations:**
- UFW on VM: only port 22 from 192.168.122.0/24
- DOCKER-USER iptables chain prevents systemd from bypassing UFW
- sandbox-net is internal (no gateway)
- virbr0 is NAT — VM not accessible from broader LAN

### 5. Supply Chain (OpenClaw Updates)

**Threat:** A compromised [[OpenClaw]] release or skill package introduces malware (see ClawHavoc incident).

**Mitigations:**
- VM boundary contains blast radius
- Snapshot before upgrades — instant rollback
- Review changelogs before updating
- Don't auto-update [[OpenClaw]] or skills
- Monitor for CVE announcements

## Incident Response

### If a container is compromised:

```bash
# 1. Stop the compromised container
ssh agent-vm 'cd /opt/jarvis && docker compose stop openclaw-gateway'

# 2. Check what happened
ssh agent-vm 'cd /opt/jarvis && docker compose logs openclaw-gateway --tail 200'

# 3. Check if other containers are affected
ssh agent-vm 'cd /opt/jarvis && docker compose ps'
ssh agent-vm 'docker ps -a'  # look for unexpected containers

# 4. If in doubt, stop everything
ssh agent-vm 'cd /opt/jarvis && docker compose down'
```

### If the VM is compromised:

```bash
# 1. Kill the VM immediately
virsh destroy agent-vm

# 2. Snapshot the disk for forensics (optional)
cp ~/Desktop/agent-vm/agent-vm.qcow2 ~/Desktop/agent-vm/agent-vm-forensics.qcow2

# 3. Revert to last known-good snapshot
virsh snapshot-revert agent-vm "last-good-snapshot"

# 4. Or rebuild from scratch
# - Rotate all API keys and tokens first
# - Re-run vm-create.sh with fresh cloud image
# - Redeploy docker stack
# - Re-onboard messaging platforms with new tokens
```

### After any incident:

1. **Rotate credentials** — ANTHROPIC_API_KEY, platform bot tokens
2. **Check host** — verify no unexpected processes, SSH connections, or file changes
3. **Update .env** — new credentials on the rebuilt/reverted VM
4. **Document** — add to [[Logs/Setup Log|Setup Log]] with timeline and root cause

## Related Notes

- [[Hardening]] — detailed security controls
- [[Architecture/Design Decisions|Design Decisions]] — DD-002 ([[OpenClaw]] risk), DD-003 (socket proxy)
- [[Agents/OpenClaw|OpenClaw]] — platform details and known vulnerabilities

#agent-vm #security #threat-model
- [[project_obsidian_vault]]
