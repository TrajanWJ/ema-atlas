---
title: Discord Server Map
created: '2026-03-16'
updated: '2026-04-04'
type: knowledge
status: active
confidence: 0.75
confidence_updated: 2026-04-04T00:00:00.000Z
source: manual revision
tags:
  - discord
  - channels
  - concierge
  - self-improvement
  - babysitter
  - ema
  - streams
  - agent-feed
summary: Current Discord guild map after the EMA-mirror + stream-lane restructuring. Includes bridge, command, signals, system, agent-work, projects, and stream semantics.
wiki_id: system/Discord_Server_Map
imported_from: vault/System/Discord Server Map.md
imported_at: '2026-04-04T00:23:57.223Z'
---
# Discord Server Map

> Last updated: 2026-04-04 UTC. Maintained by Right Hand.

This map reflects the **current** guild behavior after the EMA-oriented restructure and the Babysitter stream-lane pass.

## Operating principles

- `#concierge` is the primary human conversation surface.
- `#self-improvement-loop` is for evolution policy, fitness tracking, routing quality, and operating-contract changes.
- The `🧵 STREAM` category is **not** casual chat. It is a semantic lane system.
- `#babysitter-live` is operator rollup only — not freeform stream-of-consciousness.
- Discord and EMA should be treated as two surfaces of one operating system.

## 🛎️ BRIDGE
Primary human interface.

| Channel | Type | Purpose |
|---|---|---|
| #concierge | Text | Talk to Right Hand directly. Default live interface. |
| #📋-dispatch | Text | Issue commands asynchronously; get confirmations and results links. |
| #📢-daily-brief | Text / announcement-style | Morning synthesis and top priorities. |

## 🧠 COMMAND
Structured work and decision surfaces.

| Channel | Type | Purpose |
|---|---|---|
| #🗂️-desk | Forum | Task board. One thread per task. |
| #⚖️-decisions | Forum | Decision log with reversals and rationale. |
| #🧠-prompt-lab | Forum | Prompt, SOUL, and system-behavior iteration. |
| #❓-queue | Text | Decision queue mirrored from Agent OS / web workflows. |
| #📋-proposals | Text | Proposal mirror and triage surface. |
| #🔬-self-improvement-loop | Text | Evolution loop: fitness, corrections, promotable patterns, babysitter/EMA policy changes. |

## 📡 SIGNALS
Inbound intel and knowledge flow.

| Channel | Type | Purpose |
|---|---|---|
| #🔗-links | Text | Drop links for analysis. |
| #📡-ingestor-feed | Text | External intel feed (Reddit/GitHub/HN). |
| #📦-vault-feed | Text | Knowledge writes and vault/wiki updates. |
| #📚-links-reads-to-implement | Text | Implementation-oriented reads queue. |

## 🔧 SYSTEM
Operational health and infrastructure.

| Channel | Type | Purpose |
|---|---|---|
| #🫀-heartbeat | Text | High-level system health at a glance. |
| #🚨-alerts | Text | Problems only. If this has unread, something matters. |
| #⚙️-ops-log | Text | Ops runs, cron output, routine system activity. |
| #📜-raw-logs | Text | Unfiltered reference logs / black box recorder. |
| #🔒-security | Text | Security findings and hardening output. |
| #💬-agent-status | Voice | Lightweight status presence surface. |

## 🤖 AGENT WORK
Glanceable agent activity and outputs.

| Channel | Type | Purpose |
|---|---|---|
| #🤖-agent-feed | Text | Task lifecycle feed: queued, running, done, failed. |
| #🔬-research-feed | Text | Research summaries and findings. |
| #💻-code-output | Text | Code changes, build results, implementation output. |
| #😈-devils-corner | Text | Critique, red-team, and adversarial reviews. |
| #🤝-agent-orchestration | Text | Multi-agent coordination patterns and handoff design. |

## 🚀 PROJECTS
Project work happens in threads, not scattered channels.

| Channel | Type | Purpose |
|---|---|---|
| #🚀-projects | Forum | One thread per project with tags for phase / status. |
| #🤖-agent-os-frontend | Text | Current frontend replacement workstream for Agent OS. |

## 🧵 STREAM
Canonical semantic lanes for Babysitter / EMA realtime behavior.

| Channel | Purpose | Rule |
|---|---|---|
| #babysitter-sprint | Directives, approvals, escalations, milestone summaries | Control plane only |
| #system-heartbeat | Raw health facts | Facts only |
| #intent-stream | Action declarations before execution | Intent only |
| #pipeline-flow | Queued/running/completed/failed transitions and handoffs | State change only |
| #agent-thoughts | Provisional reasoning, hypotheses, uncertainty | Reasoning only |
| #memory-writes | Durable confirmed facts worth future recall | Durable facts only |
| #intelligence-layer | Second-order synthesis after multiple events/incidents | Synthesis only |
| #execution-log | Execution evidence / action-result trace | Evidence only |
| #babysitter-live | Operator rollup deltas | Synthesized operator delta only |

## Stream-lane rules

- One message type = one lane.
- Do not cross-post the same raw content across lanes.
- Raw event stays in its native lane; `#babysitter-live` gets only the synthesized delta.
- During provider pressure or auth churn, low-priority internal chatter should fail closed.

## Notes on drift

Older docs may still mention legacy categories like Trajan's Office, Command Center, Activity Feeds, or System Buildout. Treat those as historical unless they match the structure above.

## Related

- [[Discord-Channel-Directory]]
- [[Discord Channel Architecture Review]]
- [[Babysitter Stream Master Guide]]
