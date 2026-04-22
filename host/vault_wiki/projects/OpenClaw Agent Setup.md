---
title: OpenClaw Agent Setup
created: '2026-03-14'
updated: '2026-03-16'
type: project
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: project
tags:
  - active
summary: Full self-hosted AI agent stack on KVM VM with Discord + Telegram channels.
wiki_id: projects/OpenClaw_Agent_Setup
imported_from: vault/Projects/OpenClaw Agent Setup.md
imported_at: '2026-04-04T00:23:56.887Z'
---
# OpenClaw Agent Setup

**Status:** #active
**Started:** 2026-03-14
**Last Updated:** 2026-03-16

## Description
Full self-hosted AI agent stack on KVM VM with Discord + Telegram channels.

## Key Links
- [[System Overview]]
- [[Projects/System Buildout/loose-ends|System Buildout]]

## Progress
- [x] VM provisioned (14GB RAM, 6 vCPUs)
- [x] Claude Max OAuth auto-sync (Guardian v4)
- [x] Discord channel connected
- [x] Telegram channel connected
- [x] Vault initialized with git tracking
- [x] [[QMD semantic search]] (cron every 30min)
- [x] Ontology sync (cron every 3h)
- [x] Morning briefing automation (9AM EST daily)
- [x] [[Agent roster]]: 10 agents (Right Hand + 9 specialists)
- [x] 37 skills installed and tracked
- [x] Host-VM bridge (bidirectional SSH + shared folder)
- [x] [[Claude Code Bot]] v2 (Discord dispatch)
- [x] Protocols directory (10 protocol files)
- [x] Self-evolution pipeline
- [x] Vault-feed cron (30min)
- [ ] Full vault maintenance pass
- [ ] Agent-to-Discord dynamic routing (Right Hand mediates for now)

## Architecture
- **Right Hand** = user-facing default, handles everything
- **Specialists** = Claude Code background processes spawned by Right Hand
- **Orchestrator** = invisible coordinator for complex multi-agent work
- Claude Code MCP stack: Serena, [[Engram]], CodeGraphContext, QMD, TaskMaster

## Related

- [[briefing-2026-03-16]]
