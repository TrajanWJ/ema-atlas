---
title: "EMA"
type: reference
created: 2026-04-06
tags: [project, ai, desktop-app, elixir, phoenix, tauri, react, life-os]
summary: "Personal AI desktop app — autonomous thinking companion and life OS"
---

# EMA

Personal AI desktop app built as an autonomous thinking companion and life operating system. EMA runs as an always-on daemon that observes, proposes, and executes on the user's behalf.

## Status

- ~70% of spec built as of Apr 4, 2026
- Phase 1 MVP target: Apr 7-14
- 20-week roadmap from W7 to autonomous multi-user

## Location

`/home/trajan/Projects/ema`

## Tech Stack

- **Backend**: Elixir 1.16 / Phoenix 1.8 daemon, OTP supervision trees
- **Desktop Shell**: Tauri 2 (multi-window architecture)
- **Frontend**: React 19, TypeScript, Tailwind v4
- **Database**: SQLite
- **Comms**: REST API + WebSocket

## Key Features

- **ProposalEngine pipeline** — structured proposal generation and execution
- **Agents system** — autonomous task runners
- **Pipes system** — 7 stock pipes, 22 triggers for event-driven automation
- **13 frontend apps** within the Tauri shell
- **15 Zustand stores** for state management
- **Babysitter** — monitoring layer with 7 Discord streams
- **OTP supervision trees** for fault-tolerant backend processes

## Architecture Decisions

- Multi-window Tauri architecture allows each app to run in its own window
- Elixir/OTP chosen for supervision trees and fault tolerance in an always-on daemon
- SQLite for local-first data with no external database dependency
- Pipes system decouples triggers from actions, enabling composable automation

## Related

- [[Agent-OS-Demo]] — earlier interactive demo of the Agent OS concept
- [[Dispatch-System]] — task dispatch engine used alongside EMA
- [[Knowledge-Vault]] — Obsidian vault that EMA integrates with for knowledge management
- [[ExecuDeck]] — related executive command environment
