# System Overview

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Workstation (Host)                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  KVM/QEMU — agent-vm (192.168.122.10)                     │ │
│  │  Ubuntu 24.04 • XFCE • 14GB RAM • 6 vCPUs                │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Docker Engine                                       │  │ │
│  │  │                                                      │  │ │
│  │  │  ┌─────────────────┐  agent-net (bridge)             │  │ │
│  │  │  │ Docker Socket   │◄──────────────────────┐         │  │ │
│  │  │  │ Proxy           │                       │         │  │ │
│  │  │  │ :2375 internal  │                       │         │  │ │
│  │  │  └─────────────────┘                       │         │  │ │
│  │  │                                            │         │  │ │
│  │  │  ┌─────────────────┐    ┌─────────────────┐│         │  │ │
│  │  │  │ Mission Control │    │ OpenClaw        ││         │  │ │
│  │  │  │ :3000 → host    │◄──►│ Gateway         ││         │  │ │
│  │  │  │                 │    │ :18789 internal ││         │  │ │
│  │  │  └─────────────────┘    └────────┬────────┘│         │  │ │
│  │  │                                  │         │         │  │ │
│  │  │                        sandbox-net (internal)        │  │ │
│  │  │                                  │         │         │  │ │
│  │  │                         ┌────────┴────────┐│         │  │ │
│  │  │                         │ Sandbox         ││         │  │ │
│  │  │                         │ Containers      ││         │  │ │
│  │  │                         └─────────────────┘│         │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  virbr0 NAT: 192.168.122.0/24                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Table

| Component | Image | Port | Network | Purpose |
|---|---|---|---|---|
| Mission Control | `./mission-control` (local build) | 3000 → host (bound to 192.168.122.10) | agent-net | Orchestration dashboard, 32 feature panels |
| OpenClaw Gateway | `./openclaw` (local build) | 18789 (internal only) | agent-net, sandbox-net | AI gateway — messaging platforms, skills, sandboxes |
| Docker Socket Proxy | `tecnativa/docker-socket-proxy:latest` | 2375 (internal only) | agent-net | Filtered Docker API access for OpenClaw |
| Sandbox Containers | Spawned by OpenClaw | None | sandbox-net (internal) | Isolated code execution |

## VM Specifications

| Property | Value |
|---|---|
| Name | agent-vm |
| IP Address | 192.168.122.10 (static via netplan) |
| RAM | 14 GB |
| vCPUs | 6 |
| OS | Ubuntu 24.04 LTS |
| Desktop | XFCE (lightdm, autologin) |
| Display | virtio-gpu |
| Disk | qcow2 (cloud image) |
| Network | virbr0 (NAT, 192.168.122.0/24) |
| Provisioning | cloud-init |

## Docker Networks

| Network | Driver | Purpose |
|---|---|---|
| agent-net | bridge | Communication between Mission Control, OpenClaw, and Socket Proxy |
| sandbox-net | bridge (internal: true) | Isolated network for OpenClaw sandbox containers — no internet access |

## Named Volumes

| Volume | Mount Point | Purpose |
|---|---|---|
| mc-data | /app/.data | Mission Control SQLite database and persistent state |
| oc-workspace | /workspace | OpenClaw workspace files |
| oc-config | /home/node/.config | OpenClaw configuration and platform credentials |

## Related Notes

- [[Design Decisions]] — rationale for architecture choices
- [[Configuration/Docker Stack\|Docker Stack]] — full compose file and env vars
- [[Configuration/Networking\|Networking]] — network topology and firewall rules
- [[Security/Hardening\|Hardening]] — per-container security settings

#jarvisai #architecture
