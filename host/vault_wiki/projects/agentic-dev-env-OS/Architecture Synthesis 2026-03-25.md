---
date: 2026-03-26T00:00:00.000Z
type: project
status: in-progress
project: agentic-dev-env-OS
tags:
  - agent-os
  - architecture
  - place.org
  - system-design
  - synthesis
source: 'SESSION-NOTES.md (2026-03-25 22:37–23:53 UTC)'
wiki_id: projects/agentic-dev-env-OS/Architecture_Synthesis_2026-03-25
imported_from: vault/Projects/agentic-dev-env-OS/Architecture Synthesis 2026-03-25.md
imported_at: '2026-04-04T00:23:56.902Z'
summary: ''
---

# Agentic Dev Environment OS — Architecture Synthesis

Design session ran ~1.5 hours across 13+ rounds of proposals and feedback. This note extracts the confirmed decisions and surviving concepts from the raw session notes.

## What's Actually Being Built

A **management and orchestration OS** — not a development environment. The distinction Trajan kept hammering:

> "The OS is mission control. Claude Code on real machines does the work. The OS gives you god-view over all of it."

- You **develop** in Claude Code CLI on physical devices (Mac, workstation)
- The OS **manages**: sessions, agents, context, dispatch, memory, sync
- place.org stays as the desktop shell — add to it, don't replace it

## Confirmed Architecture Pillars

### 1. OpenClaw's Agentic Layer Preserved
- Agent orchestration, personalities, specialist dispatch, Right Hand coordination — all stay
- OpenClaw is NOT reduced to a thin pipe
- OpenClaw must be dispatchable BY Claude Code too (bidirectional control)

### 2. Bidirectional Claude Code Sync
- Work in Claude Code CLI on Mac → OS mirrors it
- Dispatch from OS → CLI on device reflects it
- Full session context continuity across devices
- Sessions stored as JSONL at `~/.claude/projects/<path>/<uuid>.jsonl` (already mapped)
- Key flags: `--resume`, `--continue`, `--fork-session`, `--output-format stream-json`

### 3. Virtual Claude Code / Codex App in OS
- A Codex/Claude Code UI-like virtual app living inside the desktop OS
- Stays concurrent with actual CLI sessions — not a separate thing
- Lets you switch between devices/sessions, manage context, see diffs

### 4. place.org as Foundation
- The existing desktop OS shell (22 apps, design language, window manager) stays
- The 40K-line OpenClaw Control UI (Lit web components, gateway protocol, 20 controllers) is 70% of the agent management layer — already built
- Agent OS Bridge (90+ API endpoints) already built
- Add new apps, don't rebuild what exists

### 5. New Agent-Native Apps (Confirmed Energy)
| App | Status | Notes |
|-----|--------|-------|
| Chat app | ✅ Confirmed | Standard ChatGPT/Claude.ai UI as virtual app |
| Code app | ✅ Confirmed | Codex/Claude Code frontend, multi-device, bidirectional |
| Agent management | 🔶 Exploring | Something beyond orchestration — not clear yet |
| Living Apps (A) | ✅ Energy | Agents interact with existing app state |
| Daemon Desktop (C) | ✅ Energy | Persistent watcher, surfaces what matters |
| Morning Brief (F) | ✅ Energy | Opinionated daily briefing |
| Ghost Mode (G) | ✅ Energy | Per-app agent toggle |
| Workspaces (H) | ✅ Energy | Physical desktops per project/context |
| Ambient Agent Layer (I) | ✅ Energy | Distributed agent presence in every app |
| Vault browser (J) | ✅ Energy | Native to OS |
| OpenClaw UI port (E) | ✅ Energy | Port existing agent management into place.org |
| Intention Mirror | ✅ Sick | Embedded behavior, NOT its own app |
| Commitment/responsibilities layer | ✅ Alive | — |
| Prospective memory hooks | ✅ Interesting | Event-based, implementation hard |

**Pattern confirmed:** Trajan gravitates toward behaviors/layers embedded in existing apps, NOT new standalone apps.

### 6. Executive Functioning as Core Focus
- Biggest pain point: executive functioning and personal management
- Should be a large focus of what the OS does differently

### 7. Intention Alignment as First-Class Interaction
- The iterative proposal → feedback → refinement → convergence workflow (this session itself) should be a built-in interaction type with agents
- "Intention Alignment interface" concept

## Key Technical Discoveries

### What's Already Built (Don't Rebuild)
- **OpenClaw Control UI** — 40K lines, Lit web components, gateway protocol, 20 controllers, chat subsystem, auth
- **Agent OS Bridge** — 90+ API endpoints (Stream, Inbox, Talk, Tasks, Mind, Workbench, Missions, System, Roles)
- **place.org desktop** — 22 apps, window manager, design language
- **Life OS** — 13 productivity pages, 80% done in place.org already

### Memory Architecture
- Vault = source of truth for system specs, design docs, agent configs
- Vault also serves as agent-user communication and workspace layer
- LanceDB under consideration to replace QMD (vector search + FTS + SQL in one embedded lib)
- Vault Cognitive Layer vision: metabolism (activation decay), Neo4j typed edge graph, context injection

### Research Inputs (Deep Dives Completed)
Three deep research docs informed rounds O–V:
1. **Speculative UI** — CrewAI, AutoGen, LangGraph, Cursor, Bret Victor, Ink&Switch, Matuschak
2. **Competitive UX** — Linear, Height, Graphite, Plane
3. **Business Paradigms** — Salesforce records, Odoo modules, ERPNext DocTypes, MRP capacity planning

**Most resonant patterns from research:**
- **Salesforce Record Page** — universal record anatomy for everything (agents, sessions, projects)
- **Height AI as teammate** — agent actions visible as feed items with avatars
- **Odoo modular composition** — install agent module → gain views + schemas + capabilities
- **ERPNext DocType** — universal record system, no-code extensible
- **Attio relationship graph** — links between things ARE the interface
- **Cursor autonomy slider** — spectrum from suggest to autopilot per task type
- **Graphite "Your Turn"** — clear indicator of whose turn it is (human or agent)
- **Basecamp Hill Charts** — track understanding not completion
- **AutoGen conversation-as-workflow** — agents talking = readable workflow

## What Was Killed

- Canvas (dragging boxes — impractical)
- War Room, Timeline, Constellation, Live Presence
- Dispatch forms, Review Queue, Feeds as standalone apps
- Training/Tuning UI
- Sessions as fundamental object
- Friction Audit, Now or Never, Commitment Ledger (standalone), Proposal Diff Viewer
- Context Injection app, The Tide, Read the Room, Anticipatory Workspace

## Current Status

Session ended with rounds O–V posted, awaiting Trajan feedback. Design still converging — not yet ready to build. Next round will be round 14+.

**Alignment was low through rounds 1–13** — Trajan pushed for bigger picture thinking, more rounds. The breakthroughs came when research-informed thinking replaced abstract proposals.

## Next Actions

- [ ] Trajan review directions O–V, provide round 14 feedback
- [ ] Once direction confirmed, create concrete implementation plan
- [ ] Map place.org's existing apps to determine what to port vs. add
- [ ] Spec out bidirectional Claude Code sync protocol
- [ ] Decide: LanceDB vs. keep QMD for vault search

## Related Notes
- [[SESSION-NOTES.md]] — raw round-by-round session log
- [[vault/Research/Agent-OS-Speculative-UI-Deep-Dive.md]]
- [[vault/Research/Agent-OS-UX-Competitive-Deep-Dive.md]]
- [[vault/Research/Agent-OS-Business-Software-Paradigms.md]]
- [[vault/System/Aspirational System Design.md]] — 4 horizons
- [[vault/Projects/Future Frontend Layer.md]]
- [[vault/Projects/place.org-openclaw-vision.md]]
