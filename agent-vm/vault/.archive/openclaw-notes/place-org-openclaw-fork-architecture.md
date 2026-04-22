---
date: 2026-03-25
tags: [architecture, place-org, openclaw, fork, git]
status: active
---

# place.org × OpenClaw Fork — Architecture & Sync Guide

> How to maintain a fork of place.org that adds AI/agent features while automatically staying in sync with upstream.

---

## 1. The Principle: Additive Only

The fork NEVER modifies upstream files. All AI features live in their own directories and files. Upstream changes merge cleanly because there are no conflicts — the fork only ADDS, never EDITS.

The one exception: a few **extension points** in upstream that the fork hooks into. These are minimal, clearly marked, and designed to merge cleanly.

---

## 2. Git Setup

```bash
# On host machine
cd ~/Desktop
git clone ~/Desktop/place.org place.org-openclaw
cd place.org-openclaw

# Add upstream remote (the original place.org)
git remote add upstream ~/Desktop/place.org
git remote rename origin openclaw

# Create the fork branch
git checkout -b openclaw/main

# First sync
git fetch upstream
git merge upstream/main --no-edit
```

### Sync workflow (pull upstream changes)

```bash
cd ~/Desktop/place.org-openclaw
git fetch upstream
git merge upstream/main --no-edit
# If conflicts (shouldn't happen if additive-only): resolve, commit
```

This can be automated with a git hook or cron:

```bash
#!/bin/bash
# ~/bin/sync-place-org-fork.sh
cd ~/Desktop/place.org-openclaw
git fetch upstream
git merge upstream/main --no-edit 2>&1
if [ $? -ne 0 ]; then
  echo "CONFLICT in place.org fork merge — manual resolution needed"
  # notify via OpenClaw
  exit 1
fi
echo "place.org fork synced cleanly with upstream"
```

---

## 3. Directory Structure — What the Fork Adds

Everything AI-related lives under `src/openclaw/`. Nothing in `src/components/apps/`, `src/stores/`, `src/hooks/`, or `src/types/` is modified — we ADD new files alongside them.

```
place.org-openclaw/
├── src/
│   ├── components/apps/          # ← upstream apps (NEVER EDIT)
│   │   ├── brain-dump/
│   │   ├── tasks/
│   │   ├── ...
│   │   └── terminal/
│   │
│   ├── openclaw/                 # ← ALL fork-only code lives here
│   │   ├── README.md             # ← This doc, for AI context
│   │   ├── gateway/              # ← OpenClaw gateway client
│   │   │   ├── client.ts         # WebSocket client (ported from Control UI gateway.ts)
│   │   │   ├── auth.ts           # Device identity + challenge-response
│   │   │   ├── protocol.ts       # Protocol types (req/res/event frames)
│   │   │   ├── hooks.ts          # useGateway(), useGatewayEvent(), useAgentSessions()
│   │   │   └── provider.tsx      # <OpenClawProvider> context wrapper
│   │   │
│   │   ├── apps/                 # ← Fork-only apps (same PlaceApp contract)
│   │   │   ├── agent-chat/       # Conversational window to any agent
│   │   │   ├── agent-monitor/    # Live dashboard of agent sessions
│   │   │   ├── dispatch/         # Visual task dispatch panel
│   │   │   ├── missions/         # Hill chart goal tracking
│   │   │   └── pipe-builder/     # Visual workflow editor
│   │   │
│   │   ├── stores/               # ← Fork-only Zustand stores
│   │   │   ├── agent-store.ts    # Agent sessions, status, history
│   │   │   ├── dispatch-store.ts # Task dispatch state
│   │   │   └── gateway-store.ts  # Connection state, events
│   │   │
│   │   ├── hooks/                # ← Fork-only hooks
│   │   │   ├── use-agent-status.ts
│   │   │   ├── use-gateway-events.ts
│   │   │   └── use-dispatch.ts
│   │   │
│   │   ├── types/                # ← Fork-only types
│   │   │   ├── agent.ts
│   │   │   ├── gateway.ts
│   │   │   └── dispatch.ts
│   │   │
│   │   ├── widgets/              # ← Ambient bar widgets, dock badges
│   │   │   ├── agent-status-widget.tsx  # "🤖 3 agents running" for ambient bar
│   │   │   └── dispatch-badge.tsx       # Dock badge for pending tasks
│   │   │
│   │   └── enhancements/         # ← Wrappers that enhance upstream apps
│   │       ├── brain-dump-agent.tsx     # "Route to agent" action wrapper
│   │       ├── tasks-agent.tsx          # Agent-assignable task wrapper
│   │       ├── terminal-agent.tsx       # `agent spawn/list/status` commands
│   │       ├── flux-agent.tsx           # Agent events in activity timeline
│   │       └── dashboard-agent.tsx      # Agent widgets for dashboard
│   │
│   ├── stores/                   # ← upstream stores (NEVER EDIT)
│   ├── hooks/                    # ← upstream hooks (NEVER EDIT)
│   ├── types/                    # ← upstream types (NEVER EDIT)
│   └── lib/                      # ← upstream lib (NEVER EDIT)
│
├── docs/
│   └── openclaw/                 # ← Fork-only documentation
│       ├── FORK-ARCHITECTURE.md  # This document
│       ├── SYNC-GUIDE.md         # How to pull upstream changes
│       └── AI-FEATURES.md        # What the fork adds (for AI agents building features)
│
└── CLAUDE.md                     # ← Fork-specific (tells Claude Code about the fork)
```

---

## 4. Extension Points — How the Fork Hooks In

The fork needs exactly **4 extension points** where it touches upstream-adjacent code. These are designed to never conflict with upstream changes.

### 4.1 App Registry Extension (`src/openclaw/app-registry-ext.ts`)

The fork defines its own apps using the same `PlaceApp` contract. The fork's entry point merges them into the upstream registry at runtime.

```typescript
// src/openclaw/app-registry-ext.ts
import type { AppId } from "@/src/types/window";

// Extended AppId type (union of upstream + fork apps)
export type OpenClawAppId = AppId | "agent-chat" | "agent-monitor" | "dispatch" | "missions" | "pipe-builder";

// Fork app definitions (same shape as upstream apps)
export const OPENCLAW_APPS = [
  {
    id: "agent-chat" as OpenClawAppId,
    name: "Agent Chat",
    icon: "🤖",
    defaultSize: { width: 480, height: 640 },
    // ... same PlaceApp contract
  },
  // ... more apps
] as const;
```

### 4.2 Entry Point Wrapper (`src/openclaw/entry.tsx`)

Instead of modifying the upstream entry point, the fork wraps it:

```typescript
// src/openclaw/entry.tsx
import { OpenClawProvider } from "./gateway/provider";
import { registerOpenClawApps } from "./app-registry-ext";
import { injectAmbientWidgets } from "./widgets/agent-status-widget";
import { injectEnhancements } from "./enhancements";

// Called once at app startup — registers fork apps and enhancements
export function initOpenClaw() {
  registerOpenClawApps();    // Add fork apps to registry
  injectAmbientWidgets();    // Add agent status to ambient bar
  injectEnhancements();      // Wrap upstream apps with agent features
}
```

### 4.3 The Single Upstream Touch (`src/app/layout.tsx` or equivalent)

The fork makes ONE addition to the upstream entry — importing and calling `initOpenClaw()`. This is the only line that can potentially conflict during upstream merges, and it's a single import + function call.

```typescript
// Added by fork (ONE LINE in upstream entry):
import { initOpenClaw } from "@/src/openclaw/entry";

// Called in the root component:
initOpenClaw();
```

**If this conflicts during merge:** It's one line. Trivial to re-add.

### 4.4 Type Extension (`src/openclaw/types/window-ext.ts`)

The fork extends the `AppId` type without modifying the upstream type file:

```typescript
// src/openclaw/types/window-ext.ts
import type { AppId } from "@/src/types/window";

// Use this throughout fork code instead of upstream AppId
export type ExtendedAppId = AppId | OpenClawAppId;
```

---

## 5. Enhancement Pattern — Wrapping Upstream Apps

The fork enhances existing apps (Brain Dump, Tasks, Terminal, etc.) without modifying their source. It uses a wrapper/decorator pattern:

```typescript
// src/openclaw/enhancements/brain-dump-agent.tsx
// 
// HOW THIS WORKS:
// - The upstream Brain Dump app renders normally
// - This enhancement registers an additional context menu action
//   and a toolbar button via the app's extension points
// - If the gateway isn't connected, the enhancements silently disable
// - The upstream app is NEVER imported or modified here

import { useGateway } from "../gateway/hooks";
import { useDispatchStore } from "../stores/dispatch-store";

export function BrainDumpAgentEnhancement() {
  const { connected } = useGateway();
  
  // Graceful degradation: if no gateway, render nothing
  if (!connected) return null;
  
  // Register "Route to Agent" action in Brain Dump's action menu
  // (uses the same event bus / extension pattern upstream apps use)
  return <RouteToAgentAction appId="brain-dump" />;
}
```

**Key principle:** Every enhancement checks `if (!connected) return null`. The fork works identically to upstream when the gateway isn't running. All AI features are progressive — they appear when available, vanish when not.

---

## 6. The Gateway Connection

The fork's gateway client is ported from the OpenClaw Control UI (`~/openclaw-control-ui-source/src/ui/gateway.ts`). The port:

| Control UI (Lit) | Fork (React) | What Changes |
|---|---|---|
| `gateway.ts` (raw WS) | `src/openclaw/gateway/client.ts` | Same protocol, wrapped in class |
| Inline state mutations | `src/openclaw/stores/gateway-store.ts` | Zustand store instead of Lit @state |
| `app-gateway.ts` event routing | `src/openclaw/gateway/hooks.ts` | React hooks: `useGateway()`, `useGatewayEvent()` |
| Auth with WebCrypto | `src/openclaw/gateway/auth.ts` | Same auth flow, device identity in localStorage |

**Connection config:** The fork reads gateway URL from:
1. `localStorage` (user-configured)
2. Environment variable `NEXT_PUBLIC_OPENCLAW_GATEWAY_URL`
3. Default: `ws://localhost:18789`

---

## 7. Automated Sync — CI / Cron

### Option A: Git hook (simplest)

```bash
# .git/hooks/post-merge (in upstream repo)
#!/bin/bash
cd ~/Desktop/place.org-openclaw
git fetch upstream
git merge upstream/main --no-edit
```

### Option B: Cron job (most reliable)

```bash
# Runs every 30 minutes
*/30 * * * * ~/bin/sync-place-org-fork.sh >> ~/logs/fork-sync.log 2>&1
```

### Option C: File watcher (real-time)

```bash
# Using inotifywait
inotifywait -m -r ~/Desktop/place.org/src -e modify,create,delete |
while read path action file; do
  cd ~/Desktop/place.org-openclaw
  git fetch upstream && git merge upstream/main --no-edit
done
```

**Recommended: Option B (cron).** It's robust, doesn't require watchers, and 30-minute lag is fine for development.

---

## 8. Conflict Prevention Rules

### NEVER do these in the fork:

1. ❌ Edit any file in `src/components/apps/` (upstream apps)
2. ❌ Edit any file in `src/stores/` (upstream stores)
3. ❌ Edit any file in `src/hooks/` (upstream hooks)
4. ❌ Edit any file in `src/types/` (upstream types)
5. ❌ Edit any file in `src/lib/` (upstream lib)
6. ❌ Edit `package.json` to remove upstream dependencies

### ALWAYS do these in the fork:

1. ✅ Put all new code in `src/openclaw/`
2. ✅ Put all new docs in `docs/openclaw/`
3. ✅ Use wrapper/enhancement pattern for modifying app behavior
4. ✅ Check `if (!connected) return null` in every enhancement
5. ✅ Add fork-only dependencies with a `# fork-only` comment in package.json
6. ✅ Run `git fetch upstream && git merge upstream/main --no-edit` after any upstream work session

### If you MUST touch upstream (rare):

1. Add only — never modify existing lines
2. Mark with `// [openclaw-fork]` comment
3. Keep to absolute minimum (currently: 1 line in entry point)
4. Document in `docs/openclaw/UPSTREAM-TOUCHES.md`

---

## 9. CLAUDE.md for the Fork

The fork repo gets its own CLAUDE.md that tells Claude Code about the architecture:

```markdown
# CLAUDE.md — place.org × OpenClaw Fork

This is a fork of place.org that adds AI agent features via OpenClaw.

## Critical Rule
NEVER modify files outside `src/openclaw/` and `docs/openclaw/`.
All upstream code in `src/components/`, `src/stores/`, `src/hooks/`, 
`src/types/`, `src/lib/` is READ-ONLY in this fork.

## Architecture
- `src/openclaw/` — All fork-only code
- `src/openclaw/gateway/` — WebSocket client to OpenClaw gateway
- `src/openclaw/apps/` — Fork-only apps (agent-chat, agent-monitor, etc.)
- `src/openclaw/enhancements/` — Wrappers that add agent features to upstream apps
- `src/openclaw/stores/` — Fork-only Zustand stores
- `src/openclaw/hooks/` — Fork-only React hooks
- `src/openclaw/widgets/` — Ambient bar widgets, dock badges

## Extension Pattern
Enhancements wrap upstream apps without modifying them.
Every enhancement checks `if (!gatewayConnected) return null` — 
graceful degradation to vanilla place.org when gateway is offline.

## Syncing with Upstream
```bash
git fetch upstream && git merge upstream/main --no-edit
```

## Key Files
- `docs/openclaw/FORK-ARCHITECTURE.md` — Full architecture doc
- `src/openclaw/README.md` — Quick reference
- `src/openclaw/entry.tsx` — Fork initialization (called from root)
```

---

## 10. Testing the Sync

After every upstream merge, verify:

```bash
# 1. Build succeeds
pnpm build

# 2. No upstream files modified
git diff upstream/main --name-only --diff-filter=M | grep -v '^src/openclaw/' | grep -v '^docs/openclaw/' | grep -v '^CLAUDE.md'
# Should output only the entry point touch (1 file max)

# 3. All fork code is in the right place
find src/openclaw -name '*.ts' -o -name '*.tsx' | wc -l
# Should be > 0

# 4. TypeScript passes
pnpm tsc --noEmit
```

---

## 11. Version Naming

- **Upstream:** `place.org v0.5.x`
- **Fork:** `place.org-openclaw v0.5.x-oc.1` (tracks upstream version + fork build number)

The fork's `package.json` adds a suffix: if upstream is `0.5.3`, fork is `0.5.3-oc.1`.

---

## Source References

- Vision doc: `vault/Projects/place.org-openclaw-vision.md`
- Control UI source: `~/openclaw-control-ui-source/` (gateway client to port)
- Control UI architecture: `~/openclaw-control-ui-source/ARCHITECTURE.md`
- Agent OS research: `vault/Research/Agent-OS-Speculative-UI-Deep-Dive.md`
- Agent OS UX: `vault/Research/Agent-OS-UX-Competitive-Deep-Dive.md`
- Agent OS patterns: `vault/Research/Agent-OS-Business-Software-Paradigms.md`
