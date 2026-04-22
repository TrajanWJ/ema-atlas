---
title: EMA (Executive Management App)
created: '2026-04-01'
updated: '2026-04-03'
type: codebase
status: active
stack:
  - tauri-2
  - react
  - elixir
  - phoenix
  - sqlite
host: FerrissesWheel (~/Projects/ema)
category: executive-ai
tags:
  - codebase
  - executive-os
  - personal-os
  - agent-orchestration
  - life-management
  - glass-ui
  - tauri
  - active-development
summary: >-
  Personal executive OS. Tauri desktop app with React frontend + Elixir/Phoenix
  daemon. Phase 1 complete (2,457 source files, 16 domain modules). Phase 2
  active: persistent intelligence, campaigns, multi-turn sessions. Features:
  Projects, Tasks, Proposals, Agents, Vault, Canvas, Pipes, Brain Dump, Habits,
  Journal, Responsibilities, Goals, Focus. Glass aesthetic UI. Claude Code
  integration (Bridge + SessionWatcher).
related:
  - ExecuDeck
  - Wilson Premier Platform
  - Intelligence Layer
  - '[[Projects/EMA Master Knowledge Base]]'
  - '[[Projects/EMA Phase 2 Implementation Guide]]'
wiki_id: codebases/EMA
imported_from: vault/Codebases/EMA.md
imported_at: '2026-04-04T00:23:56.822Z'
---

# EMA — Executive Management App

The big one. Personal executive OS that combines structured business data, agent orchestration, PKM/vault, and life ops into a single local-first application.

## Vision

No one has built this yet (per [[Research/EMA-Wilson-Deep-Research-2026-03-31|deep research]]): a personal-scale executive OS that fuses agent orchestration + life management + knowledge graph + glass UI in a local-first desktop app.

## Planned Architecture

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2.0 |
| Frontend | React (glass aesthetic UI) |
| Backend daemon | Elixir/Phoenix |
| Storage | SQLite (local-first) |
| Agent runtime | Claude Code + MCP |

## Features

- **Projects** — Kanban + timeline + agent-assisted planning
- **Tasks** — Smart prioritization, agent delegation
- **Proposals** — Decision documents with agent analysis
- **Agents** — Built-in agent orchestration (personal team)
- **Vault** — Wiki-style knowledge graph (evolution of current Obsidian vault)
- **Canvas** — Visual workspace for diagrams, boards, mind maps
- **Pipes** — Data flows between sources (integrations)
- **Brain Dump** — Quick capture → auto-classify → route to correct namespace
- **Habits** — Tracking + streaks + agent nudges
- **Journal** — Daily reflections with AI summarization
- **Responsibilities** — Role-based task ownership

## Key Design Decisions (from research)

1. **Query Layer** — Fibery-style code-query over structured data, not just prose search
2. **Typed Entities** — Tana-inspired supertags with fields, not just markdown files
3. **MCP Exposure** — Vault/wiki exposed as MCP endpoint for external agent access
4. **Autonomy Slider** — User controls how much agents do autonomously vs with approval
5. **Artifact Persistence** — Agent outputs saved as first-class wiki entities

## Predecessors

- [[ExecuDeck]] — Spiritual predecessor (terminal + canvas concept)
- [[OpenClaw Agent System]] — Current agent infra, patterns carry forward

## Research

- [[Research/EMA-Wilson-Deep-Research-2026-03-31|EMA + Wilson Deep Research]]
- [[Architecture/Intelligence Layer - System Vision|Intelligence Layer Vision]]
- [[Research/Agent-OS-UX-Competitive-Deep-Dive|Agent OS UX Research]]

## Status

🔨 Active — Sprint 1 + EMA-001 through EMA-007 shipped. See [[Projects/EMA Sprint Status]] for current progress.
