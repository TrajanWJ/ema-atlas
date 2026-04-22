# TS Runtime Gap Map vs Archived EMA Daemon — 2026-04-13

This document is a grounded recovery map for the active TypeScript/Electron EMA runtime.

It does **not** treat the archived Elixir/Phoenix/Tauri system as current runtime truth.
It uses the archive only as a reference set for capabilities that still matter to the Genesis target and to actual operator workflows.

## Method

Read against current truth first:

- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `docs/backend/README.md`
- `docs/backend/SOURCE-OF-TRUTH.md`
- `docs/agent-handoffs/META-EMA-OPERATOR.md`
- `ema-genesis/EMA-GENESIS-PROMPT.md`
- `ema-genesis/_meta/CANON-STATUS.md`

Then compare:

- active TS runtime under `services/`, `workers/`, `apps/electron/`
- archived reference tree under `IGNORE_OLD_TAURI_BUILD/`

The question is **not** “what existed in the archive?”
The question is: **which archive capabilities still represent missing runtime surface area that matters now?**

---

## Executive Summary

The current TypeScript runtime is no longer scaffolding. It already has real operational backends for:

- intents
- blueprint/GAC indexing
- durable proposals
- executions
- chronicle/review/promotion
- goals/calendar
- voice pairing surface
- runtime-fabric for tmux-backed coding sessions

But compared with the archived daemon, the TS runtime is still missing several **runtime-grade** capabilities that matter for EMA to behave like a true operator system rather than a set of adjacent apps and tables.

### Highest-value missing runtime surfaces

1. **Richer session/babysitter observability over agent sessions**
   - Current TS worker only emits coarse “file changed + line count” events for Claude session JSONL files.
   - Archive had a far richer session observer / responder / anomaly / topology layer.
   - This is the most obvious operator-grade regression.

2. **Real MCP / tool-serving control plane for EMA context + actions**
   - Archive exposed EMA as an MCP server with resources/tools over stdio.
   - TS runtime has backend services and runtime-fabric, but no equivalent first-class MCP server.
   - This matters if EMA is meant to be the substrate external coding agents can plug into.

3. **Remote / distributed dispatch and runtime routing**
   - Archive had explicit remote dispatch / node coordination concepts.
   - TS runtime currently owns local tmux-backed sessions only.
   - Genesis still points toward a broader agent runtime than a single local-host terminal wrapper.

4. **Intent/session harvesting and autonomous surfacing loops**
   - Archive had intention farming, backlog/bootstrap watchers, calendar-driver surfacing, session parsing, and proposal-generation adjacency.
   - TS runtime now has Chronicle + Review + Promotion, which is a better durable shape in some ways, but the live harvesting loop from active agent work is still thin.

5. **Actor/workspace runtime coherence**
   - Archive had a much more explicit actor/workspace/tag/phase system.
   - TS runtime currently has a heartbeat transition seam and shared schemas, but not a complete actor runtime service with ownership, routing, or workspace-level cadence.

### Most important practical conclusion

The **top near-term recovery target** should be:

> **upgrade the TS session watcher / runtime-fabric side into a real babysitter-grade session observability subsystem**

This is the cleanest next move because:

- it directly improves operator leverage now
- it reuses current TS surfaces (`workers/session-watcher`, `services/core/runtime-fabric`, realtime, renderer babysitter/terminal apps)
- it closes the most visible gap between “agent sessions exist” and “EMA can actually supervise them”
- it does not require reviving Phoenix, Port processes, or old RPC assumptions

---

## Current TS Runtime: What Already Exists

Grounded current backends/surfaces already present in the TS runtime:

- `services/core/runtime-fabric`
  - tool scan
  - tmux-backed managed sessions
  - external tmux discovery
  - pane capture
  - runtime-state classification
  - input relay
  - durable session metadata + events
- `workers/src/agent-runtime-heartbeat.ts`
  - runtime heartbeat seam
- `workers/src/session-watcher.ts`
  - Claude session-file polling
- `services/core/chronicle`
  - durable imported session/history landing zone
- `services/core/review`
  - extracted candidate review/promotion layer
- `services/core/proposal`
  - durable proposal stage
- `services/core/executions`
  - active execution ledger
- `services/core/goals`, `calendar`, `spaces`, `voice`, `pipes`
  - real operational subsystems already in TS

So the TS question is not “build EMA from nothing.”
It is “recover the missing runtime-grade behaviors around these active domains.”

---

## Gap Map by Archived Capability Family

## 1) Babysitter / Session Supervision

### Archived evidence

Archive contained a meaningful babysitter subsystem:

- `IGNORE_OLD_TAURI_BUILD/daemon/lib/ema/babysitter/session_observer.ex`
- `.../session_responder.ex`
- `.../anomaly_scorer.ex`
- `.../channel_topology.ex`
- `.../visibility_hub.ex`
- `.../stream_channels.ex`
- `.../org_controller.ex`

The archived `SessionObserver` did materially more than file-change watching. It built snapshots including:

- active vs stalled vs just-completed sessions
- last assistant text
- last tool used
- recentness / staleness
- project path derivation
- session status classification
- pubsub broadcast to consumers

### Current TS reality

`workers/src/session-watcher.ts` currently:

- recursively scans `~/.claude/projects/**/*.jsonl`
- detects mtime changes
- reads file
- emits only:
  - `sessionFile`
  - `lineCount`
  - `timestamp`

That is useful as a smoke-test seam, but it is **not** babysitter-grade.

### Why this gap matters

Without richer live session supervision, EMA cannot reliably answer operator questions like:

- which agents are actually active right now?
- which are stalled or waiting for input?
- what was the last meaningful assistant/tool action?
- which sessions just completed and need review/promotion/import?
- which sessions are burning time with no progress?

### Priority

**P0 / highest priority**

### TS-native recovery direction

Extend the TS worker + runtime-fabric rather than recreating Phoenix-era babysitter internals.

Suggested target shape:

- new worker-owned `session snapshots` model
- parse recent JSONL tail for:
  - session id
  - project path
  - source tool
  - last message role/type
  - last assistant text excerpt
  - last tool invocation
  - status: active / stalled / completed / unknown
  - mtime / freshness
- publish snapshots through:
  - SQLite mirror and/or realtime event topic
  - `/api/runtime-fabric/session-observer` or `/api/babysitter/sessions`
- optionally auto-link completed sessions into Chronicle import candidates

---

## 2) MCP Server / External Agent Integration Surface

### Archived evidence

Archive had a real MCP server implementation:

- `IGNORE_OLD_TAURI_BUILD/daemon/lib/ema/mcp/server.ex`
- `.../resources.ex`
- `.../tools.ex`
- `.../session_tools.ex`
- `.../workspace_tools.ex`
- `.../domain_tools.ex`

It explicitly exposed:

- MCP initialize handshake
- resources/list + resources/read
- tools/list + tools/call
- stdio server process behavior
- recursion/call guards

### Current TS reality

There is no equivalent first-class TS MCP server in the active runtime.
The current interface layer is mainly:

- local HTTP routes
- Phoenix-wire-compatible websocket server
- Electron renderer apps
- CLI as a canon/query surface

### Why this gap matters

If EMA is supposed to be a control-plane / operator substrate, external coding agents should be able to consume EMA context and invoke EMA actions through a standard protocol boundary.

Without this, EMA remains much more siloed than the Genesis/operator model implies.

### Priority

**P1**

### TS-native recovery direction

Build a TS MCP server backed by active services, not by archive semantics.

Good first slice:

- resources:
  - backend manifest
  - current intents
  - current proposals
  - current runtime sessions
  - current goals/calendar summary
- tools:
  - create proposal
  - approve/reject proposal
  - start execution
  - list runtime sessions
  - dispatch prompt to runtime-fabric
  - import Chronicle session

This should map to existing service contracts rather than inventing new duplicate state.

---

## 3) Remote / Distributed Dispatch

### Archived evidence

Archive had explicit remote-dispatch concepts and distributed runtime assumptions:

- `IGNORE_OLD_TAURI_BUILD/daemon/lib/ema/claude/remote_dispatch.ex`
- `.../claude/node_coordinator.ex`
- canon references to P2P / multi-node / broader agent runtime

Archived remote dispatch handled:

- task registration
- callback routing
- timeout handling
- remote node event relay
- cancel/cleanup

### Current TS reality

Current `runtime-fabric` is local-host, tmux-based, and pragmatic.
That is good, but narrower.
There is no equivalent TS service for:

- remote runtime nodes
- remote session ownership
- remote dispatch lifecycle
- remote event relay with durable mirror

### Why this gap matters

Genesis still points toward a broader runtime than one machine / one tmux substrate.
Even if full distributed EMA is later, the current TS runtime lacks a clean seam to grow there.

### Priority

**P1-P2**

### TS-native recovery direction

Do **not** rebuild Erlang node RPC.
Instead define a modern TS contract for:

- runtime targets (`local`, `ssh`, `paired-node`, future `relay`)
- dispatch requests
- stream/event model
- completion/failure/cancel semantics
- provenance back into Chronicle / executions

A spec-first pass is appropriate before implementation.

---

## 4) Harvesting Live Agent Work into Durable Runtime Knowledge

### Archived evidence

Archive had multiple active-harvesting subsystems:

- `intention_farmer/*`
- `claude_sessions/*`
- `harvesters/*`
- `intelligence/calendar_driver.ex`
- `brain_dump/proposal_surfacer.ex`
- `session_memory*`, `vault_learner`, `wiki_sync`, etc.

These systems attempted to:

- parse active coding-agent sessions
- extract intents
- surface work candidates
- identify follow-ups
- turn session material into durable system inputs

### Current TS reality

The TS runtime now has a **better durable review path** than the archive in some places:

- Chronicle import
- Chronicle extraction
- Review decisions
- Promotion receipts

That is strong.
But the ingestion from **live local agent sessions** into that durable path is not yet thorough.

### Why this gap matters

Right now EMA has the durable back half of the pipeline, but the front half from active session activity is still underbuilt.
That means important work products remain trapped in agent session logs unless manually imported or noticed.

### Priority

**P1**

### TS-native recovery direction

Connect runtime-fabric / session-observer to Chronicle + Review:

- on session completion, generate import candidates
- allow operator review of extracted intents/goals/calendar candidates
- preserve provenance to runtime session id / session file path / pane session

This is much better than reviving the archive’s more implicit autonomous loops wholesale.

---

## 5) Actor Runtime / Workspace Control

### Archived evidence

Archive had a much more explicit actor/workspace layer:

- `actors/*`
- `spaces/*`
- `tags.ex`, `entity_data.ex`, `phase_transitions.ex`
- canon `ACTOR-WORKSPACE-SYSTEM`

### Current TS reality

TS has partial pieces:

- actor runtime state heartbeat routes in `services/core/actors/routes.ts`
- shared actor/runtime state schemas
- spaces service exists
- runtime-fabric can classify runtime state

But there is not yet a complete actor runtime service that joins:

- actor identity
- workspace ownership
- session ownership
- execution ownership
- phase cadence / role / tags

### Why this gap matters

EMA currently has many parallel entities but weaker runtime identity coherence than the archive’s intent.
That makes it harder to reason about “who is doing what, in which space, with which current runtime.”

### Priority

**P2**

### TS-native recovery direction

Unify around active TS contracts rather than archive data models.
A practical first step is to add foreign-key-level linking between:

- runtime session
- execution
- proposal
- space
- actor/runtime identity

before building richer actor orchestration.

---

## 6) Streamed CLI Bridge Semantics

### Archived evidence

Archive had richer bridge behavior for CLI agents:

- `claude/bridge.ex`
- `bridge_dispatch.ex`
- `session_manager.ex`
- provider routing / cost / quality / callbacks

This included:

- stream-json subprocess handling
- multi-turn send_message semantics
- async task ids
- PubSub result delivery
- governance / budget / quality gates

### Current TS reality

TS `runtime-fabric` deliberately chose a simpler tmux-first substrate.
That is the right short-term operational choice.
But it does mean current TS runtime lacks:

- structured streaming event model per tool invocation
- callback-oriented task lifecycle
- cost/quality-aware routing semantics
- one coherent abstraction above “send bytes to terminal”

### Why this gap matters

The current substrate is strong enough for terminal control, but weaker for higher-order orchestration and policy.

### Priority

**P2**

### TS-native recovery direction

Preserve tmux as substrate, but add a normalized event layer above it.
For example:

- session output chunk
- tool invocation detected
- approval needed
- blocked/context full
- completed/result seen

That would enable later governance/routing without abandoning the current runtime-fabric architecture.

---

## 7) Pipes / Automation Breadth

### Archived evidence

Archive had a broader pipes/event-bus framing:

- `pipes/*`
- canon `PIPES-SYSTEM`
- more trigger/action/event-bus semantics

### Current TS reality

TS already has a real `services/core/pipes` backend with CRUD and run ledgers.
This is **not missing** in the broad sense.
But it appears narrower than the archive/canon ambition.

### Assessment

This is **not a top recovery gap**.
It is an expansion path, not a missing foundation.

### Priority

**P3**

---

## 8) Voice Runtime Depth

### Archived evidence

Archive had `voice/*` with parser/core/TTS supervision.

### Current TS reality

TS already has a real voice pairing surface and remote phone mic path in `services/core/voice/voice.router.ts`.

### Assessment

Voice is not the main missing daemon/runtime problem right now.
There may be deeper future gaps, but it is not the top parity concern from an operator/runtime perspective.

### Priority

**P3**

---

## 9) Knowledge / Wiki / Memory Automation

### Archived evidence

Archive had extensive knowledge / second-brain / intelligence modules:

- `knowledge/*`
- `second_brain/*`
- `intelligence/*`
- `memory/*`
- `vault_index/*`

### Current TS reality

TS has Chronicle, Review, Goals, Calendar, Memory, feeds, and vault watcher pieces, but not yet the same breadth of autonomous knowledge processing.

### Assessment

This is important strategically, but it is **not** the sharpest runtime gap for the daemon itself.
The more urgent issue is getting live runtime/session supervision and session-to-chronicle flow correct first.

### Priority

**P3**

---

## Prioritized Recovery Backlog

## P0 — build next

### 1. Session Observer / Babysitter Recovery in TS

Deliverable:

- replace coarse `SessionEvent` with structured `SessionSnapshot`
- expose active/stalled/completed sessions
- parse last assistant/tool activity from Claude/Codex session tails where possible
- route into realtime + API
- optionally surface completion candidates to Chronicle import/review

Why first:

- highest operator leverage
- smallest architectural regret
- directly grounded in current runtime-fabric direction

## P1 — after that

### 2. TS MCP Server

Deliverable:

- stdio MCP server backed by active TS services
- resource + tool inventory for intents/proposals/runtime sessions/chronicle

### 3. Runtime Session → Chronicle / Review bridge

Deliverable:

- import bridge from completed session artifacts/logs into Chronicle
- extraction/review path for session-derived follow-ups

### 4. Runtime target abstraction for remote dispatch

Deliverable:

- spec + minimal contract for non-local runtime targets

## P2 — medium horizon

### 5. Actor/workspace/runtime linking
### 6. Normalized structured stream events above tmux
### 7. Execution/runtime-fabric tighter coupling

## P3 — later expansion

### 8. Pipes breadth parity
### 9. Deeper knowledge automation / wiki sync / autonomous intelligence loops
### 10. Richer voice orchestration

---

## Recommended Next Implementation Move

If only one thing gets done next, it should be:

## Build `session-observer` as a real TS subsystem

### Proposed concrete shape

- new shared schema: `SessionSnapshot`
- new worker parser module:
  - parse recent JSONL tails
  - infer last activity + stall/completion state
- new backend service or runtime-fabric extension:
  - persist latest snapshots if useful
  - list snapshots + derived counters
- new route:
  - `GET /api/runtime-fabric/session-observer`
  - or `GET /api/babysitter/sessions`
- optional websocket topic:
  - `babysitter:sessions`
- renderer consumers:
  - Babysitter app
  - Terminal app right rail
  - maybe operator dashboard

### Minimum useful fields

- `session_id`
- `source_tool`
- `project_path`
- `session_file`
- `status` (`active` | `stalled` | `completed` | `unknown`)
- `last_type`
- `last_text_excerpt`
- `last_tool_name`
- `mtime`
- `age_seconds`
- `entry_count`
- `observed_at`

### Why this is a high-confidence closure

Because it:

- clearly exists as a missing archive capability
- maps directly onto current TS worker/runtime surfaces
- does not require reintroducing old infrastructure choices
- strengthens Chronicle/Review integration later
- improves both operator UX and machine-readable runtime truth

---

## Anti-Goals / What Not To Do

- Do **not** revive Elixir/Phoenix runtime pieces as active dependencies.
- Do **not** reintroduce archive RPC/Port abstractions just for parity theater.
- Do **not** build new parallel ledgers when Chronicle/Review/Proposal/Execution already exist.
- Do **not** confuse renderer route count with actual runtime capability recovery.

---

## Bottom Line

The TS runtime is already the real EMA runtime.
The main gap is no longer “where is the backend?”
The main gap is:

> **the runtime is still under-observing and under-harvesting live agent work compared with what the old daemon was trying to do.**

The cleanest next recovery move is therefore:

> **session observability first, then MCP/tool-serving and session-to-chronicle flow.**
