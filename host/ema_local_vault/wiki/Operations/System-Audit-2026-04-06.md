---
title: "System Audit 2026-04-06"
space: wiki
tags: ["ops","audit","status"]
source: manual
---

# System Audit — 2026-04-06

Comprehensive audit via SSH, MCP, CLI, QMD, and Obsidian vault scan.

## Critical Issues

### 1. Dispatch Engine Failure Cascade
The `utility` agent keeps receiving "analyze N failed tasks" meta-tasks that themselves fail, creating an infinite loop. 54 of 84 tasks are cancelled, 5 are failed. The `dispatch-engine.sh` Python subprocess is spinning at 166% CPU reading `index.json`.

**Fix:** Cancel all pending analyze tasks. Disable the signal generator creating them. Unstick the engine.

### 2. OpenClaw Still Running
Gateway process alive on agent-vm:18789 despite being archived. HTML frontend serving. Residual refs in daemon code (runtime.exs, discovery.ex, gateway_client.ex, supervisor.ex).

**Fix:** Kill process. Clean daemon code. Remove from any startup scripts.

### 3. Agent-VM Disk at 88%
Ops agent failed the cleanup task. Unresolved.

### 4. Focus Endpoint Missing
MCP bridge calls `GET /api/focus` but Phoenix has no route. Returns NoRouteError.

## State Snapshot

### Daemon (localhost:4488)
- Status: Running (dev mode, not systemd)
- Babysitter: Active (most polished subsystem)
- Ecto DB: Empty (zero migrations, zero tables)

### Dispatch Engine (agent-vm)
| Status | Count |
|--------|-------|
| cancelled | 54 |
| done | 24 |
| failed | 5 |
| queued | 1 |

### Agents (21 in dispatch.db)
- All idle, all circuit breakers closed
- Only 5 have ever run anything (coder, researcher, vault-keeper: 1 success; ops, utility: 1 failure)
- 16 agents have zero execution history

### Projects
| Project | Status |
|---------|--------|
| EMA | Active, linked to ~/Projects/ema |
| ProSlync | Ghost — no description, no activity |

### Goals & Tasks
- Zero goals in EMA (Obsidian has full hierarchy — not imported)
- Zero tasks via EMA task API (all work via executions)

### Executions
- 26 total (16 completed, 8 failed, 1 created/stuck, 1 other)
- Latest batch (Apr 5): 7 proposal-backed executions completed in 9 minutes
- 1 stuck: "Research intent-folder architecture" — created Apr 3, never started

### Vault
- agent-vm `~/vault/`: 3,036 markdown files
- agent-vm `~/.local/share/ema/vault/`: 0 files (empty!)
- Host `~/.local/share/ema/vault/`: 40 files (wiki lives here, not on agent-vm)
- QMD index: 23 days stale (last updated Mar 13)

### Services (agent-vm)
- EMA daemon: running (beam.smp)
- EMA observer: running (systemd, port 3200)
- Wiki engine: running (port 8093)
- MCP server: running (port 8899)
- OpenClaw: running (port 18789) — should be dead
- Ollama: running (port 11434)
- 18 cron jobs (v5 config, 2026-04-06)

## Contradictions Found

1. **Wiki says vault on agent-vm has files** — it's actually empty at `~/.local/share/ema/vault/`. Wiki files are on the HOST.
2. **Wiki says 37 crons** — actual count is 18 (v5 config, consolidated)
3. **Wiki says "17 agents configured"** — dispatch.db has 21
4. **CLAUDE.md says proposal engine is "Working"** — code exists but Ecto DB is empty, cannot operate
5. **EMA-FULL-CONTEXT.md says "84 tasks, 21 agents"** — accurate for dispatch.db but misleading since 54 tasks are cancelled

## Knowledge Gaps (from Obsidian, not in wiki)

1. **6 autonomous loop architectures** documented in `.claude/skills/autonomous-loops/SKILL.md` — Sequential Pipeline, NanoClaw REPL, Infinite Agentic Loop, Continuous PR Loop, De-Sloppify, Ralphinho RFC-DAG
2. **Spec-driven orchestration frameworks** — BMAD, Kiro, cc-sdd, GitHub Spec Kit
3. **Critical lesson** from Mar 13 vault cleanup: "vault instructions don't self-enforce" — hooks and habits required, not just text
4. **16 agent definitions** in `.claude/agents/` (PKM + dev categories) — ~8 unused

## Recommended Actions

1. Fix dispatch engine failure cascade (highest priority)
2. Kill OpenClaw gateway
3. Import Obsidian goal hierarchy into EMA
4. Refresh QMD index (`qmd update && qmd embed`)
5. Add focus route to Phoenix router
6. Sync wiki to agent-vm vault (currently host-only)
7. Clean up 16 dormant agents
8. Run first Ecto migration
