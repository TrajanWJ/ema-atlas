# Setup Log

Chronological record of JarvisAI infrastructure setup.

---

## 2026-03-12

### Project Created

- Created `/home/trajan/Desktop/JarvisAI/` project directory
- Removed CloudCLI (previous approach)
- Installed KVM/QEMU on workstation (`libvirt`, `virt-manager`, `qemu-kvm`)
- Set up polkit rule for passwordless VM management

### VM Created

- Downloaded Ubuntu 24.04 cloud image
- Created cloud-init configuration (user-data, meta-data, network-config)
- Generated cloud-init ISO
- Created `agent-vm` via `vm-create.sh`:
  - 14 GB RAM, 6 vCPUs
  - Static IP 192.168.122.10 via netplan
  - XFCE desktop environment
  - Docker Engine installed via cloud-init
  - lightdm configured for autologin

### Docker Stack Deployed

- Created docker-compose.yml with three services:
  - **Mission Control** — orchestration dashboard on port 3000
  - **OpenClaw Gateway** — AI agent gateway on port 18789 (internal)
  - **Docker Socket Proxy** — filtered Docker API access on port 2375 (internal)
- Configured networks: agent-net (bridge), sandbox-net (internal)
- Configured volumes: mc-data, oc-workspace, oc-config
- Applied security hardening: read_only, cap_drop, no-new-privileges, resource limits
- Created .env with API keys and auth credentials

### Fixes Applied

- **Display:** Changed from QXL to virtio-gpu — QXL caused rendering issues with XFCE
- **Autologin:** Configured lightdm autologin for agent-vm user — skip password screen since VM boundary is the security layer
- **Desktop launcher:** Created `~/bin/agent-command-center.sh` on workstation — starts VM + opens virt-viewer

---

## 2026-03-13

### Desktop Launcher

- Desktop launcher (`agent-command-center.sh`) working with splash screen
- Launcher starts agent-vm if not running, waits for boot, opens virt-viewer
- Created Obsidian vault at `/home/trajan/Desktop/JarvisAI/vault/` for project documentation

---

## Related Notes

- [[Architecture/System Overview\|System Overview]] — current architecture
- [[Architecture/Design Decisions\|Design Decisions]] — rationale for choices made
- [[Operations/VM Management\|VM Management]] — VM configuration details

#jarvisai #logs #setup
