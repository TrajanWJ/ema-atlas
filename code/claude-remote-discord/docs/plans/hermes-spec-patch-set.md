# Hermes Backend Integration — Spec Patch Set for ClaudeForge

**Generated**: 2026-04-20
**Repo**: `/home/trajan/Desktop/Coding/Projects/claude-remote-discord`
**Status**: Spec patch set, not applied code

## Purpose

This document is the exact spec delta ClaudeForge needs in order to support Hermes as a backend provider while keeping the Alfred/ClaudeForge Discord bot as the Discord-native surface.

---

## Patch 1 — Vision / architecture language

## File
`SPEC.md`

## Add / revise in Vision and Architecture sections

### Old concept
ClaudeForge currently frames itself around Claude Code and Codex sessions.

### New concept
ClaudeForge should be described as a **Discord + web orchestration shell over pluggable coding-agent runtimes**.

### Replace/add language
```md
ClaudeForge is not limited to Claude Code or Codex. It is a Discord-native orchestration shell that can target multiple backend agent runtimes through a provider abstraction. Discord and the web UI remain the user-facing surfaces; providers supply the runtime, streaming events, and backend execution model.
```

### Add architecture note
```md
When Hermes is used as a provider, ClaudeForge remains the owner of Discord categories, channels, commands, and session routing. Hermes operates behind ClaudeForge as the backend runtime via its API server. Hermes does not directly own the Discord bot in this product mode.
```

---

## Patch 2 — Provider system section

## File
`SPEC.md`

## Update provider list

### Old
- Claude Code SDK / CLI
- Codex SDK / CLI

### New
- Claude Code
- Codex
- Hermes API backend

### Add provider responsibilities table entry
```md
| Hermes | HTTP API provider via Hermes API server | Full agent runtime with tools, memory, skills, multi-provider model routing |
```

### Add provider design note
```md
Hermes integration should use the Hermes API server rather than Hermes's Discord gateway. The Discord-facing bot remains ClaudeForge/Alfred.
```

---

## Patch 3 — Data model patch

## File
`SPEC.md`

## Update provider enum references
Anywhere the spec currently says provider is one of:
- `claude`
- `codex`

patch to:
- `claude`
- `codex`
- `hermes`

### Explicit session note to add
```md
`providerSessionId` stores the backend runtime's own session identity. For Hermes, this is the `X-Hermes-Session-Id` returned by the API server. ClaudeForge's local `session.id` remains the canonical local session identifier.
```

---

## Patch 4 — Discord bot commands

## File
`SPEC.md`

## Update command docs

### `/open`
Add:
```md
Provider choices: `claude`, `codex`, `hermes`
```

### `/session new`
Add:
```md
Provider choices: `claude`, `codex`, `hermes`
```

### `/run`
Add:
```md
Provider choices: `claude`, `codex`, `hermes`
```

### Add command semantics note
```md
When provider=`hermes`, Discord routing and channel/session ownership remain unchanged. Only the backend runtime changes.
```

---

## Patch 5 — Session lifecycle section

## File
`SPEC.md`

## Add Hermes lifecycle mapping
```md
### Hermes-backed session lifecycle
1. ClaudeForge creates a local session record.
2. HermesProvider sends the first request to Hermes API server.
3. Hermes returns `X-Hermes-Session-Id`.
4. ClaudeForge stores that value in `providerSessionId`.
5. Follow-up messages include `X-Hermes-Session-Id` so Hermes continues the same backend conversation.
6. ClaudeForge preserves its own local session ID and Discord channel binding throughout.
```

### Add lifecycle rule
```md
Discord channel identity is always bound to ClaudeForge local session identity, not directly to a provider's remote session ID.
```

---

## Patch 6 — Real-time protocol section

## File
`SPEC.md`

## Add Hermes stream mapping subsection
```md
### Hermes stream mapping
HermesProvider translates Hermes API server output into ClaudeForge provider events:

- OpenAI-compatible content SSE chunks -> `text`
- `X-Hermes-Session-Id` response header -> `session_init`
- `event: hermes.tool.progress` -> synthetic `tool_use`
- stream completion -> `done`
- HTTP/SSE/parse failures -> `error`
```

### Add v1 limitation note
```md
Hermes does not yet provide tool completion events in the same structured shape ClaudeForge uses for `tool_result`. v1 may emit synthetic `tool_use` events without a matching structured `tool_result`, relying on final text output to communicate results.
```

---

## Patch 7 — Abort / control semantics

## File
`SPEC.md`

## Add explicit note
```md
### Hermes abort semantics
For Hermes-backed sessions, abort is best-effort in v1. ClaudeForge may cancel the active HTTP/SSE request locally, but this does not necessarily guarantee a hard backend stop unless Hermes exposes a dedicated cancellation contract.
```

### Product rule
```md
UI controls must not imply stronger stop guarantees than the underlying backend can actually provide.
```

---

## Patch 8 — Config section

## File
`SPEC.md`

## Add config keys
```md
### Hermes backend configuration
- `HERMES_BASE_URL` — base URL for Hermes API server
- `HERMES_API_KEY` — bearer token when required
```

### Add note
```md
If Hermes is remote or authenticated session continuation is required, ClaudeForge must send authenticated requests and persist the returned Hermes session identity.
```

---

## Patch 9 — Security section

## File
`SPEC.md`

## Add boundary note
```md
ClaudeForge and Hermes must not both connect to Discord with the same bot token in this architecture. ClaudeForge is the sole Discord-facing process; Hermes is backend-only.
```

### Add backend auth note
```md
If ClaudeForge uses Hermes session continuation via `X-Hermes-Session-Id`, backend authentication should be enabled so provider session history cannot be enumerated or hijacked by unauthenticated callers.
```

---

## Patch 10 — Implementation plan section

## File
`SPEC.md`

## Add Hermes-specific phase
```md
### Phase: Hermes backend integration
- Add `hermes` to provider enum/type system
- Implement `HermesProvider`
- Register Hermes provider in provider registry
- Add Hermes provider options to slash commands
- Persist Hermes backend session ID in `providerSessionId`
- Map Hermes streaming output to ClaudeForge provider events
- Add config validation for Hermes backend env
- Document best-effort abort behavior
```

---

## Patch 11 — Discord server structure section

## File
`SPEC.md`

## Add clarification
```md
Discord structure does not change when using Hermes as provider. Categories and channels remain ClaudeForge-managed. Provider selection changes runtime behavior, not Discord topology.
```

This matters because otherwise the spec can accidentally imply Hermes should own Discord sessions directly.

---

## Patch 12 — Terminology cleanup

## File
`SPEC.md`

## Replace these patterns where needed

### Replace overly narrow terms
- "Claude session" -> "provider session" when describing generic runtime behavior
- "Claude Code session" -> keep only when specifically meaning Claude provider
- "Claude CLI output" -> "provider output" in shared flow descriptions

### Keep explicit names when provider-specific
- use "Claude Code" only for Claude provider
- use "Codex" only for Codex provider
- use "Hermes" only for Hermes provider

This avoids contaminating shared architecture with provider-specific assumptions.

---

## Patch 13 — Add non-goal

## File
`SPEC.md`

## Add explicit non-goal
```md
Non-goal: replacing ClaudeForge's Discord bot with Hermes's native Discord gateway. Hermes integration in this architecture is backend-only.
```

---

## Patch 14 — Add future roadmap note

## File
`SPEC.md`

## Add under roadmap / future work
```md
Future Hermes improvements:
- richer structured tool completion events
- explicit backend cancellation endpoint
- richer run metadata (cost, tool IDs, lineage)
- tighter ClaudeForge UI integration for Hermes-native runtime visibility
```

---

## Summary of the spec delta

The biggest conceptual patch is this:

> ClaudeForge is no longer just a remote Claude/Codex shell. It becomes a Discord-native orchestration layer over pluggable agent backends, with Hermes added as a first-class backend provider.

And the most important boundary rule is this:

> ClaudeForge owns Discord. Hermes owns backend runtime.

That one sentence prevents the whole design from turning into spaghetti.