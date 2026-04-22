# JarvisAI Vault

Local AI agent fleet running in a KVM virtual machine with OpenClaw + Mission Control.

**VM:** agent-vm | **IP:** 192.168.122.10 | **Status:** Active

---

## Sections

| Section | Purpose |
|---|---|
| [[Architecture/System Overview\|System Overview]] | Full system architecture, component diagram, VM specs |
| [[Architecture/Design Decisions\|Design Decisions]] | ADRs and rationale for key choices |
| [[Operations/Quick Reference\|Quick Reference]] | Common commands and URLs |
| [[Operations/VM Management\|VM Management]] | virsh, snapshots, cloud-init, networking |
| [[Configuration/Docker Stack\|Docker Stack]] | docker-compose.yml, env vars, volumes, networks |
| [[Configuration/Networking\|Networking]] | VM network, UFW, iptables, port map |
| [[Security/Hardening\|Hardening]] | 7-layer security model, per-container hardening |
| [[Security/Threat Model\|Threat Model]] | Attack surface, mitigations, incident response |
| [[Agents/OpenClaw\|OpenClaw]] | AI gateway — platforms, skills, onboarding |
| [[Agents/Mission Control\|Mission Control]] | Orchestration dashboard — features, auth, adapters |
| [[Agents/Platforms\|Platforms]] | Connected messaging platform tracker |
| [[Logs/Setup Log\|Setup Log]] | Chronological build history |

---

## Quick Links

- **Mission Control:** http://192.168.122.10:3000
- **SSH:** `ssh agent-vm`
- **Start VM:** `virsh start agent-vm`
- **Docker logs:** `ssh agent-vm 'cd /opt/jarvis && docker compose logs -f'`

---

#jarvisai #vault-index
