---
title: "HQ Frontend"
space: wiki
tags: ["apps", "frontend", "hq", "web"]
source: manual
---

# HQ Frontend (LaunchpadHQ)

Separate React web frontend providing a dashboard interface to the EMA daemon. Unlike the Tauri desktop app, HQ runs as a standard web application accessible via browser.

**Source:** `hq-frontend/src/`

## Architecture

React 19 + TypeScript + Zustand + Vite. Connects to the same Phoenix daemon (localhost:4488) as the desktop app via REST + WebSocket channels.

## Pages (9 Routes)

| Page | Component | Purpose |
|------|-----------|---------|
| Dashboard | `components/dashboard/` | System overview, stat cards, activity feed |
| Projects | `components/pages/ProjectsPage.tsx` | Project listing and management |
| Executions | `components/pages/ExecutionsPage.tsx` | Execution history, status, output |
| Agents | `components/pages/AgentsPage.tsx` | Agent management and chat |
| BrainDump | `components/pages/BrainDumpPage.tsx` | Inbox/capture management |
| Actors | `components/pages/ActorsPage.tsx` | Actor/workspace identity management |
| Spaces | `components/pages/SpacesPage.tsx` | Multi-context space management |
| Orgs | `components/pages/OrgsPage.tsx` | Organization hierarchy |
| Intents | `components/pages/IntentsPage.tsx` | Intent graph navigation |

## Shell Components

| Component | Purpose |
|-----------|---------|
| TopBar | Header with health indicator, connection status |
| Sidebar | Navigation with toggle |
| FloatingWindow | Multi-window support (Executions, Agents, BrainDump) |

## Dashboard Widgets

AgentWidget, BrainDumpWidget, ExecutionFeed, HostingWidget, SupermanWidget, DispatchWidget, StatCards.

## Stores (9 Zustand Stores)

All follow REST-load → WS-connect pattern:

| Store | Channel | Purpose |
|-------|---------|---------|
| actorStore | actor:lobby | Actor state and phases |
| dashboardStore | dashboard:main | Dashboard metrics |
| executionStore | execution:feed | Execution history |
| intentStore | intent:tree | Intent graph |
| orgStore | org:lobby | Organization data |
| projectStore | project:lobby | Projects |
| spaceStore | space:lobby | Spaces |
| tagStore | — | Universal tags |
| uiStore | — | UI state (active page, floating windows) |

## API Integration

| Module | Purpose |
|--------|---------|
| `api/hq.ts` | REST client for initial data load (localhost:4488) |
| `api/socket.ts` | Phoenix channel subscriptions (ws://localhost:4488/socket) |
| `api/superman.ts` | Superman knowledge graph queries |

## Relationship to Desktop App

HQ Frontend and the Tauri desktop app are two views of the same daemon:
- Same REST API endpoints
- Same WebSocket channels
- Same underlying data
- Different UI: HQ is web-native (browser), desktop app is Tauri with glass morphism

## Related

- [[LaunchpadHQ]] — project page with build phases
- [[Desktop Shell]] — Tauri desktop app architecture
- [[vApp Catalog]] — desktop app vApps
