# Quick Reference

## URLs

| Service | URL |
|---|---|
| Mission Control (from workstation) | http://192.168.122.10:3000 |
| Mission Control (inside VM) | http://localhost:3000 |

## SSH Access

```bash
ssh agent-vm
```

## VM Lifecycle

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

## Docker Compose (run on VM)

All commands from `/opt/jarvis` on the VM:

```bash
# Start all containers
docker compose up -d

# Stop all containers
docker compose down

# View logs (follow)
docker compose logs -f

# View logs for one service
docker compose logs -f mission-control
docker compose logs -f openclaw-gateway
docker compose logs -f docker-socket-proxy

# Check container status
docker compose ps

# Restart a single service
docker compose restart mission-control

# Rebuild after code changes
docker compose build && docker compose up -d
```

## From Workstation (one-liners)

```bash
# Start VM + follow logs
virsh start agent-vm && sleep 10 && ssh agent-vm 'cd /opt/jarvis && docker compose logs -f'

# Check what's running
ssh agent-vm 'cd /opt/jarvis && docker compose ps'

# Quick restart
ssh agent-vm 'cd /opt/jarvis && docker compose restart'
```

## VM Snapshots

```bash
# Create a snapshot (before risky changes)
virsh snapshot-create-as agent-vm "before-change" "Description of state"

# List snapshots
virsh snapshot-list agent-vm

# Revert to snapshot
virsh snapshot-revert agent-vm "before-change"

# Delete a snapshot
virsh snapshot-delete agent-vm "before-change"
```

## Common Troubleshooting

### Container won't start
```bash
# Check logs for the failing container
docker compose logs openclaw-gateway --tail 50

# Check if port is already in use
ss -tlnp | grep 3000

# Rebuild from scratch
docker compose down && docker compose build --no-cache && docker compose up -d
```

### Can't reach Mission Control from workstation
```bash
# Check VM is running
virsh domstate agent-vm

# Check VM IP
ssh agent-vm 'ip addr show enp1s0'

# Check container is running and healthy
ssh agent-vm 'cd /opt/jarvis && docker compose ps mission-control'

# Check UFW isn't blocking
ssh agent-vm 'sudo ufw status'
```

### OpenClaw unhealthy
```bash
# Check health status
docker compose ps openclaw-gateway

# Check if socket proxy is running
docker compose ps docker-socket-proxy

# Restart the stack in order
docker compose restart docker-socket-proxy
sleep 5
docker compose restart openclaw-gateway
```

## Related Notes

- [[VM Management]] — detailed virsh commands and VM configuration
- [[Configuration/Docker Stack\|Docker Stack]] — full compose file
- [[Configuration/Networking\|Networking]] — network and firewall details

#jarvisai #operations #quickref
