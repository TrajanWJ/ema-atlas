---
title: "Agent Architecture Overview"
created: 2026-03-16
updated: 2026-04-16
type: architecture
status: active
confidence: 0.45
confidence_updated: 2026-04-16
source: architecture-doc
tags: [agents, architecture, ema, ori-mnemos, dispatch]
summary: "Overview of the multi-agent architecture powering Trajan's system — evolved from OpenClaw to EMA + Ori Mnemos + dispatch-engine."
---
# Agent Architecture Overview

> **Staleness review 2026-04-16:** Architecture has significantly evolved since March 2026. OpenClaw gateway is archived. The current agent stack centers on Claude Code (host + VM), Ori Mnemos for memory/orientation, and the dispatch-engine for task automation. EMA is the aspirational unified executive OS.

## Current Architecture (April 2026)

### Core Components
- **Claude Code** — Primary coding/reasoning agent (host workstation + VM workspace)
- **Ori Mnemos** — Memory and orientation layer (MCP-based, vault-integrated)
- **dispatch-engine** — Task automation and scheduling (runs periodic vault/system tasks)
- **Superpowers Skills** — Skill library for Claude Code (brainstorming, TDD, debugging, etc.)
- **Antfly** — Vault search and embedding service (running on agent-vm)

### Infrastructure
- **Host workstation** — Primary Claude Code sessions, project development
- **agent-vm (KVM)** — Services: SearXNG, Activepieces, Antfly
- **Obsidian vault** — Knowledge graph, PKM, project tracking

### Aspirational
- **[[Codebases/EMA|EMA]]** — Executive Management App (Tauri 2.0 + Elixir/Phoenix + React). Intended to unify agent orchestration, vault, projects, tasks into a single desktop app. Phase 1 complete, Phase 2 active.

## Historical (March 2026 — Archived)
- **OpenClaw Gateway** — Was the primary agent runtime. Now disabled/archived.
- **Right Hand** — Was the primary orchestration agent name. Evolved into current Claude Code workflows.
- **Discord/Telegram bot** — Messaging integrations via OpenClaw. No longer active.

## Related
- [[Architecture/System Overview]]
- [[Architecture/Design Decisions]]
- [[Hardening]] — current active stack details
- [[Codebases/EMA|EMA]] — aspirational unified system
- [[Integrations Roadmap]]
