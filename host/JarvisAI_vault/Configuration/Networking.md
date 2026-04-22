# Networking

## VM Network

| Property | Value |
|---|---|
| Bridge | virbr0 |
| Subnet | 192.168.122.0/24 |
| VM IP | 192.168.122.10 (static, netplan) |
| Gateway | 192.168.122.1 (host) |
| DNS | 192.168.122.1, 1.1.1.1 |
| Type | NAT (internet + host access) |

## Port Map

| Port | Bound To | Service | Accessible From |
|---|---|---|---|
| 3000 | 192.168.122.10 | Mission Control | Workstation browser |
| 18789 | container only | OpenClaw Gateway | Other containers on agent-net |
| 2375 | container only | Docker Socket Proxy | Other containers on agent-net |

**Key point:** Only Mission Control port 3000 is published outside Docker. OpenClaw and the socket proxy have no host-level port bindings.

## Docker Networks

### agent-net (bridge)
- Standard Docker bridge network
- All three services connected
- Containers resolve each other by service name (Docker DNS)
- Example: Mission Control reaches OpenClaw at `openclaw-gateway:18789`

### sandbox-net (internal)
- `internal: true` — no gateway, no internet access
- Only openclaw-gateway and spawned sandbox containers are connected
- Sandboxes can communicate with OpenClaw but cannot reach the internet or agent-net services

## UFW Rules (on VM)

```bash
# Default policy
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH from host
sudo ufw allow from 192.168.122.0/24 to any port 22

# Allow Mission Control from host
sudo ufw allow from 192.168.122.0/24 to any port 3000

# Enable
sudo ufw enable
```

## DOCKER-USER iptables Chain

Docker bypasses UFW by default. The DOCKER-USER chain ensures firewall rules are respected:

```bash
# Drop all external access to Docker-published ports except from virbr0 subnet
sudo iptables -I DOCKER-USER -i enp1s0 ! -s 192.168.122.0/24 -j DROP

# Make persistent
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

This ensures that even if a container publishes a port, it's only accessible from the virbr0 subnet (the host).

## How Mission Control Reaches OpenClaw

Mission Control communicates with OpenClaw over the Docker bridge network (agent-net):

```
Mission Control → openclaw-gateway:18789 (Docker DNS resolution)
```

No host networking or published ports needed. Docker's built-in DNS resolves service names to container IPs within the same network.

## How OpenClaw Reaches Docker

OpenClaw manages sandbox containers through the Docker Socket Proxy:

```
OpenClaw → tcp://docker-socket-proxy:2375 (DOCKER_HOST env var)
```

The proxy filters API calls — only container, network, and image operations are permitted.

## Related Notes

- [[Docker Stack]] — compose file with network definitions
- [[Architecture/System Overview\|System Overview]] — architecture diagram
- [[Security/Hardening\|Hardening]] — network-level security measures
- [[Operations/VM Management\|VM Management]] — VM network configuration

#jarvisai #configuration #networking
