---
title: "System Overview"
created: 2026-03-16
updated: 2026-04-16
type: system
status: active
confidence: 0.85
confidence_updated: 2026-04-16
source: system
tags: [E8A838]
summary: "Architecture overview of the agent VM: infrastructure, services, agents, and operational topology."
---
# System Overview

## Infrastructure
- **Host:** agent-vm (KVM virtual machine) at 192.168.122.10
- **OS:** Ubuntu Linux 6.8.0-107-generic (x64)
- **Resources:** 8GB RAM, 4 vCPUs
- **User:** trajan (NOPASSWD sudo)
- **Host machine:** FerrissesWheel at 192.168.122.1 (bidirectional SSH)
- **Disk:** 87GB total, ~11GB free (89% used — approaching warning threshold)

## Services
| Service | Manager | Port | Status |
|---|---|---|---|
| [[OpenClaw]] Gateway | process (systemd unit inactive) | 18789 | Running |
| OAuth Guardian v4 | systemd | — | Failed — needs investigation |
| [[Claude Code Bot]] | systemd | — | Active — Discord bot for code execution |
| QMD | cron (30min) | — | Vault semantic search |
| Ontology Sync | cron (3h) | — | Entity extraction from vault |
| SearXNG | Docker | — | Running (search engine) |
| ActivePieces | Docker (+ Redis, Postgres) | — | Running (automation) |
| Antfly | Docker | — | Running/healthy (search) |

## Agent Architecture
- **Right Hand** (`main`) — persistent [[OpenClaw]] agent, user-facing default voice, accent #E8A838
- **Dispatch Engine** — cron-based task scheduler, generates and assigns tasks to Claude Code agents
- **Specialists** — spawned as Claude Code background processes:
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
| `~/skills/` | All installed skills (61, git-tracked) |
| `~/bin/` | Custom scripts |
| `~/dispatch/` | Dispatch engine state, tasks, and queues |
| `~/.openclaw/` | [[OpenClaw config]] and state |

## Auth
- Claude Max OAuth — Guardian v4 in failed state, may need manual token refresh
- Token sync across 4 stores ([[OpenClaw]], Claude Code, environment, file)

## Crons (active — verified 2026-04-16)
| Interval | Script | Purpose |
|---|---|---|
| */1 min | dispatch-engine.sh | Task dispatch engine |
| */2 min | gateway-watchdog.sh | Gateway health check + auto-restart |
| */2 min | session-watchdog.sh | Session monitoring |
| */5 min | system-watchdog.sh | System health monitoring |
| */5 min | links-pipeline.sh | Links processing pipeline |
| */5 min | proposal-cron.sh | Proposal processing |
| */10 min | auto-resume.sh | Auto-resume dead sessions |
| */15 min | desk-dispatch.sh | Desk task dispatch scanning |
| */30 min | memory-pressure.sh | Memory pressure monitoring |
| */30 min | qmd update+embed | Vault semantic search index |
| */30 min | integrity-checksums | Config integrity verification |
| 1h | dispatch.sh schedule | Hourly dispatch scheduling |
| */2 h | vault-autocommit.sh | Git commit vault changes |
| */2 h | proactive-task-generator.sh | Auto-generate maintenance tasks |
| */3 h | signal-to-queue.sh | Signal processing |
| */3 h | ontology-sync extract | Entity extraction from vault |
| */4 h | reddit-intel.sh | Reddit research feed |
| */4 h | vault-research-loop.sh | Automated vault research |
| */6 h | crontab backup | Cron backup to vault |
| */6 h | transcript-scanner.sh | Session transcript scanning |
| 02:00 UTC | research-implement-pipeline.sh | Research → implementation pipeline |
| 03:00 daily | agent-learning-sync.sh | Agent learning synchronization |
| 04:00 UTC | session-janitor.sh | Cleanup old sessions + log truncation |
| 09:00 UTC | vault-janitor.sh | Vault cleanup (4 AM EST) |
| 12:00 UTC | overnight-digest.sh | Morning digest (7 AM EST) |
| 14:00 UTC | morning-briefing-v2.sh | Daily briefing (9 AM EST) |
| Sun 02:00 | evolution-loop.sh | Agent evolution cycle |
| Mon 06:00 | competitive-scan.sh | Weekly competitive scan |
| @reboot | cron-restore.sh | Restore crons after restart |

## Active Projects (as of 2026-04-16)
- **[[EMA]]** — major project with 8-week/16-week implementation roadmap
- **ExecuDeck** — tech landscape research completed
- **Dispatch System** — autonomous task generation and execution engine

## Design Principles
1. Vault is truth, agents are disposable, knowledge is permanent
2. Right Hand is default voice — other agents are invisible infrastructure
3. [[Self-learning]] loop: observe → signal → adapt → evolve → propagate
4. Surface-independent: Discord renders, but the system isn't tied to Discord
5. Dynamic agent routing, not rigid pipelines
6. Dispatch-driven autonomous work — system generates and executes its own tasks

---
*Last updated: 2026-04-16*

## Related

- [[Anti-Staleness]]
- [[Aspirational Vault Architecture]]
- [[Design Decisions]]
- [[OpenClaw Agent Setup]]
- [[EMA]]
