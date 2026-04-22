---
title: "EMA Wiki"
space: wiki
tags: ["index", "moc"]
source: manual
---

# EMA Wiki

Personal knowledge base for the EMA system. **69 pages** across **10 sections**.

Last rebuilt: 2026-04-07.

## Architecture (24 pages)

- [[EMA Architecture Overview]] — System topology, OTP supervision tree, stack, subsystem map
- [[Intent System]] — Unified intent engine: 6-level hierarchy, IntentLink bridges, Populator, MCP tools
- [[Knowledge Topology]] — Three Core Truths (semantic, operational, knowledge), bridges, canonical vs derived
- [[Vault Structure]] — Vault directory layout, folder discipline, agent-writability rules
- [[Context Assembly]] — Hot/warm/cold tiers, ContextBuilder, ContextInjector, intent-aware selection
- [[Cross-Pollination]] — Host <-> EMA <-> agent-vm knowledge flows, guardrails, landing zones
- [[Execution System]] — Two paths: dispatch engine (bash+cron) and daemon Surfaces (interactive)
- [[Proposal Pipeline]] — 7-stage GenServer pipeline (Generator -> Refiner -> Debater -> Tagger -> Combiner)
- [[Dispatch Engine]] — Legacy bash task queue: dispatch.db (agent-vm, offline), circuit breakers, historical reference
- [[Babysitter System]] — Adaptive cadence, semantic lanes, emission tiers, takeover FSM
- [[Orchestrator]] — SmartRouter (6 strategies), provider routing, context injection
- [[AI Providers]] — Provider registry, 6 adapters (Claude CLI, Codex, Ollama, OpenClaw, OpenRouter, Anthropic)
- [[Stream-of-Consciousness]] — Discord posting, 7 channels, cadence-controlled by Babysitter
- [[Autonomous Loop Architectures]] — 6 patterns (Sequential, NanoClaw, Infinite Agentic, PR Loop, De-Sloppify, Ralphinho DAG)
- [[MCP Topology]] — 3 MCP servers (EMA, filesystem, CodeGraphContext), data flow
- [[Superman System]] — Three-layer .superman/ hierarchy, intent folders, daemon modules
- [[Reflexion System]] — Reflexion entries, prompt injection, autonomous improvement engine
- [[Intelligence Layer]] — ~50 modules: routing, trust, cost, gaps, autonomy, security, learning
- [[Data Model Reference]] — 116 Ecto schemas, 130+ tables, key patterns and relationships
- [[Second Brain Architecture]] — VaultWatcher, GraphBuilder, SystemBrain, FTS5 indexer, knowledge graph
- [[Pipes Architecture]] — Supervision, trigger/action registry, transform pipeline, stock pipes
- [[Actor Workspace Architecture]] — Actor model, phase cadence, entity data, workspace MCP tools
- [[Wiki Engine]] — Wiki implementation: VaultWatcher→Populator→IntentProjector sync, REST API, channels
- [[Configuration System]] — 5 config layers: compile-time, runtime, settings DB, workspace, spaces

## User (4 pages)

- [[Trajan Profile]] — Role, tools, working style, key preferences
- [[Stack Decisions]] — Current stack, rejected tools, key architectural decisions
- [[Learnings & Gotchas]] — CLAUDE.md enforcement, logind, wa-sqlite WASM
- [[System Setup]] — Machine specs (FerrissesWheel), agent-vm, data flow

## Projects (6 pages)

- [[Active Projects]] — EMA, ProSlync, place.org, Superman-IDE, Wilson Premier, Agent OS Demo
- [[EMA]] — Primary project: Executive Management Assistant
- [[Intent Engine]] — Project page for the Intent Engine subsystem
- [[LaunchpadHQ]] — LaunchpadHQ project
- [[place.org]] — Browser desktop OS, v0.2 on main, v0.3-v0.5 merging
- [[ProSlync]] — NIL marketplace, Phase 1 complete, Phase 2 = real backend

## Apps (8 pages)

- [[vApp Catalog]] — Complete inventory of all 28 active desktop vApps with stores and accents
- [[Desktop Shell]] — Tauri shell architecture: Shell, Launchpad, Dock, glass design system
- [[HQ Frontend]] — LaunchpadHQ web dashboard: 9 pages, 9 stores, separate from desktop app
- [[Brain Dump]] — Capture inbox, clustering, proposal surfacing
- [[Tasks, Projects & Goals]] — Hierarchy: Goals -> Projects -> Tasks -> Executions
- [[Focus, Habits & Journal]] — Pomodoro timer, streak tracking, daily journal with mood/energy
- [[Vault]] — FTS5 indexer, knowledge graph, note CRUD, semantic search
- [[Pipes & Routines]] — 22 triggers, 15 actions, 7 stock pipes, event-driven automation

## Agents (2 pages)

- [[Agent Network]] — 3 daemon agents (strategist, coach, archivist), per-agent GenServer supervision, channels
- [[OpenClaw Agent System]] — Archived VM gateway at 192.168.122.10:18789 (OFFLINE)

## Tools (4 pages)

- [[CLI Reference]] — 79 command groups, global flags (Tools/CLI-Reference.md)
- [[MCP Tools Reference]] — All tools exposed by the EMA MCP server
- [[MCP Resources Reference]] — MCP resources exposed by the EMA server
- [[Superman-IDE]] — AST code intelligence, 4-stage retrieval, 8 MCP tools

## Operations (7 pages)

- [[System State 2026-04-07]] — Verified state snapshot: running services, DB status, agent/actor counts
- [[System Audit 2026-04-06]] — Live audit findings, critical issues, state snapshot
- [[Migration Plan VM to Host]] — Eliminate VM dependency, 6-phase plan
- [[Quick Reference]] — Start commands, CLI shortcuts, troubleshooting
- [[Infrastructure]] — Host + agent-vm services, databases, cron jobs, key paths
- [[Claude Code Setup]] — 3 MCPs, 3 plugins, zero hooks
- [[CLI Reference]] — CLI v3.0.0 Elixir escript reference (Operations/CLI-Reference.md)

## Intents (11 pages)

- [[Intents Index|Intents/_index]] — Intent projections overview
- [[Execution Engine Intent|Intents/Features/Execution-Engine]] — Execution engine feature intent
- [[Intent Wiki Schematic|Intents/Features/Intent-Wiki-Schematic]] — Intent-wiki schematic feature intent
- [[Proposal Pipeline Intent|Intents/Features/Proposal-Pipeline]] — Proposal pipeline feature intent
- [[Second Brain Intent|Intents/Features/Second-Brain]] — Second brain feature intent
- [[Agent Collaboration|Intents/Goals/Agent-Collaboration]] — Agent collaboration goal
- [[Ship Core Loop|Intents/Goals/Ship-Core-Loop]] — Ship core loop goal
- [[Actor Workspace|Intents/Projects/Actor-Workspace]] — Actor workspace project intent
- [[EMA OS|Intents/Projects/EMA-OS]] — EMA OS project intent
- [[Execution-First EMA OS|Intents/Projects/Execution-First-EMA-OS]] — Unified execution-first runtime (Phase 2, 50%)
- [[EMA Life OS|Intents/Vision/EMA-Life-OS]] — EMA life OS vision intent

## Archive (1 page)

- [[Pre-Cleanup Harvest 2026-04-06|Archive/2026-04-06-pre-cleanup-harvest]] — State snapshot before wiki cleanup

## Contacts (1 page)

- [[Craig Wilson]] — Client, Wilson Premier Properties, Smith Mountain Lake VA

---

## Related Vault Spaces

- **[[../intents/_index|Intent Projections]]** — generated semantic working projections from the intents DB
- **[[../imports/_index|Imports]]** — source-labeled mirrors of external knowledge
- **[[../archive/_index|Archive]]** — immutable historical records
- **[[../system/state/|System State]]** — auto-generated machine state snapshots
