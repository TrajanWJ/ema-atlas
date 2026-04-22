---
title: System Overview
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: system
tags:
  - E8A838
summary: >-
  Architecture overview of the agent VM: infrastructure, services, agents, and
  operational topology.
wiki_id: system/System_Overview
imported_from: vault/System/System Overview.md
imported_at: '2026-04-04T00:23:57.267Z'
---
# System Overview

## Infrastructure
- **Host:** agent-vm (KVM virtual machine) at 192.168.122.10
- **OS:** Ubuntu Linux 6.8.0-101-generic (x64)
- **Resources:** 14GB RAM, 6 vCPUs
- **User:** trajan (NOPASSWD sudo)
- **Host machine:** FerrissesWheel at 192.168.122.1 (bidirectional SSH)

## Services
| Service | Manager | Port | Status |
|---|---|---|---|
| [[OpenClaw]] Gateway | systemd | 18789 | Active |
| OAuth Guardian v4 | systemd | — | Auto-refresh + browser fallback |
| [[Claude Code Bot]] | systemd | — | Discord bot for code execution |
| QMD | cron (30min) | — | Vault semantic search |
| Ontology Sync | cron (3h) | — | Entity extraction from vault |

## Agent Architecture
- **Right Hand** (`main`) — persistent [[OpenClaw]] agent, user-facing default voice, accent #E8A838
- **Specialists** — spawned as Claude Code background processes by Right Hand:
  - 🔬 Researcher — deep research, evaluations, web scraping
  - 💻 Coder — building features, code tasks
  - ⚙️ Ops — system health, evolution, crons
  - 🛡️ Security — security scanning, [[Hardening]]
  - 📚 Vault Keeper — vault cleanup, knowledge org
  - 🔭 Scout — web research, feed monitoring
  - 🎯 Prompt Engineer — SOUL.md optimization, metaprompting
  - 😈 Devil's Advocate — review agents/skills, challenge assumptions
  - 🛎️ Concierge — personal requests, scheduling
- **Orchestrator** (`universal-orchestrator`) — silent coordinator for 3+ agent workflows
- **[[Claude Code Bot]]** — standalone Discord bot for direct code execution

## Key Paths
| Path | Purpose |
|---|---|
| `/home/trajan/vault/` | Obsidian knowledge vault (truth) |
| `~/.openclaw/agents/main/workspace/` | Right Hand workspace |
| `~/skills/` | All installed skills (37, git-tracked) |
| `~/bin/` | Custom scripts |
| `~/.openclaw/` | [[OpenClaw config]] and state |

## Auth
- Claude Max OAuth, auto-refreshed by Guardian v4
- Token sync across 4 stores ([[OpenClaw]], Claude Code, environment, file)

## Crons (active — verified 2026-03-16)
| Interval | Script | Purpose |
|---|---|---|
| */2 min | gateway-watchdog.sh | Gateway health check + auto-restart |
| */5 min | system-watchdog.sh | System health monitoring |
| */20 min | session-health.sh | Session token usage monitoring |
| */30 min | qmd update+embed | Vault semantic search index |
| */2 h | vault-autocommit.sh | Git commit vault changes |
| */2 h | message-harvester.sh | [[Self-learning]]: harvest messages |
| ~*/2 h | correction-tracker.sh | [[Self-learning]]: track corrections |
| */3 h | [[auto-knowledge]]-gated.sh | Usage-aware knowledge capture |
| */3 h | ontology-sync extract | Entity extraction from vault |
| */4 h | reddit-intel.sh | Reddit research feed |
| */6 h | [[evolution-loop]] run | Agent evolution cycle |
| 04:00 UTC | session-janitor.sh | Cleanup old sessions |
| 09:00 UTC | vault-janitor.sh | Vault cleanup (4 AM EST) |
| 12:00 UTC | overnight-digest.sh | Morning digest (7 AM EST) |
| 14:00 UTC | morning-briefing.sh | Daily briefing (9 AM EST) |
| Sun 03:00 | weekly-synthesis.sh | Weekly [[self-learning]] synthesis |
| Mon 04:00 | prompt-archaeologist.sh | Prompt pattern analysis |
| @reboot | cron-restore.sh | Restore crons after restart |

## Design Principles
1. Vault is truth, agents are disposable, knowledge is permanent
2. Right Hand is default voice — other agents are invisible infrastructure
3. [[Self-learning]] loop: observe → signal → adapt → evolve → propagate
4. Surface-independent: Discord renders, but the system isn't tied to Discord
5. Dynamic agent routing, not rigid pipelines

---
*Last updated: 2026-03-16*

## Related

- [[2026-03-16]]
- [[Anti-Staleness]]
- [[Aspirational Vault Architecture]]
- [[Design Decisions]]
- [[OpenClaw Agent Setup]]
- Strategy
