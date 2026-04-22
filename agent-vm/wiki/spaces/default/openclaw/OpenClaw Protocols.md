---
title: "OpenClaw Protocols"
type: reference
created: 2026-04-06
tags: [openclaw, archived, protocols, collaboration, handoff, operations]
summary: "All 12 operational protocols from OpenClaw - agent collaboration, handoff, self-evolution, delegation, conflict resolution"
---

# OpenClaw Protocols

OpenClaw had 12 formal protocol documents governing multi-agent operations. These represent hard-won lessons from running autonomous agent teams.

## 1. Agent Collaboration

Four collaboration modes:

- **Direct**: Single agent, single task
- **Sequential**: Agent A completes, hands off to Agent B
- **Parallel**: Multiple agents work simultaneously on different aspects
- **Open-Ended**: Forum-style discussion, multiple agents contribute asynchronously

The "Right Hand" (main agent) mediated all inter-agent communication. Escalation rules based on complexity.

## 2. Agent Handoff

Every agent outputs a structured HANDOFF block:
- Agent name
- Task description
- Outcome (success / partial / failed)
- Deliverables
- Follow-up needed
- Learnings

CLI tools for handoff: `handoff-create`, `handoff-claim`, `handoff-complete`, `handoff-chain` for sequential pipelines with continuation tokens.

## 3. Self-Evolution

The self-improvement loop:

**Observation -> Signal -> Adaptation -> Evolution -> Propagation**

- Signal logging to `vault/System/Evolution Signals.md`
- Adaptation thresholds: 3+ signals at >80% confidence
- Auto-apply rules for formatting/style changes
- SOUL.md/AGENTS.md changes require Trajan approval
- Snapshot-based anti-regression

"Self-Revision Fast Path": Explicit self-revision tasks bypass approval loop.

## 4. System Operations

- Service management: Gateway, OAuth Guardian v4, Claude Code Bot
- Health check rotation: Auth -> Gateway -> Disk -> Load -> Vault
- Cron job management and known issues
- Emergency recovery procedures

**Critical warning:** `openclaw doctor --fix` wipes the cron array. Always verify crons after any doctor run.

## 5. Delegation System

Five delegation types:
1. Sub-Agent Spawn
2. Claude Code Bot Dispatch
3. Direct Tool Use
4. Agent-to-Agent Messaging
5. Forum Collaboration

Collaboration modes: Sequential, Parallel, Open-Ended, Swarm

Mandatory delegation monitoring:
- 3 min -> status update
- 5 min -> check status
- 10 min -> kill or handle directly

## 6. Conversation Promotion

Escalation ladder: threads -> channels -> forums -> vault entries

Triggers:
- 5+ exchange rule
- Complexity indicators (multi-agent, file modifications, long-term tracking)

Templates provided for channel kickoff and vault project structure.

## 7. Conflict Resolution

Three-tier escalation:
1. **Agent Discussion** (5 min timeout)
2. **Right Hand Synthesis** (domain authority weighting)
3. **Escalation to Trajan** (if unresolvable)

Domain authority table and weighted voting protocol for resolving disagreements between agents.

## 8. Agent Messaging

- `sessions_spawn`: Right Hand spawns specialists, they return results
- Forum Posts: async multi-agent discussion with identity headers
- `sessions_send`: real-time direct agent coordination
- Every message includes identity bar + routing arrows
- Memory: local daily notes + global vault with qmd update/embed

## 9. Restart Continuity

Write `CONTINUE.md` before restart:
- What you were doing
- What's left
- Spawned agents still running
- Resume channel

After restart: read CONTINUE.md, resume, delete.

**Key lesson learned:** This was added after a restart lost 5 spawned agents' work on March 16, 2026.

## Lessons for EMA

These protocols encode real operational pain:
- **Handoff structure** prevents lost context between agents
- **Delegation monitoring** with timeouts prevents zombie tasks
- **Self-evolution with approval gates** prevents drift
- **Conflict resolution tiers** prevent deadlocks
- **CONTINUE.md** was a band-aid for the persistence problem EMA solves natively

## Related

- [[OpenClaw System Overview]]
- [[OpenClaw Agent Workspace Guide]]
- [[OpenClaw Agent Performance]]
