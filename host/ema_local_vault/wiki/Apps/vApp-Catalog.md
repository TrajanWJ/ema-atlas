---
title: "vApp Catalog"
space: wiki
tags: ["apps", "frontend", "catalog"]
source: manual
---

# vApp Catalog

28 active vApps routed in the EMA desktop app. Each app is a self-contained React component with a dedicated Zustand store, loaded via route-based switching in a single Tauri webview window.

**Source:** `app/src/App.tsx` (routing), `app/src/types/workspace.ts` (APP_CONFIGS)

## Core Workflow

| App | Component | Store | Accent | Purpose |
|-----|-----------|-------|--------|---------|
| brain-dump | `brain-dump/BrainDumpApp.tsx` | `brain-dump-store.ts` | #6b95f0 | Inbox capture, Kanban view, quick thoughts |
| tasks | `tasks/TasksApp.tsx` | `tasks-store.ts` | #6b95f0 | Task board, card details, status management |
| projects | `projects/ProjectsApp.tsx` | `projects-store.ts` | #2dd4a8 | Project grid, detail views, context docs |
| executions | `executions/ExecutionsApp.tsx` | `execution-store.ts` | #818cf8 | Execution diff, run history, output viewing |
| proposals | `proposals/ProposalsApp.tsx` | `proposals-store.ts` | #a78bfa | Queue, pipeline status, detail cards, lineage |

## Intelligence

| App | Component | Store | Accent | Purpose |
|-----|-----------|-------|--------|---------|
| intent-schematic | `intents/IntentSchematicApp.tsx` | `intent-schematic-store.ts` | #a78bfa | Wiki-based intent mapping, graph visualization |
| wiki | `wiki/WikiApp.tsx` | `wiki-engine-store.ts` | #60a5fa | Knowledge graph, page renderer, search, stats |
| agents | `agents/AgentsApp.tsx` | `agents-store.ts` | #a78bfa | Agent grid, chat, detail views, fleet management |

## Creative

| App | Component | Store | Accent | Purpose |
|-----|-----------|-------|--------|---------|
| canvas | `canvas/CanvasApp.tsx` | `canvas-store.ts` | #6b95f0 | Visual workspace, element editor, data sources |
| pipes | `pipes/PipesApp.tsx` | `pipes-store.ts` | #a78bfa | Event routing, trigger catalog, execution history |
| evolution | `evolution/EvolutionDashboard.tsx` | `evolution-store.ts` | #c084fc | Rule editor, rollback dialog, engine state |
| whiteboard | `whiteboard/WhiteboardApp.tsx` | — | #6b95f0 | Drawing canvas, sketch capture |
| storyboard | `storyboard/StoryboardApp.tsx` | — | #8b5cf6 | Story sequencing, scene management |

## Operations

| App | Component | Store | Accent | Purpose |
|-----|-----------|-------|--------|---------|
| decision-log | `decision-log/DecisionLogApp.tsx` | `decision-log-store.ts` | #c084fc | Decision tracking, rationale capture |
| campaigns | `campaigns/CampaignsApp.tsx` | — | #8b5cf6 | Campaign management |
| governance | `governance/GovernanceApp.tsx` | — | #10b981 | Rules engine, compliance tracking |
| babysitter | `babysitter/BabysitterApp.tsx` | — | #f59e0b | System monitoring, health checks |

## Life

| App | Component | Store | Accent | Purpose |
|-----|-----------|-------|--------|---------|
| habits | `habits/HabitsApp.tsx` | `habits-store.ts` | #2dd4a8 | Habit tracking, streak view, month/week views |
| journal | `journal/JournalApp.tsx` | `journal-store.ts` | #f59e0b | Daily entry editor, mood/energy, calendar strip |
| focus | `focus/FocusApp.tsx` | `focus-store.ts` | #f43f5e | Focus timer, session history, block management |
| responsibilities | `responsibilities/ResponsibilitiesApp.tsx` | `responsibilities-store.ts` | #f59e0b | Role management, check-in dialogs, health scoring |
| temporal | `temporal/TemporalApp.tsx` | `temporal-store.ts` | #f97316 | Rhythm/cadence management |
| goals | `goals/GoalsApp.tsx` | `goals-store.ts` | #f59e0b | Goal tracking, form, cards |

## System

| App | Component | Store | Accent | Purpose |
|-----|-----------|-------|--------|---------|
| hq | `hq/HQApp.tsx` | `dashboard-store.ts` | #6366f1 | Home dashboard (alternative to Launchpad) |
| settings | `settings/SettingsApp.tsx` | `settings-store.ts` | rgba(255,255,255,0.50) | App configuration, developer tab |
| voice | `voice/VoiceApp.tsx` | `voice-store.ts` | #00D2FF | Voice capture, Jarvis orb, transcript |

## Chat

| App | Component | Store | Accent | Purpose |
|-----|-----------|-------|--------|---------|
| operator-chat | `operator-chat/OperatorChatApp.tsx` | — | #6366f1 | Chat interface for human operator |
| agent-chat | `agent-chat/AgentChatApp.tsx` | — | #a78bfa | Chat interface with AI agents |

## Store Pattern

Every store follows the same architecture:

1. `loadViaRest()` — fetch initial state from daemon REST API on mount
2. `connect()` — join Phoenix channel for real-time PubSub updates
3. Domain-specific actions (CRUD, transitions, etc.)
4. Error handling with try/catch on init

Source: `app/src/stores/` (79 total stores, ~20 directly power active apps)

## Planned/Stub Apps (50+)

86 component directories exist total. Beyond the 28 active apps, ~50 directories are stubs or planned for future phases: agent-bridge, agent-fleet, audit-trail, cli-manager, code-health, contacts-crm, dispatch-board, file-vault, finance-tracker, gaps, git-sync, knowledge-graph, life-dashboard, mcp, meeting-room, memory, message-hub, metamind, prompt-workshop, routine-builder, security, service-dashboard, soul-editor, team-pulse, token-monitor, tunnel-manager, vm-health, and others.

## Related

- [[Desktop Shell]] — Shell, Launchpad, Dock, AmbientStrip architecture
- [[HQ Frontend]] — separate web dashboard
- [[Configuration-System]] — app settings and window state persistence
