---
title: README
created: '2026-03-16'
updated: '2026-03-19'
type: knowledge
status: active
confidence: 0.4
confidence_updated: 2026-03-18T00:00:00.000Z
source: auto-capture
tags:
  - discord
  - evolution
  - knowledge
  - mcp
  - openclaw
  - ops
summary: >-
  Current system architecture docs. Historical/retired docs are in
  `_deprecated/`.
wiki_id: system/architecture/README
imported_from: vault/Architecture/README.md
imported_at: '2026-04-04T00:23:56.774Z'
---
# Architecture

Current system architecture docs. Historical/retired docs are in `_deprecated/`.

## Active Docs
- [[System Overview]] — VM, [[OpenClaw]] gateway (native/systemd), [[agent roster]], service layout
- [[Discord Server Architecture v3]] — Discord structure, routing, agent bindings (partially implemented)
- [[Design Decisions]] — DD-001 through DD-016, infrastructure + system decisions
- [[Auto-Knowledge Architecture]] — 5-level [[self-learning]] framework
- [[Claude Code Bot Architecture]] — Claude Code delegation patterns

## Recent Updates (2026-03-16)
- **Right Hand rebrand** — System → Right Hand, Orchestrator stays invisible
- **8 [[Agent roster]]** — Consolidated from 20 agents to focused specialist set
- **Host-VM Bridge** — Bidirectional SSH + shared folder, Claude Code dispatch via host-claude.sh
- **Self-critique system** — Automated reflection scripts, agent performance tracking
- **Evolution protocol** — Signal tracking, automated preference learning
