# Hermes Provider Integration — File-by-File Implementation Checklist

**Generated**: 2026-04-20
**Repo**: `/home/trajan/Desktop/Coding/Projects/claude-remote-discord`
**Mode**: Spec / implementation checklist

## Goal

Integrate Hermes as a third backend provider behind the existing ClaudeForge/Alfred Discord bot so Discord UX stays owned by ClaudeForge while Hermes supplies agent runtime, tools, memory, and skills.

---

## 0. Preconditions

Before changing ClaudeForge code:

- Hermes repo exists at: `/home/trajan/.hermes/hermes-agent`
- ClaudeForge repo exists at: `/home/trajan/Desktop/Coding/Projects/claude-remote-discord`
- Hermes API server is the chosen backend seam, not Hermes's Discord gateway
- Alfred/ClaudeForge remains the only Discord process using the target bot token

### Preflight checks
- [ ] Confirm no second Discord bot process will compete for the same token
- [ ] Confirm Hermes API server can be enabled on loopback
- [ ] Confirm ClaudeForge will talk to Hermes over HTTP, not shelling `hermes chat -q`

---

## 1. Shared type layer

## File: `packages/shared/src/types.ts`

### Change
Add Hermes to the provider union.

### Current
```ts
export type ProviderName = "claude" | "codex";
```

### Target
```ts
export type ProviderName = "claude" | "codex" | "hermes";
```

### Why
This is the root typing seam used by sessions, tasks, slash commands, and provider registry.

### Checklist
- [ ] Add `"hermes"` to `ProviderName`
- [ ] Check all switch statements / provider assumptions still compile
- [ ] Rebuild shared package consumers

---

## 2. Shared constants / identity styling

## File: `packages/shared/src/constants.ts`

### Change
Add Hermes color identity for embeds/UI if desired.

### Suggested addition
```ts
hermes: "#7B61FF",
```

and
```ts
hermes: 0x7b61ff,
```

### Why
Not required for correctness, but makes Hermes sessions visually distinct.

### Checklist
- [ ] Add `COLORS.hermes` if you want provider-specific UI treatment
- [ ] Add `EMBED_COLORS.hermes`
- [ ] Leave existing Claude/Codex colors untouched

---

## 3. Provider implementation

## File: `packages/server/src/providers/hermes-provider.ts` *(new)*

### Responsibility
Implement the existing `AgentProvider` interface using Hermes API server.

### Must implement
- `startSession(options)`
- `sendMessage(sessionId, message)`
- `abort(sessionId)`
- `kill(sessionId)`
- `isAlive(sessionId)`

### Core design
- Use `POST /v1/chat/completions`
- Use streaming mode
- Read `X-Hermes-Session-Id` from response headers
- Persist that as `providerSessionId` through existing ClaudeForge session machinery
- Convert Hermes SSE stream into ClaudeForge `ProviderEvent`s

### Internal state suggested
```ts
interface HermesSession {
  id: string;
  directory: string;
  providerSessionId?: string;
  abortController?: AbortController | null;
  alive: boolean;
}
```

### Checklist
- [ ] Add `HermesSession` state map
- [ ] Read `HERMES_BASE_URL` from env/config
- [ ] Read `HERMES_API_KEY` from env/config if configured
- [ ] Implement HTTP request helper
- [ ] Implement SSE parser
- [ ] Emit `session_init` once provider session ID is known
- [ ] Emit `text` for normal deltas
- [ ] Emit synthetic `tool_use` from `hermes.tool.progress`
- [ ] Emit `done` on stream finish
- [ ] Emit `error` on HTTP/SSE failures
- [ ] Track best-effort abort using `AbortController`
- [ ] Mark session liveness locally

### v1 rule
Do **not** block integration waiting for rich `tool_result` support. Synthetic `tool_use` + streamed text is enough for first ship.

---

## 4. Provider registry

## File: `packages/server/src/providers/index.ts`

### Change
Register Hermes provider.

### Checklist
- [ ] Import `HermesProvider`
- [ ] Add `this.register(new HermesProvider())` in constructor
- [ ] Keep Claude and Codex registration intact

### Target shape
```ts
this.register(new ClaudeProvider());
this.register(new CodexProvider());
this.register(new HermesProvider());
```

---

## 5. Session manager compatibility

## File: `packages/server/src/session-manager.ts`

### What to verify
This file already supports:
- `providerSessionId`
- provider event streams
- background consumption of `ProviderEvent`

So changes should be minimal.

### Checklist
- [ ] Verify `session_init` correctly stores Hermes `providerSessionId`
- [ ] Verify `sendMessage()` continues to call provider by local `sessionId`
- [ ] Verify `consumeProviderStream()` behaves sensibly when Hermes emits only synthetic `tool_use` and no `tool_result`
- [ ] Verify `done` moves session to `idle`
- [ ] Verify `error` moves session to `error`

### Optional improvement
If Hermes returns provider metadata later, expose it in session updates.

---

## 6. Slash command provider choices

## File: `packages/bot/src/commands.ts`

### Change
Wherever provider choices are declared, add Hermes.

### Places to update
- `/open ... provider`
- `/session new ... provider`
- `/run ... provider`

### Suggested choice label
```ts
{ name: "Hermes", value: "hermes" }
```

### Checklist
- [ ] Add Hermes to `/open`
- [ ] Add Hermes to `/session new`
- [ ] Add Hermes to `/run`
- [ ] Keep labels human-readable and consistent

---

## 7. Bot command handlers

## File: `packages/bot/src/command-handlers.ts`

### What changes
Mostly none structurally, but verify provider strings flow through cleanly.

### Checklist
- [ ] Confirm `handleOpen()` accepts `provider = hermes`
- [ ] Confirm `handleSessionNew()` accepts `provider = hermes`
- [ ] Confirm session topic strings render provider correctly
- [ ] Update any provider-specific text if it assumes only Claude/Codex

### Recommended UX tweak
For Hermes-backed sessions, include provider session ID in `/session info` if present.

---

## 8. Session info UX

## File: `packages/bot/src/command-handlers.ts`

### Target improvement
Enhance `handleSessionInfo()` to show Hermes-specific backend identity.

### Suggested new field
```ts
{ name: "Provider Session", value: session.providerSessionId ?? "(not initialized yet)", inline: false }
```

### Checklist
- [ ] Add providerSessionId field when present
- [ ] Keep output clean for Claude/Codex too

---

## 9. Output handling

## File: `packages/bot/src/output-handler.ts`

### What to verify
This file already understands:
- `text`
- `tool_use`
- `tool_result`
- `done`
- `error`
- `input_request`

Hermes v1 can fit if `HermesProvider` emits synthetic `tool_use` and standard `text` / `done` / `error`.

### Checklist
- [ ] Verify synthetic Hermes `tool_use` events render well
- [ ] Ensure missing `tool_result` does not look broken
- [ ] Optionally tune the displayed title/emoji for Hermes tool progress events

### Optional improvement
Add a Hermes-specific embed color if provider identity is available on the event path later.

---

## 10. Startup / env wiring

## File: `packages/server/src/start.ts`

### Change
No direct Hermes provider registration happens here, but startup must validate env and log useful errors.

### Recommended additions
- log whether Hermes backend env is configured
- fail gracefully if Hermes provider is requested but base URL is missing

### Checklist
- [ ] Ensure env loading includes `HERMES_BASE_URL`
- [ ] Ensure env loading includes `HERMES_API_KEY` if needed
- [ ] Add startup diagnostics for Hermes backend availability

---

## 11. Env template

## File: `.env.example`

### Add
```env
# ─── Hermes Backend ─────────────────────────────────────
HERMES_BASE_URL=http://127.0.0.1:8000
HERMES_API_KEY=
```

Adjust port to whatever Hermes API server is actually configured to use.

### Checklist
- [ ] Add Hermes env vars to `.env.example`
- [ ] Document that loopback may not require auth, but authenticated continuation is safer

---

## 12. Runtime contract assumptions to encode in code comments

## In `hermes-provider.ts`

Document these facts clearly:
- ClaudeForge local session ID != Hermes provider session ID
- Hermes provider session ID is stored in `providerSessionId`
- Alfred owns Discord UX
- Hermes owns backend runtime
- abort is best-effort in v1
- tool progress is currently one-way synthetic mapping from `hermes.tool.progress`

### Checklist
- [ ] Add comments so future-you doesn't "simplify" the wrong boundary

---

## 13. Suggested test coverage

## New tests to add

### Provider-level
- [ ] can start a Hermes-backed session and emit `session_init`
- [ ] can continue a session with `X-Hermes-Session-Id`
- [ ] maps content SSE chunks to `text`
- [ ] maps `hermes.tool.progress` to synthetic `tool_use`
- [ ] emits `error` on non-200 response
- [ ] abort cancels active request best-effort

### Command-level
- [ ] slash commands accept `provider=hermes`
- [ ] `/session info` displays Hermes provider session metadata

### Integration-level
- [ ] create Hermes session from Discord command path
- [ ] send follow-up message to same session
- [ ] confirm persisted `providerSessionId` is reused

---

## 14. Order of implementation

1. `packages/shared/src/types.ts`
2. `packages/shared/src/constants.ts` *(optional visual polish)*
3. `packages/server/src/providers/hermes-provider.ts`
4. `packages/server/src/providers/index.ts`
5. `packages/bot/src/commands.ts`
6. `packages/bot/src/command-handlers.ts`
7. `.env.example`
8. tests

---

## 15. Done criteria

The Hermes integration is "real" when all of this is true:

- [ ] `/session new --provider hermes` works
- [ ] Discord messages in a Hermes-backed channel continue the same Hermes session
- [ ] `providerSessionId` is persisted and reused
- [ ] Hermes tool progress appears in Discord as tool cards or equivalent structured output
- [ ] session completion returns to `idle`
- [ ] failures surface as `error`, not silent hangs
- [ ] Alfred remains the only Discord bot process for this product path

---

## Final note

The important architectural rule is not the code — it's the boundary:

> **ClaudeForge owns Discord. Hermes owns backend agent runtime.**

If that stays true, the implementation stays clean.