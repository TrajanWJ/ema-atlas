# EMA Host Session Model — Claude + Codex

Generated: 2026-04-06 UTC

## Purpose

Define a concrete host-native session model for EMA so Claude and Codex can both be treated as first-class execution channels, with Discord/OpenClaw/ClaudeForge as surfaces rather than the source of truth.

---

## Executive Summary

Both Claude and Codex already have real host-native durable session artifacts.

- **Claude** stores session/project history under `~/.claude/projects/`
- **Codex** stores session history under `~/.codex/sessions/`

But current EMA/ClaudeForge integration is asymmetric:

- **Claude** is partially integrated as a real resumable session provider
- **Codex** is currently integrated mostly as a wrapped child process

So the next EMA step is not “add another provider enum.”
It is to make EMA understand **host-native session systems** and bind them to EMA task/session/channel state.

---

## Observed Host Reality

### Claude host substrate

Observed at:
- `~/.claude/projects/.../*.jsonl`

Properties:
- project-oriented directory structure
- durable JSONL transcripts
- provider-native session ids present in records
- works naturally with resume semantics
- already scanned by `claudeforge/packages/bot/src/session-sync.ts`

### Codex host substrate

Observed at:
- `~/.codex/sessions/YYYY/MM/DD/*.jsonl`
- `~/.codex/logs_1.sqlite`
- `~/.codex/state_5.sqlite`
- `~/.codex/history.jsonl`

Properties:
- durable JSONL event logs
- explicit `session_meta`
- includes structured event stream and tool/function calls
- currently **not** imported into ClaudeForge/EMA in a first-class way

### Live process state

Current live `tmux list-sessions` output:
- none

Implication:
- host truth is primarily in durable session artifacts, not currently-running tmux processes
- EMA should model live execution and durable history separately

---

## Current Integration Status

### ClaudeForge provider layer

Provider registry currently includes:
- `claude`
- `codex`

Files:
- `~/Projects/ema/claudeforge/packages/server/src/providers/claude-provider.ts`
- `~/Projects/ema/claudeforge/packages/server/src/providers/codex-provider.ts`

### Claude provider status

Strengths:
- uses `claude --print --output-format stream-json`
- parses structured events
- captures `session_id`
- stores `providerSessionId`
- supports `--resume`
- maps some tool calls into UI events

Weaknesses:
- still oriented around spawned process + tmux lifecycle
- does not yet treat `~/.claude/projects` as canonical importable history

### Codex provider status

Strengths:
- provider exists in registry
- codex CLI can be launched from EMA side

Weaknesses:
- uses `codex exec --yolo`
- treats output as mostly raw stdout
- no true structured event mapping from Codex JSONL/event protocol
- no native resume binding in current provider
- no import/discovery of `~/.codex/sessions`
- no Codex analogue to Claude `session-sync.ts`

Bottom line:
- **Claude is close to first-class**
- **Codex is still process-wrapper-class**

---

## Field-by-Field Format Comparison

### Claude JSONL shape

Observed top-level keys:
- `type`
- `timestamp`
- `sessionId`
- `message`
- `data`
- `uuid`
- `requestId`
- `cwd`
- `gitBranch`
- `toolUseID`
- `toolUseResult`
- `parentUuid`
- `permissionMode`
- others depending on event

Observed top-level event types include:
- `queue-operation`
- `progress`
- `user`
- `assistant`
- `last-prompt`

Characteristics:
- richer event envelope at top level
- user/assistant messages directly represented
- good for transcript-oriented reconstruction
- provider session identity visible in event stream

### Codex JSONL shape

Observed top-level keys:
- `type`
- `timestamp`
- `payload`

Observed top-level event types include:
- `session_meta`
- `event_msg`
- `response_item`
- `turn_context`

Observed nested payload `type` values include:
- `task_started`
- `user_message`
- `message`
- `agent_message`
- `reasoning`
- `token_count`
- `function_call`
- `function_call_output`
- `task_complete`

Observed function/tool calls include:
- `mcp__codebase_memory_mcp__search_code`
- `mcp__filesystem__search_files`
- `mcp__filesystem__read_multiple_files`
- `mcp__filesystem__list_directory`
- `mcp__filesystem__read_text_file`
- `exec_command`

Characteristics:
- more normalized event envelope
- transcript data is nested under `payload`
- includes explicit tool/function call lifecycle
- well-suited for event-sourced reconstruction and analytics

### Practical comparison

Claude is easier for:
- transcript playback
- direct assistant/user message reconstruction
- project/session Discord sync by file discovery

Codex is easier for:
- event analytics
- tool invocation accounting
- turn-level observability
- reasoning/token instrumentation

EMA should support **both styles** rather than forcing one provider to look like the other at the raw log layer.

---

## Proposed EMA Canonical Session Model

EMA should define a provider-neutral session record with these layers.

### 1. Session identity layer

Fields:
- `emaSessionId`
- `provider` (`claude` | `codex` | future)
- `providerSessionId`
- `providerProjectKey` / `workspaceKey`
- `cwd`
- `startedAt`
- `lastActivityAt`
- `status`
- `isLive`
- `isImported`

Purpose:
- unify active and imported sessions
- decouple EMA identity from provider identity

### 2. Surface binding layer

Fields:
- `discordChannelId`
- `discordThreadId`
- `openclawSessionKey`
- `claudeforgeSessionId`
- `emaTaskId`
- `emaProposalId`

Purpose:
- bind host session reality to EMA coordination/surfaces

### 3. Transcript/event layer

EMA should not collapse everything into flat chat messages.

Instead store both:

#### Normalized messages
- `role` (`user`, `assistant`, `system`, `tool`)
- `content`
- `timestamp`

#### Normalized events
- `eventKind`
- `providerEventKind`
- `rawRef` or raw payload
- `toolName`
- `toolInput`
- `toolOutput`
- `cost`
- `tokenCount`
- `reasoningSummary?`

Purpose:
- preserve analytics-grade event detail
- still support chat transcript UX

### 4. Runtime control layer

EMA execution contract should be:
- `discoverSessions(provider, filters)`
- `importSession(providerSessionId)`
- `startSession(provider, cwd, options)`
- `resumeSession(emaSessionId)`
- `sendMessage(emaSessionId, content)`
- `abortSession(emaSessionId)`
- `stopSession(emaSessionId)`
- `streamSessionEvents(emaSessionId)`

This should be implemented per provider adapter.

---

## Provider Adapter Requirements

### Claude adapter requirements

Adapter must:
- discover sessions from `~/.claude/projects`
- map project slug ↔ real path
- import JSONL transcript history
- bind provider-native `sessionId`
- resume via Claude native resume semantics
- optionally attach live stream from `claude --print --output-format stream-json`
- continue exposing tool-use events

### Codex adapter requirements

Adapter must:
- discover sessions from `~/.codex/sessions`
- parse `session_meta` for provider session id and cwd
- normalize `response_item`, `event_msg`, and `turn_context`
- extract tool/function call lifecycle from:
  - `function_call`
  - `function_call_output`
- expose token/rate-limit/cost-like telemetry where available
- implement true resume semantics using Codex-native session ids and CLI/session support
- stop pretending stdin-on-old-process is session continuity

---

## Discord / Surface Model

Discord should not be the source of truth.

It should be a bound surface over EMA sessions.

### Recommended model

- **EMA** owns canonical routing + binding
- **ClaudeForge** becomes a Discord/session UI and runner surface
- **OpenClaw** remains another operator/chat bridge
- both bind to the same EMA session/task records

### Session sync implications

Current `session-sync.ts` is Claude-specific because it scans `~/.claude/projects`.

EMA needs either:
- a generalized sync layer that reads EMA’s normalized imported sessions
- or provider-specific sync workers for Claude and Codex feeding into EMA first

Preferred direction:
- import provider sessions into EMA
- render Discord channels from EMA session state
- not directly from provider filesystem layout

---

## Recommended Migration Order

### Phase 1 — define canonical model
1. Add EMA session model that supports imported provider-native sessions
2. Add binding model for Discord/OpenClaw/ClaudeForge/EMA task ids
3. Decide whether ClaudeForge DB is cache, mirror, or transitional only

### Phase 2 — finish Claude properly
1. Treat `~/.claude/projects` as importable session truth
2. Import existing host Claude sessions into EMA
3. Bind imported sessions to Discord/ClaudeForge channels where useful
4. Preserve live streaming from Claude provider

### Phase 3 — make Codex real
1. Build Codex host session importer
2. Normalize Codex JSONL events into EMA event model
3. Add true resume + send-message semantics
4. Add Codex session sync/rendering to Discord through EMA state

### Phase 4 — unify surfaces
1. Make ClaudeForge consume EMA-normalized session state
2. Make OpenClaw operator flows query EMA session state
3. Let EMA route work to `claude` or `codex` using the same session contract

---

## Implementation Backlog

### A. EMA domain model
- add `provider_session_bindings` table or equivalent
- add `session_events` normalized store
- add `session_messages` normalized store if separate
- add `surface_bindings` for Discord/OpenClaw/ClaudeForge

### B. Claude importer
- scan `~/.claude/projects`
- decode project path
- import JSONL sessions
- normalize user/assistant/progress/tool events
- map provider session ids

### C. Codex importer
- scan `~/.codex/sessions`
- parse top-level event types and nested payload types
- map function_call/function_call_output pairs
- expose token and rate-limit telemetry
- map cwd and provider session ids

### D. Unified runner contract
- stop exposing provider parity that does not exist
- split adapters into:
  - `import/discover`
  - `live control`
  - `event normalization`

### E. Discord rendering
- render from EMA sessions, not raw provider files
- support channel/thread binding to imported sessions
- support channel creation for both Claude and Codex sessions

---

## Key Architectural Decision

The most important shift is:

> EMA should model Claude and Codex as host-native session systems, not just CLI commands.

That single decision cleans up the current confusion around:
- Discord integration
- ClaudeForge session DB drift
- Codex not being truly first-class
- OpenClaw vs ClaudeForge role overlap

---

## Bottom Line

- **Claude is already close** to a first-class EMA host channel
- **Codex has the raw substrate**, but not the adapter layer yet
- the right next step is to build **EMA-native host session import + normalization**, then hang Discord/OpenClaw/ClaudeForge off that
- do **not** keep treating tmux child processes as the main truth source
