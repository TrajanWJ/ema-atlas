---
title: "Quick Reference"
created: 2026-03-14
updated: 2026-03-16
type: operations
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: operations
tags: [agent-vm, operations, quickref]
summary: "```bash"
---
# Quick Reference

## SSH Access

```bash
ssh agent-vm          # from workstation to VM
ssh host-machine      # from VM to workstation
```

## VM Lifecycle (run from workstation)

```bash
# Start the VM
virsh start agent-vm

# Stop gracefully
virsh shutdown agent-vm

# Force stop
virsh destroy agent-vm

# Check status
virsh domstate agent-vm

# Open VM display
virt-viewer agent-vm &
```

## OpenClaw Gateway (run on VM)

```bash
# Service management
sudo systemctl status openclaw-gateway
sudo systemctl restart openclaw-gateway
sudo systemctl stop openclaw-gateway

# Health check
openclaw status
openclaw gateway health

# Send test message
openclaw agent --agent main --message "hello"

# Follow logs
journalctl -u openclaw-gateway -f
journalctl -u openclaw-gateway --since "1 hour ago"
```

## Auth & Token Management

```bash
# OAuth Guardian status
sudo systemctl status oauth-guardian

# Manual token refresh
~/bin/refresh-claude-token.sh

# If auth completely breaks
sudo systemctl restart oauth-guardian openclaw-gateway

# If Claude Code auth expired
claude /login
```

## Bridge Sync (VM ↔ Host file exchange)

```bash
# Check sync health
systemctl status bridge-sync.timer
cat ~/shared/.heartbeat

# Shared folder structure
# ~/shared/inbox-host/   — VM drops files for host
# ~/shared/inbox-vm/     — Host drops files for VM
# ~/shared/reports/      — Completed work (vm--/host-- prefix)
```

## Claude Code (from VM)

```bash
# Local work (on VM)
cd /path && claude --permission-mode bypassPermissions --print "task"

# Host work (on workstation)
~/bin/host-claude.sh ~/Desktop/Coding/project "task description"
```

## Vault Tools

```bash
# Semantic search
qmd search "query"

# Reindex vault
qmd update && qmd embed

# Check cron
crontab -l | grep qmd
```

## VM Snapshots (from workstation)

```bash
# Create
virsh snapshot-create-as agent-vm "name" "Description"

# List
virsh snapshot-list agent-vm

# Revert
virsh snapshot-revert agent-vm "name"

# Delete
virsh snapshot-delete agent-vm "name"
```

## Common Troubleshooting

### Gateway won't start
```bash
# Check logs
journalctl -u openclaw-gateway --since "5 min ago"

# Check if port in use
ss -tlnp | grep 18789

# Full restart
sudo systemctl restart openclaw-gateway
```

### Auth broken
```bash
# Check OAuth Guardian logs
tail -20 /var/log/oauth-guardian.log

# Nuclear option
sudo systemctl restart oauth-guardian openclaw-gateway
```

## Related Notes

- [[Operations/VM Management|VM Management]] — virsh commands and VM configuration
- [[Reference/System Services]] — all background services
- [[Architecture/System Overview]] — VM specs and architecture

#agent-vm #operations #quickref
- [[project_obsidian_vault]]
