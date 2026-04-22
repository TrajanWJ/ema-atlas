# Agent OS — Live Bridge Architecture

> Status: ✅ OPERATIONAL
> Created: 2026-03-20
> Updated: 2026-04-07
> Confidence: 0.90
> Type: Architecture

## Overview

Turn the Agent OS WebUI demo from a static mockup into a live client that bidirectionally mirrors Discord. Three persistence layers: Talk (messages), Queue (decisions/proposals), and Feed (agent activity log).

> **2026-04-07 Status:** Core infrastructure is live. Express API server running on :18790 (`~/Projects/agent-os-bridge/server.js`), OpenClaw gateway active, feed/queue/answers persistence all operational. SQLite database (`~/dispatch/dispatch.db`) added as additional persistence layer beyond the original file-based design. System has been extended with proposals, missions, inbox, and handoffs endpoints.

## Architecture

```
┌──────────────────────────────────────────────┐
│              Agent OS WebUI                   │
│  (GitHub Pages or self-hosted static)         │
│                                               │
│  Talk ←──→ /tools/invoke (message tool)       │
│  Queue ←──→ /api/queue (custom endpoint)      │
│  Feed ←──→ /api/feed (custom endpoint)        │
│                                               │
│  Live updates ←── WebSocket /ws               │
└──────────────────┬───────────────────────────┘
                   │ HTTPS/WSS
                   │
┌──────────────────┴───────────────────────────┐
│           OpenClaw Gateway :18789             │
│                                               │
│  /tools/invoke   → message tool → Discord API │
│  /api/queue      → ~/dispatch/queue/ (JSON)   │
│  /api/feed       → ~/dispatch/feed.jsonl      │
│  /ws             → event bus → live push      │
│                                               │
│  Auth: Bearer token (gateway.auth.password)   │
└──────────────────┬───────────────────────────┘
                   │
              Discord API
```

## Component Details

### 1. Talk — Discord Mirror

**Read messages:**
```
POST /tools/invoke
{
  "tool": "message",
  "args": {
    "action": "read",
    "channel": "discord",
    "to": "channel:<id>",
    "limit": 50
  }
}
```

**Send messages:**
```
POST /tools/invoke
{
  "tool": "message",
  "args": {
    "action": "send",
    "channel": "discord",
    "to": "channel:<id>",
    "message": "text"
  }
}
```

**Channel list:** Hardcode from `dispatch/channel-ids.json` initially. Later: `channel-list` action.

**Live updates:** Gateway WebSocket pushes new Discord messages as events. WebUI subscribes per-channel.

**Data flow:**
- WebUI → sends message → Gateway → Discord → appears in Discord
- Discord → new message → Gateway event bus → WebSocket → WebUI renders

### 2. Queue — Agent Decision Feed

**Storage:** `~/dispatch/queue/*.json` (one file per item, index.json for sorted manifest)

**Persistence:**
- Queue items written by agents via `queue-emit.sh`
- Resolved items moved to `~/dispatch/done/` with resolution metadata
- All items have: id, type, priority, title, context, options, source_agent, status, timestamps

**Discord mirror channel:** `#agent-queue` (to be created)
- New queue items posted as Discord messages with priority badges
- Resolution status edited into the original message
- Thread created for discussion items

**WebUI:**
- Queue page reads from `/api/queue` endpoint
- Actions (approve/reject/defer) POST back
- Live updates via WebSocket when new items arrive

**API endpoints:**
```
GET  /api/queue           → list pending items (sorted)
POST /api/queue/:id/resolve → resolve item {status, resolution}
GET  /api/queue/history    → resolved items (last 50)
```

### 3. Feed — Persistent Agent Activity Log

**Storage:** `~/dispatch/feed.jsonl` (append-only, one JSON object per line)

**Format:**
```json
{
  "id": "f-20260320-001",
  "agent": "righthand",
  "type": "task_started",
  "content": "Starting morning coordination batch",
  "timestamp": "2026-03-20T05:14:00Z",
  "pinned": false,
  "urgent": false,
  "channel": "agent-feed"
}
```

**Sources:**
- Agent dispatch starts/completions → auto-logged
- Heartbeat results → auto-logged
- Queue item resolutions → auto-logged
- Agent errors → auto-logged
- Manual events via `feed-emit.sh`

**Discord mirror:** Posts to `#agent-feed` channel (already exists)

**WebUI:** Feed page reads from `/api/feed` with pagination + type filtering

**API endpoints:**
```
GET /api/feed?limit=50&after=<id>&type=<type> → paginated feed
```

### 4. Answer/Response Persistence

**Storage:** `~/dispatch/answers.jsonl`

**Every answer sent through Talk is logged:**
```json
{
  "id": "a-20260320-001",
  "channel": "concierge",
  "channel_id": "1482997518362214422",
  "from": "user",
  "text": "Deploy v5.2 now",
  "timestamp": "2026-03-20T05:35:00Z",
  "reply_to": "q-20260320-003",
  "context": "queue_resolution"
}
```

## Gateway Extension

Need a lightweight OpenClaw extension that:
1. Serves `/api/queue`, `/api/feed`, `/api/answers` from the file system
2. Pushes events via WebSocket
3. Handles CORS for the WebUI domain

**Option A:** OpenClaw extension plugin (preferred — lives in the gateway process)
**Option B:** Standalone Express server on another port (simpler but another service)

Started with **Option B** — standalone Express server at `~/Projects/agent-os-bridge/server.js` on :18790, now stable and extended well beyond the original API surface. Migration to Option A deferred indefinitely as Option B has proven sufficient.

## Channel ID Map

```json
{
  "concierge": "1482997518362214422",
  "dispatch": "1484014822642286654",
  "desk": "1482996866428964904",
  "decisions": "1482939106223853740",
  "prompt-lab": "1484014825670574180",
  "ingestor-feed": "1482295358963974187",
  "vault-feed": "1483018390015709315",
  "links": "1482256987700990066",
  "research-feed": "1482258431997116531",
  "code-output": "1484014829156175893",
  "devils-corner": "1484014830280249395",
  "agent-feed": "1483010758408274027",
  "heartbeat": "1482256931375546489",
  "alerts": "1484014832599437372",
  "security": "1484014833790877716",
  "ops-log": "1482256984811114688",
  "raw-logs": "1482547280325120076",
  "projects": "1482899212889751745",
  "agent-status": "1484015032038850640",
  "agent-os-frontend": "1484411982487490701"
}
```

## Implementation Phases

### Phase 1: API Server + Talk Live ✅
- [x] Standalone Express server on :18790 (running since 2026-04-06)
- [x] Proxy to gateway /tools/invoke for message read/send
- [x] CORS for GitHub Pages domain
- [x] WebSocket for live message push
- [x] Update WebUI data.js to use real channel IDs
- [x] Update WebUI app.js sendMessage() to call API

### Phase 2: Queue + Feed Persistence ✅
- [x] /api/queue endpoints (list, resolve, history)
- [x] /api/feed endpoint (paginated, filtered)
- [x] /api/answers logging
- [x] Wire queue-emit.sh to also write feed entries
- [x] Discord mirror for queue items
- [x] SQLite persistence layer (dispatch.db with WAL mode) — added beyond original spec

### Phase 3: WebUI Integration (Partial)
- [x] Queue page reads real data
- [x] Feed page reads real data
- [x] Live WebSocket updates for all three
- [ ] Connection status indicator

### Phase 4: Extended API (emerged organically)
- [x] Proposals system (`~/dispatch/proposals/`, 26+ items)
- [x] Missions endpoint
- [x] Inbox endpoint
- [x] Handoffs endpoint
- [x] Dispatch command endpoint
- [x] Agents endpoint
- [x] Auto-resolution via queue-emit.sh (confidence >= 0.85)

## Security

- Gateway auth token required for all API calls
- Token stored in WebUI localStorage (user enters once)
- CORS restricted to specific origins
- No public exposure — LAN/Tailnet only

## Links

- [[Agent-Queue-System]] — Queue format and auto-resolve logic
- [[Future-Frontend-Layer]] — Original frontend vision
- [[Agent-OS-Frontend]] — Channel context
