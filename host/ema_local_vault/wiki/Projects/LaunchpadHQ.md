---
title: "LaunchpadHQ"
space: wiki
tags: ["projects","ema","frontend","launchpadhq"]
source: manual
updated: 2026-04-06
---

# LaunchpadHQ — EMA Web Command Center

Web-accessible frontend for EMA, separate from the Tauri desktop app. Lives at `~/Projects/ema/hq-frontend/`.

## Quick Info

| Field | Value |
|-------|-------|
| Path | `~/Projects/ema/hq-frontend/` |
| Stack | React 18 + Zustand 5 + Vite 6 + TypeScript 5.8 |
| Dev Port | 5173 |
| Daemon | localhost:4488 (Phoenix REST + WebSocket) |
| Pages | 9 |
| Stores | 9 |
| Build | `npm run build` → tsc + vite → dist/ (214KB, 64KB gzip) |

## Architecture

```
LaunchpadHQ (React SPA)
  ├── REST → Phoenix :4488/api (initial load)
  ├── WebSocket → Phoenix :4488/socket (real-time channels)
  │   ├── projects:lobby
  │   ├── executions:all
  │   └── actors:lobby
  └── localStorage (active space, active project)
```

No hq-api dependency. No Tauri dependency. Runs in any browser.

## Pages

| Page | Route | Data Source |
|------|-------|-------------|
| Dashboard | default | `/api/dashboard/today` + stores |
| Projects | projects | `/api/projects` + channel |
| Executions | executions | `/api/executions` + channel |
| Agents | agents | actorStore + executionStore |
| Brain Dump | braindump | `/api/brain-dump/items` |
| Intents | intents | `/api/intents` |
| Actors | actors | `/api/actors` + channel |
| Spaces | spaces | `/api/spaces` |
| Orgs | orgs | `/api/orgs` |

## Stores

| Store | Channel | Key Features |
|-------|---------|--------------|
| projectStore | projects:lobby | CRUD, active project in localStorage |
| executionStore | executions:all | Full lifecycle, approve/cancel, REST fallback |
| actorStore | actors:lobby | Phase transitions, human+agent |
| spaceStore | — (REST only) | Active space in localStorage |
| orgStore | — (REST only) | Members, invitations |
| tagStore | — (REST only) | Entity-scoped universal tags |
| intentStore | — (REST only) | 6-level hierarchy, tree |
| dashboardStore | — (REST only) | Today dashboard aggregate |
| uiStore | — (local) | Page routing, sidebar, floating windows |

## Remaining Work (Phases 5-6 from plan)

### Phase 5: Enhanced Executions & Projects
- Execution events timeline (`/api/executions/:id/events`)
- Agent session viewer (`/api/executions/:id/agent-sessions`)
- Diff viewer (`/api/executions/:id/diff`)
- Dispatch board widget (`/api/dispatch-board/stats`)
- Project context view with linked tasks/proposals/executions

### Phase 6: Intent Engine & Brain Dump Enhancement
- Intent tree view (hierarchical rendering of `/api/intents/tree`)
- Intent lineage view (`/api/intents/:id/lineage`)
- Intent runtime status (`/api/intents/:id/runtime`)
- Attach actors/executions/sessions to intents
- Brain dump container scoping (dump to space/project/task)
- Brain dump actor_id tracking

### Cross-cutting
- WorkContainerPanel — reusable panel showing brain dumps, tags, entity_data per entity
- TagPanel — reusable tag add/remove UI for any entity
- Space-scoped data filtering (all stores filter by activeSpaceId)
- Actor perspective toggle in TopBar

## Related

- [[EMA]]
- [[EMA Architecture Overview]]
