# CLAUDE.md — place.org × OpenClaw Fork

This is a fork of place.org that adds AI agent features via OpenClaw integration.

## Critical Rule — READ THIS FIRST
**NEVER modify files outside `src/openclaw/` and `docs/openclaw/`.**
All upstream code in `src/components/`, `src/stores/`, `src/hooks/`, `src/types/`, `src/lib/`, `src/data/`, `src/db/` is **READ-ONLY** in this fork.

The ONE exception: `src/app/layout.tsx` has a single import + call to `initOpenClaw()`. This is the only upstream touch.

## Why This Rule Exists
This fork auto-syncs with upstream place.org via `git fetch upstream && git merge upstream/main`. If we modify upstream files, merges break. All AI features must be purely additive.

## Architecture
```
src/openclaw/                  ← ALL fork code lives here
├── gateway/                   ← WebSocket client to OpenClaw gateway (port 18789)
│   ├── client.ts              ← WS client (ported from openclaw-control-ui gateway.ts)
│   ├── auth.ts                ← Device identity + ECDSA P-256 challenge-response
│   ├── protocol.ts            ← Protocol types: req/res/event JSON frames
│   ├── hooks.ts               ← useGateway(), useGatewayEvent(), useAgentSessions()
│   └── provider.tsx           ← <OpenClawProvider> React context wrapper
├── apps/                      ← Fork-only apps (same PlaceApp contract as upstream)
│   ├── agent-chat/            ← Chat window to any agent (uses gateway chat.* RPC)
│   ├── agent-monitor/         ← Live dashboard of agent sessions (sessions.list + agents.list)
│   ├── dispatch/              ← Visual task dispatch panel
│   ├── missions/              ← Hill chart goal tracking (from Agent OS)
│   └── pipe-builder/          ← Visual workflow editor
├── stores/                    ← Fork-only Zustand stores
│   ├── agent-store.ts         ← Agent sessions, status, history
│   ├── dispatch-store.ts      ← Task dispatch lifecycle
│   └── gateway-store.ts       ← Connection state, auth, events
├── hooks/                     ← Fork-only React hooks
├── types/                     ← Fork-only TypeScript types
│   └── window-ext.ts          ← Extended AppId type (upstream AppId | fork apps)
├── widgets/                   ← Ambient bar widgets, dock badges
│   ├── agent-status-widget.tsx ← "🤖 3 agents running" in ambient bar
│   └── dispatch-badge.tsx     ← Pending task count on dock icon
├── enhancements/              ← Wrappers adding agent features to upstream apps
│   ├── brain-dump-agent.tsx   ← "Route to agent" action
│   ├── tasks-agent.tsx        ← Agent-assignable tasks
│   ├── terminal-agent.tsx     ← `agent spawn/list/status/kill` commands
│   ├── flux-agent.tsx         ← Agent events in Flux timeline
│   └── dashboard-agent.tsx    ← Agent metrics widgets
├── app-registry-ext.ts        ← Registers fork apps into upstream registry
├── entry.tsx                  ← Fork initialization (called from root layout)
└── README.md                  ← Quick reference for AI agents
```

## Enhancement Pattern
Enhancements wrap upstream apps without modifying them. Every enhancement MUST:
1. Check `if (!gatewayConnected) return null` — graceful degradation
2. Use the event bus or extension points, never direct imports of upstream internals
3. Fail silently when gateway is offline — fork becomes identical to vanilla place.org

## Gateway Protocol
JSON frames over WebSocket. Ported from `~/openclaw-control-ui-source/src/ui/gateway.ts`.
- Request: `{ type: "req", id: "<uuid>", method: "<rpc>", params: {...} }`
- Response: `{ type: "res", id: "<uuid>", ok: true, payload: {...} }`
- Push event: `{ type: "event", event: "<name>", payload: {...}, seq: <n> }`
- Auth: ECDSA P-256 challenge-response with device identity caching

Key RPC methods: `chat.send`, `chat.history`, `sessions.list`, `agents.list`, `agents.config`, `config.get`, `config.set`, `sessions.usage`

## Syncing with Upstream
```bash
git fetch upstream && git merge upstream/main --no-edit
pnpm build  # verify nothing broke
```

## Key Reference Docs
- `docs/openclaw/FORK-ARCHITECTURE.md` — Full architecture + conflict prevention rules
- `docs/openclaw/AI-FEATURES.md` — What the fork adds (feature inventory)
- `~/openclaw-control-ui-source/ARCHITECTURE.md` — Control UI source to port from
- `~/vault/Projects/place.org-openclaw-vision.md` — Full product vision
