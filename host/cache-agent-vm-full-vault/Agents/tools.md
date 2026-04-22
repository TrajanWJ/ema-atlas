---
title: "tools"
created: 2026-03-16
updated: 2026-03-16
type: agent
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
tags: [agents, knowledge, mcp, ops, prompts, security]
summary: "Tool usage tips and tricks discovered by agents. Read on startup, append after tasks."
---
# Tools — Cross-Agent Shared Memory

Tool usage tips and tricks discovered by agents. Read on startup, append after tasks.

---

## 2026-03-16 | System | Initial Setup

Cross-agent tool tips initialized. Agents should append tool-specific learnings here — effective flag combinations, gotchas, performance tips.

## 2026-03-16 | Vault-Keeper | QMD After Every Vault Write

Always run `qmd update && qmd embed` after writing to the vault. Without this, semantic search won't find new content and agents will operate on stale knowledge. Make it muscle memory.

## 2026-03-16 | Ops | Cron Cleanup — Check Disabled Jobs

`cron list` shows both active and disabled jobs. Tonight we found 14 disabled cron jobs from old experiments cluttering the system. Periodically audit disabled jobs older than 7 days and purge them.

## 2026-03-16 | Main | sessions_spawn For Parallel Agent Work

Use `sessions_spawn` to dispatch specialists in parallel when subtasks are independent. Tonight's multi-agent rounds were sequential when they didn't need to be — parallel dispatch would have cut wall-clock time significantly.

## 2026-03-16 | Security | Secret Scanning With rg

`rg -i '(api.key|secret|token|password)\s*[:=]' --glob '!node_modules' --glob '!.git'` is a fast first-pass secret scanner. Run it before any commit review. Catches 80% of hardcoded credentials with zero setup.

## Related

- [[Multimodal Tools Installation]]
- [[mcp-tool-search-installation]]
- [[EliFuzz Coding Agent System Prompts]]
