---
title: "Welcome"
created: 2026-03-14
updated: 2026-03-16
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
tags: [agent-vm, vault-index]
summary: "Local AI agent fleet running in a KVM virtual machine with [[EMA]]."
---
# agent-vm Vault

Local AI agent fleet running in a KVM virtual machine with [[EMA]].

**VM:** agent-vm | **IP:** 192.168.122.10 | **Status:** Active

---

## Sections

| Section | Purpose |
|---|---|
| [[Architecture/System Overview|System Overview]] | Full system architecture, component diagram |
| [[Architecture/Design Decisions|Design Decisions]] | ADRs and rationale for key choices |
| [[Operations/Quick Reference|Quick Reference]] | Common commands and URLs |
| [[Operations/VM Management|VM Management]] | virsh, snapshots |
| [[Agents/Agent Roster|Agent Roster]] | All agents and their roles |
| [[Agents/EMA|EMA]] | AI gateway config and platforms |
| [[Agents/Claude Code Bot|Claude Code Bot]] | Discord bot for code execution |
| [[Skills/README|Skills]] | Installed skills directory |
| [[Research/README|Research]] | Research materials and analyses |
| [[Reference/README|Reference]] | Reference docs and guides |
| [[Trajan/Profile|Trajan]] | User profile and preferences |
| [[Trajan/Intent Analysis - March 2026|Intent Analysis]] | Deep intent analysis |
| [[Trajan/Host Machine Profile|Host Machine]] | Host PC projects and setup |
| [[Projects/README|Projects]] | Project tracking and buildout |
| [[System/README|System]] | System state, evolution, usage |

---

## Quick Links

- **SSH from host:** `ssh agent-vm`
- **SSH to host:** `ssh host-machine`
- **Gateway health:** `ema status`
- **Vault search:** `qmd search "query"`
- **Pace check:** `cat ~/.claude-pace.json | jq .`

---

*Last updated: 2026-03-16*

#agent-vm #vault-index
