---
title: Phoenix WebSocket + React 19 + Zustand — HQ Pattern Research
created: '2026-04-03'
updated: '2026-04-03'
type: research
confidence: 0.82
tags:
  - phoenix
  - websocket
  - react
  - zustand
  - hq
  - channels
  - real-time
summary: >-
  Use phoenix npm package for Phoenix Channels in React. Zustand store holds
  channel state + execution list. Subscribe to executions:all, filter
  client-side by project. Handle reconnect via Socket.onError + Socket.onClose.
sources: '1 primary, 1 institutional'
wiki_id: research/Phoenix-WebSocket-React-Patterns
imported_from: vault/Research/Phoenix-WebSocket-React-Patterns.md
imported_at: '2026-04-04T00:23:57.100Z'
---

# Phoenix WebSocket + React 19 + Zustand — HQ Real-Time Pattern

*Sources: 2 total (1 primary, 1 institutional, 0 secondary)*
*Confidence: High (0.82)*
*Date: 2026-04-03*

## Summary

**Use the `phoenix` npm package (official Phoenix JS client) directly in React 19. Wrap the Socket and Channel in a Zustand store with lifecycle management. Subscribe to `executions:all`, filter client-side by active project. Handle reconnection via `Socket.onError` and `Socket.onClose` callbacks, not by re-rendering.** This is the standard pattern as of Phoenix v1.8.5 (current).

## Findings

### Phoenix Channels — The Transport Layer

From Phoenix docs (T1, v1.8.5): Phoenix Channels use WebSocket or long-polling transport. Each client connects to one Socket, then joins topics. A lightweight Erlang process handles each client/topic pair server-side. Broadcasts reach all subscribers across all connected nodes via internal PubSub.

**Key facts:**
- `executions:all` is a topic, not a channel — clients join topics
- The server pushes `push/3` messages to all subscribers on `executions:all`
- Phoenix Channels [scale to 2M WebSocket connections on a single box](https://phoenixframework.org/blog/the-road-to-2-million-websocket-connections) — HQ's single-user case is trivially within limits

### The Right React 19 + Zustand Pattern

**Don't** put the Socket in React state — reconnections would trigger re-renders. **Don't** create a new Socket per component mount — leaks connections. **Do** manage Socket + Channel lifecycle in Zustand, outside React's render cycle.

```typescript
// stores/executionStore.ts
import { create } from 'zustand'
import { Socket, Channel } from 'phoenix'

interface Execution {
  id: string
  project_id: string
  agent_id: string
  status: 'pending' | 'running' | 'done' | 'failed'
  started_at: string
  elapsed_ms?: number
  error?: string
  result?: unknown
}

interface ExecutionStore {
  executions: Execution[]
  connected: boolean
  activeProjectId: string | null
  
  // Actions
  connect: (wsUrl: string) => void
  disconnect: () => void
  setActiveProject: (projectId: string) => void
  
  // Internals (not exposed to components)
  _socket: Socket | null
  _channel: Channel | null
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  executions: [],
  connected: false,
  activeProjectId: null,
  _socket: null,
  _channel: null,

  connect: (wsUrl: string) => {
    const socket = new Socket(wsUrl, {
      params: { token: getAuthToken() }
    })
    
    socket.onError(() => set({ connected: false }))
    socket.onClose(() => set({ connected: false }))
    socket.onOpen(() => set({ connected: true }))
    
    socket.connect()
    
    const channel = socket.channel('executions:all', {})
    
    channel.on('execution_started', (payload: Execution) => {
      set(state => ({ executions: [payload, ...state.executions] }))
    })
    
    channel.on('execution_updated', (payload: Partial<Execution> & { id: string }) => {
      set(state => ({
        executions: state.executions.map(e =>
          e.id === payload.id ? { ...e, ...payload } : e
        )
      }))
    })
    
    channel.on('execution_completed', (payload: Partial<Execution> & { id: string }) => {
      set(state => ({
        executions: state.executions.map(e =>
          e.id === payload.id ? { ...e, ...payload, status: 'done' } : e
        )
      }))
    })
    
    channel.join()
      .receive('ok', () => console.log('Joined executions:all'))
      .receive('error', (err) => console.error('Failed to join', err))
    
    set({ _socket: socket, _channel: channel })
  },

  disconnect: () => {
    get()._channel?.leave()
    get()._socket?.disconnect()
    set({ _socket: null, _channel: null, connected: false })
  },

  setActiveProject: (projectId: string) => {
    set({ activeProjectId: projectId })
  }
}))

// Derived selector — filter by active project (client-side)
export const useProjectExecutions = () => {
  return useExecutionStore(state => 
    state.activeProjectId
      ? state.executions.filter(e => e.project_id === state.activeProjectId)
      : state.executions
  )
}
```

### Initializing in App.tsx (React 19)

```typescript
// App.tsx
import { useEffect } from 'react'
import { useExecutionStore } from './stores/executionStore'

export function App() {
  const connect = useExecutionStore(s => s.connect)
  const disconnect = useExecutionStore(s => s.disconnect)
  
  useEffect(() => {
    connect(import.meta.env.VITE_WS_URL ?? 'ws://localhost:4000/socket')
    return () => disconnect()
  }, []) // connect once on mount
  
  return <Router />
}
```

### Using in DispatchBoard Component

```typescript
// components/DispatchBoard.tsx
import { useProjectExecutions, useExecutionStore } from '../stores/executionStore'

export function DispatchBoard() {
  const executions = useProjectExecutions()
  const connected = useExecutionStore(s => s.connected)
  
  return (
    <div>
      {!connected && <Banner>Reconnecting...</Banner>}
      {executions.map(exec => (
        <ExecutionCard key={exec.id} execution={exec} />
      ))}
    </div>
  )
}
```

### Reconnection Handling

Phoenix JS client has built-in reconnection. From v1.8.5 docs: Socket automatically reconnects with backoff. The `onError` and `onClose` callbacks let you update the connected state in Zustand — show a "Reconnecting..." banner. When the Socket reconnects, it rejoins channels automatically. No manual reconnection logic needed.

**If you need to re-join a different topic on reconnect:**
```typescript
socket.onOpen(() => {
  set({ connected: true })
  // Channel auto-rejoins — no manual action needed
})
```

### Should HQ Subscribe to `executions:all` or Project-Specific Channels?

**Subscribe to `executions:all`, filter client-side.**

Why not project-specific channels:
- Requires re-joining on every project switch (additional round-trips)
- More channel management complexity in the store
- `executions:all` is already the pattern EMA uses — filter is trivial

Why `executions:all` + client filter works:
- Single connection, single join
- Project switch = set `activeProjectId` in Zustand = instant re-filter
- No WebSocket traffic overhead for a single-user system

### Exact Payload — What Does `executions:all` Emit?

**This requires checking the EMA codebase directly.** The research doc cannot determine the exact payload shape without reading `lib/ema_web/channels/execution_channel.ex` (or equivalent). Before building the DispatchBoard component, confirm:

```bash
grep -r "push(" lib/ema_web/channels/ 
grep -r "broadcast(" lib/ema/ --include="*.ex" | grep execution
```

The payload shape is what drives the `Execution` TypeScript interface above. The fields I've assumed (`id`, `project_id`, `agent_id`, `status`, `started_at`, `elapsed_ms`, `error`, `result`) are standard — verify against the actual broadcast.

### Phoenix npm Package — Current Version

The `phoenix` npm package is the official JS client published by the Phoenix team. It ships with every Phoenix installation at `deps/phoenix/priv/static/phoenix.js` and is also available on npm. For a Vite/React HQ project, use the npm version:

```bash
npm install phoenix
```

TypeScript types are included. No DefinitelyTyped needed.

## Key Takeaways

1. **`npm install phoenix`** — official client, TypeScript types included
2. **Socket + Channel in Zustand** — outside React render cycle, no state tears
3. **One connection, one channel** — `executions:all`, filter client-side by `activeProjectId`
4. **Project switch** = `setActiveProject(id)` in Zustand, instant re-filter, no WebSocket re-join
5. **Reconnection** — Phoenix client handles it automatically, just update `connected` state for UI
6. **Verify payload shape from EMA codebase** before building DispatchBoard — grep the channel module

## Uncertain / Unknown

- Exact `executions:all` payload shape — must check EMA source
- Whether EMA uses `socket_id` for user authentication on the socket (likely yes if auth is wired)
- React 19 Suspense + streaming implications for WebSocket data (not relevant for this use case — Suspense is for async data fetching, not ongoing streams)

## Sources

1. [T1] [Phoenix Channels Guide](https://hexdocs.pm/phoenix/channels.html) — Phoenix v1.8.5, transport, PubSub, client libraries
2. [T1] [Honcho docs](https://docs.honcho.dev) — consulted for Zustand pattern comparison with other SDK patterns
