---
id: "3f8353bb-b2f1-4ce1-b4ab-b98488be0253"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Frontend Audit — P0 Fixes Required
tags: [frontend, audit, p0, production-readiness]
source: session-2026-04-07
---

# Frontend P0 Fixes (Block Heavy Usage)

## P0-1: No Error Boundary (2h)
ErrorBoundary component EXISTS at components/ui/ErrorBoundary.tsx but is NEVER USED.
Any store error crashes entire UI. Wrap App + each vApp in boundaries.

## P0-2: No List Virtualization (4h)
ProposalQueue, TaskList use .map() without react-window.
60+ items = DOM explosion, scroll jank, memory leak.
Install @tanstack/react-virtual, wrap list components.

## P0-3: WebSocket Reconnection Broken (2h)
Socket reconnects via Phoenix, but channel handlers NOT re-registered.
After daemon restart, all WebSocket updates stop until page reload.
Fix: re-bind channel listeners on socket reconnect event.

## P1 Fixes
- P1-1: No daemon connection status indicator (user blind to offline)
- P1-2: Channel cleanup on leave (memory leak in long sessions)
- P1-3: No execution preflight UI (approve without seeing what will happen)

## Current Verdict: NOT READY for heavy usage
Need P0 fixes (8h) + P1 fixes (6h) = 14h to production readiness.
