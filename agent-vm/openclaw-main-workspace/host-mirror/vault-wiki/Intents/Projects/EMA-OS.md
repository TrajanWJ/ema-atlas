---
title: "EMA OS"
intent_level: 2
intent_kind: task
intent_status: implementing
intent_priority: 1
project: ema
parent: "[[Ship-Core-Loop]]"
tags: ["project", "ema", "daemon", "frontend"]
---

# EMA OS

The EMA daemon + frontend system. Elixir/Phoenix backend with Tauri 2 + React 19 frontend.

## What
The core application: 50+ frontend apps, 350+ REST endpoints, 34 WebSocket channels, 80+ SQLite tables. Proposal pipeline, agent system, second brain, pipes automation.

## Status
Phase 1 complete. Phase 2 (intelligence layer) in progress.

## Children
- [[Execution-Engine]]
- [[Proposal-Pipeline]]
- [[Second-Brain]]

## Related
- [[Actor-Workspace]] -- workspace collaboration layer on top of EMA OS
