# Alfred Discord Bot → Hermes Backend Integration Plan

**Generated**: 2026-04-20T20:47:01+00:00
**Status**: Spec phase only
**Target repo**: `/home/trajan/Desktop/Coding/Projects/claude-remote-discord`

## Executive answer

If you want the **Alfred/ClaudeForge Discord bot** to stay as the Discord-facing product while the **new backend becomes Hermes**, the clean path is:

> **Keep Alfred as the Discord frontend and session manager shell, but add Hermes as a new provider behind the existing provider interface.**

Do **not** try to run Hermes's own Discord gateway on the same bot token if Alfred is meant to stay in charge of Discord UX.

That would create token/session ownership conflicts and split the product into two Discord bots fighting over one surface.

## Why this is the right path

### 1. Alfred already has the right seam: provider abstraction
The current server has a clean provider interface in:
- `packages/server/src/providers/types.ts`
- `packages/server/src/providers/index.ts`

Right now it supports:
- `claude`
- `codex`

So the intended extension point already exists.

### 2. Hermes already exposes a backend-friendly API
Hermes has an API server at:
- `POST /v1/chat/completions`
- `POST /v1/responses`

from:
- `/home/trajan/.hermes/hermes-agent/gateway/platforms/api_server.py`

Important capabilities already present:
- OpenAI-compatible HTTP shape
- streaming chunks
- stable session continuity via `X-Hermes-Session-Id`
- custom SSE tool-progress events: `event: hermes.tool.progress`

### 3. Running Hermes's Discord adapter directly would be the wrong ownership model
Hermes's migration code explicitly warns that Discord only allows one active connection per bot token. The Hermes codebase also has a full native Discord adapter, but using that would mean:
- Hermes owns Discord behavior
- Alfred no longer owns the category/channel/session UX
- both systems risk token conflict if run in parallel

So if the goal is **"through the Alfred Discord bot"**, Hermes should sit **behind** Alfred, not beside it.

## Recommended architecture

```text
Discord user
  -> Alfred / ClaudeForge Discord bot (discord.js)
  -> ClaudeForge server/session manager
  -> HermesProvider
  -> Hermes API server
  -> Hermes agent runtime + tools + memory + skills
  -> streamed results back through Alfred output handler
```

This preserves:
- Alfred's Discord-native UX
- Alfred's channel/category/session metaphor
- Hermes's tools, memory, skills, and agent runtime

## What NOT to do

### Option A — Don't swap in Hermes's Discord gateway as the primary bot
Bad fit because:
- wrong ownership layer
- same-token conflict risk
- loses Alfred's category/session control plane
- forces Discord UX to conform to Hermes messaging defaults

### Option B — Don't shell out to `hermes chat -q` as the main integration
This is okay for a crude prototype, but bad as the real backend because:
- weak session continuity
- ugly streaming integration
- harder cancellation/abort semantics
- poor mapping to Alfred's session model

Use Hermes API server instead.

## Required product decision

The main architecture decision is:

### Alfred remains the "surface of record"
That means Alfred still owns:
- Discord commands
- channel/category structure
- session/channel binding
- project/workspace routing
- output rendering into Discord

### Hermes becomes the "agent runtime of record"
That means Hermes owns:
- reasoning loop
- tools
- memory
- skills
- session transcript persistence on its side
- model/provider auth and routing

This split is clean and realistic.

## Integration design

## Phase 1 — Add Hermes as a provider

### 1. Expand provider enum/type
Current type in `packages/shared/src/types.ts`:
- `ProviderName = "claude" | "codex"`

Need to become:
- `ProviderName = "claude" | "codex" | "hermes"`

Also update any UI color/constants/provider-label assumptions.

### 2. Add `HermesProvider`
Create:
- `packages/server/src/providers/hermes-provider.ts`

Implement the same interface:
- `startSession(options)`
- `sendMessage(sessionId, message)`
- `abort(sessionId)`
- `kill(sessionId)`
- `isAlive(sessionId)`

### 3. Register provider
Update:
- `packages/server/src/providers/index.ts`

So `ProviderRegistry` includes `new HermesProvider()`.

## Phase 2 — Use Hermes API server, not CLI

### Hermes endpoint choice
Use:
- `POST /v1/chat/completions`

Why:
- easier initial fit
- supports streaming
- returns `X-Hermes-Session-Id`
- existing Alfred provider model already thinks in terms of chat session + streaming output

### Session continuity mapping
Store Hermes session ID in ClaudeForge's existing field:
- `SessionRecord.providerSessionId`

That field already exists and is exactly the right place.

#### Start flow
On first message:
- Alfred creates local session record
- HermesProvider calls `/v1/chat/completions`
- no `X-Hermes-Session-Id` header on first request
- Hermes returns response header `X-Hermes-Session-Id`
- save that into `providerSessionId`

#### Continue flow
On later messages:
- send same local session
- include `X-Hermes-Session-Id: <providerSessionId>`
- Hermes continues the same agent conversation

This is the cleanest bridge between the two systems.

## Phase 3 — Map Hermes streaming to Alfred provider events

ClaudeForge expects provider events shaped like:
- `session_init`
- `text`
- `tool_use`
- `tool_result`
- `done`
- `error`
- `input_request`

Hermes API server naturally gives:
- normal SSE content chunks (`chat.completion.chunk`)
- custom SSE events for tool progress (`hermes.tool.progress`)
- final completion

### Initial mapping strategy
#### Text
Map chunk deltas to:
- `{ type: "text", content: delta }`

#### Session init
Emit:
- `{ type: "session_init", providerSessionId }`

as soon as the response header is known.

#### Tool use
Map `event: hermes.tool.progress` into a synthetic ClaudeForge tool-use event.

Example mapping:
- tool name -> payload.tool
- title -> payload.label
- kind -> infer from Hermes tool name using the same classifier style ClaudeProvider uses

This gives Alfred enough structure to keep its tool cards alive.

#### Tool result
Hermes API server does not currently expose full structured tool-result payloads in the same shape Alfred expects.

So for v1:
- emit synthetic `tool_use`
- optionally skip `tool_result`
- let final text answer carry the semantic result

If richer tool-result cards are wanted later, extend Hermes API server to emit a second custom SSE event with tool completion metadata.

#### Done
Map end-of-stream to:
- `{ type: "done", sessionId, cost? }`

#### Error
Map HTTP/network/JSON/SSE failures to:
- `{ type: "error", message }`

## Phase 4 — Abort/kill semantics

This is the main messy part.

Hermes API server is easy for request/response and streaming, but cancellation is weaker than a local subprocess you own directly.

### Recommended spec stance for v1
- `abort(sessionId)` = cancel the current HTTP/SSE request if still open on Alfred side
- mark the session as interrupted client-side
- do **not** promise perfect agent-side interruption until a proper Hermes-side cancel contract is added

### Recommended phase-2 improvement
Add a Hermes-side session interruption endpoint, or bridge to a resumable response/cancel API.

Until then, Alfred should treat Hermes abort as **best-effort**, not hard kill.

## Phase 5 — Discord UX implications

The good news: almost none of Alfred's Discord UX needs to change.

### What stays the same
- `/open`
- `/session new`
- channel-per-session
- category-per-project/location
- session info command
- output rendering flow
- command routing through Alfred's bot

### What changes
- sessions can use provider = `hermes`
- `session info` should show providerSessionId from Hermes
- maybe add model/runtime details if Hermes returns them later

## Phase 6 — Config model

Add environment/config for ClaudeForge server:
- `HERMES_BASE_URL=http://127.0.0.1:<port>`
- `HERMES_API_KEY=...` (required if not loopback / or if using authenticated continuation)
- optional default model / system prompt / tool profile settings

Important Hermes-side facts from the codebase:
- `API_SERVER_ENABLED`
- `API_SERVER_KEY`
- `API_SERVER_HOST`
- `API_SERVER_PORT`

And from Hermes API behavior:
- session continuation via `X-Hermes-Session-Id` requires auth when using that secure mode

So don't build this assuming anonymous remote continuation.

## Required code changes in ClaudeForge

### Shared
- `packages/shared/src/types.ts`
  - add `hermes` to `ProviderName`

### Server
- `packages/server/src/providers/hermes-provider.ts` *(new)*
- `packages/server/src/providers/index.ts`
  - register Hermes provider
- `packages/server/src/session-manager.ts`
  - should mostly work already because `providerSessionId` is already present

### Bot / commands
- anywhere provider choices are surfaced in slash commands:
  - `packages/bot/src/commands.ts`
  - `packages/bot/src/command-handlers.ts`
- let `/session new --provider hermes` work

### Optional UX polish
- `packages/shared/src/constants.ts`
  - add Hermes color identity if desired
- `packages/bot/src/output-handler.ts`
  - ensure synthetic Hermes tool progress cards render nicely even if there is no paired tool_result event

## Required code changes in Hermes

### Minimum required: none, if you accept v1 limitations
Because Hermes already has:
- API server
- session continuity header
- SSE streaming
- custom tool progress events

### Nice-to-have improvements
If you want a really good Alfred integration, Hermes should eventually expose:
1. explicit cancel endpoint
2. richer tool completion SSE events
3. optional metadata about active tool call IDs / run IDs / costs
4. maybe a first-class session lookup endpoint

But you can start before those exist.

## Best implementation order

### Sprint 1 — Thin but real integration
- add `hermes` provider type
- add HermesProvider using `/v1/chat/completions`
- stream text only
- persist `providerSessionId`
- support continuing conversation through `X-Hermes-Session-Id`

**Goal:** Alfred can run Hermes sessions at all.

### Sprint 2 — Better Discord rendering
- parse `hermes.tool.progress` SSE events
- emit synthetic `tool_use` provider events
- improve session info with Hermes-specific metadata

**Goal:** Hermes sessions feel alive in Discord instead of just texty.

### Sprint 3 — Hardening
- config validation for HERMES_BASE_URL / HERMES_API_KEY
- retry/backoff on HTTP failures
- timeout behavior
- best-effort abort semantics
- healthcheck endpoint usage if available

**Goal:** stable enough for daily use.

### Sprint 4 — Rich integration
- extend Hermes API server for tool completion / cancel if needed
- map more Hermes-native behaviors into Alfred cards and controls

**Goal:** Alfred UI feels purpose-built for Hermes, not just compatible with it.

## Risks / gotchas

### 1. Token ownership confusion
If Alfred and Hermes both try to be the Discord bot, it gets messy fast.

**Rule:** Alfred owns Discord. Hermes does not connect to Discord for this product path.

### 2. Session ID mismatch
ClaudeForge session ID and Hermes session ID are not the same thing.

**Rule:** ClaudeForge `session.id` is local identity; Hermes `providerSessionId` is remote identity.

### 3. Abort semantics are weaker than local subprocess control
You won't get perfect parity with `claude` local process kill behavior on day one.

**Rule:** be explicit that Hermes abort is best-effort until backend cancel exists.

### 4. Tool cards are not 1:1 out of the box
Hermes tool progress SSE is lighter than ClaudeForge's current tool event model.

**Rule:** start with synthetic tool-use only; don't block the whole integration waiting for perfect parity.

### 5. Shared-token Discord migration temptation
It will be tempting to just let Hermes talk to Discord directly too.

**Don't.** That defeats the whole point of keeping Alfred as the Discord-native shell.

## Final recommendation

The right spec is:

> **Alfred becomes a Discord-native orchestration shell that can target Hermes as an agent provider over Hermes's API server.**

That gives you:
- Alfred's Discord UX
- Hermes's backend power
- minimal architectural violence
- no bot-token civil war

## Next concrete deliverable

If continuing in spec mode, the next best artifact is:

1. `HermesProvider` interface mapping spec
2. exact request/response contract examples
3. file-by-file implementation checklist for ClaudeForge

That is the shortest path from "idea" to something actually buildable.