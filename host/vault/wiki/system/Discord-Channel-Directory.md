---
tags:
  - system
  - discord
  - reference
  - babysitter
  - ema
  - streams
updated: '2026-04-04'
type: knowledge
wiki_id: system/Discord-Channel-Directory
imported_from: vault/System/Discord-Channel-Directory.md
imported_at: '2026-04-04T00:23:57.223Z'
summary: Current active Discord channel directory with explicit lane semantics for self-improvement and Babysitter stream surfaces.
---
# Discord Channel Directory

> Current reference for the Agent OS Discord guild.
> Updated: 2026-04-04 UTC

## Key behavior notes

- `#concierge` = primary interface with Right Hand.
- `#🔬-self-improvement-loop` = policy/evolution lane, not raw stream chatter.
- `🧵 STREAM` channels are semantic lanes. They are not interchangeable.
- `#babysitter-live` is operator rollup only.
- Discord and EMA behavior should stay aligned.

## ⚡ ACTIVE

| Channel | Type | Topic / Use |
|---------|------|-------------|
| #🔧-claw-discord-setup | text | Discord/OpenClaw wiring, repairs, channel sync, naming, webhooks. |
| #ingestor-researcher-dispatcher-propositioner | text | Ingestor/feed pipeline wiring and related research automation. |
| #🔬-self-improvement-loop | text | Evolution policy, fitness scoring, corrections, promotable patterns, babysitter/EMA operating changes. |
| #🤖-agent-os-frontend | text | Frontend workstream to replace Discord as the long-term operator UI. |
| #📚-links-reads-to-implement | text | Reads, tools, libraries, and links that may turn into implementation work. |
| #🤝-agent-orchestration | text | Multi-agent coordination, handoffs, routing patterns, and workflow design. |
| #claude-full-remote-discord | text | Remote/Claude-side Discord experiments and related notes. |
| #🗄️-the-vault | text | Vault/wiki operations, knowledge hygiene, staleness checks, and structure work. |

## 🛎️ BRIDGE

| Channel | Type | Topic / Use |
|---------|------|-------------|
| #concierge | text | Talk to Right Hand. Real-time conversation, requests, delegation, synthesis. Primary human interface. |
| #📋-dispatch | text | Command dropbox. State what you want done + context; get confirmation and results routing. |
| #📢-daily-brief | text | Morning synthesis, overnight completions, and current priorities. |

## 🧠 COMMAND

| Channel | Type | Topic / Use |
|---------|------|-------------|
| #🗂️-desk | forum | Task board. One thread per task. Tags carry status and owner context. |
| #⚖️-decisions | forum | Decision log. Pending → decided → reversed, with rationale. |
| #🧠-prompt-lab | forum | Prompt/system/SOUL work. Draft → tested → deployed. |
| #❓-queue | text | Decision queue mirrored from Agent OS / web UI. |
| #📋-proposals | text | Proposal mirror: triage verdicts, approvals, movement. |

## 📡 SIGNALS

| Channel | Type | Topic / Use |
|---------|------|-------------|
| #🔗-links | text | Drop links for analysis. |
| #📡-ingestor-feed | text | Hourly/periodic external intel feed. |
| #📦-vault-feed | text | Vault/wiki writes and knowledge updates. |

## 🔧 SYSTEM

| Channel | Type | Topic / Use |
|---------|------|-------------|
| #💬-agent-status | voice | Status presence / lightweight at-a-glance occupancy. |
| #⚙️-ops-log | text | Routine ops log, cron output, dispatch cycles. |
| #📜-raw-logs | text | Unfiltered black box recorder. Mute by default. |
| #🔒-security | text | Security scans, hardening, and vulnerability output. |
| #🫀-heartbeat | text | High-level system health surface. |
| #🚨-alerts | text | Problems only. Silent when healthy. |

## 🤖 AGENT WORK

| Channel | Type | Topic / Use |
|---------|------|-------------|
| #🤖-agent-feed | text | Task lifecycle feed. Glanceable queued → running → done / failed lines. |
| #🔬-research-feed | text | Research summaries. Lead with finding; details can live in thread or artifact. |
| #💻-code-output | text | Code results: what changed, build state, commit/PR output. |
| #😈-devils-corner | text | Critique, debate, red-team output. |

## 🚀 PROJECTS

| Channel | Type | Topic / Use |
|---------|------|-------------|
| #🚀-projects | forum | One thread per project. Context and updates stay with the project thread. |

## 🧵 STREAM

| Channel | Type | Topic / Use |
|---------|------|-------------|
| #babysitter-sprint | text | Directives, approvals, escalations, milestone summaries. Control plane only. |
| #system-heartbeat | text | Raw health facts only. |
| #intent-stream | text | Action declarations before execution. |
| #pipeline-flow | text | Queued/running/completed/failed transitions and handoffs. |
| #agent-thoughts | text | Provisional reasoning, hypotheses, uncertainty. |
| #memory-writes | text | Durable confirmed facts worth future recall. |
| #intelligence-layer | text | Second-order synthesis after multiple events or incidents. |
| #execution-log | text | Execution evidence / action-result trace. |
| #babysitter-live | text | Operator rollup deltas only — not raw stream-of-consciousness. |

## Stream contract shorthand

- One message type = one lane.
- Raw facts stay in their native lane.
- `#babysitter-live` gets only synthesized operator meaning.
- No duplicate cross-posting of the same raw content.
- Under pressure, low-value internal chatter should quiet down first.

## Archived Channels

Older `z-*` channels and pre-restructure references are historical only. Prefer the active map above unless a migration note explicitly says otherwise.
