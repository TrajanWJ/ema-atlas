---
title: "VM Management"
created: 2026-03-14
updated: 2026-04-16
type: operations
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: operations
tags: [agent-vm, operations, vm]
summary: "VM lifecycle, snapshots, and service management for agent-vm"
---
# VM Management

## virsh Commands

```bash
# Lifecycle
virsh start agent-vm
virsh shutdown agent-vm          # graceful ACPI shutdown
virsh destroy agent-vm           # force kill (like pulling power)
virsh reboot agent-vm

# Status
virsh domstate agent-vm
virsh dominfo agent-vm           # RAM, vCPUs, etc.
virsh domblklist agent-vm        # attached disks

# Console/display
virt-viewer agent-vm &           # graphical console
virsh console agent-vm           # serial console (if configured)
```

## Snapshots

```bash
# Create named snapshot
virsh snapshot-create-as agent-vm "snapshot-name" "Description"

# List all snapshots
virsh snapshot-list agent-vm

# Show snapshot details
virsh snapshot-info agent-vm "snapshot-name"

# Revert to snapshot (VM must be off or snapshot must be internal)
virsh snapshot-revert agent-vm "snapshot-name"

# Delete snapshot
virsh snapshot-delete agent-vm "snapshot-name"
```

**Recommended snapshot points:**
- Before upgrading [[OpenClaw]]
- Before connecting a new messaging platform
- After confirming a stable configuration

## Services on VM

> **Updated 2026-04-16:** OpenClaw gateway is archived/disabled. See [[Hardening]] for current verified stack.

| Service | Type | Status |
|---|---|---|
| `openclaw-gateway.service` | systemd | ~~Active~~ **Archived/Disabled** |
| `oauth-guardian.service` | systemd | ~~Active~~ **Status unknown — verify** |
| `bridge-sync.timer` | systemd timer | **Status unknown — verify** |
| QMD reindex | cron | Every 30 min (likely still active) |
| SearXNG | docker compose | Running (search proxy) |
| Activepieces + Redis + Postgres | docker compose | Running (workflow automation) |
| Antfly | docker compose | Running (vault search/embedding) |

## Desktop Launcher

The workstation has a launcher script for quick VM access:

```
~/bin/agent-command-center.sh
```

This script:
1. Starts agent-vm if not running
2. Shows a splash screen while VM boots
3. Opens virt-viewer to the VM desktop

## Polkit Rule

Passwordless VM management is configured via a polkit rule, allowing the workstation user to run virsh commands without sudo:

```
/etc/polkit-1/rules.d/50-libvirt.rules
```

## Static IP Configuration

The VM gets its static IP (192.168.122.10) via netplan:

```yaml
# /etc/netplan/50-cloud-init.yaml
network:
  version: 2
  ethernets:
    enp1s0:
      addresses:
        - 192.168.122.10/24
      gateway4: 192.168.122.1
      nameservers:
        addresses:
          - 192.168.122.1
          - 1.1.1.1
```

## Cloud-init Configuration

Source files on the workstation:

```
~/Desktop/agent-vm/cloud-init/
├── meta-data        # instance-id, hostname
├── network-config   # static IP assignment
└── user-data        # packages, users, setup
```

## VM Creation Script

```bash
~/Desktop/agent-vm/vm-create.sh
```

Creates the VM using virt-install with the cloud image and cloud-init ISO.

## Related Notes

- [[Operations/Quick Reference|Quick Reference]] — common commands cheat sheet
- [[Architecture/System Overview]] — VM specs and architecture

#agent-vm #operations #vm
- [[project_obsidian_vault]]
