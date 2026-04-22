---
title: "Agent Feed & Dispatch System"
type: reference
created: 2026-04-06
tags: [agents, dispatch, infrastructure, discord]
summary: "Agent communication infrastructure: feed, dispatch, priorities, and task tracking"
---

# Agent Feed & Dispatch System

## Communication Channels

- **#agent-feed**: Real-time dispatch notifications
- **Desk watcher**: Monitors #desk, #chat, #trajans-office for task-like messages
- Automatic routing from Discord channels to agent dispatch queue

## Priority System

| Priority | Category | Examples |
|---|---|---|
| **P1** | Revenue | Client deliverables, billing |
| **P2** | Bugs | Production issues, broken flows |
| **P3** | Research | Intel gathering, analysis |
| **P4** | Maintenance | Cleanup, optimization |

## Dispatch Queue

- Location: `~/dispatch/queue/{P}{timestamp}-{agent}.json`
- Result collection and chaining (output of one task feeds next)
- Failed deliveries tracked: 4 in delivery queue

## Proposals System

- 28 approved proposals documented
- Proposals go through review before execution

## Completed Task Types

- Reddit intelligence gathering
- ArXiv paper scanning
- Best practices research
- Competitive landscape scanning
- Vault improvement and maintenance
- GitHub trending analysis
- [[EMA]] configuration tasks
- Cross-pollination (insights from one domain applied to another)
