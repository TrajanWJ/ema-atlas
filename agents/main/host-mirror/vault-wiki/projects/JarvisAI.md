---
type: project
wiki_id: projects/JarvisAI
imported_from: vault/Projects/JarvisAI.md
imported_at: '2026-04-04T00:23:56.887Z'
tags: []
summary: ''
---
# JarvisAI

> AI agent fleet running in a local KVM VM — OpenClaw + Mission Control, managed from a one-click KDE launcher.

## Quick Info

| Field | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/JarvisAI/` |
| **VM Name** | agent-vm |
| **VM IP** | 192.168.122.10 |
| **Stack** | KVM/QEMU, Ubuntu Server 24.04, XFCE, Docker Compose |
| **Services** | Mission Control v2.0.0, OpenClaw (latest), Docker Socket Proxy |
| **Project Vault** | `/home/trajan/Desktop/JarvisAI/vault/` |
| **Status** | Phase 1 — VM + Docker deployed, launcher working |
| **Started** | 2026-03-12 |

## Architecture

```
Workstation (KDE)
  └── "Agent Command Center" desktop launcher
        └── virt-viewer (SPICE) → agent-vm
              └── XFCE Desktop
                    └── Firefox → Mission Control (:3000)
                          └── manages OpenClaw gateway (Docker DNS, no published port)
                                └── spawns sandboxes on internal network via socket proxy
```

- **Mission Control** — dashboard for orchestrating agents, tasks, tokens, schedules
- **OpenClaw** — AI assistant across 20+ messaging platforms (Telegram, Discord, Slack, etc.)
- **Docker Socket Proxy** — filtered access so OpenClaw can spawn sandboxes without full Docker privileges
- **sandbox-net** — internal Docker network with no internet; sandboxes are fully isolated

## Key Decisions

| Decision | Rationale |
|---|---|
| Single VM (not split) | Simpler management; can split later if needed |
| OpenClaw over IronClaw | Largest community, most integrations; VM boundary mitigates supply chain risk |
| Docker Socket Proxy | Prevents privilege escalation from compromised OpenClaw |
| XFCE over GNOME | ~200MB vs ~1GB RAM overhead |
| virbr0 NAT only | Single network provides both internet + host access |
| CloudCLI removed | Replaced by Mission Control for agent management |

## Phases

### Phase 1: VM + Docker Setup (complete)
- [x] Create scaffold files (docker-compose, .env.example, vm-create.sh, vm-provision.sh, README)
- [x] Download Ubuntu 24.04 cloud image
- [x] Create KVM VM with cloud-init provisioning
- [x] XFCE + Docker installed via cloud-init user-data
- [x] Deploy Docker stack (Mission Control + OpenClaw + Socket Proxy)
- [x] Fix QXL display → virtio-gpu, configure lightdm autologin
- [x] Desktop launcher with splash screen (`~/bin/agent-command-center.sh`)
- [x] Create project Obsidian vault at `/home/trajan/Desktop/JarvisAI/vault/`

### Phase 2: Agent Configuration
- [ ] OpenClaw onboarding (API keys, messaging platforms)
- [ ] Mission Control auth setup
- [ ] Connect Mission Control → OpenClaw gateway
- [ ] Test end-to-end messaging flow

### Phase 3: Expansion
- [ ] Additional framework adapters (CrewAI, LangGraph)
- [ ] Tailscale for mobile access
- [ ] IronClaw for security-sensitive tasks

## Spec

Full design spec: `/home/trajan/docs/superpowers/specs/2026-03-12-agent-command-center-design.md`

## Related Notes

- [[OpenClaw]] — AI assistant evaluation
- [[builderz-labs Mission Control]] — orchestration dashboard evaluation
- [[Research - Self-Hosted AI Agent Platforms 2026]] — platform comparison
- [[CloudCLI]] (archived) — replaced by this project

## Gotchas

(none yet)

#jarvisai #self-hosted #docker #ai-agents #active
